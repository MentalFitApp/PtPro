// src/components/admin/AdminKPI.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, 
  Calendar, CheckCircle, Clock, AlertCircle, BarChart3,
  Eye, EyeOff, RefreshCw, Download, Filter, ArrowUp, ArrowDown, Edit3
} from 'lucide-react';

/**
 * KPI Dashboard per Admin
 * Metriche chiave del business con confronto temporale
 */
export default function AdminKPI({ 
  data, 
  period = '30days', // '7days', '30days', '90days', 'year'
  onPeriodChange,
  showComparison = true,
  visibleKPIs = ['revenue', 'renewals', 'clients', 'activeClients', 'retention', 'avgValue']
}) {

  // Definizione KPI
  const kpiDefinitions = {
    revenue: {
      id: 'revenue',
      label: 'Fatturato Totale',
      icon: <DollarSign size={20} />,
      color: 'from-green-500 to-emerald-600',
      format: 'currency',
      description: 'Incassi totali del periodo',
    },
    renewals: {
      id: 'renewals',
      label: 'Rinnovi',
      icon: <RefreshCw size={20} />,
      color: 'from-emerald-500 to-green-600',
      format: 'currency',
      description: 'Incassi da rinnovi',
    },
    clients: {
      id: 'clients',
      label: 'Nuovi Clienti',
      icon: <Users size={20} />,
      color: 'from-blue-500 to-cyan-600',
      format: 'number',
      description: 'Clienti acquisiti nel periodo',
    },
    activeClients: {
      id: 'activeClients',
      label: 'Clienti Attivi',
      icon: <CheckCircle size={20} />,
      color: 'from-purple-500 to-pink-600',
      format: 'number',
      description: 'Clienti con abbonamento attivo',
    },
    retention: {
      id: 'retention',
      label: 'Retention Rate',
      icon: <Target size={20} />,
      color: 'from-indigo-500 to-purple-600',
      format: 'percentage',
      description: 'Percentuale di rinnovi',
    },
    conversion: {
      id: 'conversion',
      label: 'Tasso Conversione',
      icon: <TrendingUp size={20} />,
      color: 'from-orange-500 to-red-600',
      format: 'percentage',
      description: 'Lead convertiti in clienti',
    },
    avgValue: {
      id: 'avgValue',
      label: 'Valore Medio Cliente',
      icon: <BarChart3 size={20} />,
      color: 'from-cyan-500 to-blue-600',
      format: 'currency',
      description: 'Valore medio per cliente',
    },
    expiringClients: {
      id: 'expiringClients',
      label: 'In Scadenza',
      icon: <Clock size={20} />,
      color: 'from-yellow-500 to-orange-600',
      format: 'number',
      description: 'Clienti con scadenza imminente',
    },
    pendingAnamnesi: {
      id: 'pendingAnamnesi',
      label: 'Anamnesi Mancanti',
      icon: <AlertCircle size={20} />,
      color: 'from-red-500 to-pink-600',
      format: 'number',
      description: 'Clienti senza anamnesi',
    },
  };

  // Formatta valore in base al tipo
  const formatValue = (value, format) => {
    if (!value && value !== 0) return 'N/D';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('it-IT', { 
          style: 'currency', 
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('it-IT');
      default:
        return value;
    }
  };

  // Calcola trend (confronto con periodo precedente)
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      isPositive: change > 0,
    };
  };



  // KPI Card Component (wrapped with forwardRef)
  const KPICard = React.forwardRef(({ kpi, value, previousValue }, ref) => {
    const trend = showComparison && previousValue !== undefined 
      ? calculateTrend(value, previousValue) 
      : null;

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className="relative overflow-hidden bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-xl hover:border-slate-600 transition-all group"
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
              <div className="text-white">
                {kpi.icon}
              </div>
            </div>
            
            {trend && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                trend.direction === 'up' 
                  ? 'bg-green-500/10 text-green-400' 
                  : trend.direction === 'down'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-slate-500/10 text-slate-400'
              }`}>
                {trend.direction === 'up' ? (
                  <ArrowUp size={12} />
                ) : trend.direction === 'down' ? (
                  <ArrowDown size={12} />
                ) : null}
                {trend.value}%
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-2">
            <p className="text-3xl font-bold text-white mb-1">
              {formatValue(value, kpi.format)}
            </p>
            <p className="text-sm font-medium text-slate-400">
              {kpi.label}
            </p>
          </div>

          {/* Comparison */}
          {showComparison && previousValue !== undefined && (
            <p className="text-xs text-slate-500">
              vs {formatValue(previousValue, kpi.format)} precedente
            </p>
          )}

          {/* Description (on hover) */}
          <div className="mt-3 pt-3 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-slate-400">
              {kpi.description}
            </p>
          </div>
        </div>
      </motion.div>
    );
  });

  // Period Selector
  const PeriodSelector = () => {
    const periods = [
      { value: '7days', label: '7 Giorni' },
      { value: '30days', label: '30 Giorni' },
      { value: '90days', label: '90 Giorni' },
      { value: 'year', label: 'Anno' },
    ];

    return (
      <div className="flex gap-2">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => onPeriodChange?.(p.value)}
            className={`px-3 py-2 text-sm rounded-lg transition-all ${
              period === p.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Panoramica KPI</h2>
          <p className="text-sm text-slate-400">Metriche chiave del tuo business</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PeriodSelector />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
            title="Aggiorna dati"
          >
            <RefreshCw size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
            title="Esporta report"
          >
            <Download size={16} />
          </motion.button>
        </div>
      </div>

      {/* KPI Grid */}
      <motion.div 
        layout
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
      >
        <AnimatePresence mode="popLayout">
          {visibleKPIs.map(kpiId => {
            const kpi = kpiDefinitions[kpiId];
            if (!kpi) return null;

            return (
              <KPICard
                key={kpiId}
                kpi={kpi}
                value={data?.[kpiId]?.current || 0}
                previousValue={data?.[kpiId]?.previous}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {visibleKPIs.length === 0 && (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
          <BarChart3 size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 mb-4">Nessun KPI selezionato</p>
          <p className="text-sm text-slate-500">Usa il pulsante "Personalizza" in alto a destra per selezionare i KPI</p>
        </div>
      )}
    </div>
  );
}

/**
 * Mini KPI Card - per dashboard più compatte
 */
export function MiniKPI({ label, value, format = 'number', trend, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
  };

  const formatValue = (val, fmt) => {
    if (!val && val !== 0) return 'N/D';
    if (fmt === 'currency') return `€${val.toLocaleString()}`;
    if (fmt === 'percentage') return `${val}%`;
    return val.toLocaleString();
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <div className="text-white">{icon}</div>
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">
        {formatValue(value, format)}
      </p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
