import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Apple, Dumbbell, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 z-50 md:hidden safe-area-bottom">
      <div className="px-2 py-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden snap-x snap-mandatory pb-1">
          {links.map(link => (
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

// Sidebar for desktop
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const links = [
    { to: '/client/dashboard', icon: <Home size={18} />, label: 'Dashboard' },
    { to: '/client/scheda-alimentazione', icon: <Apple size={18} />, label: 'Alimentazione' },
    { to: '/client/scheda-allenamento', icon: <Dumbbell size={18} />, label: 'Allenamento' },
    { to: '/client/community', icon: <UsersRound size={18} />, label: 'Community' },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 bg-slate-900/90 backdrop-blur-xl border-r border-white/10 z-40 flex-col transition-all duration-300">
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <h1 className="text-xl font-bold text-slate-100">Menu Cliente</h1>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {links.map(link => (
          <motion.button
            key={link.to}
            onClick={() => navigate(link.to)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-rose-400'
            }`}
            whileHover={{ x: 4 }}
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    // Crea container stelle
    const container = document.createElement('div');
    container.className = 'stars';
    document.body.appendChild(container);

    // Crea 25 stelle (5 dorate)
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

  return (
    <div className="overflow-x-hidden w-full">
      {/* SFONDO STELLATO GLOBALE */}
      <div className="starry-background"></div>

      <div className="relative min-h-screen flex w-full">
        {/* SIDEBAR: DESKTOP */}
        <Sidebar />

        {/* CONTENUTO PRINCIPALE */}
        <div className="flex-1 transition-all duration-300 md:ml-60">
          <main className="min-h-screen">
            <Outlet />
          </main>

          {/* BOTTOM NAV: MOBILE */}
          <BottomNav />
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
