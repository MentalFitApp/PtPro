// src/components/client/CheckReminderCard.jsx
// Card reminder per ricordare al cliente di caricare il check settimanale
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Card che ricorda al cliente di caricare il check
 * @param {number} daysSinceLastCheck - giorni dall'ultimo check (-1 se mai fatto)
 * @param {Date} lastCheckDate - data ultimo check
 */
export default function CheckReminderCard({ daysSinceLastCheck, lastCheckDate }) {
  const navigate = useNavigate();
  
  // Non mostrare se check recente (meno di 5 giorni)
  if (daysSinceLastCheck !== null && daysSinceLastCheck >= 0 && daysSinceLastCheck < 5) {
    return null;
  }

  const isUrgent = daysSinceLastCheck >= 7 || daysSinceLastCheck === -1;
  const isFirstCheck = daysSinceLastCheck === -1;

  // Calcola prossimo check consigliato
  const getNextCheckInfo = () => {
    if (isFirstCheck) {
      return {
        title: "Carica il tuo primo Check! 📸",
        subtitle: "Foto e peso per iniziare a tracciare i progressi",
        urgent: true
      };
    }
    
    if (daysSinceLastCheck >= 7) {
      return {
        title: "È ora del Check settimanale! 📸",
        subtitle: `Ultimo check: ${daysSinceLastCheck} giorni fa`,
        urgent: true
      };
    }
    
    const daysUntilNext = 7 - daysSinceLastCheck;
    return {
      title: `Prossimo Check tra ${daysUntilNext} giorni`,
      subtitle: lastCheckDate ? `Ultimo: ${lastCheckDate.toLocaleDateString('it-IT')}` : '',
      urgent: false
    };
  };

  const info = getNextCheckInfo();

  return (
    <button
      onClick={() => navigate('/client/checks')}
      className={`w-full rounded-xl p-4 border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
        isUrgent
          ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-500/50 hover:border-purple-400/60'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${
          isUrgent 
            ? 'bg-purple-500/30' 
            : 'bg-slate-700/50'
        }`}>
          <Camera size={24} className={isUrgent ? 'text-purple-300' : 'text-slate-400'} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${isUrgent ? 'text-white' : 'text-slate-300'}`}>
              {info.title}
            </h3>
            {isUrgent && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                !
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{info.subtitle}</p>
        </div>
        
        <ChevronRight size={20} className={isUrgent ? 'text-purple-300' : 'text-slate-500'} />
      </div>
      
      {isUrgent && (
        <div className="mt-3 flex items-center gap-2 text-xs text-purple-200/80">
          <AlertCircle size={14} />
          <span>Carica foto fronte, retro, lato dx e sx + peso</span>
        </div>
      )}
    </button>
  );
}
