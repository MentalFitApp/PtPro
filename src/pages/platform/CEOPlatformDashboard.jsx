// src/pages/platform/CEOPlatformDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, getDocs, where, doc, getDoc, orderBy, limit,
  updateDoc, deleteDoc, setDoc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db, auth, functions } from '../../firebase';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { 
  BarChart3, Users, DollarSign, Building2, TrendingUp, 
  Activity, Shield, AlertCircle, CheckCircle, Crown,
  Zap, Package, CreditCard, UserPlus, Eye, LogOut,
  Settings, Database, RefreshCw, ChevronLeft, ChevronRight,
  Home, Search, Filter, Download, Upload, Trash2, Edit3,
  Bell, Moon, Sun, Menu, X, Server, Globe, Lock, Unlock, Layout,
  FileText, ExternalLink, Calendar, Clock, ArrowUpRight, ArrowDownRight,
  AlertTriangle, ChevronDown, MoreVertical, PieChart, Target, Wallet,
  Mail, Plus, Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageBuilder from '../../components/platform/PageBuilder';
import LinkAccountBanner from '../../components/LinkAccountBanner';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { 
  Card, CardContainer, SectionHeader, PageHeader, MiniStat, MiniStatCard,
  ProgressBar, Badge, ActionButton, EmptyState, Modal 
} from '../../components/platform/PlatformUIComponents';

// === ANIMATED STARS BACKGROUND ===
const AnimatedStars = () => {
  useEffect(() => {
    const existingStars = document.querySelector('.platform-stars');
    if (existingStars) return;

    const container = document.createElement('div');
    container.className = 'platform-stars fixed inset-0 pointer-events-none z-0';
    document.body.appendChild(container);

    // Crea 55 stelle con effetto premium
    for (let i = 0; i < 55; i++) {
      const star = document.createElement('div');
      star.className = 'absolute rounded-full';
      
      const isGold = i % 6 === 0;
      const size = isGold ? 3 : i % 3 === 0 ? 2 : 1;
      
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.backgroundColor = isGold ? '#fbbf24' : '#60a5fa';
      star.style.boxShadow = isGold 
        ? '0 0 10px #fbbf24, 0 0 20px #fbbf24' 
        : '0 0 5px #60a5fa';
      star.style.animation = `twinkle ${2 + Math.random() * 3}s infinite, float ${10 + Math.random() * 10}s infinite ease-in-out`;
      
      container.appendChild(star);
    }

    return () => {
      container.remove();
    };
  }, []);

  return null;
};

// === SIDEBAR COMPONENT ===
const Sidebar = ({ collapsed, setCollapsed, activePage, setActivePage, handleLogout, alertsCount = 0 }) => {
  const navItems = [
    { id: 'overview', icon: <Home size={20} />, label: 'Overview' },
    { id: 'tenants', icon: <Building2 size={20} />, label: 'Tenants' },
    { id: 'subscriptions', icon: <CreditCard size={20} />, label: 'Abbonamenti' },
    { id: 'landing', icon: <Globe size={20} />, label: 'Landing Pages' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { id: 'revenue', icon: <Wallet size={20} />, label: 'Revenue' },
    { id: 'users', icon: <Users size={20} />, label: 'Users' },
    { id: 'alerts', icon: <Bell size={20} />, label: 'Avvisi', badge: true },
    { id: 'database', icon: <Database size={20} />, label: 'Database' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="fixed left-0 top-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col z-50"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <Crown className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-lg font-bold text-white">FitFlows</h1>
                <p className="text-xs text-slate-400">Platform CEO</p>
              </div>
            </motion.div>
          )}
          {collapsed && <Crown className="w-8 h-8 text-yellow-500 mx-auto" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5 text-slate-400" /> : <ChevronLeft className="w-5 h-5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
            <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
              activePage === item.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white preserve-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {item.icon}
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium"
              >
                {item.label}
              </motion.span>
            )}
            {item.badge && alertsCount > 0 && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                collapsed ? 'w-2 h-2' : 'min-w-5 h-5 px-1'
              } bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white`}>
                {!collapsed && alertsCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <div className={`${collapsed ? 'flex justify-center' : 'flex items-center gap-3 mb-3'}`}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{auth.currentUser?.email}</p>
              <p className="text-xs text-slate-400">Platform Administrator</p>
            </div>
          )}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0 preserve-white">
            <Crown className="w-5 h-5 text-white" />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors`}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </motion.div>
  );
};

// === STAT CARD ===
const StatCard = ({ title, value, subtitle, icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 shadow-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {React.cloneElement(icon, { className: `w-6 h-6` })}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp size={14} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
};

// === TENANT CARD ===
const TenantCard = ({ tenant, onViewDetails }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className="bg-slate-800/60 backdrop-blur-sm p-5 rounded-xl border border-slate-700/50 shadow-xl hover:border-purple-500/50 transition-all cursor-pointer"
    onClick={() => onViewDetails(tenant)}
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold text-white">{tenant.name}</h3>
        <p className="text-sm text-slate-400">{tenant.id}</p>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        tenant.status === 'active' 
          ? 'bg-green-500/10 text-green-400' 
          : 'bg-red-500/10 text-red-400'
      }`}>
        {tenant.status}
      </div>
    </div>
    
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div>
        <p className="text-2xl font-bold text-white">{tenant.users}</p>
        <p className="text-xs text-slate-400">Users</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{tenant.clients}</p>
        <p className="text-xs text-slate-400">Clients</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">€{tenant.revenue}</p>
        <p className="text-xs text-slate-400">Revenue</p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
      <div className="text-xs text-slate-500">
        Created {new Date(tenant.createdAt).toLocaleDateString()}
      </div>
      <button className="text-purple-400 hover:text-purple-300 transition-colors">
        <Eye size={16} />
      </button>
    </div>
  </motion.div>
);

export default function CEOPlatformDashboard() {
  const toast = useToast();
  const { confirmDelete, confirmAction } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [isPlatformCEO, setIsPlatformCEO] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const [platformStats, setPlatformStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    // Platform Revenue (abbonamenti che i tenants pagano a noi)
    platformRevenue: 0,          // Totale storico abbonamenti
    monthlyRecurring: 0,          // MRR - abbonamenti mensili
    annualRecurring: 0,           // ARR - proiezione annuale
    // Tenants Revenue (incassi che i tenants fanno dai loro clienti)
    tenantsRevenue: 0,            // Totale incassi clienti
    tenantsRevenueThisMonth: 0,   // Incassi clienti questo mese
    // Users stats
    totalUsers: 0,
    totalClients: 0,
    newTenantsThisMonth: 0,
    avgUsersPerTenant: 0,
    // Subscription stats
    expiringThisMonth: 0,
    trialTenants: 0,
    churnRate: 0,
    avgRevenuePerTenant: 0
  });

  const [tenants, setTenants] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [editingLanding, setEditingLanding] = useState(null);
  const [editingBranding, setEditingBranding] = useState(null);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);  // Per edit/create tenant
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showPageBuilder, setShowPageBuilder] = useState(false);
  const [currentTenantForBuilder, setCurrentTenantForBuilder] = useState(null);
  const [currentLandingBlocks, setCurrentLandingBlocks] = useState([]);
  const [editingLegalPage, setEditingLegalPage] = useState(null); // 'privacy' or 'terms'
  const [legalPageContent, setLegalPageContent] = useState(null);
  const [editingMainLanding, setEditingMainLanding] = useState(false); // Editor landing principale
  const [mainLandingConfig, setMainLandingConfig] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'trial', 'expired'
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkPlatformCEO();
  }, [navigate]);

  const checkPlatformCEO = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/platform-login');
        return;
      }

      const platformAdminDoc = await getDoc(doc(db, 'platform_admins', 'superadmins'));
      const platformAdminData = platformAdminDoc.data();
      
      if (!platformAdminData?.uids?.includes(user.uid)) {
        navigate('/platform-login');
        return;
      }

      setIsPlatformCEO(true);
      loadPlatformData();
    } catch (error) {
      console.error('Error checking Platform CEO:', error);
      navigate('/platform-login');
    }
  };

  const loadPlatformData = async () => {
    try {
      setLoading(true);

      // Load tenants con dati completi subscription
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      
      // Carica stats in parallelo per tutti i tenant
      const tenantsData = await Promise.all(
        tenantsSnap.docs.map(async (tenantDoc) => {
          const tenantId = tenantDoc.id;
          const tenantData = tenantDoc.data();
          
          // Conta users e clients
          const [usersSnap, clientsSnap] = await Promise.all([
            getDocs(query(collection(db, `tenants/${tenantId}/users`), limit(500))),
            getDocs(query(collection(db, `tenants/${tenantId}/clients`), limit(500)))
          ]);
          
          // Calcola revenue reale dai pagamenti dei clienti
          let totalRevenue = 0;
          let monthlyRevenue = 0;
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          try {
            const paymentsPromises = clientsSnap.docs.slice(0, 100).map(async (clientDoc) => {
              const paymentsSnap = await getDocs(
                query(
                  collection(db, `tenants/${tenantId}/clients/${clientDoc.id}/payments`),
                  limit(50)
                )
              );
              return paymentsSnap.docs.map(p => p.data());
            });
            const allPayments = (await Promise.all(paymentsPromises)).flat();
            
            allPayments.forEach(payment => {
              const amount = parseFloat(payment.amount) || 0;
              totalRevenue += amount;
              
              const paymentDate = payment.paymentDate?.toDate?.() || new Date(payment.paymentDate);
              if (paymentDate >= startOfMonth) {
                monthlyRevenue += amount;
              }
            });
          } catch (e) {
            // Fallback se errore permessi
            totalRevenue = tenantData.stats?.totalRevenue || clientsSnap.size * 50;
          }
          
          // Determina subscription status
          const subscription = tenantData.subscription || {};
          const subscriptionEndDate = subscription.endDate?.toDate?.() || null;
          const isExpired = subscriptionEndDate && subscriptionEndDate < now;
          const isExpiringSoon = subscriptionEndDate && 
            subscriptionEndDate > now && 
            subscriptionEndDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          return {
            id: tenantId,
            name: tenantData.name || tenantId.replace(/-/g, ' '),
            status: isExpired ? 'expired' : (tenantData.status || 'active'),
            users: usersSnap.size,
            clients: clientsSnap.size,
            revenue: totalRevenue.toFixed(0),
            monthlyRevenue: monthlyRevenue.toFixed(0),
            createdAt: tenantData.createdAt?.toDate() || new Date(),
            plan: subscription.plan || tenantData.plan || 'free',
            subscriptionStatus: subscription.status || 'active',
            subscriptionEndDate,
            isExpiringSoon,
            isExpired,
            billingCycle: subscription.billingCycle || 'monthly',
            price: subscription.price || 0,
            siteSlug: tenantData.siteSlug,
            customDomain: tenantData.customDomain,
            updatedAt: tenantData.updatedAt,
            owner: tenantData.owner || {},
            ...tenantData
          };
        })
      );

      setTenants(tenantsData);

      // Genera alerts
      const newAlerts = [];
      const now = new Date();
      
      tenantsData.forEach(t => {
        if (t.isExpired) {
          newAlerts.push({
            id: `expired-${t.id}`,
            type: 'error',
            title: 'Abbonamento Scaduto',
            message: `${t.name} ha l'abbonamento scaduto`,
            tenantId: t.id,
            createdAt: now
          });
        } else if (t.isExpiringSoon) {
          newAlerts.push({
            id: `expiring-${t.id}`,
            type: 'warning',
            title: 'Abbonamento in Scadenza',
            message: `${t.name} scade tra meno di 30 giorni`,
            tenantId: t.id,
            createdAt: now
          });
        }
        if (t.clients === 0 && t.createdAt < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
          newAlerts.push({
            id: `inactive-${t.id}`,
            type: 'info',
            title: 'Tenant Inattivo',
            message: `${t.name} non ha ancora clienti dopo 7+ giorni`,
            tenantId: t.id,
            createdAt: now
          });
        }
      });
      setAlerts(newAlerts);

      // Calculate platform stats - SEPARAZIONE CHIARA
      const totalUsers = tenantsData.reduce((sum, t) => sum + t.users, 0);
      const totalClients = tenantsData.reduce((sum, t) => sum + t.clients, 0);
      
      // TENANTS REVENUE = Incassi che i trainers fanno dai loro clienti
      const tenantsRevenue = tenantsData.reduce((sum, t) => sum + parseFloat(t.revenue || 0), 0);
      const tenantsRevenueThisMonth = tenantsData.reduce((sum, t) => sum + parseFloat(t.monthlyRevenue || 0), 0);
      
      const activeTenants = tenantsData.filter(t => t.status === 'active').length;
      const trialTenants = tenantsData.filter(t => t.plan === 'trial' || t.plan === 'free').length;
      const expiringThisMonth = tenantsData.filter(t => t.isExpiringSoon).length;
      
      // PLATFORM REVENUE = MRR/ARR basato sui prezzi abbonamento dei tenants
      const mrr = tenantsData.reduce((sum, t) => {
        if (t.status !== 'active' || t.plan === 'free' || t.plan === 'trial') return sum;
        let monthlyPrice = parseFloat(t.price) || 0;
        if (t.billingCycle === 'yearly') monthlyPrice = monthlyPrice / 12;
        return sum + monthlyPrice;
      }, 0);
      
      // Calcola revenue storico della piattaforma (somma tutti i mesi di abbonamento)
      const platformRevenue = tenantsData.reduce((sum, t) => {
        if (t.plan === 'free' || t.plan === 'trial') return sum;
        const startDate = t.subscription?.startDate?.toDate?.() || t.createdAt;
        const monthsActive = Math.max(1, Math.floor((new Date() - startDate) / (30 * 24 * 60 * 60 * 1000)));
        const monthlyPrice = t.billingCycle === 'yearly' ? (t.price || 0) / 12 : (t.price || 0);
        return sum + (monthlyPrice * monthsActive);
      }, 0);

      setPlatformStats({
        totalTenants: tenantsData.length,
        activeTenants,
        // Platform Revenue
        platformRevenue,
        monthlyRecurring: mrr,
        annualRecurring: mrr * 12,
        // Tenants Revenue
        tenantsRevenue,
        tenantsRevenueThisMonth,
        // Users
        totalUsers,
        totalClients,
        newTenantsThisMonth: tenantsData.filter(t => {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return t.createdAt > monthAgo;
        }).length,
        avgUsersPerTenant: tenantsData.length > 0 ? (totalUsers / tenantsData.length).toFixed(1) : 0,
        // Subscriptions
        expiringThisMonth,
        trialTenants,
        churnRate: tenantsData.length > 0 ? ((tenantsData.filter(t => t.isExpired).length / tenantsData.length) * 100).toFixed(1) : 0,
        avgRevenuePerTenant: activeTenants > 0 ? (mrr / activeTenants).toFixed(0) : 0
      });

      // Genera dati revenue PIATTAFORMA per grafico (ultimi 6 mesi)
      const revenueByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('it-IT', { month: 'short' });
        
        // Stima basata sul MRR con crescita
        const factor = 1 + (5 - i) * 0.12;
        revenueByMonth.push({
          month: monthName,
          platformRevenue: Math.round(mrr * factor),
          tenantsRevenue: Math.round((tenantsRevenueThisMonth || mrr * 2) * factor),
          tenants: Math.round(tenantsData.length * (0.7 + i * 0.05))
        });
      }
      setRevenueData(revenueByMonth);

    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/platform-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Gestione editing landing page
  const handleEditLanding = async (tenant) => {
    try {
      const landingDoc = await getDoc(doc(db, 'tenants', tenant.id, 'settings', 'landing'));
      setEditingLanding({
        tenantId: tenant.id,
        tenantName: tenant.name || tenant.id,
        config: landingDoc.exists() ? landingDoc.data() : {
          hero: { title: '', subtitle: '', ctaPrimary: 'Inizia Ora', ctaSecondary: 'Scopri di più' },
          branding: { appName: tenant.name || 'FitFlow', logoUrl: '/logo192.png' },
          siteSlug: tenant.siteSlug || tenant.id,
          enabled: true
        }
      });
    } catch (error) {
      console.error('Error loading landing config:', error);
      toast.error('Errore nel caricamento della configurazione');
    }
  };

  // Salva modifiche landing page
  const handleSaveLanding = async () => {
    try {
      const { tenantId, config } = editingLanding;
      
      // Salva configurazione landing
      await setDoc(doc(db, 'tenants', tenantId, 'settings', 'landing'), config, { merge: true });
      
      // Aggiorna siteSlug nel tenant principale
      if (config.siteSlug) {
        await updateDoc(doc(db, 'tenants', tenantId), { siteSlug: config.siteSlug });
      }
      
      // Ricarica tenant
      await loadPlatformData();
      setEditingLanding(null);
      toast.success('Landing page aggiornata con successo!');
    } catch (error) {
      console.error('Error saving landing:', error);
      toast.error('Errore nel salvataggio');
    }
  };

  // Cambia status sito (pubblicato/bozza)
  const handleToggleStatus = async (tenant) => {
    try {
      const newStatus = tenant.status === 'active' ? 'draft' : 'active';
      await updateDoc(doc(db, 'tenants', tenant.id), { status: newStatus });
      await loadPlatformData();
      toast.success(`Sito ${newStatus === 'active' ? 'pubblicato' : 'messo in bozza'}!`);
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Errore nel cambio di status');
    }
  };

  // Apri Page Builder per tenant specifico
  const handleOpenPageBuilder = async (tenant) => {
    try {
      setCurrentTenantForBuilder(tenant);
      const landingDoc = await getDoc(doc(db, 'tenants', tenant.id, 'settings', 'landing'));
      const blocks = landingDoc.exists() ? (landingDoc.data().blocks || []) : [];
      setCurrentLandingBlocks(blocks);
      setShowPageBuilder(true);
    } catch (error) {
      console.error('Error loading page builder:', error);
      toast.error('Errore nel caricamento del builder');
    }
  };

  // Salva landing page da Page Builder
  const handleSaveFromBuilder = async (blocks) => {
    try {
      if (!currentTenantForBuilder) return;
      
      await setDoc(
        doc(db, 'tenants', currentTenantForBuilder.id, 'settings', 'landing'),
        { 
          blocks, 
          updatedAt: serverTimestamp(),
          lastEditedBy: auth.currentUser?.uid,
          siteSlug: currentTenantForBuilder.siteSlug || currentTenantForBuilder.id
        },
        { merge: true }
      );
      
      setShowPageBuilder(false);
      setCurrentTenantForBuilder(null);
      setCurrentLandingBlocks([]);
      await loadPlatformData();
      toast.success('Landing page aggiornata con successo!');
    } catch (error) {
      console.error('Error saving from builder:', error);
      toast.error('Errore nel salvataggio');
    }
  };

  // Gestione branding
  const handleEditBranding = async (tenant) => {
    try {
      const brandingDoc = await getDoc(doc(db, 'tenants', tenant.id, 'settings', 'branding'));
      setEditingBranding({
        tenantId: tenant.id,
        tenantName: tenant.name || tenant.id,
        config: brandingDoc.exists() ? brandingDoc.data() : {
          appName: tenant.name || 'FitFlow',
          adminAreaName: 'Area Personale',
          clientAreaName: 'Area Cliente',
          coachAreaName: 'Area Coach',
          logoUrl: null,
          primaryColor: '#3b82f6',
          accentColor: '#60a5fa'
        }
      });
    } catch (error) {
      console.error('Error loading branding:', error);
      toast.error('Errore nel caricamento del branding');
    }
  };

  // Salva branding
  const handleSaveBranding = async () => {
    try {
      const { tenantId, config } = editingBranding;
      await setDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'), config, { merge: true });
      setEditingBranding(null);
      toast.success('Branding aggiornato con successo!');
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Errore nel salvataggio del branding');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger aggregazione Cloud Function
      const triggerStatsAggregation = httpsCallable(functions, 'triggerStatsAggregation');
      console.log('🔄 Triggering stats aggregation...');
      
      const result = await triggerStatsAggregation();
      console.log('✅ Stats aggregated:', result.data);
      
      // Ricarica i dati aggiornati
      await loadPlatformData();
      
      toast.success('Statistiche aggiornate con successo!');
    } catch (error) {
      console.error('❌ Errore refresh stats:', error);
      toast.warning('Errore durante l\'aggiornamento. Ricarico comunque i dati...');
      await loadPlatformData();
    } finally {
      setRefreshing(false);
    }
  };

  // Gestione abbonamento tenant
  const handleEditSubscription = (tenant) => {
    setEditingSubscription({
      id: tenant.id,
      name: tenant.name,
      plan: tenant.plan || 'starter',
      subscriptionStatus: tenant.subscriptionStatus || 'active',
      price: tenant.price || 0,
      billingCycle: tenant.billingCycle || 'monthly',
      subscriptionEndDate: tenant.subscriptionEndDate || null
    });
  };

  const handleSaveSubscription = async () => {
    try {
      const { tenantId, plan, status, price, billingCycle, endDate } = editingSubscription;
      
      await updateDoc(doc(db, 'tenants', tenantId), {
        'subscription.plan': plan,
        'subscription.status': status,
        'subscription.price': parseFloat(price),
        'subscription.billingCycle': billingCycle,
        'subscription.endDate': endDate ? Timestamp.fromDate(new Date(endDate)) : null,
        'subscription.updatedAt': serverTimestamp(),
        status: status === 'active' ? 'active' : 'inactive',
        updatedAt: serverTimestamp()
      });
      
      await loadPlatformData();
      setEditingSubscription(null);
      toast.success('Abbonamento aggiornato con successo!');
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast.error('Errore nel salvataggio dell\'abbonamento');
    }
  };

  // Esporta dati CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nome', 'Piano', 'Status', 'Users', 'Clients', 'Revenue', 'MRR', 'Creato'];
    const rows = tenants.map(t => [
      t.id,
      t.name,
      t.plan,
      t.status,
      t.users,
      t.clients,
      t.revenue,
      t.billingCycle === 'yearly' ? (t.price / 12).toFixed(2) : t.price,
      t.createdAt?.toLocaleDateString?.() || 'N/A'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // === GESTIONE TENANTS ===
  
  // Crea nuovo tenant
  const handleCreateTenant = async (tenantData) => {
    setActionLoading(true);
    try {
      const tenantId = tenantData.id || tenantData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const tenantDoc = {
        name: tenantData.name,
        status: 'active',
        plan: tenantData.plan || 'trial',
        subscription: {
          plan: tenantData.plan || 'trial',
          status: 'active',
          price: tenantData.price || 0,
          billingCycle: tenantData.billingCycle || 'monthly',
          startDate: serverTimestamp(),
          endDate: tenantData.plan === 'trial' 
            ? Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) // 14 giorni trial
            : null
        },
        owner: {
          email: tenantData.ownerEmail || '',
          name: tenantData.ownerName || ''
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'tenants', tenantId), tenantDoc);
      
      // Crea collezioni base
      await setDoc(doc(db, `tenants/${tenantId}/settings`, 'general'), {
        tenantName: tenantData.name,
        createdAt: serverTimestamp()
      });

      await loadPlatformData();
      setShowCreateTenant(false);
      toast.success(`Tenant "${tenantData.name}" creato con successo!`);
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Errore nella creazione del tenant: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Modifica tenant
  const handleUpdateTenant = async (tenantId, updates) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      await loadPlatformData();
      setEditingTenant(null);
      toast.success('Tenant aggiornato con successo!');
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error('Errore nell\'aggiornamento: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Sospendi tenant
  const handleSuspendTenant = async (tenant) => {
    const ok = await confirmAction(
      `Vuoi davvero SOSPENDERE il tenant "${tenant.name}"?\n\nGli utenti non potranno più accedere fino alla riattivazione.`,
      'Sospendi Tenant',
      'Sospendi'
    );
    if (!ok) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'tenants', tenant.id), {
        status: 'suspended',
        'subscription.status': 'suspended',
        suspendedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await loadPlatformData();
      setSelectedTenant(null);
      toast.warning(`Tenant "${tenant.name}" sospeso.`);
    } catch (error) {
      console.error('Error suspending tenant:', error);
      toast.error('Errore nella sospensione: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Riattiva tenant
  const handleReactivateTenant = async (tenant) => {
    const ok = await confirmAction(`Vuoi riattivare il tenant "${tenant.name}"?`, 'Riattiva Tenant', 'Riattiva');
    if (!ok) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'tenants', tenant.id), {
        status: 'active',
        'subscription.status': 'active',
        reactivatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await loadPlatformData();
      setSelectedTenant(null);
      toast.success(`Tenant "${tenant.name}" riattivato!`);
    } catch (error) {
      console.error('Error reactivating tenant:', error);
      toast.error('Errore nella riattivazione: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Elimina tenant (con conferma multipla)
  const handleDeleteTenant = async (tenant) => {
    const ok = await confirmDelete(
      `il tenant "${tenant.name}" (${tenant.users} utenti, ${tenant.clients} clienti, tutti i programmi e pagamenti)`
    );
    if (!ok) return;
    
    setActionLoading(true);
    try {
      // Elimina sottocollezioni principali
      const subcollections = ['users', 'clients', 'settings', 'programs', 'payments'];
      
      for (const subcol of subcollections) {
        const snap = await getDocs(query(collection(db, `tenants/${tenant.id}/${subcol}`), limit(500)));
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }
      
      // Elimina il documento tenant
      await deleteDoc(doc(db, 'tenants', tenant.id));
      
      await loadPlatformData();
      setSelectedTenant(null);
      toast.success(`Tenant "${tenant.name}" eliminato definitivamente.`);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('Errore nell\'eliminazione: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Naviga a TenantDeepDive per analytics dettagliate
  const handleViewTenantAnalytics = (tenant) => {
    navigate(`/platform/tenant/${tenant.id}`);
  };

  // Invia email al tenant
  const handleContactTenant = (tenant) => {
    const email = tenant.owner?.email || '';
    if (email) {
      window.open(`mailto:${email}?subject=FitFlow Platform - ${tenant.name}&body=Ciao,`, '_blank');
    } else {
      toast.warning('Email del proprietario non disponibile.');
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants
      .filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(t => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return t.status === 'active' && !t.isExpired;
        if (filterStatus === 'trial') return t.plan === 'trial' || t.plan === 'free';
        if (filterStatus === 'expired') return t.isExpired;
        if (filterStatus === 'expiring') return t.isExpiringSoon;
        return true;
      });
  }, [tenants, searchTerm, filterStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-yellow-500 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Loading Platform Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AnimatedStars />
      
      {/* Sidebar */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        activePage={activePage} 
        setActivePage={setActivePage}
        handleLogout={handleLogout}
        alertsCount={alerts.length}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-80'}`}>
        
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                FitFlows Platform Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-1">Complete platform overview and management</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <RefreshCw size={18} className="text-slate-400" />
              </button>
              <button className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors relative">
                <Bell size={18} className="text-slate-400" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 relative z-10">
          
          {/* Overview Page */}
          {activePage === 'overview' && (
            <div className="space-y-6">
              {/* Banner Collegamento Account - Multi-tenant */}
              <LinkAccountBanner />
              
              {/* Stats Grid - Prima riga */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Tenants"
                  value={platformStats.totalTenants}
                  subtitle={`${platformStats.newTenantsThisMonth} nuovi questo mese`}
                  icon={<Building2 />}
                  color="purple"
                  trend={12}
                />
                <StatCard
                  title="Active Tenants"
                  value={platformStats.activeTenants}
                  subtitle={`${platformStats.trialTenants} in trial`}
                  icon={<Activity />}
                  color="green"
                  trend={5}
                />
                <StatCard
                  title="Revenue Totale"
                  value={`€${(platformStats.totalRevenue || 0).toLocaleString()}`}
                  subtitle={`€${platformStats.avgRevenuePerTenant || 0} avg/tenant`}
                  icon={<DollarSign />}
                  color="yellow"
                  trend={18}
                />
                <StatCard
                  title="MRR"
                  value={`€${(platformStats.monthlyRecurring || 0).toFixed(0)}`}
                  subtitle={`€${platformStats.totalPaymentsThisMonth || 0} questo mese`}
                  icon={<TrendingUp />}
                  color="blue"
                  trend={8}
                />
              </div>

              {/* Stats Grid - Seconda riga */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Users Totali"
                  value={platformStats.totalUsers}
                  subtitle={`${platformStats.avgUsersPerTenant} avg/tenant`}
                  icon={<Users />}
                  color="blue"
                />
                <StatCard
                  title="Clients Totali"
                  value={platformStats.totalClients}
                  subtitle="Su tutti i tenant"
                  icon={<Target />}
                  color="purple"
                />
                <StatCard
                  title="In Scadenza"
                  value={platformStats.expiringThisMonth}
                  subtitle="Entro 30 giorni"
                  icon={<Clock />}
                  color="yellow"
                />
                <StatCard
                  title="Churn Rate"
                  value={`${platformStats.churnRate}%`}
                  subtitle="Abbonamenti scaduti"
                  icon={<AlertTriangle />}
                  color="purple"
                />
              </div>

              {/* Alerts Section */}
              {alerts.length > 0 && (
                <CardContainer>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Bell className="text-amber-400" size={20} />
                    Avvisi ({alerts.length})
                  </h2>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {alerts.slice(0, 5).map(alert => (
                      <div
                        key={alert.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          alert.type === 'error' 
                            ? 'bg-red-500/10 border-red-500/30' 
                            : alert.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-blue-500/10 border-blue-500/30'
                        }`}
                      >
                        {alert.type === 'error' ? (
                          <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="text-amber-400 flex-shrink-0" size={18} />
                        ) : (
                          <AlertCircle className="text-blue-400 flex-shrink-0" size={18} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">{alert.title}</p>
                          <p className="text-slate-400 text-xs truncate">{alert.message}</p>
                        </div>
                        <button
                          onClick={() => setSelectedTenant(tenants.find(t => t.id === alert.tenantId))}
                          className="text-xs text-purple-400 hover:text-purple-300 whitespace-nowrap"
                        >
                          Visualizza
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContainer>
              )}

              {/* Revenue Chart & Top Tenants */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mini Revenue Chart */}
                <CardContainer>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="text-green-400" size={20} />
                    Revenue Trend (6 mesi)
                  </h2>
                  <div className="flex items-end gap-2 h-40">
                    {revenueData.map((data, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-500 hover:to-green-300"
                          style={{ height: `${Math.max(20, (data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 120)}px` }}
                        />
                        <span className="text-xs text-slate-400">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </CardContainer>

                {/* Top Tenants by Revenue */}
                <CardContainer>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Crown className="text-yellow-400" size={20} />
                    Top Tenants per Revenue
                  </h2>
                  <div className="space-y-3">
                    {[...tenants]
                      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
                      .slice(0, 5)
                      .map((tenant, i) => (
                        <div key={tenant.id} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-yellow-500 text-black' :
                            i === 1 ? 'bg-slate-400 text-black' :
                            i === 2 ? 'bg-amber-700 text-white' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{tenant.name}</p>
                            <p className="text-xs text-slate-400">{tenant.clients} clienti</p>
                          </div>
                          <span className="text-green-400 font-bold">€{tenant.revenue}</span>
                        </div>
                      ))}
                  </div>
                </CardContainer>
              </div>

              {/* Quick Actions */}
              <CardContainer>
                <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActivePage('tenants')}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center gap-2"
                  >
                    <UserPlus className="w-6 h-6 text-purple-400" />
                    <span className="text-sm text-slate-300">Gestisci Tenants</span>
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6 text-yellow-400" />
                    <span className="text-sm text-slate-300">Export CSV</span>
                  </button>
                  <button 
                    onClick={() => setActivePage('subscriptions')}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center gap-2"
                  >
                    <CreditCard className="w-6 h-6 text-green-400" />
                    <span className="text-sm text-slate-300">Abbonamenti</span>
                  </button>
                  <button 
                    onClick={() => setActivePage('alerts')}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center gap-2 relative"
                  >
                    <Bell className="w-6 h-6 text-blue-400" />
                    <span className="text-sm text-slate-300">Avvisi</span>
                    {alerts.length > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {alerts.length}
                      </span>
                    )}
                  </button>
                </div>
              </CardContainer>
            </div>
          )}

          {/* Tenants Page */}
          {activePage === 'tenants' && (
            <div className="space-y-6">
              {/* Header with Create Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Gestione Tenants</h1>
                  <p className="text-slate-400">{tenants.length} tenants totali • {platformStats.activeTenants} attivi</p>
                </div>
                <button
                  onClick={() => setShowCreateTenant(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crea Tenant
                </button>
              </div>

              {/* Search Bar */}
              <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-64 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cerca tenants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {['all', 'active', 'trial', 'expiring', 'expired'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === status
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {status === 'all' ? 'Tutti' : 
                         status === 'active' ? 'Attivi' : 
                         status === 'trial' ? 'Trial' : 
                         status === 'expiring' ? 'In Scadenza' : 'Scaduti'}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                  >
                    <Download size={18} />
                    Export
                  </button>
                </div>
              </div>

              {/* Tenants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map(tenant => (
                  <TenantCard 
                    key={tenant.id} 
                    tenant={tenant}
                    onViewDetails={setSelectedTenant}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions Page */}
          {activePage === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-green-500" />
                  Gestione Abbonamenti
                </h2>
                <button 
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 p-6 rounded-xl border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{tenants.filter(t => t.status === 'active').length}</p>
                  <p className="text-sm text-slate-400">Abbonamenti Attivi</p>
                </div>
                <div className="bg-gradient-to-br from-amber-600/20 to-amber-900/20 p-6 rounded-xl border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 text-amber-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{tenants.filter(t => t.isExpiringSoon).length}</p>
                  <p className="text-sm text-slate-400">In Scadenza (30gg)</p>
                </div>
                <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 p-6 rounded-xl border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{tenants.filter(t => t.isExpired).length}</p>
                  <p className="text-sm text-slate-400">Scaduti</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 p-6 rounded-xl border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <Wallet className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">€{(platformStats.monthlyRecurring || 0).toFixed(0)}</p>
                  <p className="text-sm text-slate-400">MRR Attuale</p>
                </div>
              </div>

              {/* Subscriptions Table */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Tenant</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Piano</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Prezzo</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Ciclo</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">Scadenza</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {tenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{tenant.name?.charAt(0) || 'T'}</span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{tenant.name}</p>
                                <p className="text-xs text-slate-400">{tenant.clients} clienti</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tenant.plan === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                              tenant.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                              tenant.plan === 'trial' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {tenant.plan?.toUpperCase() || 'FREE'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              tenant.isExpired ? 'bg-red-500/20 text-red-400' :
                              tenant.isExpiringSoon ? 'bg-amber-500/20 text-amber-400' :
                              tenant.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {tenant.isExpired ? <AlertCircle size={12} /> : 
                               tenant.isExpiringSoon ? <Clock size={12} /> :
                               <CheckCircle size={12} />}
                              {tenant.isExpired ? 'Scaduto' : 
                               tenant.isExpiringSoon ? 'In Scadenza' :
                               tenant.status === 'active' ? 'Attivo' : 'Inattivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            €{tenant.price || 0}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {tenant.billingCycle === 'yearly' ? 'Annuale' : 'Mensile'}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {tenant.subscriptionEndDate 
                              ? tenant.subscriptionEndDate.toLocaleDateString('it-IT')
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditSubscription(tenant)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                                title="Modifica Abbonamento"
                              >
                                <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                              </button>
                              <button
                                onClick={() => setSelectedTenant(tenant)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                                title="Dettagli"
                              >
                                <Eye className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Landing Pages Management */}
          {activePage === 'landing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Globe className="w-8 h-8 text-purple-500" />
                  Landing Pages Management
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 transition-all"
                    >
                      <Shield size={18} />
                      <span>Privacy Policy</span>
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => setEditingLegalPage('privacy')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white preserve-white transition-all"
                    >
                      <Edit3 size={18} />
                      <span>Modifica</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-400 transition-all"
                    >
                      <FileText size={18} />
                      <span>Terms of Service</span>
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => setEditingLegalPage('terms')}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white preserve-white transition-all"
                    >
                      <Edit3 size={18} />
                      <span>Modifica</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 🌟 LANDING PAGE PRINCIPALE FITFLOWS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20 p-6 rounded-2xl border border-blue-500/30 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">🚀 Landing Page Principale FitFlows</h3>
                      <p className="text-slate-400">La pagina che vedono i visitatori su <span className="text-blue-400 font-mono">/landing</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href="/landing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-all"
                    >
                      <Eye size={18} />
                      <span>Anteprima</span>
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => setEditingMainLanding(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                    >
                      <Edit3 size={18} />
                      <span>Modifica Landing</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm preserve-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Globe className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{tenants.length}</p>
                  <p className="text-sm text-slate-400">Landing Pages Attive</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm preserve-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">~2.5K</p>
                  <p className="text-sm text-slate-400">Visite Totali (stimate)</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-green-600/20 to-green-900/20 p-6 rounded-xl border border-green-500/30 backdrop-blur-sm preserve-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{tenants.filter(t => t.status === 'active').length}</p>
                  <p className="text-sm text-slate-400">Siti Pubblicati</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 p-6 rounded-xl border border-yellow-500/30 backdrop-blur-sm preserve-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Server className="w-8 h-8 text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">3</p>
                  <p className="text-sm text-slate-400">Domini Custom</p>
                </motion.div>
              </div>

              {/* Landing Pages List */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                  <h3 className="text-lg font-bold text-white mb-4">Tutti i Siti</h3>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cerca per nome, slug o dominio..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Slug / URL</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Ultimo Aggiornamento</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {tenants.map((tenant, index) => (
                        <motion.tr
                          key={tenant.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center preserve-white">
                                <span className="text-white font-bold text-sm">
                                  {tenant.name?.charAt(0) || 'T'}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{tenant.name || tenant.id}</p>
                                <p className="text-xs text-slate-400">{tenant.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-mono text-sm">/site/{tenant.siteSlug || tenant.id}</p>
                              {tenant.customDomain && (
                                <p className="text-xs text-purple-400 flex items-center gap-1 mt-1">
                                  <Globe size={12} />
                                  {tenant.customDomain}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              tenant.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                              {tenant.status === 'active' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                              {tenant.status === 'active' ? 'Pubblicato' : 'Bozza'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-slate-400 text-sm">
                              {tenant.updatedAt ? new Date(tenant.updatedAt.seconds * 1000).toLocaleDateString('it-IT') : 'N/A'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.open(`/site/${tenant.siteSlug || tenant.id}`, '_blank')}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                                title="Visualizza Sito"
                              >
                                <Eye className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleOpenPageBuilder(tenant)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                                title="Page Builder"
                              >
                                <Layout className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                              </button>
                              <button
                                onClick={() => handleEditLanding(tenant)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                                title="Modifica Landing (Old)"
                              >
                                <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleEditBranding(tenant)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                                title="Modifica Branding"
                              >
                                <Settings className="w-4 h-4 text-slate-400 group-hover:text-yellow-400" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(tenant)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                                title={tenant.status === 'active' ? 'Metti in Bozza' : 'Pubblica'}
                              >
                                {tenant.status === 'active' ? (
                                  <Lock className="w-4 h-4 text-slate-400 group-hover:text-orange-400" />
                                ) : (
                                  <Unlock className="w-4 h-4 text-slate-400 group-hover:text-green-400" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteTenant(tenant)}
                                className="p-2 hover:bg-red-900/30 rounded-lg transition-colors group"
                                title="Elimina Tenant"
                              >
                                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Page */}
          {activePage === 'analytics' && (
            <div className="space-y-6">
              <PageHeader title="Platform Analytics" description="Metriche e KPI della piattaforma">
                <button
                  onClick={loadPlatformData}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Aggiorna
                </button>
              </PageHeader>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStat 
                  icon={<Target />} 
                  label="Conversione" 
                  value={`${platformStats.totalTenants > 0 ? ((platformStats.activeTenants / platformStats.totalTenants) * 100).toFixed(1) : 0}%`}
                  sublabel="Trial → Attivi"
                  color="green"
                />
                <MiniStat 
                  icon={<Users />} 
                  label="Avg Clients" 
                  value={tenants.length > 0 ? (platformStats.totalClients / tenants.length).toFixed(1) : 0}
                  sublabel="Per tenant"
                  color="blue"
                />
                <MiniStat 
                  icon={<TrendingUp />} 
                  label="Churn Rate" 
                  value={`${platformStats.churnRate}%`}
                  sublabel="Mensile"
                  color="purple"
                />
                <MiniStat 
                  icon={<DollarSign />} 
                  label="ARPU" 
                  value={`€${platformStats.avgRevenuePerTenant}`}
                  sublabel="Avg Revenue/Tenant"
                  color="yellow"
                />
              </div>

              {/* Revenue Trend Chart */}
              <Card>
                <SectionHeader icon={<BarChart3 className="text-purple-400" />} title="Trend Revenue (Ultimi 6 mesi)" />
                <div className="flex items-end gap-2 h-48">
                  {revenueData.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t-lg transition-all hover:from-purple-500 hover:to-blue-400"
                        style={{ height: `${Math.max(10, (item.platformRevenue / Math.max(...revenueData.map(r => r.platformRevenue || 1))) * 160)}px` }}
                        title={`€${item.platformRevenue}`}
                      />
                      <span className="text-xs text-slate-400 capitalize">{item.month}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">€{revenueData.reduce((s, r) => s + (r.platformRevenue || 0), 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Revenue Totale</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-400">+{revenueData.length > 1 ? (((revenueData[revenueData.length-1]?.platformRevenue || 0) / (revenueData[0]?.platformRevenue || 1) - 1) * 100).toFixed(0) : 0}%</p>
                    <p className="text-xs text-slate-400">Crescita 6 mesi</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">€{(revenueData.reduce((s, r) => s + (r.platformRevenue || 0), 0) / 6).toFixed(0)}</p>
                    <p className="text-xs text-slate-400">Media Mensile</p>
                  </div>
                </div>
              </Card>
              {/* Tenant Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CardContainer>
                  <h3 className="text-lg font-bold text-white mb-4">Distribuzione Piani</h3>
                  <div className="space-y-3">
                    {[
                      { plan: 'starter', color: 'bg-blue-500' },
                      { plan: 'professional', color: 'bg-purple-500' },
                      { plan: 'enterprise', color: 'bg-yellow-500' },
                      { plan: 'free', color: 'bg-slate-500' },
                      { plan: 'trial', color: 'bg-green-500' }
                    ].map(({ plan, color }) => {
                      const count = tenants.filter(t => t.plan === plan).length;
                      const percent = tenants.length > 0 ? (count / tenants.length * 100) : 0;
                      return (
                        <div key={plan} className="flex items-center gap-3">
                          <span className="text-sm text-slate-400 w-24 capitalize">{plan}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-sm text-white w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContainer>

                <CardContainer>
                  <h3 className="text-lg font-bold text-white mb-4">Status Abbonamenti</h3>
                  <div className="space-y-3">
                    {[
                      { status: 'active', label: 'Attivi', color: 'bg-green-500' },
                      { status: 'trial', label: 'Trial', color: 'bg-blue-500' },
                      { status: 'expiring', label: 'In Scadenza', color: 'bg-yellow-500' },
                      { status: 'expired', label: 'Scaduti', color: 'bg-red-500' }
                    ].map(({ status, label, color }) => {
                      const count = status === 'expiring' 
                        ? tenants.filter(t => t.isExpiringSoon).length
                        : status === 'expired'
                          ? tenants.filter(t => t.isExpired).length
                          : status === 'trial'
                            ? tenants.filter(t => t.plan === 'trial' || t.plan === 'free').length
                            : tenants.filter(t => t.status === status && !t.isExpired).length;
                      const percent = tenants.length > 0 ? (count / tenants.length * 100) : 0;
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className="text-sm text-slate-400 w-24">{label}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-sm text-white w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContainer>
              </div>
            </div>
          )}

          {/* Users Page */}
          {activePage === 'users' && (
            <div className="space-y-6">
              <PageHeader 
                title="Platform Users"
                subtitle="Utenti e clienti della piattaforma"
              />
              <CardContainer>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <MiniStatCard icon={Users} label="Trainers" value={platformStats.totalUsers} iconColor="text-blue-400" />
                  <MiniStatCard icon={Users} label="Clienti" value={platformStats.totalClients} iconColor="text-green-400" />
                  <MiniStatCard icon={TrendingUp} label="Avg/Tenant" value={platformStats.avgUsersPerTenant} iconColor="text-purple-400" />
                  <MiniStatCard 
                    icon={Activity} 
                    label="Ratio C/T" 
                    value={platformStats.totalUsers > 0 ? (platformStats.totalClients / platformStats.totalUsers).toFixed(1) : 0}
                    iconColor="text-yellow-400"
                  />
                </div>
                
                {/* Top Tenants by Users */}
                <h3 className="text-lg font-bold text-white mb-3">Top Tenants per Clienti</h3>
                <div className="space-y-2">
                  {[...tenants]
                    .sort((a, b) => b.clients - a.clients)
                    .slice(0, 5)
                    .map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-white font-medium">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.users} trainers • {t.clients} clienti</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          t.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
                          t.plan === 'professional' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {t.plan}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContainer>
            </div>
          )}

          {/* Revenue Page */}
          {activePage === 'revenue' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Revenue Dashboard</h1>
                  <p className="text-slate-400">Entrate abbonamenti e incassi tenants</p>
                </div>
                <button
                  onClick={() => {
                    const csvContent = [
                      ['Tenant', 'Piano', 'Abbonamento €/mo', 'Ciclo', 'Status', 'Incassi Clienti €'].join(','),
                      ...tenants.map(t => [
                        t.name,
                        t.plan,
                        t.price || 0,
                        t.billingCycle,
                        t.subscriptionStatus,
                        t.revenue
                      ].join(','))
                    ].join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Esporta CSV
                </button>
              </div>

              {/* Revenue Sections - SEPARATI */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PLATFORM REVENUE - Abbonamenti che i tenants pagano a TE */}
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 rounded-xl border border-green-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-lg font-bold text-white">Le TUE Entrate</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Abbonamenti che i tenants pagano a te per usare la piattaforma</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/20 rounded-lg">
                      <p className="text-sm text-slate-400">MRR</p>
                      <p className="text-2xl font-bold text-green-400">€{platformStats.monthlyRecurring?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500">Monthly Recurring Revenue</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg">
                      <p className="text-sm text-slate-400">ARR</p>
                      <p className="text-2xl font-bold text-green-400">€{platformStats.annualRecurring?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500">Annual Recurring Revenue</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg">
                      <p className="text-sm text-slate-400">Revenue Totale</p>
                      <p className="text-2xl font-bold text-white">€{platformStats.platformRevenue?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500">Storico abbonamenti</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg">
                      <p className="text-sm text-slate-400">ARPU</p>
                      <p className="text-2xl font-bold text-white">€{platformStats.avgRevenuePerTenant || 0}</p>
                      <p className="text-xs text-slate-500">Avg per tenant/mese</p>
                    </div>
                  </div>
                </div>

                {/* TENANTS REVENUE - Incassi che i trainer fanno dai loro clienti */}
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-6 rounded-xl border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Incassi dei Tenants</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Pagamenti che i clienti fanno ai trainers sulla piattaforma</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/20 rounded-lg">
                      <p className="text-sm text-slate-400">Questo Mese</p>
                      <p className="text-2xl font-bold text-blue-400">€{platformStats.tenantsRevenueThisMonth?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500">Incassi clienti</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg">
                      <p className="text-sm text-slate-400">Totale Storico</p>
                      <p className="text-2xl font-bold text-blue-400">€{platformStats.tenantsRevenue?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500">Tutti i pagamenti</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg col-span-2">
                      <p className="text-sm text-slate-400">Media per Tenant</p>
                      <p className="text-2xl font-bold text-white">
                        €{tenants.length > 0 ? Math.round(platformStats.tenantsRevenue / tenants.length) : 0}
                      </p>
                      <p className="text-xs text-slate-500">Incasso medio per trainer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue by Plan - PLATFORM REVENUE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CardContainer>
                  <h3 className="text-lg font-bold text-white mb-4">MRR per Piano</h3>
                  <div className="space-y-3">
                    {['enterprise', 'professional', 'starter'].map(plan => {
                      const planTenants = tenants.filter(t => t.plan === plan && t.status === 'active');
                      const planMRR = planTenants.reduce((sum, t) => {
                        const monthly = t.billingCycle === 'yearly' ? (t.price || 0) / 12 : (t.price || 0);
                        return sum + monthly;
                      }, 0);
                      const colors = {
                        enterprise: 'from-yellow-500 to-orange-500',
                        professional: 'from-purple-500 to-blue-500',
                        starter: 'from-blue-500 to-cyan-500'
                      };
                      return (
                        <div key={plan} className="p-4 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium capitalize">{plan}</span>
                            <span className="text-lg font-bold text-green-400">€{planMRR.toFixed(0)}/mo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${colors[plan]} rounded-full`}
                                style={{ width: `${platformStats.monthlyRecurring > 0 ? (planMRR / platformStats.monthlyRecurring * 100) : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{planTenants.length} tenants</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContainer>

                <CardContainer>
                  <h3 className="text-lg font-bold text-white mb-4">Top Tenants per Revenue</h3>
                  <div className="space-y-2">
                    {[...tenants]
                      .sort((a, b) => (b.price || 0) - (a.price || 0))
                      .slice(0, 5)
                      .map((t, idx) => (
                        <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-white font-medium">{t.name}</p>
                            <p className="text-xs text-slate-400">{t.plan} • {t.billingCycle}</p>
                          </div>
                          <span className="text-green-400 font-bold">€{t.price || 0}/mo</span>
                        </div>
                      ))}
                  </div>
                </CardContainer>
              </div>

              {/* Revenue Table */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50">
                  <h3 className="text-lg font-bold text-white">Dettaglio Revenue</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/30">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-slate-300">Tenant</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-300">Piano</th>
                        <th className="text-right p-4 text-sm font-medium text-slate-300">Prezzo/mo</th>
                        <th className="text-right p-4 text-sm font-medium text-slate-300">Revenue Clienti</th>
                        <th className="text-center p-4 text-sm font-medium text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map(t => (
                        <tr key={t.id} className="border-t border-slate-700/30 hover:bg-slate-700/20">
                          <td className="p-4">
                            <p className="text-white font-medium">{t.name}</p>
                            <p className="text-xs text-slate-400">{t.clients} clienti</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              t.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
                              t.plan === 'professional' ? 'bg-purple-500/20 text-purple-400' :
                              t.plan === 'starter' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {t.plan}
                            </span>
                          </td>
                          <td className="p-4 text-right text-white font-medium">€{t.price || 0}</td>
                          <td className="p-4 text-right text-green-400">€{t.revenue}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              t.isExpired ? 'bg-red-500/20 text-red-400' :
                              t.isExpiringSoon ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {t.isExpired ? 'Scaduto' : t.isExpiringSoon ? 'In Scadenza' : 'Attivo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Page */}
          {activePage === 'alerts' && (
            <div className="space-y-6">
              <PageHeader 
                title="Centro Avvisi"
                subtitle={`${alerts.length} avvisi attivi`}
                action={
                  <button
                    onClick={loadPlatformData}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Aggiorna
                  </button>
                }
              />

              {/* Alert Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-500/10 backdrop-blur-sm p-4 rounded-xl border border-red-500/30">
                  <MiniStatCard icon={AlertTriangle} label="Critici" value={alerts.filter(a => a.type === 'error').length} iconColor="text-red-400" />
                </div>
                <div className="bg-yellow-500/10 backdrop-blur-sm p-4 rounded-xl border border-yellow-500/30">
                  <MiniStatCard icon={Bell} label="Attenzione" value={alerts.filter(a => a.type === 'warning').length} iconColor="text-yellow-400" />
                </div>
                <div className="bg-blue-500/10 backdrop-blur-sm p-4 rounded-xl border border-blue-500/30">
                  <MiniStatCard icon={AlertCircle} label="Info" value={alerts.filter(a => a.type === 'info').length} iconColor="text-blue-400" />
                </div>
              </div>

              {/* Alerts List */}
              {alerts.length === 0 ? (
                <div className="bg-slate-800/60 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Nessun Avviso</h3>
                  <p className="text-slate-400">Tutto sembra a posto! Nessun problema rilevato.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => {
                    const tenant = tenants.find(t => t.id === alert.tenantId);
                    const alertStyles = {
                      error: 'border-red-500/50 bg-red-500/10',
                      warning: 'border-yellow-500/50 bg-yellow-500/10',
                      info: 'border-blue-500/50 bg-blue-500/10'
                    };
                    const iconStyles = {
                      error: <AlertTriangle className="w-5 h-5 text-red-400" />,
                      warning: <Bell className="w-5 h-5 text-yellow-400" />,
                      info: <AlertCircle className="w-5 h-5 text-blue-400" />
                    };
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-xl border ${alertStyles[alert.type]}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5">{iconStyles[alert.type]}</div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{alert.title}</h4>
                            <p className="text-slate-300 text-sm">{alert.message}</p>
                            {tenant && (
                              <div className="mt-2 flex items-center gap-3">
                                <span className="text-xs text-slate-400">
                                  Piano: <span className="text-white">{tenant.plan}</span>
                                </span>
                                <span className="text-xs text-slate-400">
                                  Clienti: <span className="text-white">{tenant.clients}</span>
                                </span>
                                {tenant.subscriptionEndDate && (
                                  <span className="text-xs text-slate-400">
                                    Scadenza: <span className="text-white">{tenant.subscriptionEndDate.toLocaleDateString()}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedTenant(tenant)}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                            >
                              Dettagli
                            </button>
                            {alert.type === 'error' && (
                              <button
                                onClick={() => {
                                  if (tenant) {
                                    setEditingSubscription(tenant);
                                  }
                                }}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                              >
                                Rinnova
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Database Page */}
          {activePage === 'database' && (
            <div className="space-y-6">
              <PageHeader 
                title="Database Management"
                subtitle="Gestione dati piattaforma"
              />
              <CardContainer>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-6 h-6 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Statistiche Database</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Total Collections</p>
                      <p className="text-sm text-slate-400">Across all tenants</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{tenants.length * 22}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Total Documents</p>
                      <p className="text-sm text-slate-400">Platform-wide</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{tenants.length * 711}</p>
                  </div>
                </div>
              </CardContainer>
            </div>
          )}

          {/* Settings Page */}
          {activePage === 'settings' && (
            <div className="space-y-6">
              <PageHeader 
                title="Platform Settings"
                subtitle="Configurazione globale della piattaforma"
              />

              {/* Platform Info */}
              <CardContainer>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Informazioni Piattaforma
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Nome Piattaforma</p>
                    <p className="text-white font-medium">FitFlow Pro</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Versione</p>
                    <p className="text-white font-medium">2.0.0</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Ambiente</p>
                    <p className="text-white font-medium">Production</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Ultimo Deploy</p>
                    <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContainer>

              {/* Pricing Plans */}
              <CardContainer>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  Piani Disponibili
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
                    <h4 className="text-white font-bold mb-2">Starter</h4>
                    <p className="text-2xl font-bold text-white mb-2">€29<span className="text-sm text-slate-400">/mese</span></p>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• 1 Trainer</li>
                      <li>• 50 Clienti</li>
                      <li>• Funzioni base</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30 ring-2 ring-purple-500/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-bold">Professional</h4>
                      <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">Popolare</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-2">€79<span className="text-sm text-slate-400">/mese</span></p>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• 5 Trainers</li>
                      <li>• 200 Clienti</li>
                      <li>• Tutte le funzioni</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-lg border border-yellow-500/30">
                    <h4 className="text-white font-bold mb-2">Enterprise</h4>
                    <p className="text-2xl font-bold text-white mb-2">€199<span className="text-sm text-slate-400">/mese</span></p>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Trainers illimitati</li>
                      <li>• Clienti illimitati</li>
                      <li>• White label</li>
                    </ul>
                  </div>
                </div>
              </CardContainer>

              {/* Platform Stats Summary */}
              <CardContainer>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  Riepilogo Platform
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MiniStatCard icon={Users} label="Tenants" value={platformStats.totalTenants} iconColor="text-blue-400" />
                  <MiniStatCard icon={Users} label="Trainers" value={platformStats.totalUsers} iconColor="text-purple-400" />
                  <MiniStatCard icon={Users} label="Clienti" value={platformStats.totalClients} iconColor="text-green-400" />
                  <MiniStatCard icon={DollarSign} label="MRR" value={`€${platformStats.monthlyRecurring?.toLocaleString() || 0}`} iconColor="text-green-400" />
                </div>
              </CardContainer>

              {/* Quick Actions */}
              <CardContainer>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Azioni Rapide
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={loadPlatformData}
                    className="p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                  >
                    <RefreshCw className="w-6 h-6 text-blue-400 mb-2" />
                    <p className="text-white font-medium">Refresh Dati</p>
                    <p className="text-xs text-slate-400">Ricarica statistiche</p>
                  </button>
                  <button
                    onClick={() => setActivePage('alerts')}
                    className="p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                  >
                    <Bell className="w-6 h-6 text-yellow-400 mb-2" />
                    <p className="text-white font-medium">Vedi Avvisi</p>
                    <p className="text-xs text-slate-400">{alerts.length} attivi</p>
                  </button>
                  <button
                    onClick={() => {
                      const csvContent = [
                        ['ID', 'Nome', 'Status', 'Piano', 'Users', 'Clients', 'Revenue'].join(','),
                        ...tenants.map(t => [t.id, t.name, t.status, t.plan, t.users, t.clients, t.revenue].join(','))
                      ].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `tenants-export-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    }}
                    className="p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                  >
                    <Download className="w-6 h-6 text-green-400 mb-2" />
                    <p className="text-white font-medium">Esporta Tenants</p>
                    <p className="text-xs text-slate-400">Download CSV</p>
                  </button>
                  <button
                    onClick={() => window.open('https://console.firebase.google.com', '_blank')}
                    className="p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                  >
                    <Database className="w-6 h-6 text-orange-400 mb-2" />
                    <p className="text-white font-medium">Firebase Console</p>
                    <p className="text-xs text-slate-400">Gestione DB</p>
                  </button>
                </div>
              </CardContainer>
            </div>
          )}

        </div>
      </div>

      {/* Subscription Edit Modal */}
      <AnimatePresence>
        {editingSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingSubscription(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Modifica Abbonamento</h2>
                  <p className="text-slate-400">{editingSubscription.name}</p>
                </div>
                <button
                  onClick={() => setEditingSubscription(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Piano</label>
                  <select
                    value={editingSubscription.plan || 'starter'}
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription,
                      plan: e.target.value
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="free">Free</option>
                    <option value="trial">Trial</option>
                    <option value="starter">Starter (€29/mo)</option>
                    <option value="professional">Professional (€79/mo)</option>
                    <option value="enterprise">Enterprise (€199/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Prezzo Mensile (€)</label>
                  <input
                    type="number"
                    value={editingSubscription.price || 0}
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription,
                      price: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ciclo Fatturazione</label>
                  <select
                    value={editingSubscription.billingCycle || 'monthly'}
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription,
                      billingCycle: e.target.value
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="monthly">Mensile</option>
                    <option value="yearly">Annuale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={editingSubscription.subscriptionStatus || 'active'}
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription,
                      subscriptionStatus: e.target.value
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="active">Attivo</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Scaduto</option>
                    <option value="cancelled">Cancellato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Data Scadenza</label>
                  <input
                    type="date"
                    value={editingSubscription.subscriptionEndDate 
                      ? new Date(editingSubscription.subscriptionEndDate).toISOString().split('T')[0]
                      : ''
                    }
                    onChange={(e) => setEditingSubscription({
                      ...editingSubscription,
                      subscriptionEndDate: e.target.value ? new Date(e.target.value) : null
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingSubscription(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={async () => {
                    try {
                      const tenantRef = doc(db, 'tenants', editingSubscription.id);
                      await updateDoc(tenantRef, {
                        plan: editingSubscription.plan,
                        'subscription.plan': editingSubscription.plan,
                        'subscription.price': editingSubscription.price,
                        'subscription.billingCycle': editingSubscription.billingCycle,
                        'subscription.status': editingSubscription.subscriptionStatus,
                        'subscription.endDate': editingSubscription.subscriptionEndDate 
                          ? Timestamp.fromDate(new Date(editingSubscription.subscriptionEndDate))
                          : null,
                        updatedAt: serverTimestamp()
                      });
                      
                      // Update local state
                      setTenants(prev => prev.map(t => 
                        t.id === editingSubscription.id 
                          ? { 
                              ...t, 
                              plan: editingSubscription.plan,
                              price: editingSubscription.price,
                              billingCycle: editingSubscription.billingCycle,
                              subscriptionStatus: editingSubscription.subscriptionStatus,
                              subscriptionEndDate: editingSubscription.subscriptionEndDate
                            }
                          : t
                      ));
                      
                      setEditingSubscription(null);
                    } catch (error) {
                      console.error('Error updating subscription:', error);
                      toast.error('Errore durante l\'aggiornamento');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Salva Modifiche
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Landing Page Editor Modal */}
      <AnimatePresence>
        {editingLanding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setEditingLanding(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full border border-slate-700 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Editor Landing Page</h2>
                  <p className="text-slate-400">{editingLanding.tenantName}</p>
                </div>
                <button
                  onClick={() => setEditingLanding(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* Slug Sito */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Slug Sito (URL)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">/site/</span>
                    <input
                      type="text"
                      value={editingLanding.config.siteSlug || ''}
                      onChange={(e) => setEditingLanding({
                        ...editingLanding,
                        config: { ...editingLanding.config, siteSlug: e.target.value }
                      })}
                      className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="nome-sito"
                    />
                  </div>
                </div>

                {/* Hero Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Titolo Hero</label>
                  <input
                    type="text"
                    value={editingLanding.config.hero?.title || ''}
                    onChange={(e) => setEditingLanding({
                      ...editingLanding,
                      config: {
                        ...editingLanding.config,
                        hero: { ...editingLanding.config.hero, title: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Trasforma il Tuo Business Fitness"
                  />
                </div>

                {/* Hero Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sottotitolo Hero</label>
                  <textarea
                    value={editingLanding.config.hero?.subtitle || ''}
                    onChange={(e) => setEditingLanding({
                      ...editingLanding,
                      config: {
                        ...editingLanding.config,
                        hero: { ...editingLanding.config.hero, subtitle: e.target.value }
                      }
                    })}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Descrizione del servizio..."
                  />
                </div>

                {/* CTA Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">CTA Primario</label>
                    <input
                      type="text"
                      value={editingLanding.config.hero?.ctaPrimary || ''}
                      onChange={(e) => setEditingLanding({
                        ...editingLanding,
                        config: {
                          ...editingLanding.config,
                          hero: { ...editingLanding.config.hero, ctaPrimary: e.target.value }
                        }
                      })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Inizia Ora"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">CTA Secondario</label>
                    <input
                      type="text"
                      value={editingLanding.config.hero?.ctaSecondary || ''}
                      onChange={(e) => setEditingLanding({
                        ...editingLanding,
                        config: {
                          ...editingLanding.config,
                          hero: { ...editingLanding.config.hero, ctaSecondary: e.target.value }
                        }
                      })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Scopri di più"
                    />
                  </div>
                </div>

                {/* App Name & Logo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nome App</label>
                    <input
                      type="text"
                      value={editingLanding.config.branding?.appName || ''}
                      onChange={(e) => setEditingLanding({
                        ...editingLanding,
                        config: {
                          ...editingLanding.config,
                          branding: { ...editingLanding.config.branding, appName: e.target.value }
                        }
                      })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="FitFlow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">URL Logo</label>
                    <input
                      type="text"
                      value={editingLanding.config.branding?.logoUrl || ''}
                      onChange={(e) => setEditingLanding({
                        ...editingLanding,
                        config: {
                          ...editingLanding.config,
                          branding: { ...editingLanding.config.branding, logoUrl: e.target.value }
                        }
                      })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="/logo192.png"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={editingLanding.config.enabled !== false}
                    onChange={(e) => setEditingLanding({
                      ...editingLanding,
                      config: { ...editingLanding.config, enabled: e.target.checked }
                    })}
                    className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enabled" className="text-slate-300">Landing Page Abilitata</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={handleSaveLanding}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white preserve-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Salva Modifiche
                </button>
                <button
                  onClick={() => setEditingLanding(null)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white preserve-white font-medium transition-colors"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branding Editor Modal */}
      <AnimatePresence>
        {editingBranding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingBranding(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Editor Branding</h2>
                  <p className="text-slate-400">{editingBranding.tenantName}</p>
                </div>
                <button
                  onClick={() => setEditingBranding(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome App</label>
                  <input
                    type="text"
                    value={editingBranding.config.appName || ''}
                    onChange={(e) => setEditingBranding({
                      ...editingBranding,
                      config: { ...editingBranding.config, appName: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Area Admin</label>
                    <input
                      type="text"
                      value={editingBranding.config.adminAreaName || ''}
                      onChange={(e) => setEditingBranding({
                        ...editingBranding,
                        config: { ...editingBranding.config, adminAreaName: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Area Cliente</label>
                    <input
                      type="text"
                      value={editingBranding.config.clientAreaName || ''}
                      onChange={(e) => setEditingBranding({
                        ...editingBranding,
                        config: { ...editingBranding.config, clientAreaName: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL Logo</label>
                  <input
                    type="text"
                    value={editingBranding.config.logoUrl || ''}
                    onChange={(e) => setEditingBranding({
                      ...editingBranding,
                      config: { ...editingBranding.config, logoUrl: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Colore Primario</label>
                    <input
                      type="color"
                      value={editingBranding.config.primaryColor || '#3b82f6'}
                      onChange={(e) => setEditingBranding({
                        ...editingBranding,
                        config: { ...editingBranding.config, primaryColor: e.target.value }
                      })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Colore Accento</label>
                    <input
                      type="color"
                      value={editingBranding.config.accentColor || '#60a5fa'}
                      onChange={(e) => setEditingBranding({
                        ...editingBranding,
                        config: { ...editingBranding.config, accentColor: e.target.value }
                      })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveBranding}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-white preserve-white font-medium transition-all"
                >
                  Salva Branding
                </button>
                <button
                  onClick={() => setEditingBranding(null)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white preserve-white font-medium transition-colors"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tenant Details Modal - CON FUNZIONI REALI */}
      <AnimatePresence>
        {selectedTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedTenant(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-3xl w-full border border-slate-700 my-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{selectedTenant.name?.charAt(0) || 'T'}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTenant.name}</h2>
                    <p className="text-slate-400 text-sm">{selectedTenant.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedTenant.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        selectedTenant.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {selectedTenant.status === 'active' ? 'Attivo' : 
                         selectedTenant.status === 'suspended' ? 'Sospeso' : selectedTenant.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedTenant.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
                        selectedTenant.plan === 'professional' ? 'bg-purple-500/20 text-purple-400' :
                        selectedTenant.plan === 'starter' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {selectedTenant.plan?.toUpperCase() || 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                  <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{selectedTenant.users}</p>
                  <p className="text-xs text-slate-400">Trainers</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                  <Users className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{selectedTenant.clients}</p>
                  <p className="text-xs text-slate-400">Clienti</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                  <DollarSign className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">€{selectedTenant.revenue}</p>
                  <p className="text-xs text-slate-400">Revenue Clienti</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                  <CreditCard className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">€{selectedTenant.price || 0}/mo</p>
                  <p className="text-xs text-slate-400">Abbonamento</p>
                </div>
              </div>

              {/* Info Details */}
              <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Dettagli</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Creato:</span>
                    <span className="text-white">{selectedTenant.createdAt?.toLocaleDateString?.() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ciclo:</span>
                    <span className="text-white">{selectedTenant.billingCycle === 'yearly' ? 'Annuale' : 'Mensile'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scadenza:</span>
                    <span className={`${selectedTenant.isExpired ? 'text-red-400' : selectedTenant.isExpiringSoon ? 'text-yellow-400' : 'text-white'}`}>
                      {selectedTenant.subscriptionEndDate?.toLocaleDateString?.() || 'Mai'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Owner:</span>
                    <span className="text-white">{selectedTenant.owner?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - FUNZIONI REALI */}
              <div className="space-y-3">
                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleViewTenantAnalytics(selectedTenant)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Analytics
                  </button>
                  <button 
                    onClick={() => handleEditSubscription(selectedTenant)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Gestisci Abbonamento
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => handleContactTenant(selectedTenant)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Contatta
                  </button>
                  <button 
                    onClick={() => {
                      setEditingTenant(selectedTenant);
                      setSelectedTenant(null);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifica
                  </button>
                  {selectedTenant.siteSlug && (
                    <button 
                      onClick={() => window.open(`/site/${selectedTenant.siteSlug}`, '_blank')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Landing
                    </button>
                  )}
                </div>

                {/* Danger Actions */}
                <div className="pt-3 border-t border-slate-700/50 flex gap-3">
                  {selectedTenant.status === 'active' ? (
                    <button 
                      onClick={() => handleSuspendTenant(selectedTenant)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm transition-colors disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      {actionLoading ? 'Attendere...' : 'Sospendi Tenant'}
                    </button>
                  ) : selectedTenant.status === 'suspended' ? (
                    <button 
                      onClick={() => handleReactivateTenant(selectedTenant)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-400 text-sm transition-colors disabled:opacity-50"
                    >
                      <Unlock className="w-4 h-4" />
                      {actionLoading ? 'Attendere...' : 'Riattiva Tenant'}
                    </button>
                  ) : null}
                  <button 
                    onClick={() => handleDeleteTenant(selectedTenant)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Tenant Modal */}
      <AnimatePresence>
        {(showCreateTenant || editingTenant) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowCreateTenant(false); setEditingTenant(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingTenant ? 'Modifica Tenant' : 'Crea Nuovo Tenant'}
                </h2>
                <button
                  onClick={() => { setShowCreateTenant(false); setEditingTenant(null); }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                  id: editingTenant?.id || '',
                  name: formData.get('name'),
                  plan: formData.get('plan'),
                  price: parseFloat(formData.get('price')) || 0,
                  billingCycle: formData.get('billingCycle'),
                  ownerEmail: formData.get('ownerEmail'),
                  ownerName: formData.get('ownerName')
                };
                
                if (editingTenant) {
                  handleUpdateTenant(editingTenant.id, {
                    name: data.name,
                    plan: data.plan,
                    'subscription.plan': data.plan,
                    'subscription.price': data.price,
                    'subscription.billingCycle': data.billingCycle,
                    'owner.email': data.ownerEmail,
                    'owner.name': data.ownerName
                  });
                } else {
                  handleCreateTenant(data);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome Tenant *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingTenant?.name || ''}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Es: Palestra Fitness Roma"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Piano</label>
                    <select
                      name="plan"
                      defaultValue={editingTenant?.plan || 'trial'}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="trial">Trial (14gg)</option>
                      <option value="free">Free</option>
                      <option value="starter">Starter €29/mo</option>
                      <option value="professional">Professional €79/mo</option>
                      <option value="enterprise">Enterprise €199/mo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Prezzo €/mo</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={editingTenant?.price || 0}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ciclo Fatturazione</label>
                  <select
                    name="billingCycle"
                    defaultValue={editingTenant?.billingCycle || 'monthly'}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="monthly">Mensile</option>
                    <option value="yearly">Annuale</option>
                  </select>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Proprietario (opzionale)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nome</label>
                      <input
                        name="ownerName"
                        type="text"
                        defaultValue={editingTenant?.owner?.name || ''}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Mario Rossi"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email</label>
                      <input
                        name="ownerEmail"
                        type="email"
                        defaultValue={editingTenant?.owner?.email || ''}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="email@esempio.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowCreateTenant(false); setEditingTenant(null); }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingTenant ? 'Salva Modifiche' : 'Crea Tenant'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Page Editor Modal */}
      <AnimatePresence>
        {editingLegalPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setEditingLegalPage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {editingLegalPage === 'privacy' ? (
                      <Shield className="w-8 h-8 text-blue-400" />
                    ) : (
                      <FileText className="w-8 h-8 text-purple-400" />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {editingLegalPage === 'privacy' ? 'Modifica Privacy Policy' : 'Modifica Terms of Service'}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Configura il contenuto della pagina legale
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingLegalPage(null)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <p className="text-blue-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>
                      Per modificare il contenuto, apri Firebase Console → Firestore → platform → settings → landingPages → {editingLegalPage}
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      URL della pagina
                    </label>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <code className="text-green-400 text-sm">
                        https://tuo-dominio.com/{editingLegalPage}
                      </code>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Path Firestore
                    </label>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <code className="text-purple-400 text-sm">
                        platform/settings/landingPages/{editingLegalPage}
                      </code>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Struttura del documento
                    </label>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
                      <p className="text-slate-400 text-sm font-mono">
                        content: &#123;<br/>
                        &nbsp;&nbsp;title: string,<br/>
                        &nbsp;&nbsp;subtitle: string,<br/>
                        &nbsp;&nbsp;intro: string,<br/>
                        &nbsp;&nbsp;sections: &#91;&#123;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;icon: string,<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;title: string,<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;content: string&#91;&#93;<br/>
                        &nbsp;&nbsp;&#125;&#93;,<br/>
                        &nbsp;&nbsp;contact: &#123;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;title: string,<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;email: string,<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;address: string<br/>
                        &nbsp;&nbsp;&#125;<br/>
                        &#125;
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <a
                      href="https://console.firebase.google.com/project/flowfitpro/firestore/databases/-default-/data"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white preserve-white font-medium transition-colors"
                    >
                      <Database size={18} />
                      Apri Firebase Console
                    </a>
                    <a
                      href={`/${editingLegalPage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white preserve-white font-medium transition-colors"
                    >
                      <Eye size={18} />
                      Anteprima Pagina
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Builder Modal */}
      {showPageBuilder && (
        <PageBuilder
          initialBlocks={currentLandingBlocks}
          onSave={handleSaveFromBuilder}
          onClose={() => {
            setShowPageBuilder(false);
            setCurrentTenantForBuilder(null);
            setCurrentLandingBlocks([]);
          }}
        />
      )}

      {/* Main Landing Page Editor Modal */}
      <AnimatePresence>
        {editingMainLanding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setEditingMainLanding(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-blue-500/30 max-w-5xl w-full max-h-[95vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-cyan-600/30 p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        🚀 Landing Page Principale FitFlows
                      </h3>
                      <p className="text-slate-400 mt-1">
                        Personalizza la pagina che vedono i visitatori
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingMainLanding(false)}
                    className="p-3 hover:bg-slate-700/50 rounded-xl transition-colors group"
                  >
                    <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <a
                    href="/landing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                      <Eye className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Anteprima Live</p>
                      <p className="text-sm text-slate-400">Vedi come appare ai visitatori</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-500 ml-auto" />
                  </a>

                  <button
                    onClick={() => {
                      setEditingMainLanding(false);
                      navigate('/admin/landing-pages');
                    }}
                    className="group flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-purple-500/50 rounded-xl transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                      <Layout className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Page Builder</p>
                      <p className="text-sm text-slate-400">Editor visuale avanzato</p>
                    </div>
                  </button>

                  <a
                    href="https://console.firebase.google.com/project/flowfitpro/firestore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-orange-500/50 rounded-xl transition-all"
                  >
                    <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center group-hover:bg-orange-600/30 transition-colors">
                      <Database className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Firebase Console</p>
                      <p className="text-sm text-slate-400">Modifica dati direttamente</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-500 ml-auto" />
                  </a>
                </div>

                {/* Sezioni della Landing */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Sezioni della Landing Page
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Hero Section', desc: 'Titolo principale, sottotitolo, CTA buttons', icon: '🎯', color: 'blue' },
                      { name: 'Features', desc: '6 card con icone che mostrano le funzionalità', icon: '✨', color: 'purple' },
                      { name: 'Pricing', desc: '3 piani: Starter, Professional, Enterprise', icon: '💰', color: 'green' },
                      { name: 'Testimonials', desc: 'Recensioni di personal trainer soddisfatti', icon: '⭐', color: 'yellow' },
                      { name: 'CTA Finale', desc: 'Call-to-action finale con gradiente', icon: '🚀', color: 'cyan' },
                      { name: 'Footer', desc: 'Links, contatti, social media', icon: '📋', color: 'slate' }
                    ].map((section, index) => (
                      <motion.div
                        key={section.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 bg-${section.color}-600/10 border border-${section.color}-500/20 rounded-xl`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{section.icon}</span>
                          <div>
                            <p className="font-medium text-white">{section.name}</p>
                            <p className="text-sm text-slate-400">{section.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Come modificare */}
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    Come modificare la Landing Page
                  </h4>
                  <div className="space-y-3 text-slate-300 text-sm">
                    <p className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span><strong>File sorgente:</strong> <code className="bg-slate-800 px-2 py-1 rounded text-blue-400">src/pages/public/LandingPage.jsx</code></span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span><strong>Configurazione:</strong> La landing carica i dati da <code className="bg-slate-800 px-2 py-1 rounded text-purple-400">tenants/[tenantId]/settings/landing</code> in Firestore</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span><strong>Default config:</strong> Se non ci sono dati in Firestore, usa la configurazione di default nel file JSX</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">4.</span>
                      <span><strong>Per modificare testi:</strong> Modifica l'oggetto <code className="bg-slate-800 px-2 py-1 rounded text-green-400">defaultLandingConfig</code> nel file JSX</span>
                    </p>
                  </div>
                </div>

                {/* Path Firestore */}
                <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <p className="text-sm text-slate-400 mb-2">Path Firestore per configurazione dinamica:</p>
                  <code className="text-purple-400 text-sm font-mono">
                    platform/settings/mainLanding
                  </code>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    💡 Tip: Usa il Page Builder nella sezione Admin per un editor visuale
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingMainLanding(false)}
                      className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                    >
                      Chiudi
                    </button>
                    <a
                      href="/landing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white font-semibold transition-all flex items-center gap-2"
                    >
                      <Eye size={18} />
                      Vedi Landing Live
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Styles */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
