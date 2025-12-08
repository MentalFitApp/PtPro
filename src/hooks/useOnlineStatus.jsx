// src/hooks/useOnlineStatus.jsx
// Hook per monitorare lo stato della connessione internet

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook che monitora lo stato online/offline dell'utente
 * Mostra notifiche toast quando la connessione cambia
 */
export function useOnlineStatus(showToasts = true) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const toast = useToast();

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (showToasts && wasOffline) {
      toast.success('Connessione ripristinata! 🌐');
    }
    setWasOffline(false);
  }, [showToasts, wasOffline, toast]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    if (showToasts) {
      toast.warning('Sei offline. Alcune funzioni potrebbero non essere disponibili.');
    }
  }, [showToasts, toast]);

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
