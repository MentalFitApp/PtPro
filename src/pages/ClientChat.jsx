import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Spinner di caricamento
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
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
        <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
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
  const unsubscribeRef = useRef(null);

  // UID per Maurizio e Mattia
  const RECIPIENTS = [
    { uid: 'QwWST9OVOlTOi5oheyCqfpXLOLg2', name: 'Maurizio' },
    { uid: 'l0RI8TzFjbNVoAdmcXNQkP9mWb12', name: 'Mattia' },
  ];

  // Inizializza chat
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

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Errore nell'inizializzazione della chat:", error);
      setError("Errore nell'avvio della chat. Riprova.");
      setLoading(false);
    }
  };

  // Carica chat quando cambia destinatario
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!recipient) {
      setLoading(false);
      return;
    }

    // Cleanup snapshot precedente
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setMessages([]);
    setChatId(null);
    initializeChat(recipient.uid);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
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
    setError('');
    setLoading(true);
  };

  // Chiudi notifica
  const dismissError = () => setError('');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col h-screen relative">
      <Notification message={error} onDismiss={dismissError} />
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-900/50 backdrop-blur-xl border-b border-slate-700 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/client/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /><span>Dashboard</span>
          </button>
          <h1 className="text-xl font-bold text-slate-50">Chat</h1>
        </div>
        <select
          value={recipient ? recipient.uid : ''}
          onChange={handleRecipientChange}
          className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 shadow-md transition-shadow"
        >
          <option value="" disabled>Seleziona destinatario</option>
          {RECIPIENTS.map(r => (
            <option key={r.uid} value={r.uid}>{r.name}</option>
          ))}
        </select>
      </header>
      {/* Area messaggi */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-900/30">
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
                  <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                    msg.senderId === user.uid ? 'bg-rose-600/90 text-white rounded-br-none' : 'bg-cyan-600/90 text-white rounded-bl-none'
                  }`}>
                    <p className="break-words text-sm sm:text-base">{msg.text}</p>
                    <p className="text-xs text-slate-200/70 mt-1 text-right">
                      {msg.createdAt?.toDate().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <p className="text-slate-400 text-center py-8">Nessun messaggio. Inizia la conversazione!</p>
          )
        ) : (
          <p className="text-slate-400 text-center py-8">Seleziona un destinatario per iniziare la chat.</p>
        )}
        <div ref={messagesEndRef} />
      </main>
      {/* Footer con input */}
      <footer className="p-4 bg-slate-900/50 backdrop-blur-xl border-t border-slate-700 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 p-3 bg-slate-700/50 border border-slate-600 rounded-full outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 text-sm sm:text-base transition-all placeholder:text-slate-500 shadow-sm"
            disabled={!recipient}
          />
          <button
            type="submit"
            className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors disabled:bg-rose-900 disabled:cursor-not-allowed shadow-md"
            disabled={!newMessage.trim() || !recipient}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}