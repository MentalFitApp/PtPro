import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { QUICK_REPLY_TEMPLATES } from '../utils/chatHelpers';

const QuickReplyTemplates = ({ role, onSelect, isOpen, onClose }) => {
  const templates = QUICK_REPLY_TEMPLATES[role] || QUICK_REPLY_TEMPLATES.client;
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl max-h-64 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-medium text-slate-400">Risposte rapide</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X size={14} className="text-slate-400" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {templates.map((template, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelect(template.text);
              onClose();
            }}
            className="text-left px-3 py-2 text-sm bg-white/5 hover:bg-cyan-500/20 rounded-lg 
                       transition-colors text-slate-300 hover:text-white truncate"
          >
            {template.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickReplyTemplates;
