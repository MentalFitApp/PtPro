import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Users, Plus, Copy, TrendingUp, FileText, Phone, Check, AlertCircle, Edit, X, 
  BarChart3, Trash2, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
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
    }).map(c => c.name || c.email.split('@')[0]);
    setMissingReports(missing);
  }, [collaboratori]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950/60 backdrop-blur-xl rounded-xl p-4 mb-4 border border-white/10">
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
  const [newRole, setNewRole] = useState('Setter');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    leadsToday: 0, leadsWeek: 0, leadsMonth: 0,
  });

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

  // DATI SETTING DA FIRESTORE
  const [settingReports, setSettingReports] = useState([]);

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

    const collabQuery = query(collection(db, 'collaboratori'), orderBy('name'));
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

    // MODIFICA: usa dati completi
    const settingQuery = query(collection(db, 'settingReports'), orderBy('date', 'desc'));
    const unsubSetting = onSnapshot(settingQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSettingReports(data);
    });

    return () => {
      unsubCollab();
      unsubLeads();
      unsubSetting();
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

  const handleAddCollaboratore = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Email non valida.');
      return;
    }

    const tempPwd = generateTempPassword();
    const tempApp = initializeApp(firebaseConfig, `collab-creation-${Date.now()}`);
    const tempAuth = getAuth(tempApp);

    try {
      const cred = await createUserWithEmailAndPassword(tempAuth, newEmail, tempPwd);
      const uid = cred.user.uid;

      await setDoc(doc(db, 'collaboratori', uid), {
        uid,
        email: newEmail,
        name: newEmail.split('@')[0],
        role: newRole,
        firstLogin: true,
        tempPassword: tempPwd,
        assignedAdmin: [auth.currentUser.uid],
        dailyReports: [],
        tracker: {},
        personalPipeline: [],
      });

      const msg = `Benvenuto!\nEmail: ${newEmail}\nPassword: ${tempPwd}\nLink: https://mentalfitapp.github.io/PtPro/#/collaboratore-login`;
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
      setNewEmail('');
      setError('');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email già in uso.' : 'Errore: ' + err.message);
    } finally {
      await deleteApp(tempApp);
    }
  };

  // MODIFICA: ID manuale per evitare duplicati
  const handleSaveReportSetting = async () => {
    const reportId = `admin_${reportSetting.date}`; // Unico per giorno
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
    try {
      await setDoc(doc(collection(db, 'salesReports')), reportVendita);
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
      setError('Errore salvataggio report vendita.');
    }
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
      if (!stats[src]) {
        stats[src] = { total: 0, showUp: 0, chiuso: 0 };
      }
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
      .filter(c => c.role === 'Setter')
      .map(c => {
        const setterLeads = leads.filter(l => l.collaboratoreId === c.id);
        const prenotati = setterLeads.length;
        const presentati = setterLeads.filter(l => l.showUp).length;
        return {
          name: c.name || c.email.split('@')[0],
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

    let callsFatte = 0;
    let showUpCount = 0;
    let offerCount = 0;
    let closeCount = 0;

    collaboratori.forEach(collab => {
      if (collab.role !== 'Vendita') return;
      (collab.dailyReports || []).forEach(report => {
        if (report.date < startDate || report.date > endDate) return;
        const calls = parseInt(report.tracker?.callFatte || 0);
        callsFatte += calls;
      });
    });

    leads.forEach(lead => {
      const leadDate = lead.dataPrenotazione;
      if (!leadDate || leadDate < startDate || leadDate > endDate) return;
      if (lead.showUp) showUpCount++;
      if (lead.offer) offerCount++;
      if (lead.chiuso) closeCount++;
    });

    const showUpRate = callsFatte > 0 ? ((showUpCount / callsFatte) * 100).toFixed(1) : '0.0';
    const offerRate = showUpCount > 0 ? ((offerCount / showUpCount) * 100).toFixed(1) : '0.0';
    const closeRate = offerCount > 0 ? ((closeCount / offerCount) * 100).toFixed(1) : '0.0';

    return { callsFatte, showUpRate, offerRate, closeRate };
  };

  const { callsFatte, showUpRate, offerRate, closeRate } = calculateSalesRatesByPeriod();

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

    let followUps = 0;
    let dialedFatti = 0;
    let dialedRisposte = 0;
    let chiamatePrenotate = 0;

    settingReports.forEach(report => {
      if (report.date < startDate || report.date > endDate) return;
      followUps += parseInt(report.followUpsFatti || 0);
      dialedFatti += parseInt(report.dialedFatti || 0);
      dialedRisposte += parseInt(report.dialedRisposte || 0);
      chiamatePrenotate += parseInt(report.chiamatePrenotate || 0);
    });

    const risposteRate = dialedFatti > 0 ? ((dialedRisposte / dialedFatti) * 100).toFixed(1) : '0.0';
    const prenotateRate = followUps > 0 ? ((chiamatePrenotate / followUps) * 100).toFixed(1) : '0.0';

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
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 overflow-x-hidden">
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
              className="px-3 py-1.5 bg-zinc-900/70 border border-white/10 rounded text-xs w-full sm:w-40"
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="px-3 py-1.5 bg-zinc-900/70 border border-white/10 rounded text-xs w-full sm:w-28"
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

        {copied && <p className="text-green-400 text-center text-xs">Credenziali copiate!</p>}

        <ReportStatus collaboratori={collaboratori} />

        {/* STATISTICHE - SOLO LEADS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Oggi', leads: stats.leadsToday },
            { label: 'Settimana', leads: stats.leadsWeek },
            { label: 'Mese', leads: stats.leadsMonth },
          ].map((stat, i) => (
            <motion.div key={i} className="bg-zinc-950/60 backdrop-blur-xl rounded-xl p-4 border border-white/10">
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
          <div className="bg-zinc-950/60 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <h2 className="text-sm font-semibold text-cyan-400 mb-3">Report Setting</h2>
            <div className="space-y-2 text-xs">
              <input type="date" value={reportSetting.date} onChange={e => setReportSetting({ ...reportSetting, date: e.target.value })} className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportSetting.followUpsFatti} onChange={e => setReportSetting({ ...reportSetting, followUpsFatti: e.target.value })} placeholder="Follow-ups fatti" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportSetting.dialedFatti} onChange={e => setReportSetting({ ...reportSetting, dialedFatti: e.target.value })} placeholder="Dialed fatti" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportSetting.dialedRisposte} onChange={e => setReportSetting({ ...reportSetting, dialedRisposte: e.target.value })} placeholder="Dialed risposte" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportSetting.chiamatePrenotate} onChange={e => setReportSetting({ ...reportSetting, chiamatePrenotate: e.target.value })} placeholder="Chiamate prenotate" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <button onClick={handleSaveReportSetting} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-1.5 rounded text-xs">
                <Check className="inline mr-1" size={12} /> Salva
              </button>
            </div>
          </div>

          {/* REPORT VENDITA */}
          <div className="bg-zinc-950/60 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <h2 className="text-sm font-semibold text-rose-400 mb-3">Report Vendita</h2>
            <div className="space-y-2 text-xs">
              <input type="date" value={reportVendita.date} onChange={e => setReportVendita({ ...reportVendita, date: e.target.value })} className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiamateFissate} onChange={e => setReportVendita({ ...reportVendita, chiamateFissate: e.target.value })} placeholder="Chiamate fissate" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiamateFatte} onChange={e => setReportVendita({ ...reportVendita, chiamateFatte: e.target.value })} placeholder="Chiamate fatte" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportVendita.offersFatte} onChange={e => setReportVendita({ ...reportVendita, offersFatte: e.target.value })} placeholder="Offers fatte" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiuse} onChange={e => setReportVendita({ ...reportVendita, chiuse: e.target.value })} placeholder="Chiuse" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <input type="number" value={reportVendita.cash} onChange={e => setReportVendita({ ...reportVendita, cash: e.target.value })} placeholder="Cash" className="w-full p-1.5 bg-zinc-900/70 border border-white/10 rounded" />
              <button onClick={handleSaveReportVendita} className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white py-1.5 rounded text-xs">
                <Check className="inline mr-1" size={12} /> Salva
              </button>
            </div>
          </div>
        </div>

        {/* TABELLA LEADS – AZIONI ALL'INIZIO */}
        <div className="bg-zinc-950/60 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-slate-200">Leads ({filteredLeads.length})</h2>
            <div className="flex flex-wrap gap-1 text-xs">
              <div className="flex items-center gap-1 bg-zinc-900/70 rounded px-2 py-1">
                <Search size={12} className="text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                  placeholder="Cerca..." 
                  className="bg-transparent outline-none w-24"
                />
              </div>
              <select value={filterChiuso} onChange={e => { setFilterChiuso(e.target.value); setCurrentPage(1); }} className="bg-zinc-900/70 border border-white/10 rounded px-2 py-1">
                <option value="tutti">Tutti</option>
                <option value="si">Chiusi</option>
                <option value="no">No</option>
              </select>
              <select value={filterShowUp} onChange={e => { setFilterShowUp(e.target.value); setCurrentPage(1); }} className="bg-zinc-900/70 border border-white/10 rounded px-2 py-1">
                <option value="tutti">Tutti</option>
                <option value="si">Sì</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-w-full rounded border border-white/10">
            <div className="min-w-[1500px] w-full">
              <table className="w-full text-xs text-left text-slate-400">
                <thead className="text-xs uppercase bg-zinc-900/50 sticky top-0">
                  <tr>
                    {/* AZIONI ALL'INIZIO */}
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
                    <th className="px-2 py-1 text-center">Offer</th>
                    <th className="px-2 py-1 text-center">Closed</th>
                    <th className="px-2 py-1 text-center">€</th>
                    <th className="px-2 py-1 text-center">M</th>
                    <th className="px-2 py-1">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-white/10 hover:bg-zinc-900/50">
                      {/* AZIONI ALL'INIZIO */}
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
                          <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full p-1 bg-zinc-800 border border-white/10 rounded text-xs" />
                        ) : <div className="max-w-[80px] truncate">{lead.name}</div>}
                      </td>
                      <td className="px-2 py-1">
                        {editingLead === lead.id ? (
                          <select value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })} className="w-full p-1 bg-zinc-800 border border-white/10 rounded text-xs">
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
                          <input type="number" min="0" value={editForm.dialed ?? 0} onChange={e => setEditForm({ ...editForm, dialed: parseInt(e.target.value) || 0 })} className="w-12 p-0.5 bg-zinc-800 border border-white/10 rounded text-xs text-center" />
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
                        <div className="text-[10px] text-slate-500">Offer</div>
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
                          <input type="number" min="0" step="0.01" value={editForm.amount || ''} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="w-16 p-0.5 bg-zinc-800 border border-white/10 rounded text-xs text-center" />
                        ) : <div className="font-bold">€{lead.amount || 0}</div>}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <div className="text-[10px] text-slate-500">Mesi</div>
                        {editingLead === lead.id ? (
                          <input type="number" min="0" value={editForm.mesi || ''} onChange={e => setEditForm({ ...editForm, mesi: e.target.value })} className="w-12 p-0.5 bg-zinc-800 border border-white/10 rounded text-xs text-center" />
                        ) : <div className="font-bold">{lead.mesi || 0}</div>}
                      </td>
                      <td className="px-2 py-1 max-w-[120px]">
                        <div className="text-[10px] text-slate-500">Note</div>
                        {editingLead === lead.id ? (
                          <input value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} className="w-full p-0.5 bg-zinc-800 border border-white/10 rounded text-xs" />
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

        {/* RESTO DEL CODICE IDENTICO... */}
        {/* (Percentuali Vendita, Statistiche Setting, Lead per Fonte, Grafico Setter, Collaboratori, Popup) */}
        {/* ...non modificato... */}

        {/* PERCENTUALI VENDITA */}
        <div className="bg-gradient-to-br from-rose-900/40 to-purple-900/40 backdrop-blur-xl rounded-xl p-4 mb-4 border border-rose-500/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <TrendingUp size={20} /> Percentuali Vendita
            </h2>
            <select 
              value={salesPeriod} 
              onChange={e => setSalesPeriod(e.target.value)}
              className="bg-zinc-900/70 border border-white/10 rounded px-3 py-1.5 text-xs"
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
              <p className="text-2xl font-bold text-white">{callsFatte}</p>
            </div>
            <div className="text-center">
              <p className="text-green-300">Show-Up</p>
              <p className="text-2xl font-bold text-green-400">{showUpRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-300">Offer</p>
              <p className="text-2xl font-bold text-yellow-400">{offerRate}%</p>
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
              className="bg-zinc-900/70 border border-white/10 rounded px-3 py-1.5 text-xs"
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
        <div className="bg-zinc-950/60 backdrop-blur-xl rounded-xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Lead per Fonte</h2>
          <div className="space-y-1 text-xs">
            {sourceStats.length === 0 ? (
              <p className="text-slate-400">Nessun lead</p>
            ) : (
              sourceStats.map(s => (
                <div key={s.source} className="flex justify-between items-center p-2 bg-zinc-900/70 rounded border border-white/10">
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
        <div className="bg-zinc-950/60 backdrop-blur-xl rounded-xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1">
            <BarChart3 size={16} /> Setter
          </h2>
          <div className="h-48">
            <Bar data={setterChartConfig} options={{ responsive: true, plugins: { legend: { labels: { font: { size: 10 } } } }, scales: { y: { beginAtZero: true, ticks: { font: { size: 9 } } } } }} />
          </div>
        </div>

        {/* COLLABORATORI */}
        <div className="bg-zinc-950/60 backdrop-blur-xl rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Collaboratori</h2>
          <div className="space-y-2 text-xs">
            {[...collaboratori, ...admins].map(c => {
              const isCurrentUser = c.id === auth.currentUser?.uid;
              return (
                <motion.div
                  key={c.id}
                  className="p-2 bg-zinc-900/70 rounded border border-white/10 flex justify-between items-center"
                  whileHover={{ scale: 1.02 }}
                >
                  <div 
                    onClick={() => isCurrentUser ? navigate('/dashboard') : handleNavigateToDetail(c.id)}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium text-slate-200">{c.name || c.email.split('@')[0]} ({c.role})</p>
                    <p className="text-slate-400 truncate">{c.email}</p>
                  </div>
                  {isAdmin && !isCurrentUser && (
                    <div className="flex gap-1 ml-2">
                      <button onClick={(e) => { e.stopPropagation(); navigate('/collaboratore-detail', { state: { collaboratoreId: c.id, editRole: true } }); }} className="p-1 text-cyan-400">
                        <Edit size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Elimina ${c.name || c.email}?`)) handleDeleteCollaboratore(c.id); }} className="p-1 text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {success && <p className="text-green-500 text-center text-xs">{success}</p>}
        {error && <p className="text-red-500 text-center text-xs">{error}</p>}

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