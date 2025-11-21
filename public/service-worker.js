// service-worker.js – versione minima per non rompere niente
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());