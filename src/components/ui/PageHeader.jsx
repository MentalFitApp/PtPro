import React from 'react';
import { motion } from 'framer-motion';
import { animations, typography } from '../../config/designSystem';

export const PageHeader = ({ 
  title, 
  subtitle,
  icon: Icon,
  actions,
  className = '' 
}) => {
  return (
    <motion.div 
      className={`mb-8 ${className}`}
      {...animations.fadeIn}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 bg-opacity-10">
              <Icon size={28} className="text-cyan-400" />
            </div>
          )}
          <div>
            <h1 className={typography.h1}>{title}</h1>
            {subtitle && (
              <p className="text-slate-400 mt-2">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PageHeader;
