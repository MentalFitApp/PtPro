// src/components/client/ProgressCharts.jsx
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Scale, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

const formatDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
};

const formatFullDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function ProgressCharts({ checks = [] }) {
  const [activeChart, setActiveChart] = useState('weight'); // 'weight' | 'bodyFat' | 'both'

  // Prepara dati per i grafici (ordina dal più vecchio al più recente)
  const chartData = useMemo(() => {
    if (!checks || checks.length === 0) return [];
    
    return [...checks]
      .filter(c => c.weight || c.bodyFat)
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateA - dateB;
      })
      .map(check => ({
        date: formatDate(check.createdAt),
        fullDate: formatFullDate(check.createdAt),
        weight: check.weight ? parseFloat(check.weight) : null,
        bodyFat: check.bodyFat ? parseFloat(check.bodyFat) : null,
        checkId: check.id
      }));
  }, [checks]);

  // Calcola statistiche
  const stats = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const firstWeight = chartData.find(d => d.weight !== null)?.weight;
    const lastWeight = [...chartData].reverse().find(d => d.weight !== null)?.weight;
    const firstBF = chartData.find(d => d.bodyFat !== null)?.bodyFat;
    const lastBF = [...chartData].reverse().find(d => d.bodyFat !== null)?.bodyFat;
    
    return {
      weightChange: firstWeight && lastWeight ? (lastWeight - firstWeight).toFixed(1) : null,
      weightPct: firstWeight && lastWeight ? (((lastWeight - firstWeight) / firstWeight) * 100).toFixed(1) : null,
      bodyFatChange: firstBF && lastBF ? (lastBF - firstBF).toFixed(1) : null,
      totalChecks: chartData.length
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Scale size={32} className="mx-auto mb-2 opacity-50" />
        <p>Nessun check con dati di peso/BF disponibile</p>
      </div>
    );
  }

  const TrendIcon = ({ value }) => {
    if (!value || value === 0) return <Minus size={14} className="text-slate-400" />;
    return value > 0 
      ? <TrendingUp size={14} className="text-red-400" />
      : <TrendingDown size={14} className="text-emerald-400" />;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 text-xs mb-2">{payload[0]?.payload?.fullDate}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm" style={{ color: entry.color }}>
            {entry.name === 'weight' ? 'Peso' : 'Body Fat'}: 
            <span className="font-semibold ml-1">
              {entry.value}{entry.name === 'weight' ? ' kg' : '%'}
            </span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800"
          >
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Scale size={14} />
              <span>Variazione Peso</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${
                stats.weightChange > 0 ? 'text-red-400' : 
                stats.weightChange < 0 ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {stats.weightChange > 0 ? '+' : ''}{stats.weightChange} kg
              </span>
              <TrendIcon value={parseFloat(stats.weightChange)} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.weightPct > 0 ? '+' : ''}{stats.weightPct}% dal primo check
            </p>
          </motion.div>

          {stats.bodyFatChange !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800"
            >
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Percent size={14} />
                <span>Variazione BF</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  stats.bodyFatChange > 0 ? 'text-red-400' : 
                  stats.bodyFatChange < 0 ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {stats.bodyFatChange > 0 ? '+' : ''}{stats.bodyFatChange}%
                </span>
                <TrendIcon value={parseFloat(stats.bodyFatChange)} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                su {stats.totalChecks} check totali
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Chart Toggle */}
      <div className="flex gap-2">
        {['weight', 'bodyFat', 'both'].map(type => (
          <button
            key={type}
            onClick={() => setActiveChart(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeChart === type 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {type === 'weight' ? 'Peso' : type === 'bodyFat' ? 'Body Fat' : 'Entrambi'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis 
              yAxisId="weight"
              stroke="#94a3b8" 
              tick={{ fontSize: 11 }}
              tickLine={false}
              domain={['dataMin - 2', 'dataMax + 2']}
              hide={activeChart === 'bodyFat'}
            />
            <YAxis 
              yAxisId="bodyFat"
              orientation="right"
              stroke="#94a3b8" 
              tick={{ fontSize: 11 }}
              tickLine={false}
              domain={['dataMin - 2', 'dataMax + 2']}
              hide={activeChart === 'weight'}
            />
            <Tooltip content={<CustomTooltip />} />
            {(activeChart === 'weight' || activeChart === 'both') && (
              <Line 
                yAxisId="weight"
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#60a5fa' }}
                name="weight"
                connectNulls
              />
            )}
            {(activeChart === 'bodyFat' || activeChart === 'both') && (
              <Line 
                yAxisId={activeChart === 'both' ? 'bodyFat' : 'weight'}
                type="monotone" 
                dataKey="bodyFat" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#fbbf24' }}
                name="bodyFat"
                connectNulls
              />
            )}
            <Legend 
              formatter={(value) => value === 'weight' ? 'Peso (kg)' : 'Body Fat (%)'}
              wrapperStyle={{ fontSize: '12px' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
