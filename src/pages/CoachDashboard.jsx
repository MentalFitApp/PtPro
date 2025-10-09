import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, serverTimestamp, setDoc, query, orderBy } from 'firebase/firestore';
import { auth, db, toDate, calcolaStatoPercorso } from '../firebase';
import { signOut } from 'firebase/auth';
import { CheckCircle, Clock, Users, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

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

// Componente ClientItem
const ClientItem = ({ client, navigate, variants }) => {
  const stato = calcolaStatoPercorso(client.scadenza);
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