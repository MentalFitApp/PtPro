import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Video Splash Screen Component
 * 
 * Mostra un video di intro all'avvio dell'app PWA.
 * Il video può essere hostato su R2 o nella cartella public/videos.
 * 
 * Props:
 * - videoUrl: URL del video (default: /videos/splash.mp4)
 * - onComplete: callback quando il video finisce o viene saltato
 * - showOnce: se true, mostra il video solo la prima volta (usa localStorage)
 * - maxDuration: durata massima in secondi prima di chiudere automaticamente
 * - allowSkip: se true, permette di saltare toccando lo schermo
 */
const VideoSplash = ({ 
  videoUrl = '/videos/splash.mp4',
  onComplete,
  showOnce = true,
  maxDuration = 10,
  allowSkip = true 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);

  // Controlla se deve mostrare il video
  useEffect(() => {
    if (showOnce) {
      const hasSeenSplash = localStorage.getItem('hasSeenVideoSplash');
      if (hasSeenSplash) {
        handleComplete();
        return;
      }
    }

    // Timeout di sicurezza
    timeoutRef.current = setTimeout(() => {
      handleComplete();
    }, maxDuration * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showOnce, maxDuration]);

  const handleComplete = () => {
    if (showOnce) {
      localStorage.setItem('hasSeenVideoSplash', 'true');
    }
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleVideoEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    handleComplete();
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
    // Avvia il video
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn('Autoplay bloccato:', err);
        // Se autoplay è bloccato, chiudi lo splash
        handleComplete();
      });
    }
  };

  const handleVideoError = () => {
    console.error('Errore caricamento video splash');
    setHasError(true);
    handleComplete();
  };

  const handleSkip = () => {
    if (allowSkip) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      handleComplete();
    }
  };

  if (!isVisible || hasError) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center overflow-hidden"
          onClick={handleSkip}
        >
          {/* Background gradient che riempie tutto lo schermo */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
          
          {/* Video container centrato */}
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              muted
              playsInline
              preload="auto"
              onLoadedData={handleVideoLoaded}
              onEnded={handleVideoEnd}
              onError={handleVideoError}
            />
            
            {/* Sfumatura vignette intorno al video */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top fade */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-900 to-transparent" />
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
              {/* Left fade */}
              <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-slate-900 to-transparent" />
              {/* Right fade */}
              <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-slate-900 to-transparent" />
              {/* Corner vignettes for smoother blend */}
              <div className="absolute inset-0 bg-radial-gradient" style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(15, 23, 42, 0.7) 100%)'
              }} />
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
          )}

          {/* Skip hint */}
          {allowSkip && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
            >
              <p className="text-white/50 text-sm">Tocca per saltare</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoSplash;
