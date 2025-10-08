import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db, firebaseConfig } from '../firebase.js'; 
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, writeBatch, collection } from 'firebase/firestore';
import { Save, ArrowLeft, DollarSign, Copy, Check, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Notification = ({ message, type, onDismiss }) => (
    <AnimatePresence>
        {message && (
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${ type === 'error' ? 'bg-red-900/80 text-red-300 border-red-500/30' : '' } backdrop-blur-md shadow-lg`}>
                <AlertTriangle className="text-red-400" /><p>{message}</p>
                <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/10"><X size={16} /></button>
            </motion.div>
        )}
    </AnimatePresence>
);

const generatePassword = () => {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) retVal += charset.charAt(Math.floor(Math.random() * n));
  return retVal;
};

export default function NewClient() {
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newClientCredentials, setNewClientCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  };

  const onSubmit = async (data) => {
    const tempPassword = generatePassword();
    const tempApp = initializeApp(firebaseConfig, `user-creation-${Date.now()}`);
    const tempAuth = getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, tempPassword);
      const newUserId = userCredential.user.uid;
      const batch = writeBatch(db);
      const newClientRef = doc(db, 'clients', newUserId);
      const durationNum = parseInt(data.duration, 10);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + durationNum);
      expiryDate.setDate(expiryDate.getDate() + 7); // Aggiunge 7 giorni
      batch.set(newClientRef, {
        name: data.name, name_lowercase: data.name.toLowerCase(), email: data.email,
        phone: data.phone || null, status: 'attivo', planType: data.planType,
        createdAt: serverTimestamp(), scadenza: expiryDate, isClient: true, firstLogin: true,
        tempPassword: tempPassword
      });
      if (data.paymentAmount) {
        const paymentRef = doc(collection(db, 'clients', newUserId, 'payments'));
        batch.set(paymentRef, {
          amount: parseFloat(data.paymentAmount),
          duration: `${durationNum} mes${durationNum > 1 ? 'i' : 'e'}`,
          paymentMethod: data.paymentMethod || null, paymentDate: serverTimestamp(),
        });
      }
      await batch.commit();
      
      setNewClientCredentials({ name: data.name, email: data.email, password: tempPassword });
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Errore nella creazione del cliente:", error.code, error.message);
      if (error.code === 'permission-denied' || error.message.includes('permission-denied')) {
          showNotification("Permessi insufficienti. Assicurati che il tuo UID admin sia nelle regole di sicurezza di Firestore.");
      } else if (error.code === 'auth/email-already-in-use') {
          showNotification('Questa email è già in uso da un altro utente.');
      } else {
          showNotification('Si è verificato un errore imprevisto.');
      }
    } finally {
      await deleteApp(tempApp);
    }
  };
  
  const copyToClipboard = () => {
      const loginLink = "https://MentalFitApp.github.io/PtPro/#/client-login";
      const text = `Ciao ${newClientCredentials.name},\n\nBenvenuto in PT Manager, la tua area personale per monitorare i progressi e comunicare con il tuo coach!\n\nEcco le credenziali per il tuo primo accesso:\n\nLink: ${loginLink}\nEmail: ${newClientCredentials.email}\nPassword Temporanea: ${newClientCredentials.password}\n\nAl primo accesso ti verrà chiesto di impostare una password personale.\nA presto!`;
      
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    reset();
    navigate('/clients');
  };
  
  const inputStyle = "w-full p-2.5 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 placeholder:text-slate-500";
  const labelStyle = "block mb-1 text-sm font-medium text-slate-300";
  const sectionStyle = "bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6";
  const headingStyle = "font-bold mb-4 text-lg text-rose-300 border-b border-rose-400/20 pb-2 flex items-center gap-2";

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <motion.div className="w-full max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-50">Onboarding Nuovo Cliente</h1>
          <button onClick={() => navigate('/clients')} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-sm rounded-lg transition-colors"><ArrowLeft size={16}/> Torna Indietro</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className={sectionStyle}><h4 className={headingStyle}>1. Anagrafica</h4><div className="space-y-4"><div><label className={labelStyle}>Nome e Cognome*</label><input {...register('name', { required: true })} className={inputStyle} /></div><div><label className={labelStyle}>Email (sarà il suo username)*</label><input type="email" {...register('email', { required: true })} className={inputStyle} /></div><div><label className={labelStyle}>Telefono (Opzionale)</label><input {...register('phone')} className={inputStyle} /></div></div></div>
          <div className={sectionStyle}><h4 className={headingStyle}>2. Dettagli Percorso</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className={labelStyle}>Tipo di Percorso*</label><select {...register('planType', { required: true })} className={inputStyle}><option value="allenamento">Solo Allenamento</option><option value="alimentazione">Solo Alimentazione</option><option value="completo">Completo</option></select></div><div><label className={labelStyle}>Durata del Percorso*</label><select {...register('duration', { required: true })} className={inputStyle}><option value="">Seleziona durata</option>{[...Array(24).keys()].map(i => <option key={i+1} value={i+1}>{i+1} mes{i > 0 ? 'i' : 'e'}</option>)}</select></div></div></div>
          <div className={sectionStyle}><h4 className={headingStyle}><DollarSign size={20}/> 3. Primo Pagamento (Opzionale)</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className={labelStyle}>Importo Pagato (€)</label><input type="number" step="0.01" {...register('paymentAmount')} className={inputStyle} /></div><div><label className={labelStyle}>Metodo di Pagamento</label><input {...register('paymentMethod')} className={inputStyle} placeholder="Es. Bonifico" /></div></div></div>
          <div className="flex justify-end pt-4"><button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50 font-semibold disabled:cursor-not-allowed"><Save size={16}/> {isSubmitting ? 'Creazione in corso...' : 'Crea Cliente e Genera Password'}</button></div>
        </form>
      </motion.div>
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
             <motion.div className="bg-zinc-950/80 rounded-2xl gradient-border p-6 text-center w-full max-w-md shadow-2xl shadow-black/40" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                  <h2 className="text-xl font-bold text-slate-50">Cliente Creato!</h2><p className="text-slate-400 text-sm mt-2">Copia e invia le credenziali al cliente.</p>
                  <div className="my-6 space-y-3 text-left"><div className="bg-zinc-900 p-3 rounded-lg border border-white/10"><p className="text-xs text-slate-400">Email (Username)</p><p className="font-mono text-slate-200">{newClientCredentials.email}</p></div><div className="bg-zinc-900 p-3 rounded-lg border border-white/10"><p className="text-xs text-slate-400">Password Temporanea</p><p className="font-mono text-slate-200">{newClientCredentials.password}</p></div></div>
                  <motion.button onClick={copyToClipboard} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>{copied ? <><Check size={18}/> Copiato!</> : <><Copy size={16}/> Copia Credenziali</>}</motion.button>
                  <button onClick={handleCloseModal} className="w-full mt-3 py-2 text-slate-400 hover:text-white text-sm text-center transition-colors">Chiudi</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}