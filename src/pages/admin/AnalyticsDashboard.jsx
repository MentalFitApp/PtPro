// src/pages/admin/AnalyticsDashboard.jsx
// Dashboard Analytics completa con statistiche dettagliate

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePageInfo } from '../../contexts/PageContext';
import {
  StatsGrid,
  AlertBanner,
  UnreadChecksWidget,
  WeeklyCheckChart,
  ActivityTimeline,
  QuickSummary,
  StatCard
} from '../../components/dashboard/AnalyticsWidgets';
import {
  RefreshCw, Calendar, TrendingUp, Users, ClipboardCheck,
  AlertTriangle, Activity, BarChart3, Download, Filter,
  ChevronDown, Clock, Target, Zap
} from 'lucide-react';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';

// Time range selector
const TIME_RANGES = [
  { id: 'week', label: 'Settimana' },
  { id: 'month', label: 'Mese' },
  { id: 'quarter', label: 'Trimestre' },
];

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('week');
  
  useDocumentTitle('Analytics');
  usePageInfo({
    pageTitle: 'Analytics',
    pageSubtitle: 'Statistiche e metriche della tua attività'
  });
  
  const {
    loading,
    error,
    lastUpdated,
    refresh,
    clientStats,
    checkStats,
    alertClients,
    unreadChecks,
    recentActivity
  } = useAnalytics();
  
  // Calcolo KPI aggiuntivi
  const kpis = useMemo(() => {
    if (!clientStats || !checkStats) return null;
    
    const responseRate = clientStats.active > 0 
      ? Math.round((checkStats.thisWeek / clientStats.active) * 100) 
      : 0;
    
    const retentionRate = clientStats.total > 0 
      ? Math.round(((clientStats.total - clientStats.expired) / clientStats.total) * 100)
      : 100;
    
    const growthRate = clientStats.newThisMonth;
    
    return {
      responseRate,
      retentionRate,
      growthRate,
      avgChecksPerClient: clientStats.active > 0 
        ? (checkStats.thisWeek / clientStats.active).toFixed(1)
        : 0
    };
  }, [clientStats, checkStats]);
  
  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-32" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Errore caricamento dati</h3>
          <p className="text-slate-400 mb-4">{error.message}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400">
            Ultimo aggiornamento: {lastUpdated?.toLocaleTimeString('it-IT')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-slate-800/40 backdrop-blur-sm rounded-xl p-1">
            {TIME_RANGES.map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  timeRange === range.id
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          {/* Refresh */}
          <button
            onClick={refresh}
            className="p-2 rounded-xl bg-slate-800/40 backdrop-blur-sm text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors border border-slate-700/40"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      
      {/* Main Stats Grid */}
      <StatsGrid clientStats={clientStats} checkStats={checkStats} />
      
      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Tasso Risposta"
            value={`${kpis.responseRate}%`}
            subtitle="Check / clienti attivi"
            icon={Target}
            color="purple"
          />
          <StatCard
            title="Retention"
            value={`${kpis.retentionRate}%`}
            subtitle="Clienti non scaduti"
            icon={Users}
            color={kpis.retentionRate >= 80 ? 'emerald' : kpis.retentionRate >= 60 ? 'amber' : 'rose'}
          />
          <StatCard
            title="Crescita"
            value={`+${kpis.growthRate}`}
            subtitle="Nuovi clienti (mese)"
            icon={TrendingUp}
            color="sky"
          />
          <StatCard
            title="Media Check"
            value={kpis.avgChecksPerClient}
            subtitle="Per cliente / settimana"
            icon={ClipboardCheck}
            color="blue"
          />
        </div>
      )}
      
      {/* Alert Section */}
      {alertClients && alertClients.length > 0 && (
        <AlertBanner alerts={alertClients} maxShow={5} />
      )}
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Weekly Chart */}
          <WeeklyCheckChart data={checkStats?.dailyChecks} />
          
          {/* Quick Summary */}
          <QuickSummary clientStats={clientStats} checkStats={checkStats} />
          
          {/* Client Distribution - Placeholder for future */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/30 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Distribuzione Clienti</h3>
                <p className="text-xs text-slate-400">Per stato abbonamento</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Active */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Attivi</span>
                    <span className="text-white font-medium">{clientStats.active}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(clientStats.active / Math.max(clientStats.total, 1)) * 100}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Expiring */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">In Scadenza</span>
                    <span className="text-white font-medium">{clientStats.expiringSoon}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(clientStats.expiringSoon / Math.max(clientStats.total, 1)) * 100}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Expired */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Scaduti</span>
                    <span className="text-white font-medium">{clientStats.expired}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(clientStats.expired / Math.max(clientStats.total, 1)) * 100}%` }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Lists */}
        <div className="space-y-4 sm:space-y-6">
          {/* Unread Checks */}
          <UnreadChecksWidget 
            checks={unreadChecks} 
            onViewAll={() => navigate('/admin/clients')}
          />
          
          {/* Activity Timeline */}
          <ActivityTimeline activities={recentActivity} maxShow={10} />
        </div>
      </div>
      
      {/* Footer Stats */}
      <div className="rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-slate-700/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">Totale Clienti:</span>
              <span className="text-white font-medium ml-2">{clientStats.total}</span>
            </div>
            <div>
              <span className="text-slate-400">Check Totali (30gg):</span>
              <span className="text-white font-medium ml-2">{checkStats.total}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={14} />
            <span>Dati aggiornati in tempo reale</span>
          </div>
        </div>
      </div>
    </div>
  );
}
