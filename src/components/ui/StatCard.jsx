import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { components, animations } from '../../config/designSystem';

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  accentColor = 'cyan',
  variant = 'default',
  loading = false,
  compact = false,
  className = '',
  onClick,
  subtitle,
}) => {
  const accentColors = {
    cyan: {
      gradient: 'from-cyan-500 to-blue-500',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
    },
    rose: {
      gradient: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/20',
    },
    emerald: {
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
    },
    purple: {
      gradient: 'from-purple-500 to-indigo-500',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20',
    },
    amber: {
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20',
    },
    blue: {
      gradient: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20',
    },
  };

  const color = accentColors[accentColor] || accentColors.cyan;

  const variants = {
    default: components.statCard.withIcon,
    glass: components.statCard.glass,
    gradient: components.statCard.gradient,
  };

  const Component = onClick ? motion.button : motion.div;

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} />;
    if (trend === 'down') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-400 bg-emerald-500/10';
    if (trend === 'down') return 'text-rose-400 bg-rose-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  return (
    <Component
      className={`${variants[variant]} ${className} relative overflow-hidden`}
      onClick={onClick}
      {...animations.fadeIn}
      whileHover={onClick ? { scale: 1.02, y: -2 } : { y: -2 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} opacity-[0.03] pointer-events-none`} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-theme-text-tertiary font-medium mb-1 truncate`}>
            {title}
          </p>
          
          {loading ? (
            <div className={`${compact ? 'h-7 w-16' : 'h-9 w-24'} bg-theme-bg-tertiary/50 animate-pulse rounded-lg`} />
          ) : (
            <p className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold text-theme-text-primary tracking-tight`}>
              {value}
            </p>
          )}
          
          {subtitle && (
            <p className="text-xs text-theme-text-tertiary mt-1 truncate">{subtitle}</p>
          )}
          
          {(trend || trendValue) && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {trendValue}
              </span>
              {trendLabel && (
                <span className="text-xs text-theme-text-tertiary">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <motion.div 
            className={`${compact ? 'p-2' : 'p-3'} rounded-xl bg-gradient-to-br ${color.gradient} shadow-lg ${color.glow} flex-shrink-0`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Icon size={compact ? 18 : 22} className="text-white" />
          </motion.div>
        )}
      </div>
    </Component>
  );
};

// Mini Stat Card for compact displays
export const MiniStatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  className = '',
}) => {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <motion.div
      className={`flex items-center gap-3 p-3 rounded-xl bg-theme-bg-secondary/50 border border-theme/50 ${className}`}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {Icon && (
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={16} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-theme-text-tertiary truncate">{label}</p>
        <p className="text-lg font-bold text-theme-text-primary">{value}</p>
      </div>
      {trend && (
        <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </motion.div>
  );
};

export default StatCard;
