import React from 'react';
import { motion } from 'framer-motion';
import { components, animations } from '../../config/designSystem';

export const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  elevated = false,
  onClick,
  ...props 
}) => {
  const baseClass = elevated ? components.card.elevated : 
                    hover ? components.card.hover : 
                    components.card.base;
  
  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      className={`${baseClass} ${className}`}
      onClick={onClick}
      {...(onClick ? animations.scale : animations.fadeIn)}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-slate-50 ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-slate-400 mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-slate-700/50 ${className}`}>
    {children}
  </div>
);

export default Card;
