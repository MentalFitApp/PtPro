import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Home, Users, MessageSquare, FileText, Bell,
  Calendar, Settings, ChevronLeft, ChevronRight, BarChart3, BellRing,
  UserCheck, BookOpen, Target, Activity, GraduationCap, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperAdmin } from '../utils/superadmin';
import { auth } from '../firebase';
import ThemeToggle from './ThemeToggle';

// === STELLE DI SFONDO (25, 5 DORATE) ===
const AnimatedStars = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const container = document.createElement('div');
    container.className = 'stars';
    document.body.appendChild(container);

    for (let i = 0; i < 25; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      const size = i % 5 === 0 ? 1 : i % 3 === 0 ? 2 : 3;
      star.style.setProperty('--star-width', `${size}px`);
      star.style.setProperty('--top-offset', `${Math.random() * 100}vh`);
      star.style.setProperty('--fall-duration', `${10 + Math.random() * 10}s`);
      star.style.setProperty('--fall-delay', `${Math.random() * 8}s`);

      if (i % 5 === 0) star.classList.add('gold');

      container.appendChild(star);
    }

    setInitialized(true);
  }, [initialized]);

  return null;
};

// === LINKS NAVIGAZIONE CON SOTTOMENU ===
const adminNavLinks = [
  { to: '/', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },

  { to: '/clients', icon: <Users size={18} />, label: 'Clienti' },
  { to: '/new-client', icon: <Plus size={18} />, label: 'Nuovo Cliente' },
  { to: '/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/updates', icon: <BellRing size={18} />, label: 'Novità' },
  { to: '/collaboratori', icon: <UserCheck size={18} />, label: 'Collaboratori' },
  { to: '/guide-manager', icon: <BookOpen size={18} />, label: 'Guide & Lead' },
  { to: '/business-history', icon: <BarChart3 size={18} />, label: 'Storico Business' },
  { to: '/admin/dipendenti', icon: <Users size={18} />, label: 'Dipendenti' },
  { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
  { to: '/statistiche', icon: <Activity size={18} />, label: 'Statistiche' },
  { to: '/analytics', icon: <Target size={18} />, label: 'Analytics' },
  { to: '/courses', icon: <BookOpen size={18} />, label: 'Corsi' },
  { to: '/course-admin', icon: <GraduationCap size={18} />, label: 'Corsi Admin' },
  { to: '/notifications', icon: <BellRing size={18} />, label: 'Notifiche' },
  { to: '/alimentazione-allenamento', icon: <FileText size={18} />, label: 'Schede' },

  { to: '/superadmin', icon: <Settings size={18} />, label: 'Super Admin', isSuperAdmin: true },
];

const coachNavLinks = [
  { to: '/coach', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/coach/clients', icon: <Users size={18} />, label: 'Clienti' },
  { to: '/coach/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/coach/anamnesi', icon: <FileText size={18} />, label: 'Anamnesi' },
  { to: '/coach/schede', icon: <Target size={18} />, label: 'Schede' },
  { to: '/coach/updates', icon: <BellRing size={18} />, label: 'Aggiornamenti' },
  { to: '/coach/settings', icon: <Settings size={18} />, label: 'Impostazioni' },
];

const clientNavLinks = [
  { to: '/client/dashboard', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },

  { to: '/client/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/client/courses', icon: <BookOpen size={18} />, label: 'Corsi' },
  { to: '/client/anamnesi', icon: <FileText size={18} />, label: 'Anamnesi' },
  { to: '/client/checks', icon: <Activity size={18} />, label: 'Check' },
  { to: '/client/payments', icon: <Target size={18} />, label: 'Pagamenti' },
];

const collaboratoreNavLinks = [
  { to: '/collaboratore/dashboard', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/collaboratore/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
];

// === PAGINE AUTH (NASCONDI SIDEBAR E NAV) ===
const AUTH_PAGES = ['/login', '/register', '/reset-password'];

// === BOTTOM NAV MOBILE ===
const BottomNav = ({ isCoach, isCollaboratore, isClient, userIsSuperAdmin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const links = isCollaboratore ? collaboratoreNavLinks : (isCoach ? coachNavLinks : (isClient ? clientNavLinks : adminNavLinks));
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const allLinks = [];
  links
    .filter(link => !link.isSuperAdmin || userIsSuperAdmin)
    .forEach(link => {
      allLinks.push(link);
      if (link.submenu && expandedMenus[link.key]) {
        link.submenu.forEach(sub => {
          allLinks.push({
            ...sub,
            isSubmenu: true,
            parentKey: link.key
          });
        });
      }
    });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 z-50 md:hidden safe-area-bottom">
      <div className="px-2 py-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden snap-x snap-mandatory pb-1">
          {allLinks.map(link => (
            <motion.button
              key={link.isSubmenu ? `${link.parentKey}-${link.to}` : link.to}
              onClick={() => {
                if (link.submenu) {
                  toggleMenu(link.key);
                } else {
                  navigate(link.to);
                }
              }}
              className={`flex flex-col items-center justify-center min-w-[56px] max-w-[64px] h-14 px-2 rounded-xl transition-all snap-center flex-shrink-0 ${
                location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                  ? 'text-rose-500 bg-rose-600/10 border border-rose-600/30'
                  : link.isSubmenu
                    ? 'text-slate-300 hover:text-rose-400 bg-slate-800/50'
                    : 'text-slate-400 hover:text-rose-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex-shrink-0">
                {React.cloneElement(link.icon, { size: link.isSubmenu ? 16 : 18 })}
              </div>
              <span className={`mt-0.5 truncate w-full text-center leading-tight ${link.isSubmenu ? 'text-[8px]' : 'text-[9px]'}`}>
                {link.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

// === SIDEBAR COLLASSABILE ===
const Sidebar = ({ isCoach, isCollaboratore, isClient, isCollapsed, setIsCollapsed, userIsSuperAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const links = isCollaboratore ? collaboratoreNavLinks : (isCoach ? coachNavLinks : (isClient ? clientNavLinks : adminNavLinks));
  const [expandedMenus, setExpandedMenus] = useState({});

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      className="hidden lg:flex fixed left-0 top-0 h-screen bg-slate-900/90 backdrop-blur-xl border-r border-white/10 z-40 flex-col transition-all duration-300 data-[theme='dark']:bg-slate-900 data-[theme='dark']:border-slate-700"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-bold text-slate-100"
            >
              FitFlow Pro
            </motion.h1>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {links
          .filter(link => !link.isSuperAdmin || userIsSuperAdmin)
          .map((link) => {
            if (link.isExpandable) {
              const isExpanded = expandedMenus[link.label];
              const hasActiveSubmenu = link.submenu?.some(sub => location.pathname === sub.to || location.pathname.startsWith(sub.to + '/'));

              return (
                <div key={link.label}>
                  <motion.button
                    onClick={() => {
                      setExpandedMenus(prev => ({
                        ...prev,
                        [link.label]: !prev[link.label]
                      }));
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      hasActiveSubmenu
                        ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-rose-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex-shrink-0">
                      {React.cloneElement(link.icon, { size: 18 })}
                    </div>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="truncate"
                        >
                          {link.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      className="ml-auto flex-shrink-0"
                    >
                      <ChevronRight size={14} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 mt-1 space-y-1 overflow-hidden"
                      >
                        {link.submenu
                          .filter(sub => !sub.isSuperAdmin || userIsSuperAdmin)
                          .map(sub => (
                            <motion.button
                              key={sub.to}
                              onClick={() => navigate(sub.to)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                location.pathname === sub.to || location.pathname.startsWith(sub.to + '/')
                                  ? 'bg-rose-600/15 text-rose-400 border border-rose-600/20'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-rose-400'
                              }`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="flex-shrink-0">
                                {React.cloneElement(sub.icon, { size: 14 })}
                              </div>
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="truncate"
                                  >
                                    {sub.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <motion.button
                key={link.to}
                onClick={() => {
                  navigate(link.to);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                    ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-rose-400'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-shrink-0">
                  {React.cloneElement(link.icon, { size: 18 })}
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="truncate"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
      </nav>
    </motion.aside>
  );
};

// === MAIN LAYOUT INTELLIGENTE ===
export default function MainLayout() {
  const location = useLocation();
  const [isCoach, setIsCoach] = useState(false);
  const [isCollaboratore, setIsCollaboratore] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);

  // Determina se è pagina auth o chat
  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  const isChatPage = location.pathname === '/chat' || location.pathname === '/coach/chat' || location.pathname === '/client/chat';
  const [isChatSelected, setIsChatSelected] = useState(false);
  const showSidebar = !isAuthPage && auth.currentUser;
  const showBottomNav = !isAuthPage && isMobile && !(isChatPage && isChatSelected);

  useEffect(() => {
    setIsCoach(location.pathname.startsWith('/coach'));
    setIsCollaboratore(location.pathname.startsWith('/collaboratore'));
    setIsClient(location.pathname.startsWith('/client'));
  }, [location.pathname]);

  // Salva lo stato della sidebar in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
    } catch (error) {
      console.warn('Failed to save sidebar state:', error);
    }
  }, [isSidebarCollapsed]);

  // Verifica se l'utente è SuperAdmin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      const user = auth.currentUser;
      if (user) {
        const isSA = await isSuperAdmin(user.uid);
        setUserIsSuperAdmin(isSA);
      } else {
        setUserIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();
    
    // Ricontrolla quando cambia l'utente
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkSuperAdmin();
      } else {
        setUserIsSuperAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Rileva mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ascolta quando una chat viene selezionata in UnifiedChat
  useEffect(() => {
    const handleChatSelected = (event) => {
      setIsChatSelected(event.detail);
    };
    window.addEventListener('chatSelected', handleChatSelected);
    return () => window.removeEventListener('chatSelected', handleChatSelected);
  }, []);

  return (
    <div className="overflow-x-hidden w-full">
      {/* SFONDO STELLATO GLOBALE */}
      <div className="starry-background"></div>
      <AnimatedStars />

      <div className="relative min-h-screen flex w-full">
        {/* SIDEBAR: SOLO SU PAGINE PROTETTE */}
        {showSidebar && (
          <Sidebar 
            isCoach={isCoach}
            isCollaboratore={isCollaboratore}
            isClient={isClient}
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed}
            userIsSuperAdmin={userIsSuperAdmin}
          />
        )}

        {/* CONTENUTO PRINCIPALE - LARGHEZZA MASSIMA DESKTOP */}
        <div className={`flex-1 transition-all duration-300 ${
          showSidebar
            ? (isSidebarCollapsed ? 'lg:ml-16 xl:ml-16' : 'lg:ml-60 xl:ml-60')
            : 'ml-0'
        }`}>
          <main className={`min-h-screen ${
            isChatPage ? 'p-0' : 'p-2 xs:p-4 sm:p-6 md:p-8 lg:p-10'
          }`}>
            <div className="max-w-7xl mx-auto w-full">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </div>
          </main>

          {/* BOTTOM NAV: SOLO SU MOBILE */}
          {showBottomNav && <BottomNav isCoach={isCoach} isCollaboratore={isCollaboratore} isClient={isClient} userIsSuperAdmin={userIsSuperAdmin} />}
        </div>

        {/* SCROLLBAR NASCOSTA */}
        <style>{`
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}