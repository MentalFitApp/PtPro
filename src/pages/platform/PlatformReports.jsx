import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Calendar, Filter, TrendingUp, 
  DollarSign, Users, Building2, Target, Award,
  BarChart3, PieChart, Activity, Clock, Mail,
  FileText, Send, CheckCircle, AlertTriangle
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

export default function PlatformReports() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduledReports, setScheduledReports] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    loadReportData();
    loadScheduledReports();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const tenantsData = await Promise.all(
        tenantsSnap.docs.map(async (tenantDoc) => {
          const tenantId = tenantDoc.id;
          const tenantData = tenantDoc.data();
          
          // Load users count
          const usersSnap = await getDocs(collection(db, `tenants/${tenantId}/users`));
          const clientsSnap = await getDocs(collection(db, `tenants/${tenantId}/clients`));
          
          return {
            id: tenantId,
            ...tenantData,
            usersCount: usersSnap.size,
            clientsCount: clientsSnap.size,
            createdDate: tenantData.createdAt?.toDate() || new Date()
          };
        })
      );
      
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledReports = async () => {
    try {
      const reportsSnap = await getDocs(collection(db, 'scheduled_reports'));
      const reportsData = reportsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setScheduledReports(reportsData);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
    }
  };

  // Computed statistics
  const stats = useMemo(() => {
    const now = new Date();
    const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    const recentTenants = tenants.filter(t => t.createdDate > cutoffDate);
    const activeTenants = tenants.filter(t => t.status === 'active');
    const totalRevenue = tenants.reduce((sum, t) => sum + (t.cachedRevenue || 0), 0);
    const avgRevenuePerTenant = tenants.length > 0 ? totalRevenue / tenants.length : 0;
    
    // Subscription distribution
    const subscriptionDist = tenants.reduce((acc, t) => {
      acc[t.subscription] = (acc[t.subscription] || 0) + 1;
      return acc;
    }, {});
    
    // Growth rate
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const lastMonth = tenants.filter(t => t.createdDate > oneMonthAgo && t.createdDate <= now).length;
    const prevMonth = tenants.filter(t => t.createdDate > twoMonthsAgo && t.createdDate <= oneMonthAgo).length;
    const growthRate = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth * 100).toFixed(1) : 0;
    
    // Churn analysis
    const inactiveTenants = tenants.filter(t => t.status !== 'active').length;
    const churnRate = tenants.length > 0 ? (inactiveTenants / tenants.length * 100).toFixed(1) : 0;
    
    // LTV calculation
    const avgLifetimeMonths = 12; // Assumption
    const ltv = avgRevenuePerTenant * avgLifetimeMonths;
    
    return {
      totalTenants: tenants.length,
      activeTenants: activeTenants.length,
      newTenants: recentTenants.length,
      totalRevenue,
      avgRevenuePerTenant,
      subscriptionDist,
      growthRate,
      churnRate,
      ltv,
      totalUsers: tenants.reduce((sum, t) => sum + (t.usersCount || 0), 0),
      totalClients: tenants.reduce((sum, t) => sum + (t.clientsCount || 0), 0)
    };
  }, [tenants, dateRange]);

  // Cohort analysis
  const cohortData = useMemo(() => {
    const cohorts = {};
    
    tenants.forEach(t => {
      const cohortMonth = t.createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = {
          total: 0,
          active: 0,
          revenue: 0,
          avgUsers: 0
        };
      }
      
      cohorts[cohortMonth].total++;
      if (t.status === 'active') cohorts[cohortMonth].active++;
      cohorts[cohortMonth].revenue += t.cachedRevenue || 0;
      cohorts[cohortMonth].avgUsers += t.usersCount || 0;
    });
    
    // Calculate averages
    Object.keys(cohorts).forEach(month => {
      cohorts[month].avgUsers = cohorts[month].total > 0 
        ? Math.round(cohorts[month].avgUsers / cohorts[month].total)
        : 0;
      cohorts[month].retention = cohorts[month].total > 0
        ? ((cohorts[month].active / cohorts[month].total) * 100).toFixed(1)
        : 0;
    });
    
    return Object.entries(cohorts).slice(-12).reverse();
  }, [tenants]);

  // Performance comparison
  const topPerformers = useMemo(() => {
    return [...tenants]
      .sort((a, b) => (b.cachedRevenue || 0) - (a.cachedRevenue || 0))
      .slice(0, 10);
  }, [tenants]);

  const atRiskTenants = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return tenants.filter(t => {
      const lastActivity = t.lastActivity?.toDate() || new Date(0);
      const daysSinceActive = (now - lastActivity) / (1000 * 60 * 60 * 24);
      return daysSinceActive > 30 || t.status === 'trial' || (t.usersCount || 0) < 2;
    }).slice(0, 10);
  }, [tenants]);

  // Chart data
  const growthChartData = useMemo(() => {
    const last12Months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const count = tenants.filter(t => {
        const createdMonth = new Date(t.createdDate.getFullYear(), t.createdDate.getMonth(), 1);
        return createdMonth.getTime() === date.getTime();
      }).length;
      
      last12Months.push({ month: monthStr, count });
    }
    
    return {
      labels: last12Months.map(m => m.month),
      datasets: [{
        label: 'New Tenants',
        data: last12Months.map(m => m.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }, [tenants]);

  const revenueChartData = useMemo(() => {
    const revenueByPlan = Object.entries(stats.subscriptionDist).map(([plan, count]) => {
      const planPrices = {
        free: 0,
        starter: 29,
        professional: 79,
        enterprise: 199
      };
      return {
        plan,
        revenue: count * (planPrices[plan] || 0)
      };
    });
    
    return {
      labels: revenueByPlan.map(r => r.plan.toUpperCase()),
      datasets: [{
        data: revenueByPlan.map(r => r.revenue),
        backgroundColor: [
          'rgba(148, 163, 184, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderWidth: 0
      }]
    };
  }, [stats.subscriptionDist]);

  const subscriptionDistData = useMemo(() => {
    return {
      labels: Object.keys(stats.subscriptionDist).map(s => s.toUpperCase()),
      datasets: [{
        data: Object.values(stats.subscriptionDist),
        backgroundColor: [
          'rgba(148, 163, 184, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderWidth: 0
      }]
    };
  }, [stats.subscriptionDist]);

  const handleExportReport = async () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      stats,
      cohortAnalysis: cohortData,
      topPerformers: topPerformers.map(t => ({
        id: t.id,
        name: t.name,
        revenue: t.cachedRevenue,
        users: t.usersCount
      })),
      atRiskTenants: atRiskTenants.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        lastActivity: t.lastActivity?.toDate().toISOString()
      })),
      allTenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        subscription: t.subscription,
        status: t.status,
        revenue: t.cachedRevenue,
        users: t.usersCount,
        clients: t.clientsCount,
        createdAt: t.createdDate.toISOString()
      }))
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform_report_${dateRange}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['Tenant ID', 'Name', 'Subscription', 'Status', 'Users', 'Clients', 'Revenue', 'Created At'];
    const rows = tenants.map(t => [
      t.id,
      t.name,
      t.subscription,
      t.status,
      t.usersCount || 0,
      t.clientsCount || 0,
      t.cachedRevenue || 0,
      t.createdDate.toISOString()
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform_report_${dateRange}_${Date.now()}.csv`;
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
          <p className="text-white text-lg">Generazione report...</p>
        </div>
      </div>
    );
  }

  const reportTypes = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'cohort', label: 'Cohort Analysis', icon: <Users size={18} /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp size={18} /> },
    { id: 'revenue', label: 'Revenue', icon: <DollarSign size={18} /> },
    { id: 'scheduled', label: 'Scheduled', icon: <Calendar size={18} /> }
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
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
              Platform Reports & Analytics
            </h1>
            <p className="text-slate-400">
              Comprehensive insights and predictive analytics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white preserve-white rounded-lg transition-colors"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
            
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white preserve-white rounded-lg transition-colors"
            >
              <Download size={18} />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {reportTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedReport(type.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              selectedReport === type.id
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {type.icon}
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={<Building2 className="text-blue-400" />}
              label="Total Tenants"
              value={stats.totalTenants}
              subtext={`${stats.activeTenants} active`}
            />
            <MetricCard
              icon={<TrendingUp className="text-green-400" />}
              label="Growth Rate"
              value={`${stats.growthRate}%`}
              subtext={`${stats.newTenants} new this period`}
            />
            <MetricCard
              icon={<DollarSign className="text-yellow-400" />}
              label="Total Revenue"
              value={`€${stats.totalRevenue.toLocaleString()}`}
              subtext={`€${stats.avgRevenuePerTenant.toFixed(0)} avg/tenant`}
            />
            <MetricCard
              icon={<AlertTriangle className="text-red-400" />}
              label="Churn Rate"
              value={`${stats.churnRate}%`}
              subtext={`${atRiskTenants.length} at risk`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">Tenant Growth (12 Months)</h3>
              <Line 
                data={growthChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
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
              <h3 className="text-xl font-bold text-white mb-4">Subscription Distribution</h3>
              <Doughnut 
                data={subscriptionDistData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#94a3b8' }
                    }
                  }
                }}
                height={300}
              />
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} icon={<Users className="text-blue-400" />} />
            <StatCard label="Total Clients" value={stats.totalClients.toLocaleString()} icon={<Target className="text-green-400" />} />
            <StatCard label="Avg LTV" value={`€${stats.ltv.toFixed(0)}`} icon={<Award className="text-purple-400" />} />
          </div>
        </motion.div>
      )}

      {selectedReport === 'cohort' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Cohort Analysis by Month</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Cohort</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Retention</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Avg Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {cohortData.map(([month, data]) => (
                    <tr key={month} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-white font-medium">{month}</td>
                      <td className="px-4 py-3 text-slate-400">{data.total}</td>
                      <td className="px-4 py-3 text-green-400">{data.active}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          parseFloat(data.retention) > 80 ? 'bg-green-500/20 text-green-400' :
                          parseFloat(data.retention) > 60 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {data.retention}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">€{data.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-400">{data.avgUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {selectedReport === 'performance' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="text-yellow-400" />
                Top 10 Performers
              </h3>
              <div className="space-y-2">
                {topPerformers.map((tenant, idx) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-400 font-bold text-lg">#{idx + 1}</span>
                      <div>
                        <p className="text-white font-medium">{tenant.name}</p>
                        <p className="text-xs text-slate-400">{tenant.usersCount || 0} users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">€{(tenant.cachedRevenue || 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{tenant.subscription}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* At Risk Tenants */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400" />
                At Risk Tenants
              </h3>
              <div className="space-y-2">
                {atRiskTenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{tenant.name}</p>
                      <p className="text-xs text-slate-400">
                        Last active: {tenant.lastActivity?.toDate().toLocaleDateString('it-IT') || 'Never'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        tenant.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tenant.status}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{tenant.usersCount || 0} users</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {selectedReport === 'revenue' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              icon={<DollarSign className="text-green-400" />}
              label="Total MRR"
              value={`€${stats.totalRevenue.toLocaleString()}`}
            />
            <MetricCard
              icon={<TrendingUp className="text-blue-400" />}
              label="Avg Revenue/Tenant"
              value={`€${stats.avgRevenuePerTenant.toFixed(0)}`}
            />
            <MetricCard
              icon={<Award className="text-purple-400" />}
              label="Lifetime Value"
              value={`€${stats.ltv.toFixed(0)}`}
            />
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Revenue by Subscription Plan</h3>
            <Bar 
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
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
              height={400}
            />
          </div>
        </motion.div>
      )}

      {selectedReport === 'scheduled' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Scheduled Reports</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white preserve-white rounded-lg transition-colors"
            >
              <Calendar size={18} />
              <span>Schedule New Report</span>
            </button>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            {scheduledReports.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No scheduled reports yet</p>
                <p className="text-sm text-slate-500 mt-2">Create automated reports sent to your email</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="text-blue-400" size={24} />
                      <div>
                        <p className="text-white font-medium">{report.name}</p>
                        <p className="text-sm text-slate-400">
                          {report.frequency} • {report.recipients?.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        report.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {report.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const MetricCard = ({ icon, label, value, subtext }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
    <div className="flex items-center justify-between mb-3">
      <div className="p-3 bg-slate-800/50 rounded-lg">
        {icon}
      </div>
    </div>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-slate-400">{label}</p>
    {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
  </div>
);

const StatCard = ({ label, value, icon }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
    <div className="flex items-center gap-4">
      <div className="p-4 bg-slate-800/50 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  </div>
);
