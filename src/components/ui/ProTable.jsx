// src/components/ui/ProTable.jsx
// Tabella professionale stile dashboard moderno con tema dinamico
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

// === TABLE CONTAINER ===
export const ProTable = ({ children, className = '', loading = false }) => {
  return (
    <div className={`relative w-full bg-theme-bg-secondary/60 backdrop-blur-xl border border-theme/50 rounded-2xl overflow-hidden shadow-lg shadow-black/10 ${className}`}>
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-theme-bg-secondary/80 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="overflow-x-auto scrollbar-hide">
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
    <thead className="bg-theme-bg-tertiary/60 border-b border-theme/50">
      {children}
    </thead>
  );
};

// === TABLE HEADER ROW ===
export const ProTableHeaderRow = ({ children }) => {
  return (
    <tr>
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
  width,
  className = ''
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  
  return (
    <th 
      className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-theme-text-tertiary ${alignClass} ${
        sortable ? 'cursor-pointer hover:text-theme-text-primary select-none group' : ''
      } ${className}`}
      style={width ? { width } : undefined}
      onClick={sortable ? onSort : undefined}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        <span className="transition-colors">{children}</span>
        {sortable && (
          <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity">
            <ChevronUp 
              size={11} 
              className={`transition-colors ${sortDirection === 'asc' ? 'text-blue-400' : 'text-theme-text-tertiary'}`} 
            />
            <ChevronDown 
              size={11} 
              className={`-mt-1 transition-colors ${sortDirection === 'desc' ? 'text-blue-400' : 'text-theme-text-tertiary'}`} 
            />
          </div>
        )}
      </div>
    </th>
  );
};

// === TABLE BODY ===
export const ProTableBody = ({ children }) => {
  return <tbody className="divide-y divide-theme/30">{children}</tbody>;
};

// === TABLE ROW ===
export const ProTableRow = ({ 
  children, 
  onClick, 
  selected = false,
  highlighted = false,
  className = '' 
}) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ backgroundColor: 'rgba(var(--color-bg-tertiary), 0.3)' }}
      className={`transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${selected ? 'bg-blue-500/10 hover:bg-blue-500/15' : ''} ${
        highlighted ? 'bg-amber-500/5' : ''
      } ${className}`}
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
  truncate = false,
  className = '' 
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  
  return (
    <td className={`px-4 py-4 text-sm text-theme-text-primary ${alignClass} ${truncate ? 'max-w-[200px] truncate' : ''} ${className}`}>
      {children}
    </td>
  );
};

// === TABLE ACTIONS CELL ===
export const ProTableActionsCell = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (actions.length === 0) return <ProTableCell />;
  
  if (actions.length <= 2) {
    return (
      <ProTableCell align="right">
        <div className="flex items-center justify-end gap-1">
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              onClick={(e) => { e.stopPropagation(); action.onClick?.(); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-colors ${
                action.variant === 'danger' 
                  ? 'text-rose-400 hover:bg-rose-500/10' 
                  : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60'
              }`}
              title={action.label}
            >
              {action.icon}
            </motion.button>
          ))}
        </div>
      </ProTableCell>
    );
  }
  
  return (
    <ProTableCell align="right">
      <div className="relative">
        <motion.button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors"
        >
          <MoreHorizontal size={18} />
        </motion.button>
        
        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsOpen(false)} 
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute right-0 top-full mt-1 z-20 bg-theme-bg-secondary/95 backdrop-blur-xl border border-theme/50 rounded-xl shadow-xl shadow-black/20 overflow-hidden min-w-[160px]"
              >
                {actions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); action.onClick?.(); setIsOpen(false); }}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                      action.variant === 'danger'
                        ? 'text-rose-400 hover:bg-rose-500/10'
                        : 'text-theme-text-primary hover:bg-theme-bg-tertiary/60'
                    }`}
                  >
                    {action.icon}
                    {action.label}
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
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
      <td colSpan="100%" className="px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center"
        >
          {Icon && (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-theme-bg-tertiary/80 to-theme-bg-secondary flex items-center justify-center mb-4 shadow-lg">
              <Icon size={24} className="text-theme-text-tertiary" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-theme-text-primary">{title}</h3>
          {description && (
            <p className="text-sm text-theme-text-secondary mt-1.5 max-w-sm">{description}</p>
          )}
          {action && (
            <motion.button
              onClick={action.onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/25"
            >
              {action.label}
            </motion.button>
          )}
        </motion.div>
      </td>
    </tr>
  );
};

// === PAGINATION ===
export const ProTablePagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const pageNumbers = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-theme/50">
      <div className="flex items-center gap-3 text-sm text-theme-text-secondary">
        {showItemsPerPage && (
          <div className="flex items-center gap-2">
            <span>Mostra</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
              className="px-2 py-1 bg-theme-bg-tertiary/60 border border-theme/50 rounded-lg text-theme-text-primary text-sm focus:ring-2 focus:ring-blue-500/30"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>per pagina</span>
          </div>
        )}
        <span className="hidden sm:block">
          {startItem}-{endItem} di {totalItems} risultati
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <motion.button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </motion.button>
        
        {start > 1 && (
          <>
            <button
              onClick={() => onPageChange?.(1)}
              className="w-9 h-9 rounded-lg text-sm text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors"
            >
              1
            </button>
            {start > 2 && <span className="px-1 text-theme-text-tertiary">...</span>}
          </>
        )}
        
        {pageNumbers.map((page) => (
          <motion.button
            key={page}
            onClick={() => onPageChange?.(page)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
              page === currentPage 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60'
            }`}
          >
            {page}
          </motion.button>
        ))}
        
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-theme-text-tertiary">...</span>}
            <button
              onClick={() => onPageChange?.(totalPages)}
              className="w-9 h-9 rounded-lg text-sm text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <motion.button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  );
};

// === BADGE FOR STATUS ===
export const StatusBadge = ({ status, labels = {} }) => {
  const statusConfig = {
    active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Attivo' },
    expired: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Scaduto' },
    pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', label: 'In attesa' },
    renewed: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Rinnovato' },
    success: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Completato' },
    error: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Errore' },
    warning: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Attenzione' },
    info: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Info' },
    default: { bg: 'bg-theme-bg-tertiary/60', text: 'text-theme-text-secondary', border: 'border-theme/50', label: 'N/D' },
  };
  
  const config = statusConfig[status] || statusConfig.default;
  const label = labels[status] || config.label;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.text.replace('text-', 'bg-')} mr-1.5`} />
      {label}
    </span>
  );
};

// === TAG BADGE ===
export const TagBadge = ({ children, color = 'blue', size = 'sm' }) => {
  const colors = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  return (
    <span className={`inline-flex items-center rounded-md font-medium border ${colors[color] || colors.blue} ${sizes[size] || sizes.sm}`}>
      {children}
    </span>
  );
};

// === CHECKBOX CELL ===
export const ProTableCheckbox = ({ checked, onChange, indeterminate = false }) => {
  return (
    <div className="flex items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => el && (el.indeterminate = indeterminate)}
        onChange={onChange}
        className="w-4 h-4 rounded border-theme bg-theme-bg-tertiary/60 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer"
      />
    </div>
  );
};

export default ProTable;
