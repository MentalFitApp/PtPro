import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp, increment, arrayUnion, arrayRemove, where, limit, startAfter } from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Trophy, MessageSquare, Lightbulb, Plus, Heart, MessageCircle, Award, Crown, Send, Image, Video as VideoIcon, X, UsersRound, Bookmark, Share2, Search, Hash, Flame, ThumbsUp, Zap, Flag, Pin, TrendingUp, BarChart3, Target, CheckCircle, Trash2, MoreVertical, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import MediaUploadButton from '../components/MediaUploadButton';
import MediaViewer from '../components/MediaViewer';

// Canali community con icone come componenti React
const DEFAULT_CHANNELS = {
  vittorie: { name: 'Vittorie', icon: Trophy, description: 'Condividi i tuoi risultati durante il percorso', emoji: '🏆' },
  domande: { name: 'Domande', icon: MessageCircle, description: 'Fai domande pubbliche per far crescere tutta la community', emoji: '❓' },
  consigli: { name: 'Consigli', icon: Lightbulb, description: 'Consigli utili e esperienze da condividere', emoji: '💡' },
};

// Rewards per livelli
const DEFAULT_REWARDS = {
  2: { name: 'Group Calls', description: 'Accesso alle chiamate di gruppo settimanali', icon: '📞', enabled: true },
  3: { name: 'Massimo Riposo', description: 'Sistema per recuperare al meglio e ottimizzare il sonno', icon: '😴', enabled: true },
  4: { name: 'Protocollo Anti-Stress', description: 'Videocorso per ridurre lo stress mentale', icon: '🧘', enabled: true },
  5: { name: '+1 Mese Regalo', description: '+1 mese in regalo e un bonus segreto', icon: '🎁', enabled: true },
};

// Reactions disponibili
const REACTIONS = [
  { id: 'heart', emoji: '❤️', label: 'Mi piace' },
  { id: 'fire', emoji: '🔥', label: 'Forte' },
  { id: 'muscle', emoji: '💪', label: 'Motivante' },
  { id: 'clap', emoji: '👏', label: 'Bravo' },
  { id: 'party', emoji: '🎉', label: 'Fantastico' },
];

// Badge sbloccabili (gamification)
const ACHIEVEMENT_BADGES = {
  firstPost: {
    name: 'Primo Post',
    description: 'Hai pubblicato il tuo primo post!',
    icon: '🥇',
  },
  posts100: {
    name: '100 Post',
    description: 'Hai pubblicato 100 post!',
    icon: '🏆',
  },
  streak7: {
    name: 'Streak 7 Giorni',
    description: 'Hai partecipato per 7 giorni consecutivi!',
    icon: '🔥',
  },
  streak30: {
    name: 'Streak 30 Giorni',
    description: 'Hai partecipato per 30 giorni consecutivi!',
    icon: '💯',
  },
};
const OFFENSIVE_WORDS = ['spam', 'scam', 'truffa']; // Espandibile dall'admin

// Helper: livelli gamification secondo specifiche
const getUserLevel = (totalLikes) => {
  if (totalLikes >= 100) return { id: 5, name: 'MentalFit', color: 'from-purple-500 to-pink-500', borderColor: 'border-purple-500', textColor: 'text-purple-400' };
  if (totalLikes >= 50) return { id: 4, name: 'Elite', color: 'from-yellow-500 to-orange-500', borderColor: 'border-yellow-500', textColor: 'text-yellow-400' };
  if (totalLikes >= 16) return { id: 3, name: 'Pro', color: 'from-blue-500 to-cyan-500', borderColor: 'border-blue-500', textColor: 'text-blue-400' };
  if (totalLikes >= 2) return { id: 2, name: 'Intermedio', color: 'from-green-500 to-emerald-500', borderColor: 'border-green-500', textColor: 'text-green-400' };
  return { id: 1, name: 'Start', color: 'from-slate-500 to-slate-600', borderColor: 'border-slate-500', textColor: 'text-slate-400' };
};

// Badge livello compatto riutilizzato nel feed/members
const LevelBadge = ({ totalLikes = 0, size = 'sm' }) => {
  const level = getUserLevel(totalLikes);
  const sizeClasses = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${level.color} ${sizeClasses} font-semibold text-white shadow-sm border border-white/10`}>Lv{level.id}</span>
  );
};
 

// Helper: avatar gamificato con contorno colorato per livello
const Avatar = ({ src, alt, totalLikes = 0, size = 40, showLevel = true }) => {
  const level = getUserLevel(totalLikes);
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt || 'User')}&size=${size}`;
  return (
    <div className="relative inline-block">
      <div className={`rounded-full p-1 bg-gradient-to-br ${level.color}`}>
        <img
          src={src || fallback}
          alt={alt}
          className="rounded-full object-cover bg-slate-900"
          style={{ width: size, height: size }}
        />
      </div>
      {showLevel && (
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900`}>
          {level.id}
        </div>
      )}
    </div>
  );
};

// Helper: timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Ora';
  const date = timestamp.toDate?.() || new Date(timestamp);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Community() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState('vittorie');
  // eslint-disable-next-line no-unused-vars
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [newPostChannel, setNewPostChannel] = useState('vittorie');
  // eslint-disable-next-line no-unused-vars
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  // eslint-disable-next-line no-unused-vars
  const [showMembersList, setShowMembersList] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [allMembers, setAllMembers] = useState([]);
  const [newPostMedia, setNewPostMedia] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('channels');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState('chat'); // 'chat' o 'videocall'
  const [newChannelIcon, setNewChannelIcon] = useState('MessageSquare');
  const [deleteConfirmChannel, setDeleteConfirmChannel] = useState(null);
  const [editingUserLevel, setEditingUserLevel] = useState(null); // { userId, currentLikes }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'members', 'liveRoom'
  // eslint-disable-next-line no-unused-vars
  const [onlineUsers, setOnlineUsers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [rewards, setRewards] = useState(DEFAULT_REWARDS);
  const [showRewards, setShowRewards] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null); // Per mostrare commenti
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState({}); // { postId: [comments] }
  const [errorPopup, setErrorPopup] = useState(null); // { title, message }
  const [communityEnabled, setCommunityEnabled] = useState(true);
  const [communityDisabledMessage, setCommunityDisabledMessage] = useState('La Community è temporaneamente disattivata. Torna presto!');
  
  // Nuovi stati per funzionalità avanzate (future features - currently unused)
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]); // Post salvati
  const [searchQuery, setSearchQuery] = useState(''); // Ricerca globale
  const [showReactionPicker, setShowReactionPicker] = useState(null); // ID post per picker reactions
  // eslint-disable-next-line no-unused-vars
  const [showShareModal, setShowShareModal] = useState(null); // ID post per share
  const [showReportModal, setShowReportModal] = useState(null); // ID post/comment per report
  const [userStreak, setUserStreak] = useState(0); // Giorni consecutivi attività
  const [userBadges, setUserBadges] = useState([]); // Badge ottenuti
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [leaderboard, setLeaderboard] = useState([]); // Top contributors
  // eslint-disable-next-line no-unused-vars
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('week'); // week, month, allTime
  const [showPollModal, setShowPollModal] = useState(false); // Crea sondaggio
  const [pollOptions, setPollOptions] = useState(['', '']); // Opzioni sondaggio
  const [lastVisible, setLastVisible] = useState(null); // Pagination infinite scroll
  const [hasMore, setHasMore] = useState(true); // Se ci sono altri post
  const [loadingMore, setLoadingMore] = useState(false); // Loading più post
  const [adminIds, setAdminIds] = useState([]); // Per mostrare checkmark sui nomi admin
  // eslint-disable-next-line no-unused-vars
  const scrollObserver = useRef(); // Observer per infinite scroll
  // eslint-disable-next-line no-unused-vars
  const [mentionSuggestions, setMentionSuggestions] = useState([]); // Suggerimenti @username
  // eslint-disable-next-line no-unused-vars
  const [showMentions, setShowMentions] = useState(false); // Mostra dropdown menzioni
  // eslint-disable-next-line no-unused-vars
  const [draftContent, setDraftContent] = useState(''); // Bozza autosave
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [notifications, setNotifications] = useState([]); // Notifiche in-app
  const [unreadCount, setUnreadCount] = useState(0); // Badge notifiche
  const [showNotifications, setShowNotifications] = useState(false); // Pannello notifiche
  const [pinnedPosts, setPinnedPosts] = useState([]); // Post fissati da admin
  // eslint-disable-next-line no-unused-vars
  const [analyticsData, setAnalyticsData] = useState(null); // Dati analytics admin
  const [showPostMenu, setShowPostMenu] = useState(null); // ID post per mostrare menu

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Carica profilo utente con totalLikes
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = { id: user.uid, ...userDoc.data() };
          setUserProfile(userData);
          setBookmarkedPosts(userData.bookmarkedPosts || []);
          setUserStreak(userData.streak || 0);
          setUserBadges(userData.badges || []);
          updateStreak();
        } else {
          // Crea documento utente se non esiste per abilitare modifica profilo
          const initialUser = {
            name: user.displayName || 'Utente',
            photoURL: user.photoURL || '',
            totalLikes: 0,
            badges: [],
            streak: 0,
            createdAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', user.uid), initialUser, { merge: true });
          setUserProfile({ id: user.uid, ...initialUser });
          setBookmarkedPosts([]);
          setUserStreak(0);
          setUserBadges([]);
        }
        // Verifica se è admin
        const adminDoc = await getDoc(doc(db, 'roles', 'admins'));
        if (adminDoc.exists()) {
          const ids = adminDoc.data().uids || [];
          setAdminIds(ids);
          if (ids.includes(user.uid)) setIsAdmin(true);
        }
        // Superadmins: includi anche loro nel badge
        const superAdminDoc = await getDoc(doc(db, 'roles', 'superadmins'));
        if (superAdminDoc.exists()) {
          const superIds = superAdminDoc.data().uids || [];
          setAdminIds(prev => Array.from(new Set([...prev, ...superIds])));
          if (superIds.includes(user.uid)) setIsAdmin(true);
        }
        // Carica settings community
        const settingsDoc = await getDoc(doc(db, 'settings', 'community'));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          setCommunityEnabled(settings.enabled !== false);
          if (settings.disabledMessage) {
            setCommunityDisabledMessage(settings.disabledMessage);
          }
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // Carica notifiche in-app
  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (showEditProfile && userProfile) {
      setProfileName(userProfile.name || '');
      setProfilePhotoPreview(userProfile.photoURL || '');
    }
  }, [showEditProfile, userProfile]);

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    const updates = {};
    if (profileName.trim() && profileName.trim() !== userProfile?.name) {
      updates.name = profileName.trim();
    }
    if (profilePhotoFile) {
      try {
        const fileRef = storageRef(storage, `profile_photos/${currentUser.uid}-${Date.now()}-${profilePhotoFile.name}`);
        await uploadBytes(fileRef, profilePhotoFile);
        const url = await getDownloadURL(fileRef);
        updates.photoURL = url;
      } catch (err) {
        console.error('Errore upload foto profilo:', err);
        alert('Errore upload foto');
      }
    }
    if (Object.keys(updates).length === 0) {
      setShowEditProfile(false);
      return;
    }
    try {
      await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updates }));
      setShowEditProfile(false);
    } catch (error) {
      console.error('Errore salvataggio profilo:', error);
      alert('Errore salvataggio profilo');
    }
  };

  // Carica leaderboard
  useEffect(() => {
    if (!currentUser) return;

    const loadLeaderboard = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('totalLikes', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(usersQuery);
        const leaders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaderboard(leaders);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      }
    };

    loadLeaderboard();
  }, [currentUser, leaderboardPeriod]);

  // Carica post pinnati
  useEffect(() => {
    if (!currentUser) return;

    const pinnedQuery = query(
      collection(db, 'community_posts'),
      where('pinned', '==', true),
      orderBy('pinnedAt', 'desc')
    );

    const unsubscribe = onSnapshot(pinnedQuery, (snapshot) => {
      const pinned = snapshot.docs.map(doc => doc.id);
      setPinnedPosts(pinned);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Draft autosave (ogni 3 secondi)
  useEffect(() => {
    if (!newPostContent) return;

    const timer = setTimeout(() => {
      localStorage.setItem('community_draft', newPostContent);
      setDraftContent(newPostContent);
    }, 3000);

    return () => clearTimeout(timer);
  }, [newPostContent]);

  // Carica draft all'avvio
  useEffect(() => {
    const savedDraft = localStorage.getItem('community_draft');
    if (savedDraft) {
      setNewPostContent(savedDraft);
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPostMenu && !event.target.closest('.post-menu-container')) {
        setShowPostMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPostMenu]);

  useEffect(() => {
    if (!currentUser) return;

    // Query semplificata senza indice composito
    const postsQuery = query(
      collection(db, 'community_posts'),
      orderBy('createdAt', 'desc'),
      limit(50) // Limita a 50 post per performance
    );

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Errore caricamento posts:', error);
      setLoading(false);
    });

    return () => unsubscribePosts();
  }, [currentUser]);

  // Carica tutti i membri quando admin (per gestione livelli)
  useEffect(() => {
    if (!isAdmin) return;

    const loadMembers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Filtra solo utenti con nome (profili completi)
        const validUsers = usersData.filter(u => u.name);
        setAllMembers(validUsers);
      } catch (error) {
        console.error('Errore caricamento membri:', error);
      }
    };

    loadMembers();
  }, [isAdmin]);

  // Funzioni gestione canali
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      setErrorPopup({ title: 'Campo obbligatorio', message: 'Inserisci un nome per il canale' });
      return;
    }
    try {
      const channelKey = newChannelName.toLowerCase().replace(/\s+/g, '_');
      const newChannel = {
        name: newChannelName,
        description: newChannelDescription,
        type: newChannelType,
        icon: newChannelIcon,
        emoji: newChannelType === 'videocall' ? '📹' : '💬',
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      };
      
      await setDoc(doc(db, 'communityChannels', channelKey), newChannel);
      
      // Aggiorna stato locale
      setChannels(prev => ({
        ...prev,
        [channelKey]: {
          name: newChannelName,
          icon: MessageSquare,
          description: newChannelDescription,
          type: newChannelType,
          emoji: newChannel.emoji,
        },
      }));
      
      // Reset form
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('chat');
      setErrorPopup({ title: '✅ Successo', message: 'Canale creato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore creazione canale:', error);
      setErrorPopup({ 
        title: '❌ Errore', 
        message: error.code === 'permission-denied' 
          ? 'Non hai i permessi per creare canali. Contatta un amministratore.' 
          : 'Errore durante la creazione del canale. Riprova.'
      });
    }
  };

  const handleEditChannel = (channelKey) => {
    const channel = channels[channelKey];
    setEditingChannel(channelKey);
    setNewChannelName(channel.name);
    setNewChannelDescription(channel.description || '');
    setNewChannelType(channel.type || 'chat');
  };

  const handleUpdateChannel = async () => {
    if (!editingChannel || !newChannelName.trim()) return;
    
    try {
      await updateDoc(doc(db, 'communityChannels', editingChannel), {
        name: newChannelName,
        description: newChannelDescription,
        type: newChannelType,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      });
      
      // Aggiorna stato locale
      setChannels(prev => ({
        ...prev,
        [editingChannel]: {
          ...prev[editingChannel],
          name: newChannelName,
          description: newChannelDescription,
          type: newChannelType,
        },
      }));
      
      // Reset form
      setEditingChannel(null);
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('chat');
      setErrorPopup({ title: '✅ Successo', message: 'Canale aggiornato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore aggiornamento canale:', error);
      setErrorPopup({ 
        title: '❌ Errore', 
        message: error.code === 'permission-denied' 
          ? 'Non hai i permessi per modificare canali. Contatta un amministratore.' 
          : 'Errore durante l\'aggiornamento del canale. Riprova.'
      });
    }
  };

  const handleDeleteChannel = async (channelKey) => {
    try {
      // Elimina da Firebase
      await deleteDoc(doc(db, 'communityChannels', channelKey));
      
      // Aggiorna stato locale
      setChannels(prev => {
        const newChannels = { ...prev };
        delete newChannels[channelKey];
        return newChannels;
      });
      
      // Se il canale attivo era quello eliminato, torna al primo disponibile
      if (activeChannel === channelKey) {
        const remainingChannels = Object.keys(channels).filter(k => k !== channelKey);
        setActiveChannel(remainingChannels[0] || 'vittorie');
      }
      
      setDeleteConfirmChannel(null);
      setErrorPopup({ title: '✅ Successo', message: 'Canale eliminato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore eliminazione canale:', error);
      setErrorPopup({ 
        title: '❌ Errore Permessi', 
        message: error.code === 'permission-denied' 
          ? 'Non hai i permessi per eliminare canali. Verifica di essere admin e che le regole Firestore siano aggiornate.' 
          : `Errore durante l'eliminazione: ${error.message || 'Riprova più tardi.'}`,
        details: 'Se sei admin, vai su Firebase Console → Firestore → Rules e verifica che siano deployate le ultime regole.'
      });
    }
  };

  const cancelEdit = () => {
    setEditingChannel(null);
    setNewChannelName('');
    setNewChannelDescription('');
    setNewChannelType('chat');
  };

  // Funzione per modificare manualmente i likes/livello di un utente (admin)
  const handleUpdateUserLevel = async (userId, newLikesCount) => {
    if (!isAdmin) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        totalLikes: parseInt(newLikesCount),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      });
      
      // Aggiorna stato locale se è l'utente corrente
      if (userId === currentUser.uid) {
        setUserProfile(prev => ({ ...prev, totalLikes: parseInt(newLikesCount) }));
      }
      
      setErrorPopup({ title: '✅ Successo', message: 'Livello utente aggiornato con successo!', type: 'success' });
    } catch (error) {
      console.error('Errore aggiornamento livello:', error);
      setErrorPopup({ 
        title: '❌ Errore', 
        message: 'Errore durante l\'aggiornamento del livello. Riprova.'
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostMedia.length === 0) return;

    // Filtra parole offensive
    const filteredContent = filterOffensiveWords(newPostContent.trim());
    
    // Estrai menzioni e hashtags
    const mentions = extractMentions(filteredContent);
    const hashtags = extractHashtags(filteredContent);

    try {
      const postRef = await addDoc(collection(db, 'community_posts'), {
        content: filteredContent,
        channel: newPostChannel,
        authorId: currentUser.uid,
        authorName: userProfile?.name || currentUser.displayName || 'Utente',
        authorPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
        authorLevel: getUserLevel(userProfile?.totalLikes || 0).id,
        authorTotalLikes: userProfile?.totalLikes || 0,
        likes: [],
        likesCount: 0,
        reactions: {},
        comments: [],
        commentsCount: 0,
        media: newPostMedia,
        mentions,
        hashtags,
        pinned: false,
        createdAt: serverTimestamp(),
      });

      // Invia notifiche alle menzioni
      mentions.forEach(mentionedUsername => sendMentionNotification(mentionedUsername, postRef.id, 'post'));

      // Clear draft
      localStorage.removeItem('community_draft');

      // Check badge primo post
      const userPostsCount = posts.filter(p => p.authorId === currentUser.uid).length;
      if (userPostsCount === 0) await awardBadge('firstPost');
      if (userPostsCount === 99) await awardBadge('posts100');

      setNewPostContent('');
      setNewPostMedia([]);
      setShowNewPost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleMediaUpload = (mediaData) => {
    setNewPostMedia(prev => [...prev, mediaData]);
  };

  const removeMedia = (index) => {
    setNewPostMedia(prev => prev.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line no-unused-vars
  const handleLikePost = async (postId, currentLikes = []) => {
    if (!currentUser) return;

    const postRef = doc(db, 'community_posts', postId);
    const hasLiked = currentLikes.includes(currentUser.uid);

    try {
      if (hasLiked) {
        // Unlike
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid),
          likesCount: increment(-1),
        });
      } else {
        // Like
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid),
          likesCount: increment(1),
        });

        // Update author's total likes
        const post = posts.find(p => p.id === postId);
        if (post && post.authorId !== currentUser.uid) {
          const authorRef = doc(db, 'users', post.authorId);
          await updateDoc(authorRef, {
            totalLikes: increment(1),
          });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (postId) => {
    if (!currentUser || !newComment.trim()) return;

    // Filtra parole offensive
    const filteredComment = filterOffensiveWords(newComment.trim());
    
    // Estrai menzioni e hashtags
    const mentions = extractMentions(filteredComment);
    const hashtags = extractHashtags(filteredComment);

    try {
      const commentRef = doc(collection(db, 'community_posts', postId, 'comments'));
      await setDoc(commentRef, {
        authorId: currentUser.uid,
        authorName: userProfile.name,
        authorPhotoURL: userProfile.photoURL,
        authorTotalLikes: userProfile.totalLikes || 0,
        content: filteredComment,
        mentions,
        hashtags,
        createdAt: serverTimestamp(),
      });

      // Increment comment count
      await updateDoc(doc(db, 'community_posts', postId), {
        commentsCount: increment(1),
      });

      // Invia notifiche alle menzioni
      mentions.forEach(mentionedUsername => sendMentionNotification(mentionedUsername, postId, 'comment'));

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // === NUOVE FUNZIONI ===

  // Filtra parole offensive
  const filterOffensiveWords = (text) => {
    let filtered = text;
    OFFENSIVE_WORDS.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '***');
    });
    return filtered;
  };

  // Estrai menzioni @username
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.slice(1)) : [];
  };

  // Estrai hashtags #tag
  const extractHashtags = (text) => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(h => h.slice(1)) : [];
  };

  // Reaction su post
  const handleReaction = async (postId, reactionId, currentReactions = {}) => {
    if (!currentUser) return;

    const postRef = doc(db, 'community_posts', postId);
    const userReactions = currentReactions[currentUser.uid] || [];
    const hasReacted = userReactions.includes(reactionId);

    try {
      if (hasReacted) {
        // Rimuovi reaction
        await updateDoc(postRef, {
          [`reactions.${currentUser.uid}`]: arrayRemove(reactionId),
        });
      } else {
        // Aggiungi reaction
        await updateDoc(postRef, {
          [`reactions.${currentUser.uid}`]: arrayUnion(reactionId),
        });

        // Update author's total likes
        const post = posts.find(p => p.id === postId);
        if (post && post.authorId !== currentUser.uid) {
          const authorRef = doc(db, 'users', post.authorId);
          await updateDoc(authorRef, {
            totalLikes: increment(1),
          });
        }
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  // Bookmark post
  const handleBookmark = async (postId) => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const isBookmarked = bookmarkedPosts.includes(postId);

    try {
      if (isBookmarked) {
        await updateDoc(userRef, {
          bookmarkedPosts: arrayRemove(postId),
        });
        setBookmarkedPosts(prev => prev.filter(id => id !== postId));
      } else {
        await updateDoc(userRef, {
          bookmarkedPosts: arrayUnion(postId),
        });
        setBookmarkedPosts(prev => [...prev, postId]);
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  // Condividi post
  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/community?post=${postId}`;
    if (navigator.share) {
      await navigator.share({
        title: 'MentalFit Community',
        text: 'Guarda questo post!',
        url: shareUrl,
      });
    } else {
      // Fallback: copia link
      navigator.clipboard.writeText(shareUrl);
      alert('Link copiato!');
    }
  };

  // Report post/comment
  const handleReport = async (type, id, reason) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'community_reports'), {
        type, // 'post' or 'comment'
        targetId: id,
        reportedBy: currentUser.uid,
        reason,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      alert('Segnalazione inviata. Grazie!');
      setShowReportModal(null);
    } catch (error) {
      console.error('Error reporting:', error);
    }
  };

  // Pin post (admin only)
  const handlePinPost = async (postId) => {
    if (!isAdmin) return;

    const postRef = doc(db, 'community_posts', postId);
    const isPinned = pinnedPosts.includes(postId);

    try {
      await updateDoc(postRef, {
        pinned: !isPinned,
        pinnedAt: !isPinned ? serverTimestamp() : null,
      });
    } catch (error) {
      console.error('Error pinning post:', error);
    }
  };

  // Delete post (admin or author)
  const handleDeletePost = async (postId, authorId) => {
    if (!currentUser) return;
    
    // Only admin or post author can delete
    if (!isAdmin && currentUser.uid !== authorId) return;

    if (!window.confirm('Sei sicuro di voler eliminare questo post? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      // Delete post document
      await deleteDoc(doc(db, 'community_posts', postId));
      
      // Delete associated comments
      const commentsQuery = query(
        collection(db, 'community_comments'),
        where('postId', '==', postId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const deletePromises = commentsSnapshot.docs.map(commentDoc => 
        deleteDoc(doc(db, 'community_comments', commentDoc.id))
      );
      await Promise.all(deletePromises);
      
      setShowPostMenu(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Errore durante l\'eliminazione del post. Riprova.');
    }
  };

  // Invia notifica menzione
  const sendMentionNotification = async (username, postId, type = 'post') => {
    try {
      // Trova user by username (assumendo che esista campo username in users)
      const usersQuery = query(collection(db, 'users'), where('username', '==', username));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const mentionedUser = usersSnapshot.docs[0];
        await addDoc(collection(db, 'notifications'), {
          userId: mentionedUser.id,
          type: 'mention',
          fromUserId: currentUser.uid,
          fromUserName: userProfile.name,
          fromUserPhoto: userProfile.photoURL,
          postId,
          commentType: type,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error sending mention notification:', error);
    }
  };

  // Update streak giornaliero
  const updateStreak = async () => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const today = new Date().toDateString();
    const lastActive = userData?.lastActiveDate;

    if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = lastActive === yesterday.toDateString();

      const newStreak = isConsecutive ? (userData.streak || 0) + 1 : 1;

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          lastActiveDate: today,
          streak: newStreak,
        });
      } else {
        await setDoc(userRef, {
          lastActiveDate: today,
          streak: newStreak,
          totalLikes: 0,
          badges: [],
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      setUserStreak(newStreak);

      // Check per badge streak
      if (newStreak === 7) await awardBadge('streak7');
      if (newStreak === 30) await awardBadge('streak30');
    }
  };

  // Assegna badge
  const awardBadge = async (badgeId) => {
    if (!currentUser || userBadges.includes(badgeId)) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        badges: arrayUnion(badgeId),
      });
    } else {
      await setDoc(userRef, {
        badges: [badgeId],
        totalLikes: 0,
        streak: 0,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }

    setUserBadges(prev => [...prev, badgeId]);

    // Notifica badge
    await addDoc(collection(db, 'notifications'), {
      userId: currentUser.uid,
      type: 'badge',
      badgeId,
      badgeName: ACHIEVEMENT_BADGES[badgeId].name,
      read: false,
      createdAt: serverTimestamp(),
    });
  };

  // Crea sondaggio
  const handleCreatePoll = async (question, options) => {
    if (!currentUser || !question.trim() || options.filter(o => o.trim()).length < 2) return;

    try {
      await addDoc(collection(db, 'community_posts'), {
        type: 'poll',
        question: question.trim(),
        options: options.filter(o => o.trim()).map(opt => ({ text: opt.trim(), votes: 0, voters: [] })),
        authorId: currentUser.uid,
        authorName: userProfile.name,
        authorPhotoURL: userProfile.photoURL,
        authorTotalLikes: userProfile.totalLikes || 0,
        channel: activeChannel,
        createdAt: serverTimestamp(),
        likesCount: 0,
        likes: [],
        commentsCount: 0,
      });

      setShowPollModal(false);
      setPollOptions(['', '']);
    } catch (error) {
      console.error('Error creating poll:', error);
    }
  };

  // Vota sondaggio
  const handleVotePoll = async (postId, optionIndex) => {
    if (!currentUser) return;

    const postRef = doc(db, 'community_posts', postId);
    const post = posts.find(p => p.id === postId);
    
    if (!post || post.type !== 'poll') return;

    // Rimuovi voto precedente se esiste
    const currentVoteIndex = post.options.findIndex(opt => opt.voters?.includes(currentUser.uid));
    
    try {
      if (currentVoteIndex !== -1) {
        await updateDoc(postRef, {
          [`options.${currentVoteIndex}.votes`]: increment(-1),
          [`options.${currentVoteIndex}.voters`]: arrayRemove(currentUser.uid),
        });
      }

      // Aggiungi nuovo voto
      await updateDoc(postRef, {
        [`options.${optionIndex}.votes`]: increment(1),
        [`options.${optionIndex}.voters`]: arrayUnion(currentUser.uid),
      });
    } catch (error) {
      console.error('Error voting poll:', error);
    }
  };

  // Load more posts (infinite scroll)
  // eslint-disable-next-line no-unused-vars
  const loadMorePosts = async () => {
    if (!hasMore || loadingMore || !lastVisible) return;

    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'community_posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(10)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(prev => [...prev, ...newPosts]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
    setLoadingMore(false);
  };

  // Load comments for expanded post
  useEffect(() => {
    if (expandedPost) {
      const q = query(
        collection(db, 'community_posts', expandedPost, 'comments'),
        orderBy('createdAt', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(prev => ({ ...prev, [expandedPost]: commentsData }));
      });
      return () => unsubscribe();
    }
  }, [expandedPost]);

  // Filtra post per canale e ricerca
  const filteredPosts = posts
    .filter(post => post.channel === activeChannel)
    .filter(post => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      
      // Cerca nel contenuto
      if (post.content?.toLowerCase().includes(query)) return true;
      
      // Cerca hashtags
      if (query.startsWith('#')) {
        const hashtag = query.slice(1);
        return post.hashtags?.some(h => h.toLowerCase().includes(hashtag));
      }
      
      // Cerca menzioni
      if (query.startsWith('@')) {
        const username = query.slice(1);
        return post.mentions?.some(m => m.toLowerCase().includes(username));
      }
      
      // Cerca nel nome autore
      if (post.authorName?.toLowerCase().includes(query)) return true;
      
      return false;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  // Community disattivata (visibile solo per non-admin)
  if (!communityEnabled && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-slate-800/60 backdrop-blur-md rounded-2xl p-8 border border-slate-700 text-center"
        >
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
              <UsersRound size={48} className="text-slate-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mb-3">Community Temporaneamente Non Disponibile</h2>
            <p className="text-slate-300 text-lg whitespace-pre-wrap">{communityDisabledMessage}</p>
          </div>
          <button
            onClick={() => navigate(isAdmin ? '/' : '/client/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg"
          >
            Torna alla Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // --- Restyling totale stile app ---
  // Determina se l'utente può accedere alla Live Room
  const userLevel = getUserLevel(userProfile?.totalLikes || 0).id;
  const canAccessLiveRoom = isAdmin || userLevel >= 2 || userProfile?.liveRoomAccess === true;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header compatto stile Discord - Responsive */}
      <header className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur-md border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            {/* Titolo + Badge livello */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Community MentalFit
              </h1>
              {userProfile && <LevelBadge totalLikes={userProfile.totalLikes || 0} size="md" />}
            </div>

            {/* Toolbar azioni rapide - Desktop e Mobile ottimizzato */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Rewards Badge */}
              <button
                onClick={() => setShowRewards(true)}
                className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                title="Rewards & Progressi"
              >
                <Trophy size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                {userProfile && getUserLevel(userProfile.totalLikes || 0).id > 1 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                    {getUserLevel(userProfile.totalLikes || 0).id}
                  </span>
                )}
              </button>

              {/* Badge personali */}
              <button
                onClick={() => setShowBadgesModal(true)}
                className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                title="I tuoi Badge"
              >
                <Award size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
                {userBadges.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                    {userBadges.length}
                  </span>
                )}
              </button>

              {/* Notifiche */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Notifiche"
              >
                <MessageCircle size={20} className="text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 rounded-full text-xs font-bold flex items-center justify-center text-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Settings (solo admin) */}
              {isAdmin && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors group"
                  title="Impostazioni Admin"
                >
                  <Settings size={20} className="text-purple-400 group-hover:rotate-90 transition-transform" />
                  <span className="hidden sm:inline text-sm font-medium text-slate-300">Impostazioni</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs principali: Feed / Membri / Live Room - Scrollabili su mobile */}
          <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-700 -mb-px overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 sm:px-4 py-2 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'feed'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={16} className="inline mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
              Feed
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 sm:px-4 py-2 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'members'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UsersRound size={16} className="inline mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Membri</span>
              <span className="sm:hidden">Membri</span>
              <span className="text-xs ml-1">({posts.length > 0 ? new Set(posts.map(p => p.authorId)).size : 0})</span>
            </button>
            {canAccessLiveRoom && (
              <button
                onClick={() => setActiveTab('liveRoom')}
                className={`px-3 sm:px-4 py-2 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'liveRoom'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <VideoIcon size={16} className="inline mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Live Room
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Profilo utente */}
        {userProfile && (
          <div className="flex items-center gap-4 mb-8 bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <img
              src={userProfile.photoURL || 'https://ui-avatars.com/api/?name=' + userProfile.name}
              alt={userProfile.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-rose-400"
            />
            <div>
              <div className="font-bold text-lg text-slate-100 flex items-center gap-2">
                {userProfile.name}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-600/20 text-green-400 text-xs font-semibold border border-green-500/30">
                    <CheckCircle size={12} /> Admin
                  </span>
                )}
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="text-xs px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
                >Modifica</button>
              </div>
              <div className="text-sm text-slate-400">Livello {getUserLevel(userProfile.totalLikes || 0).name} • {userProfile.totalLikes || 0} likes</div>
            </div>
            <LevelBadge totalLikes={userProfile.totalLikes || 0} size="md" />
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                <p className="mt-4 text-slate-400">Caricamento...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
                <MessageSquare size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 mb-2">Nessun post ancora</p>
                <p className="text-sm text-slate-500">Scrivi il primo messaggio nella community!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700 hover:border-slate-600 transition-all">
                  {/* Header post */}
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar 
                      src={post.authorPhotoURL}
                      alt={post.authorName}
                      totalLikes={post.authorTotalLikes || 0}
                      size={48}
                      showLevel={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-100">{post.authorName}</h4>
                        <LevelBadge totalLikes={post.authorTotalLikes || 0} size="sm" />
                        {adminIds.includes(post.authorId) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-600/20 text-green-400 text-xs font-semibold border border-green-500/30">
                            <CheckCircle size={10} /> Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{formatTimestamp(post.createdAt)}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} className="text-slate-400" />
                      </button>
                    )}
                  </div>

                  {/* Contenuto post */}
                  <div className="mb-4">
                    <p className="text-slate-200 whitespace-pre-wrap break-words">{post.content}</p>
                    
                    {/* Media attachments */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {post.media.map((media, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden">
                            {media.type?.startsWith('video') ? (
                              <video src={media.url} controls className="w-full" />
                            ) : (
                              <img src={media.url} alt="" className="w-full h-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-700">
                    <button
                      onClick={() => handleLikePost(post.id, post.authorId)}
                      className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Heart size={18} className={post.likes?.includes(currentUser?.uid) ? 'fill-rose-500 text-rose-500' : ''} />
                      <span className="text-sm">{post.likesCount || 0}</span>
                    </button>
                    <button
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span className="text-sm">{post.commentsCount || 0}</span>
                    </button>
                  </div>

                  {/* Commenti espansi */}
                  {expandedPost === post.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="space-y-3 mb-3">
                        {(comments[post.id] || []).map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar 
                              src={comment.authorPhotoURL}
                              alt={comment.authorName}
                              totalLikes={0}
                              size={32}
                              showLevel={false}
                            />
                            <div className="flex-1 bg-slate-700/50 rounded-lg p-2">
                              <p className="text-xs font-semibold text-slate-200">{comment.authorName}</p>
                              <p className="text-sm text-slate-300 mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id, post.authorId)}
                          placeholder="Scrivi un commento..."
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button
                          onClick={() => handleAddComment(post.id, post.authorId)}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="text-center py-12 text-slate-400">
            <UsersRound size={48} className="mx-auto mb-4 opacity-50" />
            <p>Vista membri - Coming soon</p>
            <p className="text-sm mt-2">Usa le Impostazioni per gestire i livelli</p>
          </div>
        )}

        {activeTab === 'liveRoom' && canAccessLiveRoom && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
              <VideoIcon size={28} /> Live Room
            </h2>
            {/* Iframe Jitsi o componente video call */}
            <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-xl border border-cyan-600">
              <iframe
                src={`https://meet.jit.si/MentalFitCommunityRoom`}
                allow="camera; microphone; fullscreen; display-capture"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Live Room Video Call"
              />
            </div>
            <p className="mt-4 text-slate-400 text-center">Questa stanza è accessibile solo agli utenti abilitati.<br />Se hai problemi di accesso, contatta un admin.</p>
          </div>
        )}
      {/* Fine main content */}
      </main>

      {/* Input nuovo post - Fixed Bottom con styling */}
      {activeTab === 'feed' && (
        <div 
          className="fixed bottom-20 md:bottom-0 left-0 md:left-64 right-0 z-50"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
        >
          <div className="bg-slate-900 border-t border-slate-700">
            <div className="max-w-7xl mx-auto px-2 md:px-6">
              <div className={`py-2 md:py-3 transition-all ${
                isDragging ? 'bg-cyan-900/20' : ''
              }`}>
                {/* Preview media allegati */}
                {newPostMedia.length > 0 && (
                  <div className="mb-1.5 flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide">
                    {newPostMedia.map((media, index) => (
                      <div key={index} className="relative group flex-shrink-0">
                        <MediaViewer media={media} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover" />
                        <button
                          onClick={() => removeMedia(index)}
                          className="absolute -top-1 -right-1 p-0.5 bg-rose-600 hover:bg-rose-700 rounded-full shadow-lg"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {/* Container textarea minimalista Discord-style */}
                  <div className="flex-1 relative bg-slate-800 rounded-3xl border border-slate-600 hover:border-slate-500 focus-within:border-cyan-500 transition-colors">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCreatePost();
                        }
                      }}
                      placeholder={`Messaggio...`}
                      className="w-full min-h-[40px] md:min-h-[44px] max-h-32 px-3 md:px-4 py-2 md:py-2.5 pr-20 md:pr-24 bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none text-sm md:text-base"
                      rows={1}
                      style={{ lineHeight: '1.4' }}
                    />
                    
                    {/* Toolbar inline ultra-compatto */}
                    <div className="absolute right-1.5 md:right-2 bottom-1.5 md:bottom-2 flex items-center gap-0.5">
                      <button 
                        onClick={() => setShowPollModal(true)}
                        className="p-1 md:p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Crea sondaggio"
                      >
                        <BarChart3 size={16} className="md:w-[18px] md:h-[18px]" />
                      </button>
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1 md:p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400 transition-colors"
                        title="Emoji"
                      >
                        <span className="text-base md:text-lg">😊</span>
                      </button>
                      <div className="scale-75 md:scale-90">
                        <MediaUploadButton
                          userId={currentUser?.uid}
                          onUploadComplete={handleMediaUpload}
                          folder="community_posts"
                          showLabel={false}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottone send minimalista */}
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() && newPostMedia.length === 0}
                    className="w-10 h-10 md:w-12 md:h-12 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full transition-all flex items-center justify-center flex-shrink-0 active:scale-95"
                    title="Invia"
                  >
                    <Send size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Emoji picker compatto */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-2 md:left-0 mb-2 p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl grid grid-cols-8 gap-1 w-64 z-10">
                    {['😊', '😂', '❤️', '🔥', '👍', '🎉', '💪', '⭐', '🙌', '👏', '🚀', '💯', '😍', '🤩', '😎', '🥳'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setNewPostContent(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-xl hover:bg-slate-700 rounded p-1.5 transition-colors active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impostazioni stile Discord */}
      <AnimatePresence>
        {showSettings && isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden border border-slate-700 shadow-2xl mx-3 sm:mx-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Crown className="text-purple-400" size={24} />
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-100">Impostazioni</h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="sm:w-6 sm:h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row h-[calc(90vh-68px)] sm:h-[calc(80vh-88px)]">
                {/* Sidebar tabs sempre verticale */}
                <div className="w-full sm:w-64 bg-slate-900/60 sm:border-r border-b sm:border-b-0 border-slate-700 p-3 sm:p-4 overflow-x-hidden overflow-y-auto">
                  <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSettingsTab('general')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      settingsTab === 'general'
                        ? 'bg-slate-700 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    <Crown size={18} className="inline mr-3" />
                    Generale
                  </button>
                  <button
                    onClick={() => setSettingsTab('channels')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      settingsTab === 'channels'
                        ? 'bg-slate-700 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare size={18} className="inline mr-3" />
                    Canali
                  </button>
                  <button
                    onClick={() => setSettingsTab('roles')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      settingsTab === 'roles'
                        ? 'bg-slate-700 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    <Award size={18} className="inline mr-3" />
                    Ruoli & Livelli
                  </button>
                  <button
                    onClick={() => setSettingsTab('moderation')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      settingsTab === 'moderation'
                        ? 'bg-slate-700 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    <Crown size={18} className="inline mr-3" />
                    Moderazione
                  </button>
                  <button
                    onClick={() => setSettingsTab('members')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      settingsTab === 'members'
                        ? 'bg-slate-700 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    <UsersRound size={18} className="inline mr-3" />
                    Membri
                  </button>
                  <button
                    onClick={() => setSettingsTab('onboarding')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      settingsTab === 'onboarding'
                        ? 'bg-slate-700 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    <Trophy size={18} className="inline mr-3" />
                    Onboarding
                  </button>
                  <button
                    onClick={() => setSettingsTab('notifications')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      settingsTab === 'notifications'
                        ? 'bg-slate-700 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    <MessageCircle size={18} className="inline mr-3" />
                    Notifiche Auto
                  </button>
                </div>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {settingsTab === 'general' && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-4">Impostazioni Generali</h3>
                      <p className="text-slate-400 mb-6">Attiva/disattiva la community e personalizza il messaggio</p>
                      
                      <div className="space-y-6">
                        {/* Toggle Community Enabled */}
                        <div className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
                          <label className="flex items-center justify-between cursor-pointer mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                                communityEnabled ? 'bg-green-600' : 'bg-slate-600'
                              } relative`}>
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                                  communityEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                              </div>
                              <div>
                                <span className="text-slate-100 font-bold text-lg">Community {communityEnabled ? 'Attiva' : 'Disattivata'}</span>
                                <p className="text-slate-400 text-sm mt-1">
                                  {communityEnabled 
                                    ? 'La community è accessibile a tutti gli utenti' 
                                    : 'Solo gli admin possono accedere alla community'}
                                </p>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={communityEnabled}
                              onChange={(e) => setCommunityEnabled(e.target.checked)}
                              className="hidden"
                            />
                          </label>

                          {/* Messaggio quando disattivata */}
                          {!communityEnabled && (
                            <div className="mt-4">
                              <label className="block text-slate-200 font-medium mb-2">
                                Messaggio per utenti
                              </label>
                              <textarea
                                value={communityDisabledMessage}
                                onChange={(e) => setCommunityDisabledMessage(e.target.value)}
                                placeholder="Scrivi il messaggio che vedranno gli utenti quando la community è disattivata..."
                                className="w-full px-4 py-3 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                rows={4}
                                maxLength={300}
                              />
                              <div className="text-right text-sm text-slate-400 mt-2">
                                {communityDisabledMessage.length}/300
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Preview */}
                        {!communityEnabled && (
                          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                            <p className="text-slate-300 text-sm mb-2">👁️ Anteprima messaggio:</p>
                            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                              <p className="text-slate-200 whitespace-pre-wrap">{communityDisabledMessage}</p>
                            </div>
                          </div>
                        )}

                        {/* Bottone Salva */}
                        <button 
                          onClick={async () => {
                            try {
                              await setDoc(doc(db, 'settings', 'community'), {
                                enabled: communityEnabled,
                                disabledMessage: communityDisabledMessage,
                                updatedAt: serverTimestamp(),
                                updatedBy: currentUser.uid,
                              });
                              alert('✅ Impostazioni salvate con successo!');
                            } catch (error) {
                              console.error('Errore salvataggio:', error);
                              alert('❌ Errore durante il salvataggio');
                            }
                          }}
                          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
                        >
                          💾 Salva Impostazioni Generali
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'channels' && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-4">Gestione Canali</h3>
                      <p className="text-slate-400 mb-6">Crea, modifica o elimina i canali della community</p>
                      
                      {/* Lista canali */}
                      <div className="space-y-3 mb-6">
                        {Object.entries(channels).map(([key, channel]) => {
                          const Icon = channel.icon;
                          return (
                            <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                              <div className="flex items-center gap-3">
                                <Icon size={20} className="text-slate-300" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-100 font-medium">{channel.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-300">
                                      {channel.type === 'videocall' ? '📹 Video' : '💬 Chat'}
                                    </span>
                                  </div>
                                  {channel.description && (
                                    <p className="text-xs text-slate-400 mt-1">{channel.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEditChannel(key)}
                                  className="p-2 hover:bg-slate-600 rounded text-cyan-400 transition-colors"
                                  title="Modifica canale"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmChannel(key)}
                                  className="p-2 hover:bg-slate-600 rounded text-rose-400 transition-colors"
                                  title="Elimina canale"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Form nuovo/modifica canale */}
                      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <h4 className="text-lg font-semibold text-slate-100 mb-3">
                          {editingChannel ? 'Modifica Canale' : 'Nuovo Canale'}
                        </h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Nome canale"
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                          />
                          <textarea
                            placeholder="Descrizione (opzionale)"
                            value={newChannelDescription}
                            onChange={(e) => setNewChannelDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                            rows={2}
                          />
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo di Canale</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setNewChannelType('chat')}
                                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                                  newChannelType === 'chat'
                                    ? 'border-cyan-500 bg-cyan-600/20 text-cyan-400'
                                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                <div className="text-2xl mb-1">💬</div>
                                <div className="text-sm font-semibold">Chat</div>
                                <div className="text-xs opacity-75">Messaggi testuali</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewChannelType('videocall')}
                                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                                  newChannelType === 'videocall'
                                    ? 'border-purple-500 bg-purple-600/20 text-purple-400'
                                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                <div className="text-2xl mb-1">📹</div>
                                <div className="text-sm font-semibold">Video Call</div>
                                <div className="text-xs opacity-75">Sala videochiamate</div>
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {editingChannel ? (
                              <>
                                <button 
                                  onClick={handleUpdateChannel}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                                >
                                  💾 Salva Modifiche
                                </button>
                                <button 
                                  onClick={cancelEdit}
                                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all"
                                >
                                  Annulla
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={handleCreateChannel}
                                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                              >
                                <Plus size={18} className="inline mr-2" />
                                Crea Canale
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'roles' && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-4">Livelli & Rewards</h3>
                      <p className="text-slate-400 mb-6">Configura i livelli e i contenuti sbloccabili (come da specifiche MentalFit)</p>
                      
                      {/* Livelli */}
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-slate-200 mb-4">Configurazione Livelli</h4>
                        <div className="space-y-3">
                          {[
                            { id: 1, name: 'Start', emoji: '🌱', min: 0, max: 1, color: 'from-slate-500 to-slate-600' },
                            { id: 2, name: 'Intermedio', emoji: '🔥', min: 2, max: 15, color: 'from-green-500 to-emerald-500' },
                            { id: 3, name: 'Pro', emoji: '💪', min: 16, max: 49, color: 'from-blue-500 to-cyan-500' },
                            { id: 4, name: 'Elite', emoji: '⭐', min: 50, max: 99, color: 'from-yellow-500 to-orange-500' },
                            { id: 5, name: 'MentalFit', emoji: '🏆', min: 100, max: '∞', color: 'from-purple-500 to-pink-500' },
                          ].map((level) => (
                            <div key={level.id} className={`p-4 bg-gradient-to-r ${level.color} bg-opacity-10 rounded-lg border-2 border-transparent hover:border-opacity-50`} style={{ borderColor: `rgba(147, 51, 234, 0.3)` }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl">{level.emoji}</span>
                                  <div>
                                    <p className="text-slate-100 font-bold">Livello {level.id}: {level.name}</p>
                                    <p className="text-slate-400 text-sm">{level.min}–{level.max} Likes</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="number" 
                                    defaultValue={level.min}
                                    className="w-20 px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                    placeholder="Min"
                                  />
                                  <span className="text-slate-400">→</span>
                                  <input 
                                    type={level.max === '∞' ? 'text' : 'number'}
                                    defaultValue={level.max}
                                    className="w-20 px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                    placeholder="Max"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="mt-4 w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg">
                          Salva Configurazione Livelli
                        </button>
                      </div>

                      {/* Rewards per livello */}
                      <div>
                        <h4 className="text-lg font-semibold text-slate-200 mb-4">Rewards Sbloccabili</h4>
                        <div className="space-y-4">
                          {Object.entries(rewards).map(([level, reward]) => (
                            <div key={level} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                              <div className="flex items-start gap-4">
                                <span className="text-4xl">{reward.icon}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <input 
                                      type="text"
                                      defaultValue={reward.name}
                                      className="flex-1 px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                                    />
                                    <span className="text-xs px-3 py-2 bg-purple-600 text-white rounded-lg font-bold">
                                      Livello {level}
                                    </span>
                                  </div>
                                  <textarea 
                                    defaultValue={reward.description}
                                    className="w-full px-3 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
                                    rows={2}
                                  />
                                  <div className="flex items-center gap-3 mt-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        defaultChecked={reward.enabled}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                      />
                                      <span className="text-slate-400 text-sm">Attivo</span>
                                    </label>
                                    <input 
                                      type="url"
                                      placeholder="Link al contenuto/corso..."
                                      className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-lg">
                          Salva Rewards
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'moderation' && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-4">Moderazione & Sicurezza</h3>
                      <p className="text-slate-400 mb-6">Strumenti avanzati per gestire la community</p>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">🛡️ Auto-moderazione</span>
                              <p className="text-slate-400 text-sm mt-1">Filtra automaticamente contenuti inappropriati</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5" />
                          </label>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">✅ Approvazione post</span>
                              <p className="text-slate-400 text-sm mt-1">I nuovi post richiedono approvazione admin</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5" />
                          </label>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">⏱️ Slow mode</span>
                              <p className="text-slate-400 text-sm mt-1">Limita: 1 messaggio ogni 30 secondi</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5" />
                          </label>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">🔒 Solo lettura</span>
                              <p className="text-slate-400 text-sm mt-1">Disabilita temporaneamente i nuovi post</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5" />
                          </label>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">🔔 Notifiche menzioni</span>
                              <p className="text-slate-400 text-sm mt-1">Abilita @menzioni utenti nei messaggi</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">📎 Allegati media</span>
                              <p className="text-slate-400 text-sm mt-1">Permetti upload immagini e video</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                        </div>
                      </div>

                      {/* Parole vietate */}
                      <div className="mt-6 p-4 bg-rose-900/20 rounded-lg border border-rose-500/30">
                        <h4 className="text-rose-400 font-semibold mb-3">🚫 Filtro parole</h4>
                        <textarea
                          placeholder="Inserisci parole vietate (una per riga)"
                          className="w-full h-24 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
                        />
                        <button className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors">
                          Salva Filtro
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'members' && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-4">Membri Community</h3>
                      <p className="text-slate-400 mb-6">Gestisci i livelli degli utenti manualmente</p>
                      
                      {/* Statistiche */}
                      <div className="p-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-lg border border-cyan-500/30 mb-6">
                        <p className="text-cyan-300 font-medium mb-4">📊 Statistiche Community</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-slate-400 text-sm">Post totali</p>
                            <p className="text-2xl font-bold text-slate-100">{posts.length}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Likes totali</p>
                            <p className="text-2xl font-bold text-slate-100">{posts.reduce((acc, p) => acc + (p.likesCount || 0), 0)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Membri totali</p>
                            <p className="text-2xl font-bold text-slate-100">{allMembers.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Lista membri con possibilità di modificare livelli */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-slate-200">Lista Utenti ({allMembers.length})</h4>
                          <p className="text-sm text-slate-400">Click su ✏️ per modificare il livello</p>
                        </div>

                        {/* Il tuo profilo admin - sempre visibile */}
                        {userProfile && (
                          <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/40 rounded-lg mb-4">
                            <p className="text-xs text-purple-300 font-semibold mb-2">👑 IL TUO PROFILO ADMIN</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <Avatar 
                                  src={userProfile.photoURL}
                                  alt={userProfile.name || 'Tu'}
                                  totalLikes={userProfile.totalLikes || 0}
                                  size={48}
                                  showLevel={true}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-semibold text-slate-100">{userProfile.name || 'Tu'}</h5>
                                    <LevelBadge totalLikes={userProfile.totalLikes || 0} size="sm" />
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className={`text-sm ${getUserLevel(userProfile.totalLikes || 0).textColor}`}>
                                      {getUserLevel(userProfile.totalLikes || 0).name}
                                    </p>
                                    <span className="text-slate-500">•</span>
                                    {editingUserLevel?.userId === currentUser.uid ? (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="0"
                                          defaultValue={userProfile.totalLikes || 0}
                                          onChange={(e) => setEditingUserLevel({ ...editingUserLevel, newLikes: e.target.value })}
                                          className="w-24 px-2 py-1 bg-slate-700 border border-cyan-500 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                          placeholder="Likes"
                                        />
                                        <button
                                          onClick={() => {
                                            handleUpdateUserLevel(currentUser.uid, editingUserLevel.newLikes || userProfile.totalLikes);
                                            setEditingUserLevel(null);
                                          }}
                                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                                        >
                                          ✓ Salva
                                        </button>
                                        <button
                                          onClick={() => setEditingUserLevel(null)}
                                          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-medium transition-colors"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-400">
                                        {userProfile.totalLikes || 0} likes
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {editingUserLevel?.userId !== currentUser.uid && (
                                <button
                                  onClick={() => setEditingUserLevel({ userId: currentUser.uid, currentLikes: userProfile.totalLikes || 0, newLikes: userProfile.totalLikes || 0 })}
                                  className="p-2 hover:bg-purple-700/50 rounded text-cyan-400 transition-colors"
                                  title="Modifica il tuo livello"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {allMembers.length === 0 ? (
                          <div className="text-center py-8 text-slate-400">
                            <UsersRound size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="mb-2">Nessun membro trovato nel database</p>
                            <p className="text-xs">Assicurati che gli utenti abbiano un profilo completo con nome</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {allMembers
                              .sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0))
                              .map((member) => {
                                const level = getUserLevel(member.totalLikes || 0);
                                const isEditing = editingUserLevel?.userId === member.id;
                                
                                return (
                                  <div key={member.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:border-slate-500 transition-all">
                                    <div className="flex items-center gap-3 flex-1">
                                      <Avatar 
                                        src={member.photoURL}
                                        alt={member.name || 'Utente'}
                                        totalLikes={member.totalLikes || 0}
                                        size={48}
                                        showLevel={true}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <h5 className="font-semibold text-slate-100">{member.name || 'Utente'}</h5>
                                          <LevelBadge totalLikes={member.totalLikes || 0} size="sm" />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <p className={`text-sm ${level.textColor}`}>
                                            {level.name}
                                          </p>
                                          <span className="text-slate-500">•</span>
                                          {isEditing ? (
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                min="0"
                                                defaultValue={member.totalLikes || 0}
                                                onChange={(e) => setEditingUserLevel({ ...editingUserLevel, newLikes: e.target.value })}
                                                className="w-24 px-2 py-1 bg-slate-700 border border-cyan-500 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                placeholder="Likes"
                                              />
                                              <button
                                                onClick={() => {
                                                  handleUpdateUserLevel(member.id, editingUserLevel.newLikes || member.totalLikes);
                                                  setEditingUserLevel(null);
                                                }}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                                              >
                                                ✓ Salva
                                              </button>
                                              <button
                                                onClick={() => setEditingUserLevel(null)}
                                                className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-medium transition-colors"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          ) : (
                                            <p className="text-sm text-slate-400">
                                              {member.totalLikes || 0} likes
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {!isEditing && (
                                      <button
                                        onClick={() => setEditingUserLevel({ userId: member.id, currentLikes: member.totalLikes || 0, newLikes: member.totalLikes || 0 })}
                                        className="p-2 hover:bg-slate-600 rounded text-cyan-400 transition-colors"
                                        title="Modifica livello utente"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      {/* Info box */}
                      <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                        <p className="text-purple-300 font-medium mb-2">ℹ️ Informazioni sui Livelli</p>
                        <div className="text-slate-400 text-sm space-y-1">
                          <p>• <span className="text-slate-300">Livello 1 (Start):</span> 0-1 likes</p>
                          <p>• <span className="text-green-400">Livello 2 (Intermedio):</span> 2-15 likes → Sblocca Group Calls</p>
                          <p>• <span className="text-blue-400">Livello 3 (Pro):</span> 16-49 likes → Sblocca Live Room + Contenuti</p>
                          <p>• <span className="text-yellow-400">Livello 4 (Elite):</span> 50-99 likes → Contenuti Premium</p>
                          <p>• <span className="text-purple-400">Livello 5 (MentalFit):</span> 100+ likes → Tutti i contenuti + Bonus</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'onboarding' && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-4">Flow Onboarding</h3>
                      <p className="text-slate-400 mb-6">Configura il processo di benvenuto per nuovi membri</p>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer mb-3">
                            <div>
                              <span className="text-slate-100 font-medium">🎥 Video Benvenuto Obbligatorio</span>
                              <p className="text-slate-400 text-sm mt-1">Il cliente deve guardare il video prima di procedere</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                          <input 
                            type="url"
                            defaultValue="https://www.youtube.com/embed/dQw4w9WgXcQ"
                            placeholder="URL video YouTube/Vimeo..."
                            className="w-full px-3 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">📸 Foto Profilo Obbligatoria</span>
                              <p className="text-slate-400 text-sm mt-1">Il cliente deve caricare una foto profilo</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">💬 Post Presentazione Obbligatorio</span>
                              <p className="text-slate-400 text-sm mt-1">Deve scrivere un messaggio di benvenuto con obiettivi</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <span className="text-slate-100 font-medium">📋 Questionario Anamnesi</span>
                              <p className="text-slate-400 text-sm mt-1">Reindirizza a questionario dopo primo post</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-rose-600/20 to-pink-600/20 rounded-lg border border-rose-500/30">
                          <p className="text-rose-300 font-medium mb-2">⏱️ Ordine Steps</p>
                          <ol className="text-slate-300 text-sm space-y-1">
                            <li>1. Video Benvenuto Maurizio</li>
                            <li>2. Upload Foto Profilo</li>
                            <li>3. Post Presentazione Community</li>
                            <li>4. Compilazione Questionario</li>
                            <li>5. Notifica a Maurizio → Vocale personalizzato</li>
                            <li>6. Link prenotazione primo appuntamento</li>
                          </ol>
                        </div>

                        <button className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all shadow-lg">
                          Salva Configurazione Onboarding
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'notifications' && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-4">Notifiche Automatiche</h3>
                      <p className="text-slate-400 mb-6">Sistema di notifiche automatiche per coach e clienti</p>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30 mb-6">
                          <p className="text-purple-300 font-medium mb-2">🔔 Notifiche Coach (Maurizio)</p>
                          <div className="space-y-2 text-sm text-slate-300">
                            <p>• Questionario compilato → Invio vocale personalizzato in privato</p>
                            <p>• Timer 48h per consegna piano allenamento/alimentazione</p>
                            <p>• Nuovo membro iscritto → Benvenuto community</p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer mb-3">
                            <div>
                              <span className="text-slate-100 font-medium">📝 Notifica Questionario Completato</span>
                              <p className="text-slate-400 text-sm mt-1">Notifica istantanea a Maurizio quando cliente compila questionario</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                          <textarea 
                            placeholder="Template messaggio notifica..."
                            defaultValue="🎯 Nuovo questionario completato da {cliente_nome}!\n\nRevisionalo e invia il vocale personalizzato."
                            className="w-full px-3 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            rows={3}
                          />
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer mb-3">
                            <div>
                              <span className="text-slate-100 font-medium">⏱️ Timer 48h Consegna Piano</span>
                              <p className="text-slate-400 text-sm mt-1">Notifica di reminder dopo primo appuntamento</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                          <div className="flex gap-3">
                            <input 
                              type="number"
                              defaultValue={48}
                              className="w-24 px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <select className="flex-1 px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                              <option>Ore</option>
                              <option>Giorni</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer mb-3">
                            <div>
                              <span className="text-slate-100 font-medium">✅ Notifica Cliente Piano Pronto</span>
                              <p className="text-slate-400 text-sm mt-1">Notifica automatica quando piano è stato caricato</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                          <textarea 
                            placeholder="Template messaggio notifica cliente..."
                            defaultValue="🎉 Il tuo piano di allenamento e alimentazione è pronto!\n\nVai nella sezione &quot;Schede&quot; per visualizzarlo."
                            className="w-full px-3 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            rows={3}
                          />
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                          <label className="flex items-center justify-between cursor-pointer mb-3">
                            <div>
                              <span className="text-slate-100 font-medium">🔥 Notifiche Incoraggiamento</span>
                              <p className="text-slate-400 text-sm mt-1">Messaggi automatici di motivazione basati su attività</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                          </label>
                          <p className="text-slate-400 text-sm">
                            • 7 giorni senza attività → "Ti mancano! Torna in pista 💪"<br />
                            • 3 post consecutivi → "Stai andando alla grande! 🔥"<br />
                            • Nuovo livello raggiunto → "Congratulazioni! Livello sbloccato! 🏆"
                          </p>
                        </div>

                        <button className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg">
                          Salva Configurazione Notifiche
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Edit Profilo */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setShowEditProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100">Modifica Profilo</h3>
                <button onClick={() => setShowEditProfile(false)} className="p-2 rounded-lg hover:bg-slate-700">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    maxLength={40}
                    className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Il tuo nome"
                  />
                  <div className="text-right text-[10px] text-slate-500 mt-1">{profileName.length}/40</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Foto Profilo</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={profilePhotoPreview || userProfile?.photoURL || 'https://ui-avatars.com/api/?name=' + (userProfile?.name || 'User')}
                        alt="preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500"
                      />
                      {profilePhotoFile && (
                        <span className="absolute -bottom-1 -right-1 bg-cyan-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">Nuova</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Consigliato: quadrata, max 2MB.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium"
                >Annulla</button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold"
                >Salva</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Rewards */}
      <AnimatePresence>
        {showRewards && userProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowRewards(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-400" size={32} />
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">I Tuoi Progressi</h2>
                      <p className="text-slate-400">Livello attuale e rewards sbloccati</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRewards(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                {/* Livello attuale */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar 
                      src={userProfile.photoURL}
                      alt={userProfile.name}
                      totalLikes={userProfile.totalLikes || 0}
                      size={80}
                      showLevel={true}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-100 mb-2">{userProfile.name}</h3>
                      <LevelBadge totalLikes={userProfile.totalLikes || 0} size="md" />
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">{userProfile.totalLikes || 0} Likes totali</span>
                          {getUserLevel(userProfile.totalLikes || 0).id < 5 && (
                            <span className="text-slate-400">
                              Prossimo livello: {
                                getUserLevel(userProfile.totalLikes || 0).id === 1 ? '2 likes' :
                                getUserLevel(userProfile.totalLikes || 0).id === 2 ? '16 likes' :
                                getUserLevel(userProfile.totalLikes || 0).id === 3 ? '50 likes' :
                                '100 likes'
                              }
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${getUserLevel(userProfile.totalLikes || 0).color}`}
                            style={{
                              width: `${
                                getUserLevel(userProfile.totalLikes || 0).id === 1 ? ((userProfile.totalLikes || 0) / 2) * 100 :
                                getUserLevel(userProfile.totalLikes || 0).id === 2 ? ((userProfile.totalLikes || 0) / 16) * 100 :
                                getUserLevel(userProfile.totalLikes || 0).id === 3 ? ((userProfile.totalLikes || 0) / 50) * 100 :
                                getUserLevel(userProfile.totalLikes || 0).id === 4 ? ((userProfile.totalLikes || 0) / 100) * 100 :
                                100
                              }%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards list */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-280px)]">
                <h3 className="text-lg font-bold text-slate-100 mb-4">Rewards Disponibili</h3>
                {Object.entries(rewards).map(([level, reward]) => {
                  const isUnlocked = getUserLevel(userProfile.totalLikes || 0).id >= parseInt(level);
                  return (
                    <div 
                      key={level}
                      className={`p-4 rounded-xl border transition-all ${
                        isUnlocked 
                          ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/50' 
                          : 'bg-slate-700/30 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`text-4xl p-3 rounded-lg ${
                          isUnlocked ? 'bg-green-600/20' : 'bg-slate-700/50 grayscale'
                        }`}>
                          {reward.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`text-lg font-bold ${
                              isUnlocked ? 'text-green-400' : 'text-slate-400'
                            }`}>
                              {reward.name}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isUnlocked 
                                ? 'bg-green-600 text-white' 
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                              Livello {level}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            isUnlocked ? 'text-slate-300' : 'text-slate-500'
                          }`}>
                            {reward.description}
                          </p>
                          {isUnlocked && (
                            <button className="mt-3 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-lg">
                              Accedi al Contenuto →
                            </button>
                          )}
                          {!isUnlocked && (
                            <p className="mt-2 text-xs text-slate-500">
                              🔒 Sblocca raggiungendo il livello {level}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Notifiche */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md max-h-[600px] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-100">Notifiche</h3>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[500px] p-4 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Nessuna notifica</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg ${notif.read ? 'bg-slate-700/30' : 'bg-cyan-600/20 border border-cyan-500/30'}`}
                    >
                      <div className="flex items-start gap-3">
                        {notif.fromUserPhoto && (
                          <img src={notif.fromUserPhoto} alt="" className="w-10 h-10 rounded-full" />
                        )}
                        <div className="flex-1">
                          <p className="text-slate-200 text-sm">
                            {notif.type === 'mention' && `${notif.fromUserName} ti ha menzionato in un ${notif.commentType}`}
                            {notif.type === 'badge' && `🎉 Hai sbloccato: ${notif.badgeName}!`}
                            {notif.type === 'like' && `${notif.fromUserName} ha messo like al tuo post`}
                            {notif.type === 'comment' && `${notif.fromUserName} ha commentato il tuo post`}
                          </p>
                          <span className="text-xs text-slate-500 mt-1 block">
                            {formatTimestamp(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Badge */}
      <AnimatePresence>
        {showBadgesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBadgesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <Award className="text-yellow-400" />
                    I Tuoi Badge
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{userBadges.length} / {Object.keys(ACHIEVEMENT_BADGES).length} sbloccati</p>
                </div>
                <button onClick={() => setShowBadgesModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[60vh] p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(ACHIEVEMENT_BADGES).map(([key, badge]) => {
                  const unlocked = userBadges.includes(key);
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl text-center transition-all ${
                        unlocked
                          ? 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30'
                          : 'bg-slate-700/30 opacity-50'
                      }`}
                    >
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <h4 className="text-slate-100 font-bold text-sm mb-1">{badge.name}</h4>
                      <p className="text-slate-400 text-xs">{badge.description}</p>
                      {!unlocked && <p className="text-slate-500 text-xs mt-2">🔒 Bloccato</p>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Report */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-slate-100 mb-4">Segnala Contenuto</h3>
              <p className="text-slate-400 text-sm mb-4">
                Seleziona il motivo della segnalazione:
              </p>
              
              <div className="space-y-2 mb-6">
                {['Spam', 'Contenuto inappropriato', 'Molestie', 'Altro'].map(reason => (
                  <button
                    key={reason}
                    onClick={() => {
                      handleReport(showReportModal.type, showReportModal.id, reason);
                    }}
                    className="w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-all text-left"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowReportModal(null)}
                className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all"
              >
                Annulla
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Crea Poll */}
      <AnimatePresence>
        {showPollModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPollModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg p-6"
            >
              <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                <BarChart3 className="text-cyan-400" />
                Crea Sondaggio
              </h3>
              
              <input
                type="text"
                placeholder="Domanda del sondaggio..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
              />
              
              <div className="space-y-2 mb-4">
                {pollOptions.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Opzione ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ))}
              </div>
              
              <button
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="mb-4 text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                Aggiungi opzione
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleCreatePoll(newPostContent, pollOptions);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  Pubblica Sondaggio
                </button>
                <button
                  onClick={() => {
                    setShowPollModal(false);
                    setNewPostContent('');
                    setPollOptions(['', '']);
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Errore/Successo */}
      <AnimatePresence>
        {errorPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
            onClick={() => setErrorPopup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-slate-800 rounded-2xl shadow-2xl border w-full max-w-md p-6 ${
                errorPopup.type === 'success' 
                  ? 'border-green-500/50' 
                  : 'border-rose-600/50'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  errorPopup.type === 'success'
                    ? 'bg-green-600/20'
                    : 'bg-rose-600/20'
                }`}>
                  {errorPopup.type === 'success' ? (
                    <CheckCircle className="text-green-400" size={28} />
                  ) : (
                    <X className="text-rose-400" size={28} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-100 mb-2">{errorPopup.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{errorPopup.message}</p>
                  {errorPopup.details && (
                    <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                      <p className="text-xs text-slate-400">{errorPopup.details}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setErrorPopup(null)}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
                  errorPopup.type === 'success'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-slate-600 hover:bg-slate-500'
                } text-white`}
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Conferma Eliminazione Canale */}
      <AnimatePresence>
        {deleteConfirmChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setDeleteConfirmChannel(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl shadow-2xl border border-rose-600/50 w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-600/20 flex items-center justify-center">
                  <Trash2 className="text-rose-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Elimina Canale</h3>
                  <p className="text-slate-400 text-sm">Questa azione è irreversibile</p>
                </div>
              </div>
              
              <div className="bg-rose-900/20 border border-rose-600/30 rounded-lg p-4 mb-6">
                <p className="text-slate-200 mb-2">
                  Sei sicuro di voler eliminare il canale <span className="font-bold text-rose-400">{channels[deleteConfirmChannel]?.name}</span>?
                </p>
                <p className="text-slate-400 text-sm">
                  Tutti i post e i messaggi in questo canale rimarranno nel database ma non saranno più accessibili dall'interfaccia.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmChannel(null)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-all"
                >
                  Annulla
                </button>
                <button
                  onClick={() => handleDeleteChannel(deleteConfirmChannel)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  <Trash2 size={16} className="inline mr-2" />
                  Elimina
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
