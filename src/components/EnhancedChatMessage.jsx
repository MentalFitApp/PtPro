import React from 'react';
import { motion } from 'framer-motion';
import MediaViewer from './MediaViewer';

/**
 * Enhanced Chat Message Component
 * Displays chat messages with text and optional media (images, videos, audio)
 */
export default function EnhancedChatMessage({ message, isOwn, senderName }) {
  const hasMedia = message.media && message.media.length > 0;
  const hasText = message.text && message.text.trim() !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`max-w-[75%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Sender name (only for received messages) */}
        {!isOwn && senderName && (
          <span className="text-xs text-slate-400 px-2">{senderName}</span>
        )}

        {/* Message bubble */}
        <div className={`rounded-2xl p-3 ${
          isOwn 
            ? 'bg-gradient-to-br from-rose-600 to-rose-700 text-white' 
            : 'bg-slate-700 text-slate-100'
        } ${!hasText && hasMedia ? 'p-1' : ''}`}>
          
          {/* Text content */}
          {hasText && (
            <p className="text-sm sm:text-base break-words whitespace-pre-wrap">
              {message.text}
            </p>
          )}

          {/* Media content */}
          {hasMedia && (
            <div className={`${hasText ? 'mt-2' : ''} space-y-2`}>
              {message.media.map((mediaItem, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  <MediaViewer 
                    url={mediaItem.url} 
                    type={mediaItem.type}
                    duration={mediaItem.duration}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-slate-500 px-2">
          {message.createdAt?.toDate?.().toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) || 'Ora'}
        </span>
      </div>
    </motion.div>
  );
}
