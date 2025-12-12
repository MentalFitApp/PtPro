// src/components/ui/PremiumCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Card Premium ispirata alla CEO Dashboard
 * Usa backdrop-blur, border subtili, e shadow eleganti
 */
export const PremiumCard = ({ 
  children, 
  className = '', 
  hover = true,
  gradient = false,
  padding = 'p-6',
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      className={`
        bg-theme-bg-secondary/75 backdrop-blur-sm rounded-xl shadow-glow 
        border border-theme shadow-xl
        ${gradient ? 'bg-gradient-to-br from-theme-bg-secondary/80 to-theme-bg-primary/60' : ''}
        ${hover ? 'hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer' : ''}
        ${padding}
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Card Stat per metriche e numeri importanti
 */
export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'blue', 
  trend,
  className = '' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    red: 'bg-red-500/10 text-red-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  };

  return (
    <PremiumCard className={className} hover={false}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {React.cloneElement(icon, { className: 'w-6 h-6' })}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-theme-text-primary mb-1">{value}</h3>
      <p className="text-sm text-theme-text-secondary">{title}</p>
      {subtitle && <p className="text-xs text-theme-text-tertiary mt-1">{subtitle}</p>}
    </PremiumCard>
  );
};

/**
 * Badge colorato per status
 */
export const StatusBadge = ({ status, label }) => {
  const statusColors = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    inactive: 'bg-red-500/10 text-red-400 border-red-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status] || statusColors.pending}`}>
      {label || status}
    </span>
  );
};

export default PremiumCard;
