// src/hooks/useDataCache.jsx
// Hook per caching intelligente dei dati con pattern simile a React Query

import { useState, useEffect, useCallback, useRef } from 'react';

// Cache globale in memoria
const cache = new Map();
const subscribers = new Map();

// Configurazione default
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minuti
const DEFAULT_CACHE_TIME = 30 * 60 * 1000; // 30 minuti

/**
 * Hook per fetch con caching automatico
 * @param {string} key - Chiave unica per la cache
 * @param {Function} fetchFn - Funzione async per fetchare i dati
 * @param {Object} options - Opzioni di configurazione
 */
export function useCachedQuery(key, fetchFn, options = {}) {
  const {
    staleTime = DEFAULT_STALE_TIME,
    cacheTime = DEFAULT_CACHE_TIME,
    enabled = true,
    onSuccess,
    onError,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    initialData
  } = options;

  const [data, setData] = useState(() => {
    const cached = cache.get(key);
    if (cached && !isStale(cached, staleTime)) {
      return cached.data;
    }
    return initialData;
  });
  const [loading, setLoading] = useState(!cache.has(key));
  const [error, setError] = useState(null);
  const [isStaleData, setIsStaleData] = useState(false);
  
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    
    const cached = cache.get(key);
    
    // Se non forzato e cache valida, usa cache
    if (!force && cached && !isStale(cached, staleTime)) {
      setData(cached.data);
      setLoading(false);
      return cached.data;
    }

    // Se c'è cache stale, mostrala mentre ricarica
    if (cached) {
      setData(cached.data);
      setIsStaleData(true);
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
        setIsStaleData(false);
        
        // Aggiorna cache
        cache.set(key, {
          data: result,
          timestamp: Date.now()
        });

        // Programma pulizia cache
        scheduleCacheCleanup(key, cacheTime);
        
        // Notifica altri subscribers
        notifySubscribers(key, result);
        
        onSuccess?.(result);
      }
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
        onError?.(err);
      }
      throw err;
    } finally {
      fetchingRef.current = false;
    }
  }, [key, fetchFn, staleTime, cacheTime, onSuccess, onError]);

  // Sottoscrivi agli aggiornamenti
  useEffect(() => {
    const subscribers = getSubscribers(key);
    const handler = (newData) => {
      if (mountedRef.current) {
        setData(newData);
        setIsStaleData(false);
      }
    };
    subscribers.add(handler);
    
    return () => {
      subscribers.delete(handler);
    };
  }, [key]);

  // Fetch iniziale
  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [enabled, refetchOnMount, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;
    
    const handleFocus = () => {
      const cached = cache.get(key);
      if (!cached || isStale(cached, staleTime)) {
        fetchData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, staleTime, refetchOnWindowFocus, fetchData]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isStale: isStaleData,
    refetch: () => fetchData(true),
    invalidate: () => invalidateCache(key)
  };
}

/**
 * Hook per mutation con invalidazione cache
 */
export function useCachedMutation(mutationFn, options = {}) {
  const { onSuccess, onError, invalidateKeys = [] } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (variables) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mutationFn(variables);
      
      // Invalida cache correlate
      invalidateKeys.forEach(key => invalidateCache(key));
      
      onSuccess?.(result, variables);
      return result;
    } catch (err) {
      setError(err);
      onError?.(err, variables);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, invalidateKeys, onSuccess, onError]);

  return { mutate, loading, error };
}

// Helper functions
function isStale(cached, staleTime) {
  return Date.now() - cached.timestamp > staleTime;
}

function getSubscribers(key) {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  return subscribers.get(key);
}

function notifySubscribers(key, data) {
  const subs = subscribers.get(key);
  if (subs) {
    subs.forEach(handler => handler(data));
  }
}

function scheduleCacheCleanup(key, cacheTime) {
  setTimeout(() => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp > cacheTime) {
      cache.delete(key);
    }
  }, cacheTime);
}

export function invalidateCache(key) {
  cache.delete(key);
}

export function invalidateAllCache() {
  cache.clear();
}

export function prefetchQuery(key, fetchFn) {
  return fetchFn().then(data => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  });
}

// Hook per prefetch lista clienti (uso comune)
export function usePrefetchClients() {
  useEffect(() => {
    // Prefetch in background dopo 2 secondi
    const timeout = setTimeout(() => {
      if (!cache.has('clients')) {
        import('../firebase').then(({ db }) => {
          import('firebase/firestore').then(({ getDocs, query, limit }) => {
            import('../config/tenant').then(({ getTenantCollection }) => {
              getDocs(
                query(getTenantCollection(db, 'clients'), limit(100))
              )
                .then(snap => {
                  const clients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                  cache.set('clients', { data: clients, timestamp: Date.now() });
                })
                .catch(() => {});
            });
          });
        });
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, []);
}

export default useCachedQuery;
