// src/components/ui/UnifiedCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Base UnifiedCard component
export const UnifiedCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-slate-900/40 backdrop-blur-sm border border-slate-700/50',
    solid: 'bg-slate-900 border border-slate-700',
    ghost: 'bg-transparent border border-slate-700/30',
    elevated: 'bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 shadow-xl'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    default: 'p-4 sm:p-5',
    lg: 'p-6'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Card Header with icon and action
export const CardHeader = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  action,
  className = '' 
}) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400">
          <Icon size={20} />
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Simple Card Header (just title and subtitle)
export const CardHeaderSimple = ({ 
  title, 
  subtitle,
  className = '' 
}) => (
  <div className={`mb-4 ${className}`}>
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
  </div>
);

// Card Content
export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

// Card Footer
export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-slate-700/30 ${className}`}>
    {children}
  </div>
);

// Info Field with icon
export const InfoField = ({ 
  icon: Icon, 
  label, 
  value, 
  className = '' 
}) => (
  <div className={`flex items-center gap-2 text-sm ${className}`}>
    {Icon && <Icon size={16} className="text-slate-400 flex-shrink-0" />}
    {label && <span className="text-slate-400">{label}:</span>}
    <span className="text-slate-200 truncate">{value || 'N/D'}</span>
  </div>
);

// Data Card for stats/metrics
export const DataCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  trendUp,
  className = '' 
}) => (
  <div className={`p-3 rounded-lg border border-slate-800 bg-slate-900/60 ${className}`}>
    <div className="flex items-center gap-2 mb-1 text-slate-400">
      {Icon && <Icon size={14} />}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-bold text-white">{value}</span>
      {trend && (
        <span className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {trendUp ? '+' : ''}{trend}
        </span>
      )}
    </div>
  </div>
);

// Badge component
export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}) => {
  const variants = {
    default: 'bg-slate-700/50 text-slate-300',
    primary: 'bg-blue-500/10 text-blue-400',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
    info: 'bg-cyan-500/10 text-cyan-400'
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

// List Item Card
export const ListItemCard = ({ 
  children, 
  onClick, 
  active,
  className = '' 
}) => (
  <div 
    onClick={onClick}
    className={`p-3 rounded-lg border transition-all cursor-pointer ${
      active 
        ? 'bg-blue-500/10 border-blue-500/30' 
        : 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50'
    } ${className}`}
  >
    {children}
  </div>
);

// Empty State
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) => (
  <div className={`text-center py-8 ${className}`}>
    {Icon && (
      <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
        <Icon size={24} className="text-slate-500" />
      </div>
    )}
    <h4 className="text-sm font-medium text-slate-300 mb-1">{title}</h4>
    {description && <p className="text-xs text-slate-500 mb-4">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

// Card Grid
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
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
  };

  const gapClass = {
    sm: 'gap-2',
    default: 'gap-3',
    lg: 'gap-4'
  };

  return (
    <div className={`grid ${colsClass[cols]} ${gapClass[gap]} ${className}`}>
      {children}
    </div>
  );
};

export default UnifiedCard;
