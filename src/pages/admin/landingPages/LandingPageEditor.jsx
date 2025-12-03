// src/pages/admin/landingPages/LandingPageEditor.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { getTenantDoc } from '../../../config/tenant';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, EyeOff, Wand2, Plus, Loader2, ExternalLink, Smartphone, Monitor, Settings
} from 'lucide-react';
import SectionEditorCard from './components/SectionEditorCard';
import SectionPropertiesEditor from './components/SectionPropertiesEditor';
import SectionLibraryModal from './components/SectionLibraryModal';
import AIAssistantModal from './components/AIAssistantModal';
import AdvancedFeaturesModal from './components/AdvancedFeaturesModal';

export default function LandingPageEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [page, setPage] = useState({
    title: '',
    slug: '',
    status: 'draft',
    sections: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      ogImage: ''
    },
    globalSettings: {
      primaryColor: '#3b82f6',
      fontFamily: 'Inter',
      buttonStyle: 'rounded'
    }
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadPage();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadPage = async () => {
    try {
      const { getDoc } = await import('firebase/firestore');
      const pageDocRef = getTenantDoc(db, 'landingPages', id);
      const pageDoc = await getDoc(pageDocRef);
      
      if (pageDoc.exists()) {
        const pageData = pageDoc.data();
        
        // Assicuriamoci che tutte le sezioni abbiano props e ID unici
        if (pageData.sections) {
          pageData.sections = pageData.sections.map((section, idx) => ({
            ...section,
            id: section.id || `section-${Date.now()}-${idx}`, // Genera ID se mancante
            props: section.props || {}
          }));
        }
        
        setPage(pageData);
      } else {
        alert('Pagina non trovata');
        navigate('/landing-pages');
      }
    } catch (error) {
      console.error('Load error:', error);
      alert('Errore caricamento pagina: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!page.title || !page.slug) {
      alert('Titolo e slug sono obbligatori');
      return;
    }

    setSaving(true);
    try {
      const tenantId = localStorage.getItem('tenantId');
      const pageRef = doc(db, `tenants/${tenantId}/landingPages`, page.slug);
      
      await setDoc(pageRef, {
        ...page,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      }, { merge: true });

      alert('Pagina salvata!');
      if (id === 'new') {
        navigate(`/landing-pages/${page.slug}/edit`, { replace: true });
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Errore salvataggio: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = (newSection) => {
    // Assicuriamoci che la sezione abbia props e ID unico
    const sectionWithPropsAndId = {
      ...newSection,
      id: newSection.id || `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      props: newSection.props || {}
    };
    
    setPage(prev => ({
      ...prev,
      sections: [...prev.sections, sectionWithPropsAndId]
    }));
  };

  const handleUpdateSection = (sectionId, updates) => {
    setPage(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, props: { ...s.props, ...updates } } : s
      )
    }));
  };

  const handleDeleteSection = (sectionId) => {
    if (!confirm('Eliminare questa sezione?')) return;
    setPage(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
  };

  const handleMoveSection = (sectionId, direction) => {
    const index = page.sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= page.sections.length) return;

    const newSections = [...page.sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    setPage(prev => ({ ...prev, sections: newSections }));
  };

  const handleAIGenerate = (newSections) => {
    setPage(prev => ({
      ...prev,
      sections: [...prev.sections, ...newSections]
    }));
  };

  const renderEmptyState = () => (
    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto">
          <Plus size={32} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Pagina Vuota</h3>
        <p className="text-slate-400">
          Inizia aggiungendo sezioni o usa l'AI per generarle automaticamente
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setShowLibrary(true)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Aggiungi Sezione
          </button>
          <button
            onClick={() => setShowAIModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
          >
            Usa AI Assistant
          </button>
        </div>
      </div>
    </div>
  );

  const renderSections = (forcePreview = false) => (
    <div className={forcePreview ? "space-y-0" : "space-y-4"}>
      <AnimatePresence>
        {page.sections.map((section, index) => (
          <SectionEditorCard
            key={section.id}
            section={section}
            index={index}
            totalSections={page.sections.length}
            onUpdate={(updates) => handleUpdateSection(section.id, updates)}
            onDelete={() => handleDeleteSection(section.id)}
            onMoveUp={() => handleMoveSection(section.id, 'up')}
            onMoveDown={() => handleMoveSection(section.id, 'down')}
            onEdit={() => setEditingSection(section)}
            previewMode={forcePreview || previewMode}
          />
        ))}
      </AnimatePresence>

      {!forcePreview && (
        <button
          onClick={() => setShowLibrary(true)}
          className="w-full p-8 bg-slate-800/40 hover:bg-slate-800/60 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-blue-400"
        >
          <Plus size={24} />
          <span className="font-medium">Aggiungi Sezione</span>
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Toolbar */}
      <div className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate('/landing-pages')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            
            <input
              value={page.title}
              onChange={(e) => setPage(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titolo Pagina"
              className="flex-1 min-w-0 px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            <div className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
              page.status === 'published' ? 'bg-green-500/20 text-green-400' :
              page.status === 'archived' ? 'bg-slate-500/20 text-slate-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {page.status === 'published' ? 'Pubblicata' : page.status === 'archived' ? 'Archiviata' : 'Bozza'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAdvancedModal(true)}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="Funzionalità Avanzate"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={() => setShowAIModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Wand2 size={18} />
              <span className="hidden md:inline">AI Assistant</span>
              <span className="md:hidden">AI</span>
            </button>

            {/* Toggle Desktop/Mobile Preview */}
            <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setMobilePreview(false)}
                className={`p-2 rounded transition-colors ${
                  !mobilePreview ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop"
              >
                <Monitor size={18} />
              </button>
              <button
                onClick={() => setMobilePreview(true)}
                className={`p-2 rounded transition-colors ${
                  mobilePreview ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile"
              >
                <Smartphone size={18} />
              </button>
            </div>

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`p-2 rounded-lg transition-colors ${
                previewMode ? 'bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title={previewMode ? 'Modalità Editor' : 'Modalità Anteprima'}
            >
              {previewMode ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            {page.status === 'published' && (
              <button
                onClick={async () => {
                  const tenantDoc = await getTenantDoc();
                  const tenantSlug = tenantDoc?.slug || 'demo';
                  window.open(`/site/${tenantSlug}/${page.slug}`, '_blank');
                }}
                className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                title="Visualizza Pubblica"
              >
                <ExternalLink size={20} />
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span className="hidden sm:inline">{saving ? 'Salvataggio...' : 'Salva'}</span>
            </button>
          </div>
        </div>

        {/* Settings Bar */}
        <div className="max-w-screen-2xl mx-auto px-6 py-3 border-t border-slate-700/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Slug:</span>
            <input
              value={page.slug}
              onChange={(e) => setPage(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              placeholder="pagina-esempio"
              className="px-3 py-1.5 bg-slate-900/70 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Stato:</span>
            <select
              value={page.status}
              onChange={(e) => setPage(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-1.5 bg-slate-900/70 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="draft">Bozza</option>
              <option value="published">Pubblicata</option>
              <option value="archived">Archiviata</option>
            </select>
          </div>

          {page.slug && page.status === 'published' && (
            <a
              href={`/site/${localStorage.getItem('tenantId')}/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
            >
              <ExternalLink size={14} />
              Visualizza Live
            </a>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-6">
        {mobilePreview ? (
          /* Mobile Preview Mode - Full Screen */
          <div className="flex flex-col items-center w-full">
            {/* Mobile Frame Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="text-sm text-slate-400">📱 Anteprima Mobile (375x667)</div>
              <button
                onClick={() => setMobilePreview(false)}
                className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
              >
                ← Torna all'Editor
              </button>
            </div>
            
            {/* iPhone Frame */}
            <div 
              className="bg-slate-950 rounded-[2.5rem] p-4 shadow-2xl border-8 border-slate-800"
              style={{ width: '395px', minHeight: '700px', maxHeight: '80vh' }}
            >
              <div 
                className="bg-white rounded-[1.5rem] w-full h-full overflow-y-auto"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#475569 #1e293b'
                }}
              >
                {/* Mobile Content */}
                <div className="min-h-full bg-slate-900">
                  {page.sections.length === 0 ? renderEmptyState() : renderSections(true)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Editor Mode - Grid Layout */
          <div className="grid grid-cols-12 gap-6">
            {/* Canvas */}
            <div className="col-span-9">
              {page.sections.length === 0 ? renderEmptyState() : renderSections()}
            </div>

            {/* Sidebar */}
            <div className="col-span-3">
              <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-4 sticky top-32">
                {editingSection && editingSection.id && editingSection.props ? (
                  <SectionPropertiesEditor
                    section={editingSection}
                    onUpdate={(updates) => {
                      if (!editingSection || !editingSection.id) return;
                      handleUpdateSection(editingSection.id, updates);
                      setEditingSection(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          props: { ...prev.props, ...updates }
                        };
                      });
                    }}
                    onClose={() => setEditingSection(null)}
                  />
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">Seleziona una sezione per modificarne le proprietà</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showLibrary && (
        <SectionLibraryModal
          onSelect={handleAddSection}
          onClose={() => setShowLibrary(false)}
        />
      )}

      {showAIModal && (
        <AIAssistantModal
          onGenerate={handleAIGenerate}
          onClose={() => setShowAIModal(false)}
        />
      )}

      {showAdvancedModal && (
        <AdvancedFeaturesModal
          isOpen={showAdvancedModal}
          onClose={() => setShowAdvancedModal(false)}
          page={page}
          onUpdate={(updates) => {
            setPage(prev => ({ ...prev, ...updates }));
            setShowAdvancedModal(false);
          }}
        />
      )}
    </div>
  );
}
