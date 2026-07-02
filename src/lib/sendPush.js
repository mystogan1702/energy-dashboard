const ONE_SIGNAL_APP_ID = "45fad956-4485-4484-aacb-582da8a98b48";
const ONE_SIGNAL_REST_KEY = "os_v2_app_ix5nsvseqvcijkwllaw2rkmljc7wlkb45bpe6of4mnu3pbpcswstrkmxq4het66k7ri6rb3kjbi2hq7fexkj4zucx3yy3jphkpopi3q";   // paste from step 2

export async function sendPushNotification(title, message, url) {
  try {
    await fetch("https://onesignal.com/api/v1/notifications?app_id=45fad956-4485-4484-aacb-582da8a98b48", {
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