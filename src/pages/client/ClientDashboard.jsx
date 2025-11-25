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

        <main className="w-full space-y-4">
          {/* Hero Section - Streak in primo piano */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <WorkoutStreak compact />
          </motion.div>

          {/* Main Grid - 2 colonne su desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Colonna Sinistra (2/3) - Habit Tracker */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <HabitTracker />
            </motion.div>

            {/* Colonna Destra (1/3) - Info & Actions */}
            <div className="space-y-4">
              {/* Quick Stats Compact */}
              <motion.div 
                variants={itemVariants}
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl space-y-3"
              >
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <BarChart2 size={16} />
                  Il tuo Percorso
                </h3>
                
                {/* Scadenza - Priorità 1 */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Scadenza</span>
                    <Calendar className="text-blue-400" size={16} />
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{giorniRimanenti}</div>
                  <div className="text-xs text-slate-400">giorni rimanenti</div>
                  <div className="text-[10px] text-slate-500 mt-1">{dataScadenzaFormatted}</div>
                </div>

                {/* Prossimo Check - Priorità 2 */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Prossimo Check</span>
                    <CheckSquare className="text-emerald-400" size={16} />
                  </div>
                  <div className="text-xl font-bold text-emerald-400">{nextCheckText}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{nextCheckSubtext}</div>
                </div>

                {/* Piano - Info secondaria */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-purple-400" />
                    <span className="text-xs text-slate-400">Piano</span>
                  </div>
                  <span className="text-xs font-medium text-slate-200">
                    {clientData.planType ? clientData.planType.charAt(0).toUpperCase() + clientData.planType.slice(1) : 'Non specificato'}
                  </span>
                </div>
              </motion.div>

              {/* Quick Actions Compact */}
              <motion.div 
                variants={itemVariants}
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl"
              >
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Azioni Rapide
                </h3>
                <div className="space-y-2">
                  <ActionLink to="/client/checks" title="I miei Check" description="Foto progressi" icon={<CheckSquare size={18} />} variants={itemVariants}/>
                  <ActionLink to="/client/chat" title="Chat Coach" description="Messaggio diretto" icon={<MessageSquare size={18} />} variants={itemVariants}/>
                  <ActionLink to="/client/anamnesi" title="Anamnesi" description="I tuoi dati" icon={<User size={18} />} variants={itemVariants}/>
                  <ActionLink to="/client/payments" title="Pagamenti" description="Storico" icon={<BarChart2 size={18} />} variants={itemVariants}/>
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Celebration Overlay */}
        <CelebrationMoments />
      </motion.div>
    </div>
  );
};

export default ClientDashboard;