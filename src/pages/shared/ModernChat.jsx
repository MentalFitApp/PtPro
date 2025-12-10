// src/pages/shared/ModernChat.jsx
// Chat moderna stile WhatsApp/Telegram completamente ridisegnata
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { 
  collection, query, where, orderBy, onSnapshot, doc, addDoc, 
  serverTimestamp, setDoc, getDocs, getDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { getTenantCollection, getTenantDoc } from '../../config/tenant';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import {
  Send, Video, Phone, Search, Menu, Archive, Settings, Bell,
  Plus, X, ArrowLeft, Check, CheckCheck, Clock, User, Users,
  Image as ImageIcon, Paperclip, Mic, Smile, MoreVertical,
  Pin, Edit2, Trash2, Copy, Reply, Forward, Download,
  ChevronDown, Volume2, Camera, PhoneOff, MicOff, Monitor,
  MessageSquare, Play, Pause
} from 'lucide-react';

export default function ModernChat() {
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const toast = useToast();

  // ===== STATI PRINCIPALI =====
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  
  // ===== UI STATI =====
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(null); // ID del messaggio
  const [replyTo, setReplyTo] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  
  // Document title e keyboard shortcuts
  useDocumentTitle('Chat');
  useEscapeKey(() => {
    setShowNewChatModal(false);
    setShowChatMenu(false);
    setShowEmojiPicker(false);
  });
  
  // ===== MEDIA & UPLOAD =====
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRecorderRef = useRef(null);
  
  // ===== CHIAMATE =====
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' | 'voice'
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  // ===== TYPING INDICATOR =====
  const [usersTyping, setUsersTyping] = useState({});
  const typingTimeoutRef = useRef(null);

  // ===== LOAD USER PROFILE & ROLE =====
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadUserData = async () => {
      try {
        // Check role
        const adminDoc = await getDoc(getTenantDoc(db, 'roles', 'admins'));
        if (adminDoc.exists() && adminDoc.data().uids?.includes(currentUser.uid)) {
          setUserRole('admin');
        } else {
          const coachDoc = await getDoc(getTenantDoc(db, 'roles', 'coaches'));
          if (coachDoc.exists() && coachDoc.data().uids?.includes(currentUser.uid)) {
            setUserRole('coach');
          } else {
            setUserRole('client');
          }
        }

        // Load user profile
        const userDoc = await getDoc(getTenantDoc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Errore caricamento dati utente:', error);
      }
    };

    loadUserData();
  }, [currentUser, navigate]);

  // ===== LOAD ALL USERS =====
  useEffect(() => {
    if (!currentUser || !userRole) return;

    const loadUsers = async () => {
      try {
        // Carica i ruoli da roles/admins e roles/coaches
        const [adminDoc, coachDoc] = await Promise.all([
          getDoc(getTenantDoc(db, 'roles', 'admins')),
          getDoc(getTenantDoc(db, 'roles', 'coaches'))
        ]);
        
        const adminUids = adminDoc.exists() ? (adminDoc.data().uids || []) : [];
        const coachUids = coachDoc.exists() ? (coachDoc.data().uids || []) : [];
        
        // Carica tutti i profili utente
        const usersSnapshot = await getDocs(getTenantCollection(db, 'users'));
        let usersData = usersSnapshot.docs
          .map(docSnap => {
            const data = docSnap.data();
            // Determina il ruolo basandosi su roles collection
            let computedRole = 'client';
            if (adminUids.includes(docSnap.id)) {
              computedRole = 'admin';
            } else if (coachUids.includes(docSnap.id)) {
              computedRole = 'coach';
            }
            return {
              id: docSnap.id,
              ...data,
              role: computedRole, // Sovrascrive con il ruolo corretto
            };
          })
          .filter(u => u.displayName && u.id !== currentUser.uid); // Escludi te stesso

        // Filtra in base al ruolo dell'utente corrente
        if (userRole === 'client') {
          // I clienti vedono solo admin (con visibleInChat=true) e coach
          usersData = usersData.filter(u => {
            if (u.role === 'coach') return true; // Coach sempre visibili
            if (u.role === 'admin') {
              // Admin visibili solo se visibleInChat !== false (default true)
              return u.visibleInChat !== false;
            }
            return false;
          });
        } else if (userRole === 'coach') {
          // I coach vedono admin e clienti (non altri coach)
          usersData = usersData.filter(u => u.role === 'admin' || u.role === 'client');
        }
        // Gli admin vedono tutti (già filtrato solo currentUser)
        
        setAllUsers(usersData);
      } catch (error) {
        console.error('Errore caricamento utenti:', error);
      }
    };

    loadUsers();
  }, [currentUser, userRole]);

  // ===== LOAD CHATS =====
  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = getTenantCollection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatsData);

      // Aggiorna badge nav con somma degli unread
      const totalUnread = chatsData.reduce((sum, chat) => {
        const count = chat.unreadCount?.[currentUser.uid] || 0;
        return sum + (Number.isFinite(count) ? count : 0);
      }, 0);
      try {
        localStorage.setItem('ff_badge_chat', String(totalUnread));
        window.dispatchEvent(new Event('ff-badges-updated'));
      } catch (e) {
        console.debug('Impossibile salvare badge chat:', e);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ===== LOAD MESSAGES =====
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, getTenantCollection(db, 'chats').path, selectedChat.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      scrollToBottom();
      
      // Mark as read
      if (selectedChat.lastMessage?.senderId !== currentUser.uid) {
        markAsRead();
      }
    });

    return () => unsubscribe();
  }, [selectedChat, currentUser]);

  // ===== ONLINE STATUS =====
  useEffect(() => {
    if (!currentUser) return;

    // Set self online
    const statusRef = getTenantDoc(db, 'userStatus', currentUser.uid);
    setDoc(statusRef, {
      online: true,
      lastSeen: serverTimestamp()
    }, { merge: true });

    // Listen to all online statuses
    const statusesRef = getTenantCollection(db, 'userStatus');
    const unsubscribe = onSnapshot(statusesRef, (snapshot) => {
      const statuses = {};
      snapshot.docs.forEach(doc => {
        statuses[doc.id] = doc.data();
      });
      setOnlineUsers(statuses);
    });

    // Set offline on unmount
    return () => {
      setDoc(statusRef, {
        online: false,
        lastSeen: serverTimestamp()
      }, { merge: true });
      unsubscribe();
    };
  }, [currentUser]);

  // ===== HELPER FUNCTIONS =====
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markAsRead = async () => {
    if (!selectedChat) return;
    try {
      await updateDoc(getTenantDoc(db, 'chats', selectedChat.id), {
        [`unreadCount.${currentUser.uid}`]: 0
      });
    } catch (error) {
      console.error('Errore mark as read:', error);
    }
  };

  const getOtherUser = (chat) => {
    if (!chat || !currentUser) return null;
    const otherUserId = chat.participants?.find(id => id !== currentUser.uid);
    return allUsers.find(u => u.id === otherUserId);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Today
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // This week
      return date.toLocaleDateString('it-IT', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    }
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messagesRef = collection(db, getTenantCollection(db, 'chats').path, selectedChat.id, 'messages');
      
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || currentUser.displayName || currentUser.email,
        senderPhoto: userProfile?.photoURL || currentUser.photoURL || null,
        timestamp: serverTimestamp(),
        read: false,
        replyTo: replyTo || null
      };

      await addDoc(messagesRef, messageData);

      // Update chat last message
      await updateDoc(getTenantDoc(db, 'chats', selectedChat.id), {
        lastMessage: {
          text: newMessage.trim(),
          senderId: currentUser.uid,
          timestamp: serverTimestamp()
        },
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${selectedChat.participants.find(id => id !== currentUser.uid)}`]: 
          (selectedChat.unreadCount?.[selectedChat.participants.find(id => id !== currentUser.uid)] || 0) + 1
      });

      setNewMessage('');
      setReplyTo(null);
      scrollToBottom();
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      toast.error('Errore durante l\'invio del messaggio');
    }
  };

  // ===== CREATE NEW CHAT =====
  const createChat = async (otherUser) => {
    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.participants?.includes(otherUser.id)
      );

      if (existingChat) {
        setSelectedChat(existingChat);
        setShowNewChatModal(false);
        return;
      }

      // Create new chat
      const chatsRef = getTenantCollection(db, 'chats');
      const newChatDoc = await addDoc(chatsRef, {
        participants: [currentUser.uid, otherUser.id],
        participantsData: {
          [currentUser.uid]: {
            name: userProfile?.displayName || currentUser.displayName,
            photo: userProfile?.photoURL || currentUser.photoURL
          },
          [otherUser.id]: {
            name: otherUser.displayName,
            photo: otherUser.photoURL
          }
        },
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [currentUser.uid]: 0,
          [otherUser.id]: 0
        }
      });

      // Create profile entries if not exist
      const currentUserRef = getTenantDoc(db, 'users', currentUser.uid);
      const otherUserRef = getTenantDoc(db, 'users', otherUser.id);

      await setDoc(currentUserRef, {
        uid: currentUser.uid,
        displayName: userProfile?.displayName || currentUser.displayName || currentUser.email,
        photoURL: userProfile?.photoURL || currentUser.photoURL || '',
        email: currentUser.email,
        role: userRole
      }, { merge: true });

      await setDoc(otherUserRef, {
        uid: otherUser.id,
        displayName: otherUser.displayName,
        photoURL: otherUser.photoURL || '',
        email: otherUser.email,
        role: otherUser.role
      }, { merge: true });

      const newChat = {
        id: newChatDoc.id,
        participants: [currentUser.uid, otherUser.id],
        participantsData: {
          [currentUser.uid]: {
            name: userProfile?.displayName || currentUser.displayName,
            photo: userProfile?.photoURL || currentUser.photoURL
          },
          [otherUser.id]: {
            name: otherUser.displayName,
            photo: otherUser.photoURL
          }
        }
      };

      setSelectedChat(newChat);
      setShowNewChatModal(false);
    } catch (error) {
      console.error('Errore creazione chat:', error);
      toast.error('Errore durante la creazione della chat');
    }
  };

  // ===== UPLOAD FILE =====
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `chat-media/${selectedChat.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileURL = await getDownloadURL(storageRef);

      const messagesRef = collection(db, getTenantCollection(db, 'chats').path, selectedChat.id, 'messages');
      await addDoc(messagesRef, {
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileURL,
        fileName: file.name,
        fileSize: file.size,
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || currentUser.displayName,
        senderPhoto: userProfile?.photoURL || currentUser.photoURL,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update last message
      await updateDoc(getTenantDoc(db, 'chats', selectedChat.id), {
        lastMessage: {
          text: file.type.startsWith('image/') ? '📷 Immagine' : '📎 File',
          senderId: currentUser.uid,
          timestamp: serverTimestamp()
        },
        lastMessageTime: serverTimestamp()
      });

      scrollToBottom();
    } catch (error) {
      console.error('Errore upload file:', error);
      toast.error('Errore durante l\'upload del file');
    } finally {
      setUploading(false);
    }
  };

  // ===== VOICE RECORDING =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const storageRef = ref(storage, `voice-notes/${selectedChat.id}/${Date.now()}.webm`);
        await uploadBytes(storageRef, blob);
        const audioURL = await getDownloadURL(storageRef);

        const messagesRef = collection(db, getTenantCollection(db, 'chats').path, selectedChat.id, 'messages');
        await addDoc(messagesRef, {
          type: 'voice',
          audioURL,
          duration: recordingTime,
          senderId: currentUser.uid,
          senderName: userProfile?.displayName || currentUser.displayName,
          timestamp: serverTimestamp(),
          read: false
        });

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingTime(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      audioRecorderRef.current = interval;
    } catch (error) {
      console.error('Errore registrazione audio:', error);
      toast.error('Errore durante la registrazione audio');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      clearInterval(audioRecorderRef.current);
    }
  };

  // ===== TYPING INDICATOR =====
  const handleTyping = () => {
    if (!selectedChat) return;

    const typingRef = getTenantDoc(db, 'chats', selectedChat.id);
    updateDoc(typingRef, {
      [`typing.${currentUser.uid}`]: true
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(typingRef, {
        [`typing.${currentUser.uid}`]: false
      });
    }, 3000);
  };

  // ===== FILTER CHATS =====
  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const otherUser = getOtherUser(chat);
    return otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ===== RENDER =====
  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex overflow-hidden">
      {/* ===== SIDEBAR MENU (Desktop) ===== */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex flex-col bg-slate-800 border-r border-slate-700"
          >
            {/* Profile */}
            <button
              onClick={() => {
                const profilePath = userRole === 'admin' ? '/profile' : 
                                   userRole === 'coach' ? '/coach/profile' : '/client/profile';
                navigate(profilePath);
              }}
              className="p-4 hover:bg-slate-700 transition-colors group relative"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-500/30 group-hover:ring-blue-500 transition-all mx-auto">
                <img
                  src={userProfile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.displayName || 'User')}&background=3b82f6&color=fff`}
                  alt="Profilo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                Profilo
              </div>
            </button>

            {/* New Chat */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-4 hover:bg-slate-700 transition-colors group relative"
            >
              <Plus className="text-slate-400 group-hover:text-blue-400 transition-colors mx-auto" size={24} />
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                Nuova Chat
              </div>
            </button>

            <div className="flex-1" />

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="p-4 hover:bg-slate-700 transition-colors group relative"
            >
              <Settings className="text-slate-400 group-hover:text-white transition-colors mx-auto" size={24} />
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                Impostazioni
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CHATS LIST ===== */}
      <div className={`${selectedChat ? 'hidden lg:flex' : 'flex'} flex-col bg-slate-800/50 w-full lg:w-96 border-r border-slate-700`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white">Chat</h2>
            {/* Pulsante Nuova Chat - visibile su mobile */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              title="Nuova chat"
            >
              <Plus className="text-white" size={18} />
              <span className="text-white text-sm hidden sm:inline">Nuova</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="text-slate-600 mb-4" size={48} />
              <p className="text-slate-400 mb-2">Nessuna chat</p>
              <p className="text-slate-500 text-sm">Inizia una nuova conversazione</p>
            </div>
          ) : (
            filteredChats.map(chat => {
              const otherUser = getOtherUser(chat);
              const isOnline = onlineUsers[otherUser?.id]?.online;
              const unreadCount = chat.unreadCount?.[currentUser.uid] || 0;

              return (
                <motion.button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 flex gap-3 ${
                    selectedChat?.id === chat.id ? 'bg-slate-700' : ''
                  }`}
                  whileHover={{ x: 4 }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-slate-600">
                      <img
                        src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.displayName || 'User')}&background=random`}
                        alt={otherUser?.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-slate-800" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-white truncate">{otherUser?.displayName || 'Utente'}</h3>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400 truncate">
                        {chat.lastMessage?.senderId === currentUser.uid && (
                          <CheckCheck className="inline mr-1" size={14} />
                        )}
                        {chat.lastMessage?.text || 'Nuova chat'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* ===== CHAT AREA ===== */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-slate-900">
          {/* Chat Header */}
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-white" size={20} />
              </button>

              {(() => {
                const otherUser = getOtherUser(selectedChat);
                const isOnline = onlineUsers[otherUser?.id]?.online;
                const lastSeen = onlineUsers[otherUser?.id]?.lastSeen;

                return (
                  <>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-600">
                        <img
                          src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.displayName || 'User')}&background=random`}
                          alt={otherUser?.displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-slate-800" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{otherUser?.displayName || 'Utente'}</h3>
                      <p className="text-xs text-slate-400">
                        {isOnline ? 'Online' : lastSeen ? `Visto ${formatTime(lastSeen)}` : 'Offline'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Video className="text-slate-400 hover:text-white" size={20} />
              </button>
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Phone className="text-slate-400 hover:text-white" size={20} />
              </button>
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Search className="text-slate-400 hover:text-white" size={20} />
              </button>
              <button 
                onClick={() => setShowChatMenu(!showChatMenu)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <MoreVertical className="text-slate-400 hover:text-white" size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUser.uid;
              const showDate = index === 0 || 
                (messages[index - 1] && 
                 new Date(messages[index - 1].timestamp?.toDate()).toDateString() !== 
                 new Date(msg.timestamp?.toDate()).toDateString());

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
                        {new Date(msg.timestamp?.toDate()).toLocaleDateString('it-IT', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {msg.replyTo && (
                        <div className="mb-1 px-3 py-2 bg-slate-800/50 border-l-2 border-blue-500 rounded text-xs text-slate-400">
                          <p className="font-medium text-blue-400 mb-1">Risposta a:</p>
                          <p className="truncate">{msg.replyTo.text}</p>
                        </div>
                      )}

                      <div
                        className={`relative group px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setShowMessageMenu(msg.id);
                        }}
                      >
                        {msg.type === 'image' && (
                          <img
                            src={msg.fileURL}
                            alt="Immagine"
                            className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90"
                            onClick={() => window.open(msg.fileURL, '_blank')}
                          />
                        )}

                        {msg.type === 'file' && (
                          <div className="flex items-center gap-3 mb-2 p-3 bg-black/20 rounded-lg">
                            <Paperclip size={20} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{msg.fileName}</p>
                              <p className="text-xs opacity-70">{(msg.fileSize / 1024).toFixed(2)} KB</p>
                            </div>
                            <button
                              onClick={() => window.open(msg.fileURL, '_blank')}
                              className="p-2 hover:bg-white/10 rounded-lg"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        )}

                        {msg.type === 'voice' && (
                          <div className="flex items-center gap-3 mb-2">
                            <button className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                              <Play size={18} />
                            </button>
                            <div className="flex-1 h-1 bg-white/20 rounded-full">
                              <div className="h-full bg-white/50 rounded-full" style={{ width: '30%' }} />
                            </div>
                            <span className="text-xs">{msg.duration}s</span>
                          </div>
                        )}

                        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(msg.timestamp)}
                          </span>
                          {isOwn && (
                            msg.read ? 
                              <CheckCheck size={14} className="opacity-70" /> : 
                              <Check size={14} className="opacity-70" />
                          )}
                        </div>

                        {/* Message Menu */}
                        {showMessageMenu === msg.id && (
                          <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 min-w-[150px]">
                            <button
                              onClick={() => {
                                setReplyTo(msg);
                                setShowMessageMenu(null);
                              }}
                              className="w-full px-4 py-2 hover:bg-slate-700 flex items-center gap-2 text-sm text-white"
                            >
                              <Reply size={16} />
                              Rispondi
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                setShowMessageMenu(null);
                              }}
                              className="w-full px-4 py-2 hover:bg-slate-700 flex items-center gap-2 text-sm text-white"
                            >
                              <Copy size={16} />
                              Copia
                            </button>
                            {isOwn && (
                              <button
                                onClick={async () => {
                                  if (confirm('Eliminare questo messaggio?')) {
                                    await deleteDoc(doc(db, getTenantCollection(db, 'chats').path, selectedChat.id, 'messages', msg.id));
                                    setShowMessageMenu(null);
                                  }
                                }}
                                className="w-full px-4 py-2 hover:bg-slate-700 flex items-center gap-2 text-sm text-red-400"
                              >
                                <Trash2 size={16} />
                                Elimina
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-800 border-t border-slate-700">
            {replyTo && (
              <div className="mb-2 px-3 py-2 bg-slate-700 border-l-2 border-blue-500 rounded flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-400 font-medium mb-1">Risposta a:</p>
                  <p className="text-sm text-slate-300 truncate">{replyTo.text}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-600 rounded">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            )}

            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Paperclip className="text-slate-400 hover:text-white" size={20} />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Scrivi un messaggio..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {newMessage.trim() ? (
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Send className="text-white" size={20} />
                </motion.button>
              ) : (
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2 ${isRecording ? 'bg-red-600' : 'bg-slate-700 hover:bg-slate-600'} rounded-lg transition-colors`}
                >
                  <Mic className="text-white" size={20} />
                </button>
              )}
            </form>

            {isRecording && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Registrazione in corso... {recordingTime}s
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-900">
          <div className="text-center">
            <MessageSquare className="text-slate-700 mb-4 mx-auto" size={64} />
            <h3 className="text-xl font-semibold text-white mb-2">Seleziona una chat</h3>
            <p className="text-slate-400">Scegli una conversazione dalla lista</p>
          </div>
        </div>
      )}

      {/* ===== NEW CHAT MODAL ===== */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full max-h-[600px] flex flex-col"
            >
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Nuova Chat</h3>
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="text-slate-400" size={20} />
                  </button>
                </div>
                
                {/* Search Users */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Cerca utenti..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {(() => {
                  const filteredUsers = allUsers.filter(user => 
                    !searchQuery || 
                    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (filteredUsers.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Users className="text-slate-600 mb-4" size={48} />
                        <p className="text-slate-400 mb-2">Nessun utente trovato</p>
                        <p className="text-slate-500 text-sm">Prova con un altro nome</p>
                      </div>
                    );
                  }

                  return filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => createChat(user)}
                      className="w-full p-3 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-600">
                        <img
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`}
                          alt={user.displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-white">{user.displayName}</h4>
                        <p className="text-sm text-slate-400">{user.role || 'Utente'}</p>
                      </div>
                    </button>
                  ));
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
