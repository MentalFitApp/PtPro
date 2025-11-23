import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doc, getDoc, setDoc, collection, query, where, orderBy,
  onSnapshot, deleteDoc, updateDoc
} from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { uploadPhoto } from '../../storageUtils.js';
import { 
  CheckCircle, FileText, Save, Phone, TrendingUp, BarChart3, 
  Plus, X, Eye, Check, AlertCircle, Trash2, Clock, User, 
  Edit, Camera, Key, Trophy, ChevronLeft, ChevronRight 
} from 'lucide-react';
import NotificationPanel from '../../components/notifications/NotificationPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantBranding } from '../../hooks/useTenantBranding';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CollaboratoreDashboard() {
  const navigate = useNavigate();
  const { branding } = useTenantBranding();
  const [collaboratore, setCollaboratore] = useState(null);
  const [allCollaboratori, setAllCollaboratori] = useState([]);
  const [tracker, setTracker] = useState({
    outreachTotale: '',
    followUpsTotali: '',
    risposte: '',
    callPrenotate: '',
  });
  const [newLead, setNewLead] = useState({
    name: '', source: '', number: '', email: '', note: '',
    dataPrenotazione: '', oraPrenotazione: '',
  });
  const [profile, setProfile] = useState({ name: '', photoURL: '', gender: 'M' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTracker, setShowTracker] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showMyLeads, setShowMyLeads] = useState(false);
  const [showPastReports, setShowPastReports] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [myLeads, setMyLeads] = useState([]);
  const [todayReport, setTodayReport] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);

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

  // --- CARICA UTENTE LOGGATO ---
  useEffect(() => {
    console.log('🏁 CollaboratoreDashboard mounted, user:', auth.currentUser?.uid);
    
    if (!auth.currentUser) {
      console.warn('⚠️ No user, redirecting to login');
      navigate('/login');
      return;
    }

    const fetchCollab = async () => {
      try {
        console.log('📥 Fetching collaboratore doc...');
        const collabDocRef = getTenantDoc(db, 'collaboratori', auth.currentUser.uid);
        const collabDoc = await getDoc(collabDocRef);
        
        if (!collabDoc.exists()) {
          console.error('❌ Collaboratore doc not found');
          setError('Account non trovato.');
          setLoading(false);
          return;
        }
        
        const data = collabDoc.data();
        console.log('✅ Collaboratore data loaded:', data);
        
        setCollaboratore(data);
        setProfile({ 
          name: data?.name || '', 
          photoURL: data?.photoURL || '', 
          gender: data?.gender || 'M' 
        });

        // Usa data locale per il confronto
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const todayR = data.dailyReports?.find(r => r.date === todayStr);
        setTodayReport(todayR || null);

        if (todayR && todayR.tracker) {
          setTracker({
            outreachTotale: todayR.tracker.outreachTotale || '',
            followUpsTotali: todayR.tracker.followUpsTotali || '',
            risposte: todayR.tracker.risposte || '',
            callPrenotate: todayR.tracker.callPrenotate || '',
          });
        }

        // IMPORTANTE: Setta loading false PRIMA di iniziare query leads
        setLoading(false);
      } catch (err) {
        console.error('❌ Errore nel caricamento dei dati:', err);
        setError('Errore nel caricamento dei dati.');
        setLoading(false);
      }
    };

    // Esegui fetch e aspetta che finisca prima di fare altre query
    fetchCollab().then(() => {
      console.log('✅ Collaboratore loaded, now safe to query leads');
    }).catch((err) => {
      console.error('❌ Failed to load collaboratore:', err);
    });

    return () => {}; // Cleanup vuoto per ora
  }, [navigate]);

  // Query leads SEPARATA - solo dopo che collaboratore è caricato
  useEffect(() => {
    if (!auth.currentUser || !collaboratore || loading) {
      console.log('⏸️ Skipping leads query - not ready yet');
      return;
    }

    console.log('🚀 Ready to query leads for:', collaboratore.name);
    
    let unsub = () => {};
    let timeoutId = null;
    
    // Ritarda leggermente la query leads per dare tempo al render
    const setupLeadsQuery = setTimeout(() => {
      // Timeout per mobile - se ci mette troppo, procedi comunque
      timeoutId = setTimeout(() => {
        console.warn('⚠️ Leads query timeout, proceeding without leads');
        setMyLeads([]);
      }, 8000);
      
      try {
        console.log('📊 Setting up leads listener...');
        const leadsQuery = query(
          getTenantCollection(db, 'leads'),
          where('collaboratoreId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc')
        );

        unsub = onSnapshot(leadsQuery, 
          (snap) => {
            if (timeoutId) clearTimeout(timeoutId);
            console.log('✅ Leads loaded:', snap.size);
            const leadsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMyLeads(leadsData);
          }, 
          (err) => {
            if (timeoutId) clearTimeout(timeoutId);
            console.error('❌ Errore lettura leads:', err);
            console.error('Error code:', err.code, 'Message:', err.message);
            // Non bloccare l'app se fallisce la query leads
            setMyLeads([]);
          }
        );
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('❌ Errore setup leads listener:', err);
        setMyLeads([]);
      }
    }, 500); // Ritarda di 500ms per non bloccare il render iniziale

    return () => {
      unsub();
      clearTimeout(setupLeadsQuery);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [collaboratore, loading]); // Dipende da collaboratore e loading

  // --- FETCH TUTTI I SETTER ---
  useEffect(() => {
    const q = query(getTenantCollection(db, 'collaboratori'), where('role', '==', 'Setter'));
    const unsub = onSnapshot(q, (snap) => {
      const collabs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('📊 Collaboratori caricati:', collabs.length);
      console.log('📊 Primo collaboratore:', collabs[0]);
      setAllCollaboratori(collabs);
    });
    return () => unsub();
  }, []);

  // --- AGGIORNAMENTO IN TEMPO REALE ---
  useEffect(() => {
    if (!auth.currentUser) return;

    const collabRef = getTenantDoc(db, 'collaboratori', auth.currentUser.uid);
    const unsub = onSnapshot(collabRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Usa data locale per il confronto
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        const todayR = data.dailyReports?.find(r => r.date === todayStr);
        setTodayReport(todayR || null);
        
        // Aggiorna anche i valori del tracker se esistono
        if (todayR && todayR.tracker) {
          setTracker({
            outreachTotale: todayR.tracker.outreachTotale || '',
            followUpsTotali: todayR.tracker.followUpsTotali || '',
            risposte: todayR.tracker.risposte || '',
            callPrenotate: todayR.tracker.callPrenotate || '',
          });
        }
      }
    });

    return () => unsub();
  }, []);

  // --- SALVA PROFILO ---
  const handleSaveProfile = async () => {
    try {
      await updateDoc(getTenantDoc(db, 'collaboratori', auth.currentUser.uid), { 
        name: profile.name,
        gender: profile.gender 
      });
      setCollaboratore({ ...collaboratore, name: profile.name, gender: profile.gender });
      setSuccess('Profilo aggiornato!');
      setTimeout(() => setSuccess(''), 3000);
      setShowProfile(false);
    } catch (err) {
      setError('Errore aggiornamento profilo.');
    }
  };

  // --- SALVA TRACKER ---
  // --- EOD REPORT STATE ---
  // (EOD report rimosso, rimane solo tracker)

  // --- SALVA TRACKER + EOD ---
  const handleSaveTracker = async () => {
    setError(''); setSuccess('');
    try {
      const collabRef = getTenantDoc(db, 'collaboratori', auth.currentUser.uid);
      // Usa la data locale corrente, non UTC
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const updatedReports = (collaboratore?.dailyReports || []).filter(r => r.date !== todayStr);
      updatedReports.push({
        date: todayStr,
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

  // --- SALVA LEAD ---
  const handleSaveLead = async () => {
    if (!newLead.name || !newLead.number || !newLead.dataPrenotazione || !newLead.oraPrenotazione) {
      setError('Nome, numero, data e ora prenotazione sono obbligatori.');
      return;
    }

    try {
      const leadRef = doc(getTenantCollection(db, 'leads'));
      const leadId = leadRef.id;
      
      await setDoc(leadRef, {
        ...newLead,
        collaboratoreId: auth.currentUser.uid,
        collaboratoreNome: collaboratore.name || collaboratore.email.split('@')[0],
        chiuso: false,
        showUp: false,
        timestamp: new Date(),
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
        createdBy: auth.currentUser.uid,
        participants: [auth.currentUser.uid],
        timestamp: new Date()
      });

      setSuccess('Lead salvato e aggiunto al calendario!');
      setTimeout(() => setSuccess(''), 3000);
      setNewLead({ name: '', source: '', number: '', email: '', note: '', dataPrenotazione: '', oraPrenotazione: '' });
      setShowNewLead(false);
    } catch (err) {
      console.error('Errore salvataggio lead:', err);
      setError('Errore salvataggio lead.');
    }
  };

  // --- ELIMINA LEAD ---
  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await deleteDoc(getTenantDoc(db, 'leads', leadToDelete.id));
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

  // --- CARICA FOTO PROFILO ---
  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload to Cloudflare R2 with automatic compression (nessun limite per admin/collaboratori)
      const url = await uploadPhoto(
        file,
        auth.currentUser.uid,
        'profile_photos',
        (p) => {
          setUploadProgress(p.percent);
        },
        true
      );
      await updateDoc(getTenantDoc(db, 'collaboratori', auth.currentUser.uid), { photoURL: url });
      setProfile({ ...profile, photoURL: url });
      setSuccess('Foto caricata!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Errore caricamento foto.');
    }
    setUploading(false);
    setTimeout(() => setUploadProgress(0), 600);
  };

  // --- RESET PASSWORD ---
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Le password non corrispondono.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password troppo corta.');
      return;
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
      setSuccess('Password aggiornata!');
      setTimeout(() => setSuccess(''), 3000);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      setError('Errore aggiornamento password. Inserisci la password attuale.');
    }
  };

  const isSetter = collaboratore?.role === 'Setter';

  // --- STATISTICHE PERSONALI ---
  const totalLeads = myLeads.length;
  const leadsShowUp = myLeads.filter(l => l.showUp).length;
  const tassoShowUp = totalLeads > 0 ? ((leadsShowUp / totalLeads) * 100).toFixed(1) : 0;
  const callPrenotate = todayReport?.tracker?.callPrenotate || 0;

  // --- STATO TRACKER ---
  const trackerSent = todayReport?.tracker && Object.values(todayReport.tracker).some(v => v !== '' && v !== undefined);

  // --- CHIAMATE OGGI + CLASSIFICA + TOTALE MESE ---
  const todayCalls = allCollaboratori.map(c => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayR = c.dailyReports?.find(r => r.date === todayStr);
    
    console.log(`📞 ${c.name} - Today report:`, todayR);
    console.log(`📞 ${c.name} - Tracker:`, todayR?.tracker);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthTotal = (c.dailyReports || []).reduce((acc, r) => {
      const rDate = new Date(r.date);
      if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
        const calls = parseInt(r.tracker?.callPrenotate) || 0;
        return acc + calls;
      }
      return acc;
    }, 0);
    
    // Converti in numero per evitare stringhe
    const todayCalls = parseInt(todayR?.tracker?.callPrenotate) || 0;
    
    return { 
      name: c.name, 
      calls: todayCalls,
      monthTotal,
      photoURL: c.photoURL,
      gender: c.gender || 'M'
    };
  }).sort((a, b) => b.calls - a.calls);

  // --- GRAFICO SETTIMANA ---
  const getWeekData = () => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + 1 + (weekOffset * 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
    });

    console.log('📊 Generazione chart - allCollaboratori:', allCollaboratori.length);
    
    const datasets = allCollaboratori.map((c, i) => {
      const weekCalls = days.map((_, j) => {
        const date = new Date(start);
        date.setDate(date.getDate() + j);
        const dateStr = date.toISOString().split('T')[0];
        const report = c.dailyReports?.find(r => r.date === dateStr);
        // Converti sempre in numero per evitare stringhe
        const calls = parseInt(report?.tracker?.callPrenotate) || 0;
        return calls;
      });
      
      console.log(`📊 Dataset ${c.name}:`, weekCalls);
      
      return { 
        label: c.name, 
        data: weekCalls, 
        backgroundColor: `hsl(${i * 60}, 70%, 55%)`,
        borderColor: `hsl(${i * 60}, 70%, 45%)`,
        borderWidth: 1,
      };
    });

    const period = `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('it-IT', { month: 'short' })} ${start.getFullYear()}`;

    return { labels: days, datasets, period };
  };

  const weekData = useMemo(() => getWeekData(), [allCollaboratori, weekOffset]);
  const { labels, datasets, period } = weekData;

  const fonti = [
    'Info Storie Prima e Dopo', 'Info Storie Promo', 'Info Reel', 'Inizio Reel',
    'Guida Maniglie', 'Guida Tartaruga', 'Guida 90', 'Altre Guide',
    'Guida Panettone', 'DM Richiesta', 'Outreach Nuovi Followers', 
    'Views Storie', 'Follow-Ups', 'Facebook', 'TikTok', 'Referral'
  ];

  // --- REPORT PASSATI (solo tracker) ---
  const pastReports = (collaboratore?.dailyReports || [])
    .filter(r => r.date !== new Date().toISOString().split('T')[0])
    .sort((a, b) => b.date.localeCompare(a.date));

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-slate-400 text-sm">Caricamento dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 max-w-md">
        <p className="text-red-400 text-center mb-4">{error}</p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg"
        >
          Torna al Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="overflow-x-hidden w-full min-h-screen bg-slate-900">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* HEADER */}
        <motion.header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 w-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-4">
          <img 
            src={profile.photoURL || '/default-avatar.png'} 
            alt="Profile" 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-blue-500 shadow-lg"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {branding.collaboratoreAreaName} - Benvenuto, {profile.name || 'Collaboratore'} 👋
            </h1>
            <p className="text-sm text-slate-400">{collaboratore?.role}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <NotificationPanel userType="collaboratore" />
          <div className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 px-3 py-2 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-500/20">
            <Clock size={16} className="text-blue-400" />
            <span className="font-medium">Reset: {timeLeft}</span>
          </div>
          <motion.button 
            onClick={() => setShowProfile(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg"
          >
            <User size={16} />
            <span>Profilo</span>
          </motion.button>
          <motion.button 
            onClick={() => auth.signOut().then(() => navigate('/login'))} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium shadow-lg"
          >
            Esci
          </motion.button>
        </div>
      </motion.header>

      <motion.div className="bg-slate-800/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 space-y-4 sm:space-y-6 border border-white/10 w-full">
        {/* CHIAMATE GIORNALIERE */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-400 mb-2">Chiamate giornaliere</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {todayCalls.map((s, i) => (
              <motion.div 
                key={i} 
                className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-lg border border-slate-700/50 text-center min-w-0 shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all"
                whileHover={{ scale: 1.05, y: -4 }}
              >
                <div className="relative mb-2">
                  <img 
                    src={s.photoURL || '/default-avatar.png'} 
                    alt={s.name} 
                    className="w-10 h-10 rounded-full mx-auto border-2 border-blue-500/30"
                  />
                </div>
                <p className="text-xs text-slate-400 truncate mb-1">{s.name}</p>
                <p className="text-xl font-bold text-white">{s.calls}</p>
                <div className="mt-1 px-2 py-0.5 bg-emerald-500/10 rounded text-[10px] text-emerald-400 font-medium">
                  Mese: {s.monthTotal}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* GRAFICO SETTIMANA */}
        <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="text-blue-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">Chiamate prenotate</h3>
            </div>
            <div className="flex items-center gap-2">
              <motion.button 
                onClick={() => setWeekOffset(prev => prev - 1)} 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
              </motion.button>
              <span className="text-sm text-slate-300 font-medium px-3 py-1 bg-slate-700/50 rounded-lg">{period}</span>
              <motion.button 
                onClick={() => setWeekOffset(prev => prev + 1)} 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <ChevronRight size={18} />
              </motion.button>
            </div>
          </div>
          <div className="h-48">
            <Bar 
              data={{ labels, datasets }} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                animation: { duration: 800 },
                plugins: { 
                  legend: { position: 'bottom', labels: { font: { size: 10 }, color: '#e2e8f0', padding: 12 } },
                  tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#60a5fa', bodyColor: '#e2e8f0', cornerRadius: 6, displayColors: true }
                },
                scales: {
                  y: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  x: { ticks: { font: { size: 10 }, color: '#94a3b8' }, grid: { display: false } }
                }
              }} 
            />
          </div>
        </div>

        {/* STATISTICHE PERSONALI */}
        {isSetter && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-sm p-3 sm:p-5 rounded-lg sm:rounded-xl border border-blue-500/30 shadow-xl"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <Plus className="text-blue-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{totalLeads}</p>
              <h3 className="text-xs sm:text-sm text-blue-300 font-medium">Leads Aggiunti</h3>
            </motion.div>
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 backdrop-blur-sm p-3 sm:p-5 rounded-lg sm:rounded-xl border border-yellow-500/30 shadow-xl"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-lg">
                  <Phone className="text-yellow-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{callPrenotate}</p>
              <h3 className="text-xs sm:text-sm text-yellow-300 font-medium">Chiamate Prenotate</h3>
            </motion.div>
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 backdrop-blur-sm p-3 sm:p-5 rounded-lg sm:rounded-xl border border-cyan-500/30 shadow-xl"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-cyan-500/10 rounded-lg">
                  <TrendingUp className="text-cyan-400" size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{tassoShowUp}%</p>
              <h3 className="text-xs sm:text-sm text-cyan-300 font-medium">Tasso Show-up</h3>
            </motion.div>
          </div>
        )}

        {/* AZIONI RAPIDE */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CheckCircle className="text-blue-400 w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">Azioni Rapide</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <motion.div 
              onClick={() => setShowTracker(true)} 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group bg-slate-800/60 hover:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all shadow-lg"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 rounded-lg transition-all">
                    <FileText size={16} className="sm:w-5 sm:h-5 text-blue-400 group-hover:text-white" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-white">Tracker DMS</h4>
                </div>
                <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-lg font-medium ${trackerSent ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {trackerSent ? 'Inviato' : 'Mancante'}
                </span>
              </div>
            </motion.div>
            {isSetter && (
              <>
                <motion.div 
                  onClick={() => setShowNewLead(true)} 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-slate-800/60 hover:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 rounded-lg transition-all">
                      <Phone size={16} className="sm:w-5 sm:h-5 text-blue-400 group-hover:text-white" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-white">Nuovo Lead</h4>
                  </div>
                </motion.div>
                <motion.div 
                  onClick={() => setShowMyLeads(true)} 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-slate-800/60 hover:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 rounded-lg transition-all">
                      <Eye size={16} className="sm:w-5 sm:h-5 text-blue-400 group-hover:text-white" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-white">I miei Lead</h4>
                  </div>
                </motion.div>
                <motion.div 
                  onClick={() => setShowPastReports(true)} 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-slate-800/60 hover:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 rounded-lg transition-all">
                      <BarChart3 size={16} className="sm:w-5 sm:h-5 text-blue-400 group-hover:text-white" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-white">Report Passati</h4>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {success && <p className="text-green-500 text-center">{success}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
      </motion.div>

      {/* === MODALI === */}
      {/* PROFILO */}
      <AnimatePresence>
        {showProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Profilo</h3>
                <button onClick={() => setShowProfile(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <img src={profile.photoURL || '/default-avatar.png'} alt="Profile" className="w-24 h-24 rounded-full mb-2" />
                  {uploading && (
                    <div className="w-full bg-slate-700/50 rounded-lg h-3 overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-400 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  <input type="file" onChange={handleUploadPhoto} accept="image/*" className="text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100" disabled={uploading} />
                </div>
                <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Nome" className="p-3 bg-slate-800/70 border border-white/10 rounded-lg text-white w-full" />
                <div className="flex gap-4 justify-center">
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" name="gender" value="M" checked={profile.gender === 'M'} onChange={e => setProfile({ ...profile, gender: e.target.value })} className="accent-rose-500" />
                    Maschio
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input type="radio" name="gender" value="F" checked={profile.gender === 'F'} onChange={e => setProfile({ ...profile, gender: e.target.value })} className="accent-rose-500" />
                    Femmina
                  </label>
                </div>
                <button onClick={handleSaveProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                  <Save size={16} /> Salva Profilo
                </button>
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-semibold mb-2">Reimposta Password</h4>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Password Attuale" className="p-2 bg-slate-800/70 border border-white/10 rounded w-full mb-2 text-white" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nuova Password" className="p-2 bg-slate-800/70 border border-white/10 rounded w-full mb-2 text-white" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Conferma Password" className="p-2 bg-slate-800/70 border border-white/10 rounded w-full mb-2 text-white" />
                  <button onClick={handleResetPassword} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                    <Key size={16} /> Reimposta
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRACKER */}
      <AnimatePresence>
        {showTracker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Tracker DMS</h3>
                <button onClick={() => setShowTracker(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <input type="number" value={tracker.outreachTotale} onChange={e => setTracker({ ...tracker, outreachTotale: e.target.value })} placeholder="Outreach Totale" className="p-3 bg-slate-800/70 border border-white/10 rounded-lg text-white w-full" />
                <input type="number" value={tracker.followUpsTotali} onChange={e => setTracker({ ...tracker, followUpsTotali: e.target.value })} placeholder="Follow-Ups Totali" className="p-3 bg-slate-800/70 border border-white/10 rounded-lg text-white w-full" />
                <input type="number" value={tracker.risposte} onChange={e => setTracker({ ...tracker, risposte: e.target.value })} placeholder="Risposte" className="p-3 bg-slate-800/70 border border-white/10 rounded-lg text-white w-full" />
                <input type="number" value={tracker.callPrenotate} onChange={e => setTracker({ ...tracker, callPrenotate: e.target.value })} placeholder="Call Prenotate" className="p-3 bg-slate-800/70 border border-white/10 rounded-lg text-white w-full" />
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

      {/* === ALTRI MODALI (New Lead, My Leads, Past Reports, Delete) === */}
      {/* ... (identici a prima, solo senza EOD) ... */}

      {/* NUOVO LEAD */}
      <AnimatePresence>
        {showNewLead && isSetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Nuovo Lead</h3>
                <button onClick={() => setShowNewLead(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} placeholder="Nome Lead" className="p-3 bg-slate-700/70 border border-white/10 rounded-lg text-white" />
                <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })} className="p-3 bg-slate-700/70 border border-white/10 rounded-lg text-white">
                  <option value="">Seleziona Fonte</option>
                  {fonti.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <input type="text" value={newLead.number} onChange={e => setNewLead({ ...newLead, number: e.target.value })} placeholder="Numero" className="p-3 bg-slate-700/70 border border-white/10 rounded-lg text-white" />
                <input type="text" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} placeholder="Email" className="p-3 bg-slate-700/70 border border-white/10 rounded-lg text-white" />
                <input type="date" value={newLead.dataPrenotazione} onChange={e => setNewLead({ ...newLead, dataPrenotazione: e.target.value })} className="p-3 bg-slate-700/70 border border-white/10 rounded-lg text-white" />
                <input type="time" value={newLead.oraPrenotazione} onChange={e => setNewLead({ ...newLead, oraPrenotazione: e.target.value })} className="p-3 bg-slate-700/70 border border-white/10 rounded-lg text-white" />
                <textarea value={newLead.note} onChange={e => setNewLead({ ...newLead, note: e.target.value })} placeholder="Note" className="p-3 bg-slate-700/70 border border-white/10 rounded-lg text-white col-span-2" rows="2" />
                <motion.button onClick={handleSaveLead} className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Save size={20} /> Salva Lead
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* I MIEI LEAD */}
      <AnimatePresence>
        {showMyLeads && isSetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">I miei Lead</h3>
                <button onClick={() => setShowMyLeads(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-xs sm:text-sm text-left text-slate-300">
                  <thead className="text-[10px] sm:text-xs uppercase bg-slate-800/50">
                    <tr>
                      <th className="px-3 sm:px-4 py-2">Nome</th>
                      <th className="px-3 sm:px-4 py-2 hidden sm:table-cell">Fonte</th>
                      <th className="px-3 sm:px-4 py-2">Numero</th>
                      <th className="px-3 sm:px-4 py-2">Prenotato</th>
                      <th className="px-3 sm:px-4 py-2 text-center">Show-up</th>
                      <th className="px-3 sm:px-4 py-2 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeads.map(lead => (
                      <tr key={lead.id} className="border-b border-white/10">
                        <td className="px-3 sm:px-4 py-2 font-medium text-slate-100">{lead.name}</td>
                        <td className="px-3 sm:px-4 py-2 hidden sm:table-cell">{lead.source}</td>
                        <td className="px-3 sm:px-4 py-2">{lead.number}</td>
                        <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{lead.dataPrenotazione} {lead.oraPrenotazione}</td>
                        <td className="px-3 sm:px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs ${lead.showUp ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                            {lead.showUp ? 'Sì' : 'No'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-right">
                          <button onClick={() => setLeadToDelete(lead)} className="text-red-400 hover:text-red-300 inline-flex items-center justify-center" title="Elimina">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myLeads.length === 0 && (
                      <tr><td colSpan={6} className="px-3 sm:px-4 py-8 text-center text-slate-400">Nessun lead</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPORT PASSATI */}
      <AnimatePresence>
        {showPastReports && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Report Passati</h3>
                <button onClick={() => setShowPastReports(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                {pastReports.map((report, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                    <h4 className="font-semibold text-cyan-400">{new Date(report.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                    <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                      <p className="text-slate-400">Outreach: <span className="text-emerald-400">{report.tracker?.outreachTotale || 0}</span></p>
                      <p className="text-slate-400">Follow-Up: <span className="text-yellow-400">{report.tracker?.followUpsTotali || 0}</span></p>
                      <p className="text-slate-400">Risposte: <span className="text-cyan-400">{report.tracker?.risposte || 0}</span></p>
                      <p className="text-slate-400">Call: <span className="text-rose-400">{report.tracker?.callPrenotate || 0}</span></p>
                    </div>
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

      {/* CONFERMA ELIMINAZIONE */}
      <AnimatePresence>
        {leadToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Elimina Lead</h3>
                <button onClick={() => setLeadToDelete(null)} className="text-white hover:text-rose-400"><X size={24} /></button>
              </div>
              <p className="text-slate-300 mb-4">
                Sei sicuro di voler eliminare il lead <strong>{leadToDelete.name}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setLeadToDelete(null)} className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-white rounded-lg">
                  Annulla
                </button>
                <button onClick={handleDeleteLead} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                  Elimina
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}