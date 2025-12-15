import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

/**
 * Testimonials Block - Recensioni e testimonianze
 * Varianti: carousel, grid, masonry
 */
const TestimonialsBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'carousel',
    title = 'Cosa dicono i nostri clienti',
    subtitle = '',
    items = [],
    showRating = true,
    autoplay = true,
    backgroundColor = 'bg-slate-800',
  } = settings || {};

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Auto-play effect
  React.useEffect(() => {
    if (autoplay && variant === 'carousel' && items.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay, variant, items.length]);

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const TestimonialCard = ({ item, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-sky-500/30 transition-all duration-300"
    >
      {showRating && (
        <div className="mb-4">
          {renderStars(item.rating || 5)}
        </div>
      )}
      <p className="text-slate-300 mb-6 italic">
        "{item.text}"
      </p>
      <div className="flex items-center gap-4">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
            {item.name?.charAt(0) || 'U'}
          </div>
        )}
        <div>
          <h4 className="font-semibold text-white">{item.name}</h4>
          {item.role && (
            <p className="text-sm text-slate-400">{item.role}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Variante Grid
  if (variant === 'grid') {
    return (
      <section className={`${backgroundColor} py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(title || subtitle) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <TestimonialCard key={index} item={item} index={index} />
            ))}
          </div>
        </div>
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
              className="text-center mb-16"
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

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {items.map((item, index) => (
              <div key={index} className="break-inside-avoid">
                <TestimonialCard item={item} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: Carousel
  return (
    <section className={`${backgroundColor} py-20`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
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
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12"
              >
                {showRating && items[currentIndex] && (
                  <div className="flex justify-center mb-6">
                    {renderStars(items[currentIndex]?.rating || 5)}
                  </div>
                )}
                <p className="text-xl md:text-2xl text-slate-200 text-center mb-8 italic">
                  "{items[currentIndex]?.text}"
                </p>
                <div className="flex flex-col items-center">
                  {items[currentIndex]?.image ? (
                    <img 
                      src={items[currentIndex].image} 
                      alt={items[currentIndex]?.name}
                      className="w-16 h-16 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white text-xl font-semibold mb-4">
                      {items[currentIndex]?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <h4 className="font-semibold text-white text-lg">
                    {items[currentIndex]?.name}
                  </h4>
                  {items[currentIndex]?.role && (
                    <p className="text-slate-400">
                      {items[currentIndex].role}
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots indicator */}
          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-sky-500 w-8'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsBlock;
