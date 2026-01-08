// src/components/pwa/PWAInstallPrompt.jsx
// Prompt professionale per installazione PWA

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isNativePlatform } from '../../utils/capacitor';

/**
 * Prompt per installazione PWA con supporto iOS e Android
 */
export default function PWAInstallPrompt({ 
  showOnce = true, // Mostra solo una volta
  delay = 3000, // Delay prima di mostrare (ms)
  position = 'bottom' // 'bottom' | 'top' | 'modal'
}) {
  // Non mostrare su app nativa
  const isNative = isNativePlatform();
  
  console.log('[PWAInstallPrompt] Platform check:', {
    isNative,
    userAgent: navigator.userAgent,
    capacitorExists: typeof window.Capacitor !== 'undefined',
    platform: window.Capacitor?.getPlatform?.()
  });
  
  if (isNative) {
    console.log('[PWAInstallPrompt] Hiding on native platform');
    return null;
  }

  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Controlla se già installata
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    setIsPWA(isStandalone);
    
    if (isStandalone) return;

    // Controlla se già dismissato
    if (showOnce) {
      const wasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (wasDismissed) {
        setDismissed(true);
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Cattura evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostra prompt dopo delay
      setTimeout(() => setShow(true), delay);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Per iOS mostra comunque il prompt dopo delay
    if (isIOSDevice) {
      setTimeout(() => setShow(true), delay);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [delay, showOnce]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    handleDismiss();
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    
    if (showOnce) {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    }
  };

  // Non mostrare se già PWA o dismissato
  if (isPWA || dismissed || !show) return null;

  // Contenuto iOS (istruzioni manuali)
  const IOSContent = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
          <Smartphone className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-lg">Installa l'App</h3>
          <p className="text-slate-400 text-sm mt-1">
            Aggiungi alla schermata Home per un'esperienza migliore
          </p>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
            1
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span>Tocca</span>
            <div className="p-1.5 bg-slate-700 rounded">
              <Share className="w-4 h-4 text-blue-400" />
            </div>
            <span>in basso</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
            2
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span>Seleziona</span>
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-sm">
              <Plus className="w-4 h-4" />
              <span>Aggiungi alla Home</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
            3
          </div>
          <span className="text-slate-300">Tocca <span className="text-blue-400 font-medium">Aggiungi</span></span>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="w-full py-2.5 text-slate-400 hover:text-white transition-colors text-sm"
      >
        Ho capito
      </button>
    </div>
  );

  // Contenuto Android/Chrome
  const AndroidContent = () => (
    <div className="flex items-center gap-4">
      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex-shrink-0">
        <Download className="w-6 h-6 text-white" />
      </div>
      
      <div className="flex-grow min-w-0">
        <h3 className="font-semibold text-white">Installa l'App</h3>
        <p className="text-slate-400 text-sm truncate">
          Accesso rapido dalla schermata Home
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInstall}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors"
        >
          Installa
        </motion.button>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </div>
  );

  // Position classes
  const positionClasses = {
    bottom: 'fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96',
    top: 'fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-96',
    modal: 'fixed inset-0 flex items-center justify-center p-4'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
        className={`${positionClasses[position]} z-50`}
      >
        {position === 'modal' && (
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleDismiss}
          />
        )}
        
        <div className={`
          bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 
          rounded-2xl shadow-2xl p-4
          ${position === 'modal' ? 'relative max-w-md w-full' : ''}
        `}>
          {isIOS ? <IOSContent /> : <AndroidContent />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook per controllare lo stato PWA
 */
export function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Check se già installata
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone;
    setIsInstalled(isStandalone);

    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');

    // Check installability
    const handleInstallable = () => setIsInstallable(true);
    window.addEventListener('beforeinstallprompt', handleInstallable);

    // iOS è sempre "installabile" manualmente
    if (isIOS && !isStandalone) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallable);
    };
  }, []);

  return { isInstalled, isInstallable, platform };
}
