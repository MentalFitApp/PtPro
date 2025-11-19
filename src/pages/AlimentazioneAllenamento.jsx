import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Apple, Dumbbell, ChevronRight, UserPlus, Clock, AlertTriangle } from 'lucide-react';
import ListaClientiAllenamento from '../components/ListaClientiAllenamento';
import ListaAlimenti from '../components/ListaAlimenti';
import ListaEsercizi from '../components/ListaEsercizi';
import { db, toDate } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AlimentazioneAllenamento = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [clientStats, setClientStats] = useState({
    nuovi: 0,
    alimentazioneScade: 0,
    allenamentoScade: 0,
    scaduti: 0
  });

  useEffect(() => {
    loadClientStats();
  }, []);

  const loadClientStats = async () => {
    try {
      const clientsRef = collection(db, 'clients');
      const snapshot = await getDocs(clientsRef);
      
      let nuovi = 0, alimentazioneScade = 0, allenamentoScade = 0, scaduti = 0;
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt || data.startDate;
        
        // Check if new client (last 7 days without cards)
        if (createdAt) {
          const createdDate = toDate(createdAt);
          if (createdDate) {
            const daysSince = Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24));
            if (daysSince <= 7 && !data.schedaAllenamento?.scadenza && !data.schedaAlimentazione?.scadenza) {
              nuovi++;
            }
          }
        }

        // Check nutrition expiry
        if (data.schedaAlimentazione?.scadenza) {
          const scadenza = new Date(toDate(data.schedaAlimentazione.scadenza));
          scadenza.setHours(0, 0, 0, 0);
          const days = Math.ceil((scadenza - now) / (1000 * 60 * 60 * 24));
          if (days >= 0 && days <= 7) alimentazioneScade++;
          if (days < 0) scaduti++;
        }

        // Check workout expiry
        if (data.schedaAllenamento?.scadenza) {
          const scadenza = new Date(toDate(data.schedaAllenamento.scadenza));
          scadenza.setHours(0, 0, 0, 0);
          const days = Math.ceil((scadenza - now) / (1000 * 60 * 60 * 24));
          if (days >= 0 && days <= 7) allenamentoScade++;
          if (days < 0 && !data.schedaAlimentazione?.scadenza) scaduti++; // Only count once
        }
      });

      setClientStats({ nuovi, alimentazioneScade, allenamentoScade, scaduti });
    } catch (error) {
      console.error('Error loading client stats:', error);
    }
  };

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

  const filterBoxes = [
    {
      id: 'nuovi',
      title: 'Nuovi Clienti',
      count: clientStats.nuovi,
      description: 'Ultimi 7 giorni senza schede',
      icon: <UserPlus size={24} />,
      color: 'blue',
      filter: 'nuovi'
    },
    {
      id: 'alimentazione-scade',
      title: 'Alimentazione in Scadenza',
      count: clientStats.alimentazioneScade,
      description: 'Scadono entro 7 giorni',
      icon: <Clock size={24} />,
      color: 'yellow',
      filter: 'alimentazione_scade'
    },
    {
      id: 'allenamento-scade',
      title: 'Allenamento in Scadenza',
      count: clientStats.allenamentoScade,
      description: 'Scadono entro 7 giorni',
      icon: <Clock size={24} />,
      color: 'yellow',
      filter: 'allenamento_scade'
    },
    {
      id: 'scaduti',
      title: 'Schede Scadute',
      count: clientStats.scaduti,
      description: 'Richiedono rinnovo urgente',
      icon: <AlertTriangle size={24} />,
      color: 'red',
      filter: 'scaduti'
    }
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleFilterClick = (filter) => {
    setSelectedFilter(filter);
    setActiveSection('clienti');
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

        {/* Filter Boxes - Client Status Overview */}
        {!activeSection && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-slate-100 mb-4">Stato Clienti</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filterBoxes.map((box, index) => (
                  <motion.button
                    key={box.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleFilterClick(box.filter)}
                    className={`group relative p-6 rounded-xl border transition-all duration-300 hover:scale-105 text-left
                      ${box.color === 'blue' ? 'bg-blue-900/10 border-blue-600/30 hover:bg-blue-900/20 hover:border-blue-500/50' : ''}
                      ${box.color === 'yellow' ? 'bg-yellow-900/10 border-yellow-600/30 hover:bg-yellow-900/20 hover:border-yellow-500/50' : ''}
                      ${box.color === 'red' ? 'bg-red-900/10 border-red-600/30 hover:bg-red-900/20 hover:border-red-500/50' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`
                        ${box.color === 'blue' ? 'text-blue-400' : ''}
                        ${box.color === 'yellow' ? 'text-yellow-400' : ''}
                        ${box.color === 'red' ? 'text-red-400' : ''}
                      `}>
                        {box.icon}
                      </div>
                      <span className={`text-3xl font-bold
                        ${box.color === 'blue' ? 'text-blue-300' : ''}
                        ${box.color === 'yellow' ? 'text-yellow-300' : ''}
                        ${box.color === 'red' ? 'text-red-300' : ''}
                      `}>
                        {box.count}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mb-1">
                      {box.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {box.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Main Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, index) => (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
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
          </>
        )}

        {/* Content Area - Will be loaded based on active section */}
        {activeSection === 'clienti' && (
          <ListaClientiAllenamento 
            onBack={() => {
              setActiveSection(null);
              setSelectedFilter(null);
            }} 
            initialFilter={selectedFilter}
          />
        )}

        {activeSection === 'alimenti' && (
          <ListaAlimenti onBack={() => setActiveSection(null)} />
        )}

        {activeSection === 'esercizi' && (
          <ListaEsercizi onBack={() => setActiveSection(null)} />
        )}
      </div>
    </div>
  );
};

export default AlimentazioneAllenamento;
