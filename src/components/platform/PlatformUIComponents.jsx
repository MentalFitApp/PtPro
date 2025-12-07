// src/components/platform/PlatformUIComponents.jsx
// Componenti UI riutilizzabili per le pagine Platform CEO
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// Card Container base per tutte le sezioni
export const Card = ({ children, className = '', gradient = null }) => (
  <div className={`bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 ${gradient || ''} ${className}`}>
    {children}
  </div>
);

// Alias
export const CardContainer = Card;

// Header di sezione con icona opzionale
export const SectionHeader = ({ icon, title, subtitle, children }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {icon && React.cloneElement(icon, { className: 'w-5 h-5' })}
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// Page Header con titolo, descrizione e azioni
export const PageHeader = ({ title, description, children }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {description && <p className="text-slate-400">{description}</p>}
    </div>
    {children}
  </div>
);

// Mini Stat Card per grid compatte
export const MiniStat = ({ icon, label, value, sublabel, color = 'blue' }) => {
  const colors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400'
  };
  return (
    <div className="p-4 bg-slate-700/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {icon && React.cloneElement(icon, { className: `w-5 h-5 ${colors[color]}` })}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
};

// Mini Stat Card alternativa (con prop iconColor)
export const MiniStatCard = ({ icon: Icon, label, value, sublabel, iconColor = 'text-blue-400' }) => (
  <div className="p-4 bg-slate-700/30 rounded-lg text-center">
    <Icon className={`w-5 h-5 ${iconColor} mx-auto mb-1`} />
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-slate-400">{label}</p>
    {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
  </div>
);

// Barra di progresso con label
export const ProgressBar = ({ label, value, max, color = 'purple' }) => {
  const percent = max > 0 ? (value / max * 100) : 0;
  const colors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300 w-24">{label}</span>
      <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[color]} rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm text-white w-12 text-right">{value}</span>
    </div>
  );
};

// Badge per status/plan
export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-500/20 text-slate-400',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    enterprise: 'bg-yellow-500/20 text-yellow-400',
    professional: 'bg-purple-500/20 text-purple-400',
    starter: 'bg-blue-500/20 text-blue-400',
    trial: 'bg-amber-500/20 text-amber-400',
    free: 'bg-slate-500/20 text-slate-400'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
};

// Action Button per quick actions
export const ActionButton = ({ icon, title, subtitle, onClick, color = 'slate' }) => {
  const colors = {
    slate: 'bg-slate-700/30 hover:bg-slate-700/50',
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700'
  };
  const iconColors = {
    slate: 'text-slate-400',
    purple: 'text-white',
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400'
  };
  return (
    <button
      onClick={onClick}
      className={`p-4 ${colors[color]} rounded-lg transition-colors text-left`}
    >
      {icon && React.cloneElement(icon, { className: `w-6 h-6 ${iconColors[color] || 'text-slate-400'} mb-2` })}
      <p className="text-white font-medium">{title}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </button>
  );
};

// Empty State
export const EmptyState = ({ icon, title, description }) => (
  <div className="text-center py-8">
    {icon && React.cloneElement(icon, { className: 'w-12 h-12 text-slate-500 mx-auto mb-4' })}
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    {description && <p className="text-slate-400">{description}</p>}
  </div>
);

// Modal Wrapper riutilizzabile
export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-slate-800 rounded-2xl p-6 ${maxWidth} w-full border border-slate-700 my-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

// Alert Banner
export const AlertBanner = ({ type = 'info', title, message, action, onAction }) => {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400'
  };
  
  return (
    <div className={`p-4 rounded-xl border ${styles[type]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{title}</p>
          {message && <p className="text-sm opacity-80">{message}</p>}
        </div>
        {action && onAction && (
          <button 
            onClick={onAction}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
};

// Stat Card animata (per overview)
export const StatCard = ({ icon, title, value, subtitle, trend, color = 'purple' }) => {
  const colorClasses = {
    purple: 'bg-purple-500/10 text-purple-400',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 shadow-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {React.cloneElement(icon, { className: 'w-6 h-6' })}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
};
