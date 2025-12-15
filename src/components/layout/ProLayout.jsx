// src/components/layout/ProLayout.jsx
// Layout principale professionale con sidebar, header e content area
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Settings, LogOut, ChevronDown, Bell, User, CreditCard, Home, Users, MessageSquare, Calendar, Dumbbell, Utensils, Activity, ChevronRight, ArrowLeft, FileText } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { ProSidebar, MobileSidebar } from './ProSidebar';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationPermissionModal from '../notifications/NotificationPermissionModal';
import InteractiveTour from '../onboarding/InteractiveTour';
import { PageProvider, usePageContext } from '../../contexts/PageContext';
import { useUnreadCount } from '../../hooks/useChat';

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
      className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-theme-bg-secondary/90 backdrop-blur-xl border-b border-theme"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuOpen}
            className="p-2 rounded-lg hover:bg-theme-bg-tertiary/60 text-theme-text-secondary"
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
                    src="/logo192.png" 
                    alt="FitFlow"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-bold text-theme-text-primary">{branding?.appName || 'FitFlow'}</span>
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
                  className="absolute right-0 top-full mt-2 w-56 bg-theme-bg-secondary/95 backdrop-blur-xl border border-theme rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-theme">
                    <p className="text-sm font-medium text-theme-text-primary truncate">{displayName}</p>
                    <p className="text-xs text-theme-text-secondary truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={onNavigateProfile}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors"
                    >
                      <User size={16} />
                      <span>Profilo</span>
                    </button>
                    <button
                      onClick={onNavigateSettings}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors"
                    >
                      <Settings size={16} />
                      <span>Impostazioni</span>
                    </button>
                    <div className="my-1 border-t border-theme" />
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-theme-bg-tertiary/60 transition-colors"
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
const DesktopHeader = ({ onProfileMenuToggle, isProfileMenuOpen, onNavigateSettings, onNavigateProfile, onNavigateBilling, onLogout, isSidebarCollapsed }) => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Utente';
  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
  
  // Ottieni info pagina dal context
  const { pageTitle, pageSubtitle, breadcrumbs, backButton } = usePageContext();

  return (
    <header 
      className="fixed top-0 right-0 z-30 hidden lg:flex items-center gap-4 px-6 py-2.5 bg-theme-bg-secondary/80 backdrop-blur-2xl border-b border-theme/50"
      style={{ left: isSidebarCollapsed ? '76px' : '264px', transition: 'left 0.3s ease' }}
    >
      {/* Left side - Page Title, Breadcrumbs, Back Button */}
      <div className="flex-1 flex items-center gap-4 min-w-0">
        {/* Back Button */}
        {backButton && (
          <motion.button
            onClick={() => backButton.onClick ? backButton.onClick() : navigate(-1)}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-all"
          >
            <ArrowLeft size={16} />
            <span className="hidden xl:inline">{backButton.label || 'Indietro'}</span>
          </motion.button>
        )}
        
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="hidden md:flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight size={14} className="text-theme-text-tertiary" />}
                {crumb.to ? (
                  <button
                    onClick={() => navigate(crumb.to)}
                    className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-theme-text-primary font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        
        {/* Page Title (when no breadcrumbs) */}
        {pageTitle && (!breadcrumbs || breadcrumbs.length === 0) && (
          <div className="flex flex-col">
            <h1 className="text-base font-semibold text-theme-text-primary leading-tight">
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="text-xs text-theme-text-tertiary">{pageSubtitle}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        <button 
          className="p-2 rounded-lg hover:bg-theme-bg-tertiary/60 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          title="Notifiche"
        >
          <Bell size={18} />
        </button>

        <div className="relative">
          <button 
            onClick={onProfileMenuToggle}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-theme-bg-tertiary/60 transition-colors"
          >
            <img 
              src={photoURL}
              alt="User"
              className="w-8 h-8 rounded-full ring-2 ring-theme"
            />
            <span className="text-sm font-medium text-theme-text-primary hidden xl:block">{displayName}</span>
            <ChevronDown size={14} className={`text-theme-text-tertiary transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-theme-bg-secondary/95 backdrop-blur-xl border border-theme rounded-xl shadow-2xl overflow-hidden z-50"
              >
                  <div className="p-3 border-b border-theme">
                    <p className="text-sm font-medium text-theme-text-primary truncate">{displayName}</p>
                    <p className="text-xs text-theme-text-secondary truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={onNavigateProfile}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors"
                  >
                    <User size={16} />
                    <span>Profilo</span>
                  </button>
                  <button
                    onClick={onNavigateSettings}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors"
                  >
                    <Settings size={16} />
                    <span>Impostazioni</span>
                  </button>
                    <div className="my-1 border-t border-theme" />
                  <button
                    onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-theme-bg-tertiary/60 transition-colors"
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
const BottomNav = ({ role, currentPath, unreadMessages = 0 }) => {
  const navigate = useNavigate();
  
  // Haptic feedback per touch
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Vibrazione leggera 10ms
    }
  };
  
  // Configurazione icone per ruolo
  const getNavItems = () => {
    switch(role) {
      case 'client':
        return [
          { to: '/client/dashboard', icon: Home, label: 'Home' },
          { to: '/client/scheda-allenamento', icon: Dumbbell, label: 'Workout' },
          { to: '/client/chat', icon: MessageSquare, label: 'Chat', hasBadge: true },
          { to: '/client/checks', icon: Activity, label: 'Check' },
          { to: '/client/community', icon: Users, label: 'Community' },
        ];
      case 'coach':
        return [
          { to: '/coach', icon: Home, label: 'Home' },
          { to: '/coach/clients', icon: Users, label: 'Clienti' },
          { to: '/coach/chat', icon: MessageSquare, label: 'Chat', hasBadge: true },
          { to: '/coach/checks', icon: FileText, label: 'Check' },
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
          { to: '/chat', icon: MessageSquare, label: 'Chat', hasBadge: true },
          { to: '/updates', icon: Bell, label: 'Novità' },
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

  const handleNavClick = (to) => {
    triggerHaptic();
    navigate(to);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-gradient-to-t from-slate-900 via-slate-900/98 to-slate-900/95 backdrop-blur-xl border-t border-slate-700/30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          const showBadge = item.hasBadge && unreadMessages > 0;
          
          return (
            <motion.button
              key={item.to}
              onClick={() => handleNavClick(item.to)}
              whileTap={{ scale: 0.9 }}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-colors min-w-[56px] ${
                active 
                  ? 'text-blue-400' 
                  : 'text-slate-500 active:text-slate-300'
              }`}
            >
              {/* Glow effect per item attivo */}
              {active && (
                <motion.div 
                  layoutId="bottomNavActiveGlow"
                  className="absolute inset-0 bg-blue-500/15 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Icona con animazione */}
              <motion.div 
                className="relative"
                animate={{ 
                  y: active ? -2 : 0,
                  scale: active ? 1.1 : 1 
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                
                {/* Badge notifiche */}
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-white">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  </motion.span>
                )}
              </motion.div>
              
              {/* Label */}
              <motion.span 
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  active ? 'text-blue-400' : 'text-slate-500'
                }`}
                animate={{ opacity: active ? 1 : 0.8 }}
              >
                {item.label}
              </motion.span>
              
              {/* Dot indicator per item attivo */}
              {active && (
                <motion.div
                  layoutId="bottomNavActiveDot"
                  className="absolute -bottom-0.5 w-1 h-1 bg-blue-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
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
  const unreadCount = useUnreadCount(); // Hook per messaggi non letti
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
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  // Verifica se mostrare onboarding per nuovi utenti
  // TOUR_VERSION: incrementa per forzare reset del tour per tutti gli utenti
  const TOUR_VERSION = 3;
  
  useEffect(() => {
    const checkOnboarding = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Controlla se onboarding già completato per questa versione
        const onboardingKey = `onboarding_shown_${user.uid}_v${TOUR_VERSION}`;
        if (localStorage.getItem(onboardingKey)) return;

        const { getDoc } = await import('firebase/firestore');
        const { db } = await import('../../firebase');
        const { getTenantDoc } = await import('../../config/tenant');
        
        const onboardingDoc = await getDoc(getTenantDoc(db, 'onboarding', user.uid));
        
        // Se non esiste doc, o se la versione è vecchia, mostra il tour
        const savedVersion = onboardingDoc.exists() ? (onboardingDoc.data().tourVersion || 1) : 0;
        
        if (savedVersion < TOUR_VERSION) {
          // Mostra onboarding dopo un delay
          setTimeout(() => setShowOnboarding(true), 1500);
        } else {
          // Segna come già visto per questa versione
          localStorage.setItem(onboardingKey, 'true');
        }
      } catch (error) {
        console.debug('Could not check onboarding:', error);
      }
    };

    checkOnboarding();
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
    <PageProvider>
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
        <div data-profile-menu>
          <DesktopHeader 
            isProfileMenuOpen={isProfileMenuOpen}
            onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            onNavigateSettings={handleNavigateSettings}
            onNavigateProfile={handleNavigateProfile}
            onNavigateBilling={handleNavigateBilling}
            onLogout={handleLogout}
            isSidebarCollapsed={isSidebarCollapsed}
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
        className={`h-screen flex flex-col transition-all duration-300 ease-out ${
          !isMobile 
            ? (isSidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[264px]')
            : ''
        }`}
      >
        <main 
          className={`flex-1 flex flex-col bg-gradient-to-br from-theme-bg-primary/40 via-theme-bg-primary/30 to-theme-bg-secondary/20 overflow-hidden ${
            isMobile ? 'pb-16' : 'pt-14'
          }`}
          style={isMobile ? { paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' } : undefined}
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      {isMobile && (
        <BottomNav role={role} currentPath={location.pathname} unreadMessages={unreadCount} />
      )}

      {/* Modale richiesta permessi notifiche */}
      <NotificationPermissionModal />

      {/* Tour interattivo per nuovi utenti */}
      {showOnboarding && (
        <InteractiveTour 
          role={sessionStorage.getItem('app_role') || 'client'}
          onComplete={() => {
            setShowOnboarding(false);
            localStorage.setItem(`onboarding_shown_${auth.currentUser?.uid}`, 'true');
          }}
          onSkip={() => {
            setShowOnboarding(false);
            localStorage.setItem(`onboarding_shown_${auth.currentUser?.uid}`, 'true');
          }}
        />
      )}
    </div>
    </PageProvider>
  );
};

export default ProLayout;
