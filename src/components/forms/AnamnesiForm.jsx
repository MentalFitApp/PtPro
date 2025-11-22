import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// --- 1. NUOVE ICONE DA LUCIDE-REACT ---
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';

export default function AnamnesiForm({ clientId, onSave }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const onSubmit = async (data) => {
    setMessage('');
    setIsError(false);
    try {
      const anamnesiRef = getTenantDoc(db, 'clients', clientId, 'anamnesi', 'initial');
      await setDoc(anamnesiRef, { ...data, createdAt: serverTimestamp() });
      setMessage("Anamnesi salvata con successo!");
      setTimeout(onSave, 1500);
    } catch (error) {
      console.error("Errore nel salvataggio dell'anamnesi:", error);
      setMessage("Si è verificato un errore. Riprova.");
      setIsError(true);
    }
  };

  // --- 2. STILI AGGIORNATI ---
  const inputStyle = "w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 placeholder:text-slate-500";
  const labelStyle = "block mb-1 text-sm font-medium text-slate-300";
  const sectionStyle = "bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6";
  const headingStyle = "font-bold mb-4 text-lg text-rose-300 border-b border-rose-400/20 pb-2";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="text-2xl font-bold mb-6 text-slate-50">Compila Anamnesi Iniziale</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* --- Sezioni del Form con stili aggiornati --- */}
        <div className={sectionStyle}>
          <h4 className={headingStyle}>Dati Anagrafici e Misure</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelStyle}>Nome*</label><input {...register('firstName', { required: true })} className={inputStyle} /></div>
            <div><label className={labelStyle}>Cognome*</label><input {...register('lastName', { required: true })} className={inputStyle} /></div>
            <div><label className={labelStyle}>Data di Nascita*</label><input type="date" {...register('birthDate', { required: true })} className={inputStyle} /></div>
            <div><label className={labelStyle}>Che lavoro fai?*</label><input {...register('job', { required: true })} className={inputStyle} placeholder="Es. Impiegato, operaio..." /></div>
            <div><label className={labelStyle}>Peso (kg)*</label><input type="number" step="0.1" {...register('weight', { required: true })} className={inputStyle} placeholder="Es. 75.5" /></div>
            <div><label className={labelStyle}>Altezza (cm)*</label><input type="number" {...register('height', { required: true })} className={inputStyle} placeholder="Es. 180" /></div>
          </div>
        </div>

        <div className={sectionStyle}>
          <h4 className={headingStyle}>Abitudini Alimentari</h4>
          <div className="space-y-4">
            <div><label className={labelStyle}>Quanti pasti al giorno?*</label><select {...register('mealsPerDay', { required: true })} className={inputStyle}><option value="3">3</option><option value="4">4</option><option value="5">5+</option></select></div>
            <div><label className={labelStyle}>Colazione: Dolce o Salata?*</label><select {...register('breakfastType', { required: true })} className={inputStyle}><option value="dolce">Dolce</option><option value="salato">Salato</option><option value="entrambi">Entrambi/Indifferente</option></select></div>
            <div><label className={labelStyle}>Alimenti preferiti*</label><textarea {...register('desiredFoods', { required: true })} rows="3" className={inputStyle} placeholder="Elenca qui..." /></div>
            <div><label className={labelStyle}>Cosa non mangi?*</label><textarea {...register('dislikedFoods', { required: true })} rows="2" className={inputStyle} placeholder="Elenca qui..." /></div>
            <div><label className={labelStyle}>Intolleranze o allergie?*</label><input {...register('intolerances', { required: true })} className={inputStyle} placeholder="Es. Lattosio, nessuna..." /></div>
            <div><label className={labelStyle}>Problemi di digestione/gonfiore?*</label><input {...register('digestionIssues', { required: true })} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div>
          </div>
        </div>
        
        <div className={sectionStyle}>
            <h4 className={headingStyle}>Allenamento</h4>
            <div className="space-y-4">
                <div><label className={labelStyle}>Quanti allenamenti a settimana?*</label><input type="number" {...register('workoutsPerWeek', { required: true })} className={inputStyle} placeholder="Es. 3" /></div>
                <div><label className={labelStyle}>Dove ti alleni e con quali attrezzi?*</label><textarea {...register('trainingDetails', { required: true })} rows="3" className={inputStyle} placeholder="Es. Palestra, a casa..." /></div>
                <div><label className={labelStyle}>Orario e durata allenamenti?*</label><input {...register('trainingTime', { required: true })} className={inputStyle} placeholder="Es. Sera, 18:00-19:30" /></div>
            </div>
        </div>

        <div className={sectionStyle}>
          <h4 className={headingStyle}>Salute e Obiettivi</h4>
          <div className="space-y-4">
            <div><label className={labelStyle}>Infortuni o problematiche?*</label><textarea {...register('injuries', { required: true })} rows="3" className={inputStyle} placeholder="Es. Mal di schiena, ernie..." /></div>
            <div><label className={labelStyle}>Prendi farmaci?*</label><input {...register('medications', { required: true })} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div>
            <div><label className={labelStyle}>Usi integratori?*</label><input {...register('supplements', { required: true })} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div>
            <div><label className={labelStyle}>Qual è il tuo obiettivo?*</label><textarea {...register('mainGoal', { required: true })} rows="3" className={inputStyle} placeholder="Descrivi in dettaglio..." /></div>
            <div><label className={labelStyle}>Durata percorso scelto?*</label><input {...register('programDuration', { required: true })} className={inputStyle} placeholder="Es. 3 mesi, 6 mesi..." /></div>
          </div>
        </div>
        
        <div className="bg-rose-900/50 p-4 rounded-lg border border-rose-500/30 text-center">
            <p className="text-sm text-rose-300">Ricorda di richiedere al cliente le 4 foto per il check iniziale.</p>
        </div>

        {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${isError ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
            {isError ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
            {message}
            </div>
        )}

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50 font-semibold">
            <Save size={16} /> {isSubmitting ? 'Salvataggio...' : 'Salva Anamnesi'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
