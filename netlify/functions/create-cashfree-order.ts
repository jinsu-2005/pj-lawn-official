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

    const bodyData = JSON.parse(event.body || '{}');
    const { bookingId, paymentType = 'advance' } = bodyData;
    if (!bookingId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'bookingId required' }) };
    }

    let orderAmount = bodyData.amount || 5000;
    let customerPhone = bodyData.customerPhone || "9876543210";
    let customerId = "guest";
    let customerEmail = bodyData.customerEmail || "customer@pjlawn.com";
    let customerName = bodyData.customerName || "Valued Customer";

    // Fetch booking details from Firestore if Admin is initialized
    if (getApps().length > 0) {
      const db = getFirestore();
      const bookingSnap = await db.collection('bookings').doc(bookingId).get();
      if (bookingSnap.exists) {
        const bookingData = bookingSnap.data()!;
        
        // Allow all active/unpaid states to proceed to checkout
        const isCancelled = bookingData.bookingStatus === 'cancelled' || bookingData.bookingStatus === 'rejected';
        if (isCancelled) {
          return { statusCode: 400, body: JSON.stringify({ error: 'This booking has been cancelled and cannot be paid.' }) };
        }
        
        if (paymentType === 'full') {
          orderAmount = bookingData.totalAmount || bookingData.estimatedAmount || orderAmount;
        } else if (paymentType === 'remaining') {
          const alreadyPaid = bookingData.amountPaid || bookingData.advanceAmount || 5000;
          orderAmount = (bookingData.totalAmount || bookingData.estimatedAmount || 5000) - alreadyPaid;
        } else {
          // default to 'advance'
          orderAmount = bookingData.advanceAmount || 5000;
        }

        customerPhone = bookingData.userPhone || bookingData.phone || customerPhone;
        customerId = bookingData.userId || bookingId;
        customerName = bookingData.userName || bookingData.name || customerName;
        customerEmail = bookingData.userEmail || bookingData.email || customerEmail;
      }
    }

    // Ensure positive integer amount
    orderAmount = Math.max(1, Math.round(orderAmount));

    // Sanitize customer details for Cashfree API requirements
    let phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) phoneDigits = "9876543210";
    if (phoneDigits.length > 10) phoneDigits = phoneDigits.slice(-10);

    let validEmail = customerEmail;
    if (!validEmail || !validEmail.includes('@') || validEmail.includes('.local')) {
      validEmail = "customer@pjlawn.com";
    }

    const cleanCustomerId = (customerId || "guest").replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 45) || 'cust_guest';

    // Initialize Cashfree SDK
    const env = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const appId = process.env.CASHFREE_APP_ID || '';
    const secretKey = process.env.CASHFREE_SECRET_KEY || '';

    if (!appId || !secretKey) {
      console.error("Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY");
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment gateway configuration missing. Please check CASHFREE_APP_ID and CASHFREE_SECRET_KEY in Netlify settings.' })
      };
    }

    const cashfree = new Cashfree(env, appId, secretKey);
    cashfree.XApiVersion = "2025-01-01";

    const orderId = `order_${bookingId.substring(0, 20)}_${paymentType}_${Date.now()}`;
    const returnUrl = `${process.env.URL || 'https://pjlawn.netlify.app'}/dashboard?order_id={order_id}`;

    const request = {
      order_amount: orderAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: cleanCustomerId,
        customer_phone: phoneDigits,
        customer_email: validEmail,
        customer_name: customerName.substring(0, 50)
      },
      order_meta: {
        return_url: returnUrl
      }
    };

    const response = await cashfree.PGCreateOrder(request);
    
    // Save the active order_id to the booking for reference
    if (getApps().length > 0) {
      try {
        await getFirestore().collection('bookings').doc(bookingId).update({
          cashfreeOrderId: orderId
        });
      } catch (e) {
        console.warn("Could not attach cashfreeOrderId to booking doc", e);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        payment_session_id: response.data.payment_session_id,
        order_id: orderId,
        environment: env === CFEnvironment.PRODUCTION ? 'production' : 'sandbox'
      })
    };
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Internal Server Error';
    console.error("Error creating Cashfree order:", error.response?.data || error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: errorMsg })
    };
  }
};
