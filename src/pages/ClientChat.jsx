import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
// --- 1. IMPORTIAMO LE NUOVE ICONE ---
import { ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Spinner di caricamento aggiornato con il nuovo stile
const LoadingSpinner = () => (
    <div className="min-h-screen bg-zinc-950 text-slate-200 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-700 border-t-rose-500 animate-spin"></div>
        <p className="mt-4 text-slate-400">Caricamento chat...</p>
    </div>
);

const ClientChat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatId, setChatId] = useState(null);
    const messagesEndRef = useRef(null);
    
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    // UID dell'admin per la chat (invariato)
    const ADMIN_UID = "QwWST9OVOlTOi5oheyCqfpXLOLg2";

    useEffect(() => {
        if (!user) {
            navigate('/client-login');
            return;
        }

        const generatedChatId = [user.uid, ADMIN_UID].sort().join('_');
        setChatId(generatedChatId);

        const messagesCollectionRef = collection(db, 'chats', generatedChatId, 'messages');
        const q = query(messagesCollectionRef, orderBy('createdAt'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(messagesData);
            setLoading(false);
        }, (error) => {
            console.error("Errore nello snapshot della chat: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !chatId) return;

        const tempMessage = newMessage;
        setNewMessage(''); // Svuota l'input immediatamente per una UI più reattiva

        const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesCollectionRef, {
            text: tempMessage,
            createdAt: serverTimestamp(),
            senderId: user.uid
        });

        const chatDocRef = doc(db, 'chats', chatId);
        const clientDoc = await getDoc(doc(db, 'clients', user.uid));
        const clientName = clientDoc.exists() ? clientDoc.data().name : user.email;

        await setDoc(chatDocRef, {
            lastMessage: tempMessage,
            lastUpdate: serverTimestamp(),
            participants: [user.uid, ADMIN_UID],
            clientName: clientName,
            participantNames: {
                [user.uid]: clientName,
                [ADMIN_UID]: "Coach"
            }
        }, { merge: true });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-slate-200 font-sans flex flex-col h-screen">
            {/* --- 2. HEADER CON NUOVO STILE --- */}
            <header className="flex justify-between items-center p-4 bg-zinc-950/70 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-50">Chat con il Coach</h1>
                <button
                    onClick={() => navigate('/client/dashboard')}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
                >
                    <ArrowLeft size={16} /><span>Dashboard</span>
                </button>
            </header>

            {/* --- 3. AREA MESSAGGI RIDISEGNATA --- */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map(msg => (
                        <motion.div 
                            key={msg.id} 
                            className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.senderId === user.uid ? 'bg-rose-600 rounded-br-none' : 'bg-zinc-800 rounded-bl-none'}`}>
                                <p className="text-white break-words">{msg.text}</p>
                                <p className="text-xs text-slate-300/70 mt-1.5 text-right">
                                    {msg.createdAt?.toDate().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </main>

            {/* --- 4. FOOTER E FORM INPUT AGGIORNATI --- */}
            <footer className="p-4 bg-zinc-950/70 backdrop-blur-lg border-t border-white/10 sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Scrivi un messaggio..."
                        className="flex-1 p-3 bg-zinc-900 border border-zinc-700 rounded-full outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 transition-all"
                    />
                    <button type="submit" className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors disabled:bg-rose-900 disabled:cursor-not-allowed" disabled={!newMessage.trim()}>
                        <Send size={20} />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ClientChat;
