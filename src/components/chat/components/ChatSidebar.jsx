import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { MessageSquare, Search, Plus, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import ChatListItem from './ChatListItem';

const cn = (...classes) => clsx(...classes);

const ChatSidebar = ({ 
  chats, 
  loading, 
  activeChat, 
  onSelectChat, 
  onNewChat,
  onGlobalSearch,
  searchTerm,
  onSearchChange,
  currentUserId,
  onArchiveChat,
  onPinChat,
  onDeleteChat,
  onMarkReadChat,
  showArchived
}) => {
  const [showArchivedChats, setShowArchivedChats] = useState(showArchived || false);
  
  const filteredChats = useMemo(() => {
    let result = chats || [];
    
    // Filtra per archiviate/non archiviate
    result = result.filter(chat => {
      const isArchived = chat.archivedBy?.includes(currentUserId);
      return showArchivedChats ? isArchived : !isArchived;
    });
    
    // Ordina: prima le fissate, poi per data ultimo messaggio
    result = [...result].sort((a, b) => {
      const aPinned = a.pinnedBy?.includes(currentUserId);
      const bPinned = b.pinnedBy?.includes(currentUserId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      const aTime = a.lastMessageAt?.toMillis?.() || a.lastMessageAt || 0;
      const bTime = b.lastMessageAt?.toMillis?.() || b.lastMessageAt || 0;
      return bTime - aTime;
    });
    
    // Filtra per ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(chat => {
        const otherParticipant = chat.participants?.find(p => p !== currentUserId);
        const otherName = chat.participantNames?.[otherParticipant] || '';
        return otherName.toLowerCase().includes(term);
      });
    }
    
    return result;
  }, [chats, searchTerm, currentUserId, showArchivedChats]);

  // Calcola totale messaggi non letti
  const totalUnread = useMemo(() => {
    return (chats || []).reduce((total, chat) => {
      return total + (chat.unreadCount?.[currentUserId] || 0);
    }, 0);
  }, [chats, currentUserId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-white/10 bg-slate-900/95 backdrop-blur-2xl shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="text-cyan-400" size={28} />
            Messaggi
            {totalUnread > 0 && (
              <motion.span 
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-pink-500/40"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </motion.span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <motion.button
              onClick={onGlobalSearch}
              className="p-3 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors"
              title="Cerca in tutte le chat"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search size={22} />
            </motion.button>
            <motion.button
              onClick={onNewChat}
              className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-colors shadow-xl shadow-cyan-500/40"
              title="Nuova chat"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={22} />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cerca conversazione..."
            className="w-full pl-12 pr-5 py-3.5 bg-slate-800/60 border border-white/10 rounded-2xl 
                       text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-xl shadow-lg transition-all"
          />
        </div>

        {/* Toggle Archiviate */}
        <div className="flex items-center gap-2 mt-4">
          <motion.button
            onClick={() => setShowArchivedChats(false)}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
              !showArchivedChats 
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/20" 
                : "text-slate-400 hover:bg-white/10"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Attive
          </motion.button>
          <motion.button
            onClick={() => setShowArchivedChats(true)}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
              showArchivedChats 
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/20" 
                : "text-slate-400 hover:bg-white/10"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Archive size={16} />
            Archiviate
          </motion.button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p>Caricamento chat...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            {showArchivedChats ? (
              <>
                <Archive size={48} className="mb-3 opacity-50" />
                <p className="font-medium">Nessuna chat archiviata</p>
                <p className="text-sm mt-1">Le chat archiviate appariranno qui</p>
              </>
            ) : (
              <>
                <MessageSquare size={48} className="mb-3 opacity-50" />
                <p className="font-medium">Nessuna conversazione</p>
                <p className="text-sm mt-1">Inizia una nuova chat!</p>
              </>
            )}
          </div>
        ) : (
          filteredChats.map(chat => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={activeChat?.id === chat.id}
              onClick={() => onSelectChat(chat)}
              currentUserId={currentUserId}
              onArchive={onArchiveChat}
              onPin={onPinChat}
              onDelete={onDeleteChat}
              onMarkRead={onMarkReadChat}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
