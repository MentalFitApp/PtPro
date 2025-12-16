/**
 * Landing Page Design Options
 * Opzioni avanzate di personalizzazione per colori, font, layout
 */

// ==================== COLORI ====================

export const COLOR_PALETTES = {
  default: {
    name: 'Default (Sky/Cyan)',
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#22d3ee',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
  },
  sunset: {
    name: 'Sunset',
    primary: '#f97316',
    secondary: '#ef4444',
    accent: '#fbbf24',
    background: '#1c1917',
    surface: '#292524',
    text: '#fafaf9',
    textMuted: '#a8a29e',
  },
  forest: {
    name: 'Forest',
    primary: '#22c55e',
    secondary: '#10b981',
    accent: '#34d399',
    background: '#052e16',
    surface: '#14532d',
    text: '#f0fdf4',
    textMuted: '#86efac',
  },
  ocean: {
    name: 'Ocean',
    primary: '#3b82f6',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    background: '#0c0a09',
    surface: '#1e1b4b',
    text: '#f5f5f4',
    textMuted: '#a5b4fc',
  },
  rose: {
    name: 'Rose',
    primary: '#ec4899',
    secondary: '#f43f5e',
    accent: '#fb7185',
    background: '#0f0305',
    surface: '#1f0311',
    text: '#fdf2f8',
    textMuted: '#f9a8d4',
  },
  gold: {
    name: 'Gold Premium',
    primary: '#eab308',
    secondary: '#ca8a04',
    accent: '#fde047',
    background: '#0a0a0a',
    surface: '#171717',
    text: '#fafafa',
    textMuted: '#a3a3a3',
  },
  minimal: {
    name: 'Minimal White',
    primary: '#18181b',
    secondary: '#3f3f46',
    accent: '#0ea5e9',
    background: '#ffffff',
    surface: '#f4f4f5',
    text: '#18181b',
    textMuted: '#71717a',
  },
  dark: {
    name: 'Pure Dark',
    primary: '#f8fafc',
    secondary: '#e2e8f0',
    accent: '#0ea5e9',
    background: '#000000',
    surface: '#09090b',
    text: '#fafafa',
    textMuted: '#71717a',
  },
};

// ==================== GRADIENTI ====================

export const GRADIENT_PRESETS = [
  { name: 'Sky', value: 'from-slate-900 via-sky-900 to-slate-900' },
  { name: 'Ocean Blue', value: 'from-blue-900 via-indigo-900 to-purple-900' },
  { name: 'Sunset', value: 'from-orange-600 via-red-600 to-pink-600' },
  { name: 'Forest', value: 'from-green-900 via-emerald-900 to-teal-900' },
  { name: 'Night', value: 'from-slate-950 via-zinc-900 to-neutral-950' },
  { name: 'Aurora', value: 'from-purple-900 via-violet-900 to-fuchsia-900' },
  { name: 'Fire', value: 'from-red-900 via-orange-800 to-yellow-900' },
  { name: 'Mint', value: 'from-teal-900 via-cyan-900 to-sky-900' },
  { name: 'Rose Gold', value: 'from-rose-900 via-pink-800 to-fuchsia-900' },
  { name: 'Midnight', value: 'from-gray-900 via-slate-800 to-zinc-900' },
  { name: 'Electric', value: 'from-violet-600 via-purple-600 to-indigo-600' },
  { name: 'Tropical', value: 'from-emerald-500 via-teal-500 to-cyan-500' },
];

// ==================== FONT ====================

export const FONT_FAMILIES = [
  { name: 'Inter (Default)', value: 'Inter, system-ui, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' },
  { name: 'Raleway', value: 'Raleway, sans-serif' },
];

// ==================== LAYOUTS ====================

export const LAYOUT_VARIANTS = {
  hero: [
    { id: 'centered', name: 'Centrato', description: 'Testo centrato con immagine di sfondo' },
    { id: 'split', name: 'Split', description: 'Testo a sinistra, immagine a destra' },
    { id: 'split-reverse', name: 'Split Inverso', description: 'Immagine a sinistra, testo a destra' },
    { id: 'video', name: 'Video Background', description: 'Video a schermo intero' },
    { id: 'minimal', name: 'Minimale', description: 'Solo testo, design pulito' },
    { id: 'gradient-animated', name: 'Gradiente Animato', description: 'Sfondo con gradiente animato' },
  ],
  features: [
    { id: 'grid', name: 'Griglia', description: '3 colonne con icone' },
    { id: 'list', name: 'Lista', description: 'Formato lista verticale' },
    { id: 'cards', name: 'Cards', description: 'Card con ombra e hover' },
    { id: 'icons-large', name: 'Icone Grandi', description: 'Icone prominenti' },
    { id: 'alternating', name: 'Alternato', description: 'Alterna sinistra/destra' },
    { id: 'bento', name: 'Bento Grid', description: 'Layout asimmetrico moderno' },
  ],
  testimonials: [
    { id: 'carousel', name: 'Carosello', description: 'Scorrimento automatico' },
    { id: 'grid', name: 'Griglia', description: 'Tutte visibili' },
    { id: 'featured', name: 'In Evidenza', description: 'Una grande + altre piccole' },
    { id: 'masonry', name: 'Masonry', description: 'Layout Pinterest-style' },
    { id: 'slider', name: 'Slider Fullwidth', description: 'Una alla volta, full width' },
  ],
  pricing: [
    { id: 'cards', name: 'Cards', description: 'Card affiancate' },
    { id: 'table', name: 'Tabella', description: 'Confronto tabellare' },
    { id: 'toggle', name: 'Toggle', description: 'Mensile/Annuale' },
    { id: 'featured', name: 'Featured', description: 'Piano centrale evidenziato' },
    { id: 'minimal', name: 'Minimale', description: 'Design semplice' },
  ],
  cta: [
    { id: 'centered', name: 'Centrato', description: 'Testo e pulsante centrati' },
    { id: 'split', name: 'Split', description: 'Testo a sinistra, CTA a destra' },
    { id: 'banner', name: 'Banner', description: 'Striscia orizzontale' },
    { id: 'floating', name: 'Floating', description: 'Card floating su sfondo' },
    { id: 'fullscreen', name: 'Fullscreen', description: 'Occupa tutto lo schermo' },
  ],
  form: [
    { id: 'standard', name: 'Standard', description: 'Form classico' },
    { id: 'split', name: 'Split', description: 'Form + immagine laterale' },
    { id: 'floating', name: 'Floating', description: 'Card sovrapposta' },
    { id: 'minimal', name: 'Minimale', description: 'Campi inline' },
    { id: 'wizard', name: 'Wizard', description: 'Multi-step' },
  ],
  gallery: [
    { id: 'grid', name: 'Griglia', description: 'Griglia uniforme' },
    { id: 'masonry', name: 'Masonry', description: 'Altezze variabili' },
    { id: 'carousel', name: 'Carosello', description: 'Scorrimento orizzontale' },
    { id: 'featured', name: 'Featured', description: 'Una grande + thumbnails' },
    { id: 'before-after', name: 'Before/After', description: 'Slider comparativo' },
  ],
  video: [
    { id: 'featured', name: 'Featured', description: 'Video prominente centrato' },
    { id: 'side', name: 'Laterale', description: 'Video + testo affiancati' },
    { id: 'background', name: 'Background', description: 'Video come sfondo' },
    { id: 'gallery', name: 'Gallery', description: 'Griglia di video' },
    { id: 'testimonial', name: 'Testimonial', description: 'Video testimonial style' },
  ],
};

// ==================== SPAZIATURE ====================

export const SPACING_OPTIONS = [
  { name: 'Compatto', value: 'py-8' },
  { name: 'Normale', value: 'py-16' },
  { name: 'Ampio', value: 'py-24' },
  { name: 'Extra Ampio', value: 'py-32' },
];

// ==================== ANIMAZIONI ====================

export const ANIMATION_OPTIONS = [
  { name: 'Nessuna', value: 'none' },
  { name: 'Fade In', value: 'fadeIn' },
  { name: 'Slide Up', value: 'slideUp' },
  { name: 'Slide In Left', value: 'slideInLeft' },
  { name: 'Slide In Right', value: 'slideInRight' },
  { name: 'Scale', value: 'scale' },
  { name: 'Bounce', value: 'bounce' },
];

// ==================== BUTTON STYLES ====================

export const BUTTON_STYLES = [
  { name: 'Gradient', value: 'gradient', class: 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white' },
  { name: 'Solid', value: 'solid', class: 'bg-sky-500 hover:bg-sky-600 text-white' },
  { name: 'Outline', value: 'outline', class: 'border-2 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white' },
  { name: 'Ghost', value: 'ghost', class: 'text-sky-500 hover:bg-sky-500/10' },
  { name: 'Pill', value: 'pill', class: 'bg-sky-500 text-white rounded-full' },
  { name: 'Glow', value: 'glow', class: 'bg-sky-500 text-white shadow-lg shadow-sky-500/50' },
];

// ==================== CARD STYLES ====================

export const CARD_STYLES = [
  { name: 'Glass', value: 'glass', class: 'bg-white/5 backdrop-blur-lg border border-white/10' },
  { name: 'Solid', value: 'solid', class: 'bg-slate-800' },
  { name: 'Bordered', value: 'bordered', class: 'border border-slate-700 bg-transparent' },
  { name: 'Elevated', value: 'elevated', class: 'bg-slate-800 shadow-xl shadow-black/20' },
  { name: 'Gradient Border', value: 'gradient-border', class: 'bg-slate-800 border border-transparent bg-clip-padding' },
];

// ==================== REDIRECT OPTIONS ====================

export const REDIRECT_ACTIONS = [
  { name: 'Nessuna', value: 'none' },
  { name: 'Mostra messaggio', value: 'message' },
  { name: 'Redirect a URL', value: 'redirect' },
  { name: 'Redirect a pagina landing', value: 'landing' },
  { name: 'Mostra popup/modal', value: 'popup' },
  { name: 'Apri WhatsApp', value: 'whatsapp' },
  { name: 'Apri Calendly', value: 'calendly' },
];

// ==================== FORM FIELD TYPES ====================

export const FORM_FIELD_TYPES = [
  { name: 'Testo', value: 'text' },
  { name: 'Email', value: 'email' },
  { name: 'Telefono', value: 'tel' },
  { name: 'Numero', value: 'number' },
  { name: 'Textarea', value: 'textarea' },
  { name: 'Select', value: 'select' },
  { name: 'Radio', value: 'radio' },
  { name: 'Checkbox', value: 'checkbox' },
  { name: 'Data', value: 'date' },
  { name: 'Ora', value: 'time' },
  { name: 'Range/Slider', value: 'range' },
  { name: 'File Upload', value: 'file' },
  { name: 'Hidden', value: 'hidden' },
];

export default {
  COLOR_PALETTES,
  GRADIENT_PRESETS,
  FONT_FAMILIES,
  LAYOUT_VARIANTS,
  SPACING_OPTIONS,
  ANIMATION_OPTIONS,
  BUTTON_STYLES,
  CARD_STYLES,
  REDIRECT_ACTIONS,
  FORM_FIELD_TYPES,
};
