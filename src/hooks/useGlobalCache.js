/**
 * Hook per gestire la cache globale
 */

import { useState, useCallback, useEffect } from 'react';
import globalCache from '../utils/globalCache';

export function useGlobalCache(key, defaultValue = null, ttlMs = 5 * 60 * 1000) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  // Carica dati dalla cache all'inizializzazione
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        await globalCache.init();
        const cached = await globalCache.get(key);
        if (cached !== null) {
          setData(cached);
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFromCache();
  }, [key]);

  // Funzione per aggiornare cache e stato
  const setCache = useCallback(async (newData) => {
    setData(newData);
    await globalCache.set(key, newData, ttlMs);
  }, [key, ttlMs]);

  // Funzione per invalidare cache
  const invalidate = useCallback(async () => {
    await globalCache.delete(key);
    setData(defaultValue);
  }, [key, defaultValue]);

  // Funzione per refreshare da cache
  const refresh = useCallback(async () => {
    setLoading(true);
    const cached = await globalCache.get(key);
    if (cached !== null) {
      setData(cached);
    }
    setLoading(false);
  }, [key]);

  return {
    data,
    loading,
    setCache,
    invalidate,
    refresh
  };
}

export default useGlobalCache;
