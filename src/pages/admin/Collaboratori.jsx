import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc,
  where, getDocs
} from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail
} from 'firebase/auth';
import { useConfirm } from '../../contexts/ConfirmContext';
import { 
  Users, Plus, Key, Trash2, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, 
  Edit, X, Check, File, DollarSign, CheckCircle, FileText, ChevronDown, ChevronUp, Phone, Save, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleCalendar from '../../components/calendar/SimpleCalendar';
import LeadsTable from '../../components/leads/LeadsTable';

const ReportStatus = ({ collaboratori }) => {
  const today = new Date().toISOString().split('T')[0];
  const [missingReports, setMissingReports] = useState([]);

  useEffect(() => {
    const missing = collaboratori.filter(c => {
      const reports = c.dailyReports || [];
      const todayReport = reports.find(r => r.date === today);
      return !todayReport || !todayReport.eodReport || !todayReport.tracker;
    }).map(c => c.nome || c.email?.split('@')[0] || 'Sconosciuto');
    setMissingReports(missing);
  }, [collaboratori]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-700/30 mx-3 sm:mx-6">
      <h2 className="text-sm font-semibold text-white mb-3">Stato Report Oggi</h2>
      <div className="flex gap-4 text-sm">
        <p><span className="text-slate-400">Completati:</span> <span className="text-emerald-400 font-medium">{collaboratori.length - missingReports.length}</span></p>
        <p><span className="text-slate-400">Mancanti:</span> <span className="text-red-400 font-medium">{missingReports.length}</span></p>
      </div>
      {missingReports.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <p className="text-red-400 text-xs font-medium mb-1">Mancanti:</p>
          <ul className="list-disc pl-4 text-xs text-slate-300">
            {missingReports.map(name => <li key={name} className="truncate">{name}</li>)}
          </ul>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-3">Nota: 2 report/giorno richiesti.</p>
    </motion.div>
  );
};

export default function Collaboratori() {
  const navigate = useNavigate();
  const { confirmAction } = useConfirm();
  const [collaboratori, setCollaboratori] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [leadColumns, setLeadColumns] = useState([
    { id: 'name', label: 'Nome', visible: true, locked: true },
    { id: 'number', label: 'Telefono', visible: true, locked: false },
    { id: 'email', label: 'Email', visible: true, locked: false },
    { id: 'dataPrenotazione', label: 'Data Pren.', visible: true, locked: false },
    { id: 'oraPrenotazione', label: 'Ora', visible: true, locked: false },
    { id: 'source', label: 'Fonte', visible: true, locked: false },
    { id: 'collaboratoreNome', label: 'Collaboratore', visible: true, locked: false },
    { id: 'dialed', label: 'Dialed', visible: true, locked: false },
    { id: 'note', label: 'Note', visible: true, locked: false },
  ]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Setter');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ leadsToday: 0, leadsWeek: 0, leadsMonth: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  // EDIT EMAIL
  const [editingCollab, setEditingCollab] = useState(null);
  const [editEmail, setEditEmail] = useState('');

  // REPORT SETTING
  const [reportSetting, setReportSetting] = useState({
    date: new Date().toISOString().split('T')[0],
    followUpsFatti: '',
    dialedFatti: '',
    dialedRisposte: '',
    chiamatePrenotate: '',
  });

  // REPORT VENDITA
  const [reportVendita, setReportVendita] = useState({
    date: new Date().toISOString().split('T')[0],
    chiamateFissate: '',
    chiamateFatte: '',
    offersFatte: '',
    chiuse: '',
    cash: '',
  });

  // FILTRI UNIFICATI (DEFAULT: TUTTI)
  const [filters, setFilters] = useState({
    chiuso: 'tutti',
    showUp: 'tutti',
    offer: 'tutti',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const leadsPerPage = 10;

  // POPUP NOTE
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [currentNote, setCurrentNote] = useState('');

  // FILTRA PER COLLABORATORE
  const [selectedCollaboratore, setSelectedCollaboratore] = useState(null);

  // DATI REPORT
  const [settingReports, setSettingReports] = useState([]);
  const [salesReports, setSalesReports] = useState([]);

  // STORICO REPORT
  const [showPastSetting, setShowPastSetting] = useState(false);
  const [showPastSales, setShowPastSales] = useState(false);
  
  // MODAL STATES
  const [showReportSetting, setShowReportSetting] = useState(false);
  const [showReportVendita, setShowReportVendita] = useState(false);
  const [showLeadsTable, setShowLeadsTable] = useState(false);
  const [showFontiStats, setShowFontiStats] = useState(false);
  const [showCollaboratoriList, setShowCollaboratoriList] = useState(false);

  // NUOVO: POPUP CONVERSIONE LEAD → CLIENTE
  const [showConvertPopup, setShowConvertPopup] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState(null);
  const [showFontiModal, setShowFontiModal] = useState(false);
  const [editingFonte, setEditingFonte] = useState(null);
  const [newFonteName, setNewFonteName] = useState('');
  
  // POPUP CREDENZIALI COLLABORATORE
  const [showCredentialsPopup, setShowCredentialsPopup] = useState(false);
  const [newCredentials, setNewCredentials] = useState({ email: '', password: '' });

  // NUOVO LEAD - Stati per Admin che inserisce lead
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '', source: '', number: '', note: '', email: '',
    dataPrenotazione: '', oraPrenotazione: ''
  });
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Funzioni per gestire le fonti
  const addFonte = () => {
    if (newFonteName.trim() && !fonti.includes(newFonteName.trim())) {
      setFonti([...fonti, newFonteName.trim()]);
      setNewFonteName('');
    }
  };

  const updateFonte = () => {
    if (editingFonte && newFonteName.trim()) {
      const trimmedName = newFonteName.trim();
      // Verifica che il nuovo nome non sia già usato (considerando anche i nomi mappati)
      const existingNames = fonti.map(f => getDisplayFonteName(f));
      if (!existingNames.includes(trimmedName) || trimmedName === getDisplayFonteName(editingFonte)) {
        // Salva la mappatura dal vecchio nome al nuovo
        setSourceMapping(prev => ({
          ...prev,
          [editingFonte]: trimmedName
        }));
        setFonti(fonti.map(f => f === editingFonte ? trimmedName : f));
        setEditingFonte(null);
        setNewFonteName('');
      }
    }
  };

  const deleteFonte = (fonteToDelete) => {
    if (confirm(`Sei sicuro di voler eliminare la fonte "${fonteToDelete}"?`)) {
      setFonti(fonti.filter(f => f !== fonteToDelete));
      // Rimuovi anche dalla mappatura se presente
      setSourceMapping(prev => {
        const newMapping = { ...prev };
        delete newMapping[fonteToDelete];
        return newMapping;
      });
    }
  };

  const startEditFonte = (fonte) => {
    setEditingFonte(fonte);
    setNewFonteName(fonte);
  };

  // Funzione helper per ottenere il nome visualizzato di una fonte
  const getDisplayFonteName = (fonte) => {
    return sourceMapping[fonte] || fonte;
  };

  const [fonti, setFonti] = useState([
    'Info Storie Prima e Dopo', 'Info Storie Promo', 'Info Reel', 'Inizio Reel',
    'Guida Maniglie', 'Guida Tartaruga', 'Guida 90', 'Altre Guide',
    'Guida Panettone', 'DM Richiesta', 'Outreach Nuovi Followers', 'Views Storie',
    'Follow-Ups', 'Facebook', 'TikTok', 'Referral'
  ]);
  const [sourceMapping, setSourceMapping] = useState({}); // Mappa vecchi nomi a nuovi nomi

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const checkAdmin = async () => {
      try {
        const adminDocRef = getTenantDoc(db, 'roles', 'admins');
        const adminDoc = await getDoc(adminDocRef);
        if (!adminDoc.exists()) {
          setError('Documento "roles/admins" non trovato.');
          setLoading(false);
          return;
        }
        const uids = adminDoc.data().uids || [];
        const isAdminUser = uids.includes(auth.currentUser.uid);
        if (isAdminUser) {
          setIsAdmin(true);
          setAdmins([{ id: auth.currentUser.uid, email: auth.currentUser.email, role: 'Admin' }]);
        } else {
          setError('Accesso negato.');
        }
        setLoading(false);
      } catch (err) {
        setError('Errore permessi.');
        setLoading(false);
      }
    };

    checkAdmin();

    // Carica lead statuses
    const loadStatuses = async () => {
      try {
        const configDoc = await getDoc(getTenantDoc(db, 'settings', 'leadStatuses'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.statuses) {
            setLeadStatuses(data.statuses.filter(s => s.enabled));
          } else {
            setLeadStatuses([
              { id: 'showUp', label: 'Show Up', color: 'green', enabled: true },
              { id: 'chiuso', label: 'Chiuso', color: 'rose', enabled: true },
            ]);
          }
        } else {
          setLeadStatuses([
            { id: 'showUp', label: 'Show Up', color: 'green', enabled: true },
            { id: 'chiuso', label: 'Chiuso', color: 'rose', enabled: true },
          ]);
        }
      } catch (error) {
        console.error('Errore caricamento lead statuses:', error);
      }
    };
    loadStatuses();
    
    // NON caricare leadColumns da Firestore - usiamo le colonne fisse per i leads dei collaboratori
    // che hanno campi diversi da quelli delle landing pages

    const collabQuery = query(getTenantCollection(db, 'collaboratori'), orderBy('nome'));
    const unsubCollab = onSnapshot(collabQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCollaboratori(data);
    });

    const leadsQuery = query(getTenantCollection(db, 'leads'), orderBy('timestamp', 'desc'));
    const unsubLeads = onSnapshot(leadsQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(data);
      calculateStats(data);
    });

    // Carica eventi calendario per il picker data/ora
    const calendarQuery = query(getTenantCollection(db, 'calendarEvents'));
    const unsubCalendar = onSnapshot(calendarQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCalendarEvents(data);
    });

    const settingQuery = query(getTenantCollection(db, 'settingReports'), orderBy('date', 'desc'));
    const unsubSetting = onSnapshot(settingQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSettingReports(data);
    });

    const salesQuery = query(getTenantCollection(db, 'salesReports'), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(salesQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSalesReports(data);
    });

    return () => {
      unsubCollab(); unsubLeads(); unsubCalendar(); unsubSetting(); unsubSales();
    };
  }, [navigate]);

  const calculateStats = (allLeads = []) => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.slice(0, 7) + '-01');

    const todayLeads = allLeads.filter(l => l.timestamp?.toDate().toISOString().split('T')[0] === today).length;
    const weekLeads = allLeads.filter(l => l.timestamp?.toDate() >= weekStart).length;
    const monthLeads = allLeads.filter(l => l.timestamp?.toDate() >= monthStart).length;

    setStats({ leadsToday: todayLeads, leadsWeek: weekLeads, leadsMonth: monthLeads });
  };

  const generateTempPassword = () => Math.random().toString(36).slice(-8) + '!';

  const handleAddCollaboratore = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Email non valida.');
      return;
    }

    const emailLower = newEmail.trim().toLowerCase();

    const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
    const tempAuth = getAuth(tempApp);
    const functions = getFunctions(undefined, 'europe-west1');

    try {
      let uid;
      let isNewUser = false;

      // 1. Controlla se esiste già in questo tenant
      const collabQuery = query(getTenantCollection(db, 'collaboratori'), where('email', '==', emailLower));
      const collabSnap = await getDocs(collabQuery);

      if (!collabSnap.empty) {
        uid = collabSnap.docs[0].id;
        const shouldUpdate = await confirmAction('Collaboratore già presente. Vuoi aggiornare i dati?');
        if (!shouldUpdate) {
          await deleteApp(tempApp);
          return;
        }
      } else {
        
        // 2. Controlla se l'utente Firebase esiste
        const getUidByEmail = httpsCallable(functions, 'getUidByEmail');
        const result = await getUidByEmail({ email: emailLower });
        
        if (result.data.uid) {
          uid = result.data.uid;
          isNewUser = false;
        } else {
          const tempPassword = generateTempPassword();
          const cred = await createUserWithEmailAndPassword(tempAuth, emailLower, tempPassword);
          uid = cred.user.uid;
          isNewUser = true;
          
          // Salva credenziali per mostrarle all'admin
          setNewCredentials({ email: emailLower, password: tempPassword });
        }
      }

      const collabData = {
        uid, 
        email: emailLower, 
        nome: emailLower.split('@')[0], 
        ruolo: newRole,
        firstLogin: isNewUser, 
        assignedAdmin: [auth.currentUser.uid],
        dailyReports: [], 
        tracker: {}, 
        personalPipeline: [],
      };

      await setDoc(getTenantDoc(db, 'collaboratori', uid), collabData, { merge: true });

      if (isNewUser) {
        // Mostra popup con credenziali
        setShowCredentialsPopup(true);
        setSuccess('Collaboratore creato! Copia le credenziali temporanee.');
      } else {
        // Per utenti esistenti, invia email reset
        await sendPasswordResetEmail(tempAuth, emailLower);
        setSuccess('Collaboratore riaggiunto! Email di reset inviata.');
      }
      
      setNewEmail('');
      setError('');
    } catch (err) {
      setError('Errore: ' + err.message);
      setSuccess('');
    } finally {
      await deleteApp(tempApp);
    }
  };



  const handleUpdateEmailAndSendReset = async () => {
    if (!editingCollab || !editEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      setError('Email non valida');
      return;
    }

    try {
      await updateDoc(getTenantDoc(db, 'collaboratori', editingCollab), {
        email: editEmail, nome: editEmail.split('@')[0]
      });

      const tempApp = initializeApp(firebaseConfig, `reset-${Date.now()}`);
      const tempAuth = getAuth(tempApp);
      await sendPasswordResetEmail(tempAuth, editEmail);

      setSuccess(`Inviato a ${editEmail}`);
      setEditingCollab(null);
      setEditEmail('');
      setTimeout(() => setSuccess(''), 4000);
      await deleteApp(tempApp);
    } catch (err) {
      setError('Errore: ' + err.message);
    }
  };

  const handleSaveReportSetting = async () => {
    const reportId = `admin_${reportSetting.date}`;
    try {
      await setDoc(getTenantDoc(db, 'settingReports', reportId), {
        ...reportSetting, uid: auth.currentUser.uid, timestamp: new Date()
      });
      setReportSetting({ ...reportSetting, followUpsFatti: '', dialedFatti: '', dialedRisposte: '', chiamatePrenotate: '' });
      setSuccess('Report Setting salvato!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Errore: ' + err.message);
    }
  };

  const handleSaveReportVendita = async () => {
    const reportId = `admin_${reportVendita.date}`;
    try {
      await setDoc(getTenantDoc(db, 'salesReports', reportId), {
        ...reportVendita, uid: auth.currentUser.uid, timestamp: new Date()
      });
      setReportVendita({ ...reportVendita, chiamateFissate: '', chiamateFatte: '', offersFatte: '', chiuse: '', cash: '' });
      setSuccess('Report Vendita salvato!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Errore: ' + err.message);
    }
  };

  const loadPastSettingReport = (report) => {
    setReportSetting({ date: report.date, ...report });
    setShowPastSetting(false);
  };

  const loadPastSalesReport = (report) => {
    setReportVendita({ date: report.date, ...report });
    setShowPastSales(false);
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead.id);
    setEditForm({
      name: lead.name || '',
      source: lead.source || '',
      email: lead.email || '',
      number: lead.number || '',
      note: lead.note || '',
      dataPrenotazione: lead.dataPrenotazione || '',
      oraPrenotazione: lead.oraPrenotazione || '',
      amount: lead.amount || '',
      mesi: lead.mesi || '',
      chiuso: lead.chiuso || false,
      showUp: lead.showUp || false,
      offer: lead.offer || false,
      riprenotato: lead.riprenotato || false,
      dialed: lead.dialed ?? 0,
      target: lead.target ?? false,
      settingCall: lead.settingCall ?? false,
    });
  };

  const handleSaveLeadEdit = async () => {
    if (!editingLead) return;

    try {
      const wasClosed = leads.find(l => l.id === editingLead)?.chiuso;
      const willBeClosed = editForm.chiuso;

      await updateDoc(getTenantDoc(db, 'leads', editingLead), editForm);

      if (willBeClosed && !wasClosed) {
        const lead = { ...leads.find(l => l.id === editingLead), ...editForm };
        setLeadToConvert(lead);
        setShowConvertPopup(true);
      } else {
        setSuccess('Lead aggiornato!');
        setTimeout(() => setSuccess(''), 3000);
      }

      setEditingLead(null);
      setEditForm({});
    } catch (err) {
      setError('Errore aggiornamento lead.');
    }
  };

  const handleCancelEdit = () => {
    setEditingLead(null);
    setEditForm({});
  };

  const handleDeleteLead = async (id) => {
    if (confirm('Eliminare questo lead?')) {
      try {
        await deleteDoc(getTenantDoc(db, 'leads', id));
        setSuccess('Lead eliminato!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Errore eliminazione lead.');
      }
    }
  };

  const handleDeleteCollaboratore = async (id) => {
    if (confirm('Eliminare?')) {
      try {
        await deleteDoc(getTenantDoc(db, 'collaboratori', id));
        setSuccess('Eliminato!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Errore eliminazione.');
      }
    }
  };

  const handleSyncLeadsToCalendar = async () => {
    if (!confirm('Sincronizzare tutti i lead con il calendario? Verranno creati eventi per i lead che non ne hanno ancora uno.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let created = 0;
      let skipped = 0;

      for (const lead of leads) {
        // Verifica che abbia i dati necessari
        if (!lead.name || !lead.dataPrenotazione || !lead.oraPrenotazione || !lead.collaboratoreId) {
          skipped++;
          continue;
        }

        try {
          // Usa l'ID del lead come parte dell'ID dell'evento per evitare duplicati
          // setDoc con merge non sovrascrive se esiste già
          const eventDocRef = getTenantDoc(db, 'calendarEvents', `lead_${lead.id}`);
          const eventDoc = await getDoc(eventDocRef);
          
          if (eventDoc.exists()) {
            skipped++;
            continue;
          }

          // Crea evento calendario
          await setDoc(eventDocRef, {
            title: `📞 ${lead.name}`,
            date: lead.dataPrenotazione,
            time: lead.oraPrenotazione,
            type: 'lead',
            durationMinutes: 30,
            leadId: lead.id,
            leadData: {
              name: lead.name,
              number: lead.number || '',
              email: lead.email || '',
              source: lead.source || '',
              note: lead.note || ''
            },
            createdBy: lead.collaboratoreId,
            participants: [lead.collaboratoreId],
            timestamp: new Date()
          });

          created++;
        } catch (err) {
          console.error(`Errore su lead ${lead.name}:`, err);
          skipped++;
        }
      }

      setSuccess(`✅ Sincronizzazione completata! Creati: ${created}, Già esistenti: ${skipped}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Errore sincronizzazione:', err);
      setError('Errore durante la sincronizzazione.');
    } finally {
      setLoading(false);
    }
  };

  // --- GENERA FASCE ORARIE PER IL COLLABORATORE SELEZIONATO ---
  const generateTimeSlots = (dateStr) => {
    setSelectedDate(dateStr);
    
    const slots = [];
    // Genera slot ogni 30 minuti dalle 8:00 alle 22:00
    for (let h = 8; h <= 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots.push(time);
      }
    }
    slots.push('22:00');

    const occupiedSlots = new Set();

    // Filtra lead dell'admin nella data
    const leadsOnDate = leads.filter(lead => 
      lead.dataPrenotazione === dateStr && 
      lead.collaboratoreId === auth.currentUser.uid
    );
    
    leadsOnDate.forEach(lead => {
      if (!lead.oraPrenotazione) return;
      const [hours, minutes] = lead.oraPrenotazione.split(':').map(Number);
      const duration = 30;
      let totalMinutes = hours * 60 + minutes;
      let startMinutes = Math.floor(totalMinutes / 30) * 30;
      const endMinutes = totalMinutes + duration;
      
      while (startMinutes < endMinutes) {
        const h = Math.floor(startMinutes / 60);
        const m = startMinutes % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        occupiedSlots.add(timeStr);
        startMinutes += 30;
      }
    });

    // Filtra eventi calendario dell'admin corrente
    const eventsOnDate = calendarEvents.filter(e => 
      e.date === dateStr && 
      (e.participants?.includes(auth.currentUser.uid) || e.createdBy === auth.currentUser.uid)
    );
    
    eventsOnDate.forEach(event => {
      if (!event.time) return;
      const [hours, minutes] = event.time.split(':').map(Number);
      const duration = event.durationMinutes || 30;
      let totalMinutes = hours * 60 + minutes;
      let startMinutes = Math.floor(totalMinutes / 30) * 30;
      const endMinutes = totalMinutes + duration;
      
      while (startMinutes < endMinutes) {
        const h = Math.floor(startMinutes / 60);
        const m = startMinutes % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        occupiedSlots.add(timeStr);
        startMinutes += 30;
      }
    });

    const freeSlots = slots.filter(slot => !occupiedSlots.has(slot));
    setAvailableSlots(freeSlots);
  };

  // --- SALVA LEAD (ADMIN) ---
  const handleSaveNewLead = async () => {
    if (!newLead.name || !newLead.number || !newLead.dataPrenotazione || !newLead.oraPrenotazione) {
      setError('Nome, numero, data e ora prenotazione sono obbligatori.');
      return;
    }

    try {
      const leadRef = doc(getTenantCollection(db, 'leads'));
      const leadId = leadRef.id;
      
      // Usa l'admin corrente
      const adminUid = auth.currentUser.uid;
      const adminName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Admin';
      
      await setDoc(leadRef, {
        name: newLead.name,
        number: newLead.number,
        email: newLead.email || '',
        source: newLead.source,
        note: newLead.note,
        dataPrenotazione: newLead.dataPrenotazione,
        oraPrenotazione: newLead.oraPrenotazione,
        collaboratoreId: adminUid,
        collaboratoreNome: adminName,
        chiuso: false,
        showUp: false,
        timestamp: new Date(),
        createdByAdmin: true,
      });

      // Crea automaticamente evento calendario
      await setDoc(doc(getTenantCollection(db, 'calendarEvents')), {
        title: `📞 ${newLead.name}`,
        date: newLead.dataPrenotazione,
        time: newLead.oraPrenotazione,
        type: 'lead',
        durationMinutes: 30,
        leadId: leadId,
        leadData: {
          name: newLead.name,
          number: newLead.number,
          email: newLead.email || '',
          source: newLead.source || '',
          note: newLead.note || ''
        },
        createdBy: adminUid,
        participants: [adminUid],
        timestamp: new Date()
      });

      setSuccess('✅ Lead salvato e aggiunto al calendario!');
      setTimeout(() => setSuccess(''), 3000);
      setNewLead({ name: '', source: '', number: '', note: '', email: '', dataPrenotazione: '', oraPrenotazione: '' });
      setSelectedDate(null);
      setAvailableSlots([]);
      setShowNewLead(false);
    } catch (err) {
      console.error('Errore salvataggio lead:', err);
      setError('Errore salvataggio lead.');
    }
  };

  const getSourceStats = () => {
    const stats = {};
    let totalLeads = 0;

    leads.forEach(l => {
      // Applica la mappatura se esiste
      const originalSrc = l.source || 'Sconosciuta';
      const src = sourceMapping[originalSrc] || originalSrc;
      if (!stats[src]) stats[src] = { total: 0, showUp: 0, chiuso: 0 };
      stats[src].total++;
      totalLeads++;
      if (l.showUp) stats[src].showUp++;
      if (l.chiuso) stats[src].chiuso++;
    });

    return Object.entries(stats).map(([source, data], i) => ({
      index: i + 1,
      source,
      total: data.total,
      totalPercentage: totalLeads > 0 ? ((data.total / totalLeads) * 100).toFixed(1) : '0.0',
      showUp: ((data.showUp / data.total) * 100).toFixed(1),
      chiusura: ((data.chiuso / data.total) * 100).toFixed(1),
    }));
  };

  const sourceStats = getSourceStats();

  // Helper per ottenere il nome del lead (supporta vari formati)
  const getLeadName = (lead) => {
    if (lead.nome && lead.cognome) return `${lead.nome} ${lead.cognome}`;
    if (lead.field_nome && lead.field_cognome) return `${lead.field_nome} ${lead.field_cognome}`;
    return lead.name || lead.nome || lead.field_nome || lead.email || '-';
  };

  const filteredLeads = leads.filter(lead => {
    const leadName = getLeadName(lead).toLowerCase();
    const matchesSearch = !searchQuery || leadName.includes(searchQuery.toLowerCase()) || 
                          lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChiuso = filters.chiuso === 'tutti' || (filters.chiuso === 'si' ? lead.chiuso : !lead.chiuso);
    const matchesShowUp = filters.showUp === 'tutti' || (filters.showUp === 'si' ? lead.showUp : !lead.showUp);
    const matchesOffer = filters.offer === 'tutti' || (filters.offer === 'si' ? lead.offer : !lead.offer);
    const matchesCollab = !selectedCollaboratore || lead.collaboratoreId === selectedCollaboratore;
    return matchesSearch && matchesChiuso && matchesShowUp && matchesOffer && matchesCollab;
  });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center text-red-500 p-4"><p>{error}</p><button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg">Torna</button></div>;
  if (!isAdmin) return null;

  return (
    <div className="mobile-container mobile-safe-bottom">
      <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* HEADER */}
        <motion.header className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4 sm:p-6 mx-3 sm:mx-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Team</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Users size={22} className="text-slate-400" /> Gestione Collaboratori
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <motion.button
                onClick={() => setShowNewLead(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                whileHover={{ scale: 1.02 }}
                title="Aggiungi nuovo lead"
              >
                <UserPlus size={16} /> Nuovo Lead
              </motion.button>
              <motion.button
                onClick={handleSyncLeadsToCalendar}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
                whileHover={{ scale: 1.02 }}
                title="Sincronizza lead esistenti con il calendario"
              >
                <CalendarIcon size={16} /> Sync Cal
              </motion.button>
              {isAdmin && (
                <motion.button
                  onClick={() => setShowFontiModal(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                  whileHover={{ scale: 1.02 }}
                  title="Gestisci fonti lead"
                >
                  <File size={16} /> Fonti
                </motion.button>
              )}
            </div>
          </div>
          
          {/* Add collaborator form */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-700/30">
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@esempio.com" className="px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm flex-1 focus:outline-none focus:border-blue-500/50" />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm">
              <option>Setter</option>
              <option>Marketing</option>
              <option>Vendita</option>
            </select>
            <motion.button onClick={handleAddCollaboratore} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Plus size={16} /> Aggiungi
            </motion.button>
          </div>
        </motion.header>

        {success && <p className="text-emerald-400 text-center text-sm bg-emerald-500/10 py-2 rounded-lg mx-3 sm:mx-6">{success}</p>}
        {error && <p className="text-red-400 text-center text-sm bg-red-500/10 py-2 rounded-lg mx-3 sm:mx-6">{error}</p>}

        <ReportStatus collaboratori={collaboratori} />

        {/* STATS LEADS - MOBILE */}
        <div className="mx-3 sm:mx-6">
          <div className="grid grid-cols-3 gap-3 lg:hidden">
            {[
              { label: 'Oggi', value: stats.leadsToday, color: 'emerald' },
              { label: 'Settimana', value: stats.leadsWeek, color: 'cyan' },
              { label: 'Mese', value: stats.leadsMonth, color: 'blue' },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                whileTap={{ scale: 0.98 }} 
                className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/30 text-center"
              >
                <p className={`text-2xl font-bold text-${stat.color}-400 mb-1`}>{stat.value}</p>
                <h3 className="text-xs font-medium text-slate-400">{stat.label}</h3>
              </motion.div>
            ))}
          </div>
        </div>

        {/* LAYOUT DESKTOP: STATS + CALENDARIO + ACTIONS */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 mx-3 sm:mx-6">
          {/* COLONNA SINISTRA: STATS VERTICALI */}
          <div className="lg:col-span-3 space-y-3">
            {[
              { label: 'Leads Oggi', value: stats.leadsToday, color: 'emerald' },
              { label: 'Leads Settimana', value: stats.leadsWeek, color: 'cyan' },
              { label: 'Leads Mese', value: stats.leadsMonth, color: 'blue' },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.02 }} 
                className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/30"
              >
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">{stat.label}</h3>
                <p className={`text-4xl font-bold text-${stat.color}-400`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* COLONNA CENTRALE: CALENDARIO */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <SimpleCalendar 
              reports={collaboratori.flatMap(c => c.dailyReports || [])} 
              collaboratori={collaboratori} 
              onDateClick={d => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                navigate(`/calendar-report/${year}-${month}-${day}`);
              }} 
            />
          </div>

          {/* COLONNA DESTRA: QUICK ACTIONS */}
          <div className="lg:col-span-3 space-y-3">
            <motion.button
              onClick={() => setShowReportSetting(true)}
              whileHover={{ scale: 1.03 }}
              className="w-full bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/30 hover:border-cyan-500/50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded bg-cyan-600/20">
                  <FileText size={18} className="text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold text-cyan-400">Setting</h3>
              </div>
              <p className="text-xs text-slate-400">Compila report</p>
            </motion.button>

            <motion.button
              onClick={() => setShowReportVendita(true)}
              whileHover={{ scale: 1.03 }}
              className="w-full bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/30 hover:border-rose-500/50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded bg-rose-600/20">
                  <DollarSign size={18} className="text-rose-400" />
                </div>
                <h3 className="text-sm font-bold text-rose-400">Vendita</h3>
              </div>
              <p className="text-xs text-slate-400">Compila report</p>
            </motion.button>

            <motion.button
              onClick={handleSyncLeadsToCalendar}
              whileHover={{ scale: 1.03 }}
              className="w-full bg-emerald-600/20 backdrop-blur-sm rounded-lg p-4 border border-emerald-600/30 hover:border-emerald-500/50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded bg-emerald-600/30">
                  <CalendarIcon size={18} className="text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-emerald-400">Sync</h3>
              </div>
              <p className="text-xs text-slate-400">Sincronizza leads</p>
            </motion.button>
          </div>
        </div>

        {/* CALENDARIO MOBILE - CENTRATO E COMPATTO */}
        <div className="lg:hidden mb-4 mx-3 sm:mx-6">
          <SimpleCalendar 
            reports={collaboratori.flatMap(c => c.dailyReports || [])} 
            collaboratori={collaboratori} 
            onDateClick={d => {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              navigate(`/calendar-report/${year}-${month}-${day}`);
            }} 
          />
        </div>

        {/* SEZIONI PRINCIPALI - GRID CARDS RESPONSIVE */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mx-3 sm:mx-6">
          {/* REPORT SETTING */}
          <button 
            onClick={() => setShowReportSetting(true)}
            className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4 lg:p-5 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all text-left"
          >
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-cyan-500/10 w-fit">
                <FileText size={20} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">Report Setting</h3>
                <p className="text-xs text-slate-400 mt-1 truncate">Follow-ups, Dialed</p>
              </div>
            </div>
          </button>

          {/* REPORT VENDITA */}
          <button 
            onClick={() => setShowReportVendita(true)}
            className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4 lg:p-5 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all text-left"
          >
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-rose-500/10 w-fit">
                <DollarSign size={20} className="text-rose-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">Report Vendita</h3>
                <p className="text-xs text-slate-400 mt-1 truncate">Chiamate, Offers</p>
              </div>
            </div>
          </button>

          {/* TABELLA LEADS */}
          <button 
            onClick={() => setShowLeadsTable(true)}
            className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4 lg:p-5 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all text-left"
          >
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 w-fit">
                <Users size={20} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">Tabella Leads</h3>
                <p className="text-xs text-slate-400 mt-1 truncate">{filteredLeads.length} leads</p>
              </div>
            </div>
          </button>

          {/* LEAD PER FONTE */}
          <button 
            onClick={() => setShowFontiStats(true)}
            className="bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4 lg:p-5 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all text-left"
          >
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10 w-fit">
                <File size={20} className="text-purple-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">Lead per Fonte</h3>
                <p className="text-xs text-slate-400 mt-1 truncate">{sourceStats.length} fonti</p>
              </div>
            </div>
          </button>
        </div>

        {/* COLLABORATORI - Full width */}
        <div className="mx-3 sm:mx-6">
          <button 
            onClick={() => setShowCollaboratoriList(true)}
            className="w-full bg-slate-800/20 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-4 lg:p-5 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 flex-shrink-0">
                <Users size={20} className="text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs lg:text-sm font-bold text-emerald-400 truncate">Gestione Collaboratori</h3>
                <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5 lg:mt-1 truncate">{collaboratori.length + admins.length} membri del team</p>
              </div>
            </div>
          </button>
        </div>

        {/* MODAL REPORT SETTING */}
        {showReportSetting && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-cyan-600/20">
                    <FileText size={18} className="text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-cyan-400">Report Setting</h3>
                </div>
                <button onClick={() => setShowReportSetting(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowPastSetting(!showPastSetting)} className="text-xs flex items-center gap-1 text-cyan-300 hover:text-cyan-100 px-2 py-1 rounded hover:bg-slate-700/50">
                  <Eye size={12} /> Storico
                </button>
              </div>
              
              {showPastSetting && (
                <div className="mb-3 p-2 bg-slate-900/50 border border-cyan-800/30 rounded max-h-32 overflow-y-auto text-xs">
                  {settingReports.length === 0 ? <p className="text-slate-400">Nessun report</p> : settingReports.map(r => (
                    <button key={r.id} onClick={() => loadPastSettingReport(r)} className="block w-full text-left p-2 hover:bg-cyan-900/30 rounded text-xs">
                      {r.date} → {r.chiamatePrenotate} prenotate
                    </button>
                  ))}
                </div>
              )}
              
              <div className="space-y-2 text-xs">
                <input type="date" value={reportSetting.date} onChange={e => setReportSetting({ ...reportSetting, date: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportSetting.followUpsFatti} onChange={e => setReportSetting({ ...reportSetting, followUpsFatti: e.target.value })} placeholder="Follow-ups" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportSetting.dialedFatti} onChange={e => setReportSetting({ ...reportSetting, dialedFatti: e.target.value })} placeholder="Dialed" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportSetting.dialedRisposte} onChange={e => setReportSetting({ ...reportSetting, dialedRisposte: e.target.value })} placeholder="Risposte" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportSetting.chiamatePrenotate} onChange={e => setReportSetting({ ...reportSetting, chiamatePrenotate: e.target.value })} placeholder="Prenotate" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <button onClick={handleSaveReportSetting} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-2.5 rounded text-sm font-medium hover:shadow-lg transition-shadow"><Check className="inline mr-1" size={14} /> Salva Report</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL REPORT VENDITA */}
        {showReportVendita && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-rose-600/20">
                    <DollarSign size={18} className="text-rose-400" />
                  </div>
                  <h3 className="text-lg font-bold text-rose-400">Report Vendita</h3>
                </div>
                <button onClick={() => setShowReportVendita(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowPastSales(!showPastSales)} className="text-xs flex items-center gap-1 text-rose-300 hover:text-rose-100 px-2 py-1 rounded hover:bg-slate-700/50">
                  <Eye size={12} /> Storico
                </button>
              </div>
              
              {showPastSales && (
                <div className="mb-3 p-2 bg-slate-900/50 border border-rose-800/30 rounded max-h-32 overflow-y-auto text-xs">
                  {salesReports.length === 0 ? <p className="text-slate-400">Nessun report</p> : salesReports.map(r => (
                    <button key={r.id} onClick={() => loadPastSalesReport(r)} className="block w-full text-left p-2 hover:bg-rose-900/30 rounded text-xs">
                      {r.date} → {r.chiuse} chiuse
                    </button>
                  ))}
                </div>
              )}
              
              <div className="space-y-2 text-xs">
                <input type="date" value={reportVendita.date} onChange={e => setReportVendita({ ...reportVendita, date: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportVendita.chiamateFissate} onChange={e => setReportVendita({ ...reportVendita, chiamateFissate: e.target.value })} placeholder="Fissate" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportVendita.chiamateFatte} onChange={e => setReportVendita({ ...reportVendita, chiamateFatte: e.target.value })} placeholder="Fatte" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportVendita.offersFatte} onChange={e => setReportVendita({ ...reportVendita, offersFatte: e.target.value })} placeholder="Warm" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportVendita.chiuse} onChange={e => setReportVendita({ ...reportVendita, chiuse: e.target.value })} placeholder="Chiuse" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <input type="number" value={reportVendita.cash} onChange={e => setReportVendita({ ...reportVendita, cash: e.target.value })} placeholder="Cash €" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded" />
                <button onClick={handleSaveReportVendita} className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white py-2.5 rounded text-sm font-medium hover:shadow-lg transition-shadow"><Check className="inline mr-1" size={14} /> Salva Report</button>
              </div>
            </motion.div>
          </div>
        )}


        
        {/* MODAL TABELLA LEADS */}
        {showLeadsTable && (
          <div className="fixed inset-0 lg:left-[260px] bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-6 max-w-5xl w-full border border-slate-700 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-blue-600/20">
                    <Users size={18} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200">Tabella Leads ({filteredLeads.length})</h3>
                </div>
                <button onClick={() => setShowLeadsTable(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 flex-shrink-0">
                  <div className="flex flex-wrap gap-1.5 text-xs w-full sm:w-auto">
                    <div className="flex items-center gap-1 bg-slate-700/50 rounded px-2 py-1 flex-1 sm:flex-none">
                      <Search size={12} className="text-slate-400" />
                      <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                        placeholder="Cerca..." 
                        className="bg-transparent outline-none w-full sm:w-24" 
                      />
                    </div>

                    <select 
                      value={selectedCollaboratore || ''}
                      onChange={e => { setSelectedCollaboratore(e.target.value || null); setCurrentPage(1); }}
                      className="bg-slate-700/50 border border-slate-600 rounded px-1.5 py-1 text-[10px] sm:text-xs flex-1 sm:flex-none"
                    >
                      <option value="">Tutti i Collaboratori</option>
                      {collaboratori.map(c => (
                        <option key={c.id} value={c.id}>{c.nome || c.name || c.email?.split('@')[0]}</option>
                      ))}
                    </select>

                    <select 
                      value={filters.chiuso} 
                      onChange={e => { setFilters({ ...filters, chiuso: e.target.value }); setCurrentPage(1); }} 
                      className="bg-slate-700/50 border border-slate-600 rounded px-1.5 py-1 text-[10px] sm:text-xs flex-1 sm:flex-none"
                    >
                      <option value="tutti">Chiuso: Tutti</option>
                      <option value="si">Chiuso: Sì</option>
                      <option value="no">Chiuso: No</option>
                    </select>

                    <select 
                      value={filters.showUp} 
                      onChange={e => { setFilters({ ...filters, showUp: e.target.value }); setCurrentPage(1); }} 
                      className="bg-slate-700/50 border border-slate-600 rounded px-1.5 py-1 text-[10px] sm:text-xs flex-1 sm:flex-none"
                    >
                      <option value="tutti">Show-Up: Tutti</option>
                      <option value="si">Show-Up: Sì</option>
                      <option value="no">Show-Up: No</option>
                    </select>

                    <select 
                      value={filters.offer} 
                      onChange={e => { setFilters({ ...filters, offer: e.target.value }); setCurrentPage(1); }} 
                      className="bg-slate-700/50 border border-slate-600 rounded px-1.5 py-1 text-[10px] sm:text-xs flex-1 sm:flex-none"
                    >
                      <option value="tutti">Warm: Tutti</option>
                      <option value="si">Warm: Sì</option>
                      <option value="no">Warm: No</option>
                    </select>
                  </div>
                </div>

                {/* TABELLA LEADS CON STATUS DINAMICI */}
                <div className="flex-1 min-h-0 overflow-auto">
                  <LeadsTable 
                    key={refreshKey}
                    leads={paginatedLeads} 
                    leadStatuses={leadStatuses}
                    columns={leadColumns}
                    onRefresh={() => setRefreshKey(prev => prev + 1)}
                    showConfig={false}
                  />
                </div>
                
                {/* Paginazione */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-3 mt-4 text-xs flex-shrink-0">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Pagina precedente"><ChevronLeft size={14} /></button>
                    <span className="text-slate-300 self-center">Pag {currentPage} di {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Pagina successiva"><ChevronRight size={14} /></button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}



        {/* MODAL LEAD PER FONTE */}
        {showFontiStats && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-6 max-w-2xl w-full border border-slate-700 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-purple-600/20">
                    <File size={18} className="text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-purple-400">Lead per Fonte</h3>
                </div>
                <button onClick={() => setShowFontiStats(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="text-xs text-slate-400 mb-4 p-3 bg-slate-900/50 rounded-lg">
                📊 <strong>% Totale</strong> = quota sul totale dei lead<br/>
                🟢 <strong>% Show-up</strong> = percentuale di presenze su lead fonte<br/>
                🔴 <strong>% Chiusura</strong> = percentuale di chiusure su lead fonte
              </div>
              
              <div className="overflow-y-auto flex-1">
                <div className="space-y-2 text-xs">
                  {sourceStats.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">Nessun lead</p>
                  ) : (
                    sourceStats.map(s => (
                      <div key={s.source} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700/70 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-cyan-400 font-bold text-lg">{s.index}.</span>
                          <span className="font-medium truncate">{s.source}</span>
                        </div>
                        <div className="flex gap-4 flex-shrink-0 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-blue-400 font-bold text-base">{s.totalPercentage}%</span>
                            <span className="text-[10px] text-slate-500">TOTALE</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-base">{s.total}</span>
                            <span className="text-[10px] text-slate-500">LEADS</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-green-400 font-bold text-base">{s.showUp}%</span>
                            <span className="text-[10px] text-slate-500">SHOW-UP</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-rose-400 font-bold text-base">{s.chiusura}%</span>
                            <span className="text-[10px] text-slate-500">CHIUSURA</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL COLLABORATORI */}
        {showCollaboratoriList && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-6 max-w-3xl w-full border border-slate-700 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-emerald-600/20">
                    <Users size={18} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-400">Gestione Collaboratori</h3>
                </div>
                <button onClick={() => setShowCollaboratoriList(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1">
                <div className="space-y-2">
                  {[...collaboratori, ...admins].map(c => {
                    const isCurrentUser = c.id === auth.currentUser?.uid;
                    const displayName = c.nome || c.email?.split('@')[0] || 'Sconosciuto';
                    const isSelected = selectedCollaboratore === c.id;
                    return (
                      <motion.div 
                        key={c.id} 
                        className={`p-3 bg-slate-700/50 rounded-lg border ${isSelected ? 'border-cyan-500' : 'border-slate-600'} flex justify-between items-center cursor-pointer hover:bg-slate-700/70 transition-colors`}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedCollaboratore(isSelected ? null : c.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200 truncate text-sm">{displayName} ({c.ruolo || c.role})</p>
                          <p className="text-slate-400 truncate text-xs">{c.email || '—'}</p>
                        </div>
                        {isAdmin && !isCurrentUser && (
                          <div className="flex gap-2 ml-2 flex-shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setEditingCollab(c.id); setEditEmail(c.email || ''); }} className="p-2 text-yellow-400 hover:bg-slate-600/50 rounded" aria-label="Modifica email"><Key size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm(`Elimina ${displayName}?`)) handleDeleteCollaboratore(c.id); }} className="p-2 text-red-400 hover:bg-slate-600/50 rounded" aria-label="Elimina collaboratore"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                {selectedCollaboratore && (
                  <button onClick={() => setSelectedCollaboratore(null)} className="mt-4 text-sm text-cyan-400 hover:underline">
                    ← Mostra tutti i leads
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* POPUP NOTE */}
        {showNotePopup && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-lg w-full border border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-slate-100">Nota Completa</h3>
                <button onClick={() => setShowNotePopup(false)} className="text-slate-400 hover:text-white" aria-label="Chiudi nota"><X size={18} /></button>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{currentNote}</p>
            </motion.div>
          </div>
        )}

        {/* POPUP CONVERTI IN CLIENTE */}
        {showConvertPopup && leadToConvert && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-700"
            >
              <h3 className="text-xl font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle size={24} /> Lead Chiuso!
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Vuoi aggiungere <strong>{leadToConvert.name}</strong> come nuovo cliente?
              </p>
              <div className="bg-slate-900/50 p-3 rounded-lg mb-4 text-xs space-y-1">
                <p><strong>Importo:</strong> €{leadToConvert.amount || 0}</p>
                <p><strong>Durata:</strong> {leadToConvert.mesi || 0} mesi</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConvertPopup(false);
                    setLeadToConvert(null);
                    setSuccess('Lead chiuso senza conversione.');
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  Solo Chiudi
                </button>
                <button
                  onClick={() => {
                    navigate('/new-client', {
                      state: {
                        prefill: {
                          name: leadToConvert.name || '',
                          email: leadToConvert.email || '',
                          phone: leadToConvert.number || '',
                          paymentAmount: leadToConvert.amount ? String(leadToConvert.amount) : '',
                          duration: leadToConvert.mesi ? String(leadToConvert.mesi) : '',
                          planType: 'completo',
                        }
                      }
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Crea Cliente
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* POPUP CREDENZIALI NUOVO COLLABORATORE */}
        {showCredentialsPopup && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-emerald-500"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle size={24} /> Collaboratore Creato!
                </h3>
                <button
                  onClick={() => {
                    setShowCredentialsPopup(false);
                    setNewCredentials({ email: '', password: '' });
                  }}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-slate-300 mb-4">
                Copia queste credenziali temporanee e inviale al collaboratore:
              </p>
              
              <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg mb-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={newCredentials.email}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newCredentials.email);
                        setSuccess('Email copiata!');
                        setTimeout(() => setSuccess(''), 2000);
                      }}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
                      title="Copia email"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Password Temporanea</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={newCredentials.password}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newCredentials.password);
                        setSuccess('Password copiata!');
                        setTimeout(() => setSuccess(''), 2000);
                      }}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
                      title="Copia password"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Email: ${newCredentials.email}\nPassword: ${newCredentials.password}`);
                    setSuccess('Credenziali copiate!');
                    setTimeout(() => setSuccess(''), 2000);
                  }}
                  className="w-full mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                >
                  📋 Copia Tutte le Credenziali
                </button>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-300">
                  <strong>ℹ️ Importante:</strong> Il collaboratore dovrà:
                </p>
                <ol className="text-xs text-blue-200 mt-2 ml-4 space-y-1 list-decimal">
                  <li>Accedere con queste credenziali</li>
                  <li>Impostare una password permanente al primo accesso</li>
                  <li>La password temporanea non funzionerà più dopo il cambio</li>
                </ol>
              </div>
              
              <button
                onClick={() => {
                  setShowCredentialsPopup(false);
                  setNewCredentials({ email: '', password: '' });
                }}
                className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-300 rounded-lg text-sm font-medium"
              >
                Chiudi
              </button>
            </motion.div>
          </div>
        )}

        {/* POPUP MODIFICA EMAIL */}
        {editingCollab && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full border border-slate-700">
              <h3 className="text-lg font-bold text-slate-100 mb-3">Modifica Email</h3>
              <p className="text-sm text-slate-300 mb-4">
                Nuova email per <strong>{collaboratori.find(c => c.id === editingCollab)?.nome || 'utente'}</strong>
              </p>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="nuova@email.it" className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm mb-4 focus:ring-1 focus:ring-yellow-500" />
              <div className="flex gap-3">
                <button onClick={handleUpdateEmailAndSendReset} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium">
                  Aggiorna e Invia
                </button>
                <button onClick={() => { setEditingCollab(null); setEditEmail(''); }} className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-300 py-2 rounded-lg text-sm font-medium">
                  Annulla
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL GESTIONE FONTI */}
        {showFontiModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-700 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100">Gestisci Fonti Lead</h3>
                <button
                  onClick={() => setShowFontiModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Aggiungi nuova fonte */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFonteName}
                    onChange={(e) => setNewFonteName(e.target.value)}
                    placeholder="Nome nuova fonte"
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={editingFonte ? updateFonte : addFonte}
                    disabled={!newFonteName.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium"
                  >
                    {editingFonte ? 'Modifica' : 'Aggiungi'}
                  </button>
                  {editingFonte && (
                    <button
                      onClick={() => { setEditingFonte(null); setNewFonteName(''); }}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-slate-300 rounded text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Lista fonti */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Fonti Attuali:</h4>
                {fonti.map((fonte, index) => (
                  <div key={fonte} className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-slate-600">
                    <span className="text-sm text-slate-200">{index + 1}. {getDisplayFonteName(fonte)}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditFonte(fonte)}
                        className="p-1 text-yellow-400 hover:text-yellow-300"
                        title="Modifica"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deleteFonte(fonte)}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Elimina"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowFontiModal(false)}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-300 rounded-lg text-sm font-medium"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL NUOVO LEAD (ADMIN) */}
        <AnimatePresence>
          {showNewLead && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }} 
                className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      <Phone className="text-blue-400" size={24} />
                      Nuovo Lead
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">Compila i dati del nuovo contatto</p>
                  </div>
                  <button 
                    onClick={() => setShowNewLead(false)} 
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 rounded-lg transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Nome - Full width */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nome Completo *
                    </label>
                    <input 
                      type="text" 
                      value={newLead.name} 
                      onChange={e => setNewLead({ ...newLead, name: e.target.value })} 
                      placeholder="Es: Mario Rossi" 
                      className="w-full p-3 sm:p-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Fonte e Numero - 2 colonne su desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fonte *
                      </label>
                      <select 
                        value={newLead.source} 
                        onChange={e => setNewLead({ ...newLead, source: e.target.value })} 
                        className="w-full p-3 sm:p-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Seleziona fonte</option>
                        {fonti.map(f => <option key={f} value={f}>{getDisplayFonteName(f)}</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Numero Telefono *
                      </label>
                      <input 
                        type="tel" 
                        value={newLead.number} 
                        onChange={e => setNewLead({ ...newLead, number: e.target.value })} 
                        placeholder="+39 123 456 7890" 
                        className="w-full p-3 sm:p-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email (opzionale)
                    </label>
                    <input 
                      type="email" 
                      value={newLead.email} 
                      onChange={e => setNewLead({ ...newLead, email: e.target.value })} 
                      placeholder="email@esempio.com" 
                      className="w-full p-3 sm:p-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Data e Ora con Picker Visuale */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Data e Ora Appuntamento *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDateTimePicker(true)}
                      className="w-full p-3 sm:p-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-slate-700/60 flex items-center justify-between"
                    >
                      {newLead.dataPrenotazione && newLead.oraPrenotazione ? (
                        <span className="text-white font-medium">
                          📅 {new Date(newLead.dataPrenotazione).toLocaleDateString('it-IT', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })} alle {newLead.oraPrenotazione}
                        </span>
                      ) : (
                        <span className="text-slate-500">Clicca per selezionare data e ora</span>
                      )}
                      <CalendarIcon size={20} className="text-blue-400" />
                    </button>
                  </div>

                  {/* Note - Full width */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Note (opzionale)
                    </label>
                    <textarea 
                      value={newLead.note} 
                      onChange={e => setNewLead({ ...newLead, note: e.target.value })} 
                      placeholder="Aggiungi note o informazioni aggiuntive..." 
                      className="w-full p-3 sm:p-4 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" 
                      rows="3"
                    />
                  </div>

                  {/* Pulsanti */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <motion.button 
                      onClick={() => setShowNewLead(false)}
                      className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white py-3 sm:py-4 rounded-xl font-medium transition-all border border-slate-600/50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Annulla
                    </motion.button>
                    <motion.button 
                      onClick={handleSaveNewLead} 
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 sm:py-4 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Save size={20} />
                      <span>Salva Lead</span>
                    </motion.button>
                  </div>

                  <p className="text-xs text-slate-500 text-center mt-2">
                    * Campi obbligatori
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PICKER DATA E ORA */}
        <AnimatePresence>
          {showDateTimePicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900/95 rounded-2xl border border-white/10 w-full max-w-lg flex flex-col max-h-[90vh] shadow-glow">
                {/* Header Fisso */}
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-white/10">
                  <h3 className="text-xl font-bold text-white">📅 Seleziona Data e Ora</h3>
                  <button onClick={() => setShowDateTimePicker(false)} className="text-white hover:text-rose-400" aria-label="Chiudi selettore data"><X size={24} /></button>
                </div>
                
                {/* Contenuto Scrollabile */}
                <div className="overflow-y-auto flex-1 p-6">
                  {/* Mini Calendario */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Seleziona il giorno:</h4>
                    <div className="grid grid-cols-7 gap-2">
                      {(() => {
                        const days = [];
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        for (let i = 0; i < 21; i++) {
                          const date = new Date(today);
                          date.setDate(today.getDate() + i);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          const isSelected = selectedDate === dateStr;
                          
                          days.push(
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => generateTimeSlots(dateStr)}
                              className={`p-2 rounded-lg text-center transition-all ${
                                isSelected 
                                  ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400' 
                                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                              }`}
                            >
                              <div className="text-xs">{date.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                              <div className="text-lg font-bold">{date.getDate()}</div>
                              <div className="text-xs">{date.toLocaleDateString('it-IT', { month: 'short' })}</div>
                            </button>
                          );
                        }
                        return days;
                      })()}
                    </div>
                  </div>

                  {/* Fasce Orarie */}
                  {selectedDate && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Seleziona l'orario: 
                        {availableSlots.length > 0 && (
                          <span className="ml-2 text-xs text-emerald-400">({availableSlots.length} slot liberi)</span>
                        )}
                      </h4>
                      <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                        {availableSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewLead({ 
                                ...newLead, 
                                dataPrenotazione: selectedDate, 
                                oraPrenotazione: slot 
                              });
                              setShowDateTimePicker(false);
                              setSelectedDate(null);
                            }}
                            className="p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-lg text-emerald-300 hover:bg-emerald-600/40 hover:border-emerald-400 transition-all font-medium"
                          >
                            {slot}
                          </button>
                        ))}
                        {availableSlots.length === 0 && (
                          <div className="col-span-4 text-center py-6">
                            <div className="text-amber-400 text-lg mb-2">⚠️</div>
                            <p className="text-slate-300 font-medium">Nessuna fascia oraria disponibile</p>
                            <p className="text-slate-400 text-sm mt-1">Tutti gli slot sono già occupati per questo giorno</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}