import { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
    if (getApps().length === 0) {
      // Allow fallback for local dev if admin isn't configured, but ideally throw error
      console.warn("Firebase Admin not configured, skipping auth check");
    }

    const { bookingId } = JSON.parse(event.body || '{}');
    if (!bookingId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'bookingId required' }) };
    }

    let advanceAmount = 5000;
    let customerPhone = "9999999999";
    let customerId = "guest";
    let customerEmail = "guest@example.com";
    let customerName = "Guest";

    // Fetch booking details from Firestore if Admin is initialized
    if (getApps().length > 0) {
      const db = getFirestore();
      const bookingSnap = await db.collection('bookings').doc(bookingId).get();
      if (!bookingSnap.exists) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Booking not found' }) };
      }
      
      const bookingData = bookingSnap.data()!;
      if (bookingData.bookingStatus !== 'awaiting_payment') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Booking is not awaiting payment' }) };
      }
      
      advanceAmount = bookingData.advanceAmount || 5000;
      customerPhone = bookingData.phone || "9999999999";
      customerId = bookingData.userId || "guest";
      customerName = bookingData.name || "Guest";
      
      // We don't collect email on the form right now, so generate a dummy one for Cashfree
      customerEmail = `${customerId}@pjlawn.local`; 
    }

    // Initialize Cashfree SDK
    const env = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const cashfree = new Cashfree(env, process.env.CASHFREE_APP_ID || '', process.env.CASHFREE_SECRET_KEY || '');
    
    // Pin to published v5 API version
    cashfree.XApiVersion = "2025-01-01";

    const orderId = `order_${bookingId}_${Date.now()}`;
    const returnUrl = `${process.env.URL || 'http://localhost:5173'}/dashboard`;

    const request = {
      order_amount: advanceAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: customerId.substring(0, 50), // CF limit
        customer_phone: customerPhone.replace(/\D/g, '').substring(0, 10), // Ensure 10 digits
        customer_email: customerEmail,
        customer_name: customerName
      },
      order_meta: {
        return_url: returnUrl
      }
    };

    const response = await cashfree.PGCreateOrder(request);
    
    // Save the active order_id to the booking for reference
    if (getApps().length > 0) {
      await getFirestore().collection('bookings').doc(bookingId).update({
        cashfreeOrderId: orderId
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        payment_session_id: response.data.payment_session_id,
        order_id: orderId 
      })
    };
  } catch (error: any) {
    console.error("Error creating Cashfree order:", error.response?.data || error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
