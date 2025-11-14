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
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});