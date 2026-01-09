// src/pages/admin/AnalyticsOptimized.jsx
// Versione ottimizzata di Analytics con pre-aggregazione e caching

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, Users, DollarSign, Activity, Clock } from 'lucide-react';
import { db } from '../../firebase';
import { getTenantDoc } from '../../config/tenant';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useCachedQuery } from '../../hooks/useDataCache';

/**
 * Analytics Ottimizzato - Usa dati pre-aggregati dal cloud function
 * Caricamento quasi istantaneo grazie a:
 * - Dati pre-calcolati in Firestore (analytics_summary)
 * - Caching in memoria con TTL
 * - Snapshot realtime solo su documento singolo
 */
export default function AnalyticsOptimized() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useDocumentTitle('Analytics');

  // Carica dati pre-aggregati con caching
  const { data: analytics, loading, error, refetch } = useCachedQuery(
    'analytics-summary',
    async () => {
      const tenantId = localStorage.getItem('tenantId');
      if (!tenantId) throw new Error('No tenant ID');

      // Fetch documento pre-aggregato
      const analyticsRef = doc(db, `tenants/${tenantId}/analytics/summary`);
      const analyticsSnap = await getDoc(analyticsRef);

      if (!analyticsSnap.exists()) {
        // Se non esiste, inizializza dati vuoti
        return {
          revenue: { week: 0, month: 0, year: 0 },
          clients: { total: 0, active: 0, expiring: 0, new: { week: 0, month: 0 } },
          engagement: { checksThisWeek: 0, anamnesiThisMonth: 0, activeChats: 0 },
          lastUpdated: new Date()
        };
      }

      return {
        ...analyticsSnap.data(),
        lastUpdated: analyticsSnap.data().lastUpdated?.toDate?.() || new Date()
      };
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minuti
      cacheTime: 10 * 60 * 1000, // 10 minuti
      refetchOnMount: true
    }
  );

  // Calcola metriche per periodo selezionato
  const metrics = useMemo(() => {
    if (!analytics) return null;

    const revenue = analytics.revenue?.[selectedPeriod] || 0;
    const clients = analytics.clients || {};
    const engagement = analytics.engagement || {};

    return {
      revenue,
      totalClients: clients.total || 0,
      activeClients: clients.active || 0,
      expiringClients: clients.expiring || 0,
      newClients: selectedPeriod === 'week' 
        ? clients.new?.week || 0
        : clients.new?.month || 0,
      checksThisWeek: engagement.checksThisWeek || 0,
      anamnesiThisMonth: engagement.anamnesiThisMonth || 0,
      activeChats: engagement.activeChats || 0
    };
  }, [analytics, selectedPeriod]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Caricamento analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={32} className="text-red-400" />
          </div>
          <p className="text-white mb-2">Errore caricamento dati</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-slate-400 mt-1">
              Ultimo aggiornamento: {analytics?.lastUpdated?.toLocaleTimeString('it-IT') || 'N/A'}
            </p>
          </div>
          <button
            onClick={refetch}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {[
            { key: 'week', label: 'Settimana' },
            { key: 'month', label: 'Mese' },
            { key: 'year', label: 'Anno' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <DollarSign size={24} className="text-emerald-400" />
            </div>
            <TrendingUp size={20} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            €{metrics?.revenue?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-slate-400">Incasso totale</p>
        </motion.div>

        {/* Total Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Users size={24} className="text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics?.totalClients || 0}
          </p>
          <p className="text-sm text-slate-400">Clienti totali</p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics?.activeClients || 0} attivi • {metrics?.expiringClients || 0} in scadenza
          </p>
        </motion.div>

        {/* New Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <Users size={24} className="text-cyan-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            +{metrics?.newClients || 0}
          </p>
          <p className="text-sm text-slate-400">Nuovi clienti</p>
        </motion.div>

        {/* Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Activity size={24} className="text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics?.checksThisWeek || 0}
          </p>
          <p className="text-sm text-slate-400">Check questa settimana</p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics?.anamnesiThisMonth || 0} anamnesi • {metrics?.activeChats || 0} chat attive
          </p>
        </motion.div>
      </div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg mt-0.5">
            <Clock size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-400 mb-1">
              Dati Pre-Aggregati
            </h3>
            <p className="text-xs text-slate-400">
              Queste statistiche sono calcolate automaticamente ogni ora per garantire caricamenti istantanei.
              I dati sono aggiornati al {analytics?.lastUpdated?.toLocaleString('it-IT') || 'N/A'}.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
