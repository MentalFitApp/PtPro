import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
// --- 1. IMPORTIAMO LE NUOVE ICONE ---
import { Save, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

// Funzione per formattare la data per l'input type="date" (invariata)
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
  if (isNaN(d)) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EditClient() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const docRef = doc(db, 'clients', clientId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const clientData = docSnap.data();
          setClientName(clientData.name); // Salviamo il nome per il titolo
          reset({
            ...clientData,
            scadenza: formatDateForInput(clientData.scadenza) // Assicuriamoci che il nome del campo sia corretto
          });
        } else {
          navigate('/clients');
        }
      } catch (error) {
        console.error("Errore nel caricamento del cliente:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientId, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        ...data,
        scadenza: data.scadenza ? new Date(data.scadenza) : null,
      });
      navigate(`/client/${clientId}`); // Torniamo alla pagina dettaglio del cliente
    } catch (error) {
      console.error("Errore nell'aggiornamento del cliente: ", error);
    }
  };

  // --- 2. NUOVI STILI PER IL FORM ---
  const inputStyle = "w-full p-2.5 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-200";
  const labelStyle = "block mb-1.5 text-sm font-medium text-slate-400";

  if (loading) return <div className="text-center p-8 text-slate-400">Caricamento dati cliente...</div>;

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto bg-zinc-950/60 backdrop-blur-xl rounded-xl gradient-border p-6 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-50">Modifica Cliente</h1>
            <p className="text-rose-500 font-semibold">{clientName}</p>
        </div>
        <button 
          onClick={() => navigate(`/client/${clientId}`)} 
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg text-sm text-slate-300 transition-colors"
        >
          <ArrowLeft size={16} /> Annulla
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={labelStyle}>Nome e Cognome</label>
          <input {...register('name', { required: "Il nome è obbligatorio" })} className={inputStyle} />
        </div>
        <div>
          <label className={labelStyle}>Email</label>
          <input type="email" {...register('email', { required: "L'email è obbligatoria" })} className={inputStyle} />
        </div>
        <div>
          <label className={labelStyle}>Telefono (Opzionale)</label>
          <input {...register('phone')} className={inputStyle} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-white/10">
          <div>
            <label className={labelStyle}>Stato Cliente</label>
            <select {...register('status')} className={inputStyle}>
              <option value="attivo">Attivo</option>
              <option value="in prova">In Prova</option>
              <option value="sospeso">Sospeso</option>
              <option value="scaduto">Scaduto</option>
            </select>
          </div>
          <div>
            <label className={labelStyle}>Data Scadenza</label>
            <input type="date" {...register('scadenza')} className={inputStyle} />
          </div>
        </div>
        <div className="flex justify-end pt-5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:bg-rose-900 disabled:cursor-not-allowed"
          >
            <Save size={18} /> {isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
