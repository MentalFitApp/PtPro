// src/pages/shared/SchedeCenter.jsx
// Centro Schede - Redesign completo con layout responsive Nebula
// Gestisce visualizzazione clienti, schede allenamento e alimentazione

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Apple, Dumbbell, Search, Filter, Plus, ChevronRight,
  Clock, AlertTriangle, CheckCircle, XCircle, Sparkles, 
  BarChart3, BookOpen, RefreshCw, ArrowLeft, Calendar,
  FileText, Eye, Edit3, History, MoreVertical
} from 'lucide-react';
import { useSchedeData } from '../../hooks/useSchedeData';
import { useIsMobile } from '../../hooks/useIsMobile';
import { db } from '../../firebase';
import { getTenantSubcollection } from '../../config/tenant';
import { query, orderBy, limit, getDocs } from 'firebase/firestore';
// Import lazy per sezioni strumenti
import ListaAlimenti from '../../components/ListaAlimenti';
import ListaEsercizi from '../../components/ListaEsercizi';
import FoodAnalytics from './FoodAnalytics';

// === NEBULA COLORS ===
const colors = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/20' },
};

// === STAT CARD ===
const StatCard = ({ icon: Icon, value, label, color = 'cyan', onClick, highlight }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      relative p-3 rounded-xl backdrop-blur-xl transition-all
      ${colors[color].bg} ${colors[color].border} border
      ${highlight ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-' + color + '-500/50' : ''}
      active:scale-95 touch-manipulation text-left w-full
    `}
  >
    <div className="flex items-center justify-between mb-1">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color].bg}`}>
        <Icon size={16} className={colors[color].text} />
      </div>
      <span className={`text-2xl font-bold ${colors[color].text}`}>{value}</span>
    </div>
    <p className="text-xs text-slate-300 font-medium">{label}</p>
  </motion.button>
);

// === FILTER PILL ===
const FilterPill = ({ icon: Icon, label, count, active, onClick, color = 'cyan' }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap
      transition-all active:scale-95 touch-manipulation
      ${active 
        ? `bg-gradient-to-r from-${color}-500/30 to-${color}-600/20 border-${color}-400/50 ${colors[color].text}` 
        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
      }
      border backdrop-blur-sm
    `}
  >
    <Icon size={14} />
    <span className="text-xs font-medium">{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`
        min-w-[18px] h-[18px] flex items-center justify-center
        text-[10px] font-bold rounded-full px-1
        ${active ? 'bg-white/20' : 'bg-slate-600'}
      `}>
        {count}
      </span>
    )}
  </motion.button>
);

// === CLIENT CARD ===
const ClientCard = ({ client, onClick, isSelected }) => {
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem('app_role');
  const isCoach = userRole === 'coach';
  
  const getStatusBadge = (hasScheda, giorniScadenza) => {
    if (!hasScheda) {
      return { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Mancante' };
    }
    if (giorniScadenza !== null && giorniScadenza < 0) {
      return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Scaduta' };
    }
    if (giorniScadenza !== null && giorniScadenza <= 7) {
      return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: `${giorniScadenza}g` };
    }
    return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Attiva' };
  };

  const allenamentoStatus = getStatusBadge(client.hasSchedaAllenamento, client.giorniAlScadenzaAllenamento);
  const alimentazioneStatus = getStatusBadge(client.hasSchedaAlimentazione, client.giorniAlScadenzaAlimentazione);

  const handleNavigate = (type) => {
    const basePath = isCoach ? '/coach' : '';
    if (type === 'allenamento') {
      navigate(`${basePath}/scheda-allenamento/${client.id}`);
    } else {
      navigate(`${basePath}/scheda-alimentazione/${client.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-2xl backdrop-blur-xl transition-all cursor-pointer
        bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20
        ${isSelected ? 'ring-2 ring-cyan-500/50 border-cyan-500/30' : ''}
        active:scale-[0.98] touch-manipulation
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {client.photoURL ? (
            <img 
              src={client.photoURL} 
              alt={client.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center ring-2 ring-white/10">
              <span className="text-lg font-bold text-cyan-400">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white truncate pr-2">{client.name}</h3>
            {client.isNuovo && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full">
                NUOVO
              </span>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {/* Allenamento */}
            <button
              onClick={(e) => { e.stopPropagation(); handleNavigate('allenamento'); }}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                ${allenamentoStatus.bg} ${allenamentoStatus.color}
                hover:opacity-80 transition-opacity
              `}
            >
              <Dumbbell size={12} />
              <span>Allenamento</span>
              <allenamentoStatus.icon size={12} />
            </button>

            {/* Alimentazione */}
            <button
              onClick={(e) => { e.stopPropagation(); handleNavigate('alimentazione'); }}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                ${alimentazioneStatus.bg} ${alimentazioneStatus.color}
                hover:opacity-80 transition-opacity
              `}
            >
              <Apple size={12} />
              <span>Alimentazione</span>
              <alimentazioneStatus.icon size={12} />
            </button>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={18} className="text-slate-500 flex-shrink-0 self-center" />
      </div>
    </motion.div>
  );
};

// === TOOLS SECTION ===
const ToolCard = ({ icon: Icon, title, subtitle, color, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      relative p-4 rounded-xl backdrop-blur-xl transition-all
      ${colors[color].bg} ${colors[color].border} border
      hover:border-opacity-60 active:scale-95 touch-manipulation
      text-left w-full
    `}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color].bg}`}>
        <Icon size={20} className={colors[color].text} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white text-sm">{title}</h4>
        <p className="text-xs text-slate-400 truncate">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-slate-500" />
    </div>
  </motion.button>
);

// === MAIN COMPONENT ===
const SchedeCenter = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { loading, error, clients, stats, filterClients, refresh } = useSchedeData();
  
  const [activeFilter, setActiveFilter] = useState('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [cardHistory, setCardHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyType, setHistoryType] = useState(null); // 'allenamento' | 'alimentazione'
  
  // Gestione sezione da URL params
  const activeSection = searchParams.get('section') || 'clienti';
  
  const setActiveSection = (section) => {
    if (section === 'clienti') {
      setSearchParams({});
    } else {
      setSearchParams({ section });
    }
  };

  // Clienti filtrati
  const filteredClients = useMemo(() => {
    return filterClients(activeFilter, searchQuery);
  }, [filterClients, activeFilter, searchQuery]);

  // Filters config
  const filters = [
    { id: 'tutti', label: 'Tutti', icon: Users, count: stats.totaleClienti },
    { id: 'con-allenamento', label: 'Con Allenamento', icon: Dumbbell, count: stats.conAllenamento, color: 'blue' },
    { id: 'con-alimentazione', label: 'Con Dieta', icon: Apple, count: stats.conAlimentazione, color: 'emerald' },
    { id: 'senza-schede', label: 'Senza Schede', icon: XCircle, count: stats.senzaSchede, color: 'rose' },
    { id: 'nuovi', label: 'Nuovi', icon: Plus, count: stats.nuovi, color: 'cyan' },
    { id: 'scaduti', label: 'Scaduti', icon: AlertTriangle, count: stats.totaleScaduti, color: 'red' },
  ];

  const userRole = sessionStorage.getItem('app_role');
  const isCoach = userRole === 'coach';

  const handleClientClick = (client) => {
    if (isMobile) {
      // Su mobile naviga direttamente al client detail
      const basePath = isCoach ? '/coach' : '';
      navigate(`${basePath}/client/${client.id}`);
    } else {
      setSelectedClient(client);
    }
  };

  // Carica storico schede per il cliente selezionato
  const loadCardHistory = async (clientId, type) => {
    setHistoryLoading(true);
    setHistoryType(type);
    try {
      const collectionName = type === 'allenamento' ? 'schede_allenamento' : 'schede_alimentazione';
      const historyCollectionRef = getTenantSubcollection(db, collectionName, clientId, 'history');
      const q = query(historyCollectionRef, orderBy('savedAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      const history = [];
      snapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });
      setCardHistory(history);
      console.log(`✅ Caricati ${history.length} elementi dallo storico ${type}`);
    } catch (error) {
      console.error('⚠️ Errore caricamento storico:', error);
      setCardHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewHistory = async () => {
    if (!selectedClient) return;
    
    // Carica entrambi gli storici
    setShowHistoryModal(true);
    setHistoryLoading(true);
    
    try {
      const allHistory = [];
      
      // Storico allenamento
      if (selectedClient.hasSchedaAllenamento) {
        try {
          const allenamentoRef = getTenantSubcollection(db, 'schede_allenamento', selectedClient.id, 'history');
          const qA = query(allenamentoRef, orderBy('savedAt', 'desc'), limit(5));
          const snapA = await getDocs(qA);
          snapA.forEach(doc => {
            allHistory.push({ id: doc.id, type: 'allenamento', ...doc.data() });
          });
        } catch (e) { console.log('No allenamento history'); }
      }
      
      // Storico alimentazione
      if (selectedClient.hasSchedaAlimentazione) {
        try {
          const alimentazioneRef = getTenantSubcollection(db, 'schede_alimentazione', selectedClient.id, 'history');
          const qB = query(alimentazioneRef, orderBy('savedAt', 'desc'), limit(5));
          const snapB = await getDocs(qB);
          snapB.forEach(doc => {
            allHistory.push({ id: doc.id, type: 'alimentazione', ...doc.data() });
          });
        } catch (e) { console.log('No alimentazione history'); }
      }
      
      // Ordina per data
      allHistory.sort((a, b) => {
        const dateA = a.savedAt?.toDate?.() || new Date(0);
        const dateB = b.savedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setCardHistory(allHistory);
      console.log(`✅ Caricati ${allHistory.length} elementi totali dallo storico`);
    } catch (error) {
      console.error('⚠️ Errore caricamento storico:', error);
      setCardHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Render sezione strumenti
  const renderToolSection = () => {
    switch (activeSection) {
      case 'alimenti':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <button onClick={() => setActiveSection('clienti')} className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-bold text-white">Database Alimenti</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ListaAlimenti />
            </div>
          </div>
        );
      case 'esercizi':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <button onClick={() => setActiveSection('clienti')} className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-bold text-white">Catalogo Esercizi</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ListaEsercizi />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <button onClick={() => setActiveSection('clienti')} className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-bold text-white">Analytics Alimentazione</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <FoodAnalytics />
            </div>
          </div>
        );
      case 'preset':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <button onClick={() => setActiveSection('clienti')} className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-bold text-white">Preset Schede</h2>
            </div>
            <div className="flex-1 p-4 text-center text-slate-400">
              <BookOpen size={48} className="mx-auto mb-4 text-purple-400" />
              <p>Gestione preset in arrivo...</p>
              <p className="text-xs mt-2">I preset sono già utilizzabili nelle schede</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Se è attiva una sezione strumenti, mostrala
  if (activeSection !== 'clienti') {
    return (
      <div className="min-h-screen pb-24">
        {renderToolSection()}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Caricamento schede...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Errore</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? "min-h-screen pb-24" : "h-full flex flex-col"}>
      <div className={isMobile ? "max-w-7xl mx-auto" : "flex-1 flex flex-col min-h-0"}>
        {/* MOBILE LAYOUT */}
        {isMobile ? (
          <div className="px-4 py-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={20} className="text-purple-400" />
                  <h1 className="text-xl font-bold text-white">Centro Schede</h1>
                </div>
                <p className="text-xs text-slate-500">
                  {stats.totaleClienti} clienti • {stats.conAllenamento + stats.conAlimentazione} schede attive
                </p>
              </div>
              <button
                onClick={refresh}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                icon={Users}
                value={stats.totaleClienti}
                label="Clienti"
                color="cyan"
                onClick={() => setActiveFilter('tutti')}
                highlight={activeFilter === 'tutti'}
              />
              <StatCard
                icon={Dumbbell}
                value={stats.conAllenamento}
                label="Allenamento"
                color="blue"
                onClick={() => setActiveFilter('con-allenamento')}
                highlight={activeFilter === 'con-allenamento'}
              />
              <StatCard
                icon={Apple}
                value={stats.conAlimentazione}
                label="Dieta"
                color="emerald"
                onClick={() => setActiveFilter('con-alimentazione')}
                highlight={activeFilter === 'con-alimentazione'}
              />
            </div>

            {/* Alert Banner */}
            {(stats.totaleScaduti > 0 || stats.totaleInScadenza > 0) && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setActiveFilter('scaduti')}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-200">
                      {stats.totaleScaduti + stats.totaleInScadenza} schede richiedono attenzione
                    </p>
                    <p className="text-xs text-amber-400/70">
                      {stats.totaleScaduti} scadute • {stats.totaleInScadenza} in scadenza
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-amber-400" />
                </div>
              </motion.button>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cerca cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {filters.map(filter => (
                <FilterPill
                  key={filter.id}
                  icon={filter.icon}
                  label={filter.label}
                  count={filter.count}
                  active={activeFilter === filter.id}
                  color={filter.color || 'cyan'}
                  onClick={() => setActiveFilter(filter.id)}
                />
              ))}
            </div>

            {/* Clients List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>{filteredClients.length} clienti</span>
                <span>Ordinati per attività</span>
              </div>
              
              {filteredClients.length === 0 ? (
                <div className="py-12 text-center">
                  <Users size={40} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nessun cliente trovato</p>
                  <p className="text-xs text-slate-500 mt-1">Prova a cambiare filtro</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClients.map(client => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onClick={() => handleClientClick(client)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Strumenti</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>

            {/* Tools */}
            <div className="grid grid-cols-2 gap-2">
              <ToolCard
                icon={Apple}
                title="Database Alimenti"
                subtitle="493+ alimenti"
                color="emerald"
                onClick={() => setActiveSection('alimenti')}
              />
              <ToolCard
                icon={Dumbbell}
                title="Catalogo Esercizi"
                subtitle="Con GIF animate"
                color="blue"
                onClick={() => setActiveSection('esercizi')}
              />
              <ToolCard
                icon={BookOpen}
                title="Preset Schede"
                subtitle="Template pronti"
                color="purple"
                onClick={() => setActiveSection('preset')}
              />
              <ToolCard
                icon={BarChart3}
                title="Analytics"
                subtitle="Statistiche uso"
                color="cyan"
                onClick={() => setActiveSection('analytics')}
              />
            </div>
          </div>
        ) : (
          /* DESKTOP LAYOUT - Full Width con pannello laterale */
          <div className="flex flex-1 min-h-0 relative">
            {/* Main Content - Lista Clienti */}
            <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${selectedClient ? 'mr-[480px]' : ''}`}>
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles size={24} className="text-purple-400" />
                    <div>
                      <h1 className="text-2xl font-bold text-white">Centro Schede</h1>
                      <p className="text-sm text-slate-400">{stats.totaleClienti} clienti totali</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Stats Pills */}
                    <div className="flex gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                        <Dumbbell size={14} className="text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">{stats.conAllenamento}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                        <Apple size={14} className="text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">{stats.conAlimentazione}</span>
                      </div>
                      {stats.totaleScaduti > 0 && (
                        <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-400" />
                          <span className="text-sm font-medium text-red-400">{stats.totaleScaduti} scadute</span>
                        </div>
                      )}
                    </div>
                    {/* Tools Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowToolsMenu(!showToolsMenu)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          showToolsMenu 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                            : 'bg-slate-800/50 text-slate-400 hover:text-white border border-transparent'
                        }`}
                      >
                        <BookOpen size={16} />
                        Strumenti
                        <ChevronRight size={14} className={`transition-transform ${showToolsMenu ? 'rotate-90' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {showToolsMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                          >
                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => { setActiveSection('alimenti'); setShowToolsMenu(false); }}
                                className="w-full px-3 py-2.5 rounded-lg text-left text-sm hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-3"
                              >
                                <Apple size={16} className="text-emerald-400" />
                                Database Alimenti
                              </button>
                              <button
                                onClick={() => { setActiveSection('esercizi'); setShowToolsMenu(false); }}
                                className="w-full px-3 py-2.5 rounded-lg text-left text-sm hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 transition-colors flex items-center gap-3"
                              >
                                <Dumbbell size={16} className="text-blue-400" />
                                Catalogo Esercizi
                              </button>
                              <button
                                onClick={() => { setActiveSection('preset'); setShowToolsMenu(false); }}
                                className="w-full px-3 py-2.5 rounded-lg text-left text-sm hover:bg-purple-500/10 text-slate-300 hover:text-purple-400 transition-colors flex items-center gap-3"
                              >
                                <BookOpen size={16} className="text-purple-400" />
                                Preset Schede
                              </button>
                              <button
                                onClick={() => { setActiveSection('analytics'); setShowToolsMenu(false); }}
                                className="w-full px-3 py-2.5 rounded-lg text-left text-sm hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-3"
                              >
                                <BarChart3 size={16} className="text-cyan-400" />
                                Analytics
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <button
                      onClick={refresh}
                      className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>

                {/* Search & Filters Row */}
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cerca cliente per nome o email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-2">
                    {filters.map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                          ${activeFilter === filter.id 
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                            : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50 hover:text-slate-300'}
                        `}
                      >
                        <filter.icon size={14} />
                        {filter.label}
                        <span className={`min-w-[20px] h-5 flex items-center justify-center text-xs rounded-full px-1.5 ${
                          activeFilter === filter.id ? 'bg-cyan-500/30' : 'bg-slate-700'
                        }`}>
                          {filter.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clients Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {filteredClients.map(client => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onClick={() => setSelectedClient(client)}
                      isSelected={selectedClient?.id === client.id}
                    />
                  ))}
                </div>
                {filteredClients.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Users size={48} className="text-slate-600 mb-4" />
                    <p className="text-lg text-slate-400">Nessun cliente trovato</p>
                    <p className="text-sm text-slate-500">Prova a modificare i filtri</p>
                  </div>
                )}
              </div>

            </div>

            {/* Overlay per sfondo quando pannello aperto */}
            <AnimatePresence>
              {selectedClient && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedClient(null)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                />
              )}
            </AnimatePresence>

            {/* Side Panel - Client Details */}
            <AnimatePresence>
              {selectedClient && (
                <motion.div
                  initial={{ x: 500, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 500, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed right-4 top-20 w-[460px] max-h-[calc(100vh-100px)] z-50 p-5 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl flex flex-col"
                >
                  {/* Panel Header */}
                  <div className="pb-4 border-b border-white/10 flex items-center justify-between mb-5 flex-shrink-0">
                    <h2 className="font-semibold text-white text-lg">Dettagli Cliente</h2>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>

                  {/* Panel Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Client Header */}
                    <div className="flex items-center gap-4 mb-6">
                      {selectedClient.photoURL ? (
                        <img 
                          src={selectedClient.photoURL} 
                          alt={selectedClient.name}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center ring-2 ring-white/10">
                          <span className="text-2xl font-bold text-cyan-400">
                            {selectedClient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedClient.name}</h2>
                        <p className="text-sm text-slate-400">{selectedClient.email}</p>
                      </div>
                    </div>

                    {/* Schede Cards */}
                    <div className="space-y-4">
                      {/* Scheda Allenamento */}
                      <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                              <Dumbbell size={20} className="text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">Scheda Allenamento</h3>
                              <p className="text-xs text-slate-400">
                                {selectedClient.hasSchedaAllenamento ? 'Attiva' : 'Non presente'}
                              </p>
                            </div>
                          </div>
                          {selectedClient.hasSchedaAllenamento ? (
                            <CheckCircle size={20} className="text-emerald-400" />
                          ) : (
                            <XCircle size={20} className="text-slate-500" />
                          )}
                        </div>
                        
                        <div className="space-y-1 mb-4">
                          {selectedClient.allenamentoUpdatedAt && (
                            <p className="text-xs text-slate-500">
                              Ultima modifica: {selectedClient.allenamentoUpdatedAt.toLocaleDateString('it-IT')}
                            </p>
                          )}
                          {selectedClient.allenamentoScadenza && (
                            <p className={`text-xs font-medium ${
                              selectedClient.giorniAlScadenzaAllenamento < 0 
                                ? 'text-red-400' 
                                : selectedClient.giorniAlScadenzaAllenamento <= 7 
                                  ? 'text-amber-400' 
                                  : 'text-emerald-400'
                            }`}>
                              <Calendar size={12} className="inline mr-1" />
                              Scadenza: {selectedClient.allenamentoScadenza.toLocaleDateString('it-IT')}
                              {selectedClient.giorniAlScadenzaAllenamento !== null && (
                                <span className="ml-1">
                                  ({selectedClient.giorniAlScadenzaAllenamento < 0 
                                    ? `scaduta da ${Math.abs(selectedClient.giorniAlScadenzaAllenamento)}g`
                                    : `tra ${selectedClient.giorniAlScadenzaAllenamento}g`})
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`${isCoach ? '/coach' : ''}/scheda-allenamento/${selectedClient.id}`)}
                            className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            {selectedClient.hasSchedaAllenamento ? <Eye size={14} /> : <Plus size={14} />}
                            {selectedClient.hasSchedaAllenamento ? 'Visualizza' : 'Crea'}
                          </button>
                          {selectedClient.hasSchedaAllenamento && (
                            <button
                              onClick={() => navigate(`${isCoach ? '/coach' : ''}/scheda-allenamento/${selectedClient.id}?edit=true`)}
                              className="px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scheda Alimentazione */}
                      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <Apple size={20} className="text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">Scheda Alimentazione</h3>
                              <p className="text-xs text-slate-400">
                                {selectedClient.hasSchedaAlimentazione ? 'Attiva' : 'Non presente'}
                              </p>
                            </div>
                          </div>
                          {selectedClient.hasSchedaAlimentazione ? (
                            <CheckCircle size={20} className="text-emerald-400" />
                          ) : (
                            <XCircle size={20} className="text-slate-500" />
                          )}
                        </div>

                        <div className="space-y-1 mb-4">
                          {selectedClient.alimentazioneUpdatedAt && (
                            <p className="text-xs text-slate-500">
                              Ultima modifica: {selectedClient.alimentazioneUpdatedAt.toLocaleDateString('it-IT')}
                            </p>
                          )}
                          {selectedClient.alimentazioneScadenza && (
                            <p className={`text-xs font-medium ${
                              selectedClient.giorniAlScadenzaAlimentazione < 0 
                                ? 'text-red-400' 
                                : selectedClient.giorniAlScadenzaAlimentazione <= 7 
                                  ? 'text-amber-400' 
                                  : 'text-emerald-400'
                            }`}>
                              <Calendar size={12} className="inline mr-1" />
                              Scadenza: {selectedClient.alimentazioneScadenza.toLocaleDateString('it-IT')}
                              {selectedClient.giorniAlScadenzaAlimentazione !== null && (
                                <span className="ml-1">
                                  ({selectedClient.giorniAlScadenzaAlimentazione < 0 
                                    ? `scaduta da ${Math.abs(selectedClient.giorniAlScadenzaAlimentazione)}g`
                                    : `tra ${selectedClient.giorniAlScadenzaAlimentazione}g`})
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`${isCoach ? '/coach' : ''}/scheda-alimentazione/${selectedClient.id}`)}
                            className="flex-1 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            {selectedClient.hasSchedaAlimentazione ? <Eye size={14} /> : <Plus size={14} />}
                            {selectedClient.hasSchedaAlimentazione ? 'Visualizza' : 'Crea'}
                          </button>
                          {selectedClient.hasSchedaAlimentazione && (
                            <button
                              onClick={() => navigate(`${isCoach ? '/coach' : ''}/scheda-alimentazione/${selectedClient.id}?edit=true`)}
                              className="px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions - Fixed at bottom */}
                  <div className="pt-4 border-t border-white/10 flex gap-3 flex-shrink-0 mt-auto">
                    <button
                      onClick={() => navigate(`${isCoach ? '/coach' : ''}/client/${selectedClient.id}`)}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <FileText size={16} />
                      Profilo Cliente
                    </button>
                    <button
                      onClick={handleViewHistory}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <History size={16} />
                      Storico Schede
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-100">Storico Schede - {selectedClient?.nome} {selectedClient?.cognome}</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={24} className="animate-spin text-cyan-400" />
                </div>
              ) : cardHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">Nessuna scheda nello storico</p>
                  <p className="text-slate-500 text-sm mt-2">Lo storico viene creato quando salvi modifiche alle schede</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cardHistory.map((card, idx) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        const basePath = isCoach ? '/coach' : '';
                        if (card.type === 'allenamento') {
                          navigate(`${basePath}/scheda-allenamento/${selectedClient.id}`);
                        } else {
                          navigate(`${basePath}/scheda-alimentazione/${selectedClient.id}`);
                        }
                        setShowHistoryModal(false);
                      }}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${card.type === 'allenamento' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                            {card.type === 'allenamento' ? (
                              <Dumbbell size={18} className="text-blue-400" />
                            ) : (
                              <Apple size={18} className="text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100">
                              Scheda {card.type === 'allenamento' ? 'Allenamento' : 'Alimentazione'}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              Salvata: {card.savedAt?.toDate?.()?.toLocaleDateString('it-IT', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) || 'N/D'}
                            </div>
                            {card.obiettivo && (
                              <div className="text-sm text-slate-500">
                                Obiettivo: {card.obiettivo}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-cyan-400 text-sm flex items-center gap-1">
                          <Eye size={14} />
                          Visualizza
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full mt-6 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-colors"
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchedeCenter;
