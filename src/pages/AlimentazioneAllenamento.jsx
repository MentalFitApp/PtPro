import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Apple, Dumbbell, ChevronRight } from 'lucide-react';

const AlimentazioneAllenamento = () => {
  const [activeSection, setActiveSection] = useState(null);

  const sections = [
    {
      id: 'clienti',
      title: 'Lista Clienti',
      description: 'Gestisci le schede di allenamento e alimentazione dei tuoi clienti',
      icon: <Users size={32} />,
      color: 'rose',
    },
    {
      id: 'alimenti',
      title: 'Lista Alimenti',
      description: 'Database completo di alimenti con valori nutrizionali',
      icon: <Apple size={32} />,
      color: 'emerald',
    },
    {
      id: 'esercizi',
      title: 'Lista Esercizi',
      description: 'Catalogo esercizi con attrezzi e gruppi muscolari',
      icon: <Dumbbell size={32} />,
      color: 'blue',
    },
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">
            Alimentazione e Allenamento
          </h1>
          <p className="text-slate-400">
            Gestisci schede, alimenti ed esercizi in un'unica sezione
          </p>
        </motion.div>

        {/* Main Sections Grid */}
        {!activeSection && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSectionClick(section.id)}
                className={`group relative p-8 rounded-2xl border transition-all duration-300 hover:scale-105 text-left
                  ${section.color === 'rose' ? 'bg-rose-900/10 border-rose-600/30 hover:bg-rose-900/20 hover:border-rose-500/50' : ''}
                  ${section.color === 'emerald' ? 'bg-emerald-900/10 border-emerald-600/30 hover:bg-emerald-900/20 hover:border-emerald-500/50' : ''}
                  ${section.color === 'blue' ? 'bg-blue-900/10 border-blue-600/30 hover:bg-blue-900/20 hover:border-blue-500/50' : ''}
                `}
              >
                <div className={`mb-4 
                  ${section.color === 'rose' ? 'text-rose-400' : ''}
                  ${section.color === 'emerald' ? 'text-emerald-400' : ''}
                  ${section.color === 'blue' ? 'text-blue-400' : ''}
                `}>
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">
                  {section.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {section.description}
                </p>
                <div className="flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform
                  ${section.color === 'rose' ? 'text-rose-400' : ''}
                  ${section.color === 'emerald' ? 'text-emerald-400' : ''}
                  ${section.color === 'blue' ? 'text-blue-400' : ''}
                ">
                  Apri <ChevronRight size={16} className="ml-1" />
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Content Area - Will be loaded based on active section */}
        {activeSection === 'clienti' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6"
          >
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Torna indietro
            </button>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Lista Clienti</h2>
            <p className="text-slate-400">Sezione in sviluppo...</p>
          </motion.div>
        )}

        {activeSection === 'alimenti' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6"
          >
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Torna indietro
            </button>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Lista Alimenti</h2>
            <p className="text-slate-400">Sezione in sviluppo...</p>
          </motion.div>
        )}

        {activeSection === 'esercizi' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6"
          >
            <button
              onClick={() => setActiveSection(null)}
              className="mb-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Torna indietro
            </button>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Lista Esercizi</h2>
            <p className="text-slate-400">Sezione in sviluppo...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AlimentazioneAllenamento;
