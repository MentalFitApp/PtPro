/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sfondo premium più profondo
        'background': '#0a0e1a',
        'foreground': '#f8fafc',
        
        // Card con gradiente sottile
        'card': '#151b2e',
        'card-hover': '#1a2235',
        
        // Blu premium come colore principale
        'primary': '#3b82f6',
        'primary-dark': '#2563eb',
        'primary-light': '#60a5fa',
        
        // Accenti oro per elementi premium
        'accent': '#fbbf24',
        'accent-dark': '#f59e0b',
        
        // Testi e bordi più raffinati
        'muted': '#64748b',
        'border': '#1e293b',
        'border-light': '#334155',
      },
    },
  },
  plugins: [], // ← VUOTO – NESSUN PLUGIN NECESSARIO
}