import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, toDate, calcolaStatoPercorso } from '../firebase';
import { Users, ArrowLeft, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

const ClientItem = ({ client, navigate, hasAnamnesi, variants }) => {
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
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-200">{client.name}</p>
          <FileText size={16} className={hasAnamnesi ? 'text-green-500' : 'text-gray-500'} />
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[stato] || styles.na}`}>
          {labels[stato] || 'N/D'}
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1">{client.email || 'N/D'}</p>
    </motion.div>
  );
};

export default function CoachClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anamnesiStatus, setAnamnesiStatus] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), async (snap) => {
      try {
        const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const anamnesiStatusTemp = {};
        for (const client of clientList) {
          const anamnesiRef = doc(db, `clients/${client.id}/anamnesi`, 'initial');
          const anamnesiDoc = await getDoc(anamnesiRef);
          anamnesiStatusTemp[client.id] = anamnesiDoc.exists();
        }
        setAnamnesiStatus(anamnesiStatusTemp);
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
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Users size={20} /> Clienti</h2>
          <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
            <AnimatePresence>
              {clients.length > 0 ? (
                clients.map(client => (
                  <ClientItem
                    key={client.id}
                    client={client}
                    navigate={navigate}
                    hasAnamnesi={anamnesiStatus[client.id]}
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