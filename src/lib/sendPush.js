export async function sendPushNotification(title, message, url) {
  const userId = 'current-user-id';   // get from your auth context
  const res = await fetch('/api/send-fcm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, message, url, userId }),
  });
  if (!res.ok) {
    const error = await res.json();
    console.error('Push failed:', error);
  }
}
