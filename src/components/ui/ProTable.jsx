// src/components/ui/ProTable.jsx
// Tabella professionale stile dashboard moderno
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';

// === TABLE CONTAINER ===
export const ProTable = ({ children, className = '' }) => {
  return (
    <div className={`w-full bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    </div>
  );
};

// === TABLE HEAD ===
export const ProTableHead = ({ children }) => {
  return (
    <thead className="bg-slate-800/60">
      {children}
    </thead>
  );
};

// === TABLE HEADER ROW ===
export const ProTableHeaderRow = ({ children }) => {
  return (
    <tr className="border-b border-slate-700/50">
      {children}
    </tr>
  );
};

// === TABLE HEADER CELL ===
export const ProTableHeaderCell = ({ 
  children, 
  sortable = false, 
  sortDirection = null,
  onSort,
  align = 'left',
  className = ''
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  
  return (
    <th 
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 ${alignClass} ${
        sortable ? 'cursor-pointer hover:text-slate-200 select-none' : ''
      } ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        {sortable && (
          <div className="flex flex-col">
            <ChevronUp 
              size={12} 
              className={sortDirection === 'asc' ? 'text-blue-400' : 'text-slate-600'} 
            />
            <ChevronDown 
              size={12} 
              className={`-mt-1 ${sortDirection === 'desc' ? 'text-blue-400' : 'text-slate-600'}`} 
            />
          </div>
        )}
      </div>
    </th>
  );
};

// === TABLE BODY ===
export const ProTableBody = ({ children }) => {
  return <tbody>{children}</tbody>;
};

// === TABLE ROW ===
export const ProTableRow = ({ 
  children, 
  onClick, 
  selected = false,
  className = '' 
}) => {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-b border-slate-700/30 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-slate-800/50' : 'hover:bg-slate-800/30'
      } ${selected ? 'bg-blue-500/10' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.tr>
  );
};

// === TABLE CELL ===
export const ProTableCell = ({ 
  children, 
  align = 'left',
  className = '' 
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  
  return (
    <td className={`px-4 py-3.5 text-sm text-slate-300 ${alignClass} ${className}`}>
      {children}
    </td>
  );
};

// === TABLE ACTIONS CELL ===
export const ProTableActionsCell = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  if (actions.length === 0) return <ProTableCell />;
  
  if (actions.length <= 2) {
    return (
      <ProTableCell align="right">
        <div className="flex items-center justify-end gap-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); action.onClick?.(); }}
              className={`p-2 rounded-lg transition-colors ${
                action.variant === 'danger' 
                  ? 'text-rose-400 hover:bg-rose-500/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </ProTableCell>
    );
  }
  
  return (
    <ProTableCell align="right">
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        >
          <MoreHorizontal size={18} />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[140px]">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); action.onClick?.(); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    action.variant === 'danger'
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </ProTableCell>
  );
};

// === EMPTY STATE ===
export const ProTableEmpty = ({ 
  icon: Icon, 
  title, 
  description,
  action 
}) => {
  return (
    <tr>
      <td colSpan="100%" className="px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          {Icon && (
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <Icon size={24} className="text-slate-500" />
            </div>
          )}
          <h3 className="text-lg font-medium text-slate-300">{title}</h3>
          {description && (
            <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// === BADGE FOR STATUS ===
export const StatusBadge = ({ status, labels = {} }) => {
  const statusConfig = {
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Attivo' },
    expired: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Scaduto' },
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'In attesa' },
    renewed: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Rinnovato' },
    default: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: 'N/D' },
  };
  
  const config = statusConfig[status] || statusConfig.default;
  const label = labels[status] || config.label;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
      {label}
    </span>
  );
};

// === TAG BADGE ===
export const TagBadge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

export default ProTable;
