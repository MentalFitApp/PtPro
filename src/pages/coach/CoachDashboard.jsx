import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, query, onSnapshot, orderBy, where, getDocs } from 'firebase/firestore';
import { auth, db, toDate } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { signOut } from 'firebase/auth';
import { CheckCircle, Clock, FileText, Users, LogOut, Bell, MessageSquare, PlusCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantBranding } from '../../hooks/useTenantBranding';

// Helper per calcolare il tempo trascorso
const timeAgo = (date) => {
  if (!date) return '';
  try {
    const seconds = Math.floor((new Date() - toDate(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anni fa";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " mesi fa";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gg fa";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ore fa";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min fa";
    return "ora";
  } catch (error) {
    console.error("Errore in timeAgo:", error);
    return '';
  }
};

const StatCard = ({ title, value, icon, color = 'blue', isPercentage = false, trend, variants }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  };

  return (
    <motion.div 
      variants={variants}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-slate-800/60 backdrop-blur-sm p-3 sm:p-5 rounded-lg sm:rounded-xl border border-slate-700/50 shadow-xl hover:border-blue-500/50 transition-all h-full"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`p-2 sm:p-3 rounded-lg ${colorClasses[color]}`}>
          {React.cloneElement(icon, { size: 18, className: 'sm:w-[22px] sm:h-[22px]' })}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium ${
            trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
        {isPercentage ? `${value}%` : value}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400">{title}</p>
    </motion.div>
  );
};

const QuickAction = ({ to, title, icon, variants }) => (
  <motion.div 
    variants={variants}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <button
      onClick={to}
      className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4 transition-all w-full shadow-lg hover:shadow-xl hover:border-blue-500/30"
    >
      <div className="bg-blue-500/10 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 text-blue-400 group-hover:text-white p-3 rounded-lg transition-all duration-300">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <h4 className="font-bold text-white">{title}</h4>
      </div>
      <ChevronRight className="text-slate-500 group-hover:text-blue-400 transition-colors duration-300" />
    </button>
  </motion.div>
);

const ActivityItem = ({ item, navigate, variants }) => {
  const iconConfig = {
    expiring: { icon: <Clock size={18}/>, color: 'text-yellow-400 bg-yellow-500/10' },
    new_check: { icon: <CheckCircle size={18}/>, color: 'text-green-400 bg-green-500/10' },
    new_anamnesi: { icon: <FileText size={18}/>, color: 'text-blue-400 bg-blue-500/10' },
    new_message: { icon: <MessageSquare size={18}/>, color: 'text-rose-400 bg-rose-500/10' },
  };
  const tabMap = { expiring: 'info', new_check: 'checks', new_anamnesi: 'anamnesi', new_message: 'chat' };
  const config = iconConfig[item.type];

  return (
    <motion.button
      variants={variants}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileHover={{ x: 4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/coach/client/${item.clientId}?tab=${tabMap[item.type]}`)}
      className="w-full flex items-start gap-4 p-4 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/30 transition-all text-left shadow-lg"
    >
      <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white mb-0.5">{item.clientName}</p>
        <p className="text-xs text-slate-400 truncate">{item.description}</p>
      </div>
      <div className="text-xs text-slate-500 flex-shrink-0 pt-1">
        {timeAgo(item.date)}
      </div>
    </motion.button>
  );
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { branding } = useTenantBranding();
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica coach (sola autentificazione e nome)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        try {
          const coachDocRef = getTenantDoc(db, 'roles', 'coaches');
          const coachDoc = await getDoc(coachDocRef);
          const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(user.uid);
          if (isCoach) {
            setUserName(user.displayName || user.email || 'Coach');
          } else {
            sessionStorage.removeItem('app_role');
            await signOut(auth);
            navigate('/login');
          }
        } catch (err) {
          setError('Errore nella verifica del ruolo coach.');
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Clienti
  useEffect(() => {
    const unsub = onSnapshot(getTenantCollection(db, 'clients'), (snap) => {
      try {
        const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        console.error('Error loading clients:', error);
        setError("Errore nel caricamento dei clienti.");
        setLoading(false);
      }
    }, (error) => {
      console.error('Snapshot error:', error);
      setError("Errore nel caricamento dei clienti.");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Feed attività in tempo reale e completo
  useEffect(() => {
    if (!auth.currentUser) return;

    // Check-in - carica dal tenant corrente
    const loadChecksActivity = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        const items = [];
        
        for (const clientDoc of clientsSnap.docs) {
          const checksSnap = await getDocs(
            query(getTenantSubcollection(db, 'clients', clientDoc.id, 'checks'), orderBy('createdAt', 'desc'))
          );
          
          checksSnap.docs.forEach(checkDoc => {
            items.push({
              type: 'new_check',
              clientId: clientDoc.id,
              clientName: clientDoc.data().name || 'Cliente',
              description: 'Ha inviato un nuovo check-in',
              date: checkDoc.data().createdAt
            });
          });
        }
        
        setActivityFeed(prev => {
          const all = [...items, ...prev.filter(it => it.type !== 'new_check')];
          return all.sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 30);
        });
      } catch (err) {
        setError("Errore nel caricamento dei check.");
      }
    };
    loadChecksActivity();

    // Anamnesi - carica dal tenant corrente
    const loadAnamnesiActivity = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        const items = [];
        
        for (const clientDoc of clientsSnap.docs) {
          const anamnesiSnap = await getDocs(
            getTenantSubcollection(db, 'clients', clientDoc.id, 'anamnesi')
          );
          
          anamnesiSnap.docs.forEach(anamnesiDoc => {
            items.push({
              type: 'new_anamnesi',
              clientId: clientDoc.id,
              clientName: clientDoc.data().name || 'Cliente',
              description: 'Ha compilato l\'anamnesi iniziale',
              date: anamnesiDoc.data().submittedAt
            });
          });
        }
        
        setActivityFeed(prev => {
          const all = [...items, ...prev.filter(it => it.type !== 'new_anamnesi')];
          return all.sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 30);
        });
      } catch (err) {
        setError("Errore nel caricamento delle anamnesi.");
      }
    };
    loadAnamnesiActivity();

    // Chat (messaggi)
    const chatsQuery = query(
      getTenantCollection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastUpdate', 'desc')
    );
    const unsubChats = onSnapshot(chatsQuery, async (snap) => {
      try {
        const items = [];
        for (const chatDoc of snap.docs) {
          const chatData = chatDoc.data();
          const clientId = chatData.participants.find(p => p !== auth.currentUser.uid);
          if (chatData.lastUpdate) {
            const clientDoc = await getDoc(getTenantDoc(db, 'clients', clientId));
            items.push({
              type: 'new_message',
              clientId,
              clientName: clientDoc.exists() ? clientDoc.data().name || 'Cliente' : 'Cliente',
              description: `Nuovo messaggio: ${chatData.lastMessage?.slice?.(0, 30)}...`,
              date: chatData.lastUpdate
            });
          }
        }
        setActivityFeed(prev => {
          const all = [...items, ...prev.filter(it => it.type !== 'new_message')];
          return all.sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 30);
        });
      } catch (err) {
        setError("Errore nel caricamento dei messaggi.");
      }
    });

    // Clienti in scadenza
    const clientsQuery = query(getTenantCollection(db, 'clients'));
    const unsubClients = onSnapshot(clientsQuery, (snap) => {
      try {
        const expiring = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => {
            const expiry = toDate(c.scadenza);
            if (!expiry) return false;
            const daysLeft = (expiry - new Date()) / (1000 * 60 * 60 * 24);
            return daysLeft <= 15 && daysLeft > 0;
          })
          .map(c => ({
            type: 'expiring',
            clientId: c.id,
            clientName: c.name,
            description: `Abbonamento in scadenza tra ${Math.ceil((toDate(c.scadenza) - new Date()) / (1000 * 60 * 60 * 24))} giorni`,
            date: c.scadenza
          }));
        setActivityFeed(prev => {
          const nonExpiring = prev.filter(item => item.type !== 'expiring');
          const all = [...nonExpiring, ...expiring];
          return all.sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 30);
        });
      } catch (err) {
        setError("Errore nel caricamento delle scadenze.");
      }
    });

    return () => {
      unsubClients();
    };
  }, []);

  // Statistiche
  const clientStats = React.useMemo(() => {
    try {
      const now = new Date();
      const active = clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && expiry > now;
      }).length;
      const expiring = clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && (expiry - now) / (1000 * 60 * 60 * 24) <= 15 && (expiry - now) > 0;
      }).length;
      return { active, expiring };
    } catch (err) {
      return { active: 0, expiring: 0 };
    }
  }, [clients]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('app_role');
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setError("Errore durante il logout.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (error) return <div className="min-h-screen bg-slate-900 text-red-400 flex justify-center items-center">{error}</div>;
  if (loading) return <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>;

  return (
    <div className="min-h-screen text-slate-200 relative overflow-x-hidden w-full">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full py-4 sm:py-6 space-y-6 px-3 sm:px-6">
        {/* HEADER PREMIUM */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {branding.coachAreaName} - Benvenuto, {userName} 👋
              </h1>
              <p className="text-slate-400">Gestisci i tuoi clienti e monitora le loro attività</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/coach/clients')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all"
              >
                <Users size={18} />
                <span className="hidden sm:inline">Tutti i Clienti</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <LogOut size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <main className="space-y-4 sm:space-y-6">
          {/* STATISTICHE */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard 
              title="Clienti Attivi" 
              value={clientStats.active} 
              icon={<CheckCircle/>}
              color="blue"
              trend={5}
              variants={itemVariants}
            />
            <StatCard 
              title="Scadenze Prossime" 
              value={clientStats.expiring} 
              icon={<Clock/>}
              color="yellow"
              variants={itemVariants}
            />
            <StatCard 
              title="Totale Clienti" 
              value={clients.length} 
              icon={<Users/>}
              color="cyan"
              trend={8}
              variants={itemVariants}
            />
          </div>

          {/* QUICK ACTIONS */}
          <motion.div variants={itemVariants} className="bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-slate-700/50 shadow-xl">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
              <PlusCircle size={18} className="sm:w-5 sm:h-5"/> Azioni Rapide
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <QuickAction to={() => navigate('/coach/clients')} title="Gestisci Clienti" icon={<Users size={20} />} variants={itemVariants} />
              <QuickAction to={() => navigate('/coach/chat')} title="Chat" icon={<MessageSquare size={20} />} variants={itemVariants} />
              <QuickAction to={() => navigate('/coach/anamnesi')} title="Anamnesi" icon={<FileText size={20} />} variants={itemVariants} />
              <QuickAction to={() => navigate('/coach/updates')} title="Aggiornamenti" icon={<Bell size={20} />} variants={itemVariants} />
            </div>
          </motion.div>

          {/* ACTIVITY FEED */}
          <motion.div variants={itemVariants} className="bg-slate-800/60 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-slate-700/50 shadow-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <Bell size={20}/> Feed Attività
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {activityFeed.length > 0 ? (
                  activityFeed.map(item => (
                    <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds || item.date}`} item={item} navigate={navigate} variants={itemVariants} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell size={32} className="mx-auto text-slate-600 mb-2"/>
                    <p className="text-sm text-slate-500">Nessuna attività recente</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
