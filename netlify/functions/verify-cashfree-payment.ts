import type { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

let initialized = false;

function initFirebase() {
  if (!initialized && getApps().length === 0) {
    try {
      let serviceAccount: any = null;
      const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;
      
      if (FIREBASE_PRIVATE_KEY) {
        serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: Buffer.from(FIREBASE_PRIVATE_KEY, 'base64').toString('utf8'),
        };
      } else {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (raw) {
          try {
            serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
          } catch {
            serviceAccount = JSON.parse(raw);
          }
        }
      }
      
      if (serviceAccount) {
        initializeApp({
          credential: cert(serviceAccount)
        });
        initialized = true;
      }
    } catch (e) {
      console.error("[Firebase Admin] Initialization failed:", e);
    }
  }
}

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
    initFirebase();
    
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
      // Payment is verified as completed at the gateway
      if (getApps().length === 0) {
        console.error("[Cashfree Backend] Firebase Admin not configured. Cannot update Firestore.");
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ error: 'Database service unavailable to fulfill order.' }) 
        };
      }

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

      const db = getFirestore();
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
                <div style="background-color: #0d0f0e; color: #f4ede4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 20px;">
                  <div style="max-width: 580px; margin: 0 auto; background: #141816; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="text-align: center; margin-bottom: 24px;">
                      <h1 style="color: #d4af37; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px;">PJ LAWN</h1>
                      <p style="color: #8fa095; font-size: 13px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Official Payment Receipt</p>
                    </div>

                    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                      <h2 style="color: #4ade80; margin: 0 0 6px 0; font-size: 18px;">Payment Verified Successfully</h2>
                      <p style="color: #d1d5db; margin: 0; font-size: 14px;">Your event date is secured on the calendar.</p>
                    </div>

                    <div style="background: #1a1f1c; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                      <p style="margin: 6px 0; font-size: 14px;"><strong>Customer:</strong> ${bookingData.userName || 'Valued Guest'}</p>
                      <p style="margin: 6px 0; font-size: 14px;"><strong>Event Date:</strong> ${bookingData.eventDate}</p>
                      <p style="margin: 6px 0; font-size: 14px;"><strong>Event Type:</strong> ${bookingData.eventType || 'Celebration'}</p>
                      <p style="margin: 6px 0; font-size: 14px;"><strong>Payment Mode:</strong> ${paymentMethod.toUpperCase()}</p>
                      <p style="margin: 6px 0; font-size: 14px;"><strong>Order ID:</strong> <code style="color: #d4af37;">${orderId}</code></p>
                      <p style="margin: 6px 0; font-size: 14px;"><strong>Payment Ref:</strong> <code style="color: #d4af37;">${cfPaymentId}</code></p>
                      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0;" />
                      <p style="margin: 6px 0; font-size: 16px; color: #4ade80;"><strong>Amount Paid Today:</strong> ₹${paidThisOrder.toLocaleString('en-IN')}</p>
                      <p style="margin: 6px 0; font-size: 14px; color: #d4af37;"><strong>Total Booking Value:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
                      <p style="margin: 6px 0; font-size: 14px; color: ${remainingBalance > 0 ? '#facc15' : '#4ade80'};">
                        <strong>Remaining Balance:</strong> ${remainingBalance > 0 ? `₹${remainingBalance.toLocaleString('en-IN')}` : 'Paid in Full (₹0)'}
                      </p>
                    </div>

                    <div style="text-align: center;">
                      <a href="https://pjlawn.netlify.app/dashboard" style="background: #d4af37; color: #0d0f0e; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-size: 14px;">View Booking in Dashboard</a>
                    </div>
                  </div>
                </div>
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
