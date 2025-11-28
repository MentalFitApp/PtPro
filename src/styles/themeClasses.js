/**
 * Theme-aware Tailwind classes
 * Usare queste classi per elementi che devono cambiare con il tema
 */

export const themeClasses = {
  // Backgrounds
  bg: {
    primary: 'bg-slate-50 dark:bg-slate-900',
    secondary: 'bg-white dark:bg-slate-800',
    tertiary: 'bg-slate-100 dark:bg-slate-800/50',
    card: 'bg-white dark:bg-slate-800/50',
    cardHover: 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
    input: 'bg-white dark:bg-slate-800/50',
    sidebar: 'bg-white dark:bg-slate-900',
  },

  // Text colors
  text: {
    primary: 'text-slate-900 dark:text-slate-100',
    secondary: 'text-slate-600 dark:text-slate-400',
    tertiary: 'text-slate-500 dark:text-slate-500',
    muted: 'text-slate-400 dark:text-slate-600',
    inverse: 'text-slate-100 dark:text-slate-900',
  },

  // Borders
  border: {
    default: 'border-slate-200 dark:border-slate-700',
    light: 'border-slate-100 dark:border-slate-800',
    focus: 'focus:border-blue-500 dark:focus:border-blue-400',
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm dark:shadow-slate-950/50',
    md: 'shadow-md dark:shadow-slate-950/50',
    lg: 'shadow-lg dark:shadow-slate-950/50',
  },

  // Rings (focus states)
  ring: {
    focus: 'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
  },

  // Dividers
  divide: {
    default: 'divide-slate-200 dark:divide-slate-700',
  },

  // Hover states
  hover: {
    bg: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    text: 'hover:text-slate-900 dark:hover:text-slate-100',
  },

  // Combined classes for common elements
  card: 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-950/50',
  input: 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white preserve-white',
    secondary: 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
  },
  sidebar: 'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
  modal: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-slate-950/50',
};

// Helper function to combine theme classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export default themeClasses;
