// ============================================
// DESIGN SYSTEM V4 - FitFlow Pro Platform
// Layout professionale con effetti glassmorphism moderni
// ============================================

export const colors = {
  // Background gradients - Enhanced
  bg: {
    primary: 'bg-gradient-to-br from-theme-bg-primary via-theme-bg-secondary to-theme-bg-primary',
    secondary: 'bg-theme-bg-primary/50',
    card: 'bg-theme-bg-secondary/60 backdrop-blur-xl',
    cardHover: 'hover:bg-theme-bg-tertiary/60',
    cardSolid: 'bg-theme-bg-secondary/95',
    elevated: 'bg-theme-bg-secondary/80 backdrop-blur-2xl',
    glass: 'bg-theme-bg-secondary/30 backdrop-blur-2xl',
    glassPremium: 'bg-gradient-to-br from-theme-bg-secondary/40 to-theme-bg-secondary/20 backdrop-blur-2xl',
    surface: 'bg-theme-bg-primary/40',
    header: 'bg-theme-bg-secondary/70 backdrop-blur-2xl',
    gradient: {
      primary: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600',
      success: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600',
      warning: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600',
      danger: 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600',
      purple: 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600',
    },
  },
  
  // Borders
  border: {
    default: 'border-theme',
    hover: 'hover:border-theme',
    focus: 'focus:border-primary',
    accent: 'border-blue-500/30',
  },
  
  // Text colors
  text: {
    primary: 'text-theme-text-primary',
    secondary: 'text-theme-text-secondary',
    muted: 'text-theme-text-tertiary',
    accent: 'text-primary',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
  },
  
  // Status colors
  status: {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  
  // Accent colors for different roles
  accent: {
    admin: {
      primary: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      gradient: 'from-rose-500 to-pink-500',
    },
    coach: {
      primary: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      gradient: 'from-cyan-500 to-blue-500',
    },
    client: {
      primary: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      gradient: 'from-emerald-500 to-teal-500',
    },
    collaboratore: {
      primary: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      gradient: 'from-purple-500 to-indigo-500',
    },
  },
};

export const spacing = {
  page: 'p-8',
  pageMobile: 'p-4',
  card: 'p-6',
  cardCompact: 'p-4',
  section: 'mb-8',
  grid: 'gap-6',
  gridCompact: 'gap-4',
};

export const shadows = {
  card: 'shadow-xl shadow-black/10 dark:shadow-black/25',
  elevated: 'shadow-2xl shadow-black/15 dark:shadow-black/40',
  glow: 'shadow-lg shadow-blue-500/15',
  glowHover: 'hover:shadow-xl hover:shadow-blue-500/25',
  glowSuccess: 'shadow-lg shadow-emerald-500/15',
  glowWarning: 'shadow-lg shadow-amber-500/15',
  glowDanger: 'shadow-lg shadow-rose-500/15',
  glass: 'shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
  inner: 'shadow-inner shadow-black/10',
  soft: 'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)]',
  ring: 'ring-1 ring-white/10 dark:ring-white/5',
};

export const transitions = {
  default: 'transition-all duration-300 ease-out',
  fast: 'transition-all duration-150 ease-out',
  slow: 'transition-all duration-500 ease-out',
  transform: 'transition-transform duration-300 ease-out',
  spring: 'transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'transition-all duration-500 cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export const borders = {
  default: 'border border-theme',
  thick: 'border-2 border-theme',
  rounded: 'rounded-2xl',
  roundedFull: 'rounded-full',
  roundedLg: 'rounded-xl',
  roundedMd: 'rounded-lg',
  glass: 'border border-white/10 dark:border-white/5',
  glow: 'border border-blue-500/30',
  accent: 'border-l-4 border-l-blue-500',
};

export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  slideIn: {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 24 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  scale: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.92 },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  scaleSpring: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  stagger: {
    animate: {
      transition: { staggerChildren: 0.08 },
    },
  },
  float: {
    animate: {
      y: [0, -8, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  pulse: {
    animate: {
      scale: [1, 1.02, 1],
      opacity: [1, 0.9, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  shimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: { duration: 3, repeat: Infinity, ease: 'linear' },
    },
  },
};

export const typography = {
  h1: 'text-4xl font-bold text-theme-text-primary',
  h2: 'text-3xl font-bold text-theme-text-primary',
  h3: 'text-2xl font-bold text-theme-text-primary',
  h4: 'text-xl font-bold text-theme-text-primary',
  h5: 'text-lg font-semibold text-theme-text-primary',
  body: 'text-base text-theme-text-primary',
  bodySmall: 'text-sm text-theme-text-secondary',
  label: 'text-xs font-medium uppercase tracking-wider text-theme-text-tertiary',
  stat: 'text-3xl font-bold text-theme-text-primary',
};

// Component Classes
export const components = {
  // Cards - Enhanced with glassmorphism
  card: {
    base: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${shadows.card} ${shadows.ring} ${transitions.default}`,
    hover: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${shadows.card} ${shadows.ring} ${transitions.default} ${colors.bg.cardHover} hover:border-blue-500/20 hover:-translate-y-0.5`,
    elevated: `${colors.bg.elevated} ${borders.default} ${borders.rounded} ${spacing.card} ${shadows.elevated} ${shadows.ring}`,
    glass: `${colors.bg.glass} ${borders.glass} ${borders.rounded} ${spacing.card} ${shadows.glass}`,
    premium: `${colors.bg.glassPremium} ${borders.glass} ${borders.rounded} ${spacing.card} ${shadows.glass} ring-1 ring-gradient-to-br ring-blue-500/10`,
    interactive: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${shadows.soft} ${transitions.smooth} cursor-pointer hover:bg-theme-bg-tertiary/60 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-lg`,
  },
  
  // Buttons - Modern with better interactions
  button: {
    primary: `bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white preserve-white font-semibold py-2.5 px-6 rounded-xl ${transitions.smooth} hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 hover:-translate-y-0.5 active:translate-y-0 ${shadows.glow} ${shadows.glowHover} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`,
    secondary: `bg-theme-bg-secondary/60 backdrop-blur-sm text-theme-text-primary font-semibold py-2.5 px-6 rounded-xl border ${colors.border.default} ${transitions.smooth} hover:bg-theme-bg-tertiary/70 hover:border-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-transparent`,
    ghost: `text-theme-text-secondary font-semibold py-2.5 px-5 rounded-xl ${transitions.smooth} hover:bg-theme-bg-tertiary/50 hover:text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20`,
    danger: `bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 text-white preserve-white font-semibold py-2.5 px-6 rounded-xl ${transitions.smooth} hover:from-rose-600 hover:via-red-600 hover:to-rose-700 hover:-translate-y-0.5 active:translate-y-0 ${shadows.glowDanger} focus:outline-none focus:ring-2 focus:ring-rose-500/40`,
    success: `bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white preserve-white font-semibold py-2.5 px-6 rounded-xl ${transitions.smooth} hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 hover:-translate-y-0.5 active:translate-y-0 ${shadows.glowSuccess} focus:outline-none focus:ring-2 focus:ring-emerald-500/40`,
    icon: `p-2.5 rounded-xl ${colors.bg.glass} border border-theme/50 ${transitions.smooth} hover:bg-theme-bg-tertiary/60 hover:border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-primary/20`,
    outline: `border-2 border-blue-500/50 text-blue-500 font-semibold py-2.5 px-6 rounded-xl ${transitions.smooth} hover:bg-blue-500/10 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`,
  },
  
  // Inputs - Refined with better focus states
  input: {
    base: `w-full bg-theme-bg-secondary/50 backdrop-blur-sm border ${colors.border.default} rounded-xl px-4 py-3 ${colors.text.primary} placeholder-theme-text-tertiary ${transitions.smooth} focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-theme-bg-secondary/70`,
    error: `w-full bg-theme-bg-secondary/50 backdrop-blur-sm border-2 border-rose-500/50 rounded-xl px-4 py-3 ${colors.text.primary} placeholder-theme-text-tertiary ${transitions.smooth} focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10`,
    success: `w-full bg-theme-bg-secondary/50 backdrop-blur-sm border-2 border-emerald-500/50 rounded-xl px-4 py-3 ${colors.text.primary} placeholder-theme-text-tertiary ${transitions.smooth} focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10`,
  },
  
  // Badges - More refined
  badge: {
    default: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm`,
    success: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colors.status.active} backdrop-blur-sm`,
    warning: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colors.status.pending} backdrop-blur-sm`,
    error: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colors.status.error} backdrop-blur-sm`,
    info: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 backdrop-blur-sm`,
    neutral: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colors.status.inactive} backdrop-blur-sm`,
    premium: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm`,
  },
  
  // Stat Cards - Enhanced
  statCard: {
    base: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${transitions.smooth} ${shadows.soft}`,
    withIcon: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${transitions.smooth} ${shadows.soft} group hover:border-blue-500/20 hover:-translate-y-0.5`,
    glass: `${colors.bg.glass} ${borders.glass} ${borders.rounded} ${spacing.card} ${shadows.glass} group`,
    gradient: `bg-gradient-to-br from-theme-bg-secondary/70 to-theme-bg-secondary/40 backdrop-blur-xl ${borders.glass} ${borders.rounded} ${spacing.card} ${shadows.soft}`,
  },
  
  // Sidebar - Enhanced
  sidebar: {
    container: `fixed top-0 left-0 h-screen w-72 ${colors.bg.elevated} ${borders.glass} border-r overflow-y-auto`,
    item: `flex items-center gap-3 px-4 py-3 rounded-xl ${transitions.smooth} ${colors.text.secondary} hover:bg-theme-bg-tertiary/50 hover:text-theme-text-primary`,
    itemActive: `flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border ${colors.border.accent} text-blue-500 shadow-sm shadow-blue-500/10`,
  },
  
  // Table - Pro Style Enhanced
  table: {
    container: `w-full bg-theme-bg-primary/30 backdrop-blur-xl border border-theme rounded-2xl overflow-hidden ${shadows.soft}`,
    header: `bg-theme-bg-secondary/60`,
    headerRow: `border-b border-theme/50`,
    row: `border-b border-theme/30 transition-all duration-200 hover:bg-theme-bg-tertiary/30`,
    rowClickable: `border-b border-theme/30 transition-all duration-200 hover:bg-theme-bg-tertiary/40 cursor-pointer hover:border-l-2 hover:border-l-blue-500/50`,
    cell: `px-4 py-4 text-sm text-theme-text-primary`,
    cellHeader: `px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-theme-text-tertiary`,
    cellCompact: `px-3 py-3 text-sm text-theme-text-primary`,
  },
  
  // Pro Cards - Multiple variants enhanced
  proCard: {
    base: `bg-theme-bg-secondary/60 backdrop-blur-xl border border-theme rounded-2xl p-5 ${shadows.soft}`,
    header: `bg-theme-bg-secondary/70 backdrop-blur-xl border border-theme rounded-2xl`,
    widget: `bg-theme-bg-secondary/50 backdrop-blur-xl border border-theme rounded-2xl p-5 hover:bg-theme-bg-tertiary/50 hover:border-blue-500/20 transition-all duration-300 hover:-translate-y-0.5`,
    stats: `bg-gradient-to-br from-theme-bg-secondary/80 to-theme-bg-secondary/50 backdrop-blur-xl border border-theme rounded-2xl p-5 ${shadows.soft}`,
    info: `bg-theme-bg-secondary/40 backdrop-blur-sm border border-theme rounded-xl p-4`,
    premium: `bg-gradient-to-br from-amber-500/5 via-theme-bg-secondary/60 to-orange-500/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-5 ${shadows.soft}`,
  },
  
  // Modals - Enhanced
  modal: {
    overlay: `fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4`,
    container: `${colors.bg.elevated} border border-theme/50 ${borders.rounded} ${spacing.card} max-w-2xl w-full max-h-[90vh] overflow-y-auto ${shadows.elevated} ring-1 ring-white/5`,
  },
  
  // Dropdown Menu
  dropdown: {
    container: `absolute right-0 top-full mt-2 min-w-[200px] bg-theme-bg-secondary/95 backdrop-blur-2xl border border-theme rounded-xl shadow-2xl overflow-hidden z-50 ring-1 ring-white/5`,
    item: `w-full flex items-center gap-3 px-4 py-3 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors`,
    itemDanger: `w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors`,
    divider: `my-1 border-t border-theme/50`,
  },
  
  // Tooltips
  tooltip: {
    container: `absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700/50`,
    arrow: `absolute w-2 h-2 bg-slate-900/95 transform rotate-45`,
  },
};

// Layout utilities - Extended
export const layout = {
  container: 'max-w-7xl mx-auto',
  containerWide: 'max-w-[1920px] mx-auto',
  containerFull: 'w-full',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-start',
  grid: {
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    cols5: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4',
    // Dashboard layout
    dashboard: 'grid grid-cols-1 lg:grid-cols-12 gap-6',
    // Card grid compatto
    compact: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    // Widget grid
    widgets: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
    // Auto fit
    autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4',
  },
  // Span utilities per dashboard grid
  span: {
    full: 'lg:col-span-12',
    half: 'lg:col-span-6',
    third: 'lg:col-span-4',
    twoThirds: 'lg:col-span-8',
    quarter: 'lg:col-span-3',
  },
  // Page padding
  page: {
    default: 'p-4 md:p-6',
    compact: 'p-3 md:p-4',
    none: 'p-0',
  },
};

// Icon sizes
export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// Pro Badge variants
export const badges = {
  success: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  warning: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30',
  error: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30',
  info: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30',
  neutral: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30',
  primary: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
};

export default {
  colors,
  spacing,
  shadows,
  transitions,
  borders,
  animations,
  typography,
  components,
  layout,
  badges,
  iconSizes,
};
