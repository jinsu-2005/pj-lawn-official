import { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (lazy load to avoid issues on cold starts)
let initialized = false;

function initFirebase() {
  if (!initialized && getApps().length === 0) {
    // In production, use environment variables. 
    // Here we need FIREBASE_SERVICE_ACCOUNT base64 encoded or individual vars
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
