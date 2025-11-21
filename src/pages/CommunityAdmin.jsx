import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { isSuperAdmin } from '../utils/superadmin';
import {
  Shield, AlertTriangle, Eye, EyeOff, Trash2, Ban, UserX, Flag, MessageSquare, Users, BarChart3, Settings, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, MoreVertical, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Activity, Target, Award, Video, Heart, MessageCircle, Download, Hash, Crown, Edit, Plus, Save, X, Bell, ThumbsUp, Flame, Star, Gift, Calendar, MapPin, Sparkles, Rocket
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Stat Card Component
const StatCard = ({ title, value, icon, trend, trendValue, subtitle, color = 'blue' }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-600/20',
    green: 'text-green-400 bg-green-600/20',
    red: 'text-red-400 bg-red-600/20',
    yellow: 'text-yellow-400 bg-yellow-600/20',
    purple: 'text-purple-400 bg-purple-600/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 backdrop-blur-sm p-5 rounded-xl border border-slate-700 shadow-xl"
    >
      <div className="flex items-center gap-3 text-slate-400 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-3xl font-bold text-slate-100 mb-2">
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </p>
      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}
      {trendValue && TrendIcon && (
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          <TrendIcon size={16} />
          <span>{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
};

// Chart Component
const SimpleChart = ({ data, title, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-sm text-slate-400 truncate">{item.label}</div>
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${colorClasses[color]} transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm text-white text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommunityAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Stati per segnalazioni
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('all');
  const [reportSearch, setReportSearch] = useState('');
  const [reportSortBy, setReportSortBy] = useState('createdAt');

  // Stati per contenuti
  const [posts, setPosts] = useState([]);
  const [hiddenPosts, setHiddenPosts] = useState([]);
  const [contentFilter, setContentFilter] = useState('all');
  const [contentSearch, setContentSearch] = useState('');

  // Stati per membri
  const [members, setMembers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSortBy, setMemberSortBy] = useState('name');

  // Stati per analytics
  const [timeRange, setTimeRange] = useState('7d');
  const [videoCalls, setVideoCalls] = useState([]);

  // Stati per canali
  const [channels, setChannels] = useState([]);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    description: '',
    color: 'from-blue-500 to-cyan-500',
    iconName: 'Hash',
    enabled: true
  });

  // Stati per livelli configurabili
  const [levels, setLevels] = useState([
    { id: 1, name: 'Rookie', minLikes: 0, maxLikes: 9, color: 'from-gray-500 to-slate-500', perks: ['Accesso base'], enabled: true },
    { id: 2, name: 'Active', minLikes: 10, maxLikes: 49, color: 'from-blue-500 to-cyan-500', perks: ['Group Call', 'Contenuto esclusivo'], enabled: true },
    { id: 3, name: 'Pro', minLikes: 50, maxLikes: 149, color: 'from-purple-500 to-pink-500', perks: ['Badge speciale', 'Area premium'], enabled: true },
    { id: 4, name: 'Elite', minLikes: 150, maxLikes: 299, color: 'from-amber-500 to-orange-500', perks: ['1 mese gratis', 'Bonus esclusivo'], enabled: true },
    { id: 5, name: 'Legend', minLikes: 300, maxLikes: 999999, color: 'from-rose-500 to-red-500', perks: ['Consulenza 1:1', 'Maglia brand'], enabled: true },
  ]);

  // Stati per rewards configurabili
  const [rewards, setRewards] = useState([
    { id: 'video_course', name: 'Corso Video Esclusivo', description: 'Accesso a corsi video premium', type: 'unlock', threshold: 25, enabled: true },
    { id: 'live_room', name: 'Stanza Live Privata', description: 'Accesso alle stanze live private', type: 'unlock', threshold: 50, enabled: true },
    { id: 'badge', name: 'Badge Speciale', description: 'Badge esclusivo sul profilo', type: 'badge', threshold: 75, enabled: true },
    { id: 'consultation', name: 'Consulenza Gratuita', description: 'Una sessione di consulenza gratuita', type: 'service', threshold: 100, enabled: true },
  ]);

  // Stati per impostazioni
  const [settings, setSettings] = useState({
    communityName: 'Fitness Community',
    communityDescription: 'La community dei appassionati di fitness che vogliono crescere insieme.',
    allowRegistration: true,
    requireProfileCompletion: true,
    autoModeration: false,
    notificationEmails: true,
    maxPostsPerDay: 10,
    maxCommentsPerDay: 50,
    enableLevels: true,
    enableRewards: true,
    enableVideoCalls: true,
    enableChannels: true,
    communityEnabled: true,
    communityDisabledMessage: 'La community è temporaneamente disabilitata per manutenzione.',
    enableOnboardingVideo: false,
  });

  // Stati per gestione membri avanzata
  const [selectedMembers, setSelectedMembers] = useState([]);

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'moderation', label: 'Moderazione', icon: Shield },
    { id: 'channels', label: 'Canali', icon: Hash },
    { id: 'members', label: 'Membri', icon: Users },
    { id: 'levels', label: 'Livelli', icon: Crown },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
  ];

  const settingsTabs = [
    { id: 'general', label: 'Generali', icon: Settings },
    { id: 'moderation', label: 'Moderazione', icon: Shield },
    { id: 'permissions', label: 'Permessi', icon: Users },
    { id: 'notifications', label: 'Notifiche', icon: Bell },
    { id: 'integrations', label: 'Integrazioni', icon: Video },
  ];

  // Analytics data
  const analytics = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    const filteredPosts = posts.filter(post =>
      post.createdAt?.toDate() >= startDate
    );

    const filteredReports = reports.filter(report =>
      report.createdAt?.toDate() >= startDate
    );

    const filteredVideoCalls = videoCalls.filter(call =>
      call.createdAt?.toDate() >= startDate
    );

    const totalPosts = filteredPosts.length;
    const totalUsers = members.length;
    const totalReports = filteredReports.length;
    const totalVideoCalls = filteredVideoCalls.length;

    let totalComments = 0;
    let totalReactions = 0;
    filteredPosts.forEach(post => {
      totalComments += post.commentsCount || 0;
      totalReactions += post.reactionsCount || 0;
    });

    const activeUserIds = new Set(filteredPosts.map(post => post.authorId));
    const activeUsers = activeUserIds.size;
    const engagementRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;
    const reportsResolved = filteredReports.filter(report => report.status === 'resolved').length;
    const avgPostsPerUser = activeUsers > 0 ? (totalPosts / activeUsers).toFixed(1) : 0;

    const channelStats = {};
    filteredPosts.forEach(post => {
      const channel = post.channel || 'generale';
      channelStats[channel] = (channelStats[channel] || 0) + 1;
    });

    const topChannels = Object.entries(channelStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([channel, count]) => ({ label: channel, value: count }));

    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayPosts = filteredPosts.filter(post => {
        const postDate = post.createdAt?.toDate();
        return postDate && postDate.toDateString() === date.toDateString();
      }).length;

      dailyActivity.push({
        label: date.toLocaleDateString('it-IT', { weekday: 'short' }),
        value: dayPosts
      });
    }

    const userGrowth = [
      { label: 'Nuovi questa settimana', value: Math.floor(Math.random() * 10) + 1 },
      { label: 'Attivi oggi', value: Math.floor(activeUsers * 0.3) },
      { label: 'Con livelli avanzati', value: Math.floor(totalUsers * 0.2) }
    ];

    const contentQuality = [
      { label: 'Post con reazioni', value: filteredPosts.filter(p => (p.reactionsCount || 0) > 0).length },
      { label: 'Post con commenti', value: filteredPosts.filter(p => (p.commentsCount || 0) > 0).length },
      { label: 'Post popolari', value: filteredPosts.filter(p => (p.reactionsCount || 0) > 5).length }
    ];

    return {
      totalPosts,
      totalUsers,
      totalReports,
      totalVideoCalls,
      totalComments,
      totalReactions,
      activeUsers,
      engagementRate,
      reportsResolved,
      avgPostsPerUser,
      topChannels,
      dailyActivity,
      userGrowth,
      contentQuality
    };
  }, [posts, members, reports, videoCalls, timeRange]);

  // Moderation stats
  const moderationStats = useMemo(() => ({
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    resolvedReports: reports.filter(r => r.status === 'resolved').length,
    hiddenPosts: hiddenPosts.length,
    bannedUsers: bannedUsers.length,
    totalPosts: posts.length
  }), [reports, hiddenPosts, bannedUsers, posts]);

  const loadData = async () => {
    try {
      // Carica segnalazioni
      const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(reportsData);
        updateFilteredReports(reportsData, reportFilter, reportSearch, reportSortBy);
      });

      // Carica post
      const postsQuery = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'));
      const postsUnsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(postsData);
        const hidden = postsData.filter(post => post.hidden === true);
        setHiddenPosts(hidden);
      });

      // Carica membri
      const membersQuery = query(collection(db, 'users'));
      const membersUnsubscribe = onSnapshot(membersQuery, (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMembers(membersData);
        const banned = membersData.filter(member => member.banned === true);
        setBannedUsers(banned);
      });

      // Carica video calls
      const videoCallsQuery = query(collection(db, 'video_calls'), orderBy('createdAt', 'desc'));
      const videoCallsUnsubscribe = onSnapshot(videoCallsQuery, (snapshot) => {
        const callsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVideoCalls(callsData);
      });

      // Carica canali
      const channelsQuery = query(collection(db, 'community_channels'), orderBy('order', 'asc'));
      const channelsUnsubscribe = onSnapshot(channelsQuery, (snapshot) => {
        const channelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChannels(channelsData);
      });

      setLoading(false);

      return () => {
        reportsUnsubscribe();
        postsUnsubscribe();
        membersUnsubscribe();
        videoCallsUnsubscribe();
        channelsUnsubscribe();
      };
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const isUserSuperAdmin = await isSuperAdmin(user.uid);
      if (!isUserSuperAdmin) {
        navigate('/');
        return;
      }

      setUserProfile({ uid: user.uid });
      loadData();
    };

    checkAccess();
  }, [navigate, loadData]);

  const updateFilteredReports = (reportsData, filter, search, sortBy) => {
    let filtered = reportsData;
    if (filter === 'pending') {
      filtered = reportsData.filter(report => report.status === 'pending');
    } else if (filter === 'resolved') {
      filtered = reportsData.filter(report => report.status === 'resolved');
    }
    if (search) {
      filtered = filtered.filter(report =>
        report.reason?.toLowerCase().includes(search.toLowerCase()) ||
        report.description?.toLowerCase().includes(search.toLowerCase()) ||
        report.reporterName?.toLowerCase().includes(search.toLowerCase()) ||
        report.postContent?.toLowerCase().includes(search.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return b.createdAt?.toDate() - a.createdAt?.toDate();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'reason':
          return a.reason.localeCompare(b.reason);
        default:
          return 0;
      }
    });
    setFilteredReports(filtered);
  };

  useEffect(() => {
    updateFilteredReports(reports, reportFilter, reportSearch, reportSortBy);
  }, [reports, reportFilter, reportSearch, reportSortBy]);

  // Funzioni di moderazione
  const handleResolveReport = async (reportId, action) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved',
        action: action,
        resolvedAt: serverTimestamp(),
        resolvedBy: userProfile.uid
      });

      if (action === 'hide_post') {
        const report = reports.find(r => r.id === reportId);
        if (report && report.postId) {
          await updateDoc(doc(db, 'community_posts', report.postId), {
            hidden: true,
            hiddenAt: serverTimestamp(),
            hiddenBy: userProfile.uid,
            hiddenReason: report.reason
          });
        }
      }

      if (action === 'ban_user') {
        const report = reports.find(r => r.id === reportId);
        if (report && report.reportedUserId) {
          await updateDoc(doc(db, 'users', report.reportedUserId), {
            banned: true,
            bannedAt: serverTimestamp(),
            bannedBy: userProfile.uid,
            banReason: report.reason
          });
        }
      }
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const handleHidePost = async (postId) => {
    try {
      await updateDoc(doc(db, 'community_posts', postId), {
        hidden: true,
        hiddenAt: serverTimestamp(),
        hiddenBy: userProfile.uid
      });
    } catch (error) {
      console.error('Error hiding post:', error);
    }
  };

  const handleShowPost = async (postId) => {
    try {
      await updateDoc(doc(db, 'community_posts', postId), {
        hidden: false,
        shownAt: serverTimestamp(),
        shownBy: userProfile.uid
      });
    } catch (error) {
      console.error('Error showing post:', error);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Sei sicuro di voler bannare questo utente?')) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        banned: true,
        bannedAt: serverTimestamp(),
        bannedBy: userProfile.uid
      });
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        banned: false,
        unbannedAt: serverTimestamp(),
        unbannedBy: userProfile.uid
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Sei sicuro di voler eliminare definitivamente questo post?')) return;
    try {
      await deleteDoc(doc(db, 'community_posts', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Funzioni canali
  const handleAddChannel = async () => {
    if (!newChannel.name.trim()) return;
    try {
      await addDoc(collection(db, 'community_channels'), {
        ...newChannel,
        order: channels.length,
        createdAt: serverTimestamp(),
        createdBy: userProfile.uid,
      });
      setNewChannel({
        name: '',
        description: '',
        color: 'from-blue-500 to-cyan-500',
        iconName: 'Hash',
        enabled: true
      });
      setShowAddChannel(false);
    } catch (error) {
      console.error('Error adding channel:', error);
      alert('Errore nella creazione del canale');
    }
  };

  const handleToggleChannel = async (channelId, enabled) => {
    try {
      await updateDoc(doc(db, 'community_channels', channelId), {
        enabled,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo canale? Tutti i post verranno persi.')) return;
    try {
      await deleteDoc(doc(db, 'community_channels', channelId));
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  // Funzioni membri
  const handleUpdateMemberLevel = async (memberId, newLevel) => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        manualLevel: newLevel,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating member level:', error);
    }
  };

  // Funzioni impostazioni
  const saveSettings = async () => {
    try {
      await updateDoc(doc(db, 'community_settings', 'main'), {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile.uid
      });
      alert('Impostazioni salvate con successo!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Errore nel salvataggio delle impostazioni');
    }
  };

  const updateLevel = async (levelId, updates) => {
    try {
      const updatedLevels = levels.map(level =>
        level.id === levelId ? { ...level, ...updates } : level
      );
      setLevels(updatedLevels);

      // Salva nel database
      await updateDoc(doc(db, 'community_settings', 'levels'), {
        levels: updatedLevels,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile.uid
      });
    } catch (error) {
      console.error('Error updating level:', error);
    }
  };

  const updateReward = async (rewardId, updates) => {
    try {
      const updatedRewards = rewards.map(reward =>
        reward.id === rewardId ? { ...reward, ...updates } : reward
      );
      setRewards(updatedRewards);

      // Salva nel database
      await updateDoc(doc(db, 'community_settings', 'rewards'), {
        rewards: updatedRewards,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile.uid
      });
    } catch (error) {
      console.error('Error updating reward:', error);
    }
  };

  const addLevel = async () => {
    const newLevel = {
      id: Math.max(...levels.map(l => l.id)) + 1,
      name: 'Nuovo Livello',
      minLikes: 0,
      maxLikes: 99,
      color: 'from-gray-500 to-slate-500',
      perks: ['Nuovo perk'],
      enabled: true
    };
    const updatedLevels = [...levels, newLevel];
    setLevels(updatedLevels);

    try {
      await updateDoc(doc(db, 'community_settings', 'levels'), {
        levels: updatedLevels,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile.uid
      });
    } catch (error) {
      console.error('Error adding level:', error);
    }
  };

  const addReward = async () => {
    const newReward = {
      id: `reward_${Date.now()}`,
      name: 'Nuovo Reward',
      description: 'Descrizione del reward',
      type: 'unlock',
      threshold: 10,
      enabled: true
    };
    const updatedRewards = [...rewards, newReward];
    setRewards(updatedRewards);

    try {
      await updateDoc(doc(db, 'community_settings', 'rewards'), {
        rewards: updatedRewards,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile.uid
      });
    } catch (error) {
      console.error('Error adding reward:', error);
    }
  };

  // Funzioni gestione membri avanzata
  const handleBulkAction = async (action) => {
    if (selectedMembers.length === 0) return;

    try {
      const promises = selectedMembers.map(memberId => {
        switch (action) {
          case 'ban':
            return updateDoc(doc(db, 'users', memberId), {
              banned: true,
              bannedAt: serverTimestamp(),
              bannedBy: userProfile.uid
            });
          case 'unban':
            return updateDoc(doc(db, 'users', memberId), {
              banned: false,
              unbannedAt: serverTimestamp(),
              unbannedBy: userProfile.uid
            });
          case 'reset_level':
            return updateDoc(doc(db, 'users', memberId), {
              manualLevel: null,
              updatedAt: serverTimestamp()
            });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      setSelectedMembers([]);
      alert(`${action} applicato a ${selectedMembers.length} membri`);
    } catch (error) {
      console.error('Error bulk action:', error);
      alert('Errore nell\'azione di gruppo');
    }
  };

  const getFilteredMembers = () => {
    let filtered = members;

    // Filter by status
    if (memberFilter === 'active') {
      filtered = members.filter(member => !member.banned);
    } else if (memberFilter === 'banned') {
      filtered = members.filter(member => member.banned);
    } else if (memberFilter === 'premium') {
      filtered = members.filter(member => (member.totalLikes || 0) >= 100);
    }

    // Filter by search
    if (memberSearch) {
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.email?.toLowerCase().includes(memberSearch.toLowerCase())
      );
    }

    return filtered;
  };

  // Funzioni analytics
  const exportAnalyticsData = () => {
    const exportData = {
      periodo: timeRange,
      dataEsportazione: new Date().toISOString(),
      metriche: {
        totalPosts: analytics.totalPosts,
        totalUsers: analytics.totalUsers,
        totalReports: analytics.totalReports,
        totalVideoCalls: analytics.totalVideoCalls,
        totalComments: analytics.totalComments,
        totalReactions: analytics.totalReactions,
        activeUsers: analytics.activeUsers,
        engagementRate: analytics.engagementRate,
        reportsResolved: analytics.reportsResolved,
        avgPostsPerUser: analytics.avgPostsPerUser
      },
      topChannels: analytics.topChannels,
      dailyActivity: analytics.dailyActivity,
      userGrowth: analytics.userGrowth,
      contentQuality: analytics.contentQuality,
      topContributors: members
        .map(user => ({
          ...user,
          postCount: posts.filter(p => p.authorId === user.id).length
        }))
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 10)
        .map(user => ({
          name: user.name || 'Utente',
          email: user.email,
          postCount: user.postCount,
          createdAt: user.createdAt?.toDate().toISOString()
        }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `analytics-community-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Funzioni filtro contenuti e membri
  const getFilteredPosts = () => {
    let filtered = posts;
    if (contentFilter === 'visible') {
      filtered = posts.filter(post => !post.hidden);
    } else if (contentFilter === 'hidden') {
      filtered = posts.filter(post => post.hidden);
    }
    if (contentSearch) {
      filtered = filtered.filter(post =>
        post.content?.toLowerCase().includes(contentSearch.toLowerCase()) ||
        post.authorName?.toLowerCase().includes(contentSearch.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      return b.createdAt?.toDate() - a.createdAt?.toDate();
    });
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Caricamento pannello amministrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
                <p className="text-xs text-slate-400">Strumenti avanzati</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Settings size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-slate-700">
          {!sidebarCollapsed && <h3 className="text-sm font-medium text-slate-300 mb-3">Azioni Rapide</h3>}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('members')}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              title="Gestisci Membri"
            >
              <Users size={16} className="text-blue-400" />
              {!sidebarCollapsed && <span className="text-sm">Membri</span>}
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              title="Moderazione"
            >
              <Shield size={16} className="text-red-400" />
              {!sidebarCollapsed && <span className="text-sm">Moderazione</span>}
            </button>
            <button
              onClick={() => setActiveTab('levels')}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              title="Sistema Livelli"
            >
              <Crown size={16} className="text-yellow-400" />
              {!sidebarCollapsed && <span className="text-sm">Livelli</span>}
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              title="Sistema Rewards"
            >
              <Gift size={16} className="text-purple-400" />
              {!sidebarCollapsed && <span className="text-sm">Rewards</span>}
            </button>
          </div>
        </div>

        {/* Settings Shortcuts */}
        <div className="p-4">
          {!sidebarCollapsed && <h3 className="text-sm font-medium text-slate-300 mb-3">Impostazioni</h3>}
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('settings');
                setActiveSubTab('general');
              }}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              title="Impostazioni Generali"
            >
              <Settings size={16} className="text-slate-400" />
              {!sidebarCollapsed && <span className="text-sm">Generali</span>}
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setActiveSubTab('moderation');
              }}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              title="Moderazione"
            >
              <Shield size={16} className="text-slate-400" />
              {!sidebarCollapsed && <span className="text-sm">Moderazione</span>}
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setActiveSubTab('permissions');
              }}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              title="Permessi"
            >
              <Users size={16} className="text-slate-400" />
              {!sidebarCollapsed && <span className="text-sm">Permessi</span>}
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setActiveSubTab('notifications');
              }}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
              title="Notifiche"
            >
              <Bell size={16} className="text-slate-400" />
              {!sidebarCollapsed && <span className="text-sm">Notifiche</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="text-red-400" size={32} />
                Amministrazione Community
              </h1>
              <p className="text-slate-400">Pannello unificato per gestire tutti gli aspetti della community</p>
            </div>
            <button
              onClick={() => navigate('/community')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
              ← Torna alla Community
            </button>
          </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm overflow-x-auto">
          {tabs.filter(tab => tab.id !== 'settings').map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Post Totali"
                  value={analytics.totalPosts}
                  icon={<MessageSquare />}
                  trend="up"
                  trendValue="+12%"
                  color="blue"
                />
                <StatCard
                  title="Membri Attivi"
                  value={analytics.activeUsers}
                  icon={<Users />}
                  subtitle={`${analytics.engagementRate}% engagement`}
                  color="green"
                />
                <StatCard
                  title="Segnalazioni"
                  value={analytics.totalReports}
                  icon={<Flag />}
                  subtitle={`${analytics.reportsResolved} risolte`}
                  color="red"
                />
                <StatCard
                  title="Video Call"
                  value={analytics.totalVideoCalls}
                  icon={<Video />}
                  trend="up"
                  trendValue="+8%"
                  color="purple"
                />
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Commenti"
                  value={analytics.totalComments}
                  icon={<MessageCircle />}
                  color="yellow"
                />
                <StatCard
                  title="Reazioni"
                  value={analytics.totalReactions}
                  icon={<Heart />}
                  color="red"
                />
                <StatCard
                  title="Post/Utente"
                  value={analytics.avgPostsPerUser}
                  icon={<Target />}
                  subtitle="Media per utente attivo"
                  color="purple"
                />
                <StatCard
                  title="Canali Attivi"
                  value={channels.filter(c => c.enabled).length}
                  icon={<Activity />}
                  color="green"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SimpleChart
                  data={analytics.dailyActivity}
                  title="Attività Giornaliera"
                  color="blue"
                />
                <SimpleChart
                  data={analytics.topChannels}
                  title="Canali Più Attivi"
                  color="green"
                />
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Analytics Dettagliate</h2>
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2">
                    {[
                      { value: '7d', label: '7 giorni' },
                      { value: '30d', label: '30 giorni' },
                      { value: '90d', label: '90 giorni' }
                    ].map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setTimeRange(range.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          timeRange === range.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => exportAnalyticsData()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Esporta Dati
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SimpleChart
                  data={analytics.userGrowth}
                  title="Crescita Utenti"
                  color="purple"
                />
                <SimpleChart
                  data={analytics.contentQuality}
                  title="Qualità Contenuti"
                  color="yellow"
                />
              </div>

              {/* Top Contributors */}
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="text-yellow-400" size={20} />
                  Top Contributori
                </h3>
                <div className="space-y-3">
                  {members
                    .map(user => ({
                      ...user,
                      postCount: posts.filter(p => p.authorId === user.id).length
                    }))
                    .sort((a, b) => b.postCount - a.postCount)
                    .slice(0, 5)
                    .map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-black">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{user.name || 'Utente'}</div>
                          <div className="text-sm text-slate-400">{user.postCount} post</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && (
            <motion.div
              key="moderation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="text-red-400" size={16} />
                    <span className="text-sm text-slate-300">Segnalazioni</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{moderationStats.totalReports}</div>
                  <div className="text-xs text-red-400">{moderationStats.pendingReports} in attesa</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <EyeOff className="text-yellow-400" size={16} />
                    <span className="text-sm text-slate-300">Post Nascosti</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{moderationStats.hiddenPosts}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="text-red-400" size={16} />
                    <span className="text-sm text-slate-300">Utenti Bannati</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{moderationStats.bannedUsers}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="text-blue-400" size={16} />
                    <span className="text-sm text-slate-300">Post Totali</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{moderationStats.totalPosts}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-green-400" size={16} />
                    <span className="text-sm text-slate-300">Membri</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{members.length}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-400" size={16} />
                    <span className="text-sm text-slate-300">Risolte</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{moderationStats.resolvedReports}</div>
                </div>
              </div>

              {/* Reports Section */}
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Segnalazioni</h3>

                {/* Filters */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReportFilter('all')}
                        className={`px-3 py-1 rounded text-sm ${reportFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                      >
                        Tutte ({reports.length})
                      </button>
                      <button
                        onClick={() => setReportFilter('pending')}
                        className={`px-3 py-1 rounded text-sm ${reportFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                      >
                        In Attesa ({moderationStats.pendingReports})
                      </button>
                      <button
                        onClick={() => setReportFilter('resolved')}
                        className={`px-3 py-1 rounded text-sm ${reportFilter === 'resolved' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                      >
                        Risolte ({moderationStats.resolvedReports})
                      </button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Search size={16} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cerca segnalazioni..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <Filter size={16} className="text-slate-400" />
                      <select
                        value={reportSortBy}
                        onChange={(e) => setReportSortBy(e.target.value)}
                        className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="createdAt">Ordina per Data</option>
                        <option value="status">Ordina per Stato</option>
                        <option value="reason">Ordina per Motivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reports List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredReports.slice(0, 10).map((report) => (
                    <div key={report.id} className="bg-slate-700/50 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-4">
                          <div className={`w-3 h-3 rounded-full mt-2 ${
                            report.status === 'pending' ? 'bg-yellow-400' :
                            report.status === 'resolved' ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Flag className="text-red-400" size={16} />
                              <span className="font-medium text-white">{report.reason}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                report.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                                report.status === 'resolved' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                              }`}>
                                {report.status === 'pending' ? 'In Attesa' :
                                 report.status === 'resolved' ? 'Risolta' : 'Sconosciuto'}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm mb-1">{report.description}</p>
                            <div className="text-xs text-slate-400">
                              Segnalato da: {report.reporterName} • {report.createdAt?.toDate().toLocaleString('it-IT')}
                            </div>
                          </div>
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveReport(report.id, 'dismiss')}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                            >
                              Ignora
                            </button>
                            <button
                              onClick={() => handleResolveReport(report.id, 'hide_post')}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm transition-colors"
                            >
                              Nascondi Post
                            </button>
                            <button
                              onClick={() => handleResolveReport(report.id, 'ban_user')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors"
                            >
                              Banna Utente
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredReports.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Flag size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Nessuna segnalazione {reportFilter !== 'all' ? reportFilter : ''}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* All Posts */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Gestione Contenuti</h3>

                  {/* Content Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setContentFilter('all')}
                          className={`px-3 py-1 rounded text-sm ${contentFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          Tutti ({posts.length})
                        </button>
                        <button
                          onClick={() => setContentFilter('visible')}
                          className={`px-3 py-1 rounded text-sm ${contentFilter === 'visible' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          Visibili ({posts.filter(p => !p.hidden).length})
                        </button>
                        <button
                          onClick={() => setContentFilter('hidden')}
                          className={`px-3 py-1 rounded text-sm ${contentFilter === 'hidden' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          Nascosti ({hiddenPosts.length})
                        </button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Search size={16} className="text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cerca contenuti..."
                          value={contentSearch}
                          onChange={(e) => setContentSearch(e.target.value)}
                          className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getFilteredPosts().slice(0, 10).map((post) => (
                      <div key={post.id} className="bg-slate-700/50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{post.authorName}</span>
                          <div className="flex gap-1">
                            {post.hidden ? (
                              <button
                                onClick={() => handleShowPost(post.id)}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Mostra post"
                              >
                                <Eye size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleHidePost(post.id)}
                                className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                                title="Nascondi post"
                              >
                                <EyeOff size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Elimina post"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{post.content}</p>
                        <div className="text-xs text-slate-400 mt-1">
                          {post.createdAt?.toDate().toLocaleString('it-IT')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Members Management */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Gestione Membri</h3>

                  {/* Member Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMemberFilter('all')}
                          className={`px-3 py-1 rounded text-sm ${memberFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          Tutti ({members.length})
                        </button>
                        <button
                          onClick={() => setMemberFilter('active')}
                          className={`px-3 py-1 rounded text-sm ${memberFilter === 'active' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          Attivi ({members.filter(m => !m.banned).length})
                        </button>
                        <button
                          onClick={() => setMemberFilter('banned')}
                          className={`px-3 py-1 rounded text-sm ${memberFilter === 'banned' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          Bannati ({bannedUsers.length})
                        </button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Search size={16} className="text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cerca membri..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getFilteredMembers().slice(0, 10).map((member) => (
                      <div key={member.id} className="bg-slate-700/50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium text-white">{member.name || 'Utente senza nome'}</span>
                            <div className="text-xs text-slate-400">{member.email}</div>
                          </div>
                          <div className="flex gap-1">
                            {member.banned ? (
                              <button
                                onClick={() => handleUnbanUser(member.id)}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Sbanna utente"
                              >
                                <CheckCircle size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(member.id)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                title="Banna utente"
                              >
                                <Ban size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          Registrato: {member.createdAt?.toDate().toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <motion.div
              key="channels"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Gestione Canali</h2>
                <button
                  onClick={() => setShowAddChannel(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus size={18} />
                  Nuovo Canale
                </button>
              </div>

              <div className="grid gap-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${channel.color} flex items-center justify-center`}>
                          <Hash className="text-white" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{channel.name}</h3>
                          <p className="text-sm text-slate-400">{channel.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleChannel(channel.id, !channel.enabled)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            channel.enabled
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-600 text-slate-400'
                          }`}
                        >
                          {channel.enabled ? 'Attivo' : 'Disattivo'}
                        </button>
                        <button
                          onClick={() => handleDeleteChannel(channel.id)}
                          className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Gestione Membri Avanzata</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">
                    {selectedMembers.length} selezionati
                  </span>
                  {selectedMembers.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBulkAction('ban')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                      >
                        Banna Selezionati
                      </button>
                      <button
                        onClick={() => handleBulkAction('unban')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                      >
                        Sbanna Selezionati
                      </button>
                      <button
                        onClick={() => handleBulkAction('resetLevel')}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg"
                      >
                        Reset Livello
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filters and Search */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-64">
                    <input
                      type="text"
                      placeholder="Cerca membri per nome o email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg"
                  >
                    <option value="all">Tutti i membri</option>
                    <option value="active">Attivi</option>
                    <option value="banned">Bannati</option>
                    <option value="new">Nuovi (ultima settimana)</option>
                    <option value="top">Top contributori</option>
                  </select>
                  <select
                    value={memberSortBy}
                    onChange={(e) => setMemberSortBy(e.target.value)}
                    className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg"
                  >
                    <option value="name">Nome</option>
                    <option value="posts">Post</option>
                    <option value="likes">Like ricevuti</option>
                    <option value="level">Livello</option>
                    <option value="joined">Data iscrizione</option>
                  </select>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                {getFilteredMembers().map((member) => {
                  const memberPosts = posts.filter(p => p.authorId === member.id);
                  const memberStats = {
                    posts: memberPosts.length,
                    likes: memberPosts.reduce((sum, p) => sum + (p.reactionsCount || 0), 0),
                    comments: memberPosts.reduce((sum, p) => sum + (p.commentsCount || 0), 0),
                    level: Math.floor((member.totalLikes || 0) / 10) + 1,
                    joinedDate: member.createdAt?.toDate?.() || new Date(),
                    lastActivity: member.lastActivity?.toDate?.() || member.createdAt?.toDate?.() || new Date()
                  };

                  return (
                    <div key={member.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center gap-4">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, member.id]);
                            } else {
                              setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                            }
                          }}
                          className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                        />

                        {/* Avatar */}
                        <img
                          src={member.photoURL || `https://ui-avatars.com/api/?name=${member.name || 'User'}`}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />

                        {/* Member Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{member.name || 'Utente senza nome'}</h3>
                            {member.banned && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">BANNATO</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-2">{member.email}</p>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <span>{memberStats.posts} post</span>
                            <span>{memberStats.likes} like ricevuti</span>
                            <span>{memberStats.comments} commenti</span>
                            <span>Livello {memberStats.level}</span>
                            <span>Iscritto {memberStats.joinedDate.toLocaleDateString('it-IT')}</span>
                            <span>Ultima attività {memberStats.lastActivity.toLocaleDateString('it-IT')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <select
                            value={member.manualLevel || 'auto'}
                            onChange={(e) => handleUpdateMemberLevel(member.id, e.target.value)}
                            className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm"
                          >
                            <option value="auto">Auto</option>
                            <option value="1">Rookie</option>
                            <option value="2">Active</option>
                            <option value="3">Pro</option>
                            <option value="4">Elite</option>
                            <option value="5">Legend</option>
                          </select>

                          {member.banned ? (
                            <button
                              onClick={() => handleUnbanUser(member.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                            >
                              Sbanna
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(member.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                            >
                              Banna
                            </button>
                          )}

                          <button
                            onClick={() => {/* TODO: Open detailed view */}}
                            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg"
                          >
                            Dettagli
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {getFilteredMembers().length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  Nessun membro trovato con i filtri selezionati.
                </div>
              )}
            </motion.div>
          )}

          {/* Levels Tab */}
          {activeTab === 'levels' && (
            <motion.div
              key="levels"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Sistema Livelli Configurabile</h2>
                <button
                  onClick={addLevel}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  Aggiungi Livello
                </button>
              </div>

              <div className="grid gap-4">
                {levels.map((level) => (
                  <div key={level.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                        {level.id}
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Nome Livello</label>
                            <input
                              type="text"
                              value={level.name}
                              onChange={(e) => updateLevel(level.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Soglia Like (min)</label>
                            <input
                              type="number"
                              value={level.threshold}
                              onChange={(e) => updateLevel(level.id, 'threshold', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Colore</label>
                            <select
                              value={level.color}
                              onChange={(e) => updateLevel(level.id, 'color', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="from-gray-400 to-gray-600">Grigio</option>
                              <option value="from-blue-400 to-blue-600">Blu</option>
                              <option value="from-green-400 to-green-600">Verde</option>
                              <option value="from-yellow-400 to-yellow-600">Giallo</option>
                              <option value="from-purple-400 to-purple-600">Viola</option>
                              <option value="from-red-400 to-red-600">Rosso</option>
                              <option value="from-pink-400 to-pink-600">Rosa</option>
                              <option value="from-indigo-400 to-indigo-600">Indaco</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Perks/Benefici</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {level.perks.map((perk, perkIndex) => (
                              <div key={perkIndex} className="flex items-center gap-1 bg-slate-700 rounded-full px-3 py-1">
                                <span className="text-sm text-slate-300">{perk}</span>
                                <button
                                  onClick={() => {
                                    const newPerks = level.perks.filter((_, i) => i !== perkIndex);
                                    updateLevel(level.id, 'perks', newPerks);
                                  }}
                                  className="text-slate-400 hover:text-red-400"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Aggiungi un perk..."
                              className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  const newPerks = [...level.perks, e.target.value.trim()];
                                  updateLevel(level.id, 'perks', newPerks);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                          <div className="text-sm text-slate-400">
                            Membri con questo livello: {members.filter(m => Math.floor((m.totalLikes || 0) / 10) + 1 === level.id).length}
                          </div>
                          {levels.length > 1 && (
                            <button
                              onClick={() => {
                                if (window.confirm('Sei sicuro di voler eliminare questo livello?')) {
                                  setLevels(levels.filter(l => l.id !== level.id));
                                }
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                            >
                              Elimina
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Anteprima Sistema Livelli</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {levels.map((level) => (
                    <div key={level.id} className="text-center">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-white font-bold text-xl mx-auto mb-2`}>
                        {level.id}
                      </div>
                      <h4 className="font-semibold text-white text-sm">{level.name}</h4>
                      <p className="text-xs text-slate-400">{level.threshold}+ like</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Sistema Rewards</h2>
                <button
                  onClick={addReward}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Aggiungi Reward
                </button>
              </div>

              <div className="grid gap-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${reward.color || 'from-purple-400 to-purple-600'} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                        {reward.icon || '🎁'}
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Nome Reward</label>
                            <input
                              type="text"
                              value={reward.name}
                              onChange={(e) => updateReward(reward.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
                            <select
                              value={reward.type}
                              onChange={(e) => updateReward(reward.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="unlock">Sblocco</option>
                              <option value="badge">Badge</option>
                              <option value="service">Servizio</option>
                              <option value="discount">Sconto</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Soglia</label>
                            <input
                              type="number"
                              value={reward.threshold}
                              onChange={(e) => updateReward(reward.id, 'threshold', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Icona</label>
                            <input
                              type="text"
                              value={reward.icon}
                              onChange={(e) => updateReward(reward.id, 'icon', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="🎁"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Descrizione</label>
                          <textarea
                            value={reward.description}
                            onChange={(e) => updateReward(reward.id, 'description', e.target.value)}
                            className="w-full h-20 px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            placeholder="Descrivi cosa ottiene il membro..."
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                          <div className="text-sm text-slate-400">
                            Membri che hanno ottenuto questo reward: {members.filter(m => (m.totalLikes || 0) >= reward.threshold).length}
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm('Sei sicuro di voler eliminare questo reward?')) {
                                setRewards(rewards.filter(r => r.id !== reward.id));
                              }
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {rewards.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  Nessun reward configurato. Aggiungi il primo reward per motivare i membri!
                </div>
              )}

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Rewards Attivi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{reward.icon || '🎁'}</span>
                        <div>
                          <h4 className="font-semibold text-white text-sm">{reward.name}</h4>
                          <p className="text-xs text-slate-400">{reward.type} • {reward.threshold} like</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300">{reward.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-white mb-6">Impostazioni Community</h2>

              {/* Settings Sub-tabs */}
              <div className="flex gap-1 mb-6 bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm">
                {settingsTabs.map((subTab) => (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSubTab === subTab.id
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {/* Settings Content */}
              <AnimatePresence mode="wait">
                {/* General Settings */}
                {activeSubTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Impostazioni Generali</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nome Community
                          </label>
                          <input
                            type="text"
                            value={settings.communityName || ''}
                            onChange={(e) => setSettings({...settings, communityName: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Descrizione
                          </label>
                          <textarea
                            value={settings.communityDescription || ''}
                            onChange={(e) => setSettings({...settings, communityDescription: e.target.value})}
                            className="w-full h-24 px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Community Pubblica</div>
                            <div className="text-sm text-slate-400">Permetti l&apos;accesso senza invito</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.isPublic || false}
                              onChange={(e) => setSettings({...settings, isPublic: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Community Attiva</div>
                            <div className="text-sm text-slate-400">Abilita/disabilita l&apos;accesso alla community</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.communityEnabled !== false}
                              onChange={(e) => setSettings({...settings, communityEnabled: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        {!settings.communityEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Messaggio quando community è disabilitata
                            </label>
                            <textarea
                              value={settings.communityDisabledMessage || ''}
                              onChange={(e) => setSettings({...settings, communityDisabledMessage: e.target.value})}
                              placeholder="Inserisci il messaggio da mostrare quando la community è disabilitata..."
                              className="w-full h-20 px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Onboarding Video</div>
                            <div className="text-sm text-slate-400">Mostra video introduttivo ai nuovi utenti</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.enableOnboardingVideo || false}
                              onChange={(e) => setSettings({...settings, enableOnboardingVideo: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Moderation Settings */}
                {activeSubTab === 'moderation' && (
                  <motion.div
                    key="moderation"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Impostazioni Moderazione</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Auto-moderazione contenuti</div>
                            <div className="text-sm text-slate-400">Rileva automaticamente contenuti inappropriati</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.autoModeration || false}
                              onChange={(e) => setSettings({...settings, autoModeration: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Notifiche segnalazioni</div>
                            <div className="text-sm text-slate-400">Ricevi notifiche per nuove segnalazioni</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.reportNotifications || true}
                              onChange={(e) => setSettings({...settings, reportNotifications: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Soglia segnalazioni per nascondere automaticamente
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={settings.autoHideThreshold || 3}
                            onChange={(e) => setSettings({...settings, autoHideThreshold: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Permissions Settings */}
                {activeSubTab === 'permissions' && (
                  <motion.div
                    key="permissions"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Permessi Ruoli</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Membri possono creare post</div>
                            <div className="text-sm text-slate-400">Permetti ai membri di base di pubblicare contenuti</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.membersCanPost || true}
                              onChange={(e) => setSettings({...settings, membersCanPost: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Coach possono moderare</div>
                            <div className="text-sm text-slate-400">Permetti ai coach di gestire segnalazioni e contenuti</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.coachesCanModerate || false}
                              onChange={(e) => setSettings({...settings, coachesCanModerate: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Solo admin possono creare canali</div>
                            <div className="text-sm text-slate-400">Limita la creazione di canali agli amministratori</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.adminsOnlyChannels || true}
                              onChange={(e) => setSettings({...settings, adminsOnlyChannels: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Settings */}
                {activeSubTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Impostazioni Notifiche</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Notifiche nuovi membri</div>
                            <div className="text-sm text-slate-400">Avvisa quando si uniscono nuovi membri</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.newMemberNotifications || true}
                              onChange={(e) => setSettings({...settings, newMemberNotifications: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Notifiche nuovi post</div>
                            <div className="text-sm text-slate-400">Avvisa per nuovi contenuti pubblicati</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.newPostNotifications || false}
                              onChange={(e) => setSettings({...settings, newPostNotifications: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                          <div>
                            <div className="font-medium text-white">Riassunto settimanale</div>
                            <div className="text-sm text-slate-400">Ricevi un report settimanale dell&apos;attività</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.weeklyDigest || true}
                              onChange={(e) => setSettings({...settings, weeklyDigest: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end">
                <button
                  onClick={saveSettings}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Salva Impostazioni
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Channel Modal */}
        <AnimatePresence>
          {showAddChannel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddChannel(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-100">Nuovo Canale</h2>
                  <button
                    onClick={() => setShowAddChannel(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nome Canale</label>
                    <input
                      value={newChannel.name}
                      onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="#nome-canale"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Descrizione</label>
                    <input
                      value={newChannel.description}
                      onChange={(e) => setNewChannel(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Descrizione del canale"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddChannel(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleAddChannel}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-colors"
                  >
                    Crea Canale
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CommunityAdmin;