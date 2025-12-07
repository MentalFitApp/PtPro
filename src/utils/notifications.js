import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getTenantDoc } from '../config/tenant';

const VAPID_KEY = 'BPBjZH1KnB4fCdqy5VobaJvb_mC5UTPKxodeIhyhl6PrRBZ1r6bd6nFqoloeDXSXKb4uffOVSupUGHQ4Q0l9Ato';

// Richiede permesso notifiche e ottiene token FCM
export const requestNotificationPermission = async (userId) => {
  try {
    // Controlla se il browser supporta notifiche
    if (!('Notification' in window)) {
      console.log('Browser non supporta notifiche');
      return null;
    }

    // Richiede permesso
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Permesso notifiche negato');
      return null;
    }

    // Ottiene token FCM
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    if (token) {
      // Salva token nella collezione tenant corretta
      const tokenRef = getTenantDoc(db, 'fcmTokens', userId);
      const existingDoc = await getDoc(tokenRef);
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      
      if (existingDoc.exists()) {
        await updateDoc(tokenRef, {
          token: token,
          updatedAt: serverTimestamp(),
          platform: isIOS ? 'ios' : 'android/web',
          isPWA: isPWA
        });
      } else {
        await setDoc(tokenRef, {
          userId,
          token: token,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          platform: isIOS ? 'ios' : 'android/web',
          isPWA: isPWA,
          enabled: true
        });
      }
      
      console.log('[FCM] Token salvato per:', userId);
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Errore richiesta permesso notifiche:', error);
    return null;
  }
};

// Controlla se le notifiche sono già attivate
export const checkNotificationPermission = () => {
  if (!('Notification' in window)) return 'not-supported';
  return Notification.permission; // 'granted', 'denied', 'default'
};

// Invia notifica locale (non serve backend)
export const sendLocalNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
    
    // Chiudi notifica dopo 5 secondi
    setTimeout(() => notification.close(), 5000);
    
    return notification;
  }
};

// Notifica per chiamata imminente
export const notifyUpcomingCall = (eventTitle, minutesBefore) => {
  sendLocalNotification('📞 Chiamata imminente', {
    body: `${eventTitle} tra ${minutesBefore} minuti`,
    tag: 'upcoming-call',
    requireInteraction: true,
    vibrate: [200, 100, 200]
  });
};

// Notifica promemoria report giornaliero
export const notifyDailyReport = () => {
  sendLocalNotification('📝 Promemoria Report', {
    body: 'Ricordati di compilare il report giornaliero!',
    tag: 'daily-report',
    requireInteraction: false
  });
};

// Listener per messaggi in foreground
export const setupForegroundMessageListener = (callback) => {
  const messaging = getMessaging();
  
  return onMessage(messaging, (payload) => {
    console.log('Messaggio ricevuto in foreground:', payload);
    
    // Mostra notifica anche se app è aperta
    if (payload.notification) {
      sendLocalNotification(
        payload.notification.title,
        {
          body: payload.notification.body,
          icon: payload.notification.icon,
          data: payload.data
        }
      );
    }
    
    if (callback) callback(payload);
  });
};

// Programma notifiche per eventi del giorno
export const scheduleEventNotifications = (events) => {
  events.forEach(event => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventDateTime = new Date(event.date);
    eventDateTime.setHours(hours, minutes, 0, 0);
    
    // Notifica 30 minuti prima
    const notifyTime = new Date(eventDateTime.getTime() - 30 * 60 * 1000);
    const now = new Date();
    
    if (notifyTime > now) {
      const timeUntilNotification = notifyTime.getTime() - now.getTime();
      
      setTimeout(() => {
        notifyUpcomingCall(event.title, 30);
      }, timeUntilNotification);
    }
  });
};
