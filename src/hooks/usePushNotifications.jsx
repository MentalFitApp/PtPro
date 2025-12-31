// src/hooks/usePushNotifications.jsx
// Hook per gestione completa notifiche push PWA (Android + iOS 16.4+)

import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getTenantDoc } from '../config/tenant';

const VAPID_KEY = 'BPBjZH1KnB4fCdqy5VobaJvb_mC5UTPKxodeIhyhl6PrRBZ1r6bd6nFqoloeDXSXKb4uffOVSupUGHQ4Q0l9Ato';

export function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controlla supporto e ambiente
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);
        
        // Detect se installata come PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches 
          || window.navigator.standalone 
          || document.referrer.includes('android-app://');
        setIsPWA(standalone);
        
        // Check browser support
        const hasNotificationAPI = 'Notification' in window;
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasPushManager = 'PushManager' in window;
        
        // Su iOS, le notifiche funzionano solo se PWA installata (iOS 16.4+)
        const iosSupported = iOS ? standalone : true;
        
        const supported = hasNotificationAPI && hasServiceWorker && hasPushManager && iosSupported;
        setIsSupported(supported);
        
        if (hasNotificationAPI) {
          setPermission(Notification.permission);
        }
        
        // Se già autorizzato, ottieni token
        if (Notification.permission === 'granted' && supported) {
          await getOrRefreshToken();
        }
      } catch (err) {
        console.error('[Push] Errore check supporto:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkSupport();
  }, []);

  // Registra e ottieni il Service Worker attivo
  const getServiceWorkerRegistration = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker non supportato');
    }
    
    // Cerca una registration esistente
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    
    if (!registration) {
      // Registra il service worker se non esiste
      console.log('[Push] Registrazione Service Worker...');
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }
    
    // Aspetta che il SW sia attivo
    if (registration.installing) {
      console.log('[Push] Service Worker in installazione...');
      await new Promise((resolve) => {
        registration.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            resolve();
          }
        });
      });
    } else if (registration.waiting) {
      console.log('[Push] Service Worker in attesa...');
      await new Promise((resolve) => {
        registration.waiting.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            resolve();
          }
        });
      });
    }
    
    // Assicurati che ci sia un SW attivo
    if (!registration.active) {
      await navigator.serviceWorker.ready;
      registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    }
    
    console.log('[Push] Service Worker attivo:', registration.active?.state);
    return registration;
  };

  // Ottieni o aggiorna token FCM
  const getOrRefreshToken = useCallback(async () => {
    try {
      // Prima assicurati che il Service Worker sia registrato e attivo
      const swRegistration = await getServiceWorkerRegistration();
      
      const messaging = getMessaging();
      const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration 
      });
      
      if (currentToken) {
        setToken(currentToken);
        
        // Salva token su Firestore per l'utente corrente
        const user = auth.currentUser;
        if (user) {
          await saveTokenToFirestore(user.uid, currentToken);
        }
        
        return currentToken;
      }
      return null;
    } catch (err) {
      console.error('[Push] Errore ottenimento token:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Salva token su Firestore
  const saveTokenToFirestore = async (userId, fcmToken) => {
    try {
      const tokenRef = getTenantDoc(db, 'fcmTokens', userId);
      const existingDoc = await getDoc(tokenRef);
      
      if (existingDoc.exists()) {
        // Aggiorna token esistente
        await updateDoc(tokenRef, {
          token: fcmToken,
          updatedAt: serverTimestamp(),
          platform: isIOS ? 'ios' : 'android/web',
          isPWA: isPWA
        });
      } else {
        // Crea nuovo documento
        await setDoc(tokenRef, {
          userId,
          token: fcmToken,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          platform: isIOS ? 'ios' : 'android/web',
          isPWA: isPWA,
          enabled: true
        });
      }
      
      console.log('[Push] Token salvato per utente:', userId);
    } catch (err) {
      console.error('[Push] Errore salvataggio token:', err);
    }
  };

  // Richiedi permesso notifiche
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      const reason = isIOS && !isPWA 
        ? 'Su iPhone, installa prima l\'app sulla schermata Home'
        : 'Il tuo browser non supporta le notifiche push';
      setError(reason);
      return { success: false, reason };
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        const newToken = await getOrRefreshToken();
        return { success: true, token: newToken };
      } else if (result === 'denied') {
        return { success: false, reason: 'Permesso negato. Abilitalo dalle impostazioni del browser.' };
      } else {
        return { success: false, reason: 'Permesso non concesso' };
      }
    } catch (err) {
      console.error('[Push] Errore richiesta permesso:', err);
      setError(err.message);
      return { success: false, reason: err.message };
    }
  }, [isSupported, isIOS, isPWA, getOrRefreshToken]);

  // Setup listener messaggi in foreground
  const setupForegroundListener = useCallback((callback) => {
    try {
      const messaging = getMessaging();
      
      const unsubscribe = onMessage(messaging, async (payload) => {
        console.log('[Push] Messaggio foreground:', payload);
        
        // Mostra notifica locale se app in foreground via ServiceWorker
        if (payload.notification && Notification.permission === 'granted') {
          const { title, body, icon } = payload.notification;
          try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              const registration = await navigator.serviceWorker.ready;
              registration.showNotification(title, {
                body,
                icon: icon || '/icon-192.png',
                badge: '/icon-72.png',
                data: payload.data
              });
            }
          } catch (e) {
            console.log('Notifica foreground non disponibile');
          }
        }
        
        if (callback) callback(payload);
      });
      
      return unsubscribe;
    } catch (err) {
      console.error('[Push] Errore setup listener:', err);
      return () => {};
    }
  }, []);

  // Disabilita notifiche per l'utente
  const disableNotifications = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const tokenRef = getTenantDoc(db, 'fcmTokens', user.uid);
      await updateDoc(tokenRef, {
        enabled: false,
        disabledAt: serverTimestamp()
      });
      setToken(null);
    } catch (err) {
      console.error('[Push] Errore disabilitazione:', err);
    }
  }, []);

  return {
    // Stato
    permission,
    token,
    isSupported,
    isIOS,
    isPWA,
    loading,
    error,
    
    // Azioni
    requestPermission,
    setupForegroundListener,
    disableNotifications,
    refreshToken: getOrRefreshToken,
    
    // Helper
    canRequestPermission: isSupported && permission !== 'denied',
    isEnabled: permission === 'granted' && !!token
  };
}

// Helper per inviare notifiche push tramite Cloud Functions
export async function sendPushNotification({ 
  userId, 
  title, 
  body, 
  type = 'default',
  data = {},
  url = '/'
}) {
  try {
    // Ottieni token dell'utente
    const tokenDoc = await getDoc(getTenantDoc(db, 'fcmTokens', userId));
    
    if (!tokenDoc.exists() || !tokenDoc.data().enabled) {
      console.log('[Push] Utente non ha notifiche abilitate:', userId);
      return false;
    }
    
    const { token } = tokenDoc.data();
    
    // Salva notifica nel database (verrà inviata dalla Cloud Function)
    await setDoc(doc(db, 'pushQueue', `${userId}_${Date.now()}`), {
      token,
      userId,
      notification: { title, body },
      data: { ...data, type, url },
      createdAt: serverTimestamp(),
      sent: false
    });
    
    return true;
  } catch (err) {
    console.error('[Push] Errore invio notifica:', err);
    return false;
  }
}

export default usePushNotifications;
