import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { 
  Droplets, Moon, Footprints, Dumbbell, Apple, 
  Check, TrendingUp, Calendar, Award 
} from 'lucide-react';

/**
 * Habit Tracker - Traccia abitudini quotidiane oltre all'allenamento
 */
export default function HabitTracker() {
  const [habits, setHabits] = useState({});
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHistory, setShowHistory] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const viewingDate = selectedDate.toISOString().split('T')[0];
  const isToday = viewingDate === today;

  // Abitudini predefinite
  const defaultHabits = [
    { id: 'water', label: 'Acqua (2L)', icon: Droplets, color: 'blue', target: 8, unit: 'bicchieri' },
    { id: 'sleep', label: 'Sonno (7h+)', icon: Moon, color: 'indigo', target: 7, unit: 'ore' },
    { id: 'steps', label: 'Passi (10k)', icon: Footprints, color: 'green', target: 10000, unit: 'passi' },
    { id: 'workout', label: 'Allenamento', icon: Dumbbell, color: 'rose', target: 1, unit: 'sessione' },
    { id: 'healthy_meal', label: 'Pasti Sani', icon: Apple, color: 'emerald', target: 3, unit: 'pasti' },
  ];

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    if (!auth.currentUser) return;
    
    try {
      const habitsDoc = await getDoc(getTenantDoc(db, 'clients', auth.currentUser.uid));
      if (habitsDoc.exists()) {
        const data = habitsDoc.data();
        setHabits(data.habits || {});
        calculateStreaks(data.habits || {});
      }
      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento abitudini:', error);
      setLoading(false);
    }
  };

  const calculateStreaks = (habitsData) => {
    const streaks = {};
    
    defaultHabits.forEach(habit => {
      let currentStreak = 0;
      let checkDate = new Date();
      
      // Conta giorni consecutivi all'indietro
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
    // Non permettere date future
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const toggleHabit = async (habitId) => {
    if (!auth.currentUser || !isToday) return; // Può modificare solo oggi

    try {
      const todayHabits = habits[today] || {};
      const habit = defaultHabits.find(h => h.id === habitId);
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

      await updateDoc(getTenantDoc(db, 'clients', auth.currentUser.uid), {
        habits: updatedHabits,
        lastHabitUpdate: new Date().toISOString()
      });

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
    if (!auth.currentUser || !isToday) return; // Può modificare solo oggi

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

      await updateDoc(getTenantDoc(db, 'clients', auth.currentUser.uid), {
        habits: updatedHabits,
        lastHabitUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Errore aggiornamento valore:', error);
    }
  };

  const celebrateStreak = (habitLabel, days) => {
    // Trigger celebration (implementato in CelebrationMoments)
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

  const getCompletionForDate = (dateStr) => {
    const dayHabits = habits[dateStr] || {};
    const completed = defaultHabits.filter(h => 
      (dayHabits[h.id] || 0) >= h.target
    ).length;
    return Math.round((completed / defaultHabits.length) * 100);
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
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
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
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="text-blue-400" size={24} />
            Abitudini Quotidiane
          </h2>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
        >
          {showHistory ? 'Nascondi Storico' : 'Mostra Storico'}
        </button>
      </div>

      {/* Date Slider */}
      <div className="bg-slate-900/40 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title="Giorno precedente"
          >
            ←
          </button>
          
          <div className="text-center flex-1 mx-4">
            <div className="text-lg font-bold text-slate-100">
              {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
              >
                Torna a oggi →
              </button>
            )}
          </div>
          
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={`p-2 rounded-lg transition-colors ${
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
          <span className="text-sm text-slate-400">Completamento</span>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-blue-400">{completionRate}%</div>
            {!isToday && (
              <span className="text-xs text-slate-500 italic">(storico)</span>
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
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 text-center">
          <p className="text-sm text-amber-300">
            📅 Stai visualizzando dati storici. Per modificare le abitudini torna a oggi.
          </p>
        </div>
      )}

      {/* Habits list */}
      <div className="space-y-3">
        {defaultHabits.map(habit => {
          const Icon = habit.icon;
          const currentValue = viewingHabits[habit.id] || 0;
          const isCompleted = currentValue >= habit.target;
          const progress = Math.min((currentValue / habit.target) * 100, 100);
          const habitStreak = streak[habit.id] || 0;

          return (
            <div 
              key={habit.id}
              className={`relative p-4 rounded-lg border transition-all ${
                isCompleted 
                  ? `bg-${habit.color}-500/10 border-${habit.color}-500/30` 
                  : 'bg-slate-900/40 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isCompleted
                        ? `bg-${habit.color}-500 text-white`
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                  </button>
                  <div>
                    <h3 className="font-medium text-slate-100">{habit.label}</h3>
                    <p className="text-xs text-slate-400">
                      {currentValue} / {habit.target} {habit.unit}
                    </p>
                  </div>
                </div>

                {habitStreak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Award size={16} />
                    <span className="text-sm font-bold">{habitStreak}🔥</span>
                  </div>
                )}
              </div>

              {/* Progress bar per abitudine */}
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${habit.color}-500 transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Quick increment buttons - solo per oggi */}
              {isToday && !isCompleted && habit.id !== 'workout' && (
                <div className="flex gap-2 mt-2">
                  {[1, habit.target / 2, habit.target].filter(v => v > 0 && v <= habit.target).map(increment => (
                    <button
                      key={increment}
                      onClick={() => updateHabitValue(habit.id, Math.min(currentValue + increment, habit.target))}
                      className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
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
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-emerald-400 font-semibold">
            Giornata Perfetta Completata!
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Hai completato tutte le tue abitudini oggi!
          </p>
        </div>
      )}
    </div>
  );
}
