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
    const { bookingId, paymentType = 'advance' } = body;

    if (!bookingId || typeof bookingId !== 'string') {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Valid bookingId is required to create a payment order.' }) 
      };
    }

    const validPaymentTypes = ['advance', 'remaining', 'full'];
    if (!validPaymentTypes.includes(paymentType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Invalid paymentType. Must be one of: ${validPaymentTypes.join(', ')}` })
      };
    }

    // Default fallbacks
    let orderAmount = Number(body.amount) || 5000;
    let customerPhone = body.customerPhone || '9876543210';
    let customerId = 'cust_' + bookingId.substring(0, 20);
    let customerEmail = body.customerEmail || 'billing@pjlawn.com';
    let customerName = body.customerName || 'Valued Guest';
    let eventName = 'Lawn Event';

    // Authoritative Server-Side Check: Verify booking in Firestore
    if (getApps().length > 0) {
      const db = getFirestore();
      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingSnap = await bookingRef.get();

      if (bookingSnap.exists) {
        const data = bookingSnap.data()!;

        // Guard against invalid booking states
        if (data.bookingStatus === 'cancelled' || data.bookingStatus === 'rejected') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'This booking has been cancelled or rejected and cannot accept payments.' })
          };
        }

        if (data.paymentStatus === 'fully_paid') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'This booking is already fully paid.' })
          };
        }

        const total = Number(data.totalAmount || data.estimatedAmount || 15000);
        const advance = Number(data.advanceAmount || 5000);
        const alreadyPaid = Number(data.amountPaid || 0);

        if (paymentType === 'full') {
          orderAmount = Math.max(1, total - alreadyPaid);
        } else if (paymentType === 'remaining') {
          orderAmount = Math.max(1, total - alreadyPaid);
        } else {
          // 'advance'
          orderAmount = Math.max(1, advance);
        }

        customerPhone = data.userPhone || data.phone || customerPhone;
        customerId = data.userId || data.userEmail || bookingId;
        customerName = data.userName || data.name || customerName;
        customerEmail = data.userEmail || data.email || customerEmail;
        eventName = data.eventType || eventName;
      }
    }

    // Strict numerical boundary validation
    orderAmount = Math.round(orderAmount);
    if (isNaN(orderAmount) || orderAmount < 1 || orderAmount > 1000000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Calculated payment amount is invalid. Must be between ₹1 and ₹1,000,000.' })
      };
    }

    // Strict field sanitization per Cashfree PG requirements
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);
    if (cleanPhone.length < 10) cleanPhone = '9876543210';

    let cleanEmail = customerEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.includes('.local')) {
      cleanEmail = 'billing@pjlawn.com';
    }

    const cleanCustomerId = (customerId || 'cust_guest')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 45);

    const cleanCustomerName = (customerName || 'Valued Guest')
      .replace(/[^\w\s.-]/g, '')
      .trim()
      .substring(0, 50) || 'Valued Guest';

    // Verify Cashfree Environment & Credentials
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const envMode = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

    if (!appId || !secretKey) {
      console.error("[Cashfree Backend] Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY credentials in environment.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Payment Gateway is currently unconfigured. Please configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY.' 
        })
      };
    }

    // Initialize Cashfree PG SDK v6
    const cashfree = new Cashfree(envMode, appId, secretKey);
    cashfree.XApiVersion = "2025-01-01";

    const uniqueOrderId = `order_${bookingId.substring(0, 16)}_${paymentType}_${Date.now()}`;
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://pjlawn.netlify.app';
    const returnUrl = `${siteUrl}/dashboard?order_id={order_id}`;
    const notifyUrl = `${siteUrl}/.netlify/functions/cashfree-webhook`;

    const createOrderPayload = {
      order_id: uniqueOrderId,
      order_amount: orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: cleanCustomerId,
        customer_phone: cleanPhone,
        customer_email: cleanEmail,
        customer_name: cleanCustomerName
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl
      },
      order_note: `PJ Lawn - ${eventName} (${paymentType.toUpperCase()} payment)`
    };

    const cfResponse = await cashfree.PGCreateOrder(createOrderPayload);
    const cfData = cfResponse.data;

    if (!cfData?.payment_session_id) {
      console.error("[Cashfree Backend] No payment_session_id returned:", cfData);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Cashfree failed to generate a payment session. Please try again.' })
      };
    }

    // Persist active order record to Firestore
    if (getApps().length > 0) {
      try {
        const db = getFirestore();
        await db.collection('bookings').doc(bookingId).update({
          cashfreeOrderId: uniqueOrderId,
          lastPaymentAttempt: FieldValue.serverTimestamp(),
          lastPaymentType: paymentType,
          lastOrderAmount: orderAmount
        });
      } catch (dbErr) {
        console.warn("[Cashfree Backend] Failed to save cashfreeOrderId to booking doc:", dbErr);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        payment_session_id: cfData.payment_session_id,
        order_id: uniqueOrderId,
        order_amount: orderAmount,
        environment: envMode === CFEnvironment.PRODUCTION ? 'production' : 'sandbox'
      })
    };

  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("[Cashfree Backend] PGCreateOrder Exception:", errorData || error.message || error);
    
    const clientMessage = errorData?.message || errorData?.error || error.message || 'Payment service error. Please try again.';
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({ 
        error: clientMessage,
        code: errorData?.code || 'ORDER_CREATION_FAILED'
      })
    };
  }
};
