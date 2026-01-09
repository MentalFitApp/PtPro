// src/services/smartNotifications.js
// Sistema Smart Notifications per reminder automatici clienti

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getTenantCollection, getTenantDoc, getTenantSubcollection, getCoachId } from '../config/tenant';

// ============ TIPI DI SMART NOTIFICATION ============
export const SMART_NOTIFICATION_TYPES = {
  // Reminder workout
  WORKOUT_REMINDER: 'workout_reminder',
  WORKOUT_STREAK_AT_RISK: 'workout_streak_at_risk',
  WORKOUT_STREAK_LOST: 'workout_streak_lost',
  
  // Achievement
  STREAK_MILESTONE: 'streak_milestone',
  WEIGHT_GOAL_PROGRESS: 'weight_goal_progress',
  WEIGHT_GOAL_REACHED: 'weight_goal_reached',
  
  // Check-in
  CHECKIN_REMINDER: 'checkin_reminder',
  CHECKIN_OVERDUE: 'checkin_overdue',
  
  // Motivational
  DAILY_MOTIVATION: 'daily_motivation',
  COMEBACK_REMINDER: 'comeback_reminder',
  
  // Coach interactions
  COACH_VIEWED_CHECK: 'coach_viewed_check',
  NEW_SCHEDULE_ASSIGNED: 'new_schedule_assigned',
  COACH_MESSAGE: 'coach_message'
};

// ============ CONFIGURAZIONE NOTIFICHE ============
export const SMART_NOTIFICATION_CONFIG = {
  [SMART_NOTIFICATION_TYPES.WORKOUT_REMINDER]: {
    title: '💪 Tempo di allenarsi!',
    icon: '💪',
    defaultEnabled: true,
    frequency: 'daily', // daily, weekly, custom
    defaultTime: '18:00'
  },
  [SMART_NOTIFICATION_TYPES.WORKOUT_STREAK_AT_RISK]: {
    title: '🔥 La tua streak è a rischio!',
    icon: '🔥',
    defaultEnabled: true,
    body: 'Non hai ancora fatto workout oggi. Non perdere la tua streak di {streak} giorni!'
  },
  [SMART_NOTIFICATION_TYPES.WORKOUT_STREAK_LOST]: {
    title: '😢 Streak interrotta',
    icon: '😢',
    defaultEnabled: true,
    body: 'La tua streak di {streak} giorni è finita. Ricomincia oggi!'
  },
  [SMART_NOTIFICATION_TYPES.STREAK_MILESTONE]: {
    title: '🏆 Traguardo raggiunto!',
    icon: '🏆',
    defaultEnabled: true,
    body: 'Incredibile! {streak} giorni di streak! Continua così!'
  },
  [SMART_NOTIFICATION_TYPES.WEIGHT_GOAL_PROGRESS]: {
    title: '📊 Progressi verso il tuo obiettivo!',
    icon: '📊',
    defaultEnabled: true,
    body: 'Sei a {progress}% del tuo obiettivo peso. Continua così!'
  },
  [SMART_NOTIFICATION_TYPES.WEIGHT_GOAL_REACHED]: {
    title: '🎉 Obiettivo raggiunto!',
    icon: '🎉',
    defaultEnabled: true,
    body: 'Ce l\'hai fatta! Hai raggiunto il tuo peso obiettivo!'
  },
  [SMART_NOTIFICATION_TYPES.CHECKIN_REMINDER]: {
    title: '📸 È ora del check settimanale!',
    icon: '📸',
    defaultEnabled: true,
    frequency: 'weekly',
    defaultDay: 'sunday' // giorno preferito per check
  },
  [SMART_NOTIFICATION_TYPES.CHECKIN_OVERDUE]: {
    title: '⏰ Check-in in ritardo',
    icon: '⏰',
    defaultEnabled: true,
    body: 'Sono passati {days} giorni dall\'ultimo check. Il tuo coach aspetta i tuoi progressi!'
  },
  [SMART_NOTIFICATION_TYPES.DAILY_MOTIVATION]: {
    title: '✨ Pensiero del giorno',
    icon: '✨',
    defaultEnabled: false, // opt-in
    frequency: 'daily'
  },
  [SMART_NOTIFICATION_TYPES.COMEBACK_REMINDER]: {
    title: '👋 Ci manchi!',
    icon: '👋',
    defaultEnabled: true,
    body: 'Non ti vediamo da un po\'. Torna a raggiungere i tuoi obiettivi!'
  }
};

// ============ FRASI MOTIVAZIONALI ============
const MOTIVATIONAL_QUOTES = [
  "Il successo è la somma di piccoli sforzi ripetuti giorno dopo giorno.",
  "Non devi essere perfetto per iniziare, ma devi iniziare per diventare perfetto.",
  "Il tuo corpo può fare quasi tutto. È la tua mente che devi convincere.",
  "Ogni allenamento ti porta un passo più vicino ai tuoi obiettivi.",
  "La disciplina è scegliere tra ciò che vuoi adesso e ciò che vuoi di più.",
  "Il dolore che senti oggi sarà la forza che sentirai domani.",
  "Non contare i giorni, fai che i giorni contino.",
  "Il fitness non è una destinazione, è uno stile di vita.",
  "Credi in te stesso e tutto diventa possibile.",
  "Ogni giorno è una nuova opportunità per migliorare."
];

// ============ PREFERENZE UTENTE ============
/**
 * Ottiene le preferenze di notifica smart dell'utente
 */
export const getSmartNotificationPreferences = async (userId) => {
  try {
    const prefsRef = getTenantDoc(db, 'smartNotificationPrefs', userId);
    const prefsSnap = await getDoc(prefsRef);
    
    if (prefsSnap.exists()) {
      return prefsSnap.data();
    }
    
    // Preferenze di default
    return {
      enabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '08:00',
      workoutReminderTime: '18:00',
      workoutReminderEnabled: true,
      streakAlertsEnabled: true,
      checkinReminderDay: 'sunday',
      checkinReminderEnabled: true,
      motivationalQuotesEnabled: false,
      comebackReminderEnabled: true
    };
  } catch (error) {
    // Errore silenzioso se permessi mancanti - usa default
    if (error.code !== 'permission-denied') {
      console.debug('Smart notifications prefs skipped:', error.message);
    }
    return {
      enabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '08:00',
      workoutReminderTime: '18:00',
      workoutReminderEnabled: true,
      streakAlertsEnabled: true,
      checkinReminderDay: 'sunday',
      checkinReminderEnabled: true,
      motivationalQuotesEnabled: false,
      comebackReminderEnabled: true
    };
  }
};

/**
 * Salva le preferenze di notifica smart dell'utente
 */
export const saveSmartNotificationPreferences = async (userId, preferences) => {
  try {
    const prefsRef = getTenantDoc(db, 'smartNotificationPrefs', userId);
    await setDoc(prefsRef, {
      ...preferences,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Errore salvataggio preferenze:', error);
    return false;
  }
};

// ============ LOGICA NOTIFICHE ============

/**
 * Verifica se è ora di quiet hours
 */
const isQuietHours = (preferences) => {
  if (!preferences?.quietHoursStart || !preferences?.quietHoursEnd) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = preferences.quietHoursStart.split(':').map(Number);
  const [endH, endM] = preferences.quietHoursEnd.split(':').map(Number);
  
  const quietStart = startH * 60 + startM;
  const quietEnd = endH * 60 + endM;
  
  // Gestisce caso che attraversa mezzanotte
  if (quietStart > quietEnd) {
    return currentTime >= quietStart || currentTime <= quietEnd;
  }
  
  return currentTime >= quietStart && currentTime <= quietEnd;
};

/**
 * Controlla la streak dell'utente e genera notifiche appropriate
 */
export const checkStreakStatus = async (userId) => {
  try {
    const clientRef = getTenantDoc(db, 'clients', userId);
    const clientSnap = await getDoc(clientRef);
    
    if (!clientSnap.exists()) return null;
    
    const client = clientSnap.data();
    const streak = client.workoutStreak || 0;
    const lastWorkoutDate = client.lastWorkoutDate?.toDate?.() || null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notifications = [];
    
    // Se ha una streak attiva
    if (streak > 0 && lastWorkoutDate) {
      const lastWorkout = new Date(lastWorkoutDate);
      lastWorkout.setHours(0, 0, 0, 0);
      
      const daysSinceLastWorkout = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
      
      // Streak a rischio (non ha fatto workout oggi, ma streak ancora valida)
      if (daysSinceLastWorkout === 1) {
        notifications.push({
          type: SMART_NOTIFICATION_TYPES.WORKOUT_STREAK_AT_RISK,
          data: { streak }
        });
      }
      
      // Streak persa (più di un giorno senza workout)
      if (daysSinceLastWorkout > 1) {
        notifications.push({
          type: SMART_NOTIFICATION_TYPES.WORKOUT_STREAK_LOST,
          data: { streak }
        });
      }
      
      // Milestone streak (7, 14, 21, 30, 50, 100 giorni)
      const milestones = [7, 14, 21, 30, 50, 100];
      if (milestones.includes(streak) && daysSinceLastWorkout === 0) {
        notifications.push({
          type: SMART_NOTIFICATION_TYPES.STREAK_MILESTONE,
          data: { streak }
        });
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Errore check streak:', error);
    return [];
  }
};

/**
 * Controlla se il cliente deve fare il check settimanale
 */
export const checkWeeklyCheckInStatus = async (userId) => {
  try {
    const checksRef = getTenantSubcollection(db, 'clients', userId, 'checks');
    const checksQuery = query(checksRef, orderBy('createdAt', 'desc'), limit(1));
    const checksSnap = await getDocs(checksQuery);
    
    if (checksSnap.empty) {
      // Mai fatto un check
      return {
        type: SMART_NOTIFICATION_TYPES.CHECKIN_REMINDER,
        data: { days: 0, firstCheck: true }
      };
    }
    
    const lastCheck = checksSnap.docs[0].data();
    const lastCheckDate = lastCheck.createdAt?.toDate?.() || new Date();
    const daysSinceCheck = Math.floor((new Date() - lastCheckDate) / (1000 * 60 * 60 * 24));
    
    // Reminder dopo 7 giorni
    if (daysSinceCheck >= 7 && daysSinceCheck < 10) {
      return {
        type: SMART_NOTIFICATION_TYPES.CHECKIN_REMINDER,
        data: { days: daysSinceCheck }
      };
    }
    
    // Check overdue dopo 10+ giorni
    if (daysSinceCheck >= 10) {
      return {
        type: SMART_NOTIFICATION_TYPES.CHECKIN_OVERDUE,
        data: { days: daysSinceCheck }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Errore check weekly status:', error);
    return null;
  }
};

/**
 * Genera una frase motivazionale random
 */
export const getDailyMotivation = () => {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return {
    type: SMART_NOTIFICATION_TYPES.DAILY_MOTIVATION,
    data: { quote: MOTIVATIONAL_QUOTES[index] }
  };
};

/**
 * Controlla progressi verso obiettivo peso
 */
export const checkWeightGoalProgress = async (userId) => {
  try {
    const clientRef = getTenantDoc(db, 'clients', userId);
    const clientSnap = await getDoc(clientRef);
    
    if (!clientSnap.exists()) return null;
    
    const client = clientSnap.data();
    const targetWeight = client.targetWeight;
    const startWeight = client.startWeight;
    const currentWeight = client.currentWeight || client.weight;
    
    if (!targetWeight || !startWeight || !currentWeight) return null;
    
    const totalChange = Math.abs(targetWeight - startWeight);
    const currentChange = Math.abs(currentWeight - startWeight);
    const progress = Math.round((currentChange / totalChange) * 100);
    
    // Notifica a 25%, 50%, 75%, 100%
    const milestones = [25, 50, 75];
    
    if (progress >= 100) {
      return {
        type: SMART_NOTIFICATION_TYPES.WEIGHT_GOAL_REACHED,
        data: { targetWeight, currentWeight }
      };
    }
    
    // Controlla se ha appena raggiunto un milestone
    for (const milestone of milestones) {
      if (progress >= milestone && progress < milestone + 5) {
        return {
          type: SMART_NOTIFICATION_TYPES.WEIGHT_GOAL_PROGRESS,
          data: { progress: milestone, targetWeight, currentWeight }
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Errore check weight goal:', error);
    return null;
  }
};

// ============ CREAZIONE NOTIFICA ============

/**
 * Crea una smart notification nel database
 * (verrà intercettata dalla Cloud Function per push)
 */
export const createSmartNotification = async (userId, type, customData = {}) => {
  try {
    const config = SMART_NOTIFICATION_CONFIG[type];
    if (!config) {
      console.error('Tipo notifica non valido:', type);
      return false;
    }
    
    // Verifica preferenze utente
    const prefs = await getSmartNotificationPreferences(userId);
    
    // Verifica quiet hours
    if (isQuietHours(prefs)) {
      console.log('Smart notification skipped: quiet hours');
      return false;
    }
    
    // Sostituisci placeholder nel body
    let body = config.body || '';
    Object.entries(customData).forEach(([key, value]) => {
      body = body.replace(`{${key}}`, value);
    });
    
    // Crea notifica
    const notificationRef = doc(getTenantCollection(db, 'notifications'));
    await setDoc(notificationRef, {
      userId,
      userType: 'client',
      type: type,
      title: config.title,
      body: body,
      icon: config.icon,
      read: false,
      isSmartNotification: true,
      data: customData,
      createdAt: serverTimestamp()
    });
    
    console.log(`Smart notification created: ${type} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Errore creazione smart notification:', error);
    return false;
  }
};

// ============ SCHEDULER (da chiamare periodicamente) ============

/**
 * Esegue il check delle smart notifications per un utente
 * Può essere chiamato periodicamente o al login dell'utente
 */
export const runSmartNotificationCheck = async (userId) => {
  try {
    const prefs = await getSmartNotificationPreferences(userId);
    
    // Se prefs è null (errore di permessi), salta il check
    if (!prefs?.enabled) {
      console.debug('Smart notifications disabled for user:', userId);
      return;
    }
    
    const notifications = [];
    
    // Check streak
    if (prefs.streakAlertsEnabled) {
      const streakNotifications = await checkStreakStatus(userId);
      if (streakNotifications?.length) {
        notifications.push(...streakNotifications);
      }
    }
    
    // Check weekly check-in
    if (prefs.checkinReminderEnabled) {
      const checkinNotification = await checkWeeklyCheckInStatus(userId);
      if (checkinNotification) {
        notifications.push(checkinNotification);
      }
    }
    
    // Check weight goal progress
    const weightNotification = await checkWeightGoalProgress(userId);
    if (weightNotification) {
      notifications.push(weightNotification);
    }
    
    // Daily motivation (se abilitato)
    if (prefs.motivationalQuotesEnabled) {
      // Solo una volta al giorno
      const lastMotivation = localStorage.getItem(`lastMotivation_${userId}`);
      const today = new Date().toDateString();
      
      if (lastMotivation !== today) {
        notifications.push(getDailyMotivation());
        localStorage.setItem(`lastMotivation_${userId}`, today);
      }
    }
    
    // Crea le notifiche
    for (const notification of notifications) {
      await createSmartNotification(userId, notification.type, notification.data);
    }
    
    return notifications;
  } catch (error) {
    console.error('Errore smart notification check:', error);
    return [];
  }
};

export default {
  SMART_NOTIFICATION_TYPES,
  SMART_NOTIFICATION_CONFIG,
  getSmartNotificationPreferences,
  saveSmartNotificationPreferences,
  checkStreakStatus,
  checkWeeklyCheckInStatus,
  getDailyMotivation,
  checkWeightGoalProgress,
  createSmartNotification,
  runSmartNotificationCheck
};
