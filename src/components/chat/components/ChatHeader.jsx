import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { 
  ArrowLeft, Phone, Video, Search, Pin, Star, Volume2, VolumeX, X 
} from 'lucide-react';
import { formatMessageTime } from '../../../hooks/useChat';
import { RoleIcon, formatRole } from '../utils/chatHelpers';

const cn = (...classes) => clsx(...classes);

const ChatHeader = ({ 
  chat, 
  currentUserId, 
  onBack, 
  onVideoCall, 
  onVoiceCall,
  onSearch,
  onSettings,
  isSearchOpen,
  searchTerm,
  onSearchChange,
  onCloseSearch,
  searchResults,
  soundEnabled,
  onToggleSound,
  onStarred
}) => {
  const otherParticipant = chat?.participants?.find(p => p !== currentUserId);
  const otherName = chat?.participantNames?.[otherParticipant] || 'Utente';
  const otherPhoto = chat?.participantPhotos?.[otherParticipant];
  const otherRole = chat?.participantRoles?.[otherParticipant] || 'client';
  const isOnline = chat?.onlineStatus?.[otherParticipant];
  const lastSeen = chat?.lastSeen?.[otherParticipant];

  // Role-based ring color
  const getRingColor = (role) => {
    switch(role) {
      case 'admin': return 'ring-amber-400 shadow-amber-400/30';
      case 'coach': return 'ring-blue-400 shadow-blue-400/30';
      default: return 'ring-slate-400/50';
    }
  };

  return (
    <div className="flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3">
        {/* Left: Back + User Info */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-2.5 -ml-1 hover:bg-white/10 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft size={22} className="text-slate-300" />
          </button>

          <div className="relative flex-shrink-0">
            {otherPhoto ? (
              <img 
                src={otherPhoto} 
                alt={otherName} 
                className={cn(
                  "w-10 h-10 md:w-11 md:h-11 rounded-full object-cover ring-2 shadow-lg",
                  getRingColor(otherRole)
                )} 
              />
            ) : (
              <div className={cn(
                "w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white font-bold ring-2 shadow-lg",
                otherRole === 'admin' && "bg-gradient-to-br from-amber-500 to-orange-500",
                otherRole === 'coach' && "bg-gradient-to-br from-blue-500 to-cyan-500",
                (!otherRole || otherRole === 'client') && "bg-gradient-to-br from-slate-500 to-slate-600",
                getRingColor(otherRole)
              )}>
                {otherName.charAt(0).toUpperCase()}
              </div>
            )}
            {isOnline && (
              <motion.div 
                className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-white truncate text-sm md:text-base">{otherName}</h2>
            <div className="flex items-center gap-1.5">
              <RoleIcon role={otherRole} size={12} />
              <span className="text-[11px] md:text-xs text-slate-400">{formatRole(otherRole)}</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className={cn("text-[11px] md:text-xs hidden sm:inline", isOnline ? "text-emerald-400" : "text-slate-500")}>
                {isOnline ? 'Online' : lastSeen ? `${formatMessageTime(lastSeen)}` : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions - Touch-friendly 44px hit targets */}
        <div className="flex items-center -mr-1">
          <button
            onClick={onToggleSound}
            className={cn(
              "p-2.5 rounded-full transition-colors active:scale-95",
              soundEnabled ? "hover:bg-white/10 text-slate-400" : "bg-red-500/20 text-red-400"
            )}
            title={soundEnabled ? "Suono attivo" : "Suono disattivato"}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            onClick={onSearch}
            className={cn(
              "p-2.5 rounded-full transition-colors active:scale-95",
              isSearchOpen ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-white/10 text-slate-400"
            )}
          >
            <Search size={20} />
          </button>
          <button
            onClick={onVoiceCall}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={onVideoCall}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
          >
            <Video size={20} />
          </button>
          <button
            onClick={onStarred}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
            title="Messaggi preferiti"
          >
            <Star size={20} />
          </button>
          <button
            onClick={onSettings}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
            title="Messaggi pinnati"
          >
            <Pin size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Cerca nei messaggi..."
                  className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl 
                             text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-sm"
                  autoFocus
                />
                <button
                  onClick={onCloseSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-600 rounded"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              {searchResults.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {searchResults.length} risultat{searchResults.length === 1 ? 'o' : 'i'} trovati
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatHeader;
