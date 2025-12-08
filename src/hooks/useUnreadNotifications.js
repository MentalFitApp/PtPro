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
export function useUnreadAnamnesi() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadIds, setUnreadIds] = useState([]);
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
    const viewedKey = `viewed_anamnesi_${tenantId}_${user.uid}`;
    const viewedIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');

    // Query per anamnesi
    const anamnesiRef = collection(db, `tenants/${tenantId}/anamnesi`);
    
    const unsubscribe = onSnapshot(anamnesiRef, 
      (snapshot) => {
        const unread = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const id = doc.id;
          // Considera non letta se non è nella lista dei visti E ha data recente (ultimi 7 giorni)
          const createdAt = data.createdAt?.toDate?.() || data.updatedAt?.toDate?.() || new Date(0);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          if (!viewedIds.includes(id) && createdAt > sevenDaysAgo) {
            unread.push(id);
          }
        });
        setUnreadIds(unread);
        setUnreadCount(unread.length);
        setLoading(false);
      },
      (error) => {
        console.error('Errore caricamento anamnesi:', error);
        setUnreadCount(0);
        setUnreadIds([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const markAsRead = (anamnesiId) => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_anamnesi_${tenantId}_${user.uid}`;
    const viewedIds = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    
    if (!viewedIds.includes(anamnesiId)) {
      viewedIds.push(anamnesiId);
      localStorage.setItem(viewedKey, JSON.stringify(viewedIds));
      setUnreadIds(prev => prev.filter(id => id !== anamnesiId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = () => {
    const user = auth.currentUser;
    const tenantId = localStorage.getItem('tenantId');
    if (!user || !tenantId) return;

    const viewedKey = `viewed_anamnesi_${tenantId}_${user.uid}`;
    const allIds = [...new Set([...JSON.parse(localStorage.getItem(viewedKey) || '[]'), ...unreadIds])];
    localStorage.setItem(viewedKey, JSON.stringify(allIds));
    setUnreadIds([]);
    setUnreadCount(0);
  };

  return { unreadCount, unreadIds, loading, markAsRead, markAllAsRead };
}

// Hook per check non letti (per admin/coach)
export function useUnreadChecks() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadIds, setUnreadIds] = useState([]);
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

    // Query per check (collectionGroup per tutte le sottocollection)
    const checksRef = collection(db, `tenants/${tenantId}/checks`);
    
    const unsubscribe = onSnapshot(checksRef, 
      (snapshot) => {
        const unread = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const id = doc.id;
          // Considera non letto se non è nella lista dei visti E ha data recente (ultimi 7 giorni)
          const createdAt = data.createdAt?.toDate?.() || data.date?.toDate?.() || new Date(0);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          if (!viewedIds.includes(id) && createdAt > sevenDaysAgo) {
            unread.push(id);
          }
        });
        setUnreadIds(unread);
        setUnreadCount(unread.length);
        setLoading(false);
      },
      (error) => {
        console.error('Errore caricamento checks:', error);
        setUnreadCount(0);
        setUnreadIds([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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

  return { unreadCount, unreadIds, loading, markAsRead, markAllAsRead };
}

export default useUnreadNotifications;
