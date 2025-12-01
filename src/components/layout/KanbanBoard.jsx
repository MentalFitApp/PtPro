import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical } from 'lucide-react';

/**
 * KanbanBoard - Vista Kanban per gestione stati
 * 
 * @param {Array} columns - Array di colonne [{id, title, color, items}]
 * @param {function} onItemMove - Callback quando item viene spostato
 * @param {function} renderCard - Funzione per renderizzare card
 */
export default function KanbanBoard({ 
  columns, 
  onItemMove,
  renderCard,
  emptyState = "Nessun elemento"
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState(null);

  const handleDragStart = (item, columnId) => {
    setDraggedItem(item);
    setDraggedFromColumn(columnId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (draggedItem && draggedFromColumn !== targetColumnId) {
      onItemMove?.(draggedItem, draggedFromColumn, targetColumnId);
    }
    
    setDraggedItem(null);
    setDraggedFromColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          renderCard={renderCard}
          emptyState={emptyState}
          isDraggedOver={draggedItem && draggedFromColumn !== column.id}
        />
      ))}
    </div>
  );
}

function KanbanColumn({ 
  column, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  renderCard,
  emptyState,
  isDraggedOver 
}) {
  const { id, title, color = 'blue', items = [], icon: Icon } = column;
  
  const colorClasses = {
    blue: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    amber: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    red: 'bg-red-500/20 border-red-500/50 text-red-400',
    purple: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    slate: 'bg-slate-500/20 border-slate-500/50 text-slate-400'
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between p-3 rounded-t-xl border ${colorClasses[color]}`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} />}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-bold">
          {items.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, id)}
        className={`flex-1 p-2 bg-slate-800/30 border border-slate-700/50 rounded-b-xl transition-all min-h-[200px] ${
          isDraggedOver ? 'bg-slate-700/50 border-blue-500/50' : ''
        }`}
      >
        <div className="space-y-2">
          <AnimatePresence>
            {items.length > 0 ? (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  draggable
                  onDragStart={() => onDragStart(item, id)}
                  className="group cursor-move"
                >
                  <div className="relative">
                    {/* Drag Handle */}
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical size={14} className="text-slate-500" />
                    </div>
                    
                    {/* Card Content */}
                    <div className="pl-6">
                      {renderCard(item)}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-slate-500 text-sm"
              >
                {emptyState}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * KanbanCard - Card predefinita per Kanban
 */
export function KanbanCard({ 
  title, 
  subtitle, 
  badge,
  onClick,
  actions,
  children 
}) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900/50 hover:bg-slate-800/70 border border-slate-700 hover:border-slate-600 rounded-lg p-3 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-200 text-sm truncate">{title}</h4>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge && (
          <div className="ml-2 flex-shrink-0">
            {badge}
          </div>
        )}
      </div>
      
      {children}
      
      {actions && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-700/50">
          {actions}
        </div>
      )}
    </div>
  );
}
