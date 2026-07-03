// api/send-fcm.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  // Decode the base64 string back to JSON
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not set');
  }
  const serviceAccountJson = Buffer.from(base64, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
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
