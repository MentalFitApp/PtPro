import React from 'react';
import { motion } from 'framer-motion';
import { components } from '../../config/designSystem';

export const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  icon: Icon,
  dot = false,
  pulse = false,
  rounded = false,
  className = '',
  ...props 
}) => {
  const variants = {
    default: components.badge.default,
    success: components.badge.success,
    warning: components.badge.warning,
    error: components.badge.error,
    info: components.badge.info,
    neutral: components.badge.neutral,
    premium: components.badge.premium,
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    info: 'bg-blue-400',
    neutral: 'bg-slate-400',
    premium: 'bg-amber-400',
  };

  return (
    <span 
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        ${className}
      `} 
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {Icon && <Icon size={iconSizes[size]} />}
      {children}
    </span>
  );
};

// Status Badge with predefined styles
export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const statusConfig = {
    active: { variant: 'success', label: 'Attivo', dot: true },
    inactive: { variant: 'neutral', label: 'Inattivo', dot: true },
    pending: { variant: 'warning', label: 'In attesa', dot: true },
    expired: { variant: 'error', label: 'Scaduto', dot: true },
    expiring: { variant: 'warning', label: 'In scadenza', dot: true, pulse: true },
    new: { variant: 'info', label: 'Nuovo', dot: true, pulse: true },
    premium: { variant: 'premium', label: 'Premium', dot: false },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge 
      variant={config.variant} 
      size={size}
      dot={config.dot}
      pulse={config.pulse}
      className={className}
    >
      {config.label}
    </Badge>
  );
};

// Counter Badge for notifications
export const CounterBadge = ({ count, max = 99, variant = 'error', className = '' }) => {
  if (!count || count <= 0) return null;
  
  const displayCount = count > max ? `${max}+` : count;
  
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        inline-flex items-center justify-center
        min-w-[18px] h-[18px] px-1
        text-[10px] font-bold text-white
        rounded-full
        ${variant === 'error' ? 'bg-rose-500' : variant === 'info' ? 'bg-blue-500' : 'bg-slate-500'}
        ${className}
      `}
    >
      {displayCount}
    </motion.span>
  );
};

// Role Badge
export const RoleBadge = ({ role, size = 'sm', className = '' }) => {
  const roleConfig = {
    admin: { label: 'Admin', gradient: 'from-rose-500 to-pink-500' },
    coach: { label: 'Coach', gradient: 'from-cyan-500 to-blue-500' },
    client: { label: 'Cliente', gradient: 'from-emerald-500 to-teal-500' },
    collaboratore: { label: 'Collaboratore', gradient: 'from-purple-500 to-indigo-500' },
    superadmin: { label: 'Super Admin', gradient: 'from-amber-500 to-orange-500' },
  };

  const config = roleConfig[role] || roleConfig.client;
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span 
      className={`
        inline-flex items-center font-semibold text-white rounded-full
        bg-gradient-to-r ${config.gradient}
        shadow-lg shadow-${role === 'admin' ? 'rose' : role === 'coach' ? 'cyan' : 'emerald'}-500/25
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {config.label}
    </span>
  );
};

export default Badge;
