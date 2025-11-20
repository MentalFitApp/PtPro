import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, serverTimestamp, setDoc, getDocs, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { Send, MessageSquare, Search, AlertCircle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaUploadButton from '../components/MediaUploadButton';
import EnhancedChatMessage from '../components/EnhancedChatMessage';

// AnimatedBackground per tema stellato
const AnimatedBackground = () => {
  const starsContainerRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    let starsContainer = document.querySelector('.stars');
    if (!starsContainer) {
      starsContainer = document.createElement('div');
      starsContainer.className = 'stars';
      let starryBackground = document.querySelector('.starry-background');
      if (!starryBackground) {
        starryBackground = document.createElement('div');
        starryBackground.className = 'starry-background';
        document.body.appendChild(starryBackground);
      }
      starryBackground.appendChild(starsContainer);
      starsContainerRef.current = starsContainer;
    } else {
      starsContainerRef.current = starsContainer;
    }

    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDuration = `${Math.random() * 30 + 40}s, 5s`;
      starsContainerRef.current.appendChild(star);
    }

    isInitialized.current = true;

    return () => {
      if (starsContainerRef.current) {
        while (starsContainerRef.current.firstChild) {
          starsContainerRef.current.removeChild(starsContainerRef.current.firstChild);
        }
      }
    };
  }, []);

  return (
    <div className="starry-background">
      <div className="stars"></div>
    </div>
  );
};

// Spinner di caricamento
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full p-4">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
  </div>
);

// Notifica per errori e successi
const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${
          type === 'error' ? 'bg-red-900/80 text-red-300 border-red-500/30' : 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
        } backdrop-blur-md shadow-lg`}
      >
        <AlertCircle size={20} />
        <p>{message}</p>
        <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const AdminChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const messagesEndRef = useRef(null);

  const auth = getAuth();
  const adminUser = auth.currentUser;
  const adminUIDs = [
    "QwWST9OVOlTOi5oheyCqfpXLOLg2",
    "AeZKjJYu5zMZ4mvffaGiqCBb0cF2",
    "3j0AXIRa4XdHq1ywCl4UBxJNsku2",
    "l0RI8TzFjbNVoAdmcXNQkP9mWb12"
  ];
  const isCoach = adminUser && (adminUIDs.includes(adminUser.uid) || adminUser.uid === 'l0RI8TzFjbNVoAdmcXNQkP9mWb12');

  // Mostra notifica
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  };

  // Verifica se l'utente è coach
  useEffect(() => {
    if (!adminUser) {
      showNotification("Utente non autenticato. Effettua il login.", 'error');
      return;
    }
    if (!isCoach) {
      showNotification("Accesso non autorizzato. Area riservata ai coach o admin.", 'error');
    }
    console.log('Utente autenticato:', adminUser?.uid, adminUser?.email, { isCoach });
  }, [adminUser, isCoach]);

  // Carica le chat
  useEffect(() => {
    if (!adminUser || !isCoach) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains-any', adminUIDs),
      orderBy('lastUpdate', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingChats(false);
    }, (error) => {
      console.error("Errore nel caricare le chat:", error.code, error.message, { uid: adminUser?.uid });
      showNotification("Errore nel caricamento delle chat. Contatta il supporto.", 'error');
      setLoadingChats(false);
    });
    return () => unsubscribe();
  }, [adminUser, isCoach]);

  // Carica i messaggi della chat selezionata
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingMessages(false);
    }, (error) => {
      console.error("Errore nel caricare i messaggi:", error.code, error.message, { uid: adminUser?.uid });
      showNotification("Errore nel caricamento dei messaggi: permessi insufficienti. Contatta il supporto.", 'error');
      setLoadingMessages(false);
    });
    return () => unsubscribe();
  }, [selectedChatId, adminUser]);

  // Scorri all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ricerca clienti
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
      const q = query(
        clientsRef,
        where('name_lowercase', '>=', searchTerm),
        where('name_lowercase', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      try {
        const querySnapshot = await getDocs(q);
        setSearchResults(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Errore nella ricerca (indice Firestore mancante?):", error.code, error.message, { uid: adminUser?.uid });
        showNotification("Errore nella ricerca dei clienti. Assicurati che l'indice Firestore sia configurato.", 'error');
      }
      setIsSearching(false);
    };
    const debounceSearch = setTimeout(() => {
      searchClients();
    }, 300);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery, adminUser]);

  // Seleziona cliente e crea chat
  const handleSelectClient = async (client) => {
    if (!adminUser || !isCoach) return;
    const primaryAdminUID = adminUIDs.includes(adminUser.uid) ? adminUser.uid : adminUIDs[0];
    const newChatId = [client.id, primaryAdminUID].sort().join('_');

    const chatRef = doc(db, 'chats', newChatId);
    const existingChat = chats.find(chat => chat.id === newChatId);
    if (!existingChat) {
      try {
        await setDoc(chatRef, {
          participants: [client.id, primaryAdminUID],
          participantNames: { [client.id]: client.name, [primaryAdminUID]: adminUser.displayName || "Coach" },
          lastMessage: "Conversazione iniziata",
          lastUpdate: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Errore nella creazione della chat:", error.code, error.message, { uid: adminUser?.uid });
        showNotification("Errore nell'avvio della chat. Riprova.", 'error');
      }
    }
    setSelectedChatId(newChatId);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Invia messaggio
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedChatId || !adminUser || !isCoach) return;
    try {
      const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        senderId: adminUser.uid
      });
      await setDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: newMessage,
        lastUpdate: serverTimestamp(),
      }, { merge: true });
      setNewMessage('');
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error.code, error.message, { uid: adminUser?.uid });
      showNotification("Errore nell'invio del messaggio. Riprova.", 'error');
    }
  };

  // Elimina chat
  const handleDeleteChat = async () => {
    if (!selectedChatId || !adminUser || !isCoach) return;
    try {
      const chatRef = doc(db, 'chats', selectedChatId);
      await deleteDoc(chatRef);
      console.log('Documento chat eliminato:', chatRef.path);
      setSelectedChatId(null);
      setMessages([]);
      showNotification("Chat eliminata con successo!", 'success');
    } catch (error) {
      console.error("Errore nell'eliminazione della chat:", error.code, error.message, { uid: adminUser?.uid });
      showNotification("Errore nell'eliminazione della chat. Riprova.", 'error');
    }
  };

  // Ottieni nome chat selezionata
  const getSelectedChatName = () => {
    if (!selectedChatId) return 'Chat';
    const chat = chats.find(c => c.id === selectedChatId);
    if (!chat) return 'Chat';
    const clientUID = chat.participants.find(p => !adminUIDs.includes(p));
    return chat.participantNames?.[clientUID] || 'Cliente';
  };

  // Chiudi notifica
  const dismissNotification = () => setNotification({ message: '', type: '' });

  return (
    <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <Notification message={notification.message} type={notification.type} onDismiss={dismissNotification} />
      <div className="flex h-[calc(100vh-120px)] bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="w-full sm:w-1/3 border-r border-slate-700 flex flex-col bg-slate-800/40">
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18}/>
              <input
                type="text"
                placeholder="Cerca o avvia una chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 p-2 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 text-sm sm:text-base"
              />
            </div>
          </div>
          {searchQuery.length > 1 ? (
            <div className="flex-1 overflow-y-auto">
              {isSearching && <p className="p-4 text-slate-400 text-sm">Ricerca in corso...</p>}
              {!isSearching && searchResults.length === 0 && <p className="p-4 text-slate-400 text-sm">Nessun cliente trovato.</p>}
              {!isSearching && searchResults.map(client => (
                <div key={client.id} onClick={() => handleSelectClient(client)} className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors">
                  <p className="font-semibold text-slate-100">{client.name}</p>
                  <p className="text-sm text-slate-400">{client.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <>
              {loadingChats ? <LoadingSpinner /> : (
                <div className="flex-1 overflow-y-auto">
                  {chats.map(chat => {
                    const clientUID = chat.participants.find(p => !adminUIDs.includes(p));
                    const clientName = chat.participantNames?.[clientUID] || 'Cliente';
                    return (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-4 cursor-pointer border-l-4 transition-colors ${selectedChatId === chat.id ? 'bg-rose-600/20 border-rose-500' : 'border-transparent hover:bg-slate-700/30'}`}
                      >
                        <p className="font-semibold text-slate-100">{clientName}</p>
                        <p className="text-sm text-slate-400">{chat.lastMessage || 'Nessun messaggio'}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="w-full sm:w-2/3 flex flex-col bg-slate-900/40">
          {selectedChatId ? (
            <>
              <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-100">{getSelectedChatName()}</h3>
                <button
                  onClick={handleDeleteChat}
                  className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Elimina Chat"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loadingMessages ? <LoadingSpinner /> : messages.map(msg => (
                  <div key={msg.id} className={`flex ${adminUIDs.includes(msg.senderId) ? 'justify-end' : 'justify-start'}`}>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`max-w-[70%] sm:max-w-md p-3 rounded-2xl shadow-md ${adminUIDs.includes(msg.senderId) ? 'bg-rose-600 rounded-br-none' : 'bg-slate-700/80 rounded-bl-none'}`}
                    >
                      <p className="text-white break-words text-sm sm:text-base">{msg.text}</p>
                      <p className="text-xs text-slate-300/70 mt-1.5 text-right">
                        {msg.createdAt?.toDate().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </motion.div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 sm:p-6 border-t border-slate-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Scrivi una risposta..."
                    className="flex-1 p-3 bg-slate-700/50 border border-slate-600 rounded-full outline-none focus:ring-2 focus:ring-rose-500 text-white text-sm sm:text-base"
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
            <div className="flex flex-col justify-center items-center h-full text-slate-400">
              <MessageSquare size={48} />
              <p className="mt-4">Seleziona una conversazione o cercane una nuova.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;