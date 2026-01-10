import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import FormPopup from './FormPopup';
import QuizPopup from './QuizPopup';

/**
 * CTA Block - Call to Action section
 * Varianti: centered, split, banner, floating, fullscreen
 * Azioni: scroll, redirect, whatsapp, calendly, phone, form_popup, quiz_popup
 */
const CTABlock = ({ settings, isPreview = false, pageId = null, tenantId = null }) => {
  const {
    variant = 'centered',
    title = 'Pronto a iniziare?',
    subtitle = '',
    ctaText = 'Inizia Ora',
    ctaLink = '#form',
    // Nuove azioni CTA
    ctaAction = 'scroll', // scroll, redirect, whatsapp, calendly, phone, form_popup, quiz_popup
    ctaRedirectUrl = '',
    ctaWhatsappNumber = '',
    ctaWhatsappMessage = 'Ciao! Vorrei maggiori informazioni.',
    ctaCalendlyUrl = '',
    ctaPhoneNumber = '',
    // Form Popup settings
    formPopupTitle = 'Richiedi Informazioni',
    formPopupSubtitle = '',
    formPopupFields = 'name,email,phone',
    formPopupCustomFields = [],
    formPopupSubmitText = 'Invia Richiesta',
    formPopupSuccessMessage = 'Grazie! Ti contatteremo presto.',
    formPopupAfterSubmit = 'message',
    formPopupRedirectUrl = '',
    formPopupWhatsappNumber = '',
    // Quiz Popup settings
    quizTitle = 'Scopri il tuo profilo',
    quizSubtitle = 'Rispondi a poche domande per un piano personalizzato',
    quizQuestions = [],
    quizContactTitle = 'Ultimo passaggio!',
    quizContactSubtitle = 'Inserisci i tuoi dati per ricevere i risultati',
    quizContactFields = ['name', 'email', 'phone'],
    quizResultsTitle = 'Ecco il tuo profilo',
    quizResultsSubtitle = 'Un nostro esperto analizzerà le tue risposte',
    quizResultsVideoUrl = '', // URL esterno del video (YouTube/Vimeo)
    quizResultsVideoUploaded = '', // Video caricato direttamente
    quizResultsVideoSource = 'none', // 'none', 'url', 'upload'
    quizSuccessMessage = 'Grazie! Ti contatteremo presto con un piano personalizzato.',
    quizAccentColor = '#f97316',
    quizGradientFrom = '#f97316',
    quizGradientTo = '#dc2626',
    quizAfterSubmit = 'message',
    quizRedirectUrl = '',
    quizWhatsappNumber = '',
    quizWhatsappMessage = '',
    // Button styling
    buttonStyle = 'solid', // solid, gradient, outline, glow
    buttonGradient = 'from-orange-500 to-red-600',
    buttonSize = 'lg', // sm, md, lg, xl
    buttonAnimation = 'none', // none, pulse, bounce, shake
    glowEffect = false,
    showArrow = false,
    showSecondaryButton = false,
    secondaryText = '',
    secondaryLink = '',
    backgroundType = 'gradient',
    backgroundGradient = 'from-sky-600 to-cyan-500',
    showStats = false,
    stats = [],
    spacing = 'py-20',
  } = settings || {};

  const [showFormPopup, setShowFormPopup] = useState(false);
  const [showQuizPopup, setShowQuizPopup] = useState(false);

  // Memoizza le settings del quiz per evitare re-render inutili
  const quizSettings = useMemo(() => ({
    title: quizTitle,
    subtitle: quizSubtitle,
    questions: quizQuestions,
    collectContactInfo: true,
    contactTitle: quizContactTitle,
    contactSubtitle: quizContactSubtitle,
    contactFields: quizContactFields,
    showResults: true,
    resultsTitle: quizResultsTitle,
    resultsSubtitle: quizResultsSubtitle,
    resultsVideoUrl: quizResultsVideoSource === 'upload' ? quizResultsVideoUploaded : quizResultsVideoUrl,
    resultsVideoIsUploaded: quizResultsVideoSource === 'upload',
    accentColor: quizAccentColor,
    gradientFrom: quizGradientFrom,
    gradientTo: quizGradientTo,
    afterSubmit: quizAfterSubmit,
    successMessage: quizSuccessMessage,
    redirectUrl: quizRedirectUrl,
    whatsappNumber: quizWhatsappNumber,
    whatsappMessage: quizWhatsappMessage,
  }), [
    quizTitle, quizSubtitle, quizQuestions, quizContactTitle, quizContactSubtitle,
    quizContactFields, quizResultsTitle, quizResultsSubtitle, quizResultsVideoSource,
    quizResultsVideoUploaded, quizResultsVideoUrl, quizAccentColor, quizGradientFrom,
    quizGradientTo, quizAfterSubmit, quizSuccessMessage, quizRedirectUrl,
    quizWhatsappNumber, quizWhatsappMessage
  ]);

  // Memoizza le settings del form per evitare re-render inutili
  const formSettings = useMemo(() => ({
    title: formPopupTitle,
    subtitle: formPopupSubtitle,
    fields: formPopupFields,
    customFields: formPopupCustomFields,
    submitText: formPopupSubmitText,
    successMessage: formPopupSuccessMessage,
    afterSubmit: formPopupAfterSubmit,
    redirectUrl: formPopupRedirectUrl,
    whatsappNumber: formPopupWhatsappNumber,
  }), [
    formPopupTitle, formPopupSubtitle, formPopupFields, formPopupCustomFields,
    formPopupSubmitText, formPopupSuccessMessage, formPopupAfterSubmit,
    formPopupRedirectUrl, formPopupWhatsappNumber
  ]);

  // Gestisce click sul pulsante principale
  const handleCtaClick = (e) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }

    switch (ctaAction) {
      case 'scroll':
        if (ctaLink?.startsWith('#')) {
          e.preventDefault();
          const element = document.querySelector(ctaLink);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
        break;
      
      case 'redirect':
        if (ctaRedirectUrl) {
          window.location.href = ctaRedirectUrl;
        }
        break;
      
      case 'whatsapp':
        if (ctaWhatsappNumber) {
          e.preventDefault();
          const cleanNumber = ctaWhatsappNumber.replace(/\D/g, '');
          const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(ctaWhatsappMessage || '')}`;
          window.open(waUrl, '_blank');
        }
        break;
      
      case 'calendly':
        if (ctaCalendlyUrl) {
          e.preventDefault();
          if (typeof window !== 'undefined' && window.Calendly) {
            window.Calendly.initPopupWidget({ url: ctaCalendlyUrl });
          } else {
            window.open(ctaCalendlyUrl, '_blank');
          }
        }
        break;
      
      case 'phone':
        if (ctaPhoneNumber) {
          const cleanPhone = ctaPhoneNumber.replace(/\s/g, '');
          window.location.href = `tel:${cleanPhone}`;
        }
        break;
      
      case 'form_popup':
        e.preventDefault();
        setShowFormPopup(true);
        break;
      
      case 'quiz_popup':
        e.preventDefault();
        setShowQuizPopup(true);
        break;
      
      default:
        // Default: usa il link come href
        break;
    }
  };

  // Determina l'href del pulsante
  const getCtaHref = () => {
    switch (ctaAction) {
      case 'phone':
        return `tel:${ctaPhoneNumber?.replace(/\s/g, '')}`;
      case 'whatsapp':
        const cleanNumber = ctaWhatsappNumber?.replace(/\D/g, '');
        return `https://wa.me/${cleanNumber}`;
      case 'redirect':
        return ctaRedirectUrl || '#';
      case 'form_popup':
      case 'quiz_popup':
        return '#';
      default:
        return ctaLink || '#';
    }
  };

  // Button size classes
  const buttonSizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  // Button animation classes
  const getButtonAnimation = () => {
    switch (buttonAnimation) {
      case 'pulse':
        return { 
          animate: { scale: [1, 1.02, 1] },
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        };
      case 'bounce':
        return {
          animate: { y: [0, -5, 0] },
          transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        };
      case 'shake':
        return {
          animate: { x: [0, -3, 3, -3, 3, 0] },
          transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
        };
      default:
        return {};
    }
  };

  // Get button style classes
  const getButtonClasses = () => {
    const baseClasses = `${buttonSizeClasses[buttonSize] || buttonSizeClasses.lg} font-bold rounded-xl transition-all shadow-lg`;
    
    switch (buttonStyle) {
      case 'gradient':
        return `${baseClasses} bg-gradient-to-r ${buttonGradient} text-white hover:opacity-90`;
      case 'outline':
        return `${baseClasses} bg-transparent border-2 border-white text-white hover:bg-white/10`;
      case 'glow':
        return `${baseClasses} bg-gradient-to-r ${buttonGradient} text-white`;
      default:
        return `${baseClasses} bg-white text-slate-900 hover:bg-white/90`;
    }
  };

  // Get glow style for button
  const getGlowStyle = () => {
    if (!glowEffect && buttonStyle !== 'glow') return {};
    return {
      boxShadow: `0 0 30px ${quizAccentColor}60, 0 10px 40px -10px ${quizAccentColor}80`,
    };
  };

  // Helper per renderizzare il FormPopup
  const renderFormPopup = () => {
    return (
      <FormPopup
        isOpen={showFormPopup}
        onClose={() => setShowFormPopup(false)}
        settings={formSettings}
        pageId={pageId}
        tenantId={tenantId}
        isPreview={isPreview}
      />
    );
  };

  // Helper per renderizzare il QuizPopup
  const renderQuizPopup = () => {
    return (
      <QuizPopup
        isOpen={showQuizPopup}
        onClose={() => setShowQuizPopup(false)}
        settings={quizSettings}
        pageId={pageId}
        tenantId={tenantId}
        isPreview={isPreview}
      />
    );
  };

  const scrollToElement = (e, href) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }
    if (href?.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Variante Banner (full width, compatto)
  if (variant === 'banner') {
    return (
      <>
        <section className={`bg-gradient-to-r ${backgroundGradient} py-8`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
                {subtitle && (
                  <p className="text-white/80 mt-1">{subtitle}</p>
                )}
              </div>
              <div className="flex gap-4">
                <motion.a
                  href={getCtaHref()}
                  onClick={handleCtaClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-white/90 transition-colors"
                >
                  {ctaText}
                </motion.a>
                {showSecondaryButton && secondaryText && (
                  <a
                    href={secondaryLink}
                    onClick={(e) => scrollToElement(e, secondaryLink)}
                    className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30"
                  >
                    {secondaryText}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
        {renderFormPopup()}
        {renderQuizPopup()}
      </>
    );
  }

  // Variante Split (contenuto a sinistra, stats/image a destra)
  if (variant === 'split') {
    return (
      <>
      <section className={`bg-gradient-to-br ${backgroundGradient} py-20 relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                {title}
              </h2>
              {subtitle && (
                <p className="text-lg text-white/80 mb-8">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                <motion.a
                  href={getCtaHref()}
                  onClick={handleCtaClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg"
                >
                  {ctaText}
                </motion.a>
                {showSecondaryButton && secondaryText && (
                  <a
                    href={secondaryLink}
                    onClick={(e) => scrollToElement(e, secondaryLink)}
                    className="px-8 py-4 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30"
                  >
                    {secondaryText}
                  </a>
                )}
              </div>
            </motion.div>

            {showStats && stats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-6"
              >
                {stats.map((stat, index) => (
                  <div 
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {stat.value}
                    </div>
                    <div className="text-white/70">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>
      {renderFormPopup()}
      {renderQuizPopup()}
    </>
    );
  }

  // Default: Centered
  return (
    <>
      <section className={`${backgroundType === 'transparent' ? 'bg-transparent' : `bg-gradient-to-br ${backgroundGradient}`} ${spacing} relative overflow-hidden`}>
        {/* Decorative elements */}
        {backgroundType !== 'transparent' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}

            {showStats && stats.length > 0 && (
              <div className="flex flex-wrap justify-center gap-8 mb-10">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-white/70 text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ctaText && (
              <div className="flex flex-wrap justify-center gap-4">
                <motion.a
                  href={getCtaHref()}
                  onClick={handleCtaClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={getButtonClasses()}
                  style={getGlowStyle()}
                  {...getButtonAnimation()}
                >
                  {ctaText}
                  {showArrow && (
                    <motion.span 
                      className="inline-block ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  )}
                </motion.a>
                {showSecondaryButton && secondaryText && (
                  <a
                    href={secondaryLink}
                    onClick={(e) => scrollToElement(e, secondaryLink)}
                    className="px-10 py-4 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30 text-lg"
                  >
                    {secondaryText}
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>
      {renderFormPopup()}
      {renderQuizPopup()}
    </>
  );
};

export default CTABlock;
