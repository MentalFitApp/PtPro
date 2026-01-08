import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { 
  Reply, Smile, Forward, Star, Edit3, Trash2, Pin, 
  Download, File, Check, CheckCheck
} from 'lucide-react';
import { formatMessageTime } from '../../../hooks/useChat';
import { formatTextWithStyles, extractUrls, formatFileSize } from '../utils/chatHelpers';
import AudioPlayer from './AudioPlayer';
import LinkPreview from './LinkPreview';

const cn = (...classes) => clsx(...classes);

const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReaction,
  onStar,
  onForward,
  isFirstInGroup,
  isLastInGroup,
  participantNames,
  isMobile = false
}) => {
  // Usa il nome dalla chat se disponibile, altrimenti quello salvato nel messaggio
  const displayName = participantNames?.[message.senderId] || message.senderName || 'Utente';
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const menuRef = useRef(null);
  const touchStartX = useRef(0);
  const longPressTimerRef = useRef(null);
  const swipeThreshold = 60;

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
  const urls = message.type === 'text' ? extractUrls(message.content) : [];

  // Chiudi menu al click fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup long press timer
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Swipe handlers per mobile
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    // Solo swipe verso destra (per reply)
    if (diff > 0) {
      setSwipeX(Math.min(diff, 80));
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (!isMobile) return;
    if (swipeX > swipeThreshold) {
      // Trigger reply
      onReply(message);
      // Haptic feedback se disponibile
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
    setSwipeX(0);
    setIsSwiping(false);
  };

  // Long press handler for mobile context menu
  const handleLongPressStart = () => {
    if (!isMobile) return;
    longPressTimerRef.current = setTimeout(() => {
      setShowMenu(true);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return (
        <p className="text-slate-500 italic flex items-center gap-1">
          <Trash2 size={14} />
          Messaggio eliminato
        </p>
      );
    }

    // Forwarded message indicator
    const forwardedBadge = message.isForwarded && (
      <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
        <Forward size={12} />
        <span>Inoltrato</span>
      </div>
    );

    switch (message.type) {
      case 'image':
        return (
          <>
            {forwardedBadge}
            <div className="relative group">
              <img 
                src={message.mediaUrl || message.content} 
                alt="Image" 
                className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.mediaUrl || message.content, '_blank')}
              />
              <button className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 
                                 group-hover:opacity-100 transition-opacity">
                <Download size={16} className="text-white" />
              </button>
            </div>
          </>
        );

      case 'audio':
        return (
          <>
            {forwardedBadge}
            <AudioPlayer src={message.mediaUrl || message.content} />
          </>
        );

      case 'file':
        return (
          <>
            {forwardedBadge}
            <a 
              href={message.mediaUrl || message.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <File size={20} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{message.fileName || 'File'}</p>
                <p className="text-xs text-slate-500">{formatFileSize(message.fileSize)}</p>
              </div>
              <Download size={18} className="text-slate-400" />
            </a>
          </>
        );

      default:
        return (
          <>
            {forwardedBadge}
            {message.replyTo && (
              <div className="mb-2 pl-3 border-l-2 border-blue-500/50 text-sm text-slate-400">
                <p className="font-medium text-blue-400">{message.replyTo.senderName}</p>
                <p className="truncate">{message.replyTo.content}</p>
              </div>
            )}
            <div className="whitespace-pre-wrap break-words">
              {formatTextWithStyles(message.content)}
            </div>
            {/* Link Previews */}
            {urls.length > 0 && urls.slice(0, 1).map((url, i) => (
              <LinkPreview key={i} url={url} />
            ))}
          </>
        );
    }
  };

  return (
    <div 
      className={cn("flex gap-3 group relative px-3 py-1", isOwn ? "flex-row-reverse" : "flex-row")}
      onTouchStart={(e) => {
        handleTouchStart(e);
        handleLongPressStart();
      }}
      onTouchMove={(e) => {
        handleTouchMove(e);
        handleLongPressEnd();
      }}
      onTouchEnd={() => {
        handleTouchEnd();
        handleLongPressEnd();
      }}
      onContextMenu={(e) => {
        if (isMobile) {
          e.preventDefault();
          setShowMenu(true);
        }
      }}
      style={{ 
        transform: `translateX(${swipeX}px)`,
        transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      {/* Swipe Reply Indicator - WhatsApp style */}
      {swipeX > 10 && (
        <motion.div 
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full transition-all",
            swipeX > swipeThreshold ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-700/50 text-slate-400"
          )}
          style={{ opacity: Math.min(swipeX / swipeThreshold, 1) }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <Reply size={18} />
        </motion.div>
      )}

      {/* Avatar with role-colored ring - WhatsApp style */}
      {!isOwn && showAvatar ? (
        message.senderPhoto ? (
          <img 
            src={message.senderPhoto} 
            alt={displayName} 
            className={cn(
              "rounded-full object-cover flex-shrink-0 mt-auto ring-2 transition-all hover:scale-110 hover:ring-4",
              isMobile ? "w-9 h-9" : "w-10 h-10",
              message.senderRole === 'admin' && "ring-amber-500 hover:ring-amber-400 shadow-xl shadow-amber-500/40",
              message.senderRole === 'coach' && "ring-blue-500 hover:ring-blue-400 shadow-xl shadow-blue-500/40",
              (!message.senderRole || message.senderRole === 'client') && "ring-slate-500/60 hover:ring-slate-400/80"
            )}
          />
        ) : (
          <div className={cn(
            "rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-auto ring-2 transition-all hover:scale-110 hover:ring-4",
            isMobile ? "w-9 h-9 text-sm" : "w-10 h-10 text-base",
            message.senderRole === 'admin' && "bg-gradient-to-br from-amber-500 to-orange-500 ring-amber-500 hover:ring-amber-400 shadow-xl shadow-amber-500/40",
            message.senderRole === 'coach' && "bg-gradient-to-br from-blue-500 to-cyan-500 ring-blue-500 hover:ring-blue-400 shadow-xl shadow-blue-500/40",
            (!message.senderRole || message.senderRole === 'client') && "bg-gradient-to-br from-slate-500 to-slate-600 ring-slate-500/60 hover:ring-slate-400/80"
          )}>
            {displayName?.charAt(0).toUpperCase()}
          </div>
        )
      ) : !isOwn ? (
        <div className={isMobile ? "w-9" : "w-10"} />
      ) : null}

      {/* Message */}
      <div className={cn(
        "relative", 
        isOwn && "flex flex-col items-end",
        isMobile ? "max-w-[80%]" : "max-w-[65%] lg:max-w-[55%]"
      )}>
        {/* Sender name for group chats */}
        {!isOwn && isFirstInGroup && (
          <p className="text-xs text-slate-500 mb-1 ml-1">{displayName}</p>
        )}

        <div
          className={cn(
            "relative rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-200",
            isMobile ? "px-3 py-2.5" : "px-4 py-3",
            isOwn 
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/35 hover:shadow-2xl" 
              : "bg-slate-800/95 text-white border border-white/10 shadow-slate-900/50 hover:bg-slate-800 hover:border-white/20 hover:shadow-2xl",
            isFirstInGroup && isOwn && "rounded-tr-md",
            isFirstInGroup && !isOwn && "rounded-tl-md",
            message.isPinned && "ring-2 ring-yellow-400/70 shadow-yellow-400/20"
          )}
        >
          {/* Bubble tail - WhatsApp modern style */}
          {isLastInGroup && (
            <div 
              className={cn(
                "absolute bottom-0 w-4 h-4 rounded-br-full",
                isOwn 
                  ? "right-0 translate-x-2 translate-y-1 bg-gradient-to-br from-blue-500 to-blue-600" 
                  : "left-0 -translate-x-2 translate-y-1 bg-slate-800/95 border-l border-b border-white/10",
                "[clip-path:polygon(0%_0%,100%_0%,100%_100%)]",
                isOwn && "[clip-path:polygon(0%_0%,100%_0%,0%_100%)]"
              )}
            />
          )}
          {/* Pin indicator */}
          {message.isPinned && (
            <Pin size={12} className="absolute -top-1 -right-1 text-yellow-500" />
          )}

          {renderContent()}

          {/* Time & Status */}
          <div className={cn(
            "flex items-center gap-1.5 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}>
            <span className="text-[10px] opacity-60">
              {formatMessageTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className="text-[10px] opacity-60">modificato</span>
            )}
            {isOwn && (
              message.readBy?.length > 1 ? (
                <span className="flex items-center gap-0.5 group/read relative">
                  <CheckCheck size={14} className="text-blue-300" />
                  <span className="text-[9px] text-blue-300/80 hidden sm:inline">Visto</span>
                  {/* Tooltip con orario lettura */}
                  <span className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-slate-900 text-[10px] text-white 
                                   rounded shadow-lg opacity-0 group-hover/read:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Letto da {message.readBy.length - 1} {message.readBy.length === 2 ? 'persona' : 'persone'}
                  </span>
                </span>
              ) : (
                <Check size={14} className="opacity-60" />
              )
            )}
          </div>

          {/* Reactions - WhatsApp style */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="absolute -bottom-4 left-2 flex gap-1">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                users.length > 0 && (
                  <motion.span 
                    key={emoji}
                    className="bg-slate-700/90 backdrop-blur-sm rounded-full px-2 py-1 text-sm cursor-pointer 
                               hover:bg-slate-600 hover:scale-110 transition-all shadow-lg border border-white/10"
                    onClick={() => onReaction(message.id, emoji)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {emoji} {users.length > 1 && <span className="text-xs text-slate-300 ml-0.5">{users.length}</span>}
                  </motion.span>
                )
              ))}
            </div>
          )}
        </div>

        {/* Actions Menu - WhatsApp style */}
        <div 
          ref={menuRef}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200",
            isOwn ? "left-0 -translate-x-full pr-3" : "right-0 translate-x-full pl-3"
          )}
        >
          <div className="flex items-center gap-1 bg-slate-800/95 backdrop-blur-xl rounded-xl p-1.5 shadow-2xl border border-white/10">
            <motion.button
              onClick={() => setShowReactions(!showReactions)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Smile size={18} className="text-slate-300" />
            </motion.button>
            <motion.button
              onClick={() => onReply(message)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Reply size={18} className="text-slate-300" />
            </motion.button>
            <motion.button
              onClick={() => onForward?.(message)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Inoltra"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Forward size={18} className="text-slate-300" />
            </motion.button>
            <motion.button
              onClick={() => onStar?.(message.id)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Preferiti"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Star size={18} className={message.isStarred ? "text-yellow-500 fill-yellow-500" : "text-slate-300"} />
            </motion.button>
            {isOwn && !message.isDeleted && (
              <>
                <motion.button
                  onClick={() => onEdit(message)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit3 size={18} className="text-slate-300" />
                </motion.button>
                <motion.button
                  onClick={() => onDelete(message.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 size={18} className="text-red-400" />
                </motion.button>
              </>
            )}
            <motion.button
              onClick={() => onPin(message.id)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Pin size={18} className={message.isPinned ? "text-yellow-500" : "text-slate-300"} />
            </motion.button>
          </div>

          {/* Reactions Picker - WhatsApp style */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full mb-3 left-0 bg-slate-800/95 backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl border border-white/10 flex gap-1.5"
              >
                {reactions.map(emoji => (
                  <motion.button
                    key={emoji}
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowReactions(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-700 rounded-xl 
                               transition-colors text-xl"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
