import React from 'react';
import { MessageSquare } from 'lucide-react';
import AnimatedStars from './AnimatedStars';

const EmptyChatState = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-500 relative overflow-hidden">
    <AnimatedStars />
    <div className="relative z-10">
      <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 ring-4 ring-white/10 shadow-2xl border border-white/20">
        <MessageSquare size={48} className="text-cyan-400" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2 text-center">Seleziona una chat</h2>
      <p className="text-center max-w-sm text-slate-400">
        Scegli una conversazione dalla lista a sinistra o iniziane una nuova cliccando sul pulsante +
      </p>
    </div>
  </div>
);

export default EmptyChatState;
