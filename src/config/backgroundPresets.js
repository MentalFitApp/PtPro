// src/config/backgroundPresets.js
// Catalogo sfondi stellati con 5 preset diversi - stile login premium

/**
 * Preset sfondi stellati con diverse animazioni
 * Tutti basati sullo stile premium del login con stelle animate
 */
export const backgroundPresets = {
  // Cielo Stellato - Default, stile login con twinkle e float dolce
  // Stelle blu e oro che brillano e fluttuano dolcemente
  starryNight: {
    id: 'starryNight',
    name: 'Cielo Stellato',
    description: 'Stelle scintillanti come nella notte (Default)',
    preview: 'linear-gradient(to bottom, #0f172a, #1e293b)',
    type: 'stars',
    isDefault: true,
    config: {
      starCount: 50,
      animation: 'twinkle-float',
      speed: 'medium',
      colors: ['blue', 'gold'],
      sizeRange: [1, 3],
      twinkle: true,
      float: true,
    }
  },
  
  // Pioggia di Meteore - stelle che cadono velocemente con scie luminose
  meteorShower: {
    id: 'meteorShower',
    name: 'Pioggia di Meteore',
    description: 'Stelle cadenti con scie luminose',
    preview: 'linear-gradient(to bottom, #020617, #0f172a)',
    type: 'stars',
    config: {
      starCount: 30,
      animation: 'meteor',
      speed: 'fast',
      colors: ['white', 'cyan', 'gold'],
      sizeRange: [1, 2],
      trails: true,
    }
  },
  
  // Universo Profondo - stelle che pulsano lentamente con profondità
  deepSpace: {
    id: 'deepSpace',
    name: 'Universo Profondo',
    description: 'Stelle pulsanti in profondità cosmica',
    preview: 'linear-gradient(to bottom, #030712, #1e1b4b)',
    type: 'stars',
    config: {
      starCount: 60,
      animation: 'pulse-depth',
      speed: 'slow',
      colors: ['white', 'purple', 'pink', 'cyan'],
      sizeRange: [0.5, 3],
      depth: true,
      glow: true,
    }
  },
  
  // Costellazioni - stelle che si connettono con linee sottili animate
  constellations: {
    id: 'constellations',
    name: 'Costellazioni',
    description: 'Stelle connesse da linee magiche',
    preview: 'linear-gradient(to bottom, #0c1222, #1a1a2e)',
    type: 'stars',
    config: {
      starCount: 35,
      animation: 'constellation',
      speed: 'very-slow',
      colors: ['blue', 'white', 'cyan'],
      sizeRange: [2, 4],
      connections: true,
    }
  },
  
  // Polvere di Stelle - particelle sottili che fluttuano in tutte le direzioni
  stardust: {
    id: 'stardust',
    name: 'Polvere di Stelle',
    description: 'Particelle magiche che danzano',
    preview: 'linear-gradient(to bottom, #0f172a, #312e81)',
    type: 'stars',
    config: {
      starCount: 80,
      animation: 'dust',
      speed: 'medium',
      colors: ['white', 'gold', 'pink', 'cyan'],
      sizeRange: [0.5, 2],
      scatter: true,
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
  preset: 'starryNight',
  solidColor: '#0f172a',
  gradientColors: ['#0f172a', '#1e1b4b'],
  cardTransparency: 0.6, // 60% opacità (40% trasparente)
  cardBlur: true,
};
