import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { Users, Settings, FileText, Phone, Calendar, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CalendarReport() {
  const { date } = useParams(); // "2025-11-11"
  const navigate = useNavigate();
  const [collaboratori, setCollaboratori] = useState([]);
  const [settingReports, setSettingReports] = useState([]);
  const [salesReports, setSalesReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const checkAdminRole = async () => {
      try {
        const adminDocRef = getTenantDoc(db, 'roles', 'admins');
        const adminDoc = await getDoc(adminDocRef);
        if (!adminDoc.exists() || !adminDoc.data().uids.includes(auth.currentUser.uid)) {
          navigate('/collaboratori');
          return;
        }
      } catch (err) {
        console.error('Errore verifica ruolo admin:', err);
        navigate('/collaboratori');
      }
    };

    checkAdminRole();

    const collabQuery = query(getTenantCollection(db, 'collaboratori'));
    const unsubCollab = onSnapshot(collabQuery, (snap) => {
      const collabData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollaboratori(collabData);
    }, (err) => {
      console.error('Errore snapshot collaboratori:', err);
      setError('Errore nel recupero dei collaboratori: ' + err.message);
    });

    const settingQuery = query(getTenantCollection(db, 'settingReports'));
    const unsubSetting = onSnapshot(settingQuery, (snap) => {
      const reports = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSettingReports(reports);
    });

    const salesQuery = query(getTenantCollection(db, 'salesReports'));
    const unsubSales = onSnapshot(salesQuery, (snap) => {
      const reports = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalesReports(reports);
    });

    setLoading(false);

    return () => {
      unsubCollab();
      unsubSetting();
      unsubSales();
    };
  }, [navigate, date]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      <p>{error}</p>
    </div>
  );

  // Crea data locale senza problemi di fuso orario
  const [year, month, day] = date.split('-').map(Number);
  const reportDate = new Date(year, month - 1, day);
  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(reportDate);

  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  const dailyReports = collaboratori
    .map(collab => {
      const report = collab.dailyReports?.find(r => r.date === date);
      if (!report) return null;
      return {
        id: collab.id,
        name: collab.name || collab.nome || collab.email?.split('@')[0] || 'Sconosciuto',
        role: collab.ruolo || collab.role || 'N/D',
        photoURL: collab.photoURL || '/default-avatar.png',
        gender: collab.gender || 'M',
        report
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const settingReportForDate = settingReports.find(r => r.date === date);
  const salesReportForDate = salesReports.find(r => r.date === date);

  const getUserNameByUid = (uid) => {
    if (!uid) return 'Sconosciuto';
    const user = collaboratori.find(c => c.id === uid);
    return user ? (user.name || user.email.split('@')[0]) : 'Sconosciuto';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 max-w-7xl mx-auto"
    >
      <motion.header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
          <Calendar size={32} /> Report del {formattedDate}
        </h1>
        <button
          onClick={() => navigate('/collaboratori')}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all font-medium"
        >
          Torna ai Collaboratori
        </button>
      </motion.header>

      <motion.div className="space-y-8">

        {/* REPORT SETTING */}
        {settingReportForDate && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-cyan-300 flex items-center gap-3">
                <TrendingUp size={28} /> Report Setting
              </h3>
              <div className="text-sm text-cyan-200">
                Compilato da: <span className="font-bold">{getUserNameByUid(settingReportForDate.uid)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
              <div className="p-5 bg-slate-800/60 rounded-xl border border-cyan-500/30">
                <p className="text-cyan-400 font-medium text-sm">Follow-ups</p>
                <p className="text-3xl font-bold text-white mt-2">{settingReportForDate.followUpsFatti || 0}</p>
              </div>
              <div className="p-5 bg-slate-800/60 rounded-xl border border-cyan-500/30">
                <p className="text-cyan-400 font-medium text-sm">Dialed</p>
                <p className="text-3xl font-bold text-white mt-2">{settingReportForDate.dialedFatti || 0}</p>
              </div>
              <div className="p-5 bg-green-900/30 rounded-xl border border-green-500/40">
                <p className="text-green-400 font-medium text-sm">Risposte</p>
                <p className="text-3xl font-bold text-white mt-2">{settingReportForDate.dialedRisposte || 0}</p>
              </div>
              <div className="p-5 bg-rose-900/30 rounded-xl border border-rose-500/40">
                <p className="text-rose-400 font-medium text-sm">Prenotate</p>
                <p className="text-3xl font-bold text-white mt-2">{settingReportForDate.chiamatePrenotate || 0}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* REPORT VENDITA */}
        {salesReportForDate && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 bg-gradient-to-br from-rose-900/40 to-purple-900/40 border border-rose-500/30"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-rose-300 flex items-center gap-3">
                <Phone size={28} /> Report Vendita
              </h3>
              <div className="text-sm text-rose-200">
                Compilato da: <span className="font-bold">{getUserNameByUid(salesReportForDate.uid)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 text-center">
              <div className="p-5 bg-slate-800/60 rounded-xl border border-rose-500/30">
                <p className="text-rose-400 font-medium text-sm">Call Fissate</p>
                <p className="text-3xl font-bold text-white mt-2">{salesReportForDate.chiamateFissate || 0}</p>
              </div>
              <div className="p-5 bg-slate-800/60 rounded-xl border border-rose-500/30">
                <p className="text-rose-400 font-medium text-sm">Call Fatte</p>
                <p className="text-3xl font-bold text-white mt-2">{salesReportForDate.chiamateFatte || 0}</p>
              </div>
              <div className="p-5 bg-yellow-900/30 rounded-xl border border-yellow-500/40">
                <p className="text-yellow-400 font-medium text-sm">Offer</p>
                <p className="text-3xl font-bold text-white mt-2">{salesReportForDate.offersFatte || 0}</p>
              </div>
              <div className="p-5 bg-green-900/30 rounded-xl border border-green-500/40">
                <p className="text-green-400 font-medium text-sm">Chiuse</p>
                <p className="text-3xl font-bold text-white mt-2">{salesReportForDate.chiuse || 0}</p>
              </div>
              <div className="p-5 bg-purple-900/30 rounded-xl border border-purple-500/40">
                <p className="text-purple-400 font-medium text-sm">Cash</p>
                <p className="text-3xl font-bold text-white mt-2">€{salesReportForDate.cash || 0}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* REPORT INDIVIDUALI */}
        {dailyReports.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <AlertCircle size={80} className="mx-auto text-yellow-500 mb-6 opacity-80" />
            <p className="text-slate-300 text-xl font-medium">
              {date < todayStr
                ? 'Nessun report inviato per questa data passata.'
                : 'Nessun report inviato per oggi.'
              }
            </p>
            {date < todayStr && (
              <p className="text-red-400 text-2xl font-bold mt-4">
                GIORNATA SENZA REPORT
              </p>
            )}
          </div>
        ) : (
          dailyReports.map((s, index) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <img
                    src={s.photoURL}
                    alt={s.name}
                    className="w-16 h-16 rounded-full border-2 border-rose-500 object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-200">{s.name}</h2>
                    <p className="text-slate-400 text-lg">{s.role}</p>
                  </div>
                </div>
                <div className={`px-6 py-3 rounded-full text-lg font-bold ${
                  s.report.tracker
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                    : 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                }`}>
                  {s.report.tracker ? 'COMPLETO' : 'PARZIALE'}
                </div>
              </div>



              {/* TRACKER DMS */}
              {s.report.tracker && (
                <div className="p-8 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 rounded-2xl border border-purple-500/30">
                  <h3 className="text-2xl font-bold text-purple-400 flex items-center gap-3 mb-6">
                    {s.role === 'Marketing' && <FileText size={28} />}
                    {s.role === 'Vendita' && <Phone size={28} />}
                    {s.role === 'Setter' && <TrendingUp size={28} />}
                    Tracker DMS ({s.role})
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {s.role === 'Setter' && (
                      <>
                        <div className="p-5 bg-slate-800/60 rounded-xl border border-cyan-500/30 text-center">
                          <p className="text-cyan-400 font-medium text-sm">Outreach Totale</p>
                          <p className="text-3xl font-bold text-white mt-2">{s.report.tracker.outreachTotale || 0}</p>
                        </div>
                        <div className="p-5 bg-slate-800/60 rounded-xl border border-cyan-500/30 text-center">
                          <p className="text-cyan-400 font-medium text-sm">Follow-Ups Totali</p>
                          <p className="text-3xl font-bold text-white mt-2">{s.report.tracker.followUpsTotali || 0}</p>
                        </div>
                        <div className="p-5 bg-green-900/30 rounded-xl border border-green-500/40 text-center">
                          <p className="text-green-400 font-medium text-sm">Risposte</p>
                          <p className="text-3xl font-bold text-white mt-2">{s.report.tracker.risposte || 0}</p>
                        </div>
                        <div className="p-5 bg-rose-900/30 rounded-xl border border-rose-500/40 text-center">
                          <p className="text-rose-400 font-medium text-sm">Call Prenotate</p>
                          <p className="text-3xl font-bold text-white mt-2">{s.report.tracker.callPrenotate || 0}</p>
                        </div>
                      </>
                    )}
                    {s.role === 'Marketing' && (
                      <>
                        <div className="p-6 bg-rose-900/40 rounded-xl border border-rose-500/50 text-center col-span-2">
                          <p className="text-rose-400 font-semibold text-lg">Views 24h</p>
                          <p className="text-5xl font-bold text-white mt-3">{s.report.tracker.volumeViews24h || 0}</p>
                        </div>
                        <div className="p-6 bg-green-900/40 rounded-xl border border-green-500/50 text-center col-span-2">
                          <p className="text-green-400 font-semibold text-lg">Leads 24h</p>
                          <p className="text-5xl font-bold text-white mt-3">{s.report.tracker.volumeLeads24h || 0}</p>
                        </div>
                      </>
                    )}
                    {s.role === 'Vendita' && (
                      <>
                        <div className="p-5 bg-cyan-900/40 rounded-xl border border-cyan-500/50 text-center">
                          <p className="text-cyan-400 font-semibold">Call Prenotate</p>
                          <p className="text-3xl font-bold text-white mt-2">{s.report.tracker.callPrenotate || 0}</p>
                        </div>
                        <div className="p-5 bg-green-900/40 rounded-xl border border-green-500/50 text-center">
                          <p className="text-green-400 font-semibold">Call Fatte</p>
                          <p className="text-3xl font-bold text-white mt-2">{s.report.tracker.callFatte || 0}</p>
                        </div>
                        <div className="p-5 bg-yellow-900/40 rounded-xl border border-yellow-500/50 text-center">
                          <p className="text-yellow-400 font-semibold">Offer Fatte</p>
                          <p className="text-3xl font-bold text-white mt-2">{s.report.tracker.offerFatte || 0}</p>
                        </div>
                        <div className="p-5 bg-rose-900/40 rounded-xl border border-rose-500/50 text-center">
                          <p className="text-rose-400 font-semibold">Chiuse</p>
                          <p className="text-3xl font-bold text-white mt-2">{s.report.tracker.chiuse || 0}</p>
                        </div>
                        <div className="p-5 bg-purple-900/40 rounded-xl border border-purple-500/50 text-center col-span-2">
                          <p className="text-purple-400 font-semibold text-lg">Cash</p>
                          <p className="text-4xl font-bold text-white mt-2">€{s.report.tracker.cash || 0}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}