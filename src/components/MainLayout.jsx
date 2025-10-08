import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutGrid, Users, MessageSquare, Rocket, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedBackground = () => {
  useEffect(() => {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    const createStar = () => {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDuration = `${Math.random() * 30 + 40}s, 5s`;
      starsContainer.appendChild(star);
    };

    for (let i = 0; i < 50; i++) {
      createStar();
    }

    return () => {
      while (starsContainer.firstChild) {
        starsContainer.removeChild(starsContainer.firstChild);
      }
    };
  }, []);

  return (
    <div className="starry-background">
      <div className="stars"></div>
    </div>
  );
};

const navLinks = [
  { to: '/', icon: <LayoutGrid size={18} />, label: 'Dashboard' },
  { to: '/clients', icon: <Users size={18} />, label: 'Clienti' },
  { to: '/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/updates', icon: <Rocket size={18} />, label: 'Novità' },
];

const NavLink = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm transition-colors ${
        isActive 
          ? 'bg-rose-600/10 text-rose-500 font-semibold'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );
};

const SidebarContent = ({ onLinkClick }) => {
  const navigate = useNavigate();
  return (
    <aside className="w-full md:w-60 bg-zinc-950/60 backdrop-blur-xl p-4 flex flex-col h-full gradient-border">
      <h2 className="text-2xl font-bold mb-10 px-2 text-slate-100">FitFlow Pro</h2>
      <nav className="flex flex-col gap-2">
        {navLinks.map(link => (
          <NavLink 
            key={link.to}
            to={link.to} 
            icon={link.icon} 
            label={link.label}
            onClick={() => {
              navigate(link.to);
              if (onLinkClick) onLinkClick();
            }}
          />
        ))}
      </nav>
    </aside>
  );
};

export default function MainLayout() { 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row">
      <AnimatedBackground />
      <div className="hidden md:flex md:fixed h-screen z-20">
        <SidebarContent />
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed top-0 left-0 h-full w-64 z-50 md:hidden bg-zinc-950/80 backdrop-blur-lg"
          >
            <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 w-full md:ml-60">
        <header className="md:hidden sticky top-0 bg-zinc-950/70 backdrop-blur-lg h-16 flex items-center justify-between px-4 border-b border-white/10 z-40">
          <h2 className="text-lg font-bold text-slate-100">FitFlow Pro</h2>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-200">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 pt-16 md:pt-0 min-h-[calc(100vh-4rem)]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}