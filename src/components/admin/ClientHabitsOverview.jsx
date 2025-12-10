// src/components/admin/ClientHabitsOverview.jsx
// Vista panoramica delle abitudini del cliente per Admin/Coach
import React, { useMemo } from 'react';
import { Droplets, Moon, Footprints, Dumbbell, Apple, TrendingUp, Check, X, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { UnifiedCard, CardHeaderSimple, CardContent } from '../ui/UnifiedCard';

// Stessa struttura habits del client HabitTracker
const HABITS_CONFIG = [
  { id: 'water', label: 'Acqua', icon: Droplets, color: 'blue', target: 8 },
  { id: 'sleep', label: 'Sonno', icon: Moon, color: 'indigo', target: 7 },
  { id: 'steps', label: 'Passi', icon: Footprints, color: 'green', target: 10000 },
  { id: 'workout', label: 'Workout', icon: Dumbbell, color: 'rose', target: 1 },
  { id: 'healthy_meal', label: 'Pasti', icon: Apple, color: 'emerald', target: 3 },
];

const colorClasses = {
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

/**
 * ClientHabitsOverview - Panoramica settimanale delle abitudini
 * @param {Object} client - Dati del cliente (deve avere .habits e .workoutLog)
 * @param {Function} onOpenCalendar - Callback per aprire il calendario workout
 */
export default function ClientHabitsOverview({ client, onOpenCalendar }) {
  const habits = client?.habits || {};
  const workoutLog = client?.workoutLog || {};

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
  }, [habits, workoutLog, last7Days]);

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
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.workoutDays}/7</div>
            <div className="text-xs text-slate-400">Workout</div>
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
                const colors = colorClasses[habit.color];
                const Icon = habit.icon;
                
                return (
                  <tr key={habit.id} className="border-t border-slate-800">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${colors.bg}`}>
                          <Icon size={14} className={colors.text} />
                        </div>
                        <span className="text-sm text-slate-300">{habit.label}</span>
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
