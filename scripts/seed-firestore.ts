import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Seeding pricing...");
  await setDoc(doc(db, "settings", "pricing"), {
    venueTiers: [
      { minGuests: 50, maxGuests: 100, price: 15000 },
      { minGuests: 101, maxGuests: 150, price: 20000 },
      { minGuests: 151, maxGuests: 200, price: 25000 },
      { minGuests: 201, maxGuests: 250, price: 30000 },
      { minGuests: 251, maxGuests: 300, price: 35000 }
    ],
    customPackageEnabled: true,
    capacityMin: 50,
    capacityMax: 300
  });

  console.log("Seeding venue hours...");
  await setDoc(doc(db, "settings", "venue"), {
    hours: "Mon-Sun 4:00 PM - 11:00 PM",
    phone: "+91 94897 24975",
    address: "Paul Vathiyar Compound, Gandhi Nagar, Kurusady, Nagercoil, Tamil Nadu 629004",
    whatsapp: "919489724975"
  });

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
