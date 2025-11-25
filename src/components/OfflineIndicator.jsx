import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Nascondi dopo 3 secondi
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Persistent offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 backdrop-blur-sm border-b border-yellow-400"
          >
            <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-slate-900">
              <WifiOff size={18} />
              <span className="text-sm font-medium">
                Nessuna connessione internet. Alcune funzionalità potrebbero non essere disponibili.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online notification toast */}
      <AnimatePresence>
        {showNotification && isOnline && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-20 right-4 z-50 bg-green-500/90 backdrop-blur-sm border border-green-400 rounded-lg shadow-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <Wifi size={20} className="text-white" />
              <span className="text-white font-medium">Connessione ripristinata!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OfflineIndicator;
