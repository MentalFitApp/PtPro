// src/components/layout/NebulaBottomNav.jsx
// Bottom Navigation Nebula 2.0 - Design glass morphism con effetti glow
import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Home, Users, MessageSquare, Bell, Calendar, 
  Dumbbell, Activity, Menu, Utensils, BookOpen
} from 'lucide-react';

// === NAV ITEMS PER RUOLO ===
const getNavItems = (role) => {
  const configs = {
    client: [
      { to: '/client/dashboard', icon: Home, label: 'Home', color: 'cyan' },
      { to: '/client/scheda-allenamento', icon: Dumbbell, label: 'Workout', color: 'blue' },
      { to: '/client/chat', icon: MessageSquare, label: 'Chat', hasBadge: true, color: 'purple' },
      { to: '/client/checks', icon: Activity, label: 'Check', color: 'emerald' },
      { to: '/client/community', icon: Users, label: 'Community', color: 'violet' },
    ],
    coach: [
      { to: '/coach', icon: Home, label: 'Home', color: 'cyan' },
      { to: '/coach/clients', icon: Users, label: 'Clienti', color: 'blue' },
      { to: '/coach/chat', icon: MessageSquare, label: 'Chat', hasBadge: true, color: 'purple' },
      { to: '/coach/checks', icon: Activity, label: 'Check', color: 'emerald' },
    ],
    collaboratore: [
      { to: '/collaboratore/dashboard', icon: Home, label: 'Home', color: 'cyan' },
      { to: '/collaboratore/calendar', icon: Calendar, label: 'Calendario', color: 'emerald' },
    ],
    admin: [
      { to: '/', icon: Home, label: 'Home', color: 'cyan' },
      { to: '/clients', icon: Users, label: 'Clienti', color: 'blue' },
      { to: '/chat', icon: MessageSquare, label: 'Chat', hasBadge: true, color: 'purple' },
      { to: '/calendar', icon: Calendar, label: 'Calendario', color: 'emerald' },
      { to: '/updates', icon: Bell, label: 'Novità', color: 'amber' },
    ],
  };

  return configs[role] || configs.admin;
};

// === COLOR CONFIG ===
const colorConfig = {
  cyan: {
    active: 'text-cyan-400',
    glow: 'bg-cyan-400',
    bg: 'bg-cyan-500/20',
    shadow: 'shadow-cyan-500/50',
  },
  blue: {
    active: 'text-blue-400',
    glow: 'bg-blue-400',
    bg: 'bg-blue-500/20',
    shadow: 'shadow-blue-500/50',
  },
  purple: {
    active: 'text-purple-400',
    glow: 'bg-purple-400',
    bg: 'bg-purple-500/20',
    shadow: 'shadow-purple-500/50',
  },
  emerald: {
    active: 'text-emerald-400',
    glow: 'bg-emerald-400',
    bg: 'bg-emerald-500/20',
    shadow: 'shadow-emerald-500/50',
  },
  violet: {
    active: 'text-violet-400',
    glow: 'bg-violet-400',
    bg: 'bg-violet-500/20',
    shadow: 'shadow-violet-500/50',
  },
  amber: {
    active: 'text-amber-400',
    glow: 'bg-amber-400',
    bg: 'bg-amber-500/20',
    shadow: 'shadow-amber-500/50',
  },
};

// === NAV ITEM COMPONENT ===
const NavItem = ({ item, isActive, onClick, unreadCount = 0, isDark = true }) => {
  const Icon = item.icon;
  const colors = colorConfig[item.color] || colorConfig.cyan;
  const showBadge = item.hasBadge && unreadCount > 0;
  
  // Haptic feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(8);
    }
  };

  const handleClick = () => {
    triggerHaptic();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      className="relative flex flex-col items-center justify-center py-2 px-2 min-w-[60px] rounded-2xl"
    >
      {/* Background glow for active item */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="navBg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute inset-0 ${colors.bg} rounded-2xl`}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </AnimatePresence>
      
      {/* Icon Container */}
      <motion.div 
        className="relative z-10"
        animate={{ 
          y: isActive ? -2 : 0,
          scale: isActive ? 1.15 : 1 
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Icon 
          size={22} 
          strokeWidth={isActive ? 2.5 : 2}
          className={`transition-colors duration-200 ${
            isActive ? colors.active : isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        />
        
        {/* Badge */}
        {showBadge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50"
          >
            <span className="text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.span>
        )}
      </motion.div>
      
      {/* Label */}
      <motion.span 
        className={`relative z-10 text-[10px] mt-1 font-medium transition-all duration-200 ${
          isActive ? colors.active : isDark ? 'text-slate-500' : 'text-slate-400'
        }`}
        animate={{ 
          opacity: isActive ? 1 : 0.7,
          fontWeight: isActive ? 600 : 500
        }}
      >
        {item.label}
      </motion.span>
      
      {/* Active indicator dot */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="navDot"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className={`absolute -bottom-0.5 w-1 h-1 ${colors.glow} rounded-full shadow-lg ${colors.shadow}`}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// === MAIN BOTTOM NAV ===
export const NebulaBottomNav = ({ role = 'admin', unreadMessages = 0, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  
  const navItems = useMemo(() => getNavItems(role), [role]);
  
  const isActive = (path) => {
    // Home paths exact match
    if (path === '/' || path === '/coach' || path === '/client/dashboard' || path === '/collaboratore/dashboard') {
      return location.pathname === path;
    }
    // Others prefix match
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Glass Background - Light/Dark aware */}
      <div className={`absolute inset-0 backdrop-blur-2xl ${isDark ? 'bg-slate-900/70' : 'bg-white/80'}`} />
      
      {/* Top Border Glow */}
      <div className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent ${isDark ? 'via-cyan-500/30' : 'via-cyan-500/40'} to-transparent`} />
      
      {/* Nebula Glow Effects */}
      <div className={`absolute -top-10 left-1/4 w-32 h-16 rounded-full blur-2xl pointer-events-none ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/5'}`} />
      <div className={`absolute -top-10 right-1/4 w-32 h-16 rounded-full blur-2xl pointer-events-none ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`} />
      
      {/* Content */}
      <div className="relative flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            isActive={isActive(item.to)}
            onClick={() => navigate(item.to)}
            unreadCount={item.hasBadge ? unreadMessages : 0}
            isDark={isDark}
          />
        ))}
      </div>
    </motion.nav>
  );
};

export default NebulaBottomNav;
