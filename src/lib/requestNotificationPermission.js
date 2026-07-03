import { messaging } from './firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const VAPID_KEY = "BKv1_eS35Yt8Dw47EAsxI2qgDFs_q4ylxV6xNxtqsQEAPnDXjdiEm_GU4GI4hX7_kRDUB0N47nnrK69QPZj3njA";

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
