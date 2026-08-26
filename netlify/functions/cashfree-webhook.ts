import { Handler } from "@netlify/functions";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (getApps().length === 0) {
  try {
    let serviceAccount: any = null;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (raw) {
      try {
        serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
      } catch {
        serviceAccount = JSON.parse(raw);
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
    const signature = event.headers["x-webhook-signature"] || "";
    const timestamp = event.headers["x-webhook-timestamp"] || "";
    const rawBody = event.body || "";

    Cashfree.XClientId = process.env.CASHFREE_APP_ID || "";
    Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || "";
    Cashfree.XEnvironment = process.env.NODE_ENV === "production" 
      ? CFEnvironment.PRODUCTION 
      : CFEnvironment.SANDBOX;

    // Verify Signature
    const cashfree = new Cashfree();
    try {
      Cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return { statusCode: 400, body: "Invalid signature" };
    }

    const payload = JSON.parse(rawBody);
    const { type, data } = payload;
    const orderId = data?.order?.order_id;
    const paymentStatus = data?.payment?.payment_status;

    if (!orderId) {
      return { statusCode: 200, body: "OK (No Order ID)" };
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
          const response = await Cashfree.PGOrderFetchPayments("2025-01-01", orderId);
          const payments = response.data;
          const successfulPayment = payments?.filter((p: any) => p.payment_status === "SUCCESS");

          if (successfulPayment && successfulPayment.length > 0) {
            // Update Firestore
            await db.collection("bookings").doc(bookingId).update({
              paymentStatus: "advance_paid",
              bookingStatus: "confirmed",
              updatedAt: new Date()
            });

            // Make sure the availability is confirmed
            const bookingDoc = await db.collection("bookings").doc(bookingId).get();
            if (bookingDoc.exists) {
               const bData = bookingDoc.data();
               if (bData && bData.eventDate) {
                 await db.collection("availability").doc(bData.eventDate).update({
                   status: "confirmed"
                 });
               }
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
