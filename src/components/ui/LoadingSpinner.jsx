import React from 'react';
import { motion } from 'framer-motion';

/**
 * LoadingSpinner - Componente centralizzato per tutti gli stati di caricamento
 * Sostituisce gli spinner inline sparsi nel progetto
 */

const sizes = {
  xs: { spinner: 'w-4 h-4', border: 'border-2' },
  sm: { spinner: 'w-6 h-6', border: 'border-2' },
  md: { spinner: 'w-10 h-10', border: 'border-3' },
  lg: { spinner: 'w-16 h-16', border: 'border-4' },
  xl: { spinner: 'w-24 h-24', border: 'border-4' }
};

const variants = {
  primary: 'border-blue-500/30 border-t-blue-500',
  secondary: 'border-slate-500/30 border-t-slate-400',
  white: 'border-white/30 border-t-white',
  success: 'border-green-500/30 border-t-green-500',
  danger: 'border-red-500/30 border-t-red-500',
  gradient: 'border-transparent border-t-blue-500 border-r-cyan-500'
};

// Spinner base
export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary',
  className = '' 
}) => {
  const sizeClasses = sizes[size] || sizes.md;
  const variantClasses = variants[variant] || variants.primary;
  
  return (
    <div 
      className={`${sizeClasses.spinner} ${sizeClasses.border} ${variantClasses} rounded-full animate-spin ${className}`}
    />
  );
};

// Spinner centrato con testo opzionale
export const CenteredSpinner = ({ 
  size = 'lg', 
  variant = 'primary',
  text,
  className = '' 
}) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`flex flex-col items-center justify-center gap-4 ${className}`}
  >
    <LoadingSpinner size={size} variant={variant} />
    {text && (
      <p className="text-slate-400 text-sm animate-pulse">{text}</p>
    )}
  </motion.div>
);

// Full page loading overlay
export const FullPageLoader = ({ 
  text = 'Caricamento...', 
  variant = 'primary' 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
  >
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="xl" variant={variant} />
      <p className="text-slate-300 text-lg font-medium animate-pulse">{text}</p>
    </div>
  </motion.div>
);

// Inline loading per bottoni e badge
export const InlineSpinner = ({ 
  size = 'xs', 
  variant = 'white',
  className = '' 
}) => (
  <LoadingSpinner size={size} variant={variant} className={className} />
);

// Loading placeholder per contenuti
export const ContentLoader = ({ 
  text = 'Caricamento dati...', 
  minHeight = 'min-h-[200px]' 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`flex flex-col items-center justify-center ${minHeight} w-full`}
  >
    <LoadingSpinner size="lg" variant="primary" />
    <p className="mt-4 text-theme-text-tertiary text-sm">{text}</p>
  </motion.div>
);

// Dots loading animation (alternativa allo spinner) - Enhanced
export const LoadingDots = ({ size = 'md', variant = 'primary', className = '' }) => {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const dotColors = {
    primary: 'bg-blue-500',
    secondary: 'bg-slate-400',
    success: 'bg-emerald-500',
    white: 'bg-white',
  };
  
  const dotSize = dotSizes[size] || dotSizes.md;
  const dotColor = dotColors[variant] || dotColors.primary;
  
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${dotSize} ${dotColor} rounded-full`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Pulse loading per immagini/avatar - Enhanced
export const PulseLoader = ({ 
  size = 'md', 
  shape = 'circle',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };
  
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-xl',
    card: 'rounded-2xl w-full h-48'
  };
  
  return (
    <div 
      className={`
        ${sizeClasses[size] || sizeClasses.md} 
        ${shapeClasses[shape] || shapeClasses.circle}
        bg-theme-bg-tertiary/50 animate-pulse
        ${className}
      `}
    />
  );
};

// Modern shimmer loader
export const ShimmerLoader = ({ className = '', height = 'h-4' }) => (
  <div className={`${height} rounded-lg overflow-hidden bg-theme-bg-tertiary/30 ${className}`}>
    <motion.div
      className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{ x: ['-100%', '200%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

export default LoadingSpinner;
