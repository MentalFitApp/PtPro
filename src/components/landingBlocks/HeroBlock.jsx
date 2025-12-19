import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FormPopup from './FormPopup';

/**
 * Hero Block - Sezione principale della landing page
 * Varianti: centered, split, video, minimal, fullscreen
 * Azioni CTA: scroll, redirect, whatsapp, calendly, phone, form_popup
 */
const HeroBlock = ({ settings, isPreview = false, pageId = null, tenantId = null }) => {
  const {
    variant = 'centered',
    title = 'Il tuo titolo qui',
    subtitle = 'Il tuo sottotitolo qui',
    ctaText = 'Inizia Ora',
    ctaLink = '#form',
    // Nuove azioni CTA
    ctaAction = 'scroll', // scroll, redirect, whatsapp, calendly, phone, form_popup
    ctaRedirectUrl = '',
    ctaWhatsappNumber = '',
    ctaWhatsappMessage = 'Ciao! Vorrei maggiori informazioni.',
    ctaCalendlyUrl = '',
    ctaPhoneNumber = '',
    // Form Popup settings
    formPopupTitle = 'Richiedi Informazioni',
    formPopupSubtitle = '',
    formPopupFields = 'name,email,phone',
    formPopupCustomFields = [], // Campi personalizzati
    formPopupSubmitText = 'Invia Richiesta',
    formPopupSuccessMessage = 'Grazie! Ti contatteremo presto.',
    formPopupAfterSubmit = 'message',
    formPopupRedirectUrl = '',
    formPopupWhatsappNumber = '',
    secondaryCtaText = '',
    secondaryCtaLink = '',
    backgroundType = 'gradient',
    backgroundGradient = 'from-slate-900 via-sky-900 to-slate-900',
    backgroundImage = '',
    backgroundVideo = '',
    overlay = true,
    overlayOpacity = 50,
    textAlign = 'center',
    minHeight = '90vh',
    showBadge = false,
    badgeText = '',
    // Split image settings
    splitImage = '',
    splitImageStyle = 'rounded',
    splitImagePosition = 'right',
    // Text style settings
    titleColor = '#ffffff',
    titleSize = 'default',
    subtitleColor = '#cbd5e1',
    highlightedWords = '',
    highlightColor = '#0ea5e9',
  } = settings || {};

  const [showFormPopup, setShowFormPopup] = useState(false);

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  // Classi dimensione titolo
  const titleSizeClasses = {
    small: 'text-2xl md:text-3xl lg:text-4xl',
    default: 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
    large: 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
    xlarge: 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl',
  };

  // Renderizza titolo con parole evidenziate
  const renderTitle = () => {
    if (!highlightedWords || !title) {
      return <span style={{ color: titleColor }}>{title}</span>;
    }

    const wordsToHighlight = highlightedWords.split(',').map(w => w.trim()).filter(Boolean);
    let result = title;
    
    wordsToHighlight.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      result = result.replace(regex, `<span style="color: ${highlightColor}">$1</span>`);
    });

    return <span style={{ color: titleColor }} dangerouslySetInnerHTML={{ __html: result }} />;
  };

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
      
      default:
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
        return '#';
      default:
        return ctaLink || '#';
    }
  };

  const scrollToElement = (e, href) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Render per variante Split (immagine a lato)
  if (variant === 'split') {
    // Stile immagine
    const imageStyleClasses = {
      rounded: 'rounded-2xl',
      circle: 'rounded-full',
      square: 'rounded-none',
      blob: 'rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%]',
    };

    const imageClass = imageStyleClasses[splitImageStyle] || imageStyleClasses.rounded;
    const isImageLeft = splitImagePosition === 'left';

    // Helper per renderizzare FormPopup
    const renderFormPopup = () => (
      <FormPopup
        isOpen={showFormPopup}
        onClose={() => setShowFormPopup(false)}
        settings={{
          title: formPopupTitle,
          subtitle: formPopupSubtitle,
          fields: formPopupFields,
          customFields: formPopupCustomFields,
          submitText: formPopupSubmitText,
          successMessage: formPopupSuccessMessage,
          afterSubmit: formPopupAfterSubmit,
          redirectUrl: formPopupRedirectUrl,
          whatsappNumber: formPopupWhatsappNumber,
        }}
        pageId={pageId}
        tenantId={tenantId}
        isPreview={isPreview}
      />
    );

    return (
      <>
        <section 
          className="relative flex items-center overflow-hidden"
          style={{ minHeight }}
        >
        {/* Background */}
        {backgroundType === 'gradient' && (
          <div className={`absolute inset-0 bg-gradient-to-br ${backgroundGradient}`} />
        )}
        {backgroundType === 'image' && backgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        {overlay && (
          <div 
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity / 100 }}
          />
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isImageLeft ? 'lg:grid-flow-col-dense' : ''}`}>
            {/* Content - ordine diverso su mobile/desktop in base a posizione */}
            <motion.div
              initial={{ opacity: 0, x: isImageLeft ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col ${alignmentClasses[textAlign]} order-2 lg:order-${isImageLeft ? '2' : '1'} px-2 sm:px-0`}
            >
              {showBadge && badgeText && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-4 md:mb-6 w-fit">
                  {badgeText}
                </span>
              )}
              <h1 className={`${titleSizeClasses[titleSize] || titleSizeClasses.default} font-bold leading-tight mb-4 md:mb-6`}>
                {renderTitle()}
              </h1>
              <p 
                className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-xl"
                style={{ color: subtitleColor }}
              >
                {subtitle}
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <a
                  href={getCtaHref()}
                  onClick={handleCtaClick}
                  className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 transform hover:-translate-y-0.5 text-sm md:text-base"
                >
                  {ctaText}
                </a>
                {secondaryCtaText && (
                  <a
                    href={secondaryCtaLink}
                    onClick={(e) => scrollToElement(e, secondaryCtaLink)}
                    className="px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-sm md:text-base"
                  >
                    {secondaryCtaText}
                  </a>
                )}
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: isImageLeft ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`relative order-1 lg:order-${isImageLeft ? '1' : '2'}`}
            >
              {splitImage ? (
                <img 
                  src={splitImage} 
                  alt="Hero" 
                  className={`w-full shadow-2xl ${imageClass} object-cover`}
                />
              ) : (
                <div className={`aspect-square bg-gradient-to-br from-sky-500/20 to-cyan-500/20 ${imageClass} flex items-center justify-center border border-white/10`}>
                  <span className="text-4xl md:text-6xl opacity-50">📷</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
      {renderFormPopup()}
      </>
    );
  }

  // Render per variante Video
  if (variant === 'video' && backgroundVideo) {
    return (
      <>
        <section 
          className="relative flex items-center justify-center overflow-hidden"
          style={{ minHeight }}
        >
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        
        {overlay && (
          <div 
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity / 100 }}
          />
        )}

        <div className={`relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col ${alignmentClasses[textAlign]}`}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {showBadge && badgeText && (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-6">
                {badgeText}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              {subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={getCtaHref()}
                onClick={handleCtaClick}
                className="px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {ctaText}
              </a>
              {secondaryCtaText && (
                <a
                  href={secondaryCtaLink}
                  onClick={(e) => scrollToElement(e, secondaryCtaLink)}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  {secondaryCtaText}
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>
      <FormPopup
        isOpen={showFormPopup}
        onClose={() => setShowFormPopup(false)}
        settings={{
          title: formPopupTitle,
          subtitle: formPopupSubtitle,
          fields: formPopupFields,
          customFields: formPopupCustomFields,
          submitText: formPopupSubmitText,
          successMessage: formPopupSuccessMessage,
          afterSubmit: formPopupAfterSubmit,
          redirectUrl: formPopupRedirectUrl,
          whatsappNumber: formPopupWhatsappNumber,
        }}
        pageId={pageId}
        tenantId={tenantId}
        isPreview={isPreview}
      />
      </>
    );
  }

  // Render default: Centered
  return (
    <>
      <section 
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight }}
      >
      {/* Background */}
      {backgroundType === 'gradient' && (
        <div className={`absolute inset-0 bg-gradient-to-br ${backgroundGradient}`} />
      )}
      {backgroundType === 'image' && backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      {overlay && backgroundType !== 'gradient' && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className={`relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col ${alignmentClasses[textAlign]}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {showBadge && badgeText && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-4 md:mb-6"
            >
              {badgeText}
            </motion.span>
          )}
          <h1 className={`${titleSizeClasses[titleSize] || titleSizeClasses.default} font-bold leading-tight mb-4 md:mb-6 text-center`}>
            {renderTitle()}
          </h1>
          <p 
            className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-2xl text-center"
            style={{ color: subtitleColor }}
          >
            {subtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            <motion.a
              href={getCtaHref()}
              onClick={handleCtaClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 text-sm md:text-base"
            >
              {ctaText}
            </motion.a>
            {secondaryCtaText && (
              <motion.a
                href={secondaryCtaLink}
                onClick={(e) => scrollToElement(e, secondaryCtaLink)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                {secondaryCtaText}
              </motion.a>
            )}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1"
        >
          <div className="w-1.5 h-3 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
    <FormPopup
      isOpen={showFormPopup}
      onClose={() => setShowFormPopup(false)}
      settings={{
        title: formPopupTitle,
        subtitle: formPopupSubtitle,
        fields: formPopupFields,
        customFields: formPopupCustomFields,
        submitText: formPopupSubmitText,
        successMessage: formPopupSuccessMessage,
        afterSubmit: formPopupAfterSubmit,
        redirectUrl: formPopupRedirectUrl,
        whatsappNumber: formPopupWhatsappNumber,
      }}
      pageId={pageId}
      tenantId={tenantId}
      isPreview={isPreview}
    />
    </>
  );
};

export default HeroBlock;
