// src/config/backgroundPresets.js
// Catalogo sfondi con effetti Nebula 2.0 premium

/**
 * Preset sfondi Nebula 2.0 - Effetti canvas animati premium
 * Aurora è il default con stelle fluenti
 */
export const backgroundPresets = {
  // AURORA BOREALIS - Default, effetto premium con stelle fluenti
  aurora: {
    id: 'aurora',
    name: '🌌 Aurora Borealis',
    description: 'Aurora con stelle fluenti (Default)',
    preview: 'linear-gradient(135deg, #030508, #0a1628, #051a20)',
    type: 'nebula',
    nebulaPreset: 'aurora',
    isDefault: true,
  },
  
  // RIBBONS - Nastri fluidi eleganti
  ribbons: {
    id: 'ribbons',
    name: '🎀 Nastri Fluidi',
    description: 'Nastri eleganti che ondeggiano',
    preview: 'linear-gradient(135deg, #050810, #0a1020, #1a0a30)',
    type: 'nebula',
    nebulaPreset: 'ribbons',
  },
  
  // GEOMETRIC - Esagoni pulsanti
  geometric: {
    id: 'geometric',
    name: '⬡ Geometrico',
    description: 'Esagoni pulsanti futuristici',
    preview: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
    type: 'nebula',
    nebulaPreset: 'geometric',
  },
  
  // CONSTELLATION - Stelle connesse
  constellation: {
    id: 'constellation',
    name: '✨ Costellazioni',
    description: 'Stelle connesse da linee magiche',
    preview: 'linear-gradient(135deg, #0a0f1a, #0c1a2a)',
    type: 'nebula',
    nebulaPreset: 'constellation',
  },
  
  // LIQUID METAL - Metallo liquido (per utenti avanzati)
  liquid: {
    id: 'liquid',
    name: '💧 Metallo Liquido',
    description: 'Effetto metallo liquido futuristico',
    preview: 'linear-gradient(135deg, #0a0f1a, #0a1a30)',
    type: 'nebula',
    nebulaPreset: 'liquid',
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
 * Default settings - Aurora come default
 */
export const defaultBackgroundSettings = {
  preset: 'aurora',
  solidColor: '#0f172a',
  gradientColors: ['#0f172a', '#1e1b4b'],
  cardTransparency: 0.6, // 60% opacità (40% trasparente)
  cardBlur: true,
};
