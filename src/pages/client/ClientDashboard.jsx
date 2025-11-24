import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useNavigate, Link } from 'react-router-dom';
import { getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { User, Calendar, CheckSquare, MessageSquare, LogOut, BarChart2, Briefcase, ChevronRight, AlertCircle, Download, Smartphone, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationPanel from '../../components/notifications/NotificationPanel';
import { useTenantBranding } from '../../hooks/useTenantBranding';
import HabitTracker from '../../components/client/HabitTracker';
import WorkoutStreak from '../../components/client/WorkoutStreak';
import CelebrationMoments from '../../components/client/CelebrationMoments';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 flex justify-center items-center">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
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
      className="bg-slate-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-700/50 shadow-xl hover:border-blue-500/50 transition-all"
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
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <Link to={to} className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 transition-all shadow-lg hover:shadow-xl hover:border-blue-500/30">
      <div className="bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 text-blue-400 group-hover:text-white p-2 sm:p-3 rounded-lg transition-all duration-300 flex-shrink-0">
        {React.cloneElement(icon, { size: 18, className: 'sm:w-[22px] sm:h-[22px]' })}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-white text-xs sm:text-base mb-0.5">{title}</h4>
        <p className="text-[10px] sm:text-sm text-slate-400 truncate">{description}</p>
      </div>
      <ChevronRight className="text-slate-500 group-hover:text-blue-400 transition-colors duration-300 flex-shrink-0" size={16} />
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
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

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

    // Carica dati cliente
    const fetchClientData = async () => {
      try {
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
        className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6"
      >
        <motion.header variants={itemVariants} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-1">{branding.clientAreaName} - Ciao, {clientData.name}! 👋</h1>
              <p className="text-xs sm:text-base text-slate-400">Bentornato nella tua area personale</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationPanel userType="client" />
              <motion.button 
                onClick={handleLogout} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <LogOut size={16} /><span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* PULSANTI PWA - SOLO SU MOBILE */}
        {showPWAInstall && (
          <motion.div variants={itemVariants} className="mb-4 sm:mb-6 space-y-3">
            {isAndroid && (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <Smartphone size={20} />
                  <div>
                    <p className="font-semibold">Aggiungi alla Schermata Home</p>
                    <p className="text-xs opacity-90">Tocca <strong>⋮ Menu → Aggiungi alla schermata home</strong></p>
                  </div>
                </div>
                <Download size={18} />
              </div>
            )}

            {isIOS && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <Smartphone size={20} />
                  <div>
                    <p className="font-semibold">Aggiungi alla Schermata Home</p>
                    <p className="text-xs opacity-90">Tocca <strong>Condividi → Aggiungi alla schermata Home</strong></p>
                  </div>
                </div>
                <Download size={18} />
              </div>
            )}
          </motion.div>
        )}

        <main className="w-full space-y-6">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <DashboardCard 
              title="Scadenza Percorso" 
              value={`${giorniRimanenti} giorni`} 
              subtext={`Scade il: ${dataScadenzaFormatted}`}
              icon={<Calendar size={24} />}
              color="blue"
              variants={itemVariants}
            />
            <DashboardCard 
              title="Tipo Percorso" 
              value={clientData.planType ? clientData.planType.charAt(0).toUpperCase() + clientData.planType.slice(1) : 'Non specificato'}
              subtext="Il tuo piano attuale"
              icon={<Briefcase size={24} />}
              color="purple"
              variants={itemVariants}
            />
            <DashboardCard 
              title="Prossimo Check" 
              value={nextCheckText}
              subtext={nextCheckSubtext}
              icon={<CheckSquare size={24} />}
              color="green"
              variants={itemVariants}
            />
            <DashboardCard 
              title="Progressi" 
              value="In Corso"
              subtext="Continua così!"
              icon={<TrendingUp size={24} />}
              color="cyan"
              variants={itemVariants}
            />
          </div>

          {/* Workout Streak - Highlight Section */}
          <motion.div variants={itemVariants}>
            <WorkoutStreak compact />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Habit Tracker */}
            <motion.div variants={itemVariants}>
              <HabitTracker />
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              variants={itemVariants} 
              className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Target className="text-blue-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Azioni Rapide</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <ActionLink to="/client/anamnesi" title="La mia Anamnesi" description="Visualizza o aggiorna i tuoi dati" icon={<User size={22} />} variants={itemVariants}/>
                <ActionLink to="/client/checks" title="I miei Check" description="Carica i tuoi progressi periodici" icon={<CheckSquare size={22} />} variants={itemVariants}/>
                <ActionLink to="/client/payments" title="I miei Pagamenti" description="Visualizza lo storico dei pagamenti" icon={<BarChart2 size={22} />} variants={itemVariants}/>
                <ActionLink to="/client/chat" title="Chat con il Coach" description="Invia un messaggio diretto" icon={<MessageSquare size={22} />} variants={itemVariants}/>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Celebration Overlay */}
        <CelebrationMoments />
      </motion.div>
    </div>
  );
};

export default ClientDashboard;