import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, collectionGroup, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
// --- 1. NUOVE ICONE DA LUCIDE-REACT ---
import { UserPlus, FileText, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function toDate(x) {
  if (!x) return null;
  if (typeof x?.toDate === 'function') return x.toDate();
  const d = new Date(x);
  return isNaN(d) ? null : d;
}

// --- 2. COMPONENTE COLONNA CON STILI AGGIORNATI ---
const UpdateColumn = ({ title, icon, items, navigate, tab, onDismiss }) => (
  <motion.div 
    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
    className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-4 flex-1 min-w-[280px]"
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
                onClick={() => navigate(`/client/${item.clientId}?tab=${tab}`)}
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

export default function Updates() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [newChecks, setNewChecks] = useState([]);
  const [newAnamnesis, setNewAnamnesis] = useState([]);
  const [dismissedItems, setDismissedItems] = useState(() => {
    // Carica gli ID archiviati dal sessionStorage all'avvio
    const saved = sessionStorage.getItem('dismissedUpdates');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Salva gli ID archiviati nel sessionStorage ogni volta che cambiano
    sessionStorage.setItem('dismissedUpdates', JSON.stringify(dismissedItems));
  }, [dismissedItems]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const clientNameMap = useMemo(() => {
    return clients.reduce((acc, client) => ({ ...acc, [client.id]: client.name }), {});
  }, [clients]);

  useEffect(() => {
    if (Object.keys(clientNameMap).length === 0) return;

    const createListener = (collectionName, setState) => {
        const q = query(collectionGroup(db, collectionName), orderBy('createdAt', 'desc'), limit(30));
        return onSnapshot(q, (snap) => {
            const items = snap.docs.map(doc => {
                const clientId = doc.ref.path.split('/')[1];
                return { id: doc.id, clientId, clientName: clientNameMap[clientId], date: doc.data().createdAt };
            }).filter(item => item.clientName);
            setState(items.slice(0, 10));
        });
    };

    const unsubChecks = createListener('checks', setNewChecks);
    const unsubAnamnesis = createListener('anamnesi', setNewAnamnesis);

    return () => {
      unsubChecks();
      unsubAnamnesis();
    };
  }, [clientNameMap]);
  
  const newClients = useMemo(() => {
      return [...clients]
        .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0))
        .slice(0, 10)
        .map(c => ({ id: c.id, clientId: c.id, clientName: c.name, date: c.createdAt }));
  }, [clients]);

  const handleDismiss = (itemId) => {
    setDismissedItems(prev => [...prev, itemId]);
  };
  
  const filteredNewClients = newClients.filter(item => !dismissedItems.includes(item.id));
  const filteredNewChecks = newChecks.filter(item => !dismissedItems.includes(item.id));
  const filteredNewAnamnesis = newAnamnesis.filter(item => !dismissedItems.includes(item.id));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  return (
    <div className="w-full">
      <motion.h1 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold mb-6 text-slate-50"
      >
        Ultimi Aggiornamenti
      </motion.h1>
      <motion.div 
        className="flex flex-col md:flex-row gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <UpdateColumn title="Nuovi Clienti" icon={<UserPlus className="text-rose-400" />} items={filteredNewClients} navigate={navigate} tab="anamnesi" onDismiss={handleDismiss} />
        <UpdateColumn title="Nuovi Check" icon={<CheckSquare className="text-emerald-400" />} items={filteredNewChecks} navigate={navigate} tab="checks" onDismiss={handleDismiss} />
        <UpdateColumn title="Nuove Anamnesi" icon={<FileText className="text-amber-400" />} items={filteredNewAnamnesis} navigate={navigate} tab="anamnesi" onDismiss={handleDismiss} />
      </motion.div>
    </div>
  );
}
