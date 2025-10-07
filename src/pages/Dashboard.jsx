import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, collectionGroup, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
// --- 1. NUOVE ICONE E GRAFICI ---
import { 
  DollarSign, CheckCircle, RefreshCw, BarChart3, Bell, Target, 
  BookOpen, Plus, Clock, FileText, TrendingUp, User, Users
} from "lucide-react";
import { 
  AreaChart, Area, Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// --- HELPERS (invariati nella logica) ---
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

// --- 2. COMPONENTI UI AGGIORNATI ---

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
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val/1000}k`}/>
          <Tooltip content={<CustomTooltip />}/>
          <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
          <Tooltip content={<CustomTooltip />}/>
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
};

const QuickNotes = () => {
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const notesRef = doc(db, 'app-data', 'quickNotes');

    useEffect(() => {
        const getNotes = async () => {
            const docSnap = await getDoc(notesRef);
            if (docSnap.exists()) {
                setNotes(docSnap.data().content);
            }
        };
        getNotes();
    }, []);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (notes === undefined || notes === null) return;
            setIsSaving(true);
            try {
                await setDoc(notesRef, { content: notes, lastUpdated: serverTimestamp() });
            } catch (error) {
                console.error("Error saving notes:", error);
            } finally {
                setTimeout(() => setIsSaving(false), 1000);
            }
        }, 1500); 

        return () => clearTimeout(handler);
    }, [notes]);

    return (
        <div className="bg-zinc-950/60 backdrop-blur-xl p-4 rounded-xl gradient-border h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-200"><BookOpen size={18}/> Appunti Rapidi</h2>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-full bg-transparent text-sm text-slate-400 outline-none resize-none"
                placeholder="Scrivi qui le tue idee o cose da fare..."
            />
            <p className="text-xs text-right text-slate-500 mt-2 h-4">
                {isSaving && 'Salvataggio...'}
            </p>
        </div>
    );
};

// --- 3. IL COMPONENTE DASHBOARD FINALE ---

export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [allChecks, setAllChecks] = useState([]);
  const [allAnamnesis, setAllAnamnesis] = useState([]);
  const [chartDataType, setChartDataType] = useState('revenue');
  const [chartTimeRange, setChartTimeRange] = useState('yearly');
  const clientNameMap = useMemo(() => clients.reduce((acc, client) => ({ ...acc, [client.id]: client.name }), {}), [clients]);

  useEffect(() => {
    const unsubClients = onSnapshot(collection(db, "clients"), snap => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPayments = onSnapshot(collectionGroup(db, 'payments'), snap => setAllPayments(snap.docs.map(doc => ({ ...doc.data(), clientId: doc.ref.path.split('/')[1] }))));
    const unsubChecks = onSnapshot(collectionGroup(db, 'checks'), snap => setAllChecks(snap.docs.map(doc => ({ ...doc.data(), clientId: doc.ref.path.split('/')[1] }))));
    const unsubAnamnesis = onSnapshot(collectionGroup(db, 'anamnesi'), snap => setAllAnamnesis(snap.docs.map(doc => ({ ...doc.data(), clientId: doc.ref.path.split('/')[1] }))));
    return () => { unsubClients(); unsubPayments(); unsubChecks(); unsubAnamnesis(); };
  }, []);

  const { clientStats, monthlyIncome, activityFeed, chartData, focusClient, retentionRate } = useMemo(() => {
    const now = new Date();
    const validClientIds = new Set(clients.map(c => c.id));
    const validPayments = allPayments.filter(p => validClientIds.has(p.clientId));

    const activeClients = clients.filter(c => !toDate(c.scadenza) || toDate(c.scadenza) >= now).length;

    let chartDataPoints;
    if (chartTimeRange === 'yearly') {
        const months = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
          return { name: d.toLocaleString('it-IT', { month: 'short' }), revenue: 0, clients: 0 };
        });
        validPayments.forEach(p => {
          const paymentDate = toDate(p.paymentDate);
          if(paymentDate){
            const diffMonths = (now.getFullYear() - paymentDate.getFullYear()) * 12 + (now.getMonth() - paymentDate.getMonth());
            if (diffMonths >= 0 && diffMonths < 12) months[11 - diffMonths].revenue += p.amount;
          }
        });
        clients.forEach(c => {
          const created = toDate(c.createdAt);
          if(created){
            const diffMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
            if (diffMonths >= 0 && diffMonths < 12) months[11 - diffMonths].clients++;
          }
        });
        chartDataPoints = months.map(m => ({ name: m.name, value: m[chartDataType] }));
    } else { // monthly
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, revenue: 0, clients: 0 }));
        validPayments.forEach(p => {
          const paymentDate = toDate(p.paymentDate);
          if (paymentDate && paymentDate.getFullYear() === now.getFullYear() && paymentDate.getMonth() === now.getMonth()) days[paymentDate.getDate() - 1].revenue += p.amount;
        });
        clients.forEach(c => {
          const created = toDate(c.createdAt);
          if (created && created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()) days[created.getDate() - 1].clients++;
        });
        chartDataPoints = days.map(d => ({ name: d.name, value: d[chartDataType] }));
    }
    
    const expiringNotifs = clients.filter(c => { const end = toDate(c.scadenza); if (!end) return false; const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24)); return diffDays >= 0 && diffDays <= 15; }).map(c => ({ type: 'expiring', date: c.scadenza, clientId: c.id, description: `Scade tra ${Math.ceil((toDate(c.scadenza) - now) / (1000 * 60 * 60 * 24))} giorni` }));
    const checkNotifs = allChecks.map(c => ({ type: 'new_check', date: c.createdAt, clientId: c.clientId, description: `Ha inviato un nuovo check` }));
    const anamnesiNotifs = allAnamnesis.map(a => ({ type: 'new_anamnesi', date: a.createdAt, clientId: a.clientId, description: `Ha compilato l'anamnesi` }));
    const feed = [...expiringNotifs, ...checkNotifs, ...anamnesiNotifs].sort((a,b) => (toDate(b.date) || 0) - (toDate(a.date) || 0)).map(item => ({...item, clientName: clientNameMap[item.clientId]})).filter(item => item.clientName);
    
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const clientsActiveLastMonth = new Set(clients.filter(c => toDate(c.scadenza) > lastMonthStart).map(c => c.id));
    const clientsActiveThisMonth = new Set(clients.filter(c => toDate(c.scadenza) > thisMonthStart).map(c => c.id));
    const retained = [...clientsActiveLastMonth].filter(id => clientsActiveThisMonth.has(id)).length;
    const retention = clientsActiveLastMonth.size > 0 ? Math.round((retained / clientsActiveLastMonth.size) * 100) : 100;
    
    const activeClientsList = clients.filter(c => !toDate(c.scadenza) || toDate(c.scadenza) >= now);
    const focusClient = activeClientsList.length > 0 ? activeClientsList[new Date().getDate() % activeClientsList.length] : null;
    const focusClientGoal = allAnamnesis.find(a => a.clientId === focusClient?.id)?.mainGoal;

    return {
      clientStats: { total: clients.length, active: activeClients },
      monthlyIncome: validPayments.filter(p => toDate(p.paymentDate)?.getMonth() === now.getMonth() && toDate(p.paymentDate)?.getFullYear() === now.getFullYear()).reduce((sum, p) => sum + p.amount, 0),
      activityFeed: feed,
      chartData: chartDataPoints,
      focusClient: focusClient ? { ...focusClient, goal: focusClientGoal } : null,
      retentionRate: retention,
    };
  }, [clients, allPayments, allChecks, allAnamnesis, clientNameMap, chartDataType, chartTimeRange]);
  
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div className="w-full" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8" variants={itemVariants}>
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Command Center</h1>
          <p className="text-slate-400 mt-1">La tua panoramica di business in tempo reale.</p>
        </div>
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
