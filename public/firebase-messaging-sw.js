// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,        // same as frontend
  authDomain: "...",
  projectId: "...",
  messagingSenderId: "14745597942",
  appId: "...",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || payload.data;
  self.registration.showNotification(title || 'PesoWatt Alert', {
    body: body || '',
    icon: '/pwa-192x192.png',
  });
});
