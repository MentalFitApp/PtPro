import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { formatMessageDate } from '../../../hooks/useChat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const MessagesArea = ({ 
  messages, 
  loading, 
  hasMore, 
  loadingMore,
  onLoadMore,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReaction,
  onStar,
  onForward,
  typingUsers,
  scrollToMessageId,
  participantNames,
  isMobile = false
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Detect scroll position
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);

    // Load more when scrolled to top
    if (scrollTop < 100 && hasMore && !loadingMore) {
      onLoadMore?.();
    }
  };

  // Scroll to specific message
  useEffect(() => {
    if (scrollToMessageId) {
      const element = document.getElementById(`message-${scrollToMessageId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-blue-500/20');
        setTimeout(() => element.classList.remove('bg-blue-500/20'), 2000);
      }
    }
  }, [scrollToMessageId]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((msg) => {
      const msgDate = formatMessageDate(msg.createdAt);
      
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [messages]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Caricamento messaggi...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="px-4 py-4"
      onScroll={handleScroll}
    >
      {/* Load More Indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Messages */}
      {groupedMessages.map((group) => (
        <div key={group.date}>
          {/* Date Separator - Elegant pill style */}
          <div className="flex items-center justify-center my-8">
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent blur-xl" />
              <div className="relative px-6 py-2.5 bg-slate-800/90 backdrop-blur-2xl rounded-full text-xs font-semibold text-slate-300 
                              border border-white/10 shadow-xl shadow-black/30">
                {group.date}
              </div>
            </motion.div>
          </div>

          {/* Messages in group */}
          <div className="space-y-2">
            {group.messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUserId;
              const prevMsg = group.messages[index - 1];
              const nextMsg = group.messages[index + 1];
              const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

              return (
                <motion.div 
                  key={msg.id} 
                  id={`message-${msg.id}`} 
                  className="transition-colors duration-500"
                  initial={{ opacity: 0, y: 10, x: isOwn ? 20 : -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ 
                    duration: 0.2, 
                    ease: 'easeOut',
                    delay: index * 0.02 // Slight stagger for visual appeal
                  }}
                >
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPin={onPin}
                    onReaction={onReaction}
                    onStar={onStar}
                    onForward={onForward}
                    participantNames={participantNames}
                    isMobile={isMobile}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Typing Indicator */}
      <AnimatePresence>
        <TypingIndicator users={typingUsers} />
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {!autoScroll && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="fixed bottom-28 right-6 p-4 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 
                       rounded-full shadow-2xl shadow-cyan-500/40 transition-all z-10 border border-white/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronDown size={22} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesArea;
