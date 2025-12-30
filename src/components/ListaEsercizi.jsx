import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Save, Filter, Video, Upload, Settings, Globe, User, Shield } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, or, getDoc, setDoc } from 'firebase/firestore';
import { getTenantCollection, getTenantDoc, getCurrentTenantId } from '../config/tenant';
import { uploadToR2 } from '../cloudflareStorage';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

// PERMESSI TEMPORANEI: Tenant che possono modificare esercizi globali
// Rimuovere quando non più necessario
const GLOBAL_EXERCISE_EDITORS = ['biondo-fitness-coach'];

const ListaEsercizi = ({ onBack }) => {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttrezzo, setSelectedAttrezzo] = useState('');
  const [selectedGruppo, setSelectedGruppo] = useState('');
  const [attrezziOptions, setAttrezziOptions] = useState([]);
  const [gruppiOptions, setGruppiOptions] = useState([]);
  
  // Verifica se l'utente corrente può modificare esercizi globali
  const canEditGlobalExercises = GLOBAL_EXERCISE_EDITORS.includes(getCurrentTenantId());
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'global', 'custom'
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const videoInputRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [useGlobalDatabase, setUseGlobalDatabase] = useState(true);
  const [globalExercises, setGlobalExercises] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  // Preview esercizio
  const [previewExercise, setPreviewExercise] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    attrezzo: '',
    gruppoMuscolare: '',
    descrizione: '',
    videoUrl: '',
    isCustom: false // true = custom del tenant, false = va nel database globale (se permesso)
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const handleToggleGlobalDatabase = async (enabled) => {
    try {
      const settingsRef = getTenantDoc(db, 'exercise_settings', 'config');
      await setDoc(settingsRef, {
        useGlobalDatabase: enabled,
        updatedAt: new Date(),
        updatedBy: auth.currentUser.uid
      }, { merge: true });
      setUseGlobalDatabase(enabled);
      loadExercises(); // Ricarica con nuove impostazioni
    } catch (error) {
      console.error('Errore salvataggio settings:', error);
      toast.error('Errore nel salvataggio delle impostazioni');
    }
  };

  const loadExercises = async () => {
    setLoading(true);
    try {
      // 1. Carica settings per vedere se usare database globale
      const settingsRef = getTenantDoc(db, 'exercise_settings', 'config');
      const settingsSnap = await getDoc(settingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : { useGlobalDatabase: true };
      setUseGlobalDatabase(settings.useGlobalDatabase);

      let globalExercisesData = [];
      let customExercisesData = [];

      // 2. Carica esercizi globali (se abilitato)
      if (settings.useGlobalDatabase) {
        const globalRef = collection(db, 'platform_exercises');
        const globalSnap = await getDocs(globalRef);
        
        // Verifica se l'utente può modificare esercizi globali
        const canEditGlobal = GLOBAL_EXERCISE_EDITORS.includes(getCurrentTenantId());
        
        globalExercisesData = globalSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: 'global',
          editable: canEditGlobal // true se tenant ha permesso di modifica globale
        }));
      }

      // 3. Carica esercizi custom del tenant
      const customRef = getTenantCollection(db, 'exercises');
      const customSnap = await getDocs(customRef);
      customExercisesData = customSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'custom',
        editable: true
      }));

      // 4. Merge (custom override global se ha campo overridesGlobal)
      const exerciseMap = new Map();
      
      globalExercisesData.forEach(ex => {
        exerciseMap.set(ex.id, ex);
      });
      
      customExercisesData.forEach(ex => {
        if (ex.overridesGlobal) {
          // Override: sostituisce esercizio globale
          exerciseMap.set(ex.overridesGlobal, ex);
        } else {
          // Nuovo esercizio custom
          exerciseMap.set(ex.id, ex);
        }
      });

      const allExercises = Array.from(exerciseMap.values());
      
      setGlobalExercises(globalExercisesData);
      setCustomExercises(customExercisesData);
      setExercises(allExercises);
      
      // Estrai opzioni uniche per i filtri
      const attrezziSet = new Set();
      const gruppiSet = new Set();
      
      allExercises.forEach(ex => {
        const attrezzo = ex.attrezzo || ex.equipmentIt || ex.equipment;
        const gruppo = ex.gruppoMuscolare || ex.bodyPartIt || ex.bodyPart;
        
        if (attrezzo) attrezziSet.add(attrezzo);
        if (gruppo) gruppiSet.add(gruppo);
      });
      
      setAttrezziOptions(Array.from(attrezziSet).sort());
      setGruppiOptions(Array.from(gruppiSet).sort());
    } catch (error) {
      console.error('Errore nel caricamento degli esercizi:', error);
    }
    setLoading(false);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.warning('Seleziona un file video valido');
      return;
    }

    // Limite 50MB per video
    if (file.size > 50 * 1024 * 1024) {
      toast.warning('Il video non può superare i 50MB');
      return;
    }

    setSelectedVideoFile(file);
  };

  const handleAddExercise = async () => {
    if (!formData.nome || !formData.attrezzo || !formData.gruppoMuscolare) {
      toast.warning('Compila i campi obbligatori (nome, attrezzo, gruppo muscolare)');
      return;
    }

    try {
      setUploadingVideo(true);
      let videoUrl = formData.videoUrl;

      // Se c'è un video selezionato, caricalo su R2
      if (selectedVideoFile) {
        console.log('📤 Upload video esercizio...', selectedVideoFile.name);
        try {
          videoUrl = await uploadToR2(
            selectedVideoFile,
            'maurizio', // Categoria globale
            'exercise_videos',
            (progress) => {
              console.log('📊 Progress:', progress);
              setUploadProgress(progress.percent);
            },
            true // isAdmin = true per rimuovere limite dimensione
          );
          console.log('✅ Video caricato:', videoUrl);
        } catch (uploadError) {
          console.error('❌ Errore upload video:', uploadError);
          toast.error(`Errore upload video: ${uploadError.message}`);
          setUploadingVideo(false);
          return;
        }
      }

      const { isCustom, ...exerciseData } = formData;
      
      // Se custom, salva in tenant exercises, altrimenti in platform_exercises (root)
      const exercisesRef = isCustom 
        ? getTenantCollection(db, 'exercises')
        : collection(db, 'platform_exercises');
      
      await addDoc(exercisesRef, {
        ...exerciseData,
        videoUrl,
        isCustom,
        userId: auth.currentUser.uid,
        createdBy: auth.currentUser.displayName || 'Admin',
        createdAt: new Date()
      });
      
      resetForm();
      loadExercises();
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'esercizio:', error);
      toast.error(`Errore nell'aggiunta dell'esercizio: ${error.message}`);
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateExercise = async () => {
    if (!formData.nome || !formData.attrezzo || !formData.gruppoMuscolare) {
      toast.warning('Compila i campi obbligatori (nome, attrezzo, gruppo muscolare)');
      return;
    }

    try {
      setUploadingVideo(true);
      let videoUrl = formData.videoUrl;

      // Se c'è un nuovo video selezionato, caricalo
      if (selectedVideoFile) {
        console.log('📤 Upload nuovo video...', selectedVideoFile.name);
        try {
          videoUrl = await uploadToR2(
            selectedVideoFile,
            editingExercise.category || 'maurizio',
            'exercise_videos',
            (progress) => setUploadProgress(progress.percent),
            true
          );
          console.log('✅ Video aggiornato:', videoUrl);
        } catch (uploadError) {
          console.error('❌ Errore upload video:', uploadError);
          toast.error(`Errore upload video: ${uploadError.message}`);
          setUploadingVideo(false);
          return;
        }
      }

      // Determina collection da source dell'esercizio
      const exerciseRef = editingExercise.source === 'global'
        ? doc(db, 'platform_exercises', editingExercise.id)
        : getTenantDoc(db, 'exercises', editingExercise.id);
      
      const { isCustom, ...exerciseData } = formData;
      
      // Se è un esercizio globale, aggiorna anche nameIt per ExerciseDB
      const updateData = {
        ...exerciseData,
        videoUrl,
        updatedAt: new Date(),
        updatedBy: auth.currentUser.displayName || 'Admin'
      };
      
      // Per esercizi globali ExerciseDB, aggiorna anche nameIt
      if (editingExercise.source === 'global' && editingExercise.nameIt) {
        updateData.nameIt = exerciseData.nome;
      }
      
      await updateDoc(exerciseRef, updateData);
      
      // Messaggio diverso per modifiche globali
      if (editingExercise.source === 'global') {
        toast.success(`✅ Esercizio globale "${exerciseData.nome}" aggiornato per tutti i tenant!`);
      } else {
        toast.success('Esercizio aggiornato');
      }
      
      resetForm();
      loadExercises();
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'esercizio:', error);
      toast.error(`Errore nell'aggiornamento dell'esercizio: ${error.message}`);
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteExercise = async (exercise) => {
    const confirmed = await confirmDelete('questo esercizio');
    if (!confirmed) return;

    try {
      const exerciseRef = exercise.source === 'global'
        ? doc(db, 'platform_exercises', exercise.id)
        : getTenantDoc(db, 'exercises', exercise.id);
      await deleteDoc(exerciseRef);
      loadExercises();
      toast.success('Esercizio eliminato');
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'esercizio:', error);
      toast.error('Errore nell\'eliminazione dell\'esercizio');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      attrezzo: '',
      gruppoMuscolare: '',
      descrizione: '',
      videoUrl: '',
      isCustom: false
    });
    setSelectedVideoFile(null);
    setUploadingVideo(false);
    setUploadProgress(0);
    setIsAddingExercise(false);
    setEditingExercise(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const startEdit = (exercise) => {
    setEditingExercise(exercise);
    // Supporta sia vecchi campi che nuovi da ExerciseDB
    setFormData({
      nome: exercise.nome || exercise.nameIt || exercise.name || '',
      attrezzo: exercise.attrezzo || exercise.equipmentIt || exercise.equipment || '',
      gruppoMuscolare: exercise.gruppoMuscolare || exercise.bodyPartIt || exercise.bodyPart || '',
      descrizione: exercise.descrizione || exercise.description || '',
      videoUrl: exercise.videoUrl || exercise.gifUrl || '',
      isCustom: exercise.source === 'custom'
    });
  };

  const filteredExercises = exercises.filter(exercise => {
    // Supporta sia vecchi campi (nome, attrezzo) che nuovi da ExerciseDB (name, nameIt, equipment)
    const exerciseName = exercise.nome || exercise.nameIt || exercise.name || '';
    const exerciseEquipment = exercise.attrezzo || exercise.equipmentIt || exercise.equipment || '';
    const exerciseMuscle = exercise.gruppoMuscolare || exercise.bodyPartIt || exercise.bodyPart || '';
    
    const matchesSearch = exerciseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAttrezzo = !selectedAttrezzo || exerciseEquipment === selectedAttrezzo;
    const matchesGruppo = !selectedGruppo || exerciseMuscle === selectedGruppo;
    const matchesCategory = categoryFilter === 'all' || 
      (categoryFilter === 'global' && exercise.source === 'global') ||
      (categoryFilter === 'custom' && exercise.source === 'custom');
    return matchesSearch && matchesAttrezzo && matchesGruppo && matchesCategory;
  });

  // Paginazione
  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAttrezzo, selectedGruppo, categoryFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-full overflow-x-hidden"
    >
      {/* Banner permessi modifica globale */}
      {canEditGlobalExercises && (
        <div className="bg-amber-600/20 border border-amber-500/50 rounded-lg p-4 flex items-center gap-3">
          <Shield className="text-amber-400 flex-shrink-0" size={24} />
          <div>
            <p className="text-amber-200 font-medium">🔓 Permessi Editor Globale Attivi</p>
            <p className="text-amber-300/70 text-sm">
              Puoi modificare i nomi degli esercizi globali. Le modifiche saranno visibili a tutti i tenant.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Torna indietro
        </button>
        <h2 className="text-2xl font-bold text-slate-100">Lista Esercizi</h2>
      </div>

      {/* Search, Filters and Add */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca per nome esercizio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Filtro Categoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tutti gli Esercizi</option>
            <option value="global">🌍 Database Globale</option>
            <option value="custom">⭐ Esercizi Custom</option>
          </select>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Settings size={18} />
            Impostazioni
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <Filter size={18} />
            Filtri
          </button>
          <button
            onClick={() => setIsAddingExercise(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Aggiungi Esercizio
          </button>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-600/30 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-purple-200 mb-4 flex items-center gap-2">
                <Settings size={20} />
                Configurazione Database Esercizi
              </h3>
              
              <div className="space-y-4">
                {/* Toggle Database Globale */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="text-blue-400" size={20} />
                        <label className="text-sm font-medium text-slate-200">
                          Usa Database Globale
                        </label>
                      </div>
                      <p className="text-xs text-slate-400">
                        Accedi a 150+ esercizi professionali con video e GIF animati.
                        Puoi comunque aggiungere i tuoi esercizi personalizzati.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleGlobalDatabase(!useGlobalDatabase)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        useGlobalDatabase ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          useGlobalDatabase ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-300">{globalExercises.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Esercizi Globali</div>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-300">{customExercises.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Esercizi Custom</div>
                  </div>
                  <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-300">{exercises.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Totale Disponibili</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/50 border border-slate-700 rounded-lg p-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Filtra per Attrezzo
                </label>
                <select
                  value={selectedAttrezzo}
                  onChange={(e) => setSelectedAttrezzo(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Tutti gli attrezzi</option>
                  {attrezziOptions.map(attrezzo => (
                    <option key={attrezzo} value={attrezzo}>{attrezzo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Filtra per Gruppo Muscolare
                </label>
                <select
                  value={selectedGruppo}
                  onChange={(e) => setSelectedGruppo(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Tutti i gruppi</option>
                  {gruppiOptions.map(gruppo => (
                    <option key={gruppo} value={gruppo}>{gruppo}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(isAddingExercise || editingExercise) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">
                {editingExercise ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
              </h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle Categoria */}
              <div className="md:col-span-2 bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-1">
                      Tipo Esercizio
                    </label>
                    <p className="text-xs text-slate-500">
                      {formData.isCustom 
                        ? '⭐ Esercizio Custom - Con i tuoi video personalizzati'
                        : '🌍 Database Globale - Esercizio con video professionale'
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isCustom: !formData.isCustom })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isCustom ? 'bg-purple-600' : 'bg-blue-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isCustom ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome Esercizio <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Es. Panca piana con bilanciere"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Attrezzo <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.attrezzo}
                  onChange={(e) => setFormData({ ...formData, attrezzo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleziona attrezzo</option>
                  {attrezziOptions.map(attrezzo => (
                    <option key={attrezzo} value={attrezzo}>{attrezzo}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gruppo Muscolare <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.gruppoMuscolare}
                  onChange={(e) => setFormData({ ...formData, gruppoMuscolare: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleziona gruppo</option>
                  {gruppiOptions.map(gruppo => (
                    <option key={gruppo} value={gruppo}>{gruppo}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Descrizione dell'esercizio..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Video Esercizio
                </label>
                
                {/* Opzione 1: Carica Video */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                      id="video-upload"
                      disabled={uploadingVideo}
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex-1 cursor-pointer px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      {selectedVideoFile ? selectedVideoFile.name : 'Carica Video (max 50MB)'}
                    </label>
                    {selectedVideoFile && (
                      <button
                        onClick={() => {
                          setSelectedVideoFile(null);
                          if (videoInputRef.current) videoInputRef.current.value = '';
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  {/* Opzione 2: URL Video */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-slate-800 text-slate-500">oppure inserisci URL</span>
                    </div>
                  </div>
                  
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="https://..."
                    disabled={selectedVideoFile !== null}
                  />
                  
                  {/* Anteprima video esistente */}
                  {(formData.videoUrl && !selectedVideoFile) && (
                    <div className="mt-2">
                      <video 
                        src={formData.videoUrl} 
                        controls 
                        className="w-full max-h-64 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar upload */}
            {uploadingVideo && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Caricamento video...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={editingExercise ? handleUpdateExercise : handleAddExercise}
                disabled={uploadingVideo}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {uploadingVideo ? `Caricamento ${uploadProgress}%...` : editingExercise ? 'Salva Modifiche' : 'Aggiungi'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                Annulla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercises List */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Caricamento...
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {searchTerm || selectedAttrezzo || selectedGruppo ? 'Nessun esercizio trovato' : 'Nessun esercizio disponibile'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Categoria</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Attrezzo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Gruppo</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Video</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {paginatedExercises.map((exercise) => {
                  // Supporta sia vecchi campi che nuovi da ExerciseDB
                  const exerciseName = exercise.nome || exercise.nameIt || exercise.name || 'Senza nome';
                  const exerciseEquipment = exercise.attrezzo || exercise.equipmentIt || exercise.equipment || '-';
                  const exerciseMuscle = exercise.gruppoMuscolare || exercise.bodyPartIt || exercise.bodyPart || '-';
                  const exerciseVideo = exercise.videoUrl || exercise.gifUrl || null;
                  const canEdit = exercise.editable; // Usa il flag editable dall'esercizio
                  
                  return (
                    <tr key={exercise.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {exerciseName}
                        {exercise.source === 'global' && canEdit && (
                          <span className="ml-2 px-1.5 py-0.5 bg-amber-600/30 text-amber-400 text-[10px] rounded">
                            <Shield size={10} className="inline mr-0.5" />
                            EDIT
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {exercise.source === 'global' ? (
                          <span className="px-2 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded text-xs flex items-center gap-1 w-fit">
                            <Globe size={12} />
                            Globale
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded text-xs flex items-center gap-1 w-fit">
                            <User size={12} />
                            Custom
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded text-xs">
                          {exerciseEquipment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded text-xs">
                          {exerciseMuscle}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {exerciseVideo ? (
                          <button
                            onClick={() => setPreviewExercise(exercise)}
                            className="p-2 text-green-400 hover:bg-green-600/20 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Guarda video/GIF"
                            aria-label="Guarda video esercizio"
                          >
                            <Video size={16} />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => startEdit(exercise)}
                                className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                                title="Modifica"
                                aria-label="Modifica esercizio"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteExercise(exercise)}
                                className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                                title="Elimina"
                                aria-label="Elimina esercizio"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-600 text-xs px-2">Solo lettura</span>
                          )}
                        </div>
                      </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-4">
                <div className="text-sm text-slate-400">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredExercises.length)} di {filteredExercises.length} esercizi
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                  >
                    ← Prec
                  </button>
                  <span className="text-slate-400 text-sm">
                    Pagina {currentPage} di {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                  >
                    Succ →
                  </button>
                </div>
              </div>
            )}
            </>
        )}
      </div>

      {/* Modal Preview Esercizio */}
      <AnimatePresence>
        {previewExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewExercise(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-slate-800 rounded-xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-100">
                  {previewExercise.nome || previewExercise.nameIt || previewExercise.name}
                </h3>
                <button 
                  onClick={() => setPreviewExercise(null)} 
                  className="text-slate-400 hover:text-slate-200 p-2"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Video/GIF */}
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4">
                {previewExercise.gifUrl ? (
                  <img
                    src={previewExercise.gifUrl}
                    alt={previewExercise.nome || previewExercise.nameIt || previewExercise.name}
                    className="w-full h-full object-contain"
                  />
                ) : previewExercise.videoUrl?.includes('youtube.com') || previewExercise.videoUrl?.includes('youtu.be') ? (
                  <iframe
                    src={previewExercise.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : previewExercise.videoUrl ? (
                  <video
                    src={previewExercise.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded-full text-sm">
                    {previewExercise.attrezzo || previewExercise.equipmentIt || previewExercise.equipment}
                  </span>
                  <span className="px-3 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded-full text-sm">
                    {previewExercise.gruppoMuscolare || previewExercise.bodyPartIt || previewExercise.bodyPart}
                  </span>
                  {previewExercise.targetIt && (
                    <span className="px-3 py-1 bg-emerald-900/30 border border-emerald-600/30 text-emerald-300 rounded-full text-sm">
                      Target: {previewExercise.targetIt}
                    </span>
                  )}
                  {previewExercise.difficultyIt && (
                    <span className="px-3 py-1 bg-amber-900/30 border border-amber-600/30 text-amber-300 rounded-full text-sm">
                      {previewExercise.difficultyIt}
                    </span>
                  )}
                </div>

                {/* Muscoli secondari */}
                {previewExercise.secondaryMusclesIt && previewExercise.secondaryMusclesIt.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Muscoli secondari:</p>
                    <div className="flex flex-wrap gap-1">
                      {previewExercise.secondaryMusclesIt.map((muscle, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Descrizione */}
                {(previewExercise.descrizione || previewExercise.description) && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Descrizione:</p>
                    <p className="text-sm text-slate-300">
                      {previewExercise.descrizione || previewExercise.description}
                    </p>
                  </div>
                )}

                {/* Istruzioni */}
                {previewExercise.instructions && previewExercise.instructions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Istruzioni:</p>
                    <ol className="text-sm text-slate-300 list-decimal list-inside space-y-1">
                      {previewExercise.instructions.map((instr, i) => (
                        <li key={i}>{instr}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Footer */}
              <button
                onClick={() => setPreviewExercise(null)}
                className="w-full mt-6 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ListaEsercizi;
