import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getCurrentTenantId } from '../../config/tenant';
import { auth, db } from '../../firebase';
import { 
  Send, 
  ArrowLeft, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  Loader2,
  QrCode,
  Link2,
  Mail,
  Phone,
  User,
  Clock,
  MessageCircle,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  Save,
  FileText,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';

const functions = getFunctions(undefined, 'europe-west1');

// Componente notifica
const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${
          type === 'error' 
            ? 'bg-red-900/80 text-red-300 border-red-500/30' 
            : 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
        } backdrop-blur-md shadow-lg max-w-sm`}
      >
        <AlertTriangle className={type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
        <p className="flex-1">{message}</p>
        <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function NewClient() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [copied, setCopied] = useState(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [isRateizzato, setIsRateizzato] = useState(false);
  const [rates, setRates] = useState([]);
  const [newRate, setNewRate] = useState({ amount: '', dueDate: '', paid: false });
  const [inviteMessageTemplate, setInviteMessageTemplate] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      planType: '',
      duration: '',
      customStartDate: new Date().toISOString().split('T')[0],
      customExpiryDate: '',
      paymentAmount: '',
      paymentMethod: '',
      expiryDays: 7,
      welcomeMessage: '',
    }
  });

  const customStartDate = watch('customStartDate');

  // Carica template messaggio dal tenant
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const tenantRef = doc(db, 'tenants', getCurrentTenantId());
        const tenantSnap = await getDoc(tenantRef);
        if (tenantSnap.exists() && tenantSnap.data().inviteMessageTemplate) {
          setInviteMessageTemplate(tenantSnap.data().inviteMessageTemplate);
        }
      } catch (err) {
        console.log('Template non caricato:', err);
      }
    };
    loadTemplate();
  }, []);

  // Pre-compilazione da collaboratori/lead
  useEffect(() => {
    if (location.state?.prefill) {
      const prefill = location.state.prefill;
      reset({
        name: prefill.name || '',
        email: prefill.email || '',
        phone: prefill.phone || '',
        planType: prefill.planType || '',
        duration: prefill.duration ? String(prefill.duration) : '',
        paymentAmount: prefill.paymentAmount ? String(prefill.paymentAmount) : '',
        paymentMethod: prefill.paymentMethod || '',
        customStartDate: prefill.customStartDate || new Date().toISOString().split('T')[0],
        expiryDays: 7,
        welcomeMessage: '',
      });
      
      if (prefill.duration) {
        setUseCustomDate(false);
      }
    }
  }, [location.state, reset]);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  };

  const onSubmit = async (data) => {
    if (!auth.currentUser) {
      showNotification("Devi essere autenticato per creare un invito.", 'error');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcola prezzo totale
      let totalPrice = 0;
      if (isRateizzato && rates.length > 0) {
        totalPrice = rates.reduce((sum, rate) => sum + (parseFloat(rate.amount) || 0), 0);
      } else if (data.paymentAmount) {
        totalPrice = parseFloat(data.paymentAmount) || 0;
      }

      // Calcola date
      let startDate = new Date(data.customStartDate);
      let expiryDate;
      
      if (useCustomDate && data.customExpiryDate) {
        expiryDate = new Date(data.customExpiryDate);
      } else if (data.duration) {
        expiryDate = new Date(startDate);
        expiryDate.setMonth(expiryDate.getMonth() + parseInt(data.duration, 10));
        expiryDate.setDate(expiryDate.getDate() + 7); // +7 giorni di grazia
      }

      // Prepara i dati per l'invito
      const clientData = {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        planType: data.planType,
        duration: data.duration ? parseInt(data.duration, 10) : null,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate?.toISOString() || null,
        paymentAmount: totalPrice > 0 ? totalPrice : null,
        paymentMethod: data.paymentMethod || null,
        rateizzato: isRateizzato,
        rate: isRateizzato ? rates : [],
      };

      const createClientInvitation = httpsCallable(functions, 'createClientInvitation');
      const result = await createClientInvitation({
        tenantId: getCurrentTenantId(),
        clientData,
        expiryDays: parseInt(data.expiryDays, 10) || 7,
        welcomeMessage: data.welcomeMessage?.trim() || null,
      });

      if (result.data.success) {
        setInvitation(result.data.invitation);
        setShowSuccessModal(true);
        showNotification('Invito creato con successo!', 'success');
      } else {
        throw new Error(result.data.error || 'Errore sconosciuto');
      }
    } catch (error) {
      console.error('Errore creazione invito:', error);
      showNotification(error.message || 'Errore nella creazione dell\'invito', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const openWhatsApp = () => {
    if (invitation?.whatsappLink) {
      window.open(invitation.whatsappLink, '_blank');
    }
  };

  const getFullInviteMessage = () => {
    if (!invitation) return '';
    
    const clientName = invitation.clientData?.name || 'Cliente';
    const tenantName = invitation.tenantName || 'la nostra piattaforma fitness';
    const baseUrl = invitation.url?.split('/invite')[0] || 'la nostra app';
    
    // Usa template personalizzato se presente, altrimenti default
    if (inviteMessageTemplate) {
      return inviteMessageTemplate
        .replace(/\{\{clientName\}\}/g, clientName)
        .replace(/\{\{tenantName\}\}/g, tenantName)
        .replace(/\{\{inviteUrl\}\}/g, invitation.url)
        .replace(/\{\{inviteCode\}\}/g, invitation.code)
        .replace(/\{\{expiryDays\}\}/g, invitation.expiryDays || 7)
        .replace(/\{\{baseUrl\}\}/g, baseUrl);
    }
    
    return `Ciao ${clientName}! 👋

Sei stato invitato a unirti a ${tenantName}! 🎉

📲 *OPZIONE 1 - Link diretto:*
Clicca qui per completare la registrazione:
${invitation.url}

🔢 *OPZIONE 2 - Codice manuale:*
Vai su ${baseUrl} e inserisci il codice:
*${invitation.code}*

⏰ L'invito è valido per ${invitation.expiryDays || 7} giorni.

Ti aspettiamo! 💪`;
  };

  const saveMessageTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      const tenantRef = doc(db, 'tenants', getCurrentTenantId());
      await updateDoc(tenantRef, {
        inviteMessageTemplate: inviteMessageTemplate
      });
      showNotification('Template salvato con successo!', 'success');
      setShowTemplateEditor(false);
    } catch (err) {
      console.error('Errore salvataggio template:', err);
      showNotification('Errore nel salvataggio del template', 'error');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const getDefaultTemplate = () => {
    return `Ciao {{clientName}}! 👋

Sei stato invitato a unirti a {{tenantName}}! 🎉

📲 *OPZIONE 1 - Link diretto:*
Clicca qui per completare la registrazione:
{{inviteUrl}}

🔢 *OPZIONE 2 - Codice manuale:*
Vai su {{baseUrl}} e inserisci il codice:
*{{inviteCode}}*

⏰ L'invito è valido per {{expiryDays}} giorni.

Ti aspettiamo! 💪`;
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setInvitation(null);
    reset();
    navigate('/clients');
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setInvitation(null);
    reset();
    setRates([]);
    setIsRateizzato(false);
    setUseCustomDate(false);
  };

  const inputStyle = "w-full p-3 bg-slate-800/20 border border-slate-700/30 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-slate-500 transition-colors";
  const labelStyle = "block mb-1.5 text-sm font-medium text-slate-300";
  const sectionStyle = "bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-700/30 p-4 sm:p-6";
  const headingStyle = "font-semibold mb-4 text-base text-white border-b border-slate-700/30 pb-3 flex items-center gap-2";
  const errorStyle = "text-red-400 text-sm mt-1";

  return (
    <>
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onDismiss={() => setNotification({ message: '', type: '' })} 
      />
      
      <motion.div 
        className="w-full max-w-2xl mx-auto px-4 sm:px-0" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className={sectionStyle + " mb-6"}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2">
                <Send className="text-blue-400" size={24} />
                Nuovo Cliente
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Crea un invito e invialo via WhatsApp, Link o QR Code
              </p>
            </div>
            <button 
              onClick={() => navigate('/clients')} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/20 hover:bg-slate-800/60 border border-slate-700/30 text-slate-300 text-sm rounded-lg transition-colors"
            >
              <ArrowLeft size={16}/> Indietro
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sezione 1: Anagrafica */}
          <div className={sectionStyle}>
            <h4 className={headingStyle}>
              <User size={18} className="text-blue-400" />
              1. Dati Cliente
            </h4>
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Nome e Cognome *</label>
                <input 
                  {...register('name', { 
                    required: 'Il nome è obbligatorio',
                    minLength: { value: 2, message: 'Minimo 2 caratteri' }
                  })} 
                  className={inputStyle}
                  placeholder="Mario Rossi"
                />
                {errors.name && <p className={errorStyle}>{errors.name.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>
                    <Mail size={14} className="inline mr-1" />
                    Email (opzionale)
                  </label>
                  <input 
                    type="email" 
                    {...register('email', {
                      pattern: { 
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: 'Email non valida'
                      }
                    })} 
                    className={inputStyle}
                    placeholder="mario@email.com"
                  />
                  {errors.email && <p className={errorStyle}>{errors.email.message}</p>}
                </div>
                
                <div>
                  <label className={labelStyle}>
                    <Phone size={14} className="inline mr-1" />
                    Telefono (opzionale)
                  </label>
                  <input 
                    {...register('phone')} 
                    className={inputStyle}
                    placeholder="+39 333 1234567"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sezione 2: Percorso */}
          <div className={sectionStyle}>
            <h4 className={headingStyle}>
              <Clock size={18} className="text-emerald-400" />
              2. Dettagli Percorso
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Tipo di Percorso *</label>
                  <select 
                    {...register('planType', { required: 'Seleziona il tipo di percorso' })} 
                    className={inputStyle}
                  >
                    <option value="">Seleziona tipo</option>
                    <option value="allenamento">Solo Allenamento</option>
                    <option value="alimentazione">Solo Alimentazione</option>
                    <option value="completo">Completo</option>
                  </select>
                  {errors.planType && <p className={errorStyle}>{errors.planType.message}</p>}
                </div>
                
                <div>
                  <label className={labelStyle}>Modalità Scadenza</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={!useCustomDate} 
                        onChange={() => setUseCustomDate(false)} 
                        className="text-blue-500" 
                      /> 
                      <span className="text-sm text-slate-300">Durata in mesi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={useCustomDate} 
                        onChange={() => setUseCustomDate(true)} 
                        className="text-blue-500" 
                      /> 
                      <span className="text-sm text-slate-300">Data personalizzata</span>
                    </label>
                  </div>
                </div>
              </div>

              {!useCustomDate ? (
                <div>
                  <label className={labelStyle}>Durata del Percorso *</label>
                  <select 
                    {...register('duration', { 
                      required: !useCustomDate ? 'Seleziona la durata' : false 
                    })} 
                    className={inputStyle}
                  >
                    <option value="">Seleziona durata</option>
                    {[...Array(24).keys()].map(i => (
                      <option key={i+1} value={i+1}>{i+1} mes{i > 0 ? 'i' : 'e'}</option>
                    ))}
                  </select>
                  {errors.duration && <p className={errorStyle}>{errors.duration.message}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Data di Inizio</label>
                    <input 
                      type="date" 
                      {...register('customStartDate')} 
                      className={inputStyle} 
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Data di Scadenza *</label>
                    <input 
                      type="date" 
                      {...register('customExpiryDate', { 
                        required: useCustomDate ? 'Inserisci la data di scadenza' : false,
                        validate: value => {
                          if (!useCustomDate) return true;
                          const start = new Date(customStartDate);
                          const expiry = new Date(value);
                          return expiry >= start || 'La scadenza deve essere dopo l\'inizio';
                        }
                      })} 
                      className={inputStyle} 
                    />
                    {errors.customExpiryDate && <p className={errorStyle}>{errors.customExpiryDate.message}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sezione 3: Pagamento */}
          <div className={sectionStyle}>
            <h4 className={headingStyle}>
              <DollarSign size={18} className="text-amber-400" />
              3. Pagamento (Opzionale)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Importo (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('paymentAmount')} 
                  className={inputStyle}
                  placeholder="150.00"
                />
              </div>
              <div>
                <label className={labelStyle}>Metodo di Pagamento</label>
                <input 
                  {...register('paymentMethod')} 
                  className={inputStyle}
                  placeholder="Es. Bonifico, Contanti..."
                />
              </div>
            </div>

            {/* Rateizzazione */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/30">
              <label className="font-medium text-white text-sm">Pagamento Rateizzato:</label>
              <input 
                type="checkbox" 
                checked={isRateizzato} 
                onChange={e => setIsRateizzato(e.target.checked)} 
                className="rounded" 
              />
            </div>

            {isRateizzato && (
              <div className="mt-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/30">
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Importo</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Scadenza</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Pagata</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.length > 0 ? rates.map((rate, idx) => (
                        <tr key={idx} className="border-b border-slate-700/30">
                          <td className="px-3 py-2 text-white">€{rate.amount}</td>
                          <td className="px-3 py-2 text-slate-300">
                            {rate.dueDate ? new Date(rate.dueDate).toLocaleDateString('it-IT') : '-'}
                          </td>
                          <td className="px-3 py-2">
                            <input 
                              type="checkbox" 
                              checked={rate.paid} 
                              onChange={() => {
                                const updated = rates.map((r, i) => i === idx ? { ...r, paid: !r.paid } : r);
                                setRates(updated);
                              }} 
                              className="rounded" 
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button 
                              type="button" 
                              onClick={() => setRates(rates.filter((_, i) => i !== idx))} 
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-slate-400">Nessuna rata</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <input 
                    type="number" 
                    placeholder="Importo (€)" 
                    value={newRate.amount} 
                    onChange={e => setNewRate({ ...newRate, amount: e.target.value })} 
                    className="flex-1 min-w-[100px] p-3 rounded-lg bg-slate-800/20 border border-slate-700/30 text-white placeholder:text-slate-500" 
                  />
                  <input 
                    type="date" 
                    value={newRate.dueDate} 
                    onChange={e => setNewRate({ ...newRate, dueDate: e.target.value })} 
                    className="flex-1 min-w-[140px] p-3 rounded-lg bg-slate-800/20 border border-slate-700/30 text-white" 
                  />
                  <button 
                    type="button" 
                    onClick={() => { 
                      if (newRate.amount && newRate.dueDate) { 
                        setRates([...rates, newRate]); 
                        setNewRate({ amount: '', dueDate: '', paid: false }); 
                      } 
                    }} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Aggiungi rata
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sezione 4: Impostazioni Invito */}
          <div className={sectionStyle}>
            <h4 className={headingStyle}>
              <Link2 size={18} className="text-purple-400" />
              4. Impostazioni Invito
            </h4>
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Validità Invito</label>
                <select {...register('expiryDays')} className={inputStyle}>
                  <option value="3">3 giorni</option>
                  <option value="7">7 giorni (consigliato)</option>
                  <option value="14">14 giorni</option>
                  <option value="30">30 giorni</option>
                </select>
              </div>
              
              <div>
                <label className={labelStyle}>
                  <MessageCircle size={14} className="inline mr-1" />
                  Messaggio di Benvenuto (opzionale)
                </label>
                <textarea 
                  {...register('welcomeMessage')} 
                  className={inputStyle + " h-24 resize-none"}
                  placeholder="Es: Benvenuto nel team! Non vedo l'ora di iniziare questo percorso insieme..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center md:justify-end pt-2 pb-4">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-medium disabled:cursor-not-allowed"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creazione in corso...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Crea Invito
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && invitation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          >
            <motion.div
              className="bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700/40 p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-emerald-400" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-white">Invito Creato!</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Scegli come inviare l'invito a {invitation.clientData?.name}
                </p>
              </div>

              {/* Codice Invito */}
              <div className="bg-slate-800/20 rounded-lg p-4 mb-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 font-medium">CODICE INVITO</p>
                  <button
                    onClick={() => copyToClipboard(invitation.code, 'code')}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    {copied === 'code' ? <Check size={12} /> : <Copy size={12} />}
                    {copied === 'code' ? 'Copiato!' : 'Copia'}
                  </button>
                </div>
                <p className="font-mono text-2xl text-white tracking-[0.3em] text-center select-all">
                  {invitation.code}
                </p>
              </div>

              {/* Link Invito */}
              <div className="bg-slate-800/20 rounded-lg p-4 mb-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 font-medium">
                    <Link2 size={12} className="inline mr-1" />
                    LINK INVITO
                  </p>
                  <button
                    onClick={() => copyToClipboard(invitation.url, 'link')}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    {copied === 'link' ? <Check size={12} /> : <Copy size={12} />}
                    {copied === 'link' ? 'Copiato!' : 'Copia'}
                  </button>
                </div>
                <p className="font-mono text-xs text-slate-300 break-all select-all">
                  {invitation.url}
                </p>
              </div>

              {/* QR Code Toggle */}
              <button
                onClick={() => setShowQrCode(!showQrCode)}
                className="w-full py-3 px-4 bg-slate-800/20 hover:bg-slate-800/60 border border-slate-700/30 rounded-lg flex items-center justify-center gap-2 text-slate-300 transition-colors mb-4"
              >
                <QrCode size={18} />
                {showQrCode ? 'Nascondi' : 'Mostra'} QR Code
              </button>

              {/* QR Code */}
              <AnimatePresence>
                {showQrCode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="bg-white rounded-lg p-4 flex justify-center">
                      <QRCode value={invitation.url} size={180} />
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-2">
                      Il cliente può scansionare questo QR per registrarsi
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Azioni principali */}
              <div className="space-y-3">
                {/* WhatsApp - Azione principale */}
                <motion.button
                  onClick={openWhatsApp}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle size={18} />
                  Invia su WhatsApp
                </motion.button>

                {/* Copia messaggio completo */}
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(getFullInviteMessage(), 'message')}
                    className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {copied === 'message' ? <Check size={18} /> : <Copy size={18} />}
                    {copied === 'message' ? 'Copiato!' : 'Copia Messaggio'}
                  </button>
                  <button
                    onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                    className="py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                    title="Modifica template messaggio"
                  >
                    <Edit3 size={18} />
                  </button>
                </div>

                {/* Editor Template */}
                <AnimatePresence>
                  {showTemplateEditor && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/50 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <FileText size={12} />
                            TEMPLATE MESSAGGIO
                          </p>
                          <button
                            onClick={() => setInviteMessageTemplate(getDefaultTemplate())}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Ripristina default
                          </button>
                        </div>
                        <textarea
                          value={inviteMessageTemplate || getDefaultTemplate()}
                          onChange={(e) => setInviteMessageTemplate(e.target.value)}
                          className="w-full h-48 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-white text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
                          placeholder="Scrivi il tuo template..."
                        />
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-slate-500">
                            Variabili: <code className="text-blue-400">{'{{clientName}}'}</code>, <code className="text-blue-400">{'{{tenantName}}'}</code>, <code className="text-blue-400">{'{{inviteUrl}}'}</code>, <code className="text-blue-400">{'{{inviteCode}}'}</code>, <code className="text-blue-400">{'{{expiryDays}}'}</code>, <code className="text-blue-400">{'{{baseUrl}}'}</code>
                          </p>
                          <button
                            onClick={saveMessageTemplate}
                            disabled={isSavingTemplate}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                          >
                            {isSavingTemplate ? (
                              <><Loader2 className="animate-spin" size={14} /> Salvataggio...</>
                            ) : (
                              <><Save size={14} /> Salva come Template Predefinito</>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Info scadenza */}
              <div className="mt-4 pt-4 border-t border-slate-700/30 text-center">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <Clock size={12} />
                  Invito valido per {invitation.expiryDays || 7} giorni
                </p>
              </div>

              {/* Azioni secondarie */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateAnother}
                  className="flex-1 py-2 text-blue-400 hover:text-blue-300 text-sm text-center transition-colors border border-slate-700/30 rounded-lg"
                >
                  Crea altro invito
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-2 text-slate-400 hover:text-white text-sm text-center transition-colors"
                >
                  Vai ai clienti
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
