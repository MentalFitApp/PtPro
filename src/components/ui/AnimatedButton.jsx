// src/components/ui/AnimatedButton.jsx
// Bottoni con micro-animazioni e feedback visivo

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Bottone animato con feedback visivo
 */
export function AnimatedButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'success', 'ghost', 'outline'
  size = 'md', // 'xs', 'sm', 'md', 'lg', 'xl'
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = 'lg', // 'sm', 'md', 'lg', 'xl', 'full'
  className = '',
  pulse = false,
  glow = false,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all';
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
    xl: 'px-6 py-3 text-lg gap-2.5'
  };

  const roundedClasses = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
    success: 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25',
    ghost: 'bg-transparent hover:bg-slate-700/50 text-slate-300 hover:text-white',
    outline: 'bg-transparent border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white',
    'outline-primary': 'bg-transparent border border-blue-500 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300'
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${roundedClasses[rounded]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${pulse ? 'animate-pulse' : ''}
        ${glow ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-900' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={iconSizes[size]} className="animate-spin" />
          <span>Caricamento...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={iconSizes[size]} />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon size={iconSizes[size]} />
          )}
        </>
      )}
    </motion.button>
  );
}

/**
 * Gruppo di bottoni
 */
export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg overflow-hidden ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child, {
          className: `${child.props.className || ''} 
            ${index === 0 ? 'rounded-r-none' : ''}
            ${index === React.Children.count(children) - 1 ? 'rounded-l-none' : ''}
            ${index > 0 && index < React.Children.count(children) - 1 ? 'rounded-none' : ''}
            ${index > 0 ? 'border-l border-slate-600' : ''}
          `,
          rounded: 'none'
        });
      })}
    </div>
  );
}

/**
 * Bottone icona
 */
export function IconButton({
  icon: Icon,
  onClick,
  disabled = false,
  loading = false,
  variant = 'ghost',
  size = 'md',
  tooltip,
  className = '',
  ...props
}) {
  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3'
  };

  const iconSizes = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24
  };

  const variantClasses = {
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    danger: 'text-slate-400 hover:text-red-400 hover:bg-red-500/10',
    success: 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: 1.1 }}
      whileTap={isDisabled ? {} : { scale: 0.9 }}
      title={tooltip}
      className={`
        rounded-lg transition-colors
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : (
        <Icon size={iconSizes[size]} />
      )}
    </motion.button>
  );
}

/**
 * Floating Action Button (FAB)
 */
export function FloatingButton({
  icon: Icon,
  onClick,
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'bottom-center'
  variant = 'primary',
  size = 'lg',
  tooltip,
  className = ''
}) {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2'
  };

  const sizeClasses = {
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16'
  };

  const iconSizes = {
    md: 20,
    lg: 24,
    xl: 28
  };

  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30',
    success: 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
  };

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={tooltip}
      className={`
        ${positionClasses[position]}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full flex items-center justify-center z-50
        ${className}
      `}
    >
      <Icon size={iconSizes[size]} />
    </motion.button>
  );
}

export default AnimatedButton;
