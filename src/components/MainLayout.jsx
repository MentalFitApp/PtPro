import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutGrid, Users, MessageSquare, FileText, Bell, Users as UsersIcon, Calendar, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

// AnimatedBackground globale
const AnimatedBackground = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

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
    }

    for (let i = 0; i < 30; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.setProperty('--top-offset', `${Math.random() * 100}vh`);
      star.style.setProperty('--fall-duration', `${8 + Math.random() * 6}s`);
      star.style.setProperty('--fall-delay', `${Math.random() * 5}s`);
      star.style.setProperty('--star-width', `${1 + Math.random() * 2}px`);
      starsContainer.appendChild(star);
    }

    setIsInitialized(true);
  }, [isInitialized]);

  return null;
};

const navLinks = [
  { to: '/clients', icon: <Users size={20} />, label: 'Clienti', roles: ['admin'] },
  { to: '/chat', icon: <MessageSquare size={20} />, label: 'Chat', roles: ['admin'] },
  { to: '/', icon: <LayoutGrid size={24} />, label: 'Dashboard', isCentral: true, roles: ['admin'] },
  { to: '/updates', icon: <Bell size={20} />, label: 'Novità', roles: ['admin'] },
  { to: '/collaboratori', icon: <UsersIcon size={20} />, label: 'Collaboratori', roles: ['admin'] },
  { to: '/guide-manager', icon: <FileText size={20} />, label: 'Guide & Lead', roles: ['admin'] }, // NUOVA
  { to: '/calendar-report', icon: <Calendar size={20} />, label: 'Calendario', roles: ['admin'] },
  { to: '/settings', icon: <Settings size={20} />, label: 'Impostazioni', roles: ['admin'] },
];

const coachNavLinks = [
  { to: '/coach/clients', icon: <Users size={20} />, label: 'Clienti', roles: ['coach'] },
  { to: '/coach/chat', icon: <MessageSquare size={20} />, label: 'Chat', roles: ['coach'] },
  { to: '/coach', icon: <LayoutGrid size={24} />, label: 'Dashboard', isCentral: true, roles: ['coach'] },
  { to: '/coach/anamnesi', icon: <FileText size={20} />, label: 'Anamnesi', roles: ['coach'] },
  { to: '/coach/updates', icon: <Bell size={20} />, label: 'Aggiornamenti', roles: ['coach'] },
  { to: '/coach/settings', icon: <Settings size={20} />, label: 'Impostazioni', roles: ['coach'] },
];

const NavLink = ({ to, icon, label, isCentral, isActive, roles }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = sessionStorage.getItem('app_role');

  if (roles && !roles.includes(role)) return null;

  return (
    <motion.button
      onClick={() => navigate(to)}
      className={`flex flex-col items-center justify-center p-2 text-sm transition-colors ${
        isActive 
          ? 'text-rose-500 bg-rose-600/10 rounded-full' 
          : 'text-slate-400 hover:text-rose-500 hover:bg-white/5 rounded-full'
      } ${isCentral ? 'scale-125' : ''}`}
      whileHover={{ scale: isCentral ? 1.3 : 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </motion.button>
  );
};

const BottomNav = ({ isCoach }) => {
  const location = useLocation();
  const links = isCoach ? coachNavLinks : navLinks;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-white/10 z-[100] md:hidden">
      <div className="flex justify-around items-center py-2 px-4">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            isCentral={link.isCentral}
            isActive={location.pathname === link.to || location.pathname.startsWith(link.to + '/')}
            roles={link.roles}
          />
        ))}
      </div>
    </div>
  );
};

const SidebarContent = ({ isCoach }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const links = isCoach ? coachNavLinks : navLinks;

  return (
    <aside className="w-64 h-full bg-zinc-950/60 backdrop-blur-xl p-4 flex flex-col gradient-border">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold px-2 text-slate-100">FitFlow Pro</h2>
      </div>
      <nav className="flex flex-col gap-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            isCentral={link.isCentral}
            isActive={location.pathname === link.to || location.pathname.startsWith(link.to + '/')}
            roles={link.roles}
          />
        ))}
      </nav>
    </aside>
  );
};

export default function MainLayout() { 
  const location = useLocation();
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    console.log('MainLayout: pathname corrente:', location.pathname);
    setIsCoach(location.pathname.startsWith('/coach'));
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row">
      <AnimatedBackground />
      <div className="hidden md:flex md:fixed h-screen z-[50]">
        <SidebarContent isCoach={isCoach} />
      </div>
      <div className="flex-1 w-full md:ml-64 min-h-screen">
        <main className="p-4 sm:p-6 lg:p-8 z-[10] pb-16 md:pb-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
        <BottomNav isCoach={isCoach} />
      </div>
    </div>
  );
}