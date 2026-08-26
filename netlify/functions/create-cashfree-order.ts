import { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
      console.error("Failed to init firebase admin", e);
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

    const { bookingId, paymentType = 'advance' } = JSON.parse(event.body || '{}');
    if (!bookingId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'bookingId required' }) };
    }

    let orderAmount = 5000;
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
      const isPayable = bookingData.bookingStatus === 'awaiting_payment' || 
                        (bookingData.bookingStatus === 'confirmed' && bookingData.paymentStatus === 'advance_paid');
      
      if (!isPayable) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Booking is not in a payable state' }) };
      }
      
      if (paymentType === 'full') {
        orderAmount = bookingData.totalAmount || bookingData.estimatedAmount || 5000;
      } else if (paymentType === 'remaining') {
        const alreadyPaid = bookingData.amountPaid || bookingData.advanceAmount || 5000;
        orderAmount = (bookingData.totalAmount || bookingData.estimatedAmount || 5000) - alreadyPaid;
      } else {
        // default to 'advance'
        orderAmount = bookingData.advanceAmount || 5000;
      }

      if (orderAmount <= 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Order amount must be greater than zero' }) };
      }

      customerPhone = bookingData.userPhone || bookingData.phone || "9999999999";
      customerId = bookingData.userId || "guest";
      customerName = bookingData.userName || bookingData.name || "Guest";
      customerEmail = `${customerId}@pjlawn.local`; 
    }

    // Initialize Cashfree SDK
    const env = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const cashfree = new Cashfree(env, process.env.CASHFREE_APP_ID || '', process.env.CASHFREE_SECRET_KEY || '');
    
    // Pin to published v5 API version
    cashfree.XApiVersion = "2025-01-01";

    const orderId = `order_${bookingId}_${paymentType}_${Date.now()}`;
    const returnUrl = `${process.env.URL || 'https://pjlawn.netlify.app'}/dashboard`;

    const request = {
      order_amount: orderAmount,
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
