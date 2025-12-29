import React from 'react';

/**
 * Componente BodyMap - Mostra una silhouette umana con il muscolo evidenziato
 * Utilizza SVG inline per prestazioni ottimali e personalizzazione colori
 */

// Mapping muscoli -> parti del corpo da evidenziare
const muscleToBodyParts = {
  // Italiano
  'petto': ['chest'],
  'schiena': ['back', 'lats'],
  'braccia': ['biceps', 'triceps'],
  'avambracci': ['forearms'],
  'spalle': ['shoulders'],
  'gambe': ['quads', 'hamstrings', 'glutes'],
  'polpacci': ['calves'],
  'addome': ['abs', 'obliques'],
  'cardio': ['heart'],
  'collo': ['neck'],
  // English
  'chest': ['chest'],
  'back': ['back', 'lats'],
  'upper arms': ['biceps', 'triceps'],
  'lower arms': ['forearms'],
  'shoulders': ['shoulders'],
  'upper legs': ['quads', 'hamstrings', 'glutes'],
  'lower legs': ['calves'],
  'waist': ['abs', 'obliques'],
  'neck': ['neck'],
};

// Colori per i diversi gruppi muscolari
const muscleColors = {
  petto: '#ef4444',
  chest: '#ef4444',
  schiena: '#3b82f6',
  back: '#3b82f6',
  braccia: '#f97316',
  'upper arms': '#f97316',
  avambracci: '#f59e0b',
  'lower arms': '#f59e0b',
  spalle: '#a855f7',
  shoulders: '#a855f7',
  gambe: '#22c55e',
  'upper legs': '#22c55e',
  polpacci: '#14b8a6',
  'lower legs': '#14b8a6',
  calves: '#14b8a6',
  addome: '#eab308',
  waist: '#eab308',
  cardio: '#ec4899',
  collo: '#6366f1',
  neck: '#6366f1',
};

// SVG paths per ogni parte del corpo (vista frontale)
const bodyPartPaths = {
  // Testa
  head: 'M50 8 C58 8 64 14 64 24 C64 34 58 42 50 42 C42 42 36 34 36 24 C36 14 42 8 50 8',
  
  // Collo
  neck: 'M44 42 L44 50 L56 50 L56 42 C53 44 47 44 44 42',
  
  // Spalle
  shoulders: 'M30 50 C30 48 35 46 44 50 L44 58 L30 58 Z M70 50 C70 48 65 46 56 50 L56 58 L70 58 Z',
  
  // Petto
  chest: 'M35 52 L44 52 L44 72 L35 68 Z M65 52 L56 52 L56 72 L65 68 Z',
  
  // Addominali
  abs: 'M44 72 L56 72 L56 95 L44 95 Z',
  obliques: 'M35 68 L44 72 L44 95 L35 90 Z M65 68 L56 72 L56 95 L65 90 Z',
  
  // Bicipiti
  biceps: 'M25 58 L30 58 L30 78 L25 78 C23 72 23 64 25 58 M75 58 L70 58 L70 78 L75 78 C77 72 77 64 75 58',
  
  // Tricipiti (visibili da dietro, qui rappresentati lateralmente)
  triceps: 'M28 60 L32 60 L32 76 L28 76 Z M68 60 L72 60 L72 76 L68 76 Z',
  
  // Avambracci
  forearms: 'M23 78 L30 78 L28 100 L22 100 Z M77 78 L70 78 L72 100 L78 100 Z',
  
  // Mani
  hands: 'M20 100 L28 100 L26 112 L18 112 Z M80 100 L72 100 L74 112 L82 112 Z',
  
  // Quadricipiti
  quads: 'M38 95 L48 95 L46 130 L36 130 Z M62 95 L52 95 L54 130 L64 130 Z',
  
  // Femorali (parte posteriore, qui rappresentati ai lati)
  hamstrings: 'M36 100 L40 100 L38 125 L34 125 Z M64 100 L60 100 L62 125 L66 125 Z',
  
  // Glutei
  glutes: 'M38 92 L50 92 L50 100 L38 100 Z M62 92 L50 92 L50 100 L62 100 Z',
  
  // Polpacci
  calves: 'M37 130 L45 130 L44 160 L38 160 Z M63 130 L55 130 L56 160 L62 160 Z',
  
  // Piedi
  feet: 'M36 160 L46 160 L48 172 L34 172 Z M64 160 L54 160 L52 172 L66 172 Z',
  
  // Dorsali (schiena)
  back: 'M36 54 L44 54 L44 72 L36 68 Z M64 54 L56 54 L56 72 L64 68 Z',
  lats: 'M32 60 L38 62 L38 85 L32 80 Z M68 60 L62 62 L62 85 L68 80 Z',
  
  // Cuore (per cardio)
  heart: 'M50 56 C46 52 40 56 40 62 C40 70 50 78 50 78 C50 78 60 70 60 62 C60 56 54 52 50 56',
};

export const BodyMap = ({ 
  muscle, 
  size = 120, 
  showLabels = false,
  className = '',
  onClick,
  variant = 'front' // 'front' | 'back'
}) => {
  const normalizedMuscle = muscle?.toLowerCase().trim() || '';
  const highlightParts = muscleToBodyParts[normalizedMuscle] || [];
  const highlightColor = muscleColors[normalizedMuscle] || '#6366f1';
  
  const viewBox = "0 0 100 180";
  
  return (
    <div 
      className={`relative ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ width: size, height: size * 1.5 }}
    >
      <svg 
        viewBox={viewBox} 
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        {/* Sfondo silhouette corpo completo */}
        <g fill="#334155" opacity="0.6">
          {Object.entries(bodyPartPaths).map(([part, path]) => (
            <path key={part} d={path} />
          ))}
        </g>
        
        {/* Parti evidenziate */}
        <g fill={highlightColor} className="transition-all duration-300">
          {highlightParts.map(part => (
            bodyPartPaths[part] && (
              <path 
                key={part} 
                d={bodyPartPaths[part]}
                className="animate-pulse"
                style={{ 
                  filter: `drop-shadow(0 0 8px ${highlightColor})`,
                  animationDuration: '2s'
                }}
              />
            )
          ))}
        </g>
        
        {/* Contorno */}
        <g fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.5">
          {Object.entries(bodyPartPaths).map(([part, path]) => (
            <path key={`outline-${part}`} d={path} />
          ))}
        </g>
      </svg>
      
      {/* Label */}
      {showLabels && muscle && (
        <div 
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
          style={{ 
            backgroundColor: highlightColor + '30',
            color: highlightColor,
            border: `1px solid ${highlightColor}50`
          }}
        >
          {muscle}
        </div>
      )}
    </div>
  );
};

// Versione compatta per le card degli esercizi
export const BodyMapMini = ({ muscle, size = 48, className = '' }) => {
  const normalizedMuscle = muscle?.toLowerCase().trim() || '';
  const highlightParts = muscleToBodyParts[normalizedMuscle] || [];
  const highlightColor = muscleColors[normalizedMuscle] || '#6366f1';
  
  return (
    <svg 
      viewBox="0 0 100 180" 
      className={className}
      style={{ 
        width: size, 
        height: size * 1.5,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
      }}
    >
      {/* Sfondo corpo */}
      <g fill="#475569" opacity="0.4">
        {Object.entries(bodyPartPaths).map(([part, path]) => (
          <path key={part} d={path} />
        ))}
      </g>
      
      {/* Parte evidenziata */}
      <g fill={highlightColor}>
        {highlightParts.map(part => (
          bodyPartPaths[part] && (
            <path 
              key={part} 
              d={bodyPartPaths[part]}
              style={{ filter: `drop-shadow(0 0 4px ${highlightColor})` }}
            />
          )
        ))}
      </g>
    </svg>
  );
};

// Griglia di selezione con body map per ogni muscolo
export const BodyMapSelector = ({ muscles, selectedMuscle, onSelect }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
      {muscles.map((muscle) => {
        const isSelected = selectedMuscle === muscle;
        const color = muscleColors[muscle.toLowerCase()] || '#6366f1';
        
        return (
          <button
            key={muscle}
            onClick={() => onSelect(isSelected ? '' : muscle)}
            className={`
              flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200
              ${isSelected 
                ? 'border-current scale-105 shadow-lg' 
                : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
              }
            `}
            style={{ 
              borderColor: isSelected ? color : undefined,
              backgroundColor: isSelected ? color + '15' : undefined
            }}
          >
            <BodyMapMini muscle={muscle} size={40} />
            <span 
              className={`mt-2 text-xs font-medium capitalize ${isSelected ? '' : 'text-slate-400'}`}
              style={{ color: isSelected ? color : undefined }}
            >
              {muscle}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BodyMap;
