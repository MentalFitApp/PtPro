// src/config/backgroundPresets.js
// Catalogo sfondi stellati e opzioni trasparenza

/**
 * Preset sfondi stellati con diverse animazioni
 */
export const backgroundPresets = {
  // Sfondo stellato classico - stelle che cadono lentamente
  classic: {
    id: 'classic',
    name: 'Classico',
    description: 'Stelle cadenti eleganti',
    preview: 'linear-gradient(to bottom, #0f172a, #1e1b4b)',
    type: 'stars',
    config: {
      starCount: 25,
      animation: 'fall',
      speed: 'slow',
      colors: ['#8b5cf6', '#f472b6', '#22d3ee', '#fbbf24'],
      sizeRange: [1, 2],
      twinkle: true,
    }
  },
  
  // Nebulosa - stelle più grandi con alone
  nebula: {
    id: 'nebula',
    name: 'Nebulosa',
    description: 'Stelle brillanti con alone luminoso',
    preview: 'linear-gradient(to bottom, #1e1b4b, #312e81)',
    type: 'stars',
    config: {
      starCount: 15,
      animation: 'pulse',
      speed: 'medium',
      colors: ['#a78bfa', '#f0abfc', '#67e8f9'],
      sizeRange: [2, 4],
      glow: true,
      twinkle: true,
    }
  },
  
  // Aurora - onde di luce colorate
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    description: 'Onde di luce danzanti',
    preview: 'linear-gradient(135deg, #0f172a, #134e4a, #1e1b4b)',
    type: 'aurora',
    config: {
      waveCount: 3,
      colors: ['#06b6d4', '#8b5cf6', '#ec4899'],
      speed: 'slow',
      opacity: 0.3,
    }
  },
  
  // Galassia - stelle + polvere cosmica
  galaxy: {
    id: 'galaxy',
    name: 'Galassia',
    description: 'Polvere cosmica e stelle lontane',
    preview: 'linear-gradient(to bottom, #020617, #1e1b4b, #0f172a)',
    type: 'stars',
    config: {
      starCount: 40,
      animation: 'drift',
      speed: 'very-slow',
      colors: ['#ffffff', '#e0e7ff', '#c4b5fd', '#fef08a'],
      sizeRange: [0.5, 1.5],
      twinkle: true,
      dustClouds: true,
    }
  },
  
  // Minimalista - pochissime stelle, molto elegante
  minimal: {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Poche stelle, massima eleganza',
    preview: 'linear-gradient(to bottom, #0f172a, #1e293b)',
    type: 'stars',
    config: {
      starCount: 8,
      animation: 'twinkle-only',
      speed: 'very-slow',
      colors: ['#94a3b8', '#cbd5e1'],
      sizeRange: [1, 2],
      twinkle: true,
    }
  },
  
  // Nessuno sfondo animato - solo colore solido
  solid: {
    id: 'solid',
    name: 'Colore Solido',
    description: 'Sfondo semplice senza animazioni',
    preview: 'linear-gradient(to bottom, #0f172a, #0f172a)',
    type: 'solid',
    config: {
      baseColor: '#0f172a',
      allowCustomColor: true,
    }
  },
  
  // Gradiente statico
  gradient: {
    id: 'gradient',
    name: 'Gradiente',
    description: 'Sfumatura elegante senza animazioni',
    preview: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
    type: 'gradient',
    config: {
      direction: '135deg',
      colors: ['#0f172a', '#1e1b4b'],
      allowCustomColors: true,
    }
  },
};

/**
 * Opzioni di trasparenza per le card
 */
export const transparencyOptions = {
  none: {
    id: 'none',
    name: 'Disattivata',
    description: 'Card completamente opache',
    value: 1,
    cssClass: 'card-opacity-none',
  },
  subtle: {
    id: 'subtle',
    name: 'Leggera',
    description: 'Trasparenza appena percettibile',
    value: 0.9,
    cssClass: 'card-opacity-subtle',
  },
  medium: {
    id: 'medium',
    name: 'Media',
    description: 'Bilanciamento ottimale',
    value: 0.7,
    cssClass: 'card-opacity-medium',
  },
  strong: {
    id: 'strong',
    name: 'Alta',
    description: 'Effetto glass marcato',
    value: 0.5,
    cssClass: 'card-opacity-strong',
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    description: 'Massima trasparenza, effetto vetro',
    value: 0.3,
    cssClass: 'card-opacity-glass',
  },
};

/**
 * Colori predefiniti per sfondo solido
 */
export const solidBackgroundColors = [
  { id: 'slate', name: 'Slate', color: '#0f172a' },
  { id: 'gray', name: 'Grigio', color: '#111827' },
  { id: 'zinc', name: 'Zinco', color: '#18181b' },
  { id: 'neutral', name: 'Neutro', color: '#171717' },
  { id: 'stone', name: 'Pietra', color: '#1c1917' },
  { id: 'indigo', name: 'Indaco', color: '#1e1b4b' },
  { id: 'purple', name: 'Viola', color: '#2e1065' },
  { id: 'blue', name: 'Blu', color: '#172554' },
  { id: 'cyan', name: 'Ciano', color: '#083344' },
  { id: 'teal', name: 'Teal', color: '#042f2e' },
  { id: 'emerald', name: 'Smeraldo', color: '#022c22' },
];

/**
 * Default settings
 */
export const defaultBackgroundSettings = {
  preset: 'classic',
  solidColor: '#0f172a',
  gradientColors: ['#0f172a', '#1e1b4b'],
  cardTransparency: 0.6, // 60% opacità (40% trasparente)
  cardBlur: true,
};
