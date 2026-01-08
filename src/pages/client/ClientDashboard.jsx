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
  User, LogOut, AlertCircle, Download, Smartphone, 
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
import { isNativePlatform } from '../../utils/capacitor';
import { runSmartNotificationCheck } from '../../services/smartNotifications';

// Loading skeleton
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 px-4 py-4 space-y-4">
    <div className="h-12 w-48 bg-slate-700/50 rounded-lg animate-pulse" />
    <div className="h-24 bg-slate-700/50 rounded-2xl animate-pulse" />
    <div className="grid grid-cols-3 gap-3">
      <div className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
      <div className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
      <div className="h-24 bg-slate-700/50 rounded-xl animate-pulse" />
    </div>
    <div className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />
  </div>
);

// Bottone azione primaria grande
const PrimaryActionButton = ({ to, icon: Icon, label, color, badge }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/25',
    green: 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25',
    purple: 'from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/25',
  };

  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={`relative bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 shadow-lg transition-all`}
      >
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        <div className="flex flex-col items-center gap-2">
          <Icon size={28} className="text-white" />
          <span className="text-xs font-semibold text-white">{label}</span>
        </div>
      </motion.div>
    </Link>
  );
};

// Link secondario compatto
const SecondaryLink = ({ to, icon: Icon, label }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-3 py-2 bg-slate-800/20 hover:bg-slate-700/50 rounded-lg border border-slate-700/30 transition-all"
    >
      <Icon size={16} className="text-slate-400" />
      <span className="text-xs text-slate-300">{label}</span>
      <ChevronRight size={14} className="text-slate-500 ml-auto" />
    </motion.div>
  </Link>
);

// Progress bar scadenza abbonamento
const SubscriptionProgress = ({ daysLeft, totalDays = 30 }) => {
  const progress = Math.max(0, Math.min((daysLeft / totalDays) * 100, 100));
  const isUrgent = daysLeft <= 7;
  const isExpired = daysLeft <= 0;

  return (
    <div className={`rounded-xl p-3 border ${
      isExpired 
        ? 'bg-red-500/10 border-red-500/30' 
        : isUrgent 
          ? 'bg-orange-500/10 border-orange-500/30' 
          : 'bg-slate-800/20 border-slate-700/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Abbonamento</span>
        <span className={`text-sm font-bold ${
          isExpired ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-slate-300'
        }`}>
          {isExpired ? 'Scaduto' : `${daysLeft} giorni`}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full rounded-full ${
            isExpired 
              ? 'bg-red-500' 
              : isUrgent 
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}
        />
      </div>
    </div>
  );
};

const ClientDashboard = () => {
  const { branding } = useTenantBranding();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
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

    // Detect device
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    // Mostra PWA install solo su mobile web, NON su app nativa
    if ((ios || android) && !window.matchMedia('(display-mode: standalone)').matches && !isNativePlatform()) {
      setShowPWAInstall(true);
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
            className="w-full max-w-lg mx-auto px-4 py-4 space-y-4"
          >
            {/* Header Minimal */}
            <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              Ciao, {clientData.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-xs text-slate-500">{branding.clientAreaName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <NotificationPanel userType="client" showEnableButton={false} />
            </div>
            <motion.button 
              onClick={() => navigate('/client/profile')} 
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg border border-slate-700/30"
            >
              <User size={18} className="text-slate-300" />
            </motion.button>
            <motion.button 
              onClick={handleLogout} 
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg border border-slate-700/30"
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
            className="bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white rounded-xl p-3 border border-purple-500/30"
          >
            <div className="flex items-center gap-3">
              <UserCircle size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium">Completa la tua Anamnesi</p>
                <p className="text-xs text-purple-200">Aggiungi il tuo sesso per calcoli più precisi</p>
              </div>
              <button
                onClick={() => navigate('/client/anamnesi')}
                className="px-3 py-1.5 bg-white text-purple-700 font-semibold text-xs rounded-lg"
              >
                Vai
              </button>
              <button onClick={() => setNeedsGenderUpdate(false)} className="p-1">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* PWA Install Banner */}
        {showPWAInstall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-3 rounded-xl flex items-center gap-3 ${
              isIOS 
                ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90' 
                : 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90'
            }`}
          >
            <Smartphone size={18} className="text-white flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-xs">Installa l'app</p>
              <p className="text-[10px] text-white/80 truncate">
                {isIOS ? 'Condividi → Aggiungi a Home' : 'Menu ⋮ → Aggiungi a Home'}
              </p>
            </div>
            <Download size={16} className="text-white flex-shrink-0" />
          </motion.div>
        )}

        {/* Hero Streak Card */}
        <HeroStreakCard refreshKey={heroRefreshKey} />

        {/* 3 Azioni Primarie */}
        <div className="grid grid-cols-3 gap-3">
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

        {/* Check Reminder Card */}
        <CheckReminderCard 
          daysSinceLastCheck={pendingCheckDays} 
          lastCheckDate={lastCheckDate}
        />

        {/* Chiamate schedulate */}
        <CallsCompactCard clientId={user?.uid} clientName={clientData?.name} />

        {/* Quick Habits */}
        <QuickHabits onWorkoutChange={handleWorkoutChange} />

        {/* Mini Progress Card */}
        <MiniProgressCard />

        {/* Scadenza Abbonamento */}
        {daysLeft !== null && (
          <SubscriptionProgress daysLeft={daysLeft} />
        )}

        {/* Link Secondari */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 px-1">Altro</h3>
          <div className="grid grid-cols-2 gap-2">
            <SecondaryLink to="/client/community" icon={Users} label="Community" />
            <SecondaryLink to="/client/anamnesi" icon={FileText} label="Anamnesi" />
            <SecondaryLink to="/client/payments" icon={CreditCard} label="Pagamenti" />
            <SecondaryLink to="/client/settings" icon={Settings} label="Impostazioni" />
          </div>
        </div>

        {/* Celebration Overlay */}
        <CelebrationMoments />
          </motion.div>
        </div>
      </PullToRefresh>
    </>
  );
};

export default ClientDashboard;
