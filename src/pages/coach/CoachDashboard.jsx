import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, collectionGroup, doc, getDoc, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { auth, db, toDate } from '../../firebase';
import { signOut } from 'firebase/auth';
import { CheckCircle, Clock, FileText, Users, LogOut, Bell, MessageSquare, PlusCircle, ChevronRight } from 'lucide-react';
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

const StatCard = ({ title, value, icon, isPercentage = false, variants }) => (
  <motion.div variants={variants} className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700 h-full">
    <div className="flex items-center gap-3 text-slate-400">
      {icon}
      <p className="text-sm">{title}</p>
    </div>
    <p className="text-3xl font-bold text-slate-50 mt-2">
      {isPercentage ? `${value}%` : value}
    </p>
  </motion.div>
);

const QuickAction = ({ to, title, icon, variants }) => (
  <motion.div variants={variants}>
    <button
      onClick={to}
      className="group bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-lg p-4 flex items-center gap-4 transition-all duration-300 w-full"
    >
      <div className="bg-slate-700/70 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-white p-3 rounded-lg transition-colors duration-300">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-200">{title}</h4>
      </div>
      <ChevronRight className="text-slate-500 group-hover:text-white transition-colors duration-300" />
    </button>
  </motion.div>
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

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica coach (sola autentificazione e nome)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        try {
          const coachDocRef = doc(db, 'roles', 'coaches');
          const coachDoc = await getDoc(coachDocRef);
          const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(user.uid);
          if (isCoach) {
            setUserName(user.displayName || user.email || 'Coach');
          } else {
            sessionStorage.removeItem('app_role');
            await signOut(auth);
            navigate('/login');
          }
        } catch (err) {
          setError('Errore nella verifica del ruolo coach.');
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Clienti
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snap) => {
      try {
        const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        console.error('Error loading clients:', error);
        setError("Errore nel caricamento dei clienti.");
        setLoading(false);
      }
    }, (error) => {
      console.error('Snapshot error:', error);
      setError("Errore nel caricamento dei clienti.");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Feed attività in tempo reale e completo
  useEffect(() => {
    if (!auth.currentUser) return;

    // Check-in
    const checksQuery = query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
      try {
        const items = [];
        for (const checkDoc of snap.docs) {
          const clientId = checkDoc.ref.parent.parent.id;
          const clientDoc = await getDoc(doc(db, 'clients', clientId));
          items.push({
            type: 'new_check',
            clientId,
            clientName: clientDoc.exists() ? clientDoc.data().name || 'Cliente' : 'Cliente',
            description: 'Ha inviato un nuovo check-in',
            date: checkDoc.data().createdAt
          });
        }
        setActivityFeed(prev => {
          // rimuovi check-in duplicati (clientId e data uguale)
          const all = [...items, ...prev.filter(it => it.type !== 'new_check')];
          return all.sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 30);
        });
      } catch (err) {
        setError("Errore nel caricamento dei check.");
      }
    });

    // Anamnesi
    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubAnamnesi = onSnapshot(anamnesiQuery, async (snap) => {
      try {
        const items = [];
        for (const anamnesiDoc of snap.docs) {
          const clientId = anamnesiDoc.ref.parent.parent.id;
          const clientDoc = await getDoc(doc(db, 'clients', clientId));
          items.push({
            type: 'new_anamnesi',
            clientId,
            clientName: clientDoc.exists() ? clientDoc.data().name || 'Cliente' : 'Cliente',
            description: 'Ha compilato l\'anamnesi iniziale',
            date: anamnesiDoc.data().submittedAt
          });
        }
        setActivityFeed(prev => {
          const all = [...items, ...prev.filter(it => it.type !== 'new_anamnesi')];
          return all.sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 30);
        });
      } catch (err) {
        setError("Errore nel caricamento delle anamnesi.");
      }
    });

    // Chat (messaggi)
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastUpdate', 'desc')
    );
    const unsubChats = onSnapshot(chatsQuery, async (snap) => {
      try {
        const items = [];
        for (const chatDoc of snap.docs) {
          const chatData = chatDoc.data();
          const clientId = chatData.participants.find(p => p !== auth.currentUser.uid);
          if (chatData.lastUpdate) {
            const clientDoc = await getDoc(doc(db, 'clients', clientId));
            items.push({
              type: 'new_message',
              clientId,
              clientName: clientDoc.exists() ? clientDoc.data().name || 'Cliente' : 'Cliente',
              description: `Nuovo messaggio: ${chatData.lastMessage?.slice?.(0, 30)}...`,
              date: chatData.lastUpdate
            });
          }
        }
        setActivityFeed(prev => {
          const all = [...items, ...prev.filter(it => it.type !== 'new_message')];
          return all.sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 30);
        });
      } catch (err) {
        setError("Errore nel caricamento dei messaggi.");
      }
    });

    // Clienti in scadenza
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
          const all = [...nonExpiring, ...expiring];
          return all.sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 30);
        });
      } catch (err) {
        setError("Errore nel caricamento delle scadenze.");
      }
    });

    return () => {
      unsubChecks();
      unsubAnamnesi();
      unsubChats();
      unsubClients();
    };
  }, []);

  // Statistiche
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
      return { active: 0, expiring: 0 };
    }
  }, [clients]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('app_role');
      await signOut(auth);
      navigate('/login');
    } catch (error) {
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

  if (error) return <div className="min-h-screen bg-slate-900 text-red-400 flex justify-center items-center">{error}</div>;
  if (loading) return <div className="min-h-screen flex justify-center items-center relative">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
  </div>;

  return (
    <div className="min-h-screen text-slate-200 relative overflow-x-hidden w-full">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full py-4 sm:py-6 mobile-safe-bottom">
        <motion.header variants={itemVariants} className="bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-slate-700 mx-3 sm:mx-6">
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
        </motion.header>

        <main className="mt-6 mx-3 sm:mx-6">
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
          <motion.div variants={itemVariants} className="bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><Bell size={20} /> Aggiornamenti Recenti</h2>
            <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {activityFeed.length > 0 ? (
                  activityFeed.map(item => (
                    <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds || item.date}`} item={item} navigate={navigate} variants={itemVariants} />
                  ))
                ) : (
                  <p className="text-slate-400 text-center p-4">Nessun aggiornamento recente.</p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="mt-8 bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-slate-200">Funzioni Utili</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction to={() => navigate('/coach/clients')} title="Gestisci Clienti" icon={<Users size={22} />} variants={itemVariants} />
              <QuickAction to={() => navigate('/new')} title="Aggiungi Nuovo Cliente" icon={<PlusCircle size={22} />} variants={itemVariants} />
              <QuickAction to={() => navigate('/coach/chat')} title="Invia Messaggio" icon={<MessageSquare size={22} />} variants={itemVariants} />
              <QuickAction to={() => navigate('/coach/anamnesi')} title="Visualizza Anamnesi" icon={<FileText size={22} />} variants={itemVariants} />
              <QuickAction to={() => navigate('/coach/updates')} title="Aggiornamenti" icon={<Bell size={22} />} variants={itemVariants} />
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
