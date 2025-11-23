import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, serverTimestamp, setDoc, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { Send, Video, Search, Plus, Phone, MessageSquare, X, ArrowLeft, Check, CheckCheck, UserPlus, Users, Image as ImageIcon, Mic, Paperclip, Play, Pause, Camera, CameraOff, Mic as MicOn, MicOff, Monitor, PhoneOff, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import DailyIframe from '@daily-co/daily-js';
import { DailyProvider, useParticipantIds, useParticipant, useDaily, useScreenShare, useLocalParticipant, useVideoTrack, useAudioTrack } from '@daily-co/daily-react';

export default function UnifiedChat() {
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Stati principali
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifica MainLayout quando una chat è selezionata (per nascondere bottom nav su mobile)
  useEffect(() => {
    if (selectedChat) {
      window.dispatchEvent(new CustomEvent('chatSelected', { detail: true }));
    } else {
      window.dispatchEvent(new CustomEvent('chatSelected', { detail: false }));
    }
  }, [selectedChat]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [userRole, setUserRole] = useState(null); // 'admin', 'coach', 'client'
  
  // Stati per media
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [userProfile, setUserProfile] = useState(null);

  // Determina ruolo utente
  useEffect(() => {
    if (!currentUser) return;

    const checkRole = async () => {
      try {
        // Controlla se è admin
        const adminDoc = await getDoc(getTenantDoc(db, 'roles', 'admins'));
        if (adminDoc.exists() && adminDoc.data().uids?.includes(currentUser.uid)) {
          setUserRole('admin');
        } else {
          // Controlla se è coach
          const coachDoc = await getDoc(getTenantDoc(db, 'roles', 'coaches'));
          if (coachDoc.exists() && coachDoc.data().uids?.includes(currentUser.uid)) {
            setUserRole('coach');
          } else {
            // Altrimenti è client
            setUserRole('client');
          }
        }

        // Carica profilo utente
        const userDoc = await getDoc(getTenantDoc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);
        }

        setProfileComplete(true); // Sempre completo senza controlli community
      } catch (error) {
        console.error('Errore caricamento profilo:', error);
        setProfileComplete(true); // Permetti accesso anche in caso di errore
      } finally {
        setCheckingProfile(false);
      }
    };

    checkRole();
  }, [currentUser]);

  // Gestisce presenza online (aggiorna quando l'utente è attivo)
  useEffect(() => {
    if (!currentUser) return;

    const userStatusRef = getTenantDoc(db, 'userStatus', currentUser.uid);

    // Imposta online quando monta il componente
    const setOnline = async () => {
      await setDoc(userStatusRef, {
        online: true,
        lastSeen: serverTimestamp(),
      }, { merge: true });
    };

    setOnline();

    // Imposta offline quando smonta o l'utente chiude la pagina
    const setOffline = async () => {
      await setDoc(userStatusRef, {
        online: false,
        lastSeen: serverTimestamp(),
      }, { merge: true });
    };

    // Listener per visibilità pagina
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', setOffline);

    // Heartbeat ogni 30 secondi per mantenere lo stato online
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        setOnline();
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [currentUser]);

  // Ascolta stati online di tutti gli utenti
  useEffect(() => {
    const unsubscribe = onSnapshot(getTenantCollection(db, 'userStatus'), (snapshot) => {
      const statusMap = {};
      snapshot.docs.forEach((doc) => {
        statusMap[doc.id] = doc.data();
      });
      setOnlineUsers(statusMap);
    });

    return () => unsubscribe();
  }, []);

  // Carica tutti gli utenti dalla community
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(getTenantCollection(db, 'users'));
        const usersData = usersSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(u => u.name && u.id !== currentUser.uid); // Escludi te stesso
        
        setAllUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error('Errore caricamento utenti:', error);
      }
    };

    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

  // Carica le chat
  useEffect(() => {
    if (!currentUser) return;

    const chatsQuery = query(
      getTenantCollection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastUpdate', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Carica messaggi della chat selezionata
  useEffect(() => {
    if (!selectedChat) return;

    const messagesQuery = query(
      getTenantSubcollection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Scroll automatico
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Ricerca utenti
  const handleSearchUsers = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(user =>
      user.name?.toLowerCase().includes(query.toLowerCase()) ||
      user.email?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // Crea o apri chat con utente
  const handleStartChat = async (otherUser) => {
    try {
      // Controlla se esiste già una chat
      const existingChat = chats.find(chat =>
        chat.participants.includes(otherUser.id)
      );

      if (existingChat) {
        setSelectedChat(existingChat);
        setShowNewChatModal(false);
        return;
      }

      // Crea nuova chat
      const newChatRef = await addDoc(getTenantCollection(db, 'chats'), {
        participants: [currentUser.uid, otherUser.id],
        participantsData: {
          [currentUser.uid]: {
            name: currentUser.displayName || 'Tu',
            photoURL: currentUser.photoURL || '',
          },
          [otherUser.id]: {
            name: otherUser.name,
            photoURL: otherUser.photoURL || '',
          },
        },
        lastMessage: '',
        lastUpdate: serverTimestamp(),
        unreadCount: {
          [currentUser.uid]: 0,
          [otherUser.id]: 0,
        },
        createdAt: serverTimestamp(),
      });

      // Apri la nuova chat
      const newChat = {
        id: newChatRef.id,
        participants: [currentUser.uid, otherUser.id],
        participantsData: {
          [currentUser.uid]: {
            name: currentUser.displayName || 'Tu',
            photoURL: currentUser.photoURL || '',
          },
          [otherUser.id]: {
            name: otherUser.name,
            photoURL: otherUser.photoURL || '',
          },
        },
        lastMessage: '',
        lastUpdate: new Date(),
      };

      setSelectedChat(newChat);
      setShowNewChatModal(false);
      
      // Su mobile, assicurati che la sidebar sia nascosta
      // e l'area messaggi sia visibile
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Errore creazione chat:', error);
      alert('Errore durante la creazione della chat');
    }
  };

  // Invia messaggio
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      await addDoc(getTenantSubcollection(db, 'chats', selectedChat.id, 'messages'), {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Utente',
        senderPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        read: false,
      });

      // Aggiorna lastMessage della chat
      await updateDoc(getTenantDoc(db, 'chats', selectedChat.id), {
        lastMessage: newMessage.trim(),
        lastUpdate: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      alert('Errore durante l\'invio del messaggio');
    } finally {
      setSending(false);
    }
  };

  // Ottieni dati altro utente
  const getOtherUser = (chat) => {
    if (!chat) return null;
    const otherUserId = chat.participants.find(p => p !== currentUser.uid);
    return chat.participantsData?.[otherUserId] || { name: 'Utente', photoURL: '' };
  };

  // Controlla se un utente è online
  const isUserOnline = (userId) => {
    return onlineUsers[userId]?.online === true;
  };

  // Stati per videocall e chiamate vocali con Daily.co
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState(null);
  const [voiceCallRoom, setVoiceCallRoom] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [dailyCallObject, setDailyCallObject] = useState(null);
  const callTimerRef = useRef(null);
  const activeCallMessageRef = useRef(null);

  // Listener per notifiche videocall e voicecall in arrivo
  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      getTenantCollection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('type', 'in', ['videocall', 'voicecall']),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const notification = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };
        setIncomingCall(notification);
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Apri videocall - crea stanza Daily.co e invia notifica
  const handleStartVideoCall = async () => {
    if (!selectedChat) return;

    const otherUserId = selectedChat.participants.find(p => p !== currentUser.uid);

    try {
      // Crea stanza Daily.co
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          name: `videocall_${selectedChat.id}_${Date.now()}`,
          privacy: 'public',
          properties: {
            max_participants: 2,
            enable_chat: false,
            enable_screenshare: true,
            enable_recording: false,
            start_video_off: false,
            start_audio_off: false,
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Errore creazione stanza Daily.co');
      }

      const roomData = await response.json();
      const roomUrl = roomData.url;

      // Invia messaggio sistema nella chat
      const callMessageRef = await addDoc(getTenantSubcollection(db, 'chats', selectedChat.id, 'messages'), {
        type: 'call',
        callType: 'video',
        callStatus: 'calling',
        roomUrl: roomUrl,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Utente',
        senderPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        read: false,
      });

      // Crea notifica per l'altro utente
      await addDoc(getTenantCollection(db, 'notifications'), {
        userId: otherUserId,
        type: 'videocall',
        title: 'Videochiamata in arrivo',
        message: `${currentUser.displayName || 'Un utente'} sta chiamando...`,
        roomUrl: roomUrl,
        callMessageId: callMessageRef.id,
        callerId: currentUser.uid,
        callerName: currentUser.displayName || 'Utente',
        callerPhoto: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(getTenantDoc(db, 'chats', selectedChat.id), {
        lastMessage: '📹 Videochiamata',
        lastUpdate: serverTimestamp(),
      });

      // Salva riferimento per gestire la chiusura
      activeCallMessageRef.current = { chatId: selectedChat.id, messageId: callMessageRef.id };

      // Apri modal con Daily.co
      setVideoCallRoom(roomUrl);
      setShowVideoCallModal(true);
      initializeDailyCall(roomUrl);
    } catch (error) {
      console.error('Errore avvio videocall:', error);
      alert('Errore durante l\'avvio della videochiamata');
    }
  };

  // Chiamata vocale (solo audio) con Daily.co
  const handleStartVoiceCall = async () => {
    if (!selectedChat) return;

    const otherUserId = selectedChat.participants.find(p => p !== currentUser.uid);

    try {
      // Crea stanza Daily.co per chiamata vocale
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          name: `voicecall_${selectedChat.id}_${Date.now()}`,
          privacy: 'public',
          properties: {
            max_participants: 2,
            enable_chat: false,
            enable_screenshare: false,
            enable_recording: false,
            start_video_off: true,
            start_audio_off: false,
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Errore creazione stanza Daily.co');
      }

      const roomData = await response.json();
      const roomUrl = roomData.url;

      // Invia messaggio sistema nella chat
      const callMessageRef = await addDoc(getTenantSubcollection(db, 'chats', selectedChat.id, 'messages'), {
        type: 'call',
        callType: 'voice',
        callStatus: 'calling',
        roomUrl: roomUrl,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Utente',
        senderPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        read: false,
      });

      await addDoc(getTenantCollection(db, 'notifications'), {
        userId: otherUserId,
        type: 'voicecall',
        title: 'Chiamata vocale in arrivo',
        message: `${currentUser.displayName || 'Un utente'} sta chiamando...`,
        roomUrl: roomUrl,
        callMessageId: callMessageRef.id,
        callerId: currentUser.uid,
        callerName: currentUser.displayName || 'Utente',
        callerPhoto: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(getTenantDoc(db, 'chats', selectedChat.id), {
        lastMessage: '📞 Chiamata vocale',
        lastUpdate: serverTimestamp(),
      });

      // Salva riferimento per gestire la chiusura
      activeCallMessageRef.current = { chatId: selectedChat.id, messageId: callMessageRef.id };

      setVoiceCallRoom(roomUrl);
      setShowVoiceCallModal(true);
      setIsVideoEnabled(false); // Per chiamata vocale
      initializeDailyCall(roomUrl);
    } catch (error) {
      console.error('Errore avvio chiamata vocale:', error);
      alert('Errore durante l\'avvio della chiamata');
    }
  };

  // Richiedi permessi browser per camera/microfono
  const requestMediaPermissions = async () => {
    try {
      // Richiedi accesso a camera e microfono
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Ferma lo stream subito dopo aver ottenuto i permessi
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error) {
      console.error('Errore richiesta permessi media:', error);
      alert('Per partecipare alla videochiamata è necessario consentire l\'accesso a videocamera e microfono.');
      return false;
    }
  };

  // Inizializza chiamata Daily.co
  const initializeDailyCall = async (roomUrl) => {
    try {
      // Richiedi permessi prima di procedere
      const hasPermissions = await requestMediaPermissions();
      if (!hasPermissions) {
        return;
      }

      const call = DailyIframe.createCallObject({
        url: roomUrl,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        },
      });

      setDailyCallObject(call);

      // Event listeners
      call.on('participant-joined', (event) => {
        console.log('Partecipante entrato:', event.participant);
      });

      call.on('participant-left', (event) => {
        console.log('Partecipante uscito:', event.participant);
      });

      call.on('error', (event) => {
        console.error('Errore Daily.co:', event.error);
      });

      // Partecipa alla chiamata con video e audio attivi
      await call.join({
        userName: currentUser?.displayName || 'Utente',
        url: roomUrl,
      });

      // Assicurati che video e audio siano attivi
      await call.setLocalVideo(true);
      await call.setLocalAudio(true);

      // Avvia timer
      startCallTimer();

    } catch (error) {
      console.error('Errore inizializzazione Daily.co:', error);
    }
  };

  // Timer chiamata
  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Upload immagine
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `chat-images/${selectedChat.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(getTenantSubcollection(db, 'chats', selectedChat.id, 'messages'), {
        type: 'image',
        imageUrl: imageUrl,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Utente',
        senderPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(getTenantDoc(db, 'chats', selectedChat.id), {
        lastMessage: '📷 Immagine',
        lastUpdate: serverTimestamp(),
      });
    } catch (error) {
      console.error('Errore upload immagine:', error);
      alert('Errore durante l\'invio dell\'immagine');
    } finally {
      setUploading(false);
    }
  };

  // Registrazione audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Errore registrazione audio:', error);
      alert('Impossibile accedere al microfono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (audioBlob) => {
    if (!selectedChat) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `chat-audio/${selectedChat.id}/${Date.now()}.webm`);
      await uploadBytes(storageRef, audioBlob);
      const audioUrl = await getDownloadURL(storageRef);

      await addDoc(getTenantSubcollection(db, 'chats', selectedChat.id, 'messages'), {
        type: 'audio',
        audioUrl: audioUrl,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Utente',
        senderPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(getTenantDoc(db, 'chats', selectedChat.id), {
        lastMessage: '🎤 Messaggio vocale',
        lastUpdate: serverTimestamp(),
      });
    } catch (error) {
      console.error('Errore upload audio:', error);
      alert('Errore durante l\'invio del messaggio vocale');
    } finally {
      setUploading(false);
    }
  };

  // Filtra chat per ricerca
  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherUser(chat);
    return otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Devi effettuare il login</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
          >
            Vai al Login
          </button>
        </div>
      </div>
    );
  }

  // Mostra loading durante verifica profilo
  if (checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Verifica profilo in corso...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden safe-area-top">
      <div className="h-full flex md:grid md:grid-cols-[384px_1fr] relative">
        {/* Sidebar chat list */}
        <div className={`w-full md:w-auto h-full border-r border-slate-700 flex flex-col bg-slate-800/50 backdrop-blur-sm ${
          selectedChat ? 'hidden md:flex' : 'flex'
        }`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
            💬 Chat
          </h1>
          
          {/* Barra ricerca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca chat..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Pulsante nuova chat */}
          <button
            onClick={() => setShowNewChatModal(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg"
          >
            <Plus size={20} />
            Nuova Chat
          </button>
        </div>

        {/* Lista chat */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400 mb-2">Nessuna chat ancora</p>
              <p className="text-sm text-slate-500">Inizia una nuova conversazione!</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherUser = getOtherUser(chat);
              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-3 md:p-4 border-b border-slate-700 hover:bg-slate-700/50 active:bg-slate-700 transition-all text-left touch-manipulation ${
                    selectedChat?.id === chat.id ? 'bg-slate-700/70' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={otherUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}`}
                      alt={otherUser.name}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-cyan-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base text-slate-100 truncate">{otherUser.name}</h3>
                      <p className="text-xs md:text-sm text-slate-400 truncate">{chat.lastMessage || 'Nessun messaggio'}</p>
                    </div>
                    {chat.unreadCount?.[currentUser.uid] > 0 && (
                      <span className="px-2 py-1 bg-cyan-600 text-white text-xs font-bold rounded-full">
                        {chat.unreadCount[currentUser.uid]}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
        </div>

        {/* Area messaggi */}
        <div className={`flex-1 w-full md:w-auto flex flex-col h-full ${
          selectedChat ? 'flex' : 'hidden md:flex'
        }`}>
        {selectedChat ? (
          <>
            {/* Header chat */}
            <div className="flex-shrink-0 p-3 md:p-4 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-slate-300" />
                </button>
                <img
                  src={getOtherUser(selectedChat).photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOtherUser(selectedChat).name)}`}
                  alt={getOtherUser(selectedChat).name}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-cyan-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-sm md:text-base text-slate-100 truncate">{getOtherUser(selectedChat).name}</h2>
                  <p className="text-xs flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${
                      isUserOnline(selectedChat.participants.find(p => p !== currentUser.uid))
                        ? 'bg-green-500'
                        : 'bg-slate-500'
                    }`}></span>
                    <span className={isUserOnline(selectedChat.participants.find(p => p !== currentUser.uid)) ? 'text-green-400' : 'text-slate-400'}>
                      {isUserOnline(selectedChat.participants.find(p => p !== currentUser.uid)) ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Azioni chat */}
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <button
                  onClick={handleStartVoiceCall}
                  className="p-2 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors group touch-manipulation"
                  title="Avvia chiamata vocale"
                >
                  <Phone size={18} className="text-slate-300 group-hover:text-green-400 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={handleStartVideoCall}
                  className="p-2 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors group touch-manipulation"
                  title="Avvia videochiamata"
                >
                  <Video size={18} className="text-slate-300 group-hover:text-cyan-400 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Messaggi */}
            <div className="flex-1 basis-0 min-h-0 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
              {messages.map((message) => {
                const isMe = message.senderId === currentUser.uid;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (
                        <img
                          src={message.senderPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName)}`}
                          alt={message.senderName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={`rounded-2xl ${
                          message.type === 'call' 
                            ? 'bg-slate-700/50 border border-slate-600' 
                            : isMe
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                            : 'bg-slate-700 text-slate-100'
                        }`}
                      >
                        {/* Messaggio chiamata */}
                        {message.type === 'call' && (
                          <div className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                message.callType === 'video' 
                                  ? 'bg-cyan-500/20' 
                                  : 'bg-green-500/20'
                              }`}>
                                {message.callType === 'video' ? (
                                  <Video size={16} className="text-cyan-400" />
                                ) : (
                                  <Phone size={16} className="text-green-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-200">
                                  {message.callType === 'video' ? 'Videochiamata' : 'Chiamata vocale'}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {message.callStatus === 'calling' && !isMe && 'In corso...'}
                                  {message.callStatus === 'calling' && isMe && 'In attesa...'}
                                  {message.callStatus === 'accepted' && '✓ Accettata'}
                                  {message.callStatus === 'declined' && '✗ Rifiutata'}
                                  {message.callStatus === 'missed' && '✗ Persa'}
                                  {message.callStatus === 'cancelled' && '✗ Annullata'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Pulsante Partecipa per chi riceve la chiamata */}
                            {!isMe && message.callStatus === 'calling' && message.roomUrl && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  if (message.callType === 'video') {
                                    setVideoCallRoom(message.roomUrl);
                                    setShowVideoCallModal(true);
                                    initializeDailyCall(message.roomUrl);
                                  } else {
                                    setVoiceCallRoom(message.roomUrl);
                                    setShowVoiceCallModal(true);
                                    setIsVideoEnabled(false);
                                    initializeDailyCall(message.roomUrl);
                                  }
                                  // Aggiorna stato messaggio
                                  const messagesCollectionRef = getTenantSubcollection(db, 'chats', selectedChat.id, 'messages');
                                  updateDoc(doc(messagesCollectionRef.firestore, messagesCollectionRef.path, message.id), {
                                    callStatus: 'accepted'
                                  }).catch(console.error);
                                }}
                                className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                  message.callType === 'video'
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                                } text-white shadow-lg`}
                              >
                                {message.callType === 'video' ? (
                                  <Video size={18} />
                                ) : (
                                  <Phone size={18} />
                                )}
                                Partecipa alla {message.callType === 'video' ? 'Videochiamata' : 'Chiamata'}
                              </motion.button>
                            )}
                          </div>
                        )}
                        
                        {/* Messaggio immagine */}
                        {message.type === 'image' && (
                          <img
                            src={message.imageUrl}
                            alt="Immagine inviata"
                            className="max-w-xs rounded-lg cursor-pointer"
                            onClick={() => window.open(message.imageUrl, '_blank')}
                          />
                        )}
                        
                        {/* Messaggio audio */}
                        {message.type === 'audio' && (
                          <div className="flex items-center gap-2 px-4 py-2">
                            <Mic size={20} />
                            <audio controls className="max-w-xs">
                              <source src={message.audioUrl} type="audio/webm" />
                            </audio>
                          </div>
                        )}
                        
                        {/* Messaggio testo */}
                        {(!message.type || message.type === 'text') && (
                          <p className="break-words px-4 py-2">{message.text}</p>
                        )}
                        
                        <div className="flex items-center gap-1 px-4 pb-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp?.toDate?.().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            message.read ? (
                              <CheckCheck size={14} className="text-cyan-300" />
                            ) : (
                              <Check size={14} className="opacity-70" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input messaggio */}
            <div className="flex-shrink-0 p-3 md:p-4 border-t border-slate-700 bg-slate-800/95 backdrop-blur-sm safe-area-bottom">
              <div className="flex items-center gap-2">
                {/* Input file nascosto per immagini */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {/* Pulsante immagine */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 md:p-2.5 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                  title="Invia immagine"
                >
                  <ImageIcon size={18} className="text-slate-400 md:w-5 md:h-5" />
                </button>
                
                {/* Pulsante registrazione audio */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={uploading}
                  className={`p-2 md:p-2.5 rounded-lg transition-colors touch-manipulation ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                      : 'hover:bg-slate-700'
                  }`}
                  title={isRecording ? 'Ferma registrazione' : 'Registra audio'}
                >
                  <Mic size={18} className={`${isRecording ? 'text-white' : 'text-slate-400'} md:w-5 md:h-5`} />
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={uploading ? 'Invio...' : isRecording ? 'Registrando...' : 'Messaggio...'}
                  disabled={uploading || isRecording}
                  className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-slate-700 border border-slate-600 rounded-full text-sm md:text-base text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending || uploading || isRecording}
                  className="p-2.5 md:p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-lg touch-manipulation"
                >
                  <Send size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 text-slate-600" />
              <h2 className="text-2xl font-bold text-slate-300 mb-2">Seleziona una chat</h2>
              <p className="text-slate-500">Scegli una conversazione dalla lista o iniziane una nuova</p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modal nuova chat */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-100">Nuova Chat</h2>
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Cerca utente per nome o email..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">Nessun utente trovato</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleStartChat(user)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-700/50 rounded-lg transition-all text-left"
                      >
                        <img
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-100">{user.name}</h3>
                          {user.email && (
                            <p className="text-sm text-slate-400">{user.email}</p>
                          )}
                        </div>
                        <UserPlus size={20} className="text-cyan-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifica chiamata in arrivo */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-800 border-2 border-cyan-500 rounded-xl shadow-2xl p-4 max-w-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src={incomingCall.callerPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.callerName)}`}
                alt={incomingCall.callerName}
                className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500 animate-pulse"
              />
              <div className="flex-1">
                <h3 className="font-bold text-slate-100">{incomingCall.callerName}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  {incomingCall.type === 'voicecall' ? (
                    <>
                      <Phone size={14} className="text-green-400" />
                      Chiamata vocale in arrivo...
                    </>
                  ) : (
                    <>
                      <Video size={14} className="text-cyan-400" />
                      Videochiamata in arrivo...
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  // Accetta la chiamata
                  if (incomingCall.type === 'voicecall') {
                    setVoiceCallRoom(incomingCall.roomUrl);
                    setShowVoiceCallModal(true);
                    setIsVideoEnabled(false);
                    initializeDailyCall(incomingCall.roomUrl);
                  } else {
                    setVideoCallRoom(incomingCall.roomUrl);
                    setShowVideoCallModal(true);
                    initializeDailyCall(incomingCall.roomUrl);
                  }
                  
                  // Marca notifica come letta
                  await updateDoc(getTenantDoc(db, 'notifications', incomingCall.id), {
                    read: true,
                  });

                  // Aggiorna stato messaggio chiamata a "accettata"
                  if (incomingCall.callMessageId) {
                    // Trova la chat con il chiamante
                    const userChats = chats.filter(chat => 
                      chat.participants.includes(incomingCall.callerId)
                    );
                    if (userChats.length > 0) {
                      const chatId = userChats[0].id;
                      const messagesCollectionRef = getTenantSubcollection(db, 'chats', chatId, 'messages');
                      await updateDoc(doc(messagesCollectionRef.firestore, messagesCollectionRef.path, incomingCall.callMessageId), {
                        callStatus: 'accepted',
                      });
                    }
                  }
                  
                  setIncomingCall(null);
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {incomingCall.type === 'voicecall' ? <Phone size={18} /> : <Video size={18} />}
                Accetta
              </button>
              <button
                onClick={async () => {
                  // Rifiuta la chiamata
                  await updateDoc(getTenantDoc(db, 'notifications', incomingCall.id), {
                    read: true,
                  });

                  // Aggiorna stato messaggio chiamata a "rifiutata"
                  if (incomingCall.callMessageId) {
                    const userChats = chats.filter(chat => 
                      chat.participants.includes(incomingCall.callerId)
                    );
                    if (userChats.length > 0) {
                      const chatId = userChats[0].id;
                      const messagesCollectionRef = getTenantSubcollection(db, 'chats', chatId, 'messages');
                      await updateDoc(doc(messagesCollectionRef.firestore, messagesCollectionRef.path, incomingCall.callMessageId), {
                        callStatus: 'declined',
                      });
                    }
                  }
                  
                  setIncomingCall(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Rifiuta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Chiamata Vocale (solo audio) */}
      <AnimatePresence>
        {showVoiceCallModal && voiceCallRoom && selectedChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden"
            >
              {/* Interfaccia chiamata vocale Daily.co */}
              <DailyProvider callObject={dailyCallObject}>
                <VoiceCallInterface
                  roomUrl={voiceCallRoom}
                  onClose={async () => {
                    // Aggiorna stato chiamata a "cancelled"
                    if (activeCallMessageRef.current) {
                      try {
                        const { chatId, messageId } = activeCallMessageRef.current;
                        const messagesCollectionRef = getTenantSubcollection(db, 'chats', chatId, 'messages');
                        await updateDoc(doc(messagesCollectionRef.firestore, messagesCollectionRef.path, messageId), {
                          callStatus: 'cancelled',
                        });
                      } catch (error) {
                        console.error('Errore aggiornamento stato chiamata:', error);
                      }
                      activeCallMessageRef.current = null;
                    }

                    // Rilascio risorse Daily.co
                    if (dailyCallObject) {
                      try {
                        await dailyCallObject.leave();
                        dailyCallObject.destroy();
                        setDailyCallObject(null);
                      } catch (error) {
                        console.error('Errore rilascio Daily.co:', error);
                      }
                    }

                    setShowVoiceCallModal(false);
                    setVoiceCallRoom(null);
                    setIsVideoEnabled(true);
                    setIsAudioEnabled(true);
                    setIsScreenSharing(false);
                    stopCallTimer();
                  }}
                  isAudioEnabled={isAudioEnabled}
                  onToggleAudio={toggleAudio}
                  callDuration={callDuration}
                  formatCallDuration={formatCallDuration}
                />
              </DailyProvider>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal VideoCall */}
      <AnimatePresence>
        {showVideoCallModal && videoCallRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col"
            >

              <DailyProvider callObject={dailyCallObject}>
                <VideoCallInterface
                  onClose={async () => {
                    // Aggiorna stato chiamata a "cancelled"
                    if (activeCallMessageRef.current) {
                      try {
                        const { chatId, messageId } = activeCallMessageRef.current;
                        const messagesCollectionRef = getTenantSubcollection(db, 'chats', chatId, 'messages');
                        await updateDoc(doc(messagesCollectionRef.firestore, messagesCollectionRef.path, messageId), {
                          callStatus: 'cancelled',
                        });
                      } catch (error) {
                        console.error('Errore aggiornamento stato chiamata:', error);
                      }
                      activeCallMessageRef.current = null;
                    }

                    // Rilascio risorse Daily.co
                    if (dailyCallObject) {
                      try {
                        await dailyCallObject.leave();
                        dailyCallObject.destroy();
                        setDailyCallObject(null);
                      } catch (error) {
                        console.error('Errore rilascio Daily.co:', error);
                      }
                    }

                    setShowVideoCallModal(false);
                    setVideoCallRoom(null);
                  }}
                />
              </DailyProvider>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente Video Call con Daily.co migliorato
function VideoCallInterface({ onClose }) {
  const callObject = useDaily();
  const participantIds = useParticipantIds();
  const localParticipant = useLocalParticipant();
  const localVideo = useVideoTrack('local');
  const localAudio = useAudioTrack('local');
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();

  // Filtra solo i partecipanti remoti (esclude il locale)
  const remoteParticipantIds = participantIds.filter(id => {
    return id !== 'local' && id !== localParticipant?.session_id;
  });

  // Controlli video/audio basati sullo stato reale di Daily
  const toggleVideo = async () => {
    if (!callObject) return;
    
    if (localVideo?.state === 'playable') {
      await callObject.setLocalVideo(false);
    } else {
      await callObject.setLocalVideo(true);
    }
  };

  const toggleAudio = async () => {
    if (!callObject) return;
    
    if (localAudio?.state === 'playable') {
      await callObject.setLocalAudio(false);
    } else {
      await callObject.setLocalAudio(true);
    }
  };

  const toggleScreenShare = async () => {
    if (!callObject) return;
    
    if (isSharingScreen) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  const isVideoEnabled = localVideo?.state === 'playable';
  const isAudioEnabled = localAudio?.state === 'playable';

  return (
    <div className="flex-1 relative bg-slate-900">
      {/* Video Grid */}
      <div className={`grid gap-2 p-4 h-full overflow-auto ${remoteParticipantIds.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 place-items-center'}`}>
        {/* Partecipante locale */}
        <div className={`relative bg-slate-800 rounded-xl overflow-hidden ${remoteParticipantIds.length > 0 ? 'aspect-video' : 'w-full max-w-2xl aspect-video'}`}>
          <video
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            ref={(el) => {
              if (el && localVideo?.persistentTrack) {
                el.srcObject = new MediaStream([localVideo.persistentTrack]);
              }
            }}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
              <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center">
                <User size={32} className="text-slate-400" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
            Tu {!isAudioEnabled && '(muto)'}
          </div>
        </div>

        {/* Altri partecipanti - mostrati solo se presenti */}
        {remoteParticipantIds.map((id) => (
          <ParticipantVideo key={id} sessionId={id} />
        ))}

        {/* Screen share */}
        {screens.length > 0 && (
          <div className="col-span-full relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
            <video
              autoPlay
              playsInline
              className="w-full h-full object-contain"
              ref={(el) => {
                if (el && screens[0]?.screenVideoTrack) {
                  el.srcObject = new MediaStream([screens[0].screenVideoTrack]);
                }
              }}
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              Condivisione schermo
            </div>
          </div>
        )}
      </div>

      {/* Controlli chiamata */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-800/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-all ${
            isVideoEnabled
              ? 'bg-slate-600 hover:bg-slate-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
          title={isVideoEnabled ? 'Disattiva video' : 'Attiva video'}
        >
          {isVideoEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
        </button>

        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-all ${
            isAudioEnabled
              ? 'bg-slate-600 hover:bg-slate-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
          title={isAudioEnabled ? 'Disattiva audio' : 'Attiva audio'}
        >
          {isAudioEnabled ? <MicOn size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition-all ${
            isSharingScreen
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
              : 'bg-slate-600 hover:bg-slate-500 text-white'
          }`}
          title={isSharingScreen ? 'Ferma condivisione' : 'Condividi schermo'}
        >
          <Monitor size={20} />
        </button>

        <button
          onClick={onClose}
          className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all"
          title="Termina chiamata"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}

// Componente per video partecipante remoto
function ParticipantVideo({ sessionId }) {
  const participant = useParticipant(sessionId);
  const videoTrack = useVideoTrack(sessionId);
  const audioTrack = useAudioTrack(sessionId);

  return (
    <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
      {videoTrack?.persistentTrack ? (
        <video
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          ref={(el) => {
            if (el && videoTrack.persistentTrack) {
              el.srcObject = new MediaStream([videoTrack.persistentTrack]);
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-700">
          <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center">
            <User size={32} className="text-slate-400" />
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
        {participant?.user_name || 'Partecipante'} {!audioTrack?.state === 'playable' && '(muto)'}
      </div>
    </div>
  );
}

// Componente chiamata vocale migliorata
function VoiceCallInterface({ roomUrl, onClose, isAudioEnabled, onToggleAudio, callDuration, formatCallDuration }) {
  const participantIds = useParticipantIds();
  const localParticipant = useLocalParticipant();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {/* Avatar grande del partecipante */}
      <div className="relative mb-8">
        <div className="w-40 h-40 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
          <User size={64} className="text-white" />
        </div>
        {/* Indicatore chiamata attiva */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <Phone size={16} className="text-white" />
        </div>
        {/* Anello pulsante */}
        <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-30"></div>
      </div>

      {/* Info chiamata */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Chiamata vocale
        </h2>
        <div className="text-4xl font-bold text-slate-100 mb-2 font-mono">
          {formatCallDuration(callDuration)}
        </div>
        <p className="text-slate-400">
          {participantIds.length - 1} partecipante{participantIds.length - 1 !== 1 ? 'i' : ''}
        </p>
      </div>

      {/* Controlli chiamata */}
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleAudio}
          className={`p-4 rounded-full transition-all shadow-lg ${
            isAudioEnabled
              ? 'bg-slate-600 hover:bg-slate-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
          title={isAudioEnabled ? 'Disattiva audio' : 'Attiva audio'}
        >
          {isAudioEnabled ? <MicOn size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={onClose}
          className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all shadow-lg"
          title="Termina chiamata"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
