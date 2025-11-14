import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, toDate, auth } from '../firebase';
import { FileText, Calendar, ArrowLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
  </div>
);

export default function CoachAnamnesi() {
  const navigate = useNavigate();
  const [recentChecks, setRecentChecks] = useState([]);
  const [recentAnamnesi, setRecentAnamnesi] = useState([]);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    // Carica TUTTI i clienti — niente filtro su assignedCoaches!
    const q = query(collection(db, 'clients'));

    const unsub = onSnapshot(q, async (snap) => {
      const clientIds = snap.docs.map(d => d.id);
      if (clientIds.length === 0) {
        setRecentChecks([]);
        setRecentAnamnesi([]);
        setLoading(false);
        return;
      }

      // --- BATCH CHECKS ---
      const checkPromises = clientIds.map(async (clientId) => {
        const clientName = snap.docs.find(d => d.id === clientId).data().name || 'Cliente';
        const checksQuery = query(
          collection(db, 'clients', clientId, 'checks'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const checksSnap = await getDocs(checksQuery);
        return checksSnap.docs.map(checkDoc => {
          const data = checkDoc.data();
          return {
            clientId,
            clientName,
            date: data.createdAt,
            weight: data.weight,
            notes: data.notes
          };
        });
      });

      // --- BATCH ANAMNESI ---
      const anamnesiPromises = clientIds.map(async (clientId) => {
        const clientName = snap.docs.find(d => d.id === clientId).data().name || 'Cliente';
        const anamnesiRef = doc(db, 'clients', clientId, 'anamnesi', 'initial');
        const anamnesiSnap = await getDoc(anamnesiRef);
        if (anamnesiSnap.exists()) {
          const data = anamnesiSnap.data();
          return {
            clientId,
            clientName,
            date: data.submittedAt,
            goal: data.mainGoal
          };
        }
        return null;
      });

      try {
        const [allChecks, allAnamnesi] = await Promise.all([
          Promise.all(checkPromises),
          Promise.all(anamnesiPromises)
        ]);

        const flatChecks = allChecks.flat();
        const validAnamnesi = allAnamnesi.filter(Boolean);

        flatChecks.sort((a, b) => (b.date?.toMillis() || 0) - (a.date?.toMillis() || 0));
        validAnamnesi.sort((a, b) => (b.date?.toMillis() || 0) - (a.date?.toMillis() || 0));

        setRecentChecks(flatChecks.slice(0, 5));
        setRecentAnamnesi(validAnamnesi.slice(0, 5));
        setLoading(false);
      } catch (err) {
        console.error('Errore batch:', err);
        setLoading(false);
      }
    }, (err) => {
      console.error('Errore snapshot:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const formatDate = (ts) => toDate(ts)?.toLocaleDateString('it-IT') || 'N/D';

  // Pulsante svuota notifiche
  const handleClearNotifications = () => {
    setRecentChecks([]);
    setRecentAnamnesi([]);
    setNotification('Notifiche svuotate!');
    setTimeout(() => setNotification(''), 3000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-50">Anamnesi & Check</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/coach/clients')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"
          >
            <ArrowLeft size={16} /> Indietro
          </button>
          <button
            onClick={handleClearNotifications}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-400"
            title="Svuota notifiche"
          >
            <Trash2 size={16} /> Svuota notifiche
          </button>
        </div>
      </div>
      {notification && (
        <div className="mb-3 text-center text-sm font-medium text-rose-400">{notification}</div>
      )}

      {/* ULTIMI CHECK */}
      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-xl gradient-border p-4">
        <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-2 mb-3">
          <FileText size={18} /> Ultimi Check
        </h3>
        {recentChecks.length > 0 ? (
          <div className="space-y-2">
            {recentChecks.map((check) => (
              <motion.div
                key={`${check.clientId}-${check.date?.toMillis()}`}
                whileHover={{ scale: 1.02 }}
                className="p-2 bg-zinc-900/50 rounded-lg border border-white/10 cursor-pointer"
                onClick={() => navigate(`/coach/client/${check.clientId}`)}
              >
                <div className="flex justify-between text-xs">
                  <div>
                    <p className="font-medium text-white">{check.clientName}</p>
                    <p className="text-slate-400">{formatDate(check.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-400">{check.weight} kg</p>
                    {check.notes && <p className="text-xs text-slate-400 line-clamp-1">{check.notes}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 text-xs py-4">Nessun check</p>
        )}
      </div>

      {/* ULTIME ANAMNESI */}
      <div className="bg-zinc-950/60 backdrop-blur-xl rounded-xl gradient-border p-4">
        <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2 mb-3">
          <Calendar size={18} /> Nuove Anamnesi
        </h3>
        {recentAnamnesi.length > 0 ? (
          <div className="space-y-2">
            {recentAnamnesi.map((anamnesi) => (
              <motion.div
                key={anamnesi.clientId}
                whileHover={{ scale: 1.02 }}
                className="p-2 bg-zinc-900/50 rounded-lg border border-white/10 cursor-pointer"
                onClick={() => navigate(`/coach/client/${anamnesi.clientId}`)}
              >
                <div className="flex justify-between text-xs">
                  <div>
                    <p className="font-medium text-white">{anamnesi.clientName}</p>
                    <p className="text-slate-400">{formatDate(anamnesi.date)}</p>
                  </div>
                  <p className="text-amber-400 text-right line-clamp-1 max-w-[120px]">
                    {anamnesi.goal || 'Nessun obiettivo'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 text-xs py-4">Nessuna anamnesi</p>
        )}
      </div>
    </motion.div>
  );
}
