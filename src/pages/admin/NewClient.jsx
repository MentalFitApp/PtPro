import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, firebaseConfig, auth } from '../../firebase.js';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getTenantDoc, getTenantCollection, getTenantSubcollection, CURRENT_TENANT_ID } from '../../config/tenant';
import { Save, ArrowLeft, DollarSign, Copy, Check, X, AlertTriangle, Link2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${
          type === 'error' ? 'bg-red-900/80 text-red-300 border-red-500/30' : 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
        } backdrop-blur-md shadow-lg`}
      >
        <AlertTriangle className={type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
        <p>{message}</p>
        <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const generatePassword = () => {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

export default function NewClient() {
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, reset, watch, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      planType: '',
      duration: '',
      customStartDate: new Date().toISOString().split('T')[0],
      customExpiryDate: '',
      paymentAmount: '',
      paymentMethod: ''
    }
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newClientCredentials, setNewClientCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [isRateizzato, setIsRateizzato] = useState(false);
  const [rates, setRates] = useState([]);
  const [newRate, setNewRate] = useState({ amount: '', dueDate: '', paid: false });
  const [magicLink, setMagicLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const customStartDate = watch('customStartDate');

  const functions = getFunctions(undefined, 'europe-west1');

  // PRECOMPILAZIONE DA COLLABORATORI – AGGIORNATO E CORRETTO
  useEffect(() => {
    if (location.state?.prefill) {
      const prefill = location.state.prefill;
      console.log('Dati precompilati ricevuti:', prefill);

      reset({
        name: prefill.name || '',
        email: prefill.email || '',
        phone: prefill.phone || '',
        planType: prefill.planType || '',
        duration: prefill.duration ? String(prefill.duration) : '',
        paymentAmount: prefill.paymentAmount ? String(prefill.paymentAmount) : '',
        paymentMethod: prefill.paymentMethod || '',
        customStartDate: prefill.customStartDate || new Date().toISOString().split('T')[0],
      });

      // Se c'è durata, forziamo "Durata in mesi"
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
      showNotification("Devi essere autenticato come coach o admin per creare un cliente.", 'error');
      navigate('/login');
      return;
    }

    console.log('🔍 DEBUG - Inizio creazione cliente:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
      currentUserId: auth.currentUser.uid,
      currentUserEmail: auth.currentUser.email
    });

    const tempPassword = generatePassword();
    const tempApp = initializeApp(firebaseConfig, `user-creation-${Date.now()}`);
    const tempAuth = getAuth(tempApp);

    try {
      let startDate = new Date(data.customStartDate);
      startDate.setHours(0, 0, 0, 0);
      let expiryDate;
      let isOldClient = false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      if (startDate > today) {
        showNotification("La data di inizio non può essere futura.", 'error');
        return;
      }

      if (useCustomDate && data.customExpiryDate) {
        expiryDate = new Date(data.customExpiryDate);
        if (expiryDate < startDate) {
          showNotification("La data di scadenza deve essere successiva alla data di inizio.", 'error');
          return;
        }
        isOldClient = startDate < currentMonth;
      } else if (data.duration) {
        const durationNum = parseInt(data.duration, 10);
        expiryDate = new Date(startDate);
        expiryDate.setMonth(expiryDate.getMonth() + durationNum);
        expiryDate.setDate(expiryDate.getDate() + 7);
      } else {
        showNotification("Seleziona una durata o una data di scadenza.", 'error');
        return;
      }

      console.log('Inizio creazione cliente:', {
        email: data.email,
        name: data.name,
        paymentAmount: data.paymentAmount,
        userId: auth.currentUser.uid
      });

      const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email.trim(), tempPassword);
      const newUserId = userCredential.user.uid;
      console.log('Utente creato con UID:', newUserId);

      // Calcola il prezzo totale
      let totalPrice = 0;
      if (isRateizzato && rates.length > 0) {
        totalPrice = rates.reduce((sum, rate) => sum + (parseFloat(rate.amount) || 0), 0);
      } else if (data.paymentAmount) {
        totalPrice = parseFloat(data.paymentAmount) || 0;
      }

      const newClientRef = getTenantDoc(db, 'clients', newUserId);
      const clientData = {
        ...data,
        rateizzato: isRateizzato,
        rate: isRateizzato ? rates : [],
        name: data.name,
        name_lowercase: data.name.toLowerCase(),
        email: data.email.trim(),
        phone: data.phone || null,
        status: 'attivo',
        planType: data.planType,
        createdAt: serverTimestamp(),
        startDate,
        scadenza: expiryDate,
        isClient: true,
        firstLogin: true,
        tempPassword: tempPassword,
        isOldClient,
        assignedCoaches: [auth.currentUser.uid],
        statoPercorso: 'Attivo',
        price: totalPrice > 0 ? totalPrice : null
      };
      
      console.log('🔍 DEBUG - Tentativo scrittura documento cliente:', {
        path: newClientRef.path,
        userId: newUserId,
        currentUser: auth.currentUser.uid,
        dataKeys: Object.keys(clientData)
      });
      
      await setDoc(newClientRef, clientData);
      console.log('✅ Documento cliente creato:', newClientRef.path);

      if (data.paymentAmount) {
        const paymentRef = doc(getTenantSubcollection(db, 'clients', newUserId, 'payments'));
        const paymentData = {
          amount: parseFloat(data.paymentAmount),
          duration: useCustomDate ? 'personalizzata' : `${parseInt(data.duration, 10)} mes${parseInt(data.duration, 10) > 1 ? 'i' : 'e'}`,
          paymentMethod: data.paymentMethod || 'N/A',
          paymentDate: serverTimestamp(),
          // isPast NON va sul pagamento - il pagamento è fatto OGGI
          // isOldClient resta sul documento cliente per indicare che è storico
          createdAt: serverTimestamp()
        };
        console.log('Tentativo creazione pagamento:', { paymentRef: paymentRef.path, paymentData });
        await setDoc(paymentRef, paymentData);
        console.log('Documento pagamento creato:', paymentRef.path);
      }

      setNewClientCredentials({ name: data.name, email: data.email.trim(), password: tempPassword, clientId: newUserId });
      
      // Genera automaticamente il Magic Link
      try {
        const generateMagicLink = httpsCallable(functions, 'generateMagicLink');
        const linkResult = await generateMagicLink({
          clientId: newUserId,
          tenantId: CURRENT_TENANT_ID,
          email: data.email.trim(),
          name: data.name
        });
        if (linkResult.data.success) {
          setMagicLink(linkResult.data.magicLink);
          console.log('✅ Magic Link generato:', linkResult.data.magicLink);
        }
      } catch (linkError) {
        console.error('⚠️ Errore generazione Magic Link:', linkError);
        // Non blocchiamo, il cliente può comunque usare le credenziali normali
      }
      
      setShowSuccessModal(true);
      showNotification('Cliente creato con successo!', 'success');
      reset();
    } catch (error) {
      console.error("❌ Errore nella creazione del cliente:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
        data,
        isMobile: /Mobi|Android/i.test(navigator.userAgent),
        userAgent: navigator.userAgent
      });
      
      if (error.code === 'permission-denied') {
        showNotification(`Permessi insufficienti per creare il cliente. Errore: ${error.message}. Verifica i tuoi ruoli in Firestore.`, 'error');
      } else if (error.code === 'auth/email-already-in-use') {
        showNotification('Questa email è già in uso da un altro utente.', 'error');
      } else {
        showNotification(`Errore: ${error.code || 'unknown'} - ${error.message}`, 'error');
      }
    } finally {
      await deleteApp(tempApp);
    }
  };

  const copyToClipboard = () => {
    let text;
    
    if (magicLink) {
      // Usa il Magic Link (preferito)
      text = `Ciao ${newClientCredentials.name}, ti invio il link per entrare nel tuo profilo personale dove inizialmente potrai iniziare a caricare i check settimanalmente, vedere i pagamenti e scadenza abbonamento. A breve ci saranno altre novità che potrai vedere su questa piattaforma: Alimentazione, community, videocorsi, e altro ancora 💪 Tu come stai?\n\n🔗 LINK ACCESSO RAPIDO (valido 48h):\n${magicLink}\n\n⚠️ Clicca il link sopra per impostare la tua password e accedere direttamente!`;
    } else {
      // Fallback alle credenziali tradizionali
      const loginLink = 'https://www.flowfitpro.it/login';
      text = `Ciao ${newClientCredentials.name}, ti invio il link per entrare nel tuo profilo personale dove inizialmente potrai iniziare a caricare i check settimanalmente, vedere i pagamenti e scadenza abbonamento. A breve ci saranno altre novità che potrai vedere su questa piattaforma: Alimentazione, community, videocorsi, e altro ancora 💪 Tu come stai?\n\nLink: ${loginLink}\nEmail: ${newClientCredentials.email}\nPassword Temporanea: ${newClientCredentials.password}\n\n⚠️ IMPORTANTE: Al primo accesso ti verrà chiesto di impostare una password personale.`;
    }
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyMagicLinkOnly = () => {
    if (magicLink) {
      navigator.clipboard.writeText(magicLink);
      showNotification('Magic Link copiato!', 'success');
    }
  };

  const copyPasswordOnly = () => {
    navigator.clipboard.writeText(newClientCredentials.password);
    showNotification('Password copiata negli appunti!', 'success');
  };

  const copyEmailOnly = () => {
    navigator.clipboard.writeText(newClientCredentials.email);
    showNotification('Email copiata negli appunti!', 'success');
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    reset();
    navigate('/clients');
  };

  const inputStyle = "w-full p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-slate-500 transition-colors";
  const labelStyle = "block mb-1.5 text-sm font-medium text-slate-300";
  const sectionStyle = "bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6";
  const headingStyle = "font-semibold mb-4 text-base text-white border-b border-slate-700/50 pb-3 flex items-center gap-2";
  const errorStyle = "text-red-400 text-sm mt-1";

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <motion.div className="w-full max-w-2xl mx-auto px-4 sm:px-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Onboarding Nuovo Cliente</h1>
              <p className="text-sm text-slate-400 mt-1">Inserisci i dati per creare un nuovo cliente</p>
            </div>
            <button 
              onClick={() => navigate('/clients')} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm rounded-lg transition-colors"
            >
              <ArrowLeft size={16}/> Indietro
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className={sectionStyle}>
            <h4 className={headingStyle}>1. Anagrafica</h4>
            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Nome e Cognome*</label>
                <input 
                  {...register('name', { 
                    required: 'Il nome è obbligatorio',
                    minLength: { value: 2, message: 'Il nome deve essere lungo almeno 2 caratteri' }
                  })} 
                  className={inputStyle} 
                />
                {errors.name && <p className={errorStyle}>{errors.name.message}</p>}
              </div>
              <div>
                <label className={labelStyle}>Email (sarà il suo username)*</label>
                <input 
                  type="email" 
                  {...register('email', { 
                    required: 'L\'email è obbligatoria',
                    pattern: { 
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Inserisci un\'email valida'
                    }
                  })} 
                  className={inputStyle} 
                />
                {errors.email && <p className={errorStyle}>{errors.email.message}</p>}
              </div>
              <div>
                <label className={labelStyle}>Telefono (Opzionale)</label>
                <input 
                  {...register('phone', { 
                    pattern: { 
                      value: /^\+?[0-9]{7,15}$/,
                      message: 'Inserisci un numero di telefono valido (7-15 cifre)'
                    }
                  })} 
                  className={inputStyle} 
                />
                {errors.phone && <p className={errorStyle}>{errors.phone.message}</p>}
              </div>
            </div>
          </div>
          <div className={sectionStyle}>
            <h4 className={headingStyle}>2. Dettagli Percorso</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Tipo di Percorso*</label>
                <select 
                  {...register('planType', { required: 'Il tipo di percorso è obbligatorio' })} 
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
                <label className={labelStyle}>Modalità Scadenza*</label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      checked={!useCustomDate} 
                      onChange={() => setUseCustomDate(false)} 
                      className="text-rose-500" 
                    /> 
                    Durata in mesi
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      checked={useCustomDate} 
                      onChange={() => setUseCustomDate(true)} 
                      className="text-rose-500" 
                    /> 
                    Data personalizzata
                  </label>
                </div>
                {!useCustomDate ? (
                  <div>
                    <label className={labelStyle}>Durata del Percorso*</label>
                    <select 
                      {...register('duration', { required: 'La durata è obbligatoria quando si usa "Durata in mesi"' })} 
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
                  <div>
                    <label className={labelStyle}>Data di Inizio*</label>
                    <input 
                      type="date" 
                      {...register('customStartDate', { 
                        required: 'La data di inizio è obbligatoria quando si usa "Data personalizzata"',
                        validate: value => {
                          const start = new Date(value);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return start <= today || 'La data di inizio non può essere futura';
                        }
                      })} 
                      className={inputStyle} 
                    />
                    {errors.customStartDate && <p className={errorStyle}>{errors.customStartDate.message}</p>}
                    <label className={labelStyle}>Data di Scadenza*</label>
                    <input 
                      type="date" 
                      {...register('customExpiryDate', { 
                        required: 'La data di scadenza è obbligatoria quando si usa "Data personalizzata"',
                        validate: value => {
                          if (!useCustomDate) return true;
                          const start = new Date(customStartDate);
                          const expiry = new Date(value);
                          return expiry >= start || 'La data di scadenza deve essere successiva alla data di inizio';
                        }
                      })} 
                      className={inputStyle} 
                    />
                    {errors.customExpiryDate && <p className={errorStyle}>{errors.customExpiryDate.message}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={sectionStyle}>
            <h4 className={headingStyle}><DollarSign size={20}/> 3. Primo Pagamento (Opzionale)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Importo Pagato (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  {...register('paymentAmount', { 
                    validate: value => !value || parseFloat(value) > 0 || 'L\'importo deve essere maggiore di 0'
                  })} 
                  className={inputStyle} 
                />
                {errors.paymentAmount && <p className={errorStyle}>{errors.paymentAmount.message}</p>}
              </div>
              <div>
                <label className={labelStyle}>Metodo di Pagamento</label>
                <input 
                  {...register('paymentMethod')} 
                  className={inputStyle} 
                  placeholder="Es. Bonifico" 
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <label className="font-medium text-white text-sm">Pagamento Rateizzato:</label>
            <input type="checkbox" checked={isRateizzato} onChange={e => setIsRateizzato(e.target.checked)} className="rounded" />
          </div>
          {isRateizzato && (
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6">
              <h3 className="text-base font-semibold text-white mb-4">Rate iniziali</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">Importo</th>
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">Scadenza</th>
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">Pagata</th>
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                  {rates.length > 0 ? rates.map((rate, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50">
                      <td className="px-3 py-2 text-white">€{rate.amount}</td>
                      <td className="px-3 py-2 text-slate-300">{rate.dueDate ? new Date(rate.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={rate.paid} onChange={() => {
                          const updated = rates.map((r, i) => i === idx ? { ...r, paid: !r.paid } : r);
                          setRates(updated);
                        }} className="rounded" />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => setRates(rates.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 text-sm transition-colors">Elimina</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="text-center py-4 text-slate-400">Nessuna rata</td></tr>
                  )}
                </tbody>
              </table>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <input type="number" placeholder="Importo (€)" value={newRate.amount} onChange={e => setNewRate({ ...newRate, amount: e.target.value })} className="flex-1 min-w-[100px] p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-white placeholder:text-slate-500" />
                <input type="date" value={newRate.dueDate} onChange={e => setNewRate({ ...newRate, dueDate: e.target.value })} className="flex-1 min-w-[140px] p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-white" />
                <button type="button" onClick={() => { if (newRate.amount && newRate.dueDate) { setRates([...rates, newRate]); setNewRate({ amount: '', dueDate: '', paid: false }); } }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">Aggiungi rata</button>
              </div>
            </div>
          )}
          <div className="flex justify-center md:justify-end pt-2 pb-4">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-medium disabled:cursor-not-allowed"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              <Save size={18} /> {isSubmitting ? 'Creazione in corso...' : 'Crea Cliente'}
            </motion.button>
          </div>
        </form>
      </motion.div>
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          >
            <motion.div
              className="bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 text-center w-full max-w-md shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold text-white">Cliente Creato!</h2>
              <p className="text-slate-400 text-sm mt-2">
                {magicLink ? 'Invia il Magic Link al cliente per un accesso rapido.' : 'Copia e invia le credenziali al cliente.'}
              </p>
              
              {/* Magic Link Section - Mostrato se disponibile */}
              {magicLink && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-left">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-emerald-400 font-medium">🔗 Magic Link (valido 48h)</p>
                    <button
                      onClick={copyMagicLinkOnly}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      <Copy size={12} /> Copia
                    </button>
                  </div>
                  <p className="font-mono text-emerald-300 text-xs break-all select-all">{magicLink}</p>
                  <p className="text-xs text-emerald-400/70 mt-2">✨ Il cliente clicca il link → imposta password → accede!</p>
                </div>
              )}
              
              {/* Credenziali tradizionali - sempre visibili come backup */}
              <div className={`my-4 space-y-3 text-left ${magicLink ? 'opacity-60' : ''}`}>
                {magicLink && (
                  <p className="text-xs text-slate-500 text-center mb-2">─── Credenziali di backup ───</p>
                )}
                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400">Email (Username)</p>
                    <button
                      onClick={copyEmailOnly}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <Copy size={12} /> Copia
                    </button>
                  </div>
                  <p className="font-mono text-white break-all text-sm">{newClientCredentials.email}</p>
                </div>
                {!magicLink && (
                  <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400">Password Temporanea</p>
                      <button
                        onClick={copyPasswordOnly}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <Copy size={12} /> Copia
                      </button>
                    </div>
                    <p className="font-mono text-white break-all select-all">{newClientCredentials.password}</p>
                    <p className="text-xs text-amber-400 mt-2">⚠️ Attenzione agli spazi! Copia esattamente</p>
                  </div>
                )}
              </div>
              
              <motion.button
                onClick={copyToClipboard}
                className={`w-full py-3 ${magicLink ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? (
                  <>
                    <Check size={18} /> Copiato!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> {magicLink ? 'Copia Messaggio con Magic Link' : 'Copia Credenziali'}
                  </>
                )}
              </motion.button>
              <button
                onClick={handleCloseModal}
                className="w-full mt-3 py-2 text-slate-400 hover:text-white text-sm text-center transition-colors"
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}