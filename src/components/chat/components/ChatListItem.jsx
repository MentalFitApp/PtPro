import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, Pin, PinOff, Check, CheckCheck, MailOpen, 
  Archive, Trash2
} from 'lucide-react';
import clsx from 'clsx';
import { formatMessageTime } from '../../../hooks/useChat';
import { RoleIcon, formatRole } from '../utils/chatHelpers';

const cn = (...classes) => clsx(...classes);

const ChatListItem = ({ chat, isActive, onClick, currentUserId, onArchive, onPin, onDelete, onMarkRead }) => {
  const otherParticipant = chat.participants?.find(p => p !== currentUserId);
  const otherName = chat.participantNames?.[otherParticipant] || 'Utente';
  const otherPhoto = chat.participantPhotos?.[otherParticipant];
  const otherRole = chat.participantRoles?.[otherParticipant] || 'client';
  const unreadCount = chat.unreadCount?.[currentUserId] || 0;
  const isOnline = chat.onlineStatus?.[otherParticipant];
  const isPinned = chat.pinnedBy?.includes(currentUserId);
  const isArchived = chat.archivedBy?.includes(currentUserId);
  
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef(null);
  const menuRef = useRef(null);

  // Role-based styling
  const getRoleRing = (role) => {
    switch(role) {
      case 'admin': return 'ring-amber-400/70 shadow-amber-400/20';
      case 'coach': return 'ring-blue-400/70 shadow-blue-400/20';
      default: return 'ring-slate-500/50';
    }
  };

  const getRoleGradient = (role) => {
    switch(role) {
      case 'admin': return 'from-amber-500 to-orange-500';
      case 'coach': return 'from-blue-500 to-cyan-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      setMenuPosition({ x: touch.clientX, y: touch.clientY });
      setShowMenu(true);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleMenuAction = (action, e) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all relative group",
          isActive 
            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10" 
            : "hover:bg-white/[0.07] hover:border-white/10 border border-transparent",
          isArchived && "opacity-60"
        )}
      >
        {/* Indicatore chat fissata */}
        {isPinned && (
          <div className="absolute top-1.5 right-1.5">
            <Pin size={12} className="text-yellow-500" />
          </div>
        )}

        {/* Avatar with role ring */}
        <div className="relative flex-shrink-0">
          {otherPhoto ? (
            <img 
              src={otherPhoto} 
              alt={otherName} 
              className={cn(
                "w-12 h-12 rounded-full object-cover ring-2 shadow-lg transition-transform group-hover:scale-105",
                getRoleRing(otherRole)
              )} 
            />
          ) : (
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ring-2 shadow-lg transition-transform group-hover:scale-105 bg-gradient-to-br",
              getRoleGradient(otherRole),
              getRoleRing(otherRole)
            )}>
              {otherName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Status indicator con animazione */}
          <div className={cn(
            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 transition-colors",
            isOnline 
              ? "bg-green-500 shadow-lg shadow-green-500/50" 
              : "bg-slate-500"
          )}>
            {isOnline && (
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">{otherName}</h3>
            </div>
            <div className="flex items-center gap-2">
              {chat.lastMessageAt && (
                <span className="text-xs text-slate-500">
                  {formatMessageTime(chat.lastMessageAt)}
                </span>
              )}
              {/* Bottone menu su hover desktop */}
              <button
                onClick={(e) => { e.stopPropagation(); handleContextMenu(e); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600/50 rounded transition-all"
              >
                <MoreVertical size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
          {/* Role */}
          <div className="flex items-center gap-1 mt-0.5">
            <RoleIcon role={otherRole} size={12} />
            <span className="text-xs text-slate-500">{formatRole(otherRole)}</span>
            {isArchived && (
              <span className="text-xs text-orange-400 ml-1">• Archiviata</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-sm text-slate-400 truncate flex items-center gap-1">
              {chat.lastMessageBy === currentUserId && (
                <CheckCheck size={14} className="text-blue-400 flex-shrink-0" />
              )}
              {chat.lastMessageType === 'image' ? '📷 Foto' : 
               chat.lastMessageType === 'audio' ? '🎵 Audio' :
               chat.lastMessageType === 'file' ? '📎 File' :
               chat.lastMessage || 'Nessun messaggio'}
            </p>
            {unreadCount > 0 && (
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg shadow-pink-500/30 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Menu contestuale */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed',
              left: Math.min(menuPosition.x, window.innerWidth - 200),
              top: Math.min(menuPosition.y, window.innerHeight - 250),
              zIndex: 9999
            }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
          >
            {/* Pin/Unpin */}
            <button
              onClick={(e) => handleMenuAction(() => onPin?.(chat.id, !isPinned), e)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-left transition-colors"
            >
              {isPinned ? (
                <><PinOff size={18} className="text-slate-400" />
                <span className="text-white">Rimuovi fissata</span></>
              ) : (
                <><Pin size={18} className="text-yellow-500" />
                <span className="text-white">Fissa in alto</span></>
              )}
            </button>

            {/* Mark as read/unread */}
            <button
              onClick={(e) => handleMenuAction(() => onMarkRead?.(chat.id, unreadCount > 0), e)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-left transition-colors"
            >
              {unreadCount > 0 ? (
                <><Check size={18} className="text-green-500" />
                <span className="text-white">Segna come letto</span></>
              ) : (
                <><MailOpen size={18} className="text-blue-400" />
                <span className="text-white">Segna come non letto</span></>
              )}
            </button>

            {/* Archive/Unarchive */}
            <button
              onClick={(e) => handleMenuAction(() => onArchive?.(chat.id, !isArchived), e)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-left transition-colors"
            >
              {isArchived ? (
                <><Archive size={18} className="text-slate-400" />
                <span className="text-white">Ripristina chat</span></>
              ) : (
                <><Archive size={18} className="text-orange-400" />
                <span className="text-white">Archivia chat</span></>
              )}
            </button>

            <div className="border-t border-white/10" />

            {/* Delete */}
            <button
              onClick={(e) => handleMenuAction(() => onDelete?.(chat.id), e)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 text-left transition-colors"
            >
              <Trash2 size={18} className="text-red-400" />
              <span className="text-red-400">Elimina chat</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatListItem;
