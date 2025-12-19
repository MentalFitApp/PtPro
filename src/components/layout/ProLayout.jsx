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
import { setCurrentTenantId, getCurrentTenantId } from '../../config/tenant';
// import ThemeToggle from '../ui/ThemeToggle'; // TODO: riabilitare quando light mode pronta
import NotificationBell from '../notifications/NotificationBell';
import InteractiveTour from '../onboarding/InteractiveTour';
import { PageProvider, usePageContext } from '../../contexts/PageContext';
import { useUnreadCount } from '../../hooks/useChat';

// === STELLE ANIMATE - 5 STILI PREMIUM ===
const AnimatedStars = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Funzione per creare le stelle in base al preset
    const createStars = () => {
      // Rimuovi stelle esistenti
      const existingContainer = document.querySelector('.stars');
      if (existingContainer) {
        existingContainer.remove();
      }

      // Leggi il preset corrente (default: starryNight)
      const preset = document.documentElement.getAttribute('data-bg-preset') || 'starryNight';
      
      // Se è solid o gradient, non creare stelle
      if (preset === 'solid' || preset === 'gradient') {
        return;
      }

      const container = document.createElement('div');
      container.className = `stars stars-${preset}`;
      document.body.appendChild(container);

      // Configurazioni per i 5 preset stellati premium
      const presetConfigs = {
        // 1. CIELO STELLATO - Come il login, twinkle + float dolce
        starryNight: {
          count: 65,
          sizeRange: [1, 3.5],
          colors: ['blue', 'gold'],
          animation: 'twinkle-float',
          twinkleDuration: { min: 2, max: 4 },
          floatDuration: { min: 10, max: 20 },
        },
        // 2. PIOGGIA DI METEORE - Stelle cadenti veloci con scie
        meteorShower: {
          count: 35,
          sizeRange: [1, 2.5],
          colors: ['white', 'cyan', 'gold'],
          animation: 'meteor',
          speed: { min: 4, max: 10 },
        },
        // 3. UNIVERSO PROFONDO - Stelle pulsanti con profondità
        deepSpace: {
          count: 80,
          sizeRange: [0.5, 3.5],
          colors: ['white', 'purple', 'pink', 'cyan'],
          animation: 'pulse-depth',
          speed: { min: 3, max: 6 },
        },
        // 4. COSTELLAZIONI - Stelle connesse
        constellations: {
          count: 40,
          sizeRange: [2, 4.5],
          colors: ['blue', 'white', 'cyan'],
          animation: 'constellation',
          speed: { min: 4, max: 7 },
          connections: true,
        },
        // 5. POLVERE DI STELLE - Particelle danzanti
        stardust: {
          count: 100,
          sizeRange: [0.5, 2.5],
          colors: ['white', 'gold', 'pink', 'cyan'],
          animation: 'dust',
          speed: { min: 8, max: 15 },
        },
      };

      const config = presetConfigs[preset] || presetConfigs.starryNight;
      const stars = [];

      for (let i = 0; i < config.count; i++) {
        const star = document.createElement('div');
        const colorClass = config.colors[Math.floor(Math.random() * config.colors.length)];
        star.className = `star star-${config.animation} ${colorClass}`;
        
        // Posizione casuale
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        
        star.style.top = `${top}%`;
        star.style.left = `${left}%`;
        
        // Dimensione
        const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
        star.style.setProperty('--star-size', `${size}px`);
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Animazioni specifiche per preset
        if (preset === 'starryNight') {
          // Twinkle + Float come login
          const twinkleDur = config.twinkleDuration.min + Math.random() * (config.twinkleDuration.max - config.twinkleDuration.min);
          const floatDur = config.floatDuration.min + Math.random() * (config.floatDuration.max - config.floatDuration.min);
          star.style.setProperty('--twinkle-duration', `${twinkleDur}s`);
          star.style.setProperty('--float-duration', `${floatDur}s`);
          star.style.setProperty('--star-min-opacity', colorClass === 'gold' ? '0.5' : '0.3');
          star.style.animationDelay = `${Math.random() * -twinkleDur}s, ${Math.random() * -floatDur}s`;
        } else if (preset === 'meteorShower') {
          // Stelle cadenti con delay casuali
          const duration = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
          star.style.setProperty('--anim-duration', `${duration}s`);
          star.style.setProperty('--anim-delay', `${Math.random() * 10}s`);
        } else if (preset === 'deepSpace') {
          // Profondità visiva
          const depth = Math.random();
          const duration = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
          star.style.setProperty('--anim-duration', `${duration}s`);
          star.style.setProperty('--anim-delay', `${Math.random() * -duration}s`);
          star.style.setProperty('--depth-opacity', (0.2 + depth * 0.6).toFixed(2));
          star.style.opacity = 0.3 + depth * 0.7;
          star.style.filter = `blur(${(1 - depth) * 0.5}px)`;
        } else if (preset === 'constellations') {
          // Stelle per costellazioni
          const duration = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
          star.style.setProperty('--anim-duration', `${duration}s`);
          star.style.setProperty('--anim-delay', `${Math.random() * -duration}s`);
          stars.push({ el: star, x: left, y: top });
        } else if (preset === 'stardust') {
          // Polvere danzante
          const duration = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
          star.style.setProperty('--anim-duration', `${duration}s`);
          star.style.setProperty('--anim-delay', `${Math.random() * -duration}s`);
        }
        
        container.appendChild(star);
      }

      // Aggiungi linee di connessione per costellazioni
      if (preset === 'constellations' && config.connections && stars.length > 1) {
        // Crea connessioni tra stelle vicine
        const maxDistance = 20; // % dello schermo
        const connections = [];
        
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[j].x - stars[i].x;
            const dy = stars[j].y - stars[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < maxDistance && connections.length < 20) {
              const line = document.createElement('div');
              line.className = 'constellation-line';
              
              // Calcola posizione e rotazione
              const length = distance;
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              
              line.style.left = `${stars[i].x}%`;
              line.style.top = `${stars[i].y}%`;
              line.style.width = `${length}%`;
              line.style.transform = `rotate(${angle}deg)`;
              line.style.animationDelay = `${Math.random() * 4}s`;
              
              container.appendChild(line);
              connections.push({ from: i, to: j });
            }
          }
        }
      }
    };

    // Crea stelle iniziali
    createStars();
    setInitialized(true);

    // Observer per cambiamenti al preset
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-bg-preset') {
          createStars();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};

// === MOBILE HEADER ===
const MobileHeader = ({ onMenuOpen, branding, onProfileMenuToggle, isProfileMenuOpen, onNavigateSettings, onNavigateProfile, onNavigateBilling, onLogout, availableWorkspaces = [], currentWorkspaceId, onSwitchWorkspace }) => {
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
          {/* ThemeToggle rimosso - dark mode forzata */}
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
                  
                  {/* Workspace Selector - solo se ci sono più workspace */}
                  {availableWorkspaces.length > 1 && (
                    <div className="py-2 border-b border-theme">
                      <p className="px-4 py-1 text-xs font-medium text-theme-text-tertiary uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={12} />
                        Workspace
                      </p>
                      {availableWorkspaces.map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => onSwitchWorkspace(ws.id)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm transition-colors ${
                            ws.id === currentWorkspaceId 
                              ? 'bg-theme-accent/10 text-theme-accent' 
                              : 'text-theme-text-primary hover:bg-theme-bg-tertiary/60'
                          }`}
                        >
                          <span className="truncate">{ws.name}</span>
                          {ws.id === currentWorkspaceId && (
                            <Check size={14} className="text-theme-accent flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
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
const DesktopHeader = ({ onProfileMenuToggle, isProfileMenuOpen, onNavigateSettings, onNavigateProfile, onNavigateBilling, onLogout, isSidebarCollapsed, availableWorkspaces = [], currentWorkspaceId, onSwitchWorkspace }) => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Utente';
  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
  
  // Ottieni info pagina dal context
  const { pageTitle, pageSubtitle, breadcrumbs, backButton } = usePageContext();

  return (
    <header 
      className="fixed top-0 right-0 z-30 hidden lg:flex items-center gap-4 px-6 h-[72px] bg-theme-bg-secondary/80 backdrop-blur-2xl border-b border-theme/50"
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
        {/* ThemeToggle rimosso - dark mode forzata */}
        
        <NotificationBell />

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
                
                {/* Workspace Selector - solo se ci sono più workspace */}
                {availableWorkspaces.length > 1 && (
                  <div className="py-2 border-b border-theme">
                    <p className="px-4 py-1 text-xs font-medium text-theme-text-tertiary uppercase tracking-wider flex items-center gap-2">
                      <Building2 size={12} />
                      Workspace
                    </p>
                    {availableWorkspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => onSwitchWorkspace(ws.id)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm transition-colors ${
                          ws.id === currentWorkspaceId 
                            ? 'bg-theme-accent/10 text-theme-accent' 
                            : 'text-theme-text-primary hover:bg-theme-bg-tertiary/60'
                        }`}
                      >
                        <span className="truncate">{ws.name}</span>
                        {ws.id === currentWorkspaceId && (
                          <Check size={14} className="text-theme-accent flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
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
        console.log('Errore caricamento workspace:', err);
      }
    };
    
    loadWorkspaces();
  }, []);

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
        <div data-profile-menu className="relative z-10">
          <DesktopHeader 
            isProfileMenuOpen={isProfileMenuOpen}
            onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            onNavigateSettings={handleNavigateSettings}
            onNavigateProfile={handleNavigateProfile}
            onNavigateBilling={handleNavigateBilling}
            onLogout={handleLogout}
            isSidebarCollapsed={isSidebarCollapsed}
            availableWorkspaces={availableWorkspaces}
            currentWorkspaceId={currentWorkspaceId}
            onSwitchWorkspace={handleSwitchWorkspace}
          />
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div data-profile-menu className="relative z-10">
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
        className={`min-h-screen transition-all duration-300 ease-out relative z-[1] ${
          !isMobile 
            ? (isSidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[264px]')
            : ''
        }`}
      >
        <main 
          className={`min-h-screen ${
            isMobile ? 'pb-16' : 'pt-[72px]'
          }`}
          style={isMobile ? { paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' } : undefined}
        >
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      {isMobile && (
        <BottomNav role={role} currentPath={location.pathname} unreadMessages={unreadCount} />
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
