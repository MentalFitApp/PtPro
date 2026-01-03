/**
 * Componenti UI per la nuova pagina Analytics
 * Design moderno, actionable, con mini grafici sparkline
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Calendar,
  ChevronRight, AlertTriangle, Clock, Eye, UserX,
  CheckCircle, XCircle, Activity, Target, RefreshCw
} from 'lucide-react';

// ============ STAT CARD CON TREND ============
export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue',
  onClick 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/20 text-rose-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-rose-400',
    neutral: 'text-slate-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={`bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30 p-4 
        ${onClick ? 'cursor-pointer hover:bg-slate-700/30' : ''} transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={18} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColors[trend]}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : null}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-slate-400">{title}</p>
      {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
};

// ============ MINI SPARKLINE CHART ============
export const SparklineChart = ({ data, color = '#3b82f6', height = 40 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-10 text-slate-500 text-xs">
        Nessun dato
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Area sotto la linea */}
      <polygon
        points={`0,${height} ${points} 100,${height}`}
        fill={`url(#gradient-${color})`}
      />
      {/* Punto finale */}
      {data.length > 0 && (
        <circle
          cx="100"
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
};

// ============ REVENUE CARD GRANDE ============
export const RevenueCard = ({ 
  thisMonth, 
  lastMonth, 
  growth, 
  arpu, 
  formatCurrency 
}) => {
  const trend = growth >= 0 ? 'up' : 'down';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/20">
          <DollarSign className="text-emerald-400" size={22} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-300">Revenue</h3>
          <p className="text-xs text-slate-500">Questo mese</p>
        </div>
      </div>
      
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-3xl font-bold text-white">{formatCurrency(thisMonth)}</p>
          <p className="text-sm text-slate-400 mt-1">
            vs {formatCurrency(lastMonth)} mese scorso
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium
          ${trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
        >
          {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{growth >= 0 ? '+' : ''}{growth}%</span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-emerald-500/20">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">ARPU (ricavo medio per cliente)</span>
          <span className="font-medium text-white">{formatCurrency(arpu)}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ============ CLIENTS CARD ============
export const ClientsCard = ({ 
  active, 
  total, 
  newThisMonth, 
  retentionRate, 
  expired,
  onClick 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-5 cursor-pointer hover:bg-slate-700/30 transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-blue-500/20">
          <Users className="text-blue-400" size={22} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-300">Clienti</h3>
          <p className="text-xs text-slate-500">Panoramica</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-white">{active}</p>
          <p className="text-xs text-slate-400">Attivi</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-400">+{newThisMonth}</p>
          <p className="text-xs text-slate-400">Nuovi questo mese</p>
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-700/30 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Retention</span>
          <span className="font-medium text-emerald-400">{retentionRate}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Scaduti</span>
          <span className="font-medium text-slate-300">{expired}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-end text-xs text-blue-400 mt-3">
        <span>Vedi tutti</span>
        <ChevronRight size={14} />
      </div>
    </motion.div>
  );
};

// ============ ENGAGEMENT CARD ============
export const EngagementCard = ({ 
  thisWeek, 
  lastWeek, 
  avgPerClient, 
  weeklyGrowth,
  sparklineData 
}) => {
  const trend = weeklyGrowth >= 0 ? 'up' : 'down';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-purple-500/20">
          <Activity className="text-purple-400" size={22} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-300">Check-in</h3>
          <p className="text-xs text-slate-500">Engagement settimanale</p>
        </div>
      </div>
      
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-white">{thisWeek}</p>
          <p className="text-xs text-slate-400">questa settimana</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium
          ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}%</span>
        </div>
      </div>
      
      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mb-4">
          <SparklineChart data={sparklineData} color="#a855f7" />
        </div>
      )}
      
      <div className="pt-4 border-t border-slate-700/30 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Media per cliente</span>
          <span className="font-medium text-white">{avgPerClient}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Settimana scorsa</span>
          <span className="font-medium text-slate-300">{lastWeek}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ============ ALERTS PANEL ============
export const AlertsPanel = ({ 
  expiringClients = [], 
  inactiveClients = [], 
  unreadChecks = [],
  alertCounts = {}
}) => {
  const navigate = useNavigate();
  
  const totalAlerts = (alertCounts.expiring || 0) + 
                      (alertCounts.inactive || 0) + 
                      (alertCounts.unreadChecks || 0);
  
  if (totalAlerts === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/5 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-5"
      >
        <div className="flex items-center gap-3 text-emerald-400">
          <CheckCircle size={24} />
          <div>
            <p className="font-medium">Tutto in ordine!</p>
            <p className="text-sm text-emerald-400/70">Nessuna azione richiesta</p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/5 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-amber-500/20">
          <AlertTriangle className="text-amber-400" size={22} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-amber-300">Richiede attenzione</h3>
          <p className="text-xs text-amber-400/70">{totalAlerts} azioni in sospeso</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Clienti in scadenza */}
        {expiringClients.length > 0 && (
          <AlertItem
            icon={<Clock className="text-rose-400" size={16} />}
            title={`${alertCounts.expiring} client${alertCounts.expiring > 1 ? 'i' : 'e'} in scadenza`}
            items={expiringClients.map(c => ({
              label: c.name,
              sublabel: `Scade ${formatRelativeDate(c.expiry)}`,
              onClick: () => navigate(`/client/${c.id}?tab=payments`)
            }))}
            onViewAll={() => navigate('/clients?filter=expiring')}
          />
        )}
        
        {/* Clienti inattivi */}
        {inactiveClients.length > 0 && (
          <AlertItem
            icon={<UserX className="text-amber-400" size={16} />}
            title={`${alertCounts.inactive} client${alertCounts.inactive > 1 ? 'i' : 'e'} inattiv${alertCounts.inactive > 1 ? 'i' : 'o'}`}
            items={inactiveClients.map(c => ({
              label: c.name,
              sublabel: c.lastCheckDaysAgo ? `Ultimo check ${c.lastCheckDaysAgo}gg fa` : 'Mai fatto check',
              onClick: () => navigate(`/client/${c.id}`)
            }))}
            onViewAll={() => navigate('/clients?filter=inactive')}
          />
        )}
        
        {/* Check non letti */}
        {unreadChecks.length > 0 && (
          <AlertItem
            icon={<Eye className="text-blue-400" size={16} />}
            title={`${alertCounts.unreadChecks} check da visualizzare`}
            items={unreadChecks.map(c => ({
              label: c.clientName,
              sublabel: formatRelativeDate(c.date),
              onClick: () => navigate(`/client/${c.clientId}?tab=checks`)
            }))}
            onViewAll={() => navigate('/clients?filter=unread')}
          />
        )}
      </div>
    </motion.div>
  );
};

// ============ ALERT ITEM ============
const AlertItem = ({ icon, title, items, onViewAll }) => {
  const [expanded, setExpanded] = React.useState(false);
  const displayItems = expanded ? items : items.slice(0, 2);
  
  return (
    <div className="bg-slate-800/30 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      <div className="space-y-1">
        {displayItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
          >
            <div>
              <p className="text-sm text-slate-200">{item.label}</p>
              <p className="text-xs text-slate-500">{item.sublabel}</p>
            </div>
            <ChevronRight size={14} className="text-slate-500" />
          </button>
        ))}
      </div>
      {items.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-400 hover:text-blue-300 mt-2"
        >
          {expanded ? 'Mostra meno' : `Mostra altri ${items.length - 2}`}
        </button>
      )}
    </div>
  );
};

// ============ HELPER ============
function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'oggi';
  if (diffDays === 1) return 'domani';
  if (diffDays === -1) return 'ieri';
  if (diffDays > 0 && diffDays <= 7) return `tra ${diffDays} giorni`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} giorni fa`;
  
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

// ============ LOADING SKELETON ============
export const AnalyticsSkeleton = () => (
  <div className="p-4 sm:p-6 space-y-6 animate-pulse">
    <div className="h-8 w-48 bg-slate-700/50 rounded-lg" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-48 bg-slate-700/50 rounded-2xl" />
      <div className="h-48 bg-slate-700/50 rounded-2xl" />
    </div>
    <div className="h-40 bg-slate-700/50 rounded-2xl" />
    <div className="h-64 bg-slate-700/50 rounded-2xl" />
  </div>
);

export default {
  StatCard,
  SparklineChart,
  RevenueCard,
  ClientsCard,
  EngagementCard,
  AlertsPanel,
  AnalyticsSkeleton,
};
