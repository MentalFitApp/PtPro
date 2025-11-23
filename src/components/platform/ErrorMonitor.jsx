// src/components/platform/ErrorMonitor.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, TrendingDown, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const ErrorMonitor = () => {
  const [recentErrors, setRecentErrors] = useState([]);
  const [errorStats, setErrorStats] = useState({
    total24h: 0,
    criticalCount: 0,
    trend: 'stable' // up, down, stable
  });
  const [dismissedErrors, setDismissedErrors] = useState(new Set());

  useEffect(() => {
    // Monitor errors from last 24 hours
    const yesterday = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    const errorsQuery = query(
      collection(db, 'platform_errors'),
      where('timestamp', '>=', yesterday),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      errorsQuery,
      (snapshot) => {
        const errors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRecentErrors(errors);

        // Calculate stats
        const critical = errors.filter(e => e.severity === 'critical' || e.severity === 'error').length;
        setErrorStats({
          total24h: errors.length,
          criticalCount: critical,
          trend: errors.length > 20 ? 'up' : errors.length < 5 ? 'down' : 'stable'
        });
      },
      (error) => {
        console.warn('Error monitoring unavailable:', error.message);
        setRecentErrors([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDismiss = (errorId) => {
    setDismissedErrors(prev => new Set([...prev, errorId]));
  };

  const visibleErrors = recentErrors
    .filter(err => !dismissedErrors.has(err.id))
    .slice(0, 5); // Show max 5 at once

  if (visibleErrors.length === 0 && errorStats.total24h === 0) {
    return null; // Don't show if no errors
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'error': return 'orange';
      case 'warning': return 'yellow';
      default: return 'blue';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {/* Error Stats Banner */}
      {errorStats.total24h > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${errorStats.trend === 'up' ? 'red' : 'green'}-500/20`}>
                {errorStats.trend === 'up' ? (
                  <TrendingUp size={20} className="text-red-400" />
                ) : (
                  <TrendingDown size={20} className="text-green-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {errorStats.total24h} Errors (24h)
                </div>
                <div className="text-xs text-slate-400">
                  {errorStats.criticalCount} critical
                </div>
              </div>
            </div>
            {errorStats.total24h < 10 && (
              <CheckCircle size={20} className="text-green-400" />
            )}
          </div>
        </motion.div>
      )}

      {/* Individual Error Notifications */}
      <AnimatePresence>
        {visibleErrors.map((error, index) => {
          const color = getSeverityColor(error.severity);
          return (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-slate-900/95 backdrop-blur-sm border border-${color}-500/30 rounded-xl p-4 shadow-2xl`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-${color}-500/20 flex-shrink-0`}>
                  <AlertTriangle size={20} className={`text-${color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className={`text-sm font-semibold text-${color}-400 uppercase`}>
                      {error.severity}
                    </div>
                    <button
                      onClick={() => handleDismiss(error.id)}
                      className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                      <X size={16} className="text-slate-400" />
                    </button>
                  </div>
                  <div className="text-sm text-white mb-1 line-clamp-2">
                    {error.message || 'Unknown error'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {error.context && `${error.context} • `}
                    {error.timestamp?.toDate?.().toLocaleTimeString() || 'Just now'}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ErrorMonitor;
