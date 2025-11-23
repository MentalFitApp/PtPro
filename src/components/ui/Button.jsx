import React from 'react';
import { motion } from 'framer-motion';
import { components } from '../../config/designSystem';
import { Loader2 } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const variants = {
    primary: components.button.primary,
    secondary: components.button.secondary,
    ghost: components.button.ghost,
    danger: components.button.danger,
    success: components.button.success,
    icon: components.button.icon,
  };

  const sizes = {
    sm: 'py-1.5 px-4 text-sm',
    md: 'py-2.5 px-6 text-base',
    lg: 'py-3 px-8 text-lg',
  };

  const buttonClass = `${variants[variant]} ${size !== 'icon' ? sizes[size] : ''} ${className} ${
    (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
  }`.trim();

  return (
    <motion.button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          <span>Caricamento...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={18} />}
        </>
      )}
    </motion.button>
  );
};

export default Button;
