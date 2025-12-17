import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function PhotoZoomModal({ isOpen, onClose, imageUrl, alt }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9 }} 
            animate={{ scale: 1 }} 
            exit={{ scale: 0.9 }} 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl max-h-full"
          >
            <img 
              src={imageUrl} 
              alt={alt} 
              className="w-full h-auto max-h-screen object-contain rounded-lg shadow-2xl" 
            />
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-4 left-4 text-white bg-black/60 px-3 py-1 rounded text-sm">
              {alt}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
