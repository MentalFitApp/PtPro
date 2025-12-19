// src/components/admin/ClientHabitsOverview.jsx
// Vista panoramica delle abitudini del cliente per Admin/Coach
import React, { useMemo, useState } from 'react';
import { Droplets, Moon, Footprints, Dumbbell, Apple, Target, Star, TrendingUp, Check, X, Flame, ChevronLeft, ChevronRight, Settings, Edit3, Save } from 'lucide-react';
import { UnifiedCard, CardHeaderSimple, CardContent } from '../ui/UnifiedCard';
import { 
  DEFAULT_HABITS, 
  DEFAULT_WEEKLY_WORKOUT, 
  getWeekStart, 
  calculateWeeklyWorkouts,
  getFullHabitsConfig,
  updateWeeklyWorkoutTarget
} from '../../services/habitSettingsService';

// Mappa icone per rendering dinamico
const ICON_MAP = {
  Droplets, Moon, Footprints, Dumbbell, Apple, Target, Star
};

const colorClasses = {
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
};

/**
 * ClientHabitsOverview - Panoramica settimanale delle abitudini
 * Con supporto per target personalizzati e obiettivi custom
 * @param {Object} client - Dati del cliente (deve avere .habits, .workoutLog, .habitTargets, .customGoals, .weeklyWorkout)
 * @param {Function} onOpenCalendar - Callback per aprire il calendario workout
 */
export default function ClientHabitsOverview({ client, onOpenCalendar }) {
  const habits = client?.habits || {};
  const workoutLog = client?.workoutLog || {};
  const habitTargets = client?.habitTargets || {};
  const customGoals = client?.customGoals || [];
  const weeklyWorkout = client?.weeklyWorkout || { ...DEFAULT_WEEKLY_WORKOUT };
  
  const [showWorkoutSettings, setShowWorkoutSettings] = useState(false);
  const [newWorkoutTarget, setNewWorkoutTarget] = useState(weeklyWorkout.target);
  const [savingTarget, setSavingTarget] = useState(false);

  // Ottieni configurazione completa abitudini (default + custom del cliente)
  const HABITS_CONFIG = useMemo(() => {
    return getFullHabitsConfig(habitTargets, customGoals);
  }, [habitTargets, customGoals]);

  // Genera ultimi 7 giorni
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('it-IT', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  // Calcola completamento per ogni habit/giorno
  const getHabitStatus = (habitId, dateStr, target) => {
    const dayHabits = habits[dateStr] || {};
    const value = dayHabits[habitId] || 0;
    
    // Per workout, controlla anche workoutLog
    if (habitId === 'workout') {
      const wLog = workoutLog[dateStr];
      if (wLog?.completed === true || value >= target) {
        return 'completed';
      }
    }
    
    if (value >= target) return 'completed';
    if (value > 0) return 'partial';
    return 'none';
  };

  // Calcola workout settimanale corrente
  const weeklyWorkoutCurrent = useMemo(() => {
    return calculateWeeklyWorkouts(habits, workoutLog);
  }, [habits, workoutLog]);

  // Calcola statistiche generali
  const stats = useMemo(() => {
    let totalCompleted = 0;
    let totalPossible = 0;
    let workoutDays = 0;
    
    last7Days.forEach(day => {
      HABITS_CONFIG.forEach(habit => {
        totalPossible++;
        const status = getHabitStatus(habit.id, day.date, habit.target);
        if (status === 'completed') totalCompleted++;
        if (habit.id === 'workout' && status === 'completed') workoutDays++;
      });
    });
    
    // Calcola streak workout
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayHabits = habits[dateStr] || {};
      const wLog = workoutLog[dateStr];
      
      if (dayHabits.workout >= 1 || wLog?.completed) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      completionRate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      workoutDays,
      streak,
    };
  }, [habits, workoutLog, last7Days, HABITS_CONFIG]);

  // Salva nuovo target workout
  const handleSaveWorkoutTarget = async () => {
    if (!client?.id || newWorkoutTarget < 1) return;
    
    setSavingTarget(true);
    try {
      await updateWeeklyWorkoutTarget(client.id, newWorkoutTarget);
      setShowWorkoutSettings(false);
      // Il componente padre dovrebbe ricaricare i dati
    } catch (error) {
      console.error('Errore salvataggio target:', error);
    }
    setSavingTarget(false);
  };

  const StatusCell = ({ status }) => {
    if (status === 'completed') {
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center">
          <Check size={12} className="text-emerald-400" />
        </div>
      );
    }
    if (status === 'partial') {
      return (
        <div className="w-6 h-6 rounded-full bg-yellow-500/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center">
        <X size={10} className="text-slate-500" />
      </div>
    );
  };

  return (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Abitudini Settimanali"
        subtitle="Ultimi 7 giorni"
        action={
          <div className="flex items-center gap-3">
            {stats.streak > 0 && (
              <button 
                onClick={onOpenCalendar}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs hover:bg-orange-500/30 transition-colors"
              >
                <Flame size={12} />
                {stats.streak} giorni streak
              </button>
            )}
            <div className="text-sm text-slate-400">
              {stats.completionRate}% completato
            </div>
          </div>
        }
      />
      <CardContent>
        {/* Weekly Workout Progress - Nuova sezione prominente */}
        <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="text-rose-400" size={20} />
              <span className="font-semibold text-slate-100">Obiettivo Allenamenti Settimanali</span>
            </div>
            <button
              onClick={() => setShowWorkoutSettings(!showWorkoutSettings)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded hover:bg-slate-600/50 transition-colors"
            >
              <Settings size={12} />
              Modifica
            </button>
          </div>
          
          {showWorkoutSettings ? (
            <div className="bg-slate-800/50 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-300">Allenamenti/settimana:</label>
                <select
                  value={newWorkoutTarget}
                  onChange={(e) => setNewWorkoutTarget(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'allenamento' : 'allenamenti'}</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveWorkoutTarget}
                  disabled={savingTarget}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white rounded text-sm transition-colors"
                >
                  <Save size={14} />
                  {savingTarget ? 'Salvo...' : 'Salva'}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Questo obiettivo è visibile al cliente ma non può essere modificato da lui.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Progresso questa settimana</span>
                <span className={`font-bold ${
                  weeklyWorkoutCurrent >= weeklyWorkout.target ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {weeklyWorkoutCurrent} / {weeklyWorkout.target}
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    weeklyWorkoutCurrent >= weeklyWorkout.target 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                      : 'bg-gradient-to-r from-rose-500 to-orange-400'
                  }`}
                  style={{ width: `${Math.min((weeklyWorkoutCurrent / weeklyWorkout.target) * 100, 100)}%` }}
                />
              </div>
              {weeklyWorkoutCurrent >= weeklyWorkout.target && (
                <div className="mt-2 text-center text-sm text-emerald-400 font-medium">
                  ✓ Obiettivo settimanale raggiunto!
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.workoutDays}/7</div>
            <div className="text-xs text-slate-400">Workout (7gg)</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center cursor-pointer hover:bg-orange-500/20 transition-colors" onClick={onOpenCalendar}>
            <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">
              <Flame size={18} />
              {stats.streak}
            </div>
            <div className="text-xs text-slate-400">Streak</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.completionRate}%</div>
            <div className="text-xs text-slate-400">Aderenza</div>
          </div>
        </div>

        {/* Custom Goals indicator */}
        {customGoals.length > 0 && (
          <div className="mb-4 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-purple-400">
              <Star size={14} />
              <span>Questo cliente ha {customGoals.length} obiettivo/i personale/i</span>
            </div>
          </div>
        )}

        {/* Personalized Targets indicator */}
        {Object.keys(habitTargets).length > 0 && (
          <div className="mb-4 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Edit3 size={14} />
              <span>Target personalizzati: {Object.entries(habitTargets).map(([k, v]) => {
                const habit = DEFAULT_HABITS.find(h => h.id === k);
                return habit ? `${habit.label}: ${v}` : null;
              }).filter(Boolean).join(', ')}</span>
            </div>
          </div>
        )}

        {/* Habit Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Abitudine</th>
                {last7Days.map(day => (
                  <th key={day.date} className={`text-center text-xs pb-2 px-1 ${day.isToday ? 'text-blue-400 font-semibold' : 'text-slate-500'}`}>
                    <div>{day.dayName}</div>
                    <div className="text-[10px]">{day.dayNum}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HABITS_CONFIG.map(habit => {
                const colors = colorClasses[habit.color] || colorClasses.purple;
                const Icon = ICON_MAP[habit.icon] || Target;
                
                return (
                  <tr key={habit.id} className="border-t border-slate-800">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${colors.bg}`}>
                          <Icon size={14} className={colors.text} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-300 flex items-center gap-1">
                            {habit.label}
                            {habit.isCustom && (
                              <Star size={10} className="text-purple-400" />
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {habit.target} {habit.unit}
                          </span>
                        </div>
                      </div>
                    </td>
                    {last7Days.map(day => {
                      const status = getHabitStatus(habit.id, day.date, habit.target);
                      return (
                        <td key={day.date} className={`text-center py-2.5 px-1 ${day.isToday ? 'bg-blue-500/5' : ''}`}>
                          <div className="flex justify-center">
                            <StatusCell status={status} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-4 h-4 rounded-full bg-emerald-500/30 flex items-center justify-center">
              <Check size={8} className="text-emerald-400" />
            </div>
            Completato
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-4 h-4 rounded-full bg-yellow-500/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            </div>
            Parziale
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-4 h-4 rounded-full bg-slate-700/50 flex items-center justify-center">
              <X size={6} className="text-slate-500" />
            </div>
            Non fatto
          </div>
        </div>
      </CardContent>
    </UnifiedCard>
  );
}
