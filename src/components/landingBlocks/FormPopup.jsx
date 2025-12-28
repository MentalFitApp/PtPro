import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { incrementPageConversions } from '../../services/landingPageService';

/**
 * FormPopup - Popup con form di contatto standalone
 * Usato dai CTA buttons per aprire un form popup senza avere un FormBlock
 */
const FormPopup = ({ 
  isOpen, 
  onClose, 
  settings = {},
  pageId = null,
  tenantId = null,
  isPreview = false
}) => {
  const {
    title = 'Richiedi Informazioni',
    subtitle = '',
    fields = 'name,email,phone', // stringa csv o array o 'custom'
    customFields = [], // campi personalizzati quando fields === 'custom'
    submitText = 'Invia Richiesta',
    successMessage = 'Grazie! Ti contatteremo presto.',
    afterSubmit = 'message', // message, redirect, whatsapp, close
    redirectUrl = '',
    whatsappNumber = '',
    // Stili
    accentColor = '#3b82f6',
  } = settings;

  const toast = useToast();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Parse fields da stringa CSV a array di oggetti, o usa customFields
  const getFields = () => {
    // Se è 'custom', usa i campi personalizzati
    if (fields === 'custom' && customFields && customFields.length > 0) {
      return customFields.map(f => ({
        id: f.id || `field_${Math.random().toString(36).substr(2, 9)}`,
        label: f.label || 'Campo',
        type: f.type || 'text',
        required: f.required || false,
        placeholder: f.placeholder || '',
        options: f.options ? f.options.split(',').map(o => o.trim()) : [],
      }));
    }
    
    // Altrimenti usa i preset
    const fieldConfig = {
      name: { id: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'Il tuo nome' },
      email: { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'La tua email' },
      phone: { id: 'phone', label: 'Telefono', type: 'tel', required: true, placeholder: 'Il tuo numero' },
      message: { id: 'message', label: 'Messaggio', type: 'textarea', required: false, placeholder: 'Il tuo messaggio...' },
    };

    const fieldKeys = typeof fields === 'string' ? fields.split(',').map(f => f.trim()) : fields;
    return fieldKeys.map(key => fieldConfig[key] || null).filter(Boolean);
  };

  const formFields = getFields();

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    formFields.forEach(field => {
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
          newErrors[field.id] = 'Numero non valido';
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
      if (tenantId) {
        const leadData = {
          ...formData,
          source: 'form_popup',
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
      console.error('Errore invio form popup:', error);
      toast?.showToast?.('Errore durante l\'invio. Riprova.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAfterSubmitAction = () => {
    switch (afterSubmit) {
      case 'redirect':
        if (redirectUrl) {
          toast?.showToast?.(successMessage, 'success');
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2000);
        }
        break;

      case 'whatsapp':
        if (whatsappNumber) {
          toast?.showToast?.(successMessage, 'success');
          let message = `Ciao! Ho compilato il form:\n`;
          Object.keys(formData).forEach(key => {
            message += `${key}: ${formData[key]}\n`;
          });
          const cleanNumber = whatsappNumber.replace(/\D/g, '');
          const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
          setTimeout(() => {
            window.open(waUrl, '_blank');
          }, 1500);
        }
        break;

      case 'close':
        setTimeout(() => {
          onClose();
        }, 2000);
        break;

      default: // 'message'
        toast?.showToast?.(successMessage, 'success');
    }
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    setIsSubmitted(false);
    onClose();
  };

  // Usa createPortal per renderizzare nel body, evitando problemi con overflow/transform dei parent
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="form-popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-md w-full relative shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Success state */}
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Grazie!</h3>
                <p className="text-slate-300">{successMessage}</p>
                <button
                  onClick={handleClose}
                  className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Chiudi
                </button>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white">{title}</h3>
                  {subtitle && (
                    <p className="text-slate-400 mt-2">{subtitle}</p>
                  )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formFields.map((field) => (
                    <div key={field.id}>
                      {field.type !== 'checkbox' && (
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                      )}
                      
                      {/* Textarea */}
                      {field.type === 'textarea' && (
                        <textarea
                          value={formData[field.id] || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          className={`w-full px-4 py-3 bg-white/5 border ${
                            errors[field.id] ? 'border-red-500' : 'border-white/10'
                          } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none`}
                        />
                      )}
                      
                      {/* Select */}
                      {field.type === 'select' && (
                        <select
                          value={formData[field.id] || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className={`w-full px-4 py-3 bg-white/5 border ${
                            errors[field.id] ? 'border-red-500' : 'border-white/10'
                          } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        >
                          <option value="" className="bg-slate-800">{field.placeholder || 'Seleziona...'}</option>
                          {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt} className="bg-slate-800">{opt}</option>
                          ))}
                        </select>
                      )}
                      
                      {/* Checkbox */}
                      {field.type === 'checkbox' && (
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData[field.id] || false}
                            onChange={(e) => handleChange(field.id, e.target.checked)}
                            className={`w-5 h-5 rounded bg-white/5 border ${
                              errors[field.id] ? 'border-red-500' : 'border-white/10'
                            } text-blue-500 focus:ring-2 focus:ring-blue-500`}
                          />
                          <span className="text-sm text-slate-300">
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </span>
                        </label>
                      )}
                      
                      {/* Date */}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={formData[field.id] || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className={`w-full px-4 py-3 bg-white/5 border ${
                            errors[field.id] ? 'border-red-500' : 'border-white/10'
                          } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        />
                      )}
                      
                      {/* Number */}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={formData[field.id] || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className={`w-full px-4 py-3 bg-white/5 border ${
                            errors[field.id] ? 'border-red-500' : 'border-white/10'
                          } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        />
                      )}
                      
                      {/* Text, Email, Tel, Name, Cognome (default) */}
                      {!['textarea', 'select', 'checkbox', 'date', 'number'].includes(field.type) && (
                        <input
                          type={['name', 'cognome'].includes(field.type) ? 'text' : field.type}
                          value={formData[field.id] || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className={`w-full px-4 py-3 bg-white/5 border ${
                            errors[field.id] ? 'border-red-500' : 'border-white/10'
                          } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        />
                      )}
                      
                      {errors[field.id] && (
                        <p className="text-red-400 text-sm mt-1">{errors[field.id]}</p>
                      )}
                    </div>
                  ))}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    style={accentColor ? { 
                      background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)` 
                    } : {}}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Invio in corso...
                      </span>
                    ) : (
                      submitText
                    )}
                  </button>

                  {/* Privacy note */}
                  <p className="text-xs text-slate-500 text-center">
                    Inviando il form accetti la nostra{' '}
                    <a href="/privacy" target="_blank" className="text-blue-400 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FormPopup;
