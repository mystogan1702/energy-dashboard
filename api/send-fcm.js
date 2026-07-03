// api/send-fcm.js
import admin from 'firebase-admin';

let initialized = false;
let initError = null;

try {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing or empty');
    }
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
  } else {
    initialized = true;
  }
} catch (err) {
  initError = err.message;
}

export default async function handler(req, res) {
  // If initialization failed, return the error as JSON
  if (initError) {
    return res.status(500).json({ error: 'Initialization failed: ' + initError });
  }
  if (!initialized) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, url, userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const { getFirestore } = await import('firebase-admin/firestore');
    const userDoc = await getFirestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) {
      return res.status(400).json({ error: 'User not subscribed to push' });
    }

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: title || 'PesoWatt Alert',
        body: message || '',
      },
      webpush: {
        fcmOptions: { link: url || '/' },
      },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('FCM send error:', err);
    return res.status(500).json({ error: err.message });
  }
}
