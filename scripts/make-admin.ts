import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountBase64) {
  console.error("Error: FIREBASE_SERVICE_ACCOUNT environment variable is not defined. Set it before running.");
  process.exit(1);
}

const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const authAdmin = getAuth();

async function run() {
  const targetEmail = "jinsu.j2005@gmail.com";
  console.log(`Looking up user by email: ${targetEmail}`);
  
  let uid = "";
  try {
    const userRecord = await authAdmin.getUserByEmail(targetEmail);
    uid = userRecord.uid;
    console.log(`Found Firebase Auth user! UID: ${uid}`);
  } catch (e: any) {
    console.warn(`User ${targetEmail} not found in Firebase Auth: ${e.message}`);
    console.log("Searching Firestore bookings collection for matching email...");
    const bookingsSnap = await db.collection("bookings").get();
    bookingsSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.userEmail === targetEmail) {
        uid = data.userId;
      }
    });

    if (uid) {
      console.log(`Found UID via Firestore booking: ${uid}`);
    } else {
      console.log("No bookings found. Using a default placeholder admin document for owner UID lookup.");
    }
  }

  if (uid) {
    console.log(`Setting admin privileges in Firestore for UID: ${uid}`);
    await db.collection("admins").doc(uid).set({
      email: targetEmail,
      role: "admin",
      createdAt: new Date()
    });
    console.log(`Successfully configured admin document at /admins/${uid}!`);
  } else {
    console.error("Could not find any UID for jinsu.j2005@gmail.com. Please log in on the live site first, then run this script to grant admin permissions.");
  }
}

run().catch(console.error);
