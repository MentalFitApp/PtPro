import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Spinner di caricamento
const LoadingSpinner = () => (
  <div className="min-h-screen bg-zinc-950 text-slate-200 flex flex-col justify-center items-center">
    <div className="w-12 h-12 rounded-full border-4 border-zinc-700 border-t-rose-500 animate-spin"></div>
    <p className="mt-4 text-slate-400">Caricamento chat...</p>
  </div>
);

// Notifica per errori
const Notification = ({ message, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border bg-red-900/80 text-red-300 border-red-500/30 backdrop-blur-md shadow-lg"
      >
        <AlertCircle size={20} />
        <p>{message}</p>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/10">
          <AlertCircle size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function ClientChat() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatId, setChatId] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const messagesEndRef = useRef(null);

  // UID per Maurizio (owner) e Mattia (coach)
  const RECIPIENTS = [
    { uid: 'QwWST9OVOlTOi5oheyCqfpXLOLg2', name: 'Maurizio (Owner)' },
    { uid: 'l0RI8TzFjbNVoAdmcxNQkP9mWb12', name: 'Mattia (Coach)' },
  ];

  // Inizializza chat se non esiste
  const initializeChat = async (recipientUid) => {
    if (!user || !recipientUid) return;
    
    const generatedChatId = [user.uid, recipientUid].sort().join('_');
    setChatId(generatedChatId);

    try {
      const chatDocRef = doc(db, 'chats', generatedChatId);
      const clientDoc = await getDoc(doc(db, 'clients', user.uid));
      const clientName = clientDoc.exists() ? clientDoc.data().name : user.email;

      await setDoc(chatDocRef, {
        participants: [user.uid, recipientUid],
        participantNames: {
          [user.uid]: clientName,
          [recipientUid]: RECIPIENTS.find(r => r.uid === recipientUid).name,
        },
        lastMessage: '',
        lastUpdate: serverTimestamp(),
      }, { merge: true });

      const messagesCollectionRef = collection(db, 'chats', generatedChatId, 'messages');
      const q = query(messagesCollectionRef, orderBy('createdAt'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(messagesData);
        setLoading(false);
      }, (error) => {
        console.error("Errore nello snapshot della chat:", error);
        setError("Errore: non hai accesso a questa chat. Contatta il supporto.");
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Errore nell'inizializzazione della chat:", error);
      setError("Errore nell'avvio della chat. Riprova.");
      setLoading(false);
    }
  };

  // Carica chat quando cambia destinatario
  useEffect(() => {
    if (!user) {
      navigate('/client-login');
      return;
    }

    if (!recipient) {
      setLoading(false);
      return;
    }

    const unsubscribe = initializeChat(recipient.uid);
    return () => unsubscribe && unsubscribe();
  }, [user, navigate, recipient]);

  // Scorri automaticamente all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Invia messaggio
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !chatId || !recipient) return;

    const tempMessage = newMessage;
    setNewMessage('');

    try {
      const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesCollectionRef, {
        text: tempMessage,
        createdAt: serverTimestamp(),
        senderId: user.uid,
      });

      const chatDocRef = doc(db, 'chats', chatId);
      const clientDoc = await getDoc(doc(db, 'clients', user.uid));
      const clientName = clientDoc.exists() ? clientDoc.data().name : user.email;

      await setDoc(chatDocRef, {
        lastMessage: tempMessage,
        lastUpdate: serverTimestamp(),
        participants: [user.uid, recipient.uid],
        participantNames: {
          [user.uid]: clientName,
          [recipient.uid]: recipient.name,
        },
      }, { merge: true });
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
      setError("Errore nell'invio del messaggio. Riprova.");
    }
  };

  // Selezione destinatario
  const handleRecipientChange = (e) => {
    const selectedUid = e.target.value;
    const selectedRecipient = RECIPIENTS.find(r => r.uid === selectedUid);
    setRecipient(selectedRecipient);
    setMessages([]);
    setChatId(null);
    setError('');
  };

  // Chiudi notifica
  const dismissError = () => setError('');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 font-sans flex flex-col h-screen relative">
      <AnimatedBackground />
      <Notification message={error} onDismiss={dismissError} />
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-zinc-950/70 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/client/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Dashboard</span>
          </button>
          <h1 className="text-xl font-bold text-slate-50">Chat</h1>
        </div>
        <select
          value={recipient ? recipient.uid : ''}
          onChange={handleRecipientChange}
          className="bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 text-slate-200"
        >
          <option value="" disabled>Seleziona destinatario</option>
          {RECIPIENTS.map(r => (
            <option key={r.uid} value={r.uid}>{r.name}</option>
          ))}
        </select>
      </header>
      {/* Area messaggi */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {recipient ? (
          messages.length > 0 ? (
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`max-w-[70%] sm:max-w-md p-3 rounded-2xl shadow-md ${
                    msg.senderId === user.uid ? 'bg-rose-600 rounded-br-none' : 'bg-zinc-800 rounded-bl-none'
                  }`}>
                    <p className="text-white break-words text-sm sm:text-base">{msg.text}</p>
                    <p className="text-xs text-slate-300/70 mt-1.5 text-right">
                      {msg.createdAt?.toDate().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <p className="text-slate-400 text-center">Nessun messaggio. Inizia la conversazione!</p>
          )
        ) : (
          <p className="text-slate-400 text-center">Seleziona un destinatario per iniziare la chat.</p>
        )}
        <div ref={messagesEndRef} />
      </main>
      {/* Footer con input */}
      <footer className="p-4 sm:p-6 bg-zinc-950/70 backdrop-blur-lg border-t border-white/10 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 p-3 bg-zinc-900 border border-zinc-700 rounded-full outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 text-sm sm:text-base transition-all"
            disabled={!recipient}
          />
          <button
            type="submit"
            className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors disabled:bg-rose-900 disabled:cursor-not-allowed"
            disabled={!newMessage.trim() || !recipient}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}