// src/components/integrations/WhatsAppButton.jsx
// Bottone per invio WhatsApp con template precompilati
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, ChevronDown, Zap, Edit3, ExternalLink } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';

const DEFAULT_TEMPLATES = [
  {
    id: 'quick_message',
    name: 'Messaggio Veloce',
    message: 'Ciao {nome}! 👋',
    type: 'manual'
  },
  {
    id: 'manual_followup',
    name: 'Follow-up',
    message: 'Ciao {nome}! 👋\n\nCome stai? Volevo sapere come procede il tuo allenamento.\n\nFammi sapere se hai bisogno di supporto!\n\n{trainer_name}',
    type: 'manual'
  },
  {
    id: 'subscription_reminder',
    name: 'Promemoria Scadenza',
    message: 'Ciao {nome}! ⏰\n\nVolevo ricordarti che il tuo programma sta per scadere.\n\nSe vuoi continuare, scrivimi per il rinnovo! 💪\n\n{trainer_name}',
    type: 'manual'
  }
];

export default function WhatsAppButton({ 
  client, 
  tenantId,
  variant = 'icon', // 'icon', 'button', 'full'
  className = '',
  onSuccess,
  onError
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [trainerName, setTrainerName] = useState('Il tuo trainer');
  const [loading, setLoading] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [tenantId]);

  const loadConfig = async () => {
    if (!tenantId) return;

    try {
      // Carica template personalizzati
      const templatesDoc = await getDoc(doc(db, `tenants/${tenantId}/settings/whatsapp_templates`));
      if (templatesDoc.exists()) {
        const customTemplates = templatesDoc.data().templates?.filter(t => t.type === 'manual') || [];
        if (customTemplates.length > 0) {
          setTemplates(customTemplates);
        }
      }

      // Carica nome trainer
      const tenantDoc = await getDoc(doc(db, `tenants/${tenantId}`));
      if (tenantDoc.exists()) {
        setTrainerName(tenantDoc.data().ownerName || tenantDoc.data().name || 'Il tuo trainer');
      }

      // Verifica se WhatsApp API è attivo
      const whatsappConfig = await getDoc(doc(db, `tenants/${tenantId}/integrations/whatsapp`));
      setWhatsappEnabled(whatsappConfig.exists() && whatsappConfig.data().enabled);
    } catch (error) {
      console.error('Errore caricamento config WhatsApp:', error);
    }
  };

  const formatMessage = (template) => {
    return template.message
      .replace(/{nome}/g, client?.name || client?.displayName || 'Cliente')
      .replace(/{trainer_name}/g, trainerName)
      .replace(/{ora}/g, new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
      .replace(/{data}/g, new Date().toLocaleDateString('it-IT'));
  };

  const getPhoneNumber = () => {
    if (!client?.phone) return null;
    const phone = client.phone.replace(/[^0-9]/g, '');
    return phone.startsWith('39') ? phone : '39' + phone;
  };

  const handleSendViaLink = (template) => {
    const phone = getPhoneNumber();
    if (!phone) {
      alert('Numero di telefono non valido');
      return;
    }

    const message = formatMessage(template);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    setShowDropdown(false);
    onSuccess?.();
  };

  const handleSendViaAPI = async (template) => {
    if (!whatsappEnabled) {
      handleSendViaLink(template);
      return;
    }

    setLoading(true);
    try {
      const sendWhatsApp = httpsCallable(functions, 'sendWhatsAppMessage');
      await sendWhatsApp({
        tenantId,
        clientId: client.id,
        templateId: template.id,
        customMessage: formatMessage(template)
      });
      
      alert('✅ Messaggio inviato con successo!');
      setShowDropdown(false);
      onSuccess?.();
    } catch (error) {
      console.error('Errore invio WhatsApp:', error);
      // Fallback al link
      handleSendViaLink(template);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSend = () => {
    const phone = getPhoneNumber();
    if (!phone) {
      alert('Numero di telefono non valido');
      return;
    }
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  if (!client?.phone) return null;

  // Variante icona semplice
  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`p-1.5 rounded-md border border-green-700 text-green-400 hover:text-green-300 hover:border-green-500 bg-slate-800 ${className}`}
          title="Invia WhatsApp"
        >
          <MessageCircle size={14} />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">Invia WhatsApp</p>
                  <p className="text-xs text-slate-400">{client.name}</p>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleSendViaLink(template)}
                      className="w-full p-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{template.name}</span>
                        <ExternalLink size={12} className="text-slate-500" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {formatMessage(template).substring(0, 60)}...
                      </p>
                    </button>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-700 bg-slate-800/50">
                  <button
                    onClick={handleQuickSend}
                    className="w-full py-2 px-3 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle size={14} />
                    Apri Chat Vuota
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Variante bottone
  if (variant === 'button') {
    return (
      <button
        onClick={handleQuickSend}
        className={`flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors ${className}`}
      >
        <MessageCircle size={16} />
        WhatsApp
      </button>
    );
  }

  // Variante full con dropdown
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-green-500/25"
      >
        <MessageCircle size={18} />
        <span>Invia WhatsApp</span>
        <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-green-600/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                    <MessageCircle size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{client.name}</p>
                    <p className="text-xs text-slate-400">{client.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-2 max-h-64 overflow-y-auto">
                <p className="px-2 py-1 text-xs text-slate-500 uppercase tracking-wider">
                  Seleziona Template
                </p>
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => whatsappEnabled ? handleSendViaAPI(template) : handleSendViaLink(template)}
                    disabled={loading}
                    className="w-full p-3 text-left hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{template.name}</span>
                      {whatsappEnabled ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <Zap size={10} /> Auto
                        </span>
                      ) : (
                        <ExternalLink size={12} className="text-slate-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {formatMessage(template).substring(0, 80)}...
                    </p>
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-slate-700 bg-slate-800/50 flex gap-2">
                <button
                  onClick={handleQuickSend}
                  className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit3 size={14} />
                  Scrivi Messaggio
                </button>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
