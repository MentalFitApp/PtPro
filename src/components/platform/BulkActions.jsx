// src/components/platform/BulkActions.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, Square, Trash2, Mail, DollarSign, 
  Lock, Unlock, Package, X, AlertTriangle 
} from 'lucide-react';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const BulkActions = ({ tenants, selectedTenantIds, onSelectionChange, onActionComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const selectedTenants = tenants.filter(t => selectedTenantIds.has(t.id));
  const allSelected = tenants.length > 0 && selectedTenantIds.size === tenants.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(tenants.map(t => t.id)));
    }
  };

  const toggleTenant = (tenantId) => {
    const newSelection = new Set(selectedTenantIds);
    if (newSelection.has(tenantId)) {
      newSelection.delete(tenantId);
    } else {
      newSelection.add(tenantId);
    }
    onSelectionChange(newSelection);
  };

  const confirmAction = (action) => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const executeBulkAction = async () => {
    if (!pendingAction || selectedTenants.length === 0) return;

    setIsProcessing(true);
    setShowConfirmModal(false);

    try {
      const updates = selectedTenants.map(async (tenant) => {
        const tenantRef = doc(db, 'tenants', tenant.id);
        
        switch (pendingAction) {
          case 'suspend':
            return updateDoc(tenantRef, { 
              status: 'suspended', 
              suspendedAt: serverTimestamp(),
              updatedAt: serverTimestamp() 
            });
          
          case 'activate':
            return updateDoc(tenantRef, { 
              status: 'active', 
              suspendedAt: null,
              updatedAt: serverTimestamp() 
            });
          
          case 'delete':
            // Soft delete
            return updateDoc(tenantRef, { 
              status: 'deleted', 
              deletedAt: serverTimestamp(),
              updatedAt: serverTimestamp() 
            });
          
          case 'upgrade':
            return updateDoc(tenantRef, { 
              subscription: 'professional',
              updatedAt: serverTimestamp() 
            });
          
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(updates);
      
      onSelectionChange(new Set()); // Clear selection
      onActionComplete?.(`${pendingAction} completato su ${selectedTenants.length} tenant`);
      
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('Errore durante l\'operazione: ' + error.message);
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  const bulkActions = [
    { 
      id: 'activate', 
      label: 'Attiva Selezionati', 
      icon: <Unlock size={16} />, 
      color: 'green',
      description: 'Riattiva i tenant sospesi'
    },
    { 
      id: 'suspend', 
      label: 'Sospendi Selezionati', 
      icon: <Lock size={16} />, 
      color: 'orange',
      description: 'Sospende temporaneamente i tenant'
    },
    { 
      id: 'upgrade', 
      label: 'Upgrade a Professional', 
      icon: <Package size={16} />, 
      color: 'blue',
      description: 'Aggiorna al piano Professional'
    },
    { 
      id: 'delete', 
      label: 'Elimina Selezionati', 
      icon: <Trash2 size={16} />, 
      color: 'red',
      description: 'Soft delete dei tenant'
    },
  ];

  return (
    <>
      {/* Selection Bar */}
      <AnimatePresence>
        {selectedTenantIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckSquare size={20} className="text-yellow-400" />
                <span className="font-semibold text-white">
                  {selectedTenantIds.size} tenant selezionati
                </span>
              </div>

              <div className="flex gap-2">
                {bulkActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => confirmAction(action.id)}
                    disabled={isProcessing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isProcessing
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : `bg-${action.color}-500/20 text-${action.color}-400 hover:bg-${action.color}-500/30 border border-${action.color}-500/30`
                    }`}
                    title={action.description}
                  >
                    {action.icon}
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => onSelectionChange(new Set())}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Deseleziona tutto"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select All Checkbox */}
      {tenants.length > 0 && (
        <div className="mb-4">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
          >
            {allSelected ? <CheckSquare size={20} className="text-yellow-400" /> : <Square size={20} className="text-slate-400" />}
            <span className="text-sm font-medium">
              {allSelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
            </span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold">Conferma Azione</h2>
              </div>

              <p className="text-slate-300 mb-2">
                Stai per eseguire <strong className="text-yellow-400">{pendingAction}</strong> su:
              </p>
              <p className="text-2xl font-bold text-white mb-4">
                {selectedTenants.length} tenant
              </p>

              <div className="bg-slate-800/50 rounded-lg p-3 mb-6 max-h-32 overflow-y-auto">
                <ul className="text-sm text-slate-400 space-y-1">
                  {selectedTenants.slice(0, 10).map(t => (
                    <li key={t.id}>• {t.name || t.id}</li>
                  ))}
                  {selectedTenants.length > 10 && (
                    <li className="text-slate-500">... e altri {selectedTenants.length - 10}</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-all"
                >
                  Annulla
                </button>
                <button
                  onClick={executeBulkAction}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all"
                >
                  Conferma
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Individual Checkbox Helper */}
      <div className="hidden">
        {/* This will be used by parent component to render checkboxes */}
      </div>
    </>
  );
};

export default BulkActions;
