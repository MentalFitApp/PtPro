// src/pages/shared/UpdatesOptimized.jsx
// Ottimizzato con cache, batch processing e virtualizzazione

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, toDate } from '../../firebase'
import { getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { getDocs, query, orderBy, limit } from 'firebase/firestore';
import { UserPlus, FileText, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestoreSnapshot } from '../../hooks/useFirestoreOptimized';
import { useCachedQuery } from '../../hooks/useDataCache';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';

// Componente colonna con stili aggiornati
const UpdateColumn = ({ title, icon, items, navigate, tab, onDismiss, role }) => {
  const getClientPath = (clientId) => {
    if (role === 'coach') return `/coach/client/${clientId}`;
    return `/admin/client/${clientId}`;
  };
  
  return (
    <motion.div 
      variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
      className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-4 flex-1 min-w-[280px]"
    >
      <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-200">
        {icon} {title}
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {items.length > 0 ? (
            items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => navigate(`${getClientPath(item.clientId)}?tab=${tab}`)}
                >
                  <p className="font-medium text-sm text-slate-200 group-hover:text-rose-400 transition-colors">{item.clientName}</p>
                  <p className="text-xs text-slate-400">
                    {toDate(item.date)?.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                  </p>
                </button>
                <button 
                  onClick={() => onDismiss(item.id)}
                  className="p-1.5 rounded-full text-slate-500 opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-white/10 hover:text-slate-200 transition-all"
                  title="Archivia notifica"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-slate-500 px-2 py-4 text-center">Nessun aggiornamento.</p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function UpdatesOptimized({ role: propRole }) {
  const navigate = useNavigate();
  const [dismissedItems, setDismissedItems] = useState(() => {
    const saved = sessionStorage.getItem('dismissedUpdates');
    return saved ? JSON.parse(saved) : [];
  });
  
  const role = propRole || sessionStorage.getItem('app_role') || 'admin';

  // Persisti dismissed items
  useEffect(() => {
    sessionStorage.setItem('dismissedUpdates', JSON.stringify(dismissedItems));
  }, [dismissedItems]);

  // Snapshot clienti con cache
  const { data: clients, loading: clientsLoading } = useFirestoreSnapshot(
    getTenantCollection(db, 'clients'),
    {
      cacheKey: 'updates-clients',
      cacheTTL: 3 * 60 * 1000, // 3 minuti
      debounceMs: 300
    }
  );

  // Mappa clienti per nome
  const clientNameMap = useMemo(() => {
    if (!clients) return {};
    return clients.reduce((acc, client) => ({ ...acc, [client.id]: client.name }), {});
  }, [clients]);

  // Carica check e anamnesi con batch processing
  const { data: updates = { newChecks: [], newAnamnesis: [] }, loading: updatesLoading } = useCachedQuery(
    'updates-data',
    async () => {
      if (!clients) return { newChecks: [], newAnamnesis: [] };

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newChecks = [];
      const newAnamnesis = [];
      const BATCH_SIZE = 15;

      for (let i = 0; i < clients.length; i += BATCH_SIZE) {
        const batch = clients.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (client) => {
          try {
            const [checksSnap, anamnesiSnap] = await Promise.all([
              getDocs(query(
                getTenantSubcollection(db, 'clients', client.id, 'checks'),
                orderBy('createdAt', 'desc'),
                limit(5) // Solo ultimi 5 per cliente
              )),
              getDocs(query(
                getTenantSubcollection(db, 'clients', client.id, 'anamnesi'),
                orderBy('createdAt', 'desc'),
                limit(3) // Solo ultime 3 per cliente
              ))
            ]);

            const checks = checksSnap.docs
              .map(doc => ({ id: doc.id, clientId: client.id, ...doc.data() }))
              .filter(check => {
                const checkDate = toDate(check.createdAt);
                return checkDate && checkDate >= sevenDaysAgo;
              });

            const anamnesi = anamnesiSnap.docs
              .map(doc => ({ id: doc.id, clientId: client.id, ...doc.data() }))
              .filter(anamnesi => {
                const anamnesiDate = toDate(anamnesi.createdAt);
                return anamnesiDate && anamnesiDate >= sevenDaysAgo;
              });

            return { checks, anamnesi };
          } catch (err) {
            console.error(`Error loading data for client ${client.id}:`, err);
            return { checks: [], anamnesi: [] };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ checks, anamnesi }) => {
          newChecks.push(...checks);
          newAnamnesis.push(...anamnesi);
        });

        // Pausa breve tra batch
        if (i + BATCH_SIZE < clients.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Ordina per data
      newChecks.sort((a, b) => {
        const dateA = toDate(a.createdAt);
        const dateB = toDate(b.createdAt);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });

      newAnamnesis.sort((a, b) => {
        const dateA = toDate(a.createdAt);
        const dateB = toDate(b.createdAt);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });

      return { 
        newChecks: newChecks.slice(0, 30), // Max 30
        newAnamnesis: newAnamnesis.slice(0, 20) // Max 20
      };
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minuti
      cacheTime: 10 * 60 * 1000, // 10 minuti
      enabled: !clientsLoading && !!clients
    }
  );

  // Filtra dismissed items
  const filteredNewChecks = useMemo(() => {
    return updates.newChecks
      .filter(c => !dismissedItems.includes(c.id))
      .map(c => ({
        id: c.id,
        clientId: c.clientId,
        clientName: clientNameMap[c.clientId] || 'N/D',
        date: c.createdAt
      }));
  }, [updates.newChecks, dismissedItems, clientNameMap]);

  const filteredNewAnamnesis = useMemo(() => {
    return updates.newAnamnesis
      .filter(a => !dismissedItems.includes(a.id))
      .map(a => ({
        id: a.id,
        clientId: a.clientId,
        clientName: clientNameMap[a.clientId] || 'N/D',
        date: a.createdAt
      }));
  }, [updates.newAnamnesis, dismissedItems, clientNameMap]);

  // Dismiss handler
  const handleDismiss = (id) => {
    setDismissedItems(prev => [...prev, id]);
  };

  // Loading state
  if (clientsLoading || updatesLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-20">
      <h1 className="text-2xl font-bold text-white mb-6">Aggiornamenti Recenti</h1>
      
      <motion.div
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <UpdateColumn
          title="Nuovi Check"
          icon={<CheckSquare className="text-emerald-400" size={20} />}
          items={filteredNewChecks}
          navigate={navigate}
          tab="checks"
          onDismiss={handleDismiss}
          role={role}
        />
        
        <UpdateColumn
          title="Nuove Anamnesi"
          icon={<FileText className="text-blue-400" size={20} />}
          items={filteredNewAnamnesis}
          navigate={navigate}
          tab="anamnesi"
          onDismiss={handleDismiss}
          role={role}
        />
      </motion.div>
    </div>
  );
}
