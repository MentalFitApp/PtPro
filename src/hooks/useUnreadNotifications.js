// src/hooks/useUnreadNotifications.js
// Hook per contare notifiche non lette
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Query per notifiche non lette
    const notificationsRef = collection(db, `tenants/${tenantId}/notifications`);
    const q = query(
      notificationsRef, 
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setUnreadCount(snapshot.size);
        setLoading(false);
      },
      (error) => {
        console.error('Errore caricamento notifiche:', error);
        setUnreadCount(0);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { unreadCount, loading };
}

// Hook per messaggi non letti
export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Query per chat con messaggi non letti
    const chatsRef = collection(db, `tenants/${tenantId}/chats`);
    
    const unsubscribe = onSnapshot(chatsRef, 
      (snapshot) => {
        let count = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Conta solo se l'ultimo messaggio non è dell'utente corrente e non è letto
          if (data.lastMessageBy !== user.uid && data.unreadCount?.[user.uid]) {
            count += data.unreadCount[user.uid];
          }
        });
        setUnreadCount(count);
        setLoading(false);
      },
      (error) => {
        console.error('Errore caricamento messaggi:', error);
        setUnreadCount(0);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { unreadCount, loading };
}

// Hook per anamnesi non lette (per admin/coach)
// Traccia per clientId dato che ogni cliente ha una sola anamnesi in /anamnesi/initial
export function useUnreadAnamnesi() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadIds, setUnreadIds] = useState([]); // Array di clientId con anamnesi non lette
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setUnreadCount(0);
      setUnreadIds([]);
      setLoading(false);
      return;
    }

    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      setUnreadCount(0);
      setUnreadIds([]);
      setLoading(false);
      return;
    }

    // Prima verifica se l'utente è admin/coach
    const checkRoleAndLoad = async () => {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        
        // Controlla ruolo admin
        const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
        const isAdmin = adminDoc.exists() && adminDoc.data().uids?.includes(user.uid);
        
        // Controlla ruolo coach
        const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
        const isCoach = coachDoc.exists() && coachDoc.data().uids?.includes(user.uid);
        
        // Se non è admin o coach, non caricare nulla
        if (!isAdmin && !isCoach) {
          setUnreadCount(0);
          setUnreadIds([]);
          setLoading(false);
          return;
        }

        // Carica anamnesi solo se admin/coach
        loadAnamnesi();
      } catch (error) {
        console.error('Errore verifica ruolo per anamnesi:', error);
        setUnreadCount(0);
        setUnreadIds([]);
        setLoading(false);
      }
    };

    // Legge i clientId le cui anamnesi sono già state viste
    const viewedKey = `viewed_anamnesi_${tenantId}_${user.uid}`;
    const viewedClientIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');

    // Legge il timestamp dell'ultimo aggiornamento per ogni anamnesi vista
    const timestampsKey = `anamnesi_timestamps_${tenantId}_${user.uid}`;
    const viewedTimestamps = JSON.parse(localStorage.getItem(timestampsKey) || '{}');

    // Carica anamnesi in modo ottimizzato - solo clienti recenti
    const loadAnamnesi = async () => {
      try {
        const { getDocs, collection, doc, getDoc, query, orderBy, limit, where } = await import('firebase/firestore');
        const clientsRef = collection(db, `tenants/${tenantId}/clients`);
        
        // Carica solo clienti attivi/recenti (ultimi 100 per data creazione)
        const clientsQuery = query(
          clientsRef, 
          where('isActive', '!=', false),
          orderBy('isActive'),
          orderBy('createdAt', 'desc'), 
          limit(100)
        );
        
        let clientsSnap;
        try {
          clientsSnap = await getDocs(clientsQuery);
        } catch (indexError) {
          // Se l'indice non esiste, usa query semplice
          console.debug('Index not available, using simple query');
          const simpleQuery = query(clientsRef, limit(50));
          clientsSnap = await getDocs(simpleQuery);
        }
        
        const unread = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Usa Promise.all per query parallele (molto più veloce)
        const anamnesiPromises = clientsSnap.docs.map(async (clientDoc) => {
          try {
            const anamRef = doc(db, `tenants/${tenantId}/clients/${clientDoc.id}/anamnesi/initial`);
            const anamSnap = await getDoc(anamRef);
            
            if (anamSnap.exists()) {
              const anamData = anamSnap.data();
              const updatedAt = anamData.submittedAt?.toDate?.() || anamData.updatedAt?.toDate?.() || anamData.completedAt?.toDate?.() || anamData.createdAt?.toDate?.() || new Date(0);
              
              const lastViewedTimestamp = viewedTimestamps[clientDoc.id] || 0;
              const isUpdatedAfterView = updatedAt.getTime() > lastViewedTimestamp;
              
              if (updatedAt > sevenDaysAgo && (!viewedClientIds.includes(clientDoc.id) || isUpdatedAfterView)) {
                return clientDoc.id;
              }
            }
            return null;
          } catch {
            return null;
          }
        });
        
        const results = await Promise.all(anamnesiPromises);
        const validUnread = results.filter(id => id !== null);
        
        setUnreadIds(validUnread);
        setUnreadCount(validUnread.length);
        setLoading(false);
      } catch (error) {
        console.error('Errore caricamento anamnesi:', error);
        setUnreadCount(0);
        setUnreadIds([]);
        setLoading(false);
      }
    };
    
    checkRoleAndLoad();
    
    // Ricarica ogni 5 minuti (solo se già verificato come admin/coach)
    const interval = setInterval(checkRoleAndLoad, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const markAsRead = useCallback((clientId) => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_anamnesi_${tenantId}_${user.uid}`;
    const viewedClientIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    
    const timestampsKey = `anamnesi_timestamps_${tenantId}_${user.uid}`;
    const viewedTimestamps = JSON.parse(localStorage.getItem(timestampsKey) || '{}');
    
    if (!viewedClientIds.includes(clientId)) {
      viewedClientIds.push(clientId);
      localStorage.setItem(viewedKey, JSON.stringify(viewedClientIds));
    }
    
    // Salva il timestamp corrente per questo clientId
    viewedTimestamps[clientId] = Date.now();
    localStorage.setItem(timestampsKey, JSON.stringify(viewedTimestamps));
    
    setUnreadIds(prev => prev.filter(id => id !== clientId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_anamnesi_${tenantId}_${user.uid}`;
    const timestampsKey = `anamnesi_timestamps_${tenantId}_${user.uid}`;
    
    setUnreadIds(currentUnreadIds => {
      const allIds = [...new Set([...JSON.parse(localStorage.getItem(viewedKey) || '[]'), ...currentUnreadIds])];
      localStorage.setItem(viewedKey, JSON.stringify(allIds));
      
      // Aggiorna tutti i timestamp
      const viewedTimestamps = JSON.parse(localStorage.getItem(timestampsKey) || '{}');
      const now = Date.now();
      currentUnreadIds.forEach(id => { viewedTimestamps[id] = now; });
      localStorage.setItem(timestampsKey, JSON.stringify(viewedTimestamps));
      
      return [];
    });
    setUnreadCount(0);
  }, []);

  return { unreadCount, unreadIds, loading, markAsRead, markAllAsRead };
}

// Hook per check non letti (per admin/coach)
// Traccia per checkId completo (clientId_checkId)
export function useUnreadChecks() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadIds, setUnreadIds] = useState([]); // Array di checkId con format "clientId_checkDocId"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setUnreadCount(0);
      setUnreadIds([]);
      setLoading(false);
      return;
    }

    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      setUnreadCount(0);
      setUnreadIds([]);
      setLoading(false);
      return;
    }

    // Prima verifica se l'utente è admin/coach
    const checkRoleAndLoad = async () => {
      try {
        const { getDoc, doc, getDocs, collection, query, orderBy, limit } = await import('firebase/firestore');
        
        // Controlla ruolo admin
        const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
        const isAdmin = adminDoc.exists() && adminDoc.data().uids?.includes(user.uid);
        
        // Controlla ruolo coach
        const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
        const isCoach = coachDoc.exists() && coachDoc.data().uids?.includes(user.uid);
        
        // Se non è admin o coach, non caricare nulla
        if (!isAdmin && !isCoach) {
          setUnreadCount(0);
          setUnreadIds([]);
          setLoading(false);
          return;
        }

        // Carica checks solo se admin/coach
        loadChecks(getDocs, collection, query, orderBy, limit);
      } catch (error) {
        console.error('Errore verifica ruolo per checks:', error);
        setUnreadCount(0);
        setUnreadIds([]);
        setLoading(false);
      }
    };

    // Legge gli ID già visti dal localStorage
    const viewedKey = `viewed_checks_${tenantId}_${user.uid}`;
    const viewedIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');

    // Carica checks in modo ottimizzato
    const loadChecks = async (getDocs, collection, query, orderBy, limit) => {
      try {
        const { where } = await import('firebase/firestore');
        const clientsRef = collection(db, `tenants/${tenantId}/clients`);
        
        // Carica solo clienti attivi/recenti (ultimi 100)
        let clientsSnap;
        try {
          const clientsQuery = query(
            clientsRef, 
            where('isActive', '!=', false),
            orderBy('isActive'),
            orderBy('createdAt', 'desc'), 
            limit(100)
          );
          clientsSnap = await getDocs(clientsQuery);
        } catch (indexError) {
          // Se l'indice non esiste, usa query semplice
          console.debug('Index not available for checks, using simple query');
          const simpleQuery = query(clientsRef, limit(50));
          clientsSnap = await getDocs(simpleQuery);
        }
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Usa Promise.all per query parallele
        const checksPromises = clientsSnap.docs.map(async (clientDoc) => {
          try {
            const checksRef = collection(db, `tenants/${tenantId}/clients/${clientDoc.id}/checks`);
            const checksQuery = query(checksRef, orderBy('createdAt', 'desc'), limit(5)); // Solo ultimi 5 check per cliente
            const checksSnap = await getDocs(checksQuery);
            
            const unreadForClient = [];
            checksSnap.docs.forEach(checkDoc => {
              const checkData = checkDoc.data();
              const fullId = `${clientDoc.id}_${checkDoc.id}`;
              const createdAt = checkData.createdAt?.toDate?.() || checkData.date?.toDate?.() || new Date(0);
              
              if (createdAt > sevenDaysAgo && !viewedIds.includes(fullId)) {
                unreadForClient.push(fullId);
              }
            });
            return unreadForClient;
          } catch {
            return [];
          }
        });
        
        const results = await Promise.all(checksPromises);
        const allUnread = results.flat();
        
        setUnreadIds(allUnread);
        setUnreadCount(allUnread.length);
        setLoading(false);
      } catch (error) {
        console.error('Errore caricamento checks:', error);
        setUnreadCount(0);
        setUnreadIds([]);
        setLoading(false);
      }
    };
    
    checkRoleAndLoad();
    
    // Ricarica ogni 5 minuti
    const interval = setInterval(checkRoleAndLoad, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const markAsRead = useCallback((checkId) => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_checks_${tenantId}_${user.uid}`;
    const viewedIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    
    if (!viewedIds.includes(checkId)) {
      viewedIds.push(checkId);
      localStorage.setItem(viewedKey, JSON.stringify(viewedIds));
      setUnreadIds(prev => prev.filter(id => id !== checkId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);
  
  // Segna tutti i check di un cliente come letti
  const markClientChecksAsRead = useCallback((clientId) => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_checks_${tenantId}_${user.uid}`;
    const viewedIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    
    setUnreadIds(currentUnreadIds => {
      // Trova tutti gli unreadIds che appartengono a questo cliente
      const clientCheckIds = currentUnreadIds.filter(id => id.startsWith(`${clientId}_`));
      
      const newViewedIds = [...new Set([...viewedIds, ...clientCheckIds])];
      localStorage.setItem(viewedKey, JSON.stringify(newViewedIds));
      
      setUnreadCount(prev => Math.max(0, prev - clientCheckIds.length));
      
      return currentUnreadIds.filter(id => !id.startsWith(`${clientId}_`));
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_checks_${tenantId}_${user.uid}`;
    setUnreadIds(currentUnreadIds => {
      const allIds = [...new Set([...JSON.parse(localStorage.getItem(viewedKey) || '[]'), ...currentUnreadIds])];
      localStorage.setItem(viewedKey, JSON.stringify(allIds));
      return [];
    });
    setUnreadCount(0);
  }, []);

  return { unreadCount, unreadIds, loading, markAsRead, markClientChecksAsRead, markAllAsRead };
}

export default useUnreadNotifications;
