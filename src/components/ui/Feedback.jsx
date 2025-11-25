/**
 * Feedback Components - Micro-interazioni e feedback visivo
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Info, Copy } from 'lucide-react';

/**
 * Tooltip informativo
 */
export const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: '-top-10 left-1/2 -translate-x-1/2',
    bottom: '-bottom-10 left-1/2 -translate-x-1/2',
    left: 'top-1/2 -translate-y-1/2 -left-2 -translate-x-full',
    right: 'top-1/2 -translate-y-1/2 -right-2 translate-x-full',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${positions[position]} px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50`}
          >
            {content}
            <div className="absolute w-2 h-2 bg-slate-900 border-slate-700 rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Badge con animazione
 */
export const AnimatedBadge = ({ children, variant = 'default', pulse = false }) => {
  const variants = {
    default: 'bg-slate-700 text-slate-200',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}
    >
      {pulse && (
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-current rounded-full mr-2"
        />
      )}
      {children}
    </motion.span>
  );
};

/**
 * Copy to clipboard button con feedback
 */
export const CopyButton = ({ text, label = 'Copia' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-2"
          >
            <Check size={16} className="text-green-400" />
            Copiato!
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-2"
          >
            <Copy size={16} />
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

/**
 * Card con hover effect
 */
export const HoverCard = ({ children, onClick, className = '' }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={onClick ? { scale: 0.99 } : {}}
    onClick={onClick}
    className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg hover:shadow-xl ${className}`}
  >
    {children}
  </motion.div>
);

/**
 * Alert inline con icona
 */
export const InlineAlert = ({ type = 'info', message, onDismiss }) => {
  const config = {
    success: {
      icon: Check,
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },
    error: {
      icon: X,
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    },
  };

  const { icon: Icon, bg, border, text } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${bg} ${border} border rounded-lg p-4 flex items-start gap-3`}
    >
      <Icon size={20} className={`${text} flex-shrink-0 mt-0.5`} />
      <p className={`${text} flex-1 text-sm`}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`${text} hover:opacity-70 transition-opacity`}
        >
          <X size={18} />
        </button>
      )}
    </motion.div>
  );
};

/**
 * Pulsazione per elementi nuovi
 */
export const NewBadge = () => (
  <motion.span
    animate={{
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
    }}
    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"
  />
);

export default {
  Tooltip,
  AnimatedBadge,
  CopyButton,
  HoverCard,
  InlineAlert,
  NewBadge,
};
