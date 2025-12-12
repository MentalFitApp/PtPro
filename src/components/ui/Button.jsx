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
  fullWidth = false,
  rounded = false,
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
    outline: components.button.outline,
  };

  const sizes = {
    xs: 'py-1.5 px-3 text-xs gap-1.5',
    sm: 'py-2 px-4 text-sm gap-2',
    md: 'py-2.5 px-6 text-base gap-2',
    lg: 'py-3.5 px-8 text-lg gap-2.5',
    xl: 'py-4 px-10 text-xl gap-3',
  };

  const iconSizes = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
  };

  const buttonClass = `
    ${variants[variant]} 
    ${variant !== 'icon' ? sizes[size] : ''} 
    ${fullWidth ? 'w-full justify-center' : ''} 
    ${rounded ? 'rounded-full' : ''} 
    ${className} 
    ${(disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
    inline-flex items-center
  `.trim().replace(/\s+/g, ' ');

  return (
    <motion.button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={iconSizes[size]} />
          <span>{children || 'Caricamento...'}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
        </>
      )}
    </motion.button>
  );
};

// IconButton - For icon-only buttons
export const IconButton = ({
  icon: Icon,
  size = 'md',
  variant = 'icon',
  label,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const sizes = {
    xs: 'p-1.5',
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
    xl: 'p-4',
  };

  const iconSizes = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  };

  const variants = {
    icon: components.button.icon,
    ghost: components.button.ghost,
    primary: 'p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all',
    danger: 'p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all',
  };

  return (
    <motion.button
      className={`${variants[variant]} ${sizes[size]} ${className} ${
        (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      aria-label={label}
      title={label}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={iconSizes[size]} />
      ) : (
        <Icon size={iconSizes[size]} />
      )}
    </motion.button>
  );
};

// ButtonGroup - For grouped buttons
export const ButtonGroup = ({ children, className = '' }) => (
  <div className={`inline-flex items-center rounded-xl overflow-hidden border border-theme divide-x divide-theme ${className}`}>
    {React.Children.map(children, (child, index) => 
      React.cloneElement(child, {
        className: `${child.props.className || ''} rounded-none border-0 first:rounded-l-xl last:rounded-r-xl`,
      })
    )}
  </div>
);

export default Button;
