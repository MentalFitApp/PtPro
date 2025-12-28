import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FormPopup from './FormPopup';

/**
 * CTA Block - Call to Action section
 * Varianti: centered, split, banner, floating, fullscreen
 * Azioni: scroll, redirect, whatsapp, calendly, phone, form_popup
 */
const CTABlock = ({ settings, isPreview = false, pageId = null, tenantId = null }) => {
  const {
    variant = 'centered',
    title = 'Pronto a iniziare?',
    subtitle = '',
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
    formPopupCustomFields = [],
    formPopupSubmitText = 'Invia Richiesta',
    formPopupSuccessMessage = 'Grazie! Ti contatteremo presto.',
    formPopupAfterSubmit = 'message',
    formPopupRedirectUrl = '',
    formPopupWhatsappNumber = '',
    showSecondaryButton = false,
    secondaryText = '',
    secondaryLink = '',
    backgroundType = 'gradient',
    backgroundGradient = 'from-sky-600 to-cyan-500',
    showStats = false,
    stats = [],
  } = settings || {};

  const [showFormPopup, setShowFormPopup] = useState(false);

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
        return '#';
      default:
        return ctaLink || '#';
    }
  };

  // Helper per renderizzare il FormPopup
  const renderFormPopup = () => {
    return (
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
    </>
    );
  }

  // Default: Centered
  return (
    <>
      <section className={`bg-gradient-to-br ${backgroundGradient} py-20 relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {title}
            </h2>
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

            <div className="flex flex-wrap justify-center gap-4">
              <motion.a
                href={getCtaHref()}
                onClick={handleCtaClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg text-lg"
              >
                {ctaText}
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
          </motion.div>
        </div>
      </section>
      {renderFormPopup()}
    </>
  );
};

export default CTABlock;
