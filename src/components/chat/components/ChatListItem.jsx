import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
      case 'admin': return 'ring-amber-500 shadow-xl shadow-amber-500/40';
      case 'coach': return 'ring-blue-500 shadow-xl shadow-blue-500/40';
      default: return 'ring-slate-500 shadow-xl shadow-slate-500/20';
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
      // Ignora se è il bottone del menu
      if (e.target.closest('[data-menu-trigger]')) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      // Aggiungi un piccolo delay per evitare che il click che apre il menu lo chiuda subito
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ 
      x: e.clientX || rect.right, 
      y: e.clientY || rect.bottom 
    });
    setShowMenu(true);
  };

  const handleMenuButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔘 Menu button clicked!');
    const rect = e.currentTarget.getBoundingClientRect();
    console.log('📍 Button rect:', rect);
    setMenuPosition({ 
      x: rect.left, 
      y: rect.bottom + 5
    });
    setShowMenu(true);
    console.log('📋 showMenu set to true');
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
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={cn(
          "flex items-center gap-4 py-4 px-4 rounded-2xl cursor-pointer transition-all relative group",
          "bg-white/5 backdrop-blur-sm border border-white/10",
          isActive 
            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 shadow-xl shadow-cyan-500/10" 
            : "hover:bg-white/10 hover:border-white/20",
          isArchived && "opacity-60"
        )}
      >
        {/* Indicatore chat fissata */}
        {isPinned && (
          <div className="absolute top-2 right-2">
            <Pin size={14} className="text-yellow-500" fill="currentColor" />
          </div>
        )}

        {/* Avatar with role ring */}
        <div className="relative flex-shrink-0">
          {otherPhoto ? (
            <img 
              src={otherPhoto} 
              alt={otherName} 
              className={cn(
                "w-[52px] h-[52px] rounded-full object-cover ring-[3px] transition-transform group-hover:scale-105",
                getRoleRing(otherRole)
              )} 
            />
          ) : (
            <div className={cn(
              "w-[52px] h-[52px] rounded-full flex items-center justify-center text-white text-lg font-bold ring-[3px] transition-transform group-hover:scale-105 bg-gradient-to-br",
              getRoleGradient(otherRole),
              getRoleRing(otherRole)
            )}>
              {otherName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Status indicator con animazione */}
          <div className={cn(
            "absolute bottom-0 right-0 w-4 h-4 rounded-full border-[3px] border-slate-900 transition-colors",
            isOnline 
              ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" 
              : "bg-slate-500"
          )}>
            {isOnline && (
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h3 className="font-bold text-base text-white truncate">{otherName}</h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {chat.lastMessageAt && (
                <span className="text-xs text-slate-500 font-medium">
                  {formatMessageTime(chat.lastMessageAt)}
                </span>
              )}
              {/* Bottone menu su hover desktop */}
              <motion.button
                data-menu-trigger
                onClick={handleMenuButtonClick}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MoreVertical size={18} className="text-slate-400" />
              </motion.button>
            </div>
          </div>
          {/* Role */}
          <div className="flex items-center gap-1.5 mb-1">
            <RoleIcon role={otherRole} size={14} />
            <span className="text-xs text-slate-500 font-medium">{formatRole(otherRole)}</span>
            {isArchived && (
              <span className="text-xs text-orange-400 font-medium ml-1">• Archiviata</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-slate-400 flex items-center gap-1.5 min-w-0 line-clamp-2">
              {chat.lastMessageBy === currentUserId && (
                <CheckCheck size={16} className="text-cyan-400 flex-shrink-0" />
              )}
              <span className="truncate">
                {chat.lastMessageType === 'image' ? '📷 Foto' : 
                 chat.lastMessageType === 'audio' ? '🎵 Audio' :
                 chat.lastMessageType === 'file' ? '📎 File' :
                 chat.lastMessage || 'Nessun messaggio'}
              </span>
            </p>
            {unreadCount > 0 && (
              <motion.span 
                className="bg-gradient-to-br from-pink-500 to-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[22px] text-center shadow-xl shadow-pink-500/40 flex-shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Menu contestuale - usa Portal per renderizzare fuori dal contenitore */}
      {showMenu && createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              left: Math.min(menuPosition.x, window.innerWidth - 220),
              top: Math.min(menuPosition.y, window.innerHeight - 280),
              zIndex: 99999
            }}
            className="bg-slate-800 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden min-w-[200px]"
          >
            {/* Pin/Unpin */}
            <motion.button
              onClick={(e) => handleMenuAction(() => onPin?.(chat.id, !isPinned), e)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/10 text-left transition-colors"
              whileHover={{ x: 4 }}
            >
              {isPinned ? (
                <><PinOff size={20} className="text-slate-400" />
                <span className="text-white font-medium">Rimuovi fissata</span></>
              ) : (
                <><Pin size={20} className="text-yellow-500" />
                <span className="text-white font-medium">Fissa in alto</span></>
              )}
            </motion.button>

            {/* Mark as read/unread */}
            <motion.button
              onClick={(e) => handleMenuAction(() => onMarkRead?.(chat.id, unreadCount > 0), e)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/10 text-left transition-colors"
              whileHover={{ x: 4 }}
            >
              {unreadCount > 0 ? (
                <><Check size={20} className="text-emerald-500" />
                <span className="text-white font-medium">Segna come letto</span></>
              ) : (
                <><MailOpen size={20} className="text-blue-400" />
                <span className="text-white font-medium">Segna come non letto</span></>
              )}
            </motion.button>

            {/* Archive/Unarchive */}
            <motion.button
              onClick={(e) => handleMenuAction(() => onArchive?.(chat.id, !isArchived), e)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/10 text-left transition-colors"
              whileHover={{ x: 4 }}
            >
              {isArchived ? (
                <><Archive size={20} className="text-slate-400" />
                <span className="text-white font-medium">Ripristina chat</span></>
              ) : (
                <><Archive size={20} className="text-orange-400" />
                <span className="text-white font-medium">Archivia chat</span></>
              )}
            </motion.button>

            <div className="border-t border-white/10" />

            {/* Delete */}
            <motion.button
              onClick={(e) => handleMenuAction(() => onDelete?.(chat.id), e)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-500/20 text-left transition-colors"
              whileHover={{ x: 4 }}
            >
              <Trash2 size={20} className="text-red-400" />
              <span className="text-red-400 font-medium">Elimina chat</span>
            </motion.button>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ChatListItem;
