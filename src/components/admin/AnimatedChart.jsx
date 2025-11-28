// src/components/admin/AnimatedChart.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  TrendingUp, TrendingDown, DollarSign, Users, 
  BarChart3, Activity, Maximize2, Download, RefreshCw
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Grafico Animato Avanzato con effetti 3D e animazioni fluide
 */
export default function AnimatedChart({ 
  data = [], 
  type = 'revenue', // 'revenue' | 'clients'
  timeRange = 'monthly', // 'daily' | 'monthly' | 'yearly'
  onTypeChange,
  onTimeRangeChange 
}) {
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    // Trigger animation quando i dati cambiano
    setAnimationComplete(false);
    const timer = setTimeout(() => setAnimationComplete(true), 1000);
    return () => clearTimeout(timer);
  }, [data, type, timeRange]);

  // Calcola statistiche
  const stats = React.useMemo(() => {
    if (!data || data.length === 0) return { total: 0, avg: 0, max: 0, trend: 0 };
    
    const values = data.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    
    // Calcola trend (confronto ultima metà vs prima metà)
    const half = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, half).reduce((sum, val) => sum + val, 0) / half;
    const secondHalf = values.slice(half).reduce((sum, val) => sum + val, 0) / (values.length - half);
    const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
    
    return { total, avg, max, trend };
  }, [data]);

  // Formatta valore
  const formatValue = (value) => {
    if (type === 'revenue') {
      return new Intl.NumberFormat('it-IT', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    return value.toLocaleString('it-IT');
  };

  // Formatta etichette
  const formatLabel = (label, range) => {
    if (range === 'daily') {
      const [day, month] = label.split('/');
      return `${day}/${month}`;
    } else if (range === 'monthly') {
      const [year, month] = label.split('-');
      const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      return monthNames[parseInt(month) - 1] || label;
    }
    return label;
  };

  // Configurazione gradiente
  const createGradient = (ctx, color1, color2) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  };

  // Configurazione Chart.js
  const chartData = {
    labels: data.map(d => formatLabel(d.name, timeRange)),
    datasets: [{
      label: type === 'revenue' ? 'Fatturato' : 'Clienti',
      data: data.map(d => d.value),
      borderColor: type === 'revenue' ? 'rgb(34, 197, 94)' : 'rgb(99, 102, 241)',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        if (chartType === 'bar') {
          return type === 'revenue' 
            ? createGradient(ctx, 'rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.2)')
            : createGradient(ctx, 'rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.2)');
        }
        return type === 'revenue'
          ? createGradient(ctx, 'rgba(34, 197, 94, 0.4)', 'rgba(34, 197, 94, 0.01)')
          : createGradient(ctx, 'rgba(99, 102, 241, 0.4)', 'rgba(99, 102, 241, 0.01)');
      },
      fill: true,
      tension: 0.4,
      pointRadius: chartType === 'line' ? 4 : 0,
      pointHoverRadius: chartType === 'line' ? 8 : 0,
      pointBackgroundColor: type === 'revenue' ? 'rgb(34, 197, 94)' : 'rgb(99, 102, 241)',
      pointBorderColor: '#0f172a',
      pointBorderWidth: 2,
      pointHoverBorderWidth: 3,
      borderWidth: chartType === 'line' ? 3 : 0,
      barThickness: chartType === 'bar' ? 'flex' : undefined,
      borderRadius: chartType === 'bar' ? 8 : undefined,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutCubic',
      onComplete: () => setAnimationComplete(true),
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: { 
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: '500' },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: timeRange === 'daily' ? 10 : 12,
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.08)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: '500' },
          callback: function(value) {
            if (type === 'revenue') {
              return value >= 1000 ? `€${(value/1000).toFixed(1)}k` : `€${value}`;
            }
            return value;
          },
          padding: 10,
        },
        beginAtZero: true,
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        titleFont: { size: 13, weight: 'bold' },
        bodyColor: '#cbd5e1',
        bodyFont: { size: 12 },
        borderColor: type === 'revenue' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(99, 102, 241, 0.5)',
        borderWidth: 2,
        padding: 12,
        displayColors: false,
        cornerRadius: 8,
        callbacks: {
          title: (items) => items[0].label,
          label: (item) => {
            if (type === 'revenue') {
              return `Fatturato: ${formatValue(item.raw)}`;
            }
            return `Nuovi Clienti: ${item.raw}`;
          }
        }
      }
    }
  };

  const ChartComponent = chartType === 'bar' ? Bar : Line;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      }`}
    >
      {/* Header con statistiche animate */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{ rotate: animationComplete ? 0 : 360 }}
              transition={{ duration: 2, repeat: animationComplete ? 0 : Infinity }}
              className={`p-3 rounded-xl ${
                type === 'revenue' 
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                  : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30'
              }`}
            >
              {type === 'revenue' ? <DollarSign size={24} className="text-green-400" /> : <Users size={24} className="text-blue-400" />}
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Andamento {type === 'revenue' ? 'Fatturato' : 'Clienti'}
              </h2>
              <p className="text-sm text-slate-400">
                {timeRange === 'daily' ? 'Ultimi 30 giorni' : timeRange === 'monthly' ? 'Ultimi 12 mesi' : 'Ultimi 5 anni'}
              </p>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
            >
              <p className="text-xs text-slate-400 mb-1">Totale</p>
              <p className="text-lg font-bold text-white">{formatValue(stats.total)}</p>
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
            >
              <p className="text-xs text-slate-400 mb-1">Media</p>
              <p className="text-lg font-bold text-white">{formatValue(Math.round(stats.avg))}</p>
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
            >
              <p className="text-xs text-slate-400 mb-1">Trend</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${
                stats.trend > 0 ? 'text-green-400' : stats.trend < 0 ? 'text-red-400' : 'text-slate-400'
              }`}>
                {stats.trend > 0 ? <TrendingUp size={18} /> : stats.trend < 0 ? <TrendingDown size={18} /> : <Activity size={18} />}
                {Math.abs(stats.trend).toFixed(1)}%
              </p>
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Type Selector */}
          <div className="flex gap-1 bg-slate-900/70 p-1 rounded-lg border border-slate-700/50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTypeChange?.('revenue')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'revenue'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white preserve-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign size={16} className="inline mr-1" />
              Fatturato
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTypeChange?.('clients')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'clients'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white preserve-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={16} className="inline mr-1" />
              Clienti
            </motion.button>
          </div>

          {/* Chart Type */}
          <div className="flex gap-1 bg-slate-900/70 p-1 rounded-lg border border-slate-700/50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('line')}
              className={`p-2 rounded-md transition-all ${
                chartType === 'line' ? 'bg-slate-700 text-white preserve-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grafico a Linea"
            >
              <Activity size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-md transition-all ${
                chartType === 'bar' ? 'bg-slate-700 text-white preserve-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grafico a Barre"
            >
              <BarChart3 size={18} />
            </motion.button>
          </div>

          {/* Actions */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-900/70 hover:bg-slate-800 rounded-lg border border-slate-700/50 text-slate-300 transition-all"
            title="Aggiorna"
          >
            <RefreshCw size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-900/70 hover:bg-slate-800 rounded-lg border border-slate-700/50 text-slate-300 transition-all"
            title="Esporta"
          >
            <Download size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-900/70 hover:bg-slate-800 rounded-lg border border-slate-700/50 text-slate-300 transition-all"
            title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
          >
            <Maximize2 size={18} />
          </motion.button>
        </div>
      </div>

      {/* Chart Area con animazioni */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`relative ${isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-[400px]'}`}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 ${
          type === 'revenue' 
            ? 'bg-gradient-to-t from-green-500/5 to-transparent' 
            : 'bg-gradient-to-t from-blue-500/5 to-transparent'
        } rounded-xl pointer-events-none`} />
        
        <ChartComponent ref={chartRef} data={chartData} options={chartOptions} />
      </motion.div>

      {/* Time Range Selector */}
      <div className="flex justify-center mt-6">
        <div className="flex gap-2 bg-slate-900/70 p-1 rounded-lg border border-slate-700/50">
          {['daily', 'monthly', 'yearly'].map((range) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTimeRangeChange?.(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                timeRange === range
                  ? 'bg-slate-700 text-white preserve-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {range === 'daily' ? 'Giorno' : range === 'monthly' ? 'Mese' : 'Anno'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {!animationComplete && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm rounded-2xl flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
