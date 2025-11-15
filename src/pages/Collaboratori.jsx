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
  Users, Plus, Key, Trash2, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, 
  Edit, X, Check, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import Calendar from './Calendar';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ leadsToday: 0, leadsWeek: 0, leadsMonth: 0 });

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

  const fonti = [
    'Info Storie Prima e Dopo', 'Info Storie Promo', 'Info Reel', 'Inizio Reel',
    'Guida Maniglie', 'Guida Tartaruga', 'Guida 90', 'Altre Guide',
    'Guida Panettone', 'DM Richiesta', 'Outreach Nuovi Followers', 'Outreach Vecchi Followers',
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
      unsubCollab(); unsubLeads(); unsubSetting(); unsubSales();
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
        if (!window.confirm(`Collaboratore già presente. Aggiornare?`)) {
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
        uid, email: newEmail, nome: newEmail.split('@')[0], ruolo: newRole,
        firstLogin: isNewUser, assignedAdmin: [auth.currentUser.uid],
        dailyReports: [], tracker: {}, personalPipeline: [],
      };

      await setDoc(doc(db, 'collaboratori', uid), collabData, { merge: true });
      await sendPasswordResetEmail(tempAuth, newEmail);

      setSuccess(isNewUser ? `Creato!` : `Riaggiunto!`);
      setNewEmail('');
    } catch (err) {
      setError('Errore: ' + err.message);
    } finally {
      await deleteApp(tempApp);
    }
  };

  const handleAddByUid = async () => {
    if (!newUid || newUid.length < 20) {
      setError('UID non valido');
      return;
    }

    try {
      const collabDoc = doc(db, 'collaboratori', newUid);
      const snap = await getDoc(collabDoc);

      if (snap.exists()) {
        setEditingCollab(newUid);
        setEditEmail(snap.data().email || '');
        setSuccess('Modifica email');
        return;
      }

      const email = `uid_${newUid.slice(0, 8)}@recupero.com`;
      await setDoc(collabDoc, {
        uid: newUid, email, nome: email.split('@')[0], ruolo: newRole,
        firstLogin: true, assignedAdmin: [auth.currentUser.uid],
        dailyReports: [], tracker: {}, personalPipeline: [],
      });

      setSuccess(`Aggiunto: ${email}`);
      setNewUid('');
    } catch (err) {
      setError('Errore: ' + err.message);
    }
  };

  const handleUpdateEmailAndSendReset = async () => {
    if (!editingCollab || !editEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      setError('Email non valida');
      return;
    }

    try {
      await updateDoc(doc(db, 'collaboratori', editingCollab), {
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
      await setDoc(doc(db, 'settingReports', reportId), {
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
      await setDoc(doc(db, 'salesReports', reportId), {
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
      await updateDoc(doc(db, 'leads', editingLead), editForm);
      setEditingLead(null);
      setEditForm({});
      setSuccess('Lead aggiornato!');
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
    if (confirm('Eliminare?')) {
      try {
        await deleteDoc(doc(db, 'collaboratori', id));
        setSuccess('Eliminato!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Errore eliminazione.');
      }
    }
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
      index: i + 1, source,
      total: data.total,
      showUp: ((data.showUp / data.total) * 100).toFixed(1),
      chiusura: ((data.chiuso / data.total) * 100).toFixed(1),
    }));
  };

  const sourceStats = getSourceStats();

  // FILTRI + COLLABORATORE
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChiuso = filters.chiuso === 'tutti' || (filters.chiuso === 'si' ? lead.chiuso : !lead.chiuso);
    const matchesShowUp = filters.showUp === 'tutti' || (filters.showUp === 'si' ? lead.showUp : !lead.showUp);
    const matchesOffer = filters.offer === 'tutti' || (filters.offer === 'si' ? lead.offer : !lead.offer);
    const matchesCollab = !selectedCollaboratore || lead.collaboratoreId === selectedCollaboratore;
    return matchesSearch && matchesChiuso && matchesShowUp && matchesOffer && matchesCollab;
  });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center text-red-500 p-4"><p>{error}</p><button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg">Torna</button></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

        {/* HEADER */}
        <motion.header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <Users size={24} /> Gestione
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@esempio.com" className="px-3 py-1.5 bg-zinc-950/40 border border-white/10 rounded text-xs w-full sm:w-40" />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="px-3 py-1.5 bg-zinc-950/40 border border-white/10 rounded text-xs w-full sm:w-28">
              <option>Setter</option>
              <option>Marketing</option>
              <option>Vendita</option>
            </select>
            <motion.button onClick={handleAddCollaboratore} className="flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs w-full sm:w-auto" whileHover={{ scale: 1.05 }}>
              <Plus size={14} /> Aggiungi
            </motion.button>
          </div>
        </motion.header>

        {success && <p className="text-green-500 text-center text-xs">{success}</p>}
        {error && <p className="text-red-500 text-center text-xs">{error}</p>}

        {/* RIAGGIUNGI CON UID */}
        <div className="mt-4 p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg border border-amber-500/30">
          <p className="text-xs font-bold text-amber-300 mb-2 text-center">RIAGGIUNGI CON UID + CAMBIA EMAIL</p>
          {!editingCollab ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={newUid} onChange={e => setNewUid(e.target.value.trim())} placeholder="Inserisci UID" className="flex-1 px-3 py-1.5 bg-zinc-950/40 border border-white/10 rounded text-xs font-mono" />
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="px-3 py-1.5 bg-zinc-950/40 border border-white/10 rounded text-xs">
                <option>Setter</option>
                <option>Marketing</option>
                <option>Vendita</option>
              </select>
              <motion.button onClick={handleAddByUid} className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded text-xs font-bold" whileHover={{ scale: 1.05 }}>
                <Key size={14} /> Cerca UID
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-amber-200">Modifica email per <strong>{editingCollab.slice(0, 12)}...</strong></p>
              <div className="flex gap-2">
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="nuova@email.it" className="flex-1 px-3 py-1.5 bg-zinc-950/40 border border-amber-500/50 rounded text-xs" />
                <motion.button onClick={handleUpdateEmailAndSendReset} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold" whileHover={{ scale: 1.05 }}>Invia</motion.button>
                <motion.button onClick={() => { setEditingCollab(null); setEditEmail(''); }} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs" whileHover={{ scale: 1.05 }}>Annulla</motion.button>
              </div>
            </div>
          )}
        </div>

        <ReportStatus collaboratori={collaboratori} />

        {/* 3 TABS LEADS */}
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
          {/* SETTING */}
          <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-cyan-400">Report Setting</h2>
              <button onClick={() => setShowPastSetting(!showPastSetting)} className="text-xs flex items-center gap-1 text-cyan-300 hover:text-cyan-100"><Eye size={12} /> Storico</button>
            </div>
            {showPastSetting && (
              <div className="mb-3 p-2 bg-zinc-900/50 border border-cyan-800/30 rounded max-h-32 overflow-y-auto text-xs">
                {settingReports.length === 0 ? <p className="text-slate-400">Nessun report</p> : settingReports.map(r => (
                  <button key={r.id} onClick={() => loadPastSettingReport(r)} className="block w-full text-left p-1 hover:bg-cyan-900/30 rounded">
                    {r.date} → {r.chiamatePrenotate} prenotate
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2 text-xs">
              <input type="date" value={reportSetting.date} onChange={e => setReportSetting({ ...reportSetting, date: e.target.value })} className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportSetting.followUpsFatti} onChange={e => setReportSetting({ ...reportSetting, followUpsFatti: e.target.value })} placeholder="Follow-ups" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportSetting.dialedFatti} onChange={e => setReportSetting({ ...reportSetting, dialedFatti: e.target.value })} placeholder="Dialed" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportSetting.dialedRisposte} onChange={e => setReportSetting({ ...reportSetting, dialedRisposte: e.target.value })} placeholder="Risposte" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportSetting.chiamatePrenotate} onChange={e => setReportSetting({ ...reportSetting, chiamatePrenotate: e.target.value })} placeholder="Prenotate" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <button onClick={handleSaveReportSetting} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-1.5 rounded text-xs"><Check className="inline mr-1" size={12} /> Salva</button>
            </div>
          </div>

          {/* VENDITA */}
          <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-rose-400">Report Vendita</h2>
              <button onClick={() => setShowPastSales(!showPastSales)} className="text-xs flex items-center gap-1 text-rose-300 hover:text-rose-100"><Eye size={12} /> Storico</button>
            </div>
            {showPastSales && (
              <div className="mb-3 p-2 bg-zinc-900/50 border border-rose-800/30 rounded max-h-32 overflow-y-auto text-xs">
                {salesReports.length === 0 ? <p className="text-slate-400">Nessun report</p> : salesReports.map(r => (
                  <button key={r.id} onClick={() => loadPastSalesReport(r)} className="block w-full text-left p-1 hover:bg-rose-900/30 rounded">
                    {r.date} → {r.chiuse} chiuse
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2 text-xs">
              <input type="date" value={reportVendita.date} onChange={e => setReportVendita({ ...reportVendita, date: e.target.value })} className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiamateFissate} onChange={e => setReportVendita({ ...reportVendita, chiamateFissate: e.target.value })} placeholder="Fissate" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiamateFatte} onChange={e => setReportVendita({ ...reportVendita, chiamateFatte: e.target.value })} placeholder="Fatte" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.offersFatte} onChange={e => setReportVendita({ ...reportVendita, offersFatte: e.target.value })} placeholder="Offers" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.chiuse} onChange={e => setReportVendita({ ...reportVendita, chiuse: e.target.value })} placeholder="Chiuse" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <input type="number" value={reportVendita.cash} onChange={e => setReportVendita({ ...reportVendita, cash: e.target.value })} placeholder="Cash" className="w-full p-1.5 bg-zinc-950/40 border border-white/10 rounded" />
              <button onClick={handleSaveReportVendita} className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white py-1.5 rounded text-xs"><Check className="inline mr-1" size={12} /> Salva</button>
            </div>
          </div>
        </div>

        {/* FILTRI UNIFICATI + TABELLA */}
        <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-200">Leads ({filteredLeads.length})</h2>
            <div className="flex flex-wrap gap-2 text-xs">
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

              <select 
                value={filters.chiuso} 
                onChange={e => { setFilters({ ...filters, chiuso: e.target.value }); setCurrentPage(1); }} 
                className="bg-zinc-950/40 border border-white/10 rounded px-2 py-1"
              >
                <option value="tutti">Chiuso: Tutti</option>
                <option value="si">Chiuso: Sì</option>
                <option value="no">Chiuso: No</option>
              </select>

              <select 
                value={filters.showUp} 
                onChange={e => { setFilters({ ...filters, showUp: e.target.value }); setCurrentPage(1); }} 
                className="bg-zinc-950/40 border border-white/10 rounded px-2 py-1"
              >
                <option value="tutti">Show-Up: Tutti</option>
                <option value="si">Show-Up: Sì</option>
                <option value="no">Show-Up: No</option>
              </select>

              <select 
                value={filters.offer} 
                onChange={e => { setFilters({ ...filters, offer: e.target.value }); setCurrentPage(1); }} 
                className="bg-zinc-950/40 border border-white/10 rounded px-2 py-1"
              >
                <option value="tutti">Warm: Tutti</option>
                <option value="si">Warm: Sì</option>
                <option value="no">Warm: No</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABELLA LEADS */}
        <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="overflow-x-auto max-w-full rounded border border-white/10">
            <div className="min-w-[1800px] w-full">
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
                        ) : <div className="max-w-[80px] truncate font-medium">{lead.name || '—'}</div>}
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
                      <td className="px-2 py-1">{lead.number || '—'}</td>
                      <td className="px-2 py-1">{lead.dataPrenotazione ? `${lead.dataPrenotazione.slice(5)} ${lead.oraPrenotazione || ''}` : '—'}</td>
                      <td className="px-2 py-1 truncate max-w-[70px]">{lead.collaboratoreNome || '—'}</td>

                      <td className="px-2 py-1 text-center">
                        {editingLead === lead.id ? (
                          <input type="number" min="0" value={editForm.dialed || 0} onChange={e => setEditForm({ ...editForm, dialed: parseInt(e.target.value) || 0 })} className="w-12 p-0.5 bg-zinc-950/40 border border-white/10 rounded text-xs text-center" />
                        ) : <span className="font-bold text-cyan-400">{lead.dialed ?? 0}</span>}
                      </td>

                      <td className="px-2 py-1 text-center">
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.settingCall || false} onChange={e => setEditForm({ ...editForm, settingCall: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.settingCall ? 'text-green-400' : 'text-red-400'}`}>{lead.settingCall ? 'Sì' : 'No'}</div>}
                      </td>

                      <td className="px-2 py-1 text-center">
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.showUp} onChange={e => setEditForm({ ...editForm, showUp: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.showUp ? 'text-green-400' : 'text-red-400'}`}>{lead.showUp ? 'Sì' : 'No'}</div>}
                      </td>

                      <td className="px-2 py-1 text-center">
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.target || false} onChange={e => setEditForm({ ...editForm, target: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.target ? 'text-yellow-400' : 'text-gray-500'}`}>{lead.target ? 'Sì' : 'No'}</div>}
                      </td>

                      <td className="px-2 py-1 text-center">
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.offer} onChange={e => setEditForm({ ...editForm, offer: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.offer ? 'text-yellow-400' : 'text-gray-500'}`}>{lead.offer ? 'Sì' : 'No'}</div>}
                      </td>

                      <td className="px-2 py-1 text-center">
                        {editingLead === lead.id ? (
                          <input type="checkbox" checked={editForm.chiuso} onChange={e => setEditForm({ ...editForm, chiuso: e.target.checked })} className="w-3 h-3" />
                        ) : <div className={`font-bold ${lead.chiuso ? 'text-green-400' : 'text-yellow-400'}`}>{lead.chiuso ? 'Sì' : 'No'}</div>}
                      </td>

                      <td className="px-2 py-1 text-center">
                        {editingLead === lead.id ? (
                          <input type="number" min="0" step="0.01" value={editForm.amount || ''} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="w-16 p-0.5 bg-zinc-950/40 border border-white/10 rounded text-xs text-center" />
                        ) : <div className="font-bold text-green-400">€{lead.amount || 0}</div>}
                      </td>

                      <td className="px-2 py-1 text-center">
                        {editingLead === lead.id ? (
                          <input type="number" min="0" value={editForm.mesi || ''} onChange={e => setEditForm({ ...editForm, mesi: e.target.value })} className="w-12 p-0.5 bg-zinc-950/40 border border-white/10 rounded text-xs text-center" />
                        ) : <div className="font-bold">{lead.mesi || 0}</div>}
                      </td>

                      <td className="px-2 py-1 max-w-[120px] truncate">
                        <button 
                          onClick={() => { setCurrentNote(lead.note || 'Nessuna nota'); setShowNotePopup(true); }} 
                          className="text-cyan-400 hover:underline text-xs"
                        >
                          {lead.note ? 'Vedi' : '—'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-4 text-xs">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
              <span className="text-slate-300 self-center">Pag {currentPage} di {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
            </div>
          )}
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

        {/* COLLABORATORI */}
        <div className="bg-zinc-950/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Collaboratori</h2>
          <div className="space-y-2 text-xs">
            {[...collaboratori, ...admins].map(c => {
              const isCurrentUser = c.id === auth.currentUser?.uid;
              const displayName = c.nome || c.email?.split('@')[0] || 'Sconosciuto';
              const isSelected = selectedCollaboratore === c.id;
              return (
                <motion.div 
                  key={c.id} 
                  className={`p-2 bg-zinc-950/40 rounded border ${isSelected ? 'border-cyan-500' : 'border-white/10'} flex justify-between items-center cursor-pointer`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedCollaboratore(isSelected ? null : c.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-200">{displayName} ({c.ruolo || c.role})</p>
                    <p className="text-slate-400 truncate">{c.email || '—'}</p>
                  </div>
                  {isAdmin && !isCurrentUser && (
                    <div className="flex gap-1 ml-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditingCollab(c.id); setEditEmail(c.email || ''); }} className="p-1 text-yellow-400"><Key size={12} /></button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Elimina ${displayName}?`)) handleDeleteCollaboratore(c.id); }} className="p-1 text-red-400"><Trash2 size={12} /></button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          {selectedCollaboratore && (
            <button onClick={() => setSelectedCollaboratore(null)} className="mt-2 text-xs text-cyan-400 hover:underline">
              ← Mostra tutti i leads
            </button>
          )}
        </div>

        {/* POPUP NOTE */}
        {showNotePopup && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-zinc-950/90 rounded-xl p-6 max-w-lg w-full border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-slate-100">Nota Completa</h3>
                <button onClick={() => setShowNotePopup(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{currentNote}</p>
            </motion.div>
          </div>
        )}

        {/* POPUP MODIFICA EMAIL */}
        {editingCollab && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-950/90 rounded-xl p-6 max-w-sm w-full border border-white/10">
              <h3 className="text-lg font-bold text-slate-100 mb-3">Modifica Email</h3>
              <p className="text-sm text-slate-300 mb-4">
                Nuova email per <strong>{collaboratori.find(c => c.id === editingCollab)?.nome || 'utente'}</strong>
              </p>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="nuova@email.it" className="w-full px-3 py-2 bg-zinc-950/40 border border-white/10 rounded text-sm mb-4 focus:ring-1 focus:ring-yellow-500" />
              <div className="flex gap-3">
                <button onClick={handleUpdateEmailAndSendReset} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium">
                  Aggiorna e Invia
                </button>
                <button onClick={() => { setEditingCollab(null); setEditEmail(''); }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-slate-300 py-2 rounded-lg text-sm font-medium">
                  Annulla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}