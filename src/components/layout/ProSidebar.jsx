// src/components/layout/ProSidebar.jsx
// Sidebar professionale con sezioni raggruppate
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { isSuperAdmin } from '../../utils/superadmin';
import { defaultBranding } from '../../config/tenantBranding';
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
            { to: '/courses', icon: BookOpen, label: 'Corsi' },
            { to: '/community', icon: Users, label: 'Community' },
            { to: '/updates', icon: BellRing, label: 'Novità' },
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
            { to: '/coach/anamnesi', icon: FileText, label: 'Anamnesi' },
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
      <img 
        src={branding.logoUrl} 
        alt={branding.appName}
        className="h-8 w-8 object-contain mx-auto"
      />
    ) : (
      <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-blue-500/30 mx-auto">
        <img 
          src="/logo192.PNG" 
          alt="FitFlow"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {branding?.logoUrl ? (
        <img 
          src={branding.logoUrl} 
          alt={branding.appName}
          className="h-8 max-w-[140px] object-contain"
        />
      ) : (
        <>
          <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20">
            <img 
              src="/logo192.PNG" 
              alt="FitFlow"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">{branding?.appName || 'FitFlow'}</h1>
          </div>
        </>
      )}
    </div>
  );
};

// === NAV ITEM ===
const NavItem = ({ item, isActive, isCollapsed, onClick }) => {
  const Icon = item.icon;
  
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
        isActive
          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
      whileHover={{ x: isCollapsed ? 0 : 2 }}
      whileTap={{ scale: 0.98 }}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon size={18} className="flex-shrink-0" />
      {!isCollapsed && (
        <span className="truncate font-medium">{item.label}</span>
      )}
    </motion.button>
  );
};

// === SEZIONE NAV ===
const NavSection = ({ section, isCollapsed, currentPath, onNavigate }) => {
  return (
    <div className="mb-4">
      {!isCollapsed && (
        <div className="px-3 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {section.title}
          </span>
        </div>
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <img 
          src={photoURL}
          alt={displayName}
          className="w-9 h-9 rounded-full ring-2 ring-slate-700"
        />
        {!isCollapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <ChevronRight 
              size={16} 
              className={`text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
          >
            <button
              onClick={() => { onNavigateProfile(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              <Settings size={16} />
              <span>Impostazioni</span>
            </button>
            <button
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700/50 transition-colors"
            >
              <LogOut size={16} />
              <span>Esci</span>
            </button>
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

  const navConfig = getNavConfig(role, userIsSuperAdmin);

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
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`fixed top-0 left-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-40 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-slate-700/50 ${isCollapsed ? 'px-3' : ''}`}>
        <div className="flex items-center justify-between">
          <SidebarLogo isCollapsed={isCollapsed} branding={branding} />
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Comprimi sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
        
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full mt-3 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
            title="Espandi sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto scrollbar-hide">
        {navConfig.sections.map((section, idx) => (
          <NavSection
            key={section.title}
            section={section}
            isCollapsed={isCollapsed}
            currentPath={location.pathname}
            onNavigate={(to) => navigate(to)}
          />
        ))}
      </nav>

      {/* Help */}
      {!isCollapsed && (
        <div className="px-3 pb-2">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            onClick={() => navigate('/guida')}
          >
            <HelpCircle size={18} />
            <span>Aiuto</span>
          </button>
        </div>
      )}

      {/* User Menu */}
      <div className="p-3 border-t border-slate-700/50">
        <UserMenu
          isCollapsed={isCollapsed}
          user={user}
          onLogout={handleLogout}
          onNavigateProfile={handleNavigateProfile}
        />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-screen w-72 bg-slate-900/98 backdrop-blur-xl border-r border-slate-700/50 z-50 flex flex-col lg:hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <SidebarLogo isCollapsed={false} branding={branding} />
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 overflow-y-auto">
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
            <div className="p-3 border-t border-slate-700/50">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=3b82f6&color=fff`}
                  alt="User"
                  className="w-10 h-10 rounded-full ring-2 ring-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{user?.displayName || 'Utente'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-slate-800/50 transition-colors"
              >
                <LogOut size={18} />
                <span>Esci</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProSidebar;
