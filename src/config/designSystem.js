// ============================================
// DESIGN SYSTEM V2 - MentalFit Platform
// Ispirato a CEOPlatformDashboard
// ============================================

export const colors = {
  // Background gradients
  bg: {
    primary: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
    secondary: 'bg-slate-900/50',
    card: 'bg-slate-800/60 backdrop-blur-sm',
    cardHover: 'hover:bg-slate-800/80',
    elevated: 'bg-slate-800/90 backdrop-blur-md',
    glass: 'bg-white/5 backdrop-blur-lg',
  },
  
  // Borders
  border: {
    default: 'border-slate-700/50',
    hover: 'hover:border-slate-600',
    focus: 'focus:border-cyan-500',
    accent: 'border-cyan-500/30',
  },
  
  // Text colors
  text: {
    primary: 'text-slate-50',
    secondary: 'text-slate-400',
    muted: 'text-slate-500',
    accent: 'text-cyan-400',
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
  card: 'shadow-xl shadow-slate-900/50',
  elevated: 'shadow-2xl shadow-slate-900/80',
  glow: 'shadow-lg shadow-cyan-500/10',
  glowHover: 'hover:shadow-xl hover:shadow-cyan-500/20',
};

export const transitions = {
  default: 'transition-all duration-300',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-500',
  transform: 'transition-transform duration-300',
};

export const borders = {
  default: 'border border-slate-700/50',
  thick: 'border-2 border-slate-700/50',
  rounded: 'rounded-xl',
  roundedFull: 'rounded-full',
  roundedLg: 'rounded-lg',
};

export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
  stagger: {
    animate: {
      transition: { staggerChildren: 0.1 },
    },
  },
};

export const typography = {
  h1: 'text-4xl font-bold text-slate-50',
  h2: 'text-3xl font-bold text-slate-50',
  h3: 'text-2xl font-bold text-slate-50',
  h4: 'text-xl font-bold text-slate-50',
  h5: 'text-lg font-semibold text-slate-50',
  body: 'text-base text-slate-300',
  bodySmall: 'text-sm text-slate-400',
  label: 'text-xs font-medium uppercase tracking-wider text-slate-500',
  stat: 'text-3xl font-bold text-slate-50',
};

// Component Classes
export const components = {
  // Cards
  card: {
    base: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${shadows.card} ${transitions.default}`,
    hover: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${shadows.card} ${transitions.default} ${colors.bg.cardHover}`,
    elevated: `${colors.bg.elevated} ${borders.default} ${borders.rounded} ${spacing.card} ${shadows.elevated}`,
  },
  
  // Buttons
  button: {
    primary: `bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg ${transitions.default} hover:from-cyan-600 hover:to-blue-600 ${shadows.glow} ${shadows.glowHover}`,
    secondary: `bg-slate-700/50 text-slate-200 font-semibold py-2.5 px-6 rounded-lg border ${colors.border.default} ${transitions.default} hover:bg-slate-700 ${colors.border.hover}`,
    ghost: `text-slate-400 font-semibold py-2 px-4 rounded-lg ${transitions.default} hover:bg-slate-800/50 hover:text-slate-200`,
    danger: `bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold py-2.5 px-6 rounded-lg ${transitions.default} hover:from-rose-600 hover:to-red-600`,
    success: `bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-2.5 px-6 rounded-lg ${transitions.default} hover:from-emerald-600 hover:to-teal-600`,
    icon: `p-2.5 rounded-lg ${colors.bg.card} ${colors.border.default} ${transitions.default} hover:bg-slate-700/70`,
  },
  
  // Inputs
  input: {
    base: `w-full bg-slate-800/60 border ${colors.border.default} rounded-lg px-4 py-2.5 ${colors.text.primary} placeholder-slate-500 ${transitions.default} ${colors.border.focus}`,
    error: `w-full bg-slate-800/60 border border-rose-500/50 rounded-lg px-4 py-2.5 ${colors.text.primary} placeholder-slate-500 ${transitions.default} focus:border-rose-500`,
  },
  
  // Badges
  badge: {
    default: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border`,
    success: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors.status.active}`,
    warning: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors.status.pending}`,
    error: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors.status.error}`,
    info: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors.status.inactive}`,
  },
  
  // Stat Cards
  statCard: {
    base: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${transitions.default}`,
    withIcon: `${colors.bg.card} ${borders.default} ${borders.rounded} ${spacing.card} ${transitions.default} group`,
  },
  
  // Sidebar
  sidebar: {
    container: `fixed top-0 left-0 h-screen w-72 ${colors.bg.elevated} ${colors.border.default} border-r overflow-y-auto`,
    item: `flex items-center gap-3 px-4 py-3 rounded-lg ${transitions.default} ${colors.text.secondary} hover:bg-slate-700/50 hover:text-slate-200`,
    itemActive: `flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border ${colors.border.accent} ${colors.text.accent}`,
  },
  
  // Table
  table: {
    container: `w-full ${colors.bg.card} ${borders.default} ${borders.rounded} overflow-hidden`,
    header: `bg-slate-800/80 border-b ${colors.border.default}`,
    row: `border-b ${colors.border.default} ${transitions.default} hover:bg-slate-800/40`,
    cell: `px-6 py-4 ${colors.text.secondary}`,
    cellHeader: `px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${colors.text.muted}`,
  },
  
  // Modals
  modal: {
    overlay: `fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4`,
    container: `${colors.bg.elevated} ${borders.default} ${borders.rounded} ${spacing.card} max-w-2xl w-full max-h-[90vh] overflow-y-auto ${shadows.elevated}`,
  },
};

// Layout utilities
export const layout = {
  container: 'max-w-7xl mx-auto',
  containerWide: 'max-w-[1920px] mx-auto',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  grid: {
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
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
  iconSizes,
};
