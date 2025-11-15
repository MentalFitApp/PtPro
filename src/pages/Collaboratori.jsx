import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
  doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc,
  where, getDocs
} from 'firebase/firestore';

import { db, auth, firebaseConfig } from '../firebase';

import { getFunctions, httpsCallable } from 'firebase/functions';

import { initializeApp, deleteApp } from 'firebase/app';

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail
} from 'firebase/auth';

import { 
  Users, Plus, Copy, TrendingUp, FileText, Phone, Check, AlertCircle, Edit, X, 
  BarChart3, Trash2, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, Key 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Calendar from './Calendar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 mb-4 border border-white/10">
      <h2 className="text-sm font-semibold text-slate-200 mb-3">Stato Report Oggi</h2>
      <p className="text-xs"><strong>Completati:</strong> {collaboratori.length - missingReports.length}</p>
      <p className="text-xs"><strong>Mancanti:</strong> {missingReports.length}</p>
      {missingReports.length > 0 && (
        <div className="mt-1">
          <p className="text-red-500 text-xs">Mancanti:</p>
          <ul className="list-disc pl-4 text-xs">
            {missingReports.map(name => <li key={name}>{name}</li>)}
          </ul>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-1">Nota: 2 report/giorno richiesti.</p>
    </motion.div>
  );
};

export default function Collaboratori() {
  const navigate = useNavigate();
  const [collaboratori, setCollaboratori] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [leads, setLeads] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newUid, setNewUid] = useState('');
  const [newRole, setNewRole] = useState('Setter');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    leadsToday: 0, leadsWeek: 0, leadsMonth: 0,
  });

  // EDIT EMAIL DOPO AGGIUNTA
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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterChiuso, setFilterChiuso] = useState('tutti');
  const [filterShowUp, setFilterShowUp] = useState('tutti');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const leadsPerPage = 10;

  const [salesPeriod, setSalesPeriod] = useState('oggi');
  const [settingPeriod, setSettingPeriod] = useState('oggi');

  // POPUP CLIENTE
  const [showClientPopup, setShowClientPopup] = useState(false);
  const [pendingClientLead, setPendingClientLead] = useState(null);

  // DATI REPORT DA FIRESTORE
  const [settingReports, setSettingReports] = useState([]);
  const [salesReports, setSalesReports] = useState([]);

  // VISUALIZZAZIONE REPORT PASSATI
  const [showPastSetting, setShowPastSetting] = useState(false);
  const [showPastSales, setShowPastSales] = useState(false);

  const fonti = [
    'Info Storie Prima e Dopo', 'Info Storie Promo', 'Info Reel', 'Inizio Reel',
    'Guida Maniglie', 'Guida Tartaruga', 'Guida 90', 'Altre Guide',
    'Guida Panettone',
    'DM Richiesta', 'Outreach Nuovi Followers', 'Outreach Vecchi Followers',
    'Follow-Ups', 'Facebook', 'TikTok', 'Referral'
  ];

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const checkAdmin = async () => {
      try {
        const adminDocRef = doc(db, 'roles', 'admins');
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          setError('Documento "roles/admins" non trovato. Crealo in Firestore e aggiungi gli UID manualmente.');
          setLoading(false);
          return;
        }

        const uids = adminDoc.data().uids || [];
        const isAdminUser = uids.includes(auth.currentUser.uid);

        if (isAdminUser) {
          setIsAdmin(true);
          setAdmins([{ id: auth.currentUser.uid, email: auth.currentUser.email, role: 'Admin' }]);
        } else {
          setError('Accesso negato: non sei admin.');
        }

        setLoading(false);
      } catch (err) {
        console.error('Errore verifica admin:', err);
        setError('Errore verifica permessi.');
        setLoading(false);
      }
    };

    checkAdmin();

    const collabQuery = query(collection(db, 'collaboratori'), orderBy('nome'));
    const unsubCollab = onSnapshot(collabQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCollaboratori(data);
    });

    const leadsQuery = query(collection(db, 'leads'), orderBy('timestamp', 'desc'));
    const unsubLeads = onSnapshot(leadsQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(data);
      calculateStats(data);
    });

    const settingQuery = query(collection(db, 'settingReports'), orderBy('date', 'desc'));
    const unsubSetting = onSnapshot(settingQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSettingReports(data);
    });

    const salesQuery = query(collection(db, 'salesReports'), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(salesQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSalesReports(data);
    });

    return () => {
      unsubCollab();
      unsubLeads();
      unsubSetting();
      unsubSales();
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

    setStats({
      leadsToday: todayLeads,
      leadsWeek: weekLeads,
      leadsMonth: monthLeads,
    });
  };

  const generateTempPassword = () => Math.random().toString(36).slice(-8) + '!';

  // === AGGIUNGI CON EMAIL (vecchia) ===
  const handleAddCollaboratore = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Email non valida.');
      return;
    }

    const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
    const tempAuth = getAuth(tempApp);
    const functions = getFunctions();

    try {
      let uid;
      let isNewUser = false;

      const collabQuery = query(collection(db, 'collaboratori'), where('email', '==', newEmail));
      const collabSnap = await getDocs(collabQuery);

      if (!collabSnap.empty) {
        uid = collabSnap.docs[0].id;
        const confirm = window.confirm(`Collaboratore già presente. Aggiornare?`);
        if (!confirm) {
          await deleteApp(tempApp);
          return;
        }
      } else {
        const getUidByEmail = httpsCallable(functions, 'getUidByEmail');
        const result = await getUidByEmail({ email: newEmail.trim().toLowerCase() });

        if (result.data.uid) {
          uid = result.data.uid;
          isNewUser = false;
        } else {
          const cred = await createUserWithEmailAndPassword(tempAuth, newEmail, generateTempPassword());
          uid = cred.user.uid;
          isNewUser = true;
        }
      }

      const collabData = {
        uid,
        email: newEmail,
        nome: newEmail.split('@')[0],
        ruolo: newRole,
        firstLogin: isNewUser,
        assignedAdmin: [auth.currentUser.uid],
        dailyReports: [],
        tracker: {},
        personalPipeline: [],
      };

      await setDoc(doc(db, 'collaboratori', uid), collabData, { merge: true });
      await sendPasswordResetEmail(tempAuth, newEmail);

      setSuccess(isNewUser ? `Nuovo collaboratore creato!` : `Collaboratore RIAGGIUNTO! Dati vecchi recuperati!`);
      setNewEmail('');
    } catch (err) {
      console.error('Errore:', err);
      setError('Errore: ' + (err.message || 'Operazione fallita'));
    } finally {
      await deleteApp(tempApp);
    }
  };

  // === AGGIUNGI CON UID DIRETTO (recupera se esiste in Auth) ===
  const handleAddByUid = async () => {
  if (!newUid || newUid.length < 20) {
    setError('Inserisci un UID valido (min 20 caratteri)');
    return;
  }

  try {
    const collabDoc = doc(db, 'collaboratori', newUid);
    const collabSnap = await getDoc(collabDoc);

    if (collabSnap.exists()) {
      const data = collabSnap.data();
      setEditingCollab(newUid);
      setEditEmail(data.email || '');
      setSuccess('Modifica email per inviare nuove credenziali');
      return;
    }

    // === PROVA A LEGGERE DA FIREBASE AUTH (SENZA ADMIN SDK) ===
    let realEmail = null;
    let isNewUser = false;

    try {
      // Usa API pubblica per verificare email (solo se esiste)
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: await auth.currentUser.getIdToken() })
      });
      const data = await response.json();
      const user = data.users?.[0];
      if (user?.uid === newUid) {
        realEmail = user.email;
      }
    } catch (authErr) {
      // Ignora errore: UID non trovato o non accessibile
    }

    // === SE NON TROVATO → USA EMAIL TEMPORANEA ===
    if (!realEmail) {
      realEmail = `uid_${newUid.slice(0, 8)}@recupero.com`;
      isNewUser = true;
    }

    // === AGGIUNGI IN FIRESTORE ===
    const collabData = {
      uid: newUid,
      email: realEmail,
      nome: realEmail.split('@')[0],
      ruolo: newRole,
      firstLogin: isNewUser,
      assignedAdmin: [auth.currentUser.uid],
      dailyReports: [],
      tracker: {},
      personalPipeline: [],
    };

    await setDoc(collabDoc, collabData, { merge: true });

    setSuccess(
      isNewUser 
        ? `Aggiunto con email temporanea: ${realEmail}` 
        : `Trovato! Email: ${realEmail}`
    );
    setNewUid('');

  } catch (err) {
    console.error(err);
    setError('Errore: ' + err.message);
  }
};

  // === MODIFICA EMAIL (SOLO FIRESTORE + RESET PASSWORD) ===
const handleUpdateEmailAndSendReset = async () => {
  if (!editingCollab || !editEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
    setError('Email non valida');
    return;
  }

  try {
    // 1. Aggiorna solo in Firestore
    await updateDoc(doc(db, 'collaboratori', editingCollab), {
      email: editEmail,
      nome: editEmail.split('@')[0]
    });

    // 2. Invia reset password alla nuova email
    const tempApp = initializeApp(firebaseConfig, `reset-${Date.now()}`);
    const tempAuth = getAuth(tempApp);
    await sendPasswordResetEmail(tempAuth, editEmail);

    setSuccess(`Credenziali inviate a ${editEmail}!`);
    setEditingCollab(null);
    setEditEmail('');
    setTimeout(() => setSuccess(''), 4000);

    await deleteApp(tempApp);
  } catch (err) {
    console.error(err);
    setError('Errore: ' + err.message);
  }
};

  const handleSaveReportSetting = async () => {
    const reportId = `admin_${reportSetting.date}`;
    try {
      await setDoc(doc(db, 'settingReports', reportId), {
        ...reportSetting,
        uid: auth.currentUser.uid,
        timestamp: new Date(),
      });
      setReportSetting({ 
        date: new Date().toISOString().split('T')[0], 
        followUpsFatti: '', 
        dialedFatti: '', 
        dialedRisposte: '', 
        chiamatePrenotate: '' 
      });
      setSuccess('Report Setting salvato!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Errore salvataggio report setting: ' + err.message);
    }
  };

  const handleSaveReportVendita = async () => {
    const reportId = `admin_${reportVendita.date}`;
    try {
      await setDoc(doc(db, 'salesReports', reportId), {
        ...reportVendita,
        uid: auth.currentUser.uid,
        timestamp: new Date(),
      });
      setReportVendita({ 
        date: new Date().toISOString().split('T')[0], 
        chiamateFissate: '', 
        chiamateFatte: '', 
        offersFatte: '', 
        chiuse: '', 
        cash: '' 
      });
      setSuccess('Report Vendita salvato!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Errore salvataggio report vendita: ' + err.message);
    }
  };

  const loadPastSettingReport = (report) => {
    setReportSetting({
      date: report.date,
      followUpsFatti: report.followUpsFatti || '',
      dialedFatti: report.dialedFatti || '',
      dialedRisposte: report.dialedRisposte || '',
      chiamatePrenotate: report.chiamatePrenotate || '',
    });
    setShowPastSetting(false);
  };

  const loadPastSalesReport = (report) => {
    setReportVendita({
      date: report.date,
      chiamateFissate: report.chiamateFissate || '',
      chiamateFatte: report.chiamateFatte || '',
      offersFatte: report.offersFatte || '',
      chiuse: report.chiuse || '',
      cash: report.cash || '',
    });
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
    });
  };

  const handleSaveLeadEdit = async () => {
    if (!editingLead) return;

    const wasClosed = leads.find(l => l.id === editingLead)?.chiuso;
    const willBeClosed = editForm.chiuso;

    try {
      await updateDoc(doc(db, 'leads', editingLead), editForm);
      setEditingLead(null);
      setEditForm({});
      setSuccess('Lead aggiornato!');

      if (!wasClosed && willBeClosed) {
        const lead = leads.find(l => l.id === editingLead);
        setPendingClientLead(lead);
        setShowClientPopup(true);
      }

      setTimeout(() => setSuccess(''), 3000);
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
        await deleteDoc(doc(db, 'leads', id));
        setSuccess('Lead eliminato!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Errore eliminazione lead.');
      }
    }
  };

  const handleDeleteCollaboratore = async (id) => {
    try {
      await deleteDoc(doc(db, 'collaboratori', id));
    } catch (err) {
      setError('Errore eliminazione.');
    }
  };

  const handleNavigateToDetail = (id) => {
    navigate('/collaboratore-detail', { state: { collaboratoreId: id } });
  };

  const getSourceStats = () => {
    const stats = {};
    leads.forEach(l => {
      const src = l.source || 'Sconosciuta';
      if (!stats[src]) stats[src] = { total: 0, showUp: 0, chiuso: 0 };
      stats[src].total++;
      if (l.showUp) stats[src].showUp++;
      if (l.chiuso) stats[src].chiuso++;
    });

    return Object.entries(stats).map(([source, data], i) => ({
      index: i + 1,
      source,
      total: data.total,
      showUp: ((data.showUp / data.total) * 100).toFixed(1),
      chiusura: ((data.chiuso / data.total) * 100).toFixed(1),
    }));
  };

  const sourceStats = getSourceStats();

  const getSetterStats = () => {
    return collaboratori
      .filter(c => c.ruolo === 'Setter')
      .map(c => {
        const setterLeads = leads.filter(l => l.collaboratoreId === c.id);
        const prenotati = setterLeads.length;
        const presentati = setterLeads.filter(l => l.showUp).length;
        return {
          name: c.nome || c.email?.split('@')[0] || 'Sconosciuto',
          prenotati,
          presentati,
        };
      });
  };

  const setterStats = getSetterStats();

  const setterChartConfig = {
    labels: setterStats.map(s => s.name),
    datasets: [
      {
        label: 'Prenotati',
        data: setterStats.map(s => s.prenotati),
        backgroundColor: 'rgba(251, 191, 36, 0.6)',
        borderColor: '#fbbf24',
        borderWidth: 1,
      },
      {
        label: 'Presentati',
        data: setterStats.map(s => s.presentati),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: '#22c55e',
        borderWidth: 1,
      }
    ]
  };

  const calculateSalesRatesByPeriod = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    let startDate, endDate;
    if (salesPeriod === 'oggi') {
      startDate = endDate = todayStr;
    } else if (salesPeriod === 'settimana') {
      startDate = weekStart.toISOString().split('T')[0];
      endDate = todayStr;
    } else if (salesPeriod === 'mese') {
      startDate = monthStart.toISOString().split('T')[0];
      endDate = todayStr;
    } else if (salesPeriod === 'anno') {
      startDate = yearStart.toISOString().split('T')[0];
      endDate = todayStr;
    }

    let chiamateFissate = 0, chiamateFatte = 0, offersFatte = 0, chiuse = 0;

    salesReports.forEach(report => {
      if (report.date < startDate || report.date > endDate) return;
      chiamateFissate += parseInt(report.chiamateFissate || 0);
      chiamateFatte += parseInt(report.chiamateFatte || 0);
      offersFatte += parseInt(report.offersFatte || 0);
      chiuse += parseInt(report.chiuse || 0);
    });

    const showUpRate = chiamateFissate > 0 ? ((chiamateFatte / chiamateFissate) * 100).toFixed(1) : '0.0';
    const warmRate = chiamateFatte > 0 ? ((offersFatte / chiamateFatte) * 100).toFixed(1) : '0.0';
    const closeRate = chiamateFatte > 0 ? ((chiuse / chiamateFatte) * 100).toFixed(1) : '0.0';

    return { chiamateFatte, showUpRate, warmRate, closeRate };
  };

  const { chiamateFatte, showUpRate, warmRate, closeRate } = calculateSalesRatesByPeriod();

  const calculateSettingStatsFromReports = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    let startDate, endDate;
    if (settingPeriod === 'oggi') {
      startDate = endDate = todayStr;
    } else if (settingPeriod === 'settimana') {
      startDate = weekStart.toISOString().split('T')[0];
      endDate = todayStr;
    } else if (settingPeriod === 'mese') {
      startDate = monthStart.toISOString().split('T')[0];
      endDate = todayStr;
    } else if (settingPeriod === 'anno') {
      startDate = yearStart.toISOString().split('T')[0];
      endDate = todayStr;
    }

    let followUps = 0, dialedFatti = 0, dialedRisposte = 0, chiamatePrenotate = 0;

    settingReports.forEach(report => {
      if (report.date < startDate || report.date > endDate) return;
      followUps += parseInt(report.followUpsFatti || 0);
      dialedFatti += parseInt(report.dialedFatti || 0);
      dialedRisposte += parseInt(report.dialedRisposte || 0);
      chiamatePrenotate += parseInt(report.chiamatePrenotate || 0);
    });

    const risposteRate = dialedFatti > 0 ? ((dialedRisposte / dialedFatti) * 100).toFixed(1) : '0.0';
    const prenotateRate = dialedRisposte > 0 ? ((chiamatePrenotate / dialedRisposte) * 100).toFixed(1) : '0.0';

    return { followUps, dialedFatti, risposteRate, prenotateRate };
  };

  const { followUps, dialedFatti, risposteRate, prenotateRate } = calculateSettingStatsFromReports();

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChiuso = filterChiuso === 'tutti' || (filterChiuso === 'si' ? lead.chiuso : !lead.chiuso);
    const matchesShowUp = filterShowUp === 'tutti' || (filterShowUp === 'si' ? lead.showUp : !lead.showUp);
    return matchesSearch && matchesChiuso && matchesShowUp;
  });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  const handleAddToClients = () => {
    if (!pendingClientLead) return;

    const clientData = {
      name: pendingClientLead.name || '',
      email: pendingClientLead.email || '',
      phone: pendingClientLead.number || '',
      planType: '',
      duration: pendingClientLead.mesi ? String(pendingClientLead.mesi) : '',
      paymentAmount: pendingClientLead.amount ? String(pendingClientLead.amount) : '',
      paymentMethod: '',
      customStartDate: new Date().toISOString().split('T')[0],
    };

    setShowClientPopup(false);
    setPendingClientLead(null);

    navigate('/new-client', { 
      state: { prefill: clientData },
      replace: true 
    });
  };

  const handleSkipClient = () => {
    setShowClientPopup(false);
    setPendingClientLead(null);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center text-red-500 p-4"><p>{error}</p><button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg">Torna</button></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

        {/* HEADER */}
        <motion.header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <Users size={24} /> Gestione
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="email@esempio.com"
              className="px-3 py-1.5 bg-zinc-950/40 border border-white/10 rounded text-xs w-full sm:w-40"
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="px-3 py-1.5 bg-zinc-950/40 border border-white/10 rounded text-xs w-full sm:w-28"
            >
              <option>Setter</option>
              <option>Marketing</option>
              <option>Vendita</option>
            </select>
            <motion.button
              onClick={handleAddCollaboratore}
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
            >
              <Plus size={14} /> Aggiungi
            </motion.button>
          </div>
        </motion.header>

        {copied && <p className="text-green-400 text-center text-xs">Istruzioni copiate!</p>}
        {success && <p className="text-green-500 text-center text-xs">{success}</p>}
        {error && <p className="text-red-500 text-center text-xs">{error}</p>}

        {/* === RIAGGIUNGI CON UID + MODIFICA EMAIL === */}
        <div className="mt-4 p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg border border-amber-500/30">
          <p className="text-xs font-bold text-amber-300 mb-2 text-center">
            RIAGGIUNGI CON UID + CAMBIA EMAIL
          </p>

          {!editingCollab ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newUid}
                onChange={(e) => setNewUid(e.target.value.trim())}
                placeholder="Inserisci UID (es. BavYpIH58cRT...)"
                className="flex-1 px-3 py-1.5 bg-zinc-950/40 border border-white/10 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-3 py-1.5 bg-zinc-950/40 border border-white/10 rounded text-xs"
              >
                <option>Setter</option>
                <option>Marketing</option>
                <option>Vendita</option>
              </select>
              <motion.button
                onClick={handleAddByUid}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded text-xs font-bold"
                whileHover={{ scale: 1.05 }}
              >
                <Key size={14} /> Cerca UID
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-amber-200">Modifica email per <strong>{editingCollab.slice(0, 12)}...</strong></p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="nuova@email.it"
                  className="flex-1 px-3 py-1.5 bg-zinc-950/40 border border-amber-500/50 rounded text-xs focus:ring-1 focus:ring-amber-500"
                />
                <motion.button
                  onClick={handleUpdateEmailAndSendReset}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  Invia Credenziali
                </motion.button>
                <motion.button
                  onClick={() => {
                    setEditingCollab(null);
                    setEditEmail('');
                  }}
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs"
                  whileHover={{ scale: 1.05 }}
                >
                  Annulla
                </motion.button>
              </div>
            </div>
          )}
        </div>

        <ReportStatus collaboratori={collaboratori} />

        {/* STATISTICHE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Oggi', leads: stats.leadsToday },
            { label: 'Settimana', leads: stats.leadsWeek },
            { label: 'Mese', leads: stats.leadsMonth },
          ].map((stat, i) => (
            <motion.div key={i} className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-slate-200">{stat.label}</h3>
              <p className="text-3xl font-bold text-green-500 mt-1">{stat.leads}</p>
              <p className="text-xs text-slate-400">Leads</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-6">
          <Calendar 
            reports={collaboratori.flatMap(c => c.dailyReports || [])} 
            collaboratori={collaboratori} 
            onDateClick={d => navigate(`/calendar-report/${d.toISOString().split('T')[0]}`)} 
          />
        </div>

        {/* REPORT SETTING & VENDITA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* REPORT SETTING */}
          <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-cyan-400">Report Setting</h2>
              <button
                onClick={() => setShowPastSetting(!showPastSetting)}
                className="text-xs flex items-center gap-1 text-cyan-300 hover:text-cyan-100"
              >
                <Eye size={12} /> Visualizza Report Passati
              </button>
            </div>

            {showPastSetting && (
              <div className="mb-3 p-2 bg-zinc-900/50 border border-cyan-800/30 rounded max-h-32 overflow-y-auto text-xs">
                {settingReports.length === 0 ? (
                  <p className="text-slate-400">Nessun report</p>
                ) : (
                  settingReports.map(r => (
                    <button
                      key={r.id}
                      onClick={() => loadPastSettingReport(r)}
                      className="block w-full text-left p-1 hover:bg-cyan-900/30 rounded"
                    >
                      {r.date} → {r.chiamatePrenotate} prenotate
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <input type="date" value={reportSetting.date} onChange={e => setReportSetting({ ...reportSetting, date: e.target.value })} className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportSetting.followUpsFatti} onChange={e => setReportSetting({ ...reportSetting, followUpsFatti: e.target.value })} placeholder="Follow-ups fatti" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportSetting.dialedFatti} onChange={e => setReportSetting({ ...reportSetting, dialedFatti: e.target.value })} placeholder="Dialed fatti" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportSetting.dialedRisposte} onChange={e => setReportSetting({ ...reportSetting, dialedRisposte: e.target.value })} placeholder="Dialed risposte" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportSetting.chiamatePrenotate} onChange={e => setReportSetting({ ...reportSetting, chiamatePrenotate: e.target.value })} placeholder="Chiamate prenotate" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <button onClick={handleSaveReportSetting} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-1.5 rounded text-xs">
                <Check className="inline mr-1" size={12} /> Salva
              </button>
            </div>
          </div>

          {/* REPORT VENDITA */}
          <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-rose-400">Report Vendita</h2>
              <button
                onClick={() => setShowPastSales(!showPastSales)}
                className="text-xs flex items-center gap-1 text-rose-300 hover:text-rose-100"
              >
                <Eye size={12} /> Visualizza Report Passati
              </button>
            </div>

            {showPastSales && (
              <div className="mb-3 p-2 bg-zinc-900/50 border border-rose-800/30 rounded max-h-32 overflow-y-auto text-xs">
                {salesReports.length === 0 ? (
                  <p className="text-slate-400">Nessun report</p>
                ) : (
                  salesReports.map(r => (
                    <button
                      key={r.id}
                      onClick={() => loadPastSalesReport(r)}
                      className="block w-full text-left p-1 hover:bg-rose-900/30 rounded"
                    >
                      {r.date} → {r.chiuse} chiuse ({r.cash}€)
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <input type="date" value={reportVendita.date} onChange={e => setReportVendita({ ...reportVendita, date: e.target.value })} className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiamateFissate} onChange={e => setReportVendita({ ...reportVendita, chiamateFissate: e.target.value })} placeholder="Chiamate fissate" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiamateFatte} onChange={e => setReportVendita({ ...reportVendita, chiamateFatte: e.target.value })} placeholder="Chiamate fatte" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.offersFatte} onChange={e => setReportVendita({ ...reportVendita, offersFatte: e.target.value })} placeholder="Offers fatte" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiuse} onChange={e => setReportVendita({ ...reportVendita, chiuse: e.target.value })} placeholder="Chiuse" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.cash} onChange={e => setReportVendita({ ...reportVendita, cash: e.target.value })} placeholder="Cash" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <button onClick={handleSaveReportVendita} className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white py-1.5 rounded text-xs">
                <Check className="inline mr-1" size={12} /> Salva
              </button>
            </div>
          </div>
        </div>

        {/* TABELLA LEADS */}
        <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-slate-200">Leads ({filteredLeads.length})</h2>
            <div className="flex flex-wrap gap-1 text-xs">
              <div className="flex items-center gap-1 bg-zinc-950/40 rounded px-2 py-1">
                <Search size={12} className="text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                  placeholder="Cerca..." 
                  className="bg-transparent outline-none w-24"
                />
              </div>
              <select value={filterChiuso} onChange={e => { setFilterChiuso(e.target.value); setCurrentPage(1); }} className="bg-zinc-950/40 border border-white/10 rounded px-2 py-1">
                <option value="tutti">Tutti</option>
                <option value="si">Chiusi</option>
                <option value="no">No</option>
              </select>
              <select value={filterShowUp} onChange={e => { setFilterShowUp(e.target.value); setCurrentPage(1); }} className="bg-zinc-950/40 border border-white/10 rounded px-2 py-1">
                <option value="tutti">Tutti</option>
                <option value="si">Sì</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-w-full rounded border border-white/10">
            <div className="min-w-[1500px] w-full">
              <table className="w-full text-xs text-left text-slate-400">
                <thead className="text-xs uppercase bg-zinc-950/40 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-center">Az</th>
                    <th className="px-2 py-1">Nome</th>
                    <th className="px-2 py-1">Fonte</th>
                    <th className="px-2 py-1">Email</th>
                    <th className="px-2 py-1">Num</th>
                    <th className="px-2 py-1">Data</th>
                    <th className="px-2 py-1">Setter</th>
                    <th className="px-2 py-1 text-center">Dialed</th>
                    <th className="px-2 py-1 text-center">Setting Call</th>
                    <th className="px-2 py-1 text-center">Show-Up</th>
                    <th className="px-2 py-1 text-center">Target</th>
                    <th className="px-2 py-1 text-center">Warm</th>
                    <th className="px-2 py-1 text-center">Closed</th>
                    <th className="px-2 py-1 text-center">€</th>
                    <th className="px-2 py-1 text-center">M</th>
                    <th className="px-2 py-1">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-white/10 hover:bg-zinc-950/20">
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Azioni</div>
                        {editingLead === lead.id ? (
                          <div className="flex gap-1 justify-center">
                            <button onClick={handleSaveLeadEdit} className="text-green-400"><Check size={12} /></button>
                            <button onClick={handleCancelEdit} className="text-red-400"><X size={12} /></button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => handleEditLead(lead)} className="text-cyan-400"><Edit size={12} /></button>
                            <button onClick={() => handleDeleteLead(lead.id)} className="text-red-400"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        {editingLead === lead.id ? (
                          <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full p-1 bg-zinc-950/40 border border-white/10 rounded text-xs" />
                        ) : <div className="max-w-[80px] truncate">{lead.name}</div>}
                      </td>
                      <td className="px-2 py-1">
                        {editingLead === lead.id ? (
                          <select value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })} className="w-full p-1 bg-zinc-950/40 border border-white/10 rounded text-xs">
                            <option value="">—</option>
                            {fonti.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        ) : <div className="max-w-[100px] truncate">{lead.source || '—'}</div>}
                      </td>
                      <td className="px-2 py-1 truncate max-w-[100px]">{lead.email || '—'}</td>
                      <td className="px-2 py-1">{lead.number}</td>
                      <td className="px-2 py-1">{lead.dataPrenotazione?.slice(5)} {lead.oraPrenotazione}</td>
                      <td className="px-2 py-1 truncate max-w-[70px]">{lead.collaboratoreNome}</td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Dialed</div>
                        {editingLead === lead.id ? (
                          <input type="number" min="0" value={editForm.dialed ?? 0} onChange={e => setEditForm({ ...editForm, dialed: parseInt(e.target.value) || 0 })} className="w-12 p-0.5 bg-zinc-950/40 border border-white/10 rounded text-xs text-center" />
                        ) : <div className="font-bold">{lead.dialed ?? 0}</div>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Setting Call</div>
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.riprenotato} onChange={e => setEditForm({ ...editForm, riprenotato: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.riprenotato ? 'text-green-400' : 'text-red-400'}`}>{lead.riprenotato ? 'Sì' : 'No'}</div>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Show-Up</div>
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.showUp} onChange={e => setEditForm({ ...editForm, showUp: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.showUp ? 'text-green-400' : 'text-red-400'}`}>{lead.showUp ? 'Sì' : 'No'}</div>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Target</div>
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.target} onChange={e => setEditForm({ ...editForm, target: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.target ? 'text-emerald-400' : 'text-gray-500'}`}>{lead.target ? 'Sì' : 'No'}</div>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Warm</div>
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.offer} onChange={e => setEditForm({ ...editForm, offer: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.offer ? 'text-green-400' : 'text-gray-400'}`}>{lead.offer ? 'Sì' : 'No'}</div>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Closed</div>
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.chiuso} onChange={e => setEditForm({ ...editForm, chiuso: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.chiuso ? 'text-green-400' : 'text-yellow-400'}`}>{lead.chiuso ? 'Sì' : 'No'}</div>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Importo</div>
                        {editingLead === lead.id ? (
                          <input type="number" min="0" step="0.01" value={editForm.amount || ''} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="w-16 p-0.5 bg-zinc-950/40 border border-white/10 rounded text-xs text-center" />
                        ) : <div className="font-bold">€{lead.amount || 0}</div>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Mesi</div>
                        {editingLead === lead.id ? (
                          <input type="number" min="0" value={editForm.mesi || ''} onChange={e => setEditForm({ ...editForm, mesi: e.target.value })} className="w-12 p-0.5 bg-zinc-950/40 border border-white/10 rounded text-xs text-center" />
                        ) : <div className="font-bold">{lead.mesi || 0}</div>}
                      </td>
                      <td className="px-2 py-1 max-w-[120px]">
                        <div className="text-[10px] text-slate-500">Note</div>
                        {editingLead === lead.id ? (
                          <input value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} className="w-full p-0.5 bg-zinc-950/40 border border-white/10 rounded text-xs" />
                        ) : <div className="truncate">{lead.note || '—'}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-3 text-xs">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 text-cyan-300 disabled:opacity-50"><ChevronLeft size={14} /></button>
              <span className="text-slate-300">Pag {currentPage}/{totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 text-cyan-300 disabled:opacity-50"><ChevronRight size={14} /></button>
            </div>
          )}
        </div>

        {/* PERCENTUALI VENDITA */}
        <div className="bg-gradient-to-br from-rose-900/40 to-purple-900/40 backdrop-blur-xl rounded-xl p-4 mb-4 border border-rose-500/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <TrendingUp size={20} /> Percentuali Vendita
            </h2>
            <select 
              value={salesPeriod} 
              onChange={e => setSalesPeriod(e.target.value)}
              className="bg-zinc-950/40 border border-white/10 rounded px-3 py-1.5 text-xs"
            >
              <option value="oggi">Oggi</option>
              <option value="settimana">Questa Settimana</option>
              <option value="mese">Questo Mese</option>
              <option value="anno">Questo Anno</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-center">
              <p className="text-rose-300">Call Fatte</p>
              <p className="text-2xl font-bold text-white">{chiamateFatte}</p>
            </div>
            <div className="text-center">
              <p className="text-green-300">Show-Up</p>
              <p className="text-2xl font-bold text-green-400">{showUpRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-300">Warm</p>
              <p className="text-2xl font-bold text-yellow-400">{warmRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-rose-300">Close</p>
              <p className="text-2xl font-bold text-rose-400">{closeRate}%</p>
            </div>
          </div>
        </div>

        {/* STATISTICHE SETTING */}
        <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-xl rounded-xl p-4 mb-4 border border-cyan-500/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
              <TrendingUp size={20} /> Statistiche Setting
            </h2>
            <select 
              value={settingPeriod} 
              onChange={e => setSettingPeriod(e.target.value)}
              className="bg-zinc-950/40 border border-white/10 rounded px-3 py-1.5 text-xs"
            >
              <option value="oggi">Oggi</option>
              <option value="settimana">Questa Settimana</option>
              <option value="mese">Questo Mese</option>
              <option value="anno">Questo Anno</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-center">
              <p className="text-cyan-300">Follow-ups</p>
              <p className="text-2xl font-bold text-white">{followUps}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-300">Dialed</p>
              <p className="text-2xl font-bold text-blue-400">{dialedFatti}</p>
            </div>
            <div className="text-center">
              <p className="text-green-300">Risposte</p>
              <p className="text-2xl font-bold text-green-400">{risposteRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-rose-300">Prenotate</p>
              <p className="text-2xl font-bold text-rose-400">{prenotateRate}%</p>
            </div>
          </div>
        </div>

        {/* LEAD PER FONTE */}
        <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 mb-4 border border-white/10">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Lead per Fonte</h2>
          <div className="space-y-1 text-xs">
            {sourceStats.length === 0 ? (
              <p className="text-slate-400">Nessun lead</p>
            ) : (
              sourceStats.map(s => (
                <div key={s.source} className="flex justify-between items-center p-2 bg-zinc-950/40 rounded border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{s.index}.</span>
                    <span className="truncate max-w-[120px]">{s.source}</span>
                  </div>
                  <div className="flex gap-3">
                    <span><strong>{s.total}</strong></span>
                    <span className="text-green-400"><strong>{s.showUp}%</strong></span>
                    <span className="text-rose-400"><strong>{s.chiusura}%</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* GRAFICO SETTER */}
        <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 mb-4 border border-white/10">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1">
            <BarChart3 size={16} /> Setter
          </h2>
          <div className="h-48">
            <Bar data={setterChartConfig} options={{ responsive: true, plugins: { legend: { labels: { font: { size: 10 } } } }, scales: { y: { beginAtZero: true, ticks: { font: { size: 9 } } } } }} />
          </div>
        </div>

        {/* COLLABORATORI CON PULSANTE MODIFICA EMAIL */}
        <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Collaboratori</h2>
          <div className="space-y-2 text-xs">
            {[...collaboratori, ...admins].map(c => {
              const isCurrentUser = c.id === auth.currentUser?.uid;
              const displayName = c.nome || c.email?.split('@')[0] || 'Sconosciuto';
              return (
                <motion.div
                  key={c.id}
                  className="p-2 bg-zinc-950/40 rounded border border-white/10 flex justify-between items-center"
                  whileHover={{ scale: 1.02 }}
                >
                  <div 
                    onClick={() => isCurrentUser ? navigate('/dashboard') : handleNavigateToDetail(c.id)}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium text-slate-200">{displayName} ({c.ruolo || c.role})</p>
                    <p className="text-slate-400 truncate">{c.email || '—'}</p>
                  </div>
                  {isAdmin && !isCurrentUser && (
                    <div className="flex gap-1 ml-2">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditingCollab(c.id);
                          setEditEmail(c.email || '');
                        }} 
                        className="p-1 text-yellow-400"
                        title="Modifica email e invia credenziali"
                      >
                        <Key size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); navigate('/collaboratore-detail', { state: { collaboratoreId: c.id, editRole: true } }); }} className="p-1 text-cyan-400">
                        <Edit size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Elimina ${displayName}?`)) handleDeleteCollaboratore(c.id); }} className="p-1 text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* POPUP MODIFICA EMAIL */}
        {editingCollab && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-950/90 rounded-xl p-6 max-w-sm w-full border border-white/10"
            >
              <h3 className="text-lg font-bold text-slate-100 mb-3">Modifica Email</h3>
              <p className="text-sm text-slate-300 mb-4">
                Nuova email per <strong>{collaboratori.find(c => c.id === editingCollab)?.nome || 'utente'}</strong>
              </p>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="nuova@email.it"
                className="w-full px-3 py-2 bg-zinc-950/40 border border-white/10 rounded text-sm mb-4 focus:ring-1 focus:ring-yellow-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateEmailAndSendReset}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Aggiorna e Invia
                </button>
                <button
                  onClick={() => {
                    setEditingCollab(null);
                    setEditEmail('');
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-slate-300 py-2 rounded-lg text-sm font-medium"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* POPUP AGGIUNGI CLIENTE */}
        {showClientPopup && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-950/90 rounded-xl p-6 max-w-sm w-full border border-white/10"
            >
              <h3 className="text-lg font-bold text-slate-100 mb-3">Lead Chiuso!</h3>
              <p className="text-sm text-slate-300 mb-4">
                Vuoi aggiungere <strong>{pendingClientLead?.name}</strong> alla lista clienti?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleAddToClients}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Sì, Aggiungi
                </button>
                <button
                  onClick={handleSkipClient}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-slate-300 py-2 rounded-lg text-sm font-medium"
                >
                  No, Salta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}