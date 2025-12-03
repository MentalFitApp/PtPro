import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Archive, Clock, Bell, Save, X, AlertCircle } from 'lucide-react';
import { getTenantDoc } from '../../config/tenant';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';

const ClientArchiveSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    autoArchive: {
      enabled: false,
      inactivityDays: 7
    },
    archiveActions: {
      blockAppAccess: true,
      blockedScreens: ['workouts', 'nutrition'],
      customMessage: 'Il tuo account è stato sospeso per inattività. Contatta il tuo trainer per riattivarlo.'
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsRef = getTenantDoc(db, 'settings', 'clientArchiveSettings');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data());
      }
    } catch (error) {
      console.error('Errore nel caricamento impostazioni archivio:', error);
      showToast('Errore nel caricamento delle impostazioni', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsRef = getTenantDoc(db, 'settings', 'clientArchiveSettings');
      await setDoc(settingsRef, settings);
      showToast('Impostazioni archivio salvate con successo', 'success');
      setIsOpen(false);
    } catch (error) {
      console.error('Errore nel salvataggio impostazioni archivio:', error);
      showToast('Errore nel salvataggio delle impostazioni', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const toggleScreen = (screen) => {
    const currentScreens = settings.archiveActions.blockedScreens || [];
    const newScreens = currentScreens.includes(screen)
      ? currentScreens.filter(s => s !== screen)
      : [...currentScreens, screen];
    
    updateSetting('archiveActions.blockedScreens', newScreens);
  };

  return (
    <>
      {/* Pulsante per aprire le impostazioni */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
      >
        <Settings size={18} />
        <span className="hidden sm:inline">Impostazioni Archivio</span>
      </motion.button>

      {/* Modale Impostazioni */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[9999] p-4"
            >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Archive className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Impostazioni Archivio Clienti</h2>
                    <p className="text-sm text-slate-400">Configura l'archiviazione automatica e le notifiche</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="text-slate-400" size={20} />
                </button>
              </div>

              {/* Contenuto scrollabile */}
              <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
                
                {/* Sezione 1: Archiviazione Automatica */}
                <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
                  <div className="flex items-start gap-3 mb-4">
                    <Clock className="text-cyan-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Archiviazione Automatica per Scadenza</h3>
                      <p className="text-sm text-slate-400">Archivia automaticamente clienti il cui abbonamento è scaduto da più tempo del periodo specificato</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Toggle Attiva/Disattiva */}
                    <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors">
                      <div>
                        <span className="text-sm font-medium text-slate-200 block">Attiva archiviazione automatica</span>
                        <span className="text-xs text-slate-500">Archivia clienti con abbonamento scaduto da troppo tempo</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoArchive.enabled}
                        onChange={(e) => updateSetting('autoArchive.enabled', e.target.checked)}
                        className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </label>

                    {/* Giorni di inattività */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Giorni dopo la scadenza prima dell'archiviazione
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={settings.autoArchive.inactivityDays}
                          onChange={(e) => updateSetting('autoArchive.inactivityDays', parseInt(e.target.value) || 7)}
                          disabled={!settings.autoArchive.enabled}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-lg font-semibold placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">giorni</span>
                      </div>
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-blue-200">
                          I clienti il cui abbonamento è scaduto da più di <strong className="font-semibold">{settings.autoArchive.inactivityDays} {settings.autoArchive.inactivityDays === 1 ? 'giorno' : 'giorni'}</strong> verranno archiviati automaticamente ogni notte.
                        </p>
                      </div>
                    </div>

                    {/* Scorciatoie rapide */}
                    {settings.autoArchive.enabled && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Scorciatoie rapide
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[7, 14, 30, 60].map(days => (
                            <button
                              key={days}
                              onClick={() => updateSetting('autoArchive.inactivityDays', days)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                settings.autoArchive.inactivityDays === days
                                  ? 'bg-blue-600 text-white border-2 border-blue-400'
                                  : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-700/50'
                              }`}
                            >
                              {days}gg
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sezione 2: Azioni di Archiviazione */}
                <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Azioni all'Archiviazione Automatica</h3>
                      <p className="text-sm text-slate-400">Cosa succede quando un cliente viene archiviato per inattività</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Blocco accesso completo */}
                    <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors">
                      <div>
                        <span className="text-sm font-medium text-slate-200 block">Blocca accesso completo all'app</span>
                        <span className="text-xs text-slate-500">Il cliente non potrà più accedere a nessuna sezione</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.archiveActions.blockAppAccess}
                        onChange={(e) => updateSetting('archiveActions.blockAppAccess', e.target.checked)}
                        className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0"
                      />
                    </label>

                    {/* Sezioni bloccate (solo se NON blocco completo) */}
                    {!settings.archiveActions.blockAppAccess && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                          Sezioni da bloccare:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'workouts', label: 'Allenamento' },
                            { id: 'nutrition', label: 'Alimentazione' },
                            { id: 'checks', label: 'Check' },
                            { id: 'payments', label: 'Pagamenti' },
                            { id: 'messages', label: 'Messaggi' },
                            { id: 'profile', label: 'Profilo' }
                          ].map(screen => (
                            <label
                              key={screen.id}
                              className="flex items-center gap-2 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={settings.archiveActions.blockedScreens.includes(screen.id)}
                                onChange={() => toggleScreen(screen.id)}
                                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500"
                              />
                              <span className="text-sm text-slate-300">{screen.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Messaggio personalizzato */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Messaggio mostrato al cliente archiviato
                      </label>
                      <textarea
                        value={settings.archiveActions.customMessage}
                        onChange={(e) => updateSetting('archiveActions.customMessage', e.target.value)}
                        rows={3}
                        placeholder="Inserisci il messaggio che il cliente vedrà quando tenta di accedere..."
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-amber-200">
                    <p className="font-medium mb-2">Come funziona</p>
                    <ul className="text-amber-300/80 space-y-1 list-disc list-inside text-xs">
                      <li>Il sistema controlla ogni notte le scadenze degli abbonamenti</li>
                      <li>Se l'abbonamento è scaduto da più di {settings.autoArchive.inactivityDays} {settings.autoArchive.inactivityDays === 1 ? 'giorno' : 'giorni'}, il cliente viene archiviato</li>
                      <li>Le azioni configurate (blocco app/sezioni) vengono applicate automaticamente</li>
                      <li>Puoi sempre ripristinare manualmente un cliente archiviato dalla lista clienti</li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Footer con pulsanti */}
              <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors border border-slate-600"
                >
                  Annulla
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Salva Impostazioni
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
};

export default ClientArchiveSettings;
