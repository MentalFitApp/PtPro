import React from 'react';
import { motion } from 'framer-motion';

/**
 * Video Block - Sezione video embed
 * Varianti: featured, background, inline
 */
const VideoBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'featured',
    title = '',
    subtitle = '',
    videoUrl = '',
    thumbnailUrl = '',
    autoplay = false,
    muted = true,
    loop = false,
    showControls = true,
    aspectRatio = '16/9',
    backgroundColor = 'bg-slate-800',
    // Advanced styling
    showGlow = true,
    glowColor = '#0ea5e9',
    borderRadius = '16px',
    maxWidth = '900px',
    padding = 'py-20',
  } = settings || {};

  // Parse video URL per embed
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        mute: muted ? '1' : '0',
        loop: loop ? '1' : '0',
        controls: showControls ? '1' : '0',
        rel: '0',
      });
      return `https://www.youtube.com/embed/${ytMatch[1]}?${params.toString()}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        muted: muted ? '1' : '0',
        loop: loop ? '1' : '0',
      });
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?${params.toString()}`;
    }
    
    // Direct video URL
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = videoUrl && !videoUrl.includes('youtube') && !videoUrl.includes('vimeo');

  // Variante Background (video a tutto schermo come sfondo)
  if (variant === 'background') {
    return (
      <section className="relative h-screen overflow-hidden">
        {isDirectVideo ? (
          <video
            src={videoUrl}
            autoPlay={autoplay}
            muted={muted}
            loop={loop}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : null}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4">
            {title && (
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-bold text-white mb-4"
              >
                {title}
              </motion.h2>
            )}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-white/80"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Variante Inline (semplice)
  if (variant === 'inline') {
    return (
      <section className={`${backgroundColor} py-12`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ aspectRatio }}
          >
            {isDirectVideo ? (
              <video
                src={videoUrl}
                poster={thumbnailUrl}
                controls={showControls}
                autoPlay={autoplay}
                muted={muted}
                loop={loop}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
                <span className="text-6xl">🎬</span>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Default: Featured (con titolo e decorazioni)
  return (
    <section className={`${backgroundColor} ${padding}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth }}>
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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Decorative glow */}
          {showGlow && (
            <div 
              className="absolute -inset-4 rounded-3xl blur-xl opacity-30"
              style={{ background: `linear-gradient(135deg, ${glowColor}, ${glowColor}80)` }}
            />
          )}
          
          <div 
            className="relative overflow-hidden shadow-2xl border border-white/10"
            style={{ aspectRatio, borderRadius }}
          >
            {isDirectVideo ? (
              <video
                src={videoUrl}
                poster={thumbnailUrl}
                controls={showControls}
                autoPlay={autoplay}
                muted={muted}
                loop={loop}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center">
                <span className="text-8xl mb-4">🎬</span>
                <p className="text-slate-400">Aggiungi un URL video</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoBlock;
