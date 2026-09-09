import type { Handler } from '@netlify/functions';
import { getAdminDb, FieldValue } from './adminDb.ts';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method Not Allowed. POST required.' }) 
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, bookingId } = body;
    
    if (!orderId || typeof orderId !== 'string') {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'orderId is required for verification.' }) 
      };
    }

    // Extract bookingId from orderId if not explicitly provided (order_{bookingId}_{type}_{timestamp})
    const resolvedBookingId = bookingId || orderId.split('_')[1];
    if (!resolvedBookingId) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Cannot determine associated bookingId from orderId.' }) 
      };
    }

    // Initialize Cashfree PG SDK
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const envMode = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

    if (!appId || !secretKey) {
      console.error("[Cashfree Backend] Missing credentials during payment verification.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server payment configuration missing.' })
      };
    }

    const cashfree = new Cashfree(envMode, appId, secretKey);
    cashfree.XApiVersion = "2025-01-01";

    // Authoritative verification via Cashfree REST API
    const orderResponse = await cashfree.PGFetchOrder(orderId);
    const orderData = orderResponse.data;
    const orderStatus = orderData.order_status;

    console.log(`[Cashfree Backend] PGFetchOrder(${orderId}) -> status: ${orderStatus}`);

    if (orderStatus === 'PAID') {
      const db = getAdminDb();

      // Fetch specific transaction details (using cashfree-pg v6 signature: order_id only)
      let successfulPayment: any = null;
      try {
        const paymentsResponse = await cashfree.PGOrderFetchPayments(orderId);
        const payments = paymentsResponse.data;
        if (Array.isArray(payments)) {
          successfulPayment = payments.find((p: any) => p.payment_status === 'SUCCESS') || payments[0];
        }
      } catch (fetchErr) {
        console.warn("[Cashfree Backend] Failed to fetch payments array for order:", fetchErr);
      }

      const bookingRef = db.collection('bookings').doc(resolvedBookingId);
      const bookingSnap = await bookingRef.get();

      if (bookingSnap.exists) {
        const bookingData = bookingSnap.data()!;
        
        // Check idempotency: If this exact order was already processed and recorded, return success immediately
        const alreadyFulfilledOrders: string[] = bookingData.paidOrderIds || [];
        if (alreadyFulfilledOrders.includes(orderId)) {
          console.log(`[Cashfree Backend] Order ${orderId} was already fulfilled. Returning idempotent response.`);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              status: 'PAID',
              orderId,
              bookingId: resolvedBookingId,
              message: 'Payment verified and previously fulfilled.'
            })
          };
        }

        // Determine payment type from orderId convention (order_{bookingId}_{paymentType}_{timestamp})
        const orderParts = orderId.split('_');
        const paymentType = orderParts.length >= 3 ? orderParts[orderParts.length - 2] : 'advance';

        const totalAmount = Number(bookingData.totalAmount || bookingData.estimatedAmount || 15000);
        const advanceAmount = Number(bookingData.advanceAmount || 5000);
        const existingPaid = Number(bookingData.amountPaid || 0);
        const paidThisOrder = Number(orderData.order_amount || (successfulPayment ? successfulPayment.payment_amount : advanceAmount));

        let newPaymentStatus: 'advance_paid' | 'fully_paid' = 'advance_paid';
        let newAmountPaid = existingPaid + paidThisOrder;

        if (paymentType === 'full' || paymentType === 'remaining' || newAmountPaid >= totalAmount) {
          newPaymentStatus = 'fully_paid';
          newAmountPaid = Math.max(newAmountPaid, totalAmount);
        } else {
          newPaymentStatus = 'advance_paid';
        }

        const cfPaymentId = successfulPayment?.cf_payment_id ? String(successfulPayment.cf_payment_id) : `cf_${Date.now()}`;
        const paymentMethod = successfulPayment?.payment_group || successfulPayment?.payment_method || 'online';

        // Atomic update to booking document
        await bookingRef.update({
          paymentStatus: newPaymentStatus,
          bookingStatus: 'confirmed',
          amountPaid: newAmountPaid,
          cashfreeOrderId: orderId,
          cashfreePaymentId: cfPaymentId,
          paymentMethod: paymentMethod,
          paidAt: FieldValue.serverTimestamp(),
          paidOrderIds: FieldValue.arrayUnion(orderId),
          updatedAt: FieldValue.serverTimestamp()
        });

        // Ensure date availability lock is confirmed
        if (bookingData.eventDate) {
          try {
            await db.collection('availability').doc(bookingData.eventDate).set({
              status: 'confirmed',
              bookingId: resolvedBookingId,
              confirmedAt: FieldValue.serverTimestamp()
            }, { merge: true });
          } catch (availErr) {
            console.warn("[Cashfree Backend] Could not update availability document:", availErr);
          }
        }

        // Send confirmation email with receipt via Resend
        const resendKey = process.env.RESEND_API_KEY;
        const customerEmail = bookingData.userEmail || bookingData.email;
        if (resendKey && customerEmail) {
          try {
            const { Resend } = await import('resend');
            const resend = new Resend(resendKey);
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'PJ Lawn <onboarding@resend.dev>';
            const remainingBalance = Math.max(0, totalAmount - newAmountPaid);

            await resend.emails.send({
              from: fromEmail,
              to: [customerEmail],
              subject: `Payment Confirmed - PJ Lawn Booking (₹${paidThisOrder.toLocaleString('en-IN')})`,
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
          <p style="margin: 0 0 14px 0; color: #ede5d0; font-size: 15px;">Hello <strong style="color: #ffffff;">${bookingData.userName || 'Valued Guest'}</strong>, we have received your payment for your upcoming event at PJ Lawn.</p>
          
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
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #e8c96d; font-weight: bold; font-size: 14px;">${bookingData.eventDate}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Event Type</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${bookingData.eventType || 'Celebration'}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #d9cdb5; font-size: 14px;">Payment Method</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #fefdf9; font-weight: bold; font-size: 14px;">${paymentMethod.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td align="left" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #8ce04a; font-weight: bold; font-size: 14px;">Amount Paid Today</td>
                    <td align="right" style="padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #8ce04a; font-weight: bold; font-size: 16px;">₹${paidThisOrder.toLocaleString('en-IN')}</td>
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
            console.log(`[Cashfree Backend] Receipt email dispatched to ${customerEmail}`);
          } catch (emailErr) {
            console.error("[Cashfree Backend] Error sending receipt email:", emailErr);
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: 'PAID',
            orderId,
            bookingId: resolvedBookingId,
            amountPaid: newAmountPaid,
            paymentStatus: newPaymentStatus
          })
        };
      }
    }

    // Non-paid states (ACTIVE, EXPIRED, TERMINATED)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: orderStatus, // 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
        orderId,
        message: orderStatus === 'ACTIVE' ? 'Payment is in progress' : `Payment status: ${orderStatus}`
      })
    };

  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("[Cashfree Backend] Verification Error:", errorData || error.message || error);

    return {
      statusCode: error.response?.status || 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errorData?.message || error.message || 'Internal Verification Error',
        code: errorData?.code || 'VERIFICATION_FAILED'
      })
    };
  }
};
