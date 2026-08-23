import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  runTransaction, 
  serverTimestamp 
} from "firebase/firestore";

export interface PricingTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

export interface VenueSettings {
  hours: string;
  phone: string;
  address: string;
  whatsapp: string;
}

export async function getPricingTiers(): Promise<PricingTier[]> {
  const docRef = doc(db, "settings", "pricing");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().venueTiers || [];
  }
  return [];
}

export async function getVenueSettings(): Promise<VenueSettings | null> {
  const docRef = doc(db, "settings", "venue");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as VenueSettings;
  }
  return null;
}

export async function checkAndHoldDate(dateStr: string, userId: string): Promise<boolean> {
  const dateRef = doc(db, "availability", dateStr);
  
  try {
    await runTransaction(db, async (transaction) => {
      const dateDoc = await transaction.get(dateRef);
      
      if (!dateDoc.exists()) {
        // Date is open, we can hold it
        transaction.set(dateRef, {
          status: "held",
          heldBy: userId,
          heldUntil: new Date(Date.now() + 15 * 60 * 1000) // Hold for 15 minutes
        });
      } else {
        const data = dateDoc.data();
        if (data.status === "confirmed") {
          throw new Error("Date is already booked.");
        }
        if (data.status === "held" && data.heldUntil.toDate() > new Date() && data.heldBy !== userId) {
          throw new Error("Date is currently held by someone else.");
        }
        // If it's held by us or hold expired, we can re-hold
        transaction.update(dateRef, {
          status: "held",
          heldBy: userId,
          heldUntil: new Date(Date.now() + 15 * 60 * 1000)
        });
      }
    });
    return true;
  } catch (e) {
    console.error("Failed to hold date:", e);
    return false;
  }
}

export async function createBooking(bookingData: any): Promise<string> {
  const docRef = await addDoc(collection(db, "bookings"), {
    ...bookingData,
    bookingStatus: "pending_review",
    paymentStatus: "unpaid",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  // Update the availability to point to this booking
  const dateRef = doc(db, "availability", bookingData.eventDate);
  await setDoc(dateRef, {
    status: "held", // Admin will change to confirmed later
    bookingId: docRef.id
  }, { merge: true });

  return docRef.id;
}
