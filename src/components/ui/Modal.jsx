import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { components } from '../../config/designSystem';

/**
 * Modern Modal Component with glassmorphism effects
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
}) => {
  // Handle ESC key
  const handleKeyDown = useCallback((e) => {
    if (closeOnEsc && e.key === 'Escape') {
      onClose();
    }
  }, [closeOnEsc, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={components.modal.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`
              bg-theme-bg-secondary/95 backdrop-blur-2xl 
              border border-theme/50 rounded-2xl 
              shadow-2xl shadow-black/30
              ${sizes[size]} w-full 
              max-h-[90vh] overflow-hidden
              flex flex-col
              ring-1 ring-white/5
              ${className}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-6 border-b border-theme/50">
                <div>
                  {title && (
                    <h2 className="text-xl font-bold text-theme-text-primary">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-theme-text-secondary mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                  >
                    <X size={20} />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-6 border-t border-theme/50 bg-theme-bg-tertiary/20">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Confirmation Modal
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Conferma',
  message = 'Sei sicuro di voler procedere?',
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'danger', // 'danger', 'warning', 'info'
  loading = false,
}) => {
  const variants = {
    danger: {
      icon: '⚠️',
      buttonClass: 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-lg shadow-rose-500/25',
    },
    warning: {
      icon: '⚡',
      buttonClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25',
    },
    info: {
      icon: 'ℹ️',
      buttonClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25',
    },
  };

  const config = variants[variant] || variants.danger;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center py-4">
        <div className="text-5xl mb-4">{config.icon}</div>
        <h3 className="text-xl font-bold text-theme-text-primary mb-2">{title}</h3>
        <p className="text-theme-text-secondary">{message}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <motion.button
          onClick={onClose}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3 px-4 rounded-xl bg-theme-bg-tertiary/60 hover:bg-theme-bg-tertiary text-theme-text-primary font-semibold transition-colors disabled:opacity-50"
        >
          {cancelText}
        </motion.button>
        <motion.button
          onClick={onConfirm}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 ${config.buttonClass}`}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Attendere...
            </span>
          ) : confirmText}
        </motion.button>
      </div>
    </Modal>
  );
};

/**
 * Drawer/Slide-in Panel
 */
export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right', // 'left', 'right', 'bottom'
  size = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sizes = {
    sm: position === 'bottom' ? 'h-1/3' : 'w-80',
    md: position === 'bottom' ? 'h-1/2' : 'w-96',
    lg: position === 'bottom' ? 'h-2/3' : 'w-[480px]',
    xl: position === 'bottom' ? 'h-3/4' : 'w-[640px]',
  };

  const positions = {
    left: {
      container: 'left-0 top-0 bottom-0',
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
    right: {
      container: 'right-0 top-0 bottom-0',
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    },
    bottom: {
      container: 'bottom-0 left-0 right-0',
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
    },
  };

  const posConfig = positions[position] || positions.right;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={posConfig.initial}
            animate={posConfig.animate}
            exit={posConfig.exit}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={`
              fixed z-50 ${posConfig.container} ${sizes[size]}
              bg-theme-bg-secondary/95 backdrop-blur-2xl
              border-l border-theme/50
              shadow-2xl shadow-black/30
              flex flex-col
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-theme/50">
              <h2 className="text-lg font-bold text-theme-text-primary">{title}</h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-theme/50 bg-theme-bg-tertiary/20">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
