import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ArrowLeft, Plus, Trash2, Copy, RotateCcw, X, ChevronUp, ChevronDown, Play, Download, Upload, History, FileText, Sparkles, Send, AlertTriangle, Edit3 } from 'lucide-react';
import { db } from '../../firebase';
import { getTenantDoc, getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { exportWorkoutCardToPDF } from '../../utils/pdfExport';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import RicercaEsercizi from '../../components/RicercaEsercizi';
import { notifyNewWorkout, notifyWorkoutUpdated } from '../../services/notificationService';

const OBIETTIVI = ['Forza', 'Massa', 'Definizione', 'Resistenza', 'Ricomposizione'];
const LIVELLI = ['Principiante', 'Intermedio', 'Avanzato'];
const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const NOMI_GIORNI_PRESET = ['Giorno A', 'Giorno B', 'Giorno C', 'Giorno D', 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest'];

const SchedaAllenamento = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  
  // Document title e keyboard shortcuts
  useDocumentTitle(clientName ? `Scheda Allenamento - ${clientName}` : 'Scheda Allenamento');
  useEscapeKey(() => {
    setShowAddEsercizio(false);
    setShowSavePresetModal(false);
    setShowImportPresetModal(false);
  });
  
  // View/Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [schedaExists, setSchedaExists] = useState(false);
  
  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Edit day name
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [editingDayName, setEditingDayName] = useState('');
  
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
  
  // Preset functionality
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showImportPresetModal, setShowImportPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [availablePresets, setAvailablePresets] = useState([]);
  
  // Copy previous card functionality
  const [showCopyPreviousModal, setShowCopyPreviousModal] = useState(false);
  const [previousCard, setPreviousCard] = useState(null);
  
  // History functionality
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [cardHistory, setCardHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      // Load client info
      const clientRef = getTenantDoc(db, 'clients', clientId);
      const clientSnap = await getDoc(clientRef);
      
      if (clientSnap.exists()) {
        setClientName(clientSnap.data().name || 'N/D');
      }

      // Load scheda allenamento if exists
      const schedaRef = getTenantDoc(db, 'schede_allenamento', clientId);
      const schedaSnap = await getDoc(schedaRef);
      
      if (schedaSnap.exists()) {
        setSchedaData(schedaSnap.data());
        setSchedaExists(true);
        setIsEditMode(false); // Default to view mode for existing schedas
      } else {
        setIsEditMode(true); // Default to edit mode for new schedas
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Determina se è una nuova scheda o un aggiornamento
      const isNewWorkout = !schedaExists;
      
      // Save current card
      const schedaRef = getTenantDoc(db, 'schede_allenamento', clientId);
      await setDoc(schedaRef, {
        ...schedaData,
        updatedAt: new Date()
      });

      // Save to history
      await saveToHistory();

      // Update client with expiry date and mark as delivered
      if (schedaData.durataSettimane) {
        const clientRef = getTenantDoc(db, 'clients', clientId);
        const scadenza = new Date();
        scadenza.setDate(scadenza.getDate() + (parseInt(schedaData.durataSettimane) * 7));
        
        await updateDoc(clientRef, {
          'schedaAllenamento.scadenza': scadenza,
          'schedaAllenamento.consegnata': true,
          'schedaAllenamento.dataConsegna': new Date()
        });
      } else {
        // Anche senza durata, marca come consegnata
        const clientRef = getTenantDoc(db, 'clients', clientId);
        await updateDoc(clientRef, {
          'schedaAllenamento.consegnata': true,
          'schedaAllenamento.dataConsegna': new Date()
        });
      }

      // Invia notifica push al cliente
      try {
        const clientDoc = await getDoc(getTenantDoc(db, 'clients', clientId));
        const clientName = clientDoc.data()?.name || 'Cliente';
        
        if (isNewWorkout) {
          await notifyNewWorkout(clientId, clientName, schedaData);
          console.log('✅ Notifica nuova scheda inviata');
        } else {
          await notifyWorkoutUpdated(clientId, clientName, schedaData);
          console.log('✅ Notifica scheda aggiornata inviata');
        }
      } catch (notifError) {
        console.error('Errore invio notifica:', notifError);
        // Non bloccare il salvataggio se la notifica fallisce
      }

      toast.success('Scheda salvata con successo!');
      
      // Switch to view mode after saving
      setSchedaExists(true);
      setIsEditMode(false);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast.error('Errore nel salvataggio della scheda');
    }
    setSaving(false);
  };

  const addEsercizio = (esercizio) => {
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.giorni[selectedDay].esercizi.push(esercizio);
      return newData;
    });
  };

  const removeEsercizio = (esercizioIndex) => {
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.giorni[selectedDay].esercizi.splice(esercizioIndex, 1);
      return newData;
    });
  };

  const updateEsercizio = (esercizioIndex, field, value) => {
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.giorni[selectedDay].esercizi[esercizioIndex][field] = value;
      return newData;
    });
  };

  const moveEsercizioUp = (esercizioIndex) => {
    if (esercizioIndex === 0) return;
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const esercizi = newData.giorni[selectedDay].esercizi;
      [esercizi[esercizioIndex - 1], esercizi[esercizioIndex]] = [esercizi[esercizioIndex], esercizi[esercizioIndex - 1]];
      return newData;
    });
  };

  const moveEsercizioDown = (esercizioIndex) => {
    const esercizi = schedaData.giorni[selectedDay].esercizi;
    if (esercizioIndex === esercizi.length - 1) return;
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const esercizi = newData.giorni[selectedDay].esercizi;
      [esercizi[esercizioIndex], esercizi[esercizioIndex + 1]] = [esercizi[esercizioIndex + 1], esercizi[esercizioIndex]];
      return newData;
    });
  };

  const addMarkerAtEnd = (type) => {
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.giorni[selectedDay].esercizi.push({
        type: type, // 'superset-start', 'superset-end', 'circuit-start', 'circuit-end'
        isMarker: true
      });
      return newData;
    });
  };

  const duplicateDayToOthers = (targetDays) => {
    const currentDayData = JSON.parse(JSON.stringify(schedaData.giorni[selectedDay]));
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      targetDays.forEach(day => {
        newData.giorni[day] = JSON.parse(JSON.stringify(currentDayData));
      });
      return newData;
    });
  };

  const resetDay = async () => {
    const confirmed = await confirmDelete(`tutti gli esercizi di ${selectedDay}`);
    if (!confirmed) return;
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.giorni[selectedDay] = { esercizi: [], nomePersonalizzato: newData.giorni[selectedDay]?.nomePersonalizzato };
      return newData;
    });
    toast.success(`${selectedDay} resettato`);
  };

  // Delete scheda
  const handleDeleteScheda = async () => {
    setDeleting(true);
    try {
      const schedaRef = getTenantDoc(db, 'schede_allenamento', clientId);
      await deleteDoc(schedaRef);
      
      // Aggiorna il cliente per rimuovere il flag di consegna
      const clientRef = getTenantDoc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        'schedaAllenamento.consegnata': false,
        'schedaAllenamento.scadenza': null,
        'schedaAllenamento.dataConsegna': null
      });
      
      toast.success('Scheda eliminata con successo!');
      setShowDeleteModal(false);
      navigate('/alimentazione-allenamento');
    } catch (error) {
      console.error('Errore eliminazione scheda:', error);
      toast.error('Errore nell\'eliminazione della scheda');
    }
    setDeleting(false);
  };

  // Send to client (separate from save)
  const handleSendToClient = async () => {
    // Validazione
    if (!schedaData.obiettivo) {
      toast.warning('Seleziona un obiettivo prima di inviare la scheda');
      return;
    }
    
    // Controlla che ci sia almeno un esercizio in un giorno
    const hasContent = Object.values(schedaData.giorni).some(giorno => 
      giorno.esercizi && giorno.esercizi.length > 0
    );
    
    if (!hasContent) {
      toast.warning('Aggiungi almeno un esercizio prima di inviare la scheda');
      return;
    }
    
    if (!confirm('🚀 Confermi di voler inviare questa scheda al cliente? Sarà visibile nella sua area.')) {
      return;
    }
    
    setSaving(true);
    try {
      // Save current card
      const schedaRef = getTenantDoc(db, 'schede_allenamento', clientId);
      await setDoc(schedaRef, {
        ...schedaData,
        updatedAt: new Date(),
        sentAt: new Date()
      });

      // Save to history
      await saveToHistory();

      // Update client with expiry date and mark as delivered
      const clientRef = getTenantDoc(db, 'clients', clientId);
      if (schedaData.durataSettimane) {
        const scadenza = new Date();
        scadenza.setDate(scadenza.getDate() + (parseInt(schedaData.durataSettimane) * 7));
        
        await updateDoc(clientRef, {
          'schedaAllenamento.scadenza': scadenza,
          'schedaAllenamento.consegnata': true,
          'schedaAllenamento.dataConsegna': new Date()
        });
      } else {
        await updateDoc(clientRef, {
          'schedaAllenamento.consegnata': true,
          'schedaAllenamento.dataConsegna': new Date()
        });
      }

      toast.success('Scheda inviata con successo al cliente!');
      setSchedaExists(true);
      setIsEditMode(false);
    } catch (error) {
      console.error('Errore invio scheda:', error);
      toast.error('Errore nell\'invio della scheda');
    }
    setSaving(false);
  };

  // Rename day
  const renameDay = (dayKey, newName) => {
    if (!newName.trim()) return;
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.giorni[dayKey]) newData.giorni[dayKey] = { esercizi: [] };
      newData.giorni[dayKey].nomePersonalizzato = newName.trim();
      return newData;
    });
    setEditingDayIndex(null);
    setEditingDayName('');
  };

  const startEditingDay = (dayKey) => {
    setEditingDayIndex(dayKey);
    setEditingDayName(schedaData.giorni[dayKey]?.nomePersonalizzato || dayKey);
  };

  // PDF Export
  const handleExportPDF = () => {
    exportWorkoutCardToPDF(schedaData, clientName);
  };

  // Preset Management - Multi-tenant
  const loadPresets = async () => {
    try {
      const presetsRef = getTenantCollection(db, 'preset_allenamento');
      const snapshot = await getDocs(presetsRef);
      const presets = [];
      snapshot.forEach(doc => {
        presets.push({ id: doc.id, ...doc.data() });
      });
      setAvailablePresets(presets);
    } catch (error) {
      console.error('Errore caricamento preset:', error);
    }
  };

  const handleSaveAsPreset = async () => {
    if (!presetName.trim()) {
      toast.warning('Inserisci un nome per il preset');
      return;
    }
    
    try {
      const presetsRef = getTenantCollection(db, 'preset_allenamento');
      await addDoc(presetsRef, {
        name: presetName,
        data: schedaData,
        createdAt: new Date()
      });
      toast.success('Preset salvato con successo!');
      setShowSavePresetModal(false);
      setPresetName('');
    } catch (error) {
      console.error('Errore salvataggio preset:', error);
      toast.error('Errore nel salvataggio del preset');
    }
  };

  const handleImportPreset = (preset) => {
    if (!confirm(`Importare il preset "${preset.name}"? Questo sovrascriverà tutti i dati correnti.`)) return;
    
    setSchedaData(prev => ({
      ...prev,
      ...preset.data
    }));
    setShowImportPresetModal(false);
  };

  // Copy Previous Card
  const loadPreviousCard = async () => {
    try {
      const historyRef = collection(db, 'schede_allenamento_storico', clientId, 'history');
      const q = query(historyRef, orderBy('savedAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const prevCard = snapshot.docs[0].data();
        setPreviousCard(prevCard);
      } else {
        setPreviousCard(null);
      }
    } catch (error) {
      console.error('Errore caricamento scheda precedente:', error);
    }
  };

  const handleCopyPrevious = () => {
    if (!previousCard) {
      toast.info('Nessuna scheda precedente trovata');
      return;
    }
    
    if (!confirm('Copiare la scheda precedente? Questo sovrascriverà tutti i dati correnti.')) return;
    
    setSchedaData(prev => ({
      ...prev,
      ...previousCard
    }));
    setShowCopyPreviousModal(false);
  };

  // Card History
  const loadCardHistory = async () => {
    try {
      const historyRef = collection(db, 'schede_allenamento_storico', clientId, 'history');
      const q = query(historyRef, orderBy('savedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const history = [];
      snapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });
      setCardHistory(history);
    } catch (error) {
      console.error('Errore caricamento storico:', error);
    }
  };

  const saveToHistory = async () => {
    try {
      const historyRef = collection(db, 'schede_allenamento_storico', clientId, 'history');
      await addDoc(historyRef, {
        ...schedaData,
        savedAt: new Date()
      });
    } catch (error) {
      console.error('Errore salvataggio storico:', error);
    }
  };

  const viewHistoryCard = (historyCard) => {
    if (!confirm('Visualizzare questa scheda storica? I dati correnti verranno sostituiti (salva prima se necessario).')) return;
    
    setSchedaData(prev => ({
      ...prev,
      ...historyCard
    }));
    setShowHistoryModal(false);
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
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/alimentazione-allenamento')}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
              Torna indietro
            </button>
            <div className="flex gap-2">
              {schedaExists && !isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Sparkles size={18} />
                  Modifica Scheda
                </button>
              )}
              {isEditMode && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Save size={18} />
                    {saving ? 'Salvataggio...' : 'Salva Bozza'}
                  </button>
                  <button
                    onClick={handleSendToClient}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Send size={18} />
                    {saving ? 'Invio...' : 'Invia al Cliente'}
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
            >
              <Download size={16} />
              Scarica PDF
            </button>
            {isEditMode && (
              <>
                <button
                  onClick={() => {
                    setShowSavePresetModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  <FileText size={16} />
                  Salva come Preset
                </button>
                <button
                  onClick={() => {
                    loadPresets();
                    setShowImportPresetModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Upload size={16} />
                  Importa Preset
                </button>
                <button
                  onClick={() => {
                    loadPreviousCard();
                    setShowCopyPreviousModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Copy size={16} />
                  Copia Precedente
                </button>
                {schedaExists && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Elimina Scheda
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => {
                loadCardHistory();
                setShowHistoryModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
            >
              <History size={16} />
              Storico Schede
            </button>
          </div>
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
                disabled={!isEditMode}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={!isEditMode}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={!isEditMode}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={!isEditMode}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Note generali..."
              />
            </div>
          </div>
        </motion.div>

        {/* Day Selector */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {GIORNI_SETTIMANA.map(giorno => {
              const nomeVisualizzato = schedaData.giorni[giorno]?.nomePersonalizzato || giorno;
              const hasExercises = schedaData.giorni[giorno]?.esercizi?.length > 0;
              
              return (
                <div key={giorno} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setSelectedDay(giorno)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedDay === giorno
                        ? 'bg-blue-600 text-white'
                        : hasExercises
                          ? 'bg-emerald-700/50 text-emerald-200 hover:bg-emerald-600/50'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {nomeVisualizzato}
                  </button>
                  {isEditMode && selectedDay === giorno && (
                    <button
                      onClick={() => startEditingDay(giorno)}
                      className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                      title="Modifica nome"
                    >
                      <Edit3 size={12} />
                      rinomina
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Edit Day Name */}
          {isEditMode && editingDayIndex && (
            <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-400">Rinomina {editingDayIndex}:</span>
                <select
                  value={editingDayName}
                  onChange={(e) => setEditingDayName(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-1.5 text-sm"
                >
                  {NOMI_GIORNI_PRESET.map(nome => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={editingDayName}
                  onChange={(e) => setEditingDayName(e.target.value)}
                  placeholder="O scrivi un nome..."
                  className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-1.5 text-sm w-40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameDay(editingDayIndex, editingDayName);
                    if (e.key === 'Escape') { setEditingDayIndex(null); setEditingDayName(''); }
                  }}
                />
                <button
                  onClick={() => renameDay(editingDayIndex, editingDayName)}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  title="Conferma"
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={() => { setEditingDayIndex(null); setEditingDayName(''); }}
                  className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
                  title="Annulla"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          
          {isEditMode && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={async () => {
                  const others = GIORNI_SETTIMANA.filter(d => d !== selectedDay);
                  const confirmed = await confirmDelete(`e sovrascrivere tutti gli altri giorni con ${selectedDay}`);
                  if (confirmed) {
                    duplicateDayToOthers(others);
                    toast.success('Giorno duplicato su tutti gli altri');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Copy size={16} />
                Duplica su altri giorni
              </button>
              <button
                onClick={resetDay}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white preserve-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset giorno
              </button>
            </div>
          )}
        </div>

        {/* Exercises for Selected Day */}
        <div className="space-y-4">
          {schedaData.giorni[selectedDay].esercizi.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
              Nessun esercizio aggiunto per questo giorno
            </div>
          ) : (
            schedaData.giorni[selectedDay].esercizi.map((item, esercizioIndex) => {
              if (item.isMarker) {
                const isCircuit = item.type.includes('circuit');
                const isStart = item.type.includes('start');
                const colorClass = isCircuit ? 'bg-cyan-500' : 'bg-purple-500';
                const bgClass = isCircuit ? 'bg-cyan-900/30 text-cyan-300 border-cyan-600/50' : 'bg-purple-900/30 text-purple-300 border-purple-600/50';
                const label = isCircuit 
                  ? (isStart ? '▼ INIZIO CIRCUITO' : '▲ FINE CIRCUITO')
                  : (isStart ? '▼ INIZIO SUPERSERIE' : '▲ FINE SUPERSERIE');
                
                return (
                  <div key={esercizioIndex} className="flex items-center gap-2">
                    <div className={`flex-1 h-px ${colorClass}`}></div>
                    <div className={`px-4 py-2 rounded-lg font-semibold border ${bgClass}`}>
                      {label}
                    </div>
                    <div className={`flex-1 h-px ${colorClass}`}></div>
                    {isEditMode && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveEsercizioUp(esercizioIndex)}
                          disabled={esercizioIndex === 0}
                          className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Sposta su"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => moveEsercizioDown(esercizioIndex)}
                          disabled={esercizioIndex === schedaData.giorni[selectedDay].esercizi.length - 1}
                          className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Sposta giù"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          onClick={() => removeEsercizio(esercizioIndex)}
                          className="p-1.5 text-red-400 hover:text-red-300"
                          title="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
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
                  <div className="flex items-start gap-4 mb-4">
                    {/* GIF Animazione Esercizio */}
                    {item.gifUrl && (
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                        <img
                          src={item.gifUrl}
                          alt={item.nome}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-100">{item.nome}</h3>
                        {item.gifUrl && (
                          <a
                            href={item.gifUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs hover:bg-emerald-600/30 transition-colors"
                          >
                            <Play size={12} />
                            GIF
                          </a>
                        )}
                        {item.videoUrl && !item.gifUrl && (
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
                        {item.attrezzo && (
                          <span className="px-2 py-1 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded">
                            {item.attrezzo}
                          </span>
                        )}
                        {item.gruppoMuscolare && (
                          <span className="px-2 py-1 bg-purple-900/30 border border-purple-600/30 text-purple-300 rounded">
                            {item.gruppoMuscolare}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isEditMode && (
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
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Serie</label>
                      <input
                        type="number"
                        value={item.serie || ''}
                        onChange={(e) => updateEsercizio(esercizioIndex, 'serie', e.target.value)}
                        disabled={!isEditMode}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Es. 3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Ripetizioni</label>
                      <input
                        type="text"
                        value={item.ripetizioni || ''}
                        onChange={(e) => updateEsercizio(esercizioIndex, 'ripetizioni', e.target.value)}
                        disabled={!isEditMode}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Es. 8-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Recupero (sec)</label>
                      <input
                        type="number"
                        value={item.recupero || ''}
                        onChange={(e) => updateEsercizio(esercizioIndex, 'recupero', e.target.value)}
                        disabled={!isEditMode}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Es. 60"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Note Esercizio</label>
                    <textarea
                      value={item.noteEsercizio || ''}
                      onChange={(e) => updateEsercizio(esercizioIndex, 'noteEsercizio', e.target.value)}
                      disabled={!isEditMode}
                      rows="2"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Note tecniche, varianti..."
                    />
                  </div>


                </motion.div>
              );
            })
          )}
        </div>

        {/* Add Exercise and Markers Buttons */}
        {isEditMode && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <button
                onClick={() => setShowAddEsercizio(true)}
                className="md:col-span-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Plus size={20} />
                Aggiungi Esercizio
              </button>
              
              <button
                onClick={() => addMarkerAtEnd('superset-start')}
                className="px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border-2 border-purple-500/50 text-purple-300 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-sm"
              >
                Inizio Superserie
              </button>
              
              <button
                onClick={() => addMarkerAtEnd('superset-end')}
                className="px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border-2 border-purple-500/50 text-purple-300 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-sm"
              >
                Fine Superserie
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => addMarkerAtEnd('circuit-start')}
                className="px-4 py-3 bg-cyan-600/20 hover:bg-cyan-600/30 border-2 border-cyan-500/50 text-cyan-300 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
              >
                Inizio Circuito
              </button>
              
              <button
                onClick={() => addMarkerAtEnd('circuit-end')}
                className="px-4 py-3 bg-cyan-600/20 hover:bg-cyan-600/30 border-2 border-cyan-500/50 text-cyan-300 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
              >
                Fine Circuito
              </button>
            </div>
          </> 
        )}

        {/* Add Exercise Modal */}
        <AnimatePresence>
          {showAddEsercizio && (
            <RicercaEsercizi
              toast={toast}
              onAddExercise={(esercizio) => {
                // Aggiungi l'esercizio ma NON chiudere il modal
                addEsercizio(esercizio);
                toast.success(`"${esercizio.nome}" aggiunto!`);
              }}
              onCancel={() => setShowAddEsercizio(false)}
            />
          )}
        </AnimatePresence>

        {/* Save Preset Modal */}
        <AnimatePresence>
          {showSavePresetModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowSavePresetModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-slate-100 mb-4">Salva come Preset</h3>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Nome del preset (es. Massa Muscolare)"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveAsPreset}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => {
                      setShowSavePresetModal(false);
                      setPresetName('');
                    }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Preset Modal */}
        <AnimatePresence>
          {showImportPresetModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowImportPresetModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-slate-100 mb-4">Importa Preset</h3>
                {availablePresets.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nessun preset disponibile</p>
                ) : (
                  <div className="space-y-3">
                    {availablePresets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleImportPreset(preset)}
                        className="w-full p-4 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
                      >
                        <div className="font-bold text-slate-100">{preset.name}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          Creato: {preset.createdAt?.toDate?.()?.toLocaleDateString('it-IT') || 'N/D'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowImportPresetModal(false)}
                  className="w-full mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Chiudi
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Copy Previous Card Modal */}
        <AnimatePresence>
          {showCopyPreviousModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCopyPreviousModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-slate-100 mb-4">Copia Scheda Precedente</h3>
                {previousCard ? (
                  <div className="mb-4">
                    <p className="text-slate-300 mb-2">Scheda trovata:</p>
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <div className="text-sm text-slate-400">
                        Obiettivo: {previousCard.obiettivo || 'N/D'}
                      </div>
                      <div className="text-sm text-slate-400">
                        Livello: {previousCard.livello || 'N/D'}
                      </div>
                      <div className="text-sm text-slate-400">
                        Durata: {previousCard.durataSettimane || 'N/D'} settimane
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 mb-4">Nessuna scheda precedente trovata</p>
                )}
                <div className="flex gap-3">
                  {previousCard && (
                    <button
                      onClick={handleCopyPrevious}
                      className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                    >
                      Copia
                    </button>
                  )}
                  <button
                    onClick={() => setShowCopyPreviousModal(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Chiudi
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistoryModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowHistoryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-slate-100 mb-4">Storico Schede</h3>
                {cardHistory.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nessuna scheda nello storico</p>
                ) : (
                  <div className="space-y-3">
                    {cardHistory.map((card, idx) => (
                      <button
                        key={card.id}
                        onClick={() => viewHistoryCard(card)}
                        className="w-full p-4 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-100">Scheda #{cardHistory.length - idx}</div>
                            <div className="text-sm text-slate-400 mt-1">
                              Salvata: {card.savedAt?.toDate?.()?.toLocaleDateString('it-IT') || 'N/D'}
                            </div>
                            <div className="text-sm text-slate-400">
                              Obiettivo: {card.obiettivo || 'N/D'} | Livello: {card.livello || 'N/D'}
                            </div>
                          </div>
                          <span className="text-blue-400 text-sm">Visualizza</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Chiudi
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-red-500/30 rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">Elimina Scheda</h3>
                    <p className="text-sm text-slate-400">Questa azione è irreversibile</p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <p className="text-slate-200 text-sm mb-2">
                    Stai per eliminare definitivamente questa scheda allenamento per <strong>{clientName}</strong>.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 ml-4 list-disc">
                    <li>La scheda non sarà più visibile al cliente</li>
                    <li>Tutti i dati verranno cancellati</li>
                    <li>Lo storico delle versioni precedenti rimarrà conservato</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteScheda}
                    disabled={deleting}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white preserve-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Eliminazione...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Elimina Definitivamente
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="px-4 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SchedaAllenamento;
