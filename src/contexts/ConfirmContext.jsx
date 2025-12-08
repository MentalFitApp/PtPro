import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, LogOut, X, Check, AlertCircle, Info } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};

const icons = {
  danger: Trash2,
  warning: AlertTriangle,
  logout: LogOut,
  info: Info,
  default: AlertCircle
};

const colors = {
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    button: 'bg-red-600 hover:bg-red-700',
    icon: 'text-red-400'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    button: 'bg-yellow-600 hover:bg-yellow-700',
    icon: 'text-yellow-400'
  },
  logout: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    button: 'bg-orange-600 hover:bg-orange-700',
    icon: 'text-orange-400'
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    button: 'bg-blue-600 hover:bg-blue-700',
    icon: 'text-blue-400'
  },
  default: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    button: 'bg-slate-600 hover:bg-slate-700',
    icon: 'text-slate-400'
  }
};

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText, 
  cancelText, 
  type,
  onConfirm, 
  onCancel,
  isLoading 
}) => {
  const Icon = icons[type] || icons.default;
  const color = colors[type] || colors.default;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onCancel}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md mx-4"
          >
            <div className={`${color.bg} ${color.border} border backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden`}>
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${color.bg} ${color.border} border`}>
                    <Icon size={24} className={color.icon} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {title}
                    </h3>
                    <p className="text-slate-300 text-sm">
                      {message}
                    </p>
                  </div>
                  <button
                    onClick={onCancel}
                    className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    disabled={isLoading}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 p-4 pt-2 bg-slate-900/30">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${color.button}`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={18} />
                      {confirmText}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Conferma',
    cancelText: 'Annulla',
    type: 'default',
    isLoading: false,
    resolve: null
  });

  const confirm = useCallback(({
    title = 'Sei sicuro?',
    message = 'Questa azione non può essere annullata.',
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    type = 'default'
  } = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        isLoading: false,
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    dialogState.resolve?.(true);
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  const handleCancel = useCallback(() => {
    dialogState.resolve?.(false);
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  // Funzioni helper per casi comuni
  const confirmDelete = useCallback((itemName = 'questo elemento') => {
    return confirm({
      title: 'Elimina definitivamente?',
      message: `Stai per eliminare ${itemName}. Questa azione non può essere annullata.`,
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      type: 'danger'
    });
  }, [confirm]);

  const confirmLogout = useCallback(() => {
    return confirm({
      title: 'Esci dall\'account?',
      message: 'Verrai disconnesso da questa sessione.',
      confirmText: 'Esci',
      cancelText: 'Annulla',
      type: 'logout'
    });
  }, [confirm]);

  const confirmAction = useCallback((message) => {
    return confirm({
      title: 'Conferma azione',
      message,
      confirmText: 'Conferma',
      cancelText: 'Annulla',
      type: 'warning'
    });
  }, [confirm]);

  const value = {
    confirm,
    confirmDelete,
    confirmLogout,
    confirmAction
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        {...dialogState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export default ConfirmContext;
