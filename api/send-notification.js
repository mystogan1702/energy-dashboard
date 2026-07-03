// api/send-notification.js
import OneSignal from 'onesignal-node';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, url } = req.body;

  const client = new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID,
    process.env.ONESIGNAL_REST_API_KEY
  );

  try {
    const response = await client.createNotification({
      headings: { en: title },
      contents: { en: message },
      included_segments: ['Subscribed Users'],
      url: url || '/notifications',
      chrome_web_icon: 'https://energy-dashboard-mystogan.vercel.app/pwa-192x192.png',
    });

    // Log the FULL response body in Vercel functions
    console.log('OneSignal full response:', JSON.stringify(response.body));

    // Return the entire OneSignal response to the frontend
    return res.status(200).json(response.body);
  } catch (err) {
    console.error('OneSignal SDK error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send notification' });
  }
}
