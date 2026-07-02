const ONE_SIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;   // paste from step 2
const ONE_SIGNAL_REST_KEY = import.meta.env.VITE_ONESIGNAL_REST_KEY;;   // paste from step 2

export async function sendPushNotification(title, message, url) {
  try {
    await fetch(`https://onesignal.com/api/v1/notifications?app_id=${ONE_SIGNAL_APP_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONE_SIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONE_SIGNAL_APP_ID,
        headings: { en: title },
        contents: { en: message },
        included_segments: ["All"],
        url: url || "/notifications",
        chrome_web_icon: "https://energy-dashboard-mystogan.vercel.app/pwa-192x192.png",
      }),
    });
  } catch (err) {
    console.error("Push send failed:", err);
  }
}