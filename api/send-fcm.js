// api/send-fcm.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "cloud-energy-monitoring",
      clientEmail: "firebase-adminsdk-fbsvc@cloud-energy-monitoring.iam.gserviceaccount.com",
      // The private key MUST have real newlines, not \n
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDA4gB1qp20k4T4
BqQ3cOnO9eXFJZmXAQ72WmiVrEw8JWOeiq7d1jwhOa+xLNQQaT6B4XUAW0w7lKk7
eMjXezrrxW9H0Nt+I+/NOl7spqlnxHoZ5p+6OUjFj/Ek+HnyM55xbet8KiBpg4r+
aUQvdR3fkgxnh+OaA55A8DsyCrCHQdUyHhprH9cAQqt1U02T0FwvZElaxVSP3HjP
d13Y+RnM4YiFruKLqbYijkdLaWDvTw9azrQb17MR1QDqraP6AOAyXiJmiJvyLaaq
7X6aiO1q00JbkGNxSzfZWtLAHYHE5rV6Yq0pHqrnwWRCnTpBpUZ79KUXc7uMS/d+
nIb/wA2jAgMBAAECggEAWr34WWMbLoj4VXdKaorEdIlav5Ug3NmyoFOIQGH+u40b
gMrd2Z+gSkFJVqEwY0ggEBpxYOmSw7T8qO36DuX6olEQOUkY+g8OEg8T+WGu8RKO
HwFQw9uPUOKXID2FoVyHffWog5GODhXEnkwHuAvxMe0TyOE1Qo/RM9vQ/Ynp4rdT
vlnOw8qeRJHJTFCQCNE/GAzQCLApSWSg95WxTko1U/9iFa0XBgrl98EA+KDIJTB/
7NM1x7aVx1cNVhe+POkrzfH51dB6ceqL8Q5ZRu3ZBLqbC1bGR8HAxxrnJsbqA1Bf
cqRGYI7u0PUHaszBOuY8UWAKsPvLYm0szFrZbGj/gQKBgQD3RWFcpsscQ8b+JgRA
ItH/tfcfLd9ZtFk4rCdBRQF1Ttcmitms+pyFROPrEGj8IKqmZppxG6WqfncevXUS
Xovwv48jdpx7h4yhVpc39eB2aOm9CT/7RzrtkcgiFQ4/YN27q0jeRlOcrHJXhYvu
UE4bSLCCUxfBZKyRzkfaqIDN3QKBgQDHsRvAk6Fdv6vJOU6NKgqmhuDPIM63BnCy
0WwzqSCpsDfmQWHseUFvBGZE5uTBOHN6pSIKLv0MLgd+KkGRCYbuMZkgnbxugwgh
IaLYEar9S+EFNKx1MhnIz6VvsOvIN7XKF1b6BY43SG3NGvUIZFNjmQ8HZEFwAbCK
iqvGL6NRfwKBgQC1I00ce08lCH2Ypi7M8PUXNqyuWYNZimUlv+8NwEg+MCAqKuMk
9X19nya7hwzxTdjVByqyGwe0KuqGSVGewEYRebKYzwX49CZP9kfWhbcF5vr7MPB+
2gJQEFAkr3n9ca9dEC/ULH6JskYc2UbVsFxXXlt3TPmFAYPtV8iJZJDevQKBgQCU
v7b+gnnnTYl3QPrkaHa6iSoY4EVbTK7SZPGGoes0u5FIMVfyQHifa9WKabvoulY6
+5sZntrcIcVvE6b3lPMvpz57b0QXxf9ePqIA9Vg7ijQ6HnyAaCuQzCxdwJpB8E24
Fh6x60V+pLM132i7MZB0VmU9ik68UmXhLV67KG0tnQKBgQCefu0gxY1+oyR0a98x
/hJhD66RYlt3rYP/dpKF+JL/2zcPVUUhE3wXOuanuTGU9x6K4Cz9ZNs6Y2D+5Rke
bkuEzqUJmwJWwgJtvbEjgtcVfJdKKpWbIx3yPyjSOHPo2e3vBELJmKwqAmiulQ/C
TE+xvAXvdKS6eDNMaZ7qehJ+pg==
-----END PRIVATE KEY-----`,
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
