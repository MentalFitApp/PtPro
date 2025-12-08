// src/components/ui/CopyButton.jsx
// Bottone riutilizzabile per copiare testo negli appunti

import React, { useState, useCallback } from 'react';
import { Copy, Check, ClipboardCopy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';

/**
 * Bottone per copiare testo negli appunti con feedback visivo
 */
export function CopyButton({ 
  text, 
  label = 'Copia',
  successLabel = 'Copiato!',
  showToast = true,
  toastMessage = 'Copiato negli appunti!',
  variant = 'icon', // 'icon', 'button', 'minimal'
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  iconOnly = false,
  disabled = false,
  onCopy
}) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const handleCopy = useCallback(async () => {
    if (disabled || !text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      if (showToast) {
        toast.success(toastMessage);
      }
      
      if (onCopy) {
        onCopy(text);
      }

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Errore copia:', err);
      toast.error('Impossibile copiare');
    }
  }, [text, disabled, showToast, toastMessage, toast, onCopy]);

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleCopy}
        disabled={disabled}
        className={`text-slate-400 hover:text-white transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={copied ? successLabel : label}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check size={iconSizes[size]} className="text-green-400" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Copy size={iconSizes[size]} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <motion.button
        onClick={handleCopy}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          ${sizeClasses[size]}
          rounded-lg transition-all
          ${copied 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        title={copied ? successLabel : label}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="flex items-center gap-1"
            >
              <Check size={iconSizes[size]} />
              {!iconOnly && <span>{successLabel}</span>}
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-1"
            >
              <Copy size={iconSizes[size]} />
              {!iconOnly && <span>{label}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // variant === 'button'
  return (
    <motion.button
      onClick={handleCopy}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${copied 
          ? 'bg-green-500 text-white' 
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <Check size={iconSizes[size]} />
            <span>{successLabel}</span>
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <ClipboardCopy size={iconSizes[size]} />
            <span>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Campo di input con bottone copia integrato
 */
export function CopyField({ 
  value, 
  label,
  className = '' 
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-sm text-slate-400">{label}:</span>
      )}
      <div className="flex-1 flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
        <span className="flex-1 text-white text-sm truncate">{value}</span>
        <CopyButton text={value} variant="minimal" size="sm" showToast />
      </div>
    </div>
  );
}

export default CopyButton;
