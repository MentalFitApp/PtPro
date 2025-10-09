import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutGrid, Users, MessageSquare, Rocket, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// AnimatedBackground globale
const AnimatedBackground = () => {
  const starsContainerRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    let starsContainer = document.querySelector('.stars');
    if (!starsContainer) {
      starsContainer = document.createElement('div');
      starsContainer.className = 'stars';
      const starryBackground = document.querySelector('.starry-background');
      if (!starryBackground) {
        const bg = document.createElement('div');
        bg.className = 'starry-background';
        document.body.appendChild(bg);
        bg.appendChild(starsContainer);
      } else {
        starryBackground.appendChild(starsContainer);
      }
      starsContainerRef.current = starsContainer;
    } else {
      starsContainerRef.current = starsContainer;
    }

    // Crea 50 stelle
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.setProperty('--top-offset', `${Math.random() * 100}vh`);
      star.style.setProperty('--fall-duration', `${8 + Math.random() * 6}s`); // 8-14s
      star.style.setProperty('--fall-delay', `${Math.random() * 5}s`);
      star.style.setProperty('--star-width', `${1 + Math.random() * 2}px`); // 1-3px
      starsContainerRef.current.appendChild(star);
    }

    isInitialized.current = true;
  }, []);

  return null;
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

const SidebarContent = ({ onLinkClick, onClose }) => {
  const navigate = useNavigate();
  return (
    <aside className="w-full h-full bg-zinc-950/60 backdrop-blur-xl p-4 flex flex-col gradient-border">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold px-2 text-slate-100">FitFlow Pro</h2>
        <button onClick={onClose} className="md:hidden text-slate-200 p-2">
          <X size={24} />
        </button>
      </div>
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
              if (onClose) onClose();
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
  const menuRef = useRef(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row">
      <AnimatedBackground />
      <div className="hidden md:flex md:fixed h-screen z-20">
        <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed top-0 left-0 h-full w-64 z-50 md:hidden bg-zinc-950/80 backdrop-blur-lg"
          >
            <SidebarContent 
              onLinkClick={() => setIsMobileMenuOpen(false)} 
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 w-full md:ml-60">
        <header className="md:hidden sticky top-0 bg-zinc-950/70 backdrop-blur-lg h-16 flex items-center justify-between px-4 border-b border-white/10 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-200">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-lg font-bold text-slate-100">FitFlow Pro</h2>
          </div>
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