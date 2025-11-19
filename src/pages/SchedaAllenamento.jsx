import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ArrowLeft, Plus, Trash2, Copy, RotateCcw, X, ChevronUp, ChevronDown, Play } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

const OBIETTIVI = ['Forza', 'Massa', 'Definizione', 'Resistenza', 'Ricomposizione'];
const LIVELLI = ['Principiante', 'Intermedio', 'Avanzato'];
const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const SchedaAllenamento = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [availableExercises, setAvailableExercises] = useState([]);
  
  const [schedaData, setSchedaData] = useState({
    obiettivo: '',
    livello: '',
    note: '',
    durataSettimane: '',
    giorni: GIORNI_SETTIMANA.reduce((acc, giorno) => {
      acc[giorno] = {
        esercizi: []
      };
      return acc;
    }, {})
  });

  const [selectedDay, setSelectedDay] = useState('Lunedì');
  const [showAddEsercizio, setShowAddEsercizio] = useState(false);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      // Load client info
      const clientRef = doc(db, 'clients', clientId);
      const clientSnap = await getDoc(clientRef);
      
      if (clientSnap.exists()) {
        setClientName(clientSnap.data().name || 'N/D');
      }

      // Load available exercises
      const exercisesRef = collection(db, 'esercizi');
      const exercisesSnap = await getDocs(exercisesRef);
      const exercisesData = exercisesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableExercises(exercisesData);

      // Load scheda allenamento if exists
      const schedaRef = doc(db, 'schede_allenamento', clientId);
      const schedaSnap = await getDoc(schedaRef);
      
      if (schedaSnap.exists()) {
        setSchedaData(schedaSnap.data());
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const schedaRef = doc(db, 'schede_allenamento', clientId);
      await setDoc(schedaRef, {
        ...schedaData,
        updatedAt: new Date()
      });

      // Update client with expiry date
      if (schedaData.durataSettimane) {
        const clientRef = doc(db, 'clients', clientId);
        const scadenza = new Date();
        scadenza.setDate(scadenza.getDate() + (parseInt(schedaData.durataSettimane) * 7));
        
        await updateDoc(clientRef, {
          'schedaAllenamento.scadenza': scadenza
        });
      }

      alert('Scheda salvata con successo!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio della scheda');
    }
    setSaving(false);
  };

  const addEsercizio = (esercizio) => {
    setSchedaData(prev => {
      const newData = { ...prev };
      newData.giorni[selectedDay].esercizi.push(esercizio);
      return newData;
    });
  };

  const removeEsercizio = (esercizioIndex) => {
    setSchedaData(prev => {
      const newData = { ...prev };
      newData.giorni[selectedDay].esercizi.splice(esercizioIndex, 1);
      return newData;
    });
  };

  const updateEsercizio = (esercizioIndex, field, value) => {
    setSchedaData(prev => {
      const newData = { ...prev };
      newData.giorni[selectedDay].esercizi[esercizioIndex][field] = value;
      return newData;
    });
  };

  const moveEsercizioUp = (esercizioIndex) => {
    if (esercizioIndex === 0) return;
    setSchedaData(prev => {
      const newData = { ...prev };
      const esercizi = newData.giorni[selectedDay].esercizi;
      [esercizi[esercizioIndex - 1], esercizi[esercizioIndex]] = [esercizi[esercizioIndex], esercizi[esercizioIndex - 1]];
      return newData;
    });
  };

  const moveEsercizioDown = (esercizioIndex) => {
    const esercizi = schedaData.giorni[selectedDay].esercizi;
    if (esercizioIndex === esercizi.length - 1) return;
    setSchedaData(prev => {
      const newData = { ...prev };
      const esercizi = newData.giorni[selectedDay].esercizi;
      [esercizi[esercizioIndex], esercizi[esercizioIndex + 1]] = [esercizi[esercizioIndex + 1], esercizi[esercizioIndex]];
      return newData;
    });
  };

  const addSupersetMarker = (esercizioIndex, type) => {
    setSchedaData(prev => {
      const newData = { ...prev };
      newData.giorni[selectedDay].esercizi.splice(esercizioIndex + 1, 0, {
        type: type, // 'superset-start' or 'superset-end'
        isMarker: true
      });
      return newData;
    });
  };

  const duplicateDayToOthers = (targetDays) => {
    const currentDayData = JSON.parse(JSON.stringify(schedaData.giorni[selectedDay]));
    setSchedaData(prev => {
      const newData = { ...prev };
      targetDays.forEach(day => {
        newData.giorni[day] = currentDayData;
      });
      return newData;
    });
  };

  const resetDay = () => {
    if (!confirm('Sei sicuro di voler resettare questo giorno?')) return;
    setSchedaData(prev => {
      const newData = { ...prev };
      newData.giorni[selectedDay] = { esercizi: [] };
      return newData;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/alimentazione-allenamento')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
            Torna indietro
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Save size={18} />
            {saving ? 'Salvataggio...' : 'Salva Scheda'}
          </button>
        </div>

        {/* Client Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h1 className="text-2xl font-bold text-slate-100 mb-6">
            Scheda Allenamento - {clientName}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Obiettivo
              </label>
              <select
                value={schedaData.obiettivo}
                onChange={(e) => setSchedaData({ ...schedaData, obiettivo: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleziona obiettivo</option>
                {OBIETTIVI.map(obj => (
                  <option key={obj} value={obj}>{obj}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Livello
              </label>
              <select
                value={schedaData.livello}
                onChange={(e) => setSchedaData({ ...schedaData, livello: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleziona livello</option>
                {LIVELLI.map(liv => (
                  <option key={liv} value={liv}>{liv}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Durata (settimane)
              </label>
              <input
                type="number"
                value={schedaData.durataSettimane}
                onChange={(e) => setSchedaData({ ...schedaData, durataSettimane: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Es. 12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Note
              </label>
              <input
                type="text"
                value={schedaData.note}
                onChange={(e) => setSchedaData({ ...schedaData, note: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Note generali..."
              />
            </div>
          </div>
        </motion.div>

        {/* Day Selector */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex gap-2 overflow-x-auto">
            {GIORNI_SETTIMANA.map(giorno => (
              <button
                key={giorno}
                onClick={() => setSelectedDay(giorno)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedDay === giorno
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {giorno}
              </button>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                const others = GIORNI_SETTIMANA.filter(d => d !== selectedDay);
                if (confirm(`Duplicare ${selectedDay} su tutti gli altri giorni?`)) {
                  duplicateDayToOthers(others);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <Copy size={16} />
              Duplica su altri giorni
            </button>
            <button
              onClick={resetDay}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Reset giorno
            </button>
          </div>
        </div>

        {/* Exercises for Selected Day */}
        <div className="space-y-4">
          {schedaData.giorni[selectedDay].esercizi.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
              Nessun esercizio aggiunto per questo giorno
            </div>
          ) : (
            schedaData.giorni[selectedDay].esercizi.map((item, esercizioIndex) => {
              // Superset markers
              if (item.isMarker) {
                return (
                  <div key={esercizioIndex} className="flex items-center gap-4">
                    <div className={`flex-1 h-px ${item.type === 'superset-start' ? 'bg-purple-500' : 'bg-purple-500'}`}></div>
                    <div className={`px-4 py-2 rounded-lg font-semibold ${
                      item.type === 'superset-start' 
                        ? 'bg-purple-900/30 text-purple-300 border border-purple-600/50' 
                        : 'bg-purple-900/30 text-purple-300 border border-purple-600/50'
                    }`}>
                      {item.type === 'superset-start' ? '▼ INIZIO SUPERSERIE' : '▲ FINE SUPERSERIE'}
                    </div>
                    <div className={`flex-1 h-px ${item.type === 'superset-start' ? 'bg-purple-500' : 'bg-purple-500'}`}></div>
                    <button
                      onClick={() => removeEsercizio(esercizioIndex)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              }

              // Exercise item
              return (
                <motion.div
                  key={esercizioIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-100">{item.nome}</h3>
                        {item.videoUrl && (
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 border border-blue-500/50 text-blue-300 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
                          >
                            <Play size={14} />
                            Video
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="px-2 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded">
                          {item.attrezzo}
                        </span>
                        <span className="px-2 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded">
                          {item.gruppoMuscolare}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveEsercizioUp(esercizioIndex)}
                        disabled={esercizioIndex === 0}
                        className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button
                        onClick={() => moveEsercizioDown(esercizioIndex)}
                        disabled={esercizioIndex === schedaData.giorni[selectedDay].esercizi.length - 1}
                        className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={18} />
                      </button>
                      <button
                        onClick={() => removeEsercizio(esercizioIndex)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Serie</label>
                      <input
                        type="number"
                        value={item.serie || ''}
                        onChange={(e) => updateEsercizio(esercizioIndex, 'serie', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                        placeholder="Es. 3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Ripetizioni</label>
                      <input
                        type="text"
                        value={item.ripetizioni || ''}
                        onChange={(e) => updateEsercizio(esercizioIndex, 'ripetizioni', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                        placeholder="Es. 8-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Recupero (sec)</label>
                      <input
                        type="number"
                        value={item.recupero || ''}
                        onChange={(e) => updateEsercizio(esercizioIndex, 'recupero', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                        placeholder="Es. 60"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Note Esercizio</label>
                    <textarea
                      value={item.noteEsercizio || ''}
                      onChange={(e) => updateEsercizio(esercizioIndex, 'noteEsercizio', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      placeholder="Note tecniche, varianti..."
                    />
                  </div>

                  {/* Superset Controls */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => addSupersetMarker(esercizioIndex, 'superset-start')}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 rounded text-sm transition-colors"
                    >
                      + Inizio Superserie
                    </button>
                    <button
                      onClick={() => addSupersetMarker(esercizioIndex, 'superset-end')}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 rounded text-sm transition-colors"
                    >
                      + Fine Superserie
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowAddEsercizio(true)}
          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Aggiungi Esercizio
        </button>

        {/* Add Exercise Modal */}
        <AnimatePresence>
          {showAddEsercizio && (
            <AddEsercizioModal
              availableExercises={availableExercises}
              onAdd={(esercizio) => {
                addEsercizio(esercizio);
                setShowAddEsercizio(false);
              }}
              onCancel={() => setShowAddEsercizio(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Add Exercise Modal Component
const AddEsercizioModal = ({ availableExercises, onAdd, onCancel }) => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = availableExercises.filter(ex =>
    ex.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!selectedExercise) {
      alert('Seleziona un esercizio');
      return;
    }
    onAdd({
      ...selectedExercise,
      serie: '',
      ripetizioni: '',
      recupero: '',
      noteEsercizio: ''
    });
  };

  return (
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
        className="w-full max-w-2xl bg-slate-800 rounded-xl border border-slate-700 p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-100">Seleziona Esercizio</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-200">
            <X size={24} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Cerca esercizio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
        />

        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className={`w-full p-4 rounded-lg text-left transition-colors ${
                selectedExercise?.id === exercise.id
                  ? 'bg-blue-600 border-2 border-blue-400'
                  : 'bg-slate-700 border-2 border-transparent hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-slate-100 mb-1">{exercise.nome}</div>
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded">
                  {exercise.attrezzo}
                </span>
                <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded">
                  {exercise.gruppoMuscolare}
                </span>
                {exercise.videoUrl && (
                  <span className="px-2 py-0.5 bg-emerald-900/30 border border-emerald-600/30 text-emerald-300 rounded flex items-center gap-1">
                    <Play size={12} />
                    Video
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAdd}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
          >
            Aggiungi
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Annulla
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SchedaAllenamento;
