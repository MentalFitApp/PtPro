import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * FAQ Block - Accordion di domande frequenti
 * Varianti: accordion, grid, tabs
 */
const FAQBlock = ({ settings, isPreview = false }) => {
  const {
    variant = 'accordion',
    title = 'Domande Frequenti',
    subtitle = '',
    items = [],
    openFirst = true,
    backgroundColor = 'bg-slate-900',
  } = settings || {};

  const [openIndex, setOpenIndex] = useState(openFirst ? 0 : null);
  const [activeTab, setActiveTab] = useState(0);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Variante Grid (cards statiche)
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-sky-500/30 transition-all"
              >
                <h3 className="text-lg font-semibold text-white mb-3">
                  {item.question}
                </h3>
                <p className="text-slate-400">
                  {item.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Variante Tabs
  if (variant === 'tabs') {
    return (
      <section className={`${backgroundColor} py-20`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Tabs navigation */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === index
                    ? 'bg-sky-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {item.question.length > 30 
                  ? `Domanda ${index + 1}` 
                  : item.question.substring(0, 25) + (item.question.length > 25 ? '...' : '')
                }
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                {items[activeTab]?.question}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {items[activeTab]?.answer}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    );
  }

  // Default: Accordion
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
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-lg font-medium text-white pr-4">
                  {item.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-4 text-slate-300 border-t border-white/10 pt-4">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQBlock;
