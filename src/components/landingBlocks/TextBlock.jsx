import React from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

/**
 * Text Block - Contenuto testuale libero
 * Varianti: standard, quote, highlight, callout
 */
const TextBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'standard',
    content = '<p>Il tuo contenuto qui...</p>',
    textAlign = 'left',
    maxWidth = 'max-w-4xl',
    backgroundColor = 'bg-transparent',
    padding = 'py-12',
    borderColor = '#0ea5e9',
    borderLeft = false,
    borderRadius = '12px',
    marginTop = '0px',
  } = settings || {};

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Variante Quote
  if (variant === 'quote') {
    return (
      <section className={`${backgroundColor} ${padding}`} style={{ marginTop }}>
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-6 -left-4 text-8xl text-sky-500/20 font-serif">"</div>
            <div 
              className={`text-2xl md:text-3xl text-white italic leading-relaxed ${alignClass[textAlign]}`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
            <div className="absolute -bottom-6 -right-4 text-8xl text-sky-500/20 font-serif rotate-180">"</div>
          </motion.blockquote>
        </div>
      </section>
    );
  }

  // Variante Highlight - Box colorato con bordo
  if (variant === 'highlight') {
    return (
      <section className={`${backgroundColor} ${padding}`} style={{ marginTop }}>
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-white/10"
            style={{ 
              background: backgroundColor.includes('gradient') ? undefined : 'rgba(255,255,255,0.03)',
              borderRadius,
              borderColor: `${borderColor}40`,
            }}
          >
            <div 
              className={`prose prose-invert prose-lg max-w-none ${alignClass[textAlign]} p-6 md:p-8`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          </motion.div>
        </div>
      </section>
    );
  }

  // Variante Callout - Box con bordo sinistro evidenziato
  if (variant === 'callout') {
    return (
      <section className={`bg-transparent ${padding}`} style={{ marginTop }}>
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`${backgroundColor} rounded-xl relative overflow-hidden`}
            style={{ borderRadius }}
          >
            {borderLeft && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: borderColor }}
              />
            )}
            <div 
              className={`prose prose-invert prose-lg max-w-none ${alignClass[textAlign]} p-6 md:p-8 ${borderLeft ? 'pl-8' : ''}`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          </motion.div>
        </div>
      </section>
    );
  }

  // Default: Standard
  return (
    <section className={`${backgroundColor} ${padding}`} style={{ marginTop }}>
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`prose prose-invert prose-lg max-w-none ${alignClass[textAlign]}`}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      </div>
    </section>
  );
};

export default TextBlock;
