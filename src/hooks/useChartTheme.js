import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook per ottenere colori dei grafici adattati al tema
 * Usare con Chart.js per garantire leggibilità in light/dark mode
 */
export const useChartTheme = () => {
  const { isDark } = useTheme();

  const colors = useMemo(() => ({
    // Colori primari
    primary: isDark ? '#3b82f6' : '#2563eb',
    secondary: isDark ? '#fbbf24' : '#f59e0b',
    success: isDark ? '#10b981' : '#059669',
    danger: isDark ? '#ef4444' : '#dc2626',
    warning: isDark ? '#f59e0b' : '#d97706',
    info: isDark ? '#06b6d4' : '#0891b2',

    // Testo
    text: {
      primary: isDark ? '#f8fafc' : '#0f172a',
      secondary: isDark ? '#cbd5e1' : '#475569',
      tertiary: isDark ? '#94a3b8' : '#64748b',
    },

    // Background
    background: isDark ? '#0a0e1a' : '#ffffff',
    backgroundSecondary: isDark ? '#0f172a' : '#f8fafc',

    // Grid
    grid: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(71, 85, 105, 0.15)',
    
    // Border
    border: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(71, 85, 105, 0.2)',

    // Gradients (per area charts)
    gradients: {
      primary: {
        start: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)',
        end: isDark ? 'rgba(59, 130, 246, 0)' : 'rgba(37, 99, 235, 0)',
      },
      secondary: {
        start: isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.2)',
        end: isDark ? 'rgba(251, 191, 36, 0)' : 'rgba(245, 158, 11, 0)',
      },
    },
  }), [isDark]);

  // Opzioni di default per Chart.js
  const defaultOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.text.primary,
          font: {
            size: 12,
            family: 'system-ui, -apple-system, sans-serif',
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: colors.grid,
          drawBorder: true,
          borderColor: colors.border,
        },
        ticks: {
          color: colors.text.secondary,
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: colors.grid,
          drawBorder: true,
          borderColor: colors.border,
        },
        ticks: {
          color: colors.text.secondary,
          font: {
            size: 11,
          },
        },
      },
    },
  }), [colors, isDark]);

  return {
    colors,
    defaultOptions,
    isDark,
  };
};

export default useChartTheme;
