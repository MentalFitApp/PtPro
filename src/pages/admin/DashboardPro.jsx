// src/pages/admin/DashboardPro.jsx
// Dashboard Pro - Design moderno con menu profilo stile HubFit
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, getDocs, doc, getDoc, query, orderBy, limit } from "firebase/firestore";
import { auth, db, toDate } from "../../firebase";
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantBranding } from '../../hooks/useTenantBranding';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { SkeletonCard, SkeletonList } from '../../components/ui/SkeletonLoader';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Calendar, 
  ChevronRight, LogOut, User, Bell, Search, Plus,
  Clock, AlertCircle, CheckCircle, Phone, ArrowUpRight,
  BarChart2, Activity, Target, Zap, Eye, EyeOff,
  Settings, CreditCard, Palette, FileText, ClipboardList,
  X, ChevronDown, Edit3, ChevronLeft, RefreshCw
} from "lucide-react";

// ============ COMPONENTI UI ============

// Big Number - Per metriche principali
const BigNumber = ({ value, label, icon: Icon, trend, trendValue, color = 'blue', onClick, toggleIcon }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/10 to-transparent rounded-2xl`} />
    <div className="relative p-4 sm:p-5">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-xl bg-${color}-500/20`}>
          <Icon size={18} className={`text-${color}-400`} />
        </div>
        {toggleIcon && (
          <button className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
            {toggleIcon}
          </button>
        )}
        {trend && !toggleIcon && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            trendValue?.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {trendValue?.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs sm:text-sm text-slate-400">{label}</p>
    </div>
  </motion.div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, label, onClick, color = 'blue' }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-${color}-500/10 hover:bg-${color}-500/20 border border-${color}-500/20 transition-colors`}
  >
    <Icon size={20} className={`text-${color}-400`} />
    <span className="text-xs text-slate-300 font-medium">{label}</span>
  </motion.button>
);

// Timeline Item
const TimelineItem = ({ icon: Icon, title, subtitle, time, color = 'slate', isLast, onClick }) => (
  <div className={`flex gap-3 ${onClick ? 'cursor-pointer hover:bg-slate-800/30 -mx-2 px-2 py-1 rounded-lg' : ''}`} onClick={onClick}>
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
        <Icon size={14} className={`text-${color}-400`} />
      </div>
      {!isLast && <div className="w-px h-full bg-slate-700/50 my-1" />}
    </div>
    <div className="pb-4 min-w-0">
      <p className="text-sm text-white font-medium truncate">{title}</p>
      <p className="text-xs text-slate-400 truncate">{subtitle}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{time}</p>
    </div>
  </div>
);

// Client Row
const ClientRow = ({ client, onClick, subtitle }) => {
  const scadenza = toDate(client.scadenza);
  const isExpiring = scadenza && (scadenza - new Date()) / (1000 * 60 * 60 * 24) < 7 && scadenza > new Date();
  const isExpired = scadenza && scadenza < new Date();
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {client.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{client.name}</p>
        <p className="text-xs text-slate-400 truncate">{subtitle || client.email}</p>
      </div>
      {isExpired && (
        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-medium">
          Scaduto
        </span>
      )}
      {isExpiring && !isExpired && (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium">
          Scade presto
        </span>
      )}
      <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
    </motion.div>
  );
};

// Alert Banner
const AlertBanner = ({ icon: Icon, title, subtitle, color = 'amber', action, actionLabel }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
    <div className={`p-2 rounded-lg bg-${color}-500/20 flex-shrink-0`}>
      <Icon size={16} className={`text-${color}-400`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium text-${color}-300`}>{title}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
    {action && (
      <button onClick={action} className={`text-xs text-${color}-400 hover:underline flex-shrink-0`}>
        {actionLabel} →
      </button>
    )}
  </div>
);

// ============ TABS CONTENT TYPE ============
const TAB_TYPES = {
  CLIENTS: 'clients',
  SCADENZE: 'scadenze',
  CHIAMATE: 'chiamate',
  ANAMNESI: 'anamnesi',
  CHECKS: 'checks'
};

// ============ TIME RANGE FILTER ============
const TIME_RANGES = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
};

// ============ DASHBOARD PRINCIPALE ============

export default function DashboardPro() {
  const navigate = useNavigate();
  const { branding } = useTenantBranding();
  const { formatWeight } = useUserPreferences();
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [showRevenue, setShowRevenue] = useState(true);
  const [callRequests, setCallRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeTab, setActiveTab] = useState(TAB_TYPES.CLIENTS);
  const [recentAnamnesi, setRecentAnamnesi] = useState([]);
  const [recentChecks, setRecentChecks] = useState([]);
  const [revenueTimeRange, setRevenueTimeRange] = useState(TIME_RANGES.MONTH);
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [showRenewalsOnly, setShowRenewalsOnly] = useState(false);
  
  // Document title dinamico
  useDocumentTitle('Dashboard');

  // Auth check
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'coach') {
      signOut(auth).then(() => navigate('/login'));
    }
  }, [navigate]);

  // Load user profile
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email || '');
        const userDocRef = getTenantDoc(db, 'users', user.uid);
        onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserName(doc.data().displayName || user.displayName || 'Admin');
            setUserPhoto(doc.data().photoURL || user.photoURL);
          } else {
            setUserName(user.displayName || user.email?.split('@')[0] || 'Admin');
            setUserPhoto(user.photoURL);
          }
        });
      }
    });
    return () => unsub();
  }, []);

  // Load clients
  useEffect(() => {
    const unsub = onSnapshot(getTenantCollection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // OPTIMIZED: Load all dashboard data in parallel
  useEffect(() => {
    let isMounted = true;
    
    const loadAllDashboardData = async () => {
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        
        // Prepare all promises for parallel execution
        const allPromises = clientsSnap.docs.map(async (clientDoc) => {
          const clientId = clientDoc.id;
          const data = clientDoc.data();
          const clientName = data.name || 'Cliente';
          const isOldClient = data.isOldClient === true;
          
          const result = {
            payments: [],
            callRequests: [],
            upcomingCalls: [],
            anamnesi: [],
            checks: []
          };
          
          try {
            // Load payments, rates, calls, anamnesi, checks in parallel for each client
            const [paymentsSnap, ratesSnap, callsSnap, anamnesiSnap, checksSnap] = await Promise.all([
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'payments')).catch(() => ({ docs: [] })),
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'rates')).catch(() => ({ docs: [] })),
              getDocs(getTenantSubcollection(db, 'clients', clientId, 'calls')).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', clientId, 'anamnesi'), orderBy('createdAt', 'desc'), limit(1))).catch(() => ({ docs: [] })),
              getDocs(query(getTenantSubcollection(db, 'clients', clientId, 'checks'), orderBy('createdAt', 'desc'), limit(2))).catch(() => ({ docs: [] }))
            ]);
            
            // Process payments from subcollection
            paymentsSnap.docs.forEach(payDoc => {
              const payData = payDoc.data();
              const isRenewal = payData.isRenewal === true;
              if (isOldClient && !isRenewal) return;
              
              const payDate = toDate(payData.paymentDate || payData.date || payData.createdAt);
              if (payDate) {
                result.payments.push({
                  id: payDoc.id,
                  clientId,
                  clientName,
                  amount: parseFloat(payData.amount) || 0,
                  date: payDate.toISOString(),
                  source: 'subcollection',
                  isRenewal
                });
              }
            });
            
            // Process rates
            ratesSnap.docs.forEach(rateDoc => {
              const rateData = rateDoc.data();
              if (!rateData.paid || !rateData.paidDate) return;
              
              const paidDate = rateData.paidDate?.toDate ? rateData.paidDate.toDate() : toDate(rateData.paidDate);
              if (paidDate) {
                result.payments.push({
                  id: `subcol-rate-${clientId}-${rateDoc.id}`,
                  clientId,
                  clientName,
                  amount: parseFloat(rateData.amount) || 0,
                  date: paidDate.toISOString(),
                  source: 'rates-subcollection',
                  isRenewal: rateData.isRenewal === true,
                  isRate: true
                });
              }
            });
            
            // Process legacy rates from client doc
            if (!isOldClient) {
              (data.rate || []).forEach(rate => {
                if (rate.paid && rate.paidDate) {
                  const rateDate = toDate(rate.paidDate);
                  if (rateDate) {
                    result.payments.push({
                      id: `rate-${clientId}-${rate.paidDate}`,
                      clientId,
                      clientName,
                      amount: parseFloat(rate.amount) || 0,
                      date: rateDate.toISOString(),
                      source: 'rate',
                      isRenewal: false
                    });
                  }
                }
              });
            }
            
            // Process calls
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            callsSnap.docs.forEach(callDoc => {
              const callData = callDoc.data();
              if (callDoc.id === 'request' && callData?.status === 'pending') {
                result.callRequests.push({
                  clientId,
                  clientName,
                  ...callData
                });
              }
              if (callDoc.id === 'next' && callData?.scheduledAt) {
                const scheduledDate = toDate(callData.scheduledAt);
                if (scheduledDate && scheduledDate >= now && scheduledDate <= nextWeek) {
                  result.upcomingCalls.push({
                    clientId,
                    clientName,
                    scheduledAt: scheduledDate,
                    ...callData
                  });
                }
              }
            });
            
            // Process anamnesi
            anamnesiSnap.docs.forEach(doc => {
              result.anamnesi.push({
                id: doc.id,
                clientId,
                clientName,
                ...doc.data()
              });
            });
            
            // Process checks
            checksSnap.docs.forEach(doc => {
              result.checks.push({
                id: doc.id,
                clientId,
                clientName,
                ...doc.data()
              });
            });
          } catch (e) {
            // Silently fail for individual clients
          }
          
          return result;
        });
        
        // Wait for all clients to be processed
        const results = await Promise.all(allPromises);
        
        if (!isMounted) return;
        
        // Aggregate results
        const allPayments = [];
        const allCallRequests = [];
        const allUpcomingCalls = [];
        const allAnamnesi = [];
        const allChecks = [];
        
        results.forEach(r => {
          allPayments.push(...r.payments);
          allCallRequests.push(...r.callRequests);
          allUpcomingCalls.push(...r.upcomingCalls);
          allAnamnesi.push(...r.anamnesi);
          allChecks.push(...r.checks);
        });
        
        // Update states
        setPayments(allPayments);
        setCallRequests(allCallRequests);
        setUpcomingCalls(allUpcomingCalls.sort((a, b) => a.scheduledAt - b.scheduledAt));
        setRecentAnamnesi(
          allAnamnesi
            .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0))
            .slice(0, 10)
        );
        setRecentChecks(
          allChecks
            .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0))
            .slice(0, 10)
        );
      } catch (error) {
        console.error('Dashboard data load error:', error);
      }
    };
    
    loadAllDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadAllDashboardData, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [clients.length]); // Re-run when clients change

  // Computed metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentYearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const activeClients = clients.filter(c => !c.isOldClient && !c.archiviato);
    
    // Scadenze: prossimi 15 giorni
    const expiringClients = activeClients.filter(c => {
      const exp = toDate(c.scadenza);
      if (!exp) return false;
      const daysToExp = (exp - now) / (1000 * 60 * 60 * 24);
      return daysToExp <= 15 && daysToExp > -7; // Include anche scaduti da max 7 giorni
    }).sort((a, b) => toDate(a.scadenza) - toDate(b.scadenza));
    
    // Calcola periodo per incasso basato su revenueTimeRange
    let periodStart, periodEnd, periodLabel;
    switch (revenueTimeRange) {
      case TIME_RANGES.WEEK:
        // Settimana corrente: da lunedì a oggi
        periodStart = currentWeekStart;
        periodEnd = new Date(currentWeekStart);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        periodLabel = 'Settimana';
        break;
      case TIME_RANGES.YEAR:
        // Anno corrente: dal 1 gennaio al 31 dicembre
        periodStart = currentYearStart;
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        periodLabel = 'Anno';
        break;
      case TIME_RANGES.MONTH:
      default:
        // Mese corrente: dal 1 all'ultimo giorno del mese
        periodStart = currentMonthStart;
        periodEnd = currentMonthEnd;
        periodLabel = 'Mese';
        break;
    }
    
    // Incasso nel periodo selezionato
    const periodPayments = payments.filter(p => {
      const d = new Date(p.date);
      return d >= periodStart && d <= periodEnd;
    });
    const periodRevenue = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Calcola rinnovi
    // PRIORITÀ: usa il flag isRenewal se presente
    // Le rate (isRate: true) NON sono rinnovi a meno che non abbiano isRenewal: true
    // Altrimenti: se non è una rata e il cliente ha più di un pagamento "principale", conta come rinnovo
    const paymentsByClient = {};
    payments.forEach(p => {
      if (!paymentsByClient[p.clientId]) paymentsByClient[p.clientId] = [];
      paymentsByClient[p.clientId].push(p);
    });
    
    let renewalsRevenue = 0;
    periodPayments.forEach(p => {
      // PRIORITÀ: usa il flag isRenewal se esplicitamente presente
      if (p.isRenewal === true) {
        renewalsRevenue += p.amount || 0;
        return;
      }
      
      // Le rate NON sono rinnovi a meno che non abbiano isRenewal: true (già gestito sopra)
      // Le rate fanno parte del primo abbonamento rateizzato
      if (p.isRate === true || p.source === 'rate' || p.source === 'rates-subcollection') {
        // È una rata, non conta come rinnovo se non ha isRenewal
        return;
      }
      
      // Fallback per pagamenti "principali" (non rate): controlla se non è il primo pagamento
      const clientPayments = paymentsByClient[p.clientId] || [];
      // Considera solo i pagamenti principali (non rate) per determinare se è il primo
      const mainPayments = clientPayments.filter(pay => 
        !pay.isRate && pay.source !== 'rate' && pay.source !== 'rates-subcollection'
      );
      const sortedPayments = mainPayments.sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstPaymentDate = sortedPayments[0]?.date;
      const currentPaymentDate = new Date(p.date).toISOString();
      
      // Se non è il primo pagamento principale del cliente, è un rinnovo
      if (firstPaymentDate && currentPaymentDate !== new Date(firstPaymentDate).toISOString()) {
        renewalsRevenue += p.amount || 0;
      }
    });
    
    const newClientsThisMonth = clients.filter(c => {
      const start = toDate(c.startDate) || toDate(c.createdAt);
      return start && start >= currentMonthStart;
    });

    const retention = activeClients.length > 0 ? Math.round((activeClients.filter(c => {
      const start = toDate(c.startDate);
      return start && start < thirtyDaysAgo;
    }).length / activeClients.length) * 100) : 0;

    return {
      totalClients: activeClients.length,
      expiringCount: expiringClients.filter(c => (toDate(c.scadenza) - now) / (1000 * 60 * 60 * 24) > 0).length,
      expiredCount: expiringClients.filter(c => toDate(c.scadenza) < now).length,
      expiringClients,
      periodRevenue: periodRevenue - renewalsRevenue, // Incasso ESCLUSI i rinnovi
      renewalsRevenue,
      periodLabel,
      newClients: newClientsThisMonth.length,
      retention
    };
  }, [clients, payments, revenueTimeRange]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities = [];
    
    // New clients - ordina per createdAt e prendi i più recenti
    const sortedClients = [...clients]
      .filter(c => toDate(c.createdAt))
      .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
      .slice(0, 10);
    
    sortedClients.forEach(c => {
      const date = toDate(c.createdAt);
      if (date) {
        activities.push({
          type: 'client',
          icon: User,
          title: `${c.name} registrato`,
          subtitle: 'Nuovo cliente',
          time: date,
          color: 'blue',
          onClick: () => navigate(`/client/${c.id}`)
        });
      }
    });
    
    // Payments - ordina per data e prendi i più recenti
    const sortedPayments = [...payments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    
    sortedPayments.forEach(p => {
      const date = new Date(p.date);
      
      // Determina il tipo di attività
      let subtitle = 'Pagamento';
      let color = 'emerald';
      
      if (p.isRenewal) {
        if (p.isRate) {
          subtitle = 'Rata rinnovo pagata';
          color = 'cyan';
        } else {
          subtitle = 'Rinnovo';
          color = 'cyan';
        }
      } else if (p.source === 'rate' || p.source === 'rates-subcollection' || p.isRate) {
        subtitle = 'Rata pagata';
        color = 'purple';
      }
      
      activities.push({
        type: 'payment',
        icon: DollarSign,
        title: `€${p.amount} da ${p.clientName}`,
        subtitle: subtitle,
        time: date,
        color: color
      });
    });
    
    return activities
      .sort((a, b) => b.time - a.time)
      .slice(0, 20)
      .map((a, idx) => ({
        ...a,
        id: `${a.type}-${a.timeRaw?.getTime() || idx}-${idx}`, // ID univoco per evitare warning chiavi duplicate
        timeRaw: a.time,
        time: a.time.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      }));
  }, [clients, payments, navigate]);

  // Filtered clients for search
  const filteredClients = useMemo(() => {
    if (!debouncedSearch) return clients.filter(c => !c.isOldClient).slice(0, 5);
    const q = debouncedSearch.toLowerCase();
    return clients.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [clients, debouncedSearch]);

  const handleLogout = () => signOut(auth).then(() => navigate('/login'));

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6">
          <div className="h-8 w-32 bg-slate-700/50 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonList count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6">
        
        {/* ============ TITLE ============ */}
        <h1 className="text-lg sm:text-xl font-bold text-white">Dashboard</h1>

        {/* ============ SEARCH BAR ============ */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca clienti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* ============ ALERTS ============ */}
        <div className="space-y-2">
          {metrics.expiredCount > 0 && (
            <AlertBanner
              icon={AlertCircle}
              title={`${metrics.expiredCount} client${metrics.expiredCount > 1 ? 'i' : 'e'} scadut${metrics.expiredCount > 1 ? 'i' : 'o'}`}
              subtitle="Richiede attenzione"
              color="rose"
              action={() => navigate('/clients?filter=expired')}
              actionLabel="Gestisci"
            />
          )}
          {metrics.expiringCount > 0 && (
            <AlertBanner
              icon={Clock}
              title={`${metrics.expiringCount} client${metrics.expiringCount > 1 ? 'i' : 'e'} in scadenza`}
              subtitle="Nei prossimi 15 giorni"
              color="amber"
              action={() => navigate('/clients?filter=expiring')}
              actionLabel="Gestisci"
            />
          )}
          {callRequests.length > 0 && (
            <AlertBanner
              icon={Phone}
              title={`${callRequests.length} richieste di chiamata`}
              subtitle={callRequests[0]?.clientName}
              color="cyan"
              action={() => navigate(`/client/${callRequests[0]?.clientId}`)}
              actionLabel="Rispondi"
            />
          )}
        </div>

        {/* ============ MAIN GRID ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* LEFT COLUMN - Metrics & Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* BIG METRICS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="relative">
                  {/* Time Range Filter + Hide Toggle */}
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    {[
                      { key: TIME_RANGES.WEEK, label: 'S' },
                      { key: TIME_RANGES.MONTH, label: 'M' },
                      { key: TIME_RANGES.YEAR, label: 'A' },
                    ].map(r => (
                      <button
                        key={r.key}
                        onClick={(e) => { e.stopPropagation(); setRevenueTimeRange(r.key); }}
                        className={`w-6 h-6 rounded-md text-[10px] font-bold transition-colors ${
                          revenueTimeRange === r.key
                            ? 'bg-emerald-500/30 text-emerald-400'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowRevenue(!showRevenue); }}
                      className="w-6 h-6 rounded-md bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
                    >
                      {showRevenue ? <Eye size={10} /> : <EyeOff size={10} />}
                    </button>
                  </div>
                  
                  {/* Revenue Card with Toggle */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${showRenewalsOnly ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`}>
                        {showRenewalsOnly ? <RefreshCw size={18} className="text-cyan-400" /> : <DollarSign size={18} className="text-emerald-400" />}
                      </div>
                    </div>
                    
                    {/* Value with arrows */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowRenewalsOnly(!showRenewalsOnly)}
                        className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <div className="flex-1 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                          {showRevenue 
                            ? `€${(showRenewalsOnly ? metrics.renewalsRevenue : metrics.periodRevenue).toLocaleString()}` 
                            : '€ •••'
                          }
                        </p>
                        <p className={`text-xs sm:text-sm ${showRenewalsOnly ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {showRenewalsOnly ? `Rinnovi ${metrics.periodLabel}` : `Incasso ${metrics.periodLabel}`}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => setShowRenewalsOnly(!showRenewalsOnly)}
                        className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    
                    {/* Indicator dots */}
                    <div className="flex justify-center gap-1.5 mt-3">
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${!showRenewalsOnly ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${showRenewalsOnly ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                <BigNumber
                  value={metrics.totalClients}
                  label="Clienti Attivi"
                  icon={Users}
                  trend={metrics.newClients > 0 ? `+${metrics.newClients}` : undefined}
                  trendValue={metrics.newClients > 0 ? `+${metrics.newClients}` : undefined}
                  color="blue"
                  onClick={() => navigate('/clients')}
                />
              </div>
            </div>

            {/* SECONDARY METRICS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">{metrics.newClients}</p>
                <p className="text-[10px] sm:text-xs text-slate-400">Nuovi questo mese</p>
              </div>
              <div 
                onClick={() => navigate('/clients?filter=expiring')}
                className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 text-center cursor-pointer hover:bg-slate-700/40 transition-colors"
              >
                <p className="text-xl sm:text-2xl font-bold text-amber-400">{metrics.expiringCount}</p>
                <p className="text-[10px] sm:text-xs text-slate-400">In scadenza</p>
              </div>
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-cyan-400">{metrics.retention}%</p>
                <p className="text-[10px] sm:text-xs text-slate-400">Retention</p>
              </div>
            </div>

            {/* TABBED CONTENT: Clients / Anamnesi / Checks */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              {/* Tabs Header */}
              <div className="flex items-center border-b border-slate-700/50 overflow-x-auto">
                {[
                  { key: TAB_TYPES.CLIENTS, label: 'Clienti', icon: Users },
                  { key: TAB_TYPES.SCADENZE, label: 'Scadenze', icon: Clock, badge: metrics.expiringCount + metrics.expiredCount },
                  { key: TAB_TYPES.CHIAMATE, label: 'Chiamate', icon: Phone, badge: upcomingCalls.length },
                  { key: TAB_TYPES.ANAMNESI, label: 'Anamnesi', icon: FileText },
                  { key: TAB_TYPES.CHECKS, label: 'Check-in', icon: ClipboardList },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.key 
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              <div className="divide-y divide-slate-700/30">
                {activeTab === TAB_TYPES.CLIENTS && (
                  <>
                    {filteredClients.length > 0 ? (
                      filteredClients.map(client => (
                        <ClientRow 
                          key={client.id} 
                          client={client} 
                          onClick={() => navigate(`/client/${client.id}`)}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        {searchQuery ? 'Nessun cliente trovato' : 'Nessun cliente'}
                      </div>
                    )}
                    <div className="p-3 bg-slate-900/30">
                      <button 
                        onClick={() => navigate('/clients')}
                        className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1"
                      >
                        Vedi tutti i clienti <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </>
                )}
                
                {activeTab === TAB_TYPES.SCADENZE && (
                  <>
                    {metrics.expiringClients.length > 0 ? (
                      metrics.expiringClients.slice(0, 8).map(client => {
                        const exp = toDate(client.scadenza);
                        const isExpired = exp && exp < new Date();
                        const daysLeft = exp ? Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                        return (
                          <ClientRow 
                            key={client.id} 
                            client={client}
                            subtitle={isExpired 
                              ? `Scaduto ${Math.abs(daysLeft)} giorni fa` 
                              : `Scade tra ${daysLeft} giorni - ${exp?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`
                            }
                            onClick={() => navigate(`/client/${client.id}`)}
                          />
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Nessuna scadenza imminente 🎉
                      </div>
                    )}
                    {metrics.expiringClients.length > 0 && (
                      <div className="p-3 bg-slate-900/30">
                        <button 
                          onClick={() => navigate('/clients?filter=expiring')}
                          className="w-full py-2 text-sm text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1"
                        >
                          Gestisci scadenze <ArrowUpRight size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === TAB_TYPES.CHIAMATE && (
                  <>
                    {upcomingCalls.length > 0 ? (
                      upcomingCalls.map((call, idx) => {
                        const scheduledDate = toDate(call.scheduledAt) || new Date();
                        const isToday = scheduledDate.toDateString() === new Date().toDateString();
                        const isTomorrow = scheduledDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                        const timeLabel = isToday ? 'Oggi' : isTomorrow ? 'Domani' : scheduledDate.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
                        
                        return (
                          <div 
                            key={idx}
                            onClick={() => navigate(`/client/${call.clientId}`)}
                            className="flex items-center gap-3 p-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isToday ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              <Phone size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{call.clientName}</p>
                              <p className="text-xs text-slate-400">
                                {timeLabel} alle {scheduledDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                call.callType === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                              }`}>
                                {call.callType === 'video' ? 'Video' : 'Tel'}
                              </span>
                              {isToday && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                                  OGGI
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        <Phone size={24} className="mx-auto mb-2 text-slate-600" />
                        Nessuna chiamata programmata
                      </div>
                    )}
                    <div className="p-3 bg-slate-900/30">
                      <button 
                        onClick={() => navigate('/calls-calendar')}
                        className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1"
                      >
                        Apri Calendario Chiamate <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </>
                )}
                
                {activeTab === TAB_TYPES.ANAMNESI && (
                  <>
                    {recentAnamnesi.length > 0 ? (
                      recentAnamnesi.slice(0, 5).map(item => (
                        <ClientRow 
                          key={item.id}
                          client={{ name: item.clientName, id: item.clientId }}
                          subtitle={`${toDate(item.createdAt)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) || ''} - ${item.type || 'Anamnesi'}`}
                          onClick={() => navigate(`/client/${item.clientId}?tab=anamnesi`)}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Nessuna anamnesi recente
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === TAB_TYPES.CHECKS && (
                  <>
                    {recentChecks.length > 0 ? (
                      recentChecks.slice(0, 5).map(item => (
                        <ClientRow 
                          key={item.id}
                          client={{ name: item.clientName, id: item.clientId }}
                          subtitle={`${toDate(item.createdAt)?.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) || ''} - ${item.weight ? formatWeight(item.weight) : 'Check-in'}`}
                          onClick={() => navigate(`/client/${item.clientId}?tab=checks`)}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Nessun check-in recente
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Actions & Activity */}
          <div className="space-y-4 sm:space-y-6">

            {/* UPCOMING CALLS */}
            {upcomingCalls.length > 0 && (
              <div className="bg-cyan-500/10 backdrop-blur-sm rounded-2xl border border-cyan-500/20 p-4">
                <h2 className="font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                  <Phone size={16} />
                  Chiamate questa settimana
                </h2>
                <div className="space-y-2">
                  {upcomingCalls.slice(0, 4).map((call, idx) => {
                    const scheduledDate = toDate(call.scheduledAt) || new Date();
                    const isToday = scheduledDate.toDateString() === new Date().toDateString();
                    return (
                      <div 
                        key={idx}
                        onClick={() => navigate(`/client/${call.clientId}`)}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 cursor-pointer hover:bg-slate-800/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isToday ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          <Phone size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{call.clientName}</p>
                          <p className="text-xs text-slate-400">
                            {isToday ? 'Oggi' : scheduledDate.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}
                            {' '}{scheduledDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          call.callType === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {call.callType === 'video' ? 'Video' : 'Tel'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                Azioni rapide
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <QuickAction icon={Plus} label="Nuovo Cliente" onClick={() => navigate('/new-client')} color="emerald" />
                <QuickAction icon={Calendar} label="Calendario" onClick={() => navigate('/calendar')} color="blue" />
                <QuickAction icon={BarChart2} label="Analytics" onClick={() => navigate('/analytics')} color="purple" />
              </div>
            </div>

            {/* ACTIVITY TIMELINE - Scrollabile */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={16} className="text-slate-400" />
                Attività recenti
                <span className="ml-auto text-xs text-slate-500">{recentActivity.length} eventi</span>
              </h2>
              <div className="max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                <div className="space-y-0">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((item, idx) => (
                      <TimelineItem
                        key={item.id || `activity-${idx}`}
                        icon={item.icon}
                        title={item.title}
                        subtitle={item.subtitle}
                        time={item.time}
                        color={item.color}
                        isLast={idx === recentActivity.length - 1}
                        onClick={item.onClick}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Nessuna attività recente</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
