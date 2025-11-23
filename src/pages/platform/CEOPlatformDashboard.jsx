// src/pages/platform/CEOPlatformDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, getDocs, where, doc, getDoc, orderBy, limit,
  updateDoc, deleteDoc, setDoc, serverTimestamp
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
  Bell, Moon, Sun, Menu, X, Server, Globe, Lock, Unlock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// === ANIMATED STARS BACKGROUND ===
const AnimatedStars = () => {
  useEffect(() => {
    const existingStars = document.querySelector('.platform-stars');
    if (existingStars) return;

    const container = document.createElement('div');
    container.className = 'platform-stars fixed inset-0 pointer-events-none z-0';
    document.body.appendChild(container);

    // Crea 50 stelle con effetto premium
    for (let i = 0; i < 50; i++) {
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
const Sidebar = ({ collapsed, setCollapsed, activePage, setActivePage, handleLogout }) => {
  const navItems = [
    { id: 'overview', icon: <Home size={20} />, label: 'Overview' },
    { id: 'tenants', icon: <Building2 size={20} />, label: 'Tenants' },
    { id: 'landing', icon: <Globe size={20} />, label: 'Landing Pages' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { id: 'users', icon: <Users size={20} />, label: 'Users' },
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
                <h1 className="text-lg font-bold text-white">FitFlow</h1>
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activePage === item.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0">
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
  const [loading, setLoading] = useState(true);
  const [isPlatformCEO, setIsPlatformCEO] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [platformStats, setPlatformStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    monthlyRecurring: 0,
    totalUsers: 0,
    totalClients: 0,
    newTenantsThisMonth: 0,
    avgUsersPerTenant: 0
  });

  const [tenants, setTenants] = useState([]);
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

      // Load tenants (solo metadati base)
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      
      // Carica stats in parallelo per tutti i tenant
      const tenantsData = await Promise.all(
        tenantsSnap.docs.map(async (tenantDoc) => {
          const tenantId = tenantDoc.id;
          const tenantData = tenantDoc.data();
          
          // Usa stats aggregate se esistono (per performance)
          if (tenantData.stats) {
            return {
              id: tenantId,
              name: tenantData.name || tenantId.replace('-', ' '),
              status: tenantData.status || 'active',
              users: tenantData.stats.totalUsers || 0,
              clients: tenantData.stats.totalClients || 0,
              revenue: tenantData.stats.totalRevenue?.toFixed(0) || '0',
              createdAt: tenantData.createdAt?.toDate() || new Date(),
              plan: tenantData.plan || 'premium',
              siteSlug: tenantData.siteSlug,
              customDomain: tenantData.customDomain,
              updatedAt: tenantData.updatedAt,
              ...tenantData
            };
          }
          
          // Fallback: conta documenti (più veloce di caricare tutto)
          const [usersSnap, clientsSnap] = await Promise.all([
            getDocs(query(collection(db, `tenants/${tenantId}/users`), limit(100))),
            getDocs(query(collection(db, `tenants/${tenantId}/clients`), limit(100)))
          ]);
          
          // Revenue stimato (evita di caricare tutti i payments)
          const estimatedRevenue = clientsSnap.size * 50; // ~50€ per cliente stimato

          return {
            id: tenantId,
            name: tenantData.name || tenantId.replace('-', ' '),
            status: tenantData.status || 'active',
            users: usersSnap.size,
            clients: clientsSnap.size,
            revenue: estimatedRevenue.toFixed(0),
            createdAt: tenantData.createdAt?.toDate() || new Date(),
            plan: tenantData.plan || 'premium',
            siteSlug: tenantData.siteSlug,
            customDomain: tenantData.customDomain,
            updatedAt: tenantData.updatedAt,
            ...tenantData
          };
        })
      );

      setTenants(tenantsData);

      // Calculate platform stats
      const totalUsers = tenantsData.reduce((sum, t) => sum + t.users, 0);
      const totalClients = tenantsData.reduce((sum, t) => sum + t.clients, 0);
      const totalRevenue = tenantsData.reduce((sum, t) => sum + parseFloat(t.revenue || 0), 0);
      const activeTenants = tenantsData.filter(t => t.status === 'active').length;

      setPlatformStats({
        totalTenants: tenantsData.length,
        activeTenants,
        totalRevenue,
        monthlyRecurring: totalRevenue * 0.1, // Simplified MRR
        totalUsers,
        totalClients,
        newTenantsThisMonth: tenantsData.filter(t => {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return t.createdAt > monthAgo;
        }).length,
        avgUsersPerTenant: tenantsData.length > 0 ? (totalUsers / tenantsData.length).toFixed(1) : 0
      });

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
          branding: { appName: tenant.name || 'FitFlow', logoUrl: '/logo192.PNG' },
          siteSlug: tenant.siteSlug || tenant.id,
          enabled: true
        }
      });
    } catch (error) {
      console.error('Error loading landing config:', error);
      alert('Errore nel caricamento della configurazione');
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
      await loadTenants();
      setEditingLanding(null);
      alert('✅ Landing page aggiornata con successo!');
    } catch (error) {
      console.error('Error saving landing:', error);
      alert('❌ Errore nel salvataggio');
    }
  };

  // Cambia status sito (pubblicato/bozza)
  const handleToggleStatus = async (tenant) => {
    try {
      const newStatus = tenant.status === 'active' ? 'draft' : 'active';
      await updateDoc(doc(db, 'tenants', tenant.id), { status: newStatus });
      await loadTenants();
      alert(`✅ Sito ${newStatus === 'active' ? 'pubblicato' : 'messo in bozza'}!`);
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('❌ Errore nel cambio di status');
    }
  };

  // Elimina tenant
  const handleDeleteTenant = async (tenant) => {
    if (!confirm(`⚠️ Sei sicuro di voler eliminare il tenant "${tenant.name || tenant.id}"? Questa azione è irreversibile!`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'tenants', tenant.id));
      await loadTenants();
      alert('✅ Tenant eliminato con successo');
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('❌ Errore nell\'eliminazione del tenant');
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
      alert('Errore nel caricamento del branding');
    }
  };

  // Salva branding
  const handleSaveBranding = async () => {
    try {
      const { tenantId, config } = editingBranding;
      await setDoc(doc(db, 'tenants', tenantId, 'settings', 'branding'), config, { merge: true });
      setEditingBranding(null);
      alert('✅ Branding aggiornato con successo!');
    } catch (error) {
      console.error('Error saving branding:', error);
      alert('❌ Errore nel salvataggio del branding');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Trigger aggregazione Cloud Function
      const triggerStatsAggregation = httpsCallable(functions, 'triggerStatsAggregation');
      console.log('🔄 Triggering stats aggregation...');
      
      const result = await triggerStatsAggregation();
      console.log('✅ Stats aggregated:', result.data);
      
      // Ricarica i dati aggiornati
      await loadPlatformData();
      
      alert('✅ Statistiche aggiornate con successo!');
    } catch (error) {
      console.error('❌ Errore refresh stats:', error);
      alert('⚠️ Errore durante l\'aggiornamento. Ricarico comunque i dati...');
      loadPlatformData();
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-80'}`}>
        
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                FitFlow Platform Dashboard
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
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Tenants"
                  value={platformStats.totalTenants}
                  subtitle={`${platformStats.newTenantsThisMonth} new this month`}
                  icon={<Building2 />}
                  color="purple"
                  trend={12}
                />
                <StatCard
                  title="Active Tenants"
                  value={platformStats.activeTenants}
                  subtitle={`${platformStats.totalTenants > 0 ? ((platformStats.activeTenants / platformStats.totalTenants) * 100).toFixed(0) : 0}% active`}
                  icon={<Activity />}
                  color="green"
                  trend={5}
                />
                <StatCard
                  title="Total Revenue"
                  value={`€${platformStats.totalRevenue.toFixed(0)}`}
                  subtitle={`€${platformStats.monthlyRecurring.toFixed(0)} MRR`}
                  icon={<DollarSign />}
                  color="yellow"
                  trend={18}
                />
                <StatCard
                  title="Platform Users"
                  value={platformStats.totalUsers}
                  subtitle={`${platformStats.avgUsersPerTenant} avg per tenant`}
                  icon={<Users />}
                  color="blue"
                  trend={8}
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center gap-2">
                    <UserPlus className="w-6 h-6 text-purple-400" />
                    <span className="text-sm text-slate-300">Add Tenant</span>
                  </button>
                  <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center gap-2">
                    <Database className="w-6 h-6 text-blue-400" />
                    <span className="text-sm text-slate-300">Backup DB</span>
                  </button>
                  <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center gap-2">
                    <Shield className="w-6 h-6 text-green-400" />
                    <span className="text-sm text-slate-300">Security</span>
                  </button>
                  <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center gap-2">
                    <Download className="w-6 h-6 text-yellow-400" />
                    <span className="text-sm text-slate-300">Export Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tenants Page */}
          {activePage === 'tenants' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tenants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2">
                    <Filter size={18} />
                    Filter
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

          {/* Landing Pages Management */}
          {activePage === 'landing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Globe className="w-8 h-8 text-purple-500" />
                  Landing Pages Management
                </h2>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Globe className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{tenants.length}</p>
                  <p className="text-sm text-slate-400">Landing Pages Attive</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">~2.5K</p>
                  <p className="text-sm text-slate-400">Visite Totali (stimate)</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-green-600/20 to-green-900/20 p-6 rounded-xl border border-green-500/30 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{tenants.filter(t => t.status === 'active').length}</p>
                  <p className="text-sm text-slate-400">Siti Pubblicati</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 p-6 rounded-xl border border-yellow-500/30 backdrop-blur-sm"
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
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
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
                                onClick={() => handleEditLanding(tenant)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                                title="Modifica Landing"
                              >
                                <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
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
              <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">Platform Analytics</h2>
                <p className="text-slate-400">Advanced analytics coming soon...</p>
              </div>
            </div>
          )}

          {/* Users Page */}
          {activePage === 'users' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">Platform Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-2xl font-bold text-white mb-1">{platformStats.totalUsers}</p>
                    <p className="text-sm text-slate-400">Total Users</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-2xl font-bold text-white mb-1">{platformStats.totalClients}</p>
                    <p className="text-sm text-slate-400">Total Clients</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-2xl font-bold text-white mb-1">{platformStats.avgUsersPerTenant}</p>
                    <p className="text-sm text-slate-400">Avg Users/Tenant</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Page */}
          {activePage === 'database' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6 text-blue-400" />
                  Database Management
                </h2>
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
              </div>
            </div>
          )}

          {/* Settings Page */}
          {activePage === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">Platform Settings</h2>
                <p className="text-slate-400">Configuration options coming soon...</p>
              </div>
            </div>
          )}

        </div>
      </div>

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
                      placeholder="/logo192.PNG"
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Salva Modifiche
                </button>
                <button
                  onClick={() => setEditingLanding(null)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-white font-medium transition-all"
                >
                  Salva Branding
                </button>
                <button
                  onClick={() => setEditingBranding(null)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tenant Details Modal */}
      <AnimatePresence>
        {selectedTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTenant(null)}
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
                  <h2 className="text-2xl font-bold text-white">{selectedTenant.name}</h2>
                  <p className="text-slate-400">{selectedTenant.id}</p>
                </div>
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Total Users</p>
                    <p className="text-2xl font-bold text-white">{selectedTenant.users}</p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Total Clients</p>
                    <p className="text-2xl font-bold text-white">{selectedTenant.clients}</p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-white">€{selectedTenant.revenue}</p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Status</p>
                    <p className="text-2xl font-bold text-white capitalize">{selectedTenant.status}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                    Manage Tenant
                  </button>
                  <button className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors">
                    View Analytics
                  </button>
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
