// src/components/EmojiPicker.jsx
import React from 'react';

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '💪', '🦵', '🦶', '👂', '👃', '🧠', '🦷', '🦴', '👀'],
  emotions: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'],
  food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙']
};

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = React.useState('smileys');

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 w-72 z-50">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1 overflow-x-auto">
          {Object.keys(EMOJI_CATEGORIES).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                activeCategory === category
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded text-slate-400"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            className="text-2xl hover:bg-slate-700 rounded p-1 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
