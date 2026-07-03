// api/send-fcm.js
import admin from 'firebase-admin';

export default async function handler(req, res) {
  try {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (!base64) {
        return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT_BASE64 is not set' });
      }
      const serviceAccountJson = Buffer.from(base64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    // Handle the request
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, message, url, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

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
    // Catch any unexpected error and return it
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}