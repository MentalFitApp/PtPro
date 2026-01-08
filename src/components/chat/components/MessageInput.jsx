import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { 
  Paperclip, Image, File, Camera, Smile, Send, Mic, Plus, 
  Bold, Italic, Code, AtSign, Reply, Edit3, X, Zap
} from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import AudioRecorder from './AudioRecorder';
import QuickReplyTemplates from './QuickReplyTemplates';

const cn = (...classes) => clsx(...classes);

const MessageInput = ({ 
  onSend, 
  onTyping, 
  replyTo, 
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSendEdit,
  disabled,
  isMobile,
  userRole = 'client'
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Focus on input when replying or editing
  useEffect(() => {
    if (replyTo || editingMessage) {
      inputRef.current?.focus();
    }
    if (editingMessage) {
      setMessage(editingMessage.content);
    }
  }, [replyTo, editingMessage]);

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      onSend(file, type);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Typing indicator
    onTyping?.(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false);
    }, 2000);
  };

  const insertEmoji = (emoji) => {
    const start = inputRef.current?.selectionStart || message.length;
    const end = inputRef.current?.selectionEnd || message.length;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    setMessage(newMessage);
    // Focus back and set cursor position
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const insertFormatting = (type) => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.slice(start, end);
    
    let newText = '';
    let cursorOffset = 0;
    
    switch (type) {
      case 'bold':
        newText = `**${selectedText || 'testo'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || 'testo'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'code':
        newText = `\`${selectedText || 'codice'}\``;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'mention':
        newText = `@${selectedText || ''}`;
        cursorOffset = 1;
        break;
      default:
        return;
    }
    
    const newMessage = message.slice(0, start) + newText + message.slice(end);
    setMessage(newMessage);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + cursorOffset;
      const endPos = selectedText ? newPos : newPos + (type === 'mention' ? 0 : (type === 'bold' ? 5 : 4));
      textarea.setSelectionRange(newPos, endPos);
    }, 0);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    if (editingMessage) {
      onSendEdit(editingMessage.id, message.trim());
    } else {
      onSend(message.trim(), 'text', replyTo ? { replyTo } : {});
    }
    
    setMessage('');
    onTyping?.(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      onSend(file, type);
    }
    setShowAttachMenu(false);
  };

  const handleAudioSend = (audioBlob) => {
    onSend(audioBlob, 'audio');
    setIsRecording(false);
  };

  if (isRecording) {
    return (
      <div className="flex-shrink-0 p-4 bg-slate-900/60 backdrop-blur-xl border-t border-white/10">
        <AudioRecorder 
          onSend={handleAudioSend} 
          onCancel={() => setIsRecording(false)} 
        />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl">
      {/* Reply Preview - WhatsApp style */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 overflow-hidden"
          >
            <div className="p-3 pl-4 flex items-center gap-3 bg-slate-800/50">
              <div className="w-1 h-12 bg-cyan-500 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-cyan-400 mb-0.5">Risposta a {replyTo.senderName}</p>
                <p className="text-sm text-slate-300 truncate">{replyTo.content}</p>
              </div>
              <motion.button
                onClick={onCancelReply}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} className="text-slate-400" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Preview - WhatsApp style */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 overflow-hidden"
          >
            <div className="p-3 pl-4 flex items-center gap-3 bg-amber-500/10">
              <div className="w-1 h-12 bg-amber-500 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-400 mb-0.5 flex items-center gap-1">
                  <Edit3 size={12} />
                  Modifica messaggio
                </p>
                <p className="text-sm text-slate-300 truncate">{editingMessage.content}</p>
              </div>
              <motion.button
                onClick={onCancelEdit}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} className="text-slate-400" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div 
        ref={dropZoneRef}
        className={cn(
          "relative transition-colors",
          isMobile ? "p-2" : "p-4",
          isDragging && "bg-cyan-500/10 border-2 border-dashed border-cyan-500/50 rounded-xl m-2"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm rounded-xl z-10">
            <div className="text-center">
              <Paperclip size={40} className="text-cyan-400 mx-auto mb-2" />
              <p className="text-cyan-400 font-medium">Rilascia per inviare</p>
            </div>
          </div>
        )}

        {/* Mobile Toolbar - espandibile */}
        {isMobile && (
          <AnimatePresence>
            {showMobileToolbar && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1 pb-2 px-1">
                  <motion.button
                    onClick={() => insertFormatting('bold')}
                    className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Bold size={22} className="text-slate-400" />
                  </motion.button>
                  <motion.button
                    onClick={() => insertFormatting('italic')}
                    className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Italic size={22} className="text-slate-400" />
                  </motion.button>
                  <motion.button
                    onClick={() => insertFormatting('code')}
                    className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Code size={22} className="text-slate-400" />
                  </motion.button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <motion.button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Smile size={22} className="text-slate-400" />
                  </motion.button>
                </div>
                {/* Emoji Picker for mobile */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <div className="pb-2">
                      <EmojiPicker
                        onSelect={(emoji) => {
                          insertEmoji(emoji);
                          setShowEmojiPicker(false);
                        }}
                        onClose={() => setShowEmojiPicker(false)}
                        inline
                      />
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Formatting toolbar - desktop */}
        {!isMobile && (
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <motion.button
              onClick={() => insertFormatting('bold')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="Grassetto **testo**"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bold size={20} className="text-slate-400" />
            </motion.button>
            <motion.button
              onClick={() => insertFormatting('italic')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="Corsivo *testo*"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Italic size={20} className="text-slate-400" />
            </motion.button>
            <motion.button
              onClick={() => insertFormatting('code')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="Codice `codice`"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Code size={20} className="text-slate-400" />
            </motion.button>
            <motion.button
              onClick={() => insertFormatting('mention')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="Menzione @utente"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AtSign size={20} className="text-slate-400" />
            </motion.button>
            <div className="flex-1" />
            <span className="text-xs text-slate-500 font-medium">
              Shift+Enter per andare a capo
            </span>
          </div>
        )}

        <div className="flex items-end gap-1">
          {/* Mobile: Toggle toolbar button */}
          {isMobile && (
            <button
              onClick={() => setShowMobileToolbar(!showMobileToolbar)}
              className={cn(
                "p-2 rounded-full transition-colors",
                showMobileToolbar ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-white/10 text-slate-400"
              )}
            >
              <Plus size={18} className={cn("transition-transform", showMobileToolbar && "rotate-45")} />
            </button>
          )}
          
          {/* Attachment Button */}
          <div className="relative">
            <motion.button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={disabled}
              className={cn(
                "hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50",
                isMobile ? "p-2.5" : "p-3"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Paperclip size={isMobile ? 20 : 22} className="text-slate-400" />
            </motion.button>

            {/* Attachment Menu - WhatsApp Professional */}
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 bg-slate-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl 
                             border border-white/10 overflow-hidden z-20 min-w-[200px]"
                >
                  <motion.button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-white/10 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Image size={22} className="text-emerald-400" />
                    </div>
                    <span className="text-white font-medium">Foto</span>
                  </motion.button>
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-white/10 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="w-11 h-11 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                      <File size={22} className="text-cyan-400" />
                    </div>
                    <span className="text-white font-medium">File</span>
                  </motion.button>
                  <motion.button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-white/10 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="w-11 h-11 bg-violet-500/20 rounded-xl flex items-center justify-center">
                      <Camera size={22} className="text-violet-400" />
                    </div>
                    <span className="text-white font-medium">Fotocamera</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileSelect(e, 'image')}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileSelect(e, 'file')}
              className="hidden"
            />
          </div>

          {/* Emoji Picker Button - nascosto su mobile */}
          {!isMobile && (
            <div className="relative">
              <motion.button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className="p-3 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Smile size={22} className="text-slate-400" />
              </motion.button>
              <AnimatePresence>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={insertEmoji}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quick Reply Templates Button */}
          <div className="relative">
            <motion.button
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              disabled={disabled}
              className={cn(
                "p-3 rounded-xl transition-all disabled:opacity-50",
                showQuickReplies 
                  ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20" 
                  : "hover:bg-white/10 text-slate-400"
              )}
              title="Risposte rapide"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap size={isMobile ? 20 : 22} />
            </motion.button>
            <AnimatePresence>
              {showQuickReplies && (
                <QuickReplyTemplates
                  role={userRole}
                  isOpen={showQuickReplies}
                  onSelect={(text) => setMessage(text)}
                  onClose={() => setShowQuickReplies(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={isMobile ? "Scrivi un messaggio..." : "Scrivi un messaggio... (usa **grassetto**, *corsivo*, `codice`)"}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full bg-slate-800/60 border border-white/10 rounded-2xl text-white placeholder-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none disabled:opacity-50 backdrop-blur-xl shadow-lg",
                isMobile 
                  ? "px-4 py-2.5 min-h-[42px] max-h-24 text-sm" 
                  : "px-5 py-3.5 min-h-[52px] max-h-32 text-base leading-relaxed"
              )}
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = isMobile ? '42px' : '52px';
                e.target.style.height = Math.min(e.target.scrollHeight, isMobile ? 96 : 128) + 'px';
              }}
            />
          </div>

          {/* Send / Record Button */}
          {message.trim() ? (
            <motion.button
              onClick={handleSend}
              disabled={disabled}
              className={cn(
                "bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl transition-all disabled:opacity-50 shadow-xl shadow-cyan-500/40",
                isMobile ? "p-2.5" : "p-3.5"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send size={isMobile ? 20 : 22} className="text-white" />
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setIsRecording(true)}
              disabled={disabled}
              className={cn(
                "hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50",
                isMobile ? "p-2.5" : "p-3.5"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mic size={isMobile ? 20 : 22} className="text-slate-400" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
