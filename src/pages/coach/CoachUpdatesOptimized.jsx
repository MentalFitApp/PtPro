// src/pages/coach/CoachUpdatesOptimized.jsx
// Ottimizzato con cache, batch processing e limits

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoc, setDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, toDate } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { CheckCircle, Clock, FileText, MessageSquare, ArrowLeft, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestoreSnapshot } from '../../hooks/useFirestoreOptimized';
import { useCachedQuery } from '../../hooks/useDataCache';
import { SkeletonList } from '../../components/ui/SkeletonLoader';

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

const LoadingSpinner = () => (
  <div className="min-h-screen flex justify-center items-center relative bg-slate-900">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ActivityItem = ({ item, navigate, variants }) => {
  const icons = {
    expiring: <Clock className="text-yellow-500" size={18}/>,
    new_check: <CheckCircle className="text-green-500" size={18}/>,
    new_anamnesi: <FileText className="text-blue-500" size={18}/>,
    new_message: <MessageSquare className="text-rose-500" size={18}/>,
  };
  const tabMap = { expiring: 'info', new_check: 'checks', new_anamnesi: 'anamnesi', new_message: 'chat' };

  return (
    <motion.button
      variants={variants}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(`/coach/client/${item.clientId}?tab=${tabMap[item.type]}`)}
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

export default function CoachUpdatesOptimized() {
  const navigate = useNavigate();
  const [lastViewed, setLastViewed] = useState(null);
  const [loadingLastViewed, setLoadingLastViewed] = useState(true);

  const COACH_UID = "l0RI8TzFjbNVoAdmcXNQkP9mWb12";
  const adminUIDs = ["QwWST9OVOlTOi5oheyCqfpXLOLg2", "AeZKjJYu5zMZ4mvffaGiqCBb0cF2", "3j0AXIRa4XdHq1ywCl4UBxJNsku2", COACH_UID];

  // Snapshot clienti con cache
  const { data: clients, loading: clientsLoading } = useFirestoreSnapshot(
    getTenantCollection(db, 'clients'),
    {
      cacheKey: 'coach-updates-clients',
      cacheTTL: 3 * 60 * 1000, // 3 minuti
      debounceMs: 300
    }
  );

  // Mappa clienti per nome (memoizzata)
  const clientMap = useMemo(() => {
    if (!clients) return {};
    return clients.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  }, [clients]);

  // Fetch lastViewed con cache
  useEffect(() => {
    const fetchLastViewed = async () => {
      try {
        const lastViewedRef = getTenantDoc(db, 'app-data', 'lastViewed');
        const docSnap = await getDoc(lastViewedRef);
        const lastViewedTime = docSnap.exists() ? docSnap.data().timestamp : null;
        setLastViewed(lastViewedTime);
        
        // Aggiorna timestamp
        await setDoc(lastViewedRef, { timestamp: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Errore fetchLastViewed:", err);
      } finally {
        setLoadingLastViewed(false);
      }
    };
    fetchLastViewed();
  }, []);

  // Activity feed con batch processing ottimizzato
  const { data: activityFeed = [], loading: activityLoading } = useCachedQuery(
    'coach-updates-activity',
    async () => {
      if (!clients || !lastViewed) return [];

      const activities = [];
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const lastViewedDate = toDate(lastViewed);

      // 1. Aggiungi clienti in scadenza
      clients.forEach(client => {
        const scadenzaDate = toDate(client.scadenza);
        if (scadenzaDate && scadenzaDate <= sevenDaysLater && scadenzaDate >= now) {
          activities.push({
            id: `expiring_${client.id}`,
            type: 'expiring',
            clientId: client.id,
            clientName: client.name || 'N/D',
            description: `Scade il ${scadenzaDate.toLocaleDateString('it-IT')}`,
            date: client.scadenza,
          });
        }
      });

      // 2. Carica check e anamnesi in batch (max 15 clienti alla volta)
      const BATCH_SIZE = 15;
      const clientIds = clients.map(c => c.id);

      for (let i = 0; i < clientIds.length; i += BATCH_SIZE) {
        const batch = clientIds.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (clientId) => {
          try {
            const [checksSnap, anamnesiSnap] = await Promise.all([
              getDocs(query(
                getTenantSubcollection(db, 'clients', clientId, 'checks'),
                orderBy('createdAt', 'desc'),
                limit(5) // Solo ultimi 5 per cliente
              )),
              getDocs(query(
                getTenantSubcollection(db, 'clients', clientId, 'anamnesi'),
                orderBy('createdAt', 'desc'),
                limit(3) // Solo ultime 3 per cliente
              ))
            ]);

            const checks = checksSnap.docs.map(doc => ({
              id: doc.id,
              clientId,
              ...doc.data()
            })).filter(check => {
              const checkDate = toDate(check.createdAt);
              return lastViewedDate && checkDate && checkDate > lastViewedDate;
            });

            const anamnesi = anamnesiSnap.docs.map(doc => ({
              id: doc.id,
              clientId,
              ...doc.data()
            })).filter(anamnesi => {
              const anamnesiDate = toDate(anamnesi.createdAt);
              return lastViewedDate && anamnesiDate && anamnesiDate > lastViewedDate;
            });

            return { checks, anamnesi };
          } catch (err) {
            console.error(`Error loading data for client ${clientId}:`, err);
            return { checks: [], anamnesi: [] };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ checks, anamnesi }) => {
          checks.forEach(check => {
            activities.push({
              id: `check_${check.clientId}_${check.id}`,
              type: 'new_check',
              clientId: check.clientId,
              clientName: clientMap[check.clientId]?.name || 'N/D',
              description: `Nuovo check inviato`,
              date: check.createdAt,
            });
          });

          anamnesi.forEach(anamnesi => {
            activities.push({
              id: `anamnesi_${anamnesi.clientId}_${anamnesi.id}`,
              type: 'new_anamnesi',
              clientId: anamnesi.clientId,
              clientName: clientMap[anamnesi.clientId]?.name || 'N/D',
              description: `Nuova anamnesi inviata`,
              date: anamnesi.createdAt,
            });
          });
        });

        // Pausa breve tra batch per evitare overload
        if (i + BATCH_SIZE < clientIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Ordina per data decrescente
      activities.sort((a, b) => {
        const dateA = toDate(a.date);
        const dateB = toDate(b.date);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });

      // Limita a 50 attività totali
      return activities.slice(0, 50);
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minuti
      cacheTime: 10 * 60 * 1000, // 10 minuti
      enabled: !clientsLoading && !loadingLastViewed && !!lastViewed && !!clients
    }
  );

  // Conta nuovi aggiornamenti
  const newCount = useMemo(() => {
    return activityFeed.filter(item => item.type !== 'expiring').length;
  }, [activityFeed]);

  // Loading state
  if (clientsLoading || loadingLastViewed) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Indietro</span>
        </button>
        
        {newCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded-full">
            <Bell size={16} className="text-rose-400" />
            <span className="text-sm font-medium text-rose-300">{newCount} nuovi</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-6">Aggiornamenti</h1>

      {/* Activity Feed */}
      <motion.div 
        className="space-y-2"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        initial="hidden"
        animate="visible"
      >
        {activityLoading ? (
          <SkeletonList count={8} />
        ) : activityFeed.length > 0 ? (
          <AnimatePresence>
            {activityFeed.map(item => (
              <ActivityItem 
                key={item.id} 
                item={item} 
                navigate={navigate}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Nessun aggiornamento al momento</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
