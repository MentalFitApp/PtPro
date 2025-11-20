import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Trophy, MessageSquare, Award, Crown, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Community Members List (Skool-style)
 * Mostra tutti gli utenti della community con livelli, badge e statistiche
 */

const LEVELS = [
  { id: 1, name: 'Start', minLikes: 0, maxLikes: 1, color: 'slate', borderColor: 'border-slate-500' },
  { id: 2, name: 'Intermedio', minLikes: 2, maxLikes: 15, color: 'blue', borderColor: 'border-blue-500' },
  { id: 3, name: 'Pro', minLikes: 16, maxLikes: 49, color: 'purple', borderColor: 'border-purple-500' },
  { id: 4, name: 'Elite', minLikes: 50, maxLikes: 99, color: 'orange', borderColor: 'border-orange-500' },
  { id: 5, name: 'MentalFit', minLikes: 100, maxLikes: 999999, color: 'rose', borderColor: 'border-rose-500' },
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

export default function CommunityMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [stats, setStats] = useState({
    totalMembers: 0,
    averageLevel: 0,
    topContributors: 0,
  });

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterAndSortMembers();
  }, [members, searchQuery, filterLevel]);

  const loadMembers = async () => {
    try {
      // Carica tutti gli utenti (clients + admins + coaches)
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Carica statistiche post per ogni utente
      const postsQuery = query(collection(db, 'community_posts'));
      const postsSnapshot = await getDocs(postsQuery);
      
      const postsByUser = {};
      postsSnapshot.docs.forEach(doc => {
        const post = doc.data();
        if (!postsByUser[post.authorId]) {
          postsByUser[post.authorId] = { posts: 0, totalLikes: 0 };
        }
        postsByUser[post.authorId].posts += 1;
        postsByUser[post.authorId].totalLikes += (post.likesCount || 0);
      });

      const membersData = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        const userStats = postsByUser[doc.id] || { posts: 0, totalLikes: 0 };
        const totalLikes = userData.totalLikes || 0;
        
        return {
          id: doc.id,
          name: userData.name || userData.displayName || 'Utente',
          photoURL: userData.photoURL || '',
          totalLikes,
          level: getUserLevel(totalLikes),
          postsCount: userStats.posts,
          joinedAt: userData.createdAt?.toDate?.() || new Date(),
        };
      });

      // Ordina per livello e likes
      membersData.sort((a, b) => {
        if (a.level.id !== b.level.id) return b.level.id - a.level.id;
        return b.totalLikes - a.totalLikes;
      });

      setMembers(membersData);
      
      // Calcola statistiche
      const avgLevel = membersData.reduce((sum, m) => sum + m.level.id, 0) / membersData.length || 0;
      const topContribs = membersData.filter(m => m.level.id >= 3).length;
      
      setStats({
        totalMembers: membersData.length,
        averageLevel: avgLevel.toFixed(1),
        topContributors: topContribs,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading members:', error);
      setLoading(false);
    }
  };

  const filterAndSortMembers = () => {
    let filtered = [...members];

    // Filtro per ricerca
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro per livello
    if (filterLevel !== 'all') {
      const levelId = parseInt(filterLevel);
      filtered = filtered.filter(member => member.level.id === levelId);
    }

    setFilteredMembers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/community')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Membri Community</h1>
              <p className="text-slate-400 mt-1">Scopri gli altri membri e i loro livelli</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-600/20 rounded-lg">
                  <Award size={24} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{stats.totalMembers}</p>
                  <p className="text-sm text-slate-400">Membri Totali</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Trophy size={24} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{stats.averageLevel}</p>
                  <p className="text-sm text-slate-400">Livello Medio</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-600/20 rounded-lg">
                  <MessageSquare size={24} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{stats.topContributors}</p>
                  <p className="text-sm text-slate-400">Top Contributors</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cerca membro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">Tutti i Livelli</option>
            {LEVELS.map(level => (
              <option key={level.id} value={level.id}>
                Livello {level.id} - {level.name}
              </option>
            ))}
          </select>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-rose-500/50 transition-all cursor-pointer"
              onClick={() => {/* TODO: Navigate to member profile */}}
            >
              <div className="flex items-start gap-4">
                {/* Avatar with Level Badge */}
                <div className="relative flex-shrink-0">
                  {member.photoURL ? (
                    <img
                      src={member.photoURL}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-2xl text-slate-400">{member.name[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2">
                    <LevelBadge totalLikes={member.totalLikes} size="sm" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-100 truncate">{member.name}</h3>
                  <p className="text-sm text-slate-400 mb-2">
                    Livello {member.level.id} - {member.level.name}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      <span>{member.postsCount} post</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy size={12} />
                      <span>{member.totalLikes} likes</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Award size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nessun membro trovato</p>
          </div>
        )}
      </div>
    </div>
  );
}
