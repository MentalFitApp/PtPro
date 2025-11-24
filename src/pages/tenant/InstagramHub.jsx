// src/pages/tenant/InstagramHub.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Instagram, TrendingUp, Users, Heart, Settings,
  BarChart3, MessageCircle, Image, Video, Send, ExternalLink,
  RefreshCw, AlertCircle, CheckCircle, Calendar, Eye
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import OAuthButton from '../../components/integrations/OAuthButton';

export default function InstagramHub() {
  const currentUser = auth.currentUser;
  const userTenantId = localStorage.getItem('tenantId');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [instagramConfig, setInstagramConfig] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [media, setMedia] = useState([]);
  const [insights, setInsights] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadInstagramData();
  }, []);

  const loadInstagramData = async () => {
    if (!userTenantId) return;
    
    setLoading(true);
    try {
      // Controlla se Instagram è collegato
      const configRef = doc(db, `tenants/${userTenantId}/integrations/instagram`);
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const config = configSnap.data();
        setInstagramConfig(config);
        setIsConnected(!!config.accessToken);
        
        if (config.accessToken) {
          await fetchInstagramData();
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('❌ Errore caricamento Instagram:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstagramData = async () => {
    try {
      console.log('🔄 Caricamento dati Instagram per tenant:', userTenantId);
      
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../../firebase');
      const instagramProxy = httpsCallable(functions, 'instagramProxy');

      // 1. Profilo Instagram
      console.log('📞 Chiamata API: profilo Instagram');
      const profileResult = await instagramProxy({
        tenantId: userTenantId,
        endpoint: '/me',
        params: 'fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url'
      });
      const profileData = profileResult.data;
      setProfile(profileData);
      console.log('✅ Profilo Instagram ricevuto:', profileData.username);

      // 2. Media recenti
      console.log('📞 Chiamata API: media Instagram');
      const mediaResult = await instagramProxy({
        tenantId: userTenantId,
        endpoint: '/me/media',
        params: 'fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20'
      });
      const mediaData = mediaResult.data?.data || [];
      setMedia(mediaData);
      console.log('✅ Media Instagram ricevuti:', mediaData.length);

      // 3. Insights
      console.log('📞 Chiamata API: insights Instagram');
      const insightsResult = await instagramProxy({
        tenantId: userTenantId,
        endpoint: '/me/insights',
        params: 'metric=impressions,reach,profile_views,follower_count&period=day'
      });
      const insightsData = insightsResult.data?.data || [];
      setInsights(insightsData);
      console.log('✅ Insights Instagram ricevuti:', insightsData.length);

      // 4. Calcola statistiche
      const totalLikes = mediaData.reduce((sum, m) => sum + (m.like_count || 0), 0);
      const totalComments = mediaData.reduce((sum, m) => sum + (m.comments_count || 0), 0);
      const avgEngagement = mediaData.length > 0 
        ? ((totalLikes + totalComments) / mediaData.length).toFixed(1) 
        : 0;

      // Trova insights specifici
      const impressionsInsight = insightsData.find(i => i.name === 'impressions');
      const reachInsight = insightsData.find(i => i.name === 'reach');
      const profileViewsInsight = insightsData.find(i => i.name === 'profile_views');

      setStats({
        followers: profileData.followers_count || 0,
        following: profileData.follows_count || 0,
        posts: profileData.media_count || 0,
        totalLikes,
        totalComments,
        avgEngagement,
        impressions: impressionsInsight?.values?.[0]?.value || 0,
        reach: reachInsight?.values?.[0]?.value || 0,
        profileViews: profileViewsInsight?.values?.[0]?.value || 0
      });
      console.log('✅ Stats calcolate:', { followers: profileData.followers_count, posts: mediaData.length });

    } catch (error) {
      console.error('❌ Errore chiamata API Instagram:', error);
      console.error('Dettaglio errore:', error.message);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../../firebase');
      const manualSyncInstagram = httpsCallable(functions, 'manualSyncInstagram');
      
      await manualSyncInstagram();
      await fetchInstagramData();
      
      alert('✅ Sincronizzazione completata!');
    } catch (error) {
      console.error('❌ Errore sincronizzazione:', error);
      alert('❌ Errore durante la sincronizzazione');
    } finally {
      setSyncing(false);
    }
  };

  const handleOAuthSuccess = async () => {
    console.log('✅ Instagram collegato con successo!');
    await loadInstagramData();
  };

  const handleOAuthError = (error) => {
    console.error('❌ Errore OAuth Instagram:', error);
    alert('❌ Errore durante la connessione con Instagram');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Setup iniziale se non connesso
  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/30 rounded-2xl shadow-lg p-8 backdrop-blur-md">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Instagram className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Collega Instagram</h1>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Connetti il tuo account Instagram Business per accedere a:
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-slate-700/30 p-4 rounded-xl">
                  <BarChart3 className="text-pink-500 mb-2" size={24} />
                  <h3 className="font-semibold text-white mb-1">Analytics</h3>
                  <p className="text-sm text-slate-400">Follower, reach, impressioni, engagement</p>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-xl">
                  <Image className="text-purple-500 mb-2" size={24} />
                  <h3 className="font-semibold text-white mb-1">Media</h3>
                  <p className="text-sm text-slate-400">Post, stories, reel con statistiche</p>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-xl">
                  <MessageCircle className="text-blue-500 mb-2" size={24} />
                  <h3 className="font-semibold text-white mb-1">Messaggi</h3>
                  <p className="text-sm text-slate-400">Inbox e conversazioni dirette</p>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-xl">
                  <Heart className="text-red-500 mb-2" size={24} />
                  <h3 className="font-semibold text-white mb-1">Engagement</h3>
                  <p className="text-sm text-slate-400">Like, commenti, interazioni</p>
                </div>
              </div>

              <OAuthButton 
                provider="instagram"
                onSuccess={handleOAuthSuccess}
                onError={handleOAuthError}
              />

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-left">
                <p className="text-sm text-slate-300">
                  <strong className="text-blue-400">ℹ️ Nota:</strong> Devi avere un account Instagram Business 
                  collegato a una pagina Facebook per usare questa integrazione.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800/30 rounded-2xl shadow-lg p-6 mb-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Instagram className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Instagram Hub</h1>
                <p className="text-sm text-slate-400">
                  {profile?.username ? `@${profile.username}` : 'Analytics e gestione Instagram'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Sincronizzazione...' : 'Sincronizza Ora'}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings size={20} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-slate-800/30 rounded-2xl shadow-lg mb-6 p-2">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Dashboard', icon: BarChart3 },
              { id: 'media', label: 'Media', icon: Image },
              { id: 'insights', label: 'Insights', icon: TrendingUp },
              { id: 'messages', label: 'Messaggi', icon: MessageCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-700'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && <OverviewTab stats={stats} profile={profile} />}
        {activeTab === 'media' && <MediaTab media={media} />}
        {activeTab === 'insights' && <InsightsTab insights={insights} stats={stats} />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'settings' && <SettingsTab config={instagramConfig} onRefresh={loadInstagramData} />}
      </div>
    </div>
  );
}

// ========== OVERVIEW TAB ==========
function OverviewTab({ stats, profile }) {
  if (!stats) {
    return (
      <div className="text-center py-12 text-slate-400">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>Caricamento statistiche...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Follower"
          value={stats.followers?.toLocaleString() || '0'}
          change={`${stats.following?.toLocaleString() || '0'} following`}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Image}
          label="Post Totali"
          value={stats.posts?.toLocaleString() || '0'}
          change={`${stats.avgEngagement} avg engagement`}
          color="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={Heart}
          label="Like Totali"
          value={stats.totalLikes?.toLocaleString() || '0'}
          change={`${stats.totalComments?.toLocaleString() || '0'} commenti`}
          color="from-red-500 to-pink-500"
        />
        <StatCard
          icon={Eye}
          label="Impressioni (oggi)"
          value={stats.impressions?.toLocaleString() || '0'}
          change={`${stats.reach?.toLocaleString() || '0'} reach`}
          color="from-orange-500 to-yellow-500"
        />
      </div>

      {/* Profile Info */}
      {profile && (
        <div className="bg-slate-800/30 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Instagram size={20} className="text-pink-500" />
            Profilo Instagram
          </h3>
          <div className="flex items-center gap-4">
            {profile.profile_picture_url && (
              <img 
                src={profile.profile_picture_url} 
                alt={profile.username}
                className="w-20 h-20 rounded-full border-2 border-pink-500"
              />
            )}
            <div>
              <h4 className="text-xl font-bold text-white">@{profile.username}</h4>
              <p className="text-slate-400 text-sm">{profile.account_type} Account</p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm text-slate-300">
                  <strong>{stats.posts}</strong> post
                </span>
                <span className="text-sm text-slate-300">
                  <strong>{stats.followers}</strong> follower
                </span>
                <span className="text-sm text-slate-300">
                  <strong>{stats.following}</strong> seguiti
                </span>
              </div>
            </div>
            <a
              href={`https://www.instagram.com/${profile.username}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <ExternalLink size={16} />
              Apri su Instagram
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== MEDIA TAB ==========
function MediaTab({ media }) {
  if (!media || media.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Image size={48} className="mx-auto mb-4 opacity-50" />
        <p>Nessun media trovato</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {media.map(item => (
        <div key={item.id} className="bg-slate-800/30 rounded-2xl shadow-lg overflow-hidden group">
          <div className="relative">
            <img 
              src={item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url}
              alt={item.caption?.substring(0, 50) || 'Post'}
              className="w-full h-64 object-cover"
            />
            {item.media_type === 'VIDEO' && (
              <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-lg flex items-center gap-1">
                <Video size={16} className="text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center p-4">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <span className="flex items-center gap-1">
                    <Heart size={18} />
                    {item.like_count?.toLocaleString() || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={18} />
                    {item.comments_count?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-300 line-clamp-2 mb-2">
              {item.caption || 'Nessuna didascalia'}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{new Date(item.timestamp).toLocaleDateString('it-IT')}</span>
              <a
                href={item.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:text-pink-400 flex items-center gap-1"
              >
                Vedi su Instagram <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ========== INSIGHTS TAB ==========
function InsightsTab({ insights, stats }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
        <p>Nessun insight disponibile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 rounded-2xl shadow-lg p-6">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Impressioni</h3>
          <p className="text-3xl font-bold text-white">{stats?.impressions?.toLocaleString() || '0'}</p>
          <p className="text-xs text-slate-500 mt-2">Ultime 24 ore</p>
        </div>
        <div className="bg-slate-800/30 rounded-2xl shadow-lg p-6">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Reach</h3>
          <p className="text-3xl font-bold text-white">{stats?.reach?.toLocaleString() || '0'}</p>
          <p className="text-xs text-slate-500 mt-2">Utenti unici raggiunti</p>
        </div>
        <div className="bg-slate-800/30 rounded-2xl shadow-lg p-6">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Visite al Profilo</h3>
          <p className="text-3xl font-bold text-white">{stats?.profileViews?.toLocaleString() || '0'}</p>
          <p className="text-xs text-slate-500 mt-2">Ultime 24 ore</p>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Dettaglio Insights</h3>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
              <div>
                <p className="font-medium text-white capitalize">{insight.title || insight.name}</p>
                <p className="text-sm text-slate-400">{insight.description || insight.period}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {insight.values?.[0]?.value?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MESSAGES TAB ==========
function MessagesTab() {
  return (
    <div className="bg-slate-800/30 rounded-2xl shadow-lg p-12 text-center">
      <MessageCircle size={64} className="mx-auto mb-4 text-slate-600" />
      <h3 className="text-xl font-semibold text-white mb-2">Messaggi Instagram</h3>
      <p className="text-slate-400 mb-6">
        La gestione dei messaggi Instagram verrà implementata nelle prossime versioni.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
        <Calendar size={16} />
        Coming Soon
      </div>
    </div>
  );
}

// ========== SETTINGS TAB ==========
function SettingsTab({ config, onRefresh }) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Sei sicuro di voler disconnettere Instagram?')) return;
    
    setDisconnecting(true);
    try {
      const userTenantId = localStorage.getItem('tenantId');
      const configRef = doc(db, `tenants/${userTenantId}/integrations/instagram`);
      await updateDoc(configRef, {
        accessToken: null,
        refreshToken: null,
        enabled: false,
        disconnectedAt: new Date()
      });
      
      alert('✅ Instagram disconnesso con successo');
      window.location.reload();
    } catch (error) {
      console.error('❌ Errore disconnessione:', error);
      alert('❌ Errore durante la disconnessione');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/30 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Connessione Instagram</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="font-medium text-white">Instagram Connesso</p>
                <p className="text-sm text-slate-400">
                  Connesso il {config?.connectedAt ? new Date(config.connectedAt.seconds * 1000).toLocaleDateString('it-IT') : 'N/D'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
            >
              {disconnecting ? 'Disconnessione...' : 'Disconnetti'}
            </button>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
              <RefreshCw size={18} className="text-blue-400" />
              Sincronizzazione Automatica
            </h4>
            <p className="text-sm text-slate-400">
              I dati vengono sincronizzati automaticamente ogni 15 minuti. 
              Puoi anche forzare la sincronizzazione manualmente usando il pulsante "Sincronizza Ora" in alto.
            </p>
          </div>

          <div className="p-4 bg-slate-700/30 rounded-xl">
            <h4 className="font-medium text-white mb-3">Dati Sincronizzati</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Profilo e statistiche account
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Post, foto e video
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Like, commenti e engagement
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Impressioni, reach e insights
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== STAT CARD COMPONENT ==========
function StatCard({ icon: Icon, label, value, change, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <p className="text-xs text-slate-500">{change}</p>
    </motion.div>
  );
}
