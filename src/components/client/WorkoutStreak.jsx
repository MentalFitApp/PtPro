import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { Flame, Award, TrendingUp, Calendar } from 'lucide-react';
import WorkoutCalendarModal from './WorkoutCalendarModal';

/**
 * Workout Streak Counter - Mostra la catena di giorni consecutivi con allenamento
 * @param {boolean} compact - Versione compatta (card media)
 * @param {boolean} mini - Versione minima per griglia stats (solo numero + icona)
 * @param {object} clientData - Se fornito, usa questi dati invece di fetch (per admin/coach)
 * @param {string} clientId - ID client per admin/coach view
 */
export default function WorkoutStreak({ compact = false, mini = false, clientData = null, clientId = null }) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weekActivity, setWeekActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    calculateStreak();
  }, []);

  const calculateStreak = async () => {
    // Se abbiamo già i dati del client (admin view)
    if (clientData) {
      processClientData(clientData);
      return;
    }
    
    // Altrimenti fetch per il client loggato o clientId fornito
    const targetId = clientId || auth.currentUser?.uid;
    if (!targetId) {
      setLoading(false);
      return;
    }

    try {
      const clientDoc = await getDoc(getTenantDoc(db, 'clients', targetId));
      if (!clientDoc.exists()) {
        setLoading(false);
        return;
      }

      processClientData(clientDoc.data());
    } catch (error) {
      console.error('Errore calcolo streak:', error);
      setLoading(false);
    }
  };

  const processClientData = (data) => {
    const habits = data.habits || {};
    const workoutLog = data.workoutLog || {};
      
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;
      let checkDate = new Date();
      const last7Days = [];

      // Calcola streak corrente
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hadWorkout = 
          (habits[dateStr]?.workout >= 1) || 
          (workoutLog[dateStr]?.completed === true);

        if (hadWorkout) {
          currentStreak++;
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Permetti 1 giorno di pausa senza rompere streak
          const yesterday = new Date(checkDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const hadWorkoutYesterday = 
            (habits[yesterdayStr]?.workout >= 1) || 
            (workoutLog[yesterdayStr]?.completed === true);
          
          if (hadWorkoutYesterday) {
            checkDate.setDate(checkDate.getDate() - 2);
            continue;
          }
          break;
        }
      }

      // Ultimi 7 giorni per visualizzazione
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const hadWorkout = 
          (habits[dateStr]?.workout >= 1) || 
          (workoutLog[dateStr]?.completed === true);
        
        last7Days.push({
          date: dateStr,
          day: date.toLocaleDateString('it-IT', { weekday: 'short' }),
          completed: hadWorkout
        });
      }

      setStreak(currentStreak);
      setLongestStreak(Math.max(maxStreak, data.longestStreak || 0));
      setWeekActivity(last7Days);
      setLoading(false);
  };

  // Trigger celebration per milestone
  useEffect(() => {
    if (streak > 0 && [7, 14, 30, 60, 100].includes(streak)) {
      const event = new CustomEvent('celebration', {
        detail: {
          type: 'streak',
          title: `${streak} Giorni di Fila! 🔥`,
          message: `Non rompere la catena! Continua così!`,
          emoji: streak >= 100 ? '💯' : streak >= 30 ? '🏆' : '🎉'
        }
      });
      window.dispatchEvent(event);
    }
  }, [streak]);

  if (loading) {
    if (mini) {
      return (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 sm:p-2.5 animate-pulse">
          <div className="h-8 bg-slate-700 rounded"></div>
        </div>
      );
    }
    return (
      <div className={`bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 ${compact ? 'p-4' : 'p-6'} animate-pulse shadow-glow`}>
        <div className="h-20 bg-slate-700 rounded"></div>
      </div>
    );
  }

  // Versione MINI per griglia stats - stile identico alle altre card stats
  if (mini) {
    return (
      <>
        <div 
          onClick={() => setShowCalendar(true)}
          className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 sm:p-2.5 cursor-pointer hover:border-orange-400/50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] sm:text-xs text-slate-400 truncate">Streak</span>
            <Flame className="text-orange-400 flex-shrink-0" size={12} />
          </div>
          <div className="text-base sm:text-xl font-bold text-orange-400">{streak}</div>
          <div className="text-[9px] sm:text-xs text-slate-400 truncate">giorni 🔥</div>
        </div>
        <WorkoutCalendarModal 
          isOpen={showCalendar} 
          onClose={() => setShowCalendar(false)}
          clientId={clientId}
        />
      </>
    );
  }

  if (compact) {
    return (
      <>
        <div 
          onClick={() => setShowCalendar(true)}
          className="bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/30 rounded-xl p-4 cursor-pointer hover:border-orange-400/50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Streak Attuale</p>
              <div className="flex items-center gap-2">
                <Flame className="text-orange-400" size={24} />
                <span className="text-3xl font-bold text-orange-400">{streak}</span>
                <span className="text-slate-400 text-sm">giorni</span>
              </div>
            </div>
            {longestStreak > streak && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Record</p>
                <p className="text-xl font-bold text-slate-300">{longestStreak}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Tocca per vedere il calendario</p>
        </div>
        <WorkoutCalendarModal 
          isOpen={showCalendar} 
          onClose={() => setShowCalendar(false)} 
        />
      </>
    );
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 space-y-6 shadow-glow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Flame className="text-orange-400" size={24} />
          Streak Allenamenti
        </h2>
        {streak >= 7 && (
          <Award className="text-yellow-400" size={28} />
        )}
      </div>

      {/* Main Streak Display */}
      <div className="text-center py-6 bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/30 rounded-xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Flame className="text-orange-400" size={48} />
          <div>
            <div className="text-6xl font-bold text-orange-400">{streak}</div>
            <p className="text-slate-300 text-sm mt-1">
              {streak === 1 ? 'giorno' : 'giorni'} consecutivi
            </p>
          </div>
        </div>
        
        {streak === 0 ? (
          <p className="text-slate-400 text-sm mt-4">
            Inizia oggi la tua catena! 💪
          </p>
        ) : (
          <p className="text-emerald-400 text-sm mt-4 font-semibold">
            Non rompere la catena! 🔗
          </p>
        )}
      </div>

      {/* Week Activity - Cliccabile per aprire calendario */}
      <div 
        onClick={() => setShowCalendar(true)}
        className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 -m-2 transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-400">Ultimi 7 giorni</p>
          <p className="text-xs text-blue-400 flex items-center gap-1">
            <Calendar size={12} />
            Vedi calendario
          </p>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekActivity.map((day, idx) => (
            <div key={idx} className="text-center">
              <div 
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                  day.completed 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-700 text-slate-500'
                }`}
              >
                {day.completed ? '✓' : '○'}
              </div>
              <p className="text-xs text-slate-400 mt-1">{day.day}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/40 rounded-lg p-4 text-center border border-slate-700">
          <TrendingUp className="text-blue-400 mx-auto mb-2" size={20} />
          <p className="text-2xl font-bold text-slate-100">{longestStreak}</p>
          <p className="text-xs text-slate-400 mt-1">Record Personale</p>
        </div>
        <div 
          onClick={() => setShowCalendar(true)}
          className="bg-slate-900/40 rounded-lg p-4 text-center border border-slate-700 cursor-pointer hover:border-purple-500/50 transition-all"
        >
          <Calendar className="text-purple-400 mx-auto mb-2" size={20} />
          <p className="text-2xl font-bold text-slate-100">
            {weekActivity.filter(d => d.completed).length}/7
          </p>
          <p className="text-xs text-slate-400 mt-1">Questa Settimana</p>
        </div>
      </div>

      {/* Calendar Modal */}
      <WorkoutCalendarModal 
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
      />

      {/* Motivational Messages */}
      {streak >= 30 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
          <p className="text-lg font-semibold text-purple-300 mb-1">
            🏆 Guerriero della Costanza!
          </p>
          <p className="text-xs text-slate-400">
            Hai mantenuto la routine per un mese intero!
          </p>
        </div>
      )}
      
      {streak >= 7 && streak < 30 && (
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <p className="text-sm font-semibold text-blue-300 mb-1">
            🎯 Una settimana perfetta!
          </p>
          <p className="text-xs text-slate-400">
            Continua così per raggiungere i 30 giorni!
          </p>
        </div>
      )}
    </div>
  );
}
