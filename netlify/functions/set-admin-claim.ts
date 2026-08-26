import { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (lazy load to avoid issues on cold starts)
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

  initFirebase();

  if (getApps().length === 0) {
    return { statusCode: 500, body: 'Firebase Admin not configured' };
  }

  try {
    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      return { statusCode: 400, body: 'Email required' };
    }
    
    // Hardcoded check for security or check from a secret key
    const adminSecret = event.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const userRecord = await getAuth().getUserByEmail(email);
    
    // Set custom claim
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Successfully made ${email} an admin. User needs to re-login.` })
    };
  } catch (error: any) {
    console.error("Error setting admin claim:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
