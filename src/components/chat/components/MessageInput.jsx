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
    <div className="flex-shrink-0 bg-slate-900/60 backdrop-blur-xl border-t border-white/10">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-3 overflow-hidden"
          >
            <div className="flex items-start gap-2 p-2 bg-white/5 backdrop-blur-sm rounded-lg border-l-2 border-cyan-500">
              <Reply size={16} className="text-cyan-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-cyan-400">{replyTo.senderName}</p>
                <p className="text-sm text-slate-400 truncate">{replyTo.content}</p>
              </div>
              <button onClick={onCancelReply} className="p-1 hover:bg-white/10 rounded">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Edit Preview */}
        {editingMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-2 bg-cyan-500/10 rounded-lg border-l-2 border-cyan-500">
              <Edit3 size={16} className="text-cyan-400" />
              <span className="text-sm text-cyan-400">Modifica messaggio</span>
              <div className="flex-1" />
              <button onClick={onCancelEdit} className="p-1 hover:bg-white/10 rounded">
                <X size={16} className="text-slate-400" />
              </button>
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
                  <button
                    onClick={() => insertFormatting('bold')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Bold size={18} className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => insertFormatting('italic')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Italic size={18} className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => insertFormatting('code')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Code size={18} className="text-slate-400" />
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Smile size={18} className="text-slate-400" />
                  </button>
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
          <div className="flex items-center gap-1 mb-2 px-1">
            <button
              onClick={() => insertFormatting('bold')}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Grassetto **testo**"
            >
              <Bold size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => insertFormatting('italic')}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Corsivo *testo*"
            >
              <Italic size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => insertFormatting('code')}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Codice `codice`"
            >
              <Code size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => insertFormatting('mention')}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Menzione @utente"
            >
              <AtSign size={16} className="text-slate-400" />
            </button>
            <div className="flex-1" />
            <span className="text-xs text-slate-500">
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
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={disabled}
              className={cn(
                "hover:bg-white/10 rounded-full transition-colors disabled:opacity-50",
                isMobile ? "p-2" : "p-3"
              )}
            >
              <Paperclip size={isMobile ? 18 : 20} className="text-slate-400" />
            </button>

            {/* Attachment Menu */}
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg 
                             border border-white/10 overflow-hidden z-20"
                >
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <Image size={20} className="text-emerald-400" />
                    </div>
                    <span className="text-white">Foto</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <File size={20} className="text-cyan-400" />
                    </div>
                    <span className="text-white">File</span>
                  </button>
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center">
                      <Camera size={20} className="text-violet-400" />
                    </div>
                    <span className="text-white">Fotocamera</span>
                  </button>
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
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className="p-3 hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
              >
                <Smile size={20} className="text-slate-400" />
              </button>
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
            <button
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              disabled={disabled}
              className={cn(
                "p-3 rounded-full transition-colors disabled:opacity-50",
                showQuickReplies ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-slate-700 text-slate-400"
              )}
              title="Risposte rapide"
            >
              <Zap size={isMobile ? 18 : 20} />
            </button>
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
                "w-full bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none disabled:opacity-50 backdrop-blur-sm",
                isMobile 
                  ? "px-3 py-2 min-h-[40px] max-h-24 text-sm" 
                  : "px-4 py-3 min-h-[48px] max-h-32 text-base leading-relaxed"
              )}
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = isMobile ? '40px' : '48px';
                e.target.style.height = Math.min(e.target.scrollHeight, isMobile ? 96 : 128) + 'px';
              }}
            />
          </div>

          {/* Send / Record Button */}
          {message.trim() ? (
            <button
              onClick={handleSend}
              disabled={disabled}
              className={cn(
                "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/30",
                isMobile ? "p-2" : "p-3"
              )}
            >
              <Send size={isMobile ? 18 : 20} className="text-white" />
            </button>
          ) : (
            <button
              onClick={() => setIsRecording(true)}
              disabled={disabled}
              className={cn(
                "hover:bg-white/10 rounded-full transition-colors disabled:opacity-50",
                isMobile ? "p-2" : "p-3"
              )}
            >
              <Mic size={isMobile ? 18 : 20} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
