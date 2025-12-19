// src/pages/client/ClientHabits.jsx
// Pagina dedicata alla gestione abitudini - stile coerente con l'app
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Edit3, Trash2, Save, Dumbbell, Droplets, Moon, Footprints, Apple, Target, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';

// Configurazione abitudini default
const DEFAULT_HABITS = [
  { id: 'workout', label: 'Allenamento', icon: 'Dumbbell', color: 'orange', target: 1, unit: 'volte', editable: false },
  { id: 'water', label: 'Acqua', icon: 'Droplets', color: 'blue', target: 8, unit: 'bicchieri', editable: true },
  { id: 'sleep', label: 'Sonno', icon: 'Moon', color: 'indigo', target: 7, unit: 'ore', editable: true },
  { id: 'steps', label: 'Passi', icon: 'Footprints', color: 'emerald', target: 8000, unit: 'passi', editable: true },
  { id: 'nutrition', label: 'Dieta rispettata', icon: 'Apple', color: 'green', target: 1, unit: 'volta', editable: false },
];

// Mappa icone
const ICON_MAP = { Dumbbell, Droplets, Moon, Footprints, Apple, Target, Star };

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
        color: 'purple',
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

  const colorClasses = {
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
    indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const allHabits = getAllHabits();
  const last7Days = getLast7DaysStats();
  const todayHabits = habits[today] || {};
  const todayCompleted = allHabits.filter(h => (todayHabits[h.id] || 0) >= h.target).length;

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header con back e save */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50"
            >
              <ArrowLeft size={20} className="text-slate-300" />
            </motion.button>
            <div>
              <h1 className="text-lg font-bold text-white">Abitudini</h1>
              <p className="text-xs text-slate-500">Personalizza i tuoi obiettivi</p>
            </div>
          </div>
          
          {hasChanges && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Salva
            </motion.button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Stats oggi */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              Oggi
            </h3>
            <span className="text-2xl font-bold text-blue-400">
              {todayCompleted}/{allHabits.length}
            </span>
          </div>
          
          {/* Mini week view */}
          <div className="grid grid-cols-7 gap-1">
            {last7Days.map((day, idx) => (
              <div 
                key={idx}
                className={`text-center p-1.5 rounded-lg ${
                  day.isToday 
                    ? 'bg-blue-500/30 border border-blue-500/50' 
                    : day.percentage === 100
                    ? 'bg-emerald-500/20'
                    : day.percentage >= 60
                    ? 'bg-yellow-500/20'
                    : 'bg-slate-700/30'
                }`}
              >
                <div className="text-[10px] text-slate-400">{day.day}</div>
                <div className={`text-xs font-bold ${
                  day.percentage === 100 ? 'text-emerald-400' : 
                  day.percentage >= 60 ? 'text-yellow-400' : 'text-slate-400'
                }`}>
                  {day.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Obiettivo workout settimanale */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Dumbbell size={18} className="text-orange-400" />
              <span className="font-semibold text-white">Allenamenti Settimanali</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={weeklyWorkoutTarget}
                onChange={(e) => handleWeeklyTargetChange(parseInt(e.target.value))}
                className="px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white"
              >
                {[2, 3, 4, 5, 6, 7].map(n => (
                  <option key={n} value={n}>{n}/settimana</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  calculateWeeklyWorkouts() >= weeklyWorkoutTarget
                    ? 'bg-emerald-500'
                    : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min((calculateWeeklyWorkouts() / weeklyWorkoutTarget) * 100, 100)}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${
              calculateWeeklyWorkouts() >= weeklyWorkoutTarget ? 'text-emerald-400' : 'text-orange-400'
            }`}>
              {calculateWeeklyWorkouts()}/{weeklyWorkoutTarget}
            </span>
          </div>
        </div>

        {/* Lista abitudini con target */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-400">Target Giornalieri</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddGoal(true)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
            >
              <Plus size={12} />
              Nuovo
            </motion.button>
          </div>

          {allHabits.map(habit => {
            const Icon = ICON_MAP[habit.icon] || Target;
            const colors = colorClasses[habit.color];
            const streak = getStreak(habit.id, habit.target);
            const todayValue = todayHabits[habit.id] || 0;
            const isComplete = todayValue >= habit.target;

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border transition-all ${
                  isComplete ? `${colors.bg} ${colors.border}` : 'bg-slate-800/40 border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isComplete ? colors.bg : 'bg-slate-700/50'}`}>
                      <Icon size={18} className={isComplete ? colors.text : 'text-slate-400'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{habit.label}</span>
                        {habit.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/30 text-purple-400 rounded">
                            custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Oggi: {todayValue}/{habit.target} {habit.unit}</span>
                        {streak > 0 && (
                          <span className="text-orange-400">{streak}🔥</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingTarget === habit.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          defaultValue={habit.target}
                          className="w-16 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white text-center"
                          autoFocus
                          onBlur={(e) => handleTargetChange(habit.id, parseInt(e.target.value) || habit.target)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTargetChange(habit.id, parseInt(e.target.value) || habit.target);
                            }
                          }}
                        />
                        <button
                          onClick={() => setEditingTarget(null)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-slate-400">
                          {habit.target} {habit.unit}
                        </span>
                        {habit.editable && (
                          <button
                            onClick={() => setEditingTarget(habit.id)}
                            className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {habit.isCustom && (
                          <button
                            onClick={() => handleRemoveGoal(habit.id)}
                            className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/30 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Modal aggiungi obiettivo */}
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
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-slate-800 rounded-2xl p-4 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Nuovo Obiettivo</h3>
                  <button
                    onClick={() => setShowAddGoal(false)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Nome obiettivo</label>
                    <input
                      type="text"
                      placeholder="es. Meditazione"
                      value={newGoal.label}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Target</label>
                      <input
                        type="number"
                        min="1"
                        value={newGoal.target}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Unità</label>
                      <input
                        type="text"
                        placeholder="volte"
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddGoal}
                    disabled={!newGoal.label.trim()}
                    className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
                  >
                    Aggiungi Obiettivo
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
          <p className="text-xs text-slate-500 text-center">
            💡 Modifica i target giornalieri per personalizzare i tuoi obiettivi.
            <br />Le modifiche si applicheranno a partire da oggi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientHabits;
