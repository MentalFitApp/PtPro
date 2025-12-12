// src/components/ui/UnifiedCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Base UnifiedCard component - Updated with modern glassmorphism
export const UnifiedCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  hover = false,
  onClick,
  ...props 
}) => {
  const variants = {
    default: 'bg-theme-bg-secondary/60 backdrop-blur-xl border border-theme/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
    solid: 'bg-theme-bg-secondary border border-theme shadow-xl',
    ghost: 'bg-transparent border border-theme/30',
    elevated: 'bg-theme-bg-secondary/70 backdrop-blur-2xl border border-theme/50 shadow-2xl shadow-black/20',
    glass: 'bg-theme-bg-secondary/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]',
    premium: 'bg-gradient-to-br from-theme-bg-secondary/60 to-theme-bg-secondary/30 backdrop-blur-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5',
    interactive: 'bg-theme-bg-secondary/50 backdrop-blur-xl border border-theme/50 shadow-lg cursor-pointer hover:bg-theme-bg-tertiary/60 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300',
  };

  const paddings = {
    none: '',
    xs: 'p-2',
    sm: 'p-3',
    default: 'p-4 sm:p-5',
    lg: 'p-6',
    xl: 'p-8',
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover || onClick ? { y: -2, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
      className={`rounded-2xl ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

// Card Header with icon and action - Enhanced
export const CardHeader = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  action,
  iconColor = 'blue',
  className = '' 
}) => {
  const iconColors = {
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    rose: 'from-rose-500 to-pink-500',
    purple: 'from-purple-500 to-indigo-500',
    amber: 'from-amber-500 to-orange-500',
    slate: 'from-slate-600 to-slate-700',
  };

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconColors[iconColor]} flex items-center justify-center shadow-lg`}>
            <Icon size={20} className="text-white" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-theme-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-theme-text-tertiary">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

// Simple Card Header (just title and subtitle) - Enhanced
export const CardHeaderSimple = ({ 
  title, 
  subtitle,
  action,
  size = 'default',
  className = '' 
}) => {
  const sizes = {
    sm: 'text-base',
    default: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`mb-4 flex items-start justify-between ${className}`}>
      <div>
        <h3 className={`${sizes[size]} font-semibold text-theme-text-primary`}>{title}</h3>
        {subtitle && <p className="text-xs text-theme-text-tertiary mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

// Card Content
export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

// Card Footer - Enhanced
export const CardFooter = ({ children, className = '', border = true }) => (
  <div className={`mt-4 ${border ? 'pt-4 border-t border-theme/30' : ''} ${className}`}>
    {children}
  </div>
);

// Info Field with icon - Enhanced
export const InfoField = ({ 
  icon: Icon, 
  label, 
  value, 
  copyable = false,
  className = '' 
}) => (
  <div className={`flex items-center gap-2.5 text-sm ${className}`}>
    {Icon && (
      <div className="p-1.5 rounded-lg bg-theme-bg-tertiary/50">
        <Icon size={14} className="text-theme-text-tertiary flex-shrink-0" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      {label && <span className="text-theme-text-tertiary">{label}: </span>}
      <span className="text-theme-text-primary truncate">{value || 'N/D'}</span>
    </div>
  </div>
);

// Data Card for stats/metrics - Enhanced
export const DataCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  trendUp,
  color = 'blue',
  className = '' 
}) => {
  const colors = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    rose: 'border-rose-500/20 bg-rose-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
  };

  return (
    <motion.div 
      className={`p-4 rounded-xl border ${colors[color]} backdrop-blur-sm ${className}`}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="flex items-center gap-2 mb-2 text-theme-text-tertiary">
        {Icon && <Icon size={14} />}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-theme-text-primary">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trendUp ? '+' : ''}{trend}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// List Item Card - Enhanced
export const ListItemCard = ({ 
  children, 
  onClick, 
  active,
  className = '' 
}) => (
  <motion.div 
    onClick={onClick}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.99 }}
    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
      active 
        ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/10' 
        : 'bg-theme-bg-secondary/40 border-theme/50 hover:bg-theme-bg-tertiary/50 hover:border-theme'
    } ${className}`}
  >
    {children}
  </motion.div>
);

// Card Grid - Enhanced
export const CardGrid = ({ 
  children, 
  cols = 2, 
  gap = 'default',
  className = '' 
}) => {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  const gapClass = {
    xs: 'gap-2',
    sm: 'gap-3',
    default: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={`grid ${colsClass[cols]} ${gapClass[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Skeleton Card for loading states
export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-4 rounded-2xl bg-theme-bg-secondary/40 border border-theme/30 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-theme-bg-tertiary/50 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-theme-bg-tertiary/50 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-theme-bg-tertiary/50 rounded animate-pulse" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-theme-bg-tertiary/50 rounded animate-pulse" />
      <div className="h-3 w-5/6 bg-theme-bg-tertiary/50 rounded animate-pulse" />
    </div>
  </div>
);

export default UnifiedCard;
