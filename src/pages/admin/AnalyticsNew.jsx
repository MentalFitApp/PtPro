/**
 * Analytics.jsx - Versione 2.0
 * 
 * Dashboard Analytics completamente rifatta:
 * - Utilizza dati pre-aggregati dal Cloud Function
 * - Design moderno con alert actionable
 * - Caricamento istantaneo
 * - Trend e sparkline charts
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, toDate } from '../../firebase';
import { getTenantCollection, getTenantId, getTenantSubcollection, getTenantDoc } from '../../config/tenant';
import { getDocs, query, where, orderBy, limit, onSnapshot, doc, getDoc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  RefreshCw, Calendar, Users, DollarSign, Activity,
  AlertTriangle, BarChart3, ArrowLeft, Clock, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAnalyticsData, useAnalyticsHistory } from '../../hooks/useAnalyticsData';
import {
  StatCard,
  RevenueCard,
  ClientsCard,
  EngagementCard,
  AlertsPanel,
  SparklineChart,
  AnalyticsSkeleton
} from '../../components/analytics/AnalyticsComponents';

// ============ MAIN COMPONENT ============
export default function Analytics() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [alertsData, setAlertsData] = useState({ expiring: [], inactive: [], unreadChecks: [] });
  const [alertsLoading, setAlertsLoading] = useState(true);
  
  // Document title
  useDocumentTitle('Analytics');
  
  // Pre-aggregated data from Cloud Function
  const { data: analytics, loading, error, refresh, formatCurrency, formatDate, lastUpdated } = useAnalyticsData();
  
  // Historical data for sparklines
  const { history, loading: historyLoading } = useAnalyticsHistory(7);
  
  // Check role
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'superadmin') {
      signOut(auth).then(() => navigate('/login')).catch(console.error);
    }
  }, [navigate]);
  
  // Fetch alerts data (expiring clients, inactive, unread checks)
  // Questa è la sola query realtime necessaria
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Clienti in scadenza nei prossimi 7 giorni
        const expiringQuery = query(
          getTenantCollection(db, 'clients'),
          where('scadenza', '>=', Timestamp.fromDate(now)),
          where('scadenza', '<=', Timestamp.fromDate(in7Days)),
          limit(10)
        );
        
        const expiringSnap = await getDocs(expiringQuery);
        const expiring = expiringSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Cliente',
          expiry: toDate(doc.data().scadenza)?.toISOString()
        }));
        
        // Clienti attivi senza check negli ultimi 14 giorni
        const activeClientsSnap = await getDocs(
          query(
            getTenantCollection(db, 'clients'),
            where('scadenza', '>=', Timestamp.fromDate(now))
          )
        );
        
        const inactive = [];
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        for (const clientDoc of activeClientsSnap.docs.slice(0, 50)) {
          const lastCheck = toDate(clientDoc.data().lastCheckDate);
          const daysSinceLastCheck = lastCheck 
            ? Math.floor((now - lastCheck) / (1000 * 60 * 60 * 24))
            : null;
          
          if (!lastCheck || lastCheck < fourteenDaysAgo) {
            inactive.push({
              id: clientDoc.id,
              name: clientDoc.data().name || 'Cliente',
              lastCheckDaysAgo: daysSinceLastCheck
            });
          }
          
          if (inactive.length >= 5) break;
        }
        
        // Check non letti (recenti)
        const unreadChecks = [];
        for (const clientDoc of activeClientsSnap.docs.slice(0, 20)) {
          const checksSnap = await getDocs(
            query(
              getTenantSubcollection(db, 'clients', clientDoc.id, 'checks'),
              where('viewedByAdmin', '==', false),
              orderBy('createdAt', 'desc'),
              limit(3)
            )
          );
          
          checksSnap.docs.forEach(checkDoc => {
            unreadChecks.push({
              id: checkDoc.id,
              clientId: clientDoc.id,
              clientName: clientDoc.data().name || 'Cliente',
              date: toDate(checkDoc.data().createdAt)?.toISOString()
            });
          });
          
          if (unreadChecks.length >= 5) break;
        }
        
        setAlertsData({ expiring, inactive, unreadChecks });
        setAlertsLoading(false);
      } catch (err) {
        console.error('Error loading alerts:', err);
        setAlertsLoading(false);
      }
    };
    
    loadAlerts();
  }, []);
  
  // Prepare sparkline data from history
  const sparklineData = useMemo(() => {
    if (!history || history.length === 0) return { revenue: [], clients: [], checks: [] };
    
    return {
      revenue: history.map(h => h.revenue?.thisMonth || 0),
      clients: history.map(h => h.clients?.active || 0),
      checks: history.map(h => h.engagement?.checksThisWeek || 0)
    };
  }, [history]);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);
  
  // Loading state
  if (loading && !analytics) {
    return <AnalyticsSkeleton />;
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 p-4 sm:p-6">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center">
          <AlertTriangle className="mx-auto text-rose-400 mb-3" size={32} />
          <p className="text-rose-300 font-medium mb-2">Errore caricamento dati</p>
          <p className="text-sm text-rose-400/70 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }
  
  // Extract data
  const { revenue = {}, clients = {}, engagement = {} } = analytics || {};
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-blue-400" size={24} />
                Analytics
              </h1>
              {lastUpdated && (
                <p className="text-xs text-slate-500">
                  Aggiornato {formatDate(lastUpdated)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors
                ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
        
        {/* Alert Panel */}
        <AnimatePresence>
          {!alertsLoading && (
            <AlertsPanel
              expiringClients={alertsData.expiring}
              inactiveClients={alertsData.inactive}
              unreadChecks={alertsData.unreadChecks}
              alertCounts={{
                expiring: alertsData.expiring.length,
                inactive: alertsData.inactive.length,
                unreadChecks: alertsData.unreadChecks.length
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Revenue Card */}
          <RevenueCard
            thisMonth={revenue.thisMonth || 0}
            lastMonth={revenue.lastMonth || 0}
            growth={revenue.growth || 0}
            arpu={revenue.arpu || 0}
            formatCurrency={formatCurrency}
          />
          
          {/* Clients Card */}
          <ClientsCard
            active={clients.active || 0}
            total={clients.total || 0}
            newThisMonth={clients.newThisMonth || 0}
            retentionRate={clients.retentionRate || 0}
            expired={clients.expired || 0}
            onClick={() => navigate('/clients')}
          />
        </div>
        
        {/* Engagement & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Engagement Card */}
          <div className="lg:col-span-2">
            <EngagementCard
              thisWeek={engagement.checksThisWeek || 0}
              lastWeek={engagement.checksLastWeek || 0}
              avgPerClient={engagement.avgChecksPerClient?.toFixed(1) || '0'}
              weeklyGrowth={engagement.weeklyGrowth || 0}
              sparklineData={sparklineData.checks}
            />
          </div>
          
          {/* Quick Stats */}
          <div className="space-y-4">
            <StatCard
              title="Appuntamenti oggi"
              value={analytics?.appointments?.today || 0}
              icon={Calendar}
              color="cyan"
              onClick={() => navigate('/calendar')}
            />
            <StatCard
              title="MRR"
              value={formatCurrency(revenue.mrr || 0)}
              subtitle="Ricavo mensile ricorrente"
              icon={TrendingUp}
              color="emerald"
            />
          </div>
        </div>
        
        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          <StatCard
            title="Clienti totali"
            value={clients.total || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Tasso rinnovo"
            value={`${clients.retentionRate || 0}%`}
            icon={RefreshCw}
            color={clients.retentionRate >= 70 ? 'emerald' : 'amber'}
          />
          <StatCard
            title="Check questo mese"
            value={engagement.checksThisMonth || 0}
            icon={Activity}
            color="purple"
          />
          <StatCard
            title="Media check/cliente"
            value={engagement.avgChecksPerClient?.toFixed(1) || '0'}
            icon={BarChart3}
            color="cyan"
          />
        </div>
        
        {/* Revenue Trend */}
        {sparklineData.revenue.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20">
                <DollarSign className="text-emerald-400" size={22} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-300">Trend Revenue</h3>
                <p className="text-xs text-slate-500">Ultimi 7 giorni</p>
              </div>
            </div>
            <div className="h-16">
              <SparklineChart 
                data={sparklineData.revenue} 
                color="#10b981" 
                height={60}
              />
            </div>
          </motion.div>
        )}
        
        {/* CTA per reportistica avanzata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20 p-5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-medium mb-1">Report avanzati</h3>
              <p className="text-sm text-slate-400">
                Esporta dati dettagliati, analizza trend storici e genera report PDF
              </p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm font-medium"
            >
              Vai ai Report
            </button>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}
