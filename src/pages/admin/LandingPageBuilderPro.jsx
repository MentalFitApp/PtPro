import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getLandingPage,
  updateLandingPage,
  createLandingPage,
  DEFAULT_BLOCKS,
} from '../../services/landingPageService';
import GrapesEditor from '../../components/landing/GrapesEditor';
import NovelLandingEditor from '../../components/landing/NovelLandingEditor';
import { Sparkles, Layout, Wand2 } from 'lucide-react';

/**
 * Converte i vecchi blocchi in HTML per il nuovo editor
 */
const convertBlocksToHtml = (blocks) => {
  if (!blocks || blocks.length === 0) return '';
  
  return blocks.map(block => {
    const { type, settings } = block;
    
    switch (type) {
      case 'hero':
        return `
          <section class="relative min-h-[600px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden py-20">
            ${settings?.backgroundImage ? `<div class="absolute inset-0 bg-[url('${settings.backgroundImage}')] bg-cover bg-center opacity-30"></div>` : ''}
            <div class="relative z-10 container mx-auto px-6 text-center">
              <h1 class="text-5xl md:text-6xl font-black text-white mb-6">${settings?.title || 'Titolo Hero'}</h1>
              <p class="text-xl text-slate-300 max-w-2xl mx-auto mb-10">${settings?.subtitle || 'Sottotitolo'}</p>
              ${settings?.ctaText ? `<a href="${settings?.ctaLink || '#'}" class="inline-block px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold rounded-xl hover:shadow-2xl transition-all">${settings.ctaText}</a>` : ''}
            </div>
          </section>
        `;
      
      case 'services':
        const services = settings?.services || [];
        return `
          <section class="py-20 bg-slate-900">
            <div class="container mx-auto px-6">
              <h2 class="text-4xl font-bold text-white text-center mb-4">${settings?.title || 'I Miei Servizi'}</h2>
              <p class="text-slate-400 text-center max-w-2xl mx-auto mb-16">${settings?.subtitle || ''}</p>
              <div class="grid md:grid-cols-3 gap-8">
                ${services.map(s => `
                  <div class="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700/50">
                    <div class="text-4xl mb-4">${s.icon || '💪'}</div>
                    <h3 class="text-xl font-bold text-white mb-3">${s.title || 'Servizio'}</h3>
                    <p class="text-slate-400">${s.description || ''}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;
      
      case 'pricing':
        const plans = settings?.plans || [];
        return `
          <section class="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
            <div class="container mx-auto px-6">
              <h2 class="text-4xl font-bold text-white text-center mb-16">${settings?.title || 'Prezzi'}</h2>
              <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                ${plans.map((p, i) => `
                  <div class="${i === 1 ? 'bg-sky-500/20 border-2 border-sky-500/50' : 'bg-slate-800/50 border border-slate-700/50'} rounded-2xl p-8">
                    <h3 class="text-lg font-semibold ${i === 1 ? 'text-sky-400' : 'text-slate-400'} mb-2">${p.name || 'Piano'}</h3>
                    <div class="text-4xl font-black text-white mb-6">€${p.price || '0'}<span class="text-lg text-slate-400">/mese</span></div>
                    <ul class="space-y-3 mb-8">
                      ${(p.features || []).map(f => `<li class="flex items-center text-slate-300"><span class="text-emerald-400 mr-2">✓</span>${f}</li>`).join('')}
                    </ul>
                    <a href="#" class="block w-full py-3 text-center ${i === 1 ? 'bg-gradient-to-r from-sky-500 to-cyan-400' : 'bg-slate-700'} text-white rounded-xl">Scegli</a>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;
      
      case 'testimonials':
        const testimonials = settings?.testimonials || [];
        return `
          <section class="py-20 bg-slate-900">
            <div class="container mx-auto px-6">
              <h2 class="text-4xl font-bold text-white text-center mb-16">${settings?.title || 'Testimonianze'}</h2>
              <div class="grid md:grid-cols-3 gap-8">
                ${testimonials.map(t => `
                  <div class="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                    <div class="flex items-center gap-4 mb-6">
                      ${t.image ? `<img src="${t.image}" class="w-14 h-14 rounded-full object-cover">` : '<div class="w-14 h-14 rounded-full bg-slate-700"></div>'}
                      <div>
                        <h4 class="font-bold text-white">${t.name || 'Cliente'}</h4>
                        <p class="text-sm text-slate-400">${t.role || ''}</p>
                      </div>
                    </div>
                    <p class="text-slate-300 italic">"${t.text || ''}"</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;
      
      case 'cta':
        return `
          <section class="py-20 bg-gradient-to-r from-sky-600 to-cyan-500">
            <div class="container mx-auto px-6 text-center">
              <h2 class="text-4xl font-black text-white mb-6">${settings?.title || 'Pronto a Iniziare?'}</h2>
              <p class="text-xl text-white/90 max-w-2xl mx-auto mb-10">${settings?.subtitle || ''}</p>
              <a href="${settings?.ctaLink || '#'}" class="inline-block px-10 py-5 bg-white text-sky-600 font-bold text-lg rounded-xl hover:shadow-2xl transition-all">${settings?.ctaText || 'Inizia Ora'}</a>
            </div>
          </section>
        `;
      
      case 'contact':
      case 'form':
        return `
          <section class="py-20 bg-slate-900">
            <div class="container mx-auto px-6 max-w-2xl">
              <h2 class="text-4xl font-bold text-white text-center mb-4">${settings?.title || 'Contattami'}</h2>
              <p class="text-slate-400 text-center mb-12">${settings?.subtitle || ''}</p>
              <form class="space-y-6">
                <div class="grid md:grid-cols-2 gap-6">
                  <input type="text" placeholder="Nome" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white">
                  <input type="email" placeholder="Email" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white">
                </div>
                <input type="tel" placeholder="Telefono" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white">
                <textarea rows="4" placeholder="Messaggio" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white resize-none"></textarea>
                <button type="submit" class="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold rounded-xl">Invia</button>
              </form>
            </div>
          </section>
        `;
      
      case 'about':
        return `
          <section class="py-20 bg-slate-900">
            <div class="container mx-auto px-6">
              <div class="grid md:grid-cols-2 gap-12 items-center">
                ${settings?.image ? `<img src="${settings.image}" class="rounded-2xl shadow-2xl">` : '<div class="bg-slate-800 rounded-2xl h-96"></div>'}
                <div>
                  <h2 class="text-4xl font-bold text-white mb-6">${settings?.title || 'Chi Sono'}</h2>
                  <p class="text-slate-300 text-lg leading-relaxed">${settings?.text || ''}</p>
                </div>
              </div>
            </div>
          </section>
        `;
      
      default:
        return `
          <section class="py-16 bg-slate-900">
            <div class="container mx-auto px-6 text-center">
              <p class="text-slate-400">Blocco: ${type}</p>
            </div>
          </section>
        `;
    }
  }).join('\n');
};

/**
 * LandingPageBuilderPro - Editor avanzato con scelta tra GrapesJS e Novel
 * - GrapesJS: Drag & drop completo per utenti esperti
 * - Novel: Editor Notion-style con AI per utenti semplici
 */
const LandingPageBuilderPro = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const toast = useToast();

  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialContent, setInitialContent] = useState('');
  const [editorType, setEditorType] = useState(null); // 'grapes' | 'novel'
  const [showEditorChoice, setShowEditorChoice] = useState(false);

  const isNewPage = !pageId || pageId === 'new';

  // Carica la landing page
  useEffect(() => {
    const loadPage = async () => {
      if (!tenantId) return;

      setIsLoading(true);

      try {
        if (isNewPage) {
          // Per nuova pagina, mostra scelta editor
          setShowEditorChoice(true);
          setIsLoading(false);
        } else {
          // Carica pagina esistente
          const pageData = await getLandingPage(tenantId, pageId);
          setPage(pageData);

          // Determina editor type dalla pagina salvata
          if (pageData.editorType === 'novel') {
            setEditorType('novel');
            setInitialContent(pageData.novelContent || '');
          } else if (pageData.grapesData?.html) {
            setEditorType('grapes');
            setInitialContent(pageData.grapesData.html);
          } else if (pageData.blocks && pageData.blocks.length > 0) {
            // Converti vecchi blocchi in HTML
            console.log('🔄 Conversione blocchi vecchi in HTML...');
            const convertedHtml = convertBlocksToHtml(pageData.blocks);
            setInitialContent(convertedHtml);
            setEditorType('grapes');
            toast?.showToast?.('Pagina convertita nel nuovo formato', 'info');
          } else {
            // Nessun contenuto, mostra scelta editor
            setShowEditorChoice(true);
          }

          setIsLoading(false);
        }
      } catch (error) {
        console.error('Errore caricamento pagina:', error);
        toast?.showToast?.('Errore nel caricamento della pagina', 'error');
        navigate('/admin/landing-pages');
      }
    };

    loadPage();
  }, [pageId, tenantId, isNewPage, navigate]);

  // Crea nuova pagina con l'editor scelto
  const handleCreateWithEditor = async (type) => {
    setEditorType(type);
    setShowEditorChoice(false);
    setIsLoading(true);

    try {
      const newPage = await createLandingPage(tenantId, {
        title: 'Nuova Landing Page',
        description: '',
        template: type,
        editorType: type,
        blocks: [],
        grapesData: type === 'grapes' ? { html: '', css: '', components: '' } : null,
        novelContent: type === 'novel' ? '' : null,
      });
      navigate(`/admin/landing-pages/${newPage.id}/edit`, { replace: true });
    } catch (error) {
      console.error('Errore creazione pagina:', error);
      toast?.showToast?.('Errore nella creazione', 'error');
      setShowEditorChoice(true);
      setIsLoading(false);
    }
  };

  // Salva la pagina (GrapesJS)
  const handleSave = async (data) => {
    if (!page) return;

    try {
      await updateLandingPage(tenantId, pageId, {
        grapesData: {
          html: data.html,
          css: data.css,
          components: data.components,
          fullHtml: data.fullHtml,
        },
        editorType: 'grapes',
        blocks: [],
        updatedAt: new Date().toISOString(),
      });

      toast?.showToast?.('Modifiche salvate!', 'success');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast?.showToast?.('Errore nel salvataggio', 'error');
    }
  };

  // Salva la pagina (Novel)
  const handleSaveNovel = async (data) => {
    if (!page) return;

    try {
      await updateLandingPage(tenantId, pageId, {
        novelContent: data.content,
        novelHtml: data.html,
        novelPalette: data.palette,
        editorType: 'novel',
        blocks: [],
        updatedAt: new Date().toISOString(),
      });

      toast?.showToast?.('Modifiche salvate!', 'success');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast?.showToast?.('Errore nel salvataggio', 'error');
    }
  };

  // Pubblica la pagina
  const handlePublish = async (data) => {
    if (!page) return;

    try {
      await updateLandingPage(tenantId, pageId, {
        grapesData: {
          html: data.html,
          css: data.css,
          components: data.components,
          fullHtml: data.fullHtml,
        },
        blocks: [],
        isPublished: true,
        status: 'published',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setPage(prev => ({ ...prev, isPublished: true, status: 'published' }));
      toast?.showToast?.('Pagina pubblicata! 🎉', 'success');
    } catch (error) {
      console.error('Errore pubblicazione:', error);
      toast?.showToast?.('Errore nella pubblicazione', 'error');
    }
  };

  // Aggiorna le impostazioni della pagina (titolo, slug, SEO, tracking)
  const handleUpdateSettings = async (settings) => {
    if (!page) return;

    try {
      await updateLandingPage(tenantId, pageId, {
        ...settings,
        updatedAt: new Date().toISOString(),
      });

      setPage(prev => ({ ...prev, ...settings }));
      toast?.showToast?.('Impostazioni salvate!', 'success');
    } catch (error) {
      console.error('Errore salvataggio impostazioni:', error);
      toast?.showToast?.('Errore nel salvataggio', 'error');
    }
  };

  const handleBack = () => {
    navigate('/admin/landing-pages');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
          <p className="text-slate-400">Caricamento editor...</p>
        </div>
      </div>
    );
  }

  // Schermata scelta editor
  if (showEditorChoice) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Scegli il tuo Editor</h1>
            <p className="text-slate-400">Come preferisci creare la tua landing page?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Novel - Simple */}
            <button
              onClick={() => handleCreateWithEditor('novel')}
              className="p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 hover:border-purple-400 rounded-2xl text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Wand2 className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Novel AI</h3>
                  <span className="text-xs text-purple-400 font-medium">CONSIGLIATO</span>
                </div>
              </div>
              <p className="text-slate-300 mb-4">
                Editor semplice stile Notion con AI integrata. Scrivi contenuti e l'AI ti aiuta.
              </p>
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Facile da usare
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> AI autocompletamento
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Template pronti
                </li>
              </ul>
            </button>

            {/* GrapesJS - Advanced */}
            <button
              onClick={() => handleCreateWithEditor('grapes')}
              className="p-8 bg-slate-800/50 border-2 border-slate-600 hover:border-slate-500 rounded-2xl text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-slate-700 rounded-xl">
                  <Layout className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">GrapesJS Pro</h3>
                  <span className="text-xs text-slate-500 font-medium">AVANZATO</span>
                </div>
              </div>
              <p className="text-slate-300 mb-4">
                Editor drag & drop completo. Massimo controllo su layout e design.
              </p>
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Drag & drop
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Blocchi personalizzati
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> CSS avanzato
                </li>
              </ul>
            </button>
          </div>

          <button
            onClick={handleBack}
            className="mt-8 mx-auto block text-slate-400 hover:text-white transition-colors"
          >
            ← Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  // Editor Novel
  if (editorType === 'novel') {
    return (
      <NovelLandingEditor
        initialContent={page?.novelContent || initialContent}
        onSave={handleSaveNovel}
        onBack={handleBack}
        landingPage={page}
      />
    );
  }

  // Editor GrapesJS (default)
  return (
    <GrapesEditor
      initialContent={initialContent}
      onSave={handleSave}
      onPublish={handlePublish}
      onUpdateSettings={handleUpdateSettings}
      page={page}
      pageTitle={page?.title || 'Landing Page'}
      isPublished={page?.isPublished || page?.status === 'published'}
      onBack={handleBack}
      tenantId={tenantId}
      pageId={pageId}
    />
  );
};

export default LandingPageBuilderPro;