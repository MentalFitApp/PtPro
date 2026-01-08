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
          "flex gap-1 overflow-x-auto scrollbar-hide",
          inline ? "pb-2" : "p-2 border-b border-slate-700"
        )}>
          {Object.keys(EMOJI_CATEGORIES).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === category 
                  ? "bg-cyan-500 text-white" 
                  : "text-slate-400 hover:bg-slate-700"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Emojis Grid */}
      <div className={cn(
        "overflow-y-auto",
        inline ? "max-h-32" : "flex-1 p-2"
      )}>
        <div className={cn(
          "grid gap-0.5",
          inline ? "grid-cols-10" : "grid-cols-8"
        )}>
          {filteredEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => {
                onSelect(emoji);
                if (!inline) onClose();
              }}
              className={cn(
                "flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors cursor-pointer",
                inline ? "w-7 h-7 text-lg" : "w-8 h-8 text-xl"
              )}
            >
              {emoji}
            </button>
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
      <div className="bg-slate-800/80 rounded-xl p-2 border border-white/10">
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

      {content}
    </motion.div>
  );
};

export default EmojiPicker;
