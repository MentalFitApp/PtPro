import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, collectionGroup, query, orderBy, onSnapshot, getDoc, doc, setDoc, where, serverTimestamp } from 'firebase/firestore';
import { db, toDate, calcolaStatoPercorso } from '../firebase';
import { CheckCircle, Clock, FileText, MessageSquare, ArrowLeft, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
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

export default function CoachUpdates() {
  const navigate = useNavigate();
  const [activityFeed, setActivityFeed] = useState([]);
  const [lastViewed, setLastViewed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const COACH_UID = "l0RI8TzFjbNVoAdmcXNQkP9mWb12";
  const adminUIDs = ["QwWST9OVOlTOi5oheyCqfpXLOLg2", "AeZKjJYu5zMZ4mvffaGiqCBb0cF2", "3j0AXIRa4XdHq1ywCl4UBxJNsku2", COACH_UID];

  // Fetch lastViewed
  useEffect(() => {
    const lastViewedRef = doc(db, 'app-data', 'lastViewed');
    const fetchLastViewed = async () => {
      try {
        const docSnap = await getDoc(lastViewedRef);
        const lastViewedTime = docSnap.exists() ? docSnap.data().timestamp : null;
        setLastViewed(lastViewedTime);
        await setDoc(lastViewedRef, { timestamp: serverTimestamp() }, { merge: true });
        setLoading(false);
      } catch (err) {
        console.error("Errore fetchLastViewed:", err);
        setError("Errore nel caricamento degli aggiornamenti.");
        setLoading(false);
      }
    };
    fetchLastViewed();
  }, []);

  // Activity feed
  useEffect(() => {
    if (!lastViewed) return;

    const checksQuery = query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
      try {
        const newChecks = [];
        for (const doc of snap.docs) {
          if (toDate(doc.data().createdAt) > toDate(lastViewed)) {
            const clientId = doc.ref.parent.parent.id;
            const clientDoc = await getDoc(doc(db, 'clients', clientId));
            newChecks.push({
              type: 'new_check',
              clientId,
              clientName: clientDoc.exists() ? clientDoc.data().name || 'Cliente' : 'Cliente',
              description: 'Ha inviato un nuovo check-in',
              date: doc.data().createdAt
            });
          }
        }
        setActivityFeed(prev => [...prev, ...newChecks].sort((a, b) => toDate(b.date) - toDate(a.date)));
      } catch (err) {
        console.error("Errore snapshot checks:", err);
        setError("Errore nel caricamento dei check.");
      }
    });

    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubAnamnesi = onSnapshot(anamnesiQuery, async (snap) => {
      try {
        const newAnamnesi = [];
        for (const doc of snap.docs) {
          if (toDate(doc.data().submittedAt) > toDate(lastViewed)) {
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
        }
        setActivityFeed(prev => [...prev, ...newAnamnesi].sort((a, b) => toDate(b.date) - toDate(a.date)));
      } catch (err) {
        console.error("Errore snapshot anamnesi:", err);
        setError("Errore nel caricamento delle anamnesi.");
      }
    });

    const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', COACH_UID), orderBy('lastUpdate', 'desc'));
    const unsubChats = onSnapshot(chatsQuery, async (snap) => {
      try {
        const newMessages = [];
        for (const doc of snap.docs) {
          const chatData = doc.data();
          const clientId = chatData.participants.find(p => !adminUIDs.includes(p));
          if (chatData.lastUpdate && toDate(chatData.lastUpdate) > toDate(lastViewed)) {
            const clientDoc = await getDoc(doc(db, 'clients', clientId));
            newMessages.push({
              type: 'new_message',
              clientId,
              clientName: clientDoc.exists() ? clientDoc.data().name || 'Cliente' : 'Cliente',
              description: `Nuovo messaggio: ${chatData.lastMessage.slice(0, 30)}...`,
              date: doc.data().lastUpdate
            });
          }
        }
        setActivityFeed(prev => [...prev, ...newMessages].sort((a, b) => toDate(b.date) - toDate(a.date)));
      } catch (err) {
        console.error("Errore snapshot chats:", err);
        setError("Errore nel caricamento dei messaggi.");
      }
    });

    const clientsQuery = query(collection(db, 'clients'));
    const unsubClients = onSnapshot(clientsQuery, (snap) => {
      try {
        const expiring = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => {
            const expiry = toDate(c.scadenza);
            if (!expiry) return false;
            const daysLeft = (expiry - new Date()) / (1000 * 60 * 60 * 24);
            return daysLeft <= 15 && daysLeft > 0;
          })
          .map(c => ({
            type: 'expiring',
            clientId: c.id,
            clientName: c.name,
            description: `Abbonamento in scadenza tra ${Math.ceil((toDate(c.scadenza) - new Date()) / (1000 * 60 * 60 * 24))} giorni`,
            date: c.scadenza
          }));
        setActivityFeed(prev => {
          const nonExpiring = prev.filter(item => item.type !== 'expiring');
          return [...nonExpiring, ...expiring].sort((a, b) => toDate(b.date) - toDate(a.date));
        });
      } catch (err) {
        console.error("Errore snapshot clients:", err);
        setError("Errore nel caricamento delle scadenze.");
      }
    });

    return () => {
      unsubChecks();
      unsubAnamnesi();
      unsubChats();
      unsubClients();
    };
  }, [lastViewed]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (error) return <div className="min-h-screen bg-slate-900 text-red-400 flex justify-center items-center">{error}</div>;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen text-slate-200 relative overflow-x-hidden w-full">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <motion.header variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-50 flex items-center gap-2">
            <Bell size={28} /> Aggiornamenti Utili
          </h1>
          <button
            onClick={() => navigate('/coach-dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Torna alla Dashboard</span>
          </button>
        </motion.header>
        <motion.div variants={itemVariants} className="bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Bell size={20} /> Ultimi Aggiornamenti</h2>
          <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
            <AnimatePresence>
              {activityFeed.length > 0 ? (
                activityFeed.map(item => (
                  <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds}`} item={item} navigate={navigate} variants={itemVariants} />
                ))
              ) : (
                <p className="text-slate-400 text-center p-4">Nessun aggiornamento recente.</p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}