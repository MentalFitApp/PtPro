// src/pages/shared/Chat.jsx
// Chat completa con tutte le funzionalità

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Search, MoreVertical, Phone, Video, 
  Image, Mic, MicOff, Paperclip, X, Check, CheckCheck, 
  Pin, Trash2, Edit3, Reply, Smile, ArrowLeft, Plus,
  Play, Pause, Download, File, Camera, User, AlertCircle,
  ChevronDown, Clock, Star, Filter, Settings, Volume2, VolumeX,
  Shield, UserCog, Users, Forward, Bold, Italic, Code, AtSign, Link2, ExternalLink,
  Archive, MailOpen, BellOff, PinOff
} from 'lucide-react';
import { auth, db, storage } from '../../firebase';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs, setDoc, serverTimestamp, deleteField, orderBy, limit, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { uploadToR2 } from '../../cloudflareStorage';
import { 
  useChat, useChatList, useTypingIndicator, useMediaUpload, 
  useSearchMessages, formatMessageDate, formatMessageTime, getTenantId 
} from '../../hooks/useChat';
import clsx from 'clsx';

// Helper per classi condizionali
const cn = (...classes) => clsx(...classes);

// Helper per ottenere il ruolo dell'utente corrente
const getCurrentUserRole = async (userId) => {
  try {
    const tenantId = getTenantId();
    
    // Check if admin
    const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
    if (adminDoc.exists() && adminDoc.data().uids?.includes(userId)) {
      return 'admin';
    }
    
    // Check if coach
    const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
    if (coachDoc.exists() && coachDoc.data().uids?.includes(userId)) {
      return 'coach';
    }
    
    return 'client';
  } catch (err) {
    console.error('Error getting user role:', err);
    return 'client';
  }
};

// Helper per formattare il ruolo
const formatRole = (role) => {
  switch (role) {
    case 'admin': return 'Admin';
    case 'coach': return 'Coach';
    case 'client': return 'Cliente';
    default: return role;
  }
};

// Helper per icona del ruolo
const RoleIcon = ({ role, size = 12 }) => {
  switch (role) {
    case 'admin':
      return <Shield size={size} className="text-purple-400" />;
    case 'coach':
      return <UserCog size={size} className="text-blue-400" />;
    default:
      return <User size={size} className="text-slate-400" />;
  }
};

// ============ NOTIFICATION SOUND ============
const playNotificationSound = () => {
  try {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not supported');
  }
};

// ============ EMOJI DATA ============
const EMOJI_CATEGORIES = {
  'Frecenti': ['😀', '😂', '❤️', '👍', '🔥', '😍', '🎉', '💪'],
  'Faccine': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '😈', '💀', '💩', '🤡', '👻', '👽', '🤖'],
  'Gesti': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪'],
  'Cuori': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Sport': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂'],
  'Cibo': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🌮', '🌯', '🫔', '🥙'],
  'Natura': ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺', '🌍', '🌎', '🌏', '🌐', '🪨', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '🌌', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔', '⛱️', '⚡', '❄️', '🔥', '💧', '🌊'],
  'Oggetti': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪'],
  'Simboli': ['💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '✅', '❌', '❓', '❗', '⭕', '🔶', '🔷', '🔸', '🔹', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '⬛', '⬜', '🔳', '🔲', '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇮🇹']
};

// ============ EMOJI PICKER COMPONENT ============
const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Frecenti');
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredEmojis = useMemo(() => {
    if (!searchTerm) return EMOJI_CATEGORIES[activeCategory] || [];
    const term = searchTerm.toLowerCase();
    return Object.values(EMOJI_CATEGORIES).flat().filter(emoji => 
      emoji.includes(term)
    );
  }, [activeCategory, searchTerm]);

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute bottom-full left-0 mb-2 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 
                 w-80 max-h-96 flex flex-col overflow-hidden z-50"
    >
      {/* Search */}
      <div className="p-2 border-b border-slate-700">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca emoji..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-white 
                       placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="flex gap-1 p-2 border-b border-slate-700 overflow-x-auto scrollbar-hide">
          {Object.keys(EMOJI_CATEGORIES).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === category 
                  ? "bg-blue-500 text-white" 
                  : "text-slate-400 hover:bg-slate-700"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-700 rounded-lg 
                         transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
        {filteredEmojis.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">Nessun emoji trovato</p>
        )}
      </div>
    </motion.div>
  );
};

// ============ LINK PREVIEW ============
const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // Simple preview - extract domain and show link
        const urlObj = new URL(url);
        setPreview({
          title: urlObj.hostname,
          description: url,
          domain: urlObj.hostname,
          favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
        });
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [url]);

  if (loading || error || !preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block p-3 bg-slate-600/30 rounded-lg border border-slate-600/50 
                 hover:bg-slate-600/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <img 
          src={preview.favicon} 
          alt="" 
          className="w-8 h-8 rounded"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-400 truncate">{preview.domain}</span>
            <ExternalLink size={12} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{url}</p>
        </div>
      </div>
    </a>
  );
};

// ============ TEXT FORMATTING HELPERS ============
const formatTextWithStyles = (text) => {
  if (!text) return text;
  
  // URL regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // Bold **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  // Italic *text* or _text_
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|_(.+?)_/g;
  // Code `text`
  const codeRegex = /`([^`]+)`/g;
  // Mention @name
  const mentionRegex = /@(\w+)/g;

  // Split by URLs first to handle them separately
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    // Check if this part is a URL
    if (urlRegex.test(part)) {
      return (
        <span key={i}>
          <a 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline break-all"
          >
            {part}
          </a>
        </span>
      );
    }
    
    // Apply other formatting
    let formattedPart = part
      .replace(boldRegex, '<strong class="font-bold">$1</strong>')
      .replace(italicRegex, '<em class="italic">$1$2</em>')
      .replace(codeRegex, '<code class="px-1.5 py-0.5 bg-slate-600/50 rounded text-sm font-mono text-green-400">$1</code>')
      .replace(mentionRegex, '<span class="text-blue-400 font-medium">@$1</span>');

    return <span key={i} dangerouslySetInnerHTML={{ __html: formattedPart }} />;
  });
};

// Check if text contains URLs
const extractUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// ============ FORWARD MESSAGE MODAL ============
const ForwardMessageModal = ({ message, chats, onForward, onClose }) => {
  const [selectedChats, setSelectedChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = useMemo(() => {
    if (!searchTerm) return chats;
    const term = searchTerm.toLowerCase();
    return chats.filter(chat => 
      chat.participantNames?.some(name => name.toLowerCase().includes(term))
    );
  }, [chats, searchTerm]);

  const toggleChat = (chatId) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    if (selectedChats.length === 0) return;
    onForward(message, selectedChats);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Inoltra messaggio</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-700">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca chat..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 rounded-lg text-white 
                         placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Message Preview */}
        <div className="p-3 border-b border-slate-700 bg-slate-700/30">
          <p className="text-xs text-slate-500 mb-1">Messaggio da inoltrare:</p>
          <p className="text-sm text-slate-300 truncate">{message?.content}</p>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => toggleChat(chat.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors",
                selectedChats.includes(chat.id) && "bg-blue-500/20"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                selectedChats.includes(chat.id) 
                  ? "border-blue-500 bg-blue-500" 
                  : "border-slate-600"
              )}>
                {selectedChats.includes(chat.id) && <Check size={12} className="text-white" />}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                              flex items-center justify-center text-white font-semibold">
                {chat.participantNames?.[0]?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="text-white font-medium">{chat.participantNames?.join(', ')}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleForward}
            disabled={selectedChats.length === 0}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 
                       disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
          >
            Inoltra a {selectedChats.length} {selectedChats.length === 1 ? 'chat' : 'chat'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ GLOBAL SEARCH MODAL ============
const GlobalSearchModal = ({ chats, onClose, onSelectMessage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const term = searchTerm.toLowerCase();
    const foundResults = [];

    try {
      const tenantId = getTenantId();
      
      // Search in all chats' messages
      for (const chat of chats) {
        const messagesRef = collection(db, `tenants/${tenantId}/chats/${chat.id}/messages`);
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const msg = { id: doc.id, ...doc.data() };
          if (msg.content?.toLowerCase().includes(term)) {
            foundResults.push({
              ...msg,
              chatId: chat.id,
              chatName: chat.participantNames?.join(', ')
            });
          }
        });
      }

      setResults(foundResults.slice(0, 50)); // Limit results
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearching(false);
    }
  }, [searchTerm, chats]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Cerca in tutte le chat</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca messaggi..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 rounded-xl text-white 
                         placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {!searching && results.length === 0 && searchTerm.length >= 2 && (
            <div className="text-center py-8 text-slate-500">
              Nessun risultato per "{searchTerm}"
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="divide-y divide-slate-700/50">
              {results.map((result, i) => (
                <button
                  key={`${result.chatId}-${result.id}-${i}`}
                  onClick={() => onSelectMessage(result)}
                  className="w-full p-4 text-left hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-blue-400 font-medium">{result.chatName}</span>
                    <span className="text-xs text-slate-500">
                      {result.createdAt?.toDate?.()?.toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <p className="text-sm text-white line-clamp-2">{result.content}</p>
                  <p className="text-xs text-slate-500 mt-1">da {result.senderName}</p>
                </button>
              ))}
            </div>
          )}

          {!searching && searchTerm.length < 2 && (
            <div className="text-center py-8 text-slate-500">
              Digita almeno 2 caratteri per cercare
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ STARRED MESSAGES PANEL ============
const StarredMessagesPanel = ({ chatId, onClose, onScrollTo }) => {
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;

    const tenantId = getTenantId();
    const messagesRef = collection(db, `tenants/${tenantId}/chats/${chatId}/messages`);
    const q = query(messagesRef, where('isStarred', '==', true), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStarred(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [chatId]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="absolute inset-y-0 right-0 w-80 bg-slate-800 border-l border-slate-700 
                 flex flex-col z-20 shadow-xl"
    >
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={20} className="text-yellow-500" />
          <h3 className="font-semibold text-white">Preferiti</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-yellow-500 rounded-full animate-spin" />
          </div>
        ) : starred.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Star size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">Nessun messaggio preferito</p>
            <p className="text-sm text-slate-600 mt-1">
              Clicca sulla stella su un messaggio per aggiungerlo ai preferiti
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {starred.map(msg => (
              <button
                key={msg.id}
                onClick={() => onScrollTo(msg.id)}
                className="w-full p-4 text-left hover:bg-slate-700/50 transition-colors"
              >
                <p className="text-sm text-white line-clamp-2">{msg.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">{msg.senderName}</span>
                  <span className="text-xs text-slate-500">
                    {msg.createdAt?.toDate?.()?.toLocaleDateString('it-IT')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============ ONLINE STATUS MANAGER ============
const useOnlineStatus = (userId) => {
  useEffect(() => {
    if (!userId) return;
    
    const tenantId = getTenantId();
    const userStatusRef = doc(db, `tenants/${tenantId}/presence/${userId}`);
    
    // Set online when component mounts
    const setOnline = async () => {
      try {
        await setDoc(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error('Error setting online status:', e);
      }
    };
    
    // Set offline when leaving
    const setOffline = async () => {
      try {
        await setDoc(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error('Error setting offline status:', e);
      }
    };
    
    setOnline();
    
    // Set offline on page unload
    window.addEventListener('beforeunload', setOffline);
    
    // Update presence every 30 seconds
    const interval = setInterval(setOnline, 30000);
    
    return () => {
      window.removeEventListener('beforeunload', setOffline);
      clearInterval(interval);
      setOffline();
    };
  }, [userId]);
};

// ============ PROFILE CHECK MODAL ============
// Modal per richiedere nome e foto prima di accedere alla chat

const ProfileCheckModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), photoFile);
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Completa il tuo profilo</h2>
          <p className="text-slate-400 text-sm">
            Per usare la chat, devi almeno inserire il tuo nome
          </p>
        </div>

        {/* Photo Upload */}
        <div className="flex justify-center mb-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 
                       hover:border-blue-500 cursor-pointer transition-colors overflow-hidden group"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 group-hover:text-blue-400">
                <Camera size={24} />
                <span className="text-xs mt-1">Foto</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nome e Cognome <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es: Mario Rossi"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white 
                       placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-2">
            Puoi modificare questi dati in qualsiasi momento dal tuo profilo
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl 
                       font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 
                       hover:to-cyan-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Check size={18} />
                Salva e Continua
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ CHAT LIST ITEM ============

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
        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all relative group",
          isActive ? "bg-blue-500/20 border border-blue-500/30" : "hover:bg-slate-700/50",
          isArchived && "opacity-60"
        )}
      >
        {/* Indicatore chat fissata */}
        {isPinned && (
          <div className="absolute top-1 right-1">
            <Pin size={12} className="text-yellow-500" />
          </div>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {otherPhoto ? (
            <img src={otherPhoto} alt={otherName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 
                            flex items-center justify-center text-white font-bold">
              {otherName.charAt(0).toUpperCase()}
            </div>
          )}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-800" />
          )}
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
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
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
            className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[180px]"
          >
            {/* Pin/Unpin */}
            <button
              onClick={(e) => handleMenuAction(() => onPin?.(chat.id, !isPinned), e)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 text-left transition-colors"
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
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 text-left transition-colors"
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
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 text-left transition-colors"
            >
              {isArchived ? (
                <><Archive size={18} className="text-slate-400" />
                <span className="text-white">Ripristina chat</span></>
              ) : (
                <><Archive size={18} className="text-orange-400" />
                <span className="text-white">Archivia chat</span></>
              )}
            </button>

            <div className="border-t border-slate-700" />

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

// ============ CHAT SIDEBAR (Lista Chat) ============

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
    let result = chats;
    
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
    return chats.reduce((total, chat) => {
      return total + (chat.unreadCount?.[currentUserId] || 0);
    }, 0);
  }, [chats, currentUserId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-blue-400" size={24} />
            Messaggi
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <button
              onClick={onGlobalSearch}
              className="p-2.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
              title="Cerca in tutte le chat"
            >
              <Search size={20} />
            </button>
            <button
              onClick={onNewChat}
              className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20"
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl 
                       text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Toggle Archiviate */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setShowArchivedChats(false)}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors",
              !showArchivedChats 
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                : "text-slate-400 hover:bg-slate-700/50"
            )}
          >
            Attive
          </button>
          <button
            onClick={() => setShowArchivedChats(true)}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
              showArchivedChats 
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                : "text-slate-400 hover:bg-slate-700/50"
            )}
          >
            <Archive size={14} />
            Archiviate
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
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

// ============ EMPTY CHAT STATE ============

const EmptyChatState = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-slate-500">
    <div className="w-32 h-32 bg-slate-800/80 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-700/50">
      <MessageSquare size={48} className="opacity-50 text-blue-400" />
    </div>
    <h2 className="text-2xl font-semibold text-white mb-2">Seleziona una chat</h2>
    <p className="text-center max-w-sm text-slate-400">
      Scegli una conversazione dalla lista a sinistra o iniziane una nuova cliccando sul pulsante +
    </p>
  </div>
);

// ============ MESSAGE BUBBLE ============

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
  isLastInGroup 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef(null);

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
    <div className={cn("flex gap-2 group", isOwn ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      {!isOwn && showAvatar ? (
        message.senderPhoto ? (
          <img 
            src={message.senderPhoto} 
            alt={message.senderName} 
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-auto"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                          flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-auto">
            {message.senderName?.charAt(0).toUpperCase()}
          </div>
        )
      ) : !isOwn ? (
        <div className="w-8 flex-shrink-0" />
      ) : null}

      {/* Message */}
      <div className={cn("max-w-[75%] relative", isOwn && "flex flex-col items-end")}>
        {/* Sender name for group chats */}
        {!isOwn && isFirstInGroup && (
          <p className="text-xs text-slate-500 mb-1 ml-1">{message.senderName}</p>
        )}

        <div
          className={cn(
            "relative px-4 py-2.5 rounded-2xl",
            isOwn 
              ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white" 
              : "bg-slate-700 text-white",
            isFirstInGroup && isOwn && "rounded-tr-md",
            isFirstInGroup && !isOwn && "rounded-tl-md",
            isLastInGroup && isOwn && "rounded-br-md",
            isLastInGroup && !isOwn && "rounded-bl-md",
            message.isPinned && "ring-2 ring-yellow-500/50"
          )}
        >
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
                <CheckCheck size={14} className="text-blue-300" />
              ) : (
                <Check size={14} className="opacity-60" />
              )
            )}
          </div>

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="absolute -bottom-3 left-2 flex gap-0.5">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                users.length > 0 && (
                  <span 
                    key={emoji}
                    className="bg-slate-600 rounded-full px-1.5 py-0.5 text-xs cursor-pointer 
                               hover:bg-slate-500 transition-colors"
                    onClick={() => onReaction(message.id, emoji)}
                  >
                    {emoji} {users.length > 1 && users.length}
                  </span>
                )
              ))}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div 
          ref={menuRef}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
            isOwn ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"
          )}
        >
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              <Smile size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => onReply(message)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              <Reply size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => onForward?.(message)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
              title="Inoltra"
            >
              <Forward size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => onStar?.(message.id)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
              title="Preferiti"
            >
              <Star size={16} className={message.isStarred ? "text-yellow-500 fill-yellow-500" : "text-slate-400"} />
            </button>
            {isOwn && !message.isDeleted && (
              <>
                <button
                  onClick={() => onEdit(message)}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                >
                  <Edit3 size={16} className="text-slate-400" />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </>
            )}
            <button
              onClick={() => onPin(message.id)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              <Pin size={16} className={message.isPinned ? "text-yellow-500" : "text-slate-400"} />
            </button>
          </div>

          {/* Reactions Picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full mb-2 left-0 bg-slate-800 rounded-xl p-2 shadow-lg flex gap-1"
              >
                {reactions.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowReactions(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg 
                               transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ============ AUDIO PLAYER ============

const AudioPlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <button
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full 
                   hover:bg-white/20 transition-colors"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/60 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs opacity-60 mt-1">
          {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
        </p>
      </div>
    </div>
  );
};

// ============ AUDIO RECORDER ============

const AudioRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center gap-3 px-4 py-3 bg-red-500/20 rounded-2xl border border-red-500/30"
    >
      <button
        onClick={onCancel}
        className="p-2 hover:bg-slate-700 rounded-full transition-colors"
      >
        <X size={20} className="text-slate-400" />
      </button>

      <div className="flex items-center gap-2 flex-1">
        <div className={cn(
          "w-3 h-3 rounded-full",
          isRecording ? "bg-red-500 animate-pulse" : "bg-slate-500"
        )} />
        <span className="text-white font-mono">{formatTime(duration)}</span>
      </div>

      {isRecording ? (
        <button
          onClick={stopRecording}
          className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
        >
          <MicOff size={20} className="text-white" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
        >
          <Send size={20} className="text-white" />
        </button>
      )}
    </motion.div>
  );
};

// ============ HELPER FUNCTIONS ============

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ============ TYPING INDICATOR COMPONENT ============

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const names = users.map(u => u.name).join(', ');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-slate-500">{names} sta scrivendo...</span>
    </motion.div>
  );
};

// ============ CHAT HEADER ============

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

  return (
    <div className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Back + User Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>

          <div className="relative">
            {otherPhoto ? (
              <img src={otherPhoto} alt={otherName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                              flex items-center justify-center text-white font-bold">
                {otherName.charAt(0).toUpperCase()}
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
            )}
          </div>

          <div>
            <h2 className="font-semibold text-white">{otherName}</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <RoleIcon role={otherRole} size={12} />
                <span className="text-xs text-slate-400">{formatRole(otherRole)}</span>
              </div>
              <span className="text-slate-600">•</span>
              <span className={cn("text-xs", isOnline ? "text-green-400" : "text-slate-500")}>
                {isOnline ? '● Online' : lastSeen ? `Ultimo accesso ${formatMessageTime(lastSeen)}` : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSound}
            className={cn(
              "p-2 rounded-full transition-colors",
              soundEnabled ? "hover:bg-slate-700 text-slate-400" : "bg-red-500/20 text-red-400"
            )}
            title={soundEnabled ? "Suono attivo" : "Suono disattivato"}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            onClick={onSearch}
            className={cn(
              "p-2 rounded-full transition-colors",
              isSearchOpen ? "bg-blue-500/20 text-blue-400" : "hover:bg-slate-700 text-slate-400"
            )}
          >
            <Search size={20} />
          </button>
          <button
            onClick={onVoiceCall}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={onVideoCall}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
          >
            <Video size={20} />
          </button>
          <button
            onClick={onStarred}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
            title="Messaggi preferiti"
          >
            <Star size={20} />
          </button>
          <button
            onClick={onSettings}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
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
            className="overflow-hidden border-t border-slate-700/50"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Cerca nei messaggi..."
                  className="w-full pl-10 pr-10 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl 
                             text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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

// ============ MESSAGE INPUT ============

const MessageInput = ({ 
  onSend, 
  onTyping, 
  replyTo, 
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSendEdit,
  disabled 
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
    }
    
    const newMessage = message.slice(0, start) + newText + message.slice(end);
    setMessage(newMessage);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + cursorOffset;
      textarea.setSelectionRange(newPos, selectedText ? newPos : newPos + (type === 'mention' ? 0 : (type === 'bold' ? 5 : 4)));
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
      <div className="flex-shrink-0 p-4 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50">
        <AudioRecorder 
          onSend={handleAudioSend} 
          onCancel={() => setIsRecording(false)} 
        />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-3 overflow-hidden"
          >
            <div className="flex items-start gap-2 p-2 bg-slate-700/50 rounded-lg border-l-2 border-blue-500">
              <Reply size={16} className="text-blue-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-400">{replyTo.senderName}</p>
                <p className="text-sm text-slate-400 truncate">{replyTo.content}</p>
              </div>
              <button onClick={onCancelReply} className="p-1 hover:bg-slate-600 rounded">
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
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg border-l-2 border-blue-500">
              <Edit3 size={16} className="text-blue-400" />
              <span className="text-sm text-blue-400">Modifica messaggio</span>
              <div className="flex-1" />
              <button onClick={onCancelEdit} className="p-1 hover:bg-slate-600 rounded">
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
          "p-4 relative transition-colors",
          isDragging && "bg-blue-500/10 border-2 border-dashed border-blue-500/50 rounded-xl m-2"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90 rounded-xl z-10">
            <div className="text-center">
              <Paperclip size={40} className="text-blue-400 mx-auto mb-2" />
              <p className="text-blue-400 font-medium">Rilascia per inviare</p>
            </div>
          </div>
        )}

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 mb-2 px-1">
          <button
            onClick={() => insertFormatting('bold')}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Grassetto **testo**"
          >
            <Bold size={16} className="text-slate-400" />
          </button>
          <button
            onClick={() => insertFormatting('italic')}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Corsivo *testo*"
          >
            <Italic size={16} className="text-slate-400" />
          </button>
          <button
            onClick={() => insertFormatting('code')}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Codice `codice`"
          >
            <Code size={16} className="text-slate-400" />
          </button>
          <button
            onClick={() => insertFormatting('mention')}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Menzione @utente"
          >
            <AtSign size={16} className="text-slate-400" />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-slate-500 hidden sm:block">
            Shift+Enter per andare a capo
          </span>
        </div>

        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={disabled}
              className="p-3 hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
            >
              <Paperclip size={20} className="text-slate-400" />
            </button>

            {/* Attachment Menu */}
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 bg-slate-800 rounded-xl shadow-lg 
                             border border-slate-700 overflow-hidden z-20"
                >
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Image size={20} className="text-green-400" />
                    </div>
                    <span className="text-white">Foto</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <File size={20} className="text-blue-400" />
                    </div>
                    <span className="text-white">File</span>
                  </button>
                  <button
                    onClick={() => {
                      // Camera capture
                      imageInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Camera size={20} className="text-purple-400" />
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

          {/* Emoji Picker Button */}
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

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio... (usa **grassetto**, *corsivo*, `codice`)"
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-2xl 
                         text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                         resize-none min-h-[48px] max-h-32 disabled:opacity-50 text-base leading-relaxed"
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = '48px';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
          </div>

          {/* Send / Record Button */}
          {message.trim() ? (
            <button
              onClick={handleSend}
              disabled={disabled}
              className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50"
            >
              <Send size={20} className="text-white" />
            </button>
          ) : (
            <button
              onClick={() => setIsRecording(true)}
              disabled={disabled}
              className="p-3 hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
            >
              <Mic size={20} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ MESSAGES AREA ============

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
  scrollToMessageId
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

    messages.forEach((msg, index) => {
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
      className="h-full overflow-y-auto px-4 py-4 scroll-smooth"
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
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400">
              {group.date}
            </div>
          </div>

          {/* Messages in group */}
          <div className="space-y-1">
            {group.messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUserId;
              const prevMsg = group.messages[index - 1];
              const nextMsg = group.messages[index + 1];
              const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

              return (
                <div key={msg.id} id={`message-${msg.id}`} className="transition-colors duration-500">
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
                  />
                </div>
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="fixed bottom-24 right-6 p-3 bg-slate-700 hover:bg-slate-600 rounded-full 
                       shadow-lg transition-colors z-10"
          >
            <ChevronDown size={20} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// Export componenti per uso esterno se necessario
export { 
  ProfileCheckModal, 
  ChatSidebar, 
  EmptyChatState, 
  MessageBubble, 
  AudioPlayer, 
  AudioRecorder,
  TypingIndicator,
  ChatHeader,
  MessageInput,
  MessagesArea,
  formatFileSize 
};

// ============ NEW CHAT MODAL ============

const NewChatModal = ({ isOpen, onClose, onCreate, currentUserRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [actualUserRole, setActualUserRole] = useState(currentUserRole || 'client');

  useEffect(() => {
    if (!isOpen) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const tenantId = getTenantId();
        const currentUserId = auth.currentUser?.uid;
        const userList = [];
        
        // Determina il ruolo dell'utente corrente se non passato
        let userRole = currentUserRole;
        if (!userRole || userRole === 'client') {
          // Verifica il ruolo direttamente
          const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
          const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
          const adminUidsCheck = adminDoc.exists() ? adminDoc.data().uids || [] : [];
          const coachUidsCheck = coachDoc.exists() ? coachDoc.data().uids || [] : [];
          
          if (adminUidsCheck.includes(currentUserId)) {
            userRole = 'admin';
          } else if (coachUidsCheck.includes(currentUserId)) {
            userRole = 'coach';
          } else {
            userRole = 'client';
          }
          setActualUserRole(userRole);
        }
        
        console.log('📨 Chat NewChatModal - Ruolo utente:', userRole, 'currentUserRole prop:', currentUserRole);
        
        // Carica Admin e Coach (sempre visibili per tutti)
        const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
        const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
        
        const adminUids = adminDoc.exists() ? adminDoc.data().uids || [] : [];
        const coachUids = coachDoc.exists() ? coachDoc.data().uids || [] : [];
        
        // Carica info utenti admin/coach
        const usersRef = collection(db, `tenants/${tenantId}/users`);
        const usersSnapshot = await getDocs(usersRef);
        const usersMap = {};
        usersSnapshot.forEach(doc => {
          usersMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Aggiungi admin
        for (const uid of adminUids) {
          if (uid !== currentUserId) {
            const userData = usersMap[uid];
            if (userData?.visibleInChat !== false) {
              userList.push({
                id: uid,
                odiaUserId: uid,
                name: userData?.displayName || userData?.name || 'Admin',
                email: userData?.email,
                photo: userData?.photoURL || userData?.photo,
                role: 'admin'
              });
            }
          }
        }
        
        // Aggiungi coach
        for (const uid of coachUids) {
          if (uid !== currentUserId && !adminUids.includes(uid)) {
            const userData = usersMap[uid];
            if (userData?.visibleInChat !== false) {
              userList.push({
                id: uid,
                odiaUserId: uid,
                name: userData?.displayName || userData?.name || 'Coach',
                email: userData?.email,
                photo: userData?.photoURL || userData?.photo,
                role: 'coach'
              });
            }
          }
        }
        
        // Se admin o coach, carica anche i clienti
        if (userRole === 'admin' || userRole === 'coach') {
          const clientsRef = collection(db, `tenants/${tenantId}/clients`);
          const clientsSnapshot = await getDocs(clientsRef);
          
          console.log('📨 Chat - Caricamento clienti, trovati documenti:', clientsSnapshot.size);
          
          clientsSnapshot.forEach(clientDoc => {
            const data = clientDoc.data();
            const clientUserId = clientDoc.id; // L'ID del documento È l'userId
            
            // Salta se è l'utente corrente o se è già stato aggiunto come admin/coach
            if (clientUserId !== currentUserId && 
                !adminUids.includes(clientUserId) && 
                !coachUids.includes(clientUserId)) {
              // Cerca la foto anche nella collection users come fallback
              const userDataFromUsers = usersMap[clientUserId];
              const photoFromUsers = userDataFromUsers?.photoURL || userDataFromUsers?.photo;
              const photoFromClients = data.photoURL || data.photo;
              
              userList.push({
                id: clientDoc.id,
                odiaUserId: clientUserId,
                name: data.name || data.displayName || 'Cliente',
                email: data.email,
                photo: photoFromClients || photoFromUsers, // Prima cerca in clients, poi in users
                role: 'client'
              });
            }
          });
        }
        
        console.log('📨 Chat - Utenti caricati:', userList.length, userList.map(u => ({ name: u.name, role: u.role })));
        setUsers(userList);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isOpen, currentUserRole]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Filtra per tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(u => u.role === activeTab);
    }
    
    // Filtra per ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [users, searchTerm, activeTab]);

  const handleSelect = async (user) => {
    setCreating(user.id);
    try {
      await onCreate(user.odiaUserId, user.name, user.photo, user.role);
      onClose();
    } catch (err) {
      console.error('Error creating chat:', err);
    } finally {
      setCreating(null);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'all', label: 'Tutti', icon: Users },
    { id: 'admin', label: 'Admin', icon: Shield },
    { id: 'coach', label: 'Coach', icon: UserCog },
    ...((actualUserRole === 'admin' || actualUserRole === 'coach') ? [{ id: 'client', label: 'Clienti', icon: User }] : [])
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Nuova Conversazione</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca persona..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl 
                         text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === tab.id 
                      ? "bg-blue-500/20 text-blue-400" 
                      : "text-slate-400 hover:bg-slate-700"
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <User size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nessuna persona trovata</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  disabled={creating === user.id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-xl 
                             transition-colors disabled:opacity-50"
                >
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                      user.role === 'admin' ? "bg-gradient-to-br from-purple-500 to-pink-500" :
                      user.role === 'coach' ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
                      "bg-gradient-to-br from-green-500 to-teal-500"
                    )}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">{user.name}</p>
                    <div className="flex items-center gap-1.5">
                      <RoleIcon role={user.role} size={12} />
                      <span className="text-xs text-slate-500">{formatRole(user.role)}</span>
                      {user.email && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-500 truncate">{user.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {creating === user.id && (
                    <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ PINNED MESSAGES PANEL ============

const PinnedMessagesPanel = ({ chatId, onClose, onScrollTo }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPinned = async () => {
      if (!chatId) return;
      
      setLoading(true);
      try {
        const tenantId = getTenantId();
        const messagesRef = collection(db, `tenants/${tenantId}/chats/${chatId}/messages`);
        const q = query(messagesRef, where('isPinned', '==', true));
        const snapshot = await getDocs(q);
        
        const pinned = [];
        snapshot.forEach(doc => {
          pinned.push({ id: doc.id, ...doc.data() });
        });
        
        pinned.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        
        setPinnedMessages(pinned);
      } catch (err) {
        console.error('Error loading pinned messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPinned();
  }, [chatId]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="absolute inset-y-0 right-0 w-80 bg-slate-800 border-l border-slate-700 flex flex-col z-20"
    >
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Pin size={18} className="text-yellow-500" />
          Messaggi Fissati
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : pinnedMessages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Pin size={32} className="mx-auto mb-2 opacity-50" />
            <p>Nessun messaggio fissato</p>
          </div>
        ) : (
          pinnedMessages.map(msg => (
            <button
              key={msg.id}
              onClick={() => onScrollTo(msg.id)}
              className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <p className="text-xs text-slate-500 mb-1">
                {msg.senderName} • {formatMessageTime(msg.createdAt)}
              </p>
              <p className="text-white text-sm line-clamp-2">
                {msg.type === 'image' ? '📷 Foto' : 
                 msg.type === 'audio' ? '🎵 Audio' :
                 msg.type === 'file' ? '📎 File' : msg.content}
              </p>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
};

// ============ MAIN CHAT COMPONENT ============

export default function Chat() {
  const user = auth.currentUser;
  const [activeChat, setActiveChat] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [showStarredPanel, setShowStarredPanel] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('client');
  const [profileChecked, setProfileChecked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevMessagesCountRef = useRef(0);

  // Track online status
  useOnlineStatus(user?.uid);

  // Hooks
  const { chats, loading: chatsLoading, createChat } = useChatList();
  const { 
    messages, 
    loading: messagesLoading, 
    hasMore, 
    loadingMore,
    loadMore,
    sendMessage, 
    markAsRead,
    deleteMessage,
    editMessage,
    togglePin,
    addReaction,
    removeReaction
  } = useChat(activeChat?.id);
  const { typingUsers, setTyping } = useTypingIndicator(activeChat?.id);
  const { uploadMedia, uploading } = useMediaUpload(activeChat?.id);
  const { results: searchResults, search: searchMessages, clearSearch } = useSearchMessages(activeChat?.id);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get current user role
  useEffect(() => {
    if (user) {
      getCurrentUserRole(user.uid).then(role => setCurrentUserRole(role));
    }
  }, [user]);

  // Check if user has profile name (check both Firebase Auth and Firestore)
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      try {
        // Prima controlla Firebase Auth displayName
        if (user.displayName) {
          setProfileChecked(true);
          return;
        }
        
        // Altrimenti controlla il documento Firestore
        const tenantId = getTenantId();
        const userDocRef = doc(db, `tenants/${tenantId}/users/${user.uid}`);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.displayName || data.name) {
            setProfileChecked(true);
            return;
          }
        }
        
        // Se non ha un nome da nessuna parte, mostra il modal
        setShowProfileModal(true);
        setProfileChecked(true);
      } catch (err) {
        console.error('Error checking profile:', err);
        setProfileChecked(true);
      }
    };
    
    checkProfile();
  }, [user]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (activeChat?.id) {
      markAsRead();
    }
  }, [activeChat?.id, markAsRead]);

  // Play sound on new message
  useEffect(() => {
    if (messages.length > 0 && prevMessagesCountRef.current > 0) {
      // Check if there's a new message from someone else
      const lastMessage = messages[messages.length - 1];
      if (messages.length > prevMessagesCountRef.current && 
          lastMessage.senderId !== user?.uid && 
          soundEnabled) {
        playNotificationSound();
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, user?.uid, soundEnabled]);

  // Search messages when search term changes
  useEffect(() => {
    if (messageSearchTerm) {
      searchMessages(messageSearchTerm);
    } else {
      clearSearch();
    }
  }, [messageSearchTerm, searchMessages, clearSearch]);

  // Handle profile save
  const handleProfileSave = async (name, photoFile) => {
    if (!user) return;

    try {
      let photoURL = user.photoURL;

      // Upload photo if provided
      if (photoFile) {
        try {
          // Prova con R2 prima
          photoURL = await uploadToR2(
            photoFile,
            user.uid,
            'profile-photos',
            null,
            true
          );
        } catch (r2Error) {
          console.warn('R2 upload failed, falling back to Firebase Storage:', r2Error);
          // Fallback a Firebase Storage
          const tenantId = getTenantId();
          const path = `tenants/${tenantId}/profiles/${user.uid}/avatar.jpg`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, photoFile);
          photoURL = await getDownloadURL(storageRef);
        }
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: name,
        photoURL
      });

      // Update/Create user doc in Firestore
      const tenantId = getTenantId();
      const userDocRef = doc(db, `tenants/${tenantId}/users/${user.uid}`);
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: name,
        name: name,
        email: user.email,
        photoURL: photoURL || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Aggiorna anche la collection clients se l'utente è un client
      const clientDocRef = doc(db, `tenants/${tenantId}/clients/${user.uid}`);
      const clientSnap = await getDoc(clientDocRef);
      if (clientSnap.exists()) {
        await updateDoc(clientDocRef, {
          photoURL: photoURL || '',
          photo: photoURL || '',
          displayName: name,
          name: name,
          updatedAt: serverTimestamp()
        });
        console.log('📸 Chat - Aggiornata foto profilo anche in clients collection');
      }

      // Aggiorna participantPhotos in tutte le chat dove l'utente partecipa
      if (photoURL) {
        const chatsRef = collection(db, `tenants/${tenantId}/chats`);
        const chatsQuery = query(chatsRef, where('participants', 'array-contains', user.uid));
        const chatsSnapshot = await getDocs(chatsQuery);
        
        const updatePromises = chatsSnapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          const updatedPhotos = {
            ...(chatData.participantPhotos || {}),
            [user.uid]: photoURL
          };
          await updateDoc(doc(db, `tenants/${tenantId}/chats/${chatDoc.id}`), {
            participantPhotos: updatedPhotos
          });
        });
        
        await Promise.all(updatePromises);
        console.log('📸 Chat - Aggiornata foto in', chatsSnapshot.size, 'chat');
      }

      setShowProfileModal(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      throw err;
    }
  };

  // Handle send message
  const handleSendMessage = async (content, type, metadata = {}) => {
    if (!activeChat?.id) return;

    try {
      if (type === 'image' || type === 'audio' || type === 'file') {
        // Upload media first
        const mediaData = await uploadMedia(content, type);
        await sendMessage(mediaData.url, type, {
          ...metadata,
          mediaUrl: mediaData.url,
          fileName: mediaData.name,
          fileSize: mediaData.size,
          mimeType: mediaData.mimeType
        });
      } else {
        await sendMessage(content, type, metadata);
      }

      setReplyTo(null);
      
      // Increment unread for other participant
      const otherParticipant = activeChat.participants?.find(p => p !== user?.uid);
      if (otherParticipant) {
        const tenantId = getTenantId();
        const chatRef = doc(db, `tenants/${tenantId}/chats/${activeChat.id}`);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
          const currentUnread = chatSnap.data().unreadCount?.[otherParticipant] || 0;
          await updateDoc(chatRef, {
            [`unreadCount.${otherParticipant}`]: currentUnread + 1
          });
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle edit message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      await editMessage(messageId, newContent);
      setEditingMessage(null);
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  // Handle reaction
  const handleReaction = async (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const userReacted = message.reactions?.[emoji]?.includes(user?.uid);
    
    if (userReacted) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
  };

  // Handle star message (preferiti)
  const handleStarMessage = async (messageId) => {
    try {
      const tenantId = getTenantId();
      const messageRef = doc(db, `tenants/${tenantId}/chats/${activeChat.id}/messages/${messageId}`);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const currentStarred = messageDoc.data().isStarred || false;
        await updateDoc(messageRef, { isStarred: !currentStarred });
      }
    } catch (err) {
      console.error('Error starring message:', err);
    }
  };

  // Handle forward message
  const handleForwardMessage = (message) => {
    setMessageToForward(message);
    setShowForwardModal(true);
  };

  // Execute forward to selected chats
  const executeForward = async (message, chatIds) => {
    try {
      const tenantId = getTenantId();
      
      for (const chatId of chatIds) {
        // Send forwarded message to each chat
        const messagesRef = collection(db, `tenants/${tenantId}/chats/${chatId}/messages`);
        await addDoc(messagesRef, {
          content: message.content,
          type: message.type || 'text',
          mediaUrl: message.mediaUrl || null,
          fileName: message.fileName || null,
          fileSize: message.fileSize || null,
          senderId: user?.uid,
          senderName: user?.displayName || 'Utente',
          senderPhoto: user?.photoURL || null,
          createdAt: serverTimestamp(),
          isForwarded: true,
          originalSender: message.senderName
        });

        // Update chat's last message
        const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
        await updateDoc(chatRef, {
          lastMessage: message.type === 'text' ? message.content : `[${message.type}]`,
          lastMessageAt: serverTimestamp()
        });
      }

      setShowForwardModal(false);
      setMessageToForward(null);
    } catch (err) {
      console.error('Error forwarding message:', err);
    }
  };

  // Handle global search result selection
  const handleGlobalSearchSelect = (result) => {
    // Find the chat and select it
    const chat = chats.find(c => c.id === result.chatId);
    if (chat) {
      setActiveChat(chat);
      setShowGlobalSearch(false);
      // Scroll to the message after a small delay
      setTimeout(() => {
        setScrollToMessageId(result.id);
        setTimeout(() => setScrollToMessageId(null), 100);
      }, 300);
    }
  };

  // Handle video call
  const handleVideoCall = () => {
    const otherParticipant = activeChat?.participants?.find(p => p !== user?.uid);
    const otherName = activeChat?.participantNames?.[otherParticipant] || 'Utente';
    
    // Apri Daily.co o altra piattaforma di videochiamate
    const roomName = `fitflow-${activeChat?.id}`;
    window.open(`https://fitflow.daily.co/${roomName}`, '_blank');
    
    // Invia messaggio di sistema
    sendMessage(`📹 ${user?.displayName || 'Utente'} ha avviato una videochiamata`, 'system');
  };

  // Handle voice call
  const handleVoiceCall = () => {
    // Simile alla videochiamata
    const roomName = `fitflow-${activeChat?.id}`;
    window.open(`https://fitflow.daily.co/${roomName}?audio_only=true`, '_blank');
    
    sendMessage(`📞 ${user?.displayName || 'Utente'} ha avviato una chiamata vocale`, 'system');
  };

  // Select chat
  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    if (isMobile) {
      setShowMobileChat(true);
    }
    setIsSearchOpen(false);
    setMessageSearchTerm('');
    clearSearch();
    setShowPinnedPanel(false);
  };

  // Back to chat list (mobile)
  const handleBack = () => {
    setShowMobileChat(false);
    setActiveChat(null);
  };

  // ============ CHAT MANAGEMENT FUNCTIONS ============
  
  // Archivia/Ripristina chat
  const handleArchiveChat = async (chatId, archive) => {
    try {
      const tenantId = getTenantId();
      const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const currentArchivedBy = chatSnap.data().archivedBy || [];
        let newArchivedBy;
        
        if (archive) {
          newArchivedBy = [...new Set([...currentArchivedBy, user?.uid])];
        } else {
          newArchivedBy = currentArchivedBy.filter(uid => uid !== user?.uid);
        }
        
        await updateDoc(chatRef, { archivedBy: newArchivedBy });
        console.log(`📁 Chat ${archive ? 'archiviata' : 'ripristinata'}:`, chatId);
      }
    } catch (err) {
      console.error('Errore archivio chat:', err);
    }
  };

  // Fissa/Rimuovi fissa chat
  const handlePinChat = async (chatId, pin) => {
    try {
      const tenantId = getTenantId();
      const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const currentPinnedBy = chatSnap.data().pinnedBy || [];
        let newPinnedBy;
        
        if (pin) {
          newPinnedBy = [...new Set([...currentPinnedBy, user?.uid])];
        } else {
          newPinnedBy = currentPinnedBy.filter(uid => uid !== user?.uid);
        }
        
        await updateDoc(chatRef, { pinnedBy: newPinnedBy });
        console.log(`📌 Chat ${pin ? 'fissata' : 'rimossa da fissate'}:`, chatId);
      }
    } catch (err) {
      console.error('Errore pin chat:', err);
    }
  };

  // Elimina chat
  const handleDeleteChat = async (chatId) => {
    if (!confirm('Sei sicuro di voler eliminare questa conversazione? L\'azione è irreversibile.')) {
      return;
    }
    
    try {
      const tenantId = getTenantId();
      const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
      
      // Per ora facciamo un soft delete aggiungendo l'utente a deletedBy
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const currentDeletedBy = chatSnap.data().deletedBy || [];
        const newDeletedBy = [...new Set([...currentDeletedBy, user?.uid])];
        
        await updateDoc(chatRef, { deletedBy: newDeletedBy });
        
        // Se la chat attiva è quella eliminata, deselezionala
        if (activeChat?.id === chatId) {
          setActiveChat(null);
          if (isMobile) setShowMobileChat(false);
        }
        
        console.log('🗑️ Chat eliminata:', chatId);
      }
    } catch (err) {
      console.error('Errore eliminazione chat:', err);
    }
  };

  // Segna come letto/non letto
  const handleMarkReadChat = async (chatId, markAsRead) => {
    try {
      const tenantId = getTenantId();
      const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
      
      if (markAsRead) {
        await updateDoc(chatRef, {
          [`unreadCount.${user?.uid}`]: 0
        });
        console.log('✅ Chat segnata come letta:', chatId);
      } else {
        // Segna come non letto con 1 messaggio
        await updateDoc(chatRef, {
          [`unreadCount.${user?.uid}`]: 1
        });
        console.log('📩 Chat segnata come non letta:', chatId);
      }
    } catch (err) {
      console.error('Errore mark read chat:', err);
    }
  };

  // Handle new chat creation
  const handleNewChat = async (participantId, participantName, participantPhoto, participantRole) => {
    try {
      const chatId = await createChat(participantId, participantName, participantPhoto, participantRole);
      if (chatId) {
        // Find the chat in the list or create a temporary one
        const existingChat = chats.find(c => c.id === chatId);
        if (existingChat) {
          handleSelectChat(existingChat);
        } else {
          handleSelectChat({
            id: chatId,
            participants: [user?.uid, participantId],
            participantNames: {
              [user?.uid]: user?.displayName || 'Tu',
              [participantId]: participantName
            },
            participantPhotos: {
              [user?.uid]: user?.photoURL,
              [participantId]: participantPhoto
            },
            participantRoles: {
              [user?.uid]: currentUserRole,
              [participantId]: participantRole || 'client'
            }
          });
        }
        setShowNewChatModal(false);
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  // Render Chat Area
  const renderChatArea = () => {
    if (!activeChat) {
      return <EmptyChatState />;
    }

    return (
      <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0">
          <ChatHeader
            chat={activeChat}
            currentUserId={user?.uid}
            onBack={handleBack}
            onVideoCall={handleVideoCall}
            onVoiceCall={handleVoiceCall}
            onSearch={() => setIsSearchOpen(!isSearchOpen)}
            onSettings={() => setShowPinnedPanel(!showPinnedPanel)}
            onStarred={() => setShowStarredPanel(!showStarredPanel)}
            isSearchOpen={isSearchOpen}
            searchTerm={messageSearchTerm}
            onSearchChange={setMessageSearchTerm}
            onCloseSearch={() => {
              setIsSearchOpen(false);
              setMessageSearchTerm('');
              clearSearch();
            }}
            searchResults={searchResults}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
          />
        </div>

        {/* Messages - Scrollable middle area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <MessagesArea
            messages={searchResults.length > 0 ? searchResults : messages}
            loading={messagesLoading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            currentUserId={user?.uid}
            onReply={setReplyTo}
            onEdit={setEditingMessage}
            onDelete={deleteMessage}
            onPin={togglePin}
            onReaction={handleReaction}
            onStar={handleStarMessage}
            onForward={handleForwardMessage}
            typingUsers={typingUsers}
            scrollToMessageId={scrollToMessageId}
          />
        </div>

        {/* Input - Fixed at bottom */}
        <div className="flex-shrink-0">
          <MessageInput
            onSend={handleSendMessage}
            onTyping={setTyping}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editingMessage={editingMessage}
            onCancelEdit={() => setEditingMessage(null)}
            onSendEdit={handleEditMessage}
            disabled={uploading}
          />
        </div>

        {/* Pinned Messages Panel */}
        <AnimatePresence>
          {showPinnedPanel && (
            <PinnedMessagesPanel
              chatId={activeChat.id}
              onClose={() => setShowPinnedPanel(false)}
              onScrollTo={(id) => {
                setScrollToMessageId(id);
                setShowPinnedPanel(false);
                setTimeout(() => setScrollToMessageId(null), 100);
              }}
            />
          )}
        </AnimatePresence>

        {/* Starred Messages Panel */}
        <AnimatePresence>
          {showStarredPanel && (
            <StarredMessagesPanel
              chatId={activeChat.id}
              onClose={() => setShowStarredPanel(false)}
              onScrollTo={(id) => {
                setScrollToMessageId(id);
                setShowStarredPanel(false);
                setTimeout(() => setScrollToMessageId(null), 100);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };

  // If no user, show error
  if (!user) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Accesso Richiesto</h2>
          <p className="text-slate-400">Devi effettuare l'accesso per usare la chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-slate-900 overflow-hidden">
      {/* Profile Check Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileCheckModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onSave={handleProfileSave}
          />
        )}
      </AnimatePresence>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <NewChatModal
            isOpen={showNewChatModal}
            onClose={() => setShowNewChatModal(false)}
            onCreate={handleNewChat}
            currentUserRole={currentUserRole}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            {/* Sidebar */}
            <div className="w-80 lg:w-96 flex-shrink-0 border-r border-slate-700/50 flex flex-col bg-slate-800/30">
              <ChatSidebar
                chats={chats.filter(c => !c.deletedBy?.includes(user?.uid))}
                loading={chatsLoading}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onNewChat={() => setShowNewChatModal(true)}
                onGlobalSearch={() => setShowGlobalSearch(true)}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentUserId={user?.uid}
                onArchiveChat={handleArchiveChat}
                onPinChat={handlePinChat}
                onDeleteChat={handleDeleteChat}
                onMarkReadChat={handleMarkReadChat}
              />
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {renderChatArea()}
            </div>
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {showMobileChat ? (
                <motion.div
                  key="chat"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {renderChatArea()}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <ChatSidebar
                    chats={chats.filter(c => !c.deletedBy?.includes(user?.uid))}
                    loading={chatsLoading}
                    activeChat={activeChat}
                    onSelectChat={handleSelectChat}
                    onNewChat={() => setShowNewChatModal(true)}
                    onGlobalSearch={() => setShowGlobalSearch(true)}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    currentUserId={user?.uid}
                    onArchiveChat={handleArchiveChat}
                    onPinChat={handlePinChat}
                    onDeleteChat={handleDeleteChat}
                    onMarkReadChat={handleMarkReadChat}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Forward Message Modal */}
      <AnimatePresence>
        {showForwardModal && messageToForward && (
          <ForwardMessageModal
            message={messageToForward}
            chats={chats}
            onForward={executeForward}
            onClose={() => {
              setShowForwardModal(false);
              setMessageToForward(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Global Search Modal */}
      <AnimatePresence>
        {showGlobalSearch && (
          <GlobalSearchModal
            chats={chats}
            onClose={() => setShowGlobalSearch(false)}
            onSelectMessage={handleGlobalSearchSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
