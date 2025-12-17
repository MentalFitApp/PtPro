import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // FORZATO DARK MODE - Light mode non ancora implementata correttamente
  // TODO: riabilitare quando light mode sarà pronta
  const [theme] = useState('dark');

  // Applica tema al documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Toggle disabilitato per ora
  const toggleTheme = () => {
    // No-op: dark mode forzata
    console.log('Theme toggle disabled - dark mode forced');
  };

  const value = {
    theme,
    toggleTheme,
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