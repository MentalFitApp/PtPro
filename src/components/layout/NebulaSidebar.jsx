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
  X, User, Sun, Moon, LayoutGrid, Sparkles, Zap, ChevronDown
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
            <img src="/logo192.png" alt="FitFlow" className="w-full h-full object-cover" />
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
              <img src="/logo192.png" alt="FitFlow" className="w-full h-full object-cover" />
            </motion.div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-white leading-tight">{branding?.appName || 'FitFlow'}</h1>
            <span className="text-[10px] font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tracking-wider uppercase flex items-center gap-1">
              <Sparkles size={10} /> Pro
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
};

// === NAV ITEM NEBULA ===
const NavItem = ({ item, isActive, isCollapsed, onClick, badge = 0, isDark = true }) => {
  const Icon = item.icon;
  const colors = colorMap[item.color] || colorMap.blue;
  
  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 group overflow-hidden ${
        isActive
          ? `${colors.bg} ${colors.text} border ${colors.border}`
          : isDark 
            ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 border border-transparent'
      }`}
      whileHover={{ x: isCollapsed ? 0 : 4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      title={isCollapsed ? item.label : undefined}
    >
      {/* Glow effect on active */}
      {isActive && (
        <motion.div
          layoutId="navGlow"
          className={`absolute inset-0 ${colors.bg} blur-xl opacity-50`}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeBar"
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 ${colors.text.replace('text-', 'bg-')} rounded-full`}
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
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
    >
      {/* Glass Background - Light/Dark aware */}
      <div className={`absolute inset-0 backdrop-blur-2xl ${isDark ? 'bg-slate-900/40' : 'bg-white/70'}`} />
      
      {/* Nebula Glow Effects */}
      <div className={`absolute -top-20 -left-20 w-60 h-60 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/5'}`} />
      <div className={`absolute -bottom-20 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`} />
      
      {/* Border Glow */}
      <div className={`absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b ${isDark ? 'from-cyan-500/20 via-purple-500/20 to-transparent' : 'from-cyan-500/30 via-purple-500/20 to-transparent'}`} />
      
      {/* Content */}
      <div className="relative flex flex-col h-full">
        
        {/* Header */}
        <div className={`h-16 px-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <SidebarLogo isCollapsed={isCollapsed} branding={branding} />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg transition-all border ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5' : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 hover:text-slate-900 border-slate-200'}`}
              >
                <ChevronLeft size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse button when collapsed */}
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
                className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-center border ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5' : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 hover:text-slate-900 border-slate-200'}`}
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

        {/* Footer */}
        <div className={`relative px-3 pb-4 pt-2 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
          {/* Quick Actions */}
          {!isCollapsed ? (
            <div className="flex gap-2 mb-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/guida')}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium"
              >
                <HelpCircle size={14} />
                Aiuto
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors text-xs font-medium ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 hover:text-slate-900'}`}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                {isDark ? 'Chiaro' : 'Scuro'}
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/guida')}
                className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                title="Aiuto"
              >
                <HelpCircle size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-colors ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 hover:text-slate-900'}`}
                title={isDark ? 'Tema Chiaro' : 'Tema Scuro'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>
            </div>
          )}
          
          {/* User Profile */}
          <div className="relative" data-user-menu>
            <motion.button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                isUserMenuOpen 
                  ? (isDark ? 'bg-white/10' : 'bg-slate-900/10') 
                  : (isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-900/5 hover:bg-slate-900/10')
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=06b6d4&color=fff`}
                  alt="User"
                  className="w-9 h-9 rounded-xl ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
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

            {/* Dropdown */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute bottom-full mb-2 ${isCollapsed ? 'left-0' : 'left-0 right-0'} min-w-[200px] backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden z-50 ${isDark ? 'bg-slate-900/95 border border-white/10' : 'bg-white/95 border border-slate-200'}`}
                >
                  {/* User Header */}
                  <div className={`p-3 border-b bg-gradient-to-r from-cyan-500/10 to-purple-500/10 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.displayName || 'Utente'}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <button onClick={handleNavigateProfile} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}>
                      <User size={16} className="text-blue-400" /> Profilo
                    </button>
                    <button onClick={handleNavigateSettings} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}>
                      <Settings size={16} className="text-cyan-400" /> Impostazioni
                    </button>
                    <button 
                      onClick={() => { setIsUserMenuOpen(false); setIsCustomizerOpen(true); }} 
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      <LayoutGrid size={16} className="text-purple-400" /> Personalizza Menu
                    </button>
                    {role === 'admin' && (
                      <button onClick={handleNavigateBilling} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}>
                        <CreditCard size={16} className="text-emerald-400" /> Abbonamento
                      </button>
                    )}
                  </div>
                  
                  {/* Logout */}
                  <div className={`border-t py-1 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
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
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 lg:hidden"
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed left-0 top-0 h-screen w-[300px] z-50 flex flex-col lg:hidden overflow-hidden"
          >
            {/* Glass Background */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" />
            
            {/* Nebula Effects */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-10 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Content */}
            <div className="relative flex flex-col h-full">
              
              {/* Header */}
              <div className="p-4 flex items-center justify-between">
                <SidebarLogo isCollapsed={false} branding={branding} />
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
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

              {/* User Section */}
              <div className="relative p-4 border-t border-white/10">
                {/* User Card - Clickable */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 mb-3 hover:from-cyan-500/15 hover:to-purple-500/15 transition-all"
                >
                  <div className="relative">
                    <img 
                      src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=06b6d4&color=fff`}
                      alt="User"
                      className="w-12 h-12 rounded-xl ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
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

                {/* User Menu - Expandable */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 mb-3 pb-3 border-b border-white/10">
                        <motion.button
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleNavigate(role === 'client' ? '/client/settings' : role === 'coach' ? '/coach/settings' : '/settings')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 transition-colors"
                        >
                          <Settings size={16} className="text-cyan-400" />
                          <span className="font-medium">Impostazioni</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsCustomizerOpen(true)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 transition-colors"
                        >
                          <LayoutGrid size={16} className="text-purple-400" />
                          <span className="font-medium">Personalizza Menu</span>
                        </motion.button>
                        {role === 'admin' && (
                          <motion.button
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigate('/billing')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 transition-colors"
                          >
                            <CreditCard size={16} className="text-emerald-400" />
                            <span className="font-medium">Abbonamento</span>
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigate('/guida')}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors text-sm font-medium"
                  >
                    <HelpCircle size={16} /> Aiuto
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white transition-colors text-sm font-medium"
                  >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    {isDark ? 'Chiaro' : 'Scuro'}
                  </motion.button>
                </div>
                
                {/* Logout */}
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/15 transition-colors"
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default NebulaSidebar;
