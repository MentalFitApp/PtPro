import React from 'react';
import { GripVertical, X, Sliders } from 'lucide-react';

/**
 * Componente wrapper per widget della dashboard personalizzabile
 */
export default function DashboardWidget({ id, title, icon: Icon, children, onRemove, onConfig, className = '' }) {
  return (
    <div className={`bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-2 sm:p-3 h-full flex flex-col ${className}`}>
      {/* Header con drag handle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 cursor-move drag-handle flex-1">
          <GripVertical size={14} className="text-slate-500" />
          {Icon && <Icon size={16} className="text-blue-400" />}
          <h3 className="font-semibold text-slate-100 text-xs sm:text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-1 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
          {onConfig && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onConfig(id);
              }}
              className="text-slate-500 hover:text-blue-400 transition-colors p-0.5 rounded hover:bg-slate-700/50 cursor-pointer"
              title="Configura contenuto"
              style={{ pointerEvents: 'auto' }}
            >
              <Sliders size={14} />
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRemove(id);
              }}
              className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded hover:bg-slate-700/50 cursor-pointer"
              title="Rimuovi widget"
              style={{ pointerEvents: 'auto' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Contenuto widget */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
