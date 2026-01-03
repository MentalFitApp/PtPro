import React from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

/**
 * Text Block - Contenuto testuale libero
 * Varianti: standard, quote, highlight
 */
const TextBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'standard',
    content = '<p>Il tuo contenuto qui...</p>',
    textAlign = 'left',
    maxWidth = 'max-w-4xl',
    backgroundColor = 'bg-transparent',
    padding = 'py-12',
  } = settings || {};

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Variante Quote
  if (variant === 'quote') {
    return (
      <section className={`${backgroundColor} ${padding}`}>
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

  // Variante Highlight
  if (variant === 'highlight') {
    return (
      <section className={`${backgroundColor} ${padding}`}>
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border-l-4 border-sky-500 rounded-r-xl p-6 md:p-8"
          >
            <div 
              className={`prose prose-invert prose-lg max-w-none ${alignClass[textAlign]}`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          </motion.div>
        </div>
      </section>
    );
  }

  // Default: Standard
  return (
    <section className={`${backgroundColor} ${padding}`}>
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
