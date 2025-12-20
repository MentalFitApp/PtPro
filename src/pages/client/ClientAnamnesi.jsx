import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import { getTenantSubcollection, getTenantDoc } from '../../config/tenant';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FilePenLine, Camera, UploadCloud, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadPhoto } from '../../storageUtils.js';
import { useUserPreferences } from '../../hooks/useUserPreferences';

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
        <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// === UPLOADER FOTO – COMPONENTE ISOLATO CON STATO LOCALE ===
const PhotoUploader = ({ type, label, onFileSelect, previewUrl, disabled }) => {
  const [localPreview, setLocalPreview] = useState(previewUrl);

  // Aggiorna l'anteprima quando previewUrl cambia dall'esterno
  useEffect(() => {
    setLocalPreview(previewUrl);
  }, [previewUrl]);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limite aumentato a 10MB per clienti
    if (file.size > 10 * 1024 * 1024) {
      alert(`File troppo grande: ${file.name}. Limite: 10MB`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert(`File non valido: ${file.name}`);
      return;
    }

    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onFileSelect(type, file);
  };

  return (
    <div className="text-center">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="mt-2 relative group">
        <div className="flex justify-center items-center w-full h-48 bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600 group-hover:border-cyan-500 transition-colors cursor-pointer">
          {localPreview ? (
            <img src={localPreview} alt={label} className="h-full w-full object-contain rounded-lg p-1" />
          ) : (
            <div className="flex flex-col items-center text-slate-400 group-hover:text-cyan-400">
              <UploadCloud size={32} />
              <p className="mt-2 text-sm">Clicca per caricare</p>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

const ClientAnamnesi = () => {
  const { formatWeight, formatLength } = useUserPreferences();
  const [anamnesiData, setAnamnesiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [photos, setPhotos] = useState({ front: null, right: null, left: null, back: null });
  const [photoPreviews, setPhotoPreviews] = useState({ front: null, right: null, left: null, back: null });
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [userName, setUserName] = useState('');
  // Helper per mostrare barra solo se ci sono file da caricare
  const photosToUploadExists = (obj) => Object.values(obj).some(f => f);
  const r2PublicBase = import.meta.env.VITE_R2_PUBLIC_URL || (import.meta.env.VITE_R2_ACCOUNT_ID ? `https://pub-${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.dev` : '');

  const normalizePhotoURLs = useCallback((photoURLs) => {
    if (!photoURLs || typeof photoURLs !== 'object') return photoURLs;
    const normalized = {};
    for (const [key, val] of Object.entries(photoURLs)) {
      if (!val) { normalized[key] = val; continue; }
      // Se è già http/https lo lascio
      if (/^https?:\/\//i.test(val)) {
        normalized[key] = val;
      } else {
        // Legacy path Firebase (es. clients/uid/...) prova a costruire URL R2 se abbiamo base
        normalized[key] = r2PublicBase ? `${r2PublicBase}/${val}` : val;
      }
    }
    return normalized;
  }, [r2PublicBase]);

  const navigate = useNavigate();
  const user = auth.currentUser;

  const { register, handleSubmit, setValue, formState: { isSubmitting, errors } } = useForm();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchAnamnesi = async () => {
      try {
        // Fetch nome utente dal doc cliente
        const clientDoc = await getDoc(getTenantDoc(db, 'clients', user.uid));
        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          setUserName(clientData.name || clientData.displayName || user.displayName || 'Te');
        } else {
          setUserName(user.displayName || 'Te');
        }
        
        const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'anamnesi');
        const anamnesiRef = doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial');
        const docSnap = await getDoc(anamnesiRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const normalizedPhotos = normalizePhotoURLs(data.photoURLs);
          data.photoURLs = normalizedPhotos;
          setAnamnesiData(data);
          if (normalizedPhotos) setPhotoPreviews(normalizedPhotos);
          console.debug('[Anamnesi] Loaded photoURLs:', normalizedPhotos);
          Object.keys(data).forEach(key => setValue(key, data[key]));
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (error) {
        setNotification({ message: `Errore: ${error.message}`, type: 'error' });
      }
      setLoading(false);
    };
    fetchAnamnesi();
  }, [user, navigate, setValue, normalizePhotoURLs]);

  const showNotification = useCallback((message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  }, []);

  // === UPLOAD FOTO – OGNI COMPONENTE HA IL SUO STATO ===
  const handleFileSelect = useCallback((type, file) => {
    setPhotos(prev => ({ ...prev, [type]: file }));
    showNotification(`Foto ${type} caricata!`, 'success');
  }, [showNotification]);

  const [uploadProgress, setUploadProgress] = useState(0);

  const onSubmit = async (data) => {
    if (!user || isSubmitting) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      await user.getIdToken(true);
      let photoURLs = anamnesiData?.photoURLs || { front: null, right: null, left: null, back: null };
      const photosToUpload = Object.entries(photos).filter(([, file]) => file !== null);

      if (photosToUpload.length > 0) {
        const perFileFraction = 100 / photosToUpload.length;
        let accumulatedBase = 0;
        const uploadPromises = photosToUpload.map(async ([type, file], index) => {
          const url = await uploadPhoto(
            file,
            user.uid,
            'anamnesi_photos',
            (p) => {
              // Calcola avanzamento combinato (compressione + upload per ogni file)
              const current = Math.min(100, Math.round(accumulatedBase + (p.percent / 100) * perFileFraction));
              setUploadProgress(current);
            }
          );
          accumulatedBase = perFileFraction * (index + 1);
          setUploadProgress(Math.min(100, Math.round(accumulatedBase)));
          return { type, url };
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        photoURLs = { ...photoURLs, ...Object.fromEntries(uploadedUrls.map(({ type, url }) => [type, url])) };
        console.debug('[Anamnesi] Uploaded photoURLs temp:', photoURLs);
      }

      const dataToSave = { ...data, photoURLs: normalizePhotoURLs(photoURLs), submittedAt: serverTimestamp(), createdAt: serverTimestamp() };
      const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'anamnesi');
      await setDoc(doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial'), dataToSave, { merge: true });

      // Aggiorna lastActive nel documento client
      try {
        await updateDoc(getTenantDoc(db, 'clients', user.uid), { lastActive: serverTimestamp() });
      } catch (e) {
        console.debug('Could not update lastActive:', e.message);
      }

      setAnamnesiData(dataToSave);
      setPhotos({ front: null, right: null, left: null, back: null });
      setPhotoPreviews(normalizePhotoURLs(photoURLs));
      console.debug('[Anamnesi] Saved photoURLs:', normalizePhotoURLs(photoURLs));
      setIsEditing(false);
      showNotification('Anamnesi salvata!', 'success');
    } catch (error) {
      showNotification(`Errore: ${error.message}`, 'error');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleCancel = useCallback(() => {
    setPhotos({ front: null, right: null, left: null, back: null });
    setPhotoPreviews(anamnesiData?.photoURLs || { front: null, right: null, left: null, back: null });
    setIsEditing(false);
  }, [anamnesiData]);

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
    </div>
  );

  const inputStyle = "w-full p-2.5 mt-1 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder:text-slate-400";
  const labelStyle = "block text-sm font-medium text-slate-300";
  const sectionStyle = "bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 shadow-glow";
  const headingStyle = "font-bold mb-4 text-lg text-cyan-300 border-b border-cyan-400/20 pb-2 flex items-center gap-2";

  // Calcola età dalla data di nascita
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Non specificata';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 'Non specificata';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anni`;
  };

  // Verifica se manca il sesso nell'anamnesi esistente
  const needsGenderUpdate = anamnesiData && !anamnesiData.gender && !isEditing;

  const ViewField = ({ label, value }) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-slate-400">{label}</h4>
      <p className="mt-1 p-3 bg-slate-700/50 rounded-lg min-h-[44px] text-white break-words whitespace-pre-wrap shadow-inner">{value || 'Non specificato'}</p>
    </div>
  );

  const ViewPhotos = ({ urls }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {['front', 'right', 'left', 'back'].map(type => (
        <div key={type} className="text-center">
          <h4 className="text-sm font-semibold text-slate-400 capitalize">
            {type === 'front' ? 'Frontale' : type === 'back' ? 'Posteriore' : `Laterale ${type === 'left' ? 'Sinistro' : 'Destro'}`}
          </h4>
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
            <div className="mt-2 flex justify-center items-center w-full h-48 bg-slate-700/50 rounded-lg text-slate-500">
              <span>Non caricata</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />

      <header className="flex justify-between items-center mb-8 flex-col sm:flex-row gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          La mia Anamnesi
        </h1>
        <button onClick={() => navigate('/client/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 text-sm font-semibold rounded-lg transition-colors border border-slate-600">
          <ArrowLeft size={16} /> Torna alla dashboard
        </button>
      </header>

      {/* Banner per aggiungere il sesso mancante */}
      {needsGenderUpdate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center">
              <FilePenLine size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-amber-200 font-medium">Completa la tua anamnesi</p>
              <p className="text-amber-300/70 text-sm">Aggiungi il tuo sesso per permetterci di calcolare meglio i tuoi progressi</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors text-sm"
          >
            Aggiorna ora
          </button>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Banner errore validazione */}
            {errors.gender && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0">
                  <X size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="text-red-200 font-medium">Campo obbligatorio mancante</p>
                  <p className="text-red-300/70 text-sm">Seleziona il tuo sesso per continuare</p>
                </div>
              </motion.div>
            )}

            {/* === DATI ANAGRAFICI E MISURE === */}
            <div className={sectionStyle}>
              <h4 className={headingStyle}><FilePenLine size={16} /> Dati Anagrafici e Misure</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelStyle}>Nome</label><input {...register('firstName')} className={inputStyle} /></div>
                <div><label className={labelStyle}>Cognome</label><input {...register('lastName')} className={inputStyle} /></div>
                <div><label className={labelStyle}>Data di Nascita</label><input type="date" {...register('birthDate')} className={inputStyle} /></div>
                <div>
                  <label className={labelStyle}>Sesso <span className="text-red-400">*</span></label>
                  <select 
                    {...register('gender', { required: 'Seleziona il tuo sesso' })} 
                    className={`${inputStyle} ${errors.gender ? 'border-red-500 ring-2 ring-red-500/50' : ''}`}
                  >
                    <option value="">Seleziona...</option>
                    <option value="male">Maschio</option>
                    <option value="female">Femmina</option>
                  </select>
                  {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender.message}</p>}
                </div>
                <div><label className={labelStyle}>Che lavoro fai?</label><input {...register('job')} className={inputStyle} placeholder="Es. Impiegato, studente..." /></div>
                <div><label className={labelStyle}>Peso (kg)</label><input type="number" step="0.1" {...register('weight')} className={inputStyle} placeholder="Es. 75.5" /></div>
                <div><label className={labelStyle}>Altezza (cm)</label><input type="number" {...register('height')} className={inputStyle} placeholder="Es. 180" /></div>
              </div>
            </div>

            {/* === ABITUDINI ALIMENTARI === */}
            <div className={sectionStyle}>
              <h4 className={headingStyle}><Camera size={16} /> Abitudini Alimentari</h4>
              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Pasti al giorno</label>
                  <select {...register('mealsPerDay')} className={inputStyle}>
                    <option value="">Seleziona...</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5+</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Colazione: Dolce o Salata?</label>
                  <select {...register('breakfastType')} className={inputStyle}>
                    <option value="">Seleziona...</option>
                    <option value="dolce">Dolce</option>
                    <option value="salato">Salato</option>
                    <option value="entrambi">Entrambi/Indifferente</option>
                  </select>
                </div>
                <div><label className={labelStyle}>Alimenti che ti piacciono</label><textarea {...register('desiredFoods')} rows="3" className={inputStyle} placeholder="Elenca qui gli alimenti che vorresti nel piano..." /></div>
                <div><label className={labelStyle}>Cosa non mangi?</label><textarea {...register('dislikedFoods')} rows="2" className={inputStyle} placeholder="Elenca qui gli alimenti da evitare..." /></div>
                <div><label className={labelStyle}>Allergie o Intolleranze?</label><input {...register('intolerances')} className={inputStyle} placeholder="Es. Lattosio, nessuna..." /></div>
                <div><label className={labelStyle}>Problemi di digestione o gonfiore?</label><input {...register('digestionIssues')} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div>
              </div>
            </div>

            {/* === ALLENAMENTO === */}
            <div className={sectionStyle}>
              <h4 className={headingStyle}><FilePenLine size={16} /> Allenamento</h4>
              <div className="space-y-4">
                <div><label className={labelStyle}>Allenamenti a settimana</label><input type="number" {...register('workoutsPerWeek')} className={inputStyle} placeholder="Es. 3" /></div>
                <div><label className={labelStyle}>Dettagli Allenamento</label><textarea {...register('trainingDetails')} rows="3" className={inputStyle} placeholder="Es. Bodybuilding in palestra con macchinari e pesi liberi..." /></div>
                <div><label className={labelStyle}>Orario e Durata</label><input {...register('trainingTime')} className={inputStyle} placeholder="Es. La sera dalle 18 alle 19:30" /></div>
              </div>
            </div>

            {/* === SALUTE E OBIETTIVI === */}
            <div className={sectionStyle}>
              <h4 className={headingStyle}><Camera size={16} /> Salute e Obiettivi</h4>
              <div className="space-y-4">
                <div><label className={labelStyle}>Infortuni o problematiche</label><textarea {...register('injuries')} rows="3" className={inputStyle} placeholder="Es. Mal di schiena, ernie, dolori articolari..." /></div>
                <div><label className={labelStyle}>Prendi farmaci?</label><input {...register('medications')} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div>
                <div><label className={labelStyle}>Usi integratori?</label><input {...register('supplements')} className={inputStyle} placeholder="Sì/No, e se sì quali..." /></div>
                <div><label className={labelStyle}>Obiettivo Principale</label><textarea {...register('mainGoal')} rows="3" className={inputStyle} placeholder="Descrivi in dettaglio cosa vuoi raggiungere..." /></div>
                <div><label className={labelStyle}>Durata Percorso</label><input {...register('programDuration')} className={inputStyle} placeholder="Es. 3 mesi, 6 mesi..." /></div>
              </div>
            </div>

            {/* === FOTO INIZIALI – OGNI UPLOADER È ISOLATO === */}
            <div className={sectionStyle}>
              <h4 className={headingStyle}><Camera size={16} /> Foto Iniziali</h4>
              <p className="text-sm text-slate-400 mb-6">Carica 4 foto per il check iniziale: frontale, laterale destro, laterale sinistro e posteriore. Visibili solo a te e al coach.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <PhotoUploader type="front" label="Frontale" onFileSelect={handleFileSelect} previewUrl={photoPreviews.front} disabled={loading || isSubmitting} />
                <PhotoUploader type="right" label="Laterale Destro" onFileSelect={handleFileSelect} previewUrl={photoPreviews.right} disabled={loading || isSubmitting} />
                <PhotoUploader type="left" label="Laterale Sinistro" onFileSelect={handleFileSelect} previewUrl={photoPreviews.left} disabled={loading || isSubmitting} />
                <PhotoUploader type="back" label="Posteriore" onFileSelect={handleFileSelect} previewUrl={photoPreviews.back} disabled={loading || isSubmitting} />
              </div>
            </div>

            {photosToUploadExists(photos) && uploadProgress > 0 && (
              <div className="w-full bg-slate-700/50 rounded-lg h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <div className="flex justify-end gap-4 pt-4">
              <motion.button
                type="submit"
                disabled={isSubmitting || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white preserve-white rounded-lg font-semibold disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Save size={16} /> {isSubmitting ? `Upload ${uploadProgress}%` : 'Salva Anamnesi'}
              </motion.button>
              <motion.button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-white preserve-white rounded-lg font-semibold border border-slate-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={16} /> Annulla
              </motion.button>
            </div>
          </form>
        ) : (
          anamnesiData && (
            <div className="space-y-8">
              {/* === VISUALIZZAZIONE COMPLETA === */}
              <div className={sectionStyle}>
                <h4 className={headingStyle}><FilePenLine size={16} /> Dati Anagrafici</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ViewField label="Nome" value={anamnesiData.firstName} />
                  <ViewField label="Cognome" value={anamnesiData.lastName} />
                  <ViewField label="Data di Nascita" value={anamnesiData.birthDate} />
                  <ViewField label="Sesso" value={anamnesiData.gender === 'male' ? 'Maschio' : anamnesiData.gender === 'female' ? 'Femmina' : 'Non specificato'} />
                  <ViewField label="Età" value={calculateAge(anamnesiData.birthDate)} />
                  <ViewField label="Lavoro" value={anamnesiData.job} />
                  <ViewField label="Peso" value={formatWeight(anamnesiData.weight)} />
                  <ViewField label="Altezza" value={formatLength(anamnesiData.height)} />
                </div>
              </div>

              <div className={sectionStyle}>
                <h4 className={headingStyle}><Camera size={16} /> Abitudini Alimentari</h4>
                <div className="space-y-4">
                  <ViewField label="Pasti al giorno" value={anamnesiData.mealsPerDay} />
                  <ViewField label="Tipo Colazione" value={anamnesiData.breakfastType} />
                  <ViewField label="Alimenti preferiti" value={anamnesiData.desiredFoods} />
                  <ViewField label="Alimenti da evitare" value={anamnesiData.dislikedFoods} />
                  <ViewField label="Allergie/Intolleranze" value={anamnesiData.intolerances} />
                  <ViewField label="Problemi di digestione" value={anamnesiData.digestionIssues} />
                </div>
              </div>

              <div className={sectionStyle}>
                <h4 className={headingStyle}><FilePenLine size={16} /> Allenamento</h4>
                <div className="space-y-4">
                  <ViewField label="Allenamenti a settimana" value={anamnesiData.workoutsPerWeek} />
                  <ViewField label="Dettagli Allenamento" value={anamnesiData.trainingDetails} />
                  <ViewField label="Orario e Durata" value={anamnesiData.trainingTime} />
                </div>
              </div>

              <div className={sectionStyle}>
                <h4 className={headingStyle}><Camera size={16} /> Salute e Obiettivi</h4>
                <div className="space-y-4">
                  <ViewField label="Infortuni o problematiche" value={anamnesiData.injuries} />
                  <ViewField label="Farmaci" value={anamnesiData.medications} />
                  <ViewField label="Integratori" value={anamnesiData.supplements} />
                  <ViewField label="Obiettivo Principale" value={anamnesiData.mainGoal} />
                  <ViewField label="Durata Percorso" value={anamnesiData.programDuration} />
                </div>
              </div>

              <div className={sectionStyle}>
                <h4 className={headingStyle}><Camera size={16} /> Foto Iniziali</h4>
                <ViewPhotos urls={anamnesiData.photoURLs} />
              </div>

              <div className="flex justify-end pt-4">
                <motion.button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-lg font-semibold border border-slate-600"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FilePenLine size={16} /> Modifica Dati
                </motion.button>
              </div>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
};

export default ClientAnamnesi;