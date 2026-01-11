// src/pages/client/ClientDashboard.jsx
// Dashboard Cliente - Redesign v2.0
// Layout ottimizzato per mobile con focus su azioni quotidiane

import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useNavigate, Link } from 'react-router-dom';
import { getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { 
  User, LogOut, AlertCircle, 
  Dumbbell, Utensils, CheckSquare, Users, 
  FileText, CreditCard, Settings, ChevronRight, X, UserCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationPanel from '../../components/notifications/NotificationPanel';
import { useTenantBranding } from '../../hooks/useTenantBranding';
import HeroStreakCard from '../../components/client/HeroStreakCard';
import QuickHabits from '../../components/client/QuickHabits';
import MiniProgressCard from '../../components/client/MiniProgressCard';
import CheckReminderCard from '../../components/client/CheckReminderCard';
import CelebrationMoments from '../../components/client/CelebrationMoments';
import BlockedAccess from '../../components/client/BlockedAccess';
import AnamnesiRequiredModal from '../../components/client/AnamnesiRequiredModal';
import LinkAccountBanner from '../../components/LinkAccountBanner';
import { CallsCompactCard } from '../../components/calls/CallScheduler';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import NetworkStatusBanner from '../../components/pwa/NetworkStatusBanner';
import PullToRefresh from '../../components/pwa/PullToRefresh';
import { runSmartNotificationCheck } from '../../services/smartNotifications';

// Loading skeleton migliorato
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 px-4 py-5 space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-6 w-40 bg-slate-700/50 rounded-lg animate-pulse" />
        <div className="h-3 w-24 bg-slate-700/30 rounded mt-2 animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-10 bg-slate-700/50 rounded-xl animate-pulse" />
        <div className="h-10 w-10 bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    </div>
    <div className="h-28 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-2xl animate-pulse" />
    <div className="grid grid-cols-3 gap-3">
      <div className="h-24 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl animate-pulse" />
      <div className="h-24 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl animate-pulse" />
      <div className="h-24 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl animate-pulse" />
    </div>
    <div className="h-20 bg-slate-700/30 rounded-2xl animate-pulse" />
    <div className="h-16 bg-slate-700/30 rounded-2xl animate-pulse" />
  </div>
);

// Bottone azione primaria grande con glow effect
const PrimaryActionButton = ({ to, icon: Icon, label, color, badge }) => {
  const colorConfig = {
    blue: {
      gradient: 'from-blue-600 to-blue-500',
      glow: 'shadow-blue-500/30',
      iconBg: 'bg-blue-400/20',
      hoverGlow: 'hover:shadow-blue-500/50',
    },
    green: {
      gradient: 'from-emerald-600 to-emerald-500',
      glow: 'shadow-emerald-500/30',
      iconBg: 'bg-emerald-400/20',
      hoverGlow: 'hover:shadow-emerald-500/50',
    },
    purple: {
      gradient: 'from-purple-600 to-purple-500',
      glow: 'shadow-purple-500/30',
      iconBg: 'bg-purple-400/20',
      hoverGlow: 'hover:shadow-purple-500/50',
    },
  };

  const config = colorConfig[color];

  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.95 }}
        className={`relative bg-gradient-to-br ${config.gradient} rounded-2xl p-4 shadow-lg ${config.glow} ${config.hoverGlow} transition-all duration-300 overflow-hidden`}
      >
        {/* Glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        
        {badge && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-red-500/50 z-10"
          >
            {badge}
          </motion.span>
        )}
        <div className="relative flex flex-col items-center gap-2">
          <div className={`p-2 rounded-xl ${config.iconBg} backdrop-blur-sm`}>
            <Icon size={24} className="text-white drop-shadow-lg" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">{label}</span>
        </div>
      </motion.div>
    </Link>
  );
};

// Link secondario compatto con glassmorphism
const SecondaryLink = ({ to, icon: Icon, label }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/40 hover:bg-slate-700/60 rounded-xl border border-slate-700/40 hover:border-slate-600/50 transition-all duration-200 backdrop-blur-sm group"
    >
      <div className="p-1.5 rounded-lg bg-slate-700/50 group-hover:bg-slate-600/50 transition-colors">
        <Icon size={14} className="text-slate-400 group-hover:text-slate-300 transition-colors" />
      </div>
      <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
    </motion.div>
  </Link>
);

// Progress bar scadenza abbonamento con design migliorato
const SubscriptionProgress = ({ daysLeft, totalDays = 30 }) => {
  const progress = Math.max(0, Math.min((daysLeft / totalDays) * 100, 100));
  const isUrgent = daysLeft <= 7;
  const isExpired = daysLeft <= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 border backdrop-blur-sm ${
        isExpired 
          ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/10' 
          : isUrgent 
            ? 'bg-orange-500/10 border-orange-500/30 shadow-lg shadow-orange-500/10' 
            : 'bg-slate-800/30 border-slate-700/40'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isExpired ? 'bg-red-500 animate-pulse' : isUrgent ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'
          }`} />
          <span className="text-xs font-medium text-slate-400">Abbonamento</span>
        </div>
        <span className={`text-sm font-bold ${
          isExpired ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-slate-200'
        }`}>
          {isExpired ? 'Scaduto' : `${daysLeft} giorni rimasti`}
        </span>
      </div>
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full relative ${
            isExpired 
              ? 'bg-red-500' 
              : isUrgent 
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-400'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const ClientDashboard = () => {
  const { branding } = useTenantBranding();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [requireAnamnesi, setRequireAnamnesi] = useState(false);
  const [hasAnamnesi, setHasAnamnesi] = useState(true);
  const [needsGenderUpdate, setNeedsGenderUpdate] = useState(false);
  const [pendingCheckDays, setPendingCheckDays] = useState(null);
  const [lastCheckDate, setLastCheckDate] = useState(null);
  const [heroRefreshKey, setHeroRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  
  useDocumentTitle('La mia Dashboard');
  
  // Callback per quando workout cambia in QuickHabits
  const handleWorkoutChange = () => {
    // Piccolo delay per assicurarsi che Firestore abbia salvato
    setTimeout(() => {
      setHeroRefreshKey(prev => prev + 1);
    }, 300);
  };

  // Funzione per ricaricare i dati (usata da pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setHeroRefreshKey(prev => prev + 1);
    // Simula un piccolo delay per feedback visivo
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setError('Caricamento lento. Riprova.');
    }, 8000);

    const checkAnamnesiRequirement = async (clientData) => {
      try {
        // I vecchi clienti (isOldClient) non devono compilare l'anamnesi obbligatoria
        if (clientData?.isOldClient) {
          setHasAnamnesi(true); // Considera come se avesse l'anamnesi
          return;
        }
        
        const settingsRef = getTenantDoc(db, 'platform_settings', 'global');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const settings = settingsSnap.data();
          if (settings.requireAnamnesiOnFirstAccess) {
            setRequireAnamnesi(true);
            
            const anamnesiRef = getTenantSubcollection(db, 'clients', user.uid, 'anamnesi');
            const anamnesiQuery = query(anamnesiRef, limit(1));
            const anamnesiSnap = await getDocs(anamnesiQuery);
            
            const clientHasAnamnesi = anamnesiSnap.docs.length > 0;
            setHasAnamnesi(clientHasAnamnesi);
            
            if (clientHasAnamnesi && anamnesiSnap.docs[0] && !anamnesiSnap.docs[0].data().gender) {
              setNeedsGenderUpdate(true);
            }
          }
        }
      } catch (error) {
        console.error('Errore verifica anamnesi:', error);
        setHasAnamnesi(true);
      }
    };

    const fetchClientData = async () => {
      try {
        const clientDocRef = getTenantDoc(db, 'clients', user.uid);
        const docSnap = await getDoc(clientDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Controlla anamnesi DOPO aver caricato i dati cliente (per verificare isOldClient)
          await checkAnamnesiRequirement(data);
          
          if (data.firstLogin === true) {
            clearTimeout(loadingTimeout);
            navigate('/first-access');
            return;
          }

          if (data.isArchived && data.archiveSettings?.blockAppAccess) {
            setIsBlocked(true);
            setBlockMessage(data.archiveSettings.customMessage || 'Accesso sospeso. Contatta il tuo trainer.');
            clearTimeout(loadingTimeout);
            setLoading(false);
            return;
          }

          setClientData(data);
          
          // Check pending check-in
          const checksRef = getTenantSubcollection(db, 'clients', user.uid, 'checks');
          const checksQuery = query(checksRef, orderBy('createdAt', 'desc'), limit(1));
          const checksSnap = await getDocs(checksQuery);
          
          if (checksSnap.docs.length > 0) {
            const lastCheck = checksSnap.docs[0].data().createdAt?.toDate();
            if (lastCheck) {
              setLastCheckDate(lastCheck);
              const daysSinceCheck = Math.floor((new Date() - lastCheck) / (1000 * 60 * 60 * 24));
              setPendingCheckDays(daysSinceCheck);
            }
          } else {
            setPendingCheckDays(-1); // Nessun check mai fatto
          }
          
          // Esegui smart notification check (una volta al login)
          try {
            await runSmartNotificationCheck(user.uid);
          } catch (e) {
            console.log('Smart notification check skipped:', e.message);
          }
          
          clearTimeout(loadingTimeout);
          setLoading(false);
        } else {
          clearTimeout(loadingTimeout);
          setLoading(false);
          setError('Profilo non trovato.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        clearTimeout(loadingTimeout);
        setLoading(false);
        setError('Errore caricamento: ' + err.message);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    fetchClientData();
    
    return () => clearTimeout(loadingTimeout);
  }, [user, navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => {
      sessionStorage.removeItem('app_role');
      navigate('/login');
    });
  };

  // Calcola giorni rimasti abbonamento
  const getDaysLeft = () => {
    if (!clientData?.scadenza?.toDate) return null;
    const scadenza = clientData.scadenza.toDate();
    const oggi = new Date();
    scadenza.setHours(23, 59, 59, 999);
    oggi.setHours(0, 0, 0, 0);
    return Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));
  };

  if (loading) return <LoadingSpinner />;
  if (isBlocked) return <BlockedAccess message={blockMessage} />;
  if (requireAnamnesi && !hasAnamnesi) return <AnamnesiRequiredModal clientName={clientData?.name} />;
  
  if (!clientData) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center p-8">
        <p className="text-center text-red-400 flex items-center gap-2">
          <AlertCircle size={18} />
          {error || 'Errore nel caricamento.'}
        </p>
      </div>
    );
  }

  const daysLeft = getDaysLeft();

  return (
    <>
      {/* Network Status Banner */}
      <NetworkStatusBanner position="top" />
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen overflow-x-hidden w-full pb-20">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg mx-auto px-4 py-5 space-y-5"
          >
            {/* Header con greeting migliorato */}
            <header className="flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold text-white"
            >
              Ciao, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{clientData.name?.split(' ')[0]}</span>! 👋
            </motion.h1>
            <p className="text-xs text-slate-500 mt-0.5">{branding.clientAreaName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <NotificationPanel userType="client" showEnableButton={false} />
            </div>
            <motion.button 
              onClick={() => navigate('/client/profile')} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 bg-slate-800/50 hover:bg-slate-700/60 rounded-xl border border-slate-700/40 backdrop-blur-sm transition-colors"
            >
              <User size={18} className="text-slate-300" />
            </motion.button>
            <motion.button 
              onClick={handleLogout} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 bg-slate-800/50 hover:bg-slate-700/60 rounded-xl border border-slate-700/40 backdrop-blur-sm transition-colors"
            >
              <LogOut size={18} className="text-slate-400" />
            </motion.button>
          </div>
        </header>

        {/* Link Account Banner */}
        <LinkAccountBanner />

        {/* Banner Completa Anamnesi */}
        {needsGenderUpdate && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 border border-purple-500/30 shadow-lg shadow-purple-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <UserCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Completa la tua Anamnesi</p>
                <p className="text-xs text-purple-200/80">Aggiungi il tuo sesso per calcoli più precisi</p>
              </div>
              <button
                onClick={() => navigate('/client/anamnesi')}
                className="px-4 py-2 bg-white text-purple-700 font-bold text-xs rounded-xl shadow-lg hover:bg-purple-50 transition-colors"
              >
                Vai
              </button>
              <button onClick={() => setNeedsGenderUpdate(false)} className="p-1">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* SEZIONE PRINCIPALE - Card unificata con streak + azioni + abitudini */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-4 space-y-4 overflow-hidden"
        >
          {/* Gradient decorativo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          {/* Hero Streak (inline) */}
          <div className="relative">
            <HeroStreakCard refreshKey={heroRefreshKey} />
          </div>
          
          {/* Separatore stilizzato */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Azioni Rapide</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
          </div>
          
          {/* 3 Azioni Primarie */}
          <div className="relative grid grid-cols-3 gap-3">
            <PrimaryActionButton 
              to="/client/scheda-allenamento" 
              icon={Dumbbell} 
              label="Allenamento" 
              color="blue" 
            />
            <PrimaryActionButton 
              to="/client/scheda-alimentazione" 
              icon={Utensils} 
              label="Dieta" 
              color="green" 
            />
            <PrimaryActionButton 
              to="/client/checks" 
              icon={CheckSquare} 
              label="Check" 
              color="purple"
              badge={pendingCheckDays >= 7 || pendingCheckDays === -1 ? '!' : null}
            />
          </div>
          
          {/* Separatore */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Oggi</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
          </div>
          
          {/* Quick Habits */}
          <div className="relative">
            <QuickHabits onWorkoutChange={handleWorkoutChange} />
          </div>
        </motion.div>
        
        {/* SEZIONE SECONDARIA - Info e promemoria */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {/* Check Reminder Card */}
          <CheckReminderCard 
            daysSinceLastCheck={pendingCheckDays} 
            lastCheckDate={lastCheckDate}
          />

          {/* Chiamate schedulate */}
          <CallsCompactCard clientId={user?.uid} clientName={clientData?.name} />

          {/* Mini Progress Card */}
          <MiniProgressCard />
        </motion.div>

        {/* Scadenza Abbonamento */}
        {daysLeft !== null && (
          <SubscriptionProgress daysLeft={daysLeft} />
        )}

        {/* Link Secondari */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Altro</h3>
          <div className="grid grid-cols-2 gap-2">
            <SecondaryLink to="/client/community" icon={Users} label="Community" />
            <SecondaryLink to="/client/anamnesi" icon={FileText} label="Anamnesi" />
            <SecondaryLink to="/client/payments" icon={CreditCard} label="Pagamenti" />
            <SecondaryLink to="/client/settings" icon={Settings} label="Impostazioni" />
          </div>
        </motion.div>

        {/* Celebration Overlay */}
        <CelebrationMoments />
          </motion.div>
        </div>
      </PullToRefresh>
    </>
  );
};

export default ClientDashboard;
