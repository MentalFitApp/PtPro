import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, collectionGroup, doc, setDoc, getDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
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
      console.warn('Accesso non autorizzato a Dashboard, redirect');
      signOut(auth).then(() => {
        navigate('/login');
      }).catch(err => {
        console.error('Errore durante il logout:', err);
        setErrorMessage('Errore durante il logout');
      });
      return;
    }
  }, [navigate]);

  // --- User name and logout ---
  const [userName, setUserName] = useState('');
  useEffect(() => {
    console.log('Utente autenticato:', auth.currentUser?.uid, 'Email:', auth.currentUser?.email);
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
      setErrorMessage(`Errore durante il logout: ${error.message}`);
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
    let snapshotCount = 0;
    const unsub = onSnapshot(collection(db, 'clients'), (snap) => {
      snapshotCount++;
      console.log(`Dashboard: Client snapshot #${snapshotCount}, documenti:`, snap.docs.length);
      if (snapshotCount > 10) {
        console.warn('Dashboard: Excessive client snapshots detected, stopping listener');
        unsub();
        setErrorMessage('Errore: troppe richieste al server per i clienti. Contatta l\'assistenza.');
        return;
      }
      try {
        const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        console.error("Errore nel recupero dei clienti:", error);
        if (error.code === 'permission-denied') {
          setErrorMessage("Permessi insufficienti per accedere ai dati dei clienti. Contatta l'amministratore.");
        }
        setLoading(false);
      }
    }, (error) => {
      console.error("Errore snapshot clienti:", error);
      if (error.code === 'permission-denied') {
        setErrorMessage("Permessi insufficienti per accedere ai dati dei clienti. Contatta l'amministratore.");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- Fetch lastViewed and update on load ---
  useEffect(() => {
    const lastViewedRef = doc(db, 'app-data', 'lastViewed');
    const fetchLastViewed = async () => {
      try {
        const docSnap = await getDoc(lastViewedRef);
        const lastViewedTime = docSnap.exists() ? docSnap.data().timestamp : null;
        setLastViewed(lastViewedTime);
        await setDoc(lastViewedRef, { timestamp: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Errore nel recupero di lastViewed:", error);
        if (error.code === 'permission-denied') {
          setErrorMessage("Permessi insufficienti per accedere ai dati di lastViewed. Contatta l'amministratore.");
        }
      }
    };
    fetchLastViewed();
  }, []);

  // --- Activity feed listeners ---
  useEffect(() => {
    if (!lastViewed) return;

    let checksSnapshotCount = 0;
    const checksQuery = query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
      checksSnapshotCount++;
      console.log(`Dashboard: Checks snapshot #${checksSnapshotCount}, documenti:`, snap.docs.length);
      if (checksSnapshotCount > 10) {
        console.warn('Dashboard: Excessive checks snapshots detected, stopping listener');
        unsubChecks();
        setErrorMessage('Errore: troppe richieste al server per i check. Contatta l\'assistenza.');
        return;
      }
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
      } catch (error) {
        console.error("Errore snapshot checks:", error);
        if (error.code === 'permission-denied') {
          setErrorMessage("Permessi insufficienti per accedere ai dati dei check. Contatta l'amministratore.");
        }
      }
    }, (error) => {
      console.error("Errore snapshot checks:", error);
      if (error.code === 'permission-denied') {
        setErrorMessage("Permessi insufficienti per accedere ai dati dei check. Contatta l'amministratore.");
      }
    });

    let anamnesiSnapshotCount = 0;
    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubAnamnesi = onSnapshot(anamnesiQuery, async (snap) => {
      anamnesiSnapshotCount++;
      console.log(`Dashboard: Anamnesi snapshot #${anamnesiSnapshotCount}, documenti:`, snap.docs.length);
      if (anamnesiSnapshotCount > 10) {
        console.warn('Dashboard: Excessive anamnesi snapshots detected, stopping listener');
        unsubAnamnesi();
        setErrorMessage('Errore: troppe richieste al server per le anamnesi. Contatta l\'assistenza.');
        return;
      }
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
      } catch (error) {
        console.error("Errore snapshot anamnesi:", error);
        if (error.code === 'permission-denied') {
          setErrorMessage("Permessi insufficienti per accedere ai dati delle anamnesi. Contatta l'amministratore.");
        }
      }
    }, (error) => {
      console.error("Errore snapshot anamnesi:", error);
      if (error.code === 'permission-denied') {
        setErrorMessage("Permessi insufficienti per accedere ai dati delle anamnesi. Contatta l'amministratore.");
      }
    });

    let clientsSnapshotCount = 0;
    const clientsQuery = query(collection(db, 'clients'));
    const unsubClients = onSnapshot(clientsQuery, (snap) => {
      clientsSnapshotCount++;
      console.log(`Dashboard: Clients snapshot #${clientsSnapshotCount}, documenti:`, snap.docs.length);
      if (clientsSnapshotCount > 10) {
        console.warn('Dashboard: Excessive clients snapshots detected, stopping listener');
        unsubClients();
        setErrorMessage('Errore: troppe richieste al server per i clienti. Contatta l\'assistenza.');
        return;
      }
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
      } catch (error) {
        console.error("Errore snapshot clienti:", error);
        if (error.code === 'permission-denied') {
          setErrorMessage("Permessi insufficienti per accedere ai dati dei clienti. Contatta l'amministratore.");
        }
      }
    }, (error) => {
      console.error("Errore snapshot clienti:", error);
      if (error.code === 'permission-denied') {
        setErrorMessage("Permessi insufficienti per accedere ai dati dei clienti. Contatta l'amministratore.");
      }
    });

    return () => {
      unsubChecks();
      unsubAnamnesi();
      unsubClients();
    };
  }, [lastViewed]);

  // --- Monthly income calculation ---
  useEffect(() => {
    let snapshotCount = 0;
    const paymentsQuery = query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(paymentsQuery, async (snap) => {
      snapshotCount++;
      console.log(`Dashboard: Payments snapshot #${snapshotCount}, documenti:`, snap.docs.length);
      if (snapshotCount > 10) {
        console.warn('Dashboard: Excessive payments snapshots detected, stopping listener');
        unsubPayments();
        setErrorMessage('Errore: troppe richieste al server per i pagamenti. Contatta l\'assistenza.');
        return;
      }
      try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let income = 0;

        for (const doc of snap.docs) {
          const paymentDate = toDate(doc.data().paymentDate);
          if (paymentDate && paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()) {
            const clientDocRef = doc.ref.parent.parent;
            const clientDocSnap = await getDoc(clientDocRef); // Recupera i dati del client asincronamente
            if (clientDocSnap.exists()) {
              const clientData = clientDocSnap.data();
              const isOldClient = clientData.isOldClient || false;
              const isPast = doc.data().isPast || false;
              if (!isOldClient || !isPast) {
                income += doc.data().amount || 0;
                console.log(`Aggiunto pagamento: ${doc.data().amount}€ per cliente ${clientData.name}, isOldClient: ${isOldClient}, isPast: ${isPast}`);
              } else {
                console.log(`Escluso pagamento: ${doc.data().amount}€ per cliente ${clientData.name}, isOldClient: ${isOldClient}, isPast: ${isPast}`);
              }
            }
          }
        }
        setMonthlyIncome(income);
      } catch (error) {
        console.error("Errore snapshot pagamenti:", error);
        if (error.code === 'permission-denied') {
          setErrorMessage("Permessi insufficienti per accedere ai dati dei pagamenti. Contatta l'amministratore.");
        }
      }
    }, (error) => {
      console.error("Errore snapshot pagamenti:", error);
      if (error.code === 'permission-denied') {
        setErrorMessage("Permessi insufficienti per accedere ai dati dei pagamenti. Contatta l'amministratore.");
      }
    });
    return () => unsubPayments();
  }, []);

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

  // --- Focus client selection ---
  useEffect(() => {
    if (clients.length > 0) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      setFocusClient({ name: randomClient.name, goal: randomClient.goal });
    }
  }, [clients]);

  // --- Chart data calculation ---
  useEffect(() => {
    let snapshotCount = 0;
    const generateChartData = () => {
      if (chartDataType === 'revenue') {
        const paymentsQuery = query(collectionGroup(db, 'payments'), orderBy('paymentDate', 'asc'));
        const unsub = onSnapshot(paymentsQuery, async (snap) => {
          snapshotCount++;
          console.log(`Dashboard: Chart revenue snapshot #${snapshotCount}, documenti:`, snap.docs.length);
          if (snapshotCount > 10) {
            console.warn('Dashboard: Excessive chart revenue snapshots detected, stopping listener');
            unsub();
            setErrorMessage('Errore: troppe richieste al server per il grafico dei ricavi. Contatta l\'assistenza.');
            return;
          }
          try {
            let data = [];
            const monthlyData = {};
            for (const doc of snap.docs) {
              const date = toDate(doc.data().paymentDate);
              const clientDocRef = doc.ref.parent.parent;
              const clientDocSnap = await getDoc(clientDocRef);
              if (date && clientDocSnap.exists()) {
                const clientData = clientDocSnap.data();
                if (!clientData.isOldClient || !doc.data().isPast) {
                  const key = chartTimeRange === 'monthly' ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : date.getFullYear().toString();
                  monthlyData[key] = (monthlyData[key] || 0) + (doc.data().amount || 0);
                }
              }
            }
            if (chartTimeRange === 'monthly') {
              const now = new Date();
              for (let i = 11; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
                data.push({ name: key, value: monthlyData[key] || 0 });
              }
            } else {
              data = Object.entries(monthlyData).sort((a, b) => a[0] - b[0]).map(([name, value]) => ({ name, value }));
            }
            setChartData(data);
          } catch (error) {
            console.error("Errore snapshot pagamenti per chart:", error);
            if (error.code === 'permission-denied') {
              setErrorMessage("Permessi insufficienti per accedere ai dati dei pagamenti. Contatta l'amministratore.");
            }
          }
        }, (error) => {
          console.error("Errore snapshot pagamenti per chart:", error);
          if (error.code === 'permission-denied') {
            setErrorMessage("Permessi insufficienti per accedere ai dati dei pagamenti. Contatta l'amministratore.");
          }
        });
        return unsub;
      } else {
        const clientsQuery = query(collection(db, 'clients'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(clientsQuery, (snap) => {
          snapshotCount++;
          console.log(`Dashboard: Chart clients snapshot #${snapshotCount}, documenti:`, snap.docs.length);
          if (snapshotCount > 10) {
            console.warn('Dashboard: Excessive chart clients snapshots detected, stopping listener');
            unsub();
            setErrorMessage('Errore: troppe richieste al server per il grafico dei clienti. Contatta l\'assistenza.');
            return;
          }
          try {
            let data = [];
            const monthlyData = {};
            snap.docs.forEach(doc => {
              const date = toDate(doc.data().createdAt);
              if (date) {
                const key = chartTimeRange === 'monthly' ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : date.getFullYear().toString();
                monthlyData[key] = (monthlyData[key] || 0) + 1;
              }
            });
            if (chartTimeRange === 'monthly') {
              const now = new Date();
              for (let i = 11; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
                data.push({ name: key, value: monthlyData[key] || 0 });
              }
            } else {
              data = Object.entries(monthlyData).sort((a, b) => a[0] - b[0]).map(([name, value]) => ({ name, value }));
            }
            setChartData(data);
          } catch (error) {
            console.error("Errore snapshot clienti per chart:", error);
            if (error.code === 'permission-denied') {
              setErrorMessage("Permessi insufficienti per accedere ai dati dei clienti. Contatta l'amministratore.");
            }
          }
        }, (error) => {
          console.error("Errore snapshot clienti per chart:", error);
          if (error.code === 'permission-denied') {
            setErrorMessage("Permessi insufficienti per accedere ai dati dei clienti. Contatta l'amministratore.");
          }
        });
        return unsub;
      }
    };
    return generateChartData();
  }, [chartDataType, chartTimeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#e2e8f0", font: { size: 12 } }
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: {
          color: "#e2e8f0",
          font: { size: 12 },
          callback: function(value) {
            return chartDataType === 'revenue' ? `€${value}` : value;
          }
        }
      }
    },
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 12, family: "'Inter', sans-serif", weight: "500" }, color: "#e2e8f0" }
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            return `${tooltipItem.dataset.label}: ${chartDataType === 'revenue' ? `€${tooltipItem.raw}` : tooltipItem.raw}`;
          }
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

  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  if (errorMessage) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-red-900/80 p-6 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-300 mb-2">Accesso Negato</h2>
        <p className="text-red-400">{errorMessage}</p>
        <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
          Torna al Login
        </button>
      </div>
    </div>
  );

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
          <button onClick={() => navigate('/business-history')} className="px-4 py-2 bg-cyan-600 text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"><BarChart3 size={16}/> Storico</button>
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
                <button onClick={() => setChartTimeRange('monthly')} className={`px-3 py-1 text-xs rounded-md transition ${chartTimeRange === 'monthly' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Mese</button>
                <button onClick={() => setChartTimeRange('yearly')} className={`px-3 py-1 text-xs rounded-md transition ${chartTimeRange === 'yearly' ? 'bg-zinc-700 text-white' : 'text-slate-400'}`}>Anno</button>
              </div>
            </div>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-1 gap-6" variants={itemVariants}>
            {focusClient && (
              <div className="bg-zinc-950/60 backdrop-blur-xl p-4 rounded-xl gradient-border">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-200"><Target size={18} /> Focus del Giorno</h2>
                <p className="text-sm font-bold text-rose-500">{focusClient.name}</p>
                <p className="text-sm text-slate-400 mt-1">Obiettivo: "{focusClient.goal || 'Non specificato'}"</p>
              </div>
            )}
          </motion.div>
        </div>
        
        <motion.div className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border" variants={itemVariants}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Bell size={20} /> Feed Attività</h2>
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