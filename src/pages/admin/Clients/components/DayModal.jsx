// src/pages/admin/Clients/components/DayModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toDate } from '../../../../firebase';

/**
 * Modal per visualizzare i clienti di un giorno specifico nel calendario
 */
const DayModal = ({ 
  isOpen, 
  onClose, 
  date, 
  clients, 
  calendarType, 
  filter,
  paymentsTotals,
  isAdmin,
  onClientClick 
}) => (
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100">
              {(filter === 'expiring' || filter === 'expired' || calendarType === 'scadenze') 
                ? 'Scadenze del' 
                : 'Clienti aggiunti il'} {date ? new Date(date).toLocaleDateString('it-IT') : ''}
            </h3>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full hover:bg-white/10"
            >
              <X size={18} className="text-slate-300" />
            </button>
          </div>

          {clients.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {clients.map(c => (
                <div 
                  key={c.id} 
                  className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-slate-100 font-semibold">{c.name}</p>
                    <p className="text-xs text-rose-300">{c.email}</p>
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span>Inizio: {toDate(c.startDate)?.toLocaleDateString('it-IT') || 'N/D'}</span>
                      <span>Scadenza: {toDate(c.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <span className="text-xs px-2 py-1 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-600/50">
                        €{(paymentsTotals[c.id] ?? 0).toFixed(2)}
                      </span>
                    )}
                    <button 
                      onClick={() => onClientClick(c.id)} 
                      className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white preserve-white transition-colors"
                    >
                      Dettagli
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Nessun cliente aggiunto in questa data.</p>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default DayModal;
