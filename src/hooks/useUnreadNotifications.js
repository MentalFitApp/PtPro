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

export default useUnreadNotifications;
