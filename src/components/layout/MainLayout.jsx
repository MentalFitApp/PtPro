import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Home, Users, MessageSquare, FileText, Bell,
  Calendar, Settings, ChevronLeft, ChevronRight, BarChart3, BellRing,
  UserCheck, BookOpen, Target, Activity, GraduationCap, Plus, Menu, X, Palette, Globe, Instagram,
  Dumbbell, Utensils, Shield, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperAdmin } from '../../utils/superadmin';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ThemeToggle from '../ui/ThemeToggle';
import { defaultBranding } from '../../config/tenantBranding';
import { 
  pageVariants, 
  fadeVariants, 
  sidebarVariants, 
  mobileMenuVariants,
  springs,
  durations,
  easings
} from '../../config/motionConfig';

// === STELLE DI SFONDO (50, stile CEO Dashboard Premium) ===
const AnimatedStars = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    // Verifica se esiste già un container stelle
    const existingContainer = document.querySelector('.stars');
    if (existingContainer) {
      setInitialized(true);
      return;
    }

    const container = document.createElement('div');
    container.className = 'stars';
    document.body.appendChild(container);

    // Crea 30 stelle distribuite su tutta la schermata
    for (let i = 0; i < 35; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      // Distribuzione più ampia e uniforme
      const minDistance = 8; // Distanza minima tra stelle in %
      let top, left, tooClose;
      
      do {
        top = Math.random() * 100;
        left = Math.random() * 100;
        tooClose = false;
        
        // Verifica distanza dalle altre stelle già create
        for (let j = 0; j < container.children.length; j++) {
          const existingStar = container.children[j];
          const existingTop = parseFloat(existingStar.style.top);
          const existingLeft = parseFloat(existingStar.style.left);
          const distance = Math.sqrt(Math.pow(top - existingTop, 2) + Math.pow(left - existingLeft, 2));
          
          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }
      } while (tooClose && container.children.length > 0);
      
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;

      container.appendChild(star);
    }

    setInitialized(true);
  }, [initialized]);

  return null;
};

// === LINKS NAVIGAZIONE CON SOTTOMENU ===
const adminNavLinks = [
  { to: '/', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/updates', icon: <BellRing size={18} />, label: 'Novità' },
  { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendario' },
  
  // Sezione Clienti
  { 
    label: 'Clienti', 
    icon: <Users size={18} />, 
    isSection: true,
    children: [
      { to: '/clients', icon: <Users size={18} />, label: 'Lista Clienti' },
      { to: '/new-client', icon: <Plus size={18} />, label: 'Nuovo Cliente' },
    ]
  },
  
  // Sezione Schede
  { 
    label: 'Schede', 
    icon: <Target size={18} />, 
    isSection: true,
    children: [
      { to: '/alimentazione-allenamento', icon: <Target size={18} />, label: 'Allenamento & Alimentazione' },
    ]
  },
  
  // Sezione Team
  { 
    label: 'Team', 
    icon: <UserCheck size={18} />, 
    isSection: true,
    children: [
      { to: '/collaboratori', icon: <UserCheck size={18} />, label: 'Collaboratori' },
      { to: '/admin/dipendenti', icon: <Users size={18} />, label: 'Dipendenti' },
    ]
  },
  
  // Sezione Analytics
  { 
    label: 'Analytics', 
    icon: <BarChart3 size={18} />, 
    isSection: true,
    children: [
      { to: '/business-history', icon: <BarChart3 size={18} />, label: 'Business History' },
      { to: '/statistiche', icon: <Activity size={18} />, label: 'Statistiche' },
      { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics Avanzate' },
    ]
  },
  
  // Sezione Contenuti
  { 
    label: 'Contenuti', 
    icon: <BookOpen size={18} />, 
    isSection: true,
    children: [
      { to: '/courses', icon: <BookOpen size={18} />, label: 'Corsi' },
      { to: '/community', icon: <Users size={18} />, label: 'Community' },
    ]
  },
  
  // Sezione Impostazioni
  { 
    label: 'Impostazioni', 
    icon: <Settings size={18} />, 
    isSection: true,
    children: [
      { to: '/admin/branding', icon: <Palette size={18} />, label: 'Branding' },
      { to: '/landing-pages', icon: <Layout size={18} />, label: 'Landing Pages' },
      { to: '/instagram', icon: <Instagram size={18} />, label: 'Instagram' },
      { to: '/platform-settings', icon: <Settings size={18} />, label: 'Gestione Piattaforma' },
    ]
  },
];

const coachNavLinks = [
  { to: '/coach', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/coach/clients', icon: <Users size={18} />, label: 'Clienti' },
  { to: '/coach/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/coach/anamnesi', icon: <FileText size={18} />, label: 'Anamnesi' },
  { to: '/coach/schede', icon: <Target size={18} />, label: 'Schede' },
  { to: '/coach/updates', icon: <BellRing size={18} />, label: 'Aggiornamenti' },
  { to: '/coach/settings', icon: <Settings size={18} />, label: 'Impostazioni' },
];

const clientNavLinks = [
  { to: '/client/dashboard', icon: <Home size={18} />, label: 'Dashboard', isCentral: true },
  { to: '/client/scheda-allenamento', icon: <Dumbbell size={18} />, label: 'Allenamento' },
  { to: '/client/scheda-alimentazione', icon: <Utensils size={18} />, label: 'Alimentazione' },
  { to: '/client/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
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
                    src="/logo192.PNG" 
                    alt="FitFlow"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">FitFlow</h1>
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
          src="/logo192.PNG" 
          alt="FitFlow"
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
          src="/logo192.PNG" 
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

// === SIDEBAR DESKTOP COLLASSABILE (Stile Premium CEO Dashboard) ===
const Sidebar = ({ isCoach, isCollaboratore, isClient, isCollapsed, setIsCollapsed, userIsSuperAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const links = isCollaboratore ? collaboratoreNavLinks : (isCoach ? coachNavLinks : (isClient ? clientNavLinks : adminNavLinks));
  const [expandedMenus, setExpandedMenus] = useState({});

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="hidden lg:flex fixed left-0 top-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-40 flex-col transition-all duration-300 shadow-2xl"
    >
      {/* Header con logo premium */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 w-full"
              >
                {/* Mostra logo personalizzato se disponibile, altrimenti design predefinito */}
                <SidebarLogo isCollapsed={false} />
              </motion.div>
            )}
          </AnimatePresence>
          {isCollapsed && (
            <SidebarLogo isCollapsed={true} />
          )}
        </div>
        <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-row'} items-center gap-2 mt-3`}>
          <button
            onClick={() => {
              const profilePath = isCoach ? '/coach/profile' : 
                                 isClient ? '/client/profile' : 
                                 isCollaboratore ? '/collaboratore/profile' : '/profile';
              navigate(profilePath);
            }}
            className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-blue-500/30 hover:ring-blue-500/50 transition-all flex-shrink-0"
            title="Profilo"
          >
            <img 
              src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || auth.currentUser?.email || 'User')}&background=3b82f6&color=fff`}
              alt="Profilo"
              className="w-full h-full object-cover"
            />
          </button>
          <ThemeToggle />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {links
          .filter(link => !link.isSuperAdmin || userIsSuperAdmin)
          .map((link) => {
            // Gestione sezioni collassabili
            if (link.isSection && link.children) {
              const isExpanded = expandedMenus[link.label];
              const hasActiveChild = link.children.some(child => 
                location.pathname === child.to || location.pathname.startsWith(child.to + '/')
              );

              return (
                <div key={link.label}>
                  <motion.button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                      }
                      setExpandedMenus(prev => ({
                        ...prev,
                        [link.label]: !prev[link.label]
                      }));
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      hasActiveChild
                        ? 'bg-slate-800 text-blue-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    whileHover={{ scale: isCollapsed ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex-shrink-0">
                      {React.cloneElement(link.icon, { size: 18 })}
                    </div>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <>
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 truncate"
                          >
                            {link.label}
                          </motion.span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            className="flex-shrink-0"
                          >
                            <ChevronRight size={14} />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && !isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 mt-1 space-y-1 overflow-hidden"
                      >
                        {link.children.map(child => {
                          const isChildActive = location.pathname === child.to || location.pathname.startsWith(child.to + '/');
                          return (
                            <motion.button
                              key={child.to}
                              onClick={() => navigate(child.to)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                isChildActive
                                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30'
                                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                              }`}
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex-shrink-0">
                                {React.cloneElement(child.icon, { size: 14 })}
                              </div>
                              <motion.span className="truncate">
                                {child.label}
                              </motion.span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // Link normale
            return (
              <motion.button
                key={link.to}
                onClick={() => {
                  navigate(link.to);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                whileHover={{ scale: isCollapsed ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-shrink-0">
                  {React.cloneElement(link.icon, { size: 18 })}
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="truncate"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
      </nav>
    </motion.aside>
  );
};

// === MAIN LAYOUT INTELLIGENTE ===
export default function MainLayout() {
  const location = useLocation();
  const [isCoach, setIsCoach] = useState(false);
  const [isCollaboratore, setIsCollaboratore] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false);
  const [branding, setBranding] = useState(defaultBranding);

  // Determina se è pagina auth o chat
  const isAuthPage = AUTH_PAGES.includes(location.pathname);
  const isChatPage = location.pathname === '/chat' || location.pathname === '/coach/chat' || location.pathname === '/client/chat' || location.pathname === '/community';
  const [isChatSelected, setIsChatSelected] = useState(false);
  const showSidebar = !isAuthPage && auth.currentUser;

  useEffect(() => {
    setIsCoach(location.pathname.startsWith('/coach'));
    setIsCollaboratore(location.pathname.startsWith('/collaboratore'));
    setIsClient(location.pathname.startsWith('/client'));
  }, [location.pathname]);

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
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ascolta quando una chat viene selezionata in UnifiedChat o Community
  useEffect(() => {
    const handleChatSelected = (event) => {
      console.log('MainLayout - chatSelected event received:', event.detail, 'isChatPage:', isChatPage, 'isMobile:', isMobile);
      setIsChatSelected(event.detail);
    };
    window.addEventListener('chatSelected', handleChatSelected);
    return () => window.removeEventListener('chatSelected', handleChatSelected);
  }, [isChatPage, isMobile]);

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
                          src="/logo192.PNG" 
                          alt="FitFlow"
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
                <ThemeToggle />
                {/* Menu utente con foto profilo */}
                <div className="relative">
                  <button
                    onClick={() => {
                      const profilePath = isCoach ? '/coach/profile' : 
                                         isClient ? '/client/profile' : 
                                         isCollaboratore ? '/collaboratore/profile' : '/profile';
                      navigate(profilePath);
                    }}
                    className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-blue-500/30 hover:ring-blue-500/50 transition-all"
                  >
                    <img 
                      src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || auth.currentUser?.email || 'User')}&background=3b82f6&color=fff`}
                      alt="Profilo"
                      className="w-full h-full object-cover"
                    />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONTENUTO PRINCIPALE - LARGHEZZA MASSIMA DESKTOP CON STILE PREMIUM */}
        <div className={`flex-1 transition-all duration-300 bg-transparent overflow-x-hidden ${
          showSidebar
            ? (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]')
            : 'ml-0'
        } ${showSidebar && isMobile && !isAuthPage ? 'pt-16' : ''}`}>
          <main className={`min-h-screen bg-transparent ${
            isChatPage ? 'p-0' : 'p-2 xs:p-4 sm:p-6 md:p-8 lg:p-10'
          }`}>
            <div className="max-w-7xl mx-auto w-full">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </div>
          </main>
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