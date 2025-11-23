import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  Home, Users, Calendar, MessageSquare, Bell, Settings,
  BarChart3, FileText, Shield, LogOut, Menu, X, ChevronDown,
  User, Award, TrendingUp, Zap, BookOpen, Package
} from 'lucide-react';
import { components, colors, animations } from '../../config/designSystem';

const roleConfigs = {
  admin: {
    name: 'Admin',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    icon: Shield,
    menu: [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Clienti', path: '/clients' },
      { icon: Users, label: 'Collaboratori', path: '/collaboratori' },
      { icon: Award, label: 'Dipendenti', path: '/dipendenti' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: TrendingUp, label: 'Statistiche', path: '/statistiche' },
      { icon: BookOpen, label: 'Corsi', path: '/course-admin' },
      { icon: Calendar, label: 'Calendario', path: '/calendar' },
      { icon: MessageSquare, label: 'Chat', path: '/chat' },
      { icon: Bell, label: 'Notifiche', path: '/notifications' },
    ],
  },
  coach: {
    name: 'Coach',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    icon: Award,
    menu: [
      { icon: Home, label: 'Dashboard', path: '/coach/dashboard' },
      { icon: Users, label: 'Clienti', path: '/coach/clients' },
      { icon: FileText, label: 'Anamnesi', path: '/coach/anamnesi' },
      { icon: Calendar, label: 'Calendario', path: '/calendar' },
      { icon: MessageSquare, label: 'Chat', path: '/chat' },
      { icon: Bell, label: 'Aggiornamenti', path: '/coach/updates' },
    ],
  },
  client: {
    name: 'Cliente',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    icon: User,
    menu: [
      { icon: Home, label: 'Dashboard', path: '/client/dashboard' },
      { icon: FileText, label: 'Anamnesi', path: '/client/anamnesi' },
      { icon: Zap, label: 'Check-in', path: '/client/checks' },
      { icon: Package, label: 'Allenamento', path: '/client/scheda-allenamento' },
      { icon: Package, label: 'Alimentazione', path: '/client/scheda-alimentazione' },
      { icon: Calendar, label: 'Calendario', path: '/calendar' },
      { icon: MessageSquare, label: 'Chat', path: '/chat' },
      { icon: Bell, label: 'Notifiche', path: '/notifications' },
    ],
  },
  collaboratore: {
    name: 'Collaboratore',
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-500',
    icon: Award,
    menu: [
      { icon: Home, label: 'Dashboard', path: '/collaboratore/dashboard' },
      { icon: Calendar, label: 'Calendario', path: '/calendar' },
      { icon: MessageSquare, label: 'Chat', path: '/chat' },
      { icon: Bell, label: 'Notifiche', path: '/notifications' },
    ],
  },
};

export const UnifiedSidebar = ({ role = 'admin', userName = 'User', userEmail = '', onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const config = roleConfigs[role] || roleConfigs.admin;
  const RoleIcon = config.icon;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {onClose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        exit={{ x: -300 }}
        className={`fixed top-0 left-0 h-screen ${collapsed ? 'w-20' : 'w-72'} bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 overflow-y-auto transition-all duration-300`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <motion.div 
                className="flex items-center gap-3"
                {...animations.fadeIn}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                  <RoleIcon size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-50 text-sm">MentalFit</h3>
                  <p className={`text-xs text-${config.color}-400`}>{config.name}</p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              {collapsed ? <Menu size={18} className="text-slate-400" /> : <X size={18} className="text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {config.menu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <motion.button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
                className={`w-full ${
                  active 
                    ? `bg-gradient-to-r from-${config.color}-500/10 to-${config.color}-500/5 border border-${config.color}-500/30 text-${config.color}-400` 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                } flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200`}
                whileHover={{ x: 4 }}
              >
                <Icon size={20} />
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold`}>
                {userName.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-slate-50">{userName}</p>
                    <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            <AnimatePresence>
              {showProfileMenu && !collapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-xl overflow-hidden"
                >
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    <Settings size={18} />
                    <span>Impostazioni</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-slate-700/50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default UnifiedSidebar;
