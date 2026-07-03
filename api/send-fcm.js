// api/send-fcm.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // ensure newlines

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase env vars (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
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