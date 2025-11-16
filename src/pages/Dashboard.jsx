// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, onSnapshot, collectionGroup, doc, getDoc, setDoc, serverTimestamp, query, orderBy 
} from "firebase/firestore"; // ← AGGIUNTO setDoc
import { auth, db, toDate } from "../firebase";
import { signOut } from "firebase/auth";
import { 
  DollarSign, CheckCircle, RefreshCw, BarChart3, Bell, Target, 
  Plus, Clock, FileText, TrendingUp, Users, LogOut 
} from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler } from "chart.js";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

// --- HELPERS ---
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
    renewal: <RefreshCw className="text-emerald-500" size={18}/>,
  };
  const tabMap = { 
    expiring: 'payments', 
    new_check: 'check', 
    new_anamnesi: 'anamnesi',
    renewal: 'payments'
  };

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [lastViewed, setLastViewed] = useState(null);
  const [focusClient, setFocusClient] = useState(null);
  const [retentionRate, setRetentionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartDataType, setChartDataType] = useState('revenue');
  const [chartTimeRange, setChartTimeRange] = useState('monthly');
  const [chartData, setChartData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // --- Check ruolo ---
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'coach') {
      signOut(auth).then(() => {
        navigate('/login');
      }).catch(err => {
        setErrorMessage('Errore durante il logout');
      });
      return;
    }
  }, [navigate]);

  // --- User name ---
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'Admin');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setErrorMessage(`Errore durante il logout: ${error.message}`);
    }
  };

  // --- Client stats ---
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
      try {
        const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        console.error("Errore recupero clienti:", error);
        setErrorMessage("Errore nel recupero dei clienti.");
        setLoading(false);
      }
    }, (error) => {
      console.error("Errore snapshot clienti:", error);
      setErrorMessage("Errore connessione.");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- Last viewed (CORRETTO CON setDoc) ---
  useEffect(() => {
    const lastViewedRef = doc(db, 'app-data', 'lastViewed');
    const fetchLastViewed = async () => {
      try {
        const docSnap = await getDoc(lastViewedRef);
        const lastViewedTime = docSnap.exists() ? docSnap.data().timestamp : null;
        setLastViewed(lastViewedTime);

        // AGGIORNA SEMPRE (anche se esiste)
        await setDoc(lastViewedRef, { timestamp: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Errore lastViewed:", error);
      }
    };
    fetchLastViewed();
  }, []);

  // --- Activity feed: RINNOVI, CHECK, ANAMNESI, SCADENZE ---
  useEffect(() => {
    if (!lastViewed) return;

    let unsubs = [];

    // --- RINNOVI (PAGAMENTI NEL MESE CORRENTE) ---
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paymentsQuery = query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(paymentsQuery, async (snap) => {
      try {
        const newRenewals = [];
        for (const docSnap of snap.docs) {
          const paymentData = docSnap.data();
          const paymentDate = toDate(paymentData.paymentDate);
          if (paymentDate && paymentDate >= currentMonthStart) {
            const clientId = docSnap.ref.parent.parent.id;
            const clientDocSnap = await getDoc(doc(db, 'clients', clientId));
            if (clientDocSnap.exists()) {
              const clientData = clientDocSnap.data();
              if (!clientData.isOldClient && !paymentData.isPast) {
                newRenewals.push({
                  type: 'renewal',
                  clientId,
                  clientName: clientData.name || 'Cliente',
                  description: `Rinnovo di ${paymentData.duration} per ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(paymentData.amount || 0)}`,
                  date: paymentData.paymentDate
                });
              }
            }
          }
        }
        setActivityFeed(prev => [...prev.filter(i => i.type !== 'renewal'), ...newRenewals]);
      } catch (error) {
        console.error("Errore snapshot pagamenti:", error);
      }
    });
    unsubs.push(unsubPayments);

    // --- CHECK ---
    const checksQuery = query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
      try {
        const newChecks = [];
        for (const docSnap of snap.docs) {
          const createdAt = toDate(docSnap.data().createdAt);
          if (createdAt > toDate(lastViewed)) {
            const clientId = docSnap.ref.parent.parent.id;
            const clientDocSnap = await getDoc(doc(db, 'clients', clientId));
            newChecks.push({
              type: 'new_check',
              clientId,
              clientName: clientDocSnap.exists() ? clientDocSnap.data().name || 'Cliente' : 'Cliente',
              description: 'Ha inviato un nuovo check-in',
              date: docSnap.data().createdAt
            });
          }
        }
        setActivityFeed(prev => [...prev.filter(i => i.type !== 'new_check'), ...newChecks]);
      } catch (error) {
        console.error("Errore snapshot checks:", error);
      }
    });
    unsubs.push(unsubChecks);

    // --- ANAMNESI ---
    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubAnamnesi = onSnapshot(anamnesiQuery, async (snap) => {
      try {
        const newAnamnesi = [];
        for (const docSnap of snap.docs) {
          const submittedAt = toDate(docSnap.data().submittedAt);
          if (submittedAt > toDate(lastViewed)) {
            const clientId = docSnap.ref.parent.parent.id;
            const clientDocSnap = await getDoc(doc(db, 'clients', clientId));
            newAnamnesi.push({
              type: 'new_anamnesi',
              clientId,
              clientName: clientDocSnap.exists() ? clientDocSnap.data().name || 'Cliente' : 'Cliente',
              description: 'Ha compilato l\'anamnesi iniziale',
              date: docSnap.data().submittedAt
            });
          }
        }
        setActivityFeed(prev => [...prev.filter(i => i.type !== 'new_anamnesi'), ...newAnamnesi]);
      } catch (error) {
        console.error("Errore snapshot anamnesi:", error);
      }
    });
    unsubs.push(unsubAnamnesi);

    // --- SCADENZE ---
    const clientsQuery = query(collection(db, 'clients'));
    const unsubClients = onSnapshot(clientsQuery, (snap) => {
      try {
        const expiring = snap.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
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
        setActivityFeed(prev => [...prev.filter(i => i.type !== 'expiring'), ...expiring]);
      } catch (error) {
        console.error("Errore snapshot clienti:", error);
      }
    });
    unsubs.push(unsubClients);

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [lastViewed]);

  // --- Monthly income (CORRETTO) ---
  useEffect(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paymentsQuery = query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(paymentsQuery, async (snap) => {
      try {
        let income = 0;
        for (const docSnap of snap.docs) {
          const paymentDate = toDate(docSnap.data().paymentDate);
          if (paymentDate && paymentDate >= currentMonthStart) {
            const clientDocRef = docSnap.ref.parent.parent;
            const clientDocSnap = await getDoc(clientDocRef);
            if (clientDocSnap.exists()) {
              const clientData = clientDocSnap.data();
              if (!clientData.isOldClient && !docSnap.data().isPast) {
                income += docSnap.data().amount || 0;
              }
            }
          }
        }
        setMonthlyIncome(income);
      } catch (error) {
        console.error("Errore snapshot pagamenti:", error);
      }
    });
    return () => unsubPayments();
  }, []);

  // --- Retention rate ---
  useEffect(() => {
    if (clients.length > 0) {
      const retained = clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && expiry > new Date();
      }).length;
      setRetentionRate(Math.round((retained / clients.length) * 100));
    }
  }, [clients]);

  // --- Focus client ---
  useEffect(() => {
    if (clients.length > 0) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      setFocusClient({ name: randomClient.name, goal: randomClient.goal });
    }
  }, [clients]);

  // --- Chart data ---
  useEffect(() => {
    let unsub = null;
    const generateChartData = async () => {
      const now = new Date();
      if (chartDataType === 'revenue') {
        const paymentsQuery = query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'asc'));
        unsub = onSnapshot(paymentsQuery, async (snap) => {
          try {
            const dailyData = {};
            const monthlyData = {};
            const yearlyData = {};

            for (const docSnap of snap.docs) {
              const date = toDate(docSnap.data().paymentDate);
              const clientDocRef = docSnap.ref.parent.parent;
              const clientDocSnap = await getDoc(clientDocRef);
              if (date && clientDocSnap.exists()) {
                const clientData = clientDocSnap.data();
                if (!clientData.isOldClient && !docSnap.data().isPast) {
                  const amount = docSnap.data().amount || 0;

                  const dayKey = date.toLocaleDateString('it-IT');
                  dailyData[dayKey] = (dailyData[dayKey] || 0) + amount;

                  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;

                  const yearKey = date.getFullYear().toString();
                  yearlyData[yearKey] = (yearlyData[yearKey] || 0) + amount;
                }
              }
            }

            let data = [];
            if (chartTimeRange === 'daily') {
              for (let i = 29; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const key = d.toLocaleDateString('it-IT');
                data.push({ name: key, value: dailyData[key] || 0 });
              }
            } else if (chartTimeRange === 'monthly') {
              for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                data.push({ name: key, value: monthlyData[key] || 0 });
              }
            } else {
              for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i;
                data.push({ name: year.toString(), value: yearlyData[year] || 0 });
              }
            }
            setChartData(data);
          } catch (error) {
            console.error("Errore chart revenue:", error);
          }
        });
      } else {
        const clientsQuery = query(collection(db, 'clients'), orderBy('createdAt', 'asc'));
        unsub = onSnapshot(clientsQuery, (snap) => {
          try {
            const dailyData = {};
            const monthlyData = {};
            const yearlyData = {};

            snap.docs.forEach(docSnap => {
              const date = toDate(docSnap.data().createdAt);
              if (date) {
                const dayKey = date.toLocaleDateString('it-IT');
                dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;

                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;

                const yearKey = date.getFullYear().toString();
                yearlyData[yearKey] = (yearlyData[yearKey] || 0) + 1;
              }
            });

            let data = [];
            if (chartTimeRange === 'daily') {
              for (let i = 29; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const key = d.toLocaleDateString('it-IT');
                data.push({ name: key, value: dailyData[key] || 0 });
              }
            } else if (chartTimeRange === 'monthly') {
              for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                data.push({ name: key, value: monthlyData[key] || 0 });
              }
            } else {
              for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i;
                data.push({ name: year.toString(), value: yearlyData[year] || 0 });
              }
            }
            setChartData(data);
          } catch (error) {
            console.error("Errore chart clienti:", error);
          }
        });
      }
    };
    generateChartData();
    return () => {
      if (unsub) unsub();
    };
  }, [chartDataType, chartTimeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: "#e2e8f0", font: { size: 11 } } },
      y: { grid: { color: "rgba(255, 255, 255, 0.1)" }, ticks: { color: "#e2e8f0", font: { size: 11 } } }
    },
    plugins: {
      legend: { position: "top", labels: { font: { size: 12 }, color: "#e2e8f0" } },
      tooltip: { 
        callbacks: { 
          label: (item) => `${item.dataset.label}: ${chartDataType === 'revenue' ? `€${item.raw}` : item.raw}` 
        } 
      }
    }
  };

  const chartDataConfig = {
    labels: chartData.map(item => item.name),
    datasets: [{
      label: chartDataType === 'revenue' ? 'Fatturato (€)' : 'Nuovi Clienti',
      data: chartData.map(item => item.value),
      borderColor: chartDataType === 'revenue' ? '#22c55e' : '#6366f1',
      backgroundColor: chartDataType === 'revenue' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  if (errorMessage) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-red-900/80 p-6 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-300 mb-2">Errore</h2>
        <p className="text-red-400">{errorMessage}</p>
        <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
          Torna al Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <div className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
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
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/clients')} className="px-4 py-2 bg-zinc-800/80 text-sm font-semibold rounded-lg hover:bg-zinc-700/80 transition-colors flex items-center gap-2"><Users size={16}/> Gestisci</button>
          <button onClick={() => navigate('/new-client')} className="px-4 py-2 bg-rose-600 text-sm font-semibold rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2"><Plus size={16}/> Nuovo</button>
          <button onClick={() => navigate('/business-history')} className="px-4 py-2 bg-cyan-600 text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"><BarChart3 size={16}/> Storico</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard title="Incasso Mensile" value={monthlyIncome} icon={<DollarSign className="text-green-500"/>} isCurrency={true} />
            <StatCard title="Clienti Attivi" value={clientStats.active} icon={<CheckCircle className="text-blue-500"/>} />
            <StatCard title="Retention Rate" value={retentionRate} icon={<RefreshCw className="text-amber-500"/>} isPercentage={true} />
          </div>

          <div className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border h-[450px] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2"><BarChart3 size={20} /> Andamento Business</h2>
              <div className="flex gap-2 bg-zinc-900/70 p-1 rounded-lg border border-white/5">
                <button onClick={() => setChartDataType('revenue')} className={`px-3 py-1 text-sm rounded-md transition ${chartDataType === 'revenue' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Fatturato</button>
                <button onClick={() => setChartDataType('clients')} className={`px-3 py-1 text-sm rounded-md transition ${chartDataType === 'clients' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Clienti</button>
              </div>
            </div>
            <div className="flex-1">
              <Line data={chartDataConfig} options={chartOptions} />
            </div>
            <div className="flex justify-center mt-4">
              <div className="flex gap-2 bg-zinc-900/70 p-1 rounded-lg border border-white/5">
                <button onClick={() => setChartTimeRange('daily')} className={`px-3 py-1 text-xs rounded-md transition ${chartTimeRange === 'daily' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Giorno</button>
                <button onClick={() => setChartTimeRange('monthly')} className={`px-3 py-1 text-xs rounded-md transition ${chartTimeRange === 'monthly' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Mese</button>
                <button onClick={() => setChartTimeRange('yearly')} className={`px-3 py-1 text-xs rounded-md transition ${chartTimeRange === 'yearly' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Anno</button>
              </div>
            </div>
          </div>

          {focusClient && (
            <div className="bg-zinc-950/60 backdrop-blur-xl p-4 rounded-xl gradient-border">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-200"><Target size={18} /> Focus del Giorno</h2>
              <p className="text-sm font-bold text-rose-500">{focusClient.name}</p>
              <p className="text-sm text-slate-400 mt-1">Obiettivo: "{focusClient.goal || 'Non specificato'}"</p>
            </div>
          )}
        </div>
        
        <div className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Bell size={20} /> Feed Attività</h2>
          <div className="space-y-3 max-h-[90vh] lg:max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
            <AnimatePresence>
              {activityFeed.length > 0 ? activityFeed
                .sort((a, b) => toDate(b.date) - toDate(a.date))
                .slice(0, 20)
                .map(item => (
                  <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds || item.date}`} item={item} navigate={navigate} />
                )) 
                : <p className="text-sm text-slate-500 p-4 text-center">Nessuna attività recente.</p>
              }
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}