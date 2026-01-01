// src/components/pwa/NetworkStatusBanner.jsx
// Banner che mostra lo stato della connessione internet

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * Banner che mostra lo stato offline/online
 * Si mostra automaticamente quando la connessione cambia
 */
export default function NetworkStatusBanner({ 
  position = 'top', // 'top' | 'bottom'
  showOnlineMessage = true,
  autoHideOnline = 3000 // ms per nascondere il messaggio "online" (0 = mai)
}) {
  const { isOnline, isOffline } = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);

  // Monitora cambi di stato
  useEffect(() => {
    if (isOffline) {
      setShowBanner(true);
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline && showOnlineMessage) {
      // Tornato online
      setShowBanner(true);
      
      // Nascondi dopo autoHideOnline ms
      if (autoHideOnline > 0) {
        const timer = setTimeout(() => {
          setShowBanner(false);
          setWasOffline(false);
        }, autoHideOnline);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, isOffline, wasOffline, showOnlineMessage, autoHideOnline]);

  // Controlla se ci sono azioni pending (per sync)
  useEffect(() => {
    const checkPendingActions = async () => {
      try {
        // Controlla localStorage per azioni offline pendenti
        const pending = localStorage.getItem('pendingOfflineActions');
        if (pending) {
          const actions = JSON.parse(pending);
          setPendingActions(actions.length);
        }
      } catch (e) {
        // Ignora errori parsing
      }
    };
    
    checkPendingActions();
    
    // Ricontrolla quando torna online
    if (isOnline && pendingActions > 0) {
      // Trigger sync
      syncPendingActions();
    }
  }, [isOnline]);

  const syncPendingActions = async () => {
    // Qui si può implementare la logica di sync
    // Per ora solo resetta il contatore
    localStorage.removeItem('pendingOfflineActions');
    setPendingActions(0);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const positionClasses = position === 'top' 
    ? 'top-0 left-0 right-0' 
    : 'bottom-16 left-0 right-0 md:bottom-0';

  return (
    <AnimatePresence>
      {showBanner && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          className={`fixed ${positionClasses} z-50 px-4 py-2 safe-area-inset`}
        >
          <div className={`
            flex items-center justify-between gap-3 px-4 py-3 rounded-xl
            backdrop-blur-lg border shadow-lg
            ${isOffline 
              ? 'bg-orange-500/90 border-orange-400/50 text-white' 
              : 'bg-emerald-500/90 border-emerald-400/50 text-white'
            }
          `}>
            <div className="flex items-center gap-3">
              {isOffline ? (
                <>
                  <WifiOff className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Sei offline</p>
                    <p className="text-xs opacity-90">
                      {pendingActions > 0 
                        ? `${pendingActions} azioni in attesa di sincronizzazione`
                        : 'Alcune funzioni potrebbero non essere disponibili'
                      }
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Wifi className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Connessione ripristinata</p>
                    {pendingActions > 0 && (
                      <p className="text-xs opacity-90">Sincronizzando {pendingActions} azioni...</p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isOffline && (
                <button
                  onClick={handleRetry}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Riprova connessione"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Indicatore compatto per lo stato della connessione
 * Da usare nell'header o in altri punti dell'UI
 */
export function NetworkStatusIndicator({ showLabel = false }) {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-xs">
      <WifiOff className="w-3.5 h-3.5" />
      {showLabel && <span>Offline</span>}
    </div>
  );
}
