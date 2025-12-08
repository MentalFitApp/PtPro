// src/hooks/useLocalCache.js
// Hook per cache localStorage con TTL
import { useState, useEffect, useCallback } from 'react';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minuti

/**
 * Hook per cache con localStorage e TTL
 * @param {string} key - Chiave cache
 * @param {function} fetcher - Funzione per recuperare dati freschi
 * @param {object} options - Opzioni (ttl, enabled)
 */
export function useLocalCache(key, fetcher, options = {}) {
  const { ttl = DEFAULT_TTL, enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheKey = `cache_${key}`;

  // Legge dalla cache
  const getFromCache = useCallback(() => {
    if (!enabled) return null;
    
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age > ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (e) {
      console.error('Cache read error:', e);
      return null;
    }
  }, [cacheKey, ttl, enabled]);

  // Salva nella cache
  const setInCache = useCallback((data) => {
    if (!enabled) return;
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }, [cacheKey, enabled]);

  // Refresh forzato
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const freshData = await fetcher();
      setData(freshData);
      setInCache(freshData);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [fetcher, setInCache]);

  // Invalida cache
  const invalidate = useCallback(() => {
    localStorage.removeItem(cacheKey);
    setData(null);
  }, [cacheKey]);

  // Caricamento iniziale
  useEffect(() => {
    const load = async () => {
      // Prima prova cache
      const cached = getFromCache();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
      
      // Altrimenti fetch
      await refresh();
    };
    
    load();
  }, [getFromCache, refresh]);

  return { data, loading, error, refresh, invalidate };
}

/**
 * Utility per invalidare cache multiple
 */
export function invalidateCaches(patterns) {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (patterns.some(pattern => key.startsWith(`cache_${pattern}`))) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Utility per pulire cache scadute
 */
export function cleanExpiredCaches(maxAge = 24 * 60 * 60 * 1000) {
  const keys = Object.keys(localStorage);
  const now = Date.now();
  
  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(key));
        if (now - timestamp > maxAge) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Cache corrotta, rimuovi
        localStorage.removeItem(key);
      }
    }
  });
}

export default useLocalCache;
