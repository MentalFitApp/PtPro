import React from 'react';
import { motion } from 'framer-motion';

/**
 * Features Block - Griglia di caratteristiche/benefici
 * Varianti: grid, list, alternating
 * Supporta icone emoji o immagini personalizzate (PNG, JPG, SVG, etc.)
 */
const FeaturesBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'grid',
    title = 'Perché scegliere noi',
    subtitle = '',
    columns = 3,
    items = [],
    backgroundColor = 'bg-slate-900',
    cardStyle = 'glass', // glass, solid, outline
  } = settings || {};

  // Helper per renderizzare l'icona (emoji o immagine)
  const renderIcon = (item, size = 'normal') => {
    const sizeClasses = {
      normal: 'w-14 h-14 text-2xl',
      large: 'w-20 h-20 text-4xl',
      huge: 'text-8xl',
    };
    
    if (item.iconType === 'image' && item.iconImage) {
      return (
        <img 
          src={item.iconImage} 
          alt={item.title || 'Feature icon'} 
          className={`${size === 'huge' ? 'w-32 h-32' : size === 'large' ? 'w-16 h-16' : 'w-10 h-10'} object-contain`}
        />
      );
    }
    return <span className={size === 'huge' ? 'opacity-50' : ''}>{item.icon}</span>;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getCardClasses = () => {
    const base = 'rounded-2xl p-6 transition-all duration-300';
    switch (cardStyle) {
      case 'glass':
        return `${base} bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-sky-500/30`;
      case 'solid':
        return `${base} bg-slate-800 hover:bg-slate-700`;
      case 'outline':
        return `${base} border-2 border-slate-700 hover:border-sky-500`;
      default:
        return `${base} bg-white/5 backdrop-blur-sm border border-white/10`;
    }
  };

  const gridCols = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  // Variante List
  if (variant === 'list') {
    return (
      <section className={`${backgroundColor} py-20`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {items.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`${getCardClasses()} flex items-start gap-4`}
              >
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-2xl">
                  {renderIcon(item, 'normal')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-slate-400">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  // Variante Alternating
  if (variant === 'alternating') {
    return (
      <section className={`${backgroundColor} py-20`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="space-y-24">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="w-20 h-20 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center text-4xl mb-6 border border-sky-500/30">
                    {renderIcon(item, 'large')}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-lg text-slate-400">
                    {item.description}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="aspect-video bg-gradient-to-br from-sky-500/10 to-cyan-500/10 rounded-2xl border border-white/10 flex items-center justify-center">
                    {renderIcon(item, 'huge')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={`grid grid-cols-1 md:grid-cols-2 ${gridCols[columns] || 'lg:grid-cols-3'} gap-6`}
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className={getCardClasses()}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-2xl mb-4 border border-sky-500/20">
                {renderIcon(item, 'normal')}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-slate-400">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesBlock;
