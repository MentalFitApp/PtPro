import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Apple, Dumbbell, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Layout completo per CLIENT - Con stelle animate e sidebar mobile
export default function SimpleLayout() {
  const [initialized, setInitialized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const clientNavLinks = [
    { to: '/client/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/client/scheda-alimentazione', icon: <Apple size={20} />, label: 'Alimentazione' },
    { to: '/client/scheda-allenamento', icon: <Dumbbell size={20} />, label: 'Allenamento' },
  ];

  const handleNavigate = (to) => {
    navigate(to);
    setShowSidebar(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      <div className="relative min-h-screen flex flex-col">
        {/* Background con gradiente */}
        <div className="starry-background"></div>
        
        {/* Menu Toggle Button (Mobile) */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed top-safe-4 md:top-4 right-4 z-50 p-3 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-xl text-slate-200 hover:bg-slate-700 transition-colors md:hidden"
          style={{ top: 'max(env(safe-area-inset-top, 0px) + 1rem, 1rem)' }}
        >
          {showSidebar ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar Overlay (Mobile) */}
        <AnimatePresence>
          {showSidebar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSidebar(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween' }}
                className="fixed top-0 right-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-40 pt-20 px-6 pb-8 md:hidden overflow-y-auto"
              >
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-100">Menu</h2>
                </div>
                <nav className="space-y-2">
                  {clientNavLinks.map(link => (
                    <button
                      key={link.to}
                      onClick={() => handleNavigate(link.to)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        location.pathname === link.to
                          ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </button>
                  ))}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sidebar Desktop */}
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-700 z-40 flex-col p-6 pb-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-100">Menu Cliente</h2>
          </div>
          <nav className="space-y-2 overflow-y-auto flex-1">
            {clientNavLinks.map(link => (
              <button
                key={link.to}
                onClick={() => handleNavigate(link.to)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  location.pathname === link.to
                    ? 'bg-rose-600/20 text-rose-400 border border-rose-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        
        {/* Contenuto con effetto trasparenza - Always add margin for sidebar */}
        <div className="relative z-10 w-full md:ml-64">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
