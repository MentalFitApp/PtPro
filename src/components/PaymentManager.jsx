import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp, writeBatch, getDoc } from 'firebase/firestore';
import { DollarSign, Plus, Trash2, Calendar, X, AlertTriangle, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTI UI RIUTILIZZABILI ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[1000] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-zinc-950/80 rounded-2xl gradient-border p-6 text-center shadow-2xl shadow-black/40"
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-50">Conferma Eliminazione</h3>
          <p className="text-sm text-slate-400 mt-2">Sei sicuro di voler eliminare questo pagamento? L'operazione non è reversibile.</p>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={onClose} className="px-6 py-2 text-sm font-semibold text-slate-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Annulla</button>
            <button onClick={onConfirm} className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Elimina</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-5 right-5 z-[1000] flex items-center gap-4 p-4 rounded-lg border bg-red-900/80 text-red-300 border-red-500/30 backdrop-blur-md shadow-lg"
      >
        <AlertTriangle className={type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
        <p>{message}</p>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/10">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const toDate = (x) => {
  if (!x) return null;
  if (typeof x?.toDate === 'function') return x.toDate();
  const d = new Date(x);
  return isNaN(d) ? null : d;
};

export default function PaymentManager({ clientId }) {
  console.log('PaymentManager renderizzato per clientId:', clientId);

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      amount: '',
      duration: '',
      paymentMethod: ''
    }
  });
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [currentExpiry, setCurrentExpiry] = useState(null);

  const showNotification = (message, type = 'error') => {
    console.log('Mostra notifica:', message, type);
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  };

  useEffect(() => {
    if (!clientId) {
      console.error('clientId non valido:', clientId);
      showNotification('ID cliente non valido.', 'error');
      return;
    }

    // Fetch pagamenti
    const q = query(collection(db, 'clients', clientId, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Pagamenti caricati:', snapshot.docs.length);
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Errore fetch pagamenti:', error);
      showNotification(`Errore nel caricamento dei pagamenti: ${error.message}`, 'error');
    });

    // Fetch scadenza corrente
    const fetchClient = async () => {
      try {
        const clientRef = doc(db, 'clients', clientId);
        const clientSnap = await getDoc(clientRef);
        if (clientSnap.exists()) {
          setCurrentExpiry(toDate(clientSnap.data().scadenza));
        } else {
          showNotification('Cliente non trovato.', 'error');
        }
      } catch (error) {
        console.error('Errore fetch cliente:', error);
        showNotification(`Errore nel caricamento dei dati cliente: ${error.message}`, 'error');
      }
    };
    fetchClient();

    return () => unsubscribe();
  }, [clientId]);

  const onAddPayment = async (data) => {
    try {
      const durationNum = parseInt(data.duration, 10);
      const amountNum = parseFloat(data.amount);
      if (isNaN(durationNum) || durationNum <= 0) {
        showNotification('La durata deve essere un numero positivo.', 'error');
        return;
      }
      if (isNaN(amountNum) || amountNum <= 0) {
        showNotification('L\'importo deve essere un numero positivo.', 'error');
        return;
      }

      const batch = writeBatch(db);
      const newPaymentRef = doc(collection(db, 'clients', clientId, 'payments'));
      batch.set(newPaymentRef, {
        amount: amountNum,
        duration: `${durationNum} mes${durationNum > 1 ? 'i' : 'e'}`,
        paymentMethod: data.paymentMethod || 'Non specificato',
        paymentDate: serverTimestamp(),
      });

      const clientRef = doc(db, 'clients', clientId);
      let newExpiry = currentExpiry && currentExpiry > new Date() ? new Date(currentExpiry) : new Date();
      newExpiry.setMonth(newExpiry.getMonth() + durationNum);
      batch.update(clientRef, { scadenza: newExpiry });

      await batch.commit();
      reset();
      setShowForm(false);
      showNotification('Pagamento aggiunto con successo!', 'success');
    } catch (error) {
      console.error("Errore nell'aggiungere il pagamento:", error.code, error.message);
      if (error.code === 'permission-denied') {
        showNotification('Permessi insufficienti per aggiungere il pagamento.', 'error');
      } else {
        showNotification(`Errore nell'aggiunta del pagamento: ${error.message}`, 'error');
      }
    }
  };

  const onQuickRenew = async () => {
    try {
      const batch = writeBatch(db);
      const newPaymentRef = doc(collection(db, 'clients', clientId, 'payments'));
      batch.set(newPaymentRef, {
        amount: 100,
        duration: '1 mese',
        paymentMethod: 'Rinnovo rapido',
        paymentDate: serverTimestamp(),
      });

      const clientRef = doc(db, 'clients', clientId);
      let newExpiry = currentExpiry && currentExpiry > new Date() ? new Date(currentExpiry) : new Date();
      newExpiry.setMonth(newExpiry.getMonth() + 1);
      batch.update(clientRef, { scadenza: newExpiry });

      await batch.commit();
      showNotification('Rinnovo rapido completato con successo!', 'success');
    } catch (error) {
      console.error("Errore nel rinnovo rapido:", error.code, error.message);
      if (error.code === 'permission-denied') {
        showNotification('Permessi insufficienti per il rinnovo rapido.', 'error');
      } else {
        showNotification(`Errore nel rinnovo rapido: ${error.message}`, 'error');
      }
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      const paymentRef = doc(db, 'clients', clientId, 'payments', paymentToDelete.id);
      await deleteDoc(paymentRef);
      showNotification('Pagamento eliminato con successo!', 'success');
    } catch (error) {
      console.error("Errore nell'eliminazione del pagamento:", error.code, error.message);
      showNotification(`Errore nell'eliminazione del pagamento: ${error.message}`, 'error');
    } finally {
      setPaymentToDelete(null);
    }
  };

  const inputStyle = "w-full p-2.5 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 placeholder:text-slate-500";
  const labelStyle = "block mb-1 text-sm font-medium text-slate-300";
  const errorStyle = "text-red-500 text-sm mt-1";

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <ConfirmationModal 
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
      />
      <div className="relative z-[100]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-rose-300 flex items-center gap-2">
            <DollarSign size={20} /> Gestione Pagamenti
          </h3>
          <div className="flex gap-3">
            <motion.button 
              onClick={() => {
                console.log('Cliccato Rinnovo Rapido');
                onQuickRenew();
              }} 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors z-[100]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCw size={16} /> Rinnovo Rapido (1 mese)
            </motion.button>
            <motion.button 
              onClick={() => {
                console.log('Cliccato Aggiungi Rinnovo, showForm:', !showForm);
                setShowForm(!showForm);
              }} 
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors z-[100]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Annulla' : 'Aggiungi Rinnovo'}
            </motion.button>
          </div>
        </div>
        
        <AnimatePresence>
          {showForm && (
            <motion.form 
              onSubmit={handleSubmit(onAddPayment)} 
              className="space-y-4 mb-6 pt-4 border-t border-white/10 z-[100]"
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Importo Pagato (€)*</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    {...register('amount', { 
                      required: 'L\'importo è obbligatorio',
                      min: { value: 0.01, message: 'L\'importo deve essere maggiore di 0' }
                    })} 
                    className={inputStyle} 
                  />
                  {errors.amount && <p className={errorStyle}>{errors.amount.message}</p>}
                </div>
                <div>
                  <label className={labelStyle}>Durata Rinnovo (mesi)*</label>
                  <select 
                    {...register('duration', { 
                      required: 'La durata è obbligatoria',
                      validate: value => parseInt(value) > 0 || 'La durata deve essere maggiore di 0'
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
                <div className="md:col-span-2">
                  <label className={labelStyle}>Metodo di Pagamento*</label>
                  <input 
                    {...register('paymentMethod', { required: 'Il metodo di pagamento è obbligatorio' })} 
                    className={inputStyle} 
                    placeholder="Es. Bonifico" 
                  />
                  {errors.paymentMethod && <p className={errorStyle}>{errors.paymentMethod.message}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <motion.button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed z-[100]"
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                >
                  {isSubmitting ? 'Salvataggio...' : 'Salva Pagamento'}
                </motion.button>
                <motion.button 
                  type="button" 
                  onClick={() => {
                    console.log('Cliccato Annulla form');
                    setShowForm(false);
                    reset();
                  }} 
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg font-semibold transition z-[100]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Annulla
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        
        <h4 className="font-semibold text-slate-200 mb-3 mt-4">Cronologia Rinnovi</h4>
        <div className="space-y-2">
          {payments.length > 0 ? payments.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3 bg-zinc-900/70 rounded-md border border-white/10">
              <div className="flex items-center gap-3">
                <Calendar className="text-slate-400"/>
                <div>
                  <p className="font-semibold text-slate-100">{p.duration} - €{p.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">Pagato il {toDate(p.paymentDate)?.toLocaleDateString('it-IT')}{p.paymentMethod && ` via ${p.paymentMethod}`}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  console.log('Cliccato Elimina pagamento:', p.id);
                  setPaymentToDelete(p);
                }} 
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-md transition-colors"
              >
                <Trash2 size={16}/>
              </button>
            </div>
          )) : <p className="text-sm text-slate-500">Nessun pagamento registrato.</p>}
        </div>
      </div>
    </>
  );
}