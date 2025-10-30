import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Users, Plus, Copy, TrendingUp, FileText, Phone, Check, AlertCircle, Edit, X, BarChart3, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Calendar from './Calendar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
      <h2 className="text-xl font-semibold text-slate-200 mb-4">Stato Report Oggi</h2>
      <p><strong>Completati:</strong> {collaboratori.length - missingReports.length}</p>
      <p><strong>Mancanti:</strong> {missingReports.length}</p>
      {missingReports.length > 0 && (
        <div className="mt-2">
          <p className="text-red-500">Collaboratori con report mancanti:</p>
          <ul className="list-disc pl-5 text-sm">
            {missingReports.map(name => <li key={name}>{name}</li>)}
          </ul>
        </div>
      )}
      <p className="text-sm text-slate-400 mt-2">Nota: I collaboratori devono inviare 2 report al giorno.</p>
    </motion.div>
  );
};

const ReportArchive = ({ reports, type }) => {
  const filteredReports = reports.filter(r => type === 'collaboratore' ? r.eodReport || r.tracker : r[type]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-slate-200 mb-4">Archivio {type === 'collaboratore' ? 'Collaboratore' : type === 'marketing' ? 'Marketing' : 'Vendita'}</h2>
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <p className="text-slate-400">Nessun report disponibile.</p>
        ) : filteredReports.map((report, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-zinc-900/70 rounded-lg border border-white/10">
            <p><strong>Data:</strong> {report.date}</p>
            {type === 'collaboratore' && (
              <>
                <p><strong>Focus:</strong> {report.eodReport?.focus || 'N/D'}</p>
                <p><strong>Chiamate Chiuse:</strong> {report.tracker?.callChiuse || 0}</p>
              </>
            )}
            {type === 'marketing' && (
              <>
                <p><strong>Views 24h:</strong> {report.volumeViews24h || 'N/D'}</p>
                <p><strong>Leads 24h:</strong> {report.volumeLeads24h || 'N/D'}</p>
              </>
            )}
            {type === 'vendita' && (
              <>
                <p><strong>Chiamate Effettuate:</strong> {report.callsMade || 'N/D'}</p>
                <p><strong>Chiusi:</strong> {report.callsClosed || 'N/D'}</p>
                <p><strong>No Show:</strong> {report.noShow || 'N/D'}</p>
                <p><strong>Cash Collect:</strong> {report.cashCollect || 'N/D'}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default function Collaboratori() {
  const navigate = useNavigate();
  const [collaboratori, setCollaboratori] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [leads, setLeads] = useState([]);
  const [marketingReports, setMarketingReports] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Setter');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    viewsToday: 0, leadsToday: 0,
    viewsWeek: 0, leadsWeek: 0,
    viewsMonth: 0, leadsMonth: 0,
  });
  const [adminMarketing, setAdminMarketing] = useState({
    date: new Date().toISOString().split('T')[0],
    volumeViews24h: '',
    volumeLeads24h: '',
  });
  const [adminSales, setAdminSales] = useState({
    date: new Date().toISOString().split('T')[0],
    callsMade: '',
    callsClosed: '',
    noShow: '',
    cashCollect: '',
  });
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({});

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
          await setDoc(adminDocRef, { uids: [auth.currentUser.uid] });
        }
        const uids = adminDoc.data()?.uids || [];
        const adminOk = uids.includes(auth.currentUser.uid);
        setIsAdmin(adminOk);
        if (!adminOk) {
          setError('Non sei admin.');
          setLoading(false);
          return;
        }
        setAdmins([{ id: auth.currentUser.uid, email: auth.currentUser.email, role: 'Admin' }]);
      } catch (err) {
        setError('Errore verifica permessi.');
        setLoading(false);
      }
    };

    checkAdmin();

    // COLLABORATORI
    const collabQuery = query(collection(db, 'collaboratori'), orderBy('name'));
    const unsubCollab = onSnapshot(
      collabQuery,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCollaboratori(data);
        setLoading(false);
      },
      (err) => {
        setError('Errore lettura collaboratori: ' + err.message);
        setLoading(false);
      }
    );

    // MARKETING REPORTS
    const marketingQuery = query(collection(db, 'marketingReports'), orderBy('date', 'desc'));
    const unsubMarketing = onSnapshot(marketingQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMarketingReports(data);
      calculateStats(data);
    });

    // LEADS
    const leadsQuery = query(collection(db, 'leads'), orderBy('timestamp', 'desc'));
    const unsubLeads = onSnapshot(leadsQuery, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(data);
      calculateStats(marketingReports, data);
    });

    return () => {
      unsubCollab();
      unsubMarketing();
      unsubLeads();
    };
  }, [navigate]);

  const calculateStats = (mReports = [], allLeads = []) => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.slice(0, 7) + '-01');

    let viewsToday = 0, leadsToday = 0;
    let viewsWeek = 0, leadsWeek = 0;
    let viewsMonth = 0, leadsMonth = 0;

    mReports.forEach(r => {
      const views = parseInt(r.volumeViews24h || 0);
      const leads = parseInt(r.volumeLeads24h || 0);
      const date = r.date;

      if (date === today) {
        viewsToday += views;
        leadsToday += leads;
      }
      if (new Date(date) >= weekStart) {
        viewsWeek += views;
        leadsWeek += leads;
      }
      if (new Date(date) >= monthStart) {
        viewsMonth += views;
        leadsMonth += leads;
      }
    });

    const todayLeads = allLeads.filter(l => l.timestamp?.toDate().toISOString().split('T')[0] === today).length;
    const weekLeads = allLeads.filter(l => l.timestamp?.toDate() >= weekStart).length;
    const monthLeads = allLeads.filter(l => l.timestamp?.toDate() >= monthStart).length;

    setStats({
      viewsToday, leadsToday: leadsToday + todayLeads,
      viewsWeek, leadsWeek: leadsWeek + weekLeads,
      viewsMonth, leadsMonth: leadsMonth + monthLeads,
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
        pipeline: [],
      });

      const msg = `Benvenuto!\nEmail: ${newEmail}\nPassword: ${tempPwd}\nLink: https://MentalFitApp.github.io/PtPro/#/collaboratore-login`;
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

  const handleSaveMarketingReport = async () => {
    try {
      await setDoc(doc(collection(db, 'marketingReports')), adminMarketing);
      setAdminMarketing({ date: new Date().toISOString().split('T')[0], volumeViews24h: '', volumeLeads24h: '' });
    } catch (err) {
      setError('Errore salvataggio report marketing.');
    }
  };

  const handleSaveSalesReport = async () => {
    try {
      await setDoc(doc(collection(db, 'salesReports')), adminSales);
      setAdminSales({ date: new Date().toISOString().split('T')[0], callsMade: '', callsClosed: '', noShow: '', cashCollect: '' });
    } catch (err) {
      setError('Errore salvataggio report vendita.');
    }
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead.id);
    setEditForm({
      amount: lead.amount || '',
      mesi: lead.mesi || '',
      note: lead.note || '',
      chiuso: lead.chiuso || false,
      showUp: lead.showUp || false,
    });
  };

  const handleSaveLeadEdit = async () => {
    if (!editingLead) return;
    try {
      await updateDoc(doc(db, 'leads', editingLead), editForm);
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

  // === ANALISI LEAD PER FONTE ===
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

  // === GRAFICO: CLIENTI PRENOTATI E PRESENTATI PER SETTER ===
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

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center text-red-500 p-4"><p>{error}</p><button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg">Torna</button></div>;
  if (!isAdmin) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
      <motion.header className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-2">
          <Users size={28} /> Gestione Collaboratori
        </h1>
      </motion.header>

      {/* Aggiungi Collaboratore */}
      <motion.div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email nuovo collaboratore" className="w-full sm:w-64 p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full sm:w-32 p-2 bg-zinc-900/70 border border-white/10 rounded-lg">
            <option value="Setter">Setter</option>
            <option value="Marketing">Marketing</option>
            <option value="Vendita">Vendita</option>
          </select>
          <motion.button onClick={handleAddCollaboratore} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg" whileHover={{ scale: 1.05 }}>
            <Plus size={16} /> Aggiungi
          </motion.button>
          {copied && <div className="ml-2 p-2 bg-green-900/50 border border-green-500 rounded text-green-300 text-sm">Credenziali copiate!</div>}
        </div>
      </motion.div>

      <ReportStatus collaboratori={collaboratori} />

      {/* STATISTICHE TRACKING */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Oggi</h3>
          <p className="text-3xl font-bold text-rose-500">{stats.viewsToday}</p>
          <p className="text-sm text-slate-400">Views</p>
          <p className="text-2xl font-bold text-green-500 mt-2">{stats.leadsToday}</p>
          <p className="text-sm text-slate-400">Nuovi Leads</p>
        </motion.div>

        <motion.div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Questa Settimana</h3>
          <p className="text-3xl font-bold text-rose-500">{stats.viewsWeek}</p>
          <p className="text-sm text-slate-400">Views</p>
          <p className="text-2xl font-bold text-green-500 mt-2">{stats.leadsWeek}</p>
          <p className="text-sm text-slate-400">Nuovi Leads</p>
        </motion.div>

        <motion.div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Questo Mese</h3>
          <p className="text-3xl font-bold text-rose-500">{stats.viewsMonth}</p>
          <p className="text-sm text-slate-400">Views</p>
          <p className="text-2xl font-bold text-green-500 mt-2">{stats.leadsMonth}</p>
          <p className="text-sm text-slate-400">Nuovi Leads</p>
        </motion.div>
      </div>

      <Calendar 
        reports={collaboratori.flatMap(c => c.dailyReports || [])} 
        collaboratori={collaboratori} 
        onDateClick={d => navigate(`/calendar-report/${d.toISOString().split('T')[0]}`)} 
      />

      {/* REPORT MARKETING INTEGRATO */}
      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Report Marketing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" value={adminMarketing.date} onChange={e => setAdminMarketing({ ...adminMarketing, date: e.target.value })} className="p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <input type="number" value={adminMarketing.volumeViews24h} onChange={e => setAdminMarketing({ ...adminMarketing, volumeViews24h: e.target.value })} placeholder="Views 24h" className="p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <input type="number" value={adminMarketing.volumeLeads24h} onChange={e => setAdminMarketing({ ...adminMarketing, volumeLeads24h: e.target.value })} placeholder="Leads 24h" className="p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <motion.button onClick={handleSaveMarketingReport} className="col-span-2 bg-green-600 text-white py-2 rounded-lg" whileHover={{ scale: 1.02 }}>
            <Check className="inline mr-2" size={16} /> Salva Report Marketing
          </motion.button>
        </div>
      </div>

      {/* REPORT VENDITA INTEGRATO */}
      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Report Vendita</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" value={adminSales.date} onChange={e => setAdminSales({ ...adminSales, date: e.target.value })} className="p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <input type="number" value={adminSales.callsMade} onChange={e => setAdminSales({ ...adminSales, callsMade: e.target.value })} placeholder="Chiamate Effettuate" className="p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <input type="number" value={adminSales.callsClosed} onChange={e => setAdminSales({ ...adminSales, callsClosed: e.target.value })} placeholder="Chiamate Chiuse" className="p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <input type="number" value={adminSales.noShow} onChange={e => setAdminSales({ ...adminSales, noShow: e.target.value })} placeholder="No Show" className="p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <input type="number" value={adminSales.cashCollect} onChange={e => setAdminSales({ ...adminSales, cashCollect: e.target.value })} placeholder="Cash Collect" className="p-2 bg-zinc-900/70 border border-white/10 rounded-lg" />
          <motion.button onClick={handleSaveSalesReport} className="col-span-2 bg-red-600 text-white py-2 rounded-lg" whileHover={{ scale: 1.02 }}>
            <Check className="inline mr-2" size={16} /> Salva Report Vendita
          </motion.button>
        </div>
      </div>

      {/* SEZIONE LEADS */}
      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Leads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs uppercase bg-zinc-900/50">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Fonte</th>
                <th className="px-4 py-2">Numero</th>
                <th className="px-4 py-2">Prenotato</th>
                <th className="px-4 py-2">Setter</th>
                <th className="px-4 py-2">Chiuso</th>
                <th className="px-4 py-2">Show-up</th>
                <th className="px-4 py-2">€</th>
                <th className="px-4 py-2">Mesi</th>
                <th className="px-4 py-2">Note</th>
                <th className="px-4 py-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b border-white/10 hover:bg-zinc-900/50">
                  <td className="px-4 py-2">{lead.name}</td>
                  <td className="px-4 py-2">{lead.source}</td>
                  <td className="px-4 py-2">{lead.number}</td>
                  <td className="px-4 py-2">{lead.dataPrenotazione} {lead.oraPrenotazione}</td>
                  <td className="px-4 py-2">{lead.collaboratoreNome}</td>
                  <td className="px-4 py-2">
                    {editingLead === lead.id ? (
                      <input type="checkbox" checked={editForm.chiuso} onChange={e => setEditForm({ ...editForm, chiuso: e.target.checked })} />
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs ${lead.chiuso ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                        {lead.chiuso ? 'Sì' : 'No'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingLead === lead.id ? (
                      <input type="checkbox" checked={editForm.showUp} onChange={e => setEditForm({ ...editForm, showUp: e.target.checked })} />
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs ${lead.showUp ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                        {lead.showUp ? 'Sì' : 'No'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingLead === lead.id ? (
                      <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="w-16 p-1 bg-zinc-800 border border-white/10 rounded" />
                    ) : (
                      `€${lead.amount || 0}`
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingLead === lead.id ? (
                      <input type="number" value={editForm.mesi} onChange={e => setEditForm({ ...editForm, mesi: e.target.value })} className="w-16 p-1 bg-zinc-800 border border-white/10 rounded" />
                    ) : (
                      lead.mesi || 0
                    )}
                  </td>
                  <td className="px-4 py-2 truncate max-w-xs">
                    {editingLead === lead.id ? (
                      <textarea value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} className="w-full p-1 bg-zinc-800 border border-white/10 rounded" rows="2" />
                    ) : (
                      lead.note
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingLead === lead.id ? (
                      <div className="flex gap-1">
                        <button onClick={handleSaveLeadEdit} className="p-1 text-green-400 hover:text-green-300"><Check size={16} /></button>
                        <button onClick={handleCancelEdit} className="p-1 text-red-400 hover:text-red-300"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditLead(lead)} className="p-1 text-cyan-400 hover:text-cyan-300"><Edit size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STATISTICHE LEAD PER FONTE (LISTA NUMERATA) */}
      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Lead per Fonte</h2>
        <div className="space-y-2">
          {sourceStats.length === 0 ? (
            <p className="text-slate-400">Nessun lead</p>
          ) : (
            sourceStats.map(s => (
              <div key={s.source} className="flex justify-between items-center p-3 bg-zinc-900/70 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-bold">{s.index}.</span>
                  <span className="font-medium text-slate-200">{s.source}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <span><strong>{s.total}</strong> lead</span>
                  <span className="text-green-400"><strong>{s.showUp}%</strong> show-up</span>
                  <span className="text-rose-400"><strong>{s.chiusura}%</strong> chiusura</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* GRAFICO: CLIENTI PRENOTATI E PRESENTATI PER SETTER */}
      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> Clienti Prenotati e Presentati per Setter
        </h2>
        <div className="h-64">
          <Bar
            data={setterChartConfig}
            options={{
              responsive: true,
              plugins: { 
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
              },
              scales: { y: { beginAtZero: true } }
            }}
          />
        </div>
      </div>

      {/* ELENCO COLLABORATORI */}
      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Elenco Collaboratori</h2>
        <div className="space-y-4">
          {[...collaboratori, ...admins].map(c => {
            const isCurrentUser = c.id === auth.currentUser?.uid;
            return (
              <motion.div
                key={c.id}
                className="p-4 bg-zinc-900/70 rounded-lg border border-white/10 flex justify-between items-center cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <div 
                  onClick={() => {
                    if (isCurrentUser) {
                      navigate('/dashboard');
                    } else {
                      handleNavigateToDetail(c.id);
                    }
                  }}
                  className="flex-1"
                >
                  <p className="font-medium text-slate-200">{c.name || c.email.split('@')[0]} ({c.role})</p>
                  <p className="text-sm text-slate-400">{c.email}</p>
                </div>

                {isAdmin && !isCurrentUser && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/collaboratore-detail', { state: { collaboratoreId: c.id, editRole: true } });
                      }}
                      className="p-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Eliminare ${c.name || c.email}?`)) {
                          handleDeleteCollaboratore(c.id);
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <ReportArchive reports={collaboratori.flatMap(c => c.dailyReports || [])} type="collaboratore" />
        <ReportArchive reports={marketingReports} type="marketing" />
        <ReportArchive reports={[]} type="vendita" />
      </div>
    </motion.div>
  );
}