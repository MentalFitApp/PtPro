import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'; // IMPORT AGGIUNTO
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Users, Check, TrendingUp, Phone, Calendar, Target, Award, AlertCircle, Edit, Save, X, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import QuickNotifyButton from '../components/QuickNotifyButton';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function CollaboratoreDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collaboratore, setCollaboratore] = useState(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [chartFilter, setChartFilter] = useState('daily');
  const [editingRole, setEditingRole] = useState(false);
  const [leads, setLeads] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const effectiveId = location.state?.collaboratoreId;
      if (!effectiveId) {
        setError('Nessun collaboratore selezionato.');
        setLoading(false);
        return;
      }

      const adminDoc = await getDoc(doc(db, 'roles', 'admins'));
      const adminUids = adminDoc.exists() ? adminDoc.data().uids || [] : [];
      const adminOk = adminUids.includes(currentUser.uid);
      setIsAdmin(adminOk);

      if (!adminOk && currentUser.uid !== effectiveId) {
        setError('Non hai i permessi per visualizzare questo collaboratore.');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'collaboratori', effectiveId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setError('Collaboratore non trovato.');
          setLoading(false);
          return;
        }

        const data = docSnap.data();
        setCollaboratore(data);
        setRole(data.role || '');
        setDailyReports(data.dailyReports || []);
        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento dei dati.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, location.state]);

  // LEAD IN TEMPO REALE
  useEffect(() => {
    if (!location.state?.collaboratoreId) return;

    const leadsQuery = query(
      collection(db, 'leads'),
      where('collaboratoreId', '==', location.state.collaboratoreId),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(leadsQuery, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [location.state?.collaboratoreId]);

  // REPORT IN TEMPO REALE
  useEffect(() => {
    if (!location.state?.collaboratoreId) return;

    const collabRef = doc(db, 'collaboratori', location.state.collaboratoreId);
    const unsub = onSnapshot(collabRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setDailyReports(data.dailyReports || []);
      }
    });

    return () => unsub();
  }, [location.state?.collaboratoreId]);

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.slice(0, 7) + '-01');

    let todayCalls = 0, weekCalls = 0, monthCalls = 0;
    let callsBooked = 0, callsClosed = 0;

    dailyReports.forEach(r => {
      const date = r.date;
      const booked = parseInt(r.tracker?.callPrenotate || 0);
      const closed = parseInt(r.tracker?.callChiuse || 0);

      callsBooked += booked;
      callsClosed += closed;

      if (date === today) todayCalls += closed;
      if (new Date(date) >= weekStart) weekCalls += closed;
      if (new Date(date) >= monthStart) monthCalls += closed;
    });

    const conversion = callsBooked > 0 ? ((callsClosed / callsBooked) * 100).toFixed(1) : 0;

    return { 
      today: todayCalls, 
      week: weekCalls, 
      month: monthCalls, 
      callsBooked, 
      callsClosed, 
      conversion,
      totalLeads: leads.length,
      leadsClosed: leads.filter(l => l.chiuso).length
    };
  };

  const stats = getStats();

  const getChartData = () => {
    const grouped = {};

    dailyReports.forEach(r => {
      let key = '';
      if (chartFilter === 'daily') key = r.date;
      else if (chartFilter === 'weekly') {
        const d = new Date(r.date);
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay() + 1);
        key = start.toISOString().split('T')[0];
      } else {
        key = r.date.substring(0, 7);
      }

      const value = role === 'Marketing' 
        ? (parseInt(r.tracker?.volumeLeads24h || 0))
        : (parseInt(r.tracker?.callChiuse || 0));

      grouped[key] = (grouped[key] || 0) + value;
    });

    const sortedKeys = Object.keys(grouped).sort();
    const labels = sortedKeys;
    const data = sortedKeys.map(k => grouped[k]);

    return { labels, data };
  };

  const chart = getChartData();

  const chartConfig = {
    labels: chart.labels,
    datasets: [{
      label: role === 'Marketing' ? 'Leads Generati' : 'Chiamate Chiuse',
      data: chart.data,
      backgroundColor: role === 'Marketing' ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
      borderColor: role === 'Marketing' ? '#22c55e' : '#ef4444',
      borderWidth: 2,
      borderRadius: 4,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: { 
      y: { beginAtZero: true },
      x: { grid: { display: false } }
    }
  };

  const handleSaveRole = async () => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'collaboratori', location.state.collaboratoreId), { role });
      setCollaboratore(prev => ({ ...prev, role }));
      setEditingRole(false);
    } catch (err) {
      setError('Errore aggiornamento ruolo.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-red-500 p-4">
      <p>{error}</p>
      <button onClick={() => navigate('/collaboratori')} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg">
        Torna indietro
      </button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
            <Users size={32} />
            {collaboratore.name || collaboratore.email.split('@')[0]}
            <span className="text-lg font-normal text-slate-400">({collaboratore.role})</span>
          </h1>
          <QuickNotifyButton 
            userId={collaboratore.uid} 
            userName={collaboratore.name || collaboratore.email.split('@')[0]} 
            userType="collaboratore" 
          />

          {collaboratore.firstLogin && (
            <motion.button
              onClick={() => {
                const msg = `Email: ${collaboratore.email}\nPassword: ${collaboratore.tempPassword || 'generata al login'}\nLink: https://MentalFitApp.github.io/PtPro/#/login`;
                navigator.clipboard.writeText(msg);
                alert('Credenziali copiate!');
              }}
              className="p-2 text-green-400 hover:text-green-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Copy size={20} />
            </motion.button>
          )}
        </div>
        <button onClick={() => navigate('/collaboratori')} className="text-slate-400 hover:text-rose-400 transition-colors">
          Torna
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'Setter' && (
          <>
            <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Oggi</p>
                  <p className="text-2xl font-bold text-rose-500">{stats.today}</p>
                </div>
                <Phone className="text-rose-500" size={28} />
              </div>
            </div>
            <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Settimana</p>
                  <p className="text-2xl font-bold text-green-500">{stats.week}</p>
                </div>
                <TrendingUp className="text-green-500" size={28} />
              </div>
            </div>
            <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Conversione</p>
                  <p className="text-2xl font-bold text-cyan-500">{stats.conversion}%</p>
                </div>
                <Target className="text-cyan-500" size={28} />
              </div>
            </div>
            <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Prenotate</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.callsBooked}</p>
                </div>
                <Calendar className="text-yellow-500" size={28} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* LEAD PRENOTATI */}
      {role === 'Setter' && (
        <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Lead Prenotati</h2>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-xs sm:text-sm text-left text-slate-300">
              <thead className="text-[10px] sm:text-xs uppercase bg-slate-800/50">
                <tr>
                  <th className="px-3 sm:px-4 py-2">Nome</th>
                  <th className="px-3 sm:px-4 py-2">Numero</th>
                  <th className="px-3 sm:px-4 py-2">Prenotato</th>
                  <th className="px-3 sm:px-4 py-2 text-center">Stato</th>
                </tr>
              </thead>
              <tbody>
                {leads.length > 0 ? leads.map(lead => (
                  <tr key={lead.id} className="border-b border-white/10">
                    <td className="px-3 sm:px-4 py-2 font-medium text-slate-100">{lead.name}</td>
                    <td className="px-3 sm:px-4 py-2">{lead.number}</td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{lead.dataPrenotazione} {lead.oraPrenotazione}</td>
                    <td className="px-3 sm:px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs ${lead.chiuso ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                        {lead.chiuso ? 'Chiuso' : 'In attesa'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-4 py-8 text-center text-slate-400">Nessun lead</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRAFICO PERFORMANCE */}
      <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-200">Performance</h2>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map(f => (
              <button
                key={f}
                onClick={() => setChartFilter(f)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  chartFilter === f 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700/70'
                }`}
              >
                {f === 'daily' ? 'Giorno' : f === 'weekly' ? 'Settimana' : 'Mese'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          {chartFilter === 'daily' ? (
            <Bar data={chartConfig} options={chartOptions} />
          ) : (
            <Line data={chartConfig} options={chartOptions} />
          )}
        </div>
      </div>

      {/* MODIFICA RUOLO */}
      <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Ruolo</h2>
        <div className="flex gap-3 items-center">
          {editingRole ? (
            <>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Setter">Setter</option>
                <option value="Marketing">Marketing</option>
                <option value="Vendita">Vendita</option>
              </select>
              <motion.button
                onClick={handleSaveRole}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Save size={16} /> Salva
              </motion.button>
              <button
                onClick={() => setEditingRole(false)}
                className="p-2 text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <span className="text-lg text-slate-300">{role}</span>
              {isAdmin && (
                <button
                  onClick={() => setEditingRole(true)}
                  className="p-2 text-cyan-400 hover:text-cyan-300"
                >
                  <Edit size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* REPORT GIORNALIERI */}
      <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Report Giornalieri</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {dailyReports.length > 0 ? (
            dailyReports.slice().reverse().map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
              >
                <p className="font-medium text-slate-300 flex items-center gap-2">
                  <Calendar size={16} /> {r.date}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm">
                  {role !== 'Marketing' && (
                    <>
                      <p><strong>Focus:</strong> {r.eodReport?.focus || '—'}</p>
                      <p><strong>Skills:</strong> {r.eodReport?.skills || '—'}</p>
                      <p className="col-span-2"><strong>Successi:</strong> {r.eodReport?.successi || '—'}</p>
                      <p className="col-span-2"><strong>Difficoltà:</strong> {r.eodReport?.difficolta || '—'}</p>
                      <p className="col-span-2"><strong>Soluzioni:</strong> {r.eodReport?.soluzioni || '—'}</p>
                    </>
                  )}
                  {role === 'Setter' && (
                    <>
                      <p><strong>Chiamate Chiuse:</strong> {r.tracker?.callChiuse || 0}</p>
                      <p><strong>Prenotate:</strong> {r.tracker?.callPrenotate || 0}</p>
                    </>
                  )}
                  {role === 'Marketing' && (
                    <>
                      <p><strong>Views 24h:</strong> {r.tracker?.volumeViews24h || 0}</p>
                      <p><strong>Leads 24h:</strong> {r.tracker?.volumeLeads24h || 0}</p>
                    </>
                  )}
                  {role === 'Vendita' && (
                    <>
                      <p><strong>Chiamate Effettuate:</strong> {r.tracker?.callFatte || 0}</p>
                      <p><strong>Chiusi:</strong> {r.tracker?.callChiuse || 0}</p>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-8">Nessun report disponibile.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}