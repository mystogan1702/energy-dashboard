// api/send-notification.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, url } = req.body;
  const REST_KEY = process.env.ONESIGNAL_REST_API_KEY;
  const APP_ID = process.env.ONESIGNAL_APP_ID;

  if (!REST_KEY || !APP_ID) {
    return res.status(500).json({ error: 'Missing OneSignal credentials' });
  }

  try {
    // ✅ New API endpoint for os_v2_app_* keys
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${REST_KEY}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        app_id: APP_ID,
        headings: { en: title },
        contents: { en: message },
        included_segments: ['Subscribed Users'],
        url: url || '/notifications',
        chrome_web_icon: 'https://energy-dashboard-mystogan.vercel.app/pwa-192x192.png',
      }),
    });

    const data = await response.json();
    console.log('OneSignal response:', JSON.stringify(data));
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
