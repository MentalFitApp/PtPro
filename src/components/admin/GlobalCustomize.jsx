// src/components/admin/GlobalCustomize.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, X, Eye, EyeOff, RotateCcw, GripVertical } from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';

/**
 * Componente Personalizzazione Globale Dashboard
 * Controlla KPI, Layout Sezioni, Grafici e Feed in un unico pannello
 */
export default function GlobalCustomize({ 
  // Props per controllo apertura
  isOpen = false,
  onOpenChange,
  
  // Props per KPI
  availableKPIs = [],
  visibleKPIs = [],
  onKPIsChange,
  
  // Props per Layout Sezioni
  sections = [],
  hiddenSections = new Set(),
  onSectionsReorder,
  onSectionToggle,
  onLayoutReset,
  
  // Props per Grafico
  chartSettings = {},
  onChartSettingsChange,
  
  // Props per Feed
  feedSettings = {},
  onFeedSettingsChange
}) {
  const { confirmAction } = useConfirm();
  const [activePanel, setActivePanel] = useState('kpi'); // 'kpi', 'layout', 'chart', 'feed'

  const handleToggleKPI = (kpiId) => {
    const newVisible = visibleKPIs.includes(kpiId)
      ? visibleKPIs.filter(id => id !== kpiId)
      : [...visibleKPIs, kpiId];
    onKPIsChange?.(newVisible);
  };

  const handleResetAll = async () => {
    const confirmed = await confirmAction('Ripristinare tutte le personalizzazioni ai valori predefiniti?');
    if (confirmed) {
      onLayoutReset?.();
      // Reset KPI to default
      if (availableKPIs.length > 0) {
        onKPIsChange?.(availableKPIs.map(kpi => kpi.id));
      }
    }
  };

  return (
    <>
      {/* Pulsante Personalizza Globale */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onOpenChange?.(!isOpen)}
        className={`fixed top-24 right-4 sm:right-6 z-50 flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium shadow-2xl transition-all text-sm sm:text-base ${
          isOpen 
            ? 'bg-rose-600 text-white preserve-white border-2 border-rose-400' 
            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white preserve-white border border-cyan-400/30 hover:from-cyan-500 hover:to-blue-500'
        }`}
      >
        {isOpen ? (
          <>
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Chiudi</span>
          </>
        ) : (
          <>
            <Edit3 size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Personalizza</span>
          </>
        )}
      </motion.button>

      {/* Pannello Laterale */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange?.(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Pannello */}
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-slate-800 border-l border-slate-700 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-slate-700 bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Edit3 size={20} className="sm:w-6 sm:h-6" />
                    <span className="hidden sm:inline">Personalizza Dashboard</span>
                    <span className="sm:hidden">Personalizza</span>
                  </h2>
                  <button
                    onClick={() => onOpenChange?.(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
                  >
                    <X size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600">
                  {[
                    { id: 'kpi', label: 'KPI' },
                    { id: 'layout', label: 'Layout' },
                    { id: 'chart', label: 'Grafico' },
                    { id: 'feed', label: 'Feed' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActivePanel(tab.id)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        activePanel === tab.id
                          ? 'bg-white/20 text-white preserve-white border border-white/30'
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* PANNELLO KPI */}
                {activePanel === 'kpi' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                      Seleziona KPI da Visualizzare
                    </h3>
                    <div className="space-y-2">
                      {availableKPIs.map(kpi => {
                        const isVisible = visibleKPIs.includes(kpi.id);
                        return (
                          <motion.button
                            key={kpi.id}
                            onClick={() => handleToggleKPI(kpi.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full p-3 sm:p-4 rounded-xl border transition-all text-left ${
                              isVisible
                                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-400/50 shadow-lg'
                                : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${kpi.color} shrink-0`}>
                                  {React.cloneElement(kpi.icon, { size: 16 })}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-white text-sm sm:text-base truncate">{kpi.label}</div>
                                  <div className="text-xs text-slate-400 line-clamp-1">{kpi.description}</div>
                                </div>
                              </div>
                              {isVisible ? (
                                <Eye size={20} className="text-cyan-400" />
                              ) : (
                                <EyeOff size={20} className="text-slate-500" />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* PANNELLO LAYOUT */}
                {activePanel === 'layout' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                      Gestisci Sezioni Dashboard
                    </h3>
                    <div className="space-y-2">
                      {sections.map(section => {
                        const isHidden = hiddenSections.has(section.id);
                        return (
                          <motion.div
                            key={section.id}
                            whileHover={{ scale: 1.02 }}
                            className={`p-3 sm:p-4 rounded-xl border transition-all ${
                              isHidden
                                ? 'bg-slate-700/30 border-slate-600 opacity-50'
                                : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <GripVertical size={16} className="text-slate-500 cursor-move shrink-0 sm:w-[18px] sm:h-[18px]" />
                                <span className="font-medium text-white text-sm sm:text-base truncate">{section.label}</span>
                              </div>
                              <button
                                onClick={() => onSectionToggle?.(section.id)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                              >
                                {isHidden ? (
                                  <EyeOff size={16} className="text-slate-500 sm:w-[18px] sm:h-[18px]" />
                                ) : (
                                  <Eye size={16} className="text-cyan-400 sm:w-[18px] sm:h-[18px]" />
                                )}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* PANNELLO GRAFICO */}
                {activePanel === 'chart' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                      Impostazioni Grafico
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="p-3 sm:p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <label className="block text-xs sm:text-sm text-slate-300 mb-2">Tipo Grafico</label>
                        <select
                          value={chartSettings.type || 'line'}
                          onChange={(e) => onChartSettingsChange?.({ ...chartSettings, type: e.target.value })}
                          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        >
                          <option value="line">Linea</option>
                          <option value="bar">Barre</option>
                        </select>
                      </div>

                      <div className="p-3 sm:p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <label className="block text-xs sm:text-sm text-slate-300 mb-2">Intervallo Temporale</label>
                        <select
                          value={chartSettings.timeRange || 'monthly'}
                          onChange={(e) => onChartSettingsChange?.({ ...chartSettings, timeRange: e.target.value })}
                          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        >
                          <option value="daily">Giornaliero</option>
                          <option value="monthly">Mensile</option>
                          <option value="yearly">Annuale</option>
                        </select>
                      </div>

                      <div className="p-3 sm:p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={chartSettings.showAnimation ?? true}
                            onChange={(e) => onChartSettingsChange?.({ ...chartSettings, showAnimation: e.target.checked })}
                            className="rounded"
                          />
                          Mostra Animazioni
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PANNELLO FEED */}
                {activePanel === 'feed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                      Impostazioni Feed Attività
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="p-3 sm:p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <label className="block text-xs sm:text-sm text-slate-300 mb-2">Limite Elementi</label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={feedSettings.limit || 10}
                          onChange={(e) => onFeedSettingsChange?.({ ...feedSettings, limit: parseInt(e.target.value) })}
                          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        />
                      </div>

                      <div className="p-3 sm:p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feedSettings.showTimestamps ?? true}
                            onChange={(e) => onFeedSettingsChange?.({ ...feedSettings, showTimestamps: e.target.checked })}
                            className="rounded"
                          />
                          Mostra Timestamp
                        </label>
                      </div>

                      <div className="p-3 sm:p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feedSettings.autoRefresh ?? false}
                            onChange={(e) => onFeedSettingsChange?.({ ...feedSettings, autoRefresh: e.target.checked })}
                            className="rounded"
                          />
                          Auto-Aggiornamento
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-slate-700 bg-slate-900/50">
                <button
                  onClick={handleResetAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-red-400 hover:text-red-300 transition-all font-medium text-sm sm:text-base"
                >
                  <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Ripristina Tutto
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
