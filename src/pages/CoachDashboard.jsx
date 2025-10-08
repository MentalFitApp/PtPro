import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, collectionGroup, doc, getDoc, setDoc, serverTimestamp, query, orderBy, where, getDocs, limit } from "firebase/firestore";
import { auth, db, toDate, calcolaStatoPercorso } from "../firebase";
import { signOut } from "firebase/auth";
import { CheckCircle, Clock, FileText, Users, LogOut, Bell, MessageSquare, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// AnimatedBackground per tema stellato
const AnimatedBackground = () => {
  useEffect(() => {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    const createStar = () => {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDuration = `${Math.random() * 30 + 40}s, 5s`;
      starsContainer.appendChild(star);
    };

    for (let i = 0; i < 50; i++) {
      createStar();
    }

    return () => {
      while (starsContainer.firstChild) {
        starsContainer.removeChild(starsContainer.firstChild);
      }
    };
  }, []);

  return (
    <div className="starry-background">
      <div className="stars"></div>
    </div>
  );
};

// Helper per calcolare il tempo trascorso
const timeAgo = (date) => {
  if (!date) return '';
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

// Componente ActivityItem
const ActivityItem = ({ item, navigate, variants }) => {
  const icons = {
    expiring: <Clock className="text-yellow-500" size={18}/>,
    new_check: <CheckCircle className="text-green-500" size={18}/>,
    new_anamnesi: <FileText className="text-blue-500" size={18}/>,
  };
  const tabMap = { expiring: 'info', new_check: 'checks', new_anamnesi: 'anamnesi' };

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

// Componente ChatItem
const ChatItem = ({ chat, setSelectedChatId, selectedChatId, adminUIDs }) => {
  const clientUID = chat.participants.find(p => !adminUIDs.includes(p));
  const clientName = chat.participantNames?.[clientUID] || 'Cliente';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 cursor-pointer border-l-4 transition-colors ${selectedChatId === chat.id ? 'bg-rose-600/20 border-rose-500' : 'border-transparent hover:bg-white/5'}`}
      onClick={() => setSelectedChatId(chat.id)}
    >
      <p className="font-semibold text-slate-100">{clientName}</p>
      <p className="text-sm text-slate-400">{chat.lastMessage || 'Nessun messaggio'}</p>
    </motion.div>
  );
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [lastViewed, setLastViewed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userName, setUserName] = useState('');

  // Verifica coach
  const COACH_UID = "l0RI8TzFjbNVoAdmcXNQkP9mWb12";
  const adminUIDs = ["QwWST9OVOlTOi5oheyCqfpXLOLg2", "AeZKjJYu5zMZ4mvffaGiqCBb0cF2", "3j0AXIRa4XdHq1ywCl4UBxJNsku2", COACH_UID];

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
      const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch lastViewed
  useEffect(() => {
    const lastViewedRef = doc(db, 'app-data', 'lastViewed');
    const fetchLastViewed = async () => {
      const docSnap = await getDoc(lastViewedRef);
      const lastViewedTime = docSnap.exists() ? docSnap.data().timestamp : null;
      setLastViewed(lastViewedTime);
      await setDoc(lastViewedRef, { timestamp: serverTimestamp() }, { merge: true });
    };
    fetchLastViewed();
  }, []);

  // Activity feed
  useEffect(() => {
    if (!lastViewed) return;

    const checksQuery = query(collectionGroup(db, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
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
    });

    const anamnesiQuery = query(collectionGroup(db, 'anamnesi'), orderBy('submittedAt', 'desc'));
    const unsubAnamnesi = onSnapshot(anamnesiQuery, async (snap) => {
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
    });

    const clientsQuery = query(collection(db, 'clients'));
    const unsubClients = onSnapshot(clientsQuery, (snap) => {
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
    });

    return () => {
      unsubChecks();
      unsubAnamnesi();
      unsubClients();
    };
  }, [lastViewed]);

  // Fetch chats
  useEffect(() => {
    if (activeTab !== 'chat') return;
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', COACH_UID), orderBy('lastUpdate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingChats(false);
    }, (error) => {
      console.error("Errore nel caricare le chat:", error);
      setLoadingChats(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  // Fetch messages
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingMessages(false);
    }, (error) => {
      console.error("Errore nel caricare i messaggi:", error);
      setLoadingMessages(false);
    });
    return () => unsubscribe();
  }, [selectedChatId]);

  // Search clients
  useEffect(() => {
    const searchClients = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const clientsRef = collection(db, 'clients');
      const searchTerm = searchQuery.toLowerCase();
      const q = query(clientsRef, 
        where('name_lowercase', '>=', searchTerm), 
        where('name_lowercase', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      try {
        const querySnapshot = await getDocs(q);
        setSearchResults(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Errore nella ricerca:", error);
      }
      setIsSearching(false);
    };
    const debounceSearch = setTimeout(() => {
      searchClients();
    }, 300);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery]);

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedChatId) return;
    try {
      const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        senderId: COACH_UID
      });
      await setDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: newMessage,
        lastUpdate: serverTimestamp(),
      }, { merge: true });
      setNewMessage('');
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
    }
  };

  // Handle select client for chat
  const handleSelectClient = async (client) => {
    const newChatId = [client.id, COACH_UID].sort().join('_');
    const chatRef = doc(db, 'chats', newChatId);
    const existingChat = chats.find(chat => chat.id === newChatId);
    if (!existingChat) {
      try {
        await setDoc(chatRef, {
          participants: [client.id, COACH_UID],
          participantNames: { [client.id]: client.name, [COACH_UID]: "Coach Mattia" },
          lastMessage: "Conversazione iniziata",
          lastUpdate: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Errore nella creazione della chat:", error);
      }
    }
    setSelectedChatId(newChatId);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Statistiche clienti
  const clientStats = React.useMemo(() => {
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
  }, [clients]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
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

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-8 relative">
      <AnimatedBackground />
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
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'clients' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Clienti
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'chat' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('checks')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'checks' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Check
            </button>
            <button
              onClick={() => setActiveTab('anamnesi')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'anamnesi' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
            >
              Anamnesi
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
                {clients.map(client => (
                  <ClientItem key={client.id} client={client} navigate={navigate} variants={itemVariants} />
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row h-[calc(100vh-14rem)] bg-zinc-950/60 backdrop-blur-xl rounded-xl gradient-border overflow-hidden">
              <div className="w-full lg:w-1/3 border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18}/>
                    <input
                      type="text"
                      placeholder="Cerca o avvia una chat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900/70 p-2 pl-10 rounded-lg border border-white/10 outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 text-sm sm:text-base"
                    />
                  </div>
                </div>
                {searchQuery.length > 1 ? (
                  <div className="flex-1 overflow-y-auto">
                    {isSearching && <p className="p-4 text-slate-400 text-sm">Ricerca in corso...</p>}
                    {!isSearching && searchResults.length === 0 && <p className="p-4 text-slate-400 text-sm">Nessun cliente trovato.</p>}
                    {!isSearching && searchResults.map(client => (
                      <div key={client.id} onClick={() => handleSelectClient(client)} className="p-4 cursor-pointer hover:bg-white/5 transition-colors">
                        <p className="font-semibold text-slate-100">{client.name}</p>
                        <p className="text-sm text-slate-400">{client.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {loadingChats ? (
                      <div className="flex justify-center items-center h-full p-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
                      </div>
                    ) : (
                      chats.map(chat => (
                        <ChatItem key={chat.id} chat={chat} setSelectedChatId={setSelectedChatId} selectedChatId={selectedChatId} adminUIDs={adminUIDs} />
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="w-full lg:w-2/3 flex flex-col bg-zinc-900/50">
                {selectedChatId ? (
                  <>
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-bold text-lg text-slate-50">
                        {chats.find(c => c.id === selectedChatId)?.participantNames?.[chats.find(c => c.id === selectedChatId)?.participants.find(p => !adminUIDs.includes(p))] || 'Cliente'}
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                      {loadingMessages ? (
                        <div className="flex justify-center items-center h-full p-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
                        </div>
                      ) : messages.map(msg => (
                        <div key={msg.id} className={`flex ${adminUIDs.includes(msg.senderId) ? 'justify-end' : 'justify-start'}`}>
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`max-w-[70%] sm:max-w-md p-3 rounded-2xl shadow-md ${adminUIDs.includes(msg.senderId) ? 'bg-rose-600 rounded-br-none' : 'bg-zinc-800 rounded-bl-none'}`}
                          >
                            <p className="text-white break-words text-sm sm:text-base">{msg.text}</p>
                            <p className="text-xs text-slate-300/70 mt-1.5 text-right">
                              {msg.createdAt?.toDate().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </motion.div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 sm:p-6 border-t border-white/10">
                      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Scrivi una risposta..."
                          className="flex-1 p-3 bg-zinc-800 border border-white/10 rounded-full outline-none focus:ring-2 focus:ring-rose-500 text-white text-sm sm:text-base"
                        />
                        <button
                          type="submit"
                          className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors disabled:opacity-50"
                          disabled={!newMessage.trim()}
                        >
                          <Send size={20} />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col justify-center items-center h-full text-slate-500">
                    <MessageSquare size={48} />
                    <p className="mt-4">Seleziona una conversazione o cercane una nuova.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'checks' && (
            <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><CheckCircle size={20} /> Check Recenti</h2>
              <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
                <AnimatePresence>
                  {activityFeed.filter(item => item.type === 'new_check').map(item => (
                    <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds}`} item={item} navigate={navigate} variants={itemVariants} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          {activeTab === 'anamnesi' && (
            <motion.div variants={itemVariants} className="bg-zinc-950/60 backdrop-blur-xl p-4 sm:p-6 rounded-xl gradient-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200"><FileText size={20} /> Anamnesi Inviate</h2>
              <div className="space-y-3 max-h-[90vh] overflow-y-auto pr-2">
                <AnimatePresence>
                  {activityFeed.filter(item => item.type === 'new_anamnesi').map(item => (
                    <ActivityItem key={`${item.type}-${item.clientId}-${item.date?.seconds}`} item={item} navigate={navigate} variants={itemVariants} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </main>
      </motion.div>
    </div>
  );
}