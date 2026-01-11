// src/components/layout/NebulaSidebar.jsx
// Sidebar Nebula 2.0 - Design ultramoderno con effetti glass e glow
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { isSuperAdmin } from '../../utils/superadmin';
import { defaultBranding } from '../../config/tenantBranding';
import { useUnreadAnamnesi, useUnreadChecks } from '../../hooks/useUnreadNotifications';
import { useUnreadCount } from '../../hooks/useChat';
import { useTheme } from '../../contexts/ThemeContext';
import SidebarCustomizer from './SidebarCustomizer';
import { signOut } from 'firebase/auth';
import {
  Home, Users, FileText, Calendar, Settings, MessageSquare,
  ChevronRight, ChevronLeft, BarChart3, BellRing, UserCheck,
  BookOpen, Target, Activity, Palette, Layout, Link2,
  Dumbbell, Utensils, CreditCard, LogOut, HelpCircle,
  X, User, Sun, Moon, LayoutGrid, Sparkles, Zap, ChevronDown, AlertTriangle,
  Search, Star, Clock, Maximize2, Grid3X3
} from 'lucide-react';

// === CONFIGURAZIONE NAVIGAZIONE PER RUOLO ===
const getNavConfig = (role) => {
  const configs = {
    admin: {
      sections: [
        {
          id: 'main',
          title: 'Principale',
          items: [
            { to: '/', icon: Home, label: 'Dashboard', color: 'cyan' },
            { to: '/clients', icon: Users, label: 'Clienti', color: 'blue' },
            { to: '/chat', icon: MessageSquare, label: 'Messaggi', hasBadge: 'chat', color: 'purple' },
            { to: '/calendar', icon: Calendar, label: 'Calendario', color: 'emerald' },
          ]
        },
        {
          id: 'manage',
          title: 'Gestione',
          items: [
            { to: '/collaboratori', icon: UserCheck, label: 'Collaboratori', color: 'amber' },
            { to: '/admin/dipendenti', icon: Users, label: 'Dipendenti', color: 'slate' },
            { to: '/alimentazione-allenamento', icon: Target, label: 'Schede', color: 'rose' },
          ]
        },
        {
          id: 'content',
          title: 'Contenuti',
          items: [
            { to: '/admin/checks', icon: Activity, label: 'Check', hasBadge: 'checks', color: 'green' },
            { to: '/admin/anamnesi', icon: FileText, label: 'Anamnesi', hasBadge: 'anamnesi', color: 'orange' },
            { to: '/admin/notifiche', icon: BellRing, label: 'Notifiche', color: 'purple' },
            { to: '/courses', icon: BookOpen, label: 'Corsi', color: 'indigo' },
            { to: '/community', icon: Users, label: 'Community', color: 'violet' },
            { to: '/admin/landing-pages', icon: Layout, label: 'Landing Pages', color: 'pink' },
          ]
        },
        {
          id: 'analytics',
          title: 'Analytics',
          items: [
            { to: '/business-history', icon: BarChart3, label: 'Business History', color: 'cyan' },
            { to: '/statistiche', icon: Activity, label: 'Statistiche', color: 'blue' },
          ]
        },
        {
          id: 'settings',
          title: 'Sistema',
          items: [
            { to: '/admin/branding', icon: Palette, label: 'Branding', color: 'pink' },
            { to: '/integrations', icon: Link2, label: 'Integrazioni', color: 'teal' },
            { to: '/platform-settings', icon: Settings, label: 'Piattaforma', color: 'slate' },
          ]
        }
      ]
    },
    coach: {
      sections: [
        {
          id: 'main',
          title: 'Principale',
          items: [
            { to: '/coach', icon: Home, label: 'Dashboard', color: 'cyan' },
            { to: '/coach/clients', icon: Users, label: 'Clienti', color: 'blue' },
            { to: '/coach/chat', icon: MessageSquare, label: 'Messaggi', hasBadge: 'chat', color: 'purple' },
          ]
        },
        {
          id: 'manage',
          title: 'Gestione',
          items: [
            { to: '/coach/checks', icon: Activity, label: 'Check', hasBadge: 'checks', color: 'green' },
            { to: '/coach/anamnesi', icon: FileText, label: 'Anamnesi', hasBadge: 'anamnesi', color: 'orange' },
            { to: '/coach/notifiche', icon: BellRing, label: 'Notifiche', color: 'purple' },
            { to: '/coach/schede', icon: Target, label: 'Schede', color: 'rose' },
          ]
        },
        {
          id: 'other',
          title: 'Altro',
          items: [
            { to: '/coach/updates', icon: BellRing, label: 'Aggiornamenti', color: 'amber' },
            { to: '/coach/settings', icon: Settings, label: 'Impostazioni', color: 'slate' },
          ]
        }
      ]
    },
    client: {
      sections: [
        {
          id: 'main',
          title: 'Principale',
          items: [
            { to: '/client/dashboard', icon: Home, label: 'Dashboard', color: 'cyan' },
            { to: '/client/scheda-allenamento', icon: Dumbbell, label: 'Allenamento', color: 'blue' },
            { to: '/client/scheda-alimentazione', icon: Utensils, label: 'Alimentazione', color: 'emerald' },
          ]
        },
        {
          id: 'social',
          title: 'Comunicazioni',
          items: [
            { to: '/client/chat', icon: MessageSquare, label: 'Chat', hasBadge: 'chat', color: 'purple' },
            { to: '/client/community', icon: Users, label: 'Community', color: 'violet' },
          ]
        },
        {
          id: 'profile',
          title: 'Profilo',
          items: [
            { to: '/client/habits', icon: Target, label: 'Abitudini', color: 'violet' },
            { to: '/client/anamnesi', icon: FileText, label: 'Anamnesi', color: 'orange' },
            { to: '/client/checks', icon: Activity, label: 'Check', color: 'green' },
            { to: '/client/payments', icon: CreditCard, label: 'Pagamenti', color: 'emerald' },
            { to: '/client/courses', icon: BookOpen, label: 'Corsi', color: 'indigo' },
            { to: '/client/settings', icon: Settings, label: 'Impostazioni', color: 'slate' },
          ]
        }
      ]
    },
    collaboratore: {
      sections: [
        {
          id: 'main',
          title: 'Principale',
          items: [
            { to: '/collaboratore/dashboard', icon: Home, label: 'Dashboard', color: 'cyan' },
            { to: '/collaboratore/calendar', icon: Calendar, label: 'Calendario', color: 'emerald' },
          ]
        }
      ]
    }
  };

  return configs[role] || configs.admin;
};

// === COLOR MAPS ===
const colorMap = {
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/30', border: 'border-cyan-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/30', border: 'border-blue-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/30', border: 'border-purple-500/30' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/30', border: 'border-emerald-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/30', border: 'border-amber-500/30' },
  rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/30', border: 'border-rose-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/30', border: 'border-green-500/30' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/30', border: 'border-orange-500/30' },
  indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', glow: 'shadow-indigo-500/30', border: 'border-indigo-500/30' },
  violet: { bg: 'bg-violet-500/20', text: 'text-violet-400', glow: 'shadow-violet-500/30', border: 'border-violet-500/30' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', glow: 'shadow-pink-500/30', border: 'border-pink-500/30' },
  teal: { bg: 'bg-teal-500/20', text: 'text-teal-400', glow: 'shadow-teal-500/30', border: 'border-teal-500/30' },
  slate: { bg: 'bg-slate-500/20', text: 'text-slate-400', glow: 'shadow-slate-500/30', border: 'border-slate-500/30' },
};

// === COMMAND CENTER - Full Screen Navigation ===
export const CommandCenter = ({ isOpen, onClose, role = 'admin', onNavigate, badges = {} }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentPages, setRecentPages] = useState([]);
  const [pinnedPages, setPinnedPages] = useState([]);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const navConfig = getNavConfig(role);
  
  // Carica pagine recenti e pinnate da localStorage
  useEffect(() => {
    if (isOpen) {
      const storedRecent = localStorage.getItem('recentPages');
      const storedPinned = localStorage.getItem('pinnedPages');
      if (storedRecent) {
        try { setRecentPages(JSON.parse(storedRecent)); } catch (e) {}
      }
      if (storedPinned) {
        try { setPinnedPages(JSON.parse(storedPinned)); } catch (e) {}
      }
    }
  }, [isOpen]);
  
  // Blocca scroll quando aperto
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // Keyboard shortcut ESC per chiudere
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Tutte le pagine flat per la ricerca
  const allPages = useMemo(() => {
    return navConfig.sections.flatMap(section => 
      section.items.map(item => ({ ...item, section: section.title }))
    );
  }, [navConfig]);
  
  // Filtra pagine in base alla ricerca
  const filteredPages = useMemo(() => {
    if (!searchQuery) return null;
    const query = searchQuery.toLowerCase();
    return allPages.filter(page => 
      page.label.toLowerCase().includes(query) ||
      page.section.toLowerCase().includes(query)
    );
  }, [searchQuery, allPages]);
  
  // Toggle pin pagina
  const togglePin = (to, label, e) => {
    e.stopPropagation();
    const isPinned = pinnedPages.some(p => p.to === to);
    let newPinned;
    if (isPinned) {
      newPinned = pinnedPages.filter(p => p.to !== to);
    } else {
      newPinned = [...pinnedPages, { to, label }].slice(0, 8);
    }
    setPinnedPages(newPinned);
    localStorage.setItem('pinnedPages', JSON.stringify(newPinned));
  };
  
  // Pagine con notifiche
  const pagesWithBadges = useMemo(() => {
    return allPages.filter(page => badges[page.to] > 0);
  }, [allPages, badges]);
  
  const handleNavigate = (to, label) => {
    // Salva nelle pagine recenti
    const newRecent = [{ to, label }, ...recentPages.filter(p => p.to !== to)].slice(0, 5);
    setRecentPages(newRecent);
    localStorage.setItem('recentPages', JSON.stringify(newRecent));
    
    if (onNavigate) {
      onNavigate(to);
    } else {
      navigate(to);
    }
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 lg:p-6"
        >
          {/* Backdrop frost - più intenso */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-2xl"
          />
          
          {/* Command Center Panel - Più grande e frost */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-7xl max-h-[92vh] rounded-3xl overflow-hidden ${isDark ? 'shadow-2xl shadow-black/30' : 'shadow-2xl shadow-slate-500/20'}`}
          >
            {/* Frost Glass Background - Ultra trasparente */}
            <div className={`absolute inset-0 backdrop-blur-[80px] backdrop-saturate-150 ${isDark ? 'bg-black/30' : 'bg-white/40'}`} />
            <div className={`absolute inset-0 ring-1 ring-inset ${isDark ? 'ring-white/15' : 'ring-black/5'}`} />
            
            {/* Gradient overlay sottile */}
            <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-white/[0.02] via-transparent to-white/[0.02]' : 'from-black/[0.01] via-transparent to-black/[0.01]'} pointer-events-none`} />
            
            {/* Content */}
            <div className="relative flex flex-col h-full max-h-[92vh]">
              
              {/* Header - Compatto con safe area */}
              <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b flex-shrink-0 ${isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
                {/* Search */}
                <div className={`flex-1 min-w-0 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100/80 border border-slate-200'}`}>
                  <Search size={16} className={`flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    placeholder="Cerca..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`flex-1 min-w-0 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="flex-shrink-0 text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  )}
                </div>
                
                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={`flex-shrink-0 p-2 sm:p-2.5 rounded-xl transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'}`}
                >
                  <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                </motion.button>
              </div>
              
              {/* Body - Scrollbar bianca */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-5 scrollbar-white">
                
                {/* Risultati Ricerca */}
                {filteredPages && (
                  <div>
                    <h3 className={`text-xs font-medium mb-2.5 flex items-center gap-2 uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Search size={12} />
                      Risultati per "{searchQuery}"
                    </h3>
                    {filteredPages.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                        {filteredPages.map((page) => {
                          const Icon = page.icon;
                          const colors = colorMap[page.color] || colorMap.blue;
                          const isPinned = pinnedPages.some(p => p.to === page.to);
                          const badge = badges[page.to] || 0;
                          return (
                            <motion.button
                              key={page.to}
                              whileHover={{ scale: 1.03, y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleNavigate(page.to, page.label)}
                              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all border group ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/15' : 'bg-white/50 hover:bg-white/80 border-slate-200/50 hover:border-slate-300'}`}
                            >
                              {/* Pin button */}
                              <button
                                onClick={(e) => togglePin(page.to, page.label, e)}
                                className={`absolute top-1.5 right-1.5 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${isPinned ? 'opacity-100 text-amber-400' : isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Star size={12} fill={isPinned ? 'currentColor' : 'none'} />
                              </button>
                              {/* Badge */}
                              {badge > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                                  {badge > 99 ? '99+' : badge}
                                </span>
                              )}
                              <div className={`p-2 rounded-lg ${colors.bg}`}>
                                <Icon size={18} className={colors.text} />
                              </div>
                              <span className={`text-xs font-medium text-center leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{page.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={`text-center py-6 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Nessun risultato trovato
                      </p>
                    )}
                  </div>
                )}
                
                {/* Notifiche - Pagine con badge */}
                {!filteredPages && pagesWithBadges.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-medium mb-2.5 flex items-center gap-2 uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <BellRing size={12} />
                      Notifiche
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pagesWithBadges.map((page) => {
                        const Icon = page.icon;
                        const colors = colorMap[page.color] || colorMap.blue;
                        const badge = badges[page.to];
                        return (
                          <motion.button
                            key={page.to}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigate(page.to, page.label)}
                            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'}`}
                          >
                            <Icon size={14} className={colors.text} />
                            {page.label}
                            <span className="min-w-[20px] h-[20px] px-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Pagine Pinnate */}
                {!filteredPages && pinnedPages.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-medium mb-2.5 flex items-center gap-2 uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Star size={12} />
                      Preferiti
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                      {pinnedPages.map((page) => {
                        const fullPage = allPages.find(p => p.to === page.to);
                        if (!fullPage) return null;
                        const Icon = fullPage.icon;
                        const colors = colorMap[fullPage.color] || colorMap.blue;
                        const badge = badges[page.to] || 0;
                        return (
                          <motion.button
                            key={page.to}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleNavigate(page.to, page.label)}
                            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all border group ${isDark ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10 hover:border-amber-500/20' : 'bg-amber-50 hover:bg-amber-100 border-amber-200/50 hover:border-amber-300'}`}
                          >
                            {/* Unpin button */}
                            <button
                              onClick={(e) => togglePin(page.to, page.label, e)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-lg text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                            {badge > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                                {badge > 99 ? '99+' : badge}
                              </span>
                            )}
                            <div className={`p-2 rounded-lg ${colors.bg}`}>
                              <Icon size={18} className={colors.text} />
                            </div>
                            <span className={`text-xs font-medium text-center leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{page.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Pagine Recenti */}
                {!filteredPages && recentPages.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-medium mb-2.5 flex items-center gap-2 uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Clock size={12} />
                      Recenti
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recentPages.map((page) => (
                        <motion.button
                          key={page.to}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleNavigate(page.to, page.label)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
                        >
                          {page.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tutte le Sezioni */}
                {!filteredPages && navConfig.sections.map((section) => (
                  <div key={section.id}>
                    <h3 className={`text-xs font-medium mb-2.5 uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {section.title}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const colors = colorMap[item.color] || colorMap.blue;
                        const isPinned = pinnedPages.some(p => p.to === item.to);
                        const badge = badges[item.to] || 0;
                        return (
                          <motion.button
                            key={item.to}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleNavigate(item.to, item.label)}
                            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all border group ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/15' : 'bg-white/50 hover:bg-white/80 border-slate-200/50 hover:border-slate-300'}`}
                          >
                            {/* Pin button */}
                            <button
                              onClick={(e) => togglePin(item.to, item.label, e)}
                              className={`absolute top-1.5 right-1.5 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${isPinned ? 'opacity-100 text-amber-400' : isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <Star size={12} fill={isPinned ? 'currentColor' : 'none'} />
                            </button>
                            {/* Badge */}
                            {badge > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                                {badge > 99 ? '99+' : badge}
                              </span>
                            )}
                            <div className={`p-2 rounded-lg ${colors.bg}`}>
                              <Icon size={18} className={colors.text} />
                            </div>
                            <span className={`text-xs font-medium text-center leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer hint */}
              <div className={`px-4 py-2.5 border-t text-center ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                <span className="text-[10px]">Premi <kbd className={`px-1 py-0.5 rounded text-[10px] ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>ESC</kbd> per chiudere · Clicca <Star size={10} className="inline" /> per pinnare</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// === SIDEBAR LOGO ===
const SidebarLogo = ({ isCollapsed, branding }) => {
  if (isCollapsed) {
    return (
      <div className="relative mx-auto">
        {branding?.logoUrl ? (
          <motion.img 
            src={branding.logoUrl} 
            alt={branding.appName}
            className="h-9 w-9 object-contain"
            whileHover={{ scale: 1.05 }}
          />
        ) : (
          <motion.div 
            className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20"
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <img src="/logo192.png" alt="FitFlows" className="w-full h-full object-cover" />
          </motion.div>
        )}
      </div>
    );
  }
  
  return (
    <motion.div className="flex items-center gap-3">
      {branding?.logoUrl ? (
        <div className="relative">
          <motion.img 
            src={branding.logoUrl} 
            alt={branding.appName}
            className="h-9 max-w-[140px] object-contain"
            whileHover={{ scale: 1.02 }}
          />
        </div>
      ) : (
        <>
          <div className="relative">
            <motion.div 
              className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/25"
              whileHover={{ scale: 1.05, rotate: 2 }}
            >
              <img src="/logo192.png" alt="FitFlows" className="w-full h-full object-cover" />
            </motion.div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-white leading-tight">{branding?.appName || 'FitFlows'}</h1>
            <span className="text-[10px] font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tracking-wider uppercase flex items-center gap-1">
              <Sparkles size={10} /> Pro
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
};

// === NAV ITEM NEBULA - Glass Style ===
const NavItem = ({ item, isActive, isCollapsed, onClick, badge = 0, isDark = true }) => {
  const Icon = item.icon;
  const colors = colorMap[item.color] || colorMap.blue;
  
  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all duration-300 group overflow-hidden ${
        isActive
          ? `bg-white/10 backdrop-blur-xl ${colors.text} border border-white/15 shadow-lg shadow-black/10`
          : isDark 
            ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 border border-transparent hover:border-slate-200'
      }`}
      whileHover={{ x: isCollapsed ? 0 : 4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      title={isCollapsed ? item.label : undefined}
    >
      {/* Glow effect on active - Glass style */}
      {isActive && (
        <motion.div
          layoutId="navGlow"
          className={`absolute inset-0 ${colors.bg} blur-2xl opacity-30`}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      
      {/* Active indicator - Vertical bar with glow */}
      {isActive && (
        <motion.div
          layoutId="activeBar"
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${colors.text.replace('text-', 'bg-')} rounded-full shadow-lg`}
          style={{ boxShadow: `0 0 10px ${colors.text.includes('cyan') ? '#22d3ee' : colors.text.includes('purple') ? '#a855f7' : colors.text.includes('emerald') ? '#10b981' : '#3b82f6'}` }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      
      <div className="relative z-10">
        <Icon 
          size={18} 
          className={`flex-shrink-0 transition-all duration-200 ${
            isActive ? colors.text : isDark ? 'group-hover:text-white' : 'group-hover:text-slate-900'
          }`} 
        />
        {badge > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/40"
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </div>
      
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="relative z-10 truncate font-medium flex-1 text-left"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      
      {!isCollapsed && badge > 0 && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative z-10 min-w-[22px] h-[22px] px-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/40"
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
    </motion.button>
  );
};

// === SEZIONE NAV ===
const NavSection = ({ section, isCollapsed, currentPath, onNavigate, badges = {}, isExpanded, onToggle, isDark = true }) => {
  return (
    <div className="mb-3">
      {!isCollapsed && (
        <motion.button
          onClick={onToggle}
          className="w-full px-3 mb-2 flex items-center gap-2 group cursor-pointer"
          whileHover={{ x: 2 }}
        >
          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${isDark ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-slate-600'}`}>
            {section.title}
          </span>
          <div className={`flex-1 h-px bg-gradient-to-r ${isDark ? 'from-slate-700/50' : 'from-slate-300/50'} to-transparent`} />
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={12} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
          </motion.div>
        </motion.button>
      )}
      
      <AnimatePresence initial={false}>
        {(isCollapsed || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 overflow-hidden"
          >
            {section.items.map((item) => {
              const isActive = currentPath === item.to || 
                (item.to !== '/' && item.to !== '/coach' && item.to !== '/client/dashboard' && currentPath.startsWith(item.to + '/'));
              
              return (
                <NavItem
                  key={item.to}
                  item={item}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  onClick={() => onNavigate(item.to)}
                  badge={badges[item.to] || 0}
                  isDark={isDark}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// === MAIN NEBULA SIDEBAR ===
export const NebulaSidebar = ({ 
  role = 'admin',
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [branding, setBranding] = useState(defaultBranding);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const user = auth.currentUser;
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Sezioni espanse
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('nebulaSidebarSections');
    return saved ? JSON.parse(saved) : { main: true, manage: true, content: true, analytics: true, settings: true, social: true, profile: true, other: true };
  });
  
  // Hook per notifiche
  const { unreadCount: unreadAnamnesi } = useUnreadAnamnesi();
  const { unreadCount: unreadChecks } = useUnreadChecks();
  const unreadChat = useUnreadCount();

  const navConfig = getNavConfig(role);
  
  // Badge mapping
  const badges = useMemo(() => ({
    '/chat': unreadChat,
    '/coach/chat': unreadChat,
    '/client/chat': unreadChat,
    '/coach/anamnesi': unreadAnamnesi,
    '/admin/anamnesi': unreadAnamnesi,
    '/admin/checks': unreadChecks,
    '/coach/checks': unreadChecks,
  }), [unreadChat, unreadAnamnesi, unreadChecks]);

  // Carica branding
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const tid = localStorage.getItem('tenantId');
        if (!tid) return;
        const brandingDoc = await getDoc(doc(db, 'tenants', tid, 'settings', 'branding'));
        if (brandingDoc.exists()) {
          setBranding({ ...defaultBranding, ...brandingDoc.data() });
        }
      } catch (error) {
        console.debug('Could not load branding:', error);
      }
    };
    loadBranding();
  }, []);

  // Salva sezioni espanse
  useEffect(() => {
    localStorage.setItem('nebulaSidebarSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleLogout = async () => {
    try {
      // Pulisci tutto prima del logout
      localStorage.removeItem('tenantId');
      localStorage.removeItem('last_path');
      sessionStorage.removeItem('app_role');
      sessionStorage.removeItem('creating_collaboratore');
      
      await signOut(auth);
      
      // Forza refresh per pulire cache React
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // In caso di errore, forza comunque il redirect
      window.location.href = '/login';
    }
  };

  const handleNavigateSettings = () => {
    const settingsPaths = { admin: '/settings', coach: '/coach/settings', client: '/client/settings', collaboratore: '/collaboratore/settings' };
    navigate(settingsPaths[role] || '/settings');
    setIsUserMenuOpen(false);
  };

  const handleNavigateProfile = () => {
    const profilePaths = { admin: '/profile', coach: '/coach/profile', client: '/client/settings', collaboratore: '/collaboratore/profile' };
    navigate(profilePaths[role] || '/profile');
    setIsUserMenuOpen(false);
  };

  const handleNavigateBilling = () => {
    navigate('/billing');
    setIsUserMenuOpen(false);
  };

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isUserMenuOpen && !e.target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`hidden lg:flex fixed top-0 left-0 h-screen z-40 flex-col ${className}`}
      style={{ overscrollBehavior: 'contain', isolation: 'isolate' }}
    >
      {/* Frost Glass Background - Identico a mobile */}
      <div className={`absolute inset-0 backdrop-blur-[40px] backdrop-saturate-150 ${isDark ? 'bg-black/20' : 'bg-white/30'}`} />
      
      {/* Subtle overlay per leggibilità */}
      <div className={`absolute inset-0 bg-gradient-to-b ${isDark ? 'from-white/[0.03] via-transparent to-white/[0.03]' : 'from-black/[0.02] via-transparent to-black/[0.02]'} pointer-events-none`} />
      
      {/* Border ring come mobile */}
      <div className={`absolute inset-0 ring-1 ring-inset ${isDark ? 'ring-white/10' : 'ring-black/5'} pointer-events-none`} />
      
      {/* Border Glow destro */}
      <div className={`absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b ${isDark ? 'from-white/20 via-white/10 to-transparent' : 'from-slate-300 via-slate-200 to-transparent'}`} />
      
      {/* Content */}
      <div className="relative flex flex-col h-full">
        
        {/* Header - Glass Style */}
        <div className={`h-16 px-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b ${isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
          <SidebarLogo isCollapsed={isCollapsed} branding={branding} />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-all border backdrop-blur-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10 hover:border-white/20' : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'}`}
              >
                <ChevronLeft size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse button when collapsed - Glass Style */}
        <AnimatePresence mode="wait">
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-3"
            >
              <motion.button
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full p-2.5 rounded-2xl transition-all flex items-center justify-center border backdrop-blur-xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10 hover:border-white/20' : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'}`}
              >
                <ChevronRight size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
          {navConfig.sections.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              isCollapsed={isCollapsed}
              currentPath={location.pathname}
              onNavigate={(to) => navigate(to)}
              badges={badges}
              isExpanded={expandedSections[section.id] !== false}
              onToggle={() => toggleSection(section.id)}
              isDark={isDark}
            />
          ))}
        </nav>

        {/* Footer - Glass Style */}
        <div className={`relative px-3 pb-4 pt-3 border-t ${isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
          
          {/* Command Center Button */}
          {!isCollapsed ? (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCommandCenterOpen(true)}
              className={`w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-2xl backdrop-blur-xl transition-all text-sm font-medium ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 text-white hover:from-cyan-500/20 hover:to-purple-500/20 hover:border-white/20' : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-slate-200 text-slate-700 hover:from-cyan-500/20 hover:to-purple-500/20'}`}
            >
              <Grid3X3 size={16} />
              Tutte le Pagine
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCommandCenterOpen(true)}
              className={`w-full p-2.5 mb-3 rounded-2xl backdrop-blur-xl transition-all ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 text-white hover:from-cyan-500/20 hover:to-purple-500/20' : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-slate-200 text-slate-700'}`}
              title="Tutte le Pagine"
            >
              <Grid3X3 size={18} className="mx-auto" />
            </motion.button>
          )}
          
          {/* Quick Actions - Glass Buttons */}
          {!isCollapsed ? (
            <div className="flex gap-2.5 mb-3">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/guida')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all text-xs font-medium shadow-lg shadow-amber-500/5"
              >
                <HelpCircle size={14} />
                Aiuto
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleTheme}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl backdrop-blur-xl transition-all text-xs font-medium shadow-lg ${isDark ? 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-white shadow-black/5' : 'bg-slate-900/5 border border-slate-200 text-slate-600 hover:bg-slate-900/10 hover:border-slate-300 hover:text-slate-900 shadow-slate-500/5'}`}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                {isDark ? 'Chiaro' : 'Scuro'}
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 mb-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/guida')}
                className="p-2.5 rounded-2xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all"
                title="Aiuto"
              >
                <HelpCircle size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`p-2.5 rounded-2xl backdrop-blur-xl transition-all ${isDark ? 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-white' : 'bg-slate-900/5 border border-slate-200 text-slate-600 hover:bg-slate-900/10 hover:border-slate-300 hover:text-slate-900'}`}
                title={isDark ? 'Tema Chiaro' : 'Tema Scuro'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>
            </div>
          )}
          
          {/* User Profile - Glass Card */}
          <div className="relative" data-user-menu>
            <motion.button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl backdrop-blur-xl transition-all border shadow-lg ${
                isUserMenuOpen 
                  ? (isDark ? 'bg-white/10 border-white/15 shadow-black/10' : 'bg-slate-900/10 border-slate-300 shadow-slate-500/10') 
                  : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/15 shadow-black/5' : 'bg-slate-900/5 border-slate-200 hover:bg-slate-900/10 hover:border-slate-300 shadow-slate-500/5')
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=06b6d4&color=fff`}
                  alt="User"
                  className="w-9 h-9 rounded-xl ring-2 ring-white/20 shadow-lg shadow-black/20"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 shadow-lg shadow-emerald-500/50 ${isDark ? 'border-slate-950' : 'border-white'}`} />
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.displayName || 'Utente'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${isDark ? 'text-slate-500' : 'text-slate-400'} ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </motion.button>

            {/* Dropdown - Glass Style */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute bottom-full mb-2 ${isCollapsed ? 'left-0' : 'left-0 right-0'} min-w-[200px] backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden z-50 ${isDark ? 'bg-slate-950/80 border border-white/10' : 'bg-white/90 border border-slate-200'}`}
                >
                  {/* User Header - Glass */}
                  <div className={`p-3 border-b bg-gradient-to-r from-cyan-500/10 to-purple-500/10 ${isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.displayName || 'Utente'}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
                  </div>
                  
                  {/* Menu Items - Glass Hover */}
                  <div className="py-1.5 px-1.5">
                    <button onClick={handleNavigateProfile} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                      <User size={16} className="text-blue-400" /> Profilo
                    </button>
                    <button onClick={handleNavigateSettings} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                      <Settings size={16} className="text-cyan-400" /> Impostazioni
                    </button>
                    <button 
                      onClick={() => { setIsUserMenuOpen(false); setIsCustomizerOpen(true); }} 
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      <LayoutGrid size={16} className="text-purple-400" /> Personalizza Menu
                    </button>
                    {role === 'admin' && (
                      <button onClick={handleNavigateBilling} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                        <CreditCard size={16} className="text-emerald-400" /> Abbonamento
                      </button>
                    )}
                  </div>
                  
                  {/* Logout - Glass */}
                  <div className={`border-t py-1.5 px-1.5 ${isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                      <LogOut size={16} /> Esci
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Modal Personalizza Menu */}
      <SidebarCustomizer 
        isOpen={isCustomizerOpen} 
        onClose={() => setIsCustomizerOpen(false)} 
        role={role}
      />
      
      {/* Command Center */}
      <CommandCenter 
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        role={role}
        badges={badges}
      />
    </motion.aside>
  );
};

// === MOBILE NEBULA SIDEBAR ===
export const MobileNebulaSidebar = ({ 
  role = 'admin',
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [branding, setBranding] = useState(defaultBranding);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const user = auth.currentUser;
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Hook per notifiche
  const { unreadCount: unreadAnamnesi } = useUnreadAnamnesi();
  const { unreadCount: unreadChecks } = useUnreadChecks();
  const unreadChat = useUnreadCount();

  const navConfig = getNavConfig(role);
  
  const badges = useMemo(() => ({
    '/chat': unreadChat,
    '/coach/chat': unreadChat,
    '/client/chat': unreadChat,
    '/coach/anamnesi': unreadAnamnesi,
    '/admin/anamnesi': unreadAnamnesi,
    '/admin/checks': unreadChecks,
    '/coach/checks': unreadChecks,
  }), [unreadChat, unreadAnamnesi, unreadChecks]);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const tid = localStorage.getItem('tenantId');
        if (!tid) return;
        const brandingDoc = await getDoc(doc(db, 'tenants', tid, 'settings', 'branding'));
        if (brandingDoc.exists()) {
          setBranding({ ...defaultBranding, ...brandingDoc.data() });
        }
      } catch (error) {
        console.debug('Could not load branding:', error);
      }
    };
    loadBranding();
  }, []);

  // Blocca lo scroll del body quando la sidebar è aperta
  useEffect(() => {
    if (isOpen) {
      // Salva la posizione di scroll corrente
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Ripristina lo scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      // Pulisci tutto prima del logout
      localStorage.removeItem('tenantId');
      localStorage.removeItem('last_path');
      sessionStorage.removeItem('app_role');
      sessionStorage.removeItem('creating_collaboratore');
      
      await signOut(auth);
      onClose();
      
      // Forza refresh per pulire cache React
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      onClose();
      // In caso di errore, forza comunque il redirect
      window.location.href = '/login';
    }
  };

  const handleNavigate = (to) => {
    navigate(to);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - Blocca interazioni scroll */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden touch-none"
            style={{ overscrollBehavior: 'contain' }}
          />
          
          {/* Sidebar - Floating Frost Glass */}
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed left-3 top-3 bottom-3 w-[300px] z-50 flex flex-col lg:hidden overflow-hidden rounded-3xl"
            style={{ 
              overscrollBehavior: 'contain',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
            }}
          >
            {/* Frost Glass Background - Usa bg semi-trasparente per Android */}
            <div 
              className="absolute inset-0 rounded-3xl border border-white/20" 
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(40px) saturate(150%)',
                WebkitBackdropFilter: 'blur(40px) saturate(150%)',
              }}
            />
            
            {/* Subtle overlay per leggibilità */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 rounded-3xl pointer-events-none" />
            
            {/* Border Glow sottile */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />
            
            {/* Content */}
            <div className="relative flex flex-col h-full">
              
              {/* Header - Glass Style */}
              <div className="pt-6 pb-4 px-4 flex items-center justify-between border-b border-white/5">
                <SidebarLogo isCollapsed={false} branding={branding} />
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all shadow-lg shadow-black/20"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
                {/* Command Center Button - Mobile */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCommandCenterOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-2xl backdrop-blur-xl transition-all text-sm font-medium bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 text-white hover:from-cyan-500/20 hover:to-purple-500/20 hover:border-white/20"
                >
                  <Grid3X3 size={16} />
                  Tutte le Pagine
                </motion.button>
                
                {navConfig.sections.map((section) => (
                  <NavSection
                    key={section.id}
                    section={section}
                    isCollapsed={false}
                    currentPath={location.pathname}
                    onNavigate={handleNavigate}
                    badges={badges}
                    isExpanded={true}
                    onToggle={() => {}}
                  />
                ))}
              </nav>

              {/* User Section - Glass Card */}
              <div className="relative p-4 border-t border-white/5">
                {/* User Card - Glass Style */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 mb-3 hover:bg-white/10 hover:border-white/15 transition-all shadow-lg shadow-black/10"
                >
                  <div className="relative">
                    <img 
                      src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=06b6d4&color=fff`}
                      alt="User"
                      className="w-11 h-11 rounded-2xl ring-2 ring-white/20 shadow-lg shadow-black/30"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-950 shadow-lg shadow-emerald-500/50" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">{user?.displayName || 'Utente'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} className="text-slate-400" />
                  </motion.div>
                </motion.button>

                {/* User Menu - Glass Expandable */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 mb-3 pb-3 border-b border-white/5 bg-white/[0.02] rounded-2xl p-2 -mx-1">
                        <motion.button
                          whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleNavigate(role === 'client' ? '/client/settings' : role === 'coach' ? '/coach/settings' : '/settings')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white transition-all border border-transparent hover:border-white/10"
                        >
                          <Settings size={16} className="text-cyan-400" />
                          <span className="font-medium">Impostazioni</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsCustomizerOpen(true)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white transition-all border border-transparent hover:border-white/10"
                        >
                          <LayoutGrid size={16} className="text-purple-400" />
                          <span className="font-medium">Personalizza Menu</span>
                        </motion.button>
                        {role === 'admin' && (
                          <motion.button
                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigate('/billing')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white transition-all border border-transparent hover:border-white/10"
                          >
                            <CreditCard size={16} className="text-emerald-400" />
                            <span className="font-medium">Abbonamento</span>
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Action Buttons - Glass Style */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigate('/guida')}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all text-sm font-medium shadow-lg shadow-amber-500/10"
                  >
                    <HelpCircle size={16} /> Aiuto
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium shadow-lg shadow-black/10"
                  >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    {isDark ? 'Chiaro' : 'Scuro'}
                  </motion.button>
                </div>
                
                {/* Logout - Glass Style */}
                <motion.button
                  whileHover={{ x: 4, backgroundColor: 'rgba(244,63,94,0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-400 border border-transparent hover:border-rose-500/20 transition-all"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Esci</span>
                </motion.button>
              </div>
            </div>
            
            {/* Modal Personalizza Menu */}
            <SidebarCustomizer 
              isOpen={isCustomizerOpen} 
              onClose={() => setIsCustomizerOpen(false)} 
              role={role}
            />
            
            {/* Command Center */}
            <CommandCenter 
              isOpen={isCommandCenterOpen}
              onClose={() => setIsCommandCenterOpen(false)}
              role={role}
              onNavigate={handleNavigate}
              badges={badges}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default NebulaSidebar;
