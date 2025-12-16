import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Wand2, 
  AlertCircle, 
  Check,
  Zap,
  Target,
  Users,
  ChevronRight,
  Loader2,
  Settings,
  Key,
} from 'lucide-react';
import { generateLandingPage, AI_PRESETS } from '../../services/aiLandingGenerator';

/**
 * AIGeneratorModal - Modal per generare landing pages con AI
 */
export default function AIGeneratorModal({ isOpen, onClose, onGenerated, tenantId }) {
  const [step, setStep] = useState(1); // 1: Preset/Custom, 2: Details, 3: Generating, 4: Done
  const [mode, setMode] = useState('preset'); // 'preset' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customInput, setCustomInput] = useState({
    businessInfo: '',
    goal: '',
    target: '',
  });
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    const input = mode === 'preset' 
      ? AI_PRESETS[selectedPreset]
      : customInput;

    if (!input.businessInfo || !input.goal || !input.target) {
      setError('Compila tutti i campi');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStep(3);

    try {
      const generated = await generateLandingPage({
        ...input,
        apiKey,
      });

      setResult(generated);
      setStep(4);
    } catch (err) {
      console.error('Errore generazione:', err);
      setError(err.message || 'Errore durante la generazione');
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
      setShowApiKeyInput(false);
    }
  };

  const handleUseGenerated = () => {
    if (result) {
      onGenerated(result);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Genera con AI</h2>
                <p className="text-sm text-slate-400">Crea landing page in pochi secondi</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* API Key Modal */}
          {showApiKeyInput && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-400 mb-2">API Key OpenAI Richiesta</h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Per usare il generatore AI, inserisci la tua API key OpenAI. 
                    La chiave verrà salvata localmente nel tuo browser.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                    >
                      Salva
                    </button>
                  </div>
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-amber-400 hover:underline"
                  >
                    Ottieni una API key →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Step 1: Choose Mode */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setMode('preset'); setStep(2); }}
                  className="p-6 bg-slate-700/50 hover:bg-slate-700 rounded-xl border-2 border-transparent hover:border-purple-500 transition-all text-left group"
                >
                  <Zap className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-white mb-1">Template Preimpostati</h3>
                  <p className="text-sm text-slate-400">
                    Scegli un preset ottimizzato per il tuo tipo di business
                  </p>
                </button>
                
                <button
                  onClick={() => { setMode('custom'); setStep(2); }}
                  className="p-6 bg-slate-700/50 hover:bg-slate-700 rounded-xl border-2 border-transparent hover:border-cyan-500 transition-all text-left group"
                >
                  <Wand2 className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-white mb-1">Personalizzato</h3>
                  <p className="text-sm text-slate-400">
                    Descrivi il tuo business e lascia che l'AI crei per te
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && mode === 'preset' && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                ← Indietro
              </button>
              
              <h3 className="font-semibold text-white">Scegli il Template</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(AI_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPreset(key)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPreset === key
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{preset.icon}</span>
                    <h4 className="font-medium text-white">{preset.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{preset.target}</p>
                  </button>
                ))}
              </div>

              {selectedPreset && (
                <div className="p-4 bg-slate-700/50 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300">{AI_PRESETS[selectedPreset].goal}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">{AI_PRESETS[selectedPreset].target}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!selectedPreset}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Genera Landing Page
              </button>
            </div>
          )}

          {step === 2 && mode === 'custom' && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                ← Indietro
              </button>
              
              <h3 className="font-semibold text-white">Descrivi il tuo Business</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Il tuo Business
                  </label>
                  <textarea
                    value={customInput.businessInfo}
                    onChange={(e) => setCustomInput({ ...customInput, businessInfo: e.target.value })}
                    placeholder="Es: Personal trainer specializzato in perdita peso per donne over 40"
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Obiettivo della Landing
                  </label>
                  <textarea
                    value={customInput.goal}
                    onChange={(e) => setCustomInput({ ...customInput, goal: e.target.value })}
                    placeholder="Es: Acquisire lead interessati al programma di 12 settimane"
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Target Audience
                  </label>
                  <textarea
                    value={customInput.target}
                    onChange={(e) => setCustomInput({ ...customInput, target: e.target.value })}
                    placeholder="Es: Donne 40-55 anni, professioniste, poco tempo per allenarsi"
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!customInput.businessInfo || !customInput.goal || !customInput.target}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Genera Landing Page
              </button>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 3 && (
            <div className="py-12 text-center">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                <Loader2 className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-white mt-6 mb-2">
                Generazione in corso...
              </h3>
              <p className="text-slate-400">
                L'AI sta creando la tua landing page personalizzata
              </p>
              <div className="mt-6 space-y-2 text-sm text-slate-500">
                <p className="animate-pulse">✨ Analizzando il target...</p>
                <p className="animate-pulse delay-100">📝 Scrivendo copy persuasivo...</p>
                <p className="animate-pulse delay-200">🎨 Ottimizzando la struttura...</p>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && result && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Landing Page Generata!
                </h3>
                <p className="text-slate-400">
                  {result.blocks?.length || 0} blocchi creati con contenuti ottimizzati
                </p>
              </div>

              {/* Preview dei blocchi generati */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.blocks?.map((block, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-lg">{getBlockIcon(block.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white capitalize">{block.type}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {block.settings?.title || 'Contenuto generato'}
                      </p>
                    </div>
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                ))}
              </div>

              {/* SEO suggerito */}
              {result.meta && (
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">SEO Suggerito</h4>
                  <p className="text-sm text-white mb-1">{result.meta.title}</p>
                  <p className="text-xs text-slate-400">{result.meta.description}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setResult(null); }}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Rigenera
                </button>
                <button
                  onClick={handleUseGenerated}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Usa questa Landing
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper per icone blocchi
const getBlockIcon = (type) => {
  const icons = {
    hero: '🚀',
    features: '✨',
    testimonials: '⭐',
    pricing: '💰',
    cta: '🎯',
    form: '📝',
    faq: '❓',
    countdown: '⏰',
    gallery: '🖼️',
    video: '🎬',
    text: '📄',
    divider: '➖',
  };
  return icons[type] || '📦';
};
