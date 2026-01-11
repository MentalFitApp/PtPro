// src/components/client/HeroStreakCard.jsx
// Hero Card motivazionale COMPATTA con streak e progress settimanale
// Stile unificato con Dashboard Admin (GlowCard style)
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { Flame, Trophy, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroStreakCard({ refreshKey = 0 }) {
  const [streak, setStreak] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [weeklyTarget, setWeeklyTarget] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  if (error) {
    return (
      <motion.div 
        className="bg-slate-800/40 backdrop-blur-sm border border-red-500/30 rounded-2xl p-3"
      >
        <div className="text-red-400 text-xs">Errore streak</div>
        <button 
          onClick={() => { setError(null); loadData(); }}
          className="text-[10px] text-red-300 underline mt-1"
        >
          Riprova
        </button>
      </motion.div>
    );
  }

  const loadData = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      const clientDoc = await getDoc(getTenantDoc(db, 'clients', auth.currentUser.uid));
      if (!clientDoc.exists()) {
        setLoading(false);
        return;
      }

      const data = clientDoc.data();
      const habits = data.habits || {};
      const workoutLog = data.workoutLog || {};
      const weekly = data.weeklyWorkout || {};

      // Calcola streak corrente
      let currentStreak = 0;
      let checkDate = new Date();

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hadWorkout = 
          (habits[dateStr]?.workout >= 1) || 
          (workoutLog[dateStr]?.completed === true);

        if (hadWorkout) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          const yesterday = new Date(checkDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const hadWorkoutYesterday = 
            (habits[yesterdayStr]?.workout >= 1) || 
            (workoutLog[yesterdayStr]?.completed === true);
          
          if (hadWorkoutYesterday && currentStreak > 0) {
            checkDate.setDate(checkDate.getDate() - 2);
            continue;
          }
          break;
        }
      }

      // Calcola workout questa settimana
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      let weekCount = 0;
      for (let i = 0; i < 7; i++) {
        const checkDay = new Date(startOfWeek);
        checkDay.setDate(startOfWeek.getDate() + i);
        if (checkDay > today) break;
        
        const dateStr = checkDay.toISOString().split('T')[0];
        const hadWorkout = 
          (habits[dateStr]?.workout >= 1) || 
          (workoutLog[dateStr]?.completed === true);
        if (hadWorkout) weekCount++;
      }

      setStreak(currentStreak);
      setWeeklyWorkouts(weekCount);
      setWeeklyTarget(weekly.target || data.habitTargets?.weeklyWorkout || 4);
      setLoading(false);
    } catch (error) {
      console.error('[HeroStreakCard] Error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const progress = Math.min((weeklyWorkouts / weeklyTarget) * 100, 100);
  const isOnFire = streak >= 3;
  const weekComplete = weeklyWorkouts >= weeklyTarget;

  if (loading) {
    return (
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-3 animate-pulse">
        <div className="h-12 bg-slate-700/50 rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)]"
    >
      {/* Gradient overlay come GlowCard */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative p-3">
        {/* Layout compatto orizzontale */}
        <div className="flex items-center gap-3">
          {/* Icona streak */}
          <div className={`p-2 rounded-xl flex-shrink-0 ${
            isOnFire 
              ? 'bg-gradient-to-br from-orange-500 to-red-500' 
              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
          }`}>
            {isOnFire ? (
              <Flame size={18} className="text-white" />
            ) : (
              <Zap size={18} className="text-white" />
            )}
          </div>
          
          {/* Info streak */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${isOnFire ? 'text-orange-400' : 'text-blue-400'}`}>
                {streak}
              </span>
              <span className="text-xs text-slate-400">
                {streak === 1 ? 'giorno' : 'giorni'} streak
              </span>
              {weekComplete && (
                <span className="px-1.5 py-0.5 bg-emerald-500/20 rounded-full flex items-center gap-1">
                  <Trophy size={10} className="text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">OK!</span>
                </span>
              )}
            </div>
            
            {/* Mini progress bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${
                    weekComplete
                      ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                      : isOnFire
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-400'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-500 flex-shrink-0">
                {weeklyWorkouts}/{weeklyTarget}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}