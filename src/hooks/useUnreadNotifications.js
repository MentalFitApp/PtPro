// src/hooks/useUnreadNotifications.js
// Hook per contare notifiche non lette
import { useState, useEffect } from 'react';
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

    // Legge i clientId le cui anamnesi sono già state viste
    const viewedKey = `viewed_anamnesi_${tenantId}_${user.uid}`;
    const viewedClientIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');

    // Legge il timestamp dell'ultimo aggiornamento per ogni anamnesi vista
    const timestampsKey = `anamnesi_timestamps_${tenantId}_${user.uid}`;
    const viewedTimestamps = JSON.parse(localStorage.getItem(timestampsKey) || '{}');

    // Per ora carichiamo periodicamente - questo potrebbe essere ottimizzato
    const loadAnamnesi = async () => {
      try {
        const { getDocs, collection, doc, getDoc } = await import('firebase/firestore');
        const clientsRef = collection(db, `tenants/${tenantId}/clients`);
        const clientsSnap = await getDocs(clientsRef);
        
        const unread = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        for (const clientDoc of clientsSnap.docs) {
          const clientData = clientDoc.data();
          // Mostra notifiche anamnesi di tutti i clienti (anche storici e archiviati)
          
          const anamRef = doc(db, `tenants/${tenantId}/clients/${clientDoc.id}/anamnesi/initial`);
          const anamSnap = await getDoc(anamRef);
          
          if (anamSnap.exists()) {
            const anamData = anamSnap.data();
            const updatedAt = anamData.submittedAt?.toDate?.() || anamData.updatedAt?.toDate?.() || anamData.completedAt?.toDate?.() || anamData.createdAt?.toDate?.() || new Date(0);
            
            // È non letta se:
            // 1. Il clientId non è nella lista dei visti, OPPURE
            // 2. L'anamnesi è stata aggiornata dopo l'ultimo timestamp visto
            const lastViewedTimestamp = viewedTimestamps[clientDoc.id] || 0;
            const isUpdatedAfterView = updatedAt.getTime() > lastViewedTimestamp;
            
            if (updatedAt > sevenDaysAgo && (!viewedClientIds.includes(clientDoc.id) || isUpdatedAfterView)) {
              unread.push(clientDoc.id);
            }
          }
        }
        
        setUnreadIds(unread);
        setUnreadCount(unread.length);
        setLoading(false);
      } catch (error) {
        console.error('Errore caricamento anamnesi:', error);
        setUnreadCount(0);
        setUnreadIds([]);
        setLoading(false);
      }
    };
    
    loadAnamnesi();
    
    // Ricarica ogni 5 minuti
    const interval = setInterval(loadAnamnesi, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (clientId) => {
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
  };

  const markAllAsRead = () => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_anamnesi_${tenantId}_${user.uid}`;
    const timestampsKey = `anamnesi_timestamps_${tenantId}_${user.uid}`;
    
    const allIds = [...new Set([...JSON.parse(localStorage.getItem(viewedKey) || '[]'), ...unreadIds])];
    localStorage.setItem(viewedKey, JSON.stringify(allIds));
    
    // Aggiorna tutti i timestamp
    const viewedTimestamps = JSON.parse(localStorage.getItem(timestampsKey) || '{}');
    const now = Date.now();
    unreadIds.forEach(id => { viewedTimestamps[id] = now; });
    localStorage.setItem(timestampsKey, JSON.stringify(viewedTimestamps));
    
    setUnreadIds([]);
    setUnreadCount(0);
  };

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

    // Legge gli ID già visti dal localStorage
    const viewedKey = `viewed_checks_${tenantId}_${user.uid}`;
    const viewedIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');

    // Carica checks da tutti i clienti
    const loadChecks = async () => {
      try {
        const { getDocs, collection, query, orderBy, limit } = await import('firebase/firestore');
        const clientsRef = collection(db, `tenants/${tenantId}/clients`);
        const clientsSnap = await getDocs(clientsRef);
        
        const unread = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        for (const clientDoc of clientsSnap.docs) {
          const clientData = clientDoc.data();
          // Mostra notifiche check di tutti i clienti (anche storici e archiviati)
          
          const checksRef = collection(db, `tenants/${tenantId}/clients/${clientDoc.id}/checks`);
          const checksQuery = query(checksRef, orderBy('createdAt', 'desc'), limit(10));
          const checksSnap = await getDocs(checksQuery);
          
          checksSnap.docs.forEach(checkDoc => {
            const checkData = checkDoc.data();
            const fullId = `${clientDoc.id}_${checkDoc.id}`;
            const createdAt = checkData.createdAt?.toDate?.() || checkData.date?.toDate?.() || new Date(0);
            
            if (createdAt > sevenDaysAgo && !viewedIds.includes(fullId)) {
              unread.push(fullId);
            }
          });
        }
        
        setUnreadIds(unread);
        setUnreadCount(unread.length);
        setLoading(false);
      } catch (error) {
        console.error('Errore caricamento checks:', error);
        setUnreadCount(0);
        setUnreadIds([]);
        setLoading(false);
      }
    };
    
    loadChecks();
    
    // Ricarica ogni 5 minuti
    const interval = setInterval(loadChecks, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (checkId) => {
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
  };
  
  // Segna tutti i check di un cliente come letti
  const markClientChecksAsRead = (clientId) => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_checks_${tenantId}_${user.uid}`;
    const viewedIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    
    // Trova tutti gli unreadIds che appartengono a questo cliente
    const clientCheckIds = unreadIds.filter(id => id.startsWith(`${clientId}_`));
    
    const newViewedIds = [...new Set([...viewedIds, ...clientCheckIds])];
    localStorage.setItem(viewedKey, JSON.stringify(newViewedIds));
    
    setUnreadIds(prev => prev.filter(id => !id.startsWith(`${clientId}_`)));
    setUnreadCount(prev => Math.max(0, prev - clientCheckIds.length));
  };

  const markAllAsRead = () => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_checks_${tenantId}_${user.uid}`;
    const allIds = [...new Set([...JSON.parse(localStorage.getItem(viewedKey) || '[]'), ...unreadIds])];
    localStorage.setItem(viewedKey, JSON.stringify(allIds));
    setUnreadIds([]);
    setUnreadCount(0);
  };

  return { unreadCount, unreadIds, loading, markAsRead, markClientChecksAsRead, markAllAsRead };
}

export default useUnreadNotifications;
