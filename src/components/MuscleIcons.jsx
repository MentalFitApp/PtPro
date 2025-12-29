import React from 'react';

// Icone SVG per ogni gruppo muscolare - design moderno e riconoscibile
export const MuscleIcons = {
  // Petto
  petto: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M32 8C20 8 10 18 10 30c0 8 4 15 10 20l12 6 12-6c6-5 10-12 10-20 0-12-10-22-22-22z" opacity="0.3"/>
      <path d="M32 12c-10 0-18 8-18 18 0 6 3 11 7 15l11 5 11-5c4-4 7-9 7-15 0-10-8-18-18-18z"/>
      <path d="M32 16v28M20 24h24" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/>
    </svg>
  ),
  chest: ({ size = 24, className = '' }) => MuscleIcons.petto({ size, className }),

  // Schiena
  schiena: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M32 4L16 12v40l16 8 16-8V12L32 4z" opacity="0.3"/>
      <path d="M32 8L20 14v32l12 6 12-6V14L32 8z"/>
      <path d="M32 14v38M24 20l16 8M24 44l16-8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/>
    </svg>
  ),
  back: ({ size = 24, className = '' }) => MuscleIcons.schiena({ size, className }),

  // Braccia (bicipiti/tricipiti)
  braccia: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <ellipse cx="32" cy="20" rx="12" ry="14" opacity="0.3"/>
      <ellipse cx="32" cy="20" rx="10" ry="12"/>
      <path d="M26 32c-2 8-2 16 0 24h12c2-8 2-16 0-24" opacity="0.6"/>
      <path d="M32 8v48" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
    </svg>
  ),
  'upper arms': ({ size = 24, className = '' }) => MuscleIcons.braccia({ size, className }),

  // Avambracci
  avambracci: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M24 8c-4 12-4 24 0 36l8 12 8-12c4-12 4-24 0-36H24z" opacity="0.3"/>
      <path d="M26 12c-3 10-3 20 0 30l6 10 6-10c3-10 3-20 0-30H26z"/>
    </svg>
  ),
  'lower arms': ({ size = 24, className = '' }) => MuscleIcons.avambracci({ size, className }),

  // Spalle
  spalle: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <ellipse cx="16" cy="28" rx="10" ry="14" opacity="0.3"/>
      <ellipse cx="48" cy="28" rx="10" ry="14" opacity="0.3"/>
      <ellipse cx="16" cy="28" rx="8" ry="12"/>
      <ellipse cx="48" cy="28" rx="8" ry="12"/>
      <path d="M24 28h16" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.5"/>
    </svg>
  ),
  shoulders: ({ size = 24, className = '' }) => MuscleIcons.spalle({ size, className }),

  // Gambe (quadricipiti/femorali)
  gambe: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M20 4c-4 16-4 32 0 48l6 8h12l6-8c4-16 4-32 0-48H20z" opacity="0.3"/>
      <path d="M22 8c-3 14-3 28 0 42l5 6h10l5-6c3-14 3-28 0-42H22z"/>
      <path d="M32 8v48M22 28h20" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4"/>
    </svg>
  ),
  'upper legs': ({ size = 24, className = '' }) => MuscleIcons.gambe({ size, className }),

  // Polpacci
  polpacci: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M24 4c-6 14-4 28 2 40l6 16 6-16c6-12 8-26 2-40H24z" opacity="0.3"/>
      <path d="M26 8c-5 12-3 24 2 34l4 14 4-14c5-10 7-22 2-34H26z"/>
    </svg>
  ),
  calves: ({ size = 24, className = '' }) => MuscleIcons.polpacci({ size, className }),
  'lower legs': ({ size = 24, className = '' }) => MuscleIcons.polpacci({ size, className }),

  // Addome
  addome: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <rect x="18" y="8" width="28" height="48" rx="4" opacity="0.3"/>
      <rect x="20" y="10" width="24" height="44" rx="3"/>
      <path d="M32 10v44M20 22h24M20 34h24M20 46h24" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/>
    </svg>
  ),
  waist: ({ size = 24, className = '' }) => MuscleIcons.addome({ size, className }),

  // Cardio
  cardio: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M32 56L8 32c-8-8-8-20 0-28s20-8 28 0l-4 4 4-4c8-8 20-8 28 0s8 20 0 28L32 56z" opacity="0.3"/>
      <path d="M32 50L12 30c-6-6-6-16 0-22s16-6 22 0l-2 2 2-2c6-6 16-6 22 0s6 16 0 22L32 50z"/>
      <path d="M16 30h10l4-8 6 16 4-8h8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7"/>
    </svg>
  ),

  // Collo
  collo: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <ellipse cx="32" cy="20" rx="16" ry="12" opacity="0.3"/>
      <path d="M24 28c-2 8-2 20 0 28h16c2-8 2-20 0-28" opacity="0.4"/>
      <ellipse cx="32" cy="20" rx="14" ry="10"/>
      <path d="M26 32c-1 6-1 16 0 22h12c1-6 1-16 0-22"/>
    </svg>
  ),
  neck: ({ size = 24, className = '' }) => MuscleIcons.collo({ size, className }),

  // Default per gruppi non mappati
  default: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="currentColor">
      <circle cx="32" cy="32" r="24" opacity="0.3"/>
      <circle cx="32" cy="32" r="20"/>
      <path d="M32 16v32M16 32h32" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5"/>
    </svg>
  )
};

// Helper per ottenere l'icona giusta dal nome del muscolo
export const getMuscleIcon = (muscleName) => {
  if (!muscleName) return MuscleIcons.default;
  
  const normalizedName = muscleName.toLowerCase().trim();
  
  // Mappatura nomi italiani e inglesi
  const muscleMap = {
    'petto': 'petto',
    'chest': 'petto',
    'schiena': 'schiena',
    'back': 'schiena',
    'braccia': 'braccia',
    'upper arms': 'braccia',
    'bicipiti': 'braccia',
    'tricipiti': 'braccia',
    'avambracci': 'avambracci',
    'lower arms': 'avambracci',
    'spalle': 'spalle',
    'shoulders': 'spalle',
    'deltoidi': 'spalle',
    'gambe': 'gambe',
    'upper legs': 'gambe',
    'quadricipiti': 'gambe',
    'femorali': 'gambe',
    'glutei': 'gambe',
    'polpacci': 'polpacci',
    'lower legs': 'polpacci',
    'calves': 'polpacci',
    'addome': 'addome',
    'waist': 'addome',
    'core': 'addome',
    'abs': 'addome',
    'cardio': 'cardio',
    'collo': 'collo',
    'neck': 'collo'
  };

  const mappedMuscle = muscleMap[normalizedName];
  return mappedMuscle ? MuscleIcons[mappedMuscle] : MuscleIcons.default;
};

// Colori per ogni gruppo muscolare
export const muscleColors = {
  petto: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', gradient: 'from-red-500 to-red-600' },
  chest: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', gradient: 'from-red-500 to-red-600' },
  schiena: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', gradient: 'from-blue-500 to-blue-600' },
  back: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', gradient: 'from-blue-500 to-blue-600' },
  braccia: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', gradient: 'from-orange-500 to-orange-600' },
  'upper arms': { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', gradient: 'from-orange-500 to-orange-600' },
  avambracci: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', gradient: 'from-amber-500 to-amber-600' },
  'lower arms': { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', gradient: 'from-amber-500 to-amber-600' },
  spalle: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', gradient: 'from-purple-500 to-purple-600' },
  shoulders: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', gradient: 'from-purple-500 to-purple-600' },
  gambe: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', gradient: 'from-green-500 to-green-600' },
  'upper legs': { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', gradient: 'from-green-500 to-green-600' },
  polpacci: { bg: 'bg-teal-500/20', border: 'border-teal-500/40', text: 'text-teal-400', gradient: 'from-teal-500 to-teal-600' },
  'lower legs': { bg: 'bg-teal-500/20', border: 'border-teal-500/40', text: 'text-teal-400', gradient: 'from-teal-500 to-teal-600' },
  calves: { bg: 'bg-teal-500/20', border: 'border-teal-500/40', text: 'text-teal-400', gradient: 'from-teal-500 to-teal-600' },
  addome: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', gradient: 'from-yellow-500 to-yellow-600' },
  waist: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', gradient: 'from-yellow-500 to-yellow-600' },
  cardio: { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400', gradient: 'from-pink-500 to-pink-600' },
  collo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-400', gradient: 'from-indigo-500 to-indigo-600' },
  neck: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-400', gradient: 'from-indigo-500 to-indigo-600' },
  default: { bg: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-400', gradient: 'from-slate-500 to-slate-600' }
};

export const getMuscleColor = (muscleName) => {
  if (!muscleName) return muscleColors.default;
  const normalized = muscleName.toLowerCase().trim();
  return muscleColors[normalized] || muscleColors.default;
};

// Componente MuscleChip con icona
export const MuscleChip = ({ muscle, size = 'md', showLabel = true, onClick, selected = false }) => {
  const Icon = getMuscleIcon(muscle);
  const colors = getMuscleColor(muscle);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2'
  };
  
  const iconSizes = { sm: 14, md: 18, lg: 24 };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center rounded-full border transition-all duration-200
        ${sizeClasses[size]}
        ${colors.bg} ${colors.border} ${colors.text}
        ${selected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-current scale-105' : ''}
        ${onClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
      `}
    >
      <Icon size={iconSizes[size]} className="flex-shrink-0" />
      {showLabel && <span className="font-medium capitalize">{muscle}</span>}
    </button>
  );
};

// Griglia di selezione muscoli
export const MuscleSelector = ({ muscles, selectedMuscle, onSelect, columns = 5 }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-${columns} gap-2`}>
      {muscles.map((muscle) => (
        <MuscleChip
          key={muscle}
          muscle={muscle}
          selected={selectedMuscle === muscle}
          onClick={() => onSelect(selectedMuscle === muscle ? '' : muscle)}
          size="md"
        />
      ))}
    </div>
  );
};

export default MuscleIcons;
