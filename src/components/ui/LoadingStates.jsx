/**
 * Loading States - Componenti per feedback durante operazioni
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * Button con stato loading integrato
 */
export const LoadingButton = ({
  children,
  loading = false,
  success = false,
  error = false,
  onClick,
  disabled,
  className = '',
  variant = 'primary',
  ...props
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={20} className="animate-spin" />}
      {success && <CheckCircle size={20} />}
      {error && <XCircle size={20} />}
      {children}
    </motion.button>
  );
};

/**
 * Overlay loading per operazioni fullscreen
 */
export const LoadingOverlay = ({ message = 'Caricamento...', progress }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
  >
    <div className="bg-slate-800 rounded-xl p-8 shadow-2xl max-w-sm mx-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={48} className="text-cyan-400 animate-spin" />
        <p className="text-white font-medium text-center">{message}</p>
        {progress !== undefined && (
          <div className="w-full">
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              />
            </div>
            <p className="text-slate-400 text-sm text-center mt-2">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

/**
 * Progress bar inline
 */
export const ProgressBar = ({ progress, label, showPercentage = true }) => (
  <div className="w-full">
    {label && <p className="text-sm text-slate-400 mb-2">{label}</p>}
    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
      />
    </div>
    {showPercentage && (
      <p className="text-slate-400 text-xs text-right mt-1">{Math.round(progress)}%</p>
    )}
  </div>
);

/**
 * Success animation
 */
export const SuccessAnimation = ({ message }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    className="flex flex-col items-center gap-4 p-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotate: 360 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
    >
      <CheckCircle size={64} className="text-green-400" />
    </motion.div>
    <p className="text-white font-semibold text-lg text-center">{message}</p>
  </motion.div>
);

/**
 * Pulse loader per operazioni in background
 */
export const PulseLoader = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizes[size]} bg-cyan-400 rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Spinner con testo
 */
export const SpinnerWithText = ({ text = 'Caricamento...', size = 40 }) => (
  <div className="flex flex-col items-center gap-4 p-8">
    <Loader2 size={size} className="text-cyan-400 animate-spin" />
    <p className="text-slate-400">{text}</p>
  </div>
);

export default {
  LoadingButton,
  LoadingOverlay,
  ProgressBar,
  SuccessAnimation,
  PulseLoader,
  SpinnerWithText,
};
