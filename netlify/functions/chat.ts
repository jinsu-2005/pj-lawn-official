import type { Handler } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';

declare global {
  var promptCache: {
    systemInstruction: string;
    lastFetched: number;
  } | undefined;
}

// Initialize Firebase Admin if not already initialized
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
        credential: cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Helper to fetch chatbot settings from Firestore REST API (works reliably in serverless environments)
async function fetchChatbotSettings(): Promise<string> {
  const DEFAULT_PROMPT = `You are the official PJ Lawn virtual assistant. Keep your responses warm, concise, and helpful. Use clean, natural formatting without excessive asterisks.`;
  
  // 1. Try Firestore REST API
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'pj-lawn';
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/chatbot`);
    if (res.ok) {
      const data = await res.json();
      const systemPrompt = data?.fields?.systemPrompt?.stringValue || '';
      const businessData = data?.fields?.businessData?.stringValue || '';
      if (systemPrompt || businessData) {
        return `${systemPrompt}\n\nHere is the business context and facts you must reference:\n${businessData}`;
      }
    }
  } catch (err) {
    console.warn('Firestore REST fetch error:', err);
  }

  // 2. Fallback to Admin SDK if available
  try {
    if (getApps().length > 0) {
      const db = getFirestore();
      const settingsDoc = await db.collection('settings').doc('chatbot').get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        return `${data?.systemPrompt || ''}\n\nHere is the business context and facts you must reference:\n${data?.businessData || ''}`;
      }
    }
  } catch (err) {
    console.warn('Firestore Admin SDK fetch error:', err);
  }

  return DEFAULT_PROMPT;
}



async function processChatMessage(message: string, history: any[] = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  // Initialize cache if it doesn't exist
  if (!global.promptCache) {
    global.promptCache = {
      systemInstruction: '',
      lastFetched: 0
    };
  }

  const CACHE_TTL = 30 * 1000; // 30 seconds cache
  const now = Date.now();

  if (now - global.promptCache.lastFetched > CACHE_TTL || !global.promptCache.systemInstruction) {
    global.promptCache.systemInstruction = await fetchChatbotSettings();
    global.promptCache.lastFetched = now;
  }

  const systemInstruction = global.promptCache.systemInstruction;

  // Prepare contents
  const contents: any[] = [];
  if (Array.isArray(history)) {
    history.forEach((msg: any) => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });
  }
  
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const fallbackModels = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
  ];

  let response;
  let lastError;

  for (const model of fallbackModels) {
    try {
      response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      break;
    } catch (err: any) {
      console.warn(`Chatbot model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  if (!response) {
    throw lastError || new Error('All available AI models failed to respond due to quota or server errors.');
  }

  return response.text;
}

// Netlify Functions v2 (Standard Web API)
export default async function (req: Request, context: any) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { message, history } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const text = await processChatMessage(message, history);
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Netlify Functions v1 (Legacy Lambda compatibility)
export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { message, history } = JSON.parse(event.body || '{}');
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) };
    }

    const text = await processChatMessage(message, history);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    };
  } catch (error: any) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
