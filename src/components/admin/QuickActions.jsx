// src/components/admin/QuickActions.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Users, Mail, Calendar, FileText, TrendingUp, 
  CheckSquare, Clock, DollarSign, MessageSquare, X,
  UserPlus, CalendarPlus, FileCheck, Send
} from 'lucide-react';

/**
 * Azioni rapide per admin - widget floating o dropdown
 * Permette operazioni comuni senza navigare tra pagine
 */
export default function QuickActions({ onClose, position = 'bottom-right' }) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-20 right-6',
    'bottom-left': 'bottom-20 left-6',
    'top-right': 'top-20 right-6',
  };

  const actions = [
    {
      id: 'new-client',
      label: 'Nuovo Cliente',
      icon: <UserPlus size={18} />,
      color: 'from-blue-500 to-cyan-500',
      route: '/admin/new-client',
    },
    {
      id: 'schedule-check',
      label: 'Programma Check',
      icon: <CalendarPlus size={18} />,
      color: 'from-purple-500 to-pink-500',
      route: '/admin/clients',
    },
    {
      id: 'send-reminder',
      label: 'Invia Promemoria',
      icon: <Send size={18} />,
      color: 'from-green-500 to-emerald-500',
      action: 'reminder',
    },
    {
      id: 'view-expiring',
      label: 'Scadenze Oggi',
      icon: <Clock size={18} />,
      color: 'from-orange-500 to-red-500',
      route: '/admin/clients?filter=expiring',
    },
    {
      id: 'pending-anamnesi',
      label: 'Anamnesi Mancanti',
      icon: <FileCheck size={18} />,
      color: 'from-yellow-500 to-orange-500',
      action: 'anamnesi',
    },
    {
      id: 'payments-due',
      label: 'Pagamenti in Attesa',
      icon: <DollarSign size={18} />,
      color: 'from-emerald-500 to-teal-500',
      route: '/admin/clients?filter=payments',
    },
  ];

  const handleAction = (action) => {
    if (action.route) {
      window.location.href = action.route;
    } else if (action.action) {
      // Trigger custom action
      console.log('Action:', action.action);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed ${positionClasses[position]} z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50 flex items-center justify-center text-white hover:shadow-xl transition-all`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Zap size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Actions Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
            />

            {/* Actions Grid */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`fixed ${positionClasses[position]} z-40 mb-20 w-80 max-w-[calc(100vw-3rem)]`}
            >
              <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
                  <Zap className="text-blue-400" size={20} />
                  <h3 className="text-white font-semibold">Azioni Rapide</h3>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {actions.map((action, index) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAction(action)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:shadow-lg"
                    >
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                      
                      {/* Content */}
                      <div className="relative z-10 flex flex-col gap-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg`}>
                          {action.icon}
                        </div>
                        <span className="text-xs font-medium text-slate-200 leading-tight">
                          {action.label}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Batch Actions Component - Seleziona multipli clienti ed esegui azioni
 */
export function BatchActions({ selectedClients = [], onClearSelection }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const batchActions = [
    {
      id: 'send-email',
      label: 'Invia Email',
      icon: <Mail size={16} />,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'send-reminder',
      label: 'Promemoria',
      icon: <Clock size={16} />,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      id: 'export',
      label: 'Esporta',
      icon: <FileText size={16} />,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'tag',
      label: 'Aggiungi Tag',
      icon: <CheckSquare size={16} />,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  const handleBatchAction = async (actionId) => {
    setIsProcessing(true);
    try {
      console.log(`Executing ${actionId} on`, selectedClients);
      // Implementa logica batch
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Batch action error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedClients.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-4 min-w-[300px]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="text-blue-400" size={18} />
          <span className="text-white font-semibold">
            {selectedClients.length} selezionat{selectedClients.length === 1 ? 'o' : 'i'}
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {batchActions.map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleBatchAction(action.id)}
            disabled={isProcessing}
            className={`${action.color} text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {action.icon}
            {action.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
