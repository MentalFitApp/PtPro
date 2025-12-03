// src/components/admin/BulkOperations.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, Mail, Clock, Tag, Download, Trash2, 
  Users, Calendar, DollarSign, FileText, X, AlertTriangle,
  Send, Bell, Archive, UserX, RefreshCw, Lock, Shield, MessageSquare
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { archiveClient } from '../../services/clientService';

/**
 * Operazioni Bulk su Clienti Selezionati
 * Permette azioni multiple su più clienti contemporaneamente
 */
export default function BulkOperations({ 
  selectedClients = [], 
  onClearSelection,
  onOperationComplete 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showArchiveSettings, setShowArchiveSettings] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [archiveSettings, setArchiveSettings] = useState({
    blockAppAccess: false,
    blockedScreens: [],
    customMessage: ''
  });
  const toast = useToast();

  const operations = [
    {
      id: 'send-email',
      label: 'Invia Email',
      icon: <Mail size={16} />,
      color: 'bg-blue-600 hover:bg-blue-700',
      confirmMessage: 'Vuoi inviare un\'email a {count} clienti?',
      requiresConfirm: true,
    },
    {
      id: 'send-reminder',
      label: 'Promemoria Scadenza',
      icon: <Bell size={16} />,
      color: 'bg-orange-600 hover:bg-orange-700',
      confirmMessage: 'Vuoi inviare un promemoria di scadenza a {count} clienti?',
      requiresConfirm: true,
    },
    {
      id: 'schedule-check',
      label: 'Programma Check',
      icon: <Calendar size={16} />,
      color: 'bg-purple-600 hover:bg-purple-700',
      confirmMessage: 'Vuoi programmare un check per {count} clienti?',
      requiresConfirm: false,
    },
    {
      id: 'add-tag',
      label: 'Aggiungi Tag',
      icon: <Tag size={16} />,
      color: 'bg-cyan-600 hover:bg-cyan-700',
      confirmMessage: null,
      requiresConfirm: false,
    },
    {
      id: 'export',
      label: 'Esporta CSV',
      icon: <Download size={16} />,
      color: 'bg-green-600 hover:bg-green-700',
      confirmMessage: null,
      requiresConfirm: false,
    },
    {
      id: 'archive',
      label: 'Archivia',
      icon: <Archive size={16} />,
      color: 'bg-slate-600 hover:bg-slate-700',
      confirmMessage: 'Vuoi archiviare {count} clienti?',
      requiresConfirm: true,
    },
    {
      id: 'update-status',
      label: 'Aggiorna Stato',
      icon: <RefreshCw size={16} />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      confirmMessage: null,
      requiresConfirm: false,
    },
    {
      id: 'delete',
      label: 'Elimina',
      icon: <Trash2 size={16} />,
      color: 'bg-red-600 hover:bg-red-700',
      confirmMessage: 'ATTENZIONE: Vuoi eliminare {count} clienti? Questa azione è irreversibile!',
      requiresConfirm: true,
      isDangerous: true,
    },
  ];

  const handleOperationClick = (operation) => {
    if (operation.id === 'archive') {
      setCurrentOperation(operation);
      setShowArchiveSettings(true);
    } else if (operation.requiresConfirm) {
      setCurrentOperation(operation);
      setShowConfirmDialog(true);
    } else {
      executeBulkOperation(operation);
    }
  };

  const executeBulkOperation = async (operation) => {
    setIsProcessing(true);
    setShowConfirmDialog(false);
    setShowArchiveSettings(false);

    try {
      switch (operation.id) {
        case 'send-email':
          // Simula operazione
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`Email inviata a ${selectedClients.length} clienti`);
          break;
        case 'send-reminder':
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`Promemoria inviato a ${selectedClients.length} clienti`);
          break;
        case 'schedule-check':
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`Check programmato per ${selectedClients.length} clienti`);
          break;
        case 'add-tag':
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`Tag aggiunto a ${selectedClients.length} clienti`);
          break;
        case 'export':
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`Esportazione completata (${selectedClients.length} clienti)`);
          break;
        case 'archive':
          // Archivia tutti i clienti selezionati con le impostazioni
          await Promise.all(
            selectedClients.map(client => 
              archiveClient(db, client.id, archiveSettings)
            )
          );
          toast.success(`${selectedClients.length} clienti archiviati`);
          // Reset archiveSettings
          setArchiveSettings({
            blockAppAccess: false,
            blockedScreens: [],
            customMessage: ''
          });
          break;
        case 'update-status':
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`Stato aggiornato per ${selectedClients.length} clienti`);
          break;
        case 'delete':
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success(`${selectedClients.length} clienti eliminati`);
          break;
        default:
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.info(`Operazione "${operation.label}" completata`);
      }

      onOperationComplete?.();
      onClearSelection?.();
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error(`Errore durante l'operazione: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  };

  if (selectedClients.length === 0) return null;

  return (
    <>
      {/* Floating Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <CheckSquare className="text-blue-400" size={18} />
            </div>
            <div>
              <p className="text-white font-semibold">
                {selectedClients.length} {selectedClients.length === 1 ? 'Cliente Selezionato' : 'Clienti Selezionati'}
              </p>
              <p className="text-xs text-slate-400">Scegli un'azione da eseguire</p>
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="text-slate-400 hover:text-white transition-colors p-2"
            title="Deseleziona tutti"
          >
            <X size={20} />
          </button>
        </div>

        {/* Operations Grid */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {operations.map((operation) => (
              <motion.button
                key={operation.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOperationClick(operation)}
                disabled={isProcessing}
                className={`${operation.color} text-white px-4 py-3 rounded-lg text-sm font-medium flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] ${
                  operation.isDangerous ? 'ring-2 ring-red-500/50' : ''
                }`}
                title={operation.label}
              >
                {operation.icon}
                <span className="text-xs leading-tight text-center">{operation.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="px-6 py-3 bg-blue-500/10 border-t border-slate-700 flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm text-blue-300">Operazione in corso...</span>
          </div>
        )}
      </motion.div>

      {/* Archive Settings Modal */}
      <AnimatePresence>
        {showArchiveSettings && currentOperation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowArchiveSettings(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-slate-600/30 flex items-center justify-center">
                      <Archive className="text-slate-300" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Impostazioni Archivio</h3>
                      <p className="text-xs text-slate-400">{selectedClients.length} clienti selezionati</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Blocco accesso app */}
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={archiveSettings.blockAppAccess}
                        onChange={(e) => setArchiveSettings({ ...archiveSettings, blockAppAccess: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Lock size={16} className="text-red-400" />
                          <span className="font-medium text-white">Blocca Accesso all'App</span>
                        </div>
                        <p className="text-xs text-slate-400">Il cliente non potrà più accedere all'applicazione mobile</p>
                      </div>
                    </label>
                  </div>

                  {/* Restrizioni schermate */}
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={16} className="text-yellow-400" />
                      <span className="font-medium text-white">Limita Accesso Schermate</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">Scegli quali sezioni dell'app bloccare:</p>
                    
                    <div className="space-y-2">
                      {[
                        { id: 'workouts', label: 'Allenamenti' },
                        { id: 'nutrition', label: 'Alimentazione' },
                        { id: 'checks', label: 'Check-in' },
                        { id: 'payments', label: 'Pagamenti' },
                        { id: 'messages', label: 'Messaggi' },
                        { id: 'profile', label: 'Profilo' }
                      ].map(screen => (
                        <label key={screen.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={archiveSettings.blockedScreens.includes(screen.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setArchiveSettings({
                                  ...archiveSettings,
                                  blockedScreens: [...archiveSettings.blockedScreens, screen.id]
                                });
                              } else {
                                setArchiveSettings({
                                  ...archiveSettings,
                                  blockedScreens: archiveSettings.blockedScreens.filter(s => s !== screen.id)
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            disabled={archiveSettings.blockAppAccess}
                          />
                          <span className={`text-sm ${archiveSettings.blockAppAccess ? 'text-slate-500' : 'text-slate-300'}`}>
                            {screen.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Messaggio personalizzato */}
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={16} className="text-blue-400" />
                      <span className="font-medium text-white">Messaggio Personalizzato</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">Questo messaggio verrà mostrato al cliente quando tenta di accedere</p>
                    <textarea
                      value={archiveSettings.customMessage}
                      onChange={(e) => setArchiveSettings({ ...archiveSettings, customMessage: e.target.value })}
                      placeholder="Es: Il tuo abbonamento è scaduto. Contatta la palestra per rinnovarlo."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-700 flex gap-3">
                  <button
                    onClick={() => {
                      setShowArchiveSettings(false);
                      setArchiveSettings({
                        blockAppAccess: false,
                        blockedScreens: [],
                        customMessage: ''
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white preserve-white rounded-lg transition-all font-medium"
                  >
                    Annulla
                  </button>
                  <motion.button
                    onClick={() => executeBulkOperation(currentOperation)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white preserve-white rounded-lg transition-all font-medium"
                  >
                    Archivia Clienti
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {showConfirmDialog && currentOperation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmDialog(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-6"
              >
                {/* Icon */}
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  currentOperation.isDangerous 
                    ? 'bg-red-500/20' 
                    : 'bg-blue-500/20'
                }`}>
                  {currentOperation.isDangerous ? (
                    <AlertTriangle className="text-red-400" size={24} />
                  ) : (
                    React.cloneElement(currentOperation.icon, { 
                      size: 24, 
                      className: 'text-blue-400' 
                    })
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white text-center mb-2">
                  Conferma Operazione
                </h3>

                {/* Message */}
                <p className={`text-center mb-6 ${
                  currentOperation.isDangerous ? 'text-red-300' : 'text-slate-300'
                }`}>
                  {currentOperation.confirmMessage?.replace('{count}', selectedClients.length)}
                </p>

                {/* Client List Preview */}
                {selectedClients.length <= 5 && (
                  <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Clienti selezionati:</p>
                    <ul className="space-y-1">
                      {selectedClients.map((client, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          {client.name || client.email || `Cliente ${i + 1}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white preserve-white rounded-lg transition-all font-medium"
                  >
                    Annulla
                  </button>
                  <motion.button
                    onClick={() => executeBulkOperation(currentOperation)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-4 py-3 text-white rounded-lg transition-all font-medium ${
                      currentOperation.isDangerous
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Conferma
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Mini-variant per tabelle - solo le azioni più comuni
 */
export function CompactBulkActions({ selectedCount, onAction, onClear }) {
  if (selectedCount === 0) return null;

  const quickActions = [
    { id: 'email', icon: <Mail size={14} />, label: 'Email', color: 'bg-blue-600' },
    { id: 'reminder', icon: <Bell size={14} />, label: 'Promemoria', color: 'bg-orange-600' },
    { id: 'export', icon: <Download size={14} />, label: 'Esporta', color: 'bg-green-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg"
    >
      <CheckSquare className="text-blue-400" size={16} />
      <span className="text-sm text-blue-300 font-medium">{selectedCount}</span>
      
      <div className="flex gap-1 ml-2">
        {quickActions.map(action => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAction(action.id)}
            className={`${action.color} text-white p-2 rounded transition-colors`}
            title={action.label}
          >
            {action.icon}
          </motion.button>
        ))}
      </div>

      <button
        onClick={onClear}
        className="ml-auto text-slate-400 hover:text-white transition-colors p-1"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
