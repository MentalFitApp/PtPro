// src/pages/platform/CEOPlatformDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, query, getDocs, where, doc, getDoc, orderBy, limit,
  updateDoc, deleteDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { signOut } from 'firebase/auth';
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

      // Load tenants
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const tenantsData = [];

      for (const tenantDoc of tenantsSnap.docs) {
        const tenantId = tenantDoc.id;
        
        // Load tenant stats
        const usersSnap = await getDocs(collection(db, `tenants/${tenantId}/users`));
        const clientsSnap = await getDocs(collection(db, `tenants/${tenantId}/clients`));
        
        // Calculate revenue (simplified)
        let revenue = 0;
        for (const clientDoc of clientsSnap.docs) {
          const paymentsSnap = await getDocs(collection(db, `tenants/${tenantId}/clients/${clientDoc.id}/payments`));
          paymentsSnap.docs.forEach(payDoc => {
            revenue += payDoc.data().amount || 0;
          });
        }

        tenantsData.push({
          id: tenantId,
          name: tenantDoc.data().name || tenantId.replace('-', ' '),
          status: tenantDoc.data().status || 'active',
          users: usersSnap.size,
          clients: clientsSnap.size,
          revenue: revenue.toFixed(0),
          createdAt: tenantDoc.data().createdAt?.toDate() || new Date(),
          plan: tenantDoc.data().plan || 'premium',
          ...tenantDoc.data()
        });
      }

      setTenants(tenantsData);

      // Calculate platform stats
      const totalUsers = tenantsData.reduce((sum, t) => sum + t.users, 0);
      const totalClients = tenantsData.reduce((sum, t) => sum + t.clients, 0);
      const totalRevenue = tenantsData.reduce((sum, t) => sum + parseFloat(t.revenue), 0);
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
      console.error('Error logging out:', error);
    }
  };

  const handleRefresh = () => {
    loadPlatformData();
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
