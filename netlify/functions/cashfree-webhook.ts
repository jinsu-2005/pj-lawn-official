import type { Handler } from "@netlify/functions";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { getAdminDb, FieldValue } from "./adminDb.ts";
import crypto from "crypto";

function verifyHmacSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  try {
    const signedPayload = timestamp + rawBody;
    const computed = crypto.createHmac("sha256", secret).update(signedPayload).digest("base64");
    const sigBuf = Buffer.from(signature, "utf8");
    const compBuf = Buffer.from(computed, "utf8");
    if (sigBuf.length !== compBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, compBuf);
  } catch {
    return false;
  }
}

export const handler: Handler = async (event) => {
  // Support GET for endpoint health checks / dashboard URL validation
  if (event.httpMethod === "GET") {
    return { 
      statusCode: 200, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        status: "OK", 
        service: "PJ Lawn Cashfree Webhook", 
        timestamp: new Date().toISOString() 
      }) 
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const headers = event.headers || {};
    const getHeader = (name: string): string => {
      const lower = name.toLowerCase();
      for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === lower) return v || "";
      }
      return "";
    };

    const signature = getHeader("x-webhook-signature");
    const timestamp = getHeader("x-webhook-timestamp");
    const idempotencyKey = getHeader("x-idempotency-key");

    // Preserve exact raw body bytes (handle base64 encoding from Netlify if present)
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : (event.body || "");

    // Gracefully handle zero-payload or dashboard ping tests
    if (!rawBody || rawBody === "{}" || (!signature && !timestamp)) {
      return { 
        statusCode: 200, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OK", message: "Cashfree webhook reachable" }) 
      };
    }

    const envMode = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const appId = process.env.CASHFREE_APP_ID || "";
    const secretsToTry = [
      process.env.CASHFREE_WEBHOOK_SECRET,
      process.env.CASHFREE_SECRET_KEY,
    ].filter(Boolean) as string[];

    if (secretsToTry.length === 0) {
      console.error("[Cashfree Webhook] No webhook secret or secret key configured.");
      return { statusCode: 500, body: "Webhook secret unconfigured." };
    }

    // Cryptographic Signature Verification
    let signatureVerified = false;

    for (const secret of secretsToTry) {
      // 1. Try Cashfree SDK verification method
      try {
        const cf = new Cashfree(envMode, appId, secret);
        cf.PGVerifyWebhookSignature(signature, rawBody, timestamp);
        signatureVerified = true;
        break;
      } catch {}

      // 2. Fallback to native HMAC SHA256 constant-time check
      if (verifyHmacSignature(rawBody, timestamp, signature, secret)) {
        signatureVerified = true;
        break;
      }
    }

    if (!signatureVerified) {
      console.warn("[Cashfree Webhook] Signature verification failed or test probe received for timestamp:", timestamp);
      // Return HTTP 200 with status OK so Cashfree dashboard endpoint verification succeeds,
      // but do NOT execute database updates on unverified payloads
      return { 
        statusCode: 200, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OK", message: "Cashfree probe or unverified webhook acknowledged" }) 
      };
    }

    const cashfree = new Cashfree(envMode, appId, secretsToTry[0]);
    cashfree.XApiVersion = "2025-01-01";

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { statusCode: 200, body: "OK (Non-JSON payload ignored)" };
    }

    const eventType = payload.type;
    const eventData = payload.data;
    const orderId = eventData?.order?.order_id;

    console.log(`[Cashfree Webhook] Received ${eventType} for order: ${orderId} (idempotency: ${idempotencyKey || 'none'})`);

    if (!orderId || eventType === 'TEST_WEBHOOK' || orderId.includes('test_order')) {
      return { statusCode: 200, body: JSON.stringify({ status: "OK", message: "Test/ping event processed" }) };
    }

    // Extract Booking ID (format: order_{bookingId}_{paymentType}_{timestamp})
    const bookingId = orderId.split("_")[1];
    if (!bookingId) {
      console.warn("[Cashfree Webhook] Could not parse bookingId from orderId:", orderId);
      return { statusCode: 200, body: "OK (No bookingId matched)" };
    }

    switch (eventType) {
      case "PAYMENT_SUCCESS_WEBHOOK": {
        const paymentStatus = eventData?.payment?.payment_status;
        if (paymentStatus === "SUCCESS") {
          // Authoritative double-check with Cashfree REST API
          const orderCheck = await cashfree.PGFetchOrder(orderId);
          if (orderCheck.data.order_status !== 'PAID') {
            console.warn(`[Cashfree Webhook] Webhook reported SUCCESS but PGFetchOrder returned ${orderCheck.data.order_status}`);
            return { statusCode: 200, body: "Order not confirmed as PAID by gateway" };
          }

          const db = getAdminDb();
          const bookingRef = db.collection("bookings").doc(bookingId);
          const bookingSnap = await bookingRef.get();

          if (bookingSnap.exists) {
              const bData = bookingSnap.data()!;

              // Idempotency: Prevent multiple fulfillment runs for the same order
              const fulfilledOrders: string[] = bData.paidOrderIds || [];
              if (fulfilledOrders.includes(orderId)) {
                console.log(`[Cashfree Webhook] Order ${orderId} already fulfilled. Skipping duplicate execution.`);
                return { statusCode: 200, body: "Already processed" };
              }

              const orderParts = orderId.split("_");
              const paymentType = orderParts.length >= 3 ? orderParts[orderParts.length - 2] : 'advance';
              
              const totalAmount = Number(bData.totalAmount || bData.estimatedAmount || 15000);
              const advanceAmount = Number(bData.advanceAmount || 5000);
              const existingPaid = Number(bData.amountPaid || 0);
              const paidAmount = Number(eventData.payment?.payment_amount || advanceAmount);

              let newPaymentStatus: 'advance_paid' | 'fully_paid' = 'advance_paid';
              let newTotalPaid = existingPaid + paidAmount;

              if (paymentType === 'full' || paymentType === 'remaining' || newTotalPaid >= totalAmount) {
                newPaymentStatus = 'fully_paid';
                newTotalPaid = Math.max(newTotalPaid, totalAmount);
              } else {
                newPaymentStatus = 'advance_paid';
              }

              const cfPaymentId = eventData.payment?.cf_payment_id ? String(eventData.payment.cf_payment_id) : `cf_${Date.now()}`;
              const paymentGroup = eventData.payment?.payment_group || 'online';

              await bookingRef.update({
                paymentStatus: newPaymentStatus,
                bookingStatus: "confirmed",
                amountPaid: newTotalPaid,
                cashfreeOrderId: orderId,
                cashfreePaymentId: cfPaymentId,
                paymentMethod: paymentGroup,
                paidAt: FieldValue.serverTimestamp(),
                paidOrderIds: FieldValue.arrayUnion(orderId),
                updatedAt: FieldValue.serverTimestamp()
              });

              // Confirm availability lock
              if (bData.eventDate) {
                try {
                  await db.collection("availability").doc(bData.eventDate).set({
                    status: "confirmed",
                    bookingId: bookingId,
                    confirmedAt: FieldValue.serverTimestamp()
                  }, { merge: true });
                } catch (availErr) {
                  console.warn("[Cashfree Webhook] Failed to lock availability doc:", availErr);
                }
              }

              // Send Resend confirmation email if not already sent
              const resendKey = process.env.RESEND_API_KEY;
              const customerEmail = bData.userEmail || bData.email;
              if (resendKey && customerEmail) {
                try {
                  const { Resend } = await import('resend');
                  const resend = new Resend(resendKey);
                  const fromEmail = process.env.RESEND_FROM_EMAIL || 'PJ Lawn <onboarding@resend.dev>';
                  const remainingBalance = Math.max(0, totalAmount - newTotalPaid);

                  await resend.emails.send({
                    from: fromEmail,
                    to: [customerEmail],
                    subject: `Payment Confirmed - PJ Lawn Booking (₹${paidAmount.toLocaleString('en-IN')})`,
                    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Payment Receipt</title></head>
<body style="margin: 0; padding: 0; background-color: #060606; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f0e8dc;">
  <div style="width: 100%; background-color: #060606; padding: 30px 0;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid rgba(232, 201, 109, 0.35); border-radius: 12px; overflow: hidden; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85);">
      <tr>
        <td align="center" style="background: linear-gradient(180deg, #181818 0%, #111111 100%); padding: 32px 20px; border-bottom: 1px solid rgba(232, 201, 109, 0.25);">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: #e8c96d; letter-spacing: 4px; margin: 0 0 4px 0; text-transform: uppercase;">PJ LAWN</div>
          <p style="font-size: 11px; color: #d9cdb5; letter-spacing: 2px; text-transform: uppercase; margin: 0; font-weight: 600;">Nagercoil's Premier Open-Air Venue</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px 26px; font-size: 15px; line-height: 1.6; color: #ede5d0;">
          <div style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 4px; margin-bottom: 18px; background-color: rgba(78, 134, 38, 0.25); color: #8ce04a; border: 1px solid rgba(78, 134, 38, 0.5);">
            Payment Confirmed &bull; Date Secured
          </div>
          <h2 style="color: #fefdf9; margin-top: 0; margin-bottom: 12px; font-size: 22px; font-family: Georgia, serif;">Payment Received Successfully!</h2>
          <p style="margin: 0 0 14px 0; color: #ede5d0; font-size: 15px;">Hello <strong style="color: #ffffff;">${bData.userName || 'Valued Guest'}</strong>, we have received your payment for your upcoming event at PJ Lawn.</p>
          
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #171717; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; margin: 20px 0;">
            <tr>
              <td style="padding: 16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Receipt / Order ID</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-family: monospace; font-size: 13px;">${orderId}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Event Date</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #e8c96d; font-weight: bold; font-size: 14px;">${bData.eventDate}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Event Type</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${bData.eventType || 'Celebration'}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #8ce04a; font-weight: bold; font-size: 14px;">Amount Paid Today</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #8ce04a; font-weight: bold; font-size: 16px;">₹${paidAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; ${remainingBalance > 0 ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);' : ''} color: #d9cdb5; font-size: 14px;">Total Booking Value</td>
                    <td align="right" style="padding: 9px 0; ${remainingBalance > 0 ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.08);' : ''} color: #fefdf9; font-size: 14px;">₹${totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  ${remainingBalance > 0 ? `
                  <tr>
                    <td align="left" style="padding: 9px 0; color: #e8c96d; font-size: 14px;">Remaining Balance</td>
                    <td align="right" style="padding: 9px 0; color: #e8c96d; font-weight: bold; font-size: 15px;">₹${remainingBalance.toLocaleString('en-IN')}</td>
                  </tr>
                  ` : `
                  <tr>
                    <td align="left" style="padding: 9px 0; color: #8ce04a; font-size: 14px;">Balance Status</td>
                    <td align="right" style="padding: 9px 0; color: #8ce04a; font-weight: bold; font-size: 14px;">Paid in Full</td>
                  </tr>
                  `}
                </table>
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 26px; margin-bottom: 8px;">
            <a href="https://pjlawn.netlify.app/dashboard" style="display: inline-block; background-color: #e8c96d; color: #0a0a0a !important; font-weight: 900; text-decoration: none; padding: 14px 30px; border-radius: 8px; letter-spacing: 1.5px; text-transform: uppercase; font-size: 13px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">View Booking & PDF Receipt</a>
          </div>
        </td>
      </tr>
      <tr>
        <td align="center" style="background-color: #0a0a0a; padding: 22px 20px; font-size: 12px; color: #b3a692; border-top: 1px solid rgba(255, 255, 255, 0.08); line-height: 1.6;">
          <p style="margin: 0 0 6px 0; color: #d9cdb5; font-size: 12px;"><strong>PJ Lawn</strong> &bull; Paul Vathiyar Compound, Gandhi Nagar, Kurusady, Nagercoil, Tamil Nadu 629004</p>
          <p style="margin: 0; color: #b3a692;">Phone: <a href="tel:+919489724975" style="color: #e8c96d; text-decoration: none; font-weight: bold;">+91 94897 24975</a> &bull; <a href="https://pjlawn.netlify.app" style="color: #e8c96d; text-decoration: none;">pjlawn.netlify.app</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
                    `
                  });
                } catch (emailErr) {
                  console.error("[Cashfree Webhook] Error sending receipt email:", emailErr);
                }
              }
            }
          }
        break;
      }

      case "PAYMENT_FAILED_WEBHOOK": {
        // Log machine-readable failure details
        const errorDetails = eventData?.error_details || {};
        console.warn(`[Cashfree Webhook] Payment failed for ${orderId}:`, {
          code: errorDetails.error_code,
          reason: errorDetails.error_reason,
          source: errorDetails.error_source
        });

        try {
          const db = getAdminDb();
          await db.collection("bookings").doc(bookingId).update({
            lastPaymentFailure: {
              errorCode: errorDetails.error_code || 'PAYMENT_FAILED',
              errorReason: errorDetails.error_reason || 'bank_or_user_decline',
              errorSource: errorDetails.error_source || 'gateway',
              timestamp: FieldValue.serverTimestamp()
            }
          });
        } catch (logErr) {
          console.warn("[Cashfree Webhook] Could not record payment failure to booking:", logErr);
        }
        break;
      }

      case "PAYMENT_USER_DROPPED_WEBHOOK": {
        console.info(`[Cashfree Webhook] User dropped checkout session for order: ${orderId}`);
        break;
      }

      default:
        console.log("[Cashfree Webhook] Unhandled event type:", eventType);
    }

    return { statusCode: 200, body: "OK" };

  } catch (error: any) {
    console.error("[Cashfree Webhook] Exception processing event:", error);
    // Return HTTP 200 so Cashfree does not endlessly retry malformed payloads
    return { statusCode: 200, body: "Error logged" };
  }
};
