// Firebase Messaging Service Worker
// Le credenziali Firebase sono caricate dinamicamente dal client
// Questo file viene generato al runtime da src/firebase.js

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
