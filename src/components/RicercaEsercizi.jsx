import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Play, Globe, User, Eye, Dumbbell, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BodyMapMini } from './BodyMap';
import { getMuscleColor } from './MuscleIcons';

const MAX_VISIBLE_EXERCISES = 50; // Limita risultati per performance

const RicercaEsercizi = ({ onAddExercise, onCancel, toast }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewExercise, setPreviewExercise] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [muscleOptions, setMuscleOptions] = useState([]);
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [addingId, setAddingId] = useState(null);

  // Carica esercizi dal Firestore
  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const exercisesRef = collection(db, 'platform_exercises');
      const snapshot = await getDocs(exercisesRef);
      const exercisesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setExercises(exercisesList);

      // Estrai opzioni equipaggiamento e muscoli
      const equipSet = new Set();
      const muscleSet = new Set();

      exercisesList.forEach(ex => {
        const equipment = ex.attrezzo || ex.equipmentIt || ex.equipment;
        const muscle = ex.gruppoMuscolare || ex.bodyPartIt || ex.bodyPart;

        if (equipment) equipSet.add(equipment);
        if (muscle) muscleSet.add(muscle);
      });

      setEquipmentOptions(Array.from(equipSet).sort());
      setMuscleOptions(Array.from(muscleSet).sort());
    } catch (error) {
      console.error('Errore nel caricamento degli esercizi:', error);
      toast?.error('Errore nel caricamento degli esercizi');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Debounce ricerca per ridurre render e lag
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Filtra esercizi per nome, equipaggiamento e muscolo
  const filteredExercises = useMemo(() => {
    const filtered = [];
    for (const ex of exercises) {
      const name = (ex.nome || ex.nameIt || ex.name || '').toLowerCase();
      const equipment = ex.attrezzo || ex.equipmentIt || ex.equipment || '';
      const muscle = ex.gruppoMuscolare || ex.bodyPartIt || ex.bodyPart || '';

      const nameMatch = !debouncedTerm || name.includes(debouncedTerm);
      const equipMatch = !selectedEquipment || equipment === selectedEquipment;
      const muscleMatch = !selectedMuscle || muscle === selectedMuscle;

      if (nameMatch && equipMatch && muscleMatch) {
        filtered.push(ex);
        // Limita risultati per performance - mostra solo primi N
        if (filtered.length >= MAX_VISIBLE_EXERCISES) break;
      }
    }
    return filtered;
  }, [exercises, debouncedTerm, selectedEquipment, selectedMuscle]);

  // Conteggio totale per mostrare all'utente
  const totalMatchingCount = useMemo(() => {
    if (!debouncedTerm && !selectedEquipment && !selectedMuscle) return exercises.length;
    return exercises.filter(ex => {
      const name = (ex.nome || ex.nameIt || ex.name || '').toLowerCase();
      const equipment = ex.attrezzo || ex.equipmentIt || ex.equipment || '';
      const muscle = ex.gruppoMuscolare || ex.bodyPartIt || ex.bodyPart || '';
      const nameMatch = !debouncedTerm || name.includes(debouncedTerm);
      const equipMatch = !selectedEquipment || equipment === selectedEquipment;
      const muscleMatch = !selectedMuscle || muscle === selectedMuscle;
      return nameMatch && equipMatch && muscleMatch;
    }).length;
  }, [exercises, debouncedTerm, selectedEquipment, selectedMuscle]);

  const handleAddExercise = (exercise) => {
    setAddingId(exercise.id);
    onAddExercise({
      ...exercise,
      serie: '3',
      ripetizioni: '12',
      recupero: '60',
      noteEsercizio: ''
    });
    setTimeout(() => setAddingId(null), 150);
  };

  const getExerciseField = (exercise, oldField, newField, newFieldEn) => {
    return exercise[oldField] || exercise[newField] || exercise[newFieldEn] || '';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      >
        <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-slate-800 rounded-xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-100">Aggiungi Esercizio</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Ricerca e Filtri */}
        <div className="space-y-4 mb-6">
          {/* Ricerca per nome */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca esercizio per nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-lg"
              autoFocus
            />
          </div>

          {/* Selezione Muscoli con Body Map */}
          <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">🎯 Tocca il muscolo da allenare</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2">
              {muscleOptions.map(muscle => {
                const colors = getMuscleColor(muscle);
                const isSelected = selectedMuscle === muscle;
                
                return (
                  <button
                    key={muscle}
                    onClick={() => setSelectedMuscle(isSelected ? '' : muscle)}
                    className={`
                      flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-200
                      ${isSelected 
                        ? `${colors.border} shadow-lg scale-105` 
                        : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30'
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? colors.bg.replace('bg-', '').replace('/20', '') + '15' : undefined,
                      borderColor: isSelected ? colors.text.replace('text-', '').replace('-400', '') : undefined
                    }}
                  >
                    <BodyMapMini muscle={muscle} size={36} />
                    <span className={`mt-1 text-[10px] font-medium capitalize leading-tight text-center ${isSelected ? colors.text : 'text-slate-500'}`}>
                      {muscle}
                    </span>
                    {isSelected && (
                      <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center ${colors.bg}`}>
                        <Check size={10} className={colors.text} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro Attrezzi */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Dumbbell size={18} />
              <span className="text-sm">Attrezzo:</span>
            </div>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="">Tutti gli attrezzi</option>
              {equipmentOptions.map(equip => (
                <option key={equip} value={equip}>{equip}</option>
              ))}
            </select>
            
            {/* Reset filtri */}
            {(selectedMuscle || selectedEquipment || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedMuscle('');
                  setSelectedEquipment('');
                  setSearchTerm('');
                }}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Contatore risultati */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-slate-400">
              {totalMatchingCount > MAX_VISIBLE_EXERCISES 
                ? <><span className="text-blue-400 font-semibold">{filteredExercises.length}</span> di <span className="font-semibold">{totalMatchingCount}</span> esercizi (affina la ricerca)</>
                : <><span className="text-emerald-400 font-semibold">{filteredExercises.length}</span> esercizio{filteredExercises.length !== 1 ? 'i' : ''} trovato{filteredExercises.length !== 1 ? 'i' : ''}</>
              }
            </p>
          </div>
        </div>

        {/* Lista Esercizi */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mb-3"></div>
            <p className="text-slate-400">Caricamento esercizi...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Nessun esercizio trovato</p>
            <p className="text-slate-500 text-sm mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            {filteredExercises.map((exercise) => {
              const exName = getExerciseField(exercise, 'nome', 'nameIt', 'name');
              const exEquipment = getExerciseField(exercise, 'attrezzo', 'equipmentIt', 'equipment');
              const exMuscle = getExerciseField(exercise, 'gruppoMuscolare', 'bodyPartIt', 'bodyPart');
              const exVideo = exercise.videoUrl || exercise.gifUrl;
              const isHovered = hoveredId === exercise.id;
              const muscleColors = getMuscleColor(exMuscle);

              return (
                <div
                  key={exercise.id}
                  className={`
                    bg-gradient-to-r from-slate-800 to-slate-800/50 
                    border rounded-xl p-4 transition-all duration-200 group cursor-pointer
                    ${isHovered ? `border-l-4 ${muscleColors.border} shadow-lg shadow-slate-900/50 scale-[1.01]` : 'border-slate-700/50 hover:border-slate-600'}
                  `}
                  onMouseEnter={() => setHoveredId(exercise.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleAddExercise(exercise)}
                >
                  <div className="flex items-center gap-4">
                    {/* Body Map con muscolo evidenziato */}
                    <div className={`
                      w-14 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden
                      bg-slate-900/50 border ${muscleColors.border}
                      transition-transform duration-200 group-hover:scale-110
                    `}>
                      {exVideo && isHovered ? (
                        <img
                          src={exercise.gifUrl || exercise.videoUrl}
                          alt={exName}
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                        />
                      ) : (
                        <BodyMapMini muscle={exMuscle} size={44} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Nome Esercizio */}
                      <h4 className="font-semibold text-slate-100 text-lg group-hover:text-blue-300 transition-colors truncate">
                        {exName}
                      </h4>

                      {/* Info compatte */}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {/* Muscolo con mini body */}
                        {exMuscle && (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${muscleColors.bg} ${muscleColors.text}`}>
                            <BodyMapMini muscle={exMuscle} size={14} />
                            {exMuscle}
                          </span>
                        )}
                        
                        {/* Attrezzo */}
                        {exEquipment && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full text-xs">
                            <Dumbbell size={10} />
                            {exEquipment}
                          </span>
                        )}

                        {/* Video badge */}
                        {exVideo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded-full text-xs">
                            <Play size={10} />
                            {exercise.gifUrl ? 'GIF' : 'Video'}
                          </span>
                        )}

                        {/* Source badge */}
                        {exercise.source === 'custom' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded-full text-xs">
                            <User size={10} />
                            Custom
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Azioni */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {exVideo && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewExercise(exercise); }}
                          className="p-2.5 bg-slate-700/50 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all"
                          title="Anteprima"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddExercise(exercise); }}
                        disabled={addingId === exercise.id}
                        className={`
                          p-2.5 rounded-lg transition-all font-semibold
                          ${addingId === exercise.id 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105'
                          }
                        `}
                        title="Aggiungi"
                      >
                        {addingId === exercise.id ? <Check size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>

    {/* Modal Preview Esercizio */}
    <AnimatePresence>
      {previewExercise && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPreviewExercise(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[60] p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-slate-800 rounded-xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-100">
                {getExerciseField(previewExercise, 'nome', 'nameIt', 'name')}
              </h3>
              <button
                onClick={() => setPreviewExercise(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Video/GIF Preview */}
            {(previewExercise.videoUrl || previewExercise.gifUrl) && (
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4">
                {previewExercise.gifUrl ? (
                  <img
                    src={previewExercise.gifUrl}
                    alt={getExerciseField(previewExercise, 'nome', 'nameIt', 'name')}
                    className="w-full h-full object-contain"
                  />
                ) : previewExercise.videoUrl?.includes('youtube.com') || previewExercise.videoUrl?.includes('youtu.be') ? (
                  <iframe
                    src={previewExercise.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <video
                    src={previewExercise.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Attrezzo</p>
                <p className="text-sm text-slate-200 font-medium">
                  {getExerciseField(previewExercise, 'attrezzo', 'equipmentIt', 'equipment')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Gruppo Muscolare</p>
                <p className="text-sm text-slate-200 font-medium">
                  {getExerciseField(previewExercise, 'gruppoMuscolare', 'bodyPartIt', 'bodyPart')}
                </p>
              </div>
            </div>

            {/* Target Muscle */}
            {(previewExercise.target || previewExercise.targetIt) && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Muscolo Target</p>
                <p className="text-sm text-slate-200">
                  {previewExercise.targetIt || previewExercise.target}
                </p>
              </div>
            )}

            {/* Instructions */}
            {((previewExercise.instructionsIt && previewExercise.instructionsIt.length > 0) || 
              (previewExercise.instructions && previewExercise.instructions.length > 0)) && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-300 mb-2">Istruzioni:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                  {(previewExercise.instructionsIt || previewExercise.instructions).map((instr, i) => (
                    <li key={i}>{instr}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Secondary Muscles */}
            {((previewExercise.secondaryMusclesIt && previewExercise.secondaryMusclesIt.length > 0) ||
              (previewExercise.secondaryMuscles && previewExercise.secondaryMuscles.length > 0)) && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Muscoli Secondari</p>
                <div className="flex flex-wrap gap-2">
                  {(previewExercise.secondaryMusclesIt || previewExercise.secondaryMuscles).map((muscle, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded text-xs">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty */}
            {(previewExercise.difficulty || previewExercise.difficultyIt) && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Difficoltà</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  (previewExercise.difficultyIt || previewExercise.difficulty) === 'Principiante' || 
                  (previewExercise.difficultyIt || previewExercise.difficulty) === 'beginner'
                    ? 'bg-green-900/30 border border-green-600/30 text-green-300'
                    : (previewExercise.difficultyIt || previewExercise.difficulty) === 'Intermedio' ||
                      (previewExercise.difficultyIt || previewExercise.difficulty) === 'intermediate'
                    ? 'bg-yellow-900/30 border border-yellow-600/30 text-yellow-300'
                    : 'bg-red-900/30 border border-red-600/30 text-red-300'
                }`}>
                  {previewExercise.difficultyIt || previewExercise.difficulty}
                </span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => {
                handleAddExercise(previewExercise);
                setPreviewExercise(null);
              }}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Aggiungi alla Scheda
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default RicercaEsercizi;
