// src/hooks/useOnlineStatus.jsx
// Hook per monitorare lo stato della connessione internet

import { useState, useEffect, useCallback, useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

/**
 * Hook che monitora lo stato online/offline dell'utente
 * Mostra notifiche toast quando la connessione cambia (se disponibile)
 */
export function useOnlineStatus({ showToast = false } = {}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  
  // Usa useContext direttamente per evitare errori se fuori dal provider
  const toastContext = useContext(ToastContext);
  const toast = toastContext || null;

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (showToast && wasOffline && toast) {
      toast.success('Connessione ripristinata! 🌐');
    }
    setWasOffline(false);
  }, [showToast, wasOffline, toast]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    if (showToast && toast) {
      toast.warning('Sei offline. Alcune funzioni potrebbero non essere disponibili.');
    }
  }, [showToast, toast]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline
  };
}

/**
 * Componente wrapper che mostra un banner quando offline
 */
export function OfflineBanner({ children }) {
  const { isOffline } = useOnlineStatus(false);

  if (!isOffline) return children;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-amber-500 text-black text-center py-2 text-sm font-medium z-[100]">
        ⚠️ Sei offline - Alcune funzioni potrebbero non funzionare
      </div>
      <div className="pt-10">
        {children}
      </div>
    </>
  );
}

export default useOnlineStatus;
