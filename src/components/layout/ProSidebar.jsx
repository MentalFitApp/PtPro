// src/components/layout/ProSidebar.jsx
// Sidebar professionale con sezioni raggruppate
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { isSuperAdmin } from '../../utils/superadmin';
import { defaultBranding } from '../../config/tenantBranding';
import { useUnreadMessages, useUnreadAnamnesi, useUnreadChecks } from '../../hooks/useUnreadNotifications';
import {
  Home, Users, MessageSquare, FileText, Calendar, Settings,
  ChevronRight, ChevronLeft, BarChart3, BellRing, UserCheck,
  BookOpen, Target, Activity, Plus, Palette, Layout, Link2,
  Dumbbell, Utensils, Shield, CreditCard, LogOut, HelpCircle,
  Zap, Package, Menu, X
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
            { to: '/chat', icon: MessageSquare, label: 'Messaggi' },
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
          ]
        },
        {
          title: 'Analytics',
          items: [
            { to: '/business-history', icon: BarChart3, label: 'Business History' },
            { to: '/statistiche', icon: Activity, label: 'Statistiche' },
            { to: '/analytics', icon: BarChart3, label: 'Analytics' },
          ]
        },
        {
          title: 'Impostazioni',
          items: [
            { to: '/admin/branding', icon: Palette, label: 'Branding' },
            { to: '/landing-pages', icon: Layout, label: 'Landing Pages' },
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
            { to: '/coach/chat', icon: MessageSquare, label: 'Messaggi' },
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
            { to: '/client/chat', icon: MessageSquare, label: 'Chat' },
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
  if (isCollapsed) {
    return branding?.logoUrl ? (
      <motion.img 
        src={branding.logoUrl} 
        alt={branding.appName}
        className="h-9 w-9 object-contain mx-auto"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    ) : (
      <motion.div 
        className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-500/30 mx-auto shadow-lg shadow-blue-500/20"
        whileHover={{ scale: 1.05, rotate: 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <img 
          src="/logo192.png" 
          alt="FitFlow"
          className="w-full h-full object-cover"
        />
      </motion.div>
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
        <motion.img 
          src={branding.logoUrl} 
          alt={branding.appName}
          className="h-9 max-w-[140px] object-contain"
          whileHover={{ scale: 1.02 }}
        />
      ) : (
        <>
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
    if (path === '/chat' || path.includes('/chat')) return 'chat';
    if (path === '/calendar' || path.includes('/calendar')) return 'calendar';
    if (path === '/collaboratori') return 'collaboratori';
    if (path === '/alimentazione-allenamento') return 'schede';
    if (path === '/community' || path.includes('/community')) return 'community';
    if (path === '/analytics' || path === '/statistiche' || path === '/business-history') return 'analytics';
    if (path.includes('/branding')) return 'branding';
    if (path === '/landing-pages') return 'landing';
    if (path === '/integrations') return 'integrations';
    
    // Coach routes
    if (path === '/coach/clients') return 'clients';
    if (path === '/coach/chat') return 'chat';
    if (path === '/coach/anamnesi') return 'anamnesi';
    if (path === '/coach/schede') return 'schede';
    if (path === '/coach/updates') return 'updates';
    
    // Client routes
    if (path === '/client/scheda-allenamento') return 'workout';
    if (path === '/client/scheda-alimentazione') return 'diet';
    if (path === '/client/chat') return 'chat';
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
          ? 'bg-gradient-to-r from-blue-500/15 to-cyan-500/10 text-blue-400 shadow-sm shadow-blue-500/10'
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
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"
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
  const user = auth.currentUser;
  
  // Hook per notifiche non lette
  const { unreadCount: unreadMessages } = useUnreadMessages();
  const { unreadCount: unreadAnamnesi } = useUnreadAnamnesi();
  const { unreadCount: unreadChecks } = useUnreadChecks();

  const navConfig = getNavConfig(role, userIsSuperAdmin);
  
  // Badge per le varie voci di menu
  const badges = {
    '/chat': unreadMessages,
    '/coach/chat': unreadMessages,
    '/client/chat': unreadMessages,
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
    const profilePaths = {
      admin: '/profile',
      coach: '/coach/profile',
      client: '/client/settings',
      collaboratore: '/collaboratore/profile'
    };
    navigate(profilePaths[role] || '/profile');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 76 : 264 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 h-screen bg-theme-bg-secondary/80 backdrop-blur-2xl border-r border-theme/50 z-40 flex flex-col shadow-xl shadow-black/10 ${className}`}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />
      
      {/* Header */}
      <div className={`relative p-4 border-b border-theme/50 ${isCollapsed ? 'px-4' : ''}`}>
        <div className="flex items-center justify-between">
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
                className="p-2 rounded-xl bg-theme-bg-tertiary/40 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary transition-all"
                title="Comprimi sidebar"
              >
                <ChevronLeft size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence mode="wait">
          {isCollapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-full mt-3 p-2 rounded-xl bg-theme-bg-tertiary/40 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary transition-all flex items-center justify-center"
              title="Espandi sidebar"
            >
              <ChevronRight size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 p-3 overflow-y-auto scrollbar-hide">
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

      {/* Help */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-3"
          >
            <motion.button
              whileHover={{ x: 3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-all"
              onClick={() => navigate('/guida')}
            >
              <HelpCircle size={18} className="text-amber-400/70" />
              <span className="font-medium">Aiuto</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
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
            className="fixed left-0 top-0 h-screen w-[280px] bg-theme-bg-secondary/95 backdrop-blur-2xl border-r border-theme/50 z-50 flex flex-col lg:hidden shadow-2xl shadow-black/30"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />
            
            {/* Header */}
            <div className="relative p-4 border-b border-theme/50 flex items-center justify-between">
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
