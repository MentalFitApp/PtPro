import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useNavigate, Link } from 'react-router-dom';
import { getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { User, Calendar, CheckSquare, Users, LogOut, BarChart2, Briefcase, ChevronRight, AlertCircle, Download, Smartphone, TrendingUp, Target, Dumbbell, Utensils, Phone, UserCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationPanel from '../../components/notifications/NotificationPanel';
import { useTenantBranding } from '../../hooks/useTenantBranding';
import HabitTracker from '../../components/client/HabitTracker';
import WorkoutStreak from '../../components/client/WorkoutStreak';
import CelebrationMoments from '../../components/client/CelebrationMoments';
import BlockedAccess from '../../components/client/BlockedAccess';
import AnamnesiRequiredModal from '../../components/client/AnamnesiRequiredModal';
import LinkAccountBanner from '../../components/LinkAccountBanner';
import { NextCallCard, RequestCallCard } from '../../components/calls/CallScheduler';
import { SkeletonCard, SkeletonList } from '../../components/ui/SkeletonLoader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 px-4 py-6 space-y-4">
    <div className="h-8 w-48 bg-slate-700/50 rounded-lg animate-pulse" />
    <div className="grid grid-cols-2 gap-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <SkeletonList count={3} />
  </div>
);

const DashboardCard = ({ title, value, subtext, icon, color = 'cyan', variants }) => {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 text-cyan-500',
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <motion.div 
      variants={variants}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-slate-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-700/50 shadow-glow hover:border-blue-500/50 transition-all"
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`p-2 sm:p-3 rounded-lg ${colorClasses[color]}`}>
          {React.cloneElement(icon, { size: 18, className: 'sm:w-[24px] sm:h-[24px]' })}
        </div>
      </div>
      <p className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{value}</p>
      <h3 className="text-xs sm:text-sm text-slate-400 mb-0.5 sm:mb-1">{title}</h3>
      <p className="text-[10px] sm:text-xs text-slate-500">{subtext}</p>
    </motion.div>
  );
};

const ActionLink = ({ to, title, description, icon, variants }) => (
  <motion.div 
    variants={variants}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Link to={to} className="group bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/30 hover:border-blue-500/50 rounded-lg p-1.5 sm:p-2 flex flex-col items-center gap-1 transition-all">
      <div className="bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 text-blue-400 group-hover:text-white preserve-white p-1.5 sm:p-2 rounded-lg transition-all duration-300">
        {React.cloneElement(icon, { size: 14, className: 'sm:w-4 sm:h-4' })}
      </div>
      <h4 className="font-semibold text-white text-[9px] sm:text-[10px] truncate w-full text-center leading-tight">{title}</h4>
    </Link>
  </motion.div>
);

const ClientDashboard = () => {
  const { branding } = useTenantBranding();
  const [clientData, setClientData] = useState(null);
  const [lastCheckDate, setLastCheckDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [requireAnamnesi, setRequireAnamnesi] = useState(false);
  const [hasAnamnesi, setHasAnamnesi] = useState(true); // Default true per non bloccare durante caricamento
  const [needsGenderUpdate, setNeedsGenderUpdate] = useState(false); // Banner per aggiungere sesso
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  
  // Document title dinamico
  useDocumentTitle('La mia Dashboard');

  useEffect(() => {
    if (!user) {
      console.log('ClientDashboard: Nessun utente autenticato, reindirizzamento a /login');
      navigate('/login');
      return;
    }

    console.log('ClientDashboard: Caricamento dati per UID:', user.uid, user.email);

    // RILEVA DISPOSITIVO
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    // Mostra pulsante solo su mobile
    if ((ios || android) && !window.matchMedia('(display-mode: standalone)').matches) {
      setShowPWAInstall(true);
    }

    // Timeout sicurezza per evitare hang infinito
    const loadingTimeout = setTimeout(() => {
      console.warn('ClientDashboard: Timeout caricamento, forzo setLoading(false)');
      setLoading(false);
      setError('Il caricamento sta impiegando troppo tempo. Riprova o contatta il supporto.');
    }, 8000);

    // Verifica impostazione anamnesi obbligatoria e se cliente ha già compilato
    const checkAnamnesiRequirement = async () => {
      try {
        // Carica impostazioni globali piattaforma
        const settingsRef = getTenantDoc(db, 'platform_settings', 'global');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const settings = settingsSnap.data();
          if (settings.requireAnamnesiOnFirstAccess) {
            setRequireAnamnesi(true);
            
            // Verifica se il cliente ha già compilato l'anamnesi
            const anamnesiRef = getTenantSubcollection(db, 'clients', user.uid, 'anamnesi');
            const anamnesiQuery = query(anamnesiRef, limit(1));
            const anamnesiSnap = await getDocs(anamnesiQuery);
            
            const clientHasAnamnesi = anamnesiSnap.docs.length > 0;
            setHasAnamnesi(clientHasAnamnesi);
            
            // Se ha l'anamnesi, controlla se manca il sesso
            if (clientHasAnamnesi && anamnesiSnap.docs[0]) {
              const anamnesiData = anamnesiSnap.docs[0].data();
              if (!anamnesiData.gender) {
                setNeedsGenderUpdate(true);
              }
            }
            console.log('ClientDashboard: Anamnesi obbligatoria, cliente ha anamnesi:', clientHasAnamnesi);
          }
        } else {
          // Anche senza impostazioni, controlla se manca il sesso nell'anamnesi esistente
          const anamnesiRef = getTenantSubcollection(db, 'clients', user.uid, 'anamnesi');
          const anamnesiQuery = query(anamnesiRef, limit(1));
          const anamnesiSnap = await getDocs(anamnesiQuery);
          
          if (anamnesiSnap.docs.length > 0 && anamnesiSnap.docs[0]) {
            const anamnesiData = anamnesiSnap.docs[0].data();
            if (!anamnesiData.gender) {
              setNeedsGenderUpdate(true);
            }
          }
        }
      } catch (error) {
        console.error('ClientDashboard: Errore verifica anamnesi:', error);
        // In caso di errore, non blocchiamo il cliente
        setHasAnamnesi(true);
      }
    };

    // Carica dati cliente
    const fetchClientData = async () => {
      try {
        // Prima verifica requisito anamnesi
        await checkAnamnesiRequirement();
        
        const clientDocRef = getTenantDoc(db, 'clients', user.uid);
        const docSnap = await getDoc(clientDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Se è ancora firstLogin, redirect a FirstAccess
          if (data.firstLogin === true) {
            console.log('ClientDashboard: firstLogin ancora true, redirect a /first-access');
            clearTimeout(loadingTimeout);
            navigate('/first-access');
            return;
          }

          // Verifica stato archivio
          if (data.isArchived && data.archiveSettings) {
            const { blockAppAccess, customMessage } = data.archiveSettings;
            
            if (blockAppAccess) {
              console.log('ClientDashboard: Cliente archiviato con blocco completo app');
              setIsBlocked(true);
              setBlockMessage(customMessage || 'Il tuo accesso all\'app è stato temporaneamente sospeso. Contatta il tuo trainer per maggiori informazioni.');
              clearTimeout(loadingTimeout);
              setLoading(false);
              return;
            }
          }

          setClientData(data);
          console.log('ClientDashboard: Dati cliente caricati:', data);
          clearTimeout(loadingTimeout);
          setLoading(false);
        } else {
          clearTimeout(loadingTimeout);
          setLoading(false);
          setError('Documento cliente non trovato.');
          console.log('ClientDashboard: Documento cliente non trovato per UID:', user.uid);
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        clearTimeout(loadingTimeout);
        setLoading(false);
        console.error('ClientDashboard: Errore nel recupero del documento cliente:', err.code, err.message, { uid: user.uid, email: user.email });
        setError('Errore nel caricamento dei dati cliente: ' + err.message);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    // Listener per check-in
    const fetchLastCheck = () => {
      const checksCollectionRef = getTenantSubcollection(db, 'clients', user.uid, 'checks');
      const q = query(checksCollectionRef, orderBy('createdAt', 'desc'));
      let snapshotCount = 0;
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshotCount++;
        console.log(`ClientDashboard: Snapshot #${snapshotCount}, documenti:`, snapshot.docs.length);
        try {
          const checks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const latestCheck = checks[0]?.createdAt?.toDate();
          setLastCheckDate(latestCheck || null);
          if (checks.length === 0) {
            setError('Nessun check-in disponibile. Carica il tuo primo check.');
          }
        } catch (err) {
          console.error('ClientDashboard: Errore nel caricamento dei check-in:', err.code, err.message, { uid: user.uid, email: user.email });
          setError('Errore nel caricamento dei check-in: ' + (err.code === 'permission-denied' ? 'Permessi insufficienti.' : err.message));
        }
      }, (err) => {
        console.error('ClientDashboard: Errore snapshot check-in:', err.code, err.message, { uid: user.uid, email: user.email });
        setError('Errore nel caricamento dei check-in: ' + (err.code === 'permission-denied' ? 'Permessi insufficienti.' : err.message));
      });
      return unsubscribe;
    };

    fetchClientData();
    const unsubCheck = fetchLastCheck();
    
    return () => {
      clearTimeout(loadingTimeout);
      if (unsubCheck) unsubCheck();
    };
  }, [user, navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => {
      sessionStorage.removeItem('app_role');
      console.log('ClientDashboard: Logout eseguito per UID:', user.uid);
      navigate('/login');
    }).catch(err => {
      console.error('ClientDashboard: Errore durante il logout:', err.code, err.message);
      setError('Errore durante il logout: ' + err.message);
    });
  };

  if (loading) return <LoadingSpinner />;
  
  // Mostra schermata di blocco se il cliente è archiviato con blockAppAccess
  if (isBlocked) {
    return <BlockedAccess message={blockMessage} />;
  }

  // Mostra modal anamnesi obbligatoria se l'impostazione è attiva e il cliente non ha compilato
  if (requireAnamnesi && !hasAnamnesi) {
    return <AnamnesiRequiredModal clientName={clientData?.name} />;
  }
  
  if (!clientData) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center p-8">
        <p className="text-center text-red-400 flex items-center gap-2">
          <AlertCircle size={18} />
          {error || 'Errore nel caricamento dei dati.'}
        </p>
      </div>
    );
  }

  let giorniRimanenti = 'N/D';
  let dataScadenzaFormatted = 'Non impostata';
  if (clientData.scadenza && clientData.scadenza.toDate) {
    const scadenzaDate = clientData.scadenza.toDate();
    const oggi = new Date();
    scadenzaDate.setHours(23, 59, 59, 999);
    oggi.setHours(0, 0, 0, 0);
    const diffTime = scadenzaDate - oggi;
    giorniRimanenti = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    dataScadenzaFormatted = scadenzaDate.toLocaleDateString('it-IT');
  }

  let nextCheckText = 'Nessun check registrato';
  let nextCheckSubtext = 'Carica il tuo primo check!';
  if (lastCheckDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextCheckDate = new Date(lastCheckDate);
    nextCheckDate.setDate(nextCheckDate.getDate() + 7);
    const diffDays = Math.max(0, Math.ceil((nextCheckDate - today) / (1000 * 60 * 60 * 24)));
    nextCheckText = diffDays === 0 ? 'Oggi' : `${diffDays} giorni`;
    nextCheckSubtext = `Prossimo check suggerito: ${nextCheckDate.toLocaleDateString('it-IT')}`;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants} 
        className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 relative z-10"
      >
        {/* Header Compatto */}
        <motion.header variants={itemVariants} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-slate-700/50 shadow-xl mb-3 sm:mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-2xl font-bold text-white truncate">Ciao, {clientData.name}! 👋</h1>
              <p className="text-[10px] sm:text-sm text-slate-400 truncate">{branding.clientAreaName}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="relative z-50">
                <NotificationPanel userType="client" />
              </div>
              <motion.button 
                onClick={() => navigate('/client/profile')} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white preserve-white text-xs sm:text-sm font-medium rounded-lg transition-colors min-w-[44px] sm:min-w-auto"
              >
                <User size={14} className="sm:w-4 sm:h-4" /><span className="hidden sm:inline">Profilo</span>
              </motion.button>
              <motion.button 
                onClick={handleLogout} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-3 py-1.5 sm:py-2 bg-slate-700 hover:bg-slate-600 text-white preserve-white text-xs sm:text-sm font-medium rounded-lg transition-colors min-w-[44px] sm:min-w-auto"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" /><span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* BANNER COLLEGAMENTO ACCOUNT - Multi-tenant */}
        <motion.div variants={itemVariants}>
          <LinkAccountBanner />
        </motion.div>

        {/* BANNER COMPLETA ANAMNESI - Sesso mancante */}
        {needsGenderUpdate && (
          <motion.div 
            variants={itemVariants} 
            className="mb-3 sm:mb-4 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 backdrop-blur-sm text-white rounded-xl p-4 border border-purple-500/30 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                <UserCircle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-base mb-1">Completa la tua Anamnesi</h3>
                <p className="text-xs sm:text-sm text-purple-100 opacity-90">
                  Aggiungi il tuo sesso per permetterci di calcolare meglio i tuoi progressi
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/client/anamnesi')}
                  className="px-3 py-1.5 bg-white text-purple-700 font-semibold text-xs sm:text-sm rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Completa
                </motion.button>
                <button
                  onClick={() => setNeedsGenderUpdate(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Chiudi"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PULSANTI PWA - Versione Compatta */}
        {showPWAInstall && (
          <motion.div variants={itemVariants} className="mb-3 sm:mb-4">
            {isAndroid && (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white preserve-white p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 shadow-lg">
                <Smartphone size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm">Aggiungi alla Home</p>
                  <p className="text-[10px] sm:text-xs opacity-90 truncate">⋮ Menu → Aggiungi alla schermata home</p>
                </div>
                <Download size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              </div>
            )}

            {isIOS && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white preserve-white p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 shadow-lg">
                <Smartphone size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm">Aggiungi alla Home</p>
                  <p className="text-[10px] sm:text-xs opacity-90 truncate">Condividi → Aggiungi alla Home</p>
                </div>
                <Download size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              </div>
            )}
          </motion.div>
        )}

        <main className="w-full space-y-3 sm:space-y-4">
          {/* Stats Compatte in Grid - Mobile: 2 colonne, Desktop: 5 colonne */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
            {/* Scadenza */}
            <motion.div variants={itemVariants} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 sm:p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] sm:text-xs text-slate-400 truncate">Scadenza</span>
                <Calendar className="text-blue-400 flex-shrink-0" size={12} />
              </div>
              <div className="text-base sm:text-xl font-bold text-blue-400">{giorniRimanenti}</div>
              <div className="text-[9px] sm:text-xs text-slate-400 truncate">giorni</div>
            </motion.div>

            {/* Prossimo Check */}
            <motion.div variants={itemVariants} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 sm:p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] sm:text-xs text-slate-400 truncate">Prossimo Check</span>
                <CheckSquare className="text-emerald-400 flex-shrink-0" size={12} />
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-400 truncate">{nextCheckText}</div>
              <div className="text-[9px] sm:text-xs text-slate-400 truncate">da ultimo</div>
            </motion.div>

            {/* Piano */}
            <motion.div variants={itemVariants} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 sm:p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] sm:text-xs text-slate-400 truncate">Piano</span>
                <Briefcase className="text-purple-400 flex-shrink-0" size={12} />
              </div>
              <div className="text-xs sm:text-sm font-bold text-purple-400 truncate">
                {clientData.planType ? clientData.planType.charAt(0).toUpperCase() + clientData.planType.slice(1) : 'Non specificato'}
              </div>
              <div className="text-[9px] sm:text-xs text-slate-400 truncate">attivo</div>
            </motion.div>

            {/* Streak Workout - Mini */}
            <motion.div variants={itemVariants}>
              <WorkoutStreak mini />
            </motion.div>

            {/* Età (se disponibile) */}
            {clientData.age && (
              <motion.div variants={itemVariants} className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 sm:p-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] sm:text-xs text-slate-400 truncate">Età</span>
                  <TrendingUp className="text-cyan-400 flex-shrink-0" size={12} />
                </div>
                <div className="text-base sm:text-xl font-bold text-cyan-400">{clientData.age}</div>
                <div className="text-[9px] sm:text-xs text-slate-400">anni</div>
              </motion.div>
            )}
          </div>

          {/* Sezione Chiamate */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NextCallCard clientId={user?.uid} isAdmin={false} />
            <RequestCallCard clientId={user?.uid} clientName={clientData?.name} />
          </motion.div>

          {/* Azioni Rapide - PRIMA delle abitudini */}
          <motion.div variants={itemVariants} className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 border border-slate-700/50">
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Target size={12} className="sm:w-3.5 sm:h-3.5" />
              Azioni Rapide
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
              <ActionLink to="/client/scheda-allenamento" title="Allenamento" description="Scheda" icon={<Dumbbell size={14} />} variants={itemVariants}/>
              <ActionLink to="/client/scheda-alimentazione" title="Alimentazione" description="Piano" icon={<Utensils size={14} />} variants={itemVariants}/>
              <ActionLink to="/client/checks" title="Check" description="Progressi" icon={<CheckSquare size={14} />} variants={itemVariants}/>
              <ActionLink to="/client/community" title="Community" description="Social" icon={<Users size={14} />} variants={itemVariants}/>
              <ActionLink to="/client/anamnesi" title="Anamnesi" description="Dati" icon={<User size={14} />} variants={itemVariants}/>
              <ActionLink to="/client/payments" title="Pagamenti" description="Storico" icon={<BarChart2 size={14} />} variants={itemVariants}/>
            </div>
          </motion.div>

          {/* Habit Tracker - Più piccolo */}
          <motion.div variants={itemVariants} className="scale-95">
            <HabitTracker />
          </motion.div>
        </main>

        {/* Celebration Overlay */}
        <CelebrationMoments />
      </motion.div>
    </div>
  );
};

export default ClientDashboard;