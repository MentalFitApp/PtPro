// src/hooks/useUnreadItems.js
// Hook per tracciare anamnesi e check non ancora visti dall'admin/coach

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getTenantCollection, getTenantDoc } from '../config/tenant';

/**
 * Hook per tracciare items non letti (anamnesi, checks)
 * Salva lo stato "letto" nel documento dell'utente admin/coach
 * 
 * @returns {Object} { unreadAnamnesi, unreadChecks, markAsRead, isLoading }
 */
export function useUnreadItems() {
  const [unreadAnamnesi, setUnreadAnamnesi] = useState([]);
  const [unreadChecks, setUnreadChecks] = useState([]);
  const [readItems, setReadItems] = useState({ anamnesi: [], checks: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Carica lo stato "letto" dal database
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const loadReadStatus = async () => {
      try {
        const readStatusDoc = await getDoc(getTenantDoc(db, 'readStatus', user.uid));
        if (readStatusDoc.exists()) {
          const data = readStatusDoc.data();
          setReadItems({
            anamnesi: data.readAnamnesi || [],
            checks: data.readChecks || []
          });
        }
      } catch (err) {
        console.debug('useUnreadItems: Error loading read status', err);
      }
    };

    loadReadStatus();
  }, []);

  // Ascolta nuove anamnesi
  useEffect(() => {
    let isMounted = true;

    const loadAnamnesi = async () => {
      try {
        const { getDocs } = await import('firebase/firestore');
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        
        const allAnamnesi = [];
        
        await Promise.all(clientsSnap.docs.map(async (clientDoc) => {
          try {
            const anamnesiSnap = await getDocs(
              query(
                collection(db, clientDoc.ref.path, 'anamnesi'),
                orderBy('createdAt', 'desc'),
                limit(3)
              )
            );
            
            anamnesiSnap.docs.forEach(doc => {
              const data = doc.data();
              allAnamnesi.push({
                id: doc.id,
                clientId: clientDoc.id,
                clientName: clientDoc.data().name || 'Cliente',
                createdAt: data.createdAt,
                type: 'anamnesi'
              });
            });
          } catch (e) {}
        }));

        if (isMounted) {
          // Filtra quelli non letti
          const unread = allAnamnesi.filter(a => !readItems.anamnesi.includes(`${a.clientId}_${a.id}`));
          setUnreadAnamnesi(unread);
        }
      } catch (err) {
        console.debug('useUnreadItems: Error loading anamnesi', err);
      }
    };

    loadAnamnesi();
    
    // Refresh ogni 60 secondi
    const interval = setInterval(loadAnamnesi, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [readItems.anamnesi]);

  // Ascolta nuovi checks
  useEffect(() => {
    let isMounted = true;

    const loadChecks = async () => {
      try {
        const { getDocs } = await import('firebase/firestore');
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        
        const allChecks = [];
        
        await Promise.all(clientsSnap.docs.map(async (clientDoc) => {
          try {
            const checksSnap = await getDocs(
              query(
                collection(db, clientDoc.ref.path, 'checks'),
                orderBy('createdAt', 'desc'),
                limit(3)
              )
            );
            
            checksSnap.docs.forEach(doc => {
              const data = doc.data();
              allChecks.push({
                id: doc.id,
                clientId: clientDoc.id,
                clientName: clientDoc.data().name || 'Cliente',
                createdAt: data.createdAt,
                type: 'check'
              });
            });
          } catch (e) {}
        }));

        if (isMounted) {
          // Filtra quelli non letti
          const unread = allChecks.filter(c => !readItems.checks.includes(`${c.clientId}_${c.id}`));
          setUnreadChecks(unread);
          setIsLoading(false);
        }
      } catch (err) {
        console.debug('useUnreadItems: Error loading checks', err);
      }
    };

    loadChecks();
    
    // Refresh ogni 60 secondi
    const interval = setInterval(loadChecks, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [readItems.checks]);

  /**
   * Segna un item come letto
   * @param {string} type - 'anamnesi' o 'check'
   * @param {string} clientId - ID del cliente
   * @param {string} itemId - ID dell'anamnesi o check
   */
  const markAsRead = useCallback(async (type, clientId, itemId) => {
    const user = auth.currentUser;
    if (!user) return;

    const itemKey = `${clientId}_${itemId}`;
    const fieldName = type === 'anamnesi' ? 'readAnamnesi' : 'readChecks';
    
    try {
      // Aggiorna lo stato locale
      setReadItems(prev => ({
        ...prev,
        [type === 'anamnesi' ? 'anamnesi' : 'checks']: [
          ...prev[type === 'anamnesi' ? 'anamnesi' : 'checks'],
          itemKey
        ]
      }));

      // Aggiorna il database
      const readStatusRef = getTenantDoc(db, 'readStatus', user.uid);
      const existingDoc = await getDoc(readStatusRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : {};
      
      await setDoc(readStatusRef, {
        ...existingData,
        [fieldName]: [...(existingData[fieldName] || []), itemKey],
        lastUpdated: new Date()
      }, { merge: true });

      // Rimuovi dalla lista degli unread
      if (type === 'anamnesi') {
        setUnreadAnamnesi(prev => prev.filter(a => !(a.clientId === clientId && a.id === itemId)));
      } else {
        setUnreadChecks(prev => prev.filter(c => !(c.clientId === clientId && c.id === itemId)));
      }
    } catch (err) {
      console.error('useUnreadItems: Error marking as read', err);
    }
  }, []);

  /**
   * Segna tutti gli items di un cliente come letti
   * @param {string} clientId - ID del cliente
   */
  const markClientAsRead = useCallback(async (clientId) => {
    const user = auth.currentUser;
    if (!user) return;

    // Trova tutti gli items del cliente
    const clientAnamnesi = unreadAnamnesi.filter(a => a.clientId === clientId);
    const clientChecks = unreadChecks.filter(c => c.clientId === clientId);

    // Segna tutti come letti
    for (const a of clientAnamnesi) {
      await markAsRead('anamnesi', clientId, a.id);
    }
    for (const c of clientChecks) {
      await markAsRead('check', clientId, c.id);
    }
  }, [unreadAnamnesi, unreadChecks, markAsRead]);

  return {
    unreadAnamnesi,
    unreadChecks,
    unreadAnamnesiCount: unreadAnamnesi.length,
    unreadChecksCount: unreadChecks.length,
    markAsRead,
    markClientAsRead,
    isLoading,
    // Helper per verificare se un cliente ha items non letti
    hasUnreadForClient: (clientId) => {
      return unreadAnamnesi.some(a => a.clientId === clientId) || 
             unreadChecks.some(c => c.clientId === clientId);
    },
    getUnreadCountForClient: (clientId) => {
      return unreadAnamnesi.filter(a => a.clientId === clientId).length + 
             unreadChecks.filter(c => c.clientId === clientId).length;
    }
  };
}

export default useUnreadItems;
