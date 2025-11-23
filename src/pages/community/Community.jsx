// src/pages/community/Community.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Send, Heart, MessageCircle, Trophy, Sparkles, Lock, Pin,
  Search, Bell, Settings, Crown, Zap, Target, Shield, Star,
  Users, Volume2, Calendar, ChevronDown, MoreHorizontal,
  TrendingUp, Award, Flame, Gem, Hash, Smile, Image,
  Reply, Share, Bookmark, Eye, ThumbsUp, MessageSquare,
  Plus, Edit, Trash2, Save, X, Check, AlertTriangle,
  BarChart3, Users as UsersIcon, MessageSquare as ChatIcon,
  Shield as ShieldIcon, Crown as CrownIcon, Wrench,
  Palette, Layers, UserCheck, Ban, Flag, Video, Video as VideoIcon, Mic, MicOff, VideoOff, PhoneOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import {
  collection, query, where, orderBy, limit, getDocs,
  addDoc, serverTimestamp, doc, onSnapshot, updateDoc, setDoc,
  arrayUnion, arrayRemove, increment, writeBatch
} from 'firebase/firestore';
import { uploadToR2 } from '../../cloudflareStorage';
import { useNavigate } from 'react-router-dom';

const LEVELS = [
  { name: "Rookie", min: 0, color: "gray-500", next: 10, icon: Shield },
  { name: "Active", min: 10, color: "blue-500", next: 50, icon: Target },
  { name: "Pro", min: 50, color: "purple-500", next: 150, icon: Zap },
  { name: "Elite", min: 150, color: "pink-500", next: 300, icon: Star },
  { name: "Legend", min: 300, color: "yellow-500", icon: Crown },
];

const CHANNELS = [
  { id: "welcome", name: "benvenuto", icon: Sparkles, locked: false, readOnly: true },
  { id: "introductions", name: "presentazioni", icon: Users, locked: false },
  { id: "wins", name: "vittorie", icon: Trophy, locked: false },
  { id: "questions", name: "domande", icon: MessageCircle, locked: false },
  { id: "tips", name: "consigli", icon: Volume2, locked: false },
  { id: "live", name: "live", icon: Calendar, locked: true, minLevel: 2 },
];

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [channels, setChannels] = useState(CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState("wins");
  const [newPost, setNewPost] = useState("");
  const [userData, setUserData] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminUids, setAdminUids] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminLevels, setAdminLevels] = useState(LEVELS);
  const [adminChannels, setAdminChannels] = useState(CHANNELS);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingChannel, setEditingChannel] = useState(null);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [communityStats, setCommunityStats] = useState({});
  const [activeGroupCall, setActiveGroupCall] = useState(null);
  const [showGroupCall, setShowGroupCall] = useState(false);
  const [callParticipants, setCallParticipants] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [communitySettings, setCommunitySettings] = useState({
    name: "FitFlow Community",
    description: "Condividi il tuo viaggio fitness",
    autoRecordCalls: true,
    communityEnabled: true,
    disabledMessage: "La community è temporaneamente chiusa per manutenzione. Torneremo presto!",
    requireProfileSetup: true,
    requireIntroVideo: true,
    introVideoUrl: ""
  });
  const [membersList, setMembersList] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileData, setProfileData] = useState({
    displayName: "",
    photoURL: ""
  });
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeAdminSection, setActiveAdminSection] = useState('levels');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState('profile'); // 'profile' | 'video'
  const [videoWatched, setVideoWatched] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  // Sidebar: su desktop sempre visibile, su mobile parte chiusa (dentro il canale)
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 1024);
  const [showCommentsForPost, setShowCommentsForPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [postComments, setPostComments] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsUnsubscribers, setCommentsUnsubscribers] = useState({});
  const navigate = useNavigate();

  // Monitor screen size per sidebar responsiva
  useEffect(() => {
    const handleResize = () => {
      const isLarge = window.innerWidth >= 1024;
      setIsLargeScreen(isLarge);
      // Su desktop forza sidebar aperta
      if (isLarge) {
        setShowSidebar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notifica MainLayout per nascondere bottom nav quando sidebar è chiusa (= nella chat)
  useEffect(() => {
    // Su mobile: nascondi bottom nav quando sidebar è chiusa (= stai chattando)
    // Su desktop: bottom nav sempre visibile (non influenzata)
    const shouldHideBottomNav = !isLargeScreen && !showSidebar;
    console.log('Community - isLargeScreen:', isLargeScreen, 'showSidebar:', showSidebar, 'shouldHideBottomNav:', shouldHideBottomNav);
    window.dispatchEvent(new CustomEvent('chatSelected', { detail: shouldHideBottomNav }));
  }, [showSidebar, isLargeScreen]);

  // Cleanup quando smonta il componente
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('chatSelected', { detail: false }));
      // Cleanup all comment listeners
      Object.values(commentsUnsubscribers).forEach(unsub => unsub && unsub());
    };
  }, [commentsUnsubscribers]);

  // Carica utente + livello
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(getTenantDoc(db, 'users', auth.currentUser.uid), (doc) => {
      const data = doc.data() || {};
      setUserData({
        ...data,
        uid: auth.currentUser.uid,
        photoURL: data.photoURL || auth.currentUser.photoURL,
        displayName: data.displayName || auth.currentUser.displayName
      });
    });
    return unsub;
  }, []);

  // Verifica accesso community e onboarding
  useEffect(() => {
    if (!userData || !communitySettings) return;
    
    // Check se l'utente ha completato l'onboarding
    const hasProfile = userData.displayName && userData.photoURL;
    const hasWatchedVideo = userData.communityVideoWatched || false;
    
    // Se richiede setup profilo e non è stato fatto
    if (communitySettings.requireProfileSetup && !hasProfile) {
      setShowOnboarding(true);
      setOnboardingStep('profile');
      return;
    }
    
    // Se richiede video e non è stato visto
    if (communitySettings.requireIntroVideo && !hasWatchedVideo && communitySettings.introVideoUrl) {
      setShowOnboarding(true);
      setOnboardingStep('video');
      return;
    }
    
    setShowOnboarding(false);
  }, [userData, communitySettings]);

  // Verifica se è superadmin e carica lista admin
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "roles/superadmins"), (doc) => {
      const data = doc.data();
      const uids = data?.uids || [];
      setAdminUids(uids);
      setIsSuperAdmin(uids.includes(auth.currentUser.uid));
    });
    return unsub;
  }, []);

  // Carica statistiche community (solo superadmin)
  useEffect(() => {
    if (!isSuperAdmin) return;
    const unsub = onSnapshot(doc(db, "community_stats", "global"), (doc) => {
      setCommunityStats(doc.data() || {});
    });
    return unsub;
  }, [isSuperAdmin]);

  // Carica impostazioni community (per tutti, non solo superadmin)
  useEffect(() => {
    const unsub = onSnapshot(getTenantDoc(db, 'community_config', "settings"), (doc) => {
      const data = doc.data();
      if (data) {
        setCommunitySettings({
          name: data.name || "FitFlow Community",
          description: data.description || "Condividi il tuo viaggio fitness",
          autoRecordCalls: data.autoRecordCalls ?? true,
          communityEnabled: data.communityEnabled ?? true,
          disabledMessage: data.disabledMessage || "La community è temporaneamente chiusa per manutenzione. Torneremo presto!",
          requireProfileSetup: data.requireProfileSetup ?? true,
          requireIntroVideo: data.requireIntroVideo ?? true,
          introVideoUrl: data.introVideoUrl || ""
        });
      }
    });
    return unsub;
  }, []);

  // Carica lista membri (per tutti gli utenti)
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(getTenantCollection(db, 'users'), (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })).filter(user => !bannedUsers.includes(user.uid));
      setMembersList(members);
    });
    return unsub;
  }, [bannedUsers]);

  // Carica group call attiva
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsub = onSnapshot(
      query(getTenantCollection(db, 'daily_rooms'), where("active", "==", true)),
      (snapshot) => {
        if (!snapshot.empty) {
          const call = snapshot.docs[0].data();
          setActiveGroupCall({ id: snapshot.docs[0].id, ...call });
        } else {
          setActiveGroupCall(null);
        }
      }
    );
    return unsub;
  }, []);

  // Carica post
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      getTenantCollection(db, 'community_posts'),
      where("channel", "==", selectedChannel),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, 
      (snap) => {
        const loadedPosts = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => !p.deleted); // Filtra post eliminati
        // Ordina: prima i post pinnati, poi per timestamp
        loadedPosts.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return 0;
        });
        setPosts(loadedPosts);
        console.log(`Caricati ${loadedPosts.length} post per canale ${selectedChannel}`);
      },
      (error) => {
        console.error("Errore caricamento post:", error);
        // Fallback senza orderBy se c'è un errore di indice
        const simpleQuery = query(
          getTenantCollection(db, 'community_posts'),
          where("channel", "==", selectedChannel),
          limit(50)
        );
        onSnapshot(simpleQuery, (snap) => {
          const loadedPosts = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => !p.deleted); // Filtra post eliminati
          loadedPosts.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const aTime = a.timestamp?.toMillis?.() || 0;
            const bTime = b.timestamp?.toMillis?.() || 0;
            return bTime - aTime;
          });
          setPosts(loadedPosts);
        });
      }
    );
    return unsub;
  }, [selectedChannel]);

  // Calcola livello corrente considerando livelli manuali
  const hasManualLevel = userData?.levelOverride && userData?.manualLevel !== undefined;
  const currentLevelIndex = hasManualLevel ? userData.manualLevel : LEVELS.findIndex(l => l.min <= (userData?.totalLikes || 0));
  const currentLevel = LEVELS[Math.max(0, currentLevelIndex)] || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel ? ((userData?.totalLikes || 0) - currentLevel.min) / (nextLevel.min - currentLevel.min) * 100 : 100;

  // Elimina post
  const deletePost = async (postId) => {
    if (!window.confirm('Vuoi eliminare questo post?')) return;
    try {
      // Trova il post per ottenere l'autore
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      await updateDoc(getTenantDoc(db, 'community_posts', postId), {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      // Decrementa contatore post dell'autore
      const authorRef = getTenantDoc(db, 'users', post.author.uid);
      await updateDoc(authorRef, {
        posts: increment(-1)
      });
    } catch (error) {
      console.error('Errore eliminazione post:', error);
      alert('Errore durante l\'eliminazione del post');
    }
  };

  const sendPost = async (mediaUrl = null, mediaType = null) => {
    if (!newPost.trim() && !mediaUrl) return;
    
    try {
      const postData = {
        content: newPost,
        author: {
          uid: auth.currentUser.uid,
          name: userData?.displayName || auth.currentUser.displayName || "Utente",
          photoURL: userData?.photoURL || auth.currentUser.photoURL || "",
          level: LEVELS.indexOf(currentLevel)
        },
        channel: selectedChannel,
        likes: 0,
        likedBy: [],
        replies: [],
        pinned: false,
        timestamp: serverTimestamp()
      };

      // Aggiungi media se presente
      if (mediaUrl) {
        postData.mediaUrl = mediaUrl;
        postData.mediaType = mediaType; // 'image' | 'audio' | 'video'
      }

      await addDoc(getTenantCollection(db, 'community_posts'), postData);
      
      // Incrementa contatore post dell'utente
      const userRef = getTenantDoc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        posts: increment(1)
      });
      
      setNewPost("");
      console.log("Post inviato con successo");
    } catch (error) {
      console.error("Errore invio post:", error);
      alert("Errore nell'invio del messaggio. Verifica i permessi Firestore.");
    }
  };

  // Upload immagine
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadToR2(
        file,
        auth.currentUser.uid,
        'community_images',
        (progress) => setUploadProgress(progress.percent),
        isSuperAdmin
      );
      await sendPost(url, 'image');
    } catch (error) {
      console.error('Errore upload immagine:', error);
      alert('Errore durante l\'upload dell\'immagine');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Registrazione audio
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        
        try {
          setIsUploading(true);
          const url = await uploadToR2(
            audioFile,
            auth.currentUser.uid,
            'community_audio',
            (progress) => setUploadProgress(progress.percent),
            isSuperAdmin
          );
          await sendPost(url, 'audio');
        } catch (error) {
          console.error('Errore upload audio:', error);
          alert('Errore durante l\'upload dell\'audio');
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingAudio(true);
    } catch (error) {
      console.error('Errore avvio registrazione:', error);
      alert('Impossibile accedere al microfono');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && isRecordingAudio) {
      mediaRecorder.stop();
      setIsRecordingAudio(false);
      setMediaRecorder(null);
    }
  };

  const likePost = async (postId, liked) => {
    const postRef = getTenantDoc(db, 'community_posts', postId);
    const userRef = getTenantDoc(db, 'users', auth.currentUser.uid);
    const authorRef = getTenantDoc(db, 'users', posts.find(p => p.id === postId).author.uid);

    const batch = writeBatch(db);
    batch.update(postRef, {
      likes: increment(liked ? -1 : 1),
      likedBy: liked ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid)
    });
    batch.update(authorRef, { "stats.likesReceived": increment(liked ? -1 : 1) });
    await batch.commit();
  };

  // Funzioni Admin
  const saveLevels = async () => {
    if (!isSuperAdmin) return;
    // Salva livelli in Firestore
    await updateDoc(getTenantDoc(db, 'app-data', "community-config"), {
      levels: adminLevels,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid
    });
    setAdminLevels([...adminLevels]);
  };

  const saveChannels = async () => {
    if (!isSuperAdmin) return;
    // Salva canali in Firestore
    await updateDoc(getTenantDoc(db, 'app-data', "community-config"), {
      channels: adminChannels,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid
    });
    setAdminChannels([...adminChannels]);
    setChannels([...adminChannels]);
  };

  const addLevel = () => {
    const newLevel = {
      name: "Nuovo Livello",
      min: adminLevels[adminLevels.length - 1]?.min + 50 || 0,
      color: "gray-500",
      icon: Shield
    };
    setAdminLevels([...adminLevels, newLevel]);
  };

  const addChannel = () => {
    const newChannel = {
      id: `channel_${Date.now()}`,
      name: "nuovo-canale",
      icon: MessageCircle,
      locked: false,
      readOnly: false
    };
    setAdminChannels([...adminChannels, newChannel]);
  };

  const updateLevel = (index, field, value) => {
    const updated = [...adminLevels];
    updated[index] = { ...updated[index], [field]: value };
    setAdminLevels(updated);
  };

  const updateChannel = (index, field, value) => {
    const updated = [...adminChannels];
    updated[index] = { ...updated[index], [field]: value };
    setAdminChannels(updated);
  };

  const removeLevel = (index) => {
    if (adminLevels.length > 1) {
      setAdminLevels(adminLevels.filter((_, i) => i !== index));
    }
  };

  const removeChannel = (index) => {
    if (adminChannels.length > 1) {
      setAdminChannels(adminChannels.filter((_, i) => i !== index));
    }
  };

  // Funzioni Super Admin
  const banUser = async (userId) => {
    if (!isSuperAdmin) return;
    await updateDoc(getTenantDoc(db, 'users', userId), { banned: true });
  };

  const unbanUser = async (userId) => {
    if (!isSuperAdmin) return;
    await updateDoc(getTenantDoc(db, 'users', userId), { banned: false });
  };

  const changeUserLevel = async (userId, newLevel) => {
    if (!isSuperAdmin) return;
    await updateDoc(getTenantDoc(db, 'users', userId), { manualLevel: newLevel });
  };

  const pinPost = async (postId, pinned) => {
    if (!isSuperAdmin) return;
    await updateDoc(getTenantDoc(db, 'community_posts', postId), {
      pinned,
      pinnedAt: pinned ? serverTimestamp() : null,
      pinnedBy: pinned ? auth.currentUser.uid : null
    });
  };

  // Group Call Functions
  const startGroupCall = async () => {
    if (!isSuperAdmin) return;

    try {
      const roomName = `fitflow-live-${Date.now()}`;
      console.log('🚀 Avvio creazione stanza Daily.co:', roomName);
      
      // Chiama direttamente l'API Daily.co (no Cloud Function needed!)
      const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY || '76a471284c7f6c54eaa60016b63debb0ded806396a21f64d834f7f874432a85d';
      
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DAILY_API_KEY}`
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'public',
          properties: {
            max_participants: 50,
            enable_screenshare: true,
            enable_chat: true,
            start_video_off: false,
            start_audio_off: false,
            enable_recording: 'cloud'
          }
        })
      });

      const roomData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Errore API Daily.co:', roomData);
        throw new Error(roomData.error || 'Errore creazione stanza');
      }

      console.log('✅ Stanza Daily.co creata:', roomData);
      
      // Salva in Firestore
      const roomDoc = await addDoc(getTenantCollection(db, 'daily_rooms'), {
        roomName: roomData.name,
        url: roomData.url,
        active: true,
        startedBy: auth.currentUser.uid,
        startedAt: serverTimestamp(),
        participants: [auth.currentUser.uid],
        minLevel: 2,
        type: 'weekly',
        title: 'Live Community Session'
      });

      console.log('✅ Stanza salvata in Firestore:', roomDoc.id);
      setActiveGroupCall({ id: roomDoc.id, roomName: roomData.name, url: roomData.url });
      setShowGroupCall(true);
    } catch (error) {
      console.error('❌ Errore avvio group call:', error);
      alert(`Errore creazione live: ${error.message || 'Errore sconosciuto'}`);
    }
  };

  const endGroupCall = async () => {
    if (!isSuperAdmin || !activeGroupCall) return;

    await updateDoc(getTenantDoc(db, 'daily_rooms', activeGroupCall.id), {
      active: false,
      endedAt: serverTimestamp(),
      endedBy: auth.currentUser.uid
    });

    setActiveGroupCall(null);
    setShowGroupCall(false);
  };

  // Salva impostazioni community
  const saveCommunitySettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(getTenantDoc(db, 'community_config', "settings"), {
        name: communitySettings.name,
        description: communitySettings.description,
        communityEnabled: communitySettings.communityEnabled,
        disabledMessage: communitySettings.disabledMessage,
        requireProfileSetup: communitySettings.requireProfileSetup,
        requireIntroVideo: communitySettings.requireIntroVideo,
        introVideoUrl: communitySettings.introVideoUrl,
        autoRecordCalls: communitySettings.autoRecordCalls,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      }, { merge: true });
      console.log("Impostazioni salvate con successo", communitySettings);
      // Feedback visivo temporaneo
      setTimeout(() => setSavingSettings(false), 2000);
    } catch (error) {
      console.error("Errore salvataggio impostazioni:", error);
      setSavingSettings(false);
    }
  };

  // Gestione profilo utente
  const openProfileModal = (user = null) => {
    if (user) {
      setEditingProfile(user);
      setProfileData({
        displayName: user.displayName || "",
        photoURL: user.photoURL || ""
      });
    } else {
      // Profilo proprio
      setEditingProfile(null);
      setProfileData({
        displayName: userData?.displayName || "",
        photoURL: userData?.photoURL || ""
      });
    }
    // Reset stati upload
    setSelectedProfilePhoto(null);
    setProfilePhotoPreview("");
    setIsUploading(false);
    setUploadProgress(0);
    setShowProfileModal(true);
  };

  const saveProfile = async () => {
    try {
      setIsUploading(true);
      const targetUid = editingProfile ? editingProfile.uid : auth.currentUser.uid;
      let photoURL = profileData.photoURL;

      // Se c'è un file selezionato, caricalo su R2
      if (selectedProfilePhoto) {
        console.log('📤 Salvataggio profilo - upload foto...', {
          fileName: selectedProfilePhoto.name,
          fileSize: selectedProfilePhoto.size,
          targetUid,
          isSuperAdmin
        });
        
        try {
          photoURL = await uploadToR2(
            selectedProfilePhoto,
            targetUid,
            'profile_photos',
            (progress) => {
              console.log('📊 Progress:', progress);
              setUploadProgress(progress.percent);
            },
            Boolean(isSuperAdmin) // Assicura che sia un booleano
          );
          console.log('✅ Upload profilo completato:', photoURL);
        } catch (uploadError) {
          console.error('❌ Errore upload profilo:', uploadError);
          console.error('❌ Stack completo:', uploadError.stack);
          throw new Error(`Errore upload foto: ${uploadError.message}`);
        }
      }

      // Usa setDoc con merge per creare il documento se non esiste
      await setDoc(getTenantDoc(db, 'users', targetUid), {
        displayName: profileData.displayName,
        photoURL: photoURL,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Aggiorna anche userData se è il profilo proprio
      if (!editingProfile) {
        setUserData(prev => ({
          ...prev,
          displayName: profileData.displayName,
          photoURL: photoURL
        }));
      }

      // Reset stati
      setSelectedProfilePhoto(null);
      setProfilePhotoPreview("");
      setIsUploading(false);
      setUploadProgress(0);
      setShowProfileModal(false);
      setEditingProfile(null);
    } catch (error) {
      console.error("❌ Errore salvataggio profilo:", error);
      alert(`Errore durante il salvataggio: ${error.message || 'Errore sconosciuto'}. Controlla la console per dettagli.`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Gestisce la selezione della foto profilo
  const handleProfilePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'immagine non può superare i 5MB');
      return;
    }

    setSelectedProfilePhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setProfilePhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Completa onboarding profilo
  const completeProfileSetup = async () => {
    if (!profileData.displayName.trim()) {
      alert("Inserisci il tuo nome");
      return;
    }

    if (!selectedProfilePhoto && !profileData.photoURL.trim()) {
      alert("Carica una foto profilo");
      return;
    }
    
    try {
      setIsUploading(true);
      let photoURL = profileData.photoURL;

      // Se c'è un file selezionato, caricalo su R2
      if (selectedProfilePhoto) {
        console.log('📤 Inizio upload foto profilo...', {
          fileName: selectedProfilePhoto.name,
          fileSize: selectedProfilePhoto.size,
          fileType: selectedProfilePhoto.type,
          userId: auth.currentUser.uid,
          isSuperAdmin
        });
        
        try {
          photoURL = await uploadToR2(
            selectedProfilePhoto,
            auth.currentUser.uid,
            'profile_photos',
            (progress) => {
              console.log('📊 Progress:', progress);
              setUploadProgress(progress.percent);
            },
            Boolean(isSuperAdmin) // Assicura che sia un booleano
          );
          console.log('✅ Upload completato:', photoURL);
        } catch (uploadError) {
          console.error('❌ Errore upload R2:', uploadError);
          console.error('❌ Stack completo:', uploadError.stack);
          
          // Offri un fallback: usa un avatar placeholder
          const shouldContinue = window.confirm(
            `Errore nel caricamento della foto: ${uploadError.message}\n\n` +
            `Vuoi continuare con un avatar placeholder? (Potrai caricare la foto in seguito dal tuo profilo)`
          );
          
          if (shouldContinue) {
            // Genera URL avatar placeholder basato sul nome
            const userName = profileData.displayName || 'User';
            photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=200&background=random`;
          } else {
            throw new Error(`Errore upload foto: ${uploadError.message}`);
          }
        }
      }

      if (!photoURL) {
        throw new Error("Nessun URL foto generato");
      }
      
      // Usa setDoc con merge per creare il documento se non esiste
      await setDoc(getTenantDoc(db, 'users', auth.currentUser.uid), {
        displayName: profileData.displayName,
        photoURL: photoURL,
        email: auth.currentUser.email,
        uid: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
        communityOnboarded: true
      }, { merge: true });

      // Aggiorna stato locale
      setUserData(prev => ({
        ...prev,
        displayName: profileData.displayName,
        photoURL: photoURL
      }));

      // Reset stati
      setSelectedProfilePhoto(null);
      setProfilePhotoPreview("");
      setIsUploading(false);
      setUploadProgress(0);

      // Se non serve il video, chiudi onboarding
      if (!communitySettings.requireIntroVideo || !communitySettings.introVideoUrl) {
        setShowOnboarding(false);
      } else {
        // Passa al video
        setOnboardingStep('video');
      }
    } catch (error) {
      console.error("❌ Errore setup profilo:", error);
      alert(`Errore durante il salvataggio: ${error.message || 'Errore sconosciuto'}. Controlla la console per dettagli.`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Completa visione video
  const completeVideoWatching = async () => {
    try {
      await updateDoc(getTenantDoc(db, 'users', auth.currentUser.uid), {
        communityVideoWatched: true,
        videoWatchedAt: serverTimestamp()
      });
      setShowOnboarding(false);
    } catch (error) {
      console.error("Errore completamento video:", error);
    }
  };

  // Cambio livello manuale (solo superadmin)
  const manualLevelChange = async (userId, newLevelIndex) => {
    if (!isSuperAdmin) return;
    try {
      const newLevel = LEVELS[newLevelIndex];
      await setDoc(getTenantDoc(db, 'users', userId), {
        manualLevel: newLevelIndex,
        levelOverride: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`Livello cambiato per ${userId}: ${newLevel.name}`);
    } catch (error) {
      console.error("Errore cambio livello:", error);
    }
  };

  const joinGroupCall = () => {
    if (!activeGroupCall || currentLevel.min < 2) return;
    // Mostra il modal della videochiamata embedded
    setShowGroupCall(true);
  };

  // Comments
  const addComment = async (postId, content) => {
    if (!content.trim()) return;
    await addDoc(getTenantSubcollection(db, 'community_posts', postId, 'comments'), {
      content,
      author: {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL
      },
      timestamp: serverTimestamp()
    });
    setCommentText("");
    // No need to reload - realtime listener will update automatically
  };

  const loadCommentsForPost = (postId) => {
    setLoadingComments(true);
    const q = query(
      getTenantSubcollection(db, 'community_posts', postId, 'comments'),
      orderBy("timestamp", "desc")
    );
    
    // Use realtime listener for comments
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPostComments(prev => ({ ...prev, [postId]: comments }));
      setLoadingComments(false);
    });
    
    return unsubscribe;
  };

  const toggleComments = (postId) => {
    if (showCommentsForPost === postId) {
      // Close comments and unsubscribe
      setShowCommentsForPost(null);
      if (commentsUnsubscribers[postId]) {
        commentsUnsubscribers[postId]();
        setCommentsUnsubscribers(prev => {
          const updated = { ...prev };
          delete updated[postId];
          return updated;
        });
      }
    } else {
      // Open comments and subscribe
      setShowCommentsForPost(postId);
      if (!postComments[postId]) {
        const unsubscribe = loadCommentsForPost(postId);
        setCommentsUnsubscribers(prev => ({ ...prev, [postId]: unsubscribe }));
      }
    }
  };

  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

  if (!userData) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <div className="w-20 h-20 border-4 border-rose-500/20 rounded-full"></div>
        <div className="absolute top-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 bg-gradient-to-br from-rose-500 to-cyan-500 rounded-full opacity-20 animate-pulse"></div>
      </motion.div>
    </div>
  );

  // Community disabilitata (solo per non-superadmin)
  if (!communitySettings.communityEnabled && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Community Temporaneamente Chiusa</h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            {communitySettings.disabledMessage}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium"
          >
            Torna alla Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Modal Onboarding
  const renderOnboardingModal = () => {
    if (!showOnboarding) return null;

    if (onboardingStep === 'profile') {
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 rounded-3xl border border-white/20 max-w-2xl w-full p-8"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Benvenuto nella Community!</h2>
              <p className="text-slate-400">Prima di iniziare, completa il tuo profilo</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Nome visualizzato</label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Il tuo nome..."
                  className="w-full bg-slate-800/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Foto Profilo</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={profilePhotoPreview || profileData.photoURL || 'https://ui-avatars.com/api/?name=' + (profileData.displayName || 'User')} 
                      alt="Preview" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-cyan-400"
                    />
                    {selectedProfilePhoto && (
                      <div className="absolute -bottom-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        ✓ Pronta
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoSelect}
                      className="hidden"
                      id="profile-photo-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="profile-photo-upload"
                      className="block w-full text-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedProfilePhoto ? 'Cambia Foto' : 'Carica Foto'}
                    </label>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Formato consigliato: quadrata, max 5MB
                    </p>
                  </div>
                </div>
              </div>
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Caricamento...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={completeProfileSetup}
              disabled={isUploading || !profileData.displayName.trim()}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? `Caricamento ${uploadProgress}%...` : 'Continua'}
            </motion.button>
          </motion.div>
        </div>
      );
    }

    if (onboardingStep === 'video') {
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 rounded-3xl border border-white/20 max-w-4xl w-full p-8"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoIcon size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Video Introduttivo</h2>
              <p className="text-slate-400">Guarda questo video prima di accedere alla community</p>
            </div>

            <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden mb-6">
              <video
                src={communitySettings.introVideoUrl}
                controls
                className="w-full h-full"
                onEnded={() => setVideoWatched(true)}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={completeVideoWatching}
              disabled={!videoWatched}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {videoWatched ? 'Entra nella Community' : 'Guarda il video per continuare'}
            </motion.button>
          </motion.div>
        </div>
      );
    }
  };

  return (
    <>
      {renderOnboardingModal()}
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-slate-200 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Enhanced Sidebar - Sempre visibile su desktop, collapsabile su mobile */}
        <motion.div
          animate={{ 
            x: isLargeScreen ? 0 : (showSidebar ? 0 : -320)
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`w-80 bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 flex flex-col shadow-2xl fixed lg:relative inset-y-0 left-0 z-40 h-full ${
            showSidebar ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="p-8 border-b border-white/5">
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2"
            >
              {communitySettings.name}
            </motion.h1>
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 text-sm"
            >
              {communitySettings.description}
            </motion.p>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={userData?.photoURL || "/default-avatar.png"}
                    alt={userData?.displayName || "Utente"}
                    className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/20"
                  />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Crown size={14} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xl text-white">{userData?.displayName || "Utente senza nome"}</p>
                  <p className="text-sm text-cyan-400 flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      currentLevel.color === 'gray-500' ? 'bg-gray-500/20 text-gray-400' :
                      currentLevel.color === 'blue-500' ? 'bg-blue-500/20 text-blue-400' :
                      currentLevel.color === 'purple-500' ? 'bg-purple-500/20 text-purple-400' :
                      currentLevel.color === 'pink-500' ? 'bg-pink-500/20 text-pink-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {currentLevel.name}
                      {hasManualLevel && " (manuale)"}
                    </span>
                    <Heart size={14} />
                    {userData?.totalLikes || 0} likes ricevuti
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Progresso livello</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-cyan-500 rounded-full shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
                {nextLevel && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {nextLevel.min - (userData.totalLikes || 0)} likes per {nextLevel.name}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Canali</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
                <div className="flex flex-col gap-2">
                  {/* Pulsante Il Mio Profilo */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingProfile(null);
                      setProfileData({
                        displayName: userData?.displayName || '',
                        photoURL: userData?.photoURL || ''
                      });
                      setShowProfileModal(true);
                    }}
                    className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all"
                    title="Il Mio Profilo"
                  >
                    <UserCheck size={16} className="text-purple-400" />
                  </motion.button>
                  
                  {/* Pulsante Membri Community */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMembersModal(true)}
                    className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all"
                    title="Vedi Membri"
                  >
                    <Users size={16} className="text-cyan-400" />
                  </motion.button>
                  {activeGroupCall && currentLevel.min >= 2 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={joinGroupCall}
                      className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all animate-pulse"
                    >
                      <VideoIcon size={16} className="text-green-400" />
                    </motion.button>
                  )}
                  {isSuperAdmin && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowAdminPanel(true)}
                      className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all"
                    >
                      <Wrench size={16} className="text-purple-400" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {channels.map((ch, index) => {
              const locked = ch.locked && (currentLevel === LEVELS[0] || LEVELS.indexOf(currentLevel) < (ch.minLevel || 2));
              const isSelected = selectedChannel === ch.id;

              return (
                <motion.button
                  key={ch.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={!locked ? { scale: 1.02, x: 4 } : {}}
                  whileTap={!locked ? { scale: 0.98 } : {}}
                  onClick={() => {
                    if (!locked) {
                      setSelectedChannel(ch.id);
                      // Chiudi sidebar su mobile quando selezioni un canale
                      if (!isLargeScreen) {
                        setShowSidebar(false);
                      }
                    }
                  }}
                  className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-cyan-600/20 border border-rose-500/30 shadow-lg shadow-rose-500/10'
                      : locked
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:bg-white/5 hover:shadow-md hover:shadow-white/5'
                  }`}
                >
                  <div className={`flex items-center gap-4 px-5 py-4 ${
                    isSelected ? 'text-white' : locked ? 'text-slate-500' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    <div className={`p-2 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-rose-500/20 text-rose-400'
                        : locked
                        ? 'bg-slate-700/50 text-slate-500'
                        : 'bg-slate-800/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-cyan-400'
                    }`}>
                      <ch.icon size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium">#{ch.name}</span>
                      {ch.readOnly && <span className="ml-2 text-xs text-slate-500">Solo lettura</span>}
                    </div>
                    {locked && (
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-slate-500" />
                        <span className="text-xs text-slate-500">Lv.{ch.minLevel || 2}</span>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="activeChannel"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-cyan-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Overlay per chiudere sidebar su mobile */}
        {showSidebar && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Enhanced Main Area */}
        <div className="flex-1 w-full md:w-auto flex flex-col h-full">
          {/* Dynamic Header */}
          <motion.div
            style={{ opacity: headerOpacity }}
            className="flex-shrink-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-3 md:px-4 lg:px-8 py-3 md:py-4 lg:py-6"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Pulsante per toggle sidebar (profilo + canali) su mobile */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
              >
                {showSidebar ? <X size={20} className="text-slate-300" /> : <Users size={20} className="text-slate-300" />}
              </button>

              <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
                <motion.div
                  key={selectedChannel}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-2 lg:p-3 bg-gradient-to-br from-rose-500/20 to-cyan-500/20 rounded-xl lg:rounded-2xl border border-white/10 flex-shrink-0"
                >
                  {React.createElement(channels.find(c => c.id === selectedChannel)?.icon || Sparkles, { size: 20, className: "text-cyan-400 lg:w-7 lg:h-7" })}
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg lg:text-2xl font-bold text-white truncate">
                    #{channels.find(c => c.id === selectedChannel)?.name}
                  </h2>
                  <p className="text-xs lg:text-sm text-slate-400 truncate">
                    {posts.length} post{posts.length !== 1 ? 'i' : ''} • {channels.find(c => c.id === selectedChannel)?.readOnly ? 'Sola lettura' : 'Partecipa'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 lg:gap-3 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 lg:p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl lg:rounded-2xl border border-white/10 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <Search size={18} className="text-slate-400 lg:w-5 lg:h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:block p-2 lg:p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl lg:rounded-2xl border border-white/10 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <Bell size={18} className="text-slate-400 lg:w-5 lg:h-5" />
                </motion.button>
                {isSuperAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAdminPanel(true)}
                    className="p-2 lg:p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl lg:rounded-2xl border border-purple-500/30 transition-all duration-200"
                  >
                    <Crown size={18} className="text-purple-400 lg:w-5 lg:h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Posts Feed */}
          <div className="flex-1 basis-0 min-h-0 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
            <div className="max-w-full lg:max-w-4xl mx-auto">

              {/* Live Channel - Start Live Button */}
              {selectedChannel === "live" && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 mb-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <Video size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Live Session</h3>
                        <p className="text-slate-400">
                          {activeGroupCall 
                            ? `${callParticipants.length} ${callParticipants.length === 1 ? 'persona' : 'persone'} in live`
                            : 'Avvia una diretta per la community'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeGroupCall ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={joinGroupCall}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-semibold flex items-center gap-2"
                          >
                            <Video size={18} />
                            Unisciti alla Live
                          </motion.button>

                          {isSuperAdmin && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={endGroupCall}
                              className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-2xl font-medium flex items-center gap-2 border border-red-500/30"
                            >
                              <PhoneOff size={16} />
                              Termina Live
                            </motion.button>
                          )}
                        </>
                      ) : (
                        isSuperAdmin && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startGroupCall}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold flex items-center gap-2"
                          >
                            <Video size={18} />
                            Avvia Live
                          </motion.button>
                        )
                      )}
                    </div>
                  </div>

                  {activeGroupCall && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-slate-400">Live in corso • {activeGroupCall.title || 'Sessione Community'}</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              <AnimatePresence mode="popLayout">
                {posts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center border border-white/10">
                      {React.createElement(channels.find(c => c.id === selectedChannel)?.icon || Sparkles, { size: 40, className: "text-slate-500" })}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-300 mb-2">
                      {channels.find(c => c.id === selectedChannel)?.readOnly ? 'Benvenuto!' : 'Sii il primo!'}
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      {channels.find(c => c.id === selectedChannel)?.readOnly
                        ? 'Questo canale è di sola lettura. Guarda i messaggi degli altri membri!'
                        : `Condividi qualcosa di speciale in #${channels.find(c => c.id === selectedChannel)?.name}!`
                      }
                    </p>
                  </motion.div>
                ) : (
                  posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1,
                        layout: { duration: 0.3 }
                      }}
                      className="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/5"
                    >
                      {post.pinned && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
                        >
                          <Pin size={12} />
                          Fissato
                        </motion.div>
                      )}

                      <div className="flex gap-3 md:gap-6">
                        {/* Enhanced Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-rose-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg md:text-2xl shadow-lg border-2 border-white/20`}>
                            {post.author?.photoURL ? (
                              <img
                                src={post.author.photoURL}
                                alt={post.author.name}
                                className="w-full h-full rounded-2xl object-cover"
                              />
                            ) : (
                              post.author?.name?.[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="hidden md:flex absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 rounded-full items-center justify-center border-2 border-slate-800">
                            {React.createElement(LEVELS[post.author?.level || 0]?.icon || Shield, { size: 16, className: "text-cyan-400" })}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Author Info */}
                          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">
                            <span className="font-bold text-base md:text-lg text-white hover:text-cyan-400 transition-colors cursor-pointer truncate">
                              {post.author?.name}
                            </span>
                            <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                              <Award size={12} className="text-cyan-400 md:w-[14px] md:h-[14px]" />
                              <span className="text-xs md:text-sm text-cyan-400 font-medium">
                                {LEVELS[post.author?.level || 0]?.name}
                              </span>
                            </div>
                            <span className="text-xs md:text-sm text-slate-500 flex items-center gap-1">
                              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                              {post.timestamp?.toDate && formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true, locale: it })}
                            </span>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
                            {post.content && (
                              <p className="text-slate-200 text-sm md:text-lg leading-relaxed whitespace-pre-wrap break-words">
                                {post.content}
                              </p>
                            )}

                            {/* Media (Immagine/Audio/Video) */}
                            {post.mediaUrl && (
                              <div className="mt-3 md:mt-4">
                                {post.mediaType === 'image' && (
                                  <img
                                    src={post.mediaUrl}
                                    alt="Post media"
                                    className="w-full rounded-xl md:rounded-2xl border border-white/10 shadow-xl"
                                  />
                                )}
                                {post.mediaType === 'audio' && (
                                  <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Mic size={20} className="text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">Messaggio Vocale</p>
                                        <p className="text-xs text-slate-400">Clicca play per ascoltare</p>
                                      </div>
                                    </div>
                                    <audio
                                      src={post.mediaUrl}
                                      controls
                                      controlsList="nodownload"
                                      className="w-full"
                                      style={{ height: '40px' }}
                                      onError={(e) => {
                                        console.error('Errore caricamento audio:', post.mediaUrl);
                                        e.target.parentElement.innerHTML = '<p class="text-red-400 text-sm">Errore caricamento audio</p>';
                                      }}
                                    />
                                  </div>
                                )}
                                {post.mediaType === 'video' && (
                                  <video
                                    src={post.mediaUrl}
                                    controls
                                    className="w-full rounded-xl md:rounded-2xl border border-white/10 shadow-xl"
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 md:gap-4 flex-wrap">
                            <button
                              onClick={() => likePost(post.id, post.likedBy?.includes(auth.currentUser.uid))}
                              className={`flex items-center gap-1.5 md:gap-3 px-2 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl transition-all duration-200 ${
                                post.likedBy?.includes(auth.currentUser.uid)
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'hover:bg-white/5 text-slate-400 hover:text-rose-400'
                              }`}
                            >
                              <Heart
                                size={16}
                                fill={post.likedBy?.includes(auth.currentUser.uid) ? "currentColor" : "none"}
                                className={`md:w-5 md:h-5 ${post.likedBy?.includes(auth.currentUser.uid) ? 'animate-pulse' : ''}`}
                              />
                              <span className="text-xs md:text-base font-medium">{post.likes || 0}</span>
                            </button>

                            <button
                              onClick={() => toggleComments(post.id)}
                              className={`flex items-center gap-1.5 md:gap-3 px-2 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl transition-all duration-200 ${
                                showCommentsForPost === post.id
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  : 'hover:bg-white/5 text-slate-400 hover:text-cyan-400'
                              }`}
                            >
                              <MessageSquare size={16} className="md:w-5 md:h-5" />
                              <span className="text-xs md:text-base font-medium">{postComments[post.id]?.length || 0}</span>
                            </button>

                            <button
                              className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-purple-400 transition-all duration-200"
                            >
                              <Share size={20} />
                            </button>

                            {isSuperAdmin && (
                              <button
                                onClick={() => pinPost(post.id, !post.pinned)}
                                className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-200 ${
                                  post.pinned
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'hover:bg-yellow-500/10 text-slate-400 hover:text-yellow-400'
                                }`}
                              >
                                <Pin size={20} />
                                <span className="font-medium">{post.pinned ? 'Unpin' : 'Pin'}</span>
                              </button>
                            )}

                            {(isSuperAdmin || post.author?.uid === auth.currentUser?.uid) && (
                              <button
                                onClick={() => deletePost(post.id)}
                                className="flex items-center gap-1.5 md:gap-3 px-2 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all duration-200"
                                title="Elimina"
                              >
                                <Trash2 size={16} className="md:w-5 md:h-5" />
                              </button>
                            )}

                            <button
                              className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-blue-400 transition-all duration-200 ml-auto"
                            >
                              <MoreHorizontal size={20} />
                            </button>
                          </div>

                          {/* Comments Section */}
                          <AnimatePresence>
                            {showCommentsForPost === post.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 border-t border-white/10 pt-4 space-y-3"
                              >
                                {/* Comment Input */}
                                <div className="flex items-start gap-3">
                                  <img
                                    src={auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser.displayName || 'User')}`}
                                    alt="Your avatar"
                                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                                  />
                                  <div className="flex-1 flex gap-2">
                                    <input
                                      type="text"
                                      value={showCommentsForPost === post.id ? commentText : ''}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && commentText.trim()) {
                                          addComment(post.id, commentText);
                                        }
                                      }}
                                      placeholder="Scrivi un commento..."
                                      className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                                    />
                                    <button
                                      onClick={() => addComment(post.id, commentText)}
                                      disabled={!commentText.trim()}
                                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                                    >
                                      <Send size={16} />
                                    </button>
                                  </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {loadingComments && showCommentsForPost === post.id ? (
                                    <div className="text-center py-4">
                                      <div className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  ) : postComments[post.id]?.length > 0 ? (
                                    postComments[post.id].map((comment) => (
                                      <motion.div
                                        key={comment.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-3 bg-slate-800/30 rounded-xl p-3"
                                      >
                                        <img
                                          src={comment.author?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.name || 'User')}`}
                                          alt={comment.author?.name}
                                          className="w-8 h-8 rounded-full object-cover border border-white/20"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-white text-sm">
                                              {comment.author?.name || 'Utente'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                              {comment.timestamp && formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true, locale: it })}
                                            </span>
                                          </div>
                                          <p className="text-slate-300 text-sm break-words">
                                            {comment.content}
                                          </p>
                                        </div>
                                      </motion.div>
                                    ))
                                  ) : (
                                    <p className="text-center text-slate-500 text-sm py-4">
                                      Nessun commento ancora. Sii il primo a commentare!
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Enhanced Input Area */}
          {channels.find(c => c.id === selectedChannel)?.readOnly ? null : (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex-shrink-0 border-t border-white/5 bg-slate-950/95 backdrop-blur-xl p-3 md:p-4 safe-area-bottom"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2">
                  {/* Upload Immagine */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <button
                    onClick={() => document.getElementById('image-upload').click()}
                    disabled={isUploading}
                    className="p-2 md:p-2.5 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                    title="Carica immagine"
                  >
                    <Image size={18} className="text-slate-400 md:w-5 md:h-5" />
                  </button>

                  {/* Registrazione Audio */}
                  <button
                    onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
                    disabled={isUploading}
                    className={`p-2 md:p-2.5 rounded-lg transition-colors touch-manipulation ${
                      isRecordingAudio 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'hover:bg-slate-700'
                    }`}
                    title={isRecordingAudio ? 'Stop registrazione' : 'Registra vocale'}
                  >
                    <Mic size={18} className={`${isRecordingAudio ? 'text-white' : 'text-slate-400'} md:w-5 md:h-5`} />
                  </button>
                  
                  <textarea
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendPost())}
                    placeholder={isUploading ? 'Invio...' : isRecordingAudio ? 'Registrando...' : 'Messaggio...'}
                    disabled={isUploading || isRecordingAudio}
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-slate-700 border border-slate-600 rounded-full text-sm md:text-base text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 resize-none"
                    rows={1}
                  />

                  <button
                    onClick={() => sendPost()}
                    disabled={(!newPost.trim() || newPost.length > 3000) && !isUploading}
                    className="p-2.5 md:p-3 bg-gradient-to-r from-rose-500 to-cyan-500 hover:from-rose-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-lg touch-manipulation"
                  >
                    <Send size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Progress indicator */}
                {isUploading && (
                  <div className="flex items-center gap-2 text-cyan-400 text-xs md:text-sm mt-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                    Upload in corso... {uploadProgress}%
                  </div>
                )}
              </div>
            </motion.div>
          )}
      </div>

      {/* Group Call Modal */}
      <AnimatePresence>
        {showGroupCall && activeGroupCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={() => setShowGroupCall(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30">
                    <Video size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Group Call Settimanale</h2>
                    <p className="text-slate-400">Partecipanti: {callParticipants.length}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 text-sm font-medium">REC</span>
                    </div>
                  )}

                  {isSuperAdmin && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={endGroupCall}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30 flex items-center gap-2"
                    >
                      <PhoneOff size={16} />
                      Termina Call
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowGroupCall(false)}
                    className="p-3 hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <X size={24} className="text-slate-400" />
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 p-6 h-[calc(80vh-100px)]">
                <div className="w-full h-full bg-black rounded-2xl border border-white/10 overflow-hidden">
                  <iframe
                    src={activeGroupCall.url}
                    allow="camera; microphone; fullscreen; speaker; display-capture"
                    className="w-full h-full"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminPanel && isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdminPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-4 lg:p-8 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="p-2 lg:p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl lg:rounded-2xl border border-purple-500/30">
                      <CrownIcon size={24} className="text-purple-400 lg:w-7 lg:h-7" />
                    </div>
                    <div>
                      <h2 className="text-lg lg:text-2xl font-bold text-white">Pannello Admin</h2>
                      <p className="text-xs lg:text-sm text-slate-400 hidden sm:block">Gestisci la Community</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAdminPanel(false)}
                    className="p-2 lg:p-3 hover:bg-white/10 rounded-xl lg:rounded-2xl transition-all"
                  >
                    <X size={20} className="text-slate-400 lg:w-6 lg:h-6" />
                  </motion.button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row h-[calc(90vh-100px)] lg:h-[600px] overflow-hidden">
                {/* Sidebar Admin - Horizontal scroll su mobile */}
                <div className="w-full lg:w-64 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/5 p-3 lg:p-6 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto">
                  <nav className="flex lg:flex-col gap-2 lg:space-y-6 lg:gap-0">
                    {/* Sistema */}
                    <div className="flex lg:block gap-2 lg:space-y-0">
                      <h4 className="hidden lg:block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Sistema</h4>
                      <div className="flex lg:block gap-2 lg:space-y-1">
                        {[
                          { id: 'levels', icon: Award, label: 'Livelli', desc: 'Configura livelli utente' },
                          { id: 'channels', icon: Hash, label: 'Canali', desc: 'Gestisci canali' },
                          { id: 'settings', icon: Settings, label: 'Impostazioni', desc: 'Configurazione generale' }
                        ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveAdminSection(item.id)}
                        className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all text-left group whitespace-nowrap ${
                          activeAdminSection === item.id ? 'bg-cyan-500/20 border border-cyan-500/30' : 'hover:bg-white/5'
                        }`}
                      >
                        <item.icon size={18} className={`lg:w-5 lg:h-5 ${
                          activeAdminSection === item.id ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                        }`} />
                        <div className="hidden lg:block">
                          <div className={`font-medium text-sm ${
                            activeAdminSection === item.id ? 'text-cyan-400' : 'text-white'
                          }`}>{item.label}</div>
                          <div className="text-xs text-slate-500">{item.desc}</div>
                        </div>
                        <span className="lg:hidden text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                      </div>
                    </div>

                    {/* Community */}
                    <div className="flex lg:block gap-2 lg:space-y-0">
                      <h4 className="hidden lg:block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Community</h4>
                      <div className="flex lg:block gap-2 lg:space-y-1">
                        {[
                          { id: 'users', icon: UsersIcon, label: 'Membri', desc: 'Gestisci utenti' },
                          { id: 'calls', icon: Video, label: 'Video Call', desc: 'Group calls e live' },
                          { id: 'stats', icon: BarChart3, label: 'Statistiche', desc: 'Analytics dettagliate' },
                          { id: 'moderation', icon: ShieldIcon, label: 'Moderazione', desc: 'Controlli contenuti' }
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => setActiveAdminSection(item.id)}
                            className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all text-left group whitespace-nowrap ${
                              activeAdminSection === item.id ? 'bg-cyan-500/20 border border-cyan-500/30' : 'hover:bg-white/5'
                            }`}
                          >
                            <item.icon size={18} className={`lg:w-5 lg:h-5 ${
                              activeAdminSection === item.id ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                            }`} />
                            <div className="hidden lg:block">
                              <div className={`font-medium text-sm ${
                                activeAdminSection === item.id ? 'text-cyan-400' : 'text-white'
                              }`}>{item.label}</div>
                              <div className="text-xs text-slate-500">{item.desc}</div>
                            </div>
                            <span className="lg:hidden text-sm font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </nav>
                </div>

                {/* Content Admin */}
                <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                  {/* Levels Management */}
                  {activeAdminSection === 'levels' && (
                    <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg lg:text-xl font-bold text-white mb-1 lg:mb-2">Gestione Livelli</h3>
                        <p className="text-sm lg:text-base text-slate-400">Configura i livelli e i requisiti</p>
                      </div>
                      <div className="flex gap-2 lg:gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={addLevel}
                          className="px-3 lg:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg lg:rounded-xl font-medium flex items-center gap-2 text-sm lg:text-base"
                        >
                          <Plus size={14} className="lg:w-4 lg:h-4" />
                          <span className="hidden sm:inline">Aggiungi</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={saveLevels}
                          className="px-3 lg:px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg lg:rounded-xl font-medium flex items-center gap-2 text-sm lg:text-base"
                        >
                          <Save size={14} className="lg:w-4 lg:h-4" />
                          Salva
                        </motion.button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {adminLevels.map((level, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-slate-800/50 rounded-2xl p-6 border border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${level.color.replace('500', '500')} to-${level.color.replace('500', '600')} flex items-center justify-center`}>
                              <level.icon size={24} className="text-white" />
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <label className="text-sm text-slate-400">Nome</label>
                                <input
                                  value={level.name}
                                  onChange={e => updateLevel(index, 'name', e.target.value)}
                                  className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-slate-400">Min Likes</label>
                                <input
                                  type="number"
                                  value={level.min}
                                  onChange={e => updateLevel(index, 'min', parseInt(e.target.value))}
                                  className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-slate-400">Colore</label>
                                <select
                                  value={level.color}
                                  onChange={e => updateLevel(index, 'color', e.target.value)}
                                  className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white mt-1"
                                >
                                  <option value="gray-500">Grigio</option>
                                  <option value="blue-500">Blu</option>
                                  <option value="purple-500">Viola</option>
                                  <option value="pink-500">Rosa</option>
                                  <option value="yellow-500">Giallo</option>
                                </select>
                              </div>
                              <div className="flex items-end gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeLevel(index)}
                                  disabled={adminLevels.length <= 1}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Channels Management */}
                  {activeAdminSection === 'channels' && (
                    <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Gestione Canali</h3>
                        <p className="text-slate-400">Configura i canali della community</p>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={addChannel}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Aggiungi Canale
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={saveChannels}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium flex items-center gap-2"
                        >
                          <Save size={16} />
                          Salva
                        </motion.button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {adminChannels.map((channel, index) => (
                        <motion.div
                          key={channel.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-slate-800/50 rounded-2xl p-6 border border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-700/50 rounded-xl">
                              <channel.icon size={24} className="text-cyan-400" />
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div>
                                <label className="text-sm text-slate-400">ID</label>
                                <input
                                  value={channel.id}
                                  onChange={e => updateChannel(index, 'id', e.target.value)}
                                  className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-slate-400">Nome</label>
                                <input
                                  value={channel.name}
                                  onChange={e => updateChannel(index, 'name', e.target.value)}
                                  className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-slate-400">Icona</label>
                                <select
                                  value={channel.icon.name}
                                  onChange={e => {
                                    const iconMap = { Sparkles, Users, Trophy, MessageCircle, Volume2, Calendar };
                                    updateChannel(index, 'icon', iconMap[e.target.value] || MessageCircle);
                                  }}
                                  className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white mt-1"
                                >
                                  <option value="Sparkles">Sparkles</option>
                                  <option value="Users">Users</option>
                                  <option value="Trophy">Trophy</option>
                                  <option value="MessageCircle">MessageCircle</option>
                                  <option value="Volume2">Volume2</option>
                                  <option value="Calendar">Calendar</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={channel.locked}
                                  onChange={e => updateChannel(index, 'locked', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <label className="text-sm text-slate-400">Bloccato</label>
                              </div>
                              <div className="flex items-end gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeChannel(index)}
                                  disabled={adminChannels.length <= 1}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Users Management */}
                  {activeAdminSection === 'users' && (
                    <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Gestione Utenti</h3>
                        <p className="text-slate-400">Lista membri, profili, livelli</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openProfileModal()}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center gap-2"
                        >
                          <Edit size={16} />
                          Mio Profilo
                        </motion.button>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl border border-white/10 overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        {membersList.map(member => {
                          // Calcola il livello corretto (manuale se impostato, altrimenti basato sui likes)
                          const hasManualLevel = member.levelOverride && member.manualLevel !== undefined;
                          const currentLevelIndex = hasManualLevel ? member.manualLevel : LEVELS.findIndex(l => l.min <= (member.totalLikes || 0));
                          const memberLevel = LEVELS[Math.max(0, currentLevelIndex)] || LEVELS[0];
                          const isBanned = bannedUsers.includes(member.uid);
                          const isSuperAdmin = member.uid === auth.currentUser?.uid; // Per ora semplificato

                          return (
                            <div key={member.uid} className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={member.photoURL || "/default-avatar.png"}
                                    alt={member.displayName || "Utente"}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                                  />
                                  {isBanned && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                      <Ban size={10} className="text-white" />
                                    </div>
                                  )}
                                  {hasManualLevel && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                                      <Edit size={10} className="text-white" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-white font-medium flex items-center gap-2">
                                    {member.displayName || "Utente senza nome"}
                                    {isSuperAdmin && <CrownIcon size={14} className="text-yellow-400" />}
                                  </div>
                                  <div className="text-sm text-slate-400 flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                      memberLevel.color === 'gray-500' ? 'bg-gray-500/20 text-gray-400' :
                                      memberLevel.color === 'blue-500' ? 'bg-blue-500/20 text-blue-400' :
                                      memberLevel.color === 'purple-500' ? 'bg-purple-500/20 text-purple-400' :
                                      memberLevel.color === 'pink-500' ? 'bg-pink-500/20 text-pink-400' :
                                      'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                      {memberLevel.name}
                                      {hasManualLevel && " (manuale)"}
                                    </span>
                                    <span>{member.totalLikes || 0} likes</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={memberLevel.name}
                                  onChange={(e) => {
                                    const levelIndex = LEVELS.findIndex(l => l.name === e.target.value);
                                    if (levelIndex !== -1) {
                                      manualLevelChange(member.uid, levelIndex);
                                    }
                                  }}
                                  className="bg-slate-700/50 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:border-cyan-400 focus:outline-none"
                                >
                                  {LEVELS.map((level, index) => (
                                    <option key={level.name} value={level.name}>
                                      {level.name}
                                    </option>
                                  ))}
                                </select>

                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => openProfileModal(member)}
                                  className="p-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-400 hover:text-white rounded-lg transition-colors"
                                >
                                  <Edit size={14} />
                                </motion.button>

                                {!isBanned ? (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => banUser(member.uid)}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
                                  >
                                    <Ban size={14} />
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => unbanUser(member.uid)}
                                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg"
                                  >
                                    <Check size={14} />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Moderation */}
                  {activeAdminSection === 'moderation' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Moderazione</h3>
                        <p className="text-slate-400">Gestisci contenuti e comportamenti</p>
                      </div>

                      <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                        <div className="text-center py-8">
                          <ShieldIcon size={48} className="text-slate-500 mx-auto mb-4" />
                          <p className="text-slate-400">Funzionalità di moderazione in sviluppo...</p>
                          <p className="text-xs text-slate-500 mt-2">Ban temporanei, gestione segnalazioni, filtri contenuti</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeAdminSection === 'stats' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Statistiche Community</h3>
                        <p className="text-slate-400">Analisi completa dell'attività</p>
                      </div>

                      {/* Metriche Principali */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        {[
                          { label: 'Post Totali', value: communityStats.totalPosts || 0, icon: MessageSquare, color: 'blue', trend: '+12%' },
                          { label: 'Utenti Attivi', value: communityStats.activeUsers || 0, icon: UsersIcon, color: 'green', trend: '+8%' },
                          { label: 'Like Totali', value: communityStats.totalLikes || 0, icon: Heart, color: 'red', trend: '+25%' },
                          { label: 'Call Registrate', value: communityStats.totalCalls || 0, icon: Video, color: 'purple', trend: '+5%' }
                        ].map(stat => (
                          <motion.div 
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-white/10 hover:border-cyan-400/50 transition-colors"
                          >
                            <div className={`p-1.5 lg:p-2 bg-${stat.color}-500/20 rounded-lg lg:rounded-xl w-fit mb-2 lg:mb-3`}>
                              {React.createElement(stat.icon, { size: 16, className: `lg:w-5 lg:h-5 text-${stat.color}-400` })}
                            </div>
                            <div className="text-xl lg:text-2xl font-bold text-white">{stat.value}</div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 gap-1">
                              <div className="text-xs lg:text-sm text-slate-400">{stat.label}</div>
                              <div className="text-xs text-green-400 flex items-center gap-1">
                                <TrendingUp size={10} className="lg:w-3 lg:h-3" />
                                {stat.trend}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Grafici e Statistiche Dettagliate */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                        {/* Attività per Livello */}
                        <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/10">
                          <h4 className="text-base lg:text-lg font-bold text-white mb-3 lg:mb-4 flex items-center gap-2">
                            <Trophy className="text-yellow-400" size={18} />
                            Attività per Livello
                          </h4>
                          <div className="space-y-3">
                            {LEVELS.map((level, idx) => {
                              const count = membersList.filter(m => {
                                const userLevel = m.manualLevel ?? m.level ?? 0;
                                return userLevel === idx;
                              }).length;
                              const percentage = membersList.length > 0 ? (count / membersList.length * 100).toFixed(1) : 0;
                              return (
                                <div key={level.name}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <level.icon size={16} className={`text-${level.color}`} />
                                      <span className="text-sm text-slate-300">{level.name}</span>
                                    </div>
                                    <span className="text-sm font-medium text-white">{count} utenti</span>
                                  </div>
                                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                                    <div 
                                      className={`bg-gradient-to-r from-${level.color} to-${level.color.replace('500', '600')} h-2 rounded-full transition-all`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Engagement */}
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="text-cyan-400" size={20} />
                            Engagement
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Tasso di Interazione</span>
                                <span className="text-lg font-bold text-white">
                                  {membersList.length > 0 
                                    ? ((communityStats.activeUsers || 0) / membersList.length * 100).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                                  style={{ 
                                    width: `${membersList.length > 0 
                                      ? ((communityStats.activeUsers || 0) / membersList.length * 100)
                                      : 0}%` 
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Like per Post</span>
                                <span className="text-lg font-bold text-white">
                                  {communityStats.totalPosts > 0 
                                    ? ((communityStats.totalLikes || 0) / communityStats.totalPosts).toFixed(1)
                                    : 0}
                                </span>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full w-3/4"></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Partecipazione Calls</span>
                                <span className="text-lg font-bold text-white">
                                  {membersList.length > 0 
                                    ? ((communityStats.totalCalls || 0) / membersList.length * 100).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-1/2"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Contributors */}
                      <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Star className="text-yellow-400" size={20} />
                          Top Contributors
                        </h4>
                        <div className="space-y-3">
                          {membersList
                            .sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0))
                            .slice(0, 5)
                            .map((member, idx) => {
                              const userLevel = member.manualLevel ?? member.level ?? 0;
                              const currentLevel = LEVELS[userLevel] || LEVELS[0];
                              return (
                                <div 
                                  key={member.uid}
                                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="text-slate-400 font-bold w-6">#{idx + 1}</div>
                                    <img 
                                      src={member.photoURL || 'https://via.placeholder.com/40'} 
                                      alt={member.displayName}
                                      className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400/50"
                                    />
                                    <div>
                                      <div className="text-white font-medium">{member.displayName || 'Utente'}</div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <currentLevel.icon size={12} className={`text-${currentLevel.color}`} />
                                        <span className={`text-${currentLevel.color}`}>{currentLevel.name}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-white font-bold">{member.totalLikes || 0}</div>
                                    <div className="text-xs text-slate-400">likes</div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Attività Recente */}
                      <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Flame className="text-orange-400" size={20} />
                          Attività Ultimi 7 Giorni
                        </h4>
                        <div className="grid grid-cols-7 gap-2">
                          {[6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
                            const date = new Date();
                            date.setDate(date.getDate() - daysAgo);
                            const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
                            // Simulated activity level (replace with real data)
                            const activity = Math.floor(Math.random() * 100);
                            return (
                              <div key={daysAgo} className="text-center">
                                <div className="text-xs text-slate-400 mb-2">{dayName}</div>
                                <div 
                                  className="h-20 bg-slate-700/50 rounded-lg relative overflow-hidden"
                                  title={`${activity} interazioni`}
                                >
                                  <div 
                                    className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all"
                                    style={{ height: `${activity}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-white font-medium mt-1">{activity}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Metriche Avanzate */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                        {/* Crescita Community */}
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                          <h4 className="text-sm font-bold text-slate-400 mb-4">Crescita Membri</h4>
                          <div className="text-3xl font-bold text-white mb-2">+{Math.floor(membersList.length * 0.15)}</div>
                          <div className="text-xs text-green-400 flex items-center gap-1">
                            <TrendingUp size={12} />
                            +15% questo mese
                          </div>
                          <div className="mt-4 h-16">
                            <div className="flex items-end justify-between h-full gap-1">
                              {[30, 45, 38, 52, 48, 65, 72].map((val, idx) => (
                                <div key={idx} className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t" style={{ height: `${val}%` }}></div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Media Like per Post */}
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                          <h4 className="text-sm font-bold text-slate-400 mb-4">Media Like/Post</h4>
                          <div className="text-3xl font-bold text-white mb-2">
                            {communityStats.totalPosts > 0 
                              ? ((communityStats.totalLikes || 0) / communityStats.totalPosts).toFixed(1)
                              : '0'}
                          </div>
                          <div className="text-xs text-pink-400 flex items-center gap-1">
                            <Heart size={12} />
                            Ottimo engagement
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>Target: 10</span>
                              <span>{communityStats.totalPosts > 0 
                                ? Math.min(100, ((communityStats.totalLikes / communityStats.totalPosts) / 10 * 100)).toFixed(0)
                                : 0}%</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all"
                                style={{ width: `${communityStats.totalPosts > 0 
                                  ? Math.min(100, ((communityStats.totalLikes / communityStats.totalPosts) / 10 * 100))
                                  : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Tasso Retention */}
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                          <h4 className="text-sm font-bold text-slate-400 mb-4">Retention Rate</h4>
                          <div className="text-3xl font-bold text-white mb-2">87%</div>
                          <div className="text-xs text-cyan-400 flex items-center gap-1">
                            <Target size={12} />
                            Sopra la media
                          </div>
                          <div className="mt-4">
                            <div className="relative w-24 h-24 mx-auto">
                              <svg className="transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="10" />
                                <circle 
                                  cx="50" cy="50" r="45" 
                                  fill="none" 
                                  stroke="url(#gradient)" 
                                  strokeWidth="10" 
                                  strokeDasharray="283" 
                                  strokeDashoffset={283 - (283 * 0.87)}
                                  strokeLinecap="round"
                                />
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-cyan-400">87%</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Distribuzione Contenuti */}
                      <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/10">
                        <h4 className="text-base lg:text-lg font-bold text-white mb-3 lg:mb-4 flex items-center gap-2">
                          <Layers className="text-purple-400" size={18} />
                          Distribuzione Contenuti
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                          {[
                            { type: 'Testo', count: posts.filter(p => !p.mediaUrl).length, icon: MessageSquare, color: 'blue' },
                            { type: 'Immagini', count: posts.filter(p => p.mediaType === 'image').length, icon: Image, color: 'green' },
                            { type: 'Audio', count: posts.filter(p => p.mediaType === 'audio').length, icon: Mic, color: 'orange' },
                            { type: 'Video', count: posts.filter(p => p.mediaType === 'video').length, icon: Video, color: 'purple' }
                          ].map(item => (
                            <div key={item.type} className="text-center">
                              <div className={`w-12 h-12 bg-${item.color}-500/20 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                                <item.icon size={24} className={`text-${item.color}-400`} />
                              </div>
                              <div className="text-2xl font-bold text-white">{item.count}</div>
                              <div className="text-xs text-slate-400">{item.type}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Orari di Picco */}
                      <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/10">
                        <h4 className="text-base lg:text-lg font-bold text-white mb-3 lg:mb-4 flex items-center gap-2">
                          <Calendar className="text-yellow-400" size={18} />
                          Orari di Picco
                        </h4>
                        <div className="space-y-3">
                          {[
                            { time: '08:00 - 10:00', activity: 65, label: 'Mattina' },
                            { time: '12:00 - 14:00', activity: 85, label: 'Pranzo' },
                            { time: '18:00 - 20:00', activity: 95, label: 'Sera' },
                            { time: '21:00 - 23:00', activity: 75, label: 'Notte' }
                          ].map(slot => (
                            <div key={slot.time}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-300">{slot.time} <span className="text-slate-500">({slot.label})</span></span>
                                <span className="text-sm font-bold text-white">{slot.activity}%</span>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                                  style={{ width: `${slot.activity}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Community Settings */}
                  {activeAdminSection === 'settings' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Impostazioni Community</h3>
                        <p className="text-slate-400">Configurazioni generali</p>
                      </div>

                      <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-400">Nome Community</label>
                            <input
                              value={communitySettings.name}
                              onChange={(e) => setCommunitySettings(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white mt-1 focus:border-cyan-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-400">Descrizione</label>
                            <input
                              value={communitySettings.description}
                              onChange={(e) => setCommunitySettings(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white mt-1 focus:border-cyan-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Toggle Community Attiva/Disattiva */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div>
                            <div className="text-white font-medium flex items-center gap-2">
                              <ShieldIcon size={18} className="text-cyan-400" />
                              Community Attiva
                            </div>
                            <div className="text-sm text-slate-400">Disattiva per manutenzione o eventi speciali</div>
                          </div>
                          <button
                            onClick={() => setCommunitySettings(prev => ({ ...prev, communityEnabled: !prev.communityEnabled }))}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                              communitySettings.communityEnabled ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                              communitySettings.communityEnabled ? 'left-6.5' : 'left-0.5'
                            }`}></div>
                          </button>
                        </div>

                        {/* Messaggio community disabilitata */}
                        {!communitySettings.communityEnabled && (
                          <div className="bg-slate-700/50 rounded-lg p-4">
                            <label className="text-sm text-slate-400 block mb-2">Messaggio per utenti</label>
                            <textarea
                              value={communitySettings.disabledMessage}
                              onChange={(e) => setCommunitySettings(prev => ({ ...prev, disabledMessage: e.target.value }))}
                              className="w-full bg-slate-800/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none resize-none"
                              rows={3}
                              placeholder="Inserisci un messaggio che verrà mostrato agli utenti..."
                            />
                          </div>
                        )}

                        {/* Toggle Foto e Nome Obbligatori */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div>
                            <div className="text-white font-medium flex items-center gap-2">
                              <UserCheck size={18} className="text-purple-400" />
                              Profilo Obbligatorio
                            </div>
                            <div className="text-sm text-slate-400">Richiedi foto e nome al primo accesso</div>
                          </div>
                          <button
                            onClick={() => setCommunitySettings(prev => ({ ...prev, requireProfileSetup: !prev.requireProfileSetup }))}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                              communitySettings.requireProfileSetup ? 'bg-cyan-500' : 'bg-slate-600'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                              communitySettings.requireProfileSetup ? 'left-6.5' : 'left-0.5'
                            }`}></div>
                          </button>
                        </div>

                        {/* Toggle Video Introduttivo Obbligatorio */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div>
                            <div className="text-white font-medium flex items-center gap-2">
                              <VideoIcon size={18} className="text-pink-400" />
                              Video Introduttivo Obbligatorio
                            </div>
                            <div className="text-sm text-slate-400">Richiedi visione video prima dell'accesso</div>
                          </div>
                          <button
                            onClick={() => setCommunitySettings(prev => ({ ...prev, requireIntroVideo: !prev.requireIntroVideo }))}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                              communitySettings.requireIntroVideo ? 'bg-cyan-500' : 'bg-slate-600'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                              communitySettings.requireIntroVideo ? 'left-6.5' : 'left-0.5'
                            }`}></div>
                          </button>
                        </div>

                        {/* Upload Video Cloudflare */}
                        {communitySettings.requireIntroVideo && (
                          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                            <label className="text-sm text-slate-400 block">Video Introduttivo</label>
                            
                            {communitySettings.introVideoUrl ? (
                              <div className="space-y-3">
                                <video 
                                  src={communitySettings.introVideoUrl} 
                                  controls 
                                  className="w-full rounded-lg bg-slate-900"
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    value={communitySettings.introVideoUrl}
                                    readOnly
                                    className="flex-1 bg-slate-800/50 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                                  />
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCommunitySettings(prev => ({ ...prev, introVideoUrl: '' }))}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
                                  >
                                    <X size={16} />
                                  </motion.button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    try {
                                      setUploadingVideo(true);
                                      const url = await uploadToR2(
                                        file,
                                        'community',
                                        'intro_videos',
                                        (progress) => setUploadProgress(progress.percent),
                                        true // No size limit for admin
                                      );
                                      setCommunitySettings(prev => ({ ...prev, introVideoUrl: url }));
                                    } catch (error) {
                                      console.error('Errore upload video:', error);
                                      alert('Errore durante l\'upload del video');
                                    } finally {
                                      setUploadingVideo(false);
                                      setUploadProgress(0);
                                    }
                                  }}
                                  className="hidden"
                                  id="intro-video-upload"
                                />
                                <label
                                  htmlFor="intro-video-upload"
                                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-800/50 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-cyan-400 hover:bg-slate-800/70 transition-all"
                                >
                                  {uploadingVideo ? (
                                    <>
                                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      <span className="text-white">Caricamento... {uploadProgress}%</span>
                                    </>
                                  ) : (
                                    <>
                                      <VideoIcon size={20} className="text-cyan-400" />
                                      <span className="text-white">Carica Video (Dimensione illimitata)</span>
                                    </>
                                  )}
                                </label>
                                <p className="text-xs text-slate-500 mt-2">Il video verrà caricato su Cloudflare R2. Dimensione illimitata per admin.</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div>
                            <div className="text-white font-medium">Registrazione Automatica Calls</div>
                            <div className="text-sm text-slate-400">Salva automaticamente le group call</div>
                          </div>
                          <button
                            onClick={() => setCommunitySettings(prev => ({ ...prev, autoRecordCalls: !prev.autoRecordCalls }))}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                              communitySettings.autoRecordCalls ? 'bg-cyan-500' : 'bg-slate-600'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                              communitySettings.autoRecordCalls ? 'left-6.5' : 'left-0.5'
                            }`}></div>
                          </button>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/10">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={saveCommunitySettings}
                            disabled={savingSettings}
                            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingSettings ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Salvataggio...
                              </>
                            ) : (
                              <>
                                <Save size={16} />
                                Salva Impostazioni
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Group Calls Management */}
                  {activeAdminSection === 'calls' && (
                    <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Group Calls</h3>
                        <p className="text-slate-400">Gestisci videochiamate settimanali</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGroupCall}
                        disabled={activeGroupCall}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        <Video size={16} />
                        Avvia Call
                      </motion.button>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                      {activeGroupCall ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-400 font-medium">Call Attiva</span>
                            </div>
                            <span className="text-slate-400 text-sm">
                              Partecipanti: {callParticipants.length}
                            </span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={endGroupCall}
                            className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30 flex items-center justify-center gap-2"
                          >
                            <PhoneOff size={16} />
                            Termina Group Call
                          </motion.button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Video size={48} className="text-slate-500 mx-auto mb-4" />
                          <p className="text-slate-400">Nessuna call attiva</p>
                          <p className="text-xs text-slate-500 mt-2">Avvia una group call settimanale</p>
                        </div>
                      )}
                    </div>
                    </div>
                  )}
                  </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {editingProfile ? `Modifica Profilo: ${editingProfile.displayName || 'Utente'}` : 'Il Mio Profilo'}
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={profilePhotoPreview || profileData.photoURL || 'https://ui-avatars.com/api/?name=' + (profileData.displayName || 'User')}
                      alt="Foto profilo"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                    />
                    {selectedProfilePhoto && (
                      <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        ✓ Pronta
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistiche (solo per il proprio profilo) */}
                {!editingProfile && (
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Le Mie Statistiche</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-cyan-400">{userData?.posts || 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Post Pubblicati</div>
                      </div>
                      
                      <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-rose-400">{userData?.totalLikes || 0}</div>
                        <div className="text-xs text-slate-400 mt-1">Likes Ricevuti</div>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Livello Attuale</span>
                        <div 
                          className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5"
                          style={{ 
                            background: `linear-gradient(135deg, ${currentLevel.color}, ${currentLevel.color}dd)`,
                            color: 'white'
                          }}
                        >
                          <currentLevel.icon size={16} />
                          {currentLevel.name}
                        </div>
                      </div>
                      
                      {nextLevel && (
                        <>
                          <div className="w-full bg-slate-700/50 rounded-full h-2 mb-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 text-center">
                            {nextLevel.min - (userData?.totalLikes || 0)} likes per raggiungere {nextLevel.name}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Nome Visualizzato</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full bg-slate-800/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                      placeholder="Inserisci il tuo nome"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Foto Profilo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoSelect}
                      className="hidden"
                      id="edit-profile-photo-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="edit-profile-photo-upload"
                      className="block w-full text-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedProfilePhoto ? 'Cambia Foto' : 'Carica Nuova Foto'}
                    </label>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Max 5MB - Formato quadrato consigliato
                    </p>
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Caricamento...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 bg-slate-700/50 text-slate-300 py-3 rounded-2xl font-semibold hover:bg-slate-700/70 transition-colors"
                  >
                    Annulla
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveProfile}
                    disabled={isUploading}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? `Caricamento ${uploadProgress}%...` : 'Salva'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      <AnimatePresence>
        {showMembersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMembersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-2xl w-full max-h-[80vh] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Membri Community</h3>
                <div className="text-slate-400 text-sm">
                  {membersList.length} membri
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {membersList.map((member) => {
                  // Calculate level based on totalLikes
                  const memberLikes = member.totalLikes || 0;
                  const hasManualLevel = member.manualLevel !== undefined;
                  const levelIndex = hasManualLevel 
                    ? member.manualLevel 
                    : LEVELS.findIndex(l => memberLikes >= l.min && (l.next === undefined || memberLikes < l.next));
                  const level = LEVELS[levelIndex >= 0 ? levelIndex : 0];
                  return (
                    <motion.div
                      key={member.uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-cyan-400/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName || 'User')}`}
                            alt={member.displayName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                          />
                          <div 
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                            style={{ 
                              background: `linear-gradient(135deg, ${level.color}, ${level.color}dd)`,
                              color: 'white'
                            }}
                          >
                            <level.icon size={12} />
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold">
                              {member.displayName || 'Utente'}
                            </h4>
                            {adminUids.includes(member.uid) && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full font-medium">
                                Admin
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div 
                              className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5"
                              style={{ 
                                background: `linear-gradient(135deg, ${level.color}, ${level.color}dd)`,
                                color: 'white'
                              }}
                            >
                              <level.icon size={14} />
                              {level.name}
                            </div>
                            <div className="text-slate-400 text-sm">
                              {member.posts || 0} post
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowMembersModal(false)}
                className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-2xl font-semibold"
              >
                Chiudi
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Impostazioni Community</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl">
                  <span className="text-slate-300">Notifiche</span>
                  <div className="w-12 h-6 bg-cyan-500 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl">
                  <span className="text-slate-300">Post privati</span>
                  <div className="w-12 h-6 bg-slate-600 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettings(false)}
                className="w-full mt-6 bg-gradient-to-r from-rose-500 to-cyan-500 text-white py-3 rounded-2xl font-semibold"
              >
                Chiudi
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
    </>
  );
}