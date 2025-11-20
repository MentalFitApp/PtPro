import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc, serverTimestamp, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Trophy, MessageSquare, Lightbulb, Plus, Heart, MessageCircle, Award, Crown, Send, Image, Video, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Sistema Community con Gamificazione
 * Canali: Vittorie, Domande, Consigli
 * Livelli: Start (0-1), Intermedio (2-15), Pro (16-49), Elite (50-99), MentalFit (100+)
 */

const CHANNELS = {
  vittorie: { name: 'Vittorie', icon: Trophy, color: 'rose', description: 'Condividi i tuoi risultati' },
  domande: { name: 'Domande', icon: MessageSquare, color: 'cyan', description: 'Fai domande alla community' },
  consigli: { name: 'Consigli', icon: Lightbulb, color: 'amber', description: 'Condividi esperienze utili' },
};

const LEVELS = [
  { id: 1, name: 'Start', minLikes: 0, maxLikes: 1, color: 'slate', borderColor: 'border-slate-500', unlocks: [] },
  { id: 2, name: 'Intermedio', minLikes: 2, maxLikes: 15, color: 'blue', borderColor: 'border-blue-500', unlocks: ['Group Calls settimanali'] },
  { id: 3, name: 'Pro', minLikes: 16, maxLikes: 49, color: 'purple', borderColor: 'border-purple-500', unlocks: ['Sistema di Massimo Riposo'] },
  { id: 4, name: 'Elite', minLikes: 50, maxLikes: 99, color: 'orange', borderColor: 'border-orange-500', unlocks: ['Protocollo Anti-Stress'] },
  { id: 5, name: 'MentalFit', minLikes: 100, maxLikes: 999999, color: 'rose', borderColor: 'border-rose-500', unlocks: ['+1 mese in regalo', 'Bonus segreto'] },
];

const getUserLevel = (totalLikes) => {
  return LEVELS.find(level => totalLikes >= level.minLikes && totalLikes <= level.maxLikes) || LEVELS[0];
};

const LevelBadge = ({ totalLikes, size = 'md' }) => {
  const level = getUserLevel(totalLikes);
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center rounded-full bg-slate-800 border-2 ${level.borderColor} font-bold text-${level.color}-400`}>
      <span>{level.id}</span>
      {level.id === 5 && <Crown className="absolute -top-1 -right-1 w-4 h-4 text-rose-400" />}
    </div>
  );
};

export default function Community() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeChannel, setActiveChannel] = useState('vittorie');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostChannel, setNewPostChannel] = useState('vittorie');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Carica profilo utente con totalLikes
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile({ id: user.uid, ...userDoc.data() });
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

    const postsQuery = query(
      collection(db, 'community_posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribePosts();
  }, [currentUser]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      await addDoc(collection(db, 'community_posts'), {
        content: newPostContent,
        channel: newPostChannel,
        authorId: currentUser.uid,
        authorName: userProfile?.name || currentUser.displayName || 'Utente',
        authorPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
        authorLevel: getUserLevel(userProfile?.totalLikes || 0).id,
        likes: [],
        likesCount: 0,
        comments: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      setNewPostContent('');
      setShowNewPost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

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

  const filteredPosts = posts.filter(post => post.channel === activeChannel);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
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
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-200">{userProfile.name}</p>
                  <p className="text-xs text-slate-400">
                    Livello {getUserLevel(userProfile.totalLikes || 0).name} • {userProfile.totalLikes || 0} likes
                  </p>
                </div>
                <LevelBadge totalLikes={userProfile.totalLikes || 0} size="md" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Channel Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {Object.entries(CHANNELS).map(([key, channel]) => {
            const Icon = channel.icon;
            const isActive = activeChannel === key;
            return (
              <button
                key={key}
                onClick={() => setActiveChannel(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? `bg-${channel.color}-600 text-white shadow-lg`
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
        <button
          onClick={() => setShowNewPost(true)}
          className="w-full mb-6 p-4 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-rose-500 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-rose-400"
        >
          <Plus size={20} />
          <span className="font-medium">Crea un nuovo post</span>
        </button>

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
                  <div className="flex gap-2">
                    {Object.entries(CHANNELS).map(([key, channel]) => {
                      const Icon = channel.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setNewPostChannel(key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            newPostChannel === key
                              ? `bg-${channel.color}-600 text-white`
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

                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Condividi qualcosa con la community..."
                  className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />

                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Aggiungi immagine">
                      <Image size={20} className="text-slate-400" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Aggiungi video">
                      <Video size={20} className="text-slate-400" />
                    </button>
                  </div>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <Send size={18} />
                    Pubblica
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts Feed */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <Trophy size={64} className="mx-auto mb-4 text-slate-600 opacity-50" />
              <p className="text-slate-400 text-lg">Nessun post in questo canale</p>
              <p className="text-slate-500 text-sm mt-2">Sii il primo a condividere qualcosa!</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const authorLevel = getUserLevel(post.authorLevel || 0);
              const hasLiked = post.likes?.includes(currentUser?.uid);

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  {/* Post Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      {post.authorPhotoURL ? (
                        <img
                          src={post.authorPhotoURL}
                          alt={post.authorName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">
                          {post.authorName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <LevelBadge totalLikes={post.authorTotalLikes || 0} size="sm" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-100">{post.authorName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-${authorLevel.color}-900/40 text-${authorLevel.color}-400 border border-${authorLevel.color}-600/50`}>
                          Livello {authorLevel.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {post.createdAt?.toDate?.().toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) || 'Ora'}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-slate-300 mb-4 whitespace-pre-wrap">{post.content}</p>

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                    <button
                      onClick={() => handleLikePost(post.id, post.likes || [])}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                        hasLiked
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                      <span className="text-sm font-medium">{post.likesCount || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-all">
                      <MessageCircle size={18} />
                      <span className="text-sm font-medium">{post.commentsCount || 0}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
