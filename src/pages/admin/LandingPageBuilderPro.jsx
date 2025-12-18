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
 * LandingPageBuilderPro - Editor avanzato con GrapesJS
 * Full-screen, drag & drop, ridimensionamento blocchi
 * Include: AI Generator, AI Assistant, Leads, Settings
 */
const LandingPageBuilderPro = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const toast = useToast();

  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialContent, setInitialContent] = useState('');

  const isNewPage = !pageId || pageId === 'new';

  // Carica la landing page
  useEffect(() => {
    const loadPage = async () => {
      if (!tenantId) return;

      setIsLoading(true);

      try {
        if (isNewPage) {
          // Crea nuova pagina
          const newPage = await createLandingPage(tenantId, {
            title: 'Nuova Landing Page',
            description: '',
            template: 'grapes',
            blocks: [],
            grapesData: {
              html: '',
              css: '',
              components: '',
            },
          });
          navigate(`/admin/landing-pages/${newPage.id}/edit`, { replace: true });
        } else {
          // Carica pagina esistente
          const pageData = await getLandingPage(tenantId, pageId);
          setPage(pageData);

          // Se ha dati GrapesJS, usa quelli
          if (pageData.grapesData?.html) {
            setInitialContent(pageData.grapesData.html);
          } else if (pageData.blocks && pageData.blocks.length > 0) {
            // Converti vecchi blocchi in HTML
            console.log('🔄 Conversione blocchi vecchi in HTML...');
            const convertedHtml = convertBlocksToHtml(pageData.blocks);
            setInitialContent(convertedHtml);
            toast?.showToast?.('Pagina convertita nel nuovo formato', 'info');
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

  // Salva la pagina
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