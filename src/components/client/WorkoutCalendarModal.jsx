import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { X, ChevronLeft, ChevronRight, Flame, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WorkoutCalendarModal - Calendario con evidenziazione dei giorni di allenamento
 * @param {string} clientId - Optional: ID del client (per admin/coach view)
 */
export default function WorkoutCalendarModal({ isOpen, onClose, clientId = null }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDays, setWorkoutDays] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ thisMonth: 0, total: 0 });

  useEffect(() => {
    if (isOpen) {
      loadWorkoutData();
    }
  }, [isOpen, currentMonth]);

  const loadWorkoutData = async () => {
    const targetId = clientId || auth.currentUser?.uid;
    if (!targetId) return;

    try {
      setLoading(true);
      const clientDoc = await getDoc(getTenantDoc(db, 'clients', targetId));
      
      if (!clientDoc.exists()) {
        setLoading(false);
        return;
      }

      const data = clientDoc.data();
      const habits = data.habits || {};
      const workoutLog = data.workoutLog || {};
      
      // Combina i dati da habits e workoutLog
      const allWorkoutDays = new Set();
      
      // Da habits
      Object.keys(habits).forEach(dateStr => {
        if (habits[dateStr]?.workout >= 1) {
          allWorkoutDays.add(dateStr);
        }
      });
      
      // Da workoutLog
      Object.keys(workoutLog).forEach(dateStr => {
        if (workoutLog[dateStr]?.completed === true) {
          allWorkoutDays.add(dateStr);
        }
      });

      setWorkoutDays(allWorkoutDays);
      
      // Calcola stats per il mese corrente
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      let monthCount = 0;
      
      allWorkoutDays.forEach(dateStr => {
        const date = new Date(dateStr);
        if (date.getFullYear() === year && date.getMonth() === month) {
          monthCount++;
        }
      });
      
      setStats({
        thisMonth: monthCount,
        total: allWorkoutDays.size
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento workout:', error);
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunedì = 0
    
    // Giorni del mese precedente
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        dateStr: prevDate.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }
    
    // Giorni del mese corrente
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        isCurrentMonth: true
      });
    }
    
    // Giorni del mese successivo per completare la griglia
    const remainingDays = 42 - days.length; // 6 righe x 7 colonne
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        dateStr: nextDate.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (dateStr) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  const isFuture = (dateStr) => {
    return new Date(dateStr) > new Date();
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="text-orange-400" size={24} />
                <h2 className="text-xl font-bold text-slate-100">Calendario Workout</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="text-slate-400" size={20} />
              </button>
            </div>

            {/* Month Navigation */}
            <div className="p-4 flex items-center justify-between">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="text-slate-300" size={20} />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-slate-100">
                  {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={goToToday}
                  className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-md hover:bg-blue-600/30 transition-colors"
                >
                  Oggi
                </button>
              </div>
              
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="text-slate-300" size={20} />
              </button>
            </div>

            {/* Stats */}
            <div className="px-4 pb-3 grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{stats.thisMonth}</p>
                <p className="text-xs text-slate-400">Questo mese</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-400">{stats.total}</p>
                <p className="text-xs text-slate-400">Totale workout</p>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4 pt-0">
              {/* Week headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    const hasWorkout = workoutDays.has(day.dateStr);
                    const today = isToday(day.dateStr);
                    const future = isFuture(day.dateStr);
                    
                    return (
                      <div
                        key={idx}
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative
                          transition-all
                          ${!day.isCurrentMonth ? 'opacity-30' : ''}
                          ${today ? 'ring-2 ring-blue-500' : ''}
                          ${hasWorkout 
                            ? 'bg-emerald-500 text-white font-semibold' 
                            : future 
                              ? 'bg-slate-800 text-slate-600'
                              : 'bg-slate-700/50 text-slate-400'
                          }
                        `}
                      >
                        <span>{day.date.getDate()}</span>
                        {hasWorkout && (
                          <Dumbbell className="absolute bottom-0.5 right-0.5" size={10} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="p-4 pt-0 flex justify-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span>Workout fatto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-700/50 ring-2 ring-blue-500"></div>
                <span>Oggi</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
