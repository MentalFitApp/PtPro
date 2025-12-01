import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * FilterPanel - Pannello laterale scorrevole per filtri avanzati
 * 
 * @param {boolean} isOpen - Stato apertura panel
 * @param {function} onClose - Callback chiusura
 * @param {React.ReactNode} children - Contenuto filtri
 * @param {string} title - Titolo panel (default: "Filtri")
 * @param {string} position - Posizione panel: 'left' | 'right' (default: 'right')
 */
export default function FilterPanel({ 
  isOpen, 
  onClose, 
  children, 
  title = "Filtri",
  position = "right",
  footer = null
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: position === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: position === 'right' ? '100%' : '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${position === 'right' ? 'right-0' : 'left-0'} h-full w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-${position === 'right' ? 'l' : 'r'} border-slate-700 z-50 flex flex-col shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-blue-400" />
                <h3 className="text-lg font-bold text-slate-100">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>

            {/* Footer (optional) */}
            {footer && (
              <div className="border-t border-slate-700 p-4">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * FilterSection - Sezione espandibile dentro FilterPanel
 */
export function FilterSection({ title, children, defaultOpen = true, icon: Icon }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-slate-400 group-hover:text-slate-300" />}
          <span className="font-medium text-slate-200 group-hover:text-slate-100">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * FilterCheckbox - Checkbox stilizzato per filtri
 */
export function FilterCheckbox({ label, checked, onChange, count }) {
  return (
    <label className="flex items-center justify-between p-2 hover:bg-slate-800/30 rounded-lg cursor-pointer transition-colors group">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="w-4 h-4 accent-blue-500 rounded"
        />
        <span className="text-sm text-slate-300 group-hover:text-slate-100">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </label>
  );
}

/**
 * FilterRange - Range input per filtri numerici
 */
export function FilterRange({ label, min, max, value, onChange, step = 1, formatValue }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm text-blue-400 font-mono">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}

/**
 * FilterDateRange - Date range picker
 */
export function FilterDateRange({ label, startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={startDate}
          onChange={onStartChange}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-blue-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={onEndChange}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
