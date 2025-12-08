// src/components/ui/AnimatedCard.jsx
// Card con animazioni e micro-interazioni

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Card animata con hover effects
 */
export function AnimatedCard({
  children,
  onClick,
  className = '',
  variant = 'default', // 'default', 'elevated', 'outlined', 'glass'
  hoverEffect = 'lift', // 'lift', 'glow', 'scale', 'none'
  padding = 'md', // 'none', 'sm', 'md', 'lg'
  delay = 0,
  as = 'div'
}) {
  const baseClasses = 'rounded-xl transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-slate-800/60 backdrop-blur-sm border border-slate-700/50',
    elevated: 'bg-slate-800 border border-slate-700 shadow-xl shadow-black/20',
    outlined: 'bg-transparent border border-slate-700 hover:border-slate-600',
    glass: 'bg-white/5 backdrop-blur-lg border border-white/10',
    gradient: 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-5',
    lg: 'p-6'
  };

  const hoverEffects = {
    lift: {
      whileHover: { y: -4, transition: { duration: 0.2 } },
      whileTap: { y: 0 }
    },
    glow: {
      whileHover: { 
        boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 0.5)'
      }
    },
    scale: {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 }
    },
    none: {}
  };

  const MotionComponent = motion[as] || motion.div;

  return (
    <MotionComponent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...hoverEffects[hoverEffect]}
    >
      {children}
    </MotionComponent>
  );
}

/**
 * Card che si rivela con animazione stagger
 */
export function StaggeredCards({ 
  children, 
  className = '',
  staggerDelay = 0.1 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Stat card con animazione contatore
 */
export function AnimatedStatCard({
  icon: Icon,
  iconColor = 'text-blue-400',
  iconBg = 'bg-blue-500/10',
  label,
  value,
  suffix = '',
  prefix = '',
  trend,
  trendLabel,
  onClick,
  className = ''
}) {
  return (
    <AnimatedCard
      onClick={onClick}
      hoverEffect={onClick ? 'lift' : 'none'}
      className={className}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
        
        {trend !== undefined && (
          <div className={`
            flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
            ${trend >= 0 
              ? 'text-green-400 bg-green-500/10' 
              : 'text-red-400 bg-red-500/10'
            }
          `}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4"
      >
        <p className="text-2xl font-bold text-white">
          {prefix}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {value}
          </motion.span>
          {suffix}
        </p>
        <p className="text-sm text-slate-400 mt-1">{label}</p>
        {trendLabel && (
          <p className="text-xs text-slate-500 mt-0.5">{trendLabel}</p>
        )}
      </motion.div>
    </AnimatedCard>
  );
}

/**
 * Card con bordo gradient animato
 */
export function GradientBorderCard({ 
  children, 
  className = '',
  gradientColors = ['#3b82f6', '#8b5cf6', '#ec4899']
}) {
  return (
    <div className={`relative p-[1px] rounded-xl overflow-hidden ${className}`}>
      {/* Gradient animato sul bordo */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `linear-gradient(45deg, ${gradientColors.join(', ')})`,
          backgroundSize: '200% 200%'
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Contenuto */}
      <div className="relative bg-slate-900 rounded-xl p-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Card interattiva con flip
 */
export function FlipCard({
  front,
  back,
  className = ''
}) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <div 
      className={`relative cursor-pointer perspective-1000 ${className}`}
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

export default AnimatedCard;
