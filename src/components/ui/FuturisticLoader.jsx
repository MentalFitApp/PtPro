// src/components/ui/FuturisticLoader.jsx
// Loader fluido con animazione di reveal

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Tempo minimo di visualizzazione dell'animazione (in ms)
const MIN_LOADING_TIME = 1500; // 1.5 secondi minimo
const REVEAL_DURATION = 1000;  // 1 secondo per l'apertura dei pannelli

/**
 * Loader fluido con animazione di transizione
 * @param {boolean} isLoading - Se mostrare il loader
 * @param {string} message - Messaggio opzionale
 * @param {number} minDuration - Durata minima in ms (default: 1500)
 */
export default function FuturisticLoader({ 
  isLoading = true, 
  message = '',
  minDuration = MIN_LOADING_TIME,
  onComplete
}) {
  const [phase, setPhase] = useState('loading'); // 'loading', 'revealing', 'done'
  const [isLightMode, setIsLightMode] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const startTimeRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Rileva il tema
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsLightMode(theme === 'light');
    };
    
    checkTheme();
    
    // Observer per cambiamenti del tema
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  // Quando inizia il loading, salva il timestamp
  useEffect(() => {
    if (isLoading && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startTimeRef.current = Date.now();
      setPhase('loading');
      setDataReady(false);
    }
  }, [isLoading]);

  // Quando isLoading diventa false, segna che i dati sono pronti
  useEffect(() => {
    if (!isLoading && hasStartedRef.current) {
      setDataReady(true);
    }
  }, [isLoading]);

  // Logica principale: aspetta il tempo minimo E che i dati siano pronti
  useEffect(() => {
    if (!hasStartedRef.current) return;

    const checkAndReveal = () => {
      const elapsed = Date.now() - (startTimeRef.current || Date.now());
      const remainingMinTime = Math.max(0, minDuration - elapsed);

      // Se i dati sono pronti, aspetta comunque il tempo minimo
      if (dataReady) {
        setTimeout(() => {
          setPhase('revealing');
        }, remainingMinTime);
      }
    };

    // Controlla periodicamente o quando dataReady cambia
    if (dataReady) {
      checkAndReveal();
    } else {
      // Anche se i dati non sono pronti, dopo il tempo minimo inizia comunque
      const forceRevealTimer = setTimeout(() => {
        if (phase === 'loading') {
          // Se ancora in loading dopo tempo minimo + buffer, inizia reveal
          setPhase('revealing');
        }
      }, minDuration + 500); // Buffer extra per casi lenti

      return () => clearTimeout(forceRevealTimer);
    }
  }, [dataReady, minDuration, phase]);

  // Quando revealing finisce, completa
  useEffect(() => {
    if (phase === 'revealing') {
      const timer = setTimeout(() => {
        setPhase('done');
        hasStartedRef.current = false;
        if (onComplete) onComplete();
      }, REVEAL_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  if (phase === 'done' && !isLoading) return null;

  // Colori basati sul tema
  const panelGradientTop = isLightMode 
    ? 'linear-gradient(to bottom, #3b82f6, #60a5fa, #ffffff)'
    : 'linear-gradient(to bottom, #0f172a, #1e293b, #334155)';
  
  const panelGradientBottom = isLightMode
    ? 'linear-gradient(to top, #3b82f6, #60a5fa, #ffffff)'
    : 'linear-gradient(to top, #0f172a, #1e293b, #334155)';

  const lineColor = isLightMode ? 'via-white' : 'via-blue-500';
  const textColor = isLightMode ? 'text-white' : 'text-slate-400';

  const loaderContent = (
    <AnimatePresence mode="wait">
      {(isLoading || phase !== 'done') && (
        <>
          {/* Parte superiore che scorre verso l'alto */}
          <motion.div
            className="fixed top-0 left-0 right-0 z-[9999]"
            style={{ 
              height: '50vh',
              background: panelGradientTop,
              transformOrigin: 'top'
            }}
            initial={{ y: 0 }}
            animate={{ 
              y: phase === 'revealing' ? '-100%' : 0,
            }}
            exit={{ y: '-100%' }}
            transition={{ 
              duration: 1.0, 
              ease: [0.76, 0, 0.24, 1]
            }}
          >
            {/* Linea luminosa in basso */}
            <motion.div 
              className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${lineColor} to-transparent`}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          {/* Parte inferiore che scorre verso il basso */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[9999]"
            style={{ 
              height: '50vh',
              background: panelGradientBottom,
              transformOrigin: 'bottom'
            }}
            initial={{ y: 0 }}
            animate={{ 
              y: phase === 'revealing' ? '100%' : 0,
            }}
            exit={{ y: '100%' }}
            transition={{ 
              duration: 1.0, 
              ease: [0.76, 0, 0.24, 1]
            }}
          >
            {/* Linea luminosa in alto */}
            <motion.div 
              className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${lineColor} to-transparent`}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          {/* Contenuto centrale - Logo e loader */}
          <motion.div
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: phase === 'revealing' ? 0 : 1,
              scale: phase === 'revealing' ? 0.9 : 1
            }}
            transition={{ duration: 0.4 }}
          >
            {/* Logo animato */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="relative">
                {/* Glow effect */}
                <motion.div 
                  className={`absolute inset-0 blur-xl rounded-full ${isLightMode ? 'bg-white/50' : 'bg-blue-500/30'}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Logo container */}
                <motion.div 
                  className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl ${
                    isLightMode 
                      ? 'bg-white shadow-blue-500/30' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
                  }`}
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <img 
                    src="/logo192.png" 
                    alt="Logo"
                    className="w-14 h-14 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Animated loader bar */}
            <motion.div 
              className={`w-48 h-1 rounded-full overflow-hidden ${isLightMode ? 'bg-white/30' : 'bg-slate-800'}`}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 192 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <motion.div
                className={`h-full rounded-full ${
                  isLightMode 
                    ? 'bg-gradient-to-r from-white via-blue-100 to-white' 
                    : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500'
                }`}
                style={{ backgroundSize: '200% 100%' }}
                animate={{ 
                  x: ['-100%', '100%'],
                  backgroundPosition: ['0% 0%', '100% 0%']
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>

            {/* Message */}
            {message && (
              <motion.p
                className={`mt-4 text-sm tracking-wide ${textColor}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(loaderContent, document.body);
}

/**
 * Hook per gestire il loader durante la navigazione
 */
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');

  const startTransition = (message = '') => {
    setTransitionMessage(message);
    setIsTransitioning(true);
  };

  const endTransition = () => {
    setIsTransitioning(false);
  };

  return {
    isTransitioning,
    transitionMessage,
    startTransition,
    endTransition,
    LoaderComponent: () => (
      <FuturisticLoader 
        isLoading={isTransitioning} 
        message={transitionMessage}
        onComplete={endTransition}
      />
    )
  };
}
