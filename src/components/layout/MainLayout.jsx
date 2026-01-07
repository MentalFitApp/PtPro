import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Home, Users, MessageSquare, FileText, Bell,
  Calendar, Settings, ChevronLeft, ChevronRight, BarChart3, BellRing,
  UserCheck, BookOpen, Target, Activity, GraduationCap, Plus, Menu, X, Palette, Globe, Instagram,
  Dumbbell, Utensils, Shield, Layout, MoreHorizontal, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperAdmin } from '../../utils/superadmin';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
// import ThemeToggle from '../ui/ThemeToggle'; // TODO: riabilitare quando light mode pronta
import { defaultBranding } from '../../config/tenantBranding';
// import NotificationPermissionModal from '../notifications/NotificationPermissionModal'; // TODO: riabilitare quando notifiche implementate
import { 
  pageVariants, 
  fadeVariants, 
  sidebarVariants, 
  mobileMenuVariants,
  springs,
  durations,
  easings
} from '../../config/motionConfig';

// === STELLE ANIMATE - Usa lo stesso sistema di ProLayout ===
// MainLayout eredita le stelle create da ProLayout, non ne crea di proprie
const AnimatedStars = () => {
  // Le stelle sono già gestite da ProLayout tramite data-bg-preset
  // Questo componente esiste per retrocompatibilità
  return null;
};

// === LINKS NAVIGAZIONE CON SEZIONI (Stile Pro) ===
const adminNavConfig = {
  sections: [
    {
      title: 'Main',
      items: [
        { to: '/', icon: <Home size={18} />, label: 'Dashboard' },
        { to: '/clients', icon: <Users size={18} />, label: 'Clienti' },
        { to: '/chat', icon: <MessageSquare size={18} />, label: 'Messaggi' },
        { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
      ]
    },
    {
      title: 'Gestione',
      items: [
        { to: '/collaboratori', icon: <UserCheck size={18} />, label: 'Collaboratori' },
        { to: '/admin/dipendenti', icon: <Users size={18} />, label: 'Dipendenti' },
        { to: '/alimentazione-allenamento', icon: <Target size={18} />, label: 'Schede' },
      ]
    },
    {
      title: 'Contenuti',
      items: [
        { to: '/courses', icon: <BookOpen size={18} />, label: 'Corsi' },
        { to: '/community', icon: <Users size={18} />, label: 'Community' },
        { to: '/updates', icon: <BellRing size={18} />, label: 'Novità' },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { to: '/business-history', icon: <BarChart3 size={18} />, label: 'Business History' },
        { to: '/statistiche', icon: <Activity size={18} />, label: 'Statistiche' },
        { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
        { to: '/coach-analytics', icon: <Target size={18} />, label: 'Coach Analytics' },
      ]
    },
    {
      title: 'Impostazioni',
      items: [
        { to: '/admin/branding', icon: <Palette size={18} />, label: 'Branding' },
        { to: '/integrations', icon: <Zap size={18} />, label: 'Integrazioni' },
        { to: '/platform-settings', icon: <Settings size={18} />, label: 'Piattaforma' },
      ]
    }
  ]
};

const coachNavConfig = {
  sections: [
    {
      title: 'Main',
      items: [
        { to: '/coach', icon: <Home size={18} />, label: 'Dashboard' },
        { to: '/coach/clients', icon: <Users size={18} />, label: 'Clienti' },
        { to: '/coach/chat', icon: <MessageSquare size={18} />, label: 'Messaggi' },
      ]
    },
    {
      title: 'Gestione',
      items: [
        { to: '/coach/anamnesi', icon: <FileText size={18} />, label: 'Anamnesi' },
        { to: '/coach/schede', icon: <Target size={18} />, label: 'Schede' },
      ]
    },
    {
      title: 'Altro',
      items: [
        { to: '/coach/updates', icon: <BellRing size={18} />, label: 'Aggiornamenti' },
        { to: '/coach/settings', icon: <Settings size={18} />, label: 'Impostazioni' },
      ]
    }
  ]
};

const clientNavConfig = {
  sections: [
    {
      title: 'Main',
      items: [
        { to: '/client/dashboard', icon: <Home size={18} />, label: 'Dashboard' },
        { to: '/client/scheda-allenamento', icon: <Dumbbell size={18} />, label: 'Allenamento' },
        { to: '/client/scheda-alimentazione', icon: <Utensils size={18} />, label: 'Alimentazione' },
      ]
    },
    {
      title: 'Comunicazioni',
      items: [
        { to: '/client/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
        { to: '/client/community', icon: <Users size={18} />, label: 'Community' },
      ]
    },
    {
      title: 'Profilo',
      items: [
        { to: '/client/anamnesi', icon: <FileText size={18} />, label: 'Anamnesi' },
        { to: '/client/checks', icon: <Activity size={18} />, label: 'Check' },
        { to: '/client/payments', icon: <Target size={18} />, label: 'Pagamenti' },
        { to: '/client/courses', icon: <BookOpen size={18} />, label: 'Corsi' },
        { to: '/client/settings', icon: <Settings size={18} />, label: 'Impostazioni' },
      ]
    }
  ]
};

const collaboratoreNavConfig = {
  sections: [
    {
      title: 'Main',
      items: [
        { to: '/collaboratore/dashboard', icon: <Home size={18} />, label: 'Dashboard' },
        { to: '/collaboratore/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
      ]
    }
  ]
};

// Keep old flat arrays for bottom nav compatibility
const adminNavLinks = [
  { to: '/', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/updates', icon: <BellRing size={18} />, label: 'Novità' },
  { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
];

const coachNavLinks = [
  { to: '/coach', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/coach/clients', icon: <Users size={18} />, label: 'Clienti' },
];

const clientNavLinks = [
  { to: '/client/dashboard', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/client/scheda-allenamento', icon: <Dumbbell size={18} />, label: 'Allenamento' },
  { to: '/client/scheda-alimentazione', icon: <Utensils size={18} />, label: 'Alimentazione' },
  { to: '/client/courses', icon: <BookOpen size={18} />, label: 'Corsi' },
  { to: '/client/community', icon: <Users size={18} />, label: 'Community' },
  { to: '/client/anamnesi', icon: <FileText size={18} />, label: 'Anamnesi' },
  { to: '/client/checks', icon: <Activity size={18} />, label: 'Check' },
  { to: '/client/payments', icon: <Target size={18} />, label: 'Pagamenti' },
  { to: '/client/settings', icon: <Settings size={18} />, label: 'Impostazioni' },
];

const collaboratoreNavLinks = [
  { to: '/collaboratore/dashboard', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/collaboratore/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
];

// === PAGINE AUTH (NASCONDI SIDEBAR E NAV) ===
const AUTH_PAGES = ['/login', '/register', '/reset-password'];

// === MOBILE HAMBURGER MENU ===
const MobileMenu = ({ isOpen, setIsOpen, isCoach, isCollaboratore, isClient, userIsSuperAdmin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const links = isCollaboratore ? collaboratoreNavLinks : (isCoach ? coachNavLinks : (isClient ? clientNavLinks : adminNavLinks));
  const [expandedMenus, setExpandedMenus] = useState({});

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
          
          {/* Sidebar mobile */}
          <motion.aside
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed left-0 top-0 h-screen w-72 bg-slate-900/98 backdrop-blur-xl border-r border-slate-700/50 z-[70] flex flex-col shadow-2xl lg:hidden overflow-y-auto"
          >
            {/* Header con Safe Area */}
            <div className="pt-safe p-4 border-b border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/30">
                  <img 
                    src="/logo192.png" 
                    alt="FitFlows"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">FitFlows</h1>
                  <p className="text-xs text-slate-400">
                    {isCoach ? 'Coach Panel' : isCollaboratore ? 'Collaboratore' : isClient ? 'Client Area' : 'Admin Panel'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {links
                .filter(link => !link.isSuperAdmin || userIsSuperAdmin)
                .map((link) => {
                  const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
                  
                  // Gestione sezioni collassabili
                  if (link.isSection && link.children) {
                    const isExpanded = expandedMenus[link.label];
                    const hasActiveChild = link.children.some(child => 
                      location.pathname === child.to || location.pathname.startsWith(child.to + '/')
                    );
                    
                    return (
                      <div key={link.label}>
                        <button
                          onClick={() => setExpandedMenus(prev => ({ ...prev, [link.label]: !prev[link.label] }))}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            hasActiveChild
                              ? 'bg-slate-800 text-blue-400'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {link.icon}
                          <span className="flex-1 text-left">{link.label}</span>
                          <ChevronRight className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={16} />
                        </button>
                        {isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {link.children.map(child => {
                              const isChildActive = location.pathname === child.to || location.pathname.startsWith(child.to + '/');
                              return (
                                <button
                                  key={child.to}
                                  onClick={() => { navigate(child.to); setIsOpen(false); }}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                    isChildActive
                                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                                >
                                  {child.icon}
                                  <span>{child.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Link normale
                  return (
                    <button
                      key={link.to}
                      onClick={() => { navigate(link.to); setIsOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </button>
                  );
                })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

const getRoleNavConfig = (isCoach, isClient, isCollaboratore) => {
  if (isClient) {
    return {
      primary: [
        { to: '/client/dashboard', label: 'Home', Icon: Home, isCentral: true },
        { to: '/client/scheda-allenamento', label: 'Allenamento', Icon: Dumbbell },
        { to: '/client/scheda-alimentazione', label: 'Alimentazione', Icon: Utensils },
        { to: '/client/chat', label: 'Chat', Icon: MessageSquare, badgeKey: 'chat' },
        { type: 'more', label: 'Altro', Icon: MoreHorizontal }
      ],
      more: [
        { to: '/client/payments', label: 'Pagamenti', Icon: Target },
        { to: '/client/community', label: 'Community', Icon: Users },
        { to: '/client/settings', label: 'Impostazioni', Icon: Settings },
        { to: '/client/anamnesi', label: 'Anamnesi', Icon: FileText }
      ]
    };
  }

  if (isCoach) {
    return {
      primary: [
        { to: '/coach', label: 'Home', Icon: Home, isCentral: true },
        { to: '/coach/clients', label: 'Clienti', Icon: Users, badgeKey: 'clients' },
        { to: '/coach/anamnesi', label: 'Anamnesi', Icon: FileText },
        { to: '/coach/chat', label: 'Chat', Icon: MessageSquare, badgeKey: 'chat' },
        { type: 'more', label: 'Altro', Icon: MoreHorizontal }
      ],
      more: [
        { to: '/coach/updates', label: 'Novità', Icon: BellRing },
        { to: '/coach/schede', label: 'Schede', Icon: Target },
        { to: '/profile', label: 'Profilo', Icon: UserCheck },
        { to: '/coach/settings', label: 'Impostazioni', Icon: Settings }
      ]
    };
  }

  if (isCollaboratore) {
    return {
      primary: [
        { to: '/collaboratore/dashboard', label: 'Home', Icon: Home, isCentral: true },
        { to: '/collaboratore/calendar', label: 'Calendario', Icon: Calendar },
        { to: '/profile', label: 'Profilo', Icon: UserCheck }
      ],
      more: []
    };
  }

  return {
    primary: [
      { to: '/', label: 'Home', Icon: Home, isCentral: true },
      { to: '/clients', label: 'Clienti', Icon: Users, badgeKey: 'clients' },
      { to: '/chat', label: 'Chat', Icon: MessageSquare, badgeKey: 'chat' },
      { to: '/calendar', label: 'Calendario', Icon: Calendar },
      { type: 'more', label: 'Altro', Icon: MoreHorizontal }
    ],
    more: [
      { to: '/collaboratori', label: 'Collaboratori', Icon: UserCheck },
      { to: '/admin/dipendenti', label: 'Dipendenti', Icon: Users },
      { to: '/courses', label: 'Corsi', Icon: BookOpen },
      { to: '/community', label: 'Community', Icon: Users },
      { to: '/integrations', label: 'Integrazioni', Icon: Zap },
      { to: '/updates', label: 'Novità', Icon: BellRing },
      { to: '/analytics', label: 'Analytics', Icon: BarChart3 },
      { to: '/notifications', label: 'Notifiche', Icon: Bell },
      { to: '/admin/branding', label: 'Branding', Icon: Palette },
      { to: '/platform-settings', label: 'Piattaforma', Icon: Shield },
      { to: '/profile', label: 'Profilo', Icon: UserCheck }
    ]
  };
};

const BottomNav = ({ isCoach, isClient, isCollaboratore }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { primary, more } = getRoleNavConfig(isCoach, isClient, isCollaboratore);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [badges, setBadges] = useState({ chat: 0, clients: 0 });

  useEffect(() => {
    const readBadges = () => {
      try {
        const chat = parseInt(localStorage.getItem('ff_badge_chat') || '0', 10);
        const clients = parseInt(localStorage.getItem('ff_badge_clients') || '0', 10);
        setBadges({ chat: Number.isFinite(chat) ? chat : 0, clients: Number.isFinite(clients) ? clients : 0 });
      } catch {
        setBadges({ chat: 0, clients: 0 });
      }
    };

    readBadges();
    window.addEventListener('storage', readBadges);
    window.addEventListener('ff-badges-updated', readBadges);
    return () => {
      window.removeEventListener('storage', readBadges);
      window.removeEventListener('ff-badges-updated', readBadges);
    };
  }, []);

  const items = more.length ? primary : primary.filter(item => item.type !== 'more');

  const handleNav = (to) => {
    setIsMoreOpen(false);
    navigate(to);
  };

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-slate-900/95 border border-slate-700/60 rounded-2xl shadow-glow backdrop-blur-xl px-2 py-2">
            <div className="flex items-end justify-between gap-2">
              {items.map((item) => {
                const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                if (item.type === 'more') {
                  return (
                    <button
                      key="bottom-more"
                      onClick={() => setIsMoreOpen(true)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 h-12 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all"
                    >
                      <MoreHorizontal size={22} />
                      <span>Altro</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.to}
                    onClick={() => handleNav(item.to)}
                    className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-all ${
                      item.isCentral
                        ? 'h-14 -translate-y-2 rounded-full px-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-glow shadow-blue-500/30'
                        : 'h-12 rounded-xl text-xs font-semibold'
                    } ${
                      !item.isCentral && (isActive ? 'text-white bg-slate-800/80 border border-slate-700/70 shadow-glow' : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
                    }`}
                    aria-label={item.label}
                  >
                    <div className="relative">
                      <item.Icon size={item.isCentral ? 22 : 20} />
                      {!!item.badgeKey && badges[item.badgeKey] > 0 && (
                        <span className="absolute -top-1.5 -right-2 h-4 min-w-[14px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 font-semibold shadow-glow">
                          {badges[item.badgeKey] > 9 ? '9+' : badges[item.badgeKey]}
                        </span>
                      )}
                    </div>
                    <span className={`leading-tight ${item.isCentral ? 'text-[13px]' : 'text-[11px]'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMoreOpen && more.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMoreOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 px-4 pb-6"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 18px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-5xl mx-auto bg-slate-900/98 border border-slate-700/70 rounded-2xl shadow-glow backdrop-blur-xl p-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-sm font-semibold text-white">Altre azioni</div>
                  <button
                    onClick={() => setIsMoreOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-300"
                    aria-label="Chiudi Altro"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {more.map((item) => {
                    const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                    return (
                      <button
                        key={item.to}
                        onClick={() => handleNav(item.to)}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl border transition-all text-sm ${
                          isActive
                            ? 'border-blue-500/50 bg-blue-500/10 text-white shadow-glow'
                            : 'border-slate-700/70 bg-slate-800/70 text-slate-200 hover:border-blue-500/40 hover:bg-slate-800'
                        }`}
                      >
                        <div className="relative">
                          <item.Icon size={18} />
                          {!!item.badgeKey && badges[item.badgeKey] > 0 && (
                            <span className="absolute -top-1.5 -right-2 h-4 min-w-[14px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 font-semibold shadow-glow">
                              {badges[item.badgeKey] > 9 ? '9+' : badges[item.badgeKey]}
                            </span>
                          )}
                        </div>
                        <span className="text-left">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// === COMPONENTE LOGO SIDEBAR ===
const SidebarLogo = ({ isCollapsed }) => {
  const [branding, setBranding] = useState(defaultBranding);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const tid = localStorage.getItem('tenantId');
        if (!tid) return;

        const brandingDoc = await getDoc(doc(db, 'tenants', tid, 'settings', 'branding'));
        if (brandingDoc.exists()) {
          setBranding({ ...defaultBranding, ...brandingDoc.data() });
        }
      } catch (error) {
        console.debug('Could not load sidebar branding:', error);
      }
    };

    loadBranding();
  }, []);

  if (isCollapsed) {
    return branding.logoUrl ? (
      <img 
        src={branding.logoUrl} 
        alt={branding.appName}
        className="h-10 max-w-[60px] object-contain mx-auto"
      />
    ) : (
      <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-500/30 mx-auto shadow-lg shadow-blue-500/30">
        <img 
          src="/logo192.png" 
          alt="FitFlows"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return branding.logoUrl ? (
    <img 
      src={branding.logoUrl} 
      alt={branding.appName}
      className="h-12 max-w-full object-contain"
    />
  ) : (
    <>
      <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/30">
        <img 
          src="/logo192.png" 
          alt="FitFlow"
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <h1 className="text-lg font-bold text-white">{branding.appName}</h1>
        <p className="text-xs text-slate-400">Gestione Completa</p>
      </div>
    </>
  );
};

// === SIDEBAR DESKTOP PROFESSIONALE (Stile Pro con Sezioni) ===
const Sidebar = ({ isCoach, isCollaboratore, isClient, isCollapsed, setIsCollapsed, userIsSuperAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Usa le nuove configurazioni con sezioni
  const navConfig = isCollaboratore ? collaboratoreNavConfig : 
                    isCoach ? coachNavConfig : 
                    isClient ? clientNavConfig : 
                    adminNavConfig;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden lg:flex fixed left-0 top-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-40 flex-col"
    >
      {/* Header */}
      <div className={`p-4 border-b border-slate-700/50 ${isCollapsed ? 'px-3' : ''}`}>
        <div className="flex items-center justify-between">
          <SidebarLogo isCollapsed={isCollapsed} />
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Comprimi sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
        
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full mt-3 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
            title="Espandi sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Actions bar */}
      <div className={`px-3 py-3 border-b border-slate-700/50 flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
        <button
          onClick={() => {
            const profilePath = isCoach ? '/coach/profile' : 
                               isClient ? '/client/profile' : 
                               isCollaboratore ? '/collaboratore/profile' : '/profile';
            navigate(profilePath);
          }}
          className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-700 hover:ring-blue-500/50 transition-all flex-shrink-0"
          title="Profilo"
        >
          <img 
            src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || auth.currentUser?.email || 'User')}&background=3b82f6&color=fff`}
            alt="Profilo"
            className="w-full h-full object-cover"
          />
        </button>
        {/* ThemeToggle rimosso - dark mode forzata */}
        {!isCollapsed && (
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Notifiche"
          >
            <Bell size={18} />
          </button>
        )}
      </div>

      {/* Navigation con sezioni */}
      <nav className="flex-1 p-3 overflow-y-auto scrollbar-hide">
        {navConfig.sections.map((section, sectionIdx) => (
          <div key={section.title} className={sectionIdx > 0 ? 'mt-4' : ''}>
            {!isCollapsed && (
              <div className="px-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.to || 
                  (item.to !== '/' && item.to !== '/coach' && item.to !== '/client/dashboard' && item.to !== '/collaboratore/dashboard' && 
                   location.pathname.startsWith(item.to + '/'));
                
                return (
                  <motion.button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                    whileHover={{ x: isCollapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.98 }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <span className="truncate font-medium">{item.label}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </motion.aside>
  );
};

// === MAIN LAYOUT INTELLIGENTE ===
// Pagine conosciute dell'area cliente (NON admin ClientDetail)
const CLIENT_AREA_PAGES = [
  'onboarding', 'first-access', 'dashboard', 'anamnesi', 'checks', 
  'payments', 'chat', 'profile', 'scheda-alimentazione', 'scheda-allenamento',
  'courses', 'community', 'settings', 'habits', 'forgot-password'
];

// Verifica se il path è nell'area cliente (non admin ClientDetail)
const isClientAreaPath = (pathname) => {
  if (pathname === '/client') return true;
  if (!pathname.startsWith('/client/')) return false;
  // Estrae il primo segmento dopo /client/
  const segment = pathname.split('/')[2];
  return CLIENT_AREA_PAGES.includes(segment);
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  // Usa un trailing slash per evitare che /client matchi /clients
  const matchesBasePath = (basePath) => 
    location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);

  const isCoach = matchesBasePath('/coach');
  const isCollaboratore = matchesBasePath('/collaboratore');
  // /client (area cliente) vs /clients (lista clienti admin) vs /client/:id (admin ClientDetail)
  const isClient = isClientAreaPath(location.pathname);
  // Admin ClientDetail: /client/:id dove :id NON è una pagina client conosciuta
  const isClientDetailPage = location.pathname.match(/^\/client\/[^/]+/) !== null && !isClient;
  const isClientsListPage = location.pathname === '/clients';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);
  const [branding, setBranding] = useState(defaultBranding);

  // Determina se è pagina auth o community
  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  const isChatPage = location.pathname === '/community' || location.pathname.includes('/community');
  const [isChatSelected, setIsChatSelected] = useState(false);
  const showSidebar = !isAuthPage && auth.currentUser;
  const mobileBottomPadding = showSidebar && isMobile && !isAuthPage
    ? 'calc(env(safe-area-inset-bottom) + 110px)'
    : undefined;

  // Chiudi menu profilo quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isProfileMenuOpen && !e.target.closest('[data-profile-menu]')) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Salva lo stato della sidebar in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
    } catch (error) {
      console.warn('Failed to save sidebar state:', error);
    }
  }, [isSidebarCollapsed]);

  // Verifica se l'utente è SuperAdmin e carica branding
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

    const loadBranding = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Ottieni tenantId dal localStorage (più affidabile)
        const storedTenantId = localStorage.getItem('tenantId');
        
        let tenantId = storedTenantId;
        
        // Se non c'è nel localStorage, prova a recuperarlo
        if (!tenantId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              tenantId = userDoc.data()?.tenantId;
              if (tenantId) {
                localStorage.setItem('tenantId', tenantId);
              }
            }
          } catch (err) {
            console.debug('Could not access users collection for branding');
          }
        }

        if (tenantId) {
          try {
            const brandingDoc = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'));
            if (brandingDoc.exists()) {
              setBranding({ ...defaultBranding, ...brandingDoc.data() });
            }
          } catch (brandingError) {
            console.debug('Could not load branding, using defaults');
          }
        }
      } catch (error) {
        console.debug('Error loading branding:', error.message);
      }
    };

    checkSuperAdmin();
    loadBranding();
    
    // Ricontrolla quando cambia l'utente
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkSuperAdmin();
        loadBranding();
      } else {
        setUserIsSuperAdmin(false);
        setBranding(defaultBranding);
      }
    });

    return () => unsubscribe();
  }, []);

  // Rileva mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ascolta quando una chat viene selezionata in UnifiedChat o Community
  useEffect(() => {
    const handleChatSelected = (event) => {
      setIsChatSelected(event.detail);
    };
    window.addEventListener('chatSelected', handleChatSelected);
    return () => window.removeEventListener('chatSelected', handleChatSelected);
  }, [isChatPage, isMobile]);

  // Aggiorna branding tenant live (quando salvato dalla pagina /admin/branding)
  useEffect(() => {
    const handleTenantBrandingUpdated = (event) => {
      const detail = event?.detail;
      const updatedTenantId = detail?.tenantId;
      const updatedBranding = detail?.branding;
      if (!updatedTenantId || !updatedBranding) return;

      try {
        const currentTenantId = localStorage.getItem('tenantId');
        if (currentTenantId && currentTenantId !== updatedTenantId) return;
      } catch {
        // ignore
      }

      setBranding({ ...defaultBranding, ...updatedBranding });
    };

    window.addEventListener('tenantBrandingUpdated', handleTenantBrandingUpdated);
    return () => window.removeEventListener('tenantBrandingUpdated', handleTenantBrandingUpdated);
  }, []);

  return (
    <div className="overflow-x-hidden w-full max-w-full bg-transparent">
      {/* SFONDO STELLATO GLOBALE */}
      <div className="starry-background"></div>
      <AnimatedStars />

      <div className="relative min-h-screen flex w-full max-w-full overflow-x-hidden bg-transparent">
        {/* SIDEBAR DESKTOP: SOLO SU PAGINE PROTETTE */}
        {showSidebar && (
          <Sidebar 
            isCoach={isCoach}
            isCollaboratore={isCollaboratore}
            isClient={isClient}
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed}
            userIsSuperAdmin={userIsSuperAdmin}
          />
        )}

        {/* MOBILE MENU */}
        {showSidebar && isMobile && (
          <MobileMenu 
            isOpen={isMobileMenuOpen}
            setIsOpen={setIsMobileMenuOpen}
            isCoach={isCoach}
            isCollaboratore={isCollaboratore}
            isClient={isClient}
            userIsSuperAdmin={userIsSuperAdmin}
          />
        )}

        {/* HEADER MOBILE CON HAMBURGER - FIXED PER RIMANERE SEMPRE VISIBILE */}
        {showSidebar && isMobile && !isAuthPage && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: durations.normal, ease: easings.smooth }}
            className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-xl"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: '0.5rem' }}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="space-y-1.5">
                    <span className="block w-5 h-0.5 bg-blue-400 rounded-full" />
                    <span className="block w-5 h-0.5 bg-blue-400 rounded-full" />
                    <span className="block w-5 h-0.5 bg-blue-400 rounded-full" />
                  </div>
                </motion.button>
                <div className="flex items-center gap-2">
                  {branding.logoUrl ? (
                    // Logo personalizzato
                    <img 
                      src={branding.logoUrl} 
                      alt={branding.appName}
                      className="h-7 max-w-[100px] object-contain"
                    />
                  ) : (
                    // Fallback al design predefinito
                    <>
                      <div className="w-6 h-6 rounded-lg overflow-hidden ring-1 ring-blue-500/30">
                        <img 
                          src="/logo192.png" 
                          alt="FitFlows"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="hidden xs:block">
                        <h1 className="text-[11px] font-bold text-white">{branding.appName}</h1>
                        <p className="text-[8px] text-slate-400">
                          {isCoach ? branding.coachAreaName.replace('Area ', '') : 
                           isCollaboratore ? branding.collaboratoreAreaName.replace('Area ', '') : 
                           isClient ? branding.clientAreaName.replace('Area ', '') : 
                           branding.adminAreaName.replace('Area ', '')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* ThemeToggle rimosso - dark mode forzata */}
                {/* Menu utente con foto profilo - Dropdown */}
                <div className="relative" data-profile-menu>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-blue-500/30 hover:ring-blue-500/50 transition-all"
                  >
                    <img 
                      src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || auth.currentUser?.email || 'User')}&background=3b82f6&color=fff`}
                      alt="Profilo"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[70]"
                      >
                        <div className="p-3 border-b border-slate-700/50">
                          <p className="text-sm font-medium text-white truncate">{auth.currentUser?.displayName || 'Utente'}</p>
                          <p className="text-xs text-slate-400 truncate">{auth.currentUser?.email}</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              const profilePath = isCoach ? '/coach/profile' : 
                                                 isClient ? '/client/profile' : 
                                                 isCollaboratore ? '/collaboratore/profile' : '/profile';
                              navigate(profilePath);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                          >
                            <Users size={16} />
                            <span>Profilo</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              const settingsPath = isCoach ? '/coach/settings' : 
                                                  isClient ? '/client/settings' : 
                                                  isCollaboratore ? '/collaboratore/settings' : '/settings';
                              navigate(settingsPath);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                          >
                            <Settings size={16} />
                            <span>Impostazioni</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              auth.signOut();
                              navigate('/login');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-slate-700/50 transition-colors"
                          >
                            <ChevronRight size={16} className="rotate-180" />
                            <span>Esci</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONTENUTO PRINCIPALE */}
        <div className={`flex-1 transition-all duration-200 bg-transparent overflow-x-hidden ${
          showSidebar
            ? (isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]')
            : 'ml-0'
        } ${showSidebar && isMobile && !isAuthPage ? 'pt-16' : ''}`}>
          <main
            className={`min-h-screen ${
              (isClientDetailPage || isClientsListPage) ? 'bg-transparent' : 'bg-slate-900/30'
            } ${
              isChatPage ? 'p-0' : 'p-4 md:p-6'
            } ${showSidebar && isMobile && !isAuthPage ? 'pb-24' : ''}`}
            style={mobileBottomPadding ? { paddingBottom: mobileBottomPadding } : undefined}
          >
            <div className="w-full max-w-none">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Modal richiesta permessi notifiche (primo accesso) - TODO: riabilitare quando notifiche implementate */}
        {/* {!isAuthPage && <NotificationPermissionModal />} */}

        {/* Bottom navigation mobile con dashboard in evidenza */}
        {showSidebar && isMobile && !isAuthPage && (
          <BottomNav
            isCoach={isCoach}
            isClient={isClient}
            isCollaboratore={isCollaboratore}
          />
        )}

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