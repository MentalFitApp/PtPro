import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Apple, Dumbbell, ChevronRight, UserPlus, Clock, AlertTriangle, 
  BarChart3, Sparkles, ArrowRight, TrendingUp
} from 'lucide-react';
import ListaClientiAllenamento from '../../components/ListaClientiAllenamento';
import ListaAlimenti from '../../components/ListaAlimenti';
import ListaEsercizi from '../../components/ListaEsercizi';
import FoodAnalytics from './FoodAnalytics';
import { db, toDate } from '../../firebase'
import { getTenantCollection } from '../../config/tenant';
import { getDocs } from 'firebase/firestore';

// === NEBULA COLOR CONFIG ===
const nebulaColors = {
  cyan: {
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30',
    borderHover: 'hover:border-cyan-400/50',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    bg: 'bg-cyan-500/10',
  },
  blue: {
    gradient: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    borderHover: 'hover:border-blue-400/50',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    bg: 'bg-blue-500/10',
  },
  purple: {
    gradient: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    borderHover: 'hover:border-purple-400/50',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    bg: 'bg-purple-500/10',
  },
  emerald: {
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    borderHover: 'hover:border-emerald-400/50',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    bg: 'bg-emerald-500/10',
  },
  rose: {
    gradient: 'from-rose-500/20 to-rose-600/10',
    border: 'border-rose-500/30',
    borderHover: 'hover:border-rose-400/50',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
    bg: 'bg-rose-500/10',
  },
  amber: {
    gradient: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    borderHover: 'hover:border-amber-400/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    bg: 'bg-amber-500/10',
  },
  red: {
    gradient: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    borderHover: 'hover:border-red-400/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
    bg: 'bg-red-500/10',
  },
};

// === QUICK ACTION PILL COMPONENT ===
const QuickActionPill = ({ icon: Icon, label, count, color, onClick, isUrgent }) => {
  const colors = nebulaColors[color] || nebulaColors.cyan;
  
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-full
        bg-gradient-to-r ${colors.gradient}
        border ${colors.border} ${colors.borderHover}
        backdrop-blur-sm transition-all duration-200
        active:scale-95 touch-manipulation
        ${isUrgent ? 'animate-pulse' : ''}
      `}
    >
      <Icon size={16} className={colors.text} />
      <span className="text-xs font-medium text-slate-200 whitespace-nowrap">{label}</span>
      {count > 0 && (
        <span className={`
          min-w-[20px] h-5 flex items-center justify-center
          text-xs font-bold rounded-full px-1.5
          ${isUrgent ? 'bg-red-500 text-white' : `${colors.bg} ${colors.text}`}
        `}>
          {count}
        </span>
      )}
    </motion.button>
  );
};

// === MAIN SECTION CARD COMPONENT ===
const SectionCard = ({ section, onClick, delay }) => {
  const colors = nebulaColors[section.color] || nebulaColors.cyan;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden w-full
        bg-gradient-to-br ${colors.gradient}
        border ${colors.border} ${colors.borderHover}
        rounded-2xl p-4 
        backdrop-blur-xl transition-all duration-300
        active:scale-[0.98] touch-manipulation
        group text-left
      `}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${colors.gradient} blur-xl`} />
      
      <div className="relative z-10 flex items-center gap-4">
        {/* Icon Container */}
        <div className={`
          w-14 h-14 rounded-xl flex items-center justify-center
          bg-gradient-to-br ${colors.gradient} ${colors.border} border
          shadow-lg ${colors.glow}
        `}>
          <div className={colors.text}>
            {React.cloneElement(section.icon, { size: 26 })}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-100 mb-0.5">
            {section.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2">
            {section.description}
          </p>
        </div>
        
        {/* Arrow */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${colors.bg} ${colors.border} border
          group-hover:translate-x-1 transition-transform
        `}>
          <ArrowRight size={16} className={colors.text} />
        </div>
      </div>
    </motion.button>
  );
};

// === STAT CARD COMPONENT ===
const StatCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => {
  const colors = nebulaColors[color] || nebulaColors.cyan;
  
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-slate-900/50 backdrop-blur-xl
        border ${colors.border} ${colors.borderHover}
        rounded-xl p-3 text-left
        transition-all duration-200 active:scale-95 touch-manipulation
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
          <Icon size={16} className={colors.text} />
        </div>
        <span className={`text-2xl font-bold ${colors.text}`}>{value}</span>
      </div>
      <p className="text-xs font-medium text-slate-200 leading-tight">{title}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
    </motion.button>
  );
};

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
      const clientsRef = getTenantCollection(db, 'clients');
      const snapshot = await getDocs(clientsRef);
      
      let nuovi = 0, alimentazioneScade = 0, allenamentoScade = 0, scaduti = 0;
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt || data.startDate;
        
        if (createdAt) {
          const createdDate = toDate(createdAt);
          if (createdDate) {
            const daysSince = Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24));
            if (daysSince <= 7 && !data.schedaAllenamento?.scadenza && !data.schedaAlimentazione?.scadenza) {
              nuovi++;
            }
          }
        }

        if (data.schedaAlimentazione?.scadenza) {
          const scadenza = new Date(toDate(data.schedaAlimentazione.scadenza));
          scadenza.setHours(0, 0, 0, 0);
          const days = Math.ceil((scadenza - now) / (1000 * 60 * 60 * 24));
          if (days >= 0 && days <= 7) alimentazioneScade++;
          if (days < 0) scaduti++;
        }

        if (data.schedaAllenamento?.scadenza) {
          const scadenza = new Date(toDate(data.schedaAllenamento.scadenza));
          scadenza.setHours(0, 0, 0, 0);
          const days = Math.ceil((scadenza - now) / (1000 * 60 * 60 * 24));
          if (days >= 0 && days <= 7) allenamentoScade++;
          if (days < 0 && !data.schedaAlimentazione?.scadenza) scaduti++;
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
      title: 'Gestione Clienti',
      description: 'Crea e modifica schede allenamento e alimentazione',
      icon: <Users />,
      color: 'rose',
    },
    {
      id: 'alimenti',
      title: 'Database Alimenti',
      description: '493+ alimenti in 24 categorie',
      icon: <Apple />,
      color: 'emerald',
    },
    {
      id: 'esercizi',
      title: 'Catalogo Esercizi',
      description: 'Esercizi con GIF e gruppi muscolari',
      icon: <Dumbbell />,
      color: 'blue',
    },
    {
      id: 'analytics-food',
      title: 'Analytics',
      description: 'Statistiche uso alimenti',
      icon: <BarChart3 />,
      color: 'purple',
    },
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleFilterClick = (filter) => {
    setSelectedFilter(filter);
    setActiveSection('clienti');
  };

  const totalUrgent = clientStats.alimentazioneScade + clientStats.allenamentoScade + clientStats.scaduti;

  return (
    <div className="min-h-screen overflow-x-hidden pb-20">
      <AnimatePresence mode="wait">
        {!activeSection ? (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-4 max-w-2xl mx-auto"
          >
            {/* Header Compatto */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={20} className="text-purple-400" />
                <h1 className="text-xl font-bold text-slate-100">
                  Schede & Nutrizione
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                Gestisci programmi di allenamento e piani alimentari
              </p>
            </motion.div>

            {/* Quick Actions - Scrollable Pills */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-5 -mx-4 px-4"
            >
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <QuickActionPill
                  icon={UserPlus}
                  label="Nuovi"
                  count={clientStats.nuovi}
                  color="blue"
                  onClick={() => handleFilterClick('nuovi')}
                />
                <QuickActionPill
                  icon={Apple}
                  label="Dieta scade"
                  count={clientStats.alimentazioneScade}
                  color="amber"
                  onClick={() => handleFilterClick('alimentazione_scade')}
                  isUrgent={clientStats.alimentazioneScade > 0}
                />
                <QuickActionPill
                  icon={Dumbbell}
                  label="Scheda scade"
                  count={clientStats.allenamentoScade}
                  color="amber"
                  onClick={() => handleFilterClick('allenamento_scade')}
                  isUrgent={clientStats.allenamentoScade > 0}
                />
                <QuickActionPill
                  icon={AlertTriangle}
                  label="Scadute"
                  count={clientStats.scaduti}
                  color="red"
                  onClick={() => handleFilterClick('scaduti')}
                  isUrgent={clientStats.scaduti > 0}
                />
              </div>
            </motion.div>

            {/* Alert Banner se ci sono urgenze */}
            {totalUrgent > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => handleFilterClick('scaduti')}
                className="mb-5 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 backdrop-blur-xl cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp size={20} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-200">
                      {totalUrgent} schede richiedono attenzione
                    </p>
                    <p className="text-xs text-amber-400/70">
                      Tap per vedere i dettagli
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-amber-400" />
                </div>
              </motion.div>
            )}

            {/* Stats Grid - 2x2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3 mb-6"
            >
              <StatCard
                icon={UserPlus}
                title="Nuovi Clienti"
                value={clientStats.nuovi}
                subtitle="Ultimi 7 giorni"
                color="blue"
                onClick={() => handleFilterClick('nuovi')}
              />
              <StatCard
                icon={Clock}
                title="In Scadenza"
                value={clientStats.alimentazioneScade + clientStats.allenamentoScade}
                subtitle="Entro 7 giorni"
                color="amber"
                onClick={() => handleFilterClick('alimentazione_scade')}
              />
              <StatCard
                icon={AlertTriangle}
                title="Scadute"
                value={clientStats.scaduti}
                subtitle="Da rinnovare"
                color="red"
                onClick={() => handleFilterClick('scaduti')}
              />
              <StatCard
                icon={BarChart3}
                title="Analytics"
                value="→"
                subtitle="Statistiche uso"
                color="purple"
                onClick={() => handleSectionClick('analytics-food')}
              />
            </motion.div>

            {/* Section Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sezioni</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>

            {/* Main Sections */}
            <div className="space-y-3">
              {sections.map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onClick={() => handleSectionClick(section.id)}
                  delay={0.25 + index * 0.05}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
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

            {activeSection === 'analytics-food' && (
              <FoodAnalytics onBack={() => setActiveSection(null)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlimentazioneAllenamento;
