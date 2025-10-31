import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Calendar, CheckCircle, FileText, Save, Phone, TrendingUp, BarChart3, Plus, X, Eye, Check, AlertCircle, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CollaboratoreDashboard() {
  const navigate = useNavigate();
  const [collaboratore, setCollaboratore] = useState(null);
  const [eodReport, setEodReport] = useState({ focus: '', skills: '', successi: '', difficolta: '', soluzioni: '' });
  const [tracker, setTracker] = useState({
    outreachIG: '', followUpsIG: '', risposteAvute: '', convoFatte: '', callProposte: '',
    callPrenotate: '',
    tempoOutreach: '', tempoFollowUps: '', tempoConvo: '', tempoWA: '', tempoFB: '', tempoTT: '', tempoRiordine: '',
    volumeViews24h: '', volumeLeads24h: '',
  });
  const [newLead, setNewLead] = useState({
    name: '', source: '', number: '', email: '', note: '',
    followSince: '', dataPrenotazione: '', oraPrenotazione: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEOD, setShowEOD] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showMyLeads, setShowMyLeads] = useState(false);
  const [showPastReports, setShowPastReports] = useState(false);
  const [myLeads, setMyLeads] = useState([]);
  const [todayReport, setTodayReport] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  // --- TIMER MEZZANOTTE ---
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/collaboratore-login');
      return;
    }

    const fetchCollab = async () => {
      try {
        const collabDocRef = doc(db, 'collaboratori', auth.currentUser.uid);
        const collabDoc = await getDoc(collabDocRef);
        if (!collabDoc.exists()) {
          setError('Account non trovato.');
          setLoading(false);
          return;
        }
        const data = collabDoc.data();
        setCollaboratore(data);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const todayR = data.dailyReports?.find(r => r.date === todayStr);
        setTodayReport(todayR || null);

        if (todayR) {
          setEodReport(todayR.eodReport || eodReport);
          setTracker({ ...tracker, ...todayR.tracker });
        }

        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento dei dati.');
        setLoading(false);
      }
    };

    fetchCollab();

    const leadsQuery = query(
      collection(db, 'leads'),
      where('collaboratoreId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(leadsQuery, snap => {
      const leadsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyLeads(leadsData);
    }, (err) => {
      console.error('Errore lettura leads:', err);
      setError('Errore lettura leads.');
    });

    return () => unsub();
  }, [navigate]);

  // AGGIORNAMENTO IN TEMPO REALE
  useEffect(() => {
    if (!auth.currentUser) return;

    const collabRef = doc(db, 'collaboratori', auth.currentUser.uid);
    const unsub = onSnapshot(collabRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const todayR = data.dailyReports?.find(r => r.date === todayStr);
        setTodayReport(todayR || null);
      }
    });

    return () => unsub();
  }, []);

  // SALVA EOD
  const handleSaveEOD = async () => {
    setError(''); setSuccess('');
    try {
      const collabRef = doc(db, 'collaboratori', auth.currentUser.uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const updatedReports = (collaboratore?.dailyReports || []).filter(r => r.date !== todayStr);
      updatedReports.push({
        date: todayStr,
        eodReport,
        tracker: todayReport?.tracker || {}
      });

      await setDoc(collabRef, { dailyReports: updatedReports }, { merge: true });

      setSuccess('EOD salvato!');
      setTimeout(() => setSuccess(''), 3000);
      setShowEOD(false);
    } catch (err) {
      console.error('Errore EOD:', err);
      setError('Errore salvataggio EOD.');
    }
  };

  // SALVA TRACKER
  const handleSaveTracker = async () => {
    setError(''); setSuccess('');
    try {
      const collabRef = doc(db, 'collaboratori', auth.currentUser.uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const updatedReports = (collaboratore?.dailyReports || []).filter(r => r.date !== todayStr);
      updatedReports.push({
        date: todayStr,
        eodReport: todayReport?.eodReport || {},
        tracker
      });

      await setDoc(collabRef, { dailyReports: updatedReports }, { merge: true });

      setSuccess('Tracker salvato!');
      setTimeout(() => setSuccess(''), 3000);
      setShowTracker(false);
    } catch (err) {
      console.error('Errore Tracker:', err);
      setError('Errore salvataggio Tracker.');
    }
  };

  // SALVA LEAD
  const handleSaveLead = async () => {
    if (!newLead.name || !newLead.number || !newLead.dataPrenotazione || !newLead.oraPrenotazione) {
      setError('Nome, numero, data e ora prenotazione sono obbligatori.');
      return;
    }

    try {
      const leadRef = doc(collection(db, 'leads'));
      await setDoc(leadRef, {
        ...newLead,
        collaboratoreId: auth.currentUser.uid,
        collaboratoreNome: collaboratore.name || collaboratore.email.split('@')[0],
        chiuso: false,
        showUp: false,
        timestamp: new Date(),
      });

      setSuccess('Lead salvato!');
      setTimeout(() => setSuccess(''), 3000);
      setNewLead({ name: '', source: '', number: '', email: '', note: '', followSince: '', dataPrenotazione: '', oraPrenotazione: '' });
      setShowNewLead(false);
    } catch (err) {
      setError('Errore salvataggio lead.');
    }
  };

  // ELIMINA LEAD (RISOLTO)
  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await deleteDoc(doc(db, 'leads', leadToDelete.id));
      setMyLeads(prev => prev.filter(l => l.id !== leadToDelete.id));
      setSuccess('Lead eliminato!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Errore eliminazione:', err);
      setError('Errore eliminazione lead.');
    } finally {
      setLeadToDelete(null);
    }
  };

  const isSetter = collaboratore?.role === 'Setter';

  // STATISTICHE
  const totalLeads = myLeads.length;
  const leadsShowUp = myLeads.filter(l => l.showUp).length;
  const tassoShowUp = totalLeads > 0 ? ((leadsShowUp / totalLeads) * 100).toFixed(1) : 0;
  const callPrenotate = todayReport?.tracker?.callPrenotate || 0;

  // STATO REPORT
  const eodSent = todayReport?.eodReport && Object.values(todayReport.eodReport).some(v => v !== '');
  const trackerSent = todayReport?.tracker && Object.values(todayReport.tracker).some(v => v !== '');

  const fonti = [
    'Info Storie Prima e Dopo', 'Info Storie Promo', 'Info Reel', 'Inizio Reel',
    'Guida Maniglie', 'Guida Tartaruga', 'Guida 90', 'Altre Guide',
    'DM Richiesta', 'Outreach Nuovi Followers', 'Outreach Vecchi Followers',
    'Follow-Ups', 'Facebook', 'TikTok', 'Referral'
  ];

  // REPORT PASSATI
  const pastReports = (collaboratore?.dailyReports || [])
    .filter(r => r.date !== new Date().toISOString().split('T')[0])
    .sort((a, b) => b.date.localeCompare(a.date));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
      <motion.header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-2">
          <TrendingUp size={28} /> Dashboard {collaboratore?.role}
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-400 flex items-center gap-1">
            <Clock size={16} /> Reset: {timeLeft}
          </div>
          <button 
            onClick={() => auth.signOut().then(() => navigate('/collaboratore-login'))} 
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
          >
            Esci
          </button>
        </div>
      </motion.header>

      <motion.div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl p-6 space-y-6 border border-white/10">
        {isSetter && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Leads Aggiunti</h3>
              <p className="text-2xl font-bold text-rose-500">{totalLeads}</p>
            </div>
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Chiamate Prenotate</h3>
              <p className="text-2xl font-bold text-yellow-500">{callPrenotate}</p>
            </div>
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Tasso Show-up</h3>
              <p className="text-2xl font-bold text-cyan-500">{tassoShowUp}%</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setShowEOD(true)} 
            className="bg-zinc-900/70 p-4 rounded-lg border border-white/10 cursor-pointer hover:border-rose-500 relative"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <CheckCircle size={20} /> EOD Report
              </h3>
              <span className={`text-xs px-2 py-1 rounded ${eodSent ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {eodSent ? 'Inviato' : 'Mancante'}
              </span>
            </div>
          </div>
          <div 
            onClick={() => setShowTracker(true)} 
            className="bg-zinc-900/70 p-4 rounded-lg border border-white/10 cursor-pointer hover:border-rose-500 relative"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <FileText size={20} /> Tracker DMS
              </h3>
              <span className={`text-xs px-2 py-1 rounded ${trackerSent ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {trackerSent ? 'Inviato' : 'Mancante'}
              </span>
            </div>
          </div>
          {isSetter && (
            <>
              <div onClick={() => setShowNewLead(true)} className="bg-zinc-900/70 p-4 rounded-lg border border-white/10 cursor-pointer hover:border-rose-500 md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2"><Phone size={20} /> Nuovo Lead</h3>
              </div>
              <div onClick={() => setShowMyLeads(true)} className="bg-zinc-900/70 p-4 rounded-lg border border-white/10 cursor-pointer hover:border-rose-500 md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2"><Eye size={20} /> I miei Lead</h3>
              </div>
              <div onClick={() => setShowPastReports(true)} className="bg-zinc-900/70 p-4 rounded-lg border border-white/10 cursor-pointer hover:border-rose-500 md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2"><BarChart3 size={20} /> Report Passati</h3>
              </div>
            </>
          )}
        </div>

        {success && <p className="text-green-500 text-center">{success}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
      </motion.div>

      {/* MODAL EOD */}
      <AnimatePresence>
        {showEOD && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-950/80 rounded-2xl border border-white/10 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">EOD Report</h3>
                <button onClick={() => setShowEOD(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" value={eodReport.focus} onChange={e => setEodReport({ ...eodReport, focus: e.target.value })} placeholder="Focus (1-5)" min="1" max="5" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="number" value={eodReport.skills} onChange={e => setEodReport({ ...eodReport, skills: e.target.value })} placeholder="Skills (1-5)" min="1" max="5" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <textarea value={eodReport.successi} onChange={e => setEodReport({ ...eodReport, successi: e.target.value })} placeholder="Dove hai fatto bene?" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white col-span-2" rows="2" />
                <textarea value={eodReport.difficolta} onChange={e => setEodReport({ ...eodReport, difficolta: e.target.value })} placeholder="Difficoltà incontrate" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white col-span-2" rows="2" />
                <textarea value={eodReport.soluzioni} onChange={e => setEodReport({ ...eodReport, soluzioni: e.target.value })} placeholder="Soluzioni applicate" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white col-span-2" rows="2" />
              </div>
              <div className="flex justify-end mt-4">
                <motion.button onClick={handleSaveEOD} className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Save size={20} /> Salva EOD
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL TRACKER */}
      <AnimatePresence>
        {showTracker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-950/80 rounded-2xl border border-white/10 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Tracker DMS</h3>
                <button onClick={() => setShowTracker(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="number" value={tracker.outreachIG} onChange={e => setTracker({ ...tracker, outreachIG: e.target.value })} placeholder="Outreach IG (min 80)" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="number" value={tracker.followUpsIG} onChange={e => setTracker({ ...tracker, followUpsIG: e.target.value })} placeholder="Follow-Ups IG (min 150)" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="number" value={tracker.risposteAvute} onChange={e => setTracker({ ...tracker, risposteAvute: e.target.value })} placeholder="Risposte Avute" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="number" value={tracker.convoFatte} onChange={e => setTracker({ ...tracker, convoFatte: e.target.value })} placeholder="Convo Fatte" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="number" value={tracker.callProposte} onChange={e => setTracker({ ...tracker, callProposte: e.target.value })} placeholder="Call Proposte" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="number" value={tracker.callPrenotate} onChange={e => setTracker({ ...tracker, callPrenotate: e.target.value })} placeholder="Call Prenotate" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={tracker.tempoOutreach} onChange={e => setTracker({ ...tracker, tempoOutreach: e.target.value })} placeholder="Tempo Outreach" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={tracker.tempoFollowUps} onChange={e => setTracker({ ...tracker, tempoFollowUps: e.target.value })} placeholder="Tempo Follow-Ups" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={tracker.tempoConvo} onChange={e => setTracker({ ...tracker, tempoConvo: e.target.value })} placeholder="Tempo Convo" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={tracker.tempoWA} onChange={e => setTracker({ ...tracker, tempoWA: e.target.value })} placeholder="Tempo WA" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={tracker.tempoFB} onChange={e => setTracker({ ...tracker, tempoFB: e.target.value })} placeholder="Tempo FB" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={tracker.tempoTT} onChange={e => setTracker({ ...tracker, tempoTT: e.target.value })} placeholder="Tempo TT" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={tracker.tempoRiordine} onChange={e => setTracker({ ...tracker, tempoRiordine: e.target.value })} placeholder="Tempo Riordine" className="p-3 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
              </div>
              <div className="flex justify-end mt-4">
                <motion.button onClick={handleSaveTracker} className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Save size={20} /> Salva Tracker
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL NUOVO LEAD */}
      <AnimatePresence>
        {showNewLead && isSetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-950/80 rounded-2xl border border-white/10 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Nuovo Lead</h3>
                <button onClick={() => setShowNewLead(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} placeholder="Nome Lead" className="p-3 bg-zinc-800/70 border border-white/10 rounded-lg text-white" />
                <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })} className="p-3 bg-zinc-800/70 border border-white/10 rounded-lg text-white">
                  <option value="">Seleziona Fonte</option>
                  {fonti.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <input type="text" value={newLead.number} onChange={e => setNewLead({ ...newLead, number: e.target.value })} placeholder="Numero" className="p-3 bg-zinc-800/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} placeholder="Email" className="p-3 bg-zinc-800/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={newLead.followSince} onChange={e => setNewLead({ ...newLead, followSince: e.target.value })} placeholder="Da quanto ci segue" className="p-3 bg-zinc-800/70 border border-white/10 rounded-lg text-white" />
                <input type="date" value={newLead.dataPrenotazione} onChange={e => setNewLead({ ...newLead, dataPrenotazione: e.target.value })} className="p-3 bg-zinc-800/70 border border-white/10 rounded-lg text-white" />
                <input type="time" value={newLead.oraPrenotazione} onChange={e => setNewLead({ ...newLead, oraPrenotazione: e.target.value })} className="p-3 bg-zinc-800/70 border border-white/10 rounded-lg text-white" />
                <textarea value={newLead.note} onChange={e => setNewLead({ ...newLead, note: e.target.value })} placeholder="Note" className="p-3 bg-zinc-800/70 border border-white/10 rounded-lg text-white col-span-2" rows="2" />
                <motion.button onClick={handleSaveLead} className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Save size={20} /> Salva Lead
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL I MIEI LEAD */}
      <AnimatePresence>
        {showMyLeads && isSetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-950/80 rounded-2xl border border-white/10 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">I miei Lead</h3>
                <button onClick={() => setShowMyLeads(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs uppercase bg-zinc-900/50">
                    <tr>
                      <th className="px-4 py-2">Nome</th>
                      <th className="px-4 py-2">Fonte</th>
                      <th className="px-4 py-2">Numero</th>
                      <th className="px-4 py-2">Prenotato</th>
                      <th className="px-4 py-2">Show-up</th>
                      <th className="px-4 py-2">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeads.map(lead => (
                      <tr key={lead.id} className="border-b border-white/10">
                        <td className="px-4 py-2">{lead.name}</td>
                        <td className="px-4 py-2">{lead.source}</td>
                        <td className="px-4 py-2">{lead.number}</td>
                        <td className="px-4 py-2">{lead.dataPrenotazione} {lead.oraPrenotazione}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${lead.showUp ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                            {lead.showUp ? 'Sì' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <button 
                            onClick={() => setLeadToDelete(lead)} 
                            className="text-red-400 hover:text-red-300"
                            title="Elimina"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myLeads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nessun lead</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL REPORT PASSATI */}
      <AnimatePresence>
        {showPastReports && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-950/80 rounded-2xl border border-white/10 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Report Passati</h3>
                <button onClick={() => setShowPastReports(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                {pastReports.map((report, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-lg p-4 border border-white/10">
                    <h4 className="font-semibold text-cyan-400">{new Date(report.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm">
                      <div>
                        <p className="text-slate-400">Focus: <span className="text-white">{report.eodReport?.focus || 'N/D'}</span></p>
                        <p className="text-slate-400">Skills: <span className="text-white">{report.eodReport?.skills || 'N/D'}</span></p>
                      </div>
                      <div>
                        <p className="text-slate-400">Call Prenotate: <span className="text-yellow-400">{report.tracker?.callPrenotate || 0}</span></p>
                        <p className="text-slate-400">Outreach IG: <span className="text-emerald-400">{report.tracker?.outreachIG || 0}</span></p>
                      </div>
                    </div>
                    {report.eodReport?.successi && (
                      <p className="mt-2 text-xs text-green-400">Successi: {report.eodReport.successi}</p>
                    )}
                  </div>
                ))}
                {pastReports.length === 0 && (
                  <p className="text-center text-slate-400 py-8">Nessun report passato</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CONFERMA ELIMINAZIONE LEAD */}
      <AnimatePresence>
        {leadToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-950/80 rounded-2xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Elimina Lead</h3>
                <button onClick={() => setLeadToDelete(null)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <p className="text-slate-300 mb-4">
                Sei sicuro di voler eliminare il lead <strong>{leadToDelete.name}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setLeadToDelete(null)} 
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleDeleteLead} 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Elimina
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}