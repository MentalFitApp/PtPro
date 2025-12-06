/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tema-aware backgrounds
        'theme-bg': {
          'primary': 'rgb(var(--bg-primary-rgb) / <alpha-value>)',
          'secondary': 'rgb(var(--bg-secondary-rgb) / <alpha-value>)',
          'tertiary': 'rgb(var(--bg-tertiary-rgb) / <alpha-value>)',
        },
        // Tema-aware text colors
        'theme-text': {
          'primary': 'rgb(var(--text-primary-rgb) / <alpha-value>)',
          'secondary': 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          'tertiary': 'rgb(var(--text-tertiary-rgb) / <alpha-value>)',
        },
        // Original colors mantained for compatibility
        'background': '#0a0e1a',
        'foreground': '#f8fafc',
        'card': '#151b2e',
        'card-hover': '#1a2235',
        'primary': '#3b82f6',
        'primary-dark': '#2563eb',
        'primary-light': '#60a5fa',
        'accent': '#fbbf24',
        'accent-dark': '#f59e0b',
        'muted': '#64748b',
        'border': '#1e293b',
        'border-light': '#334155',
      },
      backgroundColor: {
        'theme-primary': 'var(--bg-primary)',
        'theme-secondary': 'var(--bg-secondary)',
        'theme-card': 'var(--card-bg)',
      },
      textColor: {
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
        'theme-tertiary': 'var(--text-tertiary)',
      },
      borderColor: {
        'theme': 'var(--border-color)',
      },
      spacing: {
        'safe': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 12px 35px rgba(0,0,0,0.45), 0 0 24px rgba(148,163,184,0.18)',
      },
    },
  },
  plugins: [],
}