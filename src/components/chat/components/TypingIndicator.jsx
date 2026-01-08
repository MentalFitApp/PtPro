import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const names = users.map(u => u.name).join(', ');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-slate-500">{names} sta scrivendo...</span>
    </motion.div>
  );
};

export default TypingIndicator;
