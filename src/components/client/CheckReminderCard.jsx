// src/components/client/CheckReminderCard.jsx
// Card reminder COMPATTA per ricordare al cliente di caricare il check
// Stile unificato con Dashboard Admin (GlowCard style)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckReminderCard({ daysSinceLastCheck, lastCheckDate }) {
  const navigate = useNavigate();
  
  // Non mostrare se check recente (meno di 5 giorni)
  if (daysSinceLastCheck !== null && daysSinceLastCheck >= 0 && daysSinceLastCheck < 5) {
    return null;
  }

  const isUrgent = daysSinceLastCheck >= 7 || daysSinceLastCheck === -1;
  const isFirstCheck = daysSinceLastCheck === -1;

  const getInfo = () => {
    if (isFirstCheck) {
      return {
        title: "Primo Check 📸",
        subtitle: "Carica foto e peso per iniziare",
      };
    }
    if (daysSinceLastCheck >= 7) {
      return {
        title: "Check settimanale 📸",
        subtitle: `${daysSinceLastCheck} giorni fa l'ultimo`,
      };
    }
    return {
      title: `Check tra ${7 - daysSinceLastCheck}g`,
      subtitle: lastCheckDate ? `Ultimo: ${lastCheckDate.toLocaleDateString('it-IT')}` : '',
    };
  };

  const info = getInfo();

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/client/checks')}
      className={`w-full relative overflow-hidden rounded-2xl text-left transition-all duration-300 ${
        isUrgent
          ? 'bg-slate-800/40 backdrop-blur-sm border border-purple-500/40 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]'
          : 'bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)]'
      }`}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      {isUrgent && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
      )}
      
      <div className="relative p-3 flex items-center gap-3">
        <div className={`p-2 rounded-xl flex-shrink-0 ${
          isUrgent 
            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
            : 'bg-slate-700/50'
        }`}>
          <Camera size={18} className="text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isUrgent ? 'text-white' : 'text-slate-300'}`}>
              {info.title}
            </span>
            {isUrgent && (
              <Sparkles size={12} className="text-purple-400" />
            )}
          </div>
          <p className="text-[11px] text-slate-500">{info.subtitle}</p>
        </div>
        
        <ChevronRight size={16} className={isUrgent ? 'text-purple-400' : 'text-slate-500'} />
      </div>
    </motion.button>
  );
}
