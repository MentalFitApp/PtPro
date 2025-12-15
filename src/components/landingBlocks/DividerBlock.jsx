import React from 'react';

/**
 * Divider Block - Separatore tra sezioni
 * Varianti: line, wave, gradient
 */
const DividerBlock = ({ settings }) => {
  const {
    variant = 'line',
    color = 'border-slate-700',
    margin = 'my-8',
  } = settings || {};

  // Variante Wave
  if (variant === 'wave') {
    return (
      <div className={margin}>
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="w-full h-12 text-slate-800"
          fill="currentColor"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>
    );
  }

  // Variante Gradient
  if (variant === 'gradient') {
    return (
      <div className={`${margin} px-4`}>
        <div className="max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
      </div>
    );
  }

  // Default: Line
  return (
    <div className={`${margin} px-4`}>
      <div className={`max-w-4xl mx-auto border-t ${color}`} />
    </div>
  );
};

export default DividerBlock;
