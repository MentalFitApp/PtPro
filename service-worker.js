const CACHE_NAME = 'pt-manager-pro-v1';
const urlsToCache = [
  '/PtPro/',
  '/PtPro/index.html',
  '/PtPro/manifest.json',
  '/PtPro/vite.svg',
  '/PtPro/logo192.png',
  '/PtPro/logo512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Gestisci solo richieste GET same-origin per evitare errori CORS
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return; // lascia passare al network normalmente
  }

  event.respondWith(
    caches.match(request).then(response => response || fetch(request))
  );
});

// Gestione notifiche push in background
self.addEventListener('push', event => {
  console.log('Push ricevuto:', event);
  
  let notificationData = {
    title: 'PtPro',
    body: 'Hai una nuova notifica',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'default',
    requireInteraction: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.notification?.title || data.title || notificationData.title,
        body: data.notification?.body || data.body || notificationData.body,
        icon: data.notification?.icon || notificationData.icon,
        badge: data.notification?.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        vibrate: data.vibrate || [200, 100, 200]
      };
    } catch (e) {
      console.error('Errore parsing notifica:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Gestione clic su notifica
self.addEventListener('notificationclick', event => {
  console.log('Notifica cliccata:', event);
  
  event.notification.close();
  
  // Apri o focalizza l'app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Se c'è già una finestra aperta, focalizzala
        for (let client of clientList) {
          if (client.url.includes('/PtPro') && 'focus' in client) {
            return client.focus();
          }
        }
        // Altrimenti apri una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow('/PtPro/');
        }
      })
  );
});