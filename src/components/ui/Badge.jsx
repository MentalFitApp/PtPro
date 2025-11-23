import React from 'react';
import { components } from '../../config/designSystem';

export const Badge = ({ 
  children, 
  variant = 'default',
  icon: Icon,
  className = '',
  ...props 
}) => {
  const variants = {
    default: components.badge.default,
    success: components.badge.success,
    warning: components.badge.warning,
    error: components.badge.error,
    info: components.badge.info,
  };

  return (
    <span className={`${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

export default Badge;
