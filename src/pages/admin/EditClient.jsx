import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Save, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatDateForInput = (date) => {
  if (!date) return '';
  try {
    const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    if (isNaN(d)) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Errore in formatDateForInput:', error);
    return '';
  }
};

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
        <p>{message}</p>
        <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function EditClient() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'attivo',
      scadenza: ''
    }
  });
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  };

  useEffect(() => {
    if (!clientId) {
      showNotification('ID cliente non valido.', 'error');
      navigate('/clients');
      return;
    }

    const fetchClient = async () => {
      try {
        const docRef = doc(db, 'clients', clientId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const clientData = docSnap.data();
          setClientName(clientData.name || 'Cliente');
          reset({
            name: clientData.name || '',
            email: clientData.email || '',
            phone: clientData.phone || '',
            status: clientData.status || 'attivo',
            scadenza: formatDateForInput(clientData.scadenza)
          });
        } else {
          showNotification('Cliente non trovato.', 'error');
          navigate('/clients');
        }
      } catch (error) {
        console.error("Errore nel caricamento del cliente:", error.code, error.message);
        showNotification(`Errore nel caricamento del cliente: ${error.message}`, 'error');
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientId, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      const updatedData = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        status: data.status,
        scadenza: data.scadenza ? new Date(data.scadenza) : null,
      };
      await updateDoc(clientRef, updatedData);
      showNotification('Cliente aggiornato con successo!', 'success');
      navigate(`/client/${clientId}`);
    } catch (error) {
      console.error("Errore nell'aggiornamento del cliente:", error.code, error.message);
      if (error.code === 'permission-denied') {
        showNotification('Permessi insufficienti per aggiornare il cliente.', 'error');
      } else {
        showNotification(`Errore nell'aggiornamento del cliente: ${error.message}`, 'error');
      }
    }
  };

  const handleCancel = () => {
    reset();
    navigate(`/client/${clientId}`);
  };

  const inputStyle = "w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-200";
  const labelStyle = "block mb-1.5 text-sm font-medium text-slate-400";
  const errorStyle = "text-red-500 text-sm mt-1";

  if (loading) return <div className="text-center p-8 text-slate-400">Caricamento dati cliente...</div>;

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <motion.div 
        className="w-full max-w-2xl mx-auto bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700 p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Modifica Cliente</h1>
            <p className="text-rose-500 font-semibold">{clientName}</p>
          </div>
          <button 
            onClick={handleCancel}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <X size={16} /> Annulla
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            <label className={labelStyle}>Email*</label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-white/10">
            <div>
              <label className={labelStyle}>Stato Cliente*</label>
              <select 
                {...register('status', { required: 'Lo stato è obbligatorio' })} 
                className={inputStyle}
              >
                <option value="attivo">Attivo</option>
                <option value="in prova">In Prova</option>
                <option value="sospeso">Sospeso</option>
                <option value="scaduto">Scaduto</option>
              </select>
              {errors.status && <p className={errorStyle}>{errors.status.message}</p>}
            </div>
            <div>
              <label className={labelStyle}>Data Scadenza*</label>
              <input 
                type="date" 
                {...register('scadenza', { 
                  required: 'La data di scadenza è obbligatoria',
                  validate: value => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return new Date(value) >= today || 'La data di scadenza non può essere nel passato';
                  }
                })} 
                className={inputStyle} 
              />
              {errors.scadenza && <p className={errorStyle}>{errors.scadenza.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-5">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:bg-rose-900 disabled:cursor-not-allowed"
              whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
            >
              <Save size={18} /> {isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-white font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={18} /> Annulla
            </motion.button>
          </div>
        </form>
      </motion.div>
    </>
  );
}