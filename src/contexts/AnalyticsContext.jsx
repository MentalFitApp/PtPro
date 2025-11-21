import React, { createContext, useContext } from 'react';
import { useAnalytics } from './analytics';

const AnalyticsContext = createContext();

export const AnalyticsProvider = ({ children }) => {
  const analytics = useAnalytics();

  // Inizializza tracking performance
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('./analytics').then(({ initPerformanceTracking }) => {
        initPerformanceTracking(analytics);
      });
    }
  }, [analytics]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};