import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FilePenLine, Camera, UploadCloud, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTI UI RIUTILIZZABILI ---
const AnimatedBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden bg-zinc-950">
    <div className="aurora-background"></div>
  </div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <AnimatedBackground />
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${
          type === 'success' ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30' : 'bg-red-900/80 text-red-300 border-red-500/30'
        } backdrop-blur-md shadow-lg`}
      >
        <p>{message}</p>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/10">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const ClientAnamnesi = () => {
  const [anamnesiData, setAnamnesiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [photos, setPhotos] = useState({ front: null, right: null, left: null, back: null });
  const [photoPreviews, setPhotoPreviews] = useState({ front: null, right: null, left: null, back: null });
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const storage = getStorage();

  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();
  
  useEffect(() => {
    if (!user) { navigate('/client-login'); return; }
    const fetchAnamnesi = async () => {
      const anamnesiRef = doc(db, `clients/${user.uid}/anamnesi`, 'initial');
      const docSnap = await getDoc(anamnesiRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAnamnesiData(data);
        if (data.photoURLs) setPhotoPreviews(data.photoURLs);
        Object.keys(data).forEach(key => setValue(key, data[key]));
        setIsEditing(false);
      } else {
        setIsEditing(true); 
      }
      setLoading(false);
    };
    fetchAnamnesi();
  }, [user, navigate, setValue]);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setPhotos(prev => ({ ...prev, [type]: file }));
      setPhotoPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const onSubmit = async (data) => {
    if (!user) return;
    
    if (!anamnesiData && Object.values(photos).some(p => p === null)) {
      showNotification("Per favore, carica tutte e 4 le foto iniziali.");
      return;
    }
    setLoading(true);
    try {
      let photoURLs = anamnesiData?.photoURLs || {};
      const photosToUpload = Object.entries(photos).filter(([, file]) => file !== null);

      if (photosToUpload.length > 0) {
        const uploadedUrls = await Promise.all(
          photosToUpload.map(async ([type, file]) => {
            const filePath = `clients/${user.uid}/anamnesi_photos/${type}-${uuidv4()}`;
            const fileRef = ref(storage, filePath);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            return { type, url };
          })
        );
        uploadedUrls.forEach(({ type, url }) => { photoURLs[type] = url; });
      }
      const dataToSave = { ...data, photoURLs, submittedAt: serverTimestamp() };
      await setDoc(doc(db, `clients/${user.uid}/anamnesi`, 'initial'), dataToSave, { merge: true });
      
      setAnamnesiData(dataToSave);
      setIsEditing(false);
      showNotification("Anamnesi salvata con successo!", 'success');
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      showNotification("Si è verificato un errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <LoadingSpinner />;

  const inputStyle = "w-full p-2.5 mt-1 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-slate-200 placeholder:text-slate-500";
  const labelStyle = "block text-sm font-medium text-slate-300";
  const sectionStyle = "bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6 shadow-lg";
  const headingStyle = "font-bold mb-4 text-lg text-cyan-300 border-b border-cyan-400/20 pb-2 flex items-center gap-2";

  const PhotoUploader = ({ type, label }) => (
    <div className="text-center">
      <label className={labelStyle}>{label}</label>
      <div className="mt-2 flex justify-center items-center w-full h-48 bg-zinc-900/50 rounded-lg border-2 border-dashed border-zinc-700 hover:border-cyan-500 transition-colors relative group">
        {photoPreviews[type] ? (
          <img src={photoPreviews[type]} alt="preview" className="h-full w-full object-contain rounded-lg p-1" />
        ) : (
          <div className="flex flex-col items-center text-slate-400 transition-colors group-hover:text-cyan-400">
            <UploadCloud size={32} />
            <p className="mt-2 text-sm">Carica foto</p>
          </div>
        )}
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, type)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>
    </div>
  );
  
  const ViewField = ({ label, value }) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-slate-400">{label}</h4>
      <p className="mt-1 p-3 bg-zinc-900 rounded-lg min-h-[44px] text-slate-200 break-words whitespace-pre-wrap shadow-inner">{value || 'Non specificato'}</p>
    </div>
  );

  const ViewPhotos = ({ urls }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {['front', 'right', 'left', 'back'].map(type => (
        <div key={type} className="text-center">
          <h4 className="text-sm font-semibold text-slate-400 capitalize">{type === 'front' ? 'Frontale' : type === 'back' ? 'Posteriore' : `Laterale ${type === 'left' ? 'Sinistro' : 'Destro'}`}</h4>
          {urls?.[type] ? (
            <motion.img
              src={urls[type]}
              alt={type}
              className="mt-2 rounded-lg w-full h-48 object-cover hover:scale-105 transition-transform"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="mt-2 flex justify-center items-center w-full h-48 bg-zinc-900 rounded-lg text-slate-500"><span>Non caricata</span></div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-6 lg:p-8 relative">
      <AnimatedBackground />
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />

      <header className="flex justify-between items-center mb-8 flex-col sm:flex-row gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">Anamnesi Cliente</h1>
        <button onClick={() => navigate('/client/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors"><ArrowLeft size={16} /><span>Torna alla mia dashboard</span></button>
      </header>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className={sectionStyle}><h4 className={headingStyle}><FilePenLine size={16} /> Dati Anagrafici e Misure</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className={labelStyle}>Nome*</label><input {...register('firstName', { required: true })} className={inputStyle} /></div><div><label className={labelStyle}>Cognome*</label><input {...register('lastName', { required: true })} className={inputStyle} /></div><div><label className={labelStyle}>Data di Nascita*</label><input type="date" {...register('birthDate', { required: true })} className={inputStyle} /></div><div><label className={labelStyle}>Che lavoro fai?*</label><input {...register('job', { required: true })} className={inputStyle} placeholder="Es. Impiegato, studente..." /></div><div><label className={labelStyle}>Peso (kg)*</label><input type="number" step="0.1" {...register('weight', { required: true })} className={inputStyle} placeholder="Es. 75.5" /></div><div><label className={labelStyle}>Altezza (cm)*</label><input type="number" {...register('height', { required: true })} className={inputStyle} placeholder="Es. 180" /></div></div></div>
            <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Abitudini Alimentari</h4><div className="space-y-4"><div><label className={labelStyle}>Pasti al giorno*</label><select {...register('mealsPerDay', { required: true })} className={inputStyle}><option value="3">3</option><option value="4">4</option><option value="5">5+</option></select></div><div><label className={labelStyle}>Colazione: Dolce o Salata?*</label><select {...register('breakfastType', { required: true })} className={inputStyle}><option value="dolce">Dolce</option><option value="salato">Salato</option><option value="entrambi">Entrambi/Indifferente</option></select></div><div><label className={labelStyle}>Alimenti che ti piacciono*</label><textarea {...register('desiredFoods', { required: true })} rows="3" className={inputStyle} placeholder="Elenca qui gli alimenti che vorresti nel piano..." /></div><div><label className={labelStyle}>Cosa non mangi?*</label><textarea {...register('dislikedFoods', { required: true })} rows="2" className={inputStyle} placeholder="Elenca qui gli alimenti da evitare..." /></div><div><label className={labelStyle}>Allergie o Intolleranze?*</label><input {...register('intolerances', { required: true })} className={inputStyle} placeholder="Es. Lattosio, nessuna..." /></div><div><label className={labelStyle}>Problemi di digestione o gonfiore?*</label><input {...register('digestionIssues', { required: true })} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div></div></div>
            <div className={sectionStyle}><h4 className={headingStyle}><FilePenLine size={16} /> Allenamento</h4><div className="space-y-4"><div><label className={labelStyle}>Allenamenti a settimana*</label><input type="number" {...register('workoutsPerWeek', { required: true })} className={inputStyle} placeholder="Es. 3" /></div><div><label className={labelStyle}>Dettagli Allenamento*</label><textarea {...register('trainingDetails', { required: true })} rows="3" className={inputStyle} placeholder="Es. Bodybuilding in palestra con macchinari e pesi liberi..." /></div><div><label className={labelStyle}>Orario e Durata*</label><input {...register('trainingTime', { required: true })} className={inputStyle} placeholder="Es. La sera dalle 18 alle 19:30" /></div></div></div>
            <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Salute e Obiettivi</h4><div className="space-y-4"><div><label className={labelStyle}>Infortuni o problematiche*</label><textarea {...register('injuries', { required: true })} rows="3" className={inputStyle} placeholder="Es. Mal di schiena, ernie, dolori articolari..." /></div><div><label className={labelStyle}>Prendi farmaci?*</label><input {...register('medications', { required: true })} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div><div><label className={labelStyle}>Usi integratori?*</label><input {...register('supplements', { required: true })} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div><div><label className={labelStyle}>Obiettivo Principale*</label><textarea {...register('mainGoal', { required: true })} rows="3" className={inputStyle} placeholder="Descrivi in dettaglio cosa vuoi raggiungere..." /></div><div><label className={labelStyle}>Durata Percorso*</label><input {...register('programDuration', { required: true })} className={inputStyle} placeholder="Es. 3 mesi, 6 mesi..." /></div></div></div>
            <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Foto Iniziali</h4><p className="text-sm text-slate-400 mb-6">Carica 4 foto per il check iniziale: frontale, laterale destro, laterale sinistro e posteriore. Visibili solo a te e al coach.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><PhotoUploader type="front" label="Frontale" /><PhotoUploader type="right" label="Laterale Destro" /><PhotoUploader type="left" label="Laterale Sinistro" /><PhotoUploader type="back" label="Posteriore" /></div></div>
            <div className="flex justify-end pt-4"><button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"><Save size={16} /> {isSubmitting ? 'Salvataggio in corso...' : 'Salva Anamnesi'}</button></div>
          </form>
        ) : (
          anamnesiData && (
            <div className="space-y-8">
              <div className={sectionStyle}><h4 className={headingStyle}><FilePenLine size={16} /> Dati Anagrafici</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><ViewField label="Nome" value={anamnesiData.firstName} /><ViewField label="Cognome" value={anamnesiData.lastName} /><ViewField label="Data di Nascita" value={anamnesiData.birthDate} /><ViewField label="Lavoro" value={anamnesiData.job} /><ViewField label="Peso (kg)" value={anamnesiData.weight} /><ViewField label="Altezza (cm)" value={anamnesiData.height} /></div></div>
              <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Abitudini Alimentari</h4><div className="space-y-4"><ViewField label="Pasti al giorno" value={anamnesiData.mealsPerDay} /><ViewField label="Tipo Colazione" value={anamnesiData.breakfastType} /><ViewField label="Alimenti preferiti" value={anamnesiData.desiredFoods} /><ViewField label="Alimenti da evitare" value={anamnesiData.dislikedFoods} /><ViewField label="Allergie/Intolleranze" value={anamnesiData.intolerances} /><ViewField label="Problemi di digestione" value={anamnesiData.digestionIssues} /></div></div>
              <div className={sectionStyle}><h4 className={headingStyle}><FilePenLine size={16} /> Allenamento</h4><div className="space-y-4"><ViewField label="Allenamenti a settimana" value={anamnesiData.workoutsPerWeek} /><ViewField label="Dettagli Allenamento" value={anamnesiData.trainingDetails} /><ViewField label="Orario e Durata" value={anamnesiData.trainingTime} /></div></div>
              <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Salute e Obiettivi</h4><div className="space-y-4"><ViewField label="Infortuni o problematiche" value={anamnesiData.injuries} /><ViewField label="Farmaci" value={anamnesiData.medications} /><ViewField label="Integratori" value={anamnesiData.supplements} /><ViewField label="Obiettivo Principale" value={anamnesiData.mainGoal} /><ViewField label="Durata Percorso" value={anamnesiData.programDuration} /></div></div>
              <div className={sectionStyle}><h4 className={headingStyle}><Camera size={16} /> Foto Iniziali</h4><ViewPhotos urls={anamnesiData.photoURLs} /></div>
              <div className="flex justify-end pt-4"><button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-lg transition font-semibold"><FilePenLine size={16} /> Modifica Dati</button></div>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
};

export default ClientAnamnesi;