import React from 'react';
import { motion } from 'framer-motion';

/**
 * Social Proof Block - Statistiche, loghi, badge
 * Varianti: logos, stats, badges
 */
const SocialProofBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'stats',
    title = '',
    items = [],
    logos = [],
    backgroundColor = 'bg-slate-800/50',
  } = settings || {};

  // Variante Logos
  if (variant === 'logos') {
    return (
      <section className={`${backgroundColor} py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {title && (
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-slate-400 mb-8"
            >
              {title}
            </motion.p>
          )}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {logos.map((logo, index) => (
              <motion.img
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                src={logo}
                alt={`Partner ${index + 1}`}
                className="h-8 md:h-12 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Variante Badges
  if (variant === 'badges') {
    return (
      <section className={`${backgroundColor} py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {title && (
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-slate-400 mb-8"
            >
              {title}
            </motion.p>
          )}
          <div className="flex flex-wrap justify-center gap-4">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full"
              >
                {item.icon && <span className="text-xl">{item.icon}</span>}
                <span className="text-white font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: Stats
  return (
    <section className={`${backgroundColor} py-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-slate-400 mb-8"
          >
            {title}
          </motion.p>
        )}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {items.filter(item => item.type === 'stat').map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {item.value}
              </div>
              <div className="text-sm text-slate-400">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofBlock;
