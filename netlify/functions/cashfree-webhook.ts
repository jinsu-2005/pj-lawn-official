import { Handler } from "@netlify/functions";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (getApps().length === 0) {
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
        credential: cert(serviceAccount),
      });
    }
  } catch (err) {
    console.error("Firebase admin init error:", err);
  }
}
const db = getFirestore();

export const handler: Handler = async (event, context) => {
  // Cashfree requires POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const headers = event.headers || {};
    const getHeader = (name: string) => {
      const lower = name.toLowerCase();
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lower) return value;
      }
      return "";
    };

    const signature = getHeader("x-webhook-signature");
    const timestamp = getHeader("x-webhook-timestamp");
    const rawBody = event.body || "";

    // Respond immediately to dashboard test pings / empty checks
    if (!rawBody || rawBody === "{}" || (!signature && !timestamp)) {
      return { 
        statusCode: 200, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OK", message: "Cashfree webhook endpoint reachable" }) 
      };
    }

    const env = process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
    const cashfree = new Cashfree(env, process.env.CASHFREE_APP_ID || '', process.env.CASHFREE_SECRET_KEY || '');
    cashfree.XApiVersion = "2025-01-01";

    // Verify Signature for real incoming event payloads
    try {
      if (signature && timestamp && process.env.CASHFREE_SECRET_KEY) {
        cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
      }
    } catch (err) {
      console.warn("Webhook signature verification warning:", err);
      // If it's a test event from the dashboard, acknowledge with 200
      try {
        const testPayload = JSON.parse(rawBody);
        if (testPayload.type === 'TEST_WEBHOOK' || testPayload.data?.order?.order_id?.includes('test')) {
          return { statusCode: 200, body: JSON.stringify({ status: "OK", message: "Test webhook received" }) };
        }
      } catch {}
      return { statusCode: 400, body: "Invalid signature" };
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { statusCode: 200, body: "OK (Non-JSON payload)" };
    }

    const { type, data } = payload;
    const orderId = data?.order?.order_id;
    const paymentStatus = data?.payment?.payment_status;

    if (!orderId || type === 'TEST_WEBHOOK' || orderId.includes('test')) {
      return { statusCode: 200, body: JSON.stringify({ status: "OK", message: "Ping or test event processed" }) };
    }

    // Extract Booking ID from orderId (format: order_{bookingId}_...)
    const bookingId = orderId.split("_")[1];

    if (!bookingId) {
      return { statusCode: 200, body: "OK (No Booking ID in order)" };
    }

    switch (type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        if (paymentStatus === "SUCCESS") {
          // Verify with backend before fulfilling
          const response = await cashfree.PGOrderFetchPayments("2025-01-01", orderId);
          const payments = response.data;
          const successfulPayment = payments?.filter((p: any) => p.payment_status === "SUCCESS");

          if (successfulPayment && successfulPayment.length > 0) {
            // Determine payment type from order ID (format: order_{bookingId}_{paymentType}_{timestamp})
            const orderIdParts = orderId.split("_");
            const paymentType = orderIdParts.length >= 3 ? orderIdParts[orderIdParts.length - 2] : 'advance';
            
            const bookingDoc = await db.collection("bookings").doc(bookingId).get();
            const bData = bookingDoc.exists ? bookingDoc.data() : null;
            
            let paymentStatus = 'advance_paid';
            let amountPaid = bData?.advanceAmount || 5000;
            
            if (paymentType === 'full' || paymentType === 'remaining') {
              paymentStatus = 'fully_paid';
              amountPaid = bData?.totalAmount || bData?.estimatedAmount || 5000;
            }
            
            // Update Firestore
            await db.collection("bookings").doc(bookingId).update({
              paymentStatus: paymentStatus,
              bookingStatus: "confirmed",
              amountPaid: amountPaid,
              updatedAt: new Date()
            });

            // Make sure the availability is confirmed
            if (bData && bData.eventDate) {
              await db.collection("availability").doc(bData.eventDate).update({
                status: "confirmed"
              });
            }
          }
        }
        break;
      
      case "PAYMENT_FAILED_WEBHOOK":
      case "PAYMENT_USER_DROPPED_WEBHOOK":
        // We could log this or handle failed cases if needed, but for now just acknowledge
        break;

      default:
        console.log("Unhandled webhook type:", type);
    }

    return { statusCode: 200, body: "OK" };

  } catch (error) {
    console.error("Webhook handler error:", error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
