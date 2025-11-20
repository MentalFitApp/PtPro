import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Clock, CheckCircle, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getClientStats, getExpiringClients, getExpiredClients, getClientsMissingCheckIn } from '../utils/autoNotifications';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Centro Notifiche Automatiche
 * Mostra alert per scadenze, check-in mancanti, ecc.
 */
export default function NotificationCenter() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const clientStats = await getClientStats();
      setStats(clientStats);
      
      // Carica dettagli alert
      const [expiring3, expired, missingCheck] = await Promise.all([
        getExpiringClients(3),
        getExpiredClients(),
        getClientsMissingCheckIn(7)
      ]);
      
      const allAlerts = [
        ...expiring3.map(c => ({
          id: `exp-${c.id}`,
          type: 'expiry',
          severity: c.daysLeft <= 3 ? 'critical' : 'warning',
          title: `Scade tra ${c.daysLeft} giorni`,
          message: c.name,
          clientId: c.id,
          daysLeft: c.daysLeft,
        })),
        ...expired.map(c => ({
          id: `ovr-${c.id}`,
          type: 'expired',
          severity: 'error',
          title: 'Scaduto',
          message: c.name,
          clientId: c.id,
          daysOverdue: c.daysOverdue,
        })),
        ...missingCheck.slice(0, 5).map(c => ({
          id: `chk-${c.id}`,
          type: 'check',
          severity: 'info',
          title: 'Check-in mancante',
          message: `${c.name} - ${c.daysSinceCheck || '?'} giorni`,
          clientId: c.id,
          daysSinceCheck: c.daysSinceCheck,
        })),
      ];
      
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/40 border-red-600/50 text-red-300';
      case 'error':
        return 'bg-red-900/40 border-red-600/50 text-red-300';
      case 'warning':
        return 'bg-amber-900/40 border-amber-600/50 text-amber-300';
      case 'info':
        return 'bg-blue-900/40 border-blue-600/50 text-blue-300';
      default:
        return 'bg-slate-900/40 border-slate-600/50 text-slate-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={16} className="text-amber-400" />;
      case 'info':
        return <Clock size={16} className="text-blue-400" />;
      default:
        return <Bell size={16} />;
    }
  };

  const handleAlertClick = (alert) => {
    if (alert.clientId) {
      navigate(`/client/${alert.clientId}`);
      setShowPanel(false);
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Bell size={20} className="text-slate-400" />
        </button>
      </div>
    );
  }

  const totalAlerts = stats?.needsAttention || 0;
  const hasCriticalAlerts = (stats?.expiring?.days3 || 0) + (stats?.expired || 0) > 0;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell size={20} className={totalAlerts > 0 ? 'text-rose-400' : 'text-slate-400'} />
        
        {/* Badge */}
        {totalAlerts > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full ${
            hasCriticalAlerts 
              ? 'bg-red-600 text-white animate-pulse' 
              : 'bg-amber-600 text-white'
          }`}>
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-rose-400" />
                <h3 className="font-semibold text-slate-100">Notifiche</h3>
                {totalAlerts > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-rose-600 text-white rounded-full">
                    {totalAlerts}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Stats Summary */}
            {stats && (
              <div className="p-3 bg-slate-900/50 border-b border-slate-700 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-red-400 font-bold text-lg">{stats.expired}</div>
                  <div className="text-slate-400">Scaduti</div>
                </div>
                <div className="text-center">
                  <div className="text-amber-400 font-bold text-lg">{stats.expiring.total}</div>
                  <div className="text-slate-400">In Scadenza</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold text-lg">{stats.missingCheckIn}</div>
                  <div className="text-slate-400">No Check</div>
                </div>
              </div>
            )}

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <CheckCircle size={48} className="mb-3 opacity-50" />
                  <p className="text-sm">Tutto a posto! 🎉</p>
                  <p className="text-xs text-slate-600 mt-1">Nessuna notifica</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {alerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      className="w-full px-4 py-3 hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getSeverityIcon(alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getSeverityStyle(alert.severity)}`}>
                              {alert.title}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 font-medium truncate">
                            {alert.message}
                          </p>
                          {alert.type === 'expiry' && (
                            <p className="text-xs text-slate-500 mt-1">
                              {alert.daysLeft === 1 ? 'Scade domani' : `Scade tra ${alert.daysLeft} giorni`}
                            </p>
                          )}
                          {alert.type === 'expired' && (
                            <p className="text-xs text-red-400 mt-1">
                              Scaduto da {alert.daysOverdue} giorni
                            </p>
                          )}
                          {alert.type === 'check' && alert.daysSinceCheck && (
                            <p className="text-xs text-slate-500 mt-1">
                              Ultimo check: {alert.daysSinceCheck} giorni fa
                            </p>
                          )}
                        </div>
                        <ExternalLink size={14} className="text-slate-600 group-hover:text-rose-400 transition-colors mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {alerts.length > 0 && (
              <div className="p-3 border-t border-slate-700 bg-slate-900/50">
                <button
                  onClick={() => {
                    navigate('/clients');
                    setShowPanel(false);
                  }}
                  className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Vedi Tutti i Clienti
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
