import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Save, Eye, Calendar as CalendarIcon } from 'lucide-react';

const NumberInput = ({ label, value, onChange, color = 'cyan' }) => {
  const colorClasses = {
    cyan: 'border-cyan-500/30 focus:ring-cyan-500/50 text-cyan-300',
    rose: 'border-rose-500/30 focus:ring-rose-500/50 text-rose-300',
    emerald: 'border-emerald-500/30 focus:ring-emerald-500/50 text-emerald-300'
  };

  const increment = () => {
    onChange((parseInt(value) || 0) + 1);
  };

  const decrement = () => {
    const newValue = (parseInt(value) || 0) - 1;
    if (newValue >= 0) onChange(newValue);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={decrement}
          className="w-8 h-8 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 rounded border border-slate-600 text-slate-300 transition-colors"
        >
          <Minus size={14} />
        </motion.button>
        
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 text-center text-lg font-bold bg-slate-800/50 border rounded py-1.5 outline-none focus:ring-2 ${colorClasses[color]}`}
          min="0"
        />
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={increment}
          className="w-8 h-8 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 rounded border border-slate-600 text-slate-300 transition-colors"
        >
          <Plus size={14} />
        </motion.button>
      </div>
    </div>
  );
};

const ReportForm = ({
  title,
  color = 'cyan',
  icon: Icon,
  date,
  onDateChange,
  fields,
  onSave,
  showHistory,
  onToggleHistory,
  historyData = [],
  onLoadHistory
}) => {
  const colorClasses = {
    cyan: {
      gradient: 'from-cyan-600 to-blue-600',
      title: 'text-cyan-400',
      button: 'text-cyan-300 hover:text-cyan-100',
      historyBg: 'bg-cyan-900/20 border-cyan-800/30 hover:bg-cyan-900/30'
    },
    rose: {
      gradient: 'from-rose-600 to-red-600',
      title: 'text-rose-400',
      button: 'text-rose-300 hover:text-rose-100',
      historyBg: 'bg-rose-900/20 border-rose-800/30 hover:bg-rose-900/30'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${colors.gradient} bg-opacity-20`}>
            <Icon size={18} className={colors.title} />
          </div>
          <h3 className={`text-sm font-bold ${colors.title}`}>{title}</h3>
        </div>
        <button
          onClick={onToggleHistory}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-700/50 transition-colors ${colors.button}`}
        >
          <Eye size={14} />
          <span className="hidden sm:inline">Storico</span>
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className={`mb-4 p-3 rounded-lg border max-h-32 overflow-y-auto ${colors.historyBg}`}>
          {historyData.length === 0 ? (
            <p className="text-xs text-slate-400">Nessun report salvato</p>
          ) : (
            <div className="space-y-1">
              {historyData.map((report) => (
                <button
                  key={report.id}
                  onClick={() => onLoadHistory(report)}
                  className="w-full text-left text-xs p-2 rounded hover:bg-slate-700/30 transition-colors flex items-center justify-between"
                >
                  <span className="text-slate-300">{report.date}</span>
                  <span className={`font-semibold ${colors.title}`}>
                    {Object.values(report).filter(v => typeof v === 'number' || !isNaN(v)).reduce((a, b) => (parseInt(a) || 0) + (parseInt(b) || 0), 0)} totale
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Date Input */}
      <div className="mb-4">
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-none"
          />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3 mb-4">
        {fields.map((field) => (
          <NumberInput
            key={field.name}
            label={field.label}
            value={field.value}
            onChange={field.onChange}
            color={color}
          />
        ))}
      </div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSave}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${colors.gradient} hover:shadow-lg transition-all flex items-center justify-center gap-2`}
      >
        <Save size={16} />
        Salva Report
      </motion.button>
    </motion.div>
  );
};

export default ReportForm;
