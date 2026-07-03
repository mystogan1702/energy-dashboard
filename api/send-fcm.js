// api/send-fcm.js
import admin from 'firebase-admin';

export default async function handler(req, res) {
  try {
    if (!admin.apps.length) {
      // Try to parse the service account
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!raw) {
        return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT is not set' });
      }
      const serviceAccount = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    // If we get here, initialization succeeded
    return res.status(200).json({ ok: true, init: 'success' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
