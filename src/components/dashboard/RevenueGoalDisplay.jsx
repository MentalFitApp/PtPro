// src/components/dashboard/RevenueGoalDisplay.jsx
// Componente per mostrare e modificare inline il revenue goal
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, X, Pencil } from 'lucide-react';
import { useRevenueGoal } from '../../hooks/useRevenueGoal';

export default function RevenueGoalDisplay({ regularRevenue = 0, renewalsRevenue = 0 }) {
  const { revenueGoal, revenueType, setRevenueGoal, loading } = useRevenueGoal();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [tempType, setTempType] = useState('all');
  
  // Calcola il revenue corrente in base al tipo selezionato
  const currentRevenue = revenueType === 'all' 
    ? regularRevenue + renewalsRevenue 
    : revenueType === 'renewals' 
      ? renewalsRevenue 
      : regularRevenue;
  
  const percentage = revenueGoal > 0 ? Math.round((currentRevenue / revenueGoal) * 100) : 0;

  const handleStartEdit = () => {
    setTempValue(revenueGoal.toString());
    setTempType(revenueType);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const numValue = parseInt(tempValue, 10);
    if (!isNaN(numValue) && numValue > 0) {
      await setRevenueGoal(numValue, tempType);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <Target size={16} className="text-slate-400 animate-pulse" />
        <span className="text-xs text-slate-400">Caricamento...</span>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          key="editing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col gap-2.5 px-4 py-3 rounded-xl bg-slate-800/90 border border-blue-500/50 shadow-lg shadow-blue-500/20 min-w-[240px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 font-semibold">Modifica Obiettivo</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                title="Salva"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                title="Annulla"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">€</span>
            <input
              type="number"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 bg-slate-700/50 px-3 py-1.5 rounded border border-slate-600 outline-none text-sm text-white font-medium"
              placeholder="10000"
            />
          </div>
          
          {/* Radio buttons per tipo di revenue */}
          <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">Considera:</span>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 cursor-pointer group py-0.5">
                <input
                  type="radio"
                  value="all"
                  checked={tempType === 'all'}
                  onChange={(e) => setTempType(e.target.value)}
                  className="w-3.5 h-3.5 text-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-300 group-hover:text-white">Tutto (Incassi + Rinnovi)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group py-0.5">
                <input
                  type="radio"
                  value="regular"
                  checked={tempType === 'regular'}
                  onChange={(e) => setTempType(e.target.value)}
                  className="w-3.5 h-3.5 text-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-300 group-hover:text-white">Solo Incassi</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group py-0.5">
                <input
                  type="radio"
                  value="renewals"
                  checked={tempType === 'renewals'}
                  onChange={(e) => setTempType(e.target.value)}
                  className="w-3.5 h-3.5 text-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-300 group-hover:text-white">Solo Rinnovi</span>
              </label>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="display"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartEdit}
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all group"
          title="Clicca per modificare l'obiettivo mensile"
        >
          <div className="flex flex-col gap-0.5 min-w-[140px]">
            <span className="text-[10px] text-slate-500 font-medium leading-none">Obiettivo Mensile</span>
            <div className="text-sm text-white font-semibold leading-tight">
              € {currentRevenue.toLocaleString()} / € {revenueGoal.toLocaleString()}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-32 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
              />
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold leading-none">{percentage}%</span>
          </div>
          
          <Pencil size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
