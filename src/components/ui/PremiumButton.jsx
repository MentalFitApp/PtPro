// src/components/ui/PremiumButton.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Bottone Premium con varianti ispirate alla CEO Dashboard
 */
export const PremiumButton = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/20',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700',
    outline: 'bg-transparent hover:bg-blue-600/10 text-blue-400 border border-blue-500/50 hover:border-blue-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={disabled || loading ? undefined : onClick}
      className={`
        flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </motion.button>
  );
};

/**
 * Icon Button - bottone solo con icona
 */
export const IconButton = ({
  icon,
  tooltip,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={tooltip}
      className={`
        rounded-lg transition-all duration-200
        ${variant === 'ghost' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : ''}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {icon}
    </motion.button>
  );
};

export default PremiumButton;
