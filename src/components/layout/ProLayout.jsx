// src/components/layout/ProLayout.jsx
// Layout principale professionale con sidebar, header e content area
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Settings, LogOut, ChevronDown, Bell, User, CreditCard, Home, Users, MessageSquare, Calendar, Dumbbell, Utensils, Activity, ChevronRight, ArrowLeft, FileText, Building2, Check } from 'lucide-react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ProSidebar, MobileSidebar } from './ProSidebar';
import { NebulaSidebar, MobileNebulaSidebar } from './NebulaSidebar';
import { NebulaBottomNav } from './NebulaBottomNav';
import { setCurrentTenantId, getCurrentTenantId } from '../../config/tenant';
// import ThemeToggle from '../ui/ThemeToggle'; // TODO: riabilitare quando light mode pronta
import NotificationBell from '../notifications/NotificationBell';
import InteractiveTour from '../onboarding/InteractiveTour';
import { PageProvider, usePageContext } from '../../contexts/PageContext';
import { useUnreadCount } from '../../hooks/useChat';
import NebulaBackground from '../ui/NebulaBackground';
import { backgroundPresets } from '../../config/backgroundPresets';

// Pagine conosciute dell'area cliente (NON admin ClientDetail)
// /client/:clientId è admin ClientDetail, /client/dashboard è area cliente
const CLIENT_AREA_PAGES = [
  'onboarding', 'first-access', 'dashboard', 'anamnesi', 'checks', 
  'payments', 'chat', 'profile', 'scheda-alimentazione', 'scheda-allenamento',
  'courses', 'community', 'settings', 'habits', 'forgot-password'
];

// Verifica se il path è nell'area cliente (non admin ClientDetail)
const isClientAreaPath = (pathname) => {
  if (pathname === '/client') return true;
  if (!pathname.startsWith('/client/')) return false;
  // Estrae il primo segmento dopo /client/
  const segment = pathname.split('/')[2];
  return CLIENT_AREA_PAGES.includes(segment);
};

// === BACKGROUND NEBULA 2.0 - Sostituisce le vecchie stelle ===
const NebulaStars = () => {
  const [currentPreset, setCurrentPreset] = useState('aurora');

  useEffect(() => {
    // Leggi il preset dal data attribute
    const updatePreset = () => {
      const preset = document.documentElement.getAttribute('data-bg-preset') || 'aurora';
      // Mappa i vecchi preset ai nuovi
      const presetMap = {
        'starryNight': 'aurora',
        'meteorShower': 'aurora',
        'deepSpace': 'aurora',
        'constellations': 'constellation',
        'stardust': 'constellation',
        'solid': null,
        'gradient': null,
      };
      
      // Se è un preset Nebula, usalo direttamente
      const config = backgroundPresets[preset];
      if (config && config.type === 'nebula') {
        setCurrentPreset(config.nebulaPreset);
      } else if (presetMap[preset] !== undefined) {
        setCurrentPreset(presetMap[preset]);
      } else {
        setCurrentPreset('aurora'); // Default
      }
    };

    updatePreset();

    // Observer per cambiamenti al preset
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-bg-preset') {
          updatePreset();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Non renderizzare nulla per solid/gradient
  if (!currentPreset) return null;

  return <NebulaBackground preset={currentPreset} />;
};

// Legacy AnimatedStars - Manteniamo per retrocompatibilità ma non fa più nulla
const AnimatedStars = () => null;

// === MOBILE HEADER (Compatto 56px) ===
const MobileHeader = ({ onMenuOpen, branding, onProfileMenuToggle, isProfileMenuOpen, onNavigateSettings, onNavigateProfile, onNavigateBilling, onLogout, availableWorkspaces = [], currentWorkspaceId, onSwitchWorkspace }) => {
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Utente';
  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-slate-900/80 backdrop-blur-xl border-b border-blue-500/20"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuOpen}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
          >
            <Menu size={20} />
          </button>
          
          {branding?.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.appName}
              className="h-8 max-w-[100px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <img src="/logo192.png" alt="FitFlow" className="w-8 h-8 rounded-lg" />
              <span className="text-base font-semibold text-white">{branding?.appName || 'FitFlow'}</span>
            </div>
          )}
        </div>
        
        {/* Right: Avatar */}
        <div className="relative">
          <button 
            onClick={onProfileMenuToggle}
            className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/20 hover:ring-blue-500/50 transition-all"
          >
            <img src={photoURL} alt="User" className="w-full h-full object-cover" />
          </button>
          
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button onClick={onNavigateProfile} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
                    <User size={14} /> Profilo
                  </button>
                  <button onClick={onNavigateSettings} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
                    <Settings size={14} /> Impostazioni
                  </button>
                </div>
                <div className="border-t border-white/10 py-1">
                  <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                    <LogOut size={14} /> Esci
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
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(getCurrentTenantId());

  // Carica workspace disponibili per l'utente
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userTenantRef = doc(db, 'user_tenants', auth.currentUser.uid);
        const userTenantDoc = await getDoc(userTenantRef);
        
        if (userTenantDoc.exists()) {
          const tenantsData = userTenantDoc.data();
          const workspaces = Object.entries(tenantsData)
            .filter(([tenantId, data]) => {
              if (tenantId === 'tenantId') return false;
              return (data.status === 'active' || !data.status) && 
                     (data.role === 'admin' || data.role === 'coach' || data.role === 'superadmin');
            })
            .map(([tenantId, data]) => ({ tenantId, ...data }));
          
          setAvailableWorkspaces(workspaces);
        }
      } catch (err) {
        // Errore silenzioso nel caricamento workspace
      }
    };
    
    loadWorkspaces();
  }, []);

  // Determina il ruolo basandosi sul path
  const getRole = () => {
    if (location.pathname.startsWith('/coach')) return 'coach';
    // Area cliente: /client/dashboard, /client/settings, etc. (NON /client/:id che è admin)
    if (isClientAreaPath(location.pathname)) return 'client';
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

  // Funzione per cambiare workspace
  const handleSwitchWorkspace = (workspace) => {
    setCurrentTenantId(workspace.tenantId);
    setCurrentWorkspaceId(workspace.tenantId);
    setIsProfileMenuOpen(false);
    
    // Redirect basato sul ruolo
    if (workspace.role === 'admin' || workspace.role === 'superadmin') {
      navigate('/admin');
    } else if (workspace.role === 'coach') {
      navigate('/coach');
    }
    
    // Ricarica la pagina per applicare il nuovo tenant
    window.location.reload();
  };

  // Se è pagina auth, non mostrare layout
  if (!showLayout) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="starry-background" />
        <NebulaStars />
        <Outlet />
      </div>
    );
  }

  return (
    <PageProvider>
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Sfondo Nebula 2.0 */}
      <div className="starry-background" />
      <NebulaStars />

      {/* Desktop Sidebar - Nebula 2.0 */}
      {!isMobile && (
        <NebulaSidebar
          role={role}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      {/* Mobile Sidebar - Nebula 2.0 */}
      <MobileNebulaSidebar
        role={role}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Desktop Header - RIMOSSO: tutto integrato nella sidebar */}

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
            availableWorkspaces={availableWorkspaces}
            currentWorkspaceId={currentWorkspaceId}
            onSwitchWorkspace={handleSwitchWorkspace}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className={`min-h-screen transition-all duration-300 ease-out ${
          !isMobile 
            ? (isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]')
            : ''
        }`}
      >
        <main 
          className={`min-h-screen ${
            isMobile ? 'pb-16' : ''
          }`}
          style={isMobile ? { paddingTop: 'calc(60px + env(safe-area-inset-top, 0px))' } : undefined}
        >
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Nav (Mobile Only) - Nebula 2.0 */}
      {isMobile && (
        <NebulaBottomNav role={role} unreadMessages={unreadCount} />
      )}

      {/* Modale richiesta permessi notifiche - TODO: riabilitare quando notifiche implementate */}
      {/* <NotificationPermissionModal /> */}

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
