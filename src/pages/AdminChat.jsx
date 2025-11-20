import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, serverTimestamp, setDoc, getDocs, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { Send, MessageSquare, Search, AlertCircle, Trash2, X, Smile, Check, CheckCheck, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaUploadButton from '../components/MediaUploadButton';
import EnhancedChatMessage from '../components/EnhancedChatMessage';
import EmojiPicker from '../components/EmojiPicker';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);

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

  // Handle typing indicator
  const handleTyping = () => {
    if (selectedChatId && adminUser) {
      setIsTyping(true);
      setDoc(doc(db, 'chats', selectedChatId), {
        [`typing_${adminUser.uid}`]: serverTimestamp()
      }, { merge: true });
    }
  };

  // Stop typing indicator
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false);
        if (selectedChatId && adminUser) {
          setDoc(doc(db, 'chats', selectedChatId), {
            [`typing_${adminUser.uid}`]: null
          }, { merge: true });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isTyping, selectedChatId, adminUser]);

  // Listen for other user typing
  useEffect(() => {
    if (!selectedChatId) return;
    
    const unsubscribe = onSnapshot(doc(db, 'chats', selectedChatId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const otherParticipant = data.participants?.find(p => p !== adminUser?.uid);
        if (otherParticipant && data[`typing_${otherParticipant}`]) {
          const typingTime = data[`typing_${otherParticipant}`]?.toDate?.();
          if (typingTime && Date.now() - typingTime < 3000) {
            setOtherUserTyping(true);
            setTimeout(() => setOtherUserTyping(false), 3000);
          }
        }
      }
    });
    
    return () => unsubscribe();
  }, [selectedChatId, adminUser]);

  // Invia messaggio
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedChatId || !adminUser || !isCoach) return;
    try {
      const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        senderId: adminUser.uid,
        read: false
      });
      await setDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: newMessage,
        lastUpdate: serverTimestamp(),
        [`typing_${adminUser.uid}`]: null
      }, { merge: true });
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error.code, error.message, { uid: adminUser?.uid });
      showNotification("Errore nell'invio del messaggio. Riprova.", 'error');
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Pin/Unpin message
  const handlePinMessage = async (messageId) => {
    if (!selectedChatId) return;
    try {
      const isPinned = pinnedMessages.includes(messageId);
      const chatRef = doc(db, 'chats', selectedChatId);
      
      if (isPinned) {
        // Unpin
        await setDoc(chatRef, {
          pinnedMessages: pinnedMessages.filter(id => id !== messageId)
        }, { merge: true });
      } else {
        // Pin
        await setDoc(chatRef, {
          pinnedMessages: [...pinnedMessages, messageId]
        }, { merge: true });
      }
    } catch (error) {
      console.error("Errore nel pin del messaggio:", error);
      showNotification("Errore nel pin del messaggio. Riprova.", 'error');
    }
  };

  // Load pinned messages
  useEffect(() => {
    if (!selectedChatId) return;
    
    const unsubscribe = onSnapshot(doc(db, 'chats', selectedChatId), (snapshot) => {
      if (snapshot.exists()) {
        setPinnedMessages(snapshot.data().pinnedMessages || []);
      }
    });
    
    return () => unsubscribe();
  }, [selectedChatId]);

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChatSearch(!showChatSearch)}
                    className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Cerca nei messaggi"
                  >
                    <Search size={18} />
                  </button>
                  <button
                    onClick={handleDeleteChat}
                    className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Elimina Chat"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {showChatSearch && (
                <div className="p-3 border-b border-slate-700">
                  <input
                    type="text"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    placeholder="Cerca nei messaggi..."
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-white text-sm"
                  />
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loadingMessages ? <LoadingSpinner /> : messages
                  .filter(msg => !chatSearchQuery || msg.text?.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                  .map(msg => {
                    const isPinned = pinnedMessages.includes(msg.id);
                    const isOwnMessage = adminUIDs.includes(msg.senderId);
                    return (
                      <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                        <div className="relative">
                          {isPinned && (
                            <div className="absolute -top-2 left-0 bg-yellow-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Pin size={10} /> Pinnato
                            </div>
                          )}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`max-w-[70%] sm:max-w-md p-3 rounded-2xl shadow-md ${isOwnMessage ? 'bg-rose-600 rounded-br-none' : 'bg-slate-700/80 rounded-bl-none'} ${isPinned ? 'ring-2 ring-yellow-500/50' : ''}`}
                          >
                            <p className="text-white break-words text-sm sm:text-base">{msg.text}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <p className="text-xs text-slate-300/70">
                                {msg.createdAt?.toDate().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {isOwnMessage && (
                                <span className="text-slate-300/70">
                                  {msg.read ? <CheckCheck size={14} /> : <Check size={14} />}
                                </span>
                              )}
                            </div>
                          </motion.div>
                          <button
                            onClick={() => handlePinMessage(msg.id)}
                            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                            title={isPinned ? "Rimuovi pin" : "Fissa messaggio"}
                          >
                            <Pin size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 sm:p-6 border-t border-slate-700">
                {otherUserTyping && (
                  <div className="mb-2 text-sm text-slate-400 italic">
                    Sta scrivendo...
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        placeholder="Scrivi una risposta..."
                        className="w-full p-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-full outline-none focus:ring-2 focus:ring-rose-500 text-white text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Smile size={20} />
                      </button>
                      {showEmojiPicker && (
                        <EmojiPicker
                          onSelect={handleEmojiSelect}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}
                    </div>
                    <MediaUploadButton 
                      chatId={selectedChatId}
                      onUploadComplete={() => {}}
                    />
                    <button
                      type="submit"
                      className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors disabled:opacity-50"
                      disabled={!newMessage.trim()}
                    >
                      <Send size={20} />
                    </button>
                  </div>
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