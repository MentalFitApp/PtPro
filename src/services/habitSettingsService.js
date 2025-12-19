// src/services/habitSettingsService.js
// Servizio per gestire le impostazioni personalizzate delle abitudini

import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getTenantDoc } from '../config/tenant';

// Default habits configuration
export const DEFAULT_HABITS = [
  { id: 'water', label: 'Acqua', icon: 'Droplets', color: 'blue', target: 8, unit: 'bicchieri', editable: true },
  { id: 'sleep', label: 'Sonno', icon: 'Moon', color: 'indigo', target: 7, unit: 'ore', editable: true },
  { id: 'steps', label: 'Passi', icon: 'Footprints', color: 'green', target: 10000, unit: 'passi', editable: true },
  { id: 'workout', label: 'Allenamento', icon: 'Dumbbell', color: 'rose', target: 1, unit: 'sessione', editable: false },
  { id: 'healthy_meal', label: 'Pasti Sani', icon: 'Apple', color: 'emerald', target: 3, unit: 'pasti', editable: true },
];

// Default weekly workout goal
export const DEFAULT_WEEKLY_WORKOUT = {
  target: 3, // 3 allenamenti a settimana di default
  current: 0,
  weekStart: null, // data inizio settimana corrente
};

/**
 * Ottiene la data di inizio settimana (lunedì)
 */
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunedì = 1
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

/**
 * Ottiene le impostazioni delle abitudini del cliente
 */
export const getHabitSettings = async (clientId = null) => {
  const userId = clientId || auth.currentUser?.uid;
  if (!userId) return null;
  
  try {
    const clientDoc = await getDoc(getTenantDoc(db, 'clients', userId));
    if (clientDoc.exists()) {
      const data = clientDoc.data();
      return {
        habitTargets: data.habitTargets || {},
        customGoals: data.customGoals || [],
        weeklyWorkout: data.weeklyWorkout || { ...DEFAULT_WEEKLY_WORKOUT },
      };
    }
    return null;
  } catch (error) {
    console.error('Errore caricamento impostazioni abitudini:', error);
    return null;
  }
};

/**
 * Aggiorna il target di un'abitudine specifica
 */
export const updateHabitTarget = async (habitId, newTarget) => {
  if (!auth.currentUser) return false;
  
  // Verifica che l'abitudine sia editabile
  const habit = DEFAULT_HABITS.find(h => h.id === habitId);
  if (!habit || !habit.editable) {
    console.error('Abitudine non modificabile:', habitId);
    return false;
  }
  
  try {
    const clientRef = getTenantDoc(db, 'clients', auth.currentUser.uid);
    const clientDoc = await getDoc(clientRef);
    const currentTargets = clientDoc.exists() ? (clientDoc.data().habitTargets || {}) : {};
    
    await updateDoc(clientRef, {
      habitTargets: {
        ...currentTargets,
        [habitId]: newTarget
      },
      lastHabitSettingsUpdate: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Errore aggiornamento target abitudine:', error);
    return false;
  }
};

/**
 * Aggiunge un obiettivo personalizzato
 */
export const addCustomGoal = async (goal) => {
  if (!auth.currentUser) return null;
  
  const newGoal = {
    id: `custom_${Date.now()}`,
    label: goal.label,
    target: goal.target || 1,
    unit: goal.unit || 'volte',
    icon: goal.icon || 'Target',
    color: goal.color || 'purple',
    createdAt: new Date().toISOString(),
  };
  
  try {
    const clientRef = getTenantDoc(db, 'clients', auth.currentUser.uid);
    const clientDoc = await getDoc(clientRef);
    const currentGoals = clientDoc.exists() ? (clientDoc.data().customGoals || []) : [];
    
    await updateDoc(clientRef, {
      customGoals: [...currentGoals, newGoal],
      lastHabitSettingsUpdate: new Date().toISOString()
    });
    
    return newGoal;
  } catch (error) {
    console.error('Errore aggiunta obiettivo personalizzato:', error);
    return null;
  }
};

/**
 * Rimuove un obiettivo personalizzato
 */
export const removeCustomGoal = async (goalId) => {
  if (!auth.currentUser) return false;
  
  try {
    const clientRef = getTenantDoc(db, 'clients', auth.currentUser.uid);
    const clientDoc = await getDoc(clientRef);
    const currentGoals = clientDoc.exists() ? (clientDoc.data().customGoals || []) : [];
    
    await updateDoc(clientRef, {
      customGoals: currentGoals.filter(g => g.id !== goalId),
      lastHabitSettingsUpdate: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Errore rimozione obiettivo personalizzato:', error);
    return false;
  }
};

/**
 * Aggiorna il target settimanale di workout (admin o client)
 * Il client può modificarlo ma con minimo 2
 */
export const updateWeeklyWorkoutTarget = async (clientId, target, isClientUpdate = false) => {
  const userId = clientId || auth.currentUser?.uid;
  if (!userId) return false;
  
  // Se è il cliente che modifica, imponi minimo 2
  const finalTarget = isClientUpdate ? Math.max(2, target) : target;
  
  try {
    const clientRef = getTenantDoc(db, 'clients', userId);
    const clientDoc = await getDoc(clientRef);
    const currentWeekly = clientDoc.exists() ? (clientDoc.data().weeklyWorkout || {}) : {};
    
    await updateDoc(clientRef, {
      weeklyWorkout: {
        ...currentWeekly,
        target: finalTarget,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid
      }
    });
    
    return true;
  } catch (error) {
    console.error('Errore aggiornamento obiettivo settimanale:', error);
    return false;
  }
};

/**
 * Calcola i workout completati nella settimana corrente
 */
export const calculateWeeklyWorkouts = (habits, workoutLog) => {
  const weekStart = getWeekStart();
  let count = 0;
  
  // Conta i giorni da lunedì a oggi
  const today = new Date();
  const startDate = new Date(weekStart);
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayHabits = habits?.[dateStr] || {};
    const wLog = workoutLog?.[dateStr];
    
    if (dayHabits.workout >= 1 || wLog?.completed) {
      count++;
    }
  }
  
  return count;
};

/**
 * Registra un allenamento completato e aggiorna il counter settimanale
 */
export const recordWorkoutCompleted = async () => {
  if (!auth.currentUser) return false;
  
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart();
  
  try {
    const clientRef = getTenantDoc(db, 'clients', auth.currentUser.uid);
    const clientDoc = await getDoc(clientRef);
    const data = clientDoc.exists() ? clientDoc.data() : {};
    
    const habits = data.habits || {};
    const workoutLog = data.workoutLog || {};
    const weeklyWorkout = data.weeklyWorkout || { ...DEFAULT_WEEKLY_WORKOUT };
    
    // Se siamo in una nuova settimana, resetta il counter
    if (weeklyWorkout.weekStart !== weekStart) {
      weeklyWorkout.weekStart = weekStart;
      weeklyWorkout.current = 0;
    }
    
    // Aggiorna habits per oggi
    const todayHabits = habits[today] || {};
    todayHabits.workout = 1;
    
    // Ricalcola workout settimana corrente
    weeklyWorkout.current = calculateWeeklyWorkouts(
      { ...habits, [today]: todayHabits },
      workoutLog
    );
    
    await updateDoc(clientRef, {
      habits: {
        ...habits,
        [today]: todayHabits
      },
      weeklyWorkout: weeklyWorkout,
      lastHabitUpdate: new Date().toISOString()
    });
    
    return weeklyWorkout;
  } catch (error) {
    console.error('Errore registrazione workout:', error);
    return false;
  }
};

/**
 * Ottiene la configurazione completa delle abitudini (default + personalizzate)
 */
export const getFullHabitsConfig = (habitTargets = {}, customGoals = []) => {
  // Applica i target personalizzati alle abitudini default
  const habits = DEFAULT_HABITS.map(habit => ({
    ...habit,
    target: habitTargets[habit.id] ?? habit.target,
  }));
  
  // Aggiungi gli obiettivi custom
  const customHabits = customGoals.map(goal => ({
    ...goal,
    isCustom: true,
    editable: true, // Gli obiettivi custom sono sempre modificabili
  }));
  
  return [...habits, ...customHabits];
};

export default {
  DEFAULT_HABITS,
  DEFAULT_WEEKLY_WORKOUT,
  getWeekStart,
  getHabitSettings,
  updateHabitTarget,
  addCustomGoal,
  removeCustomGoal,
  updateWeeklyWorkoutTarget,
  calculateWeeklyWorkouts,
  recordWorkoutCompleted,
  getFullHabitsConfig,
};
