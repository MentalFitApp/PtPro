// src/components/layout/ProSidebar.jsx
// Sidebar professionale con sezioni raggruppate
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { isSuperAdmin } from '../../utils/superadmin';
import { defaultBranding } from '../../config/tenantBranding';
import { useUnreadAnamnesi, useUnreadChecks } from '../../hooks/useUnreadNotifications';
import { useUnreadCount } from '../../hooks/useChat';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Home, Users, FileText, Calendar, Settings, MessageSquare,
  ChevronRight, ChevronLeft, BarChart3, BellRing, UserCheck,
  BookOpen, Target, Activity, Plus, Palette, Layout, Link2,
  Dumbbell, Utensils, Shield, CreditCard, LogOut, HelpCircle,
  Zap, Package, Menu, X, User, Sun, Moon
} from 'lucide-react';
import { signOut } from 'firebase/auth';

// === CONFIGURAZIONE NAVIGAZIONE PER RUOLO ===
const getNavConfig = (role, isSuperAdmin = false) => {
  const configs = {
    admin: {
      sections: [
        {
          title: 'Main',
          items: [
            { to: '/', icon: Home, label: 'Dashboard' },
            { to: '/clients', icon: Users, label: 'Clienti' },
            { to: '/chat', icon: MessageSquare, label: 'Messaggi', hasBadge: 'chat' },
            { to: '/calendar', icon: Calendar, label: 'Calendario' },
          ]
        },
        {
          title: 'Gestione',
          items: [
            { to: '/collaboratori', icon: UserCheck, label: 'Collaboratori' },
            { to: '/admin/dipendenti', icon: Users, label: 'Dipendenti' },
            { to: '/alimentazione-allenamento', icon: Target, label: 'Schede' },
          ]
        },
        {
          title: 'Contenuti',
          items: [
            { to: '/admin/checks', icon: Activity, label: 'Check', hasBadge: 'checks' },
            { to: '/admin/anamnesi', icon: FileText, label: 'Anamnesi', hasBadge: 'anamnesi' },
            { to: '/courses', icon: BookOpen, label: 'Corsi' },
            { to: '/community', icon: Users, label: 'Community' },
            { to: '/admin/landing-pages', icon: Layout, label: 'Landing Pages' },
          ]
        },
        {
          title: 'Analytics',
          items: [
            { to: '/analytics-dashboard', icon: Activity, label: 'Dashboard Analytics' },
            { to: '/business-history', icon: BarChart3, label: 'Business History' },
            { to: '/statistiche', icon: Activity, label: 'Statistiche' },
            { to: '/analytics', icon: BarChart3, label: 'Report Dettagliato' },
          ]
        },
        {
          title: 'Impostazioni',
          items: [
            { to: '/admin/branding', icon: Palette, label: 'Branding' },
            { to: '/integrations', icon: Link2, label: 'Integrazioni' },
            { to: '/platform-settings', icon: Settings, label: 'Piattaforma' },
          ]
        }
      ]
    },
    coach: {
      sections: [
        {
          title: 'Main',
          items: [
            { to: '/coach', icon: Home, label: 'Dashboard' },
            { to: '/coach/clients', icon: Users, label: 'Clienti' },
            { to: '/coach/chat', icon: MessageSquare, label: 'Messaggi', hasBadge: 'chat' },
          ]
        },
        {
          title: 'Gestione',
          items: [
            { to: '/coach/checks', icon: Activity, label: 'Check', hasBadge: 'checks' },
            { to: '/coach/anamnesi', icon: FileText, label: 'Anamnesi', hasBadge: 'anamnesi' },
            { to: '/coach/schede', icon: Target, label: 'Schede' },
          ]
        },
        {
          title: 'Altro',
          items: [
            { to: '/coach/updates', icon: BellRing, label: 'Aggiornamenti' },
            { to: '/coach/settings', icon: Settings, label: 'Impostazioni' },
          ]
        }
      ]
    },
    client: {
      sections: [
        {
          title: 'Main',
          items: [
            { to: '/client/dashboard', icon: Home, label: 'Dashboard' },
            { to: '/client/scheda-allenamento', icon: Dumbbell, label: 'Allenamento' },
            { to: '/client/scheda-alimentazione', icon: Utensils, label: 'Alimentazione' },
          ]
        },
        {
          title: 'Comunicazioni',
          items: [
            { to: '/client/chat', icon: MessageSquare, label: 'Chat', hasBadge: 'chat' },
            { to: '/client/community', icon: Users, label: 'Community' },
          ]
        },
        {
          title: 'Profilo',
          items: [
            { to: '/client/anamnesi', icon: FileText, label: 'Anamnesi' },
            { to: '/client/checks', icon: Activity, label: 'Check' },
            { to: '/client/payments', icon: CreditCard, label: 'Pagamenti' },
            { to: '/client/courses', icon: BookOpen, label: 'Corsi' },
            { to: '/client/settings', icon: Settings, label: 'Impostazioni' },
          ]
        }
      ]
    },
    collaboratore: {
      sections: [
        {
          title: 'Main',
          items: [
            { to: '/collaboratore/dashboard', icon: Home, label: 'Dashboard' },
            { to: '/collaboratore/calendar', icon: Calendar, label: 'Calendario' },
          ]
        }
      ]
    }
  };

  return configs[role] || configs.admin;
};

// === SIDEBAR LOGO ===
const SidebarLogo = ({ isCollapsed, branding }) => {
  // Mostra cappellino di Natale dal 1 dicembre al 7 gennaio
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();
  const showChristmasHat = (month === 11) || (month === 0 && day <= 7); // Dicembre o Gennaio 1-7
  
  // Posizione manuale del cappellino: modifica top e left per regolare
  const ChristmasHat = () => (
    <img 
      src="/christmas-hat.png" 
      alt="🎅"
      className="absolute z-10 drop-shadow-lg pointer-events-none"
      style={{ 
        top: '-16px',    // Distanza dall'alto (negativo = più su)
        left: '8px',     // Distanza da sinistra (aumenta per spostare a destra)
        width: '44px', 
        height: '44px',
        transform: 'rotate(-10deg)' 
      }}
    />
  );
  
  if (isCollapsed) {
    return branding?.logoUrl ? (
      <div className="relative mx-auto">
        {showChristmasHat && <ChristmasHat />}
        <motion.img 
          src={branding.logoUrl} 
          alt={branding.appName}
          className="h-9 w-9 object-contain"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
      </div>
    ) : (
      <div className="relative mx-auto">
        {showChristmasHat && <ChristmasHat />}
        <motion.div 
          className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20"
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <img 
            src="/logo192.png" 
            alt="FitFlow"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="flex items-center gap-3"
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {branding?.logoUrl ? (
        <div className="relative">
          {showChristmasHat && <ChristmasHat />}
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
            {showChristmasHat && <ChristmasHat />}
            <motion.div 
              className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/25"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <img 
                src="/logo192.png" 
                alt="FitFlow"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-theme-text-primary leading-tight">{branding?.appName || 'FitFlow'}</h1>
            <span className="text-[10px] font-medium text-blue-400/70 tracking-wider uppercase">Pro</span>
          </div>
        </>
      )}
    </motion.div>
  );
};

// === NAV ITEM ===
const NavItem = ({ item, isActive, isCollapsed, onClick, badge = 0 }) => {
  const Icon = item.icon;
  
  // Genera tour ID dalla path - mappa completa per tutti i ruoli
  const getTourId = (path) => {
    // Dashboard
    if (path === '/' || path === '/coach' || path === '/client/dashboard' || path === '/collaboratore/dashboard') return 'dashboard';
    
    // Admin routes
    if (path === '/clients') return 'clients';
    if (path === '/calendar' || path.includes('/calendar')) return 'calendar';
    if (path === '/collaboratori') return 'collaboratori';
    if (path === '/alimentazione-allenamento') return 'schede';
    if (path === '/community' || path.includes('/community')) return 'community';
    if (path === '/analytics' || path === '/statistiche' || path === '/business-history') return 'analytics';
    if (path.includes('/branding')) return 'branding';
    if (path === '/integrations') return 'integrations';
    
    // Coach routes
    if (path === '/coach/clients') return 'clients';
    if (path === '/coach/anamnesi') return 'anamnesi';
    if (path === '/coach/schede') return 'schede';
    if (path === '/coach/updates') return 'updates';
    
    // Client routes
    if (path === '/client/scheda-allenamento') return 'workout';
    if (path === '/client/scheda-alimentazione') return 'diet';
    if (path === '/client/community') return 'community';
    if (path === '/client/anamnesi') return 'anamnesi';
    if (path === '/client/checks') return 'checks';
    if (path === '/client/payments') return 'payments';
    
    // Collaboratore routes
    if (path === '/collaboratore/calendar') return 'calendar';
    
    return null;
  };
  
  const tourId = getTourId(item.to);
  
  return (
    <motion.button
      onClick={onClick}
      data-tour={tourId}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-blue-500/15 to-sky-500/10 text-blue-400 shadow-sm shadow-blue-500/10'
          : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60'
      }`}
      whileHover={{ x: isCollapsed ? 0 : 3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      title={isCollapsed ? item.label : undefined}
    >
      {/* Active indicator line */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-sky-400 rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      
      <div className="relative">
        <Icon 
          size={18} 
          className={`flex-shrink-0 transition-all duration-200 ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400/70'}`} 
        />
        {badge > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30"
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
            className="truncate font-medium flex-1 text-left"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {!isCollapsed && badge > 0 && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="min-w-[22px] h-[22px] px-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30"
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
    </motion.button>
  );
};

// === SEZIONE NAV ===
const NavSection = ({ section, isCollapsed, currentPath, onNavigate, badges = {} }) => {
  return (
    <div className="mb-5">
      {!isCollapsed && (
        <motion.div 
          className="px-3 mb-2.5 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-theme-text-tertiary/70">
            {section.title}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-theme-text-tertiary/20 to-transparent" />
        </motion.div>
      )}
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = currentPath === item.to || 
            (item.to !== '/' && currentPath.startsWith(item.to + '/'));
          
          return (
            <NavItem
              key={item.to}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
              onClick={() => onNavigate(item.to)}
              badge={badges[item.to] || 0}
            />
          );
        })}
      </div>
    </div>
  );
};

// === USER MENU ===
const UserMenu = ({ isCollapsed, user, onLogout, onNavigateProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Utente';
  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
  
  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
          isCollapsed ? 'justify-center' : ''
        } ${isOpen ? 'bg-theme-bg-tertiary/60' : 'hover:bg-theme-bg-tertiary/40'}`}
      >
        <div className="relative">
          <img 
            src={photoURL}
            alt={displayName}
            className="w-10 h-10 rounded-xl ring-2 ring-theme shadow-lg"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-theme-bg-secondary" />
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-theme-text-primary truncate">{displayName}</p>
              <p className="text-xs text-theme-text-tertiary truncate">{user?.email}</p>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight 
                size={16} 
                className="text-theme-text-tertiary"
              />
            </motion.div>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute bottom-full left-2 right-2 mb-2 bg-theme-bg-secondary/95 backdrop-blur-xl border border-theme/50 rounded-xl shadow-xl shadow-black/20 overflow-hidden"
          >
            <motion.button
              onClick={() => { onNavigateProfile(); setIsOpen(false); }}
              whileHover={{ x: 2 }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors"
            >
              <Settings size={16} className="text-blue-400" />
              <span>Impostazioni</span>
            </motion.button>
            <div className="h-px bg-theme/50" />
            <motion.button
              onClick={() => { onLogout(); setIsOpen(false); }}
              whileHover={{ x: 2 }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} />
              <span>Esci</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// === MAIN SIDEBAR COMPONENT ===
export const ProSidebar = ({ 
  role = 'admin',
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [branding, setBranding] = useState(defaultBranding);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const user = auth.currentUser;
  
  // Hook per notifiche non lette
  const { unreadCount: unreadAnamnesi } = useUnreadAnamnesi();
  const { unreadCount: unreadChecks } = useUnreadChecks();
  const unreadChat = useUnreadCount();

  const navConfig = getNavConfig(role, userIsSuperAdmin);
  
  // Theme toggle
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Badge per le varie voci di menu
  const badges = {
    // Badge per chat
    '/chat': unreadChat,
    '/coach/chat': unreadChat,
    '/client/chat': unreadChat,
    // Badge per anamnesi (admin e coach)
    '/coach/anamnesi': unreadAnamnesi,
    '/admin/anamnesi': unreadAnamnesi,
    // Badge per check
    '/admin/checks': unreadChecks,
    '/coach/checks': unreadChecks,
    '/statistiche': unreadChecks,
  };

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

  // Verifica SuperAdmin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (user) {
        const isSA = await isSuperAdmin(user.uid);
        setUserIsSuperAdmin(isSA);
      }
    };
    checkSuperAdmin();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigateProfile = () => {
    setIsUserMenuOpen(false);
    const profilePaths = {
      admin: '/profile',
      coach: '/coach/profile',
      client: '/client/settings',
      collaboratore: '/collaboratore/profile'
    };
    navigate(profilePaths[role] || '/profile');
  };

  const handleNavigateSettings = () => {
    setIsUserMenuOpen(false);
    const settingsPaths = {
      admin: '/settings',
      coach: '/coach/settings',
      client: '/client/settings',
      collaboratore: '/collaboratore/settings'
    };
    navigate(settingsPaths[role] || '/settings');
  };

  const handleNavigateBilling = () => {
    setIsUserMenuOpen(false);
    navigate('/billing');
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
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 h-screen bg-slate-900/60 backdrop-blur-xl z-40 flex flex-col border-r border-blue-500/20 shadow-[1px_0_15px_rgba(59,130,246,0.15)] ${className}`}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] via-transparent to-sky-500/[0.02] pointer-events-none" />
      
      {/* Header con logo */}
      <div className={`relative h-[64px] px-3 pt-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
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
              className="p-1.5 rounded-lg bg-theme-bg-tertiary/40 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary transition-all"
              title="Comprimi sidebar"
            >
              <ChevronLeft size={14} />
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
            className="px-2 pb-2"
          >
            <motion.button
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full p-2 rounded-lg bg-theme-bg-tertiary/40 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary transition-all flex items-center justify-center"
              title="Espandi sidebar"
            >
              <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="relative flex-1 px-2 py-1 overflow-y-auto scrollbar-hide">
        {navConfig.sections.map((section, idx) => (
          <NavSection
            key={section.title}
            section={section}
            isCollapsed={isCollapsed}
            currentPath={location.pathname}
            onNavigate={(to) => navigate(to)}
            badges={badges}
          />
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="relative px-2 pb-2 pt-1 border-t border-white/5">
        {/* Help button */}
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-all mb-2"
              onClick={() => navigate('/guida')}
            >
              <HelpCircle size={16} className="text-amber-400/70" />
              <span className="font-medium">Aiuto</span>
            </motion.button>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center p-2 rounded-lg text-theme-text-secondary hover:text-amber-400 hover:bg-theme-bg-tertiary/60 transition-all mb-2"
              onClick={() => navigate('/guida')}
              title="Aiuto"
            >
              <HelpCircle size={18} className="text-amber-400/70" />
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* User profile with dropdown */}
        <div className="relative" data-user-menu>
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-gradient-to-r from-theme-bg-tertiary/40 to-transparent hover:from-theme-bg-tertiary/60 transition-all"
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=3b82f6&color=fff`}
                    alt="User"
                    className="w-9 h-9 rounded-lg ring-1 ring-theme/50 shadow-md"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-theme-text-primary truncate">{user?.displayName || 'Utente'}</p>
                  <p className="text-[10px] text-theme-text-tertiary truncate">{user?.email}</p>
                </div>
                <Settings size={14} className="text-theme-text-tertiary" />
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-theme-bg-tertiary/40 transition-all"
              >
                <div className="relative">
                  <img 
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=3b82f6&color=fff`}
                    alt="User"
                    className="w-9 h-9 rounded-lg ring-1 ring-theme/50 shadow-md"
                    title={user?.displayName || 'Profilo'}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Dropdown menu */}
          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute bottom-full mb-2 ${isCollapsed ? 'left-0' : 'left-0 right-0'} min-w-[180px] bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50`}
              >
                {/* User info header */}
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white truncate">{user?.displayName || 'Utente'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                
                {/* Menu items */}
                <div className="py-1">
                  <button 
                    onClick={handleNavigateProfile} 
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    <User size={14} /> Profilo
                  </button>
                  <button 
                    onClick={handleNavigateSettings} 
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    <Settings size={14} /> Impostazioni
                  </button>
                  {role === 'admin' && (
                    <button 
                      onClick={handleNavigateBilling} 
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      <CreditCard size={14} /> Abbonamento
                    </button>
                  )}
                  {/* Theme Toggle */}
                  <button 
                    onClick={toggleTheme} 
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-blue-400" />}
                      {isDark ? 'Tema Chiaro' : 'Tema Scuro'}
                    </span>
                    <span className="text-xs text-slate-500">{isDark ? '☀️' : '🌙'}</span>
                  </button>
                </div>
                
                {/* Logout */}
                <div className="border-t border-white/10 py-1">
                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={14} /> Esci
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};

// === MOBILE SIDEBAR OVERLAY ===
export const MobileSidebar = ({ 
  role = 'admin',
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [branding, setBranding] = useState(defaultBranding);
  const user = auth.currentUser;
  const { theme, toggleTheme, isDark } = useTheme();

  const navConfig = getNavConfig(role);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 lg:hidden"
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed left-0 top-0 h-screen w-[280px] bg-slate-900/70 backdrop-blur-xl z-50 flex flex-col lg:hidden"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] via-transparent to-sky-500/[0.02] pointer-events-none" />
            
            {/* Header */}
            <div className="relative p-4 flex items-center justify-between">
              <SidebarLogo isCollapsed={false} branding={branding} />
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-xl bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary transition-all"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 p-3 overflow-y-auto scrollbar-hide">
              {navConfig.sections.map((section) => (
                <NavSection
                  key={section.title}
                  section={section}
                  isCollapsed={false}
                  currentPath={location.pathname}
                  onNavigate={handleNavigate}
                />
              ))}
            </nav>

            {/* User */}
            <div className="relative p-3 border-t border-theme/50">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-theme-bg-tertiary/50 to-transparent border border-theme/30">
                <div className="relative">
                  <img 
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=3b82f6&color=fff`}
                    alt="User"
                    className="w-11 h-11 rounded-xl ring-2 ring-theme shadow-lg"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-theme-bg-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-theme-text-primary truncate">{user?.displayName || 'Utente'}</p>
                  <p className="text-xs text-theme-text-tertiary truncate">{user?.email}</p>
                </div>
              </div>
              {/* Theme Toggle Button */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 flex items-center justify-between px-4 py-3 rounded-xl text-sm text-theme-text-secondary hover:bg-theme-bg-tertiary/60 transition-colors"
              >
                <span className="flex items-center gap-3">
                  {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-400" />}
                  <span className="font-medium">{isDark ? 'Tema Chiaro' : 'Tema Scuro'}</span>
                </span>
                <span className="text-xs">{isDark ? '☀️' : '🌙'}</span>
              </motion.button>
              <motion.button
                onClick={handleLogout}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">Esci</span>
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProSidebar;
