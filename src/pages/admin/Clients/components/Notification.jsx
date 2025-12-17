// src/pages/admin/Clients/components/Notification.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

/**
 * Componente per notifiche toast in-page
 */
const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${
          type === 'error' 
            ? 'bg-red-900/80 text-red-300 border-red-500/30' 
            : 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
        } backdrop-blur-md shadow-lg`}
      >
        <AlertCircle className={type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
        <p>{message}</p>
        <button 
          onClick={onDismiss} 
          className="p-2 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Notification;
