import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { animations, typography } from '../../config/designSystem';

export const PageHeader = ({ 
  title, 
  subtitle,
  description,
  icon: Icon,
  actions,
  backButton,
  onBack,
  badge,
  variant = 'default', // 'default', 'compact', 'hero'
  className = '' 
}) => {
  const isCompact = variant === 'compact';
  const isHero = variant === 'hero';

  return (
    <motion.div 
      className={`${isCompact ? 'mb-4' : 'mb-8'} ${className}`}
      {...animations.fadeIn}
    >
      {/* Back button */}
      {backButton && onBack && (
        <motion.button
          onClick={onBack}
          className="flex items-center gap-1.5 text-theme-text-secondary hover:text-theme-text-primary mb-4 transition-colors group"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <ChevronLeft size={20} className="group-hover:text-blue-400 transition-colors" />
          <span className="text-sm font-medium">{typeof backButton === 'string' ? backButton : 'Indietro'}</span>
        </motion.button>
      )}

      <div className={`flex ${isCompact ? 'items-center' : 'items-start'} justify-between gap-4 flex-wrap`}>
        <div className={`flex ${isCompact ? 'items-center gap-3' : 'items-start gap-4'}`}>
          {/* Icon */}
          {Icon && (
            <motion.div 
              className={`
                ${isCompact ? 'p-2' : isHero ? 'p-4' : 'p-3'} 
                rounded-2xl 
                bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-blue-500/10
                border border-blue-500/20
                shadow-lg shadow-blue-500/10
              `}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Icon 
                size={isCompact ? 20 : isHero ? 32 : 28} 
                className="text-blue-400" 
              />
            </motion.div>
          )}
          
          {/* Text content */}
          <div className={isHero ? 'space-y-2' : ''}>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className={`
                ${isCompact ? 'text-xl font-bold' : isHero ? 'text-4xl font-extrabold' : typography.h1}
                text-theme-text-primary
              `}>
                {title}
              </h1>
              {badge && badge}
            </div>
            
            {subtitle && (
              <p className={`
                ${isCompact ? 'text-sm' : isHero ? 'text-lg' : 'text-base'} 
                text-theme-text-secondary 
                ${isCompact ? 'mt-0' : 'mt-1'}
              `}>
                {subtitle}
              </p>
            )}
            
            {description && !isCompact && (
              <p className="text-theme-text-tertiary text-sm mt-2 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {actions && (
          <motion.div 
            className="flex items-center gap-3 flex-wrap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Section Header for internal page sections
export const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
}) => (
  <motion.div 
    className={`flex items-center justify-between mb-4 ${className}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 rounded-lg bg-theme-bg-tertiary/50">
          <Icon size={18} className="text-theme-text-secondary" />
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold text-theme-text-primary">{title}</h2>
        {subtitle && <p className="text-xs text-theme-text-tertiary">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </motion.div>
);

// Divider with optional label
export const Divider = ({ label, className = '' }) => (
  <div className={`flex items-center gap-4 my-6 ${className}`}>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-theme to-transparent opacity-50" />
    {label && (
      <span className="text-xs font-medium text-theme-text-tertiary uppercase tracking-wider">
        {label}
      </span>
    )}
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-theme to-transparent opacity-50" />
  </div>
);

export default PageHeader;
