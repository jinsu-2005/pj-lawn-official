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
