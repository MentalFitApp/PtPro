import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Shield, Settings } from 'lucide-react';
import { isNativePlatform } from '../utils/capacitor';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Sempre true, non modificabile
    analytics: false,
    marketing: false
  });
  // Non mostrare su app nativa
  if (isNativePlatform()) {
    return null;
  }
  useEffect(() => {
    // Controlla se l'utente ha già dato il consenso
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Mostra il banner dopo 1 secondo
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Carica preferenze salvate
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
        applyConsent(saved);
      } catch (e) {
        console.error('Error loading cookie preferences:', e);
      }
    }
  }, []);

  const applyConsent = (prefs) => {
    // Analytics (Google Analytics, Mixpanel, etc.)
    if (prefs.analytics && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }

    // Marketing (Facebook Pixel, etc.)
    if (prefs.marketing && window.fbq) {
      window.fbq('consent', 'grant');
    }

    // TODO: Aggiungi altri servizi quando implementati
  };

  const handleAcceptAll = () => {
    const newPrefs = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    savePreferences(newPrefs);
  };

  const handleRejectAll = () => {
    const newPrefs = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    savePreferences(newPrefs);
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
    setShowSettings(false);
  };

  const savePreferences = (prefs) => {
    localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    applyConsent(prefs);
    setShowBanner(false);
  };

  const cookieCategories = [
    {
      id: 'necessary',
      title: 'Cookie Necessari',
      description: 'Essenziali per il funzionamento base del sito (login, sicurezza, preferenze).',
      required: true
    },
    {
      id: 'analytics',
      title: 'Cookie Analitici',
      description: 'Ci aiutano a capire come gli utenti utilizzano il sito per migliorarlo.',
      required: false
    },
    {
      id: 'marketing',
      title: 'Cookie Marketing',
      description: 'Usati per mostrare pubblicità personalizzata e misurare l\'efficacia delle campagne.',
      required: false
    }
  ];

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-purple-500/30"
                >
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Settings size={20} />
                      Gestisci Preferenze Cookie
                    </h3>
                    
                    {cookieCategories.map((category) => (
                      <div key={category.id} className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{category.title}</h4>
                          <p className="text-sm text-slate-300">{category.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences[category.id]}
                            disabled={category.required}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              [category.id]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer ${category.required ? 'opacity-50' : ''} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600`}></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Banner */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Icon */}
                <div className="hidden md:flex w-16 h-16 bg-purple-500/20 rounded-full items-center justify-center flex-shrink-0">
                  <Cookie size={32} className="text-purple-400" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Cookie size={20} className="md:hidden" />
                    Utilizziamo i Cookie
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Utilizziamo cookie necessari per il funzionamento del sito e, con il tuo consenso, 
                    cookie analitici per migliorare la tua esperienza. 
                    Puoi modificare le tue preferenze in qualsiasi momento.{' '}
                    <a 
                      href="/privacy" 
                      target="_blank"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Leggi la Privacy Policy
                    </a>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors border border-slate-600 flex items-center justify-center gap-2"
                  >
                    <Settings size={16} />
                    {showSettings ? 'Chiudi' : 'Personalizza'}
                  </button>
                  
                  {showSettings ? (
                    <button
                      onClick={handleSaveSettings}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
                    >
                      Salva Preferenze
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleRejectAll}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                      >
                        Solo Necessari
                      </button>
                      <button
                        onClick={handleAcceptAll}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
                      >
                        <Shield size={16} />
                        Accetta Tutti
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsent;
