// src/components/admin/CoachAnalytics.jsx
// Dashboard Analytics avanzata per il Coach

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, AlertTriangle, 
  CheckCircle, Calendar, Activity, Target,
  ArrowUpRight, ArrowDownRight, Clock, Dumbbell,
  Scale, MessageSquare, Phone, ChevronRight
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { useNavigate } from 'react-router-dom';

// Componente Stat Card
const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'cyan', onClick }) => {
  const colors = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    rose: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    purple: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
  };
  
  const iconColors = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    purple: 'text-purple-400'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={`p-5 rounded-2xl bg-gradient-to-br ${colors[color]} border backdrop-blur-sm cursor-pointer transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-slate-800/50 ${iconColors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{trendValue}</span>
          <span className="text-slate-500 ml-1">vs mese scorso</span>
        </div>
      )}
    </motion.div>
  );
};

// Componente Client Alert Row
const ClientAlertRow = ({ client, type, daysAgo, onClick }) => {
  const alertConfig = {
    noCheck: { icon: Scale, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Nessun check' },
    noWorkout: { icon: Dumbbell, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Inattivo' },
    expiring: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'In scadenza' },
    noMessage: { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'No messaggi' }
  };
  
  const config = alertConfig[type];

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-all"
    >
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <config.icon size={18} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{client.displayName || client.name || 'Cliente'}</p>
        <p className="text-slate-500 text-xs">{config.label} da {daysAgo} giorni</p>
      </div>
      <ChevronRight size={16} className="text-slate-600" />
    </motion.div>
  );
};

// Componente Progress Ring
const ProgressRing = ({ value, max, label, color = 'cyan' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const colors = {
    cyan: '#22d3ee',
    emerald: '#34d399',
    amber: '#fbbf24',
    rose: '#fb7185'
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="56"
            cy="56"
            r="45"
            stroke={colors[color]}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{Math.round(percentage)}%</span>
        </div>
      </div>
      <p className="text-slate-400 text-sm mt-2">{label}</p>
    </div>
  );
};

export default function CoachAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    checksThisMonth: 0,
    checksLastMonth: 0,
    totalWeightLost: 0,
    workoutsCompleted: 0,
    messagesThisWeek: 0,
    scheduledCalls: 0
  });
  const [alerts, setAlerts] = useState({
    noCheck: [],
    noWorkout: [],
    expiring: [],
    noMessage: []
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Carica tutti i clienti
      const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
      const clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Clienti attivi (hanno fatto qualcosa negli ultimi 30 giorni)
      const activeClients = clients.filter(c => {
        const lastActivity = c.lastActivity?.toDate?.() || c.updatedAt?.toDate?.();
        return lastActivity && lastActivity > thirtyDaysAgo;
      });

      // Carica checks
      let checksThisMonth = 0;
      let checksLastMonth = 0;
      let totalWeightChange = 0;
      const clientsNoCheck = [];
      const clientsNoWorkout = [];
      const clientsNoMessage = [];

      for (const client of clients) {
        try {
          // Checks del cliente
          const checksSnap = await getDocs(
            query(
              getTenantSubcollection(db, 'clients', client.id, 'checks'),
              orderBy('createdAt', 'desc'),
              limit(10)
            )
          );
          
          const checks = checksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Conta checks questo mese
          checks.forEach(check => {
            const checkDate = check.createdAt?.toDate?.();
            if (checkDate) {
              if (checkDate > thirtyDaysAgo) checksThisMonth++;
              else if (checkDate > sixtyDaysAgo) checksLastMonth++;
            }
          });

          // Calcola peso perso
          if (checks.length >= 2) {
            const firstWeight = checks[checks.length - 1].weight;
            const lastWeight = checks[0].weight;
            if (firstWeight && lastWeight) {
              totalWeightChange += (firstWeight - lastWeight);
            }
          }

          // Clienti senza check recenti
          const lastCheck = checks[0]?.createdAt?.toDate?.();
          if (!lastCheck || lastCheck < sevenDaysAgo) {
            const daysAgo = lastCheck 
              ? Math.floor((now - lastCheck) / (1000 * 60 * 60 * 24))
              : 30;
            clientsNoCheck.push({ ...client, daysAgo });
          }

        } catch (err) {
          console.debug('Errore caricamento dati cliente:', client.id);
        }
      }

      // Messaggi questa settimana
      let messagesThisWeek = 0;
      try {
        const chatsSnap = await getDocs(getTenantCollection(db, 'chats'));
        for (const chat of chatsSnap.docs) {
          const messagesSnap = await getDocs(
            query(
              getTenantSubcollection(db, 'chats', chat.id, 'messages'),
              where('timestamp', '>=', sevenDaysAgo),
              limit(100)
            )
          );
          messagesThisWeek += messagesSnap.size;
        }
      } catch (err) {
        console.debug('Errore conteggio messaggi');
      }

      // Chiamate programmate
      let scheduledCalls = 0;
      try {
        const eventsSnap = await getDocs(
          query(
            getTenantCollection(db, 'events'),
            where('date', '>=', now.toISOString().split('T')[0])
          )
        );
        scheduledCalls = eventsSnap.size;
      } catch (err) {
        console.debug('Errore conteggio chiamate');
      }

      setStats({
        totalClients: clients.length,
        activeClients: activeClients.length,
        checksThisMonth,
        checksLastMonth,
        totalWeightLost: Math.max(0, totalWeightChange),
        workoutsCompleted: 0, // TODO: implementare tracking workouts
        messagesThisWeek,
        scheduledCalls
      });

      setAlerts({
        noCheck: clientsNoCheck.sort((a, b) => b.daysAgo - a.daysAgo).slice(0, 5),
        noWorkout: clientsNoWorkout.slice(0, 5),
        expiring: [],
        noMessage: clientsNoMessage.slice(0, 5)
      });

    } catch (error) {
      console.error('Errore caricamento analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const checksTrend = useMemo(() => {
    if (stats.checksLastMonth === 0) return { direction: 'up', value: '+100%' };
    const change = ((stats.checksThisMonth - stats.checksLastMonth) / stats.checksLastMonth) * 100;
    return {
      direction: change >= 0 ? 'up' : 'down',
      value: `${change >= 0 ? '+' : ''}${Math.round(change)}%`
    };
  }, [stats.checksThisMonth, stats.checksLastMonth]);

  const retentionRate = useMemo(() => {
    if (stats.totalClients === 0) return 0;
    return Math.round((stats.activeClients / stats.totalClients) * 100);
  }, [stats.totalClients, stats.activeClients]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">📊 Analytics</h2>
          <p className="text-slate-400 text-sm">Panoramica delle performance</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl text-sm font-medium transition-all"
        >
          Aggiorna
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clienti Totali"
          value={stats.totalClients}
          subtitle={`${stats.activeClients} attivi`}
          icon={Users}
          color="cyan"
          onClick={() => navigate('/clients')}
        />
        <StatCard
          title="Check Questo Mese"
          value={stats.checksThisMonth}
          icon={CheckCircle}
          color="emerald"
          trend={checksTrend.direction}
          trendValue={checksTrend.value}
        />
        <StatCard
          title="Peso Perso Totale"
          value={`${stats.totalWeightLost.toFixed(1)} kg`}
          subtitle="Tutti i clienti"
          icon={Scale}
          color="purple"
        />
        <StatCard
          title="Chiamate Programmate"
          value={stats.scheduledCalls}
          subtitle="Prossimi giorni"
          icon={Phone}
          color="amber"
          onClick={() => navigate('/calendar')}
        />
      </div>

      {/* Progress & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Retention & Engagement */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-6">Performance</h3>
          <div className="flex justify-around">
            <ProgressRing 
              value={retentionRate} 
              max={100} 
              label="Retention" 
              color="cyan"
            />
            <ProgressRing 
              value={stats.checksThisMonth} 
              max={stats.totalClients * 4} 
              label="Check Rate" 
              color="emerald"
            />
          </div>
        </div>

        {/* Clienti che richiedono attenzione */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Richiedono Attenzione</h3>
          </div>
          
          {alerts.noCheck.length > 0 ? (
            <div className="space-y-2">
              {alerts.noCheck.map((client) => (
                <ClientAlertRow
                  key={client.id}
                  client={client}
                  type="noCheck"
                  daysAgo={client.daysAgo}
                  onClick={() => navigate(`/admin/client/${client.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-slate-400">Tutti i clienti sono in regola! 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
          <MessageSquare size={24} className="mx-auto text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.messagesThisWeek}</p>
          <p className="text-slate-500 text-xs">Messaggi questa settimana</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
          <Activity size={24} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">{retentionRate}%</p>
          <p className="text-slate-500 text-xs">Tasso di Retention</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
          <Target size={24} className="mx-auto text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.activeClients}</p>
          <p className="text-slate-500 text-xs">Clienti Attivi</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
          <Calendar size={24} className="mx-auto text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{Math.round(stats.checksThisMonth / Math.max(1, stats.totalClients) * 100)}%</p>
          <p className="text-slate-500 text-xs">Compliance Check</p>
        </div>
      </div>
    </div>
  );
}
