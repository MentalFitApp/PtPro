// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configurazione Firebase (stessa del progetto)
firebase.initializeApp({
  apiKey: "AIzaSyDpYkf75yRq2hd-t7GJyBR0PmlnXs10mEA",
  authDomain: "pt-manager-pro.firebaseapp.com",
  projectId: "pt-manager-pro",
  storageBucket: "pt-manager-pro.firebasestorage.app",
  messagingSenderId: "644470824116",
  appId: "1:644470824116:web:d8b4c82fbfce3a8fadd2d5",
  measurementId: "G-3NWNJFV1JW"
});

const messaging = firebase.messaging();

// Gestione notifiche in background
messaging.onBackgroundMessage((payload) => {
  console.log('Messaggio ricevuto in background:', payload);
  
  const notificationTitle = payload.notification?.title || 'PtPro';
  const notificationOptions = {
    body: payload.notification?.body || 'Nuova notifica',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.tag || 'default',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
