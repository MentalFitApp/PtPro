// src/pages/admin/Clients/components/ConfirmationModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

/**
 * Modal di conferma eliminazione cliente
 */
const ConfirmationModal = ({ isOpen, onClose, onConfirm, clientName }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 text-center shadow-xl"
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/40 mb-4">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Conferma Eliminazione</h3>
          <p className="text-sm text-slate-400 mt-2">
            Sei sicuro di voler eliminare il cliente <strong className="text-rose-400">{clientName}</strong>? L&apos;operazione è irreversibile.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-2 text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors border border-slate-600"
            >
              Annulla
            </button>
            <button 
              onClick={onConfirm} 
              className="px-6 py-2 text-sm font-semibold text-white preserve-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
            >
              Elimina
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmationModal;
