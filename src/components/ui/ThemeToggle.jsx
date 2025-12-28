import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  const handleToggle = () => {
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg hover:bg-theme-bg-tertiary/60 transition-all duration-200 text-theme-text-secondary hover:text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      title={`Passa al tema ${isDark ? 'chiaro' : 'scuro'}`}
      aria-label={`Passa al tema ${isDark ? 'chiaro' : 'scuro'}`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </button>
  );
}