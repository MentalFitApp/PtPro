import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Lightbulb, TrendingUp, Clock, Plus, Zap, Loader2, Calendar } from 'lucide-react';
import { generateNutritionSuggestions, generateCompleteSchedule } from '../services/aiNutritionAssistant';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

const AINutritionAssistant = ({ 
  clientData, 
  anamnesisData, 
  schedaData, 
  onApplySuggestion,
  onApplyCompleteSchedule,
  mealContext = null,
  contextType = 'general',
  coachId = null
}) => {
  const toast = useToast();
  const { confirmAction } = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [generatingComplete, setGeneratingComplete] = useState(false);

  const handleGenerateSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateNutritionSuggestions({
        clientData,
        anamnesisData,
        schedaData,
        contextType,
        mealContext,
        coachId
      });
      
      setSuggestions(result);
    } catch (err) {
      setError(err.message);
      console.error('Errore AI Assistant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCompleteSchedule = async (mode = 'full') => {
    const isTemplate = mode === 'template';
    
    const confirmed = await confirmAction({
      title: isTemplate ? 'Generare template veloce?' : 'Generare scheda personalizzata?',
      message: 'Verrà generata una scheda di 7 giorni. Questo sostituirà tutti i pasti attuali.',
      confirmText: 'Genera',
      type: 'warning'
    });
    if (!confirmed) return;

    setGeneratingComplete(true);
    setError(null);
    
    try {
      // Raccogli le foto anamnesi se presenti (solo per modalità full)
      const anamnesisPhotos = [];
      if (!isTemplate) {
        if (anamnesisData?.photos && Array.isArray(anamnesisData.photos)) {
          anamnesisPhotos.push(...anamnesisData.photos.map(p => p.url || p));
        }
        if (anamnesisData?.photoFront) anamnesisPhotos.push(anamnesisData.photoFront);
        if (anamnesisData?.photoSide) anamnesisPhotos.push(anamnesisData.photoSide);
        if (anamnesisData?.photoBack) anamnesisPhotos.push(anamnesisData.photoBack);
      }

      const result = await generateCompleteSchedule({
        clientData,
        anamnesisData,
        obiettivo: schedaData.obiettivo || 'Mantenimento',
        durataSettimane: schedaData.durataSettimane || 4,
        anamnesisPhotos: isTemplate ? [] : anamnesisPhotos.filter(Boolean),
        mode: isTemplate ? 'template' : 'full'
      });
      
      if (onApplyCompleteSchedule && result.schedaCompleta) {
        onApplyCompleteSchedule(result);
        toast.success(`Scheda ${isTemplate ? 'template' : 'personalizzata'} generata con successo!`);
        setIsOpen(false);
      }
    } catch (err) {
      setError(err.message);
      console.error('Errore generazione scheda completa:', err);
    } finally {
      setGeneratingComplete(false);
    }
  };

  const handleApplySuggestion = (suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'media': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'bassa': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getTypeIcon = (tipo) => {
    switch (tipo) {
      case 'generale': return <Lightbulb className="w-4 h-4" />;
      case 'pasto': return <TrendingUp className="w-4 h-4" />;
      case 'integrazione': return <Plus className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          if (!suggestions) handleGenerateSuggestions();
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white preserve-white rounded-full shadow-lg transition-all"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">AI Assistant</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-xl font-bold text-white preserve-white">AI Nutrition Assistant</h2>
                    <p className="text-sm text-purple-100">Suggerimenti personalizzati per {clientData?.name || 'il cliente'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                    <p className="text-slate-300">Analizzo i dati e genero suggerimenti...</p>
                    <p className="text-sm text-slate-400">Questo potrebbe richiedere alcuni secondi</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button
                      onClick={handleGenerateSuggestions}
                      className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white preserve-white rounded-lg text-sm transition-colors"
                    >
                      Riprova
                    </button>
                  </div>
                )}

                {/* Suggestions */}
                {suggestions && !loading && (
                  <>
                    {/* Macros Suggeriti */}
                    {suggestions.macrosSuggeriti && (
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          Macros Giornalieri Suggeriti
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-emerald-400">
                              {suggestions.macrosSuggeriti.calorie}
                            </div>
                            <div className="text-xs text-slate-400 uppercase">Calorie</div>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-400">
                              {suggestions.macrosSuggeriti.proteine}g
                            </div>
                            <div className="text-xs text-slate-400 uppercase">Proteine</div>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-yellow-400">
                              {suggestions.macrosSuggeriti.carboidrati}g
                            </div>
                            <div className="text-xs text-slate-400 uppercase">Carboidrati</div>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-orange-400">
                              {suggestions.macrosSuggeriti.grassi}g
                            </div>
                            <div className="text-xs text-slate-400 uppercase">Grassi</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lista Suggerimenti */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                        Suggerimenti Personalizzati
                      </h3>

                      {suggestions.suggerimenti?.map((suggestion, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-0.5 text-purple-400">
                                {getTypeIcon(suggestion.tipo)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-100">{suggestion.titolo}</h4>
                                <p className="text-sm text-slate-400 mt-1">{suggestion.descrizione}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(suggestion.priorita)}`}>
                              {suggestion.priorita}
                            </span>
                          </div>

                          {/* Action Details */}
                          {suggestion.azione && suggestion.azione.dati && (
                            <div className="bg-slate-700/30 rounded-lg p-3 text-xs space-y-1">
                              <div className="text-slate-300 font-medium">Azione da applicare:</div>
                              {suggestion.azione.tipo === 'replace_food' && (
                                <div className="text-slate-400">
                                  <span className="text-red-400">Rimuove:</span> {suggestion.azione.dati.alimentoDaRimuovere}<br/>
                                  <span className="text-emerald-400">Aggiunge:</span> {suggestion.azione.dati.alimentoDaAggiungere?.nome} ({suggestion.azione.dati.alimentoDaAggiungere?.quantita}g)<br/>
                                  <span className="text-purple-400">Pasto:</span> {suggestion.azione.dati.pastoNome}
                                </div>
                              )}
                              {suggestion.azione.tipo === 'add_food' && (
                                <div className="text-slate-400">
                                  <span className="text-emerald-400">Aggiunge:</span> {suggestion.azione.dati.alimentoDaAggiungere?.nome} ({suggestion.azione.dati.alimentoDaAggiungere?.quantita}g)<br/>
                                  <span className="text-purple-400">Pasto:</span> {suggestion.azione.dati.pastoNome}<br/>
                                  <span className="text-blue-400">Macros:</span> {suggestion.azione.dati.alimentoDaAggiungere?.kcal}kcal, P:{suggestion.azione.dati.alimentoDaAggiungere?.proteine}g, C:{suggestion.azione.dati.alimentoDaAggiungere?.carboidrati}g, G:{suggestion.azione.dati.alimentoDaAggiungere?.grassi}g
                                </div>
                              )}
                              {suggestion.azione.tipo === 'remove_food' && (
                                <div className="text-slate-400">
                                  <span className="text-red-400">Rimuove:</span> {suggestion.azione.dati.alimentoDaRimuovere}<br/>
                                  <span className="text-purple-400">Pasto:</span> {suggestion.azione.dati.pastoNome}
                                </div>
                              )}
                              {suggestion.azione.tipo === 'add_supplement' && (
                                <div className="text-slate-400">
                                  <span className="text-emerald-400">Integratore:</span> {suggestion.azione.dati.alimentoDaAggiungere?.nome || suggestion.azione.dati.integratore}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Button */}
                          {suggestion.azione && (
                            <button
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white preserve-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              {suggestion.azione.tipo === 'replace_food' ? '🔄 Sostituisci Alimento' : 
                               suggestion.azione.tipo === 'add_food' ? '➕ Aggiungi Alimento' :
                               suggestion.azione.tipo === 'remove_food' ? '🗑️ Rimuovi Alimento' :
                               '✨ Applica Suggerimento'}
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Note Generali */}
                    {suggestions.note && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-sm text-blue-200">{suggestions.note}</p>
                      </div>
                    )}

                    {/* Regenerate Button */}
                    <button
                      onClick={handleGenerateSuggestions}
                      className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Rigenera Suggerimenti
                    </button>
                  </>
                )}

                {/* Initial State */}
                {!suggestions && !loading && !error && !generatingComplete && (
                  <div className="text-center py-8 space-y-6">
                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto" />
                    <h3 className="text-xl font-bold text-slate-100">
                      AI Nutrition Assistant
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm">
                      Analisi intelligente basata su anamnesi, obiettivo, preferenze pasti e foto (se presenti)
                    </p>
                    
                    {/* Info anamnesi */}
                    <div className="max-w-md mx-auto space-y-2">
                      {anamnesisData?.photos?.length > 0 || anamnesisData?.photoFront ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                          <p className="text-emerald-300 text-xs flex items-center justify-center gap-2">
                            <Zap className="w-3 h-3" />
                            {anamnesisData?.photos?.length || 1} foto disponibili per analisi avanzata
                          </p>
                        </div>
                      ) : null}
                      
                      {anamnesisData?.numeroPasti && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                          <p className="text-blue-300 text-xs">
                            🍽️ Cliente preferisce {anamnesisData.numeroPasti} pasti/giorno
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {/* Suggerimenti Rapidi */}
                      <button
                        onClick={handleGenerateSuggestions}
                        className="px-5 py-4 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white preserve-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Lightbulb className="w-6 h-6" />
                          <span className="text-sm">Suggerimenti Rapidi</span>
                          <span className="text-xs opacity-80">Ottimizza scheda attuale</span>
                        </div>
                      </button>
                      
                      {/* Scheda Completa Personalizzata */}
                      <button
                        onClick={handleGenerateCompleteSchedule}
                        className="px-5 py-4 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white preserve-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="w-6 h-6" />
                          <span className="text-sm">Scheda 7 Giorni</span>
                          <span className="text-xs opacity-80">Personalizzata su anamnesi</span>
                        </div>
                      </button>
                      
                      {/* Scheda Template Veloce */}
                      <button
                        onClick={() => handleGenerateCompleteSchedule('template')}
                        className="px-5 py-4 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white preserve-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Zap className="w-6 h-6" />
                          <span className="text-sm">Template Veloce</span>
                          <span className="text-xs opacity-80">Scheda base per obiettivo</span>
                        </div>
                      </button>
                      
                      {/* Analisi Macro */}
                      <button
                        onClick={() => handleGenerateSuggestions('macros')}
                        className="px-5 py-4 bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white preserve-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <TrendingUp className="w-6 h-6" />
                          <span className="text-sm">Solo Macros</span>
                          <span className="text-xs opacity-80">Calcolo target giornaliero</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Generating Complete Schedule State */}
                {generatingComplete && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                    <p className="text-slate-300 font-medium">Genero scheda completa di 7 giorni...</p>
                    <p className="text-sm text-slate-400">
                      {anamnesisData?.photos?.length > 0 || anamnesisData?.photoFront 
                        ? '🔍 Analizzo foto anamnesi per ottimizzare la scheda...' 
                        : 'Questo richiederà 15-30 secondi'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AINutritionAssistant;
