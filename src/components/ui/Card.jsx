import React from 'react';
import { motion } from 'framer-motion';
import { components, animations } from '../../config/designSystem';

export const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  elevated = false,
  glass = false,
  premium = false,
  interactive = false,
  onClick,
  padding = true,
  animate = true,
  ...props 
}) => {
  const getBaseClass = () => {
    if (premium) return components.card.premium;
    if (glass) return components.card.glass;
    if (interactive) return components.card.interactive;
    if (elevated) return components.card.elevated;
    if (hover) return components.card.hover;
    return components.card.base;
  };
  
  const baseClass = getBaseClass();
  const paddingClass = padding ? '' : 'p-0';
  
  const Component = onClick || interactive ? motion.button : motion.div;
  
  return (
    <Component
      className={`${baseClass} ${paddingClass} ${className}`}
      onClick={onClick}
      {...(animate ? (onClick || interactive ? animations.scaleSpring : animations.fadeIn) : {})}
      whileHover={onClick || interactive ? { scale: 1.01, y: -2 } : hover ? { y: -2 } : {}}
      whileTap={onClick || interactive ? { scale: 0.99 } : {}}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({ children, className = '', border = false }) => (
  <div className={`mb-4 ${border ? 'pb-4 border-b border-theme/50' : ''} ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', size = 'default' }) => {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    default: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
  };
  
  return (
    <h3 className={`${sizeClasses[size]} text-theme-text-primary ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-theme-text-secondary mt-1.5 leading-relaxed ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', border = true }) => (
  <div className={`mt-5 ${border ? 'pt-4 border-t border-theme/50' : ''} ${className}`}>
    {children}
  </div>
);

// New: Card with Icon Header
export const CardWithIcon = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  children, 
  iconColor = 'blue',
  action,
  className = '',
  ...props 
}) => {
  const iconColors = {
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    rose: 'from-rose-500 to-pink-500',
    purple: 'from-purple-500 to-indigo-500',
    amber: 'from-amber-500 to-orange-500',
  };

  return (
    <Card className={className} {...props}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconColors[iconColor]} shadow-lg`}>
              <Icon size={20} className="text-white" />
            </div>
          )}
          <div>
            <CardTitle size="sm">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </Card>
  );
};

export default Card;
