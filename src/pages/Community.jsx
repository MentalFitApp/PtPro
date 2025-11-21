import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, setDoc, doc, getDoc, getDocs, serverTimestamp, increment, where, limit } from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { isSuperAdmin } from '../utils/superadmin';
import { uploadVideo } from '../utils/mediaUpload';
import { createDailyRoom, generateRoomName } from '../utils/dailyApi';
import { calculateUserLevel, updateUserProgress, getUserRewards } from '../utils/levels';
import { Trophy, MessageSquare, Lightbulb, Plus, Heart, MessageCircle, Award, Crown, Send, Image, Video as VideoIcon, X, Users as UsersIcon, Settings, Camera, CameraOff, Mic as MicOn, MicOff, Monitor, PhoneOff, User, Hash, Flame, ThumbsUp, Zap, Flag, Pin, TrendingUp, BarChart3, Target, CheckCircle, Trash2, MoreVertical, Filter, Search, UsersRound, BookOpen, Star, Gift, Bell, BellRing, Calendar, MapPin, Sparkles, Rocket, Shield, Eye, EyeOff, Play, SkipForward, Check, ChevronRight, ChevronLeft, Home, GraduationCap, Clock, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import MediaUploadButton from '../components/MediaUploadButton';
import MediaViewer from '../components/MediaViewer';
import { NotificationProvider, NotificationBell, useCreateNotification } from '../components/NotificationSystem';
import CourseDashboard from '../components/courses/CourseDashboard';
import { DailyProvider, useParticipantIds, useParticipant, useScreenShare, useLocalParticipant, useVideoTrack, useAudioTrack } from '@daily-co/daily-react';

/**
 * 🌟 Community Avanzata - Sistema Completo
 * ✨ Gamification completa con livelli e rewards
 * 🎯 Canali dinamici configurabili da superadmin
 * 📹 Group Call integrata con Daily.co
 * 👥 Gestione membri avanzata
 * ⚙️ Impostazioni complete per superadmin
 * 🎨 Design moderno e accattivante
 */

// Mapping delle icone disponibili
const ICON_MAP = {
  BellRing,
  UsersRound,
  Trophy,
  MessageSquare,
  Lightbulb,
  Flame,
  TrendingUp,
  Target,
  Star,
  Gift,
  Calendar,
  MapPin,
  Sparkles,
  Rocket,
  Shield,
  Hash
};

// Emoji reactions disponibili
const REACTIONS = {
  like: { emoji: '👍', label: 'Mi piace', color: 'text-blue-400' },
  love: { emoji: '❤️', label: 'Amo', color: 'text-red-400' },
  laugh: { emoji: '😂', label: 'Divertente', color: 'text-yellow-400' },
  wow: { emoji: '😮', label: 'Sorprendente', color: 'text-purple-400' },
  sad: { emoji: '😢', label: 'Triste', color: 'text-blue-300' },
  angry: { emoji: '😠', label: 'Arrabbiato', color: 'text-red-500' }
};

// Canali predefiniti con icone e colori
const DEFAULT_CHANNELS = {
  benvenuto: {
    name: '👋 Benvenuto',
    description: 'Regole, video founder e informazioni importanti',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: BellRing,
    readOnly: true,
    enabled: true
  },
  presentazioni: {
    name: '🎯 Presentazioni',
    description: 'Presentati alla community!',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: UsersRound,
    enabled: true
  },
  vittorie: {
    name: '🏆 Vittorie',
    description: 'Condividi i tuoi risultati e traguardi',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    icon: Trophy,
    enabled: true
  },
  domande: {
    name: '❓ Domande',
    description: 'Fai domande alla community',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    icon: Lightbulb,
    enabled: true
  },
  consigli: {
    name: '💡 Consigli',
    description: 'Condividi esperienze e consigli utili',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: Sparkles,
    enabled: true
  },
  live: {
    name: '📹 Live',
    description: 'Annunci group call settimanali',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: VideoIcon,
    enabled: true
  }
};

// Sistema livelli basato su likes totali
const LEVELS = [
  { id: 1, name: 'Rookie', minLikes: 0, maxLikes: 9, color: 'from-gray-500 to-slate-500', borderColor: 'border-gray-500' },
  { id: 2, name: 'Active', minLikes: 10, maxLikes: 49, color: 'from-blue-500 to-cyan-500', borderColor: 'border-blue-500' },
  { id: 3, name: 'Pro', minLikes: 50, maxLikes: 149, color: 'from-purple-500 to-pink-500', borderColor: 'border-purple-500' },
  { id: 4, name: 'Elite', minLikes: 150, maxLikes: 299, color: 'from-amber-500 to-orange-500', borderColor: 'border-amber-500' },
  { id: 5, name: 'Legend', minLikes: 300, maxLikes: Infinity, color: 'from-rose-500 to-red-500', borderColor: 'border-rose-500' }
];

// Componente per commenti thread
const CommentThread = ({ comment, postId, onReply, replyingTo, currentUser, depth = 0 }) => {

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-slate-600 pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar
          src={comment.authorPhoto}
          alt={comment.authorName}
          totalLikes={0}
          size={depth > 0 ? 24 : 32}
        />
        <div className="flex-1">
          <div className="bg-slate-700 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-slate-200 text-sm">{comment.authorName}</span>
              <span className="text-xs text-slate-400">
                {formatTimestamp(comment.createdAt)}
              </span>
            </div>
            <p className="text-slate-300 text-sm">{comment.content}</p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Rispondi
            </button>
            {comment.likesCount > 0 && (
              <span className="text-xs text-slate-400">
                {comment.likesCount} like
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Risposte */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              replyingTo={replyingTo}
              currentUser={currentUser}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper functions
const getUserLevel = (totalLikes) => {
  return LEVELS.find(level => totalLikes >= level.minLikes && totalLikes <= level.maxLikes) || LEVELS[0];
};

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

const calculateReadTime = (content) => {
  if (!content) return 1;
  const wordsPerMinute = 200; // Velocità di lettura media
  const words = content.trim().split(/\s+/).length;
  const readTime = Math.ceil(words / wordsPerMinute);
  return Math.max(1, readTime); // Minimo 1 minuto
};

// Componente Badge Livello
const LevelBadge = ({ level, size = 'md', showLabel = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className="relative inline-block">
      <div className={`rounded-full bg-gradient-to-br ${level?.color || 'from-gray-500 to-slate-500'} ${sizeClasses[size]} flex items-center justify-center text-white font-bold border-2 border-white/20 shadow-lg`}>
        <span>{level?.id || 1}</span>
      </div>
      {level.id === 5 && (
        <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
      )}
      {showLabel && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {level.name}
        </div>
      )}
    </div>
  );
};

// Componente Avatar con livello
const Avatar = ({ src, alt, totalLikes = 0, size = 32, showLevel = true }) => {
  const level = getUserLevel(totalLikes);
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt || 'User')}&size=${size}`;

  return (
    <div className="relative inline-block">
      <div className={`rounded-full p-0.5 bg-gradient-to-br ${level.color} shadow-lg`}>
        <img
          src={src || fallback}
          alt={alt}
          className="rounded-full object-cover bg-slate-800"
          style={{ width: size, height: size }}
        />
      </div>
      {showLevel && (
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-white text-xs font-bold border border-slate-800`}>
          {level.id}
        </div>
      )}
    </div>
  );
};

// Componente Group Call
function GroupCallInterface({ onLeave }) {
  const participants = useParticipantIds();
  const localParticipant = useLocalParticipant();
  const videoTrack = useVideoTrack(localParticipant?.sessionId);
  const audioTrack = useAudioTrack(localParticipant?.sessionId);
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center gap-3">
          <VideoIcon className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Group Call Community</h2>
          <span className="text-sm text-slate-400">• {participants.length} partecipanti</span>
        </div>
        <button
          onClick={onLeave}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Lascia Call
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {participants.map((participantId) => (
          <ParticipantVideo key={participantId} sessionId={participantId} />
        ))}
      </div>

      {/* Controls */}
      <div className="p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {/* toggle video */}}
            className={`p-3 rounded-full ${videoTrack?.isEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
          >
            {videoTrack?.isEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {/* toggle audio */}}
            className={`p-3 rounded-full ${audioTrack?.isEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
          >
            {audioTrack?.isEnabled ? <MicOn className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button
            onClick={isSharingScreen ? stopScreenShare : startScreenShare}
            className={`p-3 rounded-full ${isSharingScreen ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'} text-white transition-colors`}
          >
            <Monitor className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Video Partecipante
function ParticipantVideo({ sessionId }) {
  const participant = useParticipant(sessionId);
  const videoTrack = useVideoTrack(sessionId);
  const audioTrack = useAudioTrack(sessionId);

  return (
    <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
      {videoTrack?.isEnabled ? (
        <video
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          ref={(el) => {
            if (el && videoTrack.track) {
              el.srcObject = new MediaStream([videoTrack.track]);
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
        {participant?.user_name || 'Partecipante'} {!audioTrack?.isEnabled && '(muto)'}
      </div>
    </div>
  );
}

function CommunityContent() {
  const navigate = useNavigate();
  const { notifyLike, notifyLevelUp } = useCreateNotification();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeChannel, setActiveChannel] = useState('benvenuto');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostChannel, setNewPostChannel] = useState('vittorie');
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [showMembersList, setShowMembersList] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [newPostMedia, setNewPostMedia] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [showGroupCall, setShowGroupCall] = useState(false);
  const [userLevel, setUserLevel] = useState(LEVELS[0]);
  const [userProgress, setUserProgress] = useState(null);
  const [userRewards, setUserRewards] = useState([]);
  const [isUserSuperAdmin, setIsUserSuperAdmin] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [onboardingVideoUrl, setOnboardingVideoUrl] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [communitySettings, setCommunitySettings] = useState({
    communityEnabled: true,
    communityDisabledMessage: 'La community è temporaneamente disabilitata per manutenzione.',
    enableOnboardingVideo: false
  });
  const [showOnboardingVideo, setShowOnboardingVideo] = useState(false);

  // Statistiche community
  const [totalInteractions, setTotalInteractions] = useState(0);

  // Statistiche corsi
  const [coursesCount, setCoursesCount] = useState(0);
  const [enrollmentsCount, setEnrollmentsCount] = useState(0);
  const [completionsCount, setCompletionsCount] = useState(0);

  // Gestione reazioni
  const [showReactions, setShowReactions] = useState(null); // ID del post per cui mostrare le reazioni

  // Gestione commenti thread
  const [showComments, setShowComments] = useState(null); // ID del post per cui mostrare i commenti
  const [newComment, setNewComment] = useState('');
  const [showReportModal, setShowReportModal] = useState(null); // ID del post da segnalare
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // ID del commento a cui si sta rispondendo

  // Gestione video call
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null); // 'one-to-one' o 'group'
  const [selectedUser, setSelectedUser] = useState(null);
  const [callTitle, setCallTitle] = useState('');
  const [activeCalls, setActiveCalls] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Carica profilo utente
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);

          // Carica livello e progressi con il nuovo sistema
          const levelData = await calculateUserLevel(user.uid);
          if (levelData) {
            setUserLevel(levelData.currentLevel || LEVELS[0]);
            setUserProgress(levelData.progress);
          } else {
            setUserLevel(getUserLevel(userData.totalLikes || 0));
          }

          // Carica rewards dell'utente
          const rewards = await getUserRewards(user.uid);
          setUserRewards(rewards);

          // Controlla se è superadmin
          const superAdminStatus = await isSuperAdmin(user.uid);
          setIsUserSuperAdmin(superAdminStatus);
        }

        // Carica impostazioni community
        const settingsDoc = await getDoc(doc(db, 'community_settings', 'main'));
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data();
          const newSettings = {
            communityEnabled: settingsData.communityEnabled !== false,
            communityDisabledMessage: settingsData.communityDisabledMessage || 'La community è temporaneamente disabilitata per manutenzione.',
            enableOnboardingVideo: settingsData.enableOnboardingVideo || false
          };
          setCommunitySettings(newSettings);

          // Controlla se mostrare onboarding video
          if (newSettings.enableOnboardingVideo) {
            const userPrefsDoc = await getDoc(doc(db, 'user_preferences', user.uid));
            const hasSeenOnboarding = userPrefsDoc.exists() && userPrefsDoc.data().onboardingVideoSeen;
            if (!hasSeenOnboarding) {
              setShowOnboardingVideo(true);
            }
          }
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Monitora chiamate video attive dell'utente
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeVideoCalls = onSnapshot(
      query(collection(db, 'video_calls'),
        where('callerId', '==', currentUser.uid),
        where('status', 'in', ['pending', 'active'])
      ),
      (snapshot) => {
        const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'one-to-one' }));
        setActiveCalls(prev => [...prev.filter(c => c.type !== 'one-to-one'), ...calls]);
      }
    );

    const unsubscribeGroupCalls = onSnapshot(
      query(collection(db, 'group_video_calls'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', 'in', ['pending', 'active'])
      ),
      (snapshot) => {
        const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'group' }));
        setActiveCalls(prev => [...prev.filter(c => c.type !== 'group'), ...calls]);
      }
    );

    return () => {
      unsubscribeVideoCalls();
      unsubscribeGroupCalls();
    };
  }, [currentUser]);

  // Carica video onboarding per admin
  useEffect(() => {
    if (isUserSuperAdmin) {
      // Per ora usiamo un placeholder, in futuro possiamo salvare l'URL in Firestore
      const existingVideo = localStorage.getItem('onboarding_video_url');
      if (existingVideo) {
        setOnboardingVideoUrl(existingVideo);
      }
    }
  }, [isUserSuperAdmin]);

  // Carica canali
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const channelsQuery = query(collection(db, 'community_channels'), orderBy('order', 'asc'));
        const channelsSnap = await getDocs(channelsQuery);
        if (!channelsSnap.empty) {
          const channelsData = {};
          channelsSnap.docs.forEach(doc => {
            const data = doc.data();
            channelsData[doc.id] = {
              ...data,
              icon: data.iconName ? ICON_MAP[data.iconName] || Hash : Hash
            };
          });
          setChannels(channelsData);
        }
      } catch (error) {
        console.error('Error loading channels:', error);
      }
    };

    loadChannels();
  }, []);

  // Carica post
  useEffect(() => {
    if (!currentUser) return;

    const postsQuery = query(
      collection(db, 'community_posts'),
      where('channel', '==', activeChannel),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      const postsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const postData = { id: doc.id, ...doc.data() };

        // Incrementa visualizzazioni se non è il post dell'utente corrente
        if (postData.authorId !== currentUser.uid) {
          const postRef = doc.ref;
          await updateDoc(postRef, {
            views: increment(1),
            viewsCount: increment(1),
          });
          // Aggiorna localmente per mostrare il conteggio corretto
          postData.viewsCount = (postData.viewsCount || 0) + 1;
        }

        return postData;
      }));

      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, activeChannel]);

  // Carica membri
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('totalLikes', 'desc'));
        const usersSnap = await getDocs(usersQuery);
        const membersData = usersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllMembers(membersData);
      } catch (error) {
        console.error('Error loading members:', error);
      }
    };

    loadMembers();
  }, []);

  // Carica statistiche community (interazioni totali)
  useEffect(() => {
    const loadCommunityStats = async () => {
      try {
        const postsQuery = query(collection(db, 'community_posts'));
        const postsSnap = await getDocs(postsQuery);

        let totalInteractions = 0;
        postsSnap.docs.forEach(doc => {
          const post = doc.data();
          // Conta reazioni e commenti per ogni post
          const reactionsCount = post.reactionsCount || 0;
          const commentsCount = post.comments ? post.comments.length : 0;
          totalInteractions += reactionsCount + commentsCount;
        });

        setTotalInteractions(totalInteractions);
      } catch (error) {
        console.error('Error loading community stats:', error);
      }
    };

    loadCommunityStats();
  }, []);

  // Carica statistiche corsi
  useEffect(() => {
    const loadCourseStats = async () => {
      try {
        // Conta corsi disponibili
        const coursesQuery = query(collection(db, 'courses'));
        const coursesSnap = await getDocs(coursesQuery);
        setCoursesCount(coursesSnap.size);

        // Conta enrollment attivi
        const enrollmentsQuery = query(collection(db, 'course_enrollments'));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        setEnrollmentsCount(enrollmentsSnap.size);

        // Conta completamenti (corsi con progress = 100%)
        let completions = 0;
        enrollmentsSnap.docs.forEach(doc => {
          const enrollment = doc.data();
          if (enrollment.progress === 100) {
            completions++;
          }
        });
        setCompletionsCount(completions);

      } catch (error) {
        console.error('Error loading course stats:', error);
        // Imposta valori di default se ci sono errori di permessi
        setCoursesCount(0);
        setEnrollmentsCount(0);
        setCompletionsCount(0);
      }
    };

    loadCourseStats();
  }, []);

  // Gestisci modale profilo
  useEffect(() => {
    if (showEditProfile && userProfile) {
      setProfileName(userProfile.name || '');
      setProfilePhotoPreview(userProfile.photoURL || '');
    }
  }, [showEditProfile, userProfile]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostMedia.length === 0) return;

    try {
      const postData = {
        content: newPostContent,
        channel: newPostChannel,
        authorId: currentUser.uid,
        authorName: userProfile?.name || 'Utente',
        authorPhoto: userProfile?.photoURL || '',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        isPinned: false,
        media: newPostMedia
      };

      await addDoc(collection(db, 'community_posts'), postData);

      // Aggiorna progressi dell'utente
      await updateUserProgress(currentUser.uid, { posts: increment(1) });

      // Reset form
      setNewPostContent('');
      setNewPostChannel('vittorie');
      setNewPostMedia([]);
      setShowNewPost(false);

    } catch (error) {
      console.error('Error creating post:', error);
    }
  };



  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'community_posts', postId);
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();

      // Struttura reazioni: { like: [userId1, userId2], love: [userId3], ... }
      const currentReactions = postData.reactions || {};
      const userReactions = postData.userReactions || {}; // { userId: reactionType }

      const userCurrentReaction = userReactions[currentUser.uid];
      const hasReacted = userCurrentReaction === reactionType;

      if (hasReacted) {
        // Rimuovi reazione
        const updatedReactions = { ...currentReactions };
        if (updatedReactions[reactionType]) {
          updatedReactions[reactionType] = updatedReactions[reactionType].filter(id => id !== currentUser.uid);
          if (updatedReactions[reactionType].length === 0) {
            delete updatedReactions[reactionType];
          }
        }

        const updatedUserReactions = { ...userReactions };
        delete updatedUserReactions[currentUser.uid];

        await updateDoc(postRef, {
          reactions: updatedReactions,
          userReactions: updatedUserReactions,
          reactionsCount: increment(-1),
        });

        // Decrement author's total likes se era un like
        if (reactionType === 'like') {
          const authorRef = doc(db, 'users', postData.authorId);
          await updateDoc(authorRef, {
            totalLikes: increment(-1),
          });
        }
      } else {
        // Aggiungi o cambia reazione
        const updatedReactions = { ...currentReactions };
        const updatedUserReactions = { ...userReactions };

        // Rimuovi reazione precedente se esiste
        if (userCurrentReaction && updatedReactions[userCurrentReaction]) {
          updatedReactions[userCurrentReaction] = updatedReactions[userCurrentReaction].filter(id => id !== currentUser.uid);
          if (updatedReactions[userCurrentReaction].length === 0) {
            delete updatedReactions[userCurrentReaction];
          }
        }

        // Aggiungi nuova reazione
        if (!updatedReactions[reactionType]) {
          updatedReactions[reactionType] = [];
        }
        updatedReactions[reactionType].push(currentUser.uid);
        updatedUserReactions[currentUser.uid] = reactionType;

        const reactionsDelta = userCurrentReaction ? 0 : 1; // +1 se nuova reazione, 0 se cambio

        await updateDoc(postRef, {
          reactions: updatedReactions,
          userReactions: updatedUserReactions,
          reactionsCount: increment(reactionsDelta),
        });

        // Update author's total likes se è un like
        if (reactionType === 'like' && !userCurrentReaction) {
          const authorRef = doc(db, 'users', postData.authorId);
          const authorDoc = await getDoc(authorRef);
          const authorData = authorDoc.data();
          const newTotalLikes = (authorData.totalLikes || 0) + 1;

          await updateDoc(authorRef, {
            totalLikes: increment(1),
          });

          // Check for level up
          const currentLevel = getUserLevel(authorData.totalLikes || 0);
          const newLevel = getUserLevel(newTotalLikes);

          if (newLevel.id > currentLevel.id) {
            notifyLevelUp(postData.authorId, newLevel.id);
          }
        }

        // Aggiorna progressi dell'utente che reagisce
        if (!hasReacted && !userCurrentReaction) {
          await updateUserProgress(currentUser.uid, { reactions: increment(1) });
        }

        // Notify post author of new reaction (if not reacting to own post)
        if (postData.authorId !== currentUser.uid) {
          notifyLike(postData.authorId, userProfile?.name || 'Qualcuno', `ha reagito con ${REACTIONS[reactionType].emoji} al tuo post`);
        }
      }

      // Chiudi il menu reazioni
      setShowReactions(null);

    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleAddComment = async (postId, content, parentId = null) => {
    if (!currentUser || !content.trim()) return;

    try {
      const postRef = doc(db, 'community_posts', postId);
      const commentData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: content.trim(),
        authorId: currentUser.uid,
        authorName: userProfile?.name || 'Utente',
        authorPhoto: userProfile?.photoURL || '',
        createdAt: serverTimestamp(),
        parentId: parentId, // null per commenti principali, id del commento padre per risposte
        likes: [],
        likesCount: 0
      };

      // Struttura commenti: array di commenti con possibili risposte nidificate
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();
      const currentComments = postData.comments || [];

      if (parentId) {
        // È una risposta - trova il commento padre e aggiungi alla sua lista replies
        const updateCommentsWithReply = (comments) => {
          return comments.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), commentData]
              };
            } else if (comment.replies) {
              return {
                ...comment,
                replies: updateCommentsWithReply(comment.replies)
              };
            }
            return comment;
          });
        };
        await updateDoc(postRef, {
          comments: updateCommentsWithReply(currentComments),
          commentsCount: increment(1),
        });
      } else {
        // È un commento principale
        await updateDoc(postRef, {
          comments: [...currentComments, commentData],
          commentsCount: increment(1),
        });
      }

      // Aggiorna progressi dell'utente
      await updateUserProgress(currentUser.uid, { comments: increment(1) });

      setNewComment('');
      setReplyingTo(null);

      // Notifica l'autore del post se non è un commento al proprio post
      const postAuthorId = postData.authorId;
      if (postAuthorId !== currentUser.uid) {
        notifyLike(postAuthorId, userProfile?.name || 'Qualcuno', `ha commentato il tuo post: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
      }

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCreateVideoCall = async () => {
    if (!currentUser) return;

    try {
      if (callType === 'one-to-one') {
        if (!selectedUser) return;

        // Crea chiamata one-to-one
        const callId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const roomName = generateRoomName('one-to-one');

        // Crea la room su Daily.co
        const roomData = await createDailyRoom(roomName, {
          maxParticipants: 2,
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false
          }
        });

        await addDoc(collection(db, 'video_calls'), {
          id: callId,
          callerId: currentUser.uid,
          callerName: userProfile?.name || 'Utente',
          callerPhoto: userProfile?.photoURL || '',
          receiverId: selectedUser.id,
          receiverName: selectedUser.name,
          receiverPhoto: selectedUser.photo || '',
          roomUrl: roomData.url,
          roomName: roomName,
          status: 'pending',
          createdAt: serverTimestamp(),
        });

        // Naviga alla chiamata
        navigate(`/video-call/${callId}`);

      } else if (callType === 'group') {
        // Crea chiamata di gruppo
        const callId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const roomName = generateRoomName('group');

        // Crea la room su Daily.co
        const roomData = await createDailyRoom(roomName, {
          maxParticipants: 4,
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false
          }
        });

        await addDoc(collection(db, 'group_video_calls'), {
          id: callId,
          title: callTitle || 'Chiamata di Gruppo',
          hostId: currentUser.uid,
          hostName: userProfile?.name || 'Host',
          hostPhoto: userProfile?.photoURL || '',
          roomUrl: roomData.url,
          roomName: roomName,
          status: 'pending',
          participants: [currentUser.uid],
          maxParticipants: 4,
          createdAt: serverTimestamp(),
        });

        // Naviga alla chiamata di gruppo
        navigate(`/group-call/${callId}`);
      }

      setShowCallModal(false);
      setCallType(null);
      setSelectedUser(null);
      setCallTitle('');

    } catch (error) {
      console.error('Error creating video call:', error);
      alert('Errore nella creazione della chiamata video. Riprova.');
    }
  };

  const handleReportPost = async (postId) => {
    if (!reportReason.trim()) return;

    try {
      const postDoc = await getDoc(doc(db, 'community_posts', postId));
      const postData = postDoc.data();

      await addDoc(collection(db, 'reports'), {
        postId: postId,
        postContent: postData.content,
        reportedUserId: postData.authorId,
        reportedUserName: postData.authorName,
        reporterId: currentUser.uid,
        reporterName: userProfile?.name || 'Utente',
        reason: reportReason,
        description: reportDescription,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setShowReportModal(null);
      setReportReason('');
      setReportDescription('');
      alert('Segnalazione inviata con successo. Verrà revisionata da un moderatore.');
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Errore nell\'invio della segnalazione. Riprova.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Sei sicuro di voler rimuovere questo membro dalla community?')) return;

    try {
      await updateDoc(doc(db, 'users', memberId), {
        removedAt: serverTimestamp(),
        removedBy: currentUser.uid,
      });

      // Ricarica membri
      const usersQuery = query(collection(db, 'users'), where('removedAt', '==', null), orderBy('totalLikes', 'desc'));
      const usersSnap = await getDocs(usersQuery);
      const membersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllMembers(membersData);

      alert('Membro rimosso con successo');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Errore nella rimozione del membro');
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;

    try {
      const updateData = {
        name: profileName,
        updatedAt: serverTimestamp(),
      };

      if (profilePhotoFile) {
        const photoRef = storageRef(storage, `profile_photos/${currentUser.uid}`);
        await uploadBytes(photoRef, profilePhotoFile);
        const photoURL = await getDownloadURL(photoRef);
        updateData.photoURL = photoURL;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), updateData);

      // Aggiorna stato locale
      setUserProfile(prev => ({ ...prev, ...updateData }));
      setShowEditProfile(false);

      alert('Profilo aggiornato con successo!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Errore nell\'aggiornamento del profilo');
    }
  };

  const handleOnboardingVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await uploadVideo(file, 'admin', 'onboarding');
      setOnboardingVideoUrl(result.url);
      localStorage.setItem('onboarding_video_url', result.url);
      alert('Video onboarding caricato con successo!');
    } catch (error) {
      console.error('Error uploading onboarding video:', error);
      alert('Errore nel caricamento del video: ' + error.message);
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfilePhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const filteredPosts = posts.filter(post => post.channel === activeChannel);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  // Controlla se la community è abilitata
  if (!communitySettings.communityEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
            <Shield className="text-amber-400 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-slate-100 mb-4">Community Temporaneamente Disabilitata</h1>
            <p className="text-slate-300 leading-relaxed">
              {communitySettings.communityDisabledMessage}
            </p>
            {isUserSuperAdmin && (
              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">
                  Sei un amministratore. Puoi riabilitare la community dalle impostazioni.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-rose-400" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Community</h1>
                <p className="text-xs text-slate-400">Condividi, impara, cresci insieme</p>
              </div>
            </div>
            {userProfile && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMembersList(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <UsersIcon size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">Membri</span>
                  </button>
                  {isUserSuperAdmin && (
                    <button
                      onClick={() => setShowAdminSettings(!showAdminSettings)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                        showAdminSettings
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      <Settings size={16} className={showAdminSettings ? 'text-white' : 'text-slate-400'} />
                      <span className="text-sm">Admin</span>
                    </button>
                  )}
                  {userLevel.id >= 2 && (
                    <button
                      onClick={() => setShowGroupCall(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <VideoIcon size={16} className="text-white" />
                      <span className="text-sm text-white">Group Call</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-200">{userProfile.name}</p>
                          {activeCalls.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-400 animate-pulse">
                              <VideoIcon size={12} />
                              <span>{activeCalls.length}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {userLevel.name} • {userProgress?.total_points || 0} punti
                        </p>
                      </div>
                      <button
                        onClick={() => setShowEditProfile(true)}
                        className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      >
                        Modifica
                      </button>
                    </div>
                  </div>
                  <LevelBadge level={userLevel} size="md" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Main Navigation Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'home'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home size={16} />
            Home
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'courses'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen size={16} />
            Corsi
          </button>
          {isUserSuperAdmin && (
            <button
              onClick={() => {
                setActiveTab('settings');
                setShowAdminSettings(true);
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={16} />
              Impostazioni
            </button>
          )}
        </div>

        {/* User Progress Section */}
        {userProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="text-yellow-400" size={20} />
                Il Tuo Progresso
              </h3>
              <div className="text-sm text-slate-400">
                {userProgress.total_points} punti totali
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={16} className="text-blue-400" />
                  <span className="text-sm text-slate-300">Posts</span>
                </div>
                <div className="text-lg font-semibold text-white">{userProgress.posts || 0}</div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp size={16} className="text-green-400" />
                  <span className="text-sm text-slate-300">Reazioni</span>
                </div>
                <div className="text-lg font-semibold text-white">{userProgress.reactions || 0}</div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle size={16} className="text-purple-400" />
                  <span className="text-sm text-slate-300">Commenti</span>
                </div>
                <div className="text-lg font-semibold text-white">{userProgress.comments || 0}</div>
              </div>
            </div>

            {userRewards.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Gift size={16} className="text-yellow-400" />
                  Rewards Sbloccati
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userRewards.map((reward) => (
                    <div key={reward.id} className="bg-slate-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
                      <div className="text-yellow-400">
                        <Award size={14} />
                      </div>
                      <span className="text-sm text-slate-200">{reward.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab Content Container */}
        <AnimatePresence mode="wait">
          {/* Home Tab */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Community Header */}
              <div className="bg-gradient-to-r from-rose-600/20 to-pink-600/20 rounded-xl p-6 border border-rose-500/20 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-600/20 rounded-lg">
                    <UsersRound className="text-rose-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Benvenuto nella Community!</h2>
                    <p className="text-slate-400 text-sm">Connettiti, impara e cresci insieme ad altri professionisti</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UsersRound className="text-blue-400" size={16} />
                      <span className="text-sm font-medium text-slate-300">Membri</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{allMembers.length}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="text-green-400" size={16} />
                      <span className="text-sm font-medium text-slate-300">Post</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">{posts.length}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="text-purple-400" size={16} />
                      <span className="text-sm font-medium text-slate-300">Canali</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{Object.keys(channels).length}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="text-yellow-400" size={16} />
                      <span className="text-sm font-medium text-slate-300">Attività</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{totalInteractions}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowNewPost(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-white text-sm font-medium transition-all"
                >
                  <Plus size={16} />
                  Nuovo Post
                </button>

                {activeCalls.length > 0 ? (
                  <button
                    onClick={() => {
                      const call = activeCalls[0]; // Prendi la prima chiamata attiva
                      navigate(call.type === 'group' ? `/group-call/${call.id}` : `/video-call/${call.id}`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-lg text-white text-sm font-medium transition-all animate-pulse"
                  >
                    <VideoIcon size={16} />
                    Rientra in Call ({activeCalls.length})
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCallModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-white text-sm font-medium transition-all"
                  >
                    <VideoIcon size={16} />
                    Video Call
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('courses')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 text-sm font-medium transition-all"
                >
                  <BookOpen size={16} />
                  Esplora Corsi
                </button>

                {isUserSuperAdmin && (
                  <button
                    onClick={() => navigate('/course-admin')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-all"
                  >
                    <Settings size={16} />
                    Gestisci Corsi
                  </button>
                )}
              </div>

              {/* Channel Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {Object.entries(channels).map(([key, channel]) => {
            if (!channel.enabled) return null;
            const Icon = channel.icon || Hash;
            const isActive = activeChannel === key;
            return (
              <button
                key={key}
                onClick={() => setActiveChannel(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? `bg-${channel.color.split(' ')[0].replace('from-', '')}-600 text-white shadow-lg`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Icon size={18} />
                {channel.name}
              </button>
            );
          })}
        </div>

        {/* New Post Button */}
        {activeChannel !== 'benvenuto' && (
          <button
            onClick={() => setShowNewPost(true)}
            className="w-full mb-6 p-4 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-rose-500 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-rose-400"
          >
            <Plus size={20} />
            <span className="font-medium">Crea un nuovo post</span>
          </button>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  src={post.authorPhoto}
                  alt={post.authorName}
                  totalLikes={post.authorLikes || 0}
                  size={40}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-slate-200">{post.authorName}</span>
                    <span className="text-xs text-slate-400">
                      {formatTimestamp(post.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-4 whitespace-pre-wrap">{post.content}</p>

                  {/* Engagement Metrics */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      <span>{post.viewsCount || 0} visualizzazioni</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{calculateReadTime(post.content)} min lettura</span>
                    </div>
                  </div>

                  {/* Reactions Summary */}
                  {post.reactions && Object.keys(post.reactions).length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex -space-x-1">
                        {Object.entries(post.reactions)
                          .sort(([,a], [,b]) => b.length - a.length)
                          .slice(0, 3)
                          .map(([type]) => (
                            <span key={type} className="text-lg" title={`${post.reactions[type].length} ${REACTIONS[type].label.toLowerCase()}`}>
                              {REACTIONS[type].emoji}
                            </span>
                          ))}
                      </div>
                      <span className="text-sm text-slate-400">
                        {post.reactionsCount || 0} reazioni
                      </span>
                    </div>
                  )}

                  {/* Media */}
                  {post.media && post.media.length > 0 && (
                    <div className="mb-4">
                      <MediaViewer media={post.media} />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    {/* Reactions Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                          post.userReactions?.[currentUser?.uid]
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                        }`}
                      >
                        {post.userReactions?.[currentUser?.uid] ? (
                          <>
                            <span className="text-lg">{REACTIONS[post.userReactions[currentUser.uid]].emoji}</span>
                            <span className="text-sm">{post.reactionsCount || 0}</span>
                          </>
                        ) : (
                          <>
                            <ThumbsUp size={16} />
                            <span className="text-sm">{post.reactionsCount || 0}</span>
                          </>
                        )}
                      </button>

                      {/* Reactions Menu */}
                      {showReactions === post.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl z-10"
                        >
                          <div className="flex gap-1">
                            {Object.entries(REACTIONS).map(([type, reaction]) => (
                              <button
                                key={type}
                                onClick={() => handleReaction(post.id, type)}
                                className={`p-2 rounded-lg transition-colors hover:bg-slate-700 ${
                                  post.userReactions?.[currentUser?.uid] === type ? 'bg-slate-700' : ''
                                }`}
                                title={reaction.label}
                              >
                                <span className="text-xl">{reaction.emoji}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <button
                      onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span className="text-sm">{post.commentsCount || 0}</span>
                    </button>

                    <button
                      onClick={() => setShowReportModal(post.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Segnala post"
                    >
                      <Flag size={16} />
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showComments === post.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-700"
                    >
                      {/* Add Comment */}
                      <div className="mb-4">
                        <div className="flex gap-3">
                          <Avatar
                            src={userProfile?.photoURL}
                            alt={userProfile?.name}
                            totalLikes={userProfile?.totalLikes || 0}
                            size={32}
                          />
                          <div className="flex-1">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post.id, newComment);
                                  }
                                }}
                                placeholder={replyingTo ? "Rispondi al commento..." : "Scrivi un commento..."}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => handleAddComment(post.id, newComment)}
                                disabled={!newComment.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                              >
                                <Send size={16} />
                              </button>
                            </div>
                            {replyingTo && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-slate-400">Rispondendo a un commento</span>
                                <button
                                  onClick={() => setReplyingTo(null)}
                                  className="text-xs text-slate-500 hover:text-slate-400"
                                >
                                  Annulla
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3">
                        {post.comments && post.comments.map(comment => (
                          <CommentThread
                            key={comment.id}
                            comment={comment}
                            postId={post.id}
                            onReply={(commentId) => setReplyingTo(commentId)}
                            replyingTo={replyingTo}
                            currentUser={currentUser}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* New Post Modal */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowNewPost(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-100">Nuovo Post</h2>
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Canale</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(channels).filter(([key, channel]) => channel.enabled && key !== 'benvenuto').map(([key, channel]) => {
                      const Icon = channel.icon || Hash;
                      return (
                        <button
                          key={key}
                          onClick={() => setNewPostChannel(key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            newPostChannel === key
                              ? `bg-${channel.color.split(' ')[0].replace('from-', '')}-600 text-white`
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          <Icon size={16} />
                          {channel.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Scrivi il tuo post..."
                    className="w-full h-32 px-3 py-2 bg-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>

                <MediaUploadButton
                  onMediaSelected={(media) => setNewPostMedia(media)}
                  maxFiles={4}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() && newPostMedia.length === 0}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pubblica
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members List Modal */}
        <AnimatePresence>
          {showMembersList && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowMembersList(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UsersIcon className="text-cyan-400" size={24} />
                      <div>
                        <h2 className="text-xl font-bold text-slate-100">Membri Community</h2>
                        <p className="text-sm text-slate-400">{allMembers.length} membri totali</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMembersList(false)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="grid gap-4">
                    {allMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={member.photoURL}
                            alt={member.name || 'Utente'}
                            totalLikes={member.totalLikes || 0}
                            size={40}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-200">{member.name || 'Utente senza nome'}</span>
                              <LevelBadge totalLikes={member.totalLikes || 0} size="sm" />
                            </div>
                            <div className="text-sm text-slate-400">
                              {member.totalLikes || 0} likes totali • {member.email || ''}
                            </div>
                          </div>
                        </div>
                        {isUserSuperAdmin && member.id !== currentUser?.uid && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={14} />
                            Rimuovi
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Call Modal */}
        <AnimatePresence>
          {showGroupCall && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
            >
              <DailyProvider
                url={`https://biondo-fitness-coach.daily.co/group-call`}
                userName={userProfile?.name || 'Partecipante'}
              >
                <GroupCallInterface onLeave={() => setShowGroupCall(false)} />
              </DailyProvider>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditProfile(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-100">Modifica Profilo</h2>
                  <button
                    onClick={() => setShowEditProfile(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Livello Utente */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Il Tuo Livello</label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${userLevel.color} flex items-center justify-center text-white font-bold text-lg`}>
                          {userLevel.id}
                        </div>
                        <div>
                          <div className="text-slate-100 font-semibold">
                            {userLevel.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {userProfile?.totalLikes || 0} likes totali
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${userLevel.color} text-white`}>
                        Lv {userLevel.id}
                      </span>
                    </div>
                  </div>

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
            </motion.div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Corsi in Arrivo</h3>
                <p className="text-slate-500">I corsi saranno disponibili a breve!</p>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && isUserSuperAdmin && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Admin Settings Section */}
              {showAdminSettings && isUserSuperAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="text-rose-400" size={24} />
                    <h2 className="text-xl font-bold text-slate-100">Impostazioni Admin</h2>
                  </div>

                  {/* Modifica Livello Rapida */}
                  <div className="mb-6 bg-gradient-to-r from-yellow-900/20 to-rose-900/20 border border-yellow-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="text-yellow-400" size={24} />
                      <h3 className="text-lg font-bold text-slate-100">Il Tuo Livello</h3>
                    </div>
                    
                    {userProgress && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-yellow-400">{userProgress.level}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Livello {userProgress.isManual ? 'Manuale' : 'Automatico'}
                            </div>
                          </div>
                          <div className="flex-1">
                            {!userProgress.isManual && (
                              <>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-slate-300">Progresso</span>
                                  <span className="text-yellow-400 font-medium">{userProgress.xp} / {userProgress.nextLevelXP} XP</span>
                                </div>
                                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-yellow-500 to-rose-500 transition-all duration-500"
                                    style={{ width: `${userProgress.nextLevelXP > 0 ? (userProgress.xp / userProgress.nextLevelXP) * 100 : 0}%` }}
                                  />
                                </div>
                              </>
                            )}
                            {userProgress.isManual && (
                              <div className="text-sm text-slate-400">
                                Livello impostato manualmente da admin
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isUserSuperAdmin && (
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                defaultValue={userProgress?.level || 1}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-yellow-500"
                                id="admin-level-input"
                              />
                              <button
                                onClick={async () => {
                                  const newLevel = parseInt(document.getElementById('admin-level-input').value);
                                  if (newLevel && newLevel > 0 && newLevel <= 100) {
                                    try {
                                      await setDoc(doc(db, 'user_levels', currentUser.uid), {
                                        level: newLevel,
                                        isManual: true,
                                        updatedAt: serverTimestamp(),
                                        updatedBy: currentUser.uid
                                      }, { merge: true });
                                      alert(`✅ Livello aggiornato a ${newLevel}!`);
                                      // Ricarica il progresso
                                      const levelData = await calculateUserLevel(currentUser.uid);
                                      if (levelData) {
                                        setUserProgress(levelData);
                                        setUserLevel(getUserLevel(levelData.level * 10)); // Aggiorna anche il badge
                                      }
                                    } catch (error) {
                                      console.error('Error updating level:', error);
                                      alert('❌ Errore nell\'aggiornamento del livello: ' + error.message);
                                    }
                                  } else {
                                    alert('⚠️ Inserisci un livello valido (1-100)');
                                  }
                                }}
                                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                              >
                                Aggiorna Livello
                              </button>
                            </div>
                            <p className="text-xs text-slate-400 italic">
                              ⚠️ Modifica manuale del livello - disponibile solo per admin
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Quick Stats */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="text-cyan-400" size={16} />
                        <span className="text-sm font-medium text-slate-300">Statistiche</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div>Post: {posts.length}</div>
                        <div>Membri: {allMembers.length}</div>
                        <div>Canali: {Object.keys(channels).length}</div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="text-rose-400" size={16} />
                        <span className="text-sm font-medium text-slate-300">Azioni Rapide</span>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setActiveTab('settings');
                            setShowAdminSettings(true);
                          }}
                          className="w-full text-left px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs text-slate-200 transition-colors"
                        >
                          ⚙️ Impostazioni Community
                        </button>
                        <button
                          onClick={() => navigate('/community-admin')}
                          className="w-full text-left px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs text-slate-200 transition-colors"
                        >
                          🛡️ Pannello Amministrazione
                        </button>
                        <button
                          onClick={() => setShowMembersList(true)}
                          className="w-full text-left px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs text-slate-200 transition-colors"
                        >
                          👥 Gestisci Membri
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              alert('Test Daily.co API in corso...');
                              const roomName = generateRoomName('test');
                              const roomData = await createDailyRoom(roomName, {
                                maxParticipants: 2,
                                properties: {
                                  enable_chat: true,
                                  enable_screenshare: true
                                }
                              });
                              alert(`✅ Room creata con successo!\nURL: ${roomData.url}\n\n Verrà eliminata automaticamente tra 10 secondi.`);

                              // Elimina la room di test dopo 10 secondi
                              setTimeout(() => {
                                alert('🗑️ Room di test creata (auto-scadenza tra 5 minuti)');
                              }, 10000);
                            } catch (error) {
                              alert(`❌ Errore API Daily.co: ${error.message}`);
                            }
                          }}
                          className="w-full text-left px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded text-xs text-slate-200 transition-colors"
                        >
                          🎥 Test Video Call API
                        </button>
                      </div>
                    </div>

                    {/* Video Onboarding */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <VideoIcon className="text-purple-400" size={16} />
                        <span className="text-sm font-medium text-slate-300">Video Onboarding</span>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleOnboardingVideoUpload}
                          className="w-full text-xs text-slate-300 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                        />
                        <p className="text-[10px] text-slate-500">
                          Carica video benvenuto (max 100MB)
                        </p>
                        {onboardingVideoUrl && (
                          <div className="mt-2">
                            <video
                              src={onboardingVideoUrl}
                              className="w-full h-20 object-cover rounded"
                              controls
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-green-400" size={16} />
                        <span className="text-sm font-medium text-slate-300">Sistema</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Notifiche Attive
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Gamification OK
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Group Call Ready
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Courses Header */}
              <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl p-6 border border-cyan-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-600/20 rounded-lg">
                    <BookOpen className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Corsi della Community</h2>
                    <p className="text-slate-400 text-sm">Impara e cresci con i nostri corsi esclusivi</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="text-green-400" size={16} />
                      <span className="text-sm font-medium text-slate-300">Corsi Disponibili</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">{coursesCount}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="text-blue-400" size={16} />
                      <span className="text-sm font-medium text-slate-300">Iscritti</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{enrollmentsCount}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="text-yellow-400" size={16} />
                      <span className="text-sm font-medium text-slate-300">Completati</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{completionsCount}</div>
                  </div>
                </div>
              </div>

              <CourseDashboard />
            </motion.div>
          )}

          {/* Video Call Modal */}
          {showCallModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCallModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-6">Avvia Video Chiamata</h3>

                {!callType ? (
                  // Selezione tipo chiamata
                  <div className="space-y-4">
                    <button
                      onClick={() => setCallType('one-to-one')}
                      className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Chiamata Privata</h4>
                          <p className="text-slate-400 text-sm">Video chiamata one-to-one con un membro</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setCallType('group')}
                      className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Chiamata di Gruppo</h4>
                          <p className="text-slate-400 text-sm">Video chiamata con più membri (fino a 4)</p>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : callType === 'one-to-one' ? (
                  // Selezione utente per chiamata one-to-one
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => setCallType(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ← Indietro
                      </button>
                      <h4 className="text-white font-medium">Seleziona un membro</h4>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {allMembers.filter(member => member.id !== currentUser?.uid).map(member => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedUser(member)}
                          className={`w-full p-3 rounded-lg transition-colors text-left ${
                            selectedUser?.id === member.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={member.photoURL}
                              alt={member.name}
                              totalLikes={member.totalLikes || 0}
                              size={32}
                            />
                            <span className="text-white">{member.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedUser && (
                      <button
                        onClick={handleCreateVideoCall}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                      >
                        Chiama {selectedUser.name}
                      </button>
                    )}
                  </div>
                ) : (
                  // Configurazione chiamata di gruppo
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => setCallType(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ← Indietro
                      </button>
                      <h4 className="text-white font-medium">Chiamata di Gruppo</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Titolo della chiamata (opzionale)
                      </label>
                      <input
                        type="text"
                        value={callTitle}
                        onChange={(e) => setCallTitle(e.target.value)}
                        placeholder="es. Discussione progetti"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      onClick={handleCreateVideoCall}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                    >
                      Avvia Chiamata di Gruppo
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowCallModal(false);
                    setCallType(null);
                    setSelectedUser(null);
                    setCallTitle('');
                  }}
                  className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  Annulla
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Report Modal */}
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowReportModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Flag className="text-red-400" size={24} />
                  Segnala Post
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Motivo della segnalazione</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">Seleziona un motivo...</option>
                      <option value="Contenuto inappropriato">Contenuto inappropriato</option>
                      <option value="Spam">Spam</option>
                      <option value="Comportamento offensivo">Comportamento offensivo</option>
                      <option value="Violazione delle regole">Violazione delle regole</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Descrizione (opzionale)</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Fornisci dettagli aggiuntivi sulla segnalazione..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleReportPost(showReportModal)}
                    disabled={!reportReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Flag size={16} />
                    Invia Segnalazione
                  </button>
                  <button
                    onClick={() => {
                      setShowReportModal(null);
                      setReportReason('');
                      setReportDescription('');
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Onboarding Video Modal */}
        <AnimatePresence>
          {showOnboardingVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowOnboardingVideo(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Play className="text-purple-400" size={24} />
                      <h2 className="text-xl font-bold text-slate-100">Benvenuto nella Community!</h2>
                    </div>
                    <button
                      onClick={() => setShowOnboardingVideo(false)}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="aspect-video bg-slate-900 rounded-lg mb-6 flex items-center justify-center">
                    <div className="text-center">
                      <VideoIcon className="text-slate-400 mx-auto mb-4" size={48} />
                      <p className="text-slate-400">Video introduttivo della community</p>
                      <p className="text-sm text-slate-500 mt-2">
                        Qui verrà mostrato il video di onboarding quando sarà configurato.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        // Segna che l'utente ha visto l'onboarding
                        await setDoc(doc(db, 'user_preferences', currentUser.uid), {
                          onboardingVideoSeen: true,
                          seenAt: serverTimestamp()
                        }, { merge: true });
                        setShowOnboardingVideo(false);
                      }}
                      className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="text-white" size={18} />
                      Ho capito, iniziamo!
                    </button>
                    <button
                      onClick={() => setShowOnboardingVideo(false)}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                    >
                      Salta
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Community() {
  return (
    <NotificationProvider>
      <CommunityContent />
    </NotificationProvider>
  );
}
