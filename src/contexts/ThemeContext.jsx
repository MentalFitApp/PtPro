import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Inizializza dal localStorage o preferenze sistema
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Default: dark mode
    return 'dark';
  });

  // Applica tema al documento
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Rimuovi classi precedenti
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // Applica nuovo tema
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);
    root.classList.add(theme);
    body.classList.add(theme);
    
    // Salva preferenza
    localStorage.setItem('theme', theme);
    
    // Meta tag per browser
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc');
    }
  }, [theme]);

  // Toggle tema
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Imposta tema specifico
  const setThemeMode = useCallback((mode) => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode);
    }
  }, []);

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;