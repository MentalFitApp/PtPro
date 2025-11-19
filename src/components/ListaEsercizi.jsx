import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Save, Filter } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const ATTREZZI = [
  'Bilanciere',
  'Manubri',
  'Macchina',
  'Cavi',
  'Corpo libero',
  'Kettlebell',
  'Bande elastiche',
  'TRX',
  'Palla medica',
  'Swiss ball',
  'Sbarra per trazioni',
  'Panca'
];

const GRUPPI_MUSCOLARI = [
  'Petto',
  'Schiena',
  'Spalle',
  'Bicipiti',
  'Tricipiti',
  'Gambe',
  'Quadricipiti',
  'Femorali',
  'Polpacci',
  'Glutei',
  'Addominali',
  'Core',
  'Avambracci',
  'Trapezio'
];

const ListaEsercizi = ({ onBack }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttrezzo, setSelectedAttrezzo] = useState('');
  const [selectedGruppo, setSelectedGruppo] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    attrezzo: '',
    gruppoMuscolare: '',
    descrizione: '',
    videoUrl: ''
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const exercisesRef = collection(db, 'esercizi');
      const snapshot = await getDocs(exercisesRef);
      const exercisesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExercises(exercisesData);
    } catch (error) {
      console.error('Errore nel caricamento degli esercizi:', error);
    }
    setLoading(false);
  };

  const handleAddExercise = async () => {
    if (!formData.nome || !formData.attrezzo || !formData.gruppoMuscolare) {
      alert('Compila i campi obbligatori (nome, attrezzo, gruppo muscolare)');
      return;
    }

    try {
      const exercisesRef = collection(db, 'esercizi');
      await addDoc(exercisesRef, {
        ...formData,
        createdAt: new Date()
      });
      
      resetForm();
      loadExercises();
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'esercizio:', error);
      alert('Errore nell\'aggiunta dell\'esercizio');
    }
  };

  const handleUpdateExercise = async () => {
    if (!formData.nome || !formData.attrezzo || !formData.gruppoMuscolare) {
      alert('Compila i campi obbligatori (nome, attrezzo, gruppo muscolare)');
      return;
    }

    try {
      const exerciseRef = doc(db, 'esercizi', editingExercise.id);
      await updateDoc(exerciseRef, {
        ...formData,
        updatedAt: new Date()
      });
      
      resetForm();
      loadExercises();
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'esercizio:', error);
      alert('Errore nell\'aggiornamento dell\'esercizio');
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!confirm('Sei sicuro di voler eliminare questo esercizio?')) return;

    try {
      const exerciseRef = doc(db, 'esercizi', exerciseId);
      await deleteDoc(exerciseRef);
      loadExercises();
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'esercizio:', error);
      alert('Errore nell\'eliminazione dell\'esercizio');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      attrezzo: '',
      gruppoMuscolare: '',
      descrizione: '',
      videoUrl: ''
    });
    setIsAddingExercise(false);
    setEditingExercise(null);
  };

  const startEdit = (exercise) => {
    setEditingExercise(exercise);
    setFormData({
      nome: exercise.nome,
      attrezzo: exercise.attrezzo,
      gruppoMuscolare: exercise.gruppoMuscolare,
      descrizione: exercise.descrizione || '',
      videoUrl: exercise.videoUrl || ''
    });
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAttrezzo = !selectedAttrezzo || exercise.attrezzo === selectedAttrezzo;
    const matchesGruppo = !selectedGruppo || exercise.gruppoMuscolare === selectedGruppo;
    return matchesSearch && matchesAttrezzo && matchesGruppo;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-full overflow-x-hidden"
    >
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
                  {ATTREZZI.map(attrezzo => (
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
                  {GRUPPI_MUSCOLARI.map(gruppo => (
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
                  {ATTREZZI.map(attrezzo => (
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
                  {GRUPPI_MUSCOLARI.map(gruppo => (
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
                  URL Video (opzionale)
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={editingExercise ? handleUpdateExercise : handleAddExercise}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                {editingExercise ? 'Salva Modifiche' : 'Aggiungi'}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Attrezzo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Gruppo Muscolare</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Descrizione</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredExercises.map((exercise) => (
                  <tr key={exercise.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-200 font-medium">{exercise.nome}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded text-xs">
                        {exercise.attrezzo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded text-xs">
                        {exercise.gruppoMuscolare}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm max-w-xs truncate">
                      {exercise.descrizione || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(exercise)}
                          className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ListaEsercizi;
