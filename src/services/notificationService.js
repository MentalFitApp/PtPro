// src/services/notificationService.js
// Servizio centralizzato per notifiche push su eventi

import { addDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
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
  MESSAGE: 'message'
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
  requestNotificationPermissionOnFirstLogin,
  isFirstLogin
};
