// src/pages/client/ClientHabits.jsx
// Pagina dedicata alla gestione abitudini - Stile Nebula 2.0
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Edit3, Trash2, Save, Dumbbell, Droplets, Moon, Footprints, Apple, Target, Star, Calendar, Flame, Check, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

// Configurazione abitudini default
const DEFAULT_HABITS = [
  { id: 'workout', label: 'Allenamento', icon: 'Dumbbell', color: 'orange', target: 1, unit: 'volte', editable: false },
  { id: 'water', label: 'Acqua', icon: 'Droplets', color: 'cyan', target: 8, unit: 'bicchieri', editable: true },
  { id: 'sleep', label: 'Sonno', icon: 'Moon', color: 'indigo', target: 7, unit: 'ore', editable: true },
  { id: 'steps', label: 'Passi', icon: 'Footprints', color: 'emerald', target: 8000, unit: 'passi', editable: true },
  { id: 'nutrition', label: 'Dieta rispettata', icon: 'Apple', color: 'green', target: 1, unit: 'volta', editable: false },
];

// Mappa icone
const ICON_MAP = { Dumbbell, Droplets, Moon, Footprints, Apple, Target, Star };

// Color palette Nebula
const colorClasses = {
  orange: { 
    bg: 'bg-orange-500/20', 
    text: 'text-orange-400', 
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20',
    gradient: 'from-orange-500/20 to-amber-500/10'
  },
  cyan: { 
    bg: 'bg-cyan-500/20', 
    text: 'text-cyan-400', 
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    gradient: 'from-cyan-500/20 to-blue-500/10'
  },
  indigo: { 
    bg: 'bg-indigo-500/20', 
    text: 'text-indigo-400', 
    border: 'border-indigo-500/30',
    glow: 'shadow-indigo-500/20',
    gradient: 'from-indigo-500/20 to-violet-500/10'
  },
  emerald: { 
    bg: 'bg-emerald-500/20', 
    text: 'text-emerald-400', 
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    gradient: 'from-emerald-500/20 to-green-500/10'
  },
  green: { 
    bg: 'bg-green-500/20', 
    text: 'text-green-400', 
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20',
    gradient: 'from-green-500/20 to-emerald-500/10'
  },
  purple: { 
    bg: 'bg-purple-500/20', 
    text: 'text-purple-400', 
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
    gradient: 'from-purple-500/20 to-violet-500/10'
  },
  violet: { 
    bg: 'bg-violet-500/20', 
    text: 'text-violet-400', 
    border: 'border-violet-500/30',
    glow: 'shadow-violet-500/20',
    gradient: 'from-violet-500/20 to-purple-500/10'
  },
};

// GlowCard component Nebula style
const GlowCard = ({ children, className = '', gradient = false }) => (
  <div className={`relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl overflow-hidden ${className}`}>
    {gradient && (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 via-transparent to-slate-900/30 pointer-events-none" />
    )}
    <div className="relative">{children}</div>
  </div>
);

const ClientHabits = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [habits, setHabits] = useState({});
  const [habitTargets, setHabitTargets] = useState({});
  const [customGoals, setCustomGoals] = useState([]);
  const [weeklyWorkoutTarget, setWeeklyWorkoutTarget] = useState(4);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ label: '', target: 1, unit: 'volte' });
  const [editingTarget, setEditingTarget] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!auth.currentUser) return;
    
    try {
      const clientDoc = await getDoc(getTenantDoc(db, 'clients', auth.currentUser.uid));
      if (clientDoc.exists()) {
        const data = clientDoc.data();
        setHabits(data.habits || {});
        setHabitTargets(data.habitTargets || {});
        setCustomGoals(data.customGoals || []);
        setWeeklyWorkoutTarget(data.weeklyWorkout?.target || data.habitTargets?.weeklyWorkout || 4);
      }
      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento:', error);
      setLoading(false);
    }
  };

  // Combina abitudini default con target personalizzati
  const getAllHabits = () => {
    const habitsList = DEFAULT_HABITS.map(h => ({
      ...h,
      target: habitTargets[h.id] || h.target
    }));
    
    // Aggiungi obiettivi custom
    customGoals.forEach(goal => {
      habitsList.push({
        id: goal.id,
        label: goal.label,
        icon: 'Star',
        color: 'violet',
        target: goal.target,
        unit: goal.unit || 'volte',
        editable: true,
        isCustom: true
      });
    });
    
    return habitsList;
  };

  const handleTargetChange = (habitId, newTarget) => {
    setHabitTargets(prev => ({ ...prev, [habitId]: newTarget }));
    setHasChanges(true);
    setEditingTarget(null);
  };

  const handleAddGoal = () => {
    if (!newGoal.label.trim()) return;
    
    const goal = {
      id: `custom_${Date.now()}`,
      label: newGoal.label.trim(),
      target: newGoal.target,
      unit: newGoal.unit || 'volte',
      createdAt: new Date().toISOString()
    };
    
    setCustomGoals(prev => [...prev, goal]);
    setNewGoal({ label: '', target: 1, unit: 'volte' });
    setShowAddGoal(false);
    setHasChanges(true);
  };

  const handleRemoveGoal = (goalId) => {
    setCustomGoals(prev => prev.filter(g => g.id !== goalId));
    setHasChanges(true);
  };

  const handleWeeklyTargetChange = (newTarget) => {
    setWeeklyWorkoutTarget(newTarget);
    setHasChanges(true);
  };

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const calculateWeeklyWorkouts = () => {
    const weekStart = getWeekStart();
    let count = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      if (habits[dateStr]?.workout >= 1) count++;
    }
    
    return count;
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    
    try {
      const clientRef = getTenantDoc(db, 'clients', auth.currentUser.uid);
      
      await updateDoc(clientRef, {
        habitTargets: habitTargets,
        customGoals: customGoals,
        weeklyWorkout: {
          target: weeklyWorkoutTarget,
          weekStart: getWeekStart(),
          current: calculateWeeklyWorkouts()
        },
        lastHabitSettingsUpdate: new Date().toISOString()
      });
      
      setHasChanges(false);
      
      // Toast success
      const event = new CustomEvent('toast', {
        detail: { type: 'success', message: 'Impostazioni salvate!' }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      const event = new CustomEvent('toast', {
        detail: { type: 'error', message: 'Errore nel salvataggio' }
      });
      window.dispatchEvent(event);
    }
    
    setSaving(false);
  };

  // Calcola streak per un'abitudine
  const getStreak = (habitId, target) => {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const value = habits[dateStr]?.[habitId] || 0;
      
      if (value >= target) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Completamento ultimi 7 giorni
  const getLast7DaysStats = () => {
    const allHabits = getAllHabits();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayHabits = habits[dateStr] || {};
      
      const completed = allHabits.filter(h => (dayHabits[h.id] || 0) >= h.target).length;
      const percentage = Math.round((completed / allHabits.length) * 100);
      
      days.push({
        date: dateStr,
        day: date.toLocaleDateString('it-IT', { weekday: 'short' }),
        percentage,
        isToday: dateStr === today
      });
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-lg mx-auto space-y-4 pt-16">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const allHabits = getAllHabits();
  const last7Days = getLast7DaysStats();
  const todayHabits = habits[today] || {};
  const todayCompleted = allHabits.filter(h => (todayHabits[h.id] || 0) >= h.target).length;
  const todayPercentage = Math.round((todayCompleted / allHabits.length) * 100);
  const weeklyProgress = calculateWeeklyWorkouts();

  return (
    <div className="min-h-screen">
      {/* Header Nebula */}
      <div className="sticky top-0 z-20 bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/30 transition-colors"
            >
              <ArrowLeft size={18} className="text-slate-300" />
            </motion.button>
            <div>
              <h1 className="text-lg font-bold text-white">Abitudini</h1>
              <p className="text-xs text-slate-500">Personalizza i tuoi obiettivi</p>
            </div>
          </div>
          
          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-500/25"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Salva
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-32">
        
        {/* Hero Stats Card */}
        <GlowCard gradient className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border border-cyan-500/30">
                <TrendingUp size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Progressi Oggi</h3>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {todayPercentage}%
              </div>
              <p className="text-xs text-slate-500">{todayCompleted}/{allHabits.length} completate</p>
            </div>
          </div>
          
          {/* Mini week view */}
          <div className="grid grid-cols-7 gap-1.5">
            {last7Days.map((day, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`text-center p-2 rounded-xl transition-all ${
                  day.isToday 
                    ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/10' 
                    : day.percentage === 100
                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : day.percentage >= 60
                    ? 'bg-amber-500/15 border border-amber-500/20'
                    : 'bg-slate-700/30 border border-slate-700/20'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase font-medium">{day.day}</div>
                <div className={`text-xs font-bold mt-0.5 ${
                  day.isToday ? 'text-cyan-400' :
                  day.percentage === 100 ? 'text-emerald-400' : 
                  day.percentage >= 60 ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  {day.percentage}%
                </div>
              </motion.div>
            ))}
          </div>
        </GlowCard>

        {/* Obiettivo workout settimanale */}
        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/20 border border-orange-500/30">
                <Dumbbell size={18} className="text-orange-400" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm">Allenamenti Settimanali</span>
                <p className="text-xs text-slate-500">Obiettivo questa settimana</p>
              </div>
            </div>
            <select
              value={weeklyWorkoutTarget}
              onChange={(e) => handleWeeklyTargetChange(parseInt(e.target.value))}
              className="px-3 py-2 text-sm bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              {[2, 3, 4, 5, 6, 7].map(n => (
                <option key={n} value={n}>{n}/settimana</option>
              ))}
            </select>
          </div>
          
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((weeklyProgress / weeklyWorkoutTarget) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full transition-all ${
                  weeklyProgress >= weeklyWorkoutTarget
                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                    : 'bg-gradient-to-r from-orange-500 to-amber-400'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-lg font-bold ${
                weeklyProgress >= weeklyWorkoutTarget ? 'text-emerald-400' : 'text-orange-400'
              }`}>
                {weeklyProgress}
              </span>
              <span className="text-sm text-slate-500">/ {weeklyWorkoutTarget}</span>
              {weeklyProgress >= weeklyWorkoutTarget && (
                <Check size={16} className="text-emerald-400" />
              )}
            </div>
          </div>
        </GlowCard>

        {/* Lista abitudini con target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Target Giornalieri</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddGoal(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 border border-violet-500/30 transition-colors"
            >
              <Plus size={14} />
              Nuovo
            </motion.button>
          </div>

          {allHabits.map((habit, index) => {
            const Icon = ICON_MAP[habit.icon] || Target;
            const colors = colorClasses[habit.color] || colorClasses.purple;
            const streak = getStreak(habit.id, habit.target);
            const todayValue = todayHabits[habit.id] || 0;
            const isComplete = todayValue >= habit.target;
            const progress = Math.min((todayValue / habit.target) * 100, 100);

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlowCard className={`p-4 transition-all ${isComplete ? `border-l-2 ${colors.border.replace('/30', '/60')}` : ''}`}>
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`p-2.5 rounded-xl ${isComplete ? `bg-gradient-to-br ${colors.gradient}` : 'bg-slate-700/50'} border ${isComplete ? colors.border : 'border-slate-700/30'} transition-all`}>
                      <Icon size={18} className={isComplete ? colors.text : 'text-slate-400'} />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">{habit.label}</span>
                        {habit.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/30 text-violet-400 rounded-full font-medium">
                            custom
                          </span>
                        )}
                        {streak > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-orange-400 font-medium">
                            <Flame size={12} />
                            {streak}
                          </span>
                        )}
                      </div>
                      
                      {/* Progress mini */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${isComplete ? 'bg-gradient-to-r from-emerald-500 to-green-400' : `bg-gradient-to-r ${colors.gradient.replace('/20', '/60').replace('/10', '/40')}`}`}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">
                          {todayValue}/{habit.target} {habit.unit}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-2">
                      {editingTarget === habit.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            defaultValue={habit.target}
                            className="w-16 px-2 py-1.5 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500/50"
                            autoFocus
                            onBlur={(e) => handleTargetChange(habit.id, parseInt(e.target.value) || habit.target)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleTargetChange(habit.id, parseInt(e.target.value) || habit.target);
                              }
                              if (e.key === 'Escape') {
                                setEditingTarget(null);
                              }
                            }}
                          />
                          <button
                            onClick={() => setEditingTarget(null)}
                            className="p-1.5 text-slate-400 hover:text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          {habit.editable && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingTarget(habit.id)}
                              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white border border-slate-700/30 transition-colors"
                            >
                              <Edit3 size={14} />
                            </motion.button>
                          )}
                          {habit.isCustom && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveGoal(habit.id)}
                              className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/30 hover:border-red-500/30 transition-colors"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>

        {/* Info tip */}
        <GlowCard className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <Star size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-300">
                Modifica i target giornalieri per personalizzare i tuoi obiettivi.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Le modifiche si applicheranno a partire da oggi.
              </p>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Modal aggiungi obiettivo - Stile Nebula */}
      <AnimatePresence>
        {showAddGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddGoal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <GlowCard gradient className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
                      <Star size={18} className="text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Nuovo Obiettivo</h3>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddGoal(false)}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 border border-slate-700/30 transition-colors"
                  >
                    <X size={18} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Nome obiettivo</label>
                    <input
                      type="text"
                      placeholder="es. Meditazione, Lettura..."
                      value={newGoal.label}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Target</label>
                      <input
                        type="number"
                        min="1"
                        value={newGoal.target}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Unità</label>
                      <input
                        type="text"
                        placeholder="volte, minuti..."
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddGoal}
                    disabled={!newGoal.label.trim()}
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25 disabled:shadow-none"
                  >
                    Aggiungi Obiettivo
                  </motion.button>
                </div>
              </GlowCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientHabits;
