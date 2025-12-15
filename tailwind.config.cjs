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
        // Original colors mantained for compatibility - Modern Blue Refresh 2024
        'background': '#020617',
        'foreground': '#f0f9ff',
        'card': '#0c1929',
        'card-hover': '#132236',
        'primary': '#0ea5e9',
        'primary-dark': '#0284c7',
        'primary-light': '#38bdf8',
        'primary-glow': '#7dd3fc',
        'accent': '#22d3ee',
        'accent-dark': '#06b6d4',
        'accent-light': '#67e8f9',
        'muted': '#7dd3fc',
        'border': '#0c4a6e',
        'border-light': '#0369a1',
        'surface': '#082f49',
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