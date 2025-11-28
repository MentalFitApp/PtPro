// src/components/admin/SavedFilters.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Star, Trash2, Edit2, Filter, X, Check, Plus,
  Clock, AlertCircle, TrendingUp, Users
} from 'lucide-react';

/**
 * Filtri Salvati - Permette di salvare e riutilizzare filtri complessi
 */
export default function SavedFilters({ 
  currentFilters, 
  onApplyFilter, 
  storageKey = 'admin_saved_filters' 
}) {
  const [savedFilters, setSavedFilters] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Preset comuni
  const presetFilters = [
    {
      id: 'expiring-soon',
      name: 'In Scadenza (7gg)',
      icon: <Clock size={14} />,
      color: 'text-orange-400',
      filters: { filter: 'expiring', days: 7 },
      isPreset: true,
    },
    {
      id: 'no-anamnesi',
      name: 'Senza Anamnesi',
      icon: <AlertCircle size={14} />,
      color: 'text-red-400',
      filters: { hasAnamnesi: false },
      isPreset: true,
    },
    {
      id: 'high-value',
      name: 'Alto Valore (>500€)',
      icon: <TrendingUp size={14} />,
      color: 'text-green-400',
      filters: { minPayments: 500 },
      isPreset: true,
    },
    {
      id: 'active',
      name: 'Attivi',
      icon: <Users size={14} />,
      color: 'text-blue-400',
      filters: { filter: 'active' },
      isPreset: true,
    },
  ];

  // Carica filtri salvati da localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, [storageKey]);

  // Salva nuovo filtro
  const handleSaveFilter = () => {
    if (!filterName.trim()) return;

    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
      favorite: false,
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    setFilterName('');
    setShowSaveDialog(false);
  };

  // Elimina filtro
  const handleDeleteFilter = (id) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Toggle preferito
  const handleToggleFavorite = (id) => {
    const updated = savedFilters.map(f => 
      f.id === id ? { ...f, favorite: !f.favorite } : f
    );
    setSavedFilters(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Applica filtro
  const handleApplyFilter = (filter) => {
    onApplyFilter(filter.filters);
    setIsOpen(false);
  };

  const allFilters = [...presetFilters, ...savedFilters];
  const favoriteFilters = allFilters.filter(f => f.favorite);

  return (
    <>
      {/* Trigger Button */}
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all border border-slate-600"
        >
          <Filter size={16} />
          <span className="text-sm font-medium">Filtri Salvati</span>
          {savedFilters.length > 0 && (
            <span className="bg-blue-500 text-white preserve-white text-xs px-2 py-0.5 rounded-full">
              {savedFilters.length}
            </span>
          )}
        </motion.button>

        {/* Favorites Quick Access */}
        {favoriteFilters.length > 0 && !isOpen && (
          <div className="absolute top-full mt-2 left-0 flex flex-wrap gap-2 z-10">
            {favoriteFilters.slice(0, 3).map(filter => (
              <motion.button
                key={filter.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleApplyFilter(filter)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-600 transition-all"
              >
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                {filter.name}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed right-6 top-20 bottom-6 w-96 max-w-[calc(100vw-3rem)] bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Filter className="text-blue-400" size={20} />
                  <h3 className="text-white font-semibold">Filtri Salvati</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Save Current */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowSaveDialog(!showSaveDialog)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white preserve-white rounded-lg transition-all font-medium"
                  >
                    <Plus size={18} />
                    Salva Filtro Corrente
                  </button>

                  <AnimatePresence>
                    {showSaveDialog && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <input
                          type="text"
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          placeholder="Nome del filtro..."
                          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveFilter}
                            disabled={!filterName.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white preserve-white rounded-lg transition-all text-sm"
                          >
                            <Check size={16} />
                            Salva
                          </button>
                          <button
                            onClick={() => {
                              setShowSaveDialog(false);
                              setFilterName('');
                            }}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white preserve-white rounded-lg transition-all text-sm"
                          >
                            Annulla
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Preset Filters */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Filtri Predefiniti
                  </h4>
                  <div className="space-y-1">
                    {presetFilters.map(filter => (
                      <motion.button
                        key={filter.id}
                        onClick={() => handleApplyFilter(filter)}
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900/30 hover:bg-slate-700/50 rounded-lg transition-all text-left group"
                      >
                        <span className={filter.color}>{filter.icon}</span>
                        <span className="text-sm text-slate-200 group-hover:text-white flex-1">
                          {filter.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* User Saved Filters */}
                {savedFilters.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      I Miei Filtri ({savedFilters.length})
                    </h4>
                    <div className="space-y-1">
                      {savedFilters.map(filter => (
                        <motion.div
                          key={filter.id}
                          layout
                          className="group flex items-center gap-2 px-4 py-3 bg-slate-900/30 hover:bg-slate-700/50 rounded-lg transition-all"
                        >
                          <button
                            onClick={() => handleToggleFavorite(filter.id)}
                            className="text-slate-500 hover:text-yellow-400 transition-colors"
                          >
                            <Star 
                              size={16} 
                              className={filter.favorite ? 'fill-yellow-400 text-yellow-400' : ''} 
                            />
                          </button>
                          
                          <button
                            onClick={() => handleApplyFilter(filter)}
                            className="flex-1 text-left text-sm text-slate-200 group-hover:text-white transition-colors"
                          >
                            {filter.name}
                          </button>

                          <button
                            onClick={() => handleDeleteFilter(filter.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {savedFilters.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Filter size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nessun filtro salvato</p>
                    <p className="text-xs mt-1">Salva i tuoi filtri preferiti per riutilizzarli velocemente</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
