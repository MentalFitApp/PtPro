// Service Worker - PtPro PWA
// Versione migliorata con offline support e background sync
const CACHE_NAME = 'ptpro-v4'; // Incrementa per forzare update
const ASSETS_CACHE = 'ptpro-assets-v4';
const DATA_CACHE = 'ptpro-data-v2';

// Assets critici da cachare
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Pagine da pre-cachare per navigazione offline
const APP_SHELL = [
  '/client/dashboard',
  '/client/scheda',
  '/client/dieta',
  '/client/checks'
];

// Install: cacha assets critici
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: pulisci vecchie cache
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.includes('-v4') && !name.includes('-v2'))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Firebase realtime, auth e API esterne
  if (
    url.origin.includes('firebasestorage') ||
    url.origin.includes('firebaseio') ||
    url.origin.includes('googleapis') ||
    url.origin.includes('r2.dev') ||
    url.origin.includes('daily.co') ||
    url.pathname.includes('__')
  ) {
    return;
  }

  // API calls: Network first, cache fallback per dati stale
  if (url.pathname.includes('/api/') || url.origin.includes('firestore')) {
    event.respondWith(networkFirstWithCache(request, DATA_CACHE, 60 * 60 * 1000)); // 1 ora
    return;
  }

  // Static assets: Cache first
  if (request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ico)$/)) {
    event.respondWith(cacheFirstWithNetwork(request, ASSETS_CACHE));
    return;
  }

  // Navigation: Network first con fallback a app shell
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: Network first
  event.respondWith(networkFirstWithCache(request, CACHE_NAME));
});

// Strategia: Network First con cache
async function networkFirstWithCache(request, cacheName, maxAge = 0) {
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();
      
      // Aggiungi timestamp per validazione
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cached-at', Date.now().toString());
      
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    
    if (cached) {
      // Controlla se cache è troppo vecchia
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
      if (maxAge > 0 && Date.now() - cachedAt > maxAge) {
        console.log('[SW] Cache stale, ma la usiamo comunque (offline)');
      }
      return cached;
    }
    
    throw error;
  }
}

// Strategia: Cache First con network fallback
async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Placeholder per immagini
    if (request.destination === 'image') {
      return createOfflineImagePlaceholder();
    }
    throw error;
  }
}

// Strategia: Navigation con offline fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Prova cache della pagina specifica
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Fallback alla home (SPA)
    const homeCache = await caches.match('/');
    if (homeCache) return homeCache;
    
    // Ultima risorsa: pagina offline
    return createOfflinePage();
  }
}

// Placeholder SVG per immagini offline
function createOfflineImagePlaceholder() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect fill="#1e293b" width="200" height="200"/>
      <text x="100" y="100" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="14">
        📶 Offline
      </text>
    </svg>
  `;
  return new Response(svg, { 
    headers: { 'Content-Type': 'image/svg+xml' } 
  });
}

// Pagina offline HTML
function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PtPro - Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e2e8f0;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        p {
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }
        button {
          background: linear-gradient(135deg, #0891b2 0%, #0284c7 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
        }
        button:hover {
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📶</div>
        <h1>Sei Offline</h1>
        <p>Controlla la tua connessione internet e riprova</p>
        <button onclick="window.location.reload()">Riprova</button>
      </div>
    </body>
    </html>
  `;
  return new Response(html, { 
    headers: { 'Content-Type': 'text/html' } 
  });
}

// Background Sync per azioni offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-checks') {
    event.waitUntil(syncPendingChecks());
  }
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

// Sync pending checks quando torna online
async function syncPendingChecks() {
  try {
    const cache = await caches.open(DATA_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('pending-check')) {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Invia al server
        // await fetch('/api/checks', { method: 'POST', body: JSON.stringify(data) });
        
        // Rimuovi dalla cache pending
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('[SW] Sync checks failed:', error);
  }
}

// Sync pending messages
async function syncPendingMessages() {
  console.log('[SW] Syncing pending messages...');
  // Implementazione futura
}

// Message handler per comunicazione con l'app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
