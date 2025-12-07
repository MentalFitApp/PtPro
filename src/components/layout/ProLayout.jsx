// src/components/layout/ProLayout.jsx
// Layout principale professionale con sidebar, header e content area
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Settings, LogOut, ChevronDown, Bell, User, CreditCard, Home, Users, MessageSquare, Calendar, Dumbbell, Utensils, Activity } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { ProSidebar, MobileSidebar } from './ProSidebar';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationPermissionModal from '../notifications/NotificationPermissionModal';

// === STELLE ANIMATE ===
const AnimatedStars = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    
    const existingContainer = document.querySelector('.stars');
    if (existingContainer) {
      setInitialized(true);
      return;
    }

    const container = document.createElement('div');
    container.className = 'stars';
    document.body.appendChild(container);

    for (let i = 0; i < 35; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      const minDistance = 8;
      let top, left, tooClose;
      
      do {
        top = Math.random() * 100;
        left = Math.random() * 100;
        tooClose = false;
        
        for (let j = 0; j < container.children.length; j++) {
          const existingStar = container.children[j];
          const existingTop = parseFloat(existingStar.style.top);
          const existingLeft = parseFloat(existingStar.style.left);
          const distance = Math.sqrt(Math.pow(top - existingTop, 2) + Math.pow(left - existingLeft, 2));
          
          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }
      } while (tooClose && container.children.length > 0);
      
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      container.appendChild(star);
    }

    setInitialized(true);
  }, [initialized]);

  return null;
};

// === MOBILE HEADER ===
const MobileHeader = ({ onMenuOpen, branding, onProfileMenuToggle, isProfileMenuOpen, onNavigateSettings, onNavigateProfile, onNavigateBilling, onLogout }) => {
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Utente';
  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuOpen}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-2">
            {branding?.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.appName}
                className="h-7 max-w-[100px] object-contain"
              />
            ) : (
              <>
                <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-blue-500/30">
                  <img 
                    src="/logo192.PNG" 
                    alt="FitFlow"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-bold text-white">{branding?.appName || 'FitFlow'}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="relative">
            <button 
              onClick={onProfileMenuToggle}
              className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-700 hover:ring-blue-500/50 transition-all"
            >
              <img 
                src={photoURL}
                alt="User"
                className="w-full h-full object-cover"
              />
            </button>
            
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-slate-700/50">
                    <p className="text-sm font-medium text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={onNavigateProfile}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                    >
                      <User size={16} />
                      <span>Profilo</span>
                    </button>
                    <button
                      onClick={onNavigateSettings}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                    >
                      <Settings size={16} />
                      <span>Impostazioni</span>
                    </button>
                    <button
                      onClick={onNavigateBilling}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard size={16} />
                        <span>Pagamenti e Piani</span>
                      </div>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Standard</span>
                    </button>
                    <div className="my-1 border-t border-slate-700/50" />
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-slate-700/50 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Esci</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// === DESKTOP HEADER ===
const DesktopHeader = ({ onProfileMenuToggle, isProfileMenuOpen, onNavigateSettings, onNavigateProfile, onNavigateBilling, onLogout }) => {
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Utente';
  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;

  return (
    <header className="fixed top-0 right-0 z-30 hidden lg:flex items-center gap-4 px-6 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/30"
      style={{ left: 'var(--sidebar-width, 260px)' }}
    >
      <div className="flex-1" />
      
      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        <button 
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Notifiche"
        >
          <Bell size={18} />
        </button>

        <div className="relative">
          <button 
            onClick={onProfileMenuToggle}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <img 
              src={photoURL}
              alt="User"
              className="w-8 h-8 rounded-full ring-2 ring-slate-700"
            />
            <span className="text-sm font-medium text-slate-300 hidden xl:block">{displayName}</span>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-3 border-b border-slate-700/50">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={onNavigateProfile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    <User size={16} />
                    <span>Profilo</span>
                  </button>
                  <button
                    onClick={onNavigateSettings}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    <Settings size={16} />
                    <span>Impostazioni</span>
                  </button>
                  <button
                    onClick={onNavigateBilling}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={16} />
                      <span>Pagamenti e Piani</span>
                    </div>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Standard</span>
                  </button>
                  <div className="my-1 border-t border-slate-700/50" />
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-slate-700/50 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Esci</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

// === BOTTOM NAV (Mobile) ===
const BottomNav = ({ role, currentPath }) => {
  const navigate = useNavigate();
  
  // Configurazione icone per ruolo
  const getNavItems = () => {
    switch(role) {
      case 'client':
        return [
          { to: '/client/dashboard', icon: Home, label: 'Home' },
          { to: '/client/scheda-allenamento', icon: Dumbbell, label: 'Workout' },
          { to: '/client/scheda-alimentazione', icon: Utensils, label: 'Dieta' },
          { to: '/client/checks', icon: Activity, label: 'Check' },
          { to: '/client/chat', icon: MessageSquare, label: 'Chat' },
        ];
      case 'coach':
        return [
          { to: '/coach', icon: Home, label: 'Home' },
          { to: '/coach/clients', icon: Users, label: 'Clienti' },
          { to: '/coach/anamnesi', icon: Activity, label: 'Anamnesi' },
          { to: '/coach/chat', icon: MessageSquare, label: 'Chat' },
        ];
      case 'collaboratore':
        return [
          { to: '/collaboratore/dashboard', icon: Home, label: 'Home' },
          { to: '/collaboratore/calendar', icon: Calendar, label: 'Calendario' },
        ];
      default: // admin
        return [
          { to: '/', icon: Home, label: 'Home' },
          { to: '/clients', icon: Users, label: 'Clienti' },
          { to: '/calendar', icon: Calendar, label: 'Calendario' },
          { to: '/chat', icon: MessageSquare, label: 'Chat' },
        ];
    }
  };

  const navItems = getNavItems();
  
  const isActive = (path) => {
    if (path === '/' || path === '/coach' || path === '/client/dashboard' || path === '/collaboratore/dashboard') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[60px] ${
                active 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={active ? 'text-blue-400' : ''} />
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-blue-400' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};

// === AUTH PAGES ===
const AUTH_PAGES = ['/login', '/register', '/reset-password', '/first-access'];

// === MAIN PRO LAYOUT ===
export const ProLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [branding, setBranding] = useState(null);

  // Determina il ruolo basandosi sul path
  const getRole = () => {
    if (location.pathname.startsWith('/coach')) return 'coach';
    if (location.pathname.startsWith('/client')) return 'client';
    if (location.pathname.startsWith('/collaboratore')) return 'collaboratore';
    return 'admin';
  };

  const role = getRole();
  const isAuthPage = AUTH_PAGES.some(p => location.pathname.startsWith(p));
  const showLayout = !isAuthPage && auth.currentUser;

  // Chiudi menu profilo quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isProfileMenuOpen && !e.target.closest('[data-profile-menu]')) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Salva stato sidebar
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
    } catch (error) {
      console.warn('Failed to save sidebar state:', error);
    }
  }, [isSidebarCollapsed]);

  // Rileva mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carica branding
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../firebase');
        const tid = localStorage.getItem('tenantId');
        if (!tid) return;
        
        const brandingDoc = await getDoc(doc(db, 'tenants', tid, 'settings', 'branding'));
        if (brandingDoc.exists()) {
          const { defaultBranding } = await import('../../config/tenantBranding');
          setBranding({ ...defaultBranding, ...brandingDoc.data() });
        }
      } catch (error) {
        console.debug('Could not load branding:', error);
      }
    };

    loadBranding();
  }, []);

  // Funzioni profilo
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigateSettings = () => {
    setIsProfileMenuOpen(false);
    const settingsPaths = {
      admin: '/settings',
      coach: '/coach/settings',
      client: '/client/settings',
      collaboratore: '/collaboratore/settings'
    };
    navigate(settingsPaths[role] || '/settings');
  };

  const handleNavigateProfile = () => {
    setIsProfileMenuOpen(false);
    const profilePaths = {
      admin: '/profile',
      coach: '/coach/profile',
      client: '/client/profile',
      collaboratore: '/collaboratore/profile'
    };
    navigate(profilePaths[role] || '/profile');
  };

  const handleNavigateBilling = () => {
    setIsProfileMenuOpen(false);
    navigate('/billing');
  };

  // Se è pagina auth, non mostrare layout
  if (!showLayout) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="starry-background" />
        <AnimatedStars />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Sfondo stellato */}
      <div className="starry-background" />
      <AnimatedStars />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <ProSidebar
          role={role}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar
        role={role}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Desktop Header */}
      {!isMobile && (
        <div 
          data-profile-menu
          style={{ '--sidebar-width': isSidebarCollapsed ? '72px' : '260px' }}
        >
          <DesktopHeader 
            isProfileMenuOpen={isProfileMenuOpen}
            onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            onNavigateSettings={handleNavigateSettings}
            onNavigateProfile={handleNavigateProfile}
            onNavigateBilling={handleNavigateBilling}
            onLogout={handleLogout}
          />
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div data-profile-menu>
          <MobileHeader 
            onMenuOpen={() => setIsMobileSidebarOpen(true)}
            branding={branding}
            isProfileMenuOpen={isProfileMenuOpen}
            onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            onNavigateSettings={handleNavigateSettings}
            onNavigateProfile={handleNavigateProfile}
            onNavigateBilling={handleNavigateBilling}
            onLogout={handleLogout}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className={`min-h-screen transition-all duration-200 ${
          !isMobile 
            ? (isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]')
            : ''
        }`}
      >
        <main 
          className={`min-h-screen bg-slate-900/30 ${
            isMobile ? 'pb-20' : 'pt-14'
          }`}
          style={isMobile ? { paddingTop: 'calc(64px + env(safe-area-inset-top, 0px))' } : undefined}
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      {isMobile && (
        <BottomNav role={role} currentPath={location.pathname} />
      )}

      {/* Modale richiesta permessi notifiche */}
      <NotificationPermissionModal />
    </div>
  );
};

export default ProLayout;
