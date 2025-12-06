// Firebase Messaging Service Worker per PtPro PWA
// Gestisce le notifiche push in background per Android e iOS PWA

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configurazione Firebase - biondo-fitness-coach
firebase.initializeApp({
  apiKey: "AIzaSyDU4GmH6xLhrEd2jSkyATXJOasIyEfisXY",
  authDomain: "biondo-fitness-coach.firebaseapp.com",
  projectId: "biondo-fitness-coach",
  storageBucket: "biondo-fitness-coach.firebasestorage.app",
  messagingSenderId: "1086406111438",
  appId: "1:1086406111438:web:1c8c3d9e49f1ffdb77609f"
});

const messaging = firebase.messaging();

// Icone per tipo notifica
const getNotificationIcon = (type) => {
  const icons = {
    chat: '💬',
    check: '📊',
    call: '📞',
    workout: '💪',
    diet: '🥗',
    reminder: '⏰',
    payment: '💳'
  };
  return icons[type] || '🔔';
};

// Azioni per tipo notifica
const getNotificationActions = (type) => {
  switch(type) {
    case 'chat':
      return [
        { action: 'open', title: 'Apri Chat' },
        { action: 'dismiss', title: 'Ignora' }
      ];
    case 'call':
      return [
        { action: 'accept', title: '📞 Rispondi' },
        { action: 'decline', title: '❌ Rifiuta' }
      ];
    case 'check':
      return [
        { action: 'open', title: 'Compila Check' }
      ];
    default:
      return [];
  }
};

// Gestione notifiche in background
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Notifica ricevuta:', payload);
  
  const notification = payload.notification || {};
  const data = payload.data || {};
  const type = data.type || 'default';
  
  const notificationTitle = notification.title || `${getNotificationIcon(type)} PtPro`;
  const notificationOptions = {
    body: notification.body || 'Hai una nuova notifica',
    icon: notification.icon || '/icon-192.png',
    badge: '/icon-72.png',
    tag: data.tag || type,
    data: {
      ...data,
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
    requireInteraction: type === 'call',
    actions: getNotificationActions(type),
    silent: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click sulla notifica
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Click notifica:', event.action);
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  // Azioni speciali
  if (action === 'decline' || action === 'dismiss') return;
  
  let targetUrl = data.url || '/';
  if (action === 'accept' && data.type === 'call') {
    targetUrl = data.callUrl || '/chat';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

console.log('[FCM SW] Service Worker caricato');
