// src/components/ui/ProCard.jsx
// Cards professionali per dashboard e dettagli
import React from 'react';
import { motion } from 'framer-motion';

// === BASE CARD ===
export const ProCard = ({ 
  children, 
  className = '',
  padding = 'default',
  onClick,
  hover = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6'
  };

  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      onClick={onClick}
      className={`bg-theme-bg-secondary/70 backdrop-blur-sm border border-theme rounded-xl ${paddingClasses[padding]} ${
        hover || onClick ? 'hover:bg-theme-bg-tertiary/70 transition-all cursor-pointer' : ''
      } ${className}`}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {children}
    </Component>
  );
};

// === CARD HEADER ===
export const ProCardHeader = ({ 
  title, 
  subtitle,
  icon: Icon,
  action,
  className = '' 
}) => {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-theme-bg-tertiary/60 border border-theme">
            <Icon size={18} className="text-theme-text-secondary" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-theme-text-primary">{title}</h3>
          {subtitle && (
            <p className="text-sm text-theme-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
};

// === STAT CARD ===
export const StatCard = ({
  label,
  value,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  icon: Icon,
  iconBg = 'blue',
  onClick,
  className = ''
}) => {
  const iconBgColors = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    rose: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    purple: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
  };

  const changeColors = {
    positive: 'text-emerald-400 bg-emerald-500/10',
    negative: 'text-rose-400 bg-rose-500/10',
    neutral: 'text-slate-400 bg-slate-500/10',
  };

  return (
    <ProCard onClick={onClick} hover={!!onClick} className={className}>
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconBgColors[iconBg]} border`}>
            <Icon size={20} className="text-theme-text-primary" />
          </div>
        )}
        {change !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${changeColors[changeType]}`}>
            {changeType === 'positive' && '+'}
            {change}
          </span>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-2xl font-bold text-theme-text-primary">{value}</p>
        <p className="text-sm text-theme-text-secondary mt-1">{label}</p>
      </div>
    </ProCard>
  );
};

// === INFO CARD (per dettagli cliente) ===
export const InfoCard = ({
  title,
  icon: Icon,
  children,
  action,
  className = ''
}) => {
  return (
    <ProCard className={className}>
      <ProCardHeader title={title} icon={Icon} action={action} />
      <div className="space-y-3">
        {children}
      </div>
    </ProCard>
  );
};

// === INFO FIELD ===
export const InfoField = ({ 
  label, 
  value, 
  icon: Icon,
  copyable = false,
  className = '' 
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (copyable && value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {Icon && (
        <Icon size={16} className="text-theme-text-tertiary mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-theme-text-tertiary mb-0.5">{label}</p>
        <p 
          className={`text-sm text-theme-text-primary break-words ${copyable ? 'cursor-pointer hover:text-primary' : ''}`}
          onClick={handleCopy}
        >
          {value || '-'}
          {copied && <span className="ml-2 text-xs text-emerald-400">Copiato!</span>}
        </p>
      </div>
    </div>
  );
};

// === LIST CARD ===
export const ListCard = ({
  title,
  icon: Icon,
  items = [],
  emptyMessage = 'Nessun elemento',
  action,
  renderItem,
  className = ''
}) => {
  return (
    <ProCard className={className}>
      <ProCardHeader title={title} icon={Icon} action={action} />
      
      {items.length === 0 ? (
        <p className="text-sm text-theme-text-tertiary text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-theme-bg-tertiary/40 hover:bg-theme-bg-tertiary/60 transition-colors border border-theme">
              {renderItem ? renderItem(item, idx) : (
                <span className="text-sm text-theme-text-primary">{item}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </ProCard>
  );
};

// === METRIC CARD (inline metric) ===
export const MetricCard = ({
  label,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  trend,
  trendValue,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-theme-bg-tertiary/40 border border-theme ${className}`}>
      {Icon && (
        <div className="p-2 rounded-lg bg-theme-bg-tertiary/60 border border-theme">
          <Icon size={16} className="text-theme-text-secondary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-theme-text-tertiary">{label}</p>
        <p className="text-lg font-semibold text-theme-text-primary">
          {prefix}{value}{suffix}
        </p>
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
          trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 
          'bg-slate-500/10 text-slate-400'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </span>
      )}
    </div>
  );
};

// === WIDGET GRID ===
export const WidgetGrid = ({ 
  children, 
  cols = 3,
  className = '' 
}) => {
  const colsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${colsClass[cols] || colsClass[3]} gap-4 ${className}`}>
      {children}
    </div>
  );
};

// === SECTION ===
export const Section = ({
  title,
  subtitle,
  action,
  children,
  className = ''
}) => {
  return (
    <div className={className}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-slate-100">{title}</h2>}
            {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
};

// === PHOTO GRID ===
export const PhotoGrid = ({
  photos = [],
  onPhotoClick,
  emptyMessage = 'Nessuna foto',
  className = ''
}) => {
  if (photos.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">{emptyMessage}</p>
    );
  }

  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {photos.map((photo, idx) => (
        <button
          key={idx}
          onClick={() => onPhotoClick?.(photo, idx)}
          className="aspect-square rounded-lg overflow-hidden bg-slate-700/50 hover:ring-2 hover:ring-blue-500/50 transition-all"
        >
          <img 
            src={photo.url || photo} 
            alt={photo.label || `Foto ${idx + 1}`}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
};

// === ACTIVITY ITEM ===
export const ActivityItem = ({
  icon: Icon,
  title,
  description,
  timestamp,
  className = ''
}) => {
  return (
    <div className={`flex items-start gap-3 py-2 ${className}`}>
      {Icon && (
        <div className="p-1.5 rounded-lg bg-slate-700/50 mt-0.5">
          <Icon size={14} className="text-slate-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {timestamp && (
        <span className="text-xs text-slate-500 whitespace-nowrap">{timestamp}</span>
      )}
    </div>
  );
};

export default ProCard;
