// src/components/client/HeroStreakCard.jsx
// Hero Card motivazionale con streak e progress settimanale
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
  }, [refreshKey]); // Ricarica quando refreshKey cambia

  if (error) {
    return (
      <div className="bg-red-900/40 border border-red-500/40 rounded-2xl p-4">
        <div className="text-red-400 text-sm">Errore caricamento streak</div>
        <button 
          onClick={() => { setError(null); loadData(); }}
          className="text-xs text-red-300 underline mt-1"
        >
          Riprova
        </button>
      </div>
    );
  }

  const loadData = async () => {
    if (!auth.currentUser) {
      console.log('[HeroStreakCard] No auth user');
      setLoading(false);
      return;
    }

    try {
      console.log('[HeroStreakCard] Loading data...');
      const clientDoc = await getDoc(getTenantDoc(db, 'clients', auth.currentUser.uid));
      if (!clientDoc.exists()) {
        console.log('[HeroStreakCard] No client doc found');
        setLoading(false);
        return;
      }

      console.log('[HeroStreakCard] Client doc found, calculating...');
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
          // Permetti 1 giorno di pausa
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
      console.log('[HeroStreakCard] Data loaded:', { currentStreak, weekCount, target: weekly.target || data.habitTargets?.weeklyWorkout || 4 });
      setLoading(false);
    } catch (error) {
      console.error('[HeroStreakCard] Error loading:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const progress = Math.min((weeklyWorkouts / weeklyTarget) * 100, 100);
  const isOnFire = streak >= 3;
  const weekComplete = weeklyWorkouts >= weeklyTarget;

  // Messaggi motivazionali basati sullo streak
  const getMessage = () => {
    if (streak === 0) return "Inizia oggi la tua streak! 💪";
    if (streak === 1) return "Ottimo inizio! Continua così!";
    if (streak < 7) return "Stai costruendo l'abitudine!";
    if (streak < 14) return "Una settimana di fuoco! 🔥";
    if (streak < 30) return "Sei inarrestabile!";
    return "Sei una leggenda! 🏆";
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-2xl p-4 border border-orange-500/30 animate-pulse">
        <div className="h-16 bg-slate-700/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 border ${
        isOnFire 
          ? 'bg-gradient-to-br from-orange-500/20 via-red-500/20 to-yellow-500/20 border-orange-500/40' 
          : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      }`}
    >
      {/* Background decoration */}
      {isOnFire && (
        <div className="absolute top-0 right-0 opacity-20">
          <Flame size={80} className="text-orange-400" />
        </div>
      )}

      <div className="relative z-10">
        {/* Streak principale */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isOnFire 
                ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
            }`}>
              {isOnFire ? (
                <Flame size={24} className="text-white" />
              ) : (
                <Zap size={24} className="text-white" />
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${
                  isOnFire ? 'text-orange-400' : 'text-blue-400'
                }`}>
                  {streak}
                </span>
                <span className="text-sm text-slate-400">
                  {streak === 1 ? 'giorno' : 'giorni'} di streak
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{getMessage()}</p>
            </div>
          </div>

          {weekComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full"
            >
              <Trophy size={14} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Settimana OK!</span>
            </motion.div>
          )}
        </div>

        {/* Progress settimanale */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Target size={12} />
              Questa settimana
            </span>
            <span className={`font-medium ${
              weekComplete ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {weeklyWorkouts}/{weeklyTarget} allenamenti
            </span>
          </div>
          
          <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              key={`progress-${weeklyWorkouts}-${weeklyTarget}`}
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                weekComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : isOnFire
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-400'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}