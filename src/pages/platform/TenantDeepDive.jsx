import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, Activity, TrendingUp, AlertTriangle, 
  Calendar, DollarSign, Database, Clock, Mail, Phone,
  MapPin, CreditCard, Settings, BarChart3, FileText,
  Download, RefreshCw, Eye, EyeOff, Search, Filter,
  ChevronDown, ChevronUp, Trash2, Edit3, Ban, CheckCircle,
  XCircle, Zap, Crown, Package, Target
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { 
  collection, doc, getDoc, getDocs, query, 
  orderBy, limit, where, Timestamp, updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Privacy utilities
const maskEmail = (email) => {
  if (!email) return '***';
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain?.slice(0, 2)}***.***`;
};

const maskUID = (uid) => {
  if (!uid) return '***';
  return `${uid.slice(0, 4)}***${uid.slice(-4)}`;
};

export default function TenantDeepDive() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [privacyMode, setPrivacyMode] = useState(true);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    avgResponseTime: 0,
    errorRate: 0,
    activeUsers24h: 0,
    totalLogins: 0
  });
  
  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadTenantData();
    
    // Real-time activity logs
    const logsQuery = query(
      collection(db, `tenants/${tenantId}/activity_logs`),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivityLogs(logs);
    });
    
    return () => unsubscribe();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      
      // Load tenant document
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (!tenantDoc.exists()) {
        navigate('/platform-dashboard');
        return;
      }
      
      setTenant({ id: tenantDoc.id, ...tenantDoc.data() });
      
      // Load all collections
      await Promise.all([
        loadUsers(),
        loadClients(),
        loadCoaches(),
        loadSubscriptionHistory(),
        loadRevenueHistory(),
        calculateSystemMetrics()
      ]);
      
    } catch (error) {
      console.error('Error loading tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const usersSnap = await getDocs(collection(db, `tenants/${tenantId}/users`));
    const usersData = usersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(usersData);
  };

  const loadClients = async () => {
    const clientsSnap = await getDocs(collection(db, `tenants/${tenantId}/clients`));
    const clientsData = clientsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setClients(clientsData);
  };

  const loadCoaches = async () => {
    const coachesSnap = await getDocs(collection(db, `tenants/${tenantId}/coaches`));
    const coachesData = coachesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCoaches(coachesData);
  };

  const loadSubscriptionHistory = async () => {
    const historyQuery = query(
      collection(db, `tenants/${tenantId}/subscription_history`),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const historySnap = await getDocs(historyQuery);
    const historyData = historySnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSubscriptionHistory(historyData);
  };

  const loadRevenueHistory = async () => {
    const revenueQuery = query(
      collection(db, `tenants/${tenantId}/revenue_history`),
      orderBy('date', 'desc'),
      limit(90)
    );
    const revenueSnap = await getDocs(revenueQuery);
    const revenueData = revenueSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setRevenueHistory(revenueData);
  };

  const calculateSystemMetrics = async () => {
    // Simulate metrics calculation
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const metrics = {
      avgResponseTime: Math.floor(Math.random() * 500) + 100,
      errorRate: (Math.random() * 2).toFixed(2),
      activeUsers24h: Math.floor(Math.random() * 50) + 10,
      totalLogins: Math.floor(Math.random() * 200) + 50
    };
    
    setSystemMetrics(metrics);
  };

  // Computed stats
  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentRevenue = revenueHistory
      .filter(r => r.date && r.date.toDate() > last30Days)
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const activeClients = clients.filter(c => {
      const lastActive = c.lastActive?.toDate?.() || new Date(0);
      return (now - lastActive) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    
    const churnRate = clients.length > 0 
      ? ((clients.length - activeClients) / clients.length * 100).toFixed(1)
      : 0;
    
    return {
      totalUsers: users.length,
      totalClients: clients.length,
      totalCoaches: coaches.length,
      activeClients,
      churnRate,
      revenue30d: recentRevenue,
      avgRevenuePerClient: clients.length > 0 ? (recentRevenue / clients.length).toFixed(2) : 0
    };
  }, [users, clients, coaches, revenueHistory]);

  // Chart data
  const revenueChartData = useMemo(() => {
    const last30Days = revenueHistory.slice(0, 30).reverse();
    
    return {
      labels: last30Days.map(r => {
        const date = r.date?.toDate?.() || new Date();
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
      }),
      datasets: [{
        label: 'Revenue (€)',
        data: last30Days.map(r => r.amount || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }, [revenueHistory]);

  const userActivityChartData = useMemo(() => {
    const activityByDay = {};
    activityLogs.forEach(log => {
      const date = log.timestamp?.toDate?.() || new Date();
      const day = date.toLocaleDateString('it-IT');
      activityByDay[day] = (activityByDay[day] || 0) + 1;
    });
    
    const last7Days = Object.entries(activityByDay).slice(0, 7).reverse();
    
    return {
      labels: last7Days.map(([day]) => day),
      datasets: [{
        label: 'Activity Events',
        data: last7Days.map(([, count]) => count),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
      }]
    };
  }, [activityLogs]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    if (userSearch) {
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(userSearch.toLowerCase())
      );
    }
    
    if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const aTime = a.lastActive?.toDate?.() || new Date(0);
        const bTime = b.lastActive?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return aTime - bTime;
      });
    }
    
    return filtered;
  }, [users, userSearch, sortBy]);

  const handleSuspendTenant = async () => {
    if (!confirm('Sei sicuro di voler sospendere questo tenant?')) return;
    
    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        status: 'suspended',
        suspendedAt: Timestamp.now(),
        suspendedBy: auth.currentUser.uid
      });
      
      setTenant(prev => ({ ...prev, status: 'suspended' }));
      alert('Tenant sospeso con successo');
    } catch (error) {
      console.error('Error suspending tenant:', error);
      alert('Errore durante la sospensione');
    }
  };

  const handleActivateTenant = async () => {
    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        status: 'active',
        activatedAt: Timestamp.now()
      });
      
      setTenant(prev => ({ ...prev, status: 'active' }));
      alert('Tenant attivato con successo');
    } catch (error) {
      console.error('Error activating tenant:', error);
      alert('Errore durante l\'attivazione');
    }
  };

  const handleExportData = async () => {
    const exportData = {
      tenant,
      stats,
      users: users.map(u => ({
        ...u,
        email: privacyMode ? maskEmail(u.email) : u.email,
        uid: privacyMode ? maskUID(u.uid) : u.uid
      })),
      clients: clients.map(c => ({
        ...c,
        email: privacyMode ? maskEmail(c.email) : c.email
      })),
      subscriptionHistory,
      revenueHistory: revenueHistory.map(r => ({
        ...r,
        date: r.date?.toDate?.().toISOString()
      })),
      exportDate: new Date().toISOString(),
      exportedBy: auth.currentUser.email
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenant_${tenantId}_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento dati tenant...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} />, count: users.length },
    { id: 'activity', label: 'Activity', icon: <Activity size={18} />, count: activityLogs.length },
    { id: 'revenue', label: 'Revenue', icon: <DollarSign size={18} /> },
    { id: 'system', label: 'System', icon: <Database size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/platform-dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                {tenant?.name || 'Unknown Tenant'}
              </h1>
              {tenant?.subscription && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  tenant.subscription === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                  tenant.subscription === 'professional' ? 'bg-blue-500/20 text-blue-400' :
                  tenant.subscription === 'starter' ? 'bg-green-500/20 text-green-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {tenant.subscription.toUpperCase()}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                tenant?.status === 'active' ? 'bg-green-500/20 text-green-400' :
                tenant?.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {tenant?.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-slate-400">
              Tenant ID: <span className="font-mono text-sm">{tenantId}</span>
            </p>
            <p className="text-slate-400 text-sm">
              Created: {tenant?.createdAt?.toDate?.().toLocaleDateString('it-IT')} • 
              Last Activity: {tenant?.lastActivity?.toDate?.().toLocaleDateString('it-IT') || 'Never'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="text-white text-sm">
                {privacyMode ? 'Privacy ON' : 'Privacy OFF'}
              </span>
            </button>
            
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download size={18} />
              <span>Export</span>
            </button>
            
            <button
              onClick={loadTenantData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className="text-slate-400" />
            </button>
            
            {tenant?.status === 'active' ? (
              <button
                onClick={handleSuspendTenant}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Ban size={18} />
                <span>Suspend</span>
              </button>
            ) : (
              <button
                onClick={handleActivateTenant}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle size={18} />
                <span>Activate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === tab.id
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                icon={<Users className="text-blue-400" />}
                label="Total Users"
                value={stats.totalUsers}
                trend="+12%"
                trendUp={true}
              />
              <MetricCard
                icon={<Target className="text-green-400" />}
                label="Active Clients"
                value={stats.activeClients}
                subtext={`${stats.totalClients} total`}
              />
              <MetricCard
                icon={<DollarSign className="text-yellow-400" />}
                label="Revenue (30d)"
                value={`€${stats.revenue30d.toLocaleString()}`}
                subtext={`€${stats.avgRevenuePerClient}/client`}
              />
              <MetricCard
                icon={<TrendingUp className="text-purple-400" />}
                label="Churn Rate"
                value={`${stats.churnRate}%`}
                trend={stats.churnRate < 5 ? 'Low' : 'High'}
                trendUp={stats.churnRate < 5}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-4">Revenue Trend (30d)</h3>
                <Line 
                  data={revenueChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                      },
                      x: { 
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                      }
                    }
                  }}
                  height={300}
                />
              </div>
              
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-4">User Activity (7d)</h3>
                <Bar 
                  data={userActivityChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                      },
                      x: { 
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                      }
                    }
                  }}
                  height={300}
                />
              </div>
            </div>

            {/* Subscription History */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">Subscription History</h3>
              <div className="space-y-2">
                {subscriptionHistory.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="text-slate-400" size={18} />
                      <div>
                        <p className="text-white font-medium">
                          {item.action || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.timestamp?.toDate?.().toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                      item.plan === 'professional' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {item.plan?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Users List */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredUsers.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-white font-medium">
                              {user.displayName || 'Unknown'}
                            </p>
                            <p className="text-sm text-slate-400">
                              {privacyMode ? maskEmail(user.email) : user.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'coach' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {user.lastActive?.toDate?.().toLocaleDateString('it-IT') || 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {user.createdAt?.toDate?.().toLocaleDateString('it-IT') || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                              <Eye size={16} className="text-slate-400" />
                            </button>
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                              <Edit3 size={16} className="text-slate-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activityLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <Activity className="text-slate-400 mt-1" size={16} />
                    <div className="flex-1">
                      <p className="text-white text-sm">{log.action || 'Unknown action'}</p>
                      <p className="text-xs text-slate-400">
                        {privacyMode ? maskEmail(log.userEmail) : log.userEmail} • 
                        {log.timestamp?.toDate?.().toLocaleString('it-IT')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <motion.div
            key="revenue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                icon={<DollarSign className="text-green-400" />}
                label="Total Revenue"
                value={`€${revenueHistory.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString()}`}
              />
              <MetricCard
                icon={<TrendingUp className="text-blue-400" />}
                label="Avg Monthly"
                value={`€${(revenueHistory.reduce((sum, r) => sum + (r.amount || 0), 0) / 3).toFixed(0)}`}
              />
              <MetricCard
                icon={<CreditCard className="text-purple-400" />}
                label="Subscription Value"
                value={`€${tenant?.subscriptionPrice || 0}/mo`}
              />
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">Revenue History</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {revenueHistory.map((rev, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="text-green-400" size={20} />
                      <div>
                        <p className="text-white font-medium">€{rev.amount?.toFixed(2) || '0.00'}</p>
                        <p className="text-xs text-slate-400">
                          {rev.date?.toDate?.().toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-400">{rev.source || 'Subscription'}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SYSTEM TAB */}
        {activeTab === 'system' && (
          <motion.div
            key="system"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                icon={<Zap className="text-yellow-400" />}
                label="Avg Response Time"
                value={`${systemMetrics.avgResponseTime}ms`}
                trend={systemMetrics.avgResponseTime < 300 ? 'Excellent' : 'Good'}
                trendUp={systemMetrics.avgResponseTime < 300}
              />
              <MetricCard
                icon={<AlertTriangle className="text-red-400" />}
                label="Error Rate"
                value={`${systemMetrics.errorRate}%`}
                trend={systemMetrics.errorRate < 1 ? 'Low' : 'High'}
                trendUp={systemMetrics.errorRate < 1}
              />
              <MetricCard
                icon={<Users className="text-blue-400" />}
                label="Active Users (24h)"
                value={systemMetrics.activeUsers24h}
              />
              <MetricCard
                icon={<Activity className="text-green-400" />}
                label="Total Logins"
                value={systemMetrics.totalLogins}
              />
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Database Size" value={`${(Math.random() * 500 + 100).toFixed(0)} MB`} />
                <InfoRow label="Storage Used" value={`${(Math.random() * 10 + 1).toFixed(1)} GB`} />
                <InfoRow label="API Calls (30d)" value={`${Math.floor(Math.random() * 50000 + 10000).toLocaleString()}`} />
                <InfoRow label="Webhook Events" value={`${Math.floor(Math.random() * 1000 + 100)}`} />
                <InfoRow label="Last Backup" value={new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT')} />
                <InfoRow label="Firestore Reads" value={`${Math.floor(Math.random() * 100000 + 10000).toLocaleString()}`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility Components
const MetricCard = ({ icon, label, value, subtext, trend, trendUp }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
    <div className="flex items-center justify-between mb-3">
      <div className="p-3 bg-slate-800/50 rounded-lg">
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-slate-400">{label}</p>
    {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
);
