import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doc, getDoc, setDoc, collection, query, where, orderBy,
  onSnapshot, deleteDoc, updateDoc
} from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection, CURRENT_TENANT_ID } from '../../config/tenant';
import { uploadPhoto } from '../../storageUtils.js';
import { 
  CheckCircle, FileText, Save, Phone, TrendingUp, BarChart3, 
  Plus, X, Eye, Check, AlertCircle, Trash2, Clock, User, 
  Edit, Camera, Key, Trophy, ChevronLeft, ChevronRight, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import NotificationPanel from '../../components/notifications/NotificationPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantBranding } from '../../hooks/useTenantBranding';
import RadialCollaboratorChart from '../../components/charts/RadialCollaboratorChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// Cache per le immagini dei collaboratori
const imageCache = new Map();

// Funzione helper per ottenere la data locale nel formato YYYY-MM-DD
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
    name: '', source: '', number: '', note: '',
    dataPrenotazione: '', oraPrenotazione: '',
  });
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [lastGeneratedDate, setLastGeneratedDate] = useState(null);
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
        const todayStr = getLocalDateString();

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

  // --- CARICA EVENTI CALENDARIO ---
  useEffect(() => {
    if (!auth.currentUser) return;

    const eventsQuery = query(
      getTenantCollection(db, 'calendarEvents'),
      orderBy('date', 'asc')
    );

    const unsub = onSnapshot(eventsQuery, (snap) => {
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('📅 EVENTI CARICATI:', events.length);
      console.table(events.map(e => ({
        Titolo: e.title,
        Data: e.date,
        Ora: e.time,
        Durata: e.durationMinutes + 'min',
        Tipo: e.type
      })));
      setCalendarEvents(events);
    }, (err) => {
      console.error('❌ Errore caricamento eventi calendario:', err);
    });

    return () => unsub();
  }, []);

  // --- FETCH TUTTI I COLLABORATORI ---
  useEffect(() => {
    console.log('🔄 Caricamento tutti i collaboratori...');
    console.log('🔍 Tenant path:', `tenants/${CURRENT_TENANT_ID}/collaboratori`);
    
    const collRef = getTenantCollection(db, 'collaboratori');
    console.log('🔍 Collection path:', collRef.path);
    
    const unsub = onSnapshot(collRef, (snap) => {
      console.log('📊 Snapshot ricevuto - dimensione:', snap.size);
      console.log('📊 Snapshot vuoto?', snap.empty);
      
      const collabs = snap.docs.map(d => {
        const data = d.data();
        console.log('👤 Collaboratore:', { id: d.id, name: data.name, role: data.role });
        return { id: d.id, ...data };
      });
      
      console.log('📊 Totale collaboratori caricati:', collabs.length);
      console.log('📊 Lista completa:', collabs.map(c => ({ 
        id: c.id,
        name: c.name, 
        role: c.role, 
        hasReports: !!c.dailyReports,
        reportsCount: c.dailyReports?.length || 0
      })));
      
      setAllCollaboratori(collabs);
    }, (error) => {
      console.error('❌ Errore caricamento collaboratori:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
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
        const todayStr = getLocalDateString();
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
      const todayStr = getLocalDateString();

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

  // --- GENERA FASCE ORARIE ---
  const generateTimeSlots = (dateStr) => {
    console.log('\n🎯 === GENERAZIONE SLOT PER:', dateStr, '===');
    setSelectedDate(dateStr);
    
    const slots = [];
    // Genera slot ogni 30 minuti dalle 8:00 alle 22:00
    for (let h = 8; h <= 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots.push(time);
      }
    }
    // Aggiungi anche 22:00
    slots.push('22:00');

    const occupiedSlots = new Set();

    // 1. Filtra da myLeads (lead già creati)
    const leadsOnDate = myLeads.filter(lead => lead.dataPrenotazione === dateStr);
    console.log('📋 Lead trovati:', leadsOnDate.length);
    
    leadsOnDate.forEach(lead => {
      if (!lead.oraPrenotazione) return;
      console.log('  📞', lead.name, 'alle', lead.oraPrenotazione);
      
      const [hours, minutes] = lead.oraPrenotazione.split(':').map(Number);
      const duration = 30;
      
      // Arrotonda l'inizio al blocco di 30 minuti precedente
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

    // 2. Filtra da calendarEvents (eventi aggiunti manualmente)
    const eventsOnDate = calendarEvents.filter(e => e.date === dateStr);
    console.log('📅 Eventi calendario:', eventsOnDate.length);
    
    eventsOnDate.forEach(event => {
      if (!event.time) return;
      console.log('  📆', event.title, 'alle', event.time);
      
      const [hours, minutes] = event.time.split(':').map(Number);
      const duration = event.durationMinutes || 30;
      
      // Arrotonda l'inizio al blocco di 30 minuti precedente
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

    console.log('🔒 Totale slot occupati:', occupiedSlots.size);

    // Restituisce solo gli slot liberi
    const freeSlots = slots.filter(slot => !occupiedSlots.has(slot));
    console.log('✅ Slot liberi:', freeSlots.length, '/', slots.length);
    
    setAvailableSlots(freeSlots);
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
          source: newLead.source || '',
          note: newLead.note || ''
        },
        createdBy: auth.currentUser.uid,
        participants: [auth.currentUser.uid],
        timestamp: new Date()
      });

      setSuccess('Lead salvato e aggiunto al calendario!');
      setTimeout(() => setSuccess(''), 3000);
      setNewLead({ name: '', source: '', number: '', note: '', dataPrenotazione: '', oraPrenotazione: '' });
      setSelectedDate(null);
      setAvailableSlots([]);
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

  const isSetter = collaboratore?.ruolo === 'Setter' || collaboratore?.role === 'Setter';

  // --- STATISTICHE PERSONALI ---
  const totalLeads = myLeads.length;
  const leadsShowUp = myLeads.filter(l => l.showUp).length;
  const tassoShowUp = totalLeads > 0 ? ((leadsShowUp / totalLeads) * 100).toFixed(1) : 0;
  const callPrenotate = todayReport?.tracker?.callPrenotate || 0;

  // --- STATO TRACKER ---
  const trackerSent = todayReport?.tracker && Object.values(todayReport.tracker).some(v => v !== '' && v !== undefined);

  // --- CHIAMATE OGGI + CLASSIFICA + TOTALE MESE ---
  const todayCalls = allCollaboratori.map(c => {
    const todayStr = getLocalDateString();
    const todayR = c.dailyReports?.find(r => r.date === todayStr);
    
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
    
    // Prepara dati per il grafico radiale
    const radialData = allCollaboratori.map((c, i) => {
      const weekCalls = days.map((_, j) => {
        const date = new Date(start);
        date.setDate(date.getDate() + j);
        const dateStr = getLocalDateString(date);
        const report = c.dailyReports?.find(r => r.date === dateStr);
        return parseInt(report?.tracker?.callPrenotate) || 0;
      });
      
      return {
        name: c.name,
        photoURL: c.photoURL || '/default-avatar.png',
        weekCalls
      };
    });

    const period = `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('it-IT', { month: 'short' })} ${start.getFullYear()}`;

    return { radialData, period };
  };

  const weekData = useMemo(() => getWeekData(), [allCollaboratori, weekOffset]);
  const { radialData, period } = weekData;

  const fonti = [
    'Info Storie Prima e Dopo', 'Info Storie Promo', 'Info Reel', 'Inizio Reel',
    'Guida Maniglie', 'Guida Tartaruga', 'Guida 90', 'Altre Guide',
    'Guida Panettone', 'DM Richiesta', 'Outreach Nuovi Followers', 
    'Views Storie', 'Follow-Ups', 'Facebook', 'TikTok', 'Referral'
  ];

  // --- REPORT PASSATI (solo tracker) ---
  const pastReports = (collaboratore?.dailyReports || [])
    .filter(r => r.date !== getLocalDateString())
    .sort((a, b) => b.date.localeCompare(a.date));

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-slate-400 text-sm">Caricamento dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 max-w-md">
        <p className="text-red-400 text-center mb-4">{error}</p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white preserve-white py-2 rounded-lg"
        >
          Torna al Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="overflow-x-hidden w-full min-h-screen">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* HEADER */}
        <motion.header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 w-full backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl">
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
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white preserve-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg"
          >
            <User size={16} />
            <span>Profilo</span>
          </motion.button>
          <motion.button 
            onClick={() => auth.signOut().then(() => navigate('/login'))} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white preserve-white rounded-lg text-sm font-medium shadow-lg"
          >
            Esci
          </motion.button>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-2 sm:p-3 space-y-2 sm:space-y-3 w-full relative z-10"
      >
        {/* AZIONI RAPIDE */}
        <div className="backdrop-blur-md rounded-lg p-2 border border-slate-700/30 shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <motion.div 
              onClick={() => setShowTracker(true)} 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group bg-slate-800/50 hover:bg-slate-700/60 p-2 rounded-lg border border-slate-700/50 cursor-pointer hover:border-blue-500/50 transition-all"
            >
              <div className="flex flex-col items-center text-center gap-0.5">
                <div className="p-1.5 bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 rounded-lg transition-all">
                  <FileText className="w-4 h-4 text-blue-400 group-hover:text-white" />
                </div>
                <h4 className="text-[10px] font-semibold text-white">Tracker</h4>
                <span className={`text-[8px] px-1 py-0.5 rounded font-medium ${trackerSent ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {trackerSent ? '✓' : '✗'}
                </span>
              </div>
            </motion.div>
            {isSetter && (
              <>
                <motion.div 
                  onClick={() => setShowNewLead(true)} 
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group bg-slate-800/50 hover:bg-slate-700/60 p-2 rounded-lg border border-slate-700/50 cursor-pointer hover:border-blue-500/50 transition-all"
                >
                  <div className="flex flex-col items-center text-center gap-0.5">
                    <div className="p-1.5 bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 rounded-lg transition-all">
                      <Phone className="w-4 h-4 text-blue-400 group-hover:text-white" />
                    </div>
                    <h4 className="text-[10px] font-semibold text-white">Nuovo</h4>
                  </div>
                </motion.div>
                <motion.div 
                  onClick={() => setShowMyLeads(true)} 
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group bg-slate-800/50 hover:bg-slate-700/60 p-2 rounded-lg border border-slate-700/50 cursor-pointer hover:border-blue-500/50 transition-all"
                >
                  <div className="flex flex-col items-center text-center gap-0.5">
                    <div className="p-1.5 bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 rounded-lg transition-all">
                      <Eye className="w-4 h-4 text-blue-400 group-hover:text-white" />
                    </div>
                    <h4 className="text-[10px] font-semibold text-white">Leads</h4>
                  </div>
                </motion.div>
                <motion.div 
                  onClick={() => setShowPastReports(true)} 
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group bg-slate-800/50 hover:bg-slate-700/60 p-2 rounded-lg border border-slate-700/50 cursor-pointer hover:border-blue-500/50 transition-all"
                >
                  <div className="flex flex-col items-center text-center gap-0.5">
                    <div className="p-1.5 bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 rounded-lg transition-all">
                      <BarChart3 className="w-4 h-4 text-blue-400 group-hover:text-white" />
                    </div>
                    <h4 className="text-[10px] font-semibold text-white">Report</h4>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* STATISTICHE PERSONALI */}
        {isSetter && (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <motion.div 
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 backdrop-blur-md p-2 rounded-lg border border-blue-500/20 shadow-xl preserve-white"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="p-1 bg-blue-500/10 rounded">
                  <Plus className="text-blue-400" size={12} />
                </div>
              </div>
              <p className="text-xl font-bold text-white mb-0.5">{totalLeads}</p>
              <h3 className="text-[10px] text-blue-300 font-medium leading-tight">Leads</h3>
            </motion.div>
            <motion.div 
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 backdrop-blur-md p-2 rounded-lg border border-yellow-500/20 shadow-xl preserve-white"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="p-1 bg-yellow-500/10 rounded">
                  <Phone className="text-yellow-400" size={12} />
                </div>
              </div>
              <p className="text-xl font-bold text-white mb-0.5">{callPrenotate}</p>
              <h3 className="text-[10px] text-yellow-300 font-medium leading-tight">Chiamate</h3>
            </motion.div>
            <motion.div 
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/10 backdrop-blur-md p-2 rounded-lg border border-cyan-500/20 shadow-xl preserve-white"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="p-1 bg-cyan-500/10 rounded">
                  <TrendingUp className="text-cyan-400" size={12} />
                </div>
              </div>
              <p className="text-xl font-bold text-white mb-0.5">{tassoShowUp}%</p>
              <h3 className="text-[10px] text-cyan-300 font-medium leading-tight">Show-up</h3>
            </motion.div>
          </div>
        )}

        {/* CHIAMATE GIORNALIERE */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Chiamate giornaliere</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-1.5 sm:gap-2">
            {todayCalls.map((s, i) => (
              <motion.div 
                key={i} 
                className="bg-slate-800/40 backdrop-blur-md p-2 rounded-lg border border-slate-700/30 text-center min-w-0 shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="relative mb-1">
                  <img 
                    src={s.photoURL || '/default-avatar.png'} 
                    alt={s.name} 
                    className="w-8 h-8 rounded-full mx-auto border border-blue-500/30"
                  />
                </div>
                <p className="text-[10px] text-slate-400 truncate mb-0.5">{s.name}</p>
                <p className="text-lg font-bold text-white">{s.calls}</p>
                <div className="mt-0.5 px-1.5 py-0.5 bg-emerald-500/10 rounded text-[9px] text-emerald-400 font-medium">
                  M: {s.monthTotal}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* GRAFICO SETTIMANA */}
        <div className="bg-slate-800/40 backdrop-blur-md p-3 rounded-xl border border-slate-700/30 shadow-2xl">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <BarChart3 className="text-blue-400" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Performance Team</h3>
                <p className="text-[10px] text-slate-400">Chiamate settimana</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button 
                onClick={() => setWeekOffset(prev => prev - 1)} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <ChevronLeft size={20} />
              </motion.button>
              <span className="text-sm text-slate-200 font-medium px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/30">{period}</span>
              <motion.button 
                onClick={() => setWeekOffset(prev => prev + 1)} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>

          {allCollaboratori.length === 0 ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="text-slate-600 w-16 h-16 mx-auto mb-4" />
                <p className="text-slate-400 text-base font-medium">Nessun collaboratore trovato</p>
                <p className="text-slate-500 text-sm mt-2">I dati del grafico appariranno qui</p>
              </div>
            </div>
          ) : (
            <RadialCollaboratorChart collaboratori={radialData} />
          )}
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
                <button onClick={handleSaveProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white preserve-white py-2 rounded-lg flex items-center justify-center gap-2">
                  <Save size={16} /> Salva Profilo
                </button>
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-semibold mb-2">Reimposta Password</h4>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Password Attuale" className="p-2 bg-slate-800/70 border border-white/10 rounded w-full mb-2 text-white" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nuova Password" className="p-2 bg-slate-800/70 border border-white/10 rounded w-full mb-2 text-white" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Conferma Password" className="p-2 bg-slate-800/70 border border-white/10 rounded w-full mb-2 text-white" />
                  <button onClick={handleResetPassword} className="w-full bg-red-600 hover:bg-red-700 text-white preserve-white py-2 rounded-lg flex items-center justify-center gap-2">
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
                <motion.button onClick={handleSaveTracker} className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white preserve-white font-semibold rounded-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                      {fonti.map(f => <option key={f} value={f}>{f}</option>)}
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

                {/* Data e Ora con Picker Visuale */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data e Ora Appuntamento *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('📅 Apertura calendario picker, eventi caricati:', calendarEvents.length);
                      setShowDateTimePicker(true);
                    }}
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
                    onClick={handleSaveLead} 
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
                          <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs ${lead.showUp ? 'bg-green-600 text-white preserve-white' : 'bg-yellow-600 text-white preserve-white'}`}>
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

      {/* PICKER DATA E ORA */}
      <AnimatePresence>
        {showDateTimePicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-900/80 rounded-2xl border border-white/10 w-full max-w-lg flex flex-col max-h-[90vh]">
              {/* Header Fisso */}
              <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">\ud83d\udcc5 Seleziona Data e Ora</h3>
                <button onClick={() => setShowDateTimePicker(false)} className="text-white hover:text-rose-400"><X size={24} /></button>
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
                        // Usa lo stesso formato di CalendarPage
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;
                        const isSelected = selectedDate === dateStr;
                        
                        days.push(
                          <button
                            key={dateStr}
                            type="button"
                            data-date={dateStr}
                            onClick={(e) => {
                              const clickedDate = e.currentTarget.getAttribute('data-date');
                              console.log('🖱️ CLICK su data:', clickedDate);
                              setSelectedDate(clickedDate);
                              setLastGeneratedDate(null);
                              generateTimeSlots(clickedDate);
                            }}
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
                    <div className="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
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
                        <div className="col-span-3 text-center py-6">
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
                <button onClick={handleDeleteLead} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white preserve-white rounded-lg">
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