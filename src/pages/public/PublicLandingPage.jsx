import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { DynamicBlock } from '../../components/landingBlocks';
import { X } from 'lucide-react';

/**
 * PublicLandingPage - Renderizza una landing page pubblica con il nuovo sistema di blocchi
 */
export default function PublicLandingPage() {
  const { tenantSlug, slug } = useParams();
  const [page, setPage] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Exit Intent
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);

  useEffect(() => {
    loadPage();
  }, [tenantSlug, slug]);

  // Track page view
  useEffect(() => {
    if (page?.id && tenantId) {
      trackPageView();
    }
  }, [page?.id, tenantId]);

  // Exit Intent Detection
  useEffect(() => {
    if (!page?.settings?.exitIntent?.enabled || exitIntentShown) return;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !exitIntentShown) {
        setShowExitIntent(true);
        setExitIntentShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [page, exitIntentShown]);

  const loadPage = async () => {
    try {
      // 1. Trova tenant tramite siteSlug o direttamente per ID
      let foundTenantId = null;
      
      // Prima prova a cercare per siteSlug
      const tenantsRef = collection(db, 'tenants');
      const tenantQuery = query(tenantsRef, where('siteSlug', '==', tenantSlug));
      const tenantSnap = await getDocs(tenantQuery);
      
      if (!tenantSnap.empty) {
        foundTenantId = tenantSnap.docs[0].id;
      } else {
        // Fallback: potrebbe essere direttamente l'ID del tenant
        // Verifica che il documento esista
        const tenantDocRef = doc(db, 'tenants', tenantSlug);
        const tenantDocSnap = await getDoc(tenantDocRef);
        
        if (tenantDocSnap.exists()) {
          foundTenantId = tenantSlug;
        }
      }
      
      if (!foundTenantId) {
        setError('Tenant non trovato');
        setLoading(false);
        return;
      }
      
      setTenantId(foundTenantId);
      
      // 2. Carica landing page - prova prima con nuovo sistema, poi vecchio
      let pageData = null;
      
      // Prova nuovo sistema (landing_pages)
      const newPagesRef = collection(db, `tenants/${foundTenantId}/landing_pages`);
      const newPageQuery = query(
        newPagesRef, 
        where('slug', '==', slug),
        where('isPublished', '==', true)
      );
      const newPageSnap = await getDocs(newPageQuery);
      
      if (!newPageSnap.empty) {
        pageData = { id: newPageSnap.docs[0].id, ...newPageSnap.docs[0].data(), isNewSystem: true };
      } else {
        // Fallback al vecchio sistema (landingPages)
        const oldPagesRef = collection(db, `tenants/${foundTenantId}/landingPages`);
        const oldPageQuery = query(
          oldPagesRef, 
          where('slug', '==', slug),
          where('status', '==', 'published')
        );
        const oldPageSnap = await getDocs(oldPageQuery);
        
        if (!oldPageSnap.empty) {
          pageData = { id: oldPageSnap.docs[0].id, ...oldPageSnap.docs[0].data(), isNewSystem: false };
        }
      }
      
      if (!pageData) {
        setError('Pagina non trovata o non pubblicata');
        setLoading(false);
        return;
      }
      
      setPage(pageData);
      
      // 3. Imposta SEO meta tags
      if (pageData.seo?.title || pageData.seoTitle) {
        document.title = pageData.seo?.title || pageData.seoTitle;
      }
      if (pageData.seo?.description || pageData.seoDescription) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', pageData.seo?.description || pageData.seoDescription);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Load page error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const trackPageView = async () => {
    try {
      const pageRef = doc(db, `tenants/${tenantId}/${page.isNewSystem ? 'landing_pages' : 'landingPages'}/${page.id}`);
      await updateDoc(pageRef, {
        'analytics.views': increment(1),
        'analytics.lastViewedAt': new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error tracking page view:', err);
    }
  };

  const trackConversion = async () => {
    if (!page?.id || !tenantId) return;
    
    try {
      const pageRef = doc(db, `tenants/${tenantId}/${page.isNewSystem ? 'landing_pages' : 'landingPages'}/${page.id}`);
      await updateDoc(pageRef, {
        'analytics.conversions': increment(1),
      });
    } catch (err) {
      console.error('Error tracking conversion:', err);
    }
  };

  // Render nuovo sistema di blocchi
  const renderNewBlocks = () => {
    if (!page?.blocks || page.blocks.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <p className="text-slate-400">Nessun contenuto disponibile</p>
        </div>
      );
    }

    return (
      <div className="bg-slate-900 min-h-screen">
        {page.blocks.map((block, index) => (
          <DynamicBlock
            key={block.id || index}
            block={block}
            isPreview={false}
            tenantId={tenantId}
            onConversion={trackConversion}
          />
        ))}
      </div>
    );
  };

  // Render vecchio sistema per retrocompatibilità
  const renderOldSections = () => {
    if (!page?.sections || page.sections.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <p className="text-slate-400">Nessun contenuto disponibile</p>
        </div>
      );
    }

    return (
      <div className="bg-slate-900 min-h-screen">
        {page.sections.map((section, index) => (
          <LegacySection
            key={section.id || index}
            section={section}
            index={index}
            tenantId={tenantId}
            pageId={page.id}
            onConversion={trackConversion}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Pagina non disponibile</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      {page?.isNewSystem ? renderNewBlocks() : renderOldSections()}

      {/* Exit Intent Popup */}
      <AnimatePresence>
        {showExitIntent && page?.settings?.exitIntent?.enabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4"
            onClick={() => setShowExitIntent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center relative"
            >
              <button
                onClick={() => setShowExitIntent(false)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
              
              <div className="text-5xl mb-4">
                {page.settings.exitIntent.icon || '🎁'}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {page.settings.exitIntent.title || 'Aspetta!'}
              </h3>
              <p className="text-slate-300 mb-6">
                {page.settings.exitIntent.message || 'Non perdere questa occasione speciale!'}
              </p>
              {page.settings.exitIntent.ctaText && (
                <a
                  href={page.settings.exitIntent.ctaLink || '#form'}
                  onClick={() => {
                    setShowExitIntent(false);
                    trackConversion();
                  }}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-cyan-600 transition-all"
                >
                  {page.settings.exitIntent.ctaText}
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * LegacySection - Componente per retrocompatibilità con vecchie landing pages
 */
const LegacySection = ({ section, index, tenantId, pageId, onConversion }) => {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const collectionName = section.formCollection || 'formSubmissions';
      const submissionsRef = collection(db, `tenants/${tenantId}/${collectionName}`);
      
      await addDoc(submissionsRef, {
        ...formData,
        landingPageId: pageId,
        sectionId: section.id,
        submittedAt: new Date().toISOString(),
      });
      
      setSubmitSuccess(true);
      setFormData({});
      onConversion?.();
    } catch (err) {
      console.error('Form submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  switch (section.type) {
    case 'hero':
      return (
        <section 
          className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"
          style={{ backgroundColor: section.backgroundColor }}
        >
          {section.backgroundImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${section.backgroundImage})` }}
            />
          )}
          <div className="relative z-10 container mx-auto px-6 text-center">
            {section.badge && (
              <div className="inline-block px-4 py-2 bg-sky-500/20 text-sky-300 rounded-full text-sm mb-6">
                {section.badge}
              </div>
            )}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              {section.title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-slate-300 max-w-3xl mx-auto">
              {section.subtitle}
            </p>
            {section.primaryCTA && (
              <a
                href={section.primaryCTA.url || '#form'}
                className="inline-block px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-lg font-semibold text-lg hover:from-sky-600 hover:to-cyan-600 transition-all"
              >
                {section.primaryCTA.label}
              </a>
            )}
          </div>
        </section>
      );

    case 'features':
      return (
        <section className="py-20 bg-slate-800">
          <div className="container mx-auto px-6">
            {section.title && (
              <h2 className="text-4xl font-bold text-center mb-4 text-white">
                {section.title}
              </h2>
            )}
            {section.subtitle && (
              <p className="text-xl text-center mb-12 text-slate-300 max-w-3xl mx-auto">
                {section.subtitle}
              </p>
            )}
            <div className="grid md:grid-cols-3 gap-8">
              {section.features?.map((feature, idx) => (
                <div key={idx} className="bg-slate-700/50 p-8 rounded-xl backdrop-blur-sm">
                  {feature.icon && (
                    <div className="text-4xl mb-4">{feature.icon}</div>
                  )}
                  <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-slate-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'contactForm':
      return (
        <section id="form" className="py-20 bg-slate-900">
          <div className="container mx-auto px-6 max-w-2xl">
            {section.title && (
              <h2 className="text-4xl font-bold text-center mb-4 text-white">
                {section.title}
              </h2>
            )}
            {section.subtitle && (
              <p className="text-xl text-center mb-12 text-slate-300">
                {section.subtitle}
              </p>
            )}
            
            {submitSuccess ? (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {section.successMessage || 'Grazie!'}
                </h3>
                <p className="text-slate-300">Ti contatteremo presto.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {section.fields?.map((field, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium mb-2 text-slate-200">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Invio in corso...' : (section.submitLabel || 'Invia')}
                </button>
              </form>
            )}
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section className="py-20 bg-slate-800">
          <div className="container mx-auto px-6">
            {section.title && (
              <h2 className="text-4xl font-bold text-center mb-12 text-white">
                {section.title}
              </h2>
            )}
            <div className="grid md:grid-cols-3 gap-8">
              {section.testimonials?.map((testimonial, idx) => (
                <div key={idx} className="bg-slate-700/50 p-8 rounded-xl">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </div>
                  <p className="text-slate-300 mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.avatar && (
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                    )}
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      {testimonial.role && (
                        <p className="text-sm text-slate-400">{testimonial.role}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
};
