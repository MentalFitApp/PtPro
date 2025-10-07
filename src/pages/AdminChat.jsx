import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, serverTimestamp, setDoc, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase.js';
// --- 1. NUOVE ICONE DA LUCIDE-REACT ---
import { Send, MessageSquare, Search } from 'lucide-react';
import { motion } from 'framer-motion';

// --- 2. SPINNER AGGIORNATO CON IL NUOVO COLORE ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
    </div>
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
    const messagesEndRef = useRef(null);

    const auth = getAuth();
    const adminUser = auth.currentUser;
    const adminUIDs = ["QwWST9OVOlTOi5oheyCqfpXLOLg2", "AeZKjJYu5zMZ4mvffaGiqCBb0cF2", "3j0AXIRa4XdHq1ywCl4UBxJNsku2", "l0RI8TzFjbNVoAdmcxNQkP9mWb12"];

    useEffect(() => {
        if (!adminUser) return;
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains-any', adminUIDs), orderBy('lastUpdate', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingChats(false);
        }, (error) => {
            console.error("Errore nel caricare le chat:", error);
            setLoadingChats(false);
        });
        return () => unsubscribe();
    }, [adminUser]);

    useEffect(() => {
        if (!selectedChatId) { setMessages([]); return; }
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
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
                console.error("Errore nella ricerca (indice Firestore mancante?):", error);
            }
            setIsSearching(false);
        };
        const debounceSearch = setTimeout(() => {
            searchClients();
        }, 300);
        return () => clearTimeout(debounceSearch);
    }, [searchQuery]);

    const handleSelectClient = async (client) => {
        if (!adminUser) return;
        const primaryAdminUID = adminUIDs[0];
        const newChatId = [client.id, primaryAdminUID].sort().join('_');
        
        const chatRef = doc(db, 'chats', newChatId);
        const existingChat = chats.find(chat => chat.id === newChatId);
        if (!existingChat) {
             await setDoc(chatRef, {
                participants: [client.id, primaryAdminUID],
                participantNames: { [client.id]: client.name, [primaryAdminUID]: "Coach" },
                lastMessage: "Conversazione iniziata",
                lastUpdate: serverTimestamp()
            }, { merge: true });
        }
        setSelectedChatId(newChatId);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !selectedChatId || !adminUser) return;
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
    };

    const getSelectedChatName = () => {
        if (!selectedChatId) return 'Chat';
        const chat = chats.find(c => c.id === selectedChatId);
        if (!chat) return 'Chat';
        const clientUID = chat.participants.find(p => !adminUIDs.includes(p));
        return chat.participantNames?.[clientUID] || 'Cliente';
    };
    
    return (
        // --- 3. CONTAINER PRINCIPALE CON STILI AGGIORNATI ---
        <div className="flex h-[calc(100vh-120px)] bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border overflow-hidden">
            <div className="w-1/3 border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18}/>
                        <input
                            type="text"
                            placeholder="Cerca o avvia una chat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900/70 p-2 pl-10 rounded-lg border border-white/10 outline-none focus:ring-2 focus:ring-rose-500 text-slate-200"
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
                    <>
                        {loadingChats ? <LoadingSpinner /> : (
                            <div className="flex-1 overflow-y-auto">
                                {chats.map(chat => {
                                    const clientUID = chat.participants.find(p => !adminUIDs.includes(p));
                                    const clientName = chat.participantNames ? chat.participantNames[clientUID] : 'Cliente';
                                    return (
                                        <div
                                            key={chat.id}
                                            onClick={() => setSelectedChatId(chat.id)}
                                            className={`p-4 cursor-pointer border-l-4 transition-colors ${selectedChatId === chat.id ? 'bg-rose-600/20 border-rose-500' : 'border-transparent hover:bg-white/5'}`}
                                        >
                                            <p className="font-semibold text-slate-100">{clientName || 'Cliente'}</p>
                                            <p className="text-sm text-slate-400 truncate">{chat.lastMessage}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <div className="w-2/3 flex flex-col bg-zinc-900/50">
                {selectedChatId ? (
                    <>
                        <div className="p-4 border-b border-white/10">
                             <h3 className="font-bold text-lg text-slate-50">{getSelectedChatName()}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                           {loadingMessages ? <LoadingSpinner /> : messages.map(msg => (
                               <div key={msg.id} className={`flex ${adminUIDs.includes(msg.senderId) ? 'justify-end' : 'justify-start'}`}>
                                   <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`max-w-md p-3 rounded-2xl text-slate-100 ${adminUIDs.includes(msg.senderId) ? 'bg-rose-600 rounded-br-none' : 'bg-zinc-800 rounded-bl-none'}`}
                                    >
                                       <p className="break-words">{msg.text}</p>
                                   </motion.div>
                               </div>
                           ))}
                           <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-white/10">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Scrivi una risposta..."
                                    className="flex-1 p-3 bg-zinc-800 border border-white/10 rounded-full outline-none focus:ring-2 focus:ring-rose-500 text-white"
                                />
                                <button type="submit" className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors disabled:opacity-50" disabled={!newMessage.trim()}>
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
        </div>
    );
};

export default AdminChat;
