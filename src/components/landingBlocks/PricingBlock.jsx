import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * Pricing Block - Tabelle prezzi
 * Varianti: cards, comparison, simple
 */
const PricingBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'cards',
    title = 'Scegli il tuo piano',
    subtitle = '',
    items = [],
    showComparison = false,
    backgroundColor = 'bg-slate-900',
  } = settings || {};

  const scrollToElement = (e, href) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }
    if (href?.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Variante Simple (lista compatta)
  if (variant === 'simple') {
    return (
      <section className={`${backgroundColor} py-20`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <p className="text-lg text-slate-400">
                  {subtitle}
                </p>
              )}
            </motion.div>
          )}

          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-6 rounded-xl ${
                  item.highlighted 
                    ? 'bg-gradient-to-r from-sky-500/20 to-cyan-500/20 border border-sky-500/30' 
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">
                      {item.currency}{item.price}
                    </span>
                    <span className="text-slate-400">{item.period}</span>
                  </div>
                  <a
                    href={item.ctaLink}
                    onClick={(e) => scrollToElement(e, item.ctaLink)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      item.highlighted
                        ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-sky-500/30'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {item.ctaText || 'Scegli'}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Variante Comparison (tabella comparativa)
  if (variant === 'comparison') {
    const allFeatures = [...new Set(items.flatMap(item => item.features || []))];
    
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
                <p className="text-lg text-slate-400">
                  {subtitle}
                </p>
              )}
            </motion.div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4"></th>
                  {items.map((item, index) => (
                    <th key={index} className="p-4 text-center">
                      <div className={`p-6 rounded-t-xl ${
                        item.highlighted 
                          ? 'bg-gradient-to-b from-sky-500/20 to-transparent border-t border-x border-sky-500/30' 
                          : 'bg-white/5'
                      }`}>
                        {item.badge && (
                          <span className="inline-block px-3 py-1 text-xs font-medium bg-sky-500 text-white rounded-full mb-2">
                            {item.badge}
                          </span>
                        )}
                        <h3 className="text-xl font-bold text-white">{item.name}</h3>
                        <div className="mt-2">
                          <span className="text-3xl font-bold text-white">{item.currency}{item.price}</span>
                          <span className="text-slate-400">{item.period}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, fIndex) => (
                  <tr key={fIndex} className="border-t border-white/10">
                    <td className="p-4 text-slate-300">{feature}</td>
                    {items.map((item, index) => (
                      <td key={index} className="p-4 text-center">
                        {(item.features || []).includes(feature) ? (
                          <Check className="w-6 h-6 text-sky-400 mx-auto" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-white/10">
                  <td></td>
                  {items.map((item, index) => (
                    <td key={index} className="p-4 text-center">
                      <a
                        href={item.ctaLink}
                        onClick={(e) => scrollToElement(e, item.ctaLink)}
                        className={`inline-block px-6 py-3 rounded-xl font-semibold transition-all ${
                          item.highlighted
                            ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-sky-500/30'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                      >
                        {item.ctaText || 'Scegli'}
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  // Default: Cards
  return (
    <section id="pricing" className={`${backgroundColor} py-20`}>
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

        <div className={`grid grid-cols-1 md:grid-cols-2 ${items.length >= 3 ? 'lg:grid-cols-3' : ''} gap-8`}>
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                item.highlighted
                  ? 'bg-gradient-to-b from-sky-500/20 to-cyan-500/10 border-2 border-sky-500/50 scale-105'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {item.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-cyan-400 text-white text-sm font-semibold rounded-full">
                    {item.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-slate-400">{item.description}</p>
                )}
              </div>

              <div className="text-center mb-8">
                <span className="text-4xl md:text-5xl font-bold text-white">
                  {item.currency}{item.price}
                </span>
                <span className="text-slate-400">{item.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {(item.features || []).map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={item.ctaLink}
                onClick={(e) => scrollToElement(e, item.ctaLink)}
                className={`block w-full py-4 px-6 rounded-xl font-semibold text-center transition-all ${
                  item.highlighted
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-sky-500/30 transform hover:-translate-y-0.5'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {item.ctaText || 'Scegli questo piano'}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingBlock;
