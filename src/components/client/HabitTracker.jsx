import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { 
  Droplets, Moon, Footprints, Dumbbell, Apple, Target, Star,
  Check, TrendingUp, Calendar, Award, Settings, Plus, X, 
  ChevronDown, ChevronUp, Edit3, Trash2
} from 'lucide-react';
import {
  DEFAULT_HABITS,
  DEFAULT_WEEKLY_WORKOUT,
  getWeekStart,
  calculateWeeklyWorkouts,
  getFullHabitsConfig,
  addCustomGoal,
  removeCustomGoal,
  updateHabitTarget,
  updateWeeklyWorkoutTarget
} from '../../services/habitSettingsService';

// Mappa icone per rendering dinamico
const ICON_MAP = {
  Droplets, Moon, Footprints, Dumbbell, Apple, Target, Star
};

/**
 * Habit Tracker - Traccia abitudini quotidiane con personalizzazione
 * - Target personalizzabili (escluso workout)
 * - Obiettivi custom aggiungibili
 * - Workout con counter settimanale
 */
export default function HabitTracker() {
  const [habits, setHabits] = useState({});
  const [habitTargets, setHabitTargets] = useState({});
  const [customGoals, setCustomGoals] = useState([]);
  const [weeklyWorkout, setWeeklyWorkout] = useState(DEFAULT_WEEKLY_WORKOUT);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editingWorkoutTarget, setEditingWorkoutTarget] = useState(false);
  const [newGoal, setNewGoal] = useState({ label: '', target: 1, unit: 'volte' });

  const today = new Date().toISOString().split('T')[0];
  const viewingDate = selectedDate.toISOString().split('T')[0];
  const isToday = viewingDate === today;

  // Combina abitudini default + personalizzate
  const allHabits = getFullHabitsConfig(habitTargets, customGoals);
  
  // Separa workout dalle altre abitudini per visualizzazione speciale
  const regularHabits = allHabits.filter(h => h.id !== 'workout');
  const workoutHabit = allHabits.find(h => h.id === 'workout');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    if (!auth.currentUser) return;
    
    try {
      const clientDoc = await getDoc(getTenantDoc(db, 'clients', auth.currentUser.uid));
      if (clientDoc.exists()) {
        const data = clientDoc.data();
        setHabits(data.habits || {});
        setHabitTargets(data.habitTargets || {});
        setCustomGoals(data.customGoals || []);
        
        // Carica weekly workout e verifica/resetta settimana
        const weekStart = getWeekStart();
        let weekly = data.weeklyWorkout || { ...DEFAULT_WEEKLY_WORKOUT };
        
        if (weekly.weekStart !== weekStart) {
          // Nuova settimana, ricalcola
          weekly = {
            ...weekly,
            weekStart: weekStart,
            current: calculateWeeklyWorkouts(data.habits || {}, data.workoutLog || {})
          };
        }
        setWeeklyWorkout(weekly);
        
        calculateStreaks(data.habits || {}, data.habitTargets || {}, data.customGoals || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento abitudini:', error);
      setLoading(false);
    }
  };

  const calculateStreaks = (habitsData, targets = habitTargets, goals = customGoals) => {
    const streaks = {};
    const habitsConfig = getFullHabitsConfig(targets, goals);
    
    habitsConfig.forEach(habit => {
      let currentStreak = 0;
      let checkDate = new Date();
      
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayData = habitsData[dateStr];
        
        if (dayData && dayData[habit.id] >= habit.target) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      streaks[habit.id] = currentStreak;
    });
    
    setStreak(streaks);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const toggleHabit = async (habitId) => {
    if (!auth.currentUser || !isToday) return;

    try {
      const todayHabits = habits[today] || {};
      const habit = allHabits.find(h => h.id === habitId);
      const currentValue = todayHabits[habitId] || 0;
      const newValue = currentValue >= habit.target ? 0 : habit.target;

      const updatedHabits = {
        ...habits,
        [today]: {
          ...todayHabits,
          [habitId]: newValue
        }
      };

      setHabits(updatedHabits);
      calculateStreaks(updatedHabits);

      // Se è workout, aggiorna anche il counter settimanale
      const updateData = {
        habits: updatedHabits,
        lastHabitUpdate: new Date().toISOString()
      };

      if (habitId === 'workout') {
        const newCurrent = calculateWeeklyWorkouts(updatedHabits, {});
        const newWeekly = {
          ...weeklyWorkout,
          current: newCurrent,
          weekStart: getWeekStart()
        };
        setWeeklyWorkout(newWeekly);
        updateData.weeklyWorkout = newWeekly;
      }

      await updateDoc(getTenantDoc(db, 'clients', auth.currentUser.uid), updateData);

      // Celebration per streak milestone
      const newStreak = streak[habitId] + (newValue >= habit.target ? 1 : 0);
      if ([7, 30, 100].includes(newStreak)) {
        celebrateStreak(habit.label, newStreak);
      }
    } catch (error) {
      console.error('Errore aggiornamento abitudine:', error);
    }
  };

  const updateHabitValue = async (habitId, value) => {
    if (!auth.currentUser || !isToday) return;

    try {
      const todayHabits = habits[today] || {};
      const updatedHabits = {
        ...habits,
        [today]: {
          ...todayHabits,
          [habitId]: value
        }
      };

      setHabits(updatedHabits);
      calculateStreaks(updatedHabits);

      // Se è workout, aggiorna anche il counter settimanale
      const updateData = {
        habits: updatedHabits,
        lastHabitUpdate: new Date().toISOString()
      };

      if (habitId === 'workout') {
        const newCurrent = calculateWeeklyWorkouts(updatedHabits, {});
        const newWeekly = {
          ...weeklyWorkout,
          current: newCurrent,
          weekStart: getWeekStart()
        };
        setWeeklyWorkout(newWeekly);
        updateData.weeklyWorkout = newWeekly;
      }

      await updateDoc(getTenantDoc(db, 'clients', auth.currentUser.uid), updateData);
    } catch (error) {
      console.error('Errore aggiornamento valore:', error);
    }
  };

  const celebrateStreak = (habitLabel, days) => {
    const event = new CustomEvent('celebration', {
      detail: {
        type: 'streak',
        title: `${days} Giorni di Fila! 🔥`,
        message: `Hai mantenuto l'abitudine "${habitLabel}" per ${days} giorni consecutivi!`,
        emoji: days >= 100 ? '💯' : days >= 30 ? '🏆' : '🎉'
      }
    });
    window.dispatchEvent(event);
  };

  const handleUpdateTarget = async (habitId, newTarget) => {
    const success = await updateHabitTarget(habitId, newTarget);
    if (success) {
      setHabitTargets(prev => ({ ...prev, [habitId]: newTarget }));
      calculateStreaks(habits, { ...habitTargets, [habitId]: newTarget }, customGoals);
      setEditingHabit(null);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.label.trim()) return;
    
    const goal = await addCustomGoal(newGoal);
    if (goal) {
      setCustomGoals(prev => [...prev, goal]);
      setNewGoal({ label: '', target: 1, unit: 'volte' });
      setShowAddGoal(false);
    }
  };

  const handleRemoveGoal = async (goalId) => {
    const success = await removeCustomGoal(goalId);
    if (success) {
      setCustomGoals(prev => prev.filter(g => g.id !== goalId));
    }
  };

  const getCompletionForDate = (dateStr) => {
    const dayHabits = habits[dateStr] || {};
    const completed = allHabits.filter(h => 
      (dayHabits[h.id] || 0) >= h.target
    ).length;
    return Math.round((completed / allHabits.length) * 100);
  };

  const getLast7DaysCompletion = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        day: date.toLocaleDateString('it-IT', { weekday: 'short' }),
        completion: getCompletionForDate(dateStr)
      });
    }
    return days;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 shadow-glow">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const viewingHabits = habits[viewingDate] || {};
  const completionRate = getCompletionForDate(viewingDate);
  const last7Days = getLast7DaysCompletion();

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-2 sm:p-4 space-y-2 sm:space-y-4 shadow-glow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs sm:text-base font-bold text-slate-100 flex items-center gap-1 sm:gap-2">
            <Calendar className="text-blue-400" size={14} />
            Abitudini
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
            title="Impostazioni"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            {showHistory ? 'Nascondi' : 'Storico'}
          </button>
        </div>
      </div>

      {/* Weekly Workout Progress - Mostra sempre in alto */}
      {workoutHabit && (
        <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/30 rounded-lg p-2 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="text-rose-400" size={16} />
              <span className="font-semibold text-slate-100 text-sm sm:text-base">Workout Settimana</span>
            </div>
            {editingWorkoutTarget ? (
              <div className="flex items-center gap-2">
                <select
                  defaultValue={weeklyWorkout.target}
                  onChange={async (e) => {
                    const newTarget = parseInt(e.target.value);
                    const success = await updateWeeklyWorkoutTarget(null, newTarget, true);
                    if (success) {
                      setWeeklyWorkout(prev => ({ ...prev, target: newTarget }));
                    }
                    setEditingWorkoutTarget(false);
                  }}
                  className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-100"
                  autoFocus
                >
                  {[2, 3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}/settimana</option>
                  ))}
                </select>
                <button
                  onClick={() => setEditingWorkoutTarget(false)}
                  className="p-1 text-slate-400 hover:text-slate-300"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingWorkoutTarget(true)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
              >
                Obiettivo: {weeklyWorkout.target}/settimana
                <Edit3 size={12} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex justify-between text-xs sm:text-sm mb-0.5">
                <span className="text-slate-400">Progresso</span>
                <span className={`font-bold ${
                  weeklyWorkout.current >= weeklyWorkout.target ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {weeklyWorkout.current} / {weeklyWorkout.target}
                </span>
              </div>
              <div className="h-2 sm:h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    weeklyWorkout.current >= weeklyWorkout.target 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                      : 'bg-gradient-to-r from-rose-500 to-orange-400'
                  }`}
                  style={{ width: `${Math.min((weeklyWorkout.current / weeklyWorkout.target) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Quick toggle per oggi */}
            {isToday && (
              <button
                onClick={() => toggleHabit('workout')}
                className={`px-2 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                  (viewingHabits.workout || 0) >= 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                }`}
              >
                {(viewingHabits.workout || 0) >= 1 ? '✓' : 'Oggi?'}
              </button>
            )}
          </div>
          
          {weeklyWorkout.current >= weeklyWorkout.target && (
            <div className="mt-1 text-center text-xs text-emerald-400 font-medium">
              🎉 Obiettivo raggiunto!
            </div>
          )}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-slate-900/60 border border-slate-600 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Settings size={16} className="text-blue-400" />
              Personalizza Target
            </h3>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <Plus size={12} />
              Aggiungi Obiettivo
            </button>
          </div>
          
          {/* Lista target modificabili */}
          <div className="space-y-2">
            {regularHabits.map(habit => {
              const isEditing = editingHabit === habit.id;
              const Icon = ICON_MAP[habit.icon] || Target;
              
              return (
                <div key={habit.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={`text-${habit.color}-400`} />
                    <span className="text-sm text-slate-300">{habit.label}</span>
                    {habit.isCustom && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          min="1"
                          defaultValue={habit.target}
                          className="w-20 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-100"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateTarget(habit.id, parseInt(e.target.value));
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => setEditingHabit(null)}
                          className="p-1 text-slate-400 hover:text-slate-300"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-slate-400">
                          {habit.target} {habit.unit}
                        </span>
                        {habit.editable && (
                          <button
                            onClick={() => setEditingHabit(habit.id)}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {habit.isCustom && (
                          <button
                            onClick={() => handleRemoveGoal(habit.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Nota workout modificabile */}
          <div className="text-xs text-slate-500 italic flex items-center gap-1">
            <Dumbbell size={12} />
            L'obiettivo allenamenti settimanali può essere modificato (minimo 2)
          </div>

          {/* Add Goal Form */}
          {showAddGoal && (
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <h4 className="text-sm font-medium text-slate-200">Nuovo Obiettivo Personale</h4>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nome obiettivo"
                  value={newGoal.label}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, label: e.target.value }))}
                  className="col-span-3 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500"
                />
                <input
                  type="number"
                  min="1"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100"
                  placeholder="Target"
                />
                <input
                  type="text"
                  placeholder="Unità (es. volte)"
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                  className="col-span-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddGoal}
                  disabled={!newGoal.label.trim()}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Aggiungi
                </button>
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date Slider */}
      <div className="bg-slate-900/40 rounded-lg p-2">
        <div className="flex items-center justify-between mb-1.5">
          <button
            onClick={() => changeDate(-1)}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
            title="Giorno precedente"
          >
            ←
          </button>
          
          <div className="text-center flex-1 mx-2">
            <div className="text-sm sm:text-base font-bold text-slate-100">
              {selectedDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-[10px] text-blue-400 hover:text-blue-300"
              >
                Oggi →
              </button>
            )}
          </div>
          
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={`p-1.5 rounded-lg transition-colors text-sm ${
              isToday 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
            title="Giorno successivo"
          >
            →
          </button>
        </div>

        {/* Completion Rate */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Completamento</span>
          <div className="flex items-center gap-1">
            <div className="text-lg sm:text-2xl font-bold text-blue-400">{completionRate}%</div>
            {!isToday && (
              <span className="text-[10px] text-slate-500">(storico)</span>
            )}
          </div>
        </div>
      </div>

      {/* Last 7 Days History */}
      {showHistory && (
        <div className="bg-slate-900/40 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-400 mb-3">Ultimi 7 giorni</p>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(new Date(day.date))}
                className={`text-center p-2 rounded-lg transition-all ${
                  day.date === viewingDate
                    ? 'bg-blue-500 text-white ring-2 ring-blue-400'
                    : day.completion === 100
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : day.completion >= 60
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                <div className="text-xs mb-1">{day.day}</div>
                <div className="text-lg font-bold">{day.completion}%</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isToday && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center">
          <p className="text-xs text-amber-300">
            📅 Dati storici - torna a oggi per modificare
          </p>
        </div>
      )}

      {/* Habits list (escluso workout che è in alto) */}
      <div className="space-y-1.5 sm:space-y-3">
        {regularHabits.map(habit => {
          const Icon = ICON_MAP[habit.icon] || Target;
          const currentValue = viewingHabits[habit.id] || 0;
          const isCompleted = currentValue >= habit.target;
          const progress = Math.min((currentValue / habit.target) * 100, 100);
          const habitStreak = streak[habit.id] || 0;

          return (
            <div 
              key={habit.id}
              className={`relative p-2 sm:p-4 rounded-lg border transition-all ${
                isCompleted 
                  ? `bg-${habit.color}-500/10 border-${habit.color}-500/30` 
                  : 'bg-slate-900/40 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    disabled={!isToday}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
                      isCompleted
                        ? `bg-${habit.color}-500 text-white`
                        : isToday
                        ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                  </button>
                  <div>
                    <h3 className="font-medium text-slate-100 text-sm flex items-center gap-1">
                      {habit.label}
                      {habit.isCustom && (
                        <Star size={10} className="text-purple-400" />
                      )}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400">
                      {currentValue}/{habit.target} {habit.unit}
                    </p>
                  </div>
                </div>

                {habitStreak > 0 && (
                  <div className="flex items-center gap-0.5 text-orange-400">
                    <span className="text-xs font-bold">{habitStreak}🔥</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${habit.color}-500 transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Quick increment buttons - solo per oggi */}
              {isToday && !isCompleted && (
                <div className="flex gap-1.5 mt-1.5">
                  {[1, Math.floor(habit.target / 2), habit.target].filter((v, i, arr) => 
                    v > 0 && v <= habit.target && arr.indexOf(v) === i
                  ).map(increment => (
                    <button
                      key={increment}
                      onClick={() => updateHabitValue(habit.id, Math.min(currentValue + increment, habit.target))}
                      className="text-[10px] px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                    >
                      +{increment}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Daily motivation */}
      {isToday && completionRate === 100 && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-2 text-center">
          <p className="text-emerald-400 font-semibold text-sm">
            🎉 Giornata Perfetta!
          </p>
        </div>
      )}
    </div>
  );
}
