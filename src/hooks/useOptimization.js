import { useState, useEffect, useCallback } from 'react';

/**
 * Hook per paginazione con Firestore
 * 
 * @param {Function} fetchFunction - Funzione che fetcha i dati (es: getClients)
 * @param {Object} options - Opzioni per la fetch
 * @param {number} pageSize - Numero di elementi per pagina
 * @returns {Object} - { data, loading, error, hasMore, loadMore, refresh }
 */
export const usePagination = (fetchFunction, options = {}, pageSize = 20) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  // Carica prima pagina
  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction({
        ...options,
        limitCount: pageSize
      });
      
      setData(result.clients || result.leads || result.items || []);
      setLastDoc(result.lastDoc);
      setHasMore(result.lastDoc !== undefined);
    } catch (err) {
      setError(err.message);
      console.error('Errore loadInitial:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carica pagina successiva
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction({
        ...options,
        limitCount: pageSize,
        startAfterDoc: lastDoc
      });
      
      const newData = result.clients || result.leads || result.items || [];
      setData(prev => [...prev, ...newData]);
      setLastDoc(result.lastDoc);
      setHasMore(result.lastDoc !== undefined && newData.length === pageSize);
    } catch (err) {
      setError(err.message);
      console.error('Errore loadMore:', err);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, lastDoc, fetchFunction, options, pageSize]);

  // Refresh (ricarica da capo)
  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    loadInitial();
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};

/**
 * Hook per caching semplice con localStorage
 * 
 * @param {string} key - Chiave per il cache
 * @param {Function} fetchFunction - Funzione per fetchare i dati
 * @param {number} ttl - Time to live in millisecondi (default 5 min)
 */
export const useCachedData = (key, fetchFunction, ttl = 300000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [key]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Controlla cache
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < ttl) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // Fetch nuovi dati
      const freshData = await fetchFunction();
      
      // Salva in cache
      localStorage.setItem(key, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      }));
      
      setData(freshData);
    } catch (err) {
      setError(err.message);
      console.error('Errore useCachedData:', err);
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(key);
    loadData();
  }, [key]);

  return { data, loading, error, refresh: invalidateCache };
};

/**
 * Hook per debouncing (utile per search)
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook per infinite scroll
 */
export const useInfiniteScroll = (callback, options = {}) => {
  const { threshold = 100 } = options;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);
};
