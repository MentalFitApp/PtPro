import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { collection, query, where, onSnapshot, updateDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import { Bell, BellOff, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';

const VAPID_KEY = 'BPBjZH1KnB4fCdqy5VobaJvb_mC5UTPKxodeIhyhl6PrRBZ1r6bd6nFqoloeDXSXKb4uffOVSupUGHQ4Q0l9Ato';

export default function NotificationPanel({ userType = 'client', showEnableButton = true }) {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef(null);
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Verifica se le notifiche sono attive (solo se supportate dal browser)
    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';
    setIsNotificationsEnabled(permission === 'granted');

    // Ascolta le notifiche dell'utente (SENZA orderBy per evitare indice composito)
    const q = query(
      getTenantCollection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      where('userType', '==', userType)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aTime = a.sentAt?.toMillis ? a.sentAt.toMillis() : 0;
          const bTime = b.sentAt?.toMillis ? b.sentAt.toMillis() : 0;
          return bTime - aTime;
        });
      
      const newUnreadCount = notifs.filter(n => !n.read).length;
      
      // Suona e mostra notifica browser se ci sono nuove notifiche
      if (newUnreadCount > previousCountRef.current && previousCountRef.current > 0) {
        playNotificationSound();
        
        // Mostra notifica browser (solo se API Notification supportata)
        if (typeof Notification !== 'undefined' && permission === 'granted' && notifs[0]) {
          new Notification(notifs[0].title || 'Nuova notifica', {
            body: notifs[0].body || '',
            icon: '/PtPro/logo192.png',
            badge: '/PtPro/logo192.png',
            tag: 'notification-' + notifs[0].id
          });
        }
      }
      
      previousCountRef.current = newUnreadCount;
      setNotifications(notifs);
      setUnreadCount(newUnreadCount);
    });

    return () => unsubscribe();
  }, [userType]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play error:', err));
    }
  };

  const enableNotifications = async () => {
    try {
      // Verifica supporto API Notification
      if (typeof Notification === 'undefined') {
        toast.warning('Le notifiche browser non sono supportate su questo dispositivo. Riceverai comunque le notifiche in-app!');
        setIsNotificationsEnabled(true); // Attiva pannello notifiche in-app comunque
        return;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setIsNotificationsEnabled(true);
        
        try {
          const messaging = getMessaging();
          
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY
          });
          
          if (token) {
            const userId = auth.currentUser.uid;
            const tokenRef = getTenantDoc(db, 'fcmTokens', userId);
            const existingDoc = await getDoc(tokenRef);
            
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            
            if (existingDoc.exists()) {
              await updateDoc(tokenRef, {
                token: token,
                userType,
                updatedAt: serverTimestamp(),
                platform: isIOS ? 'ios' : 'android/web',
                isPWA: isPWA
              });
            } else {
              await setDoc(tokenRef, {
                userId,
                token: token,
                userType,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                platform: isIOS ? 'ios' : 'android/web',
                isPWA: isPWA,
                enabled: true
              });
            }
            toast.success('Notifiche attivate con successo!');
          } else {
            console.warn('⚠️ Nessun token FCM ottenuto');
            toast.warning('Notifiche browser attive, ma FCM token non disponibile');
          }
        } catch (fcmError) {
          console.error('❌ Errore FCM token:', fcmError);
          console.error('Dettagli errore:', fcmError.code, fcmError.message);
          toast.error('Errore FCM: ' + fcmError.message);
          // Le notifiche browser funzionano comunque anche senza FCM
        }
      } else {
        console.warn('⚠️ Permesso notifica negato');
        toast.warning('Permesso notifica negato');
      }
    } catch (error) {
      console.error('❌ Errore attivazione notifiche:', error);
      toast.error('Errore: ' + error.message);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(getTenantDoc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error('Errore marcatura notifica letta:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n => updateDoc(getTenantDoc(db, 'notifications', n.id), { read: true }))
      );
    } catch (error) {
      console.error('Errore marcatura tutte lette:', error);
    }
  };

  return (
    <div className="relative">
      {/* Pulsante Attiva Notifiche - Solo se showEnableButton è true */}
      {!isNotificationsEnabled && showEnableButton && (
        <motion.button
          onClick={enableNotifications}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
        >
          <BellOff size={18} />
          Attiva Notifiche
        </motion.button>
      )}

      {/* Campanella con Badge - Mostra sempre per client, con o senza notifiche attive */}
      {(isNotificationsEnabled || userType === 'client') && (
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Notifiche${unreadCount > 0 ? ` (${unreadCount} non lette)` : ''}`}
        >
          <Bell size={20} className="sm:w-6 sm:h-6 text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Panel Notifiche */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed right-2 top-20 w-[calc(100vw-1rem)] sm:w-96 sm:right-4 max-h-[70vh] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-bold text-slate-200">Notifiche</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Segna tutte lette
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  aria-label="Chiudi notifiche"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Lista Notifiche */}
            <div className="overflow-y-auto max-h-[420px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <motion.div
                    key={notif.id}
                    layout
                    className={`p-4 border-b border-slate-700 hover:bg-white/5 transition-colors cursor-pointer ${
                      !notif.read ? 'bg-rose-900/10' : ''
                    }`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-200 text-sm">{notif.title}</h4>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{notif.body}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {notif.sentAt?.toDate().toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {notif.read && (
                        <Check size={16} className="text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Element per suono notifica */}
      <audio ref={audioRef} src="/PtPro/mixkit-long-pop-2358.wav" preload="auto" />
    </div>
  );
}
