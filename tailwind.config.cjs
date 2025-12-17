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
        // ========================================
        // NEBULA MINIMAL 2.0 - Theme System
        // ========================================
        
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
        
        // ========================================
        // NEBULA 2.0 COLOR PALETTE
        // ========================================
        
        // Background - Warmer dark tones
        'background': '#0a0f1a',
        'foreground': '#f8fafc',
        
        // Cards - Subtle elevation
        'card': '#111827',
        'card-hover': '#1f2937',
        
        // Primary - Violet/Purple (new!)
        'primary': '#8b5cf6',
        'primary-dark': '#7c3aed',
        'primary-light': '#a78bfa',
        'primary-glow': '#c4b5fd',
        
        // Accent - Fuchsia/Pink (new!)
        'accent': '#e879f9',
        'accent-dark': '#d946ef',
        'accent-light': '#f0abfc',
        
        // Secondary accent - Cyan (interactive elements)
        'interactive': '#22d3ee',
        'interactive-dark': '#06b6d4',
        'interactive-light': '#67e8f9',
        
        // Success - Emerald
        'success': '#34d399',
        'success-dark': '#10b981',
        'success-light': '#6ee7b7',
        
        // Warning - Amber
        'warning': '#fbbf24',
        'warning-dark': '#f59e0b',
        
        // Danger - Rose
        'danger': '#fb7185',
        'danger-dark': '#f43f5e',
        
        // Muted/Border
        'muted': '#94a3b8',
        'border': '#1e293b',
        'border-light': '#334155',
        'surface': '#0f172a',
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
        // Nebula 2.0 shadows
        'glow': '0 0 20px rgba(139, 92, 246, 0.15), 0 0 40px rgba(139, 92, 246, 0.05)',
        'glow-sm': '0 0 10px rgba(139, 92, 246, 0.1)',
        'glow-lg': '0 0 30px rgba(139, 92, 246, 0.2), 0 0 60px rgba(139, 92, 246, 0.1)',
        'glow-fuchsia': '0 0 20px rgba(232, 121, 249, 0.15), 0 0 40px rgba(232, 121, 249, 0.05)',
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.15), 0 0 40px rgba(34, 211, 238, 0.05)',
        'glow-emerald': '0 0 20px rgba(52, 211, 153, 0.15), 0 0 40px rgba(52, 211, 153, 0.05)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)',
        'elevated': '0 20px 50px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}