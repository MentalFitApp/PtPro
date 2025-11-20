import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Home, Users, MessageSquare, FileText, Bell, 
  Calendar, Settings, ChevronLeft, ChevronRight, BarChart3, BellRing, UsersRound 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperAdmin } from '../utils/superadmin';
import { auth } from '../firebase';

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

// === LINKS NAVIGAZIONE ===
const adminNavLinks = [
  { to: '/', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/clients', icon: <Users size={18} />, label: 'Clienti' },
  { to: '/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/community', icon: <UsersRound size={18} />, label: 'Community' },
  { to: '/updates', icon: <Bell size={18} />, label: 'Novità' },
  { to: '/collaboratori', icon: <Users size={18} />, label: 'Collaboratori' },
  { to: '/guide-manager', icon: <FileText size={18} />, label: 'Guide & Lead' },
  { to: '/admin/dipendenti', icon: <Users size={18} />, label: 'Dipendenti' },
  { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
  { to: '/statistiche', icon: <BarChart3 size={18} />, label: 'Statistiche' },
  { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { to: '/notifications', icon: <BellRing size={18} />, label: 'Notifiche' },
  { to: '/alimentazione-allenamento', icon: <FileText size={18} />, label: 'Schede' },
  { to: '/superadmin', icon: <Settings size={18} />, label: '👑 SuperAdmin', isSuperAdmin: true },
];

const coachNavLinks = [
  { to: '/coach', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/coach/clients', icon: <Users size={18} />, label: 'Clienti' },
  { to: '/coach/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/coach/anamnesi', icon: <FileText size={18} />, label: 'Anamnesi' },
  { to: '/coach/schede', icon: <FileText size={18} />, label: 'Schede' },
  { to: '/coach/updates', icon: <Bell size={18} />, label: 'Aggiornamenti' },
  { to: '/coach/settings', icon: <Settings size={18} />, label: 'Impostazioni' },
];

const collaboratoreNavLinks = [
  { to: '/collaboratore/dashboard', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/collaboratore/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
];

// === PAGINE AUTH (NASCONDI SIDEBAR E NAV) ===
const AUTH_PAGES = ['/login', '/register', '/reset-password'];

// === BOTTOM NAV MOBILE ===
const BottomNav = ({ isCoach, isCollaboratore, userIsSuperAdmin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const links = isCollaboratore ? collaboratoreNavLinks : (isCoach ? coachNavLinks : adminNavLinks);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 z-50 md:hidden safe-area-bottom">
      <div className="px-2 py-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden snap-x snap-mandatory pb-1">
          {links
            .filter(link => !link.isSuperAdmin || userIsSuperAdmin)
            .map(link => (
            <motion.button
              key={link.to}
              onClick={() => navigate(link.to)}
              className={`flex flex-col items-center justify-center min-w-[56px] max-w-[64px] h-14 px-2 rounded-xl transition-all snap-center flex-shrink-0 ${
                location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                  ? 'text-rose-500 bg-rose-600/10 border border-rose-600/30'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex-shrink-0">
                {React.cloneElement(link.icon, { size: 18 })}
              </div>
              <span className="text-[9px] mt-0.5 truncate w-full text-center leading-tight">{link.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

// === SIDEBAR COLLASSABILE ===
const Sidebar = ({ isCoach, isCollaboratore, isCollapsed, setIsCollapsed, userIsSuperAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const links = isCollaboratore ? collaboratoreNavLinks : (isCoach ? coachNavLinks : adminNavLinks);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      className="hidden md:flex fixed left-0 top-0 h-screen bg-slate-900/90 backdrop-blur-xl border-r border-white/10 z-40 flex-col transition-all duration-300"
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
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {links
          .filter(link => !link.isSuperAdmin || userIsSuperAdmin)
          .map(link => (
            <motion.button
              key={link.to}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(link.to);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-rose-400'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {link.icon}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
      </nav>
    </motion.aside>
  );
};

// === MAIN LAYOUT INTELLIGENTE ===
export default function MainLayout() {
  const location = useLocation();
  const [isCoach, setIsCoach] = useState(false);
  const [isCollaboratore, setIsCollaboratore] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);

  // Determina se è pagina auth
  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  const showSidebar = !isAuthPage;
  const showBottomNav = !isAuthPage && isMobile;

  useEffect(() => {
    setIsCoach(location.pathname.startsWith('/coach'));
    setIsCollaboratore(location.pathname.startsWith('/collaboratore'));
  }, [location.pathname]);

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
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed}
            userIsSuperAdmin={userIsSuperAdmin}
          />
        )}

        {/* CONTENUTO PRINCIPALE - LARGHEZZA MASSIMA DESKTOP */}
        <div className={`flex-1 transition-all duration-300 ${
          showSidebar 
            ? (isSidebarCollapsed ? 'md:ml-16' : 'md:ml-60') 
            : 'ml-0'
        }`}>
          <main className="min-h-screen p-4 sm:p-6 lg:p-8">
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
          {showBottomNav && <BottomNav isCoach={isCoach} isCollaboratore={isCollaboratore} userIsSuperAdmin={userIsSuperAdmin} />}
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