// src/components/client/QuickHabits.jsx
// Tracker abitudini giornaliere con link a personalizzazione completa
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { Droplets, Moon, Footprints, Apple, Check, Plus, Minus, Dumbbell, Settings, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Default habits (possono essere sovrascritti da habitTargets)
const DEFAULT_HABITS = [
  { 
    id: 'workout', 
    label: 'Allenamento fatto', 
    icon: Dumbbell, 
    target: 1, 
    color: 'orange',
    type: 'toggle'
  },
  { 
    id: 'water', 
    label: 'Acqua', 
    sublabel: 'bicchieri',
    icon: Droplets, 
    target: 8, 
    unit: 'bicch.',
    color: 'blue',
    type: 'counter'
  },
  { 
    id: 'sleep', 
    label: 'Ore di sonno', 
    icon: Moon, 
    target: 7, 
    unit: 'ore',
    color: 'indigo',
    type: 'counter'
  },
  { 
    id: 'steps', 
    label: 'Passi', 
    icon: Footprints, 
    target: 8000, 
    unit: 'passi',
    color: 'emerald',
    type: 'counter'
  },
  { 
    id: 'nutrition', 
    label: 'Dieta rispettata', 
    icon: Apple, 
    target: 1, 
    color: 'green',
    type: 'toggle'
  },
];

export default function QuickHabits({ onWorkoutChange }) {
  const [habits, setHabits] = useState({});
  const [habitTargets, setHabitTargets] = useState({});
  const [customGoals, setCustomGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const today = new Date().toISOString().split('T')[0];

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
      }
      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento habits:', error);
      setLoading(false);
    }
  };

  // Combina default habits con target personalizzati e custom goals
  const getHabitsConfig = () => {
    const config = DEFAULT_HABITS.map(h => {
      const customTarget = habitTargets[h.id];
      let sublabel = h.sublabel;
      
      // Genera sublabel dinamica per counter
      if (h.type === 'counter' && customTarget) {
        sublabel = `${customTarget} ${h.unit} consigliati`;
      } else if (h.type === 'counter' && !sublabel) {
        sublabel = `${h.target} ${h.unit} consigliati`;
      }
      
      return {
        ...h,
        target: customTarget || h.target,
        sublabel
      };
    });
    
    // Aggiungi custom goals
    customGoals.forEach(goal => {
      config.push({
        id: goal.id,
        label: goal.label,
        icon: Star,
        target: goal.target,
        unit: goal.unit || 'volte',
        color: 'purple',
        type: goal.target > 1 ? 'counter' : 'toggle',
        isCustom: true
      });
    });
    
    return config;
  };

  const updateHabit = async (habitId, newValue) => {
    if (!auth.currentUser) return;
    
    const todayHabits = habits[today] || {};
    
    const newHabits = {
      ...habits,
      [today]: {
        ...todayHabits,
        [habitId]: Math.max(0, newValue)
      }
    };
    
    setHabits(newHabits);
    
    try {
      const clientRef = getTenantDoc(db, 'clients', auth.currentUser.uid);
      await updateDoc(clientRef, { habits: newHabits });
      
      // Se è workout, notifica il parent per aggiornare HeroStreakCard
      if (habitId === 'workout' && onWorkoutChange) {
        onWorkoutChange();
      }
    } catch (error) {
      console.error('Errore salvataggio habit:', error);
    }
  };

  const toggleHabit = (habitId) => {
    const todayHabits = habits[today] || {};
    const current = todayHabits[habitId] || 0;
    updateHabit(habitId, current > 0 ? 0 : 1);
  };

  const incrementHabit = (habitId, amount = 1) => {
    const todayHabits = habits[today] || {};
    const current = todayHabits[habitId] || 0;
    updateHabit(habitId, current + amount);
  };

  if (loading) {
    return (
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 bg-slate-700/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const todayHabits = habits[today] || {};
  const HABITS_CONFIG = getHabitsConfig();

  const colorClasses = {
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', active: 'bg-orange-500' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', active: 'bg-blue-500' },
    indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40', active: 'bg-indigo-500' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', active: 'bg-emerald-500' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40', active: 'bg-green-500' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', active: 'bg-purple-500' },
  };

  // Conta abitudini completate
  const completedCount = HABITS_CONFIG.filter(h => {
    const value = todayHabits[h.id] || 0;
    return value >= h.target;
  }).length;

  return (
    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">📋 Abitudini di Oggi</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {completedCount}/{HABITS_CONFIG.length}
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/client/habits')}
            className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
            title="Personalizza abitudini"
          >
            <Settings size={14} className="text-slate-400" />
          </motion.button>
        </div>
      </div>
      
      <div className="space-y-2">
        {HABITS_CONFIG.map(habit => {
          const value = todayHabits[habit.id] || 0;
          const isComplete = value >= habit.target;
          const colors = colorClasses[habit.color];
          const Icon = habit.icon;
          
          // Calcola incremento in base al target
          const getIncrement = () => {
            if (habit.id === 'steps') return 1000;
            if (habit.target >= 100) return Math.ceil(habit.target / 10);
            return 1;
          };
          const increment = getIncrement();
          
          if (habit.type === 'counter') {
            // Counter con + e -
            return (
              <div 
                key={habit.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isComplete 
                    ? `${colors.bg} ${colors.border}` 
                    : 'bg-slate-700/30 border-slate-600/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${isComplete ? colors.bg : 'bg-slate-600/30'}`}>
                    <Icon size={18} className={isComplete ? colors.text : 'text-slate-400'} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isComplete ? 'text-white' : 'text-slate-300'}`}>
                      {habit.label}
                    </span>
                    {habit.sublabel && (
                      <p className="text-[10px] text-slate-500">{habit.sublabel}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Bottone - */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => incrementHabit(habit.id, -increment)}
                    disabled={value <= 0}
                    className="p-1.5 rounded-lg bg-slate-600/50 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={14} className="text-slate-300" />
                  </motion.button>
                  
                  {/* Counter - formato compatto per numeri grandi */}
                  <div className={`min-w-[50px] text-center py-1 px-2 rounded-lg font-bold text-sm ${
                    isComplete ? `${colors.active} text-white` : 'bg-slate-600/50 text-slate-300'
                  }`}>
                    {value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                  </div>
                  
                  {/* Bottone + */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => incrementHabit(habit.id, increment)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isComplete 
                        ? `${colors.active} hover:opacity-80` 
                        : 'bg-slate-600/50 hover:bg-slate-600'
                    }`}
                  >
                    <Plus size={14} className="text-white" />
                  </motion.button>
                </div>
              </div>
            );
          }
          
          // Toggle: tap per attivare/disattivare
          return (
            <motion.button
              key={habit.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleHabit(habit.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                isComplete 
                  ? `${colors.bg} ${colors.border}` 
                  : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isComplete ? colors.bg : 'bg-slate-600/30'}`}>
                  <Icon size={18} className={isComplete ? colors.text : 'text-slate-400'} />
                </div>
                <span className={`text-sm font-medium ${isComplete ? 'text-white' : 'text-slate-300'}`}>
                  {habit.label}
                </span>
              </div>
              
              {/* Checkbox visivo */}
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                isComplete 
                  ? `${colors.active} border-transparent` 
                  : 'border-slate-500 bg-transparent'
              }`}>
                <AnimatePresence>
                  {isComplete && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check size={14} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Link alla versione completa */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/client/habits')}
        className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
      >
        <Settings size={12} />
        Personalizza abitudini e obiettivi
      </motion.button>
    </div>
  );
}
