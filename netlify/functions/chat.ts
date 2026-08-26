import { Handler } from '@netlify/functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
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
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    const { message, history } = JSON.parse(event.body || '{}');
    
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) };
    }

    // Fetch chatbot settings from Firestore
    const settingsDoc = await db.collection('settings').doc('chatbot').get();
    let systemInstruction = "You are a helpful assistant for PJ Lawn.";
    
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      systemInstruction = `${data?.systemPrompt || ''}\n\nHere is the business context and facts you must reference:\n${data?.businessData || ''}`;
    }

    // Prepare contents
    const contents: any[] = [];
    
    // Add history
    if (Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });
    }
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: response.text
      })
    };
  } catch (error: any) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
