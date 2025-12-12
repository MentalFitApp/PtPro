// src/components/ui/Alert.jsx
// Modern Alert/Banner components
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Sparkles } from 'lucide-react';

/**
 * Alert - Inline alert/notification component
 */
export const Alert = ({
  variant = 'info', // info, success, warning, error, premium
  title,
  children,
  icon: CustomIcon,
  dismissible = false,
  onDismiss,
  action,
  className = ''
}) => {
  const variants = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: Info,
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-300'
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-300'
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300'
    },
    error: {
      bg: 'bg-rose-500/10 border-rose-500/30',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
      titleColor: 'text-rose-300'
    },
    premium: {
      bg: 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border-purple-500/30',
      icon: Sparkles,
      iconColor: 'text-purple-400',
      titleColor: 'text-purple-300'
    }
  };

  const config = variants[variant] || variants.info;
  const Icon = CustomIcon || config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${className}`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-semibold ${config.titleColor} mb-1`}>
            {title}
          </h4>
        )}
        <div className="text-sm text-theme-text-secondary">
          {children}
        </div>
        
        {action && (
          <motion.button
            onClick={action.onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`mt-3 text-sm font-semibold ${config.iconColor} hover:underline`}
          >
            {action.label}
          </motion.button>
        )}
      </div>
      
      {dismissible && onDismiss && (
        <motion.button
          onClick={onDismiss}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-theme-bg-tertiary/60 text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
        >
          <X size={16} />
        </motion.button>
      )}
    </motion.div>
  );
};

/**
 * Banner - Full-width banner component
 */
export const Banner = ({
  variant = 'info',
  children,
  icon: CustomIcon,
  dismissible = false,
  onDismiss,
  action,
  sticky = false,
  className = ''
}) => {
  const variants = {
    info: {
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30',
      icon: Info,
      iconColor: 'text-blue-400'
    },
    success: {
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/30',
      icon: CheckCircle,
      iconColor: 'text-emerald-400'
    },
    warning: {
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400'
    },
    error: {
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/30',
      icon: AlertCircle,
      iconColor: 'text-rose-400'
    },
    premium: {
      bg: 'bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15',
      border: 'border-purple-500/30',
      icon: Sparkles,
      iconColor: 'text-purple-400'
    }
  };

  const config = variants[variant] || variants.info;
  const Icon = CustomIcon || config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${config.bg} border-b ${config.border} ${sticky ? 'sticky top-0 z-30' : ''} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon size={18} className={config.iconColor} />
          <p className="text-sm text-theme-text-primary">
            {children}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {action && (
            <motion.button
              onClick={action.onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 text-sm font-semibold bg-theme-bg-secondary/60 hover:bg-theme-bg-secondary rounded-lg text-theme-text-primary transition-colors"
            >
              {action.label}
            </motion.button>
          )}
          
          {dismissible && onDismiss && (
            <motion.button
              onClick={onDismiss}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-lg hover:bg-theme-bg-secondary/60 text-theme-text-secondary transition-colors"
            >
              <X size={16} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * InlineMessage - Simple inline message
 */
export const InlineMessage = ({
  variant = 'info',
  children,
  className = ''
}) => {
  const variants = {
    info: 'text-blue-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400'
  };

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle
  };

  const Icon = icons[variant] || icons.info;

  return (
    <div className={`flex items-center gap-2 text-sm ${variants[variant]} ${className}`}>
      <Icon size={14} />
      <span>{children}</span>
    </div>
  );
};

export default Alert;
