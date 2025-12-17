import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { getCurrentTenantId } from '../config/tenant';
import { auth } from '../firebase';

/**
 * Hook per gestire le notifiche in-app
 * Ascolta real-time le notifiche dell'utente corrente
 * 
 * @param {number} maxNotifications - Numero massimo di notifiche da caricare (default: 50)
 * @returns {Object} { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh }
 */
export function useNotifications(maxNotifications = 50) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ascolta le notifiche real-time
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    const tenantId = getCurrentTenantId();
    
    if (!userId || !tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query per tutte le notifiche dell'utente
    const notificationsRef = collection(db, 'tenants', tenantId, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxNotifications)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Errore caricamento notifiche:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [maxNotifications]);

  /**
   * Segna una notifica come letta
   */
  const markAsRead = useCallback(async (notificationId) => {
    const tenantId = getCurrentTenantId();
    if (!tenantId || !notificationId) return;

    try {
      const markReadFn = httpsCallable(functions, 'markNotificationRead');
      await markReadFn({ notificationId, tenantId });
      
      // Aggiorna lo stato locale immediatamente per UX fluida
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Errore mark as read:', err);
    }
  }, []);

  /**
   * Segna tutte le notifiche come lette
   */
  const markAllAsRead = useCallback(async () => {
    const tenantId = getCurrentTenantId();
    if (!tenantId) return;

    try {
      const markAllReadFn = httpsCallable(functions, 'markAllNotificationsRead');
      await markAllReadFn({ tenantId });
      
      // Aggiorna lo stato locale
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Errore mark all as read:', err);
    }
  }, []);

  /**
   * Forza refresh delle notifiche (raramente necessario con onSnapshot)
   */
  const refresh = useCallback(() => {
    // onSnapshot si aggiorna automaticamente, ma questo può servire per forzare un re-render
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  };
}

/**
 * Hook semplificato per ottenere solo il contatore non lette
 * Più leggero, ideale per badge nella navbar
 */
export function useUnreadNotificationsCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    const tenantId = getCurrentTenantId();
    
    if (!userId || !tenantId) return;

    const notificationsRef = collection(db, 'tenants', tenantId, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, []);

  return unreadCount;
}

export default useNotifications;
