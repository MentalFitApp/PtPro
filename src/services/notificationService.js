// src/services/notificationService.js
// Servizio centralizzato per notifiche push su eventi

import { addDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getTenantCollection, getTenantDoc, getCoachId } from '../config/tenant';

// ============ TIPI DI NOTIFICA ============
export const NOTIFICATION_TYPES = {
  NEW_LEAD: 'new_lead',
  NEW_EVENT: 'new_event',
  NEW_ANAMNESI: 'new_anamnesi',
  NEW_CHECK: 'new_check',
  CALL_REQUEST: 'call_request',
  NEW_CLIENT: 'new_client',
  PAYMENT: 'payment',
  EXPIRING: 'expiring',
  MESSAGE: 'message',
  NEW_WORKOUT: 'new_workout',
  NEW_NUTRITION: 'new_nutrition',
  WORKOUT_UPDATED: 'workout_updated',
  NUTRITION_UPDATED: 'nutrition_updated',
  CHAT_MESSAGE: 'chat_message'
};

// ============ CONFIGURAZIONE NOTIFICHE ============
const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.NEW_LEAD]: {
    title: '🎯 Nuovo Lead!',
    icon: '🎯',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.NEW_EVENT]: {
    title: '📅 Nuovo Evento',
    icon: '📅',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.NEW_ANAMNESI]: {
    title: '📋 Nuova Anamnesi',
    icon: '📋',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.NEW_CHECK]: {
    title: '✅ Nuovo Check',
    icon: '✅',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.CALL_REQUEST]: {
    title: '📞 Richiesta Chiamata',
    icon: '📞',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.NEW_CLIENT]: {
    title: '👤 Nuovo Cliente',
    icon: '👤',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.PAYMENT]: {
    title: '💰 Nuovo Pagamento',
    icon: '💰',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.EXPIRING]: {
    title: '⚠️ Scadenza',
    icon: '⚠️',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.MESSAGE]: {
    title: '💬 Nuovo Messaggio',
    icon: '💬',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.NEW_WORKOUT]: {
    title: '💪 Nuova Scheda Allenamento',
    icon: '💪',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.NEW_NUTRITION]: {
    title: '🍎 Nuovo Piano Alimentare',
    icon: '🍎',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.WORKOUT_UPDATED]: {
    title: '🔄 Scheda Allenamento Aggiornata',
    icon: '🔄',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.NUTRITION_UPDATED]: {
    title: '🔄 Piano Alimentare Aggiornato',
    icon: '🔄',
    defaultEnabled: true
  },
  [NOTIFICATION_TYPES.CHAT_MESSAGE]: {
    title: '💬 Messaggio dal Coach',
    icon: '💬',
    defaultEnabled: true
  }
};

// ============ VERIFICA PREFERENZE UTENTE ============
const getUserNotificationPreferences = async (userId) => {
  try {
    const userDoc = await getDoc(getTenantDoc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().notifications || {};
    }
    return {};
  } catch (error) {
    console.error('Errore recupero preferenze notifiche:', error);
    return {};
  }
};

// ============ CONTROLLA SE NOTIFICA ABILITATA ============
const isNotificationEnabled = (preferences, type) => {
  // Mappatura tipi notifica a chiavi preferenze utente
  const preferenceKeyMap = {
    [NOTIFICATION_TYPES.NEW_LEAD]: 'newLead',
    [NOTIFICATION_TYPES.NEW_EVENT]: 'newEvent',
    [NOTIFICATION_TYPES.NEW_ANAMNESI]: 'newAnamnesi',
    [NOTIFICATION_TYPES.NEW_CHECK]: 'newCheck',
    [NOTIFICATION_TYPES.CALL_REQUEST]: 'callRequest',
    [NOTIFICATION_TYPES.NEW_CLIENT]: 'newClient',
    [NOTIFICATION_TYPES.PAYMENT]: 'payments',
    [NOTIFICATION_TYPES.EXPIRING]: 'expiring',
    [NOTIFICATION_TYPES.MESSAGE]: 'message'
  };
  
  const key = preferenceKeyMap[type];
  
  // Se non c'è preferenza esplicita, usa il default
  if (preferences[key] === undefined) {
    return NOTIFICATION_CONFIG[type]?.defaultEnabled ?? true;
  }
  
  return preferences[key];
};

// ============ CREA NOTIFICA IN FIRESTORE ============
const createNotificationInFirestore = async (targetUserId, targetUserType, type, data) => {
  try {
    const config = NOTIFICATION_CONFIG[type];
    
    await addDoc(getTenantCollection(db, 'notifications'), {
      userId: targetUserId,
      userType: targetUserType,
      type: type,
      title: data.title || config.title,
      body: data.body,
      icon: config.icon,
      read: false,
      createdAt: serverTimestamp(),
      data: data.metadata || {}
    });
    
    return true;
  } catch (error) {
    console.error('Errore creazione notifica:', error);
    return false;
  }
};

// ============ INVIA NOTIFICA PUSH (BROWSER) ============
const sendBrowserNotification = async (title, body, _icon) => {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body,
          icon: '/PtPro/logo192.png',
          badge: '/PtPro/logo192.png',
          tag: `notification-${Date.now()}`
        });
      }
    } catch (error) {
      console.log('Browser notification non supportata:', error.message);
    }
  }
};

// ============ FUNZIONE PRINCIPALE INVIO NOTIFICA ============
export const sendNotification = async ({
  type,
  targetUserId,
  targetUserType = 'coach',
  title,
  body,
  metadata = {}
}) => {
  try {
    // Verifica preferenze utente
    const preferences = await getUserNotificationPreferences(targetUserId);
    
    if (!isNotificationEnabled(preferences, type)) {
      console.log(`Notifica ${type} disabilitata per utente ${targetUserId}`);
      return false;
    }
    
    // Crea notifica in Firestore
    const success = await createNotificationInFirestore(
      targetUserId,
      targetUserType,
      type,
      { title, body, metadata }
    );
    
    // Se l'utente target è quello corrente, mostra anche notifica browser
    if (auth.currentUser?.uid === targetUserId) {
      const config = NOTIFICATION_CONFIG[type];
      sendBrowserNotification(
        title || config.title,
        body,
        config.icon
      );
    }
    
    return success;
  } catch (error) {
    console.error('Errore invio notifica:', error);
    return false;
  }
};

// ============ FUNZIONI SPECIFICHE PER EVENTO ============

/**
 * Notifica nuovo lead
 */
export const notifyNewLead = async (leadData) => {
  const coachId = await getCoachId();
  if (!coachId) return;
  
  return sendNotification({
    type: NOTIFICATION_TYPES.NEW_LEAD,
    targetUserId: coachId,
    targetUserType: 'coach',
    title: '🎯 Nuovo Lead!',
    body: `${leadData.name || 'Nuovo contatto'} - ${leadData.source || 'Da landing page'}`,
    metadata: { leadId: leadData.id, name: leadData.name, phone: leadData.phone }
  });
};

/**
 * Notifica nuovo evento calendario
 */
export const notifyNewEvent = async (eventData, targetUserId, targetUserType = 'coach') => {
  return sendNotification({
    type: NOTIFICATION_TYPES.NEW_EVENT,
    targetUserId,
    targetUserType,
    title: '📅 Nuovo Evento',
    body: `${eventData.title || 'Evento'} - ${eventData.date} ${eventData.time || ''}`,
    metadata: { eventId: eventData.id, date: eventData.date, time: eventData.time }
  });
};

/**
 * Notifica nuova anamnesi
 */
export const notifyNewAnamnesi = async (anamnesiData, clientName, clientId) => {
  const coachId = await getCoachId();
  if (!coachId) return;
  
  return sendNotification({
    type: NOTIFICATION_TYPES.NEW_ANAMNESI,
    targetUserId: coachId,
    targetUserType: 'coach',
    title: '📋 Nuova Anamnesi',
    body: `${clientName} ha compilato una nuova anamnesi`,
    metadata: { clientId, anamnesiId: anamnesiData.id }
  });
};

/**
 * Notifica nuovo check
 */
export const notifyNewCheck = async (checkData, clientName, clientId) => {
  const coachId = await getCoachId();
  if (!coachId) return;
  
  return sendNotification({
    type: NOTIFICATION_TYPES.NEW_CHECK,
    targetUserId: coachId,
    targetUserType: 'coach',
    title: '✅ Nuovo Check',
    body: `${clientName} ha inviato un nuovo check`,
    metadata: { clientId, checkId: checkData.id }
  });
};

/**
 * Notifica richiesta chiamata
 */
export const notifyCallRequest = async (clientName, clientId) => {
  const coachId = await getCoachId();
  if (!coachId) return;
  
  return sendNotification({
    type: NOTIFICATION_TYPES.CALL_REQUEST,
    targetUserId: coachId,
    targetUserType: 'coach',
    title: '📞 Richiesta Chiamata',
    body: `${clientName} ha richiesto una chiamata`,
    metadata: { clientId }
  });
};

/**
 * Notifica nuovo cliente registrato
 */
export const notifyNewClient = async (clientData) => {
  const coachId = await getCoachId();
  if (!coachId) return;
  
  return sendNotification({
    type: NOTIFICATION_TYPES.NEW_CLIENT,
    targetUserId: coachId,
    targetUserType: 'coach',
    title: '👤 Nuovo Cliente!',
    body: `${clientData.name || clientData.email} si è registrato`,
    metadata: { clientId: clientData.id, name: clientData.name }
  });
};

/**
 * Notifica nuovo pagamento
 */
export const notifyPayment = async (paymentData, clientName) => {
  const coachId = await getCoachId();
  if (!coachId) return;
  
  return sendNotification({
    type: NOTIFICATION_TYPES.PAYMENT,
    targetUserId: coachId,
    targetUserType: 'coach',
    title: '💰 Pagamento Ricevuto!',
    body: `${clientName} - €${paymentData.amount}`,
    metadata: { paymentId: paymentData.id, amount: paymentData.amount }
  });
};

/**
 * Notifica scadenza imminente (per cliente)
 */
export const notifyExpiring = async (targetUserId, message) => {
  return sendNotification({
    type: NOTIFICATION_TYPES.EXPIRING,
    targetUserId,
    targetUserType: 'client',
    title: '⚠️ Scadenza Imminente',
    body: message,
    metadata: {}
  });
};

/**
 * Notifica nuova scheda allenamento assegnata
 */
export const notifyNewWorkout = async (clientId, clientName, schedaData) => {
  return sendNotification({
    type: NOTIFICATION_TYPES.NEW_WORKOUT,
    targetUserId: clientId,
    targetUserType: 'client',
    title: '💪 Nuova Scheda Allenamento!',
    body: `La tua nuova scheda "${schedaData.obiettivo || 'allenamento'}" è disponibile!`,
    metadata: { clientId, obiettivo: schedaData.obiettivo, durata: schedaData.durataSettimane }
  });
};

/**
 * Notifica scheda allenamento aggiornata
 */
export const notifyWorkoutUpdated = async (clientId, clientName, schedaData) => {
  return sendNotification({
    type: NOTIFICATION_TYPES.WORKOUT_UPDATED,
    targetUserId: clientId,
    targetUserType: 'client',
    title: '🔄 Scheda Allenamento Aggiornata!',
    body: `La tua scheda "${schedaData.obiettivo || 'allenamento'}" è stata modificata`,
    metadata: { clientId, obiettivo: schedaData.obiettivo }
  });
};

/**
 * Notifica nuovo piano alimentare
 */
export const notifyNewNutrition = async (clientId, clientName, pianoData) => {
  return sendNotification({
    type: NOTIFICATION_TYPES.NEW_NUTRITION,
    targetUserId: clientId,
    targetUserType: 'client',
    title: '🍎 Nuovo Piano Alimentare!',
    body: `Il tuo nuovo piano alimentare è disponibile!`,
    metadata: { clientId, calorie: pianoData.calorieGiornaliere }
  });
};

/**
 * Notifica piano alimentare aggiornato
 */
export const notifyNutritionUpdated = async (clientId, clientName, pianoData) => {
  return sendNotification({
    type: NOTIFICATION_TYPES.NUTRITION_UPDATED,
    targetUserId: clientId,
    targetUserType: 'client',
    title: '🔄 Piano Alimentare Aggiornato!',
    body: `Il tuo piano alimentare è stato modificato`,
    metadata: { clientId, calorie: pianoData.calorieGiornaliere }
  });
};

/**
 * Notifica nuovo messaggio in chat
 */
export const notifyChatMessage = async (recipientId, senderName, messagePreview) => {
  return sendNotification({
    type: NOTIFICATION_TYPES.CHAT_MESSAGE,
    targetUserId: recipientId,
    targetUserType: 'client', // o 'coach' a seconda del destinatario
    title: `💬 ${senderName}`,
    body: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
    metadata: { senderId: senderName }
  });
};

// ============ RICHIESTA PERMESSI NOTIFICHE ============
export const requestNotificationPermissionOnFirstLogin = async () => {
  // Controlla se già richiesto
  const permissionAsked = localStorage.getItem('notificationPermissionAsked');
  
  if (permissionAsked) {
    return Notification.permission;
  }
  
  // Segna come richiesto
  localStorage.setItem('notificationPermissionAsked', 'true');
  
  // Richiedi permesso
  if (typeof Notification !== 'undefined') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return 'denied';
};

// ============ VERIFICA SE PRIMO ACCESSO ============
export const isFirstLogin = async (userId) => {
  const key = `user_first_login_${userId}`;
  const seen = localStorage.getItem(key);
  
  if (!seen) {
    localStorage.setItem(key, 'true');
    return true;
  }
  
  return false;
};

// ============ INVIO BULK NOTIFICHE ============
/**
 * Invia notifica a multipli destinatari
 */
export const sendBulkNotification = async (clientIds, title, body, type = NOTIFICATION_TYPES.MESSAGE) => {
  try {
    const promises = clientIds.map(clientId => 
      sendNotification({
        type,
        targetUserId: clientId,
        targetUserType: 'client',
        title,
        body,
        metadata: { bulk: true, sentAt: new Date().toISOString() }
      })
    );

    await Promise.all(promises);
    
    // Salva nel registro bulk
    await addDoc(getTenantCollection(db, 'notifications'), {
      type: 'bulk',
      title,
      body,
      recipientCount: clientIds.length,
      recipientIds: clientIds,
      createdAt: serverTimestamp(),
      sentBy: auth.currentUser?.uid
    });

    return true;
  } catch (error) {
    console.error('Errore invio bulk notifiche:', error);
    throw error;
  }
};

/**
 * Ottieni storico notifiche
 */
export const getNotificationHistory = async (days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      getTenantCollection(db, 'notifications'),
      where('type', '==', 'bulk'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(notif => {
        const createdAt = notif.createdAt?.toDate?.();
        return createdAt && createdAt >= cutoffDate;
      });
  } catch (error) {
    console.error('Errore caricamento storico:', error);
    return [];
  }
};

/**
 * Notifica reminder check-in scaduto
 */
export const notifyCheckReminder = async (clientId, clientName, daysSinceLastCheck) => {
  return sendNotification({
    type: NOTIFICATION_TYPES.NEW_CHECK,
    targetUserId: clientId,
    targetUserType: 'client',
    title: '📊 È ora del check-in!',
    body: `Sono passati ${daysSinceLastCheck} giorni dall'ultimo check. Carica le tue foto e misurazioni!`,
    metadata: { daysSinceLastCheck, reminder: true }
  });
};

export default {
  NOTIFICATION_TYPES,
  sendNotification,
  notifyNewLead,
  notifyNewEvent,
  notifyNewAnamnesi,
  notifyNewCheck,
  notifyCallRequest,
  notifyNewClient,
  notifyPayment,
  notifyExpiring,
  notifyNewWorkout,
  notifyWorkoutUpdated,
  notifyNewNutrition,
  notifyNutritionUpdated,
  notifyChatMessage,
  sendBulkNotification,
  getNotificationHistory,
  notifyCheckReminder,
  requestNotificationPermissionOnFirstLogin,
  isFirstLogin
};
