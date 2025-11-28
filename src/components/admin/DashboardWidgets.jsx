// src/components/admin/DashboardWidgets.jsx
import React, { useState, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  GripVertical, Eye, EyeOff, Settings, X, Plus,
  TrendingUp, Users, DollarSign, Clock, CheckCircle,
  Calendar, FileText, AlertTriangle, Target, BarChart3
} from 'lucide-react';

/**
 * Dashboard Widgets Personalizzabili
 * Permette drag & drop, show/hide, resize dei widget
 */

// Widget individuali
const widgets = {
  stats: {
    id: 'stats',
    name: 'Statistiche Principali',
    icon: <BarChart3 size={18} />,
    size: 'full',
    component: ({ data }) => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Totale Clienti" value={data?.totalClients || 0} icon={<Users />} color="blue" />
        <StatCard title="Attivi" value={data?.activeClients || 0} icon={<CheckCircle />} color="green" />
        <StatCard title="In Scadenza" value={data?.expiringClients || 0} icon={<Clock />} color="orange" />
        <StatCard title="Incassi Mese" value={data?.monthlyRevenue || 0} icon={<DollarSign />} color="purple" isCurrency />
      </div>
    ),
  },
  recentActivity: {
    id: 'recentActivity',
    name: 'Attività Recenti',
    icon: <Clock size={18} />,
    size: 'half',
    component: ({ data }) => (
      <div className="space-y-2">
        {data?.activities?.slice(0, 5).map((activity, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-sm text-slate-300">{activity.text}</span>
          </div>
        )) || <p className="text-slate-500 text-sm">Nessuna attività recente</p>}
      </div>
    ),
  },
  upcomingChecks: {
    id: 'upcomingChecks',
    name: 'Prossimi Check',
    icon: <Calendar size={18} />,
    size: 'half',
    component: ({ data }) => (
      <div className="space-y-2">
        {data?.upcomingChecks?.map((check, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
            <span className="text-sm text-slate-300">{check.clientName}</span>
            <span className="text-xs text-slate-500">{check.date}</span>
          </div>
        )) || <p className="text-slate-500 text-sm">Nessun check programmato</p>}
      </div>
    ),
  },
  pendingAnamnesi: {
    id: 'pendingAnamnesi',
    name: 'Anamnesi Mancanti',
    icon: <FileText size={18} />,
    size: 'half',
    component: ({ data }) => (
      <div className="space-y-2">
        {data?.pendingAnamnesi?.length > 0 ? (
          data.pendingAnamnesi.slice(0, 5).map((client, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-sm text-slate-300">{client.name}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="mx-auto mb-2 text-green-400" size={32} />
            <p className="text-sm text-green-400">Tutte le anamnesi completate!</p>
          </div>
        )}
      </div>
    ),
  },
  revenueChart: {
    id: 'revenueChart',
    name: 'Andamento Incassi',
    icon: <TrendingUp size={18} />,
    size: 'full',
    component: ({ data }) => (
      <div className="h-48 flex items-center justify-center bg-slate-900/30 rounded-lg">
        <p className="text-slate-500 text-sm">Grafico incassi (da implementare)</p>
      </div>
    ),
  },
  quickGoals: {
    id: 'quickGoals',
    name: 'Obiettivi Rapidi',
    icon: <Target size={18} />,
    size: 'half',
    component: ({ data }) => (
      <div className="space-y-3">
        {data?.goals?.map((goal, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{goal.name}</span>
              <span className="text-slate-400">{goal.current}/{goal.target}</span>
            </div>
            <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(goal.current / goal.target) * 100}%` }}
              />
            </div>
          </div>
        )) || <p className="text-slate-500 text-sm">Nessun obiettivo configurato</p>}
      </div>
    ),
  },
};

const StatCard = ({ title, value, icon, color, isCurrency }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg border border-slate-700">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <p className="text-2xl font-bold text-white mb-1">
        {isCurrency ? `€${value.toLocaleString()}` : value}
      </p>
      <p className="text-xs text-slate-400">{title}</p>
    </div>
  );
};

export default function DashboardWidgets({ data, storageKey = 'admin_dashboard_layout' }) {
  const [widgetOrder, setWidgetOrder] = useState([]);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Carica layout salvato
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const { order, hidden } = JSON.parse(saved);
        setWidgetOrder(order || Object.keys(widgets));
        setHiddenWidgets(hidden || []);
      } catch (error) {
        setWidgetOrder(Object.keys(widgets));
      }
    } else {
      setWidgetOrder(Object.keys(widgets));
    }
  }, [storageKey]);

  // Salva layout
  const saveLayout = (order, hidden) => {
    localStorage.setItem(storageKey, JSON.stringify({ order, hidden }));
  };

  // Toggle visibilità widget
  const toggleWidget = (widgetId) => {
    const newHidden = hiddenWidgets.includes(widgetId)
      ? hiddenWidgets.filter(id => id !== widgetId)
      : [...hiddenWidgets, widgetId];
    
    setHiddenWidgets(newHidden);
    saveLayout(widgetOrder, newHidden);
  };

  // Reset layout
  const resetLayout = () => {
    const defaultOrder = Object.keys(widgets);
    setWidgetOrder(defaultOrder);
    setHiddenWidgets([]);
    saveLayout(defaultOrder, []);
  };

  const visibleWidgets = widgetOrder.filter(id => !hiddenWidgets.includes(id));

  return (
    <div className="space-y-4">
      {/* Customize Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setIsCustomizing(!isCustomizing)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isCustomizing 
                ? 'bg-blue-600 text-white preserve-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Settings size={16} />
            <span className="text-sm">Personalizza</span>
          </motion.button>
        </div>
      </div>

      {/* Customization Panel */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">Widget Disponibili</h3>
              <button
                onClick={resetLayout}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Reset Layout
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(widgets).map(([id, widget]) => (
                <motion.button
                  key={id}
                  onClick={() => toggleWidget(id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all border ${
                    hiddenWidgets.includes(id)
                      ? 'bg-slate-900/30 border-slate-700 text-slate-500'
                      : 'bg-slate-700/50 border-slate-600 text-slate-200'
                  }`}
                >
                  {hiddenWidgets.includes(id) ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                  {widget.icon}
                  <span className="text-xs">{widget.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widgets Grid */}
      <Reorder.Group
        axis="y"
        values={visibleWidgets}
        onReorder={(newOrder) => {
          setWidgetOrder(newOrder);
          saveLayout(newOrder, hiddenWidgets);
        }}
        className="space-y-4"
      >
        {visibleWidgets.map((widgetId) => {
          const widget = widgets[widgetId];
          if (!widget) return null;

          return (
            <Reorder.Item
              key={widgetId}
              value={widgetId}
              dragListener={isCustomizing}
              className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700 ${
                isCustomizing ? 'cursor-move' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isCustomizing && (
                    <GripVertical size={18} className="text-slate-500" />
                  )}
                  {widget.icon}
                  <h3 className="text-white font-semibold">{widget.name}</h3>
                </div>
                {isCustomizing && (
                  <button
                    onClick={() => toggleWidget(widgetId)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <EyeOff size={18} />
                  </button>
                )}
              </div>
              
              <widget.component data={data} />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {visibleWidgets.length === 0 && (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
          <Eye size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">Nessun widget visibile</p>
          <button
            onClick={() => setIsCustomizing(true)}
            className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
          >
            Mostra Widget
          </button>
        </div>
      )}
    </div>
  );
}
