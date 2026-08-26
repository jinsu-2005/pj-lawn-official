import { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

let initialized = false;

function initFirebase() {
  if (!initialized && getApps().length === 0) {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountStr) {
      try {
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountStr, 'base64').toString('utf8'));
        initializeApp({
          credential: cert(serviceAccount)
        });
        initialized = true;
      } catch (e) {
        console.error("Failed to parse service account", e);
      }
    }
  }
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    initFirebase();
    
    const { orderId, bookingId } = JSON.parse(event.body || '{}');
    
    if (!orderId || !bookingId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'orderId and bookingId required' }) };
    }

    // Initialize Cashfree SDK
    const env = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const cashfree = new Cashfree(env, process.env.CASHFREE_APP_ID || '', process.env.CASHFREE_SECRET_KEY || '');
    
    // Pin to published v5 API version
    cashfree.XApiVersion = "2025-01-01";

    const response = await cashfree.PGFetchOrder(orderId);
    const status = response.data.order_status;
    
    if (status === 'PAID') {
      // Payment successful, fulfill order
      if (getApps().length > 0) {
        const db = getFirestore();
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingSnap = await bookingRef.get();
        if (bookingSnap.exists) {
          const bookingData = bookingSnap.data()!;
          const orderIdParts = orderId.split('_');
          const paymentType = orderIdParts[orderIdParts.length - 2];
          
          let paymentStatus = 'advance_paid';
          let amountPaid = bookingData.advanceAmount || 5000;
          
          if (paymentType === 'full' || paymentType === 'remaining') {
            paymentStatus = 'fully_paid';
            amountPaid = bookingData.totalAmount || bookingData.estimatedAmount || 5000;
          } else {
            // It was an advance payment
            paymentStatus = 'advance_paid';
            amountPaid = bookingData.advanceAmount || 5000;
          }
          
          await bookingRef.update({
            paymentStatus: paymentStatus,
            bookingStatus: 'confirmed',
            amountPaid: amountPaid,
            updatedAt: FieldValue.serverTimestamp()
          });
          
          // Let's also ensure availability is updated to confirmed just in case
          const dateStr = bookingData.eventDate;
          if (dateStr) {
            await db.collection('availability').doc(dateStr).update({
              status: 'confirmed'
            });
          }

          // Trigger Resend email receipt to customer
          const resendApiKey = process.env.RESEND_API_KEY;
          if (resendApiKey && bookingData.userEmail) {
            try {
              const { Resend } = await import('resend');
              const resend = new Resend(resendApiKey);
              const fromEmail = process.env.RESEND_FROM_EMAIL || 'PJ Lawn <onboarding@resend.dev>';
              const totalAmount = bookingData.totalAmount || bookingData.estimatedAmount || 150000;
              const remaining = Math.max(0, totalAmount - amountPaid);
              
              await resend.emails.send({
                from: fromEmail,
                to: [bookingData.userEmail],
                subject: `Payment Confirmed & Receipt - PJ Lawn (₹${amountPaid.toLocaleString()})`,
                html: `
                  <div style="background-color: #0a0a0a; color: #ede5d0; font-family: sans-serif; padding: 30px 20px;">
                    <div style="max-width: 560px; margin: 0 auto; background: #111111; border: 1px solid rgba(232, 201, 109, 0.3); border-radius: 10px; padding: 30px;">
                      <h1 style="color: #e8c96d; margin: 0 0 10px 0; font-family: serif; letter-spacing: 2px;">PJ LAWN</h1>
                      <h2 style="color: #ffffff; font-size: 20px;">Payment Confirmed &bull; Date Secured</h2>
                      <p>Hello ${bookingData.userName || 'Customer'}, your payment has been successfully verified for your event on <strong>${bookingData.eventDate}</strong>.</p>
                      
                      <div style="background: #181818; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 6px 0;"><strong>Receipt ID:</strong> ${orderId}</p>
                        <p style="margin: 6px 0;"><strong>Event:</strong> ${bookingData.eventType} (${bookingData.guestCount} guests)</p>
                        <p style="margin: 6px 0; color: #8ce04a;"><strong>Amount Paid:</strong> ₹${amountPaid.toLocaleString()}</p>
                        <p style="margin: 6px 0; color: #e8c96d;"><strong>Remaining Balance:</strong> ${remaining > 0 ? `₹${remaining.toLocaleString()}` : 'Paid in Full'}</p>
                      </div>

                      <div style="text-align: center; margin-top: 25px;">
                        <a href="https://pjlawn.netlify.app/dashboard" style="background: #e8c96d; color: #0a0a0a; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">Open Dashboard & Download Receipt</a>
                      </div>
                    </div>
                  </div>
                `
              });
            } catch (emailErr) {
              console.error("Failed to send Resend receipt email:", emailErr);
            }
          }
        }
      }
      return { statusCode: 200, body: JSON.stringify({ status: 'PAID' }) };
    }
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ status: status }) // ACTIVE, EXPIRED, TERMINATED
    };
    
  } catch (error: any) {
    console.error("Error verifying Cashfree payment:", error.response?.data || error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
