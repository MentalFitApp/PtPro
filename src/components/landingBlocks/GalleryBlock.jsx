import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Gallery Block - Galleria immagini/trasformazioni
 * Varianti: grid, masonry, carousel
 */
const GalleryBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'grid',
    title = '',
    subtitle = '',
    columns = 3,
    items = [],
    showCaptions = true,
    lightbox = true,
    backgroundColor = 'bg-slate-900',
  } = settings || {};

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index) => {
    if (lightbox && !isPreview) {
      setCurrentIndex(index);
      setLightboxOpen(true);
    }
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  const ImageCard = ({ item, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onClick={() => openLightbox(index)}
      className={`relative group overflow-hidden rounded-xl ${lightbox ? 'cursor-pointer' : ''}`}
    >
      <img
        src={item.src || item.url}
        alt={item.caption || `Image ${index + 1}`}
        className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
      />
      {showCaptions && item.caption && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <p className="text-white text-sm">{item.caption}</p>
        </div>
      )}
    </motion.div>
  );

  // Variante Carousel
  if (variant === 'carousel') {
    return (
      <section className={`${backgroundColor} py-20`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {(title || subtitle) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              {title && (
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  {subtitle}
                </p>
              )}
            </motion.div>
          )}

          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {items.map((item, index) => (
                  <div key={index} className="flex-shrink-0 w-full">
                    <img
                      src={item.src || item.url}
                      alt={item.caption || `Image ${index + 1}`}
                      className="w-full h-[500px] object-cover"
                    />
                    {showCaptions && item.caption && (
                      <p className="text-center text-slate-400 mt-4">{item.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {items.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="flex justify-center gap-2 mt-6">
                  {items.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentIndex
                          ? 'bg-sky-500 w-8'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <img
                src={items[currentIndex]?.src || items[currentIndex]?.url}
                alt={items[currentIndex]?.caption}
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {items.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  }

  // Variante Masonry
  if (variant === 'masonry') {
    return (
      <section className={`${backgroundColor} py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(title || subtitle) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              {title && (
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  {subtitle}
                </p>
              )}
            </motion.div>
          )}

          <div className={`columns-1 ${gridCols[columns]} gap-4`}>
            {items.map((item, index) => (
              <div key={index} className="break-inside-avoid mb-4">
                <ImageCard item={item} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <img
                src={items[currentIndex]?.src || items[currentIndex]?.url}
                alt={items[currentIndex]?.caption}
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  }

  // Default: Grid
  return (
    <section className={`${backgroundColor} py-20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
          {items.map((item, index) => (
            <ImageCard key={index} item={item} index={index} />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={items[currentIndex]?.src || items[currentIndex]?.url}
              alt={items[currentIndex]?.caption}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {items.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GalleryBlock;
