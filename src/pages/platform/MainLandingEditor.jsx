import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import {
  getMainLandingPage,
  updateMainLandingPage,
  initializeMainLandingPage,
  createBlock,
  DEFAULT_BLOCKS,
  LANDING_TEMPLATES,
} from '../../services/landingPageService';
import { DynamicBlock } from '../../components/landingBlocks';
import BlockSettingsPanel from '../admin/BlockSettingsPanel';
import AIGeneratorModal from '../../components/landing/AIGeneratorModal';
import AIAssistantPanel from '../../components/landing/AIAssistantPanel';
import {
  Plus,
  Trash2,
  Eye,
  Settings,
  ArrowUp,
  ArrowDown,
  Copy,
  ArrowLeft,
  Smartphone,
  Monitor,
  Globe,
  Check,
  X,
  Menu,
  Link2,
  Wand2,
  AlertCircle,
  ExternalLink,
  Info,
  Sparkles,
  Save,
  Crown,
  Palette,
  Search,
  Image,
  Type,
  Layout,
} from 'lucide-react';

/**
 * MainLandingEditor - Editor per la landing page principale della piattaforma (CEO)
 * Stessa logica del LandingPageEditor ma per platform/mainLanding
 */
const MainLandingEditor = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showBlockLibrary, setShowBlockLibrary] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Carica la landing page principale
  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      try {
        let pageData = await getMainLandingPage();
        
        // Se non ha blocchi, inizializza con template default
        if (!pageData.blocks || pageData.blocks.length === 0) {
          pageData = await initializeMainLandingPage();
        }
        
        setPage(pageData);
        setBlocks(pageData.blocks || []);
      } catch (error) {
        console.error('Errore caricamento landing:', error);
        toast?.showToast?.('Errore nel caricamento della landing page', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, []);

  // Salva le modifiche
  const handleSave = async (publish = false) => {
    if (!page) return;
    
    try {
      setIsSaving(true);
      const updateData = {
        ...page,
        blocks,
        isPublished: publish ? true : page.isPublished,
      };
      
      await updateMainLandingPage(updateData);
      setPage(prev => ({ ...prev, ...updateData }));
      setHasChanges(false);
      toast?.showToast?.(
        publish ? 'Landing pubblicata!' : 'Modifiche salvate!',
        'success'
      );
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast?.showToast?.('Errore nel salvataggio', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Aggiungi blocco
  const handleAddBlock = (type) => {
    const newBlock = createBlock(type);
    setBlocks(prev => [...prev, newBlock]);
    setShowBlockLibrary(false);
    setSelectedBlockId(newBlock.id);
    setHasChanges(true);
  };

  // Rimuovi blocco
  const handleRemoveBlock = (blockId) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    setHasChanges(true);
  };

  // Duplica blocco
  const handleDuplicateBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const newBlock = {
        ...JSON.parse(JSON.stringify(block)),
        id: `${block.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      const index = blocks.findIndex(b => b.id === blockId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
      setHasChanges(true);
    }
  };

  // Sposta blocco
  const handleMoveBlock = (blockId, direction) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
    setHasChanges(true);
  };

  // Aggiorna settings del blocco
  const handleUpdateBlockSettings = useCallback((blockId, newSettings) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, settings: { ...block.settings, ...newSettings } }
        : block
    ));
    setHasChanges(true);
  }, []);

  // Reorder blocks (drag & drop)
  const handleReorder = (newBlocks) => {
    setBlocks(newBlocks);
    setHasChanges(true);
  };

  // Gestisce risultato AI generator
  const handleAIGenerated = (result) => {
    if (result?.blocks) {
      setBlocks(result.blocks);
      setHasChanges(true);
      
      if (result.seo) {
        setPage(prev => ({ ...prev, seo: result.seo }));
      }
      
      toast?.showToast?.('Landing generata con AI! Rivedi e personalizza.', 'success');
    }
    setShowAIGenerator(false);
  };

  // Aggiorna branding
  const handleUpdateBranding = (field, value) => {
    setPage(prev => ({
      ...prev,
      branding: { ...prev.branding, [field]: value }
    }));
    setHasChanges(true);
  };

  // Aggiorna SEO
  const handleUpdateSeo = (field, value) => {
    setPage(prev => ({
      ...prev,
      seo: { ...prev.seo, [field]: value }
    }));
    setHasChanges(true);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Caricamento editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Back & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/platform-dashboard')}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white flex items-center gap-2">
                    Landing Page Principale
                    {hasChanges && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Non salvato
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-slate-400">/landing • Visibile a tutti</p>
                </div>
              </div>
            </div>

            {/* Center - Preview Mode */}
            <div className="hidden md:flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {[
                { mode: 'desktop', icon: Monitor, label: 'Desktop' },
                { mode: 'tablet', icon: Layout, label: 'Tablet' },
                { mode: 'mobile', icon: Smartphone, label: 'Mobile' },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === mode 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAIGenerator(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-400 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                <span className="hidden lg:inline">AI Generator</span>
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettings ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <a
                href="/landing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </a>
              
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving || !hasChanges}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Salva</span>
              </button>
              
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium text-white transition-all"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Pubblica</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Block Library */}
        <AnimatePresence>
          {showBlockLibrary && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-72 bg-slate-900/90 backdrop-blur-xl border-r border-slate-700/50 h-[calc(100vh-64px)] overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Aggiungi Blocco</h3>
                  <button
                    onClick={() => setShowBlockLibrary(false)}
                    className="p-1 hover:bg-slate-700 rounded"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(DEFAULT_BLOCKS).map(([type, block]) => (
                    <button
                      key={type}
                      onClick={() => handleAddBlock(type)}
                      className="w-full p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                          {block.icon === 'Type' && <Type className="w-4 h-4" />}
                          {block.icon === 'Image' && <Image className="w-4 h-4" />}
                          {block.icon === 'Layout' && <Layout className="w-4 h-4" />}
                          {!['Type', 'Image', 'Layout'].includes(block.icon) && <Plus className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{block.label}</p>
                          <p className="text-xs text-slate-500">{block.description || type}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content - Canvas */}
        <main className={`flex-1 h-[calc(100vh-64px)] overflow-y-auto p-6 ${
          previewMode === 'mobile' ? 'flex justify-center' : ''
        }`}>
          <div className={`mx-auto transition-all ${
            previewMode === 'mobile' ? 'max-w-[375px]' :
            previewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-5xl'
          }`}>
            {/* Add Block Button (Top) */}
            <button
              onClick={() => setShowBlockLibrary(true)}
              className="w-full mb-4 p-4 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl text-slate-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Aggiungi Blocco
            </button>

            {/* Blocks */}
            {blocks.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layout className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  La tua landing è vuota
                </h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Inizia aggiungendo blocchi o genera una landing completa con l'AI
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowBlockLibrary(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi Blocco
                  </button>
                  <button
                    onClick={() => setShowAIGenerator(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Genera con AI
                  </button>
                </div>
              </div>
            ) : (
              <Reorder.Group values={blocks} onReorder={handleReorder} className="space-y-4">
                {blocks.map((block, index) => (
                  <Reorder.Item key={block.id} value={block}>
                    <div
                      className={`relative group rounded-xl border-2 transition-all cursor-move ${
                        selectedBlockId === block.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-transparent hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      {/* Block Toolbar */}
                      <div className="absolute -top-3 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 font-medium">
                          {block.type}
                        </span>
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveBlock(block.id, 'up'); }}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3 text-slate-400" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveBlock(block.id, 'down'); }}
                            disabled={index === blocks.length - 1}
                            className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3 text-slate-400" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(block.id); }}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveBlock(block.id); }}
                            className="p-1 hover:bg-red-600 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Block Content */}
                      <div className="overflow-hidden rounded-lg bg-slate-900/50">
                        <DynamicBlock
                          type={block.type}
                          settings={block.settings}
                          isEditing={true}
                        />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        </main>

        {/* Right Sidebar - Settings Panel */}
        <AnimatePresence>
          {(showSettings || selectedBlock) && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 bg-slate-900/90 backdrop-blur-xl border-l border-slate-700/50 h-[calc(100vh-64px)] overflow-y-auto"
            >
              {selectedBlock ? (
                <BlockSettingsPanel
                  block={selectedBlock}
                  onUpdate={(settings) => handleUpdateBlockSettings(selectedBlock.id, settings)}
                  onClose={() => setSelectedBlockId(null)}
                />
              ) : showSettings && (
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Impostazioni Landing
                  </h3>
                  
                  {/* Branding */}
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Branding
                    </h4>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Nome App</label>
                      <input
                        type="text"
                        value={page?.branding?.appName || 'FitFlows'}
                        onChange={(e) => handleUpdateBranding('appName', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Colore Primario</label>
                      <input
                        type="color"
                        value={page?.branding?.primaryColor || '#3b82f6'}
                        onChange={(e) => handleUpdateBranding('primaryColor', e.target.value)}
                        className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Colore Accento</label>
                      <input
                        type="color"
                        value={page?.branding?.accentColor || '#06b6d4'}
                        onChange={(e) => handleUpdateBranding('accentColor', e.target.value)}
                        className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  {/* SEO */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      SEO
                    </h4>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Titolo SEO</label>
                      <input
                        type="text"
                        value={page?.seo?.title || ''}
                        onChange={(e) => handleUpdateSeo('title', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        placeholder="Titolo per i motori di ricerca"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Descrizione SEO</label>
                      <textarea
                        value={page?.seo?.description || ''}
                        onChange={(e) => handleUpdateSeo('description', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white h-24 resize-none"
                        placeholder="Descrizione per i motori di ricerca"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <AIGeneratorModal
          isOpen={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
          onGenerated={handleAIGenerated}
          existingBlocks={blocks}
        />
      )}

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <AIAssistantPanel
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          blocks={blocks}
          onUpdateBlocks={setBlocks}
        />
      )}
    </div>
  );
};

export default MainLandingEditor;
