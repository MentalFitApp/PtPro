import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
// Importiamo le nuove, fantastiche icone da Lucide
import { LayoutGrid, Users, MessageSquare, Rocket, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Il nostro nuovo sfondo animato "Aurora"
const AnimatedBackground = () => (
  <div className="aurora-background" />
);

// Link di navigazione aggiornati con le nuove icone e stile
const navLinks = [
  { to: '/', icon: <LayoutGrid size={18} />, label: 'Dashboard' },
  { to: '/clients', icon: <Users size={18} />, label: 'Clienti' },
  { to: '/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/updates', icon: <Rocket size={18} />, label: 'Novità' }, // Icona più dinamica!
];

const NavLink = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm transition-colors ${
        isActive 
          ? 'bg-rose-600/10 text-rose-500 font-semibold' // Stile "attivo" più vibrante
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );
};

// La sidebar ora ha il nuovo bordo sfumato e uno sfondo più scuro
const SidebarContent = ({ onLinkClick }) => {
  const navigate = useNavigate();
  return (
    <aside className="w-60 bg-zinc-950/60 backdrop-blur-xl p-4 flex flex-col h-full gradient-border">
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
    <div className="relative min-h-screen">
      <AnimatedBackground />

      {/* Sidebar per Desktop */}
      <div className="hidden md:flex md:fixed h-full z-20">
        <SidebarContent />
      </div>

      {/* Menu a scomparsa per Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed top-0 left-0 h-full z-50 md:hidden"
          >
            <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 md:ml-60">
        {/* Header per Mobile */}
        <header className="md:hidden sticky top-0 bg-zinc-950/70 backdrop-blur-lg h-16 flex items-center justify-between px-4 border-b border-white/10 z-40">
           <h2 className="text-lg font-bold">FitFlow Pro</h2>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-200">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
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
