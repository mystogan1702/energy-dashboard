// utils/notifications.js (or wherever you keep it)
export async function sendPushNotification(title, message, url) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, url }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Push send failed:', error);
    }
  } catch (err) {
    console.error('Push send network error:', err);
  }
}