// src/components/client/QuickHabits.jsx
// Tracker abitudini con sistema popup compatto
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { Droplets, Moon, Footprints, Apple, Check, Plus, Minus, Dumbbell, Settings, Star, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Default habits (possono essere sovrascritti da habitTargets)
const DEFAULT_HABITS = [
  { 
    id: 'workout', 
    label: 'Allenamento', 
    fullLabel: 'Allenamento fatto',
    icon: Dumbbell, 
    target: 1, 
    color: 'orange',
    type: 'toggle'
  },
  { 
    id: 'water', 
    label: 'Acqua', 
    fullLabel: 'Bicchieri d\'acqua',
    sublabel: 'bicchieri',
    icon: Droplets, 
    target: 8, 
    unit: 'bicch.',
    color: 'blue',
    type: 'counter'
  },
  { 
    id: 'sleep', 
    label: 'Sonno', 
    fullLabel: 'Ore di sonno',
    icon: Moon, 
    target: 7, 
    unit: 'ore',
    color: 'indigo',
    type: 'counter'
  },
  { 
    id: 'steps', 
    label: 'Passi', 
    fullLabel: 'Passi giornalieri',
    icon: Footprints, 
    target: 8000, 
    unit: 'passi',
    color: 'emerald',
    type: 'counter'
  },
  { 
    id: 'nutrition', 
    label: 'Dieta', 
    fullLabel: 'Dieta rispettata',
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
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  
  // Motion value per drag del popup
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 300], [1, 0]);
  
  const today = new Date().toISOString().split('T')[0];

  // Blocca scroll del body e previene pull-to-refresh quando popup è aperto
  useEffect(() => {
    if (showPopup) {
      dragY.set(0); // Reset posizione quando si apre
      // Salva la posizione corrente dello scroll
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      // Ripristina la posizione dello scroll
      const scrollY = document.body.dataset.scrollY || '0';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY));
    }
    return () => {
      const scrollY = document.body.dataset.scrollY || '0';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY));
    };
  }, [showPopup]);

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
        sublabel = `${customTarget} ${h.unit}`;
      } else if (h.type === 'counter' && !sublabel) {
        sublabel = `${h.target} ${h.unit}`;
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
        fullLabel: goal.label,
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

  const todayHabits = habits[today] || {};
  const HABITS_CONFIG = getHabitsConfig();

  // Calcola statistiche completamento
  const completedCount = HABITS_CONFIG.filter(h => {
    const value = todayHabits[h.id] || 0;
    return value >= h.target;
  }).length;
  
  const totalCount = HABITS_CONFIG.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const colorClasses = {
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', active: 'bg-orange-500', ring: 'ring-orange-500/30' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', active: 'bg-blue-500', ring: 'ring-blue-500/30' },
    indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40', active: 'bg-indigo-500', ring: 'ring-indigo-500/30' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', active: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40', active: 'bg-green-500', ring: 'ring-green-500/30' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', active: 'bg-purple-500', ring: 'ring-purple-500/30' },
  };

  if (loading) {
    return (
      <div className="relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-3">
        <div className="h-8 bg-slate-700/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <>
      {/* Card compatta - cliccabile per aprire popup */}
      <motion.button
        onClick={() => setShowPopup(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-3 
          hover:border-slate-600/50 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] transition-all duration-300 text-left group"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mini icone abitudini */}
            <div className="flex -space-x-1">
              {HABITS_CONFIG.slice(0, 4).map((habit, idx) => {
                const Icon = habit.icon;
                const value = todayHabits[habit.id] || 0;
                const isComplete = value >= habit.target;
                const colors = colorClasses[habit.color];
                
                return (
                  <div 
                    key={habit.id}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-slate-800 transition-colors ${
                      isComplete ? colors.active : 'bg-slate-700/60'
                    }`}
                    style={{ zIndex: 4 - idx }}
                  >
                    <Icon size={12} className="text-white" />
                  </div>
                );
              })}
              {HABITS_CONFIG.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-700/60 border-2 border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                  +{HABITS_CONFIG.length - 4}
                </div>
              )}
            </div>
            
            <div>
              <p className="text-xs font-medium text-white">Abitudini</p>
              <p className="text-[10px] text-slate-400">
                {completedCount}/{totalCount} completate
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mini progress */}
            <div className="w-12 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${completionPercent === 100 ? 'bg-green-500' : 'bg-violet-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className={`text-xs font-semibold ${completionPercent === 100 ? 'text-green-400' : 'text-violet-400'}`}>
              {completionPercent}%
            </span>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>
      </motion.button>

      {/* Popup modale - Bottom Sheet su mobile - PORTAL per renderizzare fuori dal container */}
      {createPortal(
        <AnimatePresence mode="wait">
          {showPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999]"
              style={{ touchAction: 'none' }}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Backdrop con opacity controllata dal drag */}
              <motion.div 
                onClick={() => setShowPopup(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                style={{ opacity: backdropOpacity }}
              />
              
              {/* Modal content - Bottom sheet che si trascina tutto insieme */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                style={{ y: dragY }}
                className="absolute inset-x-0 bottom-0 md:inset-x-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md md:mx-auto will-change-transform"
                onAnimationComplete={(definition) => {
                  // Quando l'animazione di entrata è completata, reset dragY
                  if (definition === 'animate') {
                    dragY.set(0);
                  }
                }}
              >
                <div className="bg-slate-900/50 backdrop-blur-3xl border border-slate-500/30 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                  {/* Gradient overlay per effetto vetro scuro trasparente */}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-700/30 via-transparent to-slate-950/40 pointer-events-none rounded-t-3xl md:rounded-2xl" />
                  
                  {/* Handle per drag (solo mobile) - trascina tutto il popup */}
                  <motion.div 
                    className="md:hidden flex justify-center pt-4 pb-3 relative cursor-grab active:cursor-grabbing"
                    drag="y"
                    dragDirectionLock
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 1 }}
                    onDrag={(event, info) => {
                      // Aggiorna la posizione del popup solo se si trascina verso il basso
                      if (info.offset.y > 0) {
                        dragY.set(info.offset.y);
                      }
                    }}
                    onDragEnd={(event, info) => {
                      if (info.offset.y > 100 || info.velocity.y > 500) {
                        // Chiudi immediatamente - il popup è già trascinato fuori
                        setShowPopup(false);
                      } else {
                        // Torna alla posizione originale
                        animate(dragY, 0, { type: 'spring', damping: 30, stiffness: 400 });
                      }
                    }}
                    style={{ touchAction: 'none' }}
                  >
                    <div className="w-12 h-1.5 bg-slate-400/70 rounded-full" />
                  </motion.div>
                  
                  {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-500/30 relative">
                  <div>
                    <h3 className="text-base font-semibold text-white">📋 Abitudini di Oggi</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {completedCount}/{totalCount} completate • {completionPercent}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowPopup(false);
                        navigate('/client/habits');
                      }}
                      className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    >
                      <Settings size={16} className="text-slate-400" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPopup(false)}
                      className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                    >
                      <X size={16} className="text-slate-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-4 py-2 relative">
                  <div className="h-2 bg-slate-600/40 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${completionPercent === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-violet-500 to-purple-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                
                {/* Lista abitudini */}
                <div className="p-4 space-y-2 overflow-y-auto flex-1 relative" style={{ touchAction: 'pan-y' }}>
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
                      return (
                        <div 
                          key={habit.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isComplete 
                              ? `${colors.bg} ${colors.border}` 
                              : 'bg-slate-800/40 border-slate-600/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isComplete ? colors.bg : 'bg-slate-700/40'}`}>
                              <Icon size={18} className={isComplete ? colors.text : 'text-slate-400'} />
                            </div>
                            <div>
                              <span className={`text-sm font-medium ${isComplete ? 'text-white' : 'text-slate-300'}`}>
                                {habit.fullLabel || habit.label}
                              </span>
                              <p className="text-[10px] text-slate-500">
                                Obiettivo: {habit.target >= 1000 ? `${(habit.target/1000)}k` : habit.target} {habit.unit}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => incrementHabit(habit.id, -increment)}
                              disabled={value <= 0}
                              className="p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus size={14} className="text-slate-300" />
                            </motion.button>
                            
                            <div className={`min-w-[45px] text-center py-1 px-2 rounded-lg font-bold text-sm ${
                              isComplete ? `${colors.active} text-white` : 'bg-slate-700/40 text-slate-300'
                            }`}>
                              {value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                            </div>
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => incrementHabit(habit.id, increment)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isComplete 
                                  ? `${colors.active} hover:opacity-80` 
                                  : 'bg-slate-700/40 hover:bg-slate-600/50'
                              }`}
                            >
                              <Plus size={14} className="text-white" />
                            </motion.button>
                          </div>
                        </div>
                      );
                    }
                    
                    // Toggle
                    return (
                      <motion.button
                        key={habit.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleHabit(habit.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isComplete 
                            ? `${colors.bg} ${colors.border}` 
                            : 'bg-slate-800/40 border-slate-600/20 hover:border-slate-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isComplete ? colors.bg : 'bg-slate-700/40'}`}>
                            <Icon size={18} className={isComplete ? colors.text : 'text-slate-400'} />
                          </div>
                          <span className={`text-sm font-medium ${isComplete ? 'text-white' : 'text-slate-300'}`}>
                            {habit.fullLabel || habit.label}
                          </span>
                        </div>
                        
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
                
                {/* Footer */}
                <div className="p-4 border-t border-slate-500/30 relative">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowPopup(false);
                      navigate('/client/habits');
                    }}
                    className="w-full py-2.5 text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings size={14} />
                    Personalizza abitudini e obiettivi
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
}
