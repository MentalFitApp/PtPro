import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  MousePointer,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getLandingPages } from '../../services/landingPageService';

/**
 * LandingPagesAnalytics - Dashboard metriche e analytics per landing pages
 */
const LandingPagesAnalytics = () => {
  const { tenantId } = useTenant();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('all');
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, all
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    quizOpened: 0,
    quizCompleted: 0,
    quizAbandoned: 0,
    leads: 0,
    conversionRate: 0,
  });
  const [pageStats, setPageStats] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  // Load pages
  useEffect(() => {
    loadPages();
  }, [tenantId]);

  // Load analytics quando cambia filtro
  useEffect(() => {
    if (tenantId) {
      loadAnalytics();
    }
  }, [tenantId, selectedPage, dateRange]);

  const loadPages = async () => {
    if (!tenantId) return;
    try {
      const result = await getLandingPages(tenantId);
      setPages(result);
    } catch (error) {
      console.error('Errore caricamento pagine:', error);
      toast.error('Errore nel caricamento delle pagine');
    }
  };

  const loadAnalytics = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      // Calcola data di inizio
      const now = new Date();
      let startDate = null;
      
      if (dateRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // Query base
      let analyticsQuery = collection(db, `tenants/${tenantId}/landing_analytics`);
      
      // Filtra per pagina se selezionata
      const queryConstraints = [];
      if (selectedPage !== 'all') {
        queryConstraints.push(where('pageId', '==', selectedPage));
      }
      if (startDate) {
        queryConstraints.push(where('timestamp', '>=', startDate));
      }
      queryConstraints.push(orderBy('timestamp', 'desc'));

      const q = query(analyticsQuery, ...queryConstraints);
      const snapshot = await getDocs(q);

      // Elabora eventi
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }));

      // Calcola metriche
      const views = events.filter(e => e.type === 'view');
      const quizEvents = events.filter(e => e.type === 'quiz_event');
      const quizOpened = quizEvents.filter(e => e.eventType === 'quiz_opened').length;
      const quizCompleted = quizEvents.filter(e => e.eventType === 'quiz_completed').length;
      const quizAbandoned = quizEvents.filter(e => e.eventType === 'quiz_partial').length;

      // Visitatori unici (approssimazione con user agent)
      const uniqueVisitors = new Set(
        views.map(e => `${e.userAgent || ''}_${e.referrer || ''}`)
      ).size;

      // Carica leads
      let leadsQuery = collection(db, `tenants/${tenantId}/leads`);
      const leadsConstraints = [];
      if (selectedPage !== 'all') {
        leadsConstraints.push(where('landingPageId', '==', selectedPage));
      }
      if (startDate) {
        leadsConstraints.push(where('createdAt', '>=', startDate));
      }
      
      const leadsQ = query(leadsQuery, ...leadsConstraints);
      const leadsSnapshot = await getDocs(leadsQ);
      const leadsCount = leadsSnapshot.size;

      // Calcola conversion rate
      const conversionRate = views.length > 0 
        ? ((quizCompleted / views.length) * 100).toFixed(1)
        : 0;

      setAnalytics({
        totalViews: views.length,
        uniqueVisitors,
        quizOpened,
        quizCompleted,
        quizAbandoned,
        leads: leadsCount,
        conversionRate: parseFloat(conversionRate),
      });

      // Stats per pagina
      if (selectedPage === 'all') {
        const statsMap = new Map();
        
        pages.forEach(page => {
          statsMap.set(page.id, {
            pageId: page.id,
            title: page.title,
            slug: page.slug,
            views: 0,
            quizOpened: 0,
            quizCompleted: 0,
            leads: 0,
            conversionRate: 0,
          });
        });

        events.forEach(event => {
          if (!event.pageId) return;
          const stat = statsMap.get(event.pageId);
          if (!stat) return;

          if (event.type === 'view') {
            stat.views++;
          } else if (event.type === 'quiz_event') {
            if (event.eventType === 'quiz_opened') stat.quizOpened++;
            if (event.eventType === 'quiz_completed') stat.quizCompleted++;
          }
        });

        leadsSnapshot.docs.forEach(doc => {
          const leadData = doc.data();
          if (!leadData.landingPageId) return;
          const stat = statsMap.get(leadData.landingPageId);
          if (stat) stat.leads++;
        });

        // Calcola conversion rate per ogni pagina
        statsMap.forEach(stat => {
          if (stat.views > 0) {
            stat.conversionRate = ((stat.quizCompleted / stat.views) * 100).toFixed(1);
          }
        });

        setPageStats(Array.from(statsMap.values()).sort((a, b) => b.views - a.views));
      } else {
        setPageStats([]);
      }

      // Eventi recenti (ultimi 10)
      setRecentEvents(events.slice(0, 10));

    } catch (error) {
      console.error('Errore caricamento analytics:', error);
      toast.error('Errore nel caricamento delle metriche');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // TODO: Implementare export CSV
    toast.info('Export in arrivo...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-slate-400">Caricamento metriche...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/landing-pages"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-sky-400" />
                Analytics Landing Pages
              </h1>
              <p className="text-slate-400 mt-1">
                Metriche dettagliate e funnel di conversione
              </p>
            </div>
          </div>

          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Esporta Dati</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Page Filter */}
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Tutte le pagine</option>
            {pages.map(page => (
              <option key={page.id} value={page.id}>
                {page.title}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="7d">Ultimi 7 giorni</option>
            <option value="30d">Ultimi 30 giorni</option>
            <option value="90d">Ultimi 90 giorni</option>
            <option value="all">Tutto il periodo</option>
          </select>

          <button
            onClick={loadAnalytics}
            className="px-4 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl text-white transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Aggiorna</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Eye}
            label="Visualizzazioni"
            value={analytics.totalViews}
            color="blue"
          />
          <StatCard
            icon={Users}
            label="Visitatori Unici"
            value={analytics.uniqueVisitors}
            color="purple"
          />
          <StatCard
            icon={MousePointer}
            label="Quiz Aperti"
            value={analytics.quizOpened}
            color="cyan"
          />
          <StatCard
            icon={CheckCircle}
            label="Quiz Completati"
            value={analytics.quizCompleted}
            color="green"
          />
        </div>

        {/* Funnel */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400" />
            Funnel di Conversione
          </h2>
          
          <div className="space-y-4">
            <FunnelStep
              label="Visualizzazioni Pagina"
              value={analytics.totalViews}
              percentage={100}
              color="blue"
            />
            <FunnelStep
              label="Quiz Aperti"
              value={analytics.quizOpened}
              percentage={analytics.totalViews > 0 ? (analytics.quizOpened / analytics.totalViews * 100).toFixed(1) : 0}
              color="cyan"
            />
            <FunnelStep
              label="Quiz Abbandonati"
              value={analytics.quizAbandoned}
              percentage={analytics.quizOpened > 0 ? (analytics.quizAbandoned / analytics.quizOpened * 100).toFixed(1) : 0}
              color="yellow"
            />
            <FunnelStep
              label="Quiz Completati"
              value={analytics.quizCompleted}
              percentage={analytics.quizOpened > 0 ? (analytics.quizCompleted / analytics.quizOpened * 100).toFixed(1) : 0}
              color="green"
            />
          </div>

          {/* Conversion Rate */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Tasso di Conversione Totale</span>
              <span className="text-2xl font-bold text-green-400">{analytics.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Stats per Pagina (se "Tutte" selezionato) */}
        {selectedPage === 'all' && pageStats.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                Performance per Pagina
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Pagina</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Views</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Quiz Aperti</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Completati</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Leads</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {pageStats.map((stat) => (
                    <tr key={stat.pageId} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{stat.title}</p>
                          <p className="text-xs text-slate-400">/{stat.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-white">{stat.views}</td>
                      <td className="px-6 py-4 text-center text-cyan-400">{stat.quizOpened}</td>
                      <td className="px-6 py-4 text-center text-green-400">{stat.quizCompleted}</td>
                      <td className="px-6 py-4 text-center text-purple-400">{stat.leads}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold ${
                          stat.conversionRate >= 10 ? 'text-green-400' :
                          stat.conversionRate >= 5 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {stat.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Eventi Recenti */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              Eventi Recenti
            </h2>
          </div>
          
          <div className="divide-y divide-slate-700">
            {recentEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Nessun evento registrato nel periodo selezionato
              </div>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getEventIcon(event.type, event.eventType)}
                      <div>
                        <p className="text-white font-medium">
                          {getEventLabel(event.type, event.eventType)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {event.timestamp?.toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                    {event.pageSlug && (
                      <span className="text-xs text-slate-400">/{event.pageSlug}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componenti Helper
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    cyan: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</p>
      <p className="text-sm text-slate-300">{label}</p>
    </motion.div>
  );
};

const FunnelStep = ({ label, value, percentage, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-medium">
          {value} <span className="text-slate-400">({percentage}%)</span>
        </span>
      </div>
      <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${colorClasses[color]} rounded-full`}
        />
      </div>
    </div>
  );
};

const getEventIcon = (type, eventType) => {
  if (type === 'view') {
    return <div className="p-2 bg-blue-500/20 rounded-lg"><Eye className="w-4 h-4 text-blue-400" /></div>;
  }
  if (type === 'quiz_event') {
    if (eventType === 'quiz_opened') {
      return <div className="p-2 bg-cyan-500/20 rounded-lg"><MousePointer className="w-4 h-4 text-cyan-400" /></div>;
    }
    if (eventType === 'quiz_completed') {
      return <div className="p-2 bg-green-500/20 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400" /></div>;
    }
    if (eventType === 'quiz_partial') {
      return <div className="p-2 bg-yellow-500/20 rounded-lg"><XCircle className="w-4 h-4 text-yellow-400" /></div>;
    }
  }
  return <div className="p-2 bg-slate-700 rounded-lg"><Activity className="w-4 h-4 text-slate-400" /></div>;
};

const getEventLabel = (type, eventType) => {
  if (type === 'view') return 'Visualizzazione pagina';
  if (type === 'quiz_event') {
    if (eventType === 'quiz_opened') return 'Quiz aperto';
    if (eventType === 'quiz_completed') return 'Quiz completato';
    if (eventType === 'quiz_partial') return 'Quiz abbandonato';
    if (eventType === 'quiz_step') return 'Step quiz completato';
  }
  if (type === 'conversion') return 'Conversione';
  return 'Evento';
};

export default LandingPagesAnalytics;
