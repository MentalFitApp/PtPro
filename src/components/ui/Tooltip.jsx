// src/components/ui/Tooltip.jsx
// Modern Tooltip component with animations
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Tooltip Component
 * @param {string} content - Tooltip content text
 * @param {string} position - Position: top, bottom, left, right
 * @param {number} delay - Delay before showing (ms)
 * @param {ReactNode} children - Element to wrap
 */
export const Tooltip = ({
  content,
  position = 'top',
  delay = 300,
  disabled = false,
  className = '',
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const triggerRef = useRef(null);

  const positions = {
    top: {
      initial: { opacity: 0, y: 8, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 8, scale: 0.95 },
      className: 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    },
    bottom: {
      initial: { opacity: 0, y: -8, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.95 },
      className: 'top-full left-1/2 -translate-x-1/2 mt-2'
    },
    left: {
      initial: { opacity: 0, x: 8, scale: 0.95 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: 8, scale: 0.95 },
      className: 'right-full top-1/2 -translate-y-1/2 mr-2'
    },
    right: {
      initial: { opacity: 0, x: -8, scale: 0.95 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: -8, scale: 0.95 },
      className: 'left-full top-1/2 -translate-y-1/2 ml-2'
    }
  };

  const posConfig = positions[position] || positions.top;

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!content) return children;

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={posConfig.initial}
            animate={posConfig.animate}
            exit={posConfig.exit}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`absolute z-50 ${posConfig.className}`}
          >
            <div className="px-3 py-2 text-sm font-medium text-white bg-theme-bg-primary/95 backdrop-blur-xl border border-theme/50 rounded-lg shadow-xl shadow-black/25 whitespace-nowrap">
              {content}
              {/* Arrow */}
              <div className={`absolute w-2 h-2 bg-theme-bg-primary/95 border-theme/50 transform rotate-45 ${
                position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r' :
                position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l' :
                position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
                'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
              }`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * InfoTooltip - Small info icon with tooltip
 */
export const InfoTooltip = ({ content, className = '' }) => {
  return (
    <Tooltip content={content} position="top">
      <span className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-theme-text-tertiary bg-theme-bg-tertiary/60 hover:bg-theme-bg-tertiary rounded-full cursor-help transition-colors ${className}`}>
        ?
      </span>
    </Tooltip>
  );
};

/**
 * HelpTooltip - Help icon with tooltip (larger)
 */
export const HelpTooltip = ({ content, className = '' }) => {
  return (
    <Tooltip content={content} position="top">
      <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-theme-text-tertiary hover:text-theme-text-secondary bg-theme-bg-tertiary/40 hover:bg-theme-bg-tertiary rounded-full cursor-help transition-colors ${className}`}>
        i
      </span>
    </Tooltip>
  );
};

export default Tooltip;
