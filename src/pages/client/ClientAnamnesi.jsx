// src/pages/client/ClientAnamnesi.jsx
// Pagina Anamnesi Cliente - Stile Nebula 2.0 con Wizard Multi-Step
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import { getTenantSubcollection, getTenantDoc } from '../../config/tenant';
import { useNavigate } from 'react-router-dom';
import { 
  User, Briefcase, Calendar, Scale, Ruler, Utensils, Coffee, Apple, 
  AlertTriangle, Dumbbell, Clock, Target, Heart, Pill, Sparkles,
  Camera, UploadCloud, X, Check, ChevronRight, ChevronLeft, Save,
  CheckCircle2, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadPhoto } from '../../storageUtils.js';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { IMAGE_ACCEPT_STRING, compressImage } from '../../cloudflareStorage';
import { PhotoPoseSilhouette } from '../../components/PhotoPoseSilhouette';

// === NEBULA COMPONENTS ===
const GlowCard = ({ children, className = '', gradient = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {gradient && (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 via-transparent to-slate-900/30 pointer-events-none" />
    )}
    <div className="relative">{children}</div>
  </div>
);

// === STEP CONFIGURATION ===
const STEPS = [
  { id: 'personal', title: 'Dati Personali', icon: User, color: 'cyan' },
  { id: 'nutrition', title: 'Alimentazione', icon: Utensils, color: 'emerald' },
  { id: 'training', title: 'Allenamento', icon: Dumbbell, color: 'violet' },
  { id: 'health', title: 'Salute & Obiettivi', icon: Target, color: 'amber' },
  { id: 'photos', title: 'Foto Iniziali', icon: Camera, color: 'pink' },
];

// === NOTIFICATION TOAST ===
const Notification = ({ message, type, onDismiss }) => {
  if (!message) return null;
  
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className={`fixed top-4 left-4 right-4 z-[9999] flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${
          type === 'success' 
            ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30' 
            : 'bg-red-900/80 text-red-300 border-red-500/30'
        }`}
      >
        {type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// === PROGRESS BAR ===
const StepProgress = ({ currentStep, totalSteps }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-400">
          Passo {currentStep + 1} di {totalSteps}
        </span>
        <span className="text-sm font-medium text-cyan-400">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// === STEP INDICATOR (DOTS) ===
const StepDots = ({ steps, currentStep, completedSteps }) => (
  <div className="flex justify-center gap-2 mb-6">
    {steps.map((step, index) => {
      const isActive = index === currentStep;
      const isCompleted = completedSteps.includes(index);
      
      return (
        <div
          key={step.id}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            isActive 
              ? 'bg-cyan-400 w-6'
              : isCompleted
              ? 'bg-emerald-400'
              : 'bg-slate-600'
          }`}
        />
      );
    })}
  </div>
);

// === FORM INPUT COMPONENTS ===
const FormInput = ({ label, icon: Icon, error, ...props }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
      {Icon && <Icon size={14} className="text-slate-500" />}
      {label}
      {props.required && <span className="text-red-400">*</span>}
    </label>
    <input
      {...props}
      className={`w-full p-3 bg-slate-700/30 border rounded-xl outline-none transition-all text-white placeholder:text-slate-500 ${
        error 
          ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30' 
          : 'border-slate-600/50 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50'
      }`}
    />
    {error && <p className="text-xs text-red-400">{error.message}</p>}
  </div>
);

const FormSelect = ({ label, icon: Icon, options, error, ...props }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
      {Icon && <Icon size={14} className="text-slate-500" />}
      {label}
      {props.required && <span className="text-red-400">*</span>}
    </label>
    <select
      {...props}
      className={`w-full p-3 bg-slate-700/30 border rounded-xl outline-none transition-all text-white ${
        error 
          ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30' 
          : 'border-slate-600/50 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50'
      }`}
    >
      <option value="">Seleziona...</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-400">{error.message}</p>}
  </div>
);

const FormTextarea = ({ label, icon: Icon, error, ...props }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
      {Icon && <Icon size={14} className="text-slate-500" />}
      {label}
    </label>
    <textarea
      {...props}
      className={`w-full p-3 bg-slate-700/30 border rounded-xl outline-none transition-all text-white placeholder:text-slate-500 resize-none ${
        error 
          ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30' 
          : 'border-slate-600/50 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50'
      }`}
    />
  </div>
);

// === PHOTO UPLOADER ===
const PhotoUploader = ({ type, label, onFileSelect, previewUrl, isLoading }) => {
  const [localPreview, setLocalPreview] = useState(previewUrl);

  useEffect(() => {
    setLocalPreview(previewUrl);
  }, [previewUrl]);

  const isImageFile = (file) => {
    if (file.type && file.type.startsWith('image/')) return true;
    const ext = file.name?.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff', 'avif'];
    return imageExtensions.includes(ext);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File troppo grande. Limite: 10MB');
      return;
    }
    if (!isImageFile(file)) {
      alert('Formato non supportato. Usa JPG, PNG, HEIC o WebP');
      return;
    }

    const ext = file.name?.split('.').pop()?.toLowerCase();
    const isHeic = ext === 'heic' || ext === 'heif';
    if (!isHeic) {
      const url = URL.createObjectURL(file);
      setLocalPreview(url);
    }
    onFileSelect(type, file);
  };

  return (
    <div className="text-center">
      <label className="block text-sm font-medium text-slate-400 mb-2">{label}</label>
      <div className="relative group">
        <div className={`flex justify-center items-center w-full aspect-[3/4] bg-slate-700/20 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          localPreview ? 'border-emerald-500/30' : 'border-slate-600/50 group-hover:border-cyan-500/50'
        }`}>
          {isLoading ? (
            <div className="flex flex-col items-center text-cyan-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <p className="mt-2 text-xs">Elaborazione...</p>
            </div>
          ) : localPreview ? (
            <div className="relative w-full h-full">
              <img src={localPreview} alt={label} className="w-full h-full object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                <span className="text-white text-sm font-medium">Cambia foto</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-500 group-hover:text-cyan-400 transition-colors p-4">
              <PhotoPoseSilhouette position={type} size={80} showHint={true} />
              <div className="flex items-center gap-1.5 mt-3">
                <UploadCloud size={16} />
                <span className="text-xs font-medium">Carica</span>
              </div>
            </div>
          )}
        </div>
        <input
          type="file"
          accept={IMAGE_ACCEPT_STRING}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

// === STEP CONTENT COMPONENTS ===
const StepPersonal = ({ register, errors }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="text-center mb-6">
      <div className="inline-flex p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 mb-3">
        <User size={28} className="text-cyan-400" />
      </div>
      <h2 className="text-xl font-bold text-white">Parliamo di te</h2>
      <p className="text-sm text-slate-400 mt-1">Iniziamo con le informazioni di base</p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <FormInput
        label="Nome"
        icon={User}
        placeholder="Mario"
        {...register('firstName')}
      />
      <FormInput
        label="Cognome"
        icon={User}
        placeholder="Rossi"
        {...register('lastName')}
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <FormInput
        label="Data di Nascita"
        icon={Calendar}
        type="date"
        {...register('birthDate')}
      />
      <FormSelect
        label="Sesso"
        icon={User}
        options={[
          { value: 'male', label: 'Maschio' },
          { value: 'female', label: 'Femmina' }
        ]}
        {...register('gender')}
      />
    </div>

    <FormInput
      label="Che lavoro fai?"
      icon={Briefcase}
      placeholder="Es. Impiegato, studente, libero professionista..."
      {...register('job')}
    />

    <div className="grid grid-cols-2 gap-3">
      <FormInput
        label="Peso (kg)"
        icon={Scale}
        type="number"
        step="0.1"
        placeholder="75.5"
        {...register('weight')}
      />
      <FormInput
        label="Altezza (cm)"
        icon={Ruler}
        type="number"
        placeholder="180"
        {...register('height')}
      />
    </div>
  </motion.div>
);

const StepNutrition = ({ register }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="text-center mb-6">
      <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-3">
        <Utensils size={28} className="text-emerald-400" />
      </div>
      <h2 className="text-xl font-bold text-white">Le tue abitudini alimentari</h2>
      <p className="text-sm text-slate-400 mt-1">Ci aiuterà a creare il piano perfetto per te</p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <FormSelect
        label="Pasti al giorno"
        icon={Utensils}
        options={[
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5+' }
        ]}
        {...register('mealsPerDay')}
      />
      <FormSelect
        label="Tipo di colazione"
        icon={Coffee}
        options={[
          { value: 'dolce', label: 'Dolce' },
          { value: 'salato', label: 'Salato' },
          { value: 'entrambi', label: 'Entrambi' }
        ]}
        {...register('breakfastType')}
      />
    </div>

    <FormTextarea
      label="Alimenti che ti piacciono"
      icon={Apple}
      rows={3}
      placeholder="Es. Pasta, pollo, verdure grigliate, frutta..."
      {...register('desiredFoods')}
    />

    <FormTextarea
      label="Alimenti che non mangi"
      rows={2}
      placeholder="Es. Pesce, funghi, frattaglie..."
      {...register('dislikedFoods')}
    />

    <FormInput
      label="Allergie o intolleranze?"
      icon={AlertTriangle}
      placeholder="Es. Lattosio, glutine, nessuna..."
      {...register('intolerances')}
    />

    <FormInput
      label="Problemi di digestione o gonfiore?"
      placeholder="Es. Gonfiore dopo i latticini, nessuno..."
      {...register('digestionIssues')}
    />
  </motion.div>
);

const StepTraining = ({ register }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="text-center mb-6">
      <div className="inline-flex p-3 rounded-2xl bg-violet-500/20 border border-violet-500/30 mb-3">
        <Dumbbell size={28} className="text-violet-400" />
      </div>
      <h2 className="text-xl font-bold text-white">Il tuo allenamento</h2>
      <p className="text-sm text-slate-400 mt-1">Raccontaci della tua attività fisica</p>
    </div>

    <FormInput
      label="Quanti allenamenti a settimana?"
      icon={Dumbbell}
      type="number"
      placeholder="3"
      {...register('workoutsPerWeek')}
    />

    <FormTextarea
      label="Dove ti alleni e con quali attrezzi?"
      rows={3}
      placeholder="Es. Palestra con pesi liberi e macchine, oppure a casa con manubri e bande elastiche..."
      {...register('trainingDetails')}
    />

    <FormInput
      label="A che ora ti alleni e per quanto?"
      icon={Clock}
      placeholder="Es. Sera, dalle 18:00 alle 19:30"
      {...register('trainingTime')}
    />
  </motion.div>
);

const StepHealth = ({ register }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="text-center mb-6">
      <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-3">
        <Target size={28} className="text-amber-400" />
      </div>
      <h2 className="text-xl font-bold text-white">Salute e Obiettivi</h2>
      <p className="text-sm text-slate-400 mt-1">Informazioni importanti per personalizzare il percorso</p>
    </div>

    <FormTextarea
      label="Hai infortuni o problematiche fisiche?"
      icon={Heart}
      rows={3}
      placeholder="Es. Mal di schiena, ernia lombare, dolori alle ginocchia..."
      {...register('injuries')}
    />

    <FormInput
      label="Prendi farmaci?"
      icon={Pill}
      placeholder="Es. Nessuno, oppure nome dei farmaci..."
      {...register('medications')}
    />

    <FormInput
      label="Usi integratori?"
      icon={Sparkles}
      placeholder="Es. Proteine, creatina, multivitaminico..."
      {...register('supplements')}
    />

    <FormTextarea
      label="Qual è il tuo obiettivo principale?"
      icon={Target}
      rows={3}
      placeholder="Es. Perdere 5kg di grasso, mettere massa muscolare, sentirmi più energico..."
      {...register('mainGoal')}
    />

    <FormInput
      label="Per quanto tempo vuoi seguire il percorso?"
      icon={Calendar}
      placeholder="Es. 3 mesi, 6 mesi, un anno..."
      {...register('programDuration')}
    />
  </motion.div>
);

const StepPhotos = ({ photos, photoPreviews, photoLoading, onFileSelect }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="text-center mb-6">
      <div className="inline-flex p-3 rounded-2xl bg-pink-500/20 border border-pink-500/30 mb-3">
        <Camera size={28} className="text-pink-400" />
      </div>
      <h2 className="text-xl font-bold text-white">Foto Iniziali</h2>
      <p className="text-sm text-slate-400 mt-1">Serviranno per monitorare i tuoi progressi</p>
    </div>

    <GlowCard className="p-3 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 flex-shrink-0">
          <Camera size={16} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-sm text-slate-300 font-medium">Consigli per le foto</p>
          <ul className="text-xs text-slate-400 mt-1 space-y-0.5">
            <li>• Indossa abbigliamento aderente o costume</li>
            <li>• Usa una buona illuminazione</li>
            <li>• Mantieni la stessa posa per ogni foto</li>
          </ul>
        </div>
      </div>
    </GlowCard>

    <div className="grid grid-cols-2 gap-3">
      <PhotoUploader
        type="front"
        label="Frontale"
        onFileSelect={onFileSelect}
        previewUrl={photoPreviews.front}
        isLoading={photoLoading.front}
      />
      <PhotoUploader
        type="back"
        label="Posteriore"
        onFileSelect={onFileSelect}
        previewUrl={photoPreviews.back}
        isLoading={photoLoading.back}
      />
      <PhotoUploader
        type="right"
        label="Lato Destro"
        onFileSelect={onFileSelect}
        previewUrl={photoPreviews.right}
        isLoading={photoLoading.right}
      />
      <PhotoUploader
        type="left"
        label="Lato Sinistro"
        onFileSelect={onFileSelect}
        previewUrl={photoPreviews.left}
        isLoading={photoLoading.left}
      />
    </div>

    <p className="text-center text-xs text-slate-500 mt-4">
      Le foto sono opzionali e visibili solo a te e al tuo coach
    </p>
  </motion.div>
);

// === MAIN COMPONENT ===
const ClientAnamnesi = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { formatWeight, formatLength } = useUserPreferences();
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [anamnesiData, setAnamnesiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState({ front: null, right: null, left: null, back: null });
  const [photoPreviews, setPhotoPreviews] = useState({ front: null, right: null, left: null, back: null });
  const [photoLoading, setPhotoLoading] = useState({ front: false, right: false, left: false, back: false });
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isViewMode, setIsViewMode] = useState(false);

  const r2PublicBase = import.meta.env.VITE_R2_PUBLIC_URL || '';

  const { register, handleSubmit, setValue, getValues, formState: { errors }, trigger } = useForm();

  // Normalizza URL foto
  const normalizePhotoURLs = useCallback((photoURLs) => {
    if (!photoURLs || typeof photoURLs !== 'object') return photoURLs;
    const normalized = {};
    for (const [key, val] of Object.entries(photoURLs)) {
      if (!val) { normalized[key] = val; continue; }
      if (/^https?:\/\//i.test(val)) {
        normalized[key] = val;
      } else {
        normalized[key] = r2PublicBase ? `${r2PublicBase}/${val}` : val;
      }
    }
    return normalized;
  }, [r2PublicBase]);

  // Fetch existing data
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchAnamnesi = async () => {
      try {
        const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'anamnesi');
        const anamnesiRef = doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial');
        const docSnap = await getDoc(anamnesiRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const normalizedPhotos = normalizePhotoURLs(data.photoURLs);
          data.photoURLs = normalizedPhotos;
          setAnamnesiData(data);
          if (normalizedPhotos) setPhotoPreviews(normalizedPhotos);
          Object.keys(data).forEach(key => setValue(key, data[key]));
          setIsViewMode(true);
          setCompletedSteps([0, 1, 2, 3, 4]); // Tutti completati se esiste già
        }
      } catch (error) {
        showNotification(`Errore: ${error.message}`, 'error');
      }
      setLoading(false);
    };
    fetchAnamnesi();
  }, [user, navigate, setValue, normalizePhotoURLs]);

  const showNotification = useCallback((message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  }, []);

  // Handle photo selection
  const handleFileSelect = useCallback(async (type, file) => {
    setPhotoLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      const processedFile = await compressImage(file);
      const previewUrl = URL.createObjectURL(processedFile);
      setPhotoPreviews(prev => ({ ...prev, [type]: previewUrl }));
      setPhotos(prev => ({ ...prev, [type]: processedFile }));
    } catch (err) {
      console.error(`Errore foto "${type}":`, err);
      showNotification(err.message || 'Errore nel caricamento della foto');
    } finally {
      setPhotoLoading(prev => ({ ...prev, [type]: false }));
    }
  }, [showNotification]);

  // Navigation
  const goToStep = (step) => {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step);
    }
  };

  const nextStep = async () => {
    // Nessuna validazione obbligatoria sullo step 0
    
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit form
  const onSubmit = async (data) => {
    if (!user || saving) return;
    setSaving(true);
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
      }

      const dataToSave = {
        ...data,
        photoURLs: normalizePhotoURLs(photoURLs),
        submittedAt: serverTimestamp(),
        createdAt: anamnesiData?.createdAt || serverTimestamp()
      };

      const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'anamnesi');
      await setDoc(doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial'), dataToSave, { merge: true });

      try {
        await updateDoc(getTenantDoc(db, 'clients', user.uid), { lastActive: serverTimestamp() });
      } catch (e) {
        console.debug('Could not update lastActive:', e.message);
      }

      setAnamnesiData(dataToSave);
      setPhotos({ front: null, right: null, left: null, back: null });
      setPhotoPreviews(normalizePhotoURLs(photoURLs));
      setIsViewMode(true);
      setCompletedSteps([0, 1, 2, 3, 4]);
      showNotification('Anamnesi salvata con successo! 🎉', 'success');
      
      // Resta nella view mode, non redirect automatico
    } catch (error) {
      showNotification(`Errore: ${error.message}`, 'error');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  // View mode
  if (isViewMode && anamnesiData) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-6">
        <Notification {...notification} onDismiss={() => setNotification({ message: '', type: '' })} />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">La tua Anamnesi</h1>
            <p className="text-sm text-slate-400">Compilata il {anamnesiData.submittedAt?.toDate?.()?.toLocaleDateString('it-IT') || 'N/D'}</p>
          </div>
          <button
            onClick={() => navigate('/client/dashboard')}
            className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="space-y-4">
          {/* Personal Info */}
          <GlowCard className="p-4" gradient>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                <User size={18} className="text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white">Dati Personali</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Nome:</span> <span className="text-white">{anamnesiData.firstName} {anamnesiData.lastName}</span></div>
              <div><span className="text-slate-500">Sesso:</span> <span className="text-white">{anamnesiData.gender === 'male' ? 'M' : 'F'}</span></div>
              <div><span className="text-slate-500">Peso:</span> <span className="text-white">{formatWeight(anamnesiData.weight)}</span></div>
              <div><span className="text-slate-500">Altezza:</span> <span className="text-white">{formatLength(anamnesiData.height)}</span></div>
            </div>
          </GlowCard>

          {/* Nutrition */}
          <GlowCard className="p-4" gradient>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Utensils size={18} className="text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white">Alimentazione</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500">Pasti/giorno:</span> <span className="text-white">{anamnesiData.mealsPerDay || '-'}</span></div>
              <div><span className="text-slate-500">Intolleranze:</span> <span className="text-white">{anamnesiData.intolerances || 'Nessuna'}</span></div>
            </div>
          </GlowCard>

          {/* Training */}
          <GlowCard className="p-4" gradient>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
                <Dumbbell size={18} className="text-violet-400" />
              </div>
              <h3 className="font-semibold text-white">Allenamento</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500">Frequenza:</span> <span className="text-white">{anamnesiData.workoutsPerWeek || '-'}x/settimana</span></div>
              <div><span className="text-slate-500">Orario:</span> <span className="text-white">{anamnesiData.trainingTime || '-'}</span></div>
            </div>
          </GlowCard>

          {/* Goal */}
          <GlowCard className="p-4" gradient>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                <Target size={18} className="text-amber-400" />
              </div>
              <h3 className="font-semibold text-white">Obiettivo</h3>
            </div>
            <p className="text-sm text-slate-300">{anamnesiData.mainGoal || 'Non specificato'}</p>
          </GlowCard>

          {/* Photos */}
          {anamnesiData.photoURLs && Object.values(anamnesiData.photoURLs).some(url => url) && (
            <GlowCard className="p-4" gradient>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-pink-500/20 border border-pink-500/30">
                  <Camera size={18} className="text-pink-400" />
                </div>
                <h3 className="font-semibold text-white">Foto Iniziali</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['front', 'back', 'right', 'left'].map(type => (
                  anamnesiData.photoURLs?.[type] && (
                    <img
                      key={type}
                      src={anamnesiData.photoURLs[type]}
                      alt={type}
                      className="w-full aspect-[3/4] object-cover rounded-xl"
                    />
                  )
                ))}
              </div>
            </GlowCard>
          )}
        </div>

        {/* Edit Button */}
        <div className="fixed bottom-20 left-4 right-4">
          <button
            onClick={() => {
              setCurrentStep(0); // Reset allo step 1
              setIsViewMode(false);
            }}
            className="w-full py-3 bg-slate-700/80 backdrop-blur-sm text-white font-semibold rounded-2xl border border-slate-600/50"
          >
            Modifica Anamnesi
          </button>
        </div>
      </div>
    );
  }

  // Edit/Create mode
  return (
    <div className="min-h-screen pb-32 px-4 pt-6">
      <Notification {...notification} onDismiss={() => setNotification({ message: '', type: '' })} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">{anamnesiData ? 'Modifica Anamnesi' : 'Nuova Anamnesi'}</h1>
          <p className="text-xs text-slate-400">Completa tutti i passaggi</p>
        </div>
        <button
          onClick={() => {
            if (anamnesiData) {
              // Se esiste già, torna alla view mode
              setIsViewMode(true);
              setCurrentStep(0);
              // Reset foto non salvate
              setPhotos({ front: null, right: null, left: null, back: null });
              setPhotoPreviews(normalizePhotoURLs(anamnesiData.photoURLs) || { front: null, right: null, left: null, back: null });
            } else {
              navigate('/client/dashboard');
            }
          }}
          className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress */}
      <StepProgress currentStep={currentStep} totalSteps={STEPS.length} />

      {/* Step Dots */}
      <StepDots
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Form Content - no submit handler, usiamo click esplicito */}
      <form onSubmit={(e) => e.preventDefault()}>
        <GlowCard className="p-4 mb-4" gradient>
          <AnimatePresence mode="wait">
            {currentStep === 0 && <StepPersonal key="personal" register={register} errors={errors} />}
            {currentStep === 1 && <StepNutrition key="nutrition" register={register} />}
            {currentStep === 2 && <StepTraining key="training" register={register} />}
            {currentStep === 3 && <StepHealth key="health" register={register} />}
            {currentStep === 4 && (
              <StepPhotos
                key="photos"
                photos={photos}
                photoPreviews={photoPreviews}
                photoLoading={photoLoading}
                onFileSelect={handleFileSelect}
              />
            )}
          </AnimatePresence>
        </GlowCard>

        {/* Upload Progress */}
        {saving && uploadProgress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Caricamento foto...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="fixed bottom-20 left-4 right-4 flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-3 bg-slate-700/80 backdrop-blur-sm text-white font-semibold rounded-2xl border border-slate-600/50 flex items-center justify-center gap-2"
            >
              <ChevronLeft size={18} />
              Indietro
            </button>
          )}
          
          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-semibold rounded-2xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              Avanti
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit(onSubmit)()}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salva Anamnesi
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ClientAnamnesi;
