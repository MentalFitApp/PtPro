import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getLandingPage,
  updateLandingPage,
  createLandingPage,
  createBlock,
  DEFAULT_BLOCKS,
  LANDING_TEMPLATES,
  generateSlug,
} from '../../services/landingPageService';
import { DynamicBlock } from '../../components/landingBlocks';
import BlockSettingsPanel from './BlockSettingsPanel';
import AIGeneratorModal from '../../components/landing/AIGeneratorModal';
import AIAssistantPanel from '../../components/landing/AIAssistantPanel';
import LandingPageLeads from '../../components/landing/LandingPageLeads';
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
  Users,
  Bot,
} from 'lucide-react';

const LandingPageEditor = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const toast = useToast();

  // State
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showBlockLibrary, setShowBlockLibrary] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLeads, setShowLeads] = useState(false);

  // Determina se è modalità creazione
  const isNewPage = !pageId || pageId === 'new';

  // Carica la landing page o inizializza per nuova
  useEffect(() => {
    const initPage = async () => {
      if (!tenantId) return;
      
      setIsLoading(true);
      
      try {
        if (isNewPage) {
          // Nuova pagina - controlla se c'è un template dalla query string
          const params = new URLSearchParams(window.location.search);
          const templateKey = params.get('template');
          
          let initialBlocks = [];
          if (templateKey && LANDING_TEMPLATES[templateKey]) {
            initialBlocks = LANDING_TEMPLATES[templateKey].blocks.map(block => ({
              ...JSON.parse(JSON.stringify(block)),
              id: `${block.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            }));
          }
          
          // Crea la nuova landing page nel database
          const newPage = await createLandingPage(tenantId, {
            title: 'Nuova Landing Page',
            description: '',
            template: templateKey || 'blank',
            blocks: initialBlocks,
          });
          
          // Naviga all'URL di modifica con il nuovo ID
          navigate(`/admin/landing-pages/${newPage.id}/edit`, { replace: true });
        } else {
          // Modifica pagina esistente
          const pageData = await getLandingPage(tenantId, pageId);
          setPage(pageData);
          setBlocks(pageData.blocks || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Errore inizializzazione pagina:', error);
        toast?.showToast?.('Errore nel caricamento della pagina', 'error');
        navigate('/admin/landing-pages');
      }
    };

    initPage();
  }, [pageId, tenantId, isNewPage, navigate]);

  // Salva le modifiche
  const handleSave = async (publish = false) => {
    if (!page) return;
    
    try {
      setIsSaving(true);
      const updateData = {
        blocks,
        isPublished: publish ? true : page.isPublished,
      };
      
      // Se stiamo pubblicando, aggiungi anche status per backward compatibility
      if (publish) {
        updateData.status = 'published';
        updateData.publishedAt = new Date().toISOString();
      }
      
      await updateLandingPage(tenantId, pageId, updateData);
      setHasChanges(false);
      toast?.showToast?.(
        publish ? 'Pagina pubblicata!' : 'Modifiche salvate!',
        'success'
      );
      if (publish) {
        setPage(prev => ({ ...prev, isPublished: true, status: 'published' }));
      }
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

  // Aggiorna settings del blocco - memoizzato per evitare re-render
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
      
      // Aggiorna anche i meta se presenti
      if (result.meta) {
        setPage(prev => ({
          ...prev,
          title: result.meta.title || prev?.title,
          slug: result.meta.slug || prev?.slug,
          description: result.meta.description || prev?.description,
          settings: {
            ...prev?.settings,
            seo: {
              ...prev?.settings?.seo,
              title: result.meta.title,
              description: result.meta.description,
            },
          },
        }));
      }
      
      toast?.showToast?.('Landing page generata con AI! 🎉', 'success');
    }
  };

  // Memoizza selectedBlock per evitare re-render del pannello settings
  const selectedBlock = useMemo(() => 
    blocks.find(b => b.id === selectedBlockId),
    [blocks, selectedBlockId]
  );

  // Callback memoizzato per update del blocco selezionato
  const handleSelectedBlockUpdate = useCallback((settings) => {
    if (selectedBlockId) {
      handleUpdateBlockSettings(selectedBlockId, settings);
    }
  }, [selectedBlockId, handleUpdateBlockSettings]);

  // Preview widths
  const previewWidths = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[375px]',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/landing-pages')}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-white font-semibold">{page?.title || 'Editor'}</h1>
            <p className="text-xs text-slate-400">
              {page?.status === 'published' ? '🟢 Pubblicata' : '🟡 Bozza'}
            </p>
          </div>
        </div>

        {/* Preview controls */}
        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`p-2 rounded-md transition-colors ${
              previewMode === 'desktop' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPreviewMode('tablet')}
            className={`p-2 rounded-md transition-colors ${
              previewMode === 'tablet' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-5 h-5 rotate-90" />
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`p-2 rounded-md transition-colors ${
              previewMode === 'mobile' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showPreview 
                ? 'bg-sky-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Eye className="w-5 h-5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Leads Button */}
          {!isNewPage && (
            <button
              onClick={() => setShowLeads(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Leads</span>
            </button>
          )}

          <button
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden sm:inline">Genera AI</span>
          </button>

          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            title="Assistente AI per modifiche"
          >
            <Bot className="w-5 h-5" />
            <span className="hidden sm:inline">Assistente</span>
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Impostazioni</span>
          </button>

          {hasChanges && (
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Check className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">Salva</span>
            </button>
          )}

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-400 text-white rounded-lg hover:shadow-lg hover:shadow-sky-500/30 transition-all disabled:opacity-50"
          >
            <Globe className="w-5 h-5" />
            <span className="hidden sm:inline">Pubblica</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Blocks sidebar */}
        <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <button
              onClick={() => setShowBlockLibrary(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-cyan-400 text-white rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              Aggiungi Blocco
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Struttura Pagina
            </h3>
            
            {blocks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Nessun blocco</p>
                <p className="text-xs mt-1">Clicca &quot;Aggiungi Blocco&quot; per iniziare</p>
              </div>
            ) : (
              <Reorder.Group 
                axis="y" 
                values={blocks} 
                onReorder={handleReorder}
                className="space-y-2"
              >
                {blocks.map((block, index) => (
                  <Reorder.Item
                    key={block.id}
                    value={block}
                    className={`group relative p-3 rounded-lg cursor-move transition-all ${
                      selectedBlockId === block.id
                        ? 'bg-sky-500/20 border border-sky-500/50'
                        : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                    }`}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Menu className="w-4 h-4 text-slate-500" />
                      <span className="text-xl">
                        {DEFAULT_BLOCKS[block.type]?.icon || '📦'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {DEFAULT_BLOCKS[block.type]?.name || block.type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {block.settings?.variant || 'default'}
                        </p>
                      </div>
                    </div>

                    {/* Block actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(block.id, 'up'); }}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-600 rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveBlock(block.id, 'down'); }}
                        disabled={index === blocks.length - 1}
                        className="p-1 hover:bg-slate-600 rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(block.id); }}
                        className="p-1 hover:bg-slate-600 rounded"
                      >
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveBlock(block.id); }}
                        className="p-1 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-auto bg-slate-950 p-8">
          <div className={`${previewWidths[previewMode]} mx-auto transition-all duration-300`}>
            {showPreview ? (
              // Preview mode - render blocks senza editing
              <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                {blocks.map((block) => (
                  <DynamicBlock
                    key={block.id}
                    type={block.type}
                    settings={block.settings}
                    isPreview={true}
                    pageId={pageId}
                    tenantId={tenantId}
                  />
                ))}
              </div>
            ) : (
              // Edit mode
              <div className="space-y-4">
                {blocks.length === 0 ? (
                  <div 
                    onClick={() => setShowBlockLibrary(true)}
                    className="border-2 border-dashed border-slate-700 rounded-xl p-16 text-center cursor-pointer hover:border-sky-500/50 transition-colors"
                  >
                    <Plus className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Clicca per aggiungere il primo blocco</p>
                  </div>
                ) : (
                  blocks.map((block) => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all ${
                        selectedBlockId === block.id
                          ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-950'
                          : 'hover:ring-2 hover:ring-slate-600'
                      }`}
                    >
                      <DynamicBlock
                        type={block.type}
                        settings={block.settings}
                        isPreview={true}
                        pageId={pageId}
                        tenantId={tenantId}
                      />
                      
                      {/* Overlay con label */}
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm">
                          {DEFAULT_BLOCKS[block.type]?.icon} {DEFAULT_BLOCKS[block.type]?.name}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {/* Add block button at bottom */}
                {blocks.length > 0 && (
                  <button
                    onClick={() => setShowBlockLibrary(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-sky-500/50 hover:text-sky-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Aggiungi Blocco
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Settings panel */}
        {selectedBlock && !showPreview && (
          <aside className="w-80 bg-slate-800 border-l border-slate-700 overflow-y-auto">
            <BlockSettingsPanel
              key={selectedBlockId}
              block={selectedBlock}
              onUpdate={handleSelectedBlockUpdate}
              onClose={() => setSelectedBlockId(null)}
              tenantId={tenantId}
              pageId={pageId}
            />
          </aside>
        )}
      </div>

      {/* Block library modal */}
      <AnimatePresence>
        {showBlockLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowBlockLibrary(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Libreria Blocchi</h2>
                <button
                  onClick={() => setShowBlockLibrary(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(DEFAULT_BLOCKS).map(([type, block]) => (
                  <button
                    key={type}
                    onClick={() => handleAddBlock(type)}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-center transition-all hover:scale-105 border border-transparent hover:border-sky-500/30"
                  >
                    <span className="text-4xl mb-2 block">{block.icon}</span>
                    <p className="text-white font-medium">{block.name}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page settings modal */}
      <AnimatePresence>
        {showSettings && (
          <PageSettingsModal
            page={page}
            tenantId={tenantId}
            onSave={async (settings) => {
              try {
                console.log('📝 Salvando settings:', settings);
                await updateLandingPage(tenantId, pageId, settings);
                console.log('✅ Settings salvati');
                setPage(prev => ({ ...prev, ...settings }));
                toast?.showToast?.('Impostazioni salvate!', 'success');
                setShowSettings(false);
              } catch (error) {
                console.error('❌ Errore salvataggio:', error);
                toast?.showToast?.('Errore nel salvataggio', 'error');
              }
            }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* AI Generator Modal */}
      <AIGeneratorModal
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerated={handleAIGenerated}
        tenantId={tenantId}
      />

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAIAssistant && (
          <AIAssistantPanel
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onUpdateBlock={(blockId, changes) => {
              setBlocks(prev => prev.map(b => 
                b.id === blockId 
                  ? { ...b, settings: { ...b.settings, ...changes } }
                  : b
              ));
              setHasChanges(true);
              toast?.showToast?.('Blocco modificato dall\'AI', 'success');
            }}
            onUpdateAllBlocks={(changes) => {
              // changes dovrebbe essere un array di { blockId, settings }
              if (!Array.isArray(changes)) {
                console.warn('onUpdateAllBlocks: changes non è un array', changes);
                toast?.showToast?.('Formato risposta AI non valido', 'error');
                return;
              }
              setBlocks(prev => prev.map(b => {
                const change = changes.find(c => c.blockId === b.id);
                if (change) {
                  return { ...b, settings: { ...b.settings, ...change.settings } };
                }
                return b;
              }));
              setHasChanges(true);
              toast?.showToast?.(`${changes.length} blocchi modificati dall'AI`, 'success');
            }}
            onAddBlock={(newBlock) => {
              const block = {
                id: `${newBlock.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ...newBlock,
              };
              setBlocks(prev => [...prev, block]);
              setHasChanges(true);
              toast?.showToast?.('Nuovo blocco aggiunto dall\'AI', 'success');
            }}
            onDeleteBlock={(blockId) => {
              setBlocks(prev => prev.filter(b => b.id !== blockId));
              if (selectedBlockId === blockId) {
                setSelectedBlockId(null);
              }
              setHasChanges(true);
              toast?.showToast?.('Blocco eliminato dall\'AI', 'success');
            }}
            onReorderBlocks={(newOrder) => {
              // newOrder è un array di blockId nell'ordine desiderato
              setBlocks(prev => {
                const blockMap = new Map(prev.map(b => [b.id, b]));
                const reordered = newOrder
                  .filter(id => blockMap.has(id))
                  .map(id => blockMap.get(id));
                // Aggiungi eventuali blocchi non presenti in newOrder alla fine
                const missingBlocks = prev.filter(b => !newOrder.includes(b.id));
                return [...reordered, ...missingBlocks];
              });
              setHasChanges(true);
              toast?.showToast?.('Blocchi riordinati dall\'AI', 'success');
            }}
            onReplaceAllBlocks={(newBlocks) => {
              // Sostituisce TUTTI i blocchi con quelli nuovi
              const blocksWithIds = newBlocks.map(block => ({
                id: `${block.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ...block,
              }));
              setBlocks(blocksWithIds);
              setSelectedBlockId(null);
              setHasChanges(true);
              toast?.showToast?.(`Landing rigenerata con ${newBlocks.length} blocchi`, 'success');
            }}
          />
        )}
      </AnimatePresence>

      {/* Leads Modal */}
      <LandingPageLeads
        isOpen={showLeads}
        onClose={() => setShowLeads(false)}
        pageId={pageId}
        tenantId={tenantId}
      />
    </div>
  );
};

// Modal per le impostazioni della pagina - Migliorato con auto-generazione e validazioni
const PageSettingsModal = ({ page, tenantId, onSave, onClose }) => {
  const [title, setTitle] = useState(page?.title || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [description, setDescription] = useState(page?.description || '');
  const [seoTitle, setSeoTitle] = useState(page?.settings?.seo?.title || '');
  const [seoDescription, setSeoDescription] = useState(page?.settings?.seo?.description || '');
  const [facebookPixel, setFacebookPixel] = useState(page?.settings?.tracking?.facebookPixel || '');
  const [googleAnalytics, setGoogleAnalytics] = useState(page?.settings?.tracking?.googleAnalytics || '');
  
  // Design settings
  const [colorScheme, setColorScheme] = useState(page?.settings?.design?.colorScheme || 'sky');
  const [fontFamily, setFontFamily] = useState(page?.settings?.design?.fontFamily || 'Inter');
  const [buttonStyle, setButtonStyle] = useState(page?.settings?.design?.buttonStyle || 'rounded');
  const [containerWidth, setContainerWidth] = useState(page?.settings?.design?.containerWidth || 'default');
  const [globalAnimations, setGlobalAnimations] = useState(page?.settings?.design?.globalAnimations ?? true);
  
  // Se la pagina ha già uno slug, considera già modificato manualmente
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!page?.slug);
  const [seoManuallyEdited, setSeoManuallyEdited] = useState(!!page?.settings?.seo?.title || !!page?.settings?.seo?.description);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // Color scheme options
  const colorSchemes = [
    { value: 'sky', label: 'Sky Blue', primary: '#0ea5e9', secondary: '#06b6d4' },
    { value: 'purple', label: 'Purple', primary: '#a855f7', secondary: '#ec4899' },
    { value: 'emerald', label: 'Emerald', primary: '#10b981', secondary: '#14b8a6' },
    { value: 'orange', label: 'Orange', primary: '#f97316', secondary: '#ef4444' },
    { value: 'rose', label: 'Rose', primary: '#f43f5e', secondary: '#ec4899' },
    { value: 'indigo', label: 'Indigo', primary: '#6366f1', secondary: '#8b5cf6' },
    { value: 'amber', label: 'Amber', primary: '#f59e0b', secondary: '#eab308' },
    { value: 'slate', label: 'Slate (Dark)', primary: '#475569', secondary: '#64748b' },
  ];

  const fontFamilies = [
    { value: 'Inter', label: 'Inter (Moderno)' },
    { value: 'Poppins', label: 'Poppins (Geometrico)' },
    { value: 'Playfair Display', label: 'Playfair Display (Elegante)' },
    { value: 'Montserrat', label: 'Montserrat (Professionale)' },
    { value: 'Roboto', label: 'Roboto (Neutro)' },
    { value: 'Open Sans', label: 'Open Sans (Leggibile)' },
    { value: 'Lato', label: 'Lato (Friendly)' },
    { value: 'Raleway', label: 'Raleway (Sofisticato)' },
  ];

  const buttonStyles = [
    { value: 'rounded', label: 'Arrotondato' },
    { value: 'pill', label: 'Pillola' },
    { value: 'square', label: 'Squadrato' },
    { value: 'sharp', label: 'Sharp' },
  ];

  const containerWidths = [
    { value: 'narrow', label: 'Stretto (max-w-4xl)' },
    { value: 'default', label: 'Default (max-w-6xl)' },
    { value: 'wide', label: 'Largo (max-w-7xl)' },
    { value: 'full', label: 'Pieno (100%)' },
  ];

  // Genera slug automaticamente dal titolo (se non modificato manualmente)
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      const autoSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(autoSlug);
    }
  }, [title, slugManuallyEdited]);

  // Auto-popola SEO dal contenuto principale (se non modificato manualmente)
  useEffect(() => {
    if (!seoManuallyEdited) {
      if (!seoTitle && title) setSeoTitle(title);
      if (!seoDescription && description) setSeoDescription(description);
    }
  }, [title, description, seoManuallyEdited, seoTitle, seoDescription]);

  // URL preview
  const previewUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/site/${tenantId}/${slug || 'your-page-slug'}`;
  }, [tenantId, slug]);

  // Validazioni
  const validations = useMemo(() => {
    const errors = [];
    const warnings = [];
    
    if (!title.trim()) errors.push('Il titolo è obbligatorio');
    if (title.length > 60) warnings.push('Titolo lungo: potrebbe essere troncato nei risultati di ricerca');
    
    if (!slug.trim()) errors.push('Lo slug URL è obbligatorio');
    if (slug && !/^[a-z0-9-]+$/.test(slug)) errors.push('Lo slug può contenere solo lettere minuscole, numeri e trattini');
    
    if (seoTitle && seoTitle.length > 60) warnings.push('Meta Title: idealmente max 60 caratteri');
    if (seoDescription && seoDescription.length > 160) warnings.push('Meta Description: idealmente max 160 caratteri');
    
    if (facebookPixel && !/^\d{15,16}$/.test(facebookPixel)) warnings.push('Facebook Pixel ID sembra non valido (dovrebbe essere 15-16 cifre)');
    if (googleAnalytics && !/^G-[A-Z0-9]+$/.test(googleAnalytics)) warnings.push('Google Analytics ID sembra non valido (formato: G-XXXXXXXXXX)');
    
    return { errors, warnings, isValid: errors.length === 0 };
  }, [title, slug, seoTitle, seoDescription, facebookPixel, googleAnalytics]);

  const handleSave = async () => {
    if (!validations.isValid) return;
    
    setSaving(true);
    try {
      await onSave({
        title,
        slug,
        description,
        settings: {
          ...page?.settings,
          seo: {
            title: seoTitle || title,
            description: seoDescription || description,
            ogImage: page?.settings?.seo?.ogImage || '',
            keywords: page?.settings?.seo?.keywords || [],
          },
          tracking: {
            facebookPixel,
            googleAnalytics,
            tiktokPixel: page?.settings?.tracking?.tiktokPixel || '',
            customScripts: page?.settings?.tracking?.customScripts || '',
          },
          design: {
            colorScheme,
            fontFamily,
            buttonStyle,
            containerWidth,
            globalAnimations,
          },
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
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
        className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Impostazioni Pagina</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'general', label: 'Generale', icon: '📝' },
            { id: 'design', label: 'Design', icon: '🎨' },
            { id: 'seo', label: 'SEO', icon: '🔍' },
            { id: 'tracking', label: 'Tracking', icon: '📊' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-sky-400 border-b-2 border-sky-400 bg-slate-700/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Errori e Warning */}
          {(validations.errors.length > 0 || validations.warnings.length > 0) && (
            <div className="mb-6 space-y-2">
              {validations.errors.map((error, i) => (
                <div key={`err-${i}`} className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              ))}
              {validations.warnings.map((warning, i) => (
                <div key={`warn-${i}`} className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Tab: General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Titolo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es: Trasformazione Fisica in 90 Giorni"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">{title.length}/60 caratteri</p>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Slug URL <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    placeholder="trasformazione-fisica-90-giorni"
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSlugManuallyEdited(false);
                      if (title) {
                        const autoSlug = title
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/-+/g, '-')
                          .replace(/^-|-$/g, '');
                        setSlug(autoSlug);
                      }
                    }}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
                    title="Rigenera automaticamente dal titolo"
                  >
                    <Wand2 className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Solo lettere minuscole, numeri e trattini</p>
              </div>

              {/* Preview URL */}
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <Link2 className="w-3 h-3" />
                  URL Pubblico:
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-sky-400 break-all">{previewUrl}</code>
                  <button
                    type="button"
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="p-1.5 hover:bg-slate-700 rounded"
                    title="Apri in nuova scheda"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Descrizione</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Una breve descrizione della tua offerta..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {/* Tab: Design */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              {/* Color Scheme */}
              <div>
                <label className="block text-sm text-slate-300 mb-3">Schema Colori</label>
                <div className="grid grid-cols-4 gap-3">
                  {colorSchemes.map(scheme => (
                    <button
                      key={scheme.value}
                      onClick={() => setColorScheme(scheme.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        colorScheme === scheme.value 
                          ? 'border-sky-400 bg-slate-700' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: scheme.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: scheme.secondary }}
                        />
                      </div>
                      <span className="text-xs text-slate-300">{scheme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Font</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {fontFamilies.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>

              {/* Button Style */}
              <div>
                <label className="block text-sm text-slate-300 mb-3">Stile Pulsanti</label>
                <div className="grid grid-cols-4 gap-3">
                  {buttonStyles.map(style => (
                    <button
                      key={style.value}
                      onClick={() => setButtonStyle(style.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        buttonStyle === style.value 
                          ? 'border-sky-400 bg-slate-700' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className={`h-8 bg-gradient-to-r from-sky-500 to-cyan-400 flex items-center justify-center text-white text-xs mb-2 ${
                        style.value === 'rounded' ? 'rounded-lg' :
                        style.value === 'pill' ? 'rounded-full' :
                        style.value === 'square' ? 'rounded' :
                        'rounded-none'
                      }`}>
                        Button
                      </div>
                      <span className="text-xs text-slate-300">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Container Width */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Larghezza Contenuto</label>
                <select
                  value={containerWidth}
                  onChange={(e) => setContainerWidth(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {containerWidths.map(width => (
                    <option key={width.value} value={width.value}>{width.label}</option>
                  ))}
                </select>
              </div>

              {/* Animations Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-sm text-white">Animazioni</p>
                  <p className="text-xs text-slate-400">Attiva animazioni di entrata per i blocchi</p>
                </div>
                <button
                  onClick={() => setGlobalAnimations(!globalAnimations)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    globalAnimations ? 'bg-sky-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                    globalAnimations ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Tab: SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Ottimizza la pagina per i motori di ricerca</p>
                <button
                  type="button"
                  onClick={() => {
                    setSeoManuallyEdited(false);
                    setSeoTitle(title);
                    setSeoDescription(description);
                  }}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                >
                  <Wand2 className="w-3 h-3" />
                  Auto-genera
                </button>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoManuallyEdited(true);
                    setSeoTitle(e.target.value);
                  }}
                  placeholder={title || 'Titolo per i motori di ricerca'}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className={`text-xs mt-1 ${seoTitle.length > 60 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {seoTitle.length}/60 caratteri
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Meta Description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoManuallyEdited(true);
                    setSeoDescription(e.target.value);
                  }}
                  rows={3}
                  placeholder={description || 'Descrizione per i risultati di ricerca'}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className={`text-xs mt-1 ${seoDescription.length > 160 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {seoDescription.length}/160 caratteri
                </p>
              </div>

              {/* Preview SERP */}
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-blue-600 hover:underline cursor-pointer truncate">
                  {seoTitle || title || 'Titolo della Pagina'}
                </p>
                <p className="text-xs text-green-700 truncate">{previewUrl}</p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {seoDescription || description || 'Descrizione della pagina che apparirà nei risultati di ricerca...'}
                </p>
              </div>
            </div>
          )}

          {/* Tab: Tracking */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-400">Configura il tracciamento per monitorare le conversioni</p>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Facebook Pixel ID</label>
                <input
                  type="text"
                  value={facebookPixel}
                  onChange={(e) => setFacebookPixel(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456789012345"
                  maxLength={16}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">15-16 cifre numeriche</p>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Google Analytics ID</label>
                <input
                  type="text"
                  value={googleAnalytics}
                  onChange={(e) => setGoogleAnalytics(e.target.value.toUpperCase())}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">Formato: G-XXXXXXXXXX</p>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">Suggerimenti</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Il Facebook Pixel ti permette di tracciare le conversioni da Meta Ads</li>
                  <li>• Google Analytics ti dà insight dettagliati sul comportamento dei visitatori</li>
                  <li>• I codici verranno caricati automaticamente su tutte le pagine pubbliche</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={!validations.isValid || saving}
            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-cyan-400 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvataggio...
              </>
            ) : (
              'Salva Impostazioni'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente wrapper per esportazione con Leads Modal
const LandingPageEditorWithLeads = () => {
  return <LandingPageEditor />;
};

export default LandingPageEditor;
