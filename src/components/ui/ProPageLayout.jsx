// src/components/ui/ProPageLayout.jsx
// Componenti UI per layout pagine uniforme stile DashboardPro
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

/**
 * Container principale per le pagine
 * Fornisce padding e max-width consistenti
 */
export const PageContainer = ({ children, className = '', maxWidth = '7xl' }) => {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  };

  return (
    <div className={`min-h-screen pb-20 ${className}`}>
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-3 sm:px-4 lg:px-6 py-4 ${className}`}>
        {children}
      </div>
    </div>
  );
};

/**
 * Card/Sezione con stile DashboardPro
 * bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30
 */
export const SectionCard = ({ 
  children, 
  className = '', 
  padding = 'default',
  hover = false,
  onClick,
  glow = false,
  glowColor = 'blue'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const glowClasses = {
    blue: 'hover:border-blue-500/30 hover:shadow-blue-500/5',
    emerald: 'hover:border-emerald-500/30 hover:shadow-emerald-500/5',
    purple: 'hover:border-purple-500/30 hover:shadow-purple-500/5',
    amber: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
    cyan: 'hover:border-cyan-500/30 hover:shadow-cyan-500/5',
  };

  const baseClasses = `
    bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 
    ${paddingClasses[padding]}
    ${hover || onClick ? `cursor-pointer transition-all duration-200 hover:bg-slate-700/30 ${glowClasses[glowColor]}` : ''}
    ${glow ? `shadow-lg ${glowClasses[glowColor]}` : ''}
    ${className}
  `;

  if (onClick) {
    return (
      <motion.div 
        onClick={onClick}
        className={baseClasses}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
};

/**
 * Header di sezione con icona stile DashboardPro
 */
export const SectionHeader = ({ 
  icon: Icon, 
  title, 
  subtitle,
  iconColor = 'blue',
  action,
  badge,
  className = ''
}) => {
  const iconColorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    rose: 'bg-rose-500/20 text-rose-400',
    pink: 'bg-pink-500/20 text-pink-400',
    slate: 'bg-slate-600/50 text-slate-400',
  };

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={`p-1.5 sm:p-2 rounded-xl ${iconColorClasses[iconColor]}`}>
            <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
        )}
        <div>
          <h2 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
            {title}
            {badge !== undefined && (
              <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
};

/**
 * Grid layout per statistiche/metriche
 */
export const StatsGrid = ({ children, cols = 4, className = '' }) => {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${colClasses[cols]} gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Mini stat card stile DashboardPro
 */
export const MiniStatCard = ({ 
  value, 
  label, 
  icon: Icon, 
  color = 'blue',
  onClick,
  trend,
  trendValue 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    rose: 'bg-rose-500/20 text-rose-400',
    pink: 'bg-pink-500/20 text-pink-400',
  };

  const Component = onClick ? motion.button : 'div';
  const props = onClick ? {
    onClick,
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <Component
      {...props}
      className={`bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30 p-3 sm:p-4 ${
        onClick ? 'cursor-pointer hover:bg-slate-700/40 transition-all' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon size={14} />
        </div>
        {trend && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </Component>
  );
};

/**
 * Tab Navigation stile DashboardPro
 */
export const TabNav = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex items-center border-b border-slate-700/30 overflow-x-auto scrollbar-hide bg-slate-900/20 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-medium transition-all whitespace-nowrap min-w-fit ${
            activeTab === tab.key 
              ? 'text-blue-400 bg-blue-500/10' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
          }`}
        >
          {tab.icon && <tab.icon size={15} className="flex-shrink-0" />}
          <span className={tab.hideLabel ? 'hidden sm:inline' : ''}>{tab.label}</span>
          {tab.badge > 0 && (
            <span className={`min-w-[18px] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              tab.badgeColor || 'bg-blue-500/30 text-blue-400'
            }`}>
              {tab.badge}
            </span>
          )}
          {activeTab === tab.key && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

/**
 * Empty State placeholder
 */
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) => (
  <div className={`text-center py-8 sm:py-12 ${className}`}>
    {Icon && (
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
    )}
    <h3 className="text-white font-medium mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-slate-400 mb-4">{description}</p>
    )}
    {action}
  </div>
);

/**
 * Loading Skeleton stile DashboardPro
 */
export const LoadingSkeleton = ({ rows = 3 }) => (
  <div className="min-h-screen px-4 py-4 space-y-4">
    <div className="h-12 w-48 bg-slate-700/50 rounded-lg animate-pulse" />
    <div className="h-32 bg-slate-700/50 rounded-2xl animate-pulse" />
    <div className="grid grid-cols-2 gap-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
      ))}
    </div>
  </div>
);

/**
 * Item di lista cliccabile stile DashboardPro
 */
export const ListItem = ({ 
  avatar,
  title, 
  subtitle, 
  rightContent,
  onClick,
  className = '' 
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
    whileTap={{ scale: 0.99 }}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${className}`}
  >
    {avatar && (
      <div className="flex-shrink-0">{avatar}</div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">{title}</p>
      {subtitle && (
        <p className="text-xs text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
    {rightContent || <ChevronRight size={16} className="text-slate-500" />}
  </motion.button>
);

/**
 * Avatar con iniziale e gradiente
 */
export const Avatar = ({ 
  name, 
  photoURL, 
  size = 'md',
  gradient = 'blue'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const gradientClasses = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
  };

  if (photoURL) {
    return (
      <img 
        src={photoURL} 
        alt={name} 
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-slate-700`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradientClasses[gradient]} flex items-center justify-center text-white font-bold`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

/**
 * Pill/Badge colorato
 */
export const Pill = ({ 
  children, 
  color = 'blue',
  size = 'default',
  icon: Icon 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    default: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${colorClasses[color]} ${sizeClasses[size]}`}>
      {Icon && <Icon size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />}
      {children}
    </span>
  );
};

/**
 * Divider
 */
export const Divider = ({ className = '' }) => (
  <div className={`border-t border-slate-700/30 ${className}`} />
);

export default {
  PageContainer,
  SectionCard,
  SectionHeader,
  StatsGrid,
  MiniStatCard,
  TabNav,
  EmptyState,
  LoadingSkeleton,
  ListItem,
  Avatar,
  Pill,
  Divider,
};
