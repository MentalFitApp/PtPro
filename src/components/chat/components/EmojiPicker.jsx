import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';

const cn = (...classes) => clsx(...classes);

const EMOJI_CATEGORIES = {
  'Frecenti': ['😀', '😂', '❤️', '👍', '🔥', '😍', '🎉', '💪'],
  'Faccine': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '😈', '💀', '💩', '🤡', '👻', '👽', '🤖'],
  'Gesti': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪'],
  'Cuori': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Sport': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂'],
  'Cibo': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🌮', '🌯', '🫔', '🥙'],
};

const EmojiPicker = ({ onSelect, onClose, inline = false }) => {
  const [activeCategory, setActiveCategory] = useState('Frecenti');
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    if (inline) return; // Non serve click outside per inline
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, inline]);

  const filteredEmojis = useMemo(() => {
    if (!searchTerm) return EMOJI_CATEGORIES[activeCategory] || [];
    const term = searchTerm.toLowerCase();
    return Object.values(EMOJI_CATEGORIES).flat().filter(emoji => 
      emoji.includes(term)
    );
  }, [activeCategory, searchTerm]);

  const content = (
    <>
      {/* Categories - compatte per inline */}
      {!searchTerm && (
        <div className={cn(
          "flex gap-1.5 overflow-x-auto scrollbar-hide",
          inline ? "pb-2" : "p-3 border-b border-white/10"
        )}>
          {Object.keys(EMOJI_CATEGORIES).map(category => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                activeCategory === category 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/40" 
                  : "text-slate-400 hover:bg-white/10"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      )}

      {/* Emojis Grid */}
      <div className={cn(
        "overflow-y-auto",
        inline ? "max-h-32" : "flex-1 p-3"
      )}>
        <div className={cn(
          "grid gap-1",
          inline ? "grid-cols-10" : "grid-cols-8"
        )}>
          {filteredEmojis.map((emoji, i) => (
            <motion.button
              key={`${emoji}-${i}`}
              onClick={() => {
                onSelect(emoji);
                if (!inline) onClose();
              }}
              className={cn(
                "flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors cursor-pointer",
                inline ? "w-7 h-7 text-lg" : "w-9 h-9 text-2xl"
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
        {filteredEmojis.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-2">Nessun emoji trovato</p>
        )}
      </div>
    </>
  );

  if (inline) {
    return (
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-xl">
        {content}
      </div>
    );
  }

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute bottom-full left-0 mb-2 bg-slate-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 
                 w-80 max-h-96 flex flex-col overflow-hidden z-50"
    >
      {/* Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca emoji..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-700/60 backdrop-blur-xl rounded-xl text-sm text-white 
                       placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-white/10 shadow-lg"
          />
        </div>
      </div>

      {content}
    </motion.div>
  );
};

export default EmojiPicker;
