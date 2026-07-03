// src/lib/sendPush.js
import { auth } from './firebase';

export async function sendPushNotification(title, message, url) {
  const user = auth.currentUser;
  if (!user) {
    console.warn('No authenticated user – cannot send push');
    return;
  }
  try {
    const response = await fetch('/api/send-fcm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, url, userId: user.uid }),
    });
    if (!response.ok) {
      const error = await response.json();
      console.error('Push send failed:', error);
    } else {
      console.log('Push sent successfully');
    }
  } catch (err) {
    console.error('Push send network error:', err);
  }
}

// TEMPORARY – allows easy console testing. Remove after confirming everything works.
window.sendPushNotification = sendPushNotification;