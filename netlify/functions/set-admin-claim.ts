import type { Handler } from '@netlify/functions';
import { getAdminAuth } from './adminDb.ts';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const auth = getAdminAuth();

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

    const userRecord = await auth.getUserByEmail(email);
    
    // Set custom claim
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    
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
