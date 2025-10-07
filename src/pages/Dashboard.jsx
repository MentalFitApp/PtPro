import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, collectionGroup, doc, setDoc, getDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { db } from "../firebase";
import { 
  DollarSign, CheckCircle, RefreshCw, BarChart3, Bell, Target, 
  BookOpen, Plus, Clock, FileText, TrendingUp, User, Users, LogOut 
} from "lucide-react";
import { 
  AreaChart, Area, Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// --- HELPERS ---
function toDate(x) {
  if (!x) return null;
  if (typeof x?.toDate === 'function') return x.toDate();
  const d = new Date(x);
  return isNaN(d) ? null : d;
}
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

// --- COMPONENTI UI ---
const StatCard = ({ title, value, icon, isCurrency = false, isPercentage = false }) => (
  <div className="bg-zinc-950/60 backdrop-blur-xl p-4 rounded-xl gradient-border h-full">
    <div className="flex items-center gap-3 text-slate-400">
      {icon}
      <p className="text-sm">{title}</p>
    </div>
    <p className="text-3xl font-bold text-slate-50 mt-2">
      {isCurrency 
        ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value) 
        : isPercentage ? `${value}%` : value
      }
    </p>
  </div>
);

const ActivityItem = ({ item, navigate }) => {
  const icons = {
    expiring: <Clock className="text-yellow-500" size={18}/>,
    new_check: <CheckCircle className="text-green-500" size={18}/>,
    new_anamnesi: <FileText className="text-blue-500" size={18}/>,
  };
  const tabMap = { expiring: 'payments', new_check: 'checks', new_anamnesi: 'anamnesi' };

  return (
    <motion.button
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

const RechartsChart = ({ chartData, dataType }) => {
  const currencyFormatter = (value) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value);
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/80 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-sm">
          <p className="label text-slate-300 font-semibold">{`${label}`}</p>
          <p className="intro text-slate-400" style={{ color: payload[0].color }}>
            {`${dataType === 'revenue' ? 'Fatturato' : 'Nuovi Clienti'}: ${dataType === 'revenue' ? currencyFormatter(payload[0].value) : payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return(
    <ResponsiveContainer width="100%" height="100%">
      {dataType === 'revenue' ? (
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
};

// --- QuickNotes Component ---
const QuickNotes = () => {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app-data', 'quickNotes'), (docSnap) => docSnap.exists() && setNotes(docSnap.data().content || ''));
    return () => unsub();
  }, []);
  const saveNotes = async () => {
    await setDoc(doc(db, 'app-data', 'quickNotes'), { content: notes, updatedAt: serverTimestamp() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className="bg-zinc-950/60 backdrop-blur-xl p-4 rounded-xl gradient-border">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-200"><BookOpen size={18}/> Note Rapide</h2>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-32 p-3 bg-zinc-900/70 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 resize-none text-slate-200" placeholder="Annota idee, promemoria o task rapidi..."/>
      <button onClick={saveNotes} className="mt-3 px-4 py-2 bg-rose-600 text-sm font-semibold rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 w-full">
        {saved ? <><Check size={16}/> Salvato!</> : <><Plus size={16}/> Salva Note</>}
      </button>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [chartDataType, setChartDataType] = useState('revenue');
  const [chartTimeRange, setChartTimeRange] = useState('monthly');
  const [chartData, setChartData] = useState([]);
  const [lastViewed, setLastViewed] = useState(null);
  const [focusClient, setFocusClient] = useState(null);
  const [retentionRate, setRetentionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- User name and logout ---
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserName(user.displayName || user.email || 'Admin');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // --- Client stats calculation ---
  const clientStats = useMemo(() => {
    const now = new Date();
    const active = clients.filter(c => {
      const expiry = toDate(c.scadenza);
      return expiry && expiry > now;
    }).length;
    return { active };
  }, [clients]);

  // --- Fetch clients ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snap) => {
      const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- Fetch lastViewed and update on load ---
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

  // --- Activity feed listeners ---
  useEffect(() => {
    if (!lastViewed) return;

    // Listener for new checks
    const checksQuery = query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
      const newChecks = [];
      for (const doc of snap.docs) {
        if (doc.data().createdAt > lastViewed) {
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

    // Listener for new anamnesi
    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubAnamnesi = onSnapshot(anamnesiQuery, async (snap) => {
      const newAnamnesi = [];
      for (const doc of snap.docs) {
        if (doc.data().submittedAt > lastViewed) {
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

    // Listener for expiring subscriptions
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

  // --- Monthly income calculation ---
  useEffect(() => {
    const paymentsQuery = query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
      const currentMonth = new Date().getMonth();
      const income = snap.docs
        .filter(doc => toDate(doc.data().paymentDate)?.getMonth() === currentMonth)
        .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      setMonthlyIncome(income);
    });
    return () => unsubPayments();
  }, []);

  // --- Chart data calculation ---
  useEffect(() => {
    const generateChartData = () => {
      if (chartDataType === 'revenue') {
        const paymentsQuery = query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'asc'));
        const unsub = onSnapshot(paymentsQuery, (snap) => {
          let data = [];
          if (chartTimeRange === 'monthly') {
            const monthlyData = snap.docs.reduce((acc, doc) => {
              const date = toDate(doc.data().paymentDate);
              if (date) {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                acc[key] = (acc[key] || 0) + (doc.data().amount || 0);
              }
              return acc;
            }, {});
            data = Object.entries(monthlyData).map(([name, value]) => ({ name, value }));
          } else {
            const yearlyData = snap.docs.reduce((acc, doc) => {
              const date = toDate(doc.data().paymentDate);
              if (date) {
                const key = date.getFullYear().toString();
                acc[key] = (acc[key] || 0) + (doc.data().amount || 0);
              }
              return acc;
            }, {});
            data = Object.entries(yearlyData).map(([name, value]) => ({ name, value }));
          }
          setChartData(data);
        });
        return () => unsub();
      } else {
        const clientsQuery = query(collection(db, 'clients'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(clientsQuery, (snap) => {
          let data = [];
          if (chartTimeRange === 'monthly') {
            const monthlyData = snap.docs.reduce((acc, doc) => {
              const date = toDate(doc.data().createdAt);
              if (date) {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                acc[key] = (acc[key] || 0) + 1;
              }
              return acc;
            }, {});
            data = Object.entries(monthlyData).map(([name, value]) => ({ name, value }));
          } else {
            const yearlyData = snap.docs.reduce((acc, doc) => {
              const date = toDate(doc.data().createdAt);
              if (date) {
                const key = date.getFullYear().toString();
                acc[key] = (acc[key] || 0) + 1;
              }
              return acc;
            }, {});
            data = Object.entries(yearlyData).map(([name, value]) => ({ name, value }));
          }
          setChartData(data);
        });
        return () => unsub();
      }
    };
    return generateChartData();
  }, [chartDataType, chartTimeRange]);

  // --- Focus client selection ---
  useEffect(() => {
    if (clients.length > 0) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      setFocusClient({ name: randomClient.name, goal: randomClient.goal });
    }
  }, [clients]);

  // --- Retention rate calculation ---
  useEffect(() => {
    if (clients.length > 0) {
      const retained = clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && expiry > new Date();
      }).length;
      setRetentionRate(Math.round((retained / clients.length) * 100));
    }
  }, [clients]);

  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="w-full space-y-6">
      <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-2"><TrendingUp size={28}/> Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-300 font-semibold">{userName}</span>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
        <p className="text-slate-400 mb-4">Panoramica delle metriche chiave e progressi in tempo reale.</p>
        <div className="flex gap-2">
            <button onClick={() => navigate('/clients')} className="px-4 py-2 bg-zinc-800/80 text-sm font-semibold rounded-lg hover:bg-zinc-700/80 transition-colors flex items-center gap-2"><Users size={16}/> Gestisci</button>
            <button onClick={() => navigate('/new')} className="px-4 py-2 bg-rose-600 text-sm font-semibold rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2"><Plus size={16}/> Nuovo</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <StatCard title="Incasso Mensile" value={monthlyIncome} icon={<DollarSign className="text-green-500"/>} isCurrency={true} />
              <StatCard title="Clienti Attivi" value={clientStats.active} icon={<CheckCircle className="text-blue-500"/>} />
              <StatCard title="Retention Rate" value={retentionRate} icon={<RefreshCw className="text-amber-500"/>} isPercentage={true} />
          </motion.div>
          <motion.div className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border h-[450px] flex flex-col" variants={itemVariants}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
               <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2"><BarChart3 size={20}/> Business Overview</h2>
               <div className="flex gap-2 bg-zinc-900/70 p-1 rounded-lg border border-white/5">
                <button onClick={() => setChartDataType('revenue')} className={`px-3 py-1 text-sm rounded-md transition ${chartDataType === 'revenue' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Fatturato</button>
                <button onClick={() => setChartDataType('clients')} className={`px-3 py-1 text-sm rounded-md transition ${chartDataType === 'clients' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Clienti</button>
               </div>
            </div>
            <div className="flex-1">
              <RechartsChart chartData={chartData} dataType={chartDataType}/>
            </div>
            <div className="flex justify-center mt-4">
               <div className="flex gap-2 bg-zinc-900/70 p-1 rounded-lg border border-white/5">
                <button onClick={() => setChartTimeRange('monthly')} className={`px-3 py-1 text-xs rounded-md transition ${chartTimeRange === 'monthly' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Mese</button>
                <button onClick={() => setChartTimeRange('yearly')} className={`px-3 py-1 text-xs rounded-md transition ${chartTimeRange === 'yearly' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Anno</button>
               </div>
            </div>
          </motion.div>
           <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
              {focusClient && (
                <div className="bg-zinc-950/60 backdrop-blur-xl p-4 rounded-xl gradient-border">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-200"><Target size={18}/> Focus del Giorno</h2>
                    <p className="font-bold text-xl text-rose-500">{focusClient.name}</p>
                    <p className="text-sm text-slate-400 mt-1">Obiettivo: "{focusClient.goal || 'Non specificato'}"</p>
                </div>
              )}
               <QuickNotes />
           </motion.div>
        </div>
        
        <motion.div className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border" variants={itemVariants}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Bell size={20}/> Feed Attività</h2>
            <div className="space-y-3 max-h-[90vh] lg:max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
              <AnimatePresence>
                {activityFeed.length > 0 ? activityFeed.map(item => (
                  <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds}`} item={item} navigate={navigate} />
                )) : <p className="text-sm text-slate-500 p-4 text-center">Nessuna attività recente.</p>}
              </AnimatePresence>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
}