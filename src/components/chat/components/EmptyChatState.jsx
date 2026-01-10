import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const EmptyChatState = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden">
    <motion.div 
      className="relative z-10 bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-2xl rounded-full flex items-center justify-center mb-8 ring-4 ring-cyan-500/20 shadow-2xl border border-cyan-500/30"
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <MessageSquare size={64} className="text-cyan-400" strokeWidth={1.5} />
      </motion.div>
      <h2 className="text-3xl font-bold text-white mb-3 text-center">Seleziona una chat</h2>
      <p className="text-center max-w-md text-base text-slate-400 leading-relaxed px-4">
        Scegli una conversazione dalla lista a sinistra o iniziane una nuova cliccando sul pulsante <span className="text-cyan-400 font-semibold">+</span>
      </p>
    </motion.div>
  </div>
);

export default EmptyChatState;
