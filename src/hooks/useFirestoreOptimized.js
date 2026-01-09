// src/hooks/useFirestoreOptimized.js
// Hook ottimizzato per query Firestore con caching intelligente, prefetching e batching

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { onSnapshot, getDocs, query, limit, startAfter, where, orderBy } from 'firebase/firestore';

// Cache globale in memoria per query Firestore
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti
const PREFETCH_THRESHOLD = 0.8; // Prefetch quando si raggiunge l'80% dei dati

/**
 * Hook ottimizzato per snapshot realtime con caching e debouncing
 * Evita re-render inutili e cache i risultati
 */
export function useFirestoreSnapshot(queryRef, options = {}) {
  const {
    cacheKey,
    transform = (docs) => docs.map(d => ({ id: d.id, ...d.data() })),
    enabled = true,
    debounceMs = 100,
    cacheTTL = CACHE_TTL
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const cacheTimeRef = useRef(Date.now());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled || !queryRef) {
      setLoading(false);
      return;
    }

    // Controlla cache se disponibile
    if (cacheKey && queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey);
      const age = Date.now() - cached.timestamp;
      
      if (age < cacheTTL) {
        setData(cached.data);
        setLoading(false);
        cacheTimeRef.current = cached.timestamp;
      }
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        // Debounce updates per evitare troppi re-render
        clearTimeout(debounceTimerRef.current);
        
        debounceTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;

          try {
            const transformedData = transform(snapshot.docs);
            setData(transformedData);
            setError(null);

            // Aggiorna cache
            if (cacheKey) {
              queryCache.set(cacheKey, {
                data: transformedData,
                timestamp: Date.now()
              });
              cacheTimeRef.current = Date.now();
            }
          } catch (err) {
            setError(err);
            console.error('Error transforming snapshot:', err);
          } finally {
            setLoading(false);
          }
        }, debounceMs);
      },
      (err) => {
        if (mountedRef.current) {
          setError(err);
          setLoading(false);
          console.error('Firestore snapshot error:', err);
        }
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(debounceTimerRef.current);
    };
  }, [enabled, queryRef, cacheKey, transform, debounceMs, cacheTTL]);

  const invalidateCache = useCallback(() => {
    if (cacheKey) {
      queryCache.delete(cacheKey);
    }
  }, [cacheKey]);

  return { data, loading, error, invalidateCache, cacheAge: Date.now() - cacheTimeRef.current };
}

/**
 * Hook per paginazione ottimizzata con prefetching intelligente
 * Carica automaticamente la pagina successiva quando l'utente si avvicina alla fine
 */
export function useFirestorePagination(baseQuery, options = {}) {
  const {
    pageSize = 20,
    transform = (docs) => docs.map(d => ({ id: d.id, ...d.data() })),
    prefetchThreshold = PREFETCH_THRESHOLD,
    cacheKey
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef(null);
  const prefetchingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Carica prima pagina
  useEffect(() => {
    if (!baseQuery) return;
    loadInitialPage();
  }, [baseQuery]);

  const loadInitialPage = async () => {
    if (!baseQuery) return;

    setLoading(true);
    setError(null);

    try {
      // Controlla cache
      if (cacheKey && queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        const age = Date.now() - cached.timestamp;
        
        if (age < CACHE_TTL) {
          setData(cached.data);
          lastDocRef.current = cached.lastDoc;
          setHasMore(cached.hasMore);
          setLoading(false);
          return;
        }
      }

      const paginatedQuery = query(baseQuery, limit(pageSize));
      const snapshot = await getDocs(paginatedQuery);
      
      if (!mountedRef.current) return;

      const docs = transform(snapshot.docs);
      setData(docs);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(snapshot.docs.length === pageSize);

      // Cache
      if (cacheKey) {
        queryCache.set(cacheKey, {
          data: docs,
          lastDoc: lastDocRef.current,
          hasMore: snapshot.docs.length === pageSize,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        console.error('Error loading initial page:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDocRef.current || !baseQuery) return;

    setLoadingMore(true);
    setError(null);

    try {
      const nextQuery = query(
        baseQuery,
        startAfter(lastDocRef.current),
        limit(pageSize)
      );
      
      const snapshot = await getDocs(nextQuery);
      
      if (!mountedRef.current) return;

      const newDocs = transform(snapshot.docs);
      setData(prev => [...prev, ...newDocs]);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(snapshot.docs.length === pageSize);

      // Aggiorna cache
      if (cacheKey) {
        queryCache.delete(cacheKey); // Invalida cache vecchia
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        console.error('Error loading more:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [hasMore, loadingMore, baseQuery, pageSize, transform, cacheKey]);

  // Prefetch automatico
  const checkPrefetch = useCallback((scrollPercentage) => {
    if (scrollPercentage >= prefetchThreshold && hasMore && !loadingMore && !prefetchingRef.current) {
      prefetchingRef.current = true;
      loadMore().finally(() => {
        prefetchingRef.current = false;
      });
    }
  }, [prefetchThreshold, hasMore, loadingMore, loadMore]);

  const refresh = useCallback(() => {
    lastDocRef.current = null;
    setHasMore(true);
    if (cacheKey) {
      queryCache.delete(cacheKey);
    }
    loadInitialPage();
  }, [cacheKey, loadInitialPage]);

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    checkPrefetch
  };
}

/**
 * Hook per query batch parallele ottimizzate
 * Esegue multiple query in parallelo e combina i risultati
 */
export function useFirestoreBatch(queries, options = {}) {
  const {
    transform = (results) => results,
    enabled = true,
    cacheKey
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled || !queries || queries.length === 0) {
      setLoading(false);
      return;
    }

    executeBatch();
  }, [enabled, queries, cacheKey]);

  const executeBatch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Controlla cache
      if (cacheKey && queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        const age = Date.now() - cached.timestamp;
        
        if (age < CACHE_TTL) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      // Esegui tutte le query in parallelo
      const results = await Promise.all(
        queries.map(q => getDocs(q).then(snap => 
          snap.docs.map(d => ({ id: d.id, ...d.data() }))
        ))
      );

      if (!mountedRef.current) return;

      const transformedData = transform(results);
      setData(transformedData);

      // Cache
      if (cacheKey) {
        queryCache.set(cacheKey, {
          data: transformedData,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        console.error('Error executing batch queries:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refresh = useCallback(() => {
    if (cacheKey) {
      queryCache.delete(cacheKey);
    }
    executeBatch();
  }, [cacheKey, executeBatch]);

  return { data, loading, error, refresh };
}

/**
 * Hook per caricare dati nested (subcollection) in modo ottimizzato
 * Usa batching e limiti per evitare query troppo pesanti
 */
export function useFirestoreNested(parentDocs, getSubcollectionRef, options = {}) {
  const {
    batchSize = 10,
    limitPerDoc = 5,
    transform = (doc, subDocs) => ({ ...doc, subDocs }),
    enabled = true
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled || !parentDocs || parentDocs.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    loadNested();
  }, [enabled, parentDocs]);

  const loadNested = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = [];

      // Processa in batch per evitare troppi query simultanei
      for (let i = 0; i < parentDocs.length; i += batchSize) {
        const batch = parentDocs.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (doc) => {
            try {
              const subRef = getSubcollectionRef(doc);
              const subQuery = query(subRef, limit(limitPerDoc));
              const subSnap = await getDocs(subQuery);
              const subDocs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              
              return transform(doc, subDocs);
            } catch (err) {
              console.error(`Error loading nested data for doc ${doc.id}:`, err);
              return transform(doc, []);
            }
          })
        );

        results.push(...batchResults);

        if (!mountedRef.current) return;
      }

      setData(results);
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        console.error('Error loading nested data:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return { data, loading, error, refresh: loadNested };
}

/**
 * Utility per invalidare cache globalmente
 */
export function invalidateQueryCache(key) {
  if (key) {
    queryCache.delete(key);
  } else {
    queryCache.clear();
  }
}

/**
 * Utility per ottenere info sulla cache
 */
export function getCacheStats() {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys()),
    totalSize: JSON.stringify(Array.from(queryCache.entries())).length
  };
}
