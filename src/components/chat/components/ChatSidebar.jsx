import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { MessageSquare, Search, Plus, Archive } from 'lucide-react';
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
      <div className="flex-shrink-0 p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-cyan-400" size={24} />
            Messaggi
            {totalUnread > 0 && (
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <button
              onClick={onGlobalSearch}
              className="p-2.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors"
              title="Cerca in tutte le chat"
            >
              <Search size={20} />
            </button>
            <button
              onClick={onNewChat}
              className="p-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-colors shadow-lg shadow-cyan-500/30"
              title="Nuova chat"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cerca conversazione..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                       text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-sm"
          />
        </div>

        {/* Toggle Archiviate */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowArchivedChats(false)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
              !showArchivedChats 
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                : "text-slate-400 hover:bg-white/10"
            )}
          >
            Attive
          </button>
          <button
            onClick={() => setShowArchivedChats(true)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
              showArchivedChats 
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                : "text-slate-400 hover:bg-white/10"
            )}
          >
            <Archive size={14} />
            Archiviate
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
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
