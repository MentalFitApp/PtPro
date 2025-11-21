// src/pages/community/Community.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Send, Heart, MessageCircle, Trophy, Sparkles, Lock, Pin,
  Search, Bell, Settings, Crown, Zap, Target, Shield, Star,
  Users, Volume2, Calendar, ChevronDown, MoreHorizontal,
  TrendingUp, Award, Flame, Gem, Hash, Smile, Image,
  Reply, Share, Bookmark, Eye, ThumbsUp, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { db, auth } from '../../firebase';
import {
  collection, query, where, orderBy, limit, getDocs,
  addDoc, serverTimestamp, doc, onSnapshot, updateDoc,
  arrayUnion, arrayRemove, increment, writeBatch
} from 'firebase/firestore';
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
  const navigate = useNavigate();

  // Carica utente + livello
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      const data = doc.data() || {};
      setUserData({ ...data, uid: auth.currentUser.uid, photoURL: auth.currentUser.photoURL });
    });
    return unsub;
  }, []);

  // Carica post
  useEffect(() => {
    const q = query(
      collection(db, "community_posts"),
      where("channel", "==", selectedChannel),
      orderBy("pinned", "desc"),
      orderBy("pinnedAt", "desc"),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [selectedChannel]);

  const currentLevel = LEVELS.find(l => userData?.totalLikes >= l.min) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel ? ((userData?.totalLikes || 0) - currentLevel.min) / (nextLevel.min - currentLevel.min) * 100 : 100;

  const sendPost = async () => {
    if (!newPost.trim()) return;
    await addDoc(collection(db, "community_posts"), {
      content: newPost,
      author: {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
        level: LEVELS.indexOf(currentLevel)
      },
      channel: selectedChannel,
      likes: 0,
      likedBy: [],
      replies: [],
      pinned: false,
      timestamp: serverTimestamp()
    });
    setNewPost("");
  };

  const likePost = async (postId, liked) => {
    const postRef = doc(db, "community_posts", postId);
    const userRef = doc(db, "users", auth.currentUser.uid);
    const authorRef = doc(db, "users", posts.find(p => p.id === postId).author.uid);

    const batch = writeBatch(db);
    batch.update(postRef, {
      likes: increment(liked ? -1 : 1),
      likedBy: liked ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid)
    });
    batch.update(authorRef, { "stats.likesReceived": increment(liked ? -1 : 1) });
    await batch.commit();
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
        <div className="absolute top-0 w-20 h-20 border-4 border-transparent border-t-rose-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 bg-gradient-to-br from-rose-500 to-cyan-500 rounded-full opacity-20 animate-pulse"></div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-slate-200 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative flex h-screen">
        {/* Enhanced Sidebar */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-80 bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 flex flex-col shadow-2xl"
        >
          <div className="p-8 border-b border-white/5">
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2"
            >
              FitFlow Community
            </motion.h1>
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 text-sm"
            >
              Condividi il tuo viaggio fitness
            </motion.p>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/20`}>
                    <currentLevel.icon size={32} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Crown size={14} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xl text-white">{currentLevel.name}</p>
                  <p className="text-sm text-cyan-400 flex items-center gap-1">
                    <Heart size={14} />
                    {userData.totalLikes || 0} likes ricevuti
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

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Canali</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Online
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
                  onClick={() => !locked && setSelectedChannel(ch.id)}
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

        {/* Enhanced Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Dynamic Header */}
          <motion.div
            style={{ opacity: headerOpacity }}
            className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-8 py-6 sticky top-0 z-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  key={selectedChannel}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3 bg-gradient-to-br from-rose-500/20 to-cyan-500/20 rounded-2xl border border-white/10"
                >
                  {React.createElement(channels.find(c => c.id === selectedChannel)?.icon || Sparkles, { size: 28, className: "text-cyan-400" })}
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    #{channels.find(c => c.id === selectedChannel)?.name}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {posts.length} post{posts.length !== 1 ? 'i' : ''} • {channels.find(c => c.id === selectedChannel)?.readOnly ? 'Canale di sola lettura' : 'Partecipa alla conversazione'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl border border-white/10 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <Search size={20} className="text-slate-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl border border-white/10 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <Bell size={20} className="text-slate-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(true)}
                  className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl border border-white/10 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <Settings size={20} className="text-slate-400" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Posts Feed */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8 space-y-8">
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
                      className="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/5"
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

                      <div className="flex gap-6">
                        {/* Enhanced Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/20`}>
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
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-800">
                            {React.createElement(LEVELS[post.author?.level || 0]?.icon || Shield, { size: 16, className: "text-cyan-400" })}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Author Info */}
                          <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <span className="font-bold text-lg text-white hover:text-cyan-400 transition-colors cursor-pointer">
                              {post.author?.name}
                            </span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                              <Award size={14} className="text-cyan-400" />
                              <span className="text-sm text-cyan-400 font-medium">
                                {LEVELS[post.author?.level || 0]?.name}
                              </span>
                            </div>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                              {post.timestamp?.toDate && formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true, locale: it })}
                            </span>
                          </div>

                          {/* Post Content */}
                          <div className="mb-6">
                            <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
                              {post.content}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-8">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => likePost(post.id, post.likedBy?.includes(auth.currentUser.uid))}
                              className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-200 ${
                                post.likedBy?.includes(auth.currentUser.uid)
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'hover:bg-white/5 text-slate-400 hover:text-rose-400'
                              }`}
                            >
                              <Heart
                                size={20}
                                fill={post.likedBy?.includes(auth.currentUser.uid) ? "currentColor" : "none"}
                                className={post.likedBy?.includes(auth.currentUser.uid) ? 'animate-pulse' : ''}
                              />
                              <span className="font-medium">{post.likes || 0}</span>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-cyan-400 transition-all duration-200"
                            >
                              <MessageSquare size={20} />
                              <span className="font-medium">{post.replies?.length || 0}</span>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-purple-400 transition-all duration-200"
                            >
                              <Share size={20} />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-blue-400 transition-all duration-200 ml-auto"
                            >
                              <MoreHorizontal size={20} />
                            </motion.button>
                          </div>
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
              className="border-t border-white/5 bg-slate-950/90 backdrop-blur-xl p-8"
            >
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
                  <div className="flex gap-4">
                    {/* User Avatar in Input */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/20">
                        {userData.photoURL ? (
                          <img
                            src={userData.photoURL}
                            alt="Tu"
                            className="w-full h-full rounded-2xl object-cover"
                          />
                        ) : (
                          userData.displayName?.[0]?.toUpperCase() || 'T'
                        )}
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="flex-1">
                      <textarea
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendPost())}
                        placeholder={`Condividi qualcosa di speciale in #${channels.find(c => c.id === selectedChannel)?.name}...`}
                        className="w-full bg-transparent border-0 resize-none text-lg text-white placeholder-slate-400 focus:outline-none min-h-[60px] max-h-32"
                        rows={2}
                      />

                      {/* Input Actions */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-cyan-400 transition-all"
                          >
                            <Image size={20} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-yellow-400 transition-all"
                          >
                            <Smile size={20} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-purple-400 transition-all"
                          >
                            <Hash size={20} />
                          </motion.button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">
                            {newPost.length}/3000
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={sendPost}
                            disabled={!newPost.trim() || newPost.length > 3000}
                            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                              newPost.trim() && newPost.length <= 3000
                                ? 'bg-gradient-to-r from-rose-500 to-cyan-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Send size={18} />
                            Pubblica
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </div>

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
  );
}