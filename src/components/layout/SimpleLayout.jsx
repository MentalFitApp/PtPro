import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Apple, Dumbbell, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';
// import NotificationPermissionModal from '../notifications/NotificationPermissionModal'; // TODO: riabilitare quando notifiche implementate

// Bottom nav component for mobile (matching MainLayout style)
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const links = [
    { to: '/client/dashboard', icon: <Home size={18} />, label: 'Dashboard' },
    { to: '/client/scheda-alimentazione', icon: <Apple size={18} />, label: 'Alimentazione' },
    { to: '/client/scheda-allenamento', icon: <Dumbbell size={18} />, label: 'Allenamento' },
    { to: '/client/community', icon: <UsersRound size={18} />, label: 'Community' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-theme-bg-secondary/90 backdrop-blur-2xl border-t border-theme z-50 md:hidden safe-area-bottom">
      <div className="px-2 py-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden snap-x snap-mandatory pb-1">
          {links.map(link => (
            <motion.button
              key={link.to}
              onClick={() => navigate(link.to)}
              className={`flex flex-col items-center justify-center min-w-[56px] max-w-[64px] h-14 px-2 rounded-xl transition-all snap-center flex-shrink-0 ${
                location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                  ? 'text-blue-400 bg-blue-600/20 border border-blue-500/40'
                  : 'text-theme-text-secondary hover:text-blue-500'
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

// Sidebar for desktop (Stile Premium CEO Dashboard)
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const links = [
    { to: '/client/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/client/scheda-alimentazione', icon: <Apple size={20} />, label: 'Alimentazione' },
    { to: '/client/scheda-allenamento', icon: <Dumbbell size={20} />, label: 'Allenamento' },
    { to: '/client/community', icon: <UsersRound size={20} />, label: 'Community' },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-theme-bg-secondary/85 backdrop-blur-xl border-r border-theme z-40 flex-col transition-all duration-300 shadow-2xl">
      <div className="p-6 border-b border-theme">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-theme-text-primary">FitFlows Pro</h1>
            <p className="text-xs text-theme-text-secondary">Client Area</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map(link => (
          <motion.button
            key={link.to}
            onClick={() => navigate(link.to)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {link.icon}
            <span className="overflow-hidden whitespace-nowrap">{link.label}</span>
          </motion.button>
        ))}
      </nav>
    </aside>
  );
};

// Layout completo per CLIENT - Con stelle animate e bottom nav su mobile
export default function SimpleLayout() {
  // Le stelle sono gestite centralmente da ProLayout tramite data-bg-preset
  // Non creiamo stelle duplicate qui

  return (
    <div className="overflow-x-hidden w-full">
      {/* SFONDO STELLATO GLOBALE */}
      <div className="starry-background"></div>

      <div className="relative min-h-screen flex w-full">
        {/* SIDEBAR: DESKTOP */}
        <Sidebar />

        {/* CONTENUTO PRINCIPALE */}
        <div className="flex-1 transition-all duration-300 md:ml-72">
          <main className="min-h-screen p-3 sm:p-4 lg:p-6">
            <Outlet />
          </main>

          {/* BOTTOM NAV: MOBILE */}
          <BottomNav />
        </div>

        {/* Modale richiesta permessi notifiche - TODO: riabilitare quando notifiche implementate */}
        {/* <NotificationPermissionModal /> */}

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
