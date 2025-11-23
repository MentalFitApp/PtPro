// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, onSnapshot, doc, getDoc, getDocs, setDoc, serverTimestamp, query, orderBy, where
} from "firebase/firestore";
import { auth, db, toDate } from "../../firebase"
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { uploadPhoto } from "../../cloudflareStorage";
import { signOut, updateProfile } from "firebase/auth";
import {
  DollarSign, CheckCircle, RefreshCw, BarChart3, Bell, Target,
  Plus, Clock, FileText, TrendingUp, Users, LogOut, User, Settings, X
} from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler } from "chart.js";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantBranding } from '../../hooks/useTenantBranding';

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

// --- COMPONENTI UI PREMIUM ---
const StatCard = ({ title, value, icon, color = 'blue', isCurrency = false, isPercentage = false, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
        {isCurrency 
          ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) 
          : isPercentage ? `${value}%` : value
        }
      </h3>
      <p className="text-xs sm:text-sm text-slate-400">{title}</p>
    </motion.div>
  );
};

const ActivityItem = ({ item, navigate }) => {
  const iconConfig = {
    expiring: { icon: <Clock size={18}/>, color: 'text-yellow-400 bg-yellow-500/10' },
    new_check: { icon: <CheckCircle size={18}/>, color: 'text-green-400 bg-green-500/10' },
    new_anamnesi: { icon: <FileText size={18}/>, color: 'text-blue-400 bg-blue-500/10' },
    renewal: { icon: <RefreshCw size={18}/>, color: 'text-emerald-400 bg-emerald-500/10' },
  };
  const tabMap = { 
    expiring: 'payments', 
    new_check: 'check', 
    new_anamnesi: 'anamnesi',
    renewal: 'payments'
  };

  const config = iconConfig[item.type];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileHover={{ x: 4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/client/${item.clientId}?tab=${tabMap[item.type]}`)}
      className="w-full flex items-start gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/30 transition-all text-left"
    >
      <div className={`p-1.5 sm:p-2 rounded-lg ${config.color} flex-shrink-0`}>
        {React.cloneElement(config.icon, { size: 16, className: 'sm:w-[18px] sm:h-[18px]' })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-white mb-0.5">{item.clientName}</p>
        <p className="text-[10px] sm:text-xs text-slate-400 truncate">{item.description}</p>
      </div>
      <div className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0 pt-0.5 sm:pt-1">
        {timeAgo(item.date)}
      </div>
    </motion.button>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { branding } = useTenantBranding();
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyRenewals, setMonthlyRenewals] = useState(0);
  const [lastViewed, setLastViewed] = useState(null);
  const [focusClient, setFocusClient] = useState(null);
  const [retentionRate, setRetentionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartDataType, setChartDataType] = useState('revenue');
  const [chartTimeRange, setChartTimeRange] = useState('monthly');
  const [chartData, setChartData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState(null);

  // --- Gestione foto profilo ---
  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validazione tipo file
      if (!file.type.startsWith('image/')) {
        alert('Seleziona un file immagine valido');
        return;
      }

      // Validazione dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'immagine non può superare i 5MB');
        return;
      }

      setSelectedPhotoFile(file);

      // Crea anteprima
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // --- Check ruolo ---
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'coach') {
      signOut(auth).then(() => {
        navigate('/login');
      }).catch(error => {
        console.error('Logout error:', error);
        setErrorMessage('Errore durante il logout');
      });
      return;
    }
  }, [navigate]);

  // --- User profile ---
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'Admin');
        setCurrentPhotoURL(user.photoURL);
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
    const unsub = onSnapshot(getTenantCollection(db, 'clients'), (snap) => {
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
    const lastViewedRef = getTenantDoc(db, 'app-data', 'lastViewed');
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
    const setupRenewalsListener = async () => {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Prima otteniamo tutti i clienti, poi ascoltiamo i loro pagamenti
      const clientsSnapshot = await getDocs(getTenantCollection(db, 'clients'));
      
      clientsSnapshot.forEach(clientDoc => {
        const clientData = clientDoc.data();
        if (clientData.isOldClient) return; // Salta clienti vecchi
        
        const paymentsQuery = query(
          getTenantSubcollection(db, 'clients', clientDoc.id, 'payments'),
          orderBy('paymentDate', 'desc')
        );
        
        const unsubPayment = onSnapshot(paymentsQuery, (paymentsSnap) => {
          const newRenewals = [];
          paymentsSnap.forEach(paymentDoc => {
            const paymentData = paymentDoc.data();
            const paymentDate = toDate(paymentData.paymentDate);
            if (paymentDate && paymentDate >= currentMonthStart && !paymentData.isPast) {
              newRenewals.push({
                type: 'renewal',
                clientId: clientDoc.id,
                clientName: clientData.name || 'Cliente',
                description: `Rinnovo di ${paymentData.duration} per ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(paymentData.amount || 0)}`,
                date: paymentData.paymentDate
              });
            }
          });
          setActivityFeed(prev => {
            // Rimuovi i vecchi rinnovi di questo cliente e aggiungi i nuovi
            const filtered = prev.filter(i => i.type !== 'renewal' || i.clientId !== clientDoc.id);
            return [...filtered, ...newRenewals];
          });
        });
        unsubs.push(unsubPayment);
      });
    };
    
    setupRenewalsListener();

    // --- CHECK ---
    // Carica tutti i clients e poi ascolta i loro checks
    const loadChecksActivity = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        const newChecks = [];
        
        for (const clientDoc of clientsSnap.docs) {
          const checksSnap = await getDocs(
            query(
              getTenantSubcollection(db, 'clients', clientDoc.id, 'checks'),
              orderBy('createdAt', 'desc')
            )
          );
          
          checksSnap.docs.forEach(checkDoc => {
            const createdAt = toDate(checkDoc.data().createdAt);
            if (createdAt > toDate(lastViewed)) {
              newChecks.push({
                type: 'new_check',
                clientId: clientDoc.id,
                clientName: clientDoc.data().name || 'Cliente',
                description: 'Ha inviato un nuovo check-in',
                date: checkDoc.data().createdAt
              });
            }
          });
        }
        
        setActivityFeed(prev => [...prev.filter(i => i.type !== 'new_check'), ...newChecks]);
      } catch (error) {
        console.error("Errore caricamento checks:", error);
      }
    };
    
    loadChecksActivity();

    // --- ANAMNESI ---
    // Carica anamnesi dal tenant corrente
    const loadAnamnesiActivity = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        const newAnamnesi = [];
        
        for (const clientDoc of clientsSnap.docs) {
          const anamnesiSnap = await getDocs(
            getTenantSubcollection(db, 'clients', clientDoc.id, 'anamnesi')
          );
          
          anamnesiSnap.docs.forEach(anamnesiDoc => {
            const submittedAt = toDate(anamnesiDoc.data().submittedAt);
            if (submittedAt && submittedAt > toDate(lastViewed)) {
              newAnamnesi.push({
                type: 'new_anamnesi',
                clientId: clientDoc.id,
                clientName: clientDoc.data().name || 'Cliente',
                description: 'Ha compilato l\'anamnesi iniziale',
                date: anamnesiDoc.data().submittedAt
              });
            }
          });
        }
        
        setActivityFeed(prev => [...prev.filter(i => i.type !== 'new_anamnesi'), ...newAnamnesi]);
      } catch (error) {
        console.error("Errore caricamento anamnesi:", error);
      }
    };
    
    loadAnamnesiActivity();

    // --- SCADENZE ---
    const clientsQuery = query(getTenantCollection(db, 'clients'));
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
    
    const calculateIncome = async () => {
      try {
        let income = 0;
        let renewals = 0;

        // Ottieni tutti i clienti
        const clientsSnapshot = await getDocs(getTenantCollection(db, 'clients'));
        
        for (const clientDoc of clientsSnapshot.docs) {
          const clientData = clientDoc.data();
          if (clientData.isOldClient) continue; // Salta clienti vecchi
          
          // Ottieni i pagamenti di questo cliente nel mese corrente
          const paymentsSnapshot = await getDocs(
            getTenantSubcollection(db, 'clients', clientDoc.id, 'payments')
          );
          
          for (const paymentDoc of paymentsSnapshot.docs) {
            const paymentData = paymentDoc.data();
            const paymentDate = toDate(paymentData.paymentDate);
            
            if (paymentDate && paymentDate >= currentMonthStart && !paymentData.isPast) {
              const paymentAmount = paymentData.amount || 0;

              // Verifica se il cliente ha pagamenti precedenti (è un rinnovo)
              const previousPayments = paymentsSnapshot.docs.filter(doc => {
                const prevDate = toDate(doc.data().paymentDate);
                return prevDate && prevDate < paymentDate;
              });

              if (previousPayments.length > 0) {
                // È un rinnovo
                renewals += paymentAmount;
              } else {
                // È un nuovo cliente
                income += paymentAmount;
              }
            }
          }
        }
        
        setMonthlyIncome(income);
        setMonthlyRenewals(renewals);
      } catch (error) {
        console.error("Errore calcolo income:", error);
      }
    };
    
    calculateIncome();
    // Ricalcola ogni minuto per aggiornamenti in tempo reale
    const interval = setInterval(calculateIncome, 60000);
    return () => clearInterval(interval);
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
        try {
          const dailyData = {};
          const monthlyData = {};
          const yearlyData = {};

          // Ottieni tutti i clienti
          const clientsSnapshot = await getDocs(getTenantCollection(db, 'clients'));
          
          for (const clientDoc of clientsSnapshot.docs) {
            const clientData = clientDoc.data();
            if (clientData.isOldClient) continue; // Salta clienti vecchi
            
            // Ottieni i pagamenti di questo cliente
            const paymentsSnapshot = await getDocs(
              getTenantSubcollection(db, 'clients', clientDoc.id, 'payments')
            );
            
            paymentsSnapshot.forEach(paymentDoc => {
              const paymentData = paymentDoc.data();
              const date = toDate(paymentData.paymentDate);
              
              if (date && !paymentData.isPast) {
                const amount = paymentData.amount || 0;

                const dayKey = date.toLocaleDateString('it-IT');
                dailyData[dayKey] = (dailyData[dayKey] || 0) + amount;

                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;

                const yearKey = date.getFullYear().toString();
                yearlyData[yearKey] = (yearlyData[yearKey] || 0) + amount;
              }
            });
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
      } else {
        const clientsQuery = query(getTenantCollection(db, 'clients'), orderBy('createdAt', 'asc'));
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
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
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
    <div className="min-h-screen overflow-x-hidden w-full">
      <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-6 mobile-safe-bottom">
        {/* HEADER PREMIUM CON SALUTO */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl mx-3 sm:mx-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                {branding.adminAreaName} - Benvenuto, {userName || 'Admin'} 👋
              </h1>
              <p className="text-xs sm:text-base text-slate-400">Ecco una panoramica della tua attività oggi</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/new-client')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nuovo Cliente</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileModal(true)}
                className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Settings size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  try {
                    await signOut(auth);
                    navigate('/login');
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="p-2.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* QUICK ACTIONS BAR */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mx-3 sm:mx-6"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/clients')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm font-medium text-slate-300 hover:text-white"
          >
            <Users size={16} className="sm:w-[18px] sm:h-[18px]"/>
            <span>Clienti</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/business-history')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm font-medium text-slate-300 hover:text-white"
          >
            <BarChart3 size={16} className="sm:w-[18px] sm:h-[18px]"/>
            <span>Storico</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/analytics')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm font-medium text-slate-300 hover:text-white"
          >
            <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]"/>
            <span>Analytics</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/calendar')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm font-medium text-slate-300 hover:text-white"
          >
            <Bell size={16} className="sm:w-[18px] sm:h-[18px]"/>
            <span>Calendario</span>
          </motion.button>
        </motion.div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mx-3 sm:mx-6">
        <div className="lg:col-span-2 space-y-3 sm:space-y-6">
          {/* STATISTICHE CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard 
              title="Incasso Mensile" 
              value={monthlyIncome} 
              icon={<DollarSign/>} 
              color="green"
              isCurrency={true}
              trend={12}
            />
            <StatCard 
              title="Rinnovi Mensili" 
              value={monthlyRenewals} 
              icon={<RefreshCw/>} 
              color="cyan"
              isCurrency={true}
              trend={8}
            />
            <StatCard 
              title="Clienti Attivi" 
              value={clientStats.active} 
              icon={<CheckCircle/>} 
              color="blue"
              trend={5}
            />
            <StatCard 
              title="Retention Rate" 
              value={retentionRate} 
              icon={<Target/>} 
              color="purple"
              isPercentage={true}
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 size={20}/> Andamento Business
              </h2>
              <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg">
                <button 
                  onClick={() => setChartDataType('revenue')} 
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    chartDataType === 'revenue' 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Fatturato
                </button>
                <button 
                  onClick={() => setChartDataType('clients')} 
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    chartDataType === 'clients' 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Clienti
                </button>
              </div>
            </div>
            <div className="mobile-chart-container">
              <Line data={chartDataConfig} options={chartOptions} />
            </div>
            <div className="flex justify-center mt-4">
              <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg">
                <button 
                  onClick={() => setChartTimeRange('daily')} 
                  className={`px-3 py-1 text-xs rounded-md transition ${
                    chartTimeRange === 'daily' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Giorno
                </button>
                <button 
                  onClick={() => setChartTimeRange('monthly')} 
                  className={`px-3 py-1 text-xs rounded-md transition ${
                    chartTimeRange === 'monthly' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Mese
                </button>
                <button 
                  onClick={() => setChartTimeRange('yearly')} 
                  className={`px-3 py-1 text-xs rounded-md transition ${
                    chartTimeRange === 'yearly' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Anno
                </button>
              </div>
            </div>
          </motion.div>

          {focusClient && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl p-5 border border-blue-500/30 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-white">
                <Target size={20}/> Focus del Giorno
              </h2>
              <p className="text-base font-bold text-blue-400 mb-1">{focusClient.name}</p>
              <p className="text-sm text-slate-300">
                Obiettivo: &quot;{focusClient.goal || 'Non specificato'}&quot;
              </p>
            </motion.div>
          )}
        </div>
        
        {/* ACTIVITY FEED */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-slate-700/50 shadow-xl"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
            <Bell size={20}/> Feed Attività
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {activityFeed.length > 0 ? activityFeed
                .sort((a, b) => toDate(b.date) - toDate(a.date))
                .slice(0, 20)
                .map(item => (
                  <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds || item.date}`} item={item} navigate={navigate} />
                )) 
                : (
                  <div className="text-center py-8">
                    <Bell size={32} className="mx-auto text-slate-600 mb-2"/>
                    <p className="text-sm text-slate-500">Nessuna attività recente</p>
                  </div>
                )
              }
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <User size={20} /> Profilo Admin
              </h3>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Inserisci il tuo nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Foto Profilo</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center overflow-hidden relative">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Anteprima" className="w-full h-full object-cover" />
                    ) : currentPhotoURL ? (
                      <img
                        src={currentPhotoURL}
                        alt="Foto profilo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn('Errore caricamento foto profilo:', currentPhotoURL);
                          // Ritenta dopo un breve delay
                          setTimeout(() => {
                            const img = e.target;
                            img.src = currentPhotoURL + '?retry=' + Date.now();
                            img.style.display = 'block';
                          }, 1000);
                        }}
                        onLoad={() => {
                          console.log('Foto profilo caricata correttamente:', currentPhotoURL);
                        }}
                      />
                    ) : null}
                    {(!photoPreview && !currentPhotoURL) && (userName ? (
                      <span className="text-lg font-semibold text-slate-100">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User size={20} className="text-slate-400" />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm cursor-pointer inline-block text-center"
                    >
                      Cambia Foto
                    </label>
                    {currentPhotoURL && (
                      <button
                        onClick={() => {
                          // Forza ricaricamento della foto profilo
                          const img = new Image();
                          img.onload = () => setCurrentPhotoURL(currentPhotoURL + '?t=' + Date.now());
                          img.src = currentPhotoURL;
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                      >
                        Ricarica Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  try {
                    const updateData = { displayName: userName };

                    // Se è stata selezionata una nuova foto, caricala
                    if (selectedPhotoFile) {
                      const photoURL = await uploadPhoto(selectedPhotoFile, auth.currentUser.uid, 'profile_photos', null, true);
                      updateData.photoURL = photoURL;
                    }

                    await updateProfile(auth.currentUser, updateData);

                    // Aggiorna il currentPhotoURL se è stata cambiata la foto
                    if (selectedPhotoFile && updateData.photoURL) {
                      setCurrentPhotoURL(updateData.photoURL + '?t=' + Date.now()); // Aggiungi timestamp per forzare refresh
                    }

                    // Reset stati
                    setSelectedPhotoFile(null);
                    setPhotoPreview(null);

                    setShowProfileModal(false);
                    alert('Profilo aggiornato con successo!');
                  } catch (error) {
                    console.error('Errore aggiornamento profilo:', error);
                    alert('Errore durante l\'aggiornamento del profilo. Riprova.');
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Salva
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}