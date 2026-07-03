import { messaging } from './firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const VAPID_KEY = "CrSk9OUFeLVOF5fUIRXuXYFEkoKMx-rhh_uBir5KbZY";

export async function requestPermission(userId) {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('FCM Token:', token);
    // Save token to Firestore (under a user doc or a dedicated tokens collection)
    await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
    return token;
  } else {
    console.log('Notification permission denied');
    return null;
  }
}
