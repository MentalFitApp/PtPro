// src/components/ui/OfflineIndicator.jsx
// Banner che mostra lo stato offline/online

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export default function OfflineIndicator() {
  const { isOnline, wasOffline } = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500/95 backdrop-blur-sm text-white px-4 py-3 shadow-lg"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <WifiOff size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">
              Sei offline - I dati visualizzati potrebbero non essere aggiornati
            </p>
          </div>
        </motion.div>
      )}
      
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ delay: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-500/95 backdrop-blur-sm text-white px-4 py-3 shadow-lg"
          onAnimationComplete={() => {
            setTimeout(() => {
              // Auto-nascondi dopo 3 secondi
            }, 3000);
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <Wifi size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">
              Connessione ripristinata - Sincronizzazione in corso...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
