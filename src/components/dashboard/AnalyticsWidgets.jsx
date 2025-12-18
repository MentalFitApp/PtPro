// src/components/dashboard/AnalyticsWidgets.jsx
// Widget per dashboard analytics con statistiche real-time

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Users, ClipboardCheck, 
  AlertTriangle, Clock, CalendarX, UserX, Bell,
  ChevronRight, Activity, BarChart3, Target, Eye
} from 'lucide-react';

// ============ STAT CARD ============
export const StatCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  trendLabel,
  color = 'blue',
  onClick 
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
    sky: 'from-sky-500/20 to-sky-600/5 border-sky-500/20',
  };
  
  const iconColorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/20 text-rose-400',
    purple: 'bg-purple-500/20 text-purple-400',
    sky: 'bg-sky-500/20 text-sky-400',
  };
  
  const isPositive = trend && (trend.startsWith('+') || parseFloat(trend) > 0);
  const isNegative = trend && (trend.startsWith('-') || parseFloat(trend) < 0);
  
  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm p-4 sm:p-5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${iconColorClasses[color]}`}>
          <Icon size={20} />
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isPositive ? 'bg-emerald-500/20 text-emerald-400' : 
            isNegative ? 'bg-rose-500/20 text-rose-400' : 
            'bg-slate-500/20 text-slate-400'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null}
            {trend}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl sm:text-4xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-300 font-medium">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        {trendLabel && <p className="text-xs text-slate-500">{trendLabel}</p>}
      </div>
    </motion.div>
  );
};

// ============ STATS GRID ============
export const StatsGrid = ({ clientStats, checkStats }) => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="Clienti Attivi"
        value={clientStats.active}
        subtitle={`${clientStats.newThisWeek} nuovi questa settimana`}
        icon={Users}
        trend={clientStats.trend}
        trendLabel="vs settimana scorsa"
        color="blue"
        onClick={() => navigate('/admin/clients')}
      />
      
      <StatCard
        title="Check-in Oggi"
        value={checkStats.today}
        subtitle={`${checkStats.unread} da leggere`}
        icon={ClipboardCheck}
        trend={checkStats.trendVsYesterday}
        trendLabel="vs ieri"
        color="emerald"
      />
      
      <StatCard
        title="In Scadenza"
        value={clientStats.expiringSoon}
        subtitle="Prossimi 7 giorni"
        icon={CalendarX}
        color={clientStats.expiringSoon > 0 ? 'amber' : 'slate'}
        onClick={() => navigate('/admin/clients?filter=expiring')}
      />
      
      <StatCard
        title="Inattivi"
        value={clientStats.inactive}
        subtitle="Nessun check da 7+ giorni"
        icon={UserX}
        color={clientStats.inactive > 0 ? 'rose' : 'slate'}
        onClick={() => navigate('/admin/clients?filter=inactive')}
      />
    </div>
  );
};

// ============ ALERT BANNER ============
export const AlertBanner = ({ alerts, maxShow = 3 }) => {
  const navigate = useNavigate();
  
  if (!alerts || alerts.length === 0) return null;
  
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  
  const displayAlerts = alerts.slice(0, maxShow);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/20 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Richiede Attenzione</h3>
          <p className="text-xs text-slate-400">
            {criticalCount > 0 && <span className="text-rose-400">{criticalCount} urgenti</span>}
            {criticalCount > 0 && warningCount > 0 && ' • '}
            {warningCount > 0 && <span className="text-amber-400">{warningCount} avvisi</span>}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        {displayAlerts.map((alert, idx) => (
          <div 
            key={`${alert.clientId}-${alert.type}-${idx}`}
            onClick={() => navigate(`/admin/clients/${alert.clientId}`)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${
              alert.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{alert.clientName}</p>
              <p className="text-xs text-slate-400">{alert.message}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        ))}
        
        {alerts.length > maxShow && (
          <button 
            onClick={() => navigate('/admin/clients?filter=alerts')}
            className="w-full text-center text-xs text-sky-400 hover:text-sky-300 py-2"
          >
            Vedi tutti ({alerts.length}) →
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============ UNREAD CHECKS WIDGET ============
export const UnreadChecksWidget = ({ checks, onViewAll }) => {
  const navigate = useNavigate();
  
  if (!checks || checks.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-sky-500/20">
            <Eye className="w-5 h-5 text-sky-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Check da Leggere</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-4">
          ✓ Tutti i check sono stati visualizzati
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/20 relative">
            <Eye className="w-5 h-5 text-sky-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {checks.length}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">Check da Leggere</h3>
        </div>
      </div>
      
      <div className="space-y-2">
        {checks.slice(0, 5).map((check) => (
          <div 
            key={check.id}
            onClick={() => navigate(`/admin/clients/${check.clientId}/checks/${check.id}`)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
              {check.clientName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{check.clientName}</p>
              <p className="text-xs text-slate-400">{check.timeAgo}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        ))}
        
        {checks.length > 5 && (
          <button 
            onClick={onViewAll}
            className="w-full text-center text-xs text-sky-400 hover:text-sky-300 py-2"
          >
            Vedi tutti ({checks.length}) →
          </button>
        )}
      </div>
    </div>
  );
};

// ============ WEEKLY CHART ============
export const WeeklyCheckChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <BarChart3 className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Check-in Settimanali</h3>
          <p className="text-xs text-slate-400">Ultimi 7 giorni</p>
        </div>
      </div>
      
      <div className="flex items-end gap-2 h-32">
        {data.map((day, idx) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${(day.count / maxCount) * 100}%` }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg min-h-[4px]"
              style={{ minHeight: day.count > 0 ? '8px' : '4px' }}
            />
            <span className="text-[10px] text-slate-500 capitalize">{day.day}</span>
            <span className="text-xs text-slate-300 font-medium">{day.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ ACTIVITY TIMELINE ============
export const ActivityTimeline = ({ activities, maxShow = 8 }) => {
  const iconMap = {
    'new_client': Users,
    'check': ClipboardCheck,
    'message': Bell,
    'payment': Target,
  };
  
  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-slate-500/20">
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Attività Recente</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-4">
          Nessuna attività recente
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Attività Recente</h3>
      </div>
      
      <div className="space-y-3">
        {activities.slice(0, maxShow).map((activity, idx) => {
          const Icon = iconMap[activity.type] || Activity;
          const isLast = idx === Math.min(activities.length, maxShow) - 1;
          
          return (
            <div key={`${activity.type}-${idx}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full bg-${activity.color}-500/20 flex items-center justify-center flex-shrink-0 ${activity.unread ? 'ring-2 ring-sky-500' : ''}`}>
                  <Icon size={14} className={`text-${activity.color}-400`} />
                </div>
                {!isLast && <div className="w-px flex-1 bg-slate-700/50 my-1" />}
              </div>
              <div className="pb-3 min-w-0 flex-1">
                <p className="text-sm text-white font-medium truncate">{activity.title}</p>
                <p className="text-xs text-slate-400">{activity.subtitle}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {activity.timestamp?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  {' • '}
                  {activity.timestamp?.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ QUICK SUMMARY ============
export const QuickSummary = ({ clientStats, checkStats }) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-sky-500/10 to-purple-500/10 border border-sky-500/20 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">📊 Riepilogo</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-400">Questa settimana</p>
          <p className="text-white font-medium">{checkStats.thisWeek} check-in</p>
        </div>
        <div>
          <p className="text-slate-400">Settimana scorsa</p>
          <p className="text-white font-medium">{checkStats.lastWeek} check-in</p>
        </div>
        <div>
          <p className="text-slate-400">Nuovi clienti</p>
          <p className="text-white font-medium">{clientStats.newThisMonth} (mese)</p>
        </div>
        <div>
          <p className="text-slate-400">Tasso risposta</p>
          <p className="text-white font-medium">
            {clientStats.active > 0 
              ? Math.round((checkStats.thisWeek / clientStats.active) * 100) 
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default {
  StatCard,
  StatsGrid,
  AlertBanner,
  UnreadChecksWidget,
  WeeklyCheckChart,
  ActivityTimeline,
  QuickSummary
};
