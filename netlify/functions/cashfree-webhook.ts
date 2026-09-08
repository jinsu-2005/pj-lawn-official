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
                      <div style="background-color: #0d0f0e; color: #f4ede4; font-family: sans-serif; padding: 32px 16px;">
                        <div style="max-width: 560px; margin: 0 auto; background: #141816; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 28px;">
                          <h1 style="color: #d4af37; margin: 0 0 4px 0; font-size: 24px;">PJ LAWN</h1>
                          <p style="color: #8fa095; font-size: 13px; margin: 0 0 20px 0; text-transform: uppercase;">Payment Confirmation</p>
                          <div style="background: rgba(34, 197, 94, 0.1); border-left: 4px solid #4ade80; padding: 12px; margin-bottom: 20px;">
                            <p style="margin: 0; color: #4ade80; font-weight: bold;">Payment Verified (₹${paidAmount.toLocaleString('en-IN')})</p>
                            <p style="margin: 4px 0 0 0; font-size: 13px; color: #d1d5db;">Your reservation for ${bData.eventDate} is officially confirmed.</p>
                          </div>
                          <p style="font-size: 14px; margin: 6px 0;"><strong>Receipt ID:</strong> ${orderId}</p>
                          <p style="font-size: 14px; margin: 6px 0;"><strong>Event:</strong> ${bData.eventType || 'Event'} (${bData.guestCount || 100} guests)</p>
                          <p style="font-size: 14px; margin: 6px 0; color: #d4af37;"><strong>Total Paid:</strong> ₹${newTotalPaid.toLocaleString('en-IN')}</p>
                          <p style="font-size: 14px; margin: 6px 0;"><strong>Balance Remaining:</strong> ₹${remainingBalance.toLocaleString('en-IN')}</p>
                          <div style="text-align: center; margin-top: 24px;">
                            <a href="https://pjlawn.netlify.app/dashboard" style="background: #d4af37; color: #0d0f0e; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">Open Customer Dashboard</a>
                          </div>
                        </div>
                      </div>
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
