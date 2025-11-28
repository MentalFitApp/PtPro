// src/pages/coach/CoachDashboardNew.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, onSnapshot, query, where, orderBy, getDocs, getDoc, doc, setDoc, serverTimestamp 
} from "firebase/firestore";
import { auth, db, toDate } from "../../firebase";
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { signOut, updateProfile } from "firebase/auth";
import { uploadPhoto } from "../../cloudflareStorage";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantBranding } from '../../hooks/useTenantBranding';
import { useCountUp } from '../../hooks/useCountUp';
import {
  Users, Calendar, Target, Eye, EyeOff, Settings, BarChart3, Clock, 
  CheckCircle, AlertCircle, Plus, LogOut, User, X, FileText, 
  Bell, TrendingUp, Dumbbell, Utensils
} from "lucide-react";

// Componente MetricCard con animazione
function AnimatedMetricCard({ value, label, icon: Icon, gradientFrom, gradientTo, borderColor, iconColor, textColor, suffix = '', prefix = '', badge = null }) {
  const numericValue = parseFloat(value) || 0;
  const isPercentage = suffix === '%';
  const isCurrency = suffix === '€';
  const animatedValue = useCountUp(numericValue, 800);
  const [isComplete, setIsComplete] = React.useState(false);
  
  React.useEffect(() => {
    if (animatedValue === numericValue && numericValue > 0) {
      setIsComplete(true);
      const timer = setTimeout(() => setIsComplete(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [animatedValue, numericValue]);
  
  const displayValue = isCurrency 
    ? `${animatedValue}${suffix}`
    : isPercentage
    ? `${animatedValue}${suffix}`
    : `${animatedValue}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isComplete ? [1, 1.05, 1] : 1
      }}
      transition={{ 
        duration: 0.4,
        scale: { duration: 0.4 }
      }}
      className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} backdrop-blur-sm border ${borderColor} rounded-lg p-1.5 sm:p-3 overflow-hidden preserve-white`}
    >
      {/* Effetto shine quando completa */}
      {isComplete && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Pulse ring effect */}
      {isComplete && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={`absolute inset-0 border-2 ${borderColor} rounded-lg`}
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      <div className="flex items-center justify-between mb-0.5 relative z-10">
        <Icon className={iconColor} size={12} />
        {badge}
      </div>
      <p className="text-base sm:text-2xl font-bold text-white truncate relative z-10">{displayValue}</p>
      <p className={`text-[9px] sm:text-xs ${textColor} truncate relative z-10`}>{label}</p>
    </motion.div>
  );
}

export default function CoachDashboardNew() {
  const navigate = useNavigate();
  const { branding } = useTenantBranding();
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [lastViewed, setLastViewed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentPhotoURL, setCurrentPhotoURL] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [visibleMetrics, setVisibleMetrics] = useState({
    activeClients: true,
    newClients: true,
    pendingChecks: true,
    pendingAnamnesi: true,
    workouts: true,
    nutrition: true
  });

  // Check ruolo
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'coach') {
      signOut(auth).then(() => navigate('/login'));
      return;
    }
  }, [navigate]);

  // User profile
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'Coach');
        setCurrentPhotoURL(user.photoURL);
      }
    });
    return () => unsubscribe();
  }, []);

  // Gestione foto profilo
  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Seleziona un file immagine valido');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("L'immagine non può superare i 5MB");
        return;
      }
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Carica clienti
  useEffect(() => {
    const unsub = onSnapshot(getTenantCollection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Last viewed
  useEffect(() => {
    const lastViewedRef = getTenantDoc(db, 'app-data', 'lastViewedCoach');
    const fetchLastViewed = async () => {
      const docSnap = await getDoc(lastViewedRef);
      const lastViewedTime = docSnap.exists() ? docSnap.data().timestamp : null;
      setLastViewed(lastViewedTime);
      await setDoc(lastViewedRef, { timestamp: serverTimestamp() }, { merge: true });
    };
    fetchLastViewed();
  }, []);

  // Activity feed: CHECK, ANAMNESI, NUOVI CLIENTI
  useEffect(() => {
    let unsubs = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // CHECK - mostra tutti gli ultimi 30 giorni
    const setupChecksListener = async () => {
      const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
      clientsSnap.forEach(clientDoc => {
        const clientData = clientDoc.data();
        if (clientData.isOldClient) return;
        
        const checksQuery = query(
          getTenantSubcollection(db, 'clients', clientDoc.id, 'checks'),
          orderBy('createdAt', 'desc')
        );
        
        const unsubCheck = onSnapshot(checksQuery, (checksSnap) => {
          const allChecks = [];
          checksSnap.docs.forEach(checkDoc => {
            const checkData = checkDoc.data();
            const createdAt = toDate(checkData.createdAt);
            // Mostra check degli ultimi 30 giorni
            if (createdAt && createdAt >= thirtyDaysAgo) {
              allChecks.push({
                type: 'new_check',
                clientId: clientDoc.id,
                clientName: clientData.name || 'Cliente',
                description: 'Check-in inviato',
                date: checkData.createdAt,
                isNew: lastViewed && createdAt > toDate(lastViewed)
              });
            }
          });
          setActivityFeed(prev => {
            const filtered = prev.filter(i => i.type !== 'new_check' || i.clientId !== clientDoc.id);
            return [...filtered, ...allChecks];
          });
        });
        unsubs.push(unsubCheck);
      });
    };

    // ANAMNESI - mostra tutte quelle degli ultimi 30 giorni
    const setupAnamnesiListener = async () => {
      const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
      clientsSnap.forEach(clientDoc => {
        const clientData = clientDoc.data();
        if (clientData.isOldClient) return;
        
        const anamnesiQuery = query(
          getTenantSubcollection(db, 'clients', clientDoc.id, 'anamnesi'),
          orderBy('submittedAt', 'desc')
        );
        
        const unsubAnamnesi = onSnapshot(anamnesiQuery, (anamnesiSnap) => {
          const allAnamnesi = [];
          anamnesiSnap.docs.forEach(anamnesiDoc => {
            const anamnesiData = anamnesiDoc.data();
            const submittedAt = toDate(anamnesiData.submittedAt);
            // Mostra anamnesi degli ultimi 30 giorni
            if (submittedAt && submittedAt >= thirtyDaysAgo) {
              allAnamnesi.push({
                type: 'new_anamnesi',
                clientId: clientDoc.id,
                clientName: clientData.name || 'Cliente',
                description: 'Anamnesi completata',
                date: anamnesiData.submittedAt,
                isNew: lastViewed && submittedAt > toDate(lastViewed)
              });
            }
          });
          setActivityFeed(prev => {
            const filtered = prev.filter(i => i.type !== 'new_anamnesi' || i.clientId !== clientDoc.id);
            return [...filtered, ...allAnamnesi];
          });
        });
        unsubs.push(unsubAnamnesi);
      });
    };

    // NUOVI CLIENTI
    const clientsQuery = query(getTenantCollection(db, 'clients'));
    const unsubClients = onSnapshot(clientsQuery, (snap) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newClients = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => {
          if (c.isOldClient) return false;
          const startDate = toDate(c.startDate);
          return startDate && startDate >= monthStart;
        })
        .map(c => ({
          type: 'new_client',
          clientId: c.id,
          clientName: c.name || 'Cliente',
          description: `Nuovo cliente - ${c.goal || 'Obiettivo non specificato'}`,
          date: c.startDate
        }));
      
      setActivityFeed(prev => [...prev.filter(i => i.type !== 'new_client'), ...newClients]);
    });
    unsubs.push(unsubClients);

    setupChecksListener();
    setupAnamnesiListener();

    return () => unsubs.forEach(unsub => unsub());
  }, [lastViewed]);

  // Calcoli metriche
  const metrics = useMemo(() => {
    const now = new Date();
    const activeClientsList = clients.filter(c => !c.isOldClient);
    
    let rangeDate;
    if (timeRange === '30') {
      rangeDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      rangeDate = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    }

    const recentClients = activeClientsList.filter(c => {
      const cDate = toDate(c.startDate);
      return cDate && cDate >= rangeDate;
    });

    const activeClientsCount = activeClientsList.filter(c => {
      const exp = toDate(c.scadenza);
      return exp && exp > now;
    }).length;

    // Conta check e anamnesi pendenti
    const pendingChecks = activityFeed.filter(a => a.type === 'new_check').length;
    const pendingAnamnesi = activityFeed.filter(a => a.type === 'new_anamnesi').length;

    return {
      activeClients: activeClientsCount,
      totalClients: activeClientsList.length,
      newClients: recentClients.length,
      pendingChecks,
      pendingAnamnesi,
      workouts: 0, // Da implementare
      nutrition: 0, // Da implementare
      expiringClients: activeClientsList.filter(c => {
        const exp = toDate(c.scadenza);
        if (!exp) return false;
        const daysToExpiry = (exp - now) / (1000 * 60 * 60 * 24);
        return daysToExpiry > 0 && daysToExpiry <= 7;
      }).length
    };
  }, [clients, timeRange, activityFeed]);

  const toggleMetric = (key) => {
    setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }));
    localStorage.setItem('coach_metrics', JSON.stringify({ ...visibleMetrics, [key]: !visibleMetrics[key] }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('coach_metrics');
    if (saved) setVisibleMetrics(JSON.parse(saved));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <div className="w-full max-w-[100vw] py-2 sm:py-4 space-y-2 sm:space-y-4 mobile-safe-bottom overflow-x-hidden">
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-lg p-2 sm:p-5 shadow-2xl mx-1.5 sm:mx-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-2xl font-bold text-white mb-0.5 truncate">
                Dashboard - {userName || 'Coach'}
              </h1>
              <p className="text-[9px] sm:text-sm text-slate-400 truncate">Gestisci i tuoi clienti</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/new-client')}
                className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium shadow-lg text-[10px] sm:text-sm preserve-white"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Nuovo Cliente</span>
                <span className="sm:hidden">Nuovo</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileModal(true)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white preserve-white"
              >
                <Settings size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  await signOut(auth);
                  navigate('/login');
                }}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400"
              >
                <LogOut size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* QUICK ACTIONS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mx-1.5 sm:mx-4"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/clients')}
            className="flex items-center justify-center gap-1 p-1.5 sm:p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all text-[10px] sm:text-xs font-medium text-slate-300 hover:text-white preserve-white"
          >
            <Users size={12} />
            <span>Clienti</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/calendar')}
            className="flex items-center justify-center gap-1 p-1.5 sm:p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all text-[10px] sm:text-xs font-medium text-slate-300 hover:text-white preserve-white"
          >
            <Calendar size={12} />
            <span>Calendario</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('checks')}
            className="flex items-center justify-center gap-1 p-1.5 sm:p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all text-[10px] sm:text-xs font-medium text-slate-300 hover:text-white preserve-white"
          >
            <CheckCircle size={12} />
            <span>Check-in</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('anamnesi')}
            className="flex items-center justify-center gap-1 p-1.5 sm:p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all text-[10px] sm:text-xs font-medium text-slate-300 hover:text-white preserve-white"
          >
            <FileText size={12} />
            <span>Anamnesi</span>
          </motion.button>
        </motion.div>

        {/* FILTRI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mx-1.5 sm:mx-4">
          <h2 className="text-xs sm:text-base font-semibold text-white flex items-center gap-1.5">
            <BarChart3 size={14} /> Metriche
          </h2>
          
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select 
              value={timeRange} 
              onChange={e => setTimeRange(e.target.value)}
              className="px-2 py-1 bg-slate-800 text-white preserve-white rounded-lg border border-slate-700 text-[10px] flex-1 sm:flex-none"
            >
              <option value="7">Ultimi 7 giorni</option>
              <option value="30">Mese corrente</option>
              <option value="90">Ultimi 3 mesi</option>
            </select>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white preserve-white rounded-lg border border-slate-700 flex-shrink-0"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        {/* PANNELLO IMPOSTAZIONI */}
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700 p-2 mx-2 sm:mx-4"
          >
            <p className="text-xs text-slate-400 mb-2">Mostra/Nascondi Metriche:</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(visibleMetrics).map(key => (
                <button
                  key={key}
                  onClick={() => toggleMetric(key)}
                  className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
                    visibleMetrics[key]
                      ? 'bg-blue-600 text-white preserve-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {visibleMetrics[key] ? <Eye size={12} /> : <EyeOff size={12} />}
                  {key}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* METRICHE CON ANIMAZIONE */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-3 mx-1.5 sm:mx-4">
          {visibleMetrics.activeClients && (
            <AnimatedMetricCard
              value={metrics.activeClients}
              label="Attivi"
              icon={Users}
              gradientFrom="from-blue-900/40"
              gradientTo="to-blue-800/20"
              borderColor="border-blue-500/30"
              iconColor="text-blue-400"
              textColor="text-blue-300"
              badge={<span className="text-[8px] sm:text-xs text-blue-300">{metrics.activeClients}/{metrics.totalClients}</span>}
            />
          )}

          {visibleMetrics.newClients && (
            <AnimatedMetricCard
              value={metrics.newClients}
              label="Nuovi"
              icon={Plus}
              gradientFrom="from-emerald-900/40"
              gradientTo="to-emerald-800/20"
              borderColor="border-emerald-500/30"
              iconColor="text-emerald-400"
              textColor="text-emerald-300"
            />
          )}

          {visibleMetrics.pendingChecks && (
            <AnimatedMetricCard
              value={metrics.pendingChecks}
              label="Check"
              icon={CheckCircle}
              gradientFrom="from-purple-900/40"
              gradientTo="to-purple-800/20"
              borderColor="border-purple-500/30"
              iconColor="text-purple-400"
              textColor="text-purple-300"
            />
          )}

          {visibleMetrics.pendingAnamnesi && (
            <AnimatedMetricCard
              value={metrics.pendingAnamnesi}
              label="Anamnesi"
              icon={FileText}
              gradientFrom="from-amber-900/40"
              gradientTo="to-amber-800/20"
              borderColor="border-amber-500/30"
              iconColor="text-amber-400"
              textColor="text-amber-300"
            />
          )}

          {visibleMetrics.workouts && (
            <AnimatedMetricCard
              value={metrics.workouts}
              label="Schede"
              icon={Dumbbell}
              gradientFrom="from-cyan-900/40"
              gradientTo="to-cyan-800/20"
              borderColor="border-cyan-500/30"
              iconColor="text-cyan-400"
              textColor="text-cyan-300"
            />
          )}

          {visibleMetrics.nutrition && (
            <AnimatedMetricCard
              value={metrics.nutrition}
              label="Nutrizione"
              icon={Utensils}
              gradientFrom="from-rose-900/40"
              gradientTo="to-rose-800/20"
              borderColor="border-rose-500/30"
              iconColor="text-rose-400"
              textColor="text-rose-300"
            />
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-0.5 overflow-x-auto bg-slate-900/50 p-1 rounded-lg border border-slate-700 mx-1.5 sm:mx-4 scrollbar-hide">
          {['overview', 'checks', 'anamnesi', 'clienti', 'scadenze', 'attività'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 text-[10px] sm:text-xs rounded whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white preserve-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {tab === 'overview' ? '📊 Panoramica' :
               tab === 'checks' ? '✅ Check-in' :
               tab === 'anamnesi' ? '📋 Anamnesi' :
               tab === 'clienti' ? '👥 Clienti' :
               tab === 'scadenze' ? '⏰ Scadenze' :
               '🔔 Attività'}
            </button>
          ))}
        </div>

        {/* CONTENUTO TAB */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700 p-1.5 sm:p-3 mx-1.5 sm:mx-4 overflow-x-hidden">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 size={16} /> Panoramica Rapida
              </h3>
              
              {metrics.expiringClients > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 flex items-start gap-2">
                  <AlertCircle className="text-amber-400 flex-shrink-0" size={16} />
                  <div>
                    <p className="text-xs font-semibold text-amber-300">
                      {metrics.expiringClients} clienti in scadenza nei prossimi 7 giorni
                    </p>
                    <button 
                      onClick={() => setActiveTab('scadenze')}
                      className="text-[10px] text-amber-400 hover:underline mt-1"
                    >
                      Vedi dettagli →
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 mb-2">Check-in Recenti</p>
                <div className="space-y-1.5">
                  {activityFeed.filter(a => a.type === 'new_check').slice(0, 5).map((activity, idx) => (
                    <div 
                      key={idx}
                      onClick={() => navigate(`/client/${activity.clientId}?tab=check`)}
                      className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckCircle className="text-purple-400 flex-shrink-0" size={14} />
                        <span className="text-xs text-white truncate">{activity.clientName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {toDate(activity.date)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                  {activityFeed.filter(a => a.type === 'new_check').length === 0 && (
                    <p className="text-xs text-slate-500 py-2 text-center">Nessun check-in recente</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checks' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle size={16} /> Check-in Ricevuti ({activityFeed.filter(a => a.type === 'new_check').length})
              </h3>
              
              <div className="space-y-1">
                {activityFeed
                  .filter(a => a.type === 'new_check')
                  .sort((a, b) => {
                    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                    return dateB - dateA;
                  })
                  .map((activity, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigate(`/client/${activity.clientId}?tab=check`)}
                    className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CheckCircle className="text-purple-400 flex-shrink-0" size={14} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{activity.clientName}</p>
                        <p className="text-[10px] text-slate-400">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {toDate(activity.date)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
                {activityFeed.filter(a => a.type === 'new_check').length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">Nessun check-in da visualizzare</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'anamnesi' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText size={16} /> Anamnesi Ricevute ({activityFeed.filter(a => a.type === 'new_anamnesi').length})
              </h3>
              
              <div className="space-y-1">
                {activityFeed
                  .filter(a => a.type === 'new_anamnesi')
                  .sort((a, b) => {
                    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                    return dateB - dateA;
                  })
                  .map((activity, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigate(`/client/${activity.clientId}?tab=anamnesi`)}
                    className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="text-amber-400 flex-shrink-0" size={14} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{activity.clientName}</p>
                        <p className="text-[10px] text-slate-400">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {toDate(activity.date)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
                {activityFeed.filter(a => a.type === 'new_anamnesi').length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">Nessuna anamnesi da visualizzare</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'clienti' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users size={16} /> Tutti i Clienti ({clients.filter(c => !c.isOldClient).length})
                </h3>
                <button
                  onClick={() => navigate('/clients')}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Vedi tutti →
                </button>
              </div>
              
              <div className="space-y-1">
                {clients.filter(c => !c.isOldClient).slice(0, 10).map(client => {
                  const exp = toDate(client.scadenza);
                  const isActive = exp && exp > new Date();
                  const daysLeft = exp ? Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  
                  return (
                    <div 
                      key={client.id}
                      onClick={() => navigate(`/client/${client.id}`)}
                      className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-white truncate">{client.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {daysLeft !== null && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            daysLeft <= 7 ? 'bg-amber-500/20 text-amber-300' :
                            daysLeft <= 30 ? 'bg-blue-500/20 text-blue-300' :
                            'bg-slate-600/50 text-slate-400'
                          }`}>
                            {daysLeft > 0 ? `${daysLeft}gg` : 'Scaduto'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'scadenze' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock size={16} /> Clienti in Scadenza
              </h3>
              
              <div className="space-y-1">
                {clients
                  .filter(c => {
                    if (c.isOldClient) return false;
                    const exp = toDate(c.scadenza);
                    if (!exp) return false;
                    const daysToExpiry = (exp - new Date()) / (1000 * 60 * 60 * 24);
                    return daysToExpiry <= 30 && daysToExpiry >= 0;
                  })
                  .sort((a, b) => toDate(a.scadenza) - toDate(b.scadenza))
                  .map(client => {
                    const exp = toDate(client.scadenza);
                    const daysLeft = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div 
                        key={client.id}
                        onClick={() => navigate(`/client/${client.id}`)}
                        className="flex items-center justify-between p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Clock 
                            className={`flex-shrink-0 ${
                              daysLeft <= 7 ? 'text-red-400' : 
                              daysLeft <= 14 ? 'text-amber-400' : 
                              'text-blue-400'
                            }`} 
                            size={14} 
                          />
                          <span className="text-xs text-white truncate">{client.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold ${
                            daysLeft <= 7 ? 'text-red-400' : 
                            daysLeft <= 14 ? 'text-amber-400' : 
                            'text-blue-400'
                          }`}>
                            {daysLeft} giorni
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {exp.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {clients.filter(c => {
                  if (c.isOldClient) return false;
                  const exp = toDate(c.scadenza);
                  if (!exp) return false;
                  const daysToExpiry = (exp - new Date()) / (1000 * 60 * 60 * 24);
                  return daysToExpiry <= 30 && daysToExpiry >= 0;
                }).length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">Nessun cliente in scadenza</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attività' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bell size={16} /> Attività Recenti ({activityFeed.length})
              </h3>
              
              {activityFeed.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Nessuna attività recente</p>
              ) : (
                <div className="space-y-1">
                  {activityFeed
                    .sort((a, b) => {
                      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                      return dateB - dateA;
                    })
                    .slice(0, 15)
                    .map((activity, idx) => (
                      <div
                        key={idx}
                        onClick={() => navigate(`/client/${activity.clientId}?tab=${
                          activity.type === 'new_client' ? 'info' :
                          activity.type === 'new_check' ? 'check' : 'anamnesi'
                        }`)}
                        className="flex items-start gap-2 p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'new_client' ? 'bg-green-500/20' :
                          activity.type === 'new_check' ? 'bg-blue-500/20' :
                          'bg-purple-500/20'
                        }`}>
                          {activity.type === 'new_client' ? <Plus className="text-green-400" size={14} /> :
                           activity.type === 'new_check' ? <CheckCircle className="text-blue-400" size={14} /> :
                           <FileText className="text-purple-400" size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{activity.clientName}</p>
                          <p className="text-[10px] text-slate-400">{activity.description}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 flex-shrink-0">
                          {toDate(activity.date)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700 shadow-2xl max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <User size={18} /> Profilo Coach
                </h3>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setSelectedPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Inserisci il tuo nome"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">Foto Profilo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center overflow-hidden relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Anteprima" className="w-full h-full object-cover" />
                      ) : currentPhotoURL ? (
                        <img src={currentPhotoURL} alt="Foto profilo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-slate-100">
                          {userName?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-xs cursor-pointer inline-block text-center"
                      >
                        Cambia Foto
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setSelectedPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
                >
                  Annulla
                </button>
                <button
                  onClick={async () => {
                    try {
                      const updateData = { displayName: userName };
                      if (selectedPhotoFile) {
                        const photoURL = await uploadPhoto(selectedPhotoFile, auth.currentUser.uid, 'profile_photos', null, true);
                        updateData.photoURL = photoURL;
                      }
                      await updateProfile(auth.currentUser, updateData);
                      if (selectedPhotoFile && updateData.photoURL) {
                        setCurrentPhotoURL(updateData.photoURL + '?t=' + Date.now());
                      }
                      setSelectedPhotoFile(null);
                      setPhotoPreview(null);
                      setShowProfileModal(false);
                      alert('Profilo aggiornato!');
                    } catch (error) {
                      console.error('Errore aggiornamento profilo:', error);
                      alert('Errore durante aggiornamento profilo');
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm preserve-white"
                >
                  Salva
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
