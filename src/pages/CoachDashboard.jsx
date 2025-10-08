import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, collectionGroup, doc, getDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { auth, db, toDate, calcolaStatoPercorso } from "../firebase";
import { signOut } from "firebase/auth";
import { CheckCircle, Clock, FileText, Users, LogOut, Bell, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// AnimatedBackground per tema stellato
const AnimatedBackground = () => {
  useEffect(() => {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    const createStar = () => {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDuration = `${Math.random() * 30 + 40}s, 5s`;
      starsContainer.appendChild(star);
    };

    for (let i = 0; i < 50; i++) {
      createStar();
    }

    return () => {
      while (starsContainer.firstChild) {
        starsContainer.removeChild(starsContainer.firstChild);
      }
    };
  }, []);

  return (
    <div className="starry-background">
      <div className="stars"></div>
    </div>
  );
};

// Helper per calcolare il tempo trascorso
const timeAgo = (date) => {
  if (!date) return '';
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

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [lastViewed, setLastViewed] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica coach
  const COACH_UID = "l0RI8TzFjbNVoAdmcXNQkP9mWb12";
  const [userName, setUserName] = useState('');

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
      const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch lastViewed e aggiorna
  useEffect(() => {
    const lastViewedRef = doc(db, 'app-data', 'lastViewed');
    const fetchLastViewed = async () => {
      const docSnap = await getDoc(lastViewedRef);
      const lastViewedTime = docSnap.exists() ? docSnap.data().timestamp : null;
      setLastViewed(lastViewedTime);
      await setDoc(lastViewedRef, { timestamp: serverTimestamp() }, { merge: true });
    };
    fetchLastViewed();
  }, []);

  // Activity feed
  useEffect(() => {
    if (!lastViewed) return;

    const checksQuery = query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
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
    });

    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubAnamnesi = onSnapshot(anamnesiQuery, async (snap) => {
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
    });

    const clientsQuery = query(collection(db, 'clients'));
    const unsubClients = onSnapshot(clientsQuery, (snap) => {
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
    });

    return () => {
      unsubChecks();
      unsubAnamnesi();
      unsubClients();
    };
  }, [lastViewed]);

  // Statistiche clienti
  const clientStats = React.useMemo(() => {
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
  }, [clients]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
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

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-8 relative">
      <AnimatedBackground />
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.header variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-2"><TrendingUp size={28}/> Coach Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-300 font-semibold">{userName}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
          <p className="text-slate-400 mb-4">Panoramica dei tuoi clienti e attività recenti.</p>
          <div className="flex gap-2">
            <button onClick={() => navigate('/clients')} className="px-4 py-2 bg-zinc-800/80 text-sm font-semibold rounded-lg hover:bg-zinc-700/80 transition-colors flex items-center gap-2"><Users size={16}/> Gestisci Clienti</button>
          </div>
        </motion.header>

        <main className="mt-6">
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
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Bell size={20} /> Feed Attività</h2>
            <div className="space-y-3 max-h-[90vh] lg:max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
              <AnimatePresence>
                {activityFeed.length > 0 ? activityFeed.map(item => (
                  <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds}`} item={item} navigate={navigate} variants={itemVariants} />
                )) : <p className="text-sm text-slate-500 p-4 text-center">Nessuna attività recente.</p>}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}