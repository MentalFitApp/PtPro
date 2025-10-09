import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectionGroup, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, toDate } from '../firebase';
import { FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

const AnamnesiItem = ({ item, navigate, variants }) => (
  <motion.div
    variants={variants}
    className="p-3 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 transition-colors"
    onClick={() => navigate(`/admin/anamnesi/${item.clientId}`)}
  >
    <div className="flex justify-between items-center">
      <p className="text-sm font-semibold text-slate-200">{item.clientName}</p>
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-900/80 text-blue-300 border border-blue-500/30">
        Inviata il {item.date?.toDate().toLocaleDateString('it-IT')}
      </span>
    </div>
    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
  </motion.div>
);

export default function CoachAnamnesi() {
  const navigate = useNavigate();
  const [anamnesiList, setAnamnesiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(anamnesiQuery, async (snap) => {
      try {
        const newAnamnesi = [];
        for (const doc of snap.docs) {
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
        setAnamnesiList(newAnamnesi.slice(0, 5)); // Limita a 5
        setLoading(false);
      } catch (err) {
        console.error("Errore nel fetch anamnesi:", err);
        setError("Errore nel caricamento delle anamnesi.");
        setLoading(false);
      }
    }, (err) => {
      console.error("Errore snapshot anamnesi:", err);
      setError("Errore nel caricamento delle anamnesi.");
      setLoading(false);
    });
    return () => unsubscribe();
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
            <FileText size={28} /> Anamnesi Inviate
          </h1>
          <button
            onClick={() => navigate('/coach-dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Torna alla Dashboard</span>
          </button>
        </motion.header>
        <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><FileText size={20} /> Ultime Anamnesi</h2>
          <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
            <AnimatePresence>
              {anamnesiList.length > 0 ? (
                anamnesiList.map(item => (
                  <AnamnesiItem key={`${item.type}-${item.clientId}-${item.date?.seconds}`} item={item} navigate={navigate} variants={itemVariants} />
                ))
              ) : (
                <p className="text-slate-400 text-center p-4">Nessuna anamnesi recente.</p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}