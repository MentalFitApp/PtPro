import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getLandingPage,
  updateLandingPage,
  createLandingPage,
} from '../../services/landingPageService';
import NovelLandingEditor from '../../components/landing/NovelLandingEditor';

/**
 * LandingPageBuilderPro - Editor Landing Page con AI
 * Usa NovelLandingEditor per editing semplice con AI integrata
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
          // Per nuova pagina, crea direttamente
          const newPage = await createLandingPage(tenantId, {
            title: 'Nuova Landing Page',
            description: '',
            template: 'novel',
            editorType: 'novel',
            blocks: [],
            novelContent: '',
          });
          navigate(`/admin/landing-pages/${newPage.id}/edit`, { replace: true });
          return;
        }
        
        // Carica pagina esistente
        const pageData = await getLandingPage(tenantId, pageId);
        setPage(pageData);
        
        // Carica contenuto esistente
        if (pageData.novelContent) {
          setInitialContent(pageData.novelContent);
        } else if (pageData.grapesData?.html) {
          // Converti HTML esistente in testo semplice (fallback)
          setInitialContent('# La tua Landing Page\n\nModifica questo contenuto con l\'editor.');
        }

        setIsLoading(false);
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

  const handleBack = () => {
    navigate('/admin/landing-pages');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Caricamento editor...</p>
        </div>
      </div>
    );
  }

  return (
    <NovelLandingEditor
      initialContent={page?.novelContent || initialContent}
      onSave={handleSave}
      onBack={handleBack}
      landingPage={page}
    />
  );
};

export default LandingPageBuilderPro;
