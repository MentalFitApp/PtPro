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

  // Role-based ring color - WhatsApp style
  const getRingColor = (role) => {
    switch(role) {
      case 'admin': return 'ring-amber-500 shadow-xl shadow-amber-500/40';
      case 'coach': return 'ring-blue-500 shadow-xl shadow-blue-500/40';
      default: return 'ring-slate-500/60 shadow-lg shadow-slate-500/20';
    }
  };

  return (
    <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-2xl border-b border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3.5 md:px-5 md:py-4">
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
                  "w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 shadow-lg transition-transform hover:scale-105",
                  getRingColor(otherRole)
                )} 
              />
            ) : (
              <div className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white font-bold ring-2 shadow-lg transition-transform hover:scale-105",
                otherRole === 'admin' && "bg-gradient-to-br from-amber-500 to-orange-500",
                otherRole === 'coach' && "bg-gradient-to-br from-blue-500 to-cyan-500",
                (!otherRole || otherRole === 'client') && "bg-gradient-to-br from-slate-500 to-slate-600",
                getRingColor(otherRole)
              )}>
                <span className="text-lg md:text-xl">{otherName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            {isOnline && (
              <motion.div 
                className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-slate-900 shadow-lg shadow-emerald-500/50"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-white truncate text-base md:text-lg">{otherName}</h2>
            <div className="flex items-center gap-1.5">
              <RoleIcon role={otherRole} size={14} />
              <span className="text-xs md:text-sm text-slate-300 font-medium">{formatRole(otherRole)}</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className={cn("text-xs md:text-sm font-medium hidden sm:inline", isOnline ? "text-emerald-400" : "text-slate-400")}>
                {isOnline ? 'Online ora' : lastSeen ? `Visto ${formatMessageTime(lastSeen)}` : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions - Touch-friendly glass morphism buttons */}
        <div className="flex items-center gap-1 -mr-1">
          <motion.button
            onClick={onToggleSound}
            className={cn(
              "p-2.5 md:p-3 rounded-xl transition-all",
              soundEnabled ? "hover:bg-white/10 text-slate-300 hover:text-white" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            )}
            title={soundEnabled ? "Suono attivo" : "Suono disattivato"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </motion.button>
          <motion.button
            onClick={onSearch}
            className={cn(
              "p-2.5 md:p-3 rounded-xl transition-all",
              isSearchOpen ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20" : "hover:bg-white/10 text-slate-300 hover:text-white"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search size={20} />
          </motion.button>
          <motion.button
            onClick={onVoiceCall}
            className="p-2.5 md:p-3 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Chiamata vocale"
          >
            <Phone size={20} />
          </motion.button>
          <motion.button
            onClick={onVideoCall}
            className="p-2.5 md:p-3 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Videochiamata"
          >
            <Video size={20} />
          </motion.button>
          <motion.button
            onClick={onStarred}
            className="p-2.5 md:p-3 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-yellow-400"
            title="Messaggi preferiti"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Star size={20} />
          </motion.button>
          <motion.button
            onClick={onSettings}
            className="p-2.5 md:p-3 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white"
            title="Messaggi pinnati"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Pin size={20} />
          </motion.button>
        </div>
      </div>

      {/* Search Bar - WhatsApp floating style */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-slate-800/50"
          >
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Cerca nei messaggi..."
                  className="w-full pl-12 pr-12 py-3 bg-slate-700/50 backdrop-blur-xl border border-white/10 rounded-2xl 
                             text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 
                             focus:border-cyan-500/50 transition-all shadow-lg"
                  autoFocus
                />
                <motion.button
                  onClick={onCloseSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-600 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={18} className="text-slate-400" />
                </motion.button>
              </div>
              {searchResults.length > 0 && (
                <motion.p 
                  className="text-xs text-slate-400 mt-2.5 ml-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {searchResults.length} risultat{searchResults.length === 1 ? 'o' : 'i'} trovati
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatHeader;
