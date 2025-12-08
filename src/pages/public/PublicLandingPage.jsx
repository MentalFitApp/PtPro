import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadToR2 } from '../../cloudflareStorage';
import { Play, Upload, CheckCircle, XCircle } from 'lucide-react';
import CountdownTimer from '../admin/landingPages/components/CountdownTimer';
import { useToast } from '../../contexts/ToastContext';

export default function PublicLandingPage() {
  const { tenantSlug, slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Video upload states
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoSuccess, setVideoSuccess] = useState(false);

  // Advanced features states
  const [timerComplete, setTimerComplete] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);

  useEffect(() => {
    loadPage();
  }, [tenantSlug, slug]);

  // Exit Intent Detection
  useEffect(() => {
    if (!page?.exitIntentEnabled || exitIntentShown) return;

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
      // 1. Trova tenant tramite slug
      const tenantsRef = collection(db, 'tenants');
      const tenantQuery = query(tenantsRef, where('slug', '==', tenantSlug));
      const tenantSnap = await getDocs(tenantQuery);
      
      if (tenantSnap.empty) {
        setError('Tenant non trovato');
        setLoading(false);
        return;
      }
      
      const foundTenantId = tenantSnap.docs[0].id;
      setTenantId(foundTenantId);
      
      // 2. Carica landing page
      const pagesRef = collection(db, `tenants/${foundTenantId}/landingPages`);
      const pageQuery = query(
        pagesRef, 
        where('slug', '==', slug),
        where('status', '==', 'published')
      );
      const pageSnap = await getDocs(pageQuery);
      
      if (pageSnap.empty) {
        setError('Pagina non trovata o non pubblicata');
        setLoading(false);
        return;
      }
      
      const pageData = { id: pageSnap.docs[0].id, ...pageSnap.docs[0].data() };
      setPage(pageData);
      
      // 3. Imposta SEO meta tags
      if (pageData.seoTitle) {
        document.title = pageData.seoTitle;
      }
      if (pageData.seoDescription) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', pageData.seoDescription);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Load page error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleScroll = (targetId) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLink = (url, openInNewTab) => {
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };

  const handleFormSubmit = async (e, section) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // TODO: Cloud Function per salvataggio + email
      // Per ora salvo direttamente in Firestore
      const collectionName = section.formCollection || 'formSubmissions';
      const submissionsRef = collection(db, `tenants/${tenantId}/${collectionName}`);
      
      await addDoc(submissionsRef, {
        ...formData,
        landingPageId: page.id,
        landingPageSlug: page.slug,
        sectionId: section.id,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      });

      setSubmitSuccess(true);
      setFormData({});
      
      // Redirect dopo successo (se configurato)
      if (section.successRedirect) {
        setTimeout(() => {
          handleLink(section.successRedirect, section.redirectInNewTab);
        }, 2000);
      }
    } catch (err) {
      console.error('Form submit error:', err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVideoUpload = async (file, section) => {
    if (!file) return;
    
    // Valida dimensione (max 1GB)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      toast.error('Il video non può superare 1GB');
      return;
    }

    setUploadingVideo(true);
    setVideoProgress(0);
    setVideoSuccess(false);

    try {
      // Upload a R2
      const path = `clients/${tenantId}/landing-videos/${Date.now()}-${file.name}`;
      const videoUrl = await uploadToR2(file, path, (progress) => {
        setVideoProgress(Math.round(progress));
      });

      // Salva metadata in Firestore
      const videosRef = collection(db, `tenants/${tenantId}/uploadedVideos`);
      await addDoc(videosRef, {
        url: videoUrl,
        fileName: file.name,
        fileSize: file.size,
        landingPageId: page.id,
        sectionId: section.id,
        uploadedAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      setVideoSuccess(true);
      
      // Redirect dopo successo (se configurato)
      if (section.successRedirect) {
        setTimeout(() => {
          handleLink(section.successRedirect, section.redirectInNewTab);
        }, 2000);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      toast.error('Errore durante l\'upload: ' + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCTA = (action) => {
    switch (action.type) {
      case 'scroll':
        handleScroll(action.target);
        break;
      case 'link':
        handleLink(action.url, action.openInNewTab);
        break;
      case 'form':
        handleScroll(action.formSectionId);
        break;
      case 'video':
        handleScroll(action.videoSectionId);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  };

  const renderSection = (section, index) => {
    const sectionId = `section-${index}`;
    
    switch (section.type) {
      case 'hero':
        return (
          <section 
            id={sectionId}
            key={section.id} 
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
                <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-6">
                  {section.badge}
                </div>
              )}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
                {section.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-slate-300 max-w-3xl mx-auto">
                {section.subtitle}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {section.primaryCTA && (
                  <button
                    onClick={() => handleCTA(section.primaryCTA)}
                    className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-lg transition-colors"
                  >
                    {section.primaryCTA.label}
                  </button>
                )}
                {section.secondaryCTA && (
                  <button
                    onClick={() => handleCTA(section.secondaryCTA)}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold text-lg transition-colors backdrop-blur-sm"
                  >
                    {section.secondaryCTA.label}
                  </button>
                )}
              </div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section 
            id={sectionId}
            key={section.id} 
            className="py-20 bg-slate-800"
            style={{ backgroundColor: section.backgroundColor }}
          >
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
          <section 
            id={sectionId}
            key={section.id} 
            className="py-20 bg-slate-900"
            style={{ backgroundColor: section.backgroundColor }}
          >
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
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {section.successMessage || 'Grazie per averci contattato!'}
                  </h3>
                  <p className="text-slate-300">Ti risponderemo al più presto.</p>
                </div>
              ) : (
                <form onSubmit={(e) => handleFormSubmit(e, section)} className="space-y-6">
                  {section.fields?.map((field, idx) => (
                    <div key={idx}>
                      <label className="block text-sm font-medium mb-2 text-slate-200">
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          required={field.required}
                          placeholder={field.placeholder}
                          rows={4}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      ) : (
                        <input
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      )}
                    </div>
                  ))}
                  
                  {submitError && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-300">{submitError}</span>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    {submitting ? 'Invio in corso...' : (section.submitText || 'Invia')}
                  </button>
                </form>
              )}
            </div>
          </section>
        );

      case 'videoUpload':
        return (
          <section 
            id={sectionId}
            key={section.id} 
            className="py-20 bg-slate-800"
            style={{ backgroundColor: section.backgroundColor }}
          >
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
              
              {videoSuccess ? (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {section.successMessage || 'Video caricato con successo!'}
                  </h3>
                  <p className="text-slate-300">Grazie per il tuo contributo.</p>
                </div>
              ) : (
                <div className="bg-slate-700/50 rounded-xl p-8 backdrop-blur-sm">
                  <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center">
                    <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-300 mb-2">
                      {section.instructions || 'Carica il tuo video (max 1GB)'}
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={uploadingVideo}
                      onChange={(e) => handleVideoUpload(e.target.files[0], section)}
                      className="hidden"
                      id={`video-upload-${section.id}`}
                    />
                    <label
                      htmlFor={`video-upload-${section.id}`}
                      className={`inline-block px-8 py-4 mt-4 rounded-lg font-semibold cursor-pointer transition-colors ${
                        uploadingVideo 
                          ? 'bg-slate-600 cursor-not-allowed' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white`}
                    >
                      {uploadingVideo ? `Caricamento ${videoProgress}%...` : 'Scegli Video'}
                    </label>
                  </div>
                  
                  {uploadingVideo && (
                    <div className="mt-6">
                      <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        );

      case 'pricing':
        return (
          <section 
            id={sectionId}
            key={section.id} 
            className="py-20 bg-slate-900"
            style={{ backgroundColor: section.backgroundColor }}
          >
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
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {section.plans?.map((plan, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-slate-800/50 rounded-xl p-8 backdrop-blur-sm ${
                      plan.featured ? 'ring-2 ring-blue-500 scale-105' : ''
                    }`}
                  >
                    {plan.featured && (
                      <div className="bg-blue-500 text-white text-sm font-bold px-4 py-1 rounded-full inline-block mb-4">
                        POPOLARE
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                    <div className="text-4xl font-bold mb-6 text-white">
                      {plan.price}
                      {plan.period && <span className="text-lg text-slate-400">/{plan.period}</span>}
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features?.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.ctaAction && (
                      <button
                        onClick={() => handleCTA(plan.ctaAction)}
                        className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                          plan.featured
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {plan.ctaLabel || 'Scegli Piano'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section 
            id={sectionId}
            key={section.id} 
            className="py-20 bg-slate-800"
            style={{ backgroundColor: section.backgroundColor }}
          >
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
                {section.testimonials?.map((testimonial, idx) => (
                  <div key={idx} className="bg-slate-700/50 p-8 rounded-xl backdrop-blur-sm">
                    {testimonial.rating && (
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < testimonial.rating ? 'text-yellow-400' : 'text-slate-600'}>
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-4">
                      {testimonial.avatar && (
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-bold text-white">{testimonial.name}</div>
                        {testimonial.role && (
                          <div className="text-sm text-slate-400">{testimonial.role}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section 
            id={sectionId}
            key={section.id} 
            className="py-20 bg-gradient-to-r from-blue-600 to-purple-600"
            style={{ backgroundColor: section.backgroundColor }}
          >
            <div className="container mx-auto px-6 text-center">
              {section.title && (
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  {section.title}
                </h2>
              )}
              {section.subtitle && (
                <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
                  {section.subtitle}
                </p>
              )}
              {section.ctaAction && (
                <button
                  onClick={() => handleCTA(section.ctaAction)}
                  className="px-10 py-5 bg-white text-blue-600 hover:bg-slate-100 rounded-lg font-bold text-lg transition-colors"
                >
                  {section.ctaLabel || 'Inizia Ora'}
                </button>
              )}
            </div>
          </section>
        );

      case 'faq':
        return (
          <section 
            id={sectionId}
            key={section.id} 
            className="py-20 bg-slate-900"
            style={{ backgroundColor: section.backgroundColor }}
          >
            <div className="container mx-auto px-6 max-w-4xl">
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
              <div className="space-y-4">
                {section.faqs?.map((faq, idx) => (
                  <details key={idx} className="bg-slate-800/50 rounded-xl backdrop-blur-sm group">
                    <summary className="px-6 py-4 cursor-pointer font-semibold text-white list-none flex items-center justify-between">
                      {faq.question}
                      <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <div className="px-6 pb-4 text-slate-300">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Errore</h1>
          <p className="text-xl text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Pagina non trovata</h1>
          <p className="text-xl text-slate-300">La landing page richiesta non esiste.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Countdown Timer */}
      {page.timerEnabled && !timerComplete && (
        <CountdownTimer
          type={page.timerType}
          duration={page.timerDuration}
          endDate={page.timerEndDate}
          message={page.timerMessage}
          onComplete={() => setTimerComplete(true)}
        />
      )}

      {/* Page Sections */}
      {page.sections?.map((section, index) => {
        // Nascondi sezione se c'è un timer attivo e questa è la sezione da sbloccare
        if (page.timerEnabled && page.timerUnlockSection === section.id && !timerComplete) {
          return null;
        }
        return renderSection(section, index);
      })}

      {/* Exit Intent Popup */}
      {showExitIntent && page.exitIntentEnabled && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-scaleIn">
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <XCircle size={24} />
            </button>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {page.exitIntentTitle}
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              {page.exitIntentMessage}
            </p>
            <button
              onClick={() => {
                setShowExitIntent(false);
                // Scroll alla prima form section
                const formSection = page.sections.find(s => s.type === 'contactForm');
                if (formSection) {
                  const formIdx = page.sections.indexOf(formSection);
                  handleScroll(`section-${formIdx}`);
                }
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105"
            >
              {page.exitIntentCTA}
            </button>
          </div>
        </div>
      )}

      {/* Analytics Tracking (if enabled) */}
      {page.trackingEnabled && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Track page view
              console.log('Analytics: Page View');
              
              // Track scroll depth
              let maxScroll = 0;
              window.addEventListener('scroll', () => {
                const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
                if (scrollPercent > maxScroll) {
                  maxScroll = Math.floor(scrollPercent / 25) * 25;
                  if (maxScroll > 0) {
                    console.log('Analytics: Scroll Depth ' + maxScroll + '%');
                  }
                }
              });
            `
          }}
        />
      )}
    </div>
  );
}
