import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, toDate, calcolaStatoPercorso } from '../firebase';
import { Users, ArrowLeft, FileText, Search, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

const ClientItem = ({ client, navigate, hasAnamnesi, lastCheck, variants }) => {
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
      onClick={() => navigate(`/coach/client/${client.id}`)} // Naviga a CoachClientDetail
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-200">{client.name}</p>
          <FileText size={16} className={hasAnamnesi ? 'text-green-500' : 'text-gray-500'} />
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[stato] || styles.na}`}>
          {labels[stato] || 'N/D'}
        </span>
      </div>
      <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Calendar size={14} /> Scadenza: {client.scadenza ? toDate(client.scadenza).toLocaleDateString('it-IT') : 'N/D'}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} /> Ultimo Check: {lastCheck ? toDate(lastCheck).toLocaleDateString('it-IT') : 'Nessuno'}
        </span>
      </div>
    </motion.div>
  );
};

export default function CoachClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anamnesiStatus, setAnamnesiStatus] = useState({});
  const [lastChecks, setLastChecks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), async (snap) => {
      try {
        const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const anamnesiStatusTemp = {};
        const lastChecksTemp = {};
        for (const client of clientList) {
          const anamnesiRef = doc(db, `clients/${client.id}/anamnesi`, 'initial');
          const anamnesiDoc = await getDoc(anamnesiRef);
          anamnesiStatusTemp[client.id] = anamnesiDoc.exists();

          const checksQuery = query(collection(db, `clients/${client.id}/checks`), orderBy('createdAt', 'desc'), limit(1));
          const checksSnap = await getDocs(checksQuery);
          lastChecksTemp[client.id] = checksSnap.docs[0]?.data().createdAt || null;
        }
        setAnamnesiStatus(anamnesiStatusTemp);
        setLastChecks(lastChecksTemp);
        setClients(clientList);
        setFilteredClients(clientList);
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

  // Filtro e ricerca
  useEffect(() => {
    let result = [...clients];
    if (searchQuery) {
      result = result.filter(client => 
        client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(client => calcolaStatoPercorso(client.scadenza) === statusFilter);
    }
    setFilteredClients(result);
  }, [searchQuery, statusFilter, clients]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (error) return <div className="min-h-screen bg-zinc-950 text-red-400 flex justify-center items-center">{error}</div>;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-8 relative">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.header variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-50 flex items-center gap-2">
            <Users size={28} /> Elenco Clienti
          </h1>
          <button
            onClick={() => navigate('/coach-dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Torna alla Dashboard</span>
          </button>
        </motion.header>
        <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18}/>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca per nome o email..."
                className="w-full bg-zinc-900/70 p-2 pl-10 rounded-lg border border-white/10 outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 text-sm sm:text-base"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 text-slate-200"
            >
              <option value="all">Tutti</option>
              <option value="attivo">Attivo</option>
              <option value="rinnovato">In Scadenza</option>
              <option value="non_rinnovato">Scaduto</option>
            </select>
          </div>
          <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
            <AnimatePresence>
              {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                  <ClientItem
                    key={client.id}
                    client={client}
                    navigate={navigate}
                    hasAnamnesi={anamnesiStatus[client.id]}
                    lastCheck={lastChecks[client.id]}
                    variants={itemVariants}
                  />
                ))
              ) : (
                <p className="text-slate-400 text-center p-4">Nessun cliente trovato.</p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}