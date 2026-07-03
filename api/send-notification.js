// api/send-notification.js
import OneSignal from 'onesignal-node';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, url } = req.body;

  // Use the App API key (os_v2_app_...) and App ID from environment variables
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

    return res.status(200).json({ success: true, id: response.body.id });
  } catch (err) {
    console.error('OneSignal SDK error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send notification' });
  }
}
