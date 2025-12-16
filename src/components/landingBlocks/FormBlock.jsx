import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { incrementPageConversions } from '../../services/landingPageService';

/**
 * Form Block - Form di contatto/lead capture
 * Varianti: standard, minimal, split, floating
 * Azioni dopo invio: message, redirect, popup, whatsapp, calendly
 */
const FormBlock = ({ settings, isPreview = false, pageId = null, tenantId = null }) => {
  const {
    variant = 'standard',
    title = 'Contattaci',
    subtitle = '',
    fields = [],
    submitText = 'Invia',
    successMessage = 'Grazie! Ti contatteremo presto.',
    privacyText = '',
    privacyLink = '/privacy',
    backgroundColor = 'bg-slate-800',
    showImage = false,
    imagePosition = 'right',
    imageSrc = '',
    saveToLeads = true,
    leadSource = 'landing_page',
    sendNotification = true,
    // Nuove azioni dopo invio
    afterSubmitAction = 'message', // message, redirect, popup, whatsapp, calendly
    redirectUrl = '',
    redirectDelay = 2000,
    popupTitle = 'Grazie!',
    popupMessage = 'Ti contatteremo presto.',
    popupCtaText = 'Chiudi',
    popupCtaUrl = '',
    whatsappNumber = '',
    whatsappMessage = 'Ciao, ho compilato il form sulla tua landing page!',
    calendlyUrl = '',
  } = settings || {};

  const toast = useToast();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error on change
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    fields.forEach(field => {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = 'Campo obbligatorio';
      }
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Email non valida';
        }
      }
      if (field.type === 'tel' && formData[field.id]) {
        const phoneRegex = /^[\d\s+\-()]{8,20}$/;
        if (!phoneRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Numero di telefono non valido';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isPreview) {
      toast?.showToast?.('Form preview - invio disabilitato', 'info');
      return;
    }

    if (!validateForm()) {
      toast?.showToast?.('Compila tutti i campi obbligatori', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Salva lead nel database
      if (saveToLeads && tenantId) {
        const leadData = {
          ...formData,
          source: leadSource,
          landingPageId: pageId,
          status: 'new',
          createdAt: serverTimestamp(),
          tenantId,
        };

        await addDoc(collection(db, `tenants/${tenantId}/leads`), leadData);
      }

      // Incrementa conversioni
      if (pageId && tenantId) {
        await incrementPageConversions(db, pageId);
      }

      setIsSubmitted(true);

      // Gestisci azione post-invio
      handleAfterSubmitAction();
      
    } catch (error) {
      console.error('Errore invio form:', error);
      toast?.showToast?.('Errore durante l\'invio. Riprova.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestisce le diverse azioni dopo l'invio
  const handleAfterSubmitAction = () => {
    switch (afterSubmitAction) {
      case 'redirect':
        if (redirectUrl) {
          toast?.showToast?.(successMessage, 'success');
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, redirectDelay || 2000);
        }
        break;
      
      case 'popup':
        setShowPopup(true);
        break;
      
      case 'whatsapp':
        if (whatsappNumber) {
          toast?.showToast?.(successMessage, 'success');
          // Crea messaggio personalizzato con i dati del form
          let message = whatsappMessage || 'Ciao!';
          // Sostituisci placeholder con dati del form
          Object.keys(formData).forEach(key => {
            message = message.replace(`{${key}}`, formData[key] || '');
          });
          const cleanNumber = whatsappNumber.replace(/\D/g, '');
          const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
          setTimeout(() => {
            window.open(waUrl, '_blank');
          }, 1500);
        }
        break;
      
      case 'calendly':
        if (calendlyUrl) {
          toast?.showToast?.(successMessage, 'success');
          setTimeout(() => {
            // Se Calendly widget è disponibile, usalo
            if (typeof window !== 'undefined' && window.Calendly) {
              window.Calendly.initPopupWidget({ url: calendlyUrl });
            } else {
              // Fallback: apri in nuova tab
              window.open(calendlyUrl, '_blank');
            }
          }, 1500);
        }
        break;
      
      default: // 'message'
        toast?.showToast?.(successMessage, 'success');
    }
  };

  // Popup component
  const SuccessPopup = () => (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{popupTitle}</h3>
            <p className="text-slate-300 mb-6">{popupMessage}</p>
            {popupCtaUrl ? (
              <a
                href={popupCtaUrl}
                className="inline-block px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                {popupCtaText || 'Continua'}
              </a>
            ) : (
              <button
                onClick={() => setShowPopup(false)}
                className="px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                {popupCtaText || 'Chiudi'}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderField = (field) => {
    const baseClasses = `w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
      errors[field.id] ? 'border-red-500' : 'border-white/20'
    }`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={4}
            className={`${baseClasses} resize-none`}
          />
        );
      
      case 'select':
        return (
          <select
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={`${baseClasses} appearance-none cursor-pointer`}
          >
            <option value="" className="bg-slate-800">{field.placeholder || 'Seleziona...'}</option>
            {(field.options || []).map((option, idx) => (
              <option key={idx} value={option} className="bg-slate-800">
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type={field.type || 'text'}
            id={field.id}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseClasses}
          />
        );
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <section id="form" className={`${backgroundColor} py-20`}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Richiesta Inviata!</h3>
            <p className="text-slate-300">{successMessage}</p>
          </motion.div>
        </div>
      </section>
    );
  }

  // Variante Minimal
  if (variant === 'minimal') {
    return (
      <>
        <section id="form" className={`${backgroundColor} py-16`}>
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {title && (
                <h3 className="text-2xl font-bold text-white text-center mb-6">{title}</h3>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                {fields.slice(0, 2).map((field) => (
                  <div key={field.id} className="flex-1">
                    {renderField(field)}
                    {errors[field.id] && (
                      <p className="text-red-400 text-sm mt-1">{errors[field.id]}</p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Invio in corso...' : submitText}
              </button>

              {privacyText && (
                <p className="text-xs text-slate-400 text-center">
                  {privacyText}{' '}
                  <a href={privacyLink} className="text-sky-400 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              )}
            </motion.form>
          </div>
        </section>
        <SuccessPopup />
      </>
    );
  }

  // Default: Standard (con immagine opzionale)
  const formContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
    >
      {title && (
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      )}
      {subtitle && (
        <p className="text-slate-400 mb-6">{subtitle}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            {field.label && (
              <label htmlFor={field.id} className="block text-sm font-medium text-slate-300 mb-1">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
            )}
            {renderField(field)}
            {errors[field.id] && (
              <p className="text-red-400 text-sm mt-1">{errors[field.id]}</p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all disabled:opacity-50 transform hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Invio in corso...
            </span>
          ) : submitText}
        </button>

        {privacyText && (
          <p className="text-xs text-slate-400 text-center pt-2">
            {privacyText}{' '}
            <a href={privacyLink} className="text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </p>
        )}
      </form>
    </motion.div>
  );

  return (
    <section id="form" className={`${backgroundColor} py-20`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {showImage && imageSrc ? (
          <div className={`grid lg:grid-cols-2 gap-12 items-center ${
            imagePosition === 'left' ? 'lg:flex-row-reverse' : ''
          }`}>
            {imagePosition === 'left' && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <img 
                  src={imageSrc} 
                  alt="Form" 
                  className="rounded-2xl shadow-2xl"
                />
              </motion.div>
            )}
            
            {formContent}
            
            {imagePosition === 'right' && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <img 
                  src={imageSrc} 
                  alt="Form" 
                  className="rounded-2xl shadow-2xl"
                />
              </motion.div>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            {formContent}
          </div>
        )}
      </div>
      <SuccessPopup />
    </section>
  );
};

export default FormBlock;
