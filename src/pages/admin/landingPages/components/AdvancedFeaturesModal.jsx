// src/pages/admin/landingPages/components/AdvancedFeaturesModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Clock, Zap, TrendingUp, Target, Copy, Sparkles, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import { optimizeSEO, generateABVariant } from '../../../../services/openai';

export default function AdvancedFeaturesModal({ isOpen, onClose, page, onUpdate }) {
  const [activeTab, setActiveTab] = useState('timer');
  const [loading, setLoading] = useState(false);

  // Timer Settings
  const [timerEnabled, setTimerEnabled] = useState(page.timerEnabled || false);
  const [timerType, setTimerType] = useState(page.timerType || 'countdown');
  const [timerDuration, setTimerDuration] = useState(page.timerDuration || 3600); // secondi
  const [timerEndDate, setTimerEndDate] = useState(page.timerEndDate || '');
  const [timerUnlockSection, setTimerUnlockSection] = useState(page.timerUnlockSection || '');
  const [timerMessage, setTimerMessage] = useState(page.timerMessage || 'Contenuto disponibile tra: ');

  // A/B Testing
  const [abTestEnabled, setAbTestEnabled] = useState(page.abTestEnabled || false);
  const [abTestSection, setAbTestSection] = useState('');
  const [abVariants, setAbVariants] = useState(page.abVariants || []);
  const [generatingVariant, setGeneratingVariant] = useState(false);

  // SEO Optimizer
  const [seoSuggestions, setSeoSuggestions] = useState(null);
  const [optimizingSEO, setOptimizingSEO] = useState(false);

  // Exit Intent
  const [exitIntentEnabled, setExitIntentEnabled] = useState(page.exitIntentEnabled || false);
  const [exitIntentTitle, setExitIntentTitle] = useState(page.exitIntentTitle || 'Aspetta! Non andare via!');
  const [exitIntentMessage, setExitIntentMessage] = useState(page.exitIntentMessage || 'Ricevi uno sconto esclusivo del 20%');
  const [exitIntentCTA, setExitIntentCTA] = useState(page.exitIntentCTA || 'Richiedi Sconto');

  // Progressive Disclosure
  const [progressiveEnabled, setProgressiveEnabled] = useState(page.progressiveEnabled || false);
  const [progressiveSteps, setProgressiveSteps] = useState(page.progressiveSteps || []);

  // Analytics Events
  const [trackingEnabled, setTrackingEnabled] = useState(page.trackingEnabled || false);
  const [trackingEvents, setTrackingEvents] = useState(page.trackingEvents || {
    pageView: true,
    scrollDepth: true,
    ctaClicks: true,
    formSubmit: true,
    videoPlay: true
  });

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdate({
      // Timer
      timerEnabled,
      timerType,
      timerDuration,
      timerEndDate,
      timerUnlockSection,
      timerMessage,
      // A/B Testing
      abTestEnabled,
      abVariants,
      // Exit Intent
      exitIntentEnabled,
      exitIntentTitle,
      exitIntentMessage,
      exitIntentCTA,
      // Progressive Disclosure
      progressiveEnabled,
      progressiveSteps,
      // Analytics
      trackingEnabled,
      trackingEvents
    });
    onClose();
  };

  const handleOptimizeSEO = async () => {
    setOptimizingSEO(true);
    try {
      const suggestions = await optimizeSEO(page);
      setSeoSuggestions(suggestions);
      
      // Auto-applica se l'utente conferma
      if (confirm(`Applicare questi suggerimenti SEO?\n\nTitle: ${suggestions.seoTitle}\n\nDescription: ${suggestions.seoDescription}`)) {
        onUpdate({
          seoTitle: suggestions.seoTitle,
          seoDescription: suggestions.seoDescription
        });
      }
    } catch (error) {
      alert('Errore ottimizzazione SEO: ' + error.message);
    } finally {
      setOptimizingSEO(false);
    }
  };

  const handleGenerateABVariant = async () => {
    if (!abTestSection) {
      alert('Seleziona una sezione da testare');
      return;
    }

    setGeneratingVariant(true);
    try {
      const section = page.sections.find(s => s.id === abTestSection);
      const variant = await generateABVariant(section, 'headline');
      
      setAbVariants([...abVariants, {
        id: `variant-${Date.now()}`,
        sectionId: abTestSection,
        originalSection: section,
        variantSection: variant,
        trafficSplit: 50,
        conversionRate: 0,
        views: 0,
        conversions: 0
      }]);
      
      alert('Variante A/B generata con successo!');
    } catch (error) {
      alert('Errore generazione variante: ' + error.message);
    } finally {
      setGeneratingVariant(false);
    }
  };

  const tabs = [
    { id: 'timer', label: 'Timer', icon: Clock },
    { id: 'ab-test', label: 'A/B Testing', icon: Target },
    { id: 'seo', label: 'SEO Optimizer', icon: TrendingUp },
    { id: 'exit-intent', label: 'Exit Intent', icon: Zap },
    { id: 'progressive', label: 'Progressive', icon: CheckCircle },
    { id: 'analytics', label: 'Analytics', icon: Sparkles }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-purple-400" />
              Funzionalità Avanzate
            </h2>
            <p className="text-slate-400 text-sm mt-1">Timer, A/B testing, SEO e altro</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-slate-900/50 border-r border-slate-700 p-4 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Timer Tab */}
            {activeTab === 'timer' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Timer className="text-blue-400" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Countdown Timer</h3>
                    <p className="text-slate-400 text-sm">Sblocca contenuti dopo un timer</p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white font-medium">Abilita Timer</span>
                </label>

                {timerEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tipo Timer
                      </label>
                      <select
                        value={timerType}
                        onChange={(e) => setTimerType(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="countdown">Countdown (durata fissa)</option>
                        <option value="deadline">Deadline (data specifica)</option>
                        <option value="evergreen">Evergreen (per utente)</option>
                      </select>
                    </div>

                    {timerType === 'countdown' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Durata (secondi)
                        </label>
                        <input
                          type="number"
                          value={timerDuration}
                          onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          placeholder="3600"
                        />
                        <p className="text-slate-500 text-xs mt-1">
                          {Math.floor(timerDuration / 3600)}h {Math.floor((timerDuration % 3600) / 60)}m {timerDuration % 60}s
                        </p>
                      </div>
                    )}

                    {timerType === 'deadline' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Data/Ora Fine
                        </label>
                        <input
                          type="datetime-local"
                          value={timerEndDate}
                          onChange={(e) => setTimerEndDate(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Sezione da Sbloccare
                      </label>
                      <select
                        value={timerUnlockSection}
                        onChange={(e) => setTimerUnlockSection(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="">Nessuna (solo mostra timer)</option>
                        {page.sections?.map((section, idx) => (
                          <option key={section.id} value={section.id}>
                            Sezione {idx + 1}: {section.type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Messaggio Timer
                      </label>
                      <input
                        type="text"
                        value={timerMessage}
                        onChange={(e) => setTimerMessage(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        placeholder="Contenuto disponibile tra: "
                      />
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-blue-400 mt-0.5" size={20} />
                        <div className="text-sm text-blue-300">
                          <strong>Come funziona:</strong> Il timer verrà mostrato all'inizio della pagina. 
                          Quando scade, la sezione selezionata diventa visibile con un'animazione.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* A/B Testing Tab */}
            {activeTab === 'ab-test' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="text-green-400" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-white">A/B Testing</h3>
                    <p className="text-slate-400 text-sm">Testa varianti per ottimizzare conversioni</p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={abTestEnabled}
                    onChange={(e) => setAbTestEnabled(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white font-medium">Abilita A/B Testing</span>
                </label>

                {abTestEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Seleziona Sezione da Testare
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={abTestSection}
                          onChange={(e) => setAbTestSection(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        >
                          <option value="">Scegli sezione...</option>
                          {page.sections?.map((section, idx) => (
                            <option key={section.id} value={section.id}>
                              Sezione {idx + 1}: {section.type}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleGenerateABVariant}
                          disabled={generatingVariant || !abTestSection}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {generatingVariant ? (
                            <>
                              <Sparkles size={18} className="animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Zap size={18} />
                              Genera con AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Lista Varianti */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-300">Varianti Attive</h4>
                      {abVariants.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          Nessuna variante creata. Genera una variante con AI!
                        </div>
                      ) : (
                        abVariants.map((variant, idx) => (
                          <div key={variant.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="text-white font-medium">Variante {idx + 1}</h5>
                                <p className="text-slate-400 text-sm">
                                  Sezione: {page.sections.find(s => s.id === variant.sectionId)?.type}
                                </p>
                              </div>
                              <button
                                onClick={() => setAbVariants(abVariants.filter(v => v.id !== variant.id))}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={18} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="bg-slate-800 rounded p-3">
                                <div className="text-xs text-slate-400 mb-1">Traffico</div>
                                <div className="text-2xl font-bold text-white">{variant.trafficSplit}%</div>
                              </div>
                              <div className="bg-slate-800 rounded p-3">
                                <div className="text-xs text-slate-400 mb-1">Conv. Rate</div>
                                <div className="text-2xl font-bold text-green-400">
                                  {variant.views > 0 ? ((variant.conversions / variant.views) * 100).toFixed(1) : 0}%
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={variant.trafficSplit}
                                onChange={(e) => {
                                  const newVariants = [...abVariants];
                                  newVariants[idx].trafficSplit = parseInt(e.target.value);
                                  setAbVariants(newVariants);
                                }}
                                className="flex-1"
                              />
                              <span className="text-white text-sm">{variant.trafficSplit}%</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* SEO Optimizer Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="text-yellow-400" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-white">SEO Optimizer</h3>
                    <p className="text-slate-400 text-sm">Ottimizza title e description con AI</p>
                  </div>
                </div>

                <button
                  onClick={handleOptimizeSEO}
                  disabled={optimizingSEO}
                  className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {optimizingSEO ? (
                    <>
                      <Sparkles size={20} className="animate-spin" />
                      Analizzando...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Ottimizza con AI
                    </>
                  )}
                </button>

                {seoSuggestions && (
                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <h4 className="text-green-400 font-medium mb-2">✓ Suggerimenti Generati</h4>
                      
                      <div className="mb-4">
                        <label className="block text-xs text-slate-400 mb-1">SEO Title</label>
                        <div className="bg-slate-900 rounded p-3 text-white text-sm">
                          {seoSuggestions.seoTitle}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs text-slate-400 mb-1">SEO Description</label>
                        <div className="bg-slate-900 rounded p-3 text-white text-sm">
                          {seoSuggestions.seoDescription}
                        </div>
                      </div>

                      {seoSuggestions.suggestions && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-2">Altri Suggerimenti</label>
                          <ul className="space-y-1 text-sm text-slate-300">
                            {seoSuggestions.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-400">•</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exit Intent Tab */}
            {activeTab === 'exit-intent' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="text-orange-400" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Exit Intent Popup</h3>
                    <p className="text-slate-400 text-sm">Cattura visitatori prima che escano</p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exitIntentEnabled}
                    onChange={(e) => setExitIntentEnabled(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white font-medium">Abilita Exit Intent</span>
                </label>

                {exitIntentEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Titolo Popup</label>
                      <input
                        type="text"
                        value={exitIntentTitle}
                        onChange={(e) => setExitIntentTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Messaggio</label>
                      <textarea
                        value={exitIntentMessage}
                        onChange={(e) => setExitIntentMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Testo CTA</label>
                      <input
                        type="text"
                        value={exitIntentCTA}
                        onChange={(e) => setExitIntentCTA(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    {/* Preview */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <h4 className="text-xs text-slate-400 mb-3">Preview</h4>
                      <div className="bg-white rounded-lg p-6 text-center">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{exitIntentTitle}</h3>
                        <p className="text-slate-600 mb-4">{exitIntentMessage}</p>
                        <button className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold">
                          {exitIntentCTA}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Progressive Disclosure Tab */}
            {activeTab === 'progressive' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="text-purple-400" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Progressive Disclosure</h3>
                    <p className="text-slate-400 text-sm">Mostra sezioni gradualmente allo scroll</p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={progressiveEnabled}
                    onChange={(e) => setProgressiveEnabled(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white font-medium">Abilita Progressive Disclosure</span>
                </label>

                {progressiveEnabled && (
                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <p className="text-slate-300 text-sm">
                      Le sezioni appariranno con animazione quando l'utente scrolla. 
                      Migliora l'engagement e rende la pagina più dinamica.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="text-pink-400" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Analytics Tracking</h3>
                    <p className="text-slate-400 text-sm">Traccia eventi e comportamenti utenti</p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trackingEnabled}
                    onChange={(e) => setTrackingEnabled(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white font-medium">Abilita Analytics</span>
                </label>

                {trackingEnabled && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-300">Eventi da Tracciare</h4>
                    
                    {Object.entries(trackingEvents).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setTrackingEvents({ ...trackingEvents, [key]: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Salva Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
}
