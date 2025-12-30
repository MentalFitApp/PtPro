import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Copy, RotateCcw, X, Download, Upload, History, FileText, Sparkles, Send, AlertTriangle, Edit3 } from 'lucide-react';
import { db } from '../../firebase';
import { getTenantDoc, getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { exportNutritionCardToPDF } from '../../utils/pdfExport';
import AINutritionAssistant from '../../components/AINutritionAssistant';
import { convertToGrams, inferUnitFromName } from '../../utils/nutritionUnits';
import { saveFeedback, saveDoNotShowPreference, shouldShowFeedbackPopup } from '../../services/aiFeedbackService';
import { auth } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';

const OBIETTIVI = ['Definizione', 'Massa', 'Mantenimento', 'Dimagrimento', 'Sportivo'];
const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const PASTI = ['Colazione', 'Spuntino', 'Pranzo', 'Spuntino', 'Cena'];
const TIPI_PASTO = ['Colazione', 'Spuntino Mattina', 'Pranzo', 'Spuntino Pomeriggio', 'Merenda', 'Cena', 'Pre-Workout', 'Post-Workout', 'Spuntino Serale'];

const SchedaAlimentazione = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientData, setClientData] = useState(null);
  const [anamnesisData, setAnamnesisData] = useState(null);
  
  // Document title e keyboard shortcuts
  useDocumentTitle(clientName ? `Scheda Alimentare - ${clientName}` : 'Scheda Alimentare');
  useEscapeKey(() => {
    setShowAddAlimento({ pastoIndex: null });
    setShowSavePresetModal(false);
    setShowImportPresetModal(false);
  });
  
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
  
  // AI Feedback tracking
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Duplicate day modal
  const [showDuplicateDayModal, setShowDuplicateDayModal] = useState(false);
  const [selectedDaysForDuplication, setSelectedDaysForDuplication] = useState([]);
  
  // Edit mode (view vs edit)
  const [isEditMode, setIsEditMode] = useState(false);
  const [schedaExists, setSchedaExists] = useState(false);
  
  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Edit pasto name
  const [editingPastoIndex, setEditingPastoIndex] = useState(null);
  const [editingPastoName, setEditingPastoName] = useState('');

  useEffect(() => {
    loadClientAndScheda();
  }, [clientId]);

  // Carica dati salvati automaticamente da localStorage
  useEffect(() => {
    if (!clientId) return;
    
    const autosavedKey = `scheda_alimentazione_draft_${clientId}`;
    const savedDraft = localStorage.getItem(autosavedKey);
    
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        const savedTime = new Date(parsedDraft.savedAt);
        const now = new Date();
        const hoursSinceSave = (now - savedTime) / (1000 * 60 * 60);
        
        // Mostra prompt solo se ci sono dati salvati nelle ultime 24 ore
        if (hoursSinceSave < 24 && !schedaExists) {
          const shouldRestore = confirm(
            `Trovata bozza salvata automaticamente il ${savedTime.toLocaleString('it-IT')}. Vuoi ripristinarla?`
          );
          
          if (shouldRestore) {
            setSchedaData(parsedDraft.data);
          } else {
            // Rimuovi la bozza se l'utente non vuole ripristinarla
            localStorage.removeItem(autosavedKey);
          }
        }
      } catch (error) {
        console.error('Errore ripristino bozza:', error);
      }
    }
  }, [clientId, schedaExists]);

  // Autosalvataggio in localStorage ogni volta che schedaData cambia
  useEffect(() => {
    if (!clientId || !isEditMode) return;
    
    // Debounce: salva solo dopo 2 secondi dall'ultima modifica
    const timeoutId = setTimeout(() => {
      const autosavedKey = `scheda_alimentazione_draft_${clientId}`;
      const draftData = {
        data: schedaData,
        savedAt: new Date().toISOString()
      };
      
      try {
        localStorage.setItem(autosavedKey, JSON.stringify(draftData));
        console.log('✅ Bozza salvata automaticamente');
      } catch (error) {
        console.error('⚠️ Errore salvataggio automatico:', error);
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [schedaData, clientId, isEditMode]);

  const loadClientAndScheda = async () => {
    try {
      // Load client info
      const clientRef = getTenantDoc(db, 'clients', clientId);
      const clientSnap = await getDoc(clientRef);
      
      if (clientSnap.exists()) {
        const client = clientSnap.data();
        setClientName(client.name || 'N/D');
        setClientData(client);
        console.log('✅ Client data loaded:', client);
        
        // Load anamnesis
        const anamnesisRef = getTenantDoc(db, 'anamnesis', clientId);
        const anamnesisSnap = await getDoc(anamnesisRef);
        if (anamnesisSnap.exists()) {
          setAnamnesisData(anamnesisSnap.data());
          console.log('✅ Anamnesis data loaded:', anamnesisSnap.data());
        } else {
          console.log('⚠️ Nessuna anamnesi trovata per questo cliente');
        }
        
        // Load scheda alimentazione if exists
        const schedaRef = getTenantDoc(db, 'schede_alimentazione', clientId);
        const schedaSnap = await getDoc(schedaRef);
        
        if (schedaSnap.exists()) {
          setSchedaData(schedaSnap.data());
          setSchedaExists(true);
          setIsEditMode(false); // Modalità visualizzazione per schede esistenti
        } else {
          setIsEditMode(true); // Modalità modifica per nuove schede
        }
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    }
    setLoading(false);
  };

  const handleSaveDraft = () => {
    try {
      const autosavedKey = `scheda_alimentazione_draft_${clientId}`;
      const draftData = {
        data: schedaData,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(autosavedKey, JSON.stringify(draftData));
      toast.success('Bozza salvata in locale!');
    } catch (error) {
      console.error('Errore salvataggio bozza:', error);
      toast.error('Errore nel salvataggio della bozza');
    }
  };

  const handleDeleteScheda = async () => {
    setDeleting(true);
    try {
      // Elimina la scheda da Firestore
      const schedaRef = getTenantDoc(db, 'schede_alimentazione', clientId);
      await deleteDoc(schedaRef);
      
      // Aggiorna il cliente per rimuovere il flag di consegna
      const clientRef = getTenantDoc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        'schedaAlimentazione.consegnata': false,
        'schedaAlimentazione.scadenza': null,
        'schedaAlimentazione.dataConsegna': null
      });
      
      // Rimuovi anche la bozza locale
      const autosavedKey = `scheda_alimentazione_draft_${clientId}`;
      localStorage.removeItem(autosavedKey);
      
      toast.success('Scheda eliminata con successo!');
      setShowDeleteModal(false);
      
      // Ricarica la pagina o torna indietro
      navigate('/alimentazione-allenamento');
    } catch (error) {
      console.error('Errore eliminazione scheda:', error);
      toast.error('Errore nell\'eliminazione della scheda');
    }
    setDeleting(false);
  };

  const handleSendToClient = async () => {
    // Validazione
    if (!schedaData.obiettivo) {
      toast.warning('Seleziona un obiettivo prima di inviare la scheda');
      return;
    }
    
    // Controlla che ci sia almeno un pasto in un giorno
    const hasContent = Object.values(schedaData.giorni).some(giorno => 
      giorno.pasti.some(pasto => pasto.alimenti.length > 0)
    );
    
    if (!hasContent) {
      toast.warning('Aggiungi almeno un alimento prima di inviare la scheda');
      return;
    }
    
    if (!confirm('🚀 Confermi di voler inviare questa scheda al cliente? Sarà visibile nella sua area.')) {
      return;
    }
    
    setSaving(true);
    try {
      // Save current card
      const schedaRef = getTenantDoc(db, 'schede_alimentazione', clientId);
      await setDoc(schedaRef, {
        ...schedaData,
        originalGiorni: schedaData.giorni, // Salva copia originale per il reset
        updatedAt: new Date(),
        publishedAt: new Date()
      });

      // Save to history
      await saveToHistory();

      // Update client with expiry date and mark as delivered
      if (schedaData.durataSettimane) {
        const clientRef = getTenantDoc(db, 'clients', clientId);
        const scadenza = new Date();
        scadenza.setDate(scadenza.getDate() + (parseInt(schedaData.durataSettimane) * 7));
        
        await updateDoc(clientRef, {
          'schedaAlimentazione.scadenza': scadenza,
          'schedaAlimentazione.consegnata': true,
          'schedaAlimentazione.dataConsegna': new Date()
        });
      } else {
        // Anche senza durata, marca come consegnata
        const clientRef = getTenantDoc(db, 'clients', clientId);
        await updateDoc(clientRef, {
          'schedaAlimentazione.consegnata': true,
          'schedaAlimentazione.dataConsegna': new Date()
        });
      }

      // Rimuovi la bozza salvata automaticamente
      const autosavedKey = `scheda_alimentazione_draft_${clientId}`;
      localStorage.removeItem(autosavedKey);
      
      toast.success('Scheda inviata con successo al cliente!');
      
      // Passa in modalità visualizzazione dopo il salvataggio
      setSchedaExists(true);
      setIsEditMode(false);
      
      // Mostra modal feedback se ci sono suggerimenti applicati E l'utente non ha disabilitato
      if (appliedSuggestions.length > 0 && auth.currentUser) {
        const shouldShow = await shouldShowFeedbackPopup(auth.currentUser.uid);
        if (shouldShow) {
          setShowFeedbackModal(true);
        }
      }
    } catch (error) {
      console.error('Errore invio scheda:', error);
      toast.error('Errore nell\'invio della scheda al cliente');
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

  const handleApplyCompleteSchedule = (aiResult) => {
    if (!aiResult.schedaCompleta) {
      toast.error('Nessuna scheda generata dall\'AI');
      return;
    }

    console.log('📋 Applico scheda completa AI:', aiResult);

    // Applica la scheda completa di 7 giorni
    setSchedaData(prev => ({
      ...prev,
      giorni: aiResult.schedaCompleta,
      note: prev.note 
        ? `${prev.note}\n\n🤖 AI Generated: ${aiResult.note || 'Scheda ottimizzata per obiettivo'}` 
        : `🤖 AI Generated: ${aiResult.note || 'Scheda ottimizzata per obiettivo'}`
    }));

    // Cambia al primo giorno per vedere i risultati
    setSelectedDay('Lunedì');
    
    toast.success('Scheda completa di 7 giorni generata! Ricordati di salvare.');
  };

  const handleApplyAISuggestion = (suggestion) => {
    if (!suggestion.azione) {
      toast.warning('Nessuna azione specificata in questo suggerimento');
      return;
    }
    
    const { tipo, dati } = suggestion.azione;
    console.log('🤖 Applico suggerimento AI:', tipo, dati);
    
    // Trova l'indice del pasto target
    const findPastoIndex = (pastoNome) => {
      const pasti = schedaData.giorni[selectedDay].pasti;
      return pasti.findIndex(p => p.nome.toLowerCase().includes(pastoNome.toLowerCase()));
    };
    
    switch (tipo) {
      case 'add_food': {
        // Aggiungi alimento a un pasto specifico
        const pastoIndex = dati.pastoNome ? findPastoIndex(dati.pastoNome) : 0;
        if (pastoIndex === -1) {
          toast.error(`Pasto "${dati.pastoNome}" non trovato`);
          return;
        }
        
        if (dati.alimentoDaAggiungere) {
          const nuovoAlimento = {
            nome: dati.alimentoDaAggiungere.nome,
            quantita: dati.alimentoDaAggiungere.quantita || 100,
            kcal: dati.alimentoDaAggiungere.kcal || 0,
            proteine: dati.alimentoDaAggiungere.proteine || 0,
            carboidrati: dati.alimentoDaAggiungere.carboidrati || 0,
            grassi: dati.alimentoDaAggiungere.grassi || 0,
            fonte: 'AI'
          };
          
          addAlimento(pastoIndex, nuovoAlimento);
          
          // Traccia suggerimento applicato
          setAppliedSuggestions(prev => [...prev, {
            ...suggestion,
            appliedAt: new Date(),
            tipo: 'add_food'
          }]);
          
          toast.success(`Alimento "${nuovoAlimento.nome}" aggiunto a ${schedaData.giorni[selectedDay].pasti[pastoIndex].nome}`);
        }
        break;
      }
      
      case 'replace_food': {
        // Sostituisci un alimento con un altro
        const pastoIndex = dati.pastoNome ? findPastoIndex(dati.pastoNome) : -1;
        if (pastoIndex === -1) {
          toast.error(`Pasto "${dati.pastoNome}" non trovato`);
          return;
        }
        
        setSchedaData(prev => {
          const newData = { ...prev };
          const pasto = newData.giorni[selectedDay].pasti[pastoIndex];
          
          // Trova l'alimento da sostituire
          const alimentoIndex = pasto.alimenti.findIndex(a => 
            a.nome.toLowerCase().includes(dati.alimentoDaRimuovere?.toLowerCase())
          );
          
          if (alimentoIndex !== -1) {
            // Rimuovi vecchio alimento
            pasto.alimenti.splice(alimentoIndex, 1);
          }
          
          // Aggiungi nuovo alimento
          if (dati.alimentoDaAggiungere) {
            pasto.alimenti.push({
              nome: dati.alimentoDaAggiungere.nome,
              quantita: dati.alimentoDaAggiungere.quantita || 100,
              kcal: dati.alimentoDaAggiungere.kcal || 0,
              proteine: dati.alimentoDaAggiungere.proteine || 0,
              carboidrati: dati.alimentoDaAggiungere.carboidrati || 0,
              grassi: dati.alimentoDaAggiungere.grassi || 0,
              fonte: 'AI'
            });
          }
          
          return newData;
        });
        
        // Traccia suggerimento applicato
        setAppliedSuggestions(prev => [...prev, {
          ...suggestion,
          appliedAt: new Date(),
          tipo: 'replace_food'
        }]);
        
        toast.success(`Sostituito "${dati.alimentoDaRimuovere}" con "${dati.alimentoDaAggiungere?.nome}" nel ${dati.pastoNome}`);
        break;
      }
      
      case 'remove_food': {
        // Rimuovi un alimento
        const pastoIndex = dati.pastoNome ? findPastoIndex(dati.pastoNome) : -1;
        if (pastoIndex === -1) {
          toast.error(`Pasto "${dati.pastoNome}" non trovato`);
          return;
        }
        
        setSchedaData(prev => {
          const newData = { ...prev };
          const pasto = newData.giorni[selectedDay].pasti[pastoIndex];
          const alimentoIndex = pasto.alimenti.findIndex(a => 
            a.nome.toLowerCase().includes(dati.alimentoDaRimuovere?.toLowerCase())
          );
          
          if (alimentoIndex !== -1) {
            pasto.alimenti.splice(alimentoIndex, 1);
            toast.success(`Rimosso "${dati.alimentoDaRimuovere}" dal ${dati.pastoNome}`);
          } else {
            toast.error(`Alimento "${dati.alimentoDaRimuovere}" non trovato`);
          }
          
          return newData;
        });
        break;
      }
      
      case 'add_supplement': {
        // Aggiungi integratore alla sezione integrazione
        const integratore = dati.alimentoDaAggiungere?.nome || dati.integratore || suggestion.descrizione;
        setSchedaData(prev => ({
          ...prev,
          integrazione: prev.integrazione 
            ? `${prev.integrazione}\n\n• ${integratore}` 
            : `• ${integratore}`
        }));
        toast.success(`Integratore aggiunto: ${integratore}`);
        break;
      }
        
      default:
        console.warn('Tipo di azione non riconosciuto:', tipo);
        toast.warning(`Azione "${tipo}" non supportata`);
    }
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
      const newData = JSON.parse(JSON.stringify(prev));
      const pasti = newData.giorni[selectedDay].pasti;
      [pasti[pastoIndex - 1], pasti[pastoIndex]] = [pasti[pastoIndex], pasti[pastoIndex - 1]];
      return newData;
    });
  };

  const movePastoDown = (pastoIndex) => {
    const pasti = schedaData.giorni[selectedDay].pasti;
    if (pastoIndex === pasti.length - 1) return;
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const pasti = newData.giorni[selectedDay].pasti;
      [pasti[pastoIndex], pasti[pastoIndex + 1]] = [pasti[pastoIndex + 1], pasti[pastoIndex]];
      return newData;
    });
  };

  const duplicatePasto = (pastoIndex) => {
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const pasto = JSON.parse(JSON.stringify(newData.giorni[selectedDay].pasti[pastoIndex]));
      newData.giorni[selectedDay].pasti.splice(pastoIndex + 1, 0, pasto);
      return newData;
    });
  };

  const removePasto = async (pastoIndex) => {
    const pasto = schedaData.giorni[selectedDay].pasti[pastoIndex];
    const confirmed = await confirmDelete(`il pasto "${pasto.nome}"`);
    if (!confirmed) return;
    
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.giorni[selectedDay].pasti.splice(pastoIndex, 1);
      return newData;
    });
    toast.success(`Pasto "${pasto.nome}" eliminato`);
  };

  const renamePasto = (pastoIndex, newName) => {
    if (!newName.trim()) return;
    setSchedaData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.giorni[selectedDay].pasti[pastoIndex].nome = newName.trim();
      return newData;
    });
    setEditingPastoIndex(null);
    setEditingPastoName('');
  };

  const startEditingPasto = (pastoIndex) => {
    setEditingPastoIndex(pastoIndex);
    setEditingPastoName(schedaData.giorni[selectedDay].pasti[pastoIndex].nome);
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

  // Preset Management - Multi-tenant
  const loadPresets = async () => {
    try {
      const presetsRef = getTenantCollection(db, 'preset_alimentazione');
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
      const presetsRef = getTenantCollection(db, 'preset_alimentazione');
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
      // Usa la struttura tenant per lo storico
      const historyCollectionRef = getTenantSubcollection(db, 'schede_alimentazione', clientId, 'history');
      const q = query(historyCollectionRef, orderBy('savedAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      const history = [];
      snapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });
      setCardHistory(history);
      console.log(`✅ Caricati ${history.length} elementi dallo storico`);
    } catch (error) {
      console.error('⚠️ Errore caricamento storico:', error);
      // Non bloccante, lo storico è opzionale
    }
  };

  const saveToHistory = async () => {
    try {
      // Usa la struttura tenant per lo storico
      const historyCollectionRef = getTenantSubcollection(db, 'schede_alimentazione', clientId, 'history');
      await addDoc(historyCollectionRef, {
        ...schedaData,
        savedAt: new Date()
      });
      console.log('✅ Scheda salvata nello storico');
    } catch (error) {
      console.error('⚠️ Errore salvataggio storico (non bloccante):', error);
      // Non bloccare il salvataggio principale se lo storico fallisce
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
            <div className="flex items-center gap-3">
              {isEditMode && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <span className="animate-pulse">●</span>
                  Salvataggio automatico attivo
                </span>
              )}
              {schedaExists && !isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white preserve-white rounded-lg transition-colors"
                >
                  <Sparkles size={18} />
                  Modifica Scheda
                </button>
              )}
              {isEditMode && (
                <>
                  <button
                    onClick={handleSaveDraft}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white preserve-white rounded-lg transition-colors"
                  >
                    <Save size={18} />
                    Salva Bozza
                  </button>
                  <button
                    onClick={handleSendToClient}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-600 text-white preserve-white rounded-lg transition-colors font-semibold shadow-lg"
                  >
                    <Upload size={18} />
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
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white preserve-white text-sm rounded-lg transition-colors"
            >
              <Download size={16} />
              Scarica PDF
            </button>
            {schedaExists && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white preserve-white text-sm rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Elimina Scheda
              </button>
            )}
            {isEditMode && (
              <>
                <button
                  onClick={() => {
                    setShowSavePresetModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white preserve-white text-sm rounded-lg transition-colors"
                >
                  <FileText size={16} />
                  Salva come Preset
                </button>
                <button
                  onClick={() => {
                    loadPresets();
                    setShowImportPresetModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white preserve-white text-sm rounded-lg transition-colors"
                >
                  <Upload size={16} />
                  Importa Preset
                </button>
                <button
                  onClick={() => {
                    loadPreviousCard();
                    setShowCopyPreviousModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white preserve-white text-sm rounded-lg transition-colors"
                >
                  <Copy size={16} />
                  Copia Precedente
                </button>
              </>
            )}
            <button
              onClick={() => {
                loadCardHistory();
                setShowHistoryModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white preserve-white text-sm rounded-lg transition-colors"
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
                disabled={!isEditMode}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={!isEditMode}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={!isEditMode}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={!isEditMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedDay === giorno
                    ? 'bg-emerald-600 text-white preserve-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {giorno}
              </button>
            ))}
          </div>
          
          {isEditMode && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedDaysForDuplication([]);
                  setShowDuplicateDayModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white preserve-white rounded-lg transition-colors text-sm flex items-center gap-2"
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
                  {isEditMode && editingPastoIndex === pastoIndex ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editingPastoName}
                        onChange={(e) => setEditingPastoName(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        {TIPI_PASTO.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editingPastoName}
                        onChange={(e) => setEditingPastoName(e.target.value)}
                        placeholder="O scrivi un nome personalizzato..."
                        className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-48"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renamePasto(pastoIndex, editingPastoName);
                          if (e.key === 'Escape') { setEditingPastoIndex(null); setEditingPastoName(''); }
                        }}
                      />
                      <button
                        onClick={() => renamePasto(pastoIndex, editingPastoName)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        title="Conferma"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => { setEditingPastoIndex(null); setEditingPastoName(''); }}
                        className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
                        title="Annulla"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-100">{pasto.nome}</h3>
                      {isEditMode && (
                        <button
                          onClick={() => startEditingPasto(pastoIndex)}
                          className="p-1 text-slate-400 hover:text-emerald-400"
                          title="Modifica nome pasto"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                  {isEditMode && (
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
                        title="Duplica pasto"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => removePasto(pastoIndex)}
                        className="p-2 text-red-400 hover:text-red-300"
                        title="Elimina pasto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Alimenti List */}
                {pasto.alimenti.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-300">Alimento</th>
                          <th className="px-3 py-2 text-left text-slate-300">Quantità</th>
                          <th className="px-3 py-2 text-left text-slate-300">Kcal</th>
                          <th className="px-3 py-2 text-left text-slate-300">Proteine</th>
                          <th className="px-3 py-2 text-left text-slate-300">Carb.</th>
                          <th className="px-3 py-2 text-left text-slate-300">Grassi</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {pasto.alimenti.map((alimento, alimentoIndex) => {
                          // Converti quantità in grammi per calcoli
                          const unitaMisura = alimento.unitaMisura || 'g';
                          const quantitaInGrammi = convertToGrams(alimento.quantita, unitaMisura);
                          const factor = quantitaInGrammi / 100;
                          
                          return (
                            <tr key={alimentoIndex}>
                              <td className="px-3 py-2 text-slate-200">{alimento.nome}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={alimento.quantita}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      // Permetti campo vuoto durante digitazione
                                      const newQuantita = val === '' ? '' : parseFloat(val);
                                      setSchedaData(prev => {
                                        const newData = JSON.parse(JSON.stringify(prev));
                                        newData.giorni[selectedDay].pasti[pastoIndex].alimenti[alimentoIndex].quantita = newQuantita;
                                        return newData;
                                      });
                                    }}
                                    onBlur={(e) => {
                                      // Al blur, se vuoto o NaN, imposta a 0
                                      const val = parseFloat(e.target.value);
                                      if (isNaN(val) || e.target.value === '') {
                                        setSchedaData(prev => {
                                          const newData = JSON.parse(JSON.stringify(prev));
                                          newData.giorni[selectedDay].pasti[pastoIndex].alimenti[alimentoIndex].quantita = 0;
                                          return newData;
                                        });
                                      }
                                    }}
                                    disabled={!isEditMode}
                                    className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                  <span className="text-slate-400 text-xs">{unitaMisura}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-emerald-400 font-medium">{((alimento.kcal || 0) * factor).toFixed(0)}</td>
                              <td className="px-3 py-2 text-blue-400">{((alimento.proteine || 0) * factor).toFixed(1)}g</td>
                              <td className="px-3 py-2 text-yellow-400">{((alimento.carboidrati || 0) * factor).toFixed(1)}g</td>
                              <td className="px-3 py-2 text-orange-400">{((alimento.grassi || 0) * factor).toFixed(1)}g</td>
                              <td className="px-3 py-2">
                                {isEditMode && (
                                  <button
                                    onClick={() => removeAlimento(pastoIndex, alimentoIndex)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
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

                {isEditMode && (
                  <button
                    onClick={() => setShowAddAlimento({ pastoIndex })}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Aggiungi Alimento
                  </button>
                )}

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Integrazione</h3>
            {isEditMode && (
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { generateSupplementSuggestions } = await import('../../services/aiNutritionAssistant');
                    const suggestions = await generateSupplementSuggestions({
                      clientData: { name: clientName, age: clientData?.age, gender: clientData?.gender, ...clientData },
                      anamnesisData: anamnesisData || {},
                      schedaData
                    });
                    
                    // Formatta il protocollo in testo leggibile
                    let protocolloText = `🤖 PROTOCOLLO AI INTEGRATORI\n\n`;
                    
                    // Integratori consigliati
                    protocolloText += `📋 INTEGRATORI CONSIGLIATI:\n\n`;
                    suggestions.integratori.forEach(int => {
                      protocolloText += `✅ ${int.nome}\n`;
                      protocolloText += `   Dosaggio: ${int.dosaggio}\n`;
                      protocolloText += `   Timing: ${int.timing}\n`;
                      protocolloText += `   Perché: ${int.motivazione}\n`;
                      protocolloText += `   Priorità: ${int.priorita.toUpperCase()}\n\n`;
                    });
                    
                    // Protocollo giornaliero
                    if (suggestions.protocolloGiornaliero) {
                      protocolloText += `⏰ PROTOCOLLO GIORNALIERO:\n\n`;
                      Object.entries(suggestions.protocolloGiornaliero).forEach(([momento, integratori]) => {
                        protocolloText += `${momento}:\n`;
                        integratori.forEach(int => {
                          protocolloText += `  • ${int}\n`;
                        });
                        protocolloText += `\n`;
                      });
                    }
                    
                    // Note e costo
                    if (suggestions.note) {
                      protocolloText += `📝 NOTE:\n${suggestions.note}\n\n`;
                    }
                    
                    if (suggestions.costo_mensile_stimato) {
                      protocolloText += `💰 Costo mensile stimato: ${suggestions.costo_mensile_stimato}\n`;
                    }
                    
                    // Aggiungi al campo integrazione
                    setSchedaData(prev => ({
                      ...prev,
                      integrazione: prev.integrazione 
                        ? `${prev.integrazione}\n\n${protocolloText}` 
                        : protocolloText
                    }));
                    
                    setLoading(false);
                  } catch (error) {
                    console.error('Errore AI Integratori:', error);
                    toast.error('Errore generazione consigli integratori: ' + error.message);
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg transition-all flex items-center gap-2"
              >
                <span>🤖</span>
                AI Integratori
              </button>
            )}
          </div>
          <textarea
            value={schedaData.integrazione}
            onChange={(e) => setSchedaData({ ...schedaData, integrazione: e.target.value })}
            disabled={!isEditMode}
            rows="8"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* AI Feedback Modal */}
        <AnimatePresence>
          {showFeedbackModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">
                    Come ti sei trovato con i suggerimenti AI?
                  </h3>
                  <p className="text-slate-400">
                    Il tuo feedback ci aiuta a migliorare i suggerimenti futuri
                  </p>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-300 mb-2">
                    Hai applicato <span className="font-bold text-purple-400">{appliedSuggestions.length}</span> suggeriment{appliedSuggestions.length === 1 ? 'o' : 'i'}:
                  </p>
                  <ul className="space-y-1 text-sm text-slate-400">
                    {appliedSuggestions.slice(0, 3).map((sugg, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{sugg.titolo || sugg.tipo}</span>
                      </li>
                    ))}
                    {appliedSuggestions.length > 3 && (
                      <li className="text-slate-500">... e altri {appliedSuggestions.length - 3}</li>
                    )}
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-4">
                  <button
                    onClick={async () => {
                      // Salva tutti come positivi
                      for (const sugg of appliedSuggestions) {
                        await saveFeedback({
                          suggestionType: sugg.tipo,
                          suggestionTitle: sugg.titolo,
                          suggestionData: sugg.azione?.dati,
                          isPositive: true,
                          clientId,
                          obiettivo: schedaData.obiettivo,
                          coachId: currentUser?.uid
                        });
                      }
                      setAppliedSuggestions([]);
                      setShowFeedbackModal(false);
                      toast.success('Grazie! I tuoi feedback aiuteranno a migliorare i suggerimenti futuri');
                    }}
                    className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white preserve-white rounded-xl font-medium transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    <span className="text-2xl">👍</span>
                    <div className="text-left">
                      <div className="font-bold">Molto utili!</div>
                      <div className="text-xs opacity-90">I suggerimenti sono stati ottimi</div>
                    </div>
                  </button>

                  <button
                    onClick={async () => {
                      // Salva tutti come negativi
                      for (const sugg of appliedSuggestions) {
                        await saveFeedback({
                          suggestionType: sugg.tipo,
                          suggestionTitle: sugg.titolo,
                          suggestionData: sugg.azione?.dati,
                          isPositive: false,
                          clientId,
                          obiettivo: schedaData.obiettivo,
                          coachId: currentUser?.uid
                        });
                      }
                      setAppliedSuggestions([]);
                      setShowFeedbackModal(false);
                      toast.info('Grazie per il feedback! Lavoreremo per migliorare');
                    }}
                    className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-all flex items-center justify-center gap-3"
                  >
                    <span className="text-2xl">👎</span>
                    <div className="text-left">
                      <div className="font-bold">Non molto utili</div>
                      <div className="text-xs opacity-70">I suggerimenti non erano adatti</div>
                    </div>
                  </button>

                  <button
                    onClick={async () => {
                      // Salva preferenza "non mostrare più"
                      for (const sugg of appliedSuggestions) {
                        await saveDoNotShowPreference({
                          suggestionType: sugg.tipo,
                          obiettivo: schedaData.obiettivo,
                          coachId: currentUser?.uid,
                          reason: 'User requested not to show this type'
                        });
                      }
                      setAppliedSuggestions([]);
                      setShowFeedbackModal(false);
                      toast.info('Questi tipi di suggerimenti non verranno più mostrati');
                    }}
                    className="px-6 py-4 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl font-medium transition-all flex items-center justify-center gap-3"
                  >
                    <X className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold">Non mostrare più</div>
                      <div className="text-xs opacity-70">Questi suggerimenti non mi interessano</div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setAppliedSuggestions([]);
                    setShowFeedbackModal(false);
                  }}
                  className="w-full px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
                >
                  Salta
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Nutrition Assistant */}
        {isEditMode && clientData && (
          <AINutritionAssistant
            clientData={{
              name: clientName,
              id: clientId,
              ...clientData
            }}
            anamnesisData={anamnesisData || {}}
            schedaData={schedaData}
            onApplySuggestion={handleApplyAISuggestion}
            onApplyCompleteSchedule={handleApplyCompleteSchedule}
            contextType="general"
          />
        )}

        {/* Duplicate Day Selection Modal */}
        <AnimatePresence>
          {showDuplicateDayModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDuplicateDayModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Copy size={20} className="text-blue-400" />
                  Duplica {selectedDay}
                </h3>
                
                <p className="text-slate-300 text-sm mb-4">
                  Seleziona i giorni in cui vuoi copiare la programmazione di {selectedDay}:
                </p>

                <div className="space-y-2 mb-6">
                  {GIORNI_SETTIMANA.filter(d => d !== selectedDay).map(giorno => (
                    <label
                      key={giorno}
                      className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDaysForDuplication.includes(giorno)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDaysForDuplication([...selectedDaysForDuplication, giorno]);
                          } else {
                            setSelectedDaysForDuplication(selectedDaysForDuplication.filter(d => d !== giorno));
                          }
                        }}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-slate-200">{giorno}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (selectedDaysForDuplication.length === 0) {
                        toast.warning('Seleziona almeno un giorno!');
                        return;
                      }
                      duplicateDayToOthers(selectedDaysForDuplication);
                      setShowDuplicateDayModal(false);
                      setSelectedDaysForDuplication([]);
                    }}
                    disabled={selectedDaysForDuplication.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    Duplica ({selectedDaysForDuplication.length})
                  </button>
                  <button
                    onClick={() => {
                      setShowDuplicateDayModal(false);
                      setSelectedDaysForDuplication([]);
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
                    Stai per eliminare definitivamente questa scheda alimentazione per <strong>{clientName}</strong>.
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
                    className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white preserve-white rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Feedback Modal */}
        <AnimatePresence>
          {showFeedbackModal && appliedSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="text-center space-y-6">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-3xl">🤖</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white preserve-white">
                      Come ti sei trovato con l'AI Assistant?
                    </h3>
                    <p className="text-slate-300 text-sm">
                      Hai applicato {appliedSuggestions.length} suggeriment{appliedSuggestions.length > 1 ? 'i' : 'o'} AI
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        // Salva feedback positivo per tutti i suggerimenti applicati
                        if (auth.currentUser) {
                          for (const suggestion of appliedSuggestions) {
                            await saveFeedback({
                              userId: auth.currentUser.uid,
                              suggestion,
                              wasHelpful: true,
                              context: {
                                obiettivo: schedaData.obiettivo,
                                clientAge: anamnesisData?.age,
                                clientGender: anamnesisData?.sesso,
                                clientWeight: anamnesisData?.peso,
                                clientHeight: anamnesisData?.altezza,
                                hasPhotos: !!(anamnesisData?.photos?.length || anamnesisData?.photoFront)
                              }
                            });
                          }
                        }
                        setShowFeedbackModal(false);
                        setAppliedSuggestions([]);
                      }}
                      className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white preserve-white rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">👍</span>
                      Ottimi suggerimenti!
                    </button>

                    <button
                      onClick={async () => {
                        // Salva feedback negativo
                        if (auth.currentUser) {
                          for (const suggestion of appliedSuggestions) {
                            await saveFeedback({
                              userId: auth.currentUser.uid,
                              suggestion,
                              wasHelpful: false,
                              context: {
                                obiettivo: schedaData.obiettivo,
                                clientAge: anamnesisData?.age,
                                clientGender: anamnesisData?.sesso,
                                clientWeight: anamnesisData?.peso,
                                clientHeight: anamnesisData?.altezza,
                                hasPhotos: !!(anamnesisData?.photos?.length || anamnesisData?.photoFront)
                              }
                            });
                          }
                        }
                        setShowFeedbackModal(false);
                        setAppliedSuggestions([]);
                      }}
                      className="w-full px-6 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">👎</span>
                      Non utili
                    </button>

                    <button
                      onClick={async () => {
                        // Salva preferenza "non mostrare più"
                        if (auth.currentUser) {
                          await saveDoNotShowPreference(auth.currentUser.uid);
                        }
                        setShowFeedbackModal(false);
                        setAppliedSuggestions([]);
                      }}
                      className="w-full px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
                    >
                      Non mostrare più questo messaggio
                    </button>
                  </div>
                </div>
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
  const CATEGORIES = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Pizze', 'Bevande', 'Carne', 'Condimenti', 'Formaggi', 'Frutta', 'Integratori', 'Latte', 'Pane', 'Pasta', 'Pesce', 'Salumi', 'Uova', 'Verdura'];
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryFoods, setCategoryFoods] = useState([]); // Alimenti della categoria selezionata
  const [allFoods, setAllFoods] = useState([]); // Tutti gli alimenti per ricerca globale
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    quantita: '',
    unitaMisura: 'g', // 'g', 'pz', 'ml', 'cucchiaio', 'cucchiaino'
    kcal: '',
    proteine: '',
    carboidrati: '',
    grassi: ''
  });

  // Carica tutti gli alimenti all'apertura del form (per ricerca globale)
  useEffect(() => {
    loadAllFoods();
  }, []);

  // Carica alimenti per categoria selezionata
  useEffect(() => {
    if (selectedCategory) {
      loadFoodsForCategory(selectedCategory);
    } else {
      setCategoryFoods([]);
    }
  }, [selectedCategory]);

  // Gestisci ricerca globale
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = allFoods.filter(food =>
        food.nome.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 15);
      setSearchResults(filtered);
      setShowSearchResults(filtered.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchTerm, allFoods]);

  const loadAllFoods = async () => {
    try {
      const foods = [];
      
      // Carica tutti gli alimenti tenant da tutte le categorie
      for (const category of CATEGORIES) {
        const tenantRef = getTenantSubcollection(db, 'alimenti', category, 'items');
        const tenantSnap = await getDocs(tenantRef);
        tenantSnap.docs.forEach(doc => {
          foods.push({
            id: doc.id,
            nome: doc.data().nome,
            kcal: doc.data().kcal,
            proteine: doc.data().proteine,
            carboidrati: doc.data().carboidrati,
            grassi: doc.data().grassi,
            category: category,
            source: 'tenant'
          });
        });
      }

      // Carica tutti gli alimenti globali
      const globalRef = collection(db, 'platform_foods');
      const globalSnap = await getDocs(globalRef);
      globalSnap.docs.forEach(doc => {
        const data = doc.data();
        foods.push({
          id: doc.id,
          nome: data.name,
          kcal: data.calories,
          proteine: data.protein,
          carboidrati: data.carbs,
          grassi: data.fat,
          category: data.categoryName,
          source: 'global'
        });
      });

      setAllFoods(foods.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error('Errore caricamento alimenti globali:', error);
    }
  };

  const loadFoodsForCategory = async (category) => {
    setLoadingCategory(true);
    try {
      const foods = [];
      
      // Carica alimenti tenant
      const tenantRef = getTenantSubcollection(db, 'alimenti', category, 'items');
      const tenantSnap = await getDocs(tenantRef);
      tenantSnap.docs.forEach(doc => {
        foods.push({
          id: doc.id,
          nome: doc.data().nome,
          kcal: doc.data().kcal,
          proteine: doc.data().proteine,
          carboidrati: doc.data().carboidrati,
          grassi: doc.data().grassi,
          source: 'tenant'
        });
      });

      // Carica alimenti globali
      const globalRef = collection(db, 'platform_foods');
      const globalSnap = await getDocs(globalRef);
      
      const categoryMap = {
        'Antipasti': ['antipasti', 'salumi', 'verdure'],
        'Primi': ['primi', 'cereali-pasta', 'legumi', 'pizze', 'pane', 'patate-tuberi'],
        'Secondi': ['carni-bianche', 'carni-rosse', 'pesce', 'frutti-mare', 'legumi', 'uova'],
        'Dolci': ['dolci'],
        'Pizze': ['pizze'],
        'Bevande': ['bevande'],
        'Carne': ['carni-bianche', 'carni-rosse'],
        'Condimenti': ['condimenti', 'grassi-condimenti'],
        'Formaggi': ['formaggi', 'uova-latticini'],
        'Frutta': ['frutta-fresca', 'frutta-secca'],
        'Integratori': ['integratori-snack'],
        'Latte': ['latte', 'uova-latticini'],
        'Pane': ['pane', 'cereali-pasta'],
        'Pasta': ['cereali-pasta'],
        'Pesce': ['pesce', 'frutti-mare'],
        'Salumi': ['salumi'],
        'Uova': ['uova', 'uova-latticini'],
        'Verdura': ['verdure', 'patate-tuberi']
      };

      const globalCategories = categoryMap[category] || [];
      globalSnap.docs.forEach(doc => {
        const data = doc.data();
        if (globalCategories.includes(data.category)) {
          foods.push({
            id: doc.id,
            nome: data.name,
            kcal: data.calories,
            proteine: data.protein,
            carboidrati: data.carbs,
            grassi: data.fat,
            source: 'global'
          });
        }
      });

      setCategoryFoods(foods.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error('Errore caricamento alimenti categoria:', error);
    }
    setLoadingCategory(false);
  };

  const selectFood = (food) => {
    // Inferisci unità di misura dal nome usando utility
    const { unitaMisura, quantitaDefault } = inferUnitFromName(food.nome);
    
    setFormData({
      nome: food.nome,
      quantita: quantitaDefault,
      unitaMisura: unitaMisura,
      kcal: food.kcal.toString(),
      proteine: food.proteine.toString(),
      carboidrati: food.carboidrati.toString(),
      grassi: food.grassi.toString()
    });
    setSearchTerm('');
    setShowSearchResults(false);
    setSelectedCategory(''); // Reset categoria dopo selezione
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.quantita) {
      toast.warning('Inserisci almeno nome e quantità');
      return;
    }
    onAdd({
      ...formData,
      quantita: parseFloat(formData.quantita),
      unitaMisura: formData.unitaMisura,
      kcal: parseFloat(formData.kcal) || 0,
      proteine: parseFloat(formData.proteine) || 0,
      carboidrati: parseFloat(formData.carboidrati) || 0,
      grassi: parseFloat(formData.grassi) || 0
    });
    setFormData({ nome: '', quantita: '', unitaMisura: 'g', kcal: '', proteine: '', carboidrati: '', grassi: '' });
    setSearchTerm('');
    setSelectedCategory('');
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

      {/* Categoria Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Categoria (opzionale)
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">-- Seleziona una categoria --</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Lista Alimenti della Categoria */}
      {selectedCategory && (
        <div className="mb-4 bg-slate-700/50 rounded-lg p-3 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-semibold text-emerald-400">
              Alimenti in {selectedCategory}
            </h5>
            <span className="text-xs text-slate-400">
              {loadingCategory ? 'Caricamento...' : `${categoryFoods.length} alimenti`}
            </span>
          </div>
          {loadingCategory ? (
            <div className="text-center py-4 text-slate-400">Caricamento...</div>
          ) : categoryFoods.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">Nessun alimento in questa categoria</div>
          ) : (
            <div className="space-y-1">
              {categoryFoods.map((food, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 hover:bg-slate-600 rounded transition-colors"
                >
                  <button
                    onClick={() => selectFood(food)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-200">{food.nome}</div>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${food.source === 'global' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {food.source === 'global' ? 'Globale' : 'Tenant'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {food.kcal} kcal | P: {food.proteine}g | C: {food.carboidrati}g | G: {food.grassi}g
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      selectFood(food);
                      // Aggiungi automaticamente dopo 100ms per dare tempo al form di aggiornarsi
                      setTimeout(() => handleSubmit(), 100);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded flex items-center gap-1 flex-shrink-0"
                    title="Aggiungi direttamente"
                  >
                    <Plus size={14} />
                    Aggiungi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Campi form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Nome con ricerca globale integrata */}
        <div className="relative md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nome Alimento
          </label>
          <input
            type="text"
            placeholder="Cerca o digita nome alimento..."
            value={searchTerm || formData.nome}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setFormData({ ...formData, nome: e.target.value });
            }}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
          />
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              <div className="sticky top-0 bg-slate-700 px-3 py-2 text-xs text-slate-300 border-b border-slate-600">
                {searchResults.length} risultati trovati
              </div>
              {searchResults.map((food, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 px-3 py-2 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                >
                  <button
                    onClick={() => selectFood(food)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-200">{food.nome}</div>
                      <div className="flex gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${food.source === 'global' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {food.source === 'global' ? 'Globale' : 'Tenant'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
                          {food.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {food.kcal} kcal | P: {food.proteine}g | C: {food.carboidrati}g | G: {food.grassi}g
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      selectFood(food);
                      setTimeout(() => handleSubmit(), 100);
                    }}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded flex items-center gap-1 flex-shrink-0"
                    title="Aggiungi direttamente"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantità
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Quantità"
              value={formData.quantita}
              onChange={(e) => setFormData({ ...formData, quantita: e.target.value })}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
            <select
              value={formData.unitaMisura}
              onChange={(e) => setFormData({ ...formData, unitaMisura: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="g">g</option>
              <option value="pz">pz</option>
              <option value="ml">ml</option>
              <option value="cucchiaio">cucchiaio</option>
              <option value="cucchiaino">cucchiaino</option>
            </select>
          </div>
        </div>
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
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white preserve-white rounded text-sm transition-colors"
        >
          Aggiungi
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white preserve-white rounded text-sm transition-colors"
        >
          Annulla
        </button>
      </div>
    </motion.div>
  );
};

export default SchedaAlimentazione;
