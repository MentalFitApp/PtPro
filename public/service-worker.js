// Service Worker - PtPro PWA
const CACHE_NAME = 'ptpro-v2'; // Incrementa per forzare update
const ASSETS_CACHE = 'ptpro-assets-v2';

// Assets critici da cachare
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: cacha assets critici
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: pulisci vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== ASSETS_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network First con fallback alla cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Firebase e API esterne
  if (
    url.origin.includes('firebasestorage') ||
    url.origin.includes('firebaseio') ||
    url.origin.includes('googleapis') ||
    url.origin.includes('r2.dev')
  ) {
    return;
  }

  // Network First strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cacha la risposta se valida (clone PRIMA di restituire)
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          const cacheName = request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2)$/)
            ? ASSETS_CACHE
            : CACHE_NAME;

          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache se offline
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }

          // Offline page per navigazione
          if (request.mode === 'navigate') {
            return caches.match('/');
          }

          // Placeholder per immagini
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" fill="#999">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});