// src/components/platform/PrivacyAuditTrail.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Eye, EyeOff, Download, Filter, Search,
  Clock, User, Activity, Lock, CheckCircle
} from 'lucide-react';

// Privacy utility: mask sensitive data
const maskEmail = (email) => {
  if (!email) return 'N/A';
  const [name, domain] = email.split('@');
  if (!domain) return '***@***.***';
  return `${name.slice(0, 2)}***@${domain.split('.')[0].slice(0, 2)}***.***`;
};

const maskIP = (ip) => {
  if (!ip || ip === 'N/A') return '***.***.***. ***';
  const parts = ip.split('.');
  return `${parts[0]}.***.***.${parts[3] || '***'}`;
};

const maskUID = (uid) => {
  if (!uid) return 'N/A';
  return `${uid.slice(0, 4)}****${uid.slice(-4)}`;
};

const PrivacyAuditTrail = ({ activityLogs }) => {
  const [privacyMode, setPrivacyMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique action types
  const actionTypes = useMemo(() => {
    const types = new Set(activityLogs.map(log => log.action));
    return ['all', ...Array.from(types)];
  }, [activityLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterAction === 'all' || log.action === filterAction;

      return matchesSearch && matchesFilter;
    });
  }, [activityLogs, searchTerm, filterAction]);

  // Export logs (with privacy)
  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      timestamp: log.timestamp?.toDate?.().toISOString() || 'N/A',
      action: log.action,
      description: log.description,
      user: privacyMode ? maskEmail(log.userEmail) : log.userEmail,
      userId: privacyMode ? maskUID(log.userId) : log.userId,
      ip: privacyMode ? maskIP(log.ipAddress) : log.ipAddress,
      metadata: JSON.stringify(log.metadata || {})
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${Date.now()}.csv`;
    a.click();
  };

  // Action color mapping
  const getActionColor = (action) => {
    const colorMap = {
      create_tenant: 'green',
      delete_tenant: 'red',
      update_plan: 'blue',
      suspend_tenant: 'orange',
      impersonate_tenant: 'purple',
      toggle_addon: 'cyan',
      generate_invoice: 'yellow',
      default: 'slate'
    };
    return colorMap[action] || colorMap.default;
  };

  return (
    <div className="space-y-6">
      {/* Privacy Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              privacyMode
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {privacyMode ? <Lock size={18} /> : <Eye size={18} />}
            <span className="font-medium">
              {privacyMode ? 'Privacy Mode ON' : 'Privacy Mode OFF'}
            </span>
            {privacyMode && <CheckCircle size={16} />}
          </button>

          {!privacyMode && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg"
            >
              <Shield size={14} className="text-red-400" />
              <span className="text-xs text-red-400 font-medium">
                Sensitive data visible
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          >
            <Filter size={18} />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium rounded-xl transition-all"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Action Type
                </label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                >
                  {actionTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Actions' : type.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="text-sm text-slate-400">
        Showing {filteredLogs.length} of {activityLogs.length} logs
      </div>

      {/* Audit Trail Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    Timestamp
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                  <div className="flex items-center gap-2">
                    <Activity size={14} />
                    Action
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    User
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const color = getActionColor(log.action);
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                        {log.timestamp?.toDate?.().toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${color}-500/20 text-${color}-400 whitespace-nowrap`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-md truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {privacyMode && <Lock size={12} className="text-green-400" />}
                          <code className="text-slate-400 text-xs">
                            {privacyMode ? maskEmail(log.userEmail) : log.userEmail}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <code className="text-slate-500 text-xs">
                          {privacyMode ? maskIP(log.ipAddress) : (log.ipAddress || 'N/A')}
                        </code>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Privacy Notice */}
      {privacyMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
        >
          <Shield size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-green-400 mb-1">
              Privacy Mode Enabled
            </div>
            <p className="text-sm text-slate-400">
              Sensitive data (emails, IPs, user IDs) are masked to protect privacy. 
              Only authorized CEO can toggle visibility when necessary for security investigations.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PrivacyAuditTrail;
