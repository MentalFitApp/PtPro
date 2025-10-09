import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, collectionGroup, doc, getDoc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { auth, db, toDate, calcolaStatoPercorso } from '../firebase';
import { signOut } from 'firebase/auth';
import { CheckCircle, Clock, FileText, Users, LogOut, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Componente StatCard
const StatCard = ({ title, value, icon, isPercentage = false, variants }) => (
  <motion.div variants={variants} className="bg-zinc-950/60 backdrop-blur-xl p-4 rounded-xl gradient-border h-full">
    <div className="flex items-center gap-3 text-slate-400">
      {icon}
      <p className="text-sm">{title}</p>
    </div>
    <p className="text-3xl font-bold text-slate-50 mt-2">
      {isPercentage ? `${value}%` : value}
    </p>
  </motion.div>
);

// Componente ActivityItem
const ActivityItem = ({ item, navigate, variants }) => {
  const icons = {
    expiring: <Clock className="text-yellow-500" size={18}/>,
    new_check: <CheckCircle className="text-green-500" size={18}/>,
    new_anamnesi: <FileText className="text-blue-500" size={18}/>,
  };
  const tabMap = { expiring: 'info', new_check: 'checks', new_anamnesi: 'anamnesi' };

  return (
    <motion.button
      variants={variants}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(`/client/${item.clientId}?tab=${tabMap[item.type]}`)}
      className="w-full flex items-start gap-4 p-3 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 transition-colors text-left"
    >
      <div className="mt-1 flex-shrink-0">{icons[item.type]}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-200">{item.clientName}</p>
        <p className="text-xs text-slate-400">{item.description}</p>
      </div>
      <div className="text-xs text-slate-500 flex-shrink-0">
        {timeAgo(item.date)}
      </div>
    </motion.button>
  );
};

// Componente ClientItem
const ClientItem = ({ client, navigate, variants }) => {
  const stato = calcolaStatoPercorso(client.scadenza) || 'na';
  const styles = {
    attivo: "bg-emerald-900/80 text-emerald-300 border border-emerald-500/30",
    rinnovato: "bg-amber-900/80 text-amber-300 border border-amber-500/30",
    non_rinnovato: "bg-red-900/80 text-red-400 border border-red-500/30",
    na: "bg-zinc-700/80 text-zinc-300 border border-zinc-500/30",
  };
  const labels = { attivo: 'Attivo', rinnovato: 'In Scadenza', non_rinnovato: 'Scaduto', na: 'N/D' };

  return (
    <motion.div
      variants={variants}
      className="p-3 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 transition-colors"
      onClick={() => navigate(`/client/${client.id}`)}
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-slate-200">{client.name}</p>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[stato] || styles.na}`}>
          {labels[stato] || 'N/D'}
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1">{client.email || 'N/D'}</p>
    </motion.div>
  );
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [lastViewed, setLastViewed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);

  // Verifica coach
  const COACH_UID = "l0RI8TzFjbNVoAdmcXNQkP9mWb12";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && user.uid === COACH_UID) {
        setUserName(user.displayName || user.email || 'Coach Mattia');
      } else {
        signOut(auth);
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch clients
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snap) => {
      try {
        const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(clientList);
        setLoading(false);
      } catch (err) {
        console.error("Errore nel fetch clients:", err);
        setError("Errore nel caricamento dei clienti.");
        setLoading(false);
      }
    }, (err) => {
      console.error("Errore snapshot clients:", err);
      setError("Errore nel caricamento dei clienti.");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch lastViewed
  useEffect(() => {
    const lastViewedRef = doc(db, 'app-data', 'lastViewed');
    const fetchLastViewed = async () => {
      try {
        const docSnap = await getDoc(lastViewedRef);
        const lastViewedTime = docSnap.exists() ? docSnap.data().timestamp : null;
        setLastViewed(lastViewedTime);
        await setDoc(lastViewedRef, { timestamp: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Errore fetchLastViewed:", err);
        setError("Errore nel caricamento di lastViewed.");
      }
    };
    fetchLastViewed();
  }, []);

  // Activity feed
  useEffect(() => {
    if (!lastViewed) return;

    const checksQuery = query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
      try {
        const newChecks = [];
        for (const doc of snap.docs) {
          if (toDate(doc.data().createdAt) > toDate(lastViewed)) {
            const clientId = doc.ref.parent.parent.id;
            const clientDoc = await getDoc(doc(db, 'clients', clientId));
            newChecks.push({
              type: 'new_check',
              clientId,
              clientName: clientDoc.exists() ? clientDoc.data().name || 'Cliente' : 'Cliente',
              description: 'Ha inviato un nuovo check-in',
              date: doc.data().createdAt
            });
          }
        }
        setActivityFeed(prev => [...prev, ...newChecks].sort((a, b) => toDate(b.date) - toDate(a.date)));
      } catch (err) {
        console.error("Errore snapshot checks:", err);
        setError("Errore nel caricamento dei check.");
      }
    });

    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubAnamnesi = onSnapshot(anamnesiQuery, async (snap) => {
      try {
        const newAnamnesi = [];
        for (const doc of snap.docs) {
          if (toDate(doc.data().submittedAt) > toDate(lastViewed)) {
            const clientId = doc.ref.parent.parent.id;
            const clientDoc = await getDoc(doc(db, 'clients', clientId));
            newAnamnesi.push({
              type: 'new_anamnesi',
              clientId,
              clientName: clientDoc.exists() ? clientDoc.data().name || 'Cliente' : 'Cliente',
              description: 'Ha compilato l\'anamnesi iniziale',
              date: doc.data().submittedAt
            });
          }
        }
        setActivityFeed(prev => [...prev, ...newAnamnesi].sort((a, b) => toDate(b.date) - toDate(a.date)));
      } catch (err) {
        console.error("Errore snapshot anamnesi:", err);
        setError("Errore nel caricamento delle anamnesi.");
      }
    });

    const clientsQuery = query(collection(db, 'clients'));
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
          return [...nonExpiring, ...expiring].sort((a, b) => toDate(b.date) - toDate(a.date));
        });
      } catch (err) {
        console.error("Errore snapshot clients:", err);
        setError("Errore nel caricamento delle scadenze.");
      }
    });

    return () => {
      unsubChecks();
      unsubAnamnesi();
      unsubClients();
    };
  }, [lastViewed]);

  // Statistiche clienti
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
      console.error("Errore in clientStats:", err);
      return { active: 0, expiring: 0 };
    }
  }, [clients]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Errore logout:", error);
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

  if (error) return <div className="min-h-screen bg-zinc-950 text-red-400 flex justify-center items-center">{error}</div>;
  if (loading) return <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>;

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-8 relative">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.header variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-2"><Users size={28}/> Coach Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-300 font-semibold">{userName}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
          <p className="text-slate-400 mb-4">Gestisci i tuoi clienti e monitora le loro attività.</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'overview' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Panoramica
            </button>
            <button
              onClick={() => navigate('/coach/clients')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'clients' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Clienti
            </button>
            <button
              onClick={() => navigate('/coach/chat')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'chat' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Chat
            </button>
            <button
              onClick={() => navigate('/coach/anamnesi')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'anamnesi' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Anamnesi
            </button>
            <button
              onClick={() => navigate('/coach/updates')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'updates' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Aggiornamenti
            </button>
          </div>
        </motion.header>

        <main className="mt-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <StatCard 
                  title="Clienti Attivi" 
                  value={clientStats.active} 
                  icon={<CheckCircle className="text-blue-500"/>}
                  variants={itemVariants}
                />
                <StatCard 
                  title="Scadenze Prossime" 
                  value={clientStats.expiring} 
                  icon={<Clock className="text-yellow-500"/>}
                  variants={itemVariants}
                />
                <StatCard 
                  title="Totale Clienti" 
                  value={clients.length} 
                  icon={<Users className="text-cyan-500"/>}
                  variants={itemVariants}
                />
              </div>
              <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Bell size={20} /> Attività Recenti</h2>
                <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {activityFeed.length > 0 ? (
                      activityFeed.map(item => (
                        <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds}`} item={item} navigate={navigate} variants={itemVariants} />
                      ))
                    ) : (
                      <p className="text-slate-400 text-center p-4">Nessun aggiornamento recente.</p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}
          {activeTab === 'clients' && (
            <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Users size={20} /> Elenco Clienti</h2>
              <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
                  </div>
                ) : (
                  clients.map(client => (
                    <ClientItem key={client.id} client={client} navigate={navigate} variants={itemVariants} />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </main>
      </motion.div>
    </div>
  );
}