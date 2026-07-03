// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCa8RhwR6-HFXtnpWyS3yr5VbWqsQeoSdQ",                     // your actual Web API key
  authDomain: "cloud-energy-monitoring.firebaseapp.com",
  projectId: "cloud-energy-monitoring",
  storageBucket: "cloud-energy-monitoring.firebasestorage.app",
  messagingSenderId: "14745597942",      // your sender ID
  appId: "1:14745597942:web:5bd9e5d804e8b4edc3f9d7"         // your actual App ID
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw] Received background message ', payload);
  const { title, body } = payload.notification || payload.data;
  self.registration.showNotification(title || 'PesoWatt Alert', {
    body: body || '',
    icon: '/pwa-192x192.png',
  });
});