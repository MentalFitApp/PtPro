import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { components, colors, animations } from '../../config/designSystem';

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon,
  trend,
  trendValue,
  accentColor = 'cyan',
  loading = false,
  className = '',
  onClick
}) => {
  const accentColors = {
    cyan: 'from-cyan-500 to-blue-500',
    rose: 'from-rose-500 to-pink-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-indigo-500',
    amber: 'from-amber-500 to-orange-500',
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`${components.statCard.withIcon} ${className}`}
      onClick={onClick}
      {...animations.fadeIn}
      whileHover={onClick ? { scale: 1.02 } : {}}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-700/50 animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold text-slate-50">{value}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp size={16} className="text-emerald-400" />
              ) : (
                <TrendingDown size={16} className="text-rose-400" />
              )}
              <span className={`text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${accentColors[accentColor]} bg-opacity-10 transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={24} className="text-white" />
          </div>
        )}
      </div>
    </Component>
  );
};

export default StatCard;
