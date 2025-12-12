// src/components/ui/Progress.jsx
// Modern Progress components with animations
import React from 'react';
import { motion } from 'framer-motion';

/**
 * ProgressBar - Horizontal progress bar
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'blue',
  showLabel = false,
  label,
  animated = true,
  striped = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  };
  
  const colors = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-yellow-400',
    rose: 'from-rose-500 to-pink-400',
    purple: 'from-purple-500 to-violet-400',
    cyan: 'from-cyan-500 to-blue-400',
    orange: 'from-orange-500 to-amber-400',
    gradient: 'from-blue-500 via-purple-500 to-pink-500'
  };

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-theme-text-secondary">
            {label || `${Math.round(percentage)}%`}
          </span>
          {label && showLabel && (
            <span className="text-sm font-semibold text-theme-text-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${sizes[size]} bg-theme-bg-tertiary/60 rounded-full overflow-hidden`}>
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]} ${
            striped ? 'bg-stripes' : ''
          } shadow-sm`}
          style={striped ? {
            backgroundImage: `linear-gradient(
              45deg,
              rgba(255,255,255,0.15) 25%,
              transparent 25%,
              transparent 50%,
              rgba(255,255,255,0.15) 50%,
              rgba(255,255,255,0.15) 75%,
              transparent 75%,
              transparent
            )`,
            backgroundSize: '1rem 1rem',
            animation: animated ? 'progress-stripes 1s linear infinite' : 'none'
          } : undefined}
        />
      </div>
    </div>
  );
};

/**
 * CircularProgress - Circular progress indicator
 */
export const CircularProgress = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'blue',
  showValue = true,
  thickness = 8,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: { size: 48, fontSize: 'text-xs' },
    md: { size: 64, fontSize: 'text-sm' },
    lg: { size: 96, fontSize: 'text-lg' },
    xl: { size: 128, fontSize: 'text-2xl' }
  };
  
  const colors = {
    blue: '#3B82F6',
    green: '#10B981',
    amber: '#F59E0B',
    rose: '#F43F5E',
    purple: '#8B5CF6',
    cyan: '#06B6D4'
  };
  
  const sizeConfig = sizes[size] || sizes.md;
  const radius = (sizeConfig.size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={sizeConfig.size}
        height={sizeConfig.size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={sizeConfig.size / 2}
          cy={sizeConfig.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-theme-bg-tertiary/60"
        />
        {/* Progress circle */}
        <motion.circle
          cx={sizeConfig.size / 2}
          cy={sizeConfig.size / 2}
          r={radius}
          fill="none"
          stroke={colors[color] || colors.blue}
          strokeWidth={thickness}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference
          }}
        />
      </svg>
      {showValue && (
        <span className={`absolute ${sizeConfig.fontSize} font-bold text-theme-text-primary`}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

/**
 * StepProgress - Step-based progress indicator
 */
export const StepProgress = ({
  steps = [],
  currentStep = 0,
  color = 'blue',
  className = ''
}) => {
  const colors = {
    blue: { active: 'bg-blue-500', completed: 'bg-blue-500', line: 'bg-blue-500' },
    green: { active: 'bg-emerald-500', completed: 'bg-emerald-500', line: 'bg-emerald-500' },
    purple: { active: 'bg-purple-500', completed: 'bg-purple-500', line: 'bg-purple-500' }
  };
  
  const colorConfig = colors[color] || colors.blue;

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Step circle */}
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                index < currentStep 
                  ? `${colorConfig.completed} text-white shadow-lg shadow-blue-500/30`
                  : index === currentStep
                  ? `${colorConfig.active} text-white ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/30`
                  : 'bg-theme-bg-tertiary/60 text-theme-text-tertiary'
              }`}
            >
              {index < currentStep ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </motion.div>
            {step.label && (
              <span className={`absolute -bottom-6 whitespace-nowrap text-xs font-medium ${
                index <= currentStep ? 'text-theme-text-primary' : 'text-theme-text-tertiary'
              }`}>
                {step.label}
              </span>
            )}
          </div>
          
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-1 mx-2 bg-theme-bg-tertiary/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: index < currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`h-full ${colorConfig.line} rounded-full`}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * ProgressRing - Small ring progress for compact displays
 */
export const ProgressRing = ({
  value = 0,
  max = 100,
  size = 24,
  strokeWidth = 3,
  color = 'blue',
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const colors = {
    blue: '#3B82F6',
    green: '#10B981',
    amber: '#F59E0B',
    rose: '#F43F5E'
  };

  return (
    <svg width={size} height={size} className={`transform -rotate-90 ${className}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-theme-bg-tertiary/60"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colors[color] || colors.blue}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500"
      />
    </svg>
  );
};

export default ProgressBar;
