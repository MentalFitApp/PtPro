import React, { useState, useEffect, useRef } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, Search, MessageSquare, X, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaUploadButton from '../components/MediaUploadButton';
import EnhancedChatMessage from '../components/EnhancedChatMessage';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
    <p className="mt-4 text-slate-400">Caricamento chat...</p>
  </div>
);

const Notification = ({ message, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-5 right-5 z-[1000] flex items-center gap-4 p-4 rounded-lg border bg-red-900/80 text-red-300 border-red-500/30 backdrop-blur-md shadow-lg"
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

const ChatItem = ({ chat, setSelectedChatId, selectedChatId, coachUid }) => {
  const clientUID = chat.participants.find(p => p !== coachUid);
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

export default function CoachChat() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingMedia, setPendingMedia] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Verifica autenticazione
  useEffect(() => {
    if (!user) {
      console.log('Nessun utente autenticato, redirect a /login');
      navigate('/login');
      return;
    }
    console.log('Utente autenticato:', { uid: user.uid, email: user.email });

    // Verifica ruolo coach
    const checkCoachRole = async () => {
      try {
        const coachDocRef = doc(db, 'roles', 'coaches');
        const coachDoc = await getDoc(coachDocRef);
        const isCoach = coachDoc.exists() && coachDoc.data().uids.includes(user.uid);
        console.log('Debug ruolo coach:', {
          uid: user.uid,
          coachDocExists: coachDoc.exists(),
          coachUids: coachDoc.data()?.uids,
          isCoach
        });
        if (!isCoach) {
          console.warn('Accesso non autorizzato per CoachChat:', user.uid);
          sessionStorage.removeItem('app_role');
          await signOut(auth);
          navigate('/login');
        }
      } catch (err) {
        console.error('Errore verifica ruolo coach:', err);
        setError('Errore nella verifica del ruolo coach.');
        setLoading(false);
      }
    };
    checkCoachRole();
  }, [user, navigate]);

  // Carica chats
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid), orderBy('lastUpdate', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Chats caricate:', { count: chatList.length, chats: chatList.map(c => ({ id: c.id, participants: c.participants })) });
        setChats(chatList);
        setLoading(false);
      } catch (err) {
        console.error("Errore nel caricare le chat:", err);
        setError(err.code === 'permission-denied' ? 'Permessi insufficienti per accedere alle chat.' : 'Errore nel caricamento delle chat.');
        setLoading(false);
      }
    }, (err) => {
      console.error("Errore snapshot chats:", err);
      setError(err.code === 'permission-denied' ? 'Permessi insufficienti per accedere alle chat.' : 'Errore nel caricamento delle chat.');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Carica messaggi quando cambia chat
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setLoading(true);
    const messagesCollectionRef = collection(db, 'chats', selectedChatId, 'messages');
    const q = query(messagesCollectionRef, orderBy('createdAt'), limit(100));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Messaggi caricati per chat:', selectedChatId, { count: messagesData.length });
        setMessages(messagesData);
        setLoading(false);
      } catch (err) {
        console.error("Errore nello snapshot dei messaggi:", err);
        setError(err.code === 'permission-denied' ? 'Permessi insufficienti per i messaggi.' : 'Errore nel caricamento dei messaggi.');
        setLoading(false);
      }
    }, (err) => {
      console.error("Errore snapshot messaggi:", err);
      setError(err.code === 'permission-denied' ? 'Permessi insufficienti per i messaggi.' : 'Errore nel caricamento dei messaggi.');
      setLoading(false);
    });

    unsubscribeRef.current = unsubscribe;
    return () => unsubscribe && unsubscribe();
  }, [selectedChatId]);

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
      const q = query(clientsRef, 
        where('name_lowercase', '>=', searchTerm), 
        where('name_lowercase', '<=', searchTerm + '\uf8ff'),
        orderBy('name_lowercase'),
        limit(10)
      );
      try {
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Risultati ricerca clienti:', { count: results.length, results });
        setSearchResults(results);
      } catch (error) {
        console.error("Errore nella ricerca:", error);
        setError(error.code === 'permission-denied' ? 'Permessi insufficienti per la ricerca clienti.' : 'Errore nella ricerca dei clienti.');
      }
      setIsSearching(false);
    };
    const debounceSearch = setTimeout(() => {
      searchClients();
    }, 300);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery]);

  // Scorri automaticamente all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inizializza chat
  const initializeChat = async (clientId) => {
    if (!user || !clientId) return;
    
    const generatedChatId = [user.uid, clientId].sort().join('_');
    setChatId(generatedChatId);

    try {
      const chatDocRef = doc(db, 'chats', generatedChatId);
      const clientDoc = await getDoc(doc(db, 'clients', clientId));
      const clientName = clientDoc.exists() ? clientDoc.data().name : 'Cliente';

      console.log('Inizializzazione chat:', { chatId: generatedChatId, clientId, clientName });

      await setDoc(chatDocRef, {
        participants: [user.uid, clientId],
        participantNames: {
          [user.uid]: user.displayName || 'Coach',
          [clientId]: clientName,
        },
        lastMessage: 'Conversazione iniziata',
        lastUpdate: serverTimestamp(),
      }, { merge: true });

      const messagesCollectionRef = collection(db, 'chats', generatedChatId, 'messages');
      const q = query(messagesCollectionRef, orderBy('createdAt'), limit(100));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
          const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Messaggi iniziali caricati:', { count: messagesData.length });
          setMessages(messagesData);
          setLoading(false);
        } catch (err) {
          console.error("Errore nello snapshot della chat:", err);
          setError(err.code === 'permission-denied' ? 'Permessi insufficienti per la chat.' : 'Errore nel caricamento dei messaggi.');
          setLoading(false);
        }
      }, (error) => {
        console.error("Errore snapshot messaggi:", error);
        setError(error.code === 'permission-denied' ? 'Permessi insufficienti per i messaggi.' : 'Errore nel caricamento dei messaggi.');
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Errore nell'inizializzazione della chat:", error);
      setError(error.code === 'permission-denied' ? 'Permessi insufficienti per avviare la chat.' : 'Errore nell\'avvio della chat.');
      setLoading(false);
    }
  };

  // Invia messaggio
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((newMessage.trim() === '' && pendingMedia.length === 0) || !chatId) return;

    const tempMessage = newMessage;
    const tempMedia = [...pendingMedia];
    setNewMessage('');
    setPendingMedia([]);

    try {
      const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
      const messageData = {
        text: tempMessage,
        createdAt: serverTimestamp(),
        senderId: user.uid,
      };

      // Add media if present
      if (tempMedia.length > 0) {
        messageData.media = tempMedia;
      }

      await addDoc(messagesCollectionRef, messageData);

      // Update last message preview
      const lastMsgPreview = tempMessage || (tempMedia.length > 0 ? `📎 ${tempMedia.length} file` : 'Messaggio');
      const chatDocRef = doc(db, 'chats', chatId);
      await setDoc(chatDocRef, {
        lastMessage: lastMsgPreview,
        lastUpdate: serverTimestamp(),
      }, { merge: true });
      console.log('Messaggio inviato:', { chatId, text: tempMessage, media: tempMedia.length });
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
      setError(error.code === 'permission-denied' ? 'Permessi insufficienti per inviare il messaggio.' : 'Errore nell\'invio del messaggio.');
    }
  };

  // Handle media upload
  const handleMediaUpload = (mediaUrl, mediaType, duration) => {
    setPendingMedia(prev => [...prev, { url: mediaUrl, type: mediaType, duration }]);
  };

  // Remove pending media
  const removePendingMedia = (index) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Selezione chat
  const handleSelectChat = (chatId) => {
    console.log('Selezionata chat:', chatId);
    setSelectedChatId(chatId);
    setChatId(chatId);
    setError('');
    setLoading(true);
  };

  // Avvia nuova chat
  const handleSelectClient = async (client) => {
    const newChatId = [client.id, user.uid].sort().join('_');
    const chatRef = doc(db, 'chats', newChatId);
    const existingChat = chats.find(chat => chat.id === newChatId);
    if (!existingChat) {
      try {
        await setDoc(chatRef, {
          participants: [client.id, user.uid],
          participantNames: { [client.id]: client.name, [user.uid]: user.displayName || 'Coach' },
          lastMessage: 'Conversazione iniziata',
          lastUpdate: serverTimestamp()
        }, { merge: true });
        console.log('Nuova chat creata:', newChatId);
      } catch (error) {
        console.error("Errore nella creazione della chat:", error);
        setError(error.code === 'permission-denied' ? 'Permessi insufficienti per creare la chat.' : 'Errore nella creazione della chat.');
      }
    }
    setSelectedChatId(newChatId);
    setChatId(newChatId);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Chiudi notifica
  const dismissError = () => setError('');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col h-screen relative">
      <Notification message={error} onDismiss={dismissError} />
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-900/70 backdrop-blur-lg border-b border-white/10 sticky top-0 z-[10]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/coach')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Dashboard</span>
          </button>
          <h1 className="text-xl font-bold text-slate-50">Chat</h1>
        </div>
      </header>
      {/* Area chat */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-8rem)]">
        <div className="w-full lg:w-1/3 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18}/>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca cliente..."
                className="w-full bg-slate-700/50 p-2 pl-10 rounded-lg border border-white/10 outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 text-sm sm:text-base"
              />
            </div>
            {searchQuery.length > 1 && (
              <div className="mt-2">
                {isSearching && <p className="p-4 text-slate-400 text-sm">Ricerca in corso...</p>}
                {!isSearching && searchResults.length === 0 && <p className="p-4 text-slate-400 text-sm">Nessun cliente trovato.</p>}
                {!isSearching && searchResults.map(client => (
                  <div key={client.id} onClick={() => handleSelectClient(client)} className="p-4 cursor-pointer hover:bg-white/5 transition-colors">
                    <p className="font-semibold text-slate-100">{client.name}</p>
                    <p className="text-sm text-slate-400">{client.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length > 0 ? (
              chats.map(chat => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  setSelectedChatId={handleSelectChat}
                  selectedChatId={selectedChatId}
                  coachUid={user.uid}
                />
              ))
            ) : (
              <p className="text-slate-400 text-center py-8">Nessuna conversazione disponibile.</p>
            )}
          </div>
        </div>
        <div className="w-full lg:w-2/3 flex flex-col bg-slate-800/50">
          {selectedChatId ? (
            <>
              <div className="p-4 border-b border-white/10">
                <h3 className="font-bold text-lg text-slate-50">
                  {chats.find(c => c.id === selectedChatId)?.participantNames?.[chats.find(c => c.id === selectedChatId)?.participants.find(p => p !== user.uid)] || 'Cliente'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {messages.length > 0 ? (
                  <AnimatePresence>
                    {messages.map(msg => {
                      const senderName = chats.find(c => c.id === selectedChatId)?.participantNames?.[msg.senderId] || 'Utente';
                      return (
                        <EnhancedChatMessage
                          key={msg.id}
                          message={msg}
                          isOwn={msg.senderId === user.uid}
                          senderName={msg.senderId !== user.uid ? senderName : null}
                        />
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  <p className="text-slate-400 text-center py-8">Nessun messaggio. Inizia la conversazione!</p>
                )}
                <div ref={messagesEndRef} />
              </div>
              <footer className="p-4 sm:p-6 bg-slate-900/70 backdrop-blur-lg border-t border-white/10 sticky bottom-0">
                {/* Pending media preview */}
                {pendingMedia.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 max-w-3xl mx-auto">
                    {pendingMedia.map((media, index) => (
                      <div key={index} className="relative group">
                        <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center">
                          {media.type === 'image' ? (
                            <img src={media.url} alt="preview" className="w-full h-full object-cover rounded-lg" />
                          ) : media.type === 'video' ? (
                            <span className="text-xs text-slate-400">📹 Video</span>
                          ) : (
                            <span className="text-xs text-slate-400">🎵 Audio</span>
                          )}
                        </div>
                        <button
                          onClick={() => removePendingMedia(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-3xl mx-auto">
                  {/* Media upload button */}
                  <MediaUploadButton
                    onUploadComplete={handleMediaUpload}
                    onUploadStart={() => setIsUploading(true)}
                    onUploadEnd={() => setIsUploading(false)}
                    folder="chat_media"
                    acceptedTypes="all"
                  />
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 p-3 bg-slate-700/50 border border-slate-600 rounded-full outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 text-sm sm:text-base transition-all placeholder:text-slate-500 shadow-sm"
                    disabled={isUploading}
                  />
                  <button
                    type="submit"
                    className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors disabled:bg-rose-900 disabled:cursor-not-allowed shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center"
                    disabled={(!newMessage.trim() && pendingMedia.length === 0) || isUploading}
                  >
                    <Send size={20} />
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-slate-500">
              <MessageSquare size={48} />
              <p className="mt-4">Seleziona una conversazione per iniziare.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}