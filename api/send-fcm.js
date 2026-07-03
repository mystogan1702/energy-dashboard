// api/send-fcm.js
import admin from 'firebase-admin';

function initFirebase() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // The private key from Vercel already has real newlines; we just need to handle any remaining \n escapes
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId) {
    throw new Error('Missing env var: FIREBASE_PROJECT_ID');
  }
  if (!clientEmail) {
    throw new Error('Missing env var: FIREBASE_CLIENT_EMAIL');
  }
  if (!privateKey) {
    throw new Error('Missing env var: FIREBASE_PRIVATE_KEY');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// Initialize immediately, but catch any error so we can return it as JSON
let initError = null;
try {
  initFirebase();
} catch (err) {
  initError = err.message;
}

export default async function handler(req, res) {
  if (initError) {
    return res.status(500).json({ error: 'Init failed: ' + initError });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, url, userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { getFirestore } = await import('firebase-admin/firestore');
    const userDoc = await getFirestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return res.status(400).json({ error: 'User not subscribed to push' });

    await admin.messaging().send({
      token: fcmToken,
      notification: { title: title || 'PesoWatt Alert', body: message || '' },
      webpush: { fcmOptions: { link: url || '/' } },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('FCM send error:', err);
    return res.status(500).json({ error: err.message });
  }
}