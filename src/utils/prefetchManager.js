// src/utils/prefetchManager.js
// Sistema di prefetching intelligente per dati critici

import { getDocs, doc, getDoc, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { getTenantCollection, getTenantDoc } from '../config/tenant';

// Cache globale per prefetch
const prefetchCache = new Map();
const PREFETCH_TTL = 2 * 60 * 1000; // 2 minuti

/**
 * Prefetch dati per route specifica
 */
export async function prefetchRoute(routeName) {
  const handlers = {
    dashboard: prefetchDashboard,
    clients: prefetchClients,
    analytics: prefetchAnalytics,
    client: prefetchClientDetail
  };

  const handler = handlers[routeName];
  if (handler) {
    try {
      await handler();
    } catch (err) {
      console.warn(`Prefetch failed for ${routeName}:`, err);
    }
  }
}

/**
 * Prefetch dati dashboard
 */
async function prefetchDashboard() {
  const cacheKey = 'prefetch-dashboard';
  
  if (isCacheValid(cacheKey)) return;

  try {    // Verifica che ci sia un tenantId (utente autenticato)
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return;
        // Carica solo snapshot clienti (il resto verrà caricato incrementalmente)
    const clientsSnap = await getDocs(
      query(getTenantCollection(db, 'clients'), limit(100))
    );
    
    prefetchCache.set(cacheKey, {
      data: clientsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      timestamp: Date.now()
    });
  } catch (err) {
    // Errore silenzioso - il prefetch non è critico
    if (err.code !== 'permission-denied') {
      console.debug('Prefetch dashboard skipped:', err.message);
    }
  }
}

/**
 * Prefetch lista clienti
 */
async function prefetchClients() {
  const cacheKey = 'prefetch-clients';
  
  if (isCacheValid(cacheKey)) return;

  try {
    // Verifica che ci sia un tenantId (utente autenticato)
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return;
    
    const clientsSnap = await getDocs(
      query(getTenantCollection(db, 'clients'), limit(100))
    );
    
    prefetchCache.set(cacheKey, {
      data: clientsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      timestamp: Date.now()
    });
  } catch (err) {
    // Errore silenzioso - il prefetch non è critico
    if (err.code !== 'permission-denied') {
      console.debug('Prefetch clients skipped:', err.message);
    }
  }
}

/**
 * Prefetch analytics
 */
async function prefetchAnalytics() {
  const cacheKey = 'prefetch-analytics';
  
  if (isCacheValid(cacheKey)) return;

  try {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return;

    const analyticsRef = doc(db, `tenants/${tenantId}/analytics/summary`);
    const analyticsSnap = await getDoc(analyticsRef);
    
    if (analyticsSnap.exists()) {
      prefetchCache.set(cacheKey, {
        data: analyticsSnap.data(),
        timestamp: Date.now()
      });
    }
  } catch (err) {
    // Errore silenzioso - il prefetch non è critico
    if (err.code !== 'permission-denied') {
      console.debug('Prefetch analytics skipped:', err.message);
    }
  }
}

/**
 * Prefetch dettaglio cliente
 */
async function prefetchClientDetail(clientId) {
  if (!clientId) return;
  
  const cacheKey = `prefetch-client-${clientId}`;
  
  if (isCacheValid(cacheKey)) return;

  try {
    const clientRef = getTenantDoc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    
    if (clientSnap.exists()) {
      prefetchCache.set(cacheKey, {
        data: { id: clientSnap.id, ...clientSnap.data() },
        timestamp: Date.now()
      });
    }
  } catch (err) {
    console.error('Prefetch client error:', err);
  }
}

/**
 * Controlla se cache è valida
 */
function isCacheValid(key) {
  const cached = prefetchCache.get(key);
  if (!cached) return false;
  
  const age = Date.now() - cached.timestamp;
  return age < PREFETCH_TTL;
}

/**
 * Ottieni dati da cache prefetch
 */
export function getPrefetchedData(key) {
  const cached = prefetchCache.get(key);
  
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > PREFETCH_TTL) {
    prefetchCache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Invalida cache prefetch
 */
export function invalidatePrefetchCache(key) {
  if (key) {
    prefetchCache.delete(key);
  } else {
    prefetchCache.clear();
  }
}

/**
 * Hook per prefetch on hover
 */
export function usePrefetchOnHover(routeName, routeParams = {}) {
  return {
    onMouseEnter: () => {
      if (routeName === 'client' && routeParams.clientId) {
        prefetchClientDetail(routeParams.clientId);
      } else {
        prefetchRoute(routeName);
      }
    }
  };
}

/**
 * Prefetch automatico per route comuni al mount dell'app
 */
export async function prefetchCriticalData() {
  // Verifica che l'utente sia autenticato
  const tenantId = localStorage.getItem('tenantId');
  if (!tenantId) {
    console.debug('Prefetch skipped: no authenticated user');
    return;
  }
  
  // Prefetch in background senza bloccare
  setTimeout(() => {
    Promise.all([
      prefetchClients(),
      prefetchAnalytics()
    ]).catch(err => {
      // Errore silenzioso - il prefetch non è critico
      if (err.code !== 'permission-denied') {
        console.debug('Critical prefetch skipped:', err.message);
      }
    });
  }, 2000); // Attendi 2 secondi dopo il mount per sicurezza
}

export default {
  prefetchRoute,
  getPrefetchedData,
  invalidatePrefetchCache,
  usePrefetchOnHover,
  prefetchCriticalData
};
