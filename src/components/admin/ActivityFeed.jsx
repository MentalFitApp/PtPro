// src/components/admin/ActivityFeed.jsx
import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  Bell, Clock, CheckCircle, FileText, RefreshCw, 
  AlertCircle, TrendingUp, User, ChevronRight, X,
  Filter, Search, GripVertical
} from 'lucide-react';

/**
 * Feed Attività con Drag & Drop e Filtri Avanzati
 */
export default function ActivityFeed({ activities = [], onActivityClick, clients = [] }) {
  const [sortedActivities, setSortedActivities] = useState(activities);
  const [filter, setFilter] = useState('all'); // 'all' | 'renewal' | 'new_check' | 'new_anamnesi' | 'expiring'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [dismissedActivities, setDismissedActivities] = useState(new Set());

  // Carica attività dismissate da localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('dismissed_activities');
    if (saved) {
      setDismissedActivities(new Set(JSON.parse(saved)));
    }
  }, []);

  // Aggiorna quando cambiano le attività (filtra quelle dismissate)
  React.useEffect(() => {
    const filtered = activities.filter(activity => {
      const activityId = `${activity.type}-${activity.clientId}-${activity.date?.seconds || activity.date}`;
      return !dismissedActivities.has(activityId);
    });
    setSortedActivities(filtered);
  }, [activities, dismissedActivities]);

  // Configurazione icone e colori per tipo
  const activityConfig = {
    renewal: {
      icon: <RefreshCw size={20} />,
      color: 'text-emerald-400 bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      label: 'Rinnovo',
      bgGradient: 'from-emerald-500/5 to-transparent'
    },
    new_check: {
      icon: <CheckCircle size={20} />,
      color: 'text-green-400 bg-green-500/10',
      borderColor: 'border-green-500/30',
      label: 'Check-In',
      bgGradient: 'from-green-500/5 to-transparent'
    },
    new_anamnesi: {
      icon: <FileText size={20} />,
      color: 'text-blue-400 bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      label: 'Anamnesi',
      bgGradient: 'from-blue-500/5 to-transparent'
    },
    expiring: {
      icon: <Clock size={20} />,
      color: 'text-yellow-400 bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      label: 'In Scadenza',
      bgGradient: 'from-yellow-500/5 to-transparent'
    },
  };

  // Filtra attività
  const filteredActivities = React.useMemo(() => {
    let filtered = sortedActivities;

    // Filtro per tipo
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.type === filter);
    }

    // Filtro per ricerca
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [sortedActivities, filter, searchQuery]);

  // Formatta data
  const timeAgo = (date) => {
    if (!date) return '';
    
    // Converti Firestore timestamp a Date
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    const seconds = Math.floor((new Date() - dateObj) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anni fa";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " mesi fa";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gg fa";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ore fa";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min fa";
    return "ora";
  };

  // Toggle espansione
  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Activity Item Component
  const ActivityItem = ({ item, index }) => {
    const config = activityConfig[item.type] || activityConfig.new_check;
    const itemId = `${item.type}-${item.clientId}-${item.date?.seconds || item.date}`;
    const isExpanded = expandedItems.has(itemId);
    
    // Trova info cliente
    const clientInfo = clients.find(c => c.id === item.clientId);

    return (
      <Reorder.Item
        key={itemId}
        value={item}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.01 }}
        className="group"
      >
        <motion.div
          layout
          onClick={() => onActivityClick?.(item)}
          className={`relative overflow-hidden rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border ${config.borderColor} cursor-pointer transition-all`}
        >
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${config.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
          
          {/* Content */}
          <div className="relative p-4">
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical size={16} className="text-slate-500" />
              </div>

              {/* Icon */}
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className={`p-2.5 rounded-lg ${config.color} flex-shrink-0`}
              >
                {config.icon}
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">
                      {item.clientName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${config.color} border ${config.borderColor}`}>
                    {config.label}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <Clock size={12} />
                  {timeAgo(item.date)}
                </div>

                {/* Expanded Info */}
                <AnimatePresence>
                  {isExpanded && clientInfo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-slate-700/50"
                    >
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500 mb-1">Email</p>
                          <p className="text-slate-300">{clientInfo.email || 'N/D'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">Telefono</p>
                          <p className="text-slate-300">{clientInfo.phone || 'N/D'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ x: isExpanded ? 0 : -5 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight 
                  size={18} 
                  className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </motion.div>
            </div>
          </div>

          {/* Hover border effect */}
          <motion.div
            className={`absolute inset-0 border-2 ${config.borderColor} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
          />
        </motion.div>
      </Reorder.Item>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30"
          >
            <Bell size={24} className="text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white">Feed Attività</h2>
            <p className="text-sm text-slate-400">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'attività' : 'attività'}
            </p>
          </div>
        </div>

        {/* Badge contatore + Elimina tutto */}
        <div className="flex items-center gap-2">
          {filteredActivities.length > 0 && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 font-semibold text-sm"
              >
                {filteredActivities.length}
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (window.confirm(`Eliminare tutte le ${filteredActivities.length} attività ${filter !== 'all' ? `di tipo "${filter}"` : ''}?`)) {
                    // Marca attività come dismissate e salva in localStorage
                    const typesToRemove = filter === 'all' 
                      ? ['renewal', 'new_check', 'new_anamnesi', 'expiring']
                      : [filter];
                    
                    const newDismissed = new Set(dismissedActivities);
                    sortedActivities.forEach(activity => {
                      if (typesToRemove.includes(activity.type)) {
                        const activityId = `${activity.type}-${activity.clientId}-${activity.date?.seconds || activity.date}`;
                        newDismissed.add(activityId);
                      }
                    });
                    
                    setDismissedActivities(newDismissed);
                    localStorage.setItem('dismissed_activities', JSON.stringify([...newDismissed]));
                    
                    // Rimuovi da UI
                    setSortedActivities(prev => 
                      prev.filter(a => !typesToRemove.includes(a.type))
                    );
                  }
                }}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all"
                title={`Elimina ${filter === 'all' ? 'tutte' : 'queste'} attività`}
              >
                <X size={16} />
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca cliente o attività..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900/70 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Tutte', icon: <Bell size={14} /> },
          { value: 'renewal', label: 'Rinnovi', icon: <RefreshCw size={14} /> },
          { value: 'new_check', label: 'Check-In', icon: <CheckCircle size={14} /> },
          { value: 'new_anamnesi', label: 'Anamnesi', icon: <FileText size={14} /> },
          { value: 'expiring', label: 'Scadenze', icon: <Clock size={14} /> },
        ].map((filterOption) => (
          <motion.button
            key={filterOption.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(filterOption.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === filterOption.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {filterOption.icon}
            {filterOption.label}
          </motion.button>
        ))}
      </div>

      {/* Activity List con Drag & Drop */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredActivities.length > 0 ? (
            <Reorder.Group
              axis="y"
              values={filteredActivities}
              onReorder={setSortedActivities}
              className="space-y-3"
            >
              {filteredActivities
                .slice(0, 20)
                .map((item, index) => (
                  <ActivityItem
                    key={`${item.type}-${item.clientId}-${item.date?.seconds || item.date}`}
                    item={item}
                    index={index}
                  />
                ))}
            </Reorder.Group>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-4"
              >
                <AlertCircle size={48} className="text-slate-600" />
              </motion.div>
              <p className="text-slate-400 text-sm">
                {searchQuery || filter !== 'all' 
                  ? 'Nessuna attività trovata' 
                  : 'Nessuna attività recente'}
              </p>
              {(searchQuery || filter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all"
                >
                  Mostra tutte
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      {filteredActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-slate-700/50"
        >
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(activityConfig).map(([type, config]) => {
              const count = activities.filter(a => a.type === type).length;
              return (
                <div key={type} className="text-center">
                  <div className={`${config.color} inline-block p-2 rounded-lg mb-1`}>
                    {config.icon}
                  </div>
                  <p className="text-xs text-slate-500">{count}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
