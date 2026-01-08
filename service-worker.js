const CACHE_NAME = 'fitflows-v2-offline';
const IMAGE_CACHE = 'fitflows-images-v2';
const GIF_CACHE = 'fitflows-gifs-v2';

const urlsToCache = [
  '/PtPro/',
  '/PtPro/index.html',
  '/PtPro/manifest.json',
  '/PtPro/vite.svg',
  '/PtPro/logo192.png',
  '/PtPro/logo512.png'
];

// Installa e pre-cache risorse critiche
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Attiva e pulisci vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== IMAGE_CACHE && name !== GIF_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Strategia di caching avanzata
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora richieste non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Strategia per GIF esercizi (Cache First con Network Fallback)
  if (url.pathname.endsWith('.gif') || url.hostname.includes('giphy') || url.hostname.includes('exercisedb')) {
    event.respondWith(
      caches.open(GIF_CACHE).then(cache => {
        return cache.match(request).then(response => {
          return response || fetch(request).then(fetchResponse => {
            if (fetchResponse && fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Offline: ritorna placeholder se disponibile
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#334155" width="200" height="200"/><text fill="#64748b" font-family="Arial" font-size="14" x="50%" y="50%" text-anchor="middle">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
    return;
  }

  // Strategia per immagini (foto check-in, profili)
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(request).then(response => {
          return response || fetch(request).then(fetchResponse => {
            if (fetchResponse && fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => response); // Fallback a cache se offline
        });
      })
    );
    return;
  }

  // Strategia per API Firestore/Firebase (Network First con Cache Fallback)
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebase')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Strategia default per risorse app (Cache First)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            if (fetchResponse && fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
  }
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