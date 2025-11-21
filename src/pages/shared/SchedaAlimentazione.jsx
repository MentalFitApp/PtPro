import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Copy, RotateCcw, X, Download, Upload, History, FileText } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { exportNutritionCardToPDF } from '../../utils/pdfExport';

const OBIETTIVI = ['Definizione', 'Massa', 'Mantenimento', 'Dimagrimento', 'Sportivo'];
const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const PASTI = ['Colazione', 'Spuntino', 'Pranzo', 'Spuntino', 'Cena'];

const SchedaAlimentazione = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  
  const [schedaData, setSchedaData] = useState({
    obiettivo: '',
    note: '',
    durataSettimane: '',
    integrazione: '',
    giorni: GIORNI_SETTIMANA.reduce((acc, giorno) => {
      acc[giorno] = {
        pasti: PASTI.map(nome => ({
          nome,
          alimenti: []
        }))
      };
      return acc;
    }, {})
  });

  const [selectedDay, setSelectedDay] = useState('Lunedì');
  const [showAddAlimento, setShowAddAlimento] = useState({ pastoIndex: null });
  
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
    loadClientAndScheda();
  }, [clientId]);

  const loadClientAndScheda = async () => {
    try {
      // Load client info
      const clientRef = doc(db, 'clients', clientId);
      const clientSnap = await getDoc(clientRef);
      
      if (clientSnap.exists()) {
        setClientName(clientSnap.data().name || 'N/D');
        
        // Load scheda alimentazione if exists
        const schedaRef = doc(db, 'schede_alimentazione', clientId);
        const schedaSnap = await getDoc(schedaRef);
        
        if (schedaSnap.exists()) {
          setSchedaData(schedaSnap.data());
        }
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save current card
      const schedaRef = doc(db, 'schede_alimentazione', clientId);
      await setDoc(schedaRef, {
        ...schedaData,
        updatedAt: new Date()
      });

      // Save to history
      await saveToHistory();

      // Update client with expiry date
      if (schedaData.durataSettimane) {
        const clientRef = doc(db, 'clients', clientId);
        const scadenza = new Date();
        scadenza.setDate(scadenza.getDate() + (parseInt(schedaData.durataSettimane) * 7));
        
        await updateDoc(clientRef, {
          'schedaAlimentazione.scadenza': scadenza
        });
      }

      alert('Scheda salvata con successo!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio della scheda');
    }
    setSaving(false);
  };

  const addAlimento = (pastoIndex, alimento) => {
    setSchedaData(prev => {
      const newData = { ...prev };
      newData.giorni[selectedDay].pasti[pastoIndex].alimenti.push(alimento);
      return newData;
    });
  };

  const removeAlimento = (pastoIndex, alimentoIndex) => {
    setSchedaData(prev => {
      const newData = { ...prev };
      newData.giorni[selectedDay].pasti[pastoIndex].alimenti.splice(alimentoIndex, 1);
      return newData;
    });
  };

  const movePastoUp = (pastoIndex) => {
    if (pastoIndex === 0) return;
    setSchedaData(prev => {
      const newData = { ...prev };
      const pasti = newData.giorni[selectedDay].pasti;
      [pasti[pastoIndex - 1], pasti[pastoIndex]] = [pasti[pastoIndex], pasti[pastoIndex - 1]];
      return newData;
    });
  };

  const movePastoDown = (pastoIndex) => {
    const pasti = schedaData.giorni[selectedDay].pasti;
    if (pastoIndex === pasti.length - 1) return;
    setSchedaData(prev => {
      const newData = { ...prev };
      const pasti = newData.giorni[selectedDay].pasti;
      [pasti[pastoIndex], pasti[pastoIndex + 1]] = [pasti[pastoIndex + 1], pasti[pastoIndex]];
      return newData;
    });
  };

  const duplicatePasto = (pastoIndex) => {
    setSchedaData(prev => {
      const newData = { ...prev };
      const pasto = JSON.parse(JSON.stringify(newData.giorni[selectedDay].pasti[pastoIndex]));
      newData.giorni[selectedDay].pasti.splice(pastoIndex + 1, 0, pasto);
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
      newData.giorni[selectedDay] = {
        pasti: PASTI.map(nome => ({
          nome,
          alimenti: []
        }))
      };
      return newData;
    });
  };

  const calculateDayTotals = () => {
    const pasti = schedaData.giorni[selectedDay].pasti;
    let totals = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0, quantita: 0 };
    
    pasti.forEach(pasto => {
      pasto.alimenti.forEach(alimento => {
        const factor = alimento.quantita / 100;
        totals.kcal += (alimento.kcal || 0) * factor;
        totals.proteine += (alimento.proteine || 0) * factor;
        totals.carboidrati += (alimento.carboidrati || 0) * factor;
        totals.grassi += (alimento.grassi || 0) * factor;
        totals.quantita += alimento.quantita || 0;
      });
    });

    return totals;
  };

  const calculatePastoTotals = (pasto) => {
    let totals = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
    
    pasto.alimenti.forEach(alimento => {
      const factor = alimento.quantita / 100;
      totals.kcal += (alimento.kcal || 0) * factor;
      totals.proteine += (alimento.proteine || 0) * factor;
      totals.carboidrati += (alimento.carboidrati || 0) * factor;
      totals.grassi += (alimento.grassi || 0) * factor;
    });

    return totals;
  };

  // PDF Export
  const handleExportPDF = () => {
    exportNutritionCardToPDF(schedaData, clientName);
  };

  // Preset Management
  const loadPresets = async () => {
    try {
      const presetsRef = collection(db, 'preset_alimentazione');
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
      alert('Inserisci un nome per il preset');
      return;
    }
    
    try {
      const presetsRef = collection(db, 'preset_alimentazione');
      await addDoc(presetsRef, {
        name: presetName,
        data: schedaData,
        createdAt: new Date()
      });
      alert('Preset salvato con successo!');
      setShowSavePresetModal(false);
      setPresetName('');
    } catch (error) {
      console.error('Errore salvataggio preset:', error);
      alert('Errore nel salvataggio del preset');
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
      const historyRef = collection(db, 'schede_alimentazione_storico', clientId, 'history');
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
      alert('Nessuna scheda precedente trovata');
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
      const historyRef = collection(db, 'schede_alimentazione_storico', clientId, 'history');
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
      const historyRef = collection(db, 'schede_alimentazione_storico', clientId, 'history');
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const dayTotals = calculateDayTotals();

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
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Save size={18} />
              {saving ? 'Salvataggio...' : 'Salva Scheda'}
            </button>
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
            Scheda Alimentazione - {clientName}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Obiettivo
              </label>
              <select
                value={schedaData.obiettivo}
                onChange={(e) => setSchedaData({ ...schedaData, obiettivo: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Seleziona obiettivo</option>
                {OBIETTIVI.map(obj => (
                  <option key={obj} value={obj}>{obj}</option>
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
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                placeholder="Es. 12"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Note
              </label>
              <input
                type="text"
                value={schedaData.note}
                onChange={(e) => setSchedaData({ ...schedaData, note: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
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
                    ? 'bg-emerald-600 text-white'
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

        {/* Meals for Selected Day */}
        <div className="space-y-4">
          {schedaData.giorni[selectedDay].pasti.map((pasto, pastoIndex) => {
            const pastoTotals = calculatePastoTotals(pasto);
            
            return (
              <motion.div
                key={pastoIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-100">{pasto.nome}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => movePastoUp(pastoIndex)}
                      disabled={pastoIndex === 0}
                      className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      onClick={() => movePastoDown(pastoIndex)}
                      disabled={pastoIndex === schedaData.giorni[selectedDay].pasti.length - 1}
                      className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown size={18} />
                    </button>
                    <button
                      onClick={() => duplicatePasto(pastoIndex)}
                      className="p-2 text-blue-400 hover:text-blue-300"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                {/* Alimenti List */}
                {pasto.alimenti.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-300">Alimento</th>
                          <th className="px-3 py-2 text-left text-slate-300">Quantità (g)</th>
                          <th className="px-3 py-2 text-left text-slate-300">Kcal</th>
                          <th className="px-3 py-2 text-left text-slate-300">Proteine</th>
                          <th className="px-3 py-2 text-left text-slate-300">Carb.</th>
                          <th className="px-3 py-2 text-left text-slate-300">Grassi</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {pasto.alimenti.map((alimento, alimentoIndex) => {
                          const factor = alimento.quantita / 100;
                          return (
                            <tr key={alimentoIndex}>
                              <td className="px-3 py-2 text-slate-200">{alimento.nome}</td>
                              <td className="px-3 py-2 text-slate-300">{alimento.quantita}g</td>
                              <td className="px-3 py-2 text-slate-300">{((alimento.kcal || 0) * factor).toFixed(0)}</td>
                              <td className="px-3 py-2 text-slate-300">{((alimento.proteine || 0) * factor).toFixed(1)}g</td>
                              <td className="px-3 py-2 text-slate-300">{((alimento.carboidrati || 0) * factor).toFixed(1)}g</td>
                              <td className="px-3 py-2 text-slate-300">{((alimento.grassi || 0) * factor).toFixed(1)}g</td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => removeAlimento(pastoIndex, alimentoIndex)}
                                  className="p-1 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-800/50 font-semibold">
                          <td className="px-3 py-2 text-slate-200">Totale {pasto.nome}</td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2 text-emerald-400">{pastoTotals.kcal.toFixed(0)}</td>
                          <td className="px-3 py-2 text-emerald-400">{pastoTotals.proteine.toFixed(1)}g</td>
                          <td className="px-3 py-2 text-emerald-400">{pastoTotals.carboidrati.toFixed(1)}g</td>
                          <td className="px-3 py-2 text-emerald-400">{pastoTotals.grassi.toFixed(1)}g</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={() => setShowAddAlimento({ pastoIndex })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  Aggiungi Alimento
                </button>

                {/* Add Alimento Form */}
                <AnimatePresence>
                  {showAddAlimento.pastoIndex === pastoIndex && (
                    <AddAlimentoForm
                      onAdd={(alimento) => {
                        addAlimento(pastoIndex, alimento);
                        setShowAddAlimento({ pastoIndex: null });
                      }}
                      onCancel={() => setShowAddAlimento({ pastoIndex: null })}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Daily Totals */}
        <div className="bg-emerald-900/20 border border-emerald-600/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-emerald-300 mb-4">Totali Giornalieri - {selectedDay}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-slate-400">Quantità Totale</div>
              <div className="text-2xl font-bold text-emerald-300">{dayTotals.quantita.toFixed(0)}g</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Kcal</div>
              <div className="text-2xl font-bold text-emerald-300">{dayTotals.kcal.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Proteine</div>
              <div className="text-2xl font-bold text-emerald-300">{dayTotals.proteine.toFixed(1)}g</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Carboidrati</div>
              <div className="text-2xl font-bold text-emerald-300">{dayTotals.carboidrati.toFixed(1)}g</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Grassi</div>
              <div className="text-2xl font-bold text-emerald-300">{dayTotals.grassi.toFixed(1)}g</div>
            </div>
          </div>
        </div>

        {/* Integrazione Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Integrazione</h3>
          <textarea
            value={schedaData.integrazione}
            onChange={(e) => setSchedaData({ ...schedaData, integrazione: e.target.value })}
            rows="5"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            placeholder="Tips sull'integrazione, consigli, note..."
          />
        </div>

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
                  placeholder="Nome del preset (es. Definizione)"
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
                              Obiettivo: {card.obiettivo || 'N/D'}
                            </div>
                          </div>
                          <span className="text-emerald-400 text-sm">Visualizza</span>
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
      </div>
    </div>
  );
};

// Add Alimento Form Component
const AddAlimentoForm = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    nome: '',
    quantita: '',
    kcal: '',
    proteine: '',
    carboidrati: '',
    grassi: ''
  });

  const handleSubmit = () => {
    if (!formData.nome || !formData.quantita) {
      alert('Inserisci almeno nome e quantità');
      return;
    }
    onAdd({
      ...formData,
      quantita: parseFloat(formData.quantita),
      kcal: parseFloat(formData.kcal) || 0,
      proteine: parseFloat(formData.proteine) || 0,
      carboidrati: parseFloat(formData.carboidrati) || 0,
      grassi: parseFloat(formData.grassi) || 0
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-100">Aggiungi Alimento</h4>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200">
          <X size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Nome alimento"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          placeholder="Quantità (g)"
          value={formData.quantita}
          onChange={(e) => setFormData({ ...formData, quantita: e.target.value })}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          placeholder="Kcal (per 100g)"
          value={formData.kcal}
          onChange={(e) => setFormData({ ...formData, kcal: e.target.value })}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          placeholder="Proteine (g)"
          value={formData.proteine}
          onChange={(e) => setFormData({ ...formData, proteine: e.target.value })}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          placeholder="Carboidrati (g)"
          value={formData.carboidrati}
          onChange={(e) => setFormData({ ...formData, carboidrati: e.target.value })}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          placeholder="Grassi (g)"
          value={formData.grassi}
          onChange={(e) => setFormData({ ...formData, grassi: e.target.value })}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>
      
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition-colors"
        >
          Aggiungi
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
        >
          Annulla
        </button>
      </div>
    </motion.div>
  );
};

export default SchedaAlimentazione;
