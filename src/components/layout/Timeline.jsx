import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, Clock, AlertCircle, 
  DollarSign, FileText, Activity, Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Timeline - Component per visualizzare cronologia attività
 */
export default function Timeline({ events = [], emptyState = "Nessuna attività" }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Activity size={48} className="mx-auto mb-3 opacity-50" />
        <p>{emptyState}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Linea verticale */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

      {/* Eventi */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <TimelineEvent key={event.id || index} event={event} isFirst={index === 0} />
        ))}
      </div>
    </div>
  );
}

function TimelineEvent({ event, isFirst }) {
  const { type, title, description, date, status, metadata } = event;

  const iconConfig = {
    payment: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    check: { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    anamnesi: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    renewal: { icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    pending: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  };

  const config = iconConfig[type] || iconConfig.pending;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: isFirst ? 0 : 0.1 }}
      className="relative pl-12"
    >
      {/* Icona */}
      <div className={`absolute left-0 p-2 rounded-full ${config.bg} border-2 border-slate-800`}>
        <Icon size={16} className={config.color} />
      </div>

      {/* Contenuto */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-200 text-sm">{title}</h4>
            {description && (
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            )}
          </div>
          {status && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
              {status}
            </span>
          )}
        </div>

        {/* Metadata */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-2">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="text-slate-500">{key}:</span>{' '}
                <span className="text-slate-300 font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Data */}
        {date && (
          <div className="mt-2 text-xs text-slate-500">
            {format(date, "d MMMM yyyy 'alle' HH:mm", { locale: it })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function getStatusClass(status) {
  const classes = {
    completed: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-amber-500/20 text-amber-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
  };
  return classes[status.toLowerCase()] || classes.pending;
}

/**
 * TimelineCompact - Versione compatta per sidebar
 */
export function TimelineCompact({ events = [], maxItems = 5 }) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayEvents.map((event, index) => (
        <div key={event.id || index} className="flex items-start gap-3 p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
          <div className={`p-1.5 rounded-full ${getTypeBackground(event.type)}`}>
            {getTypeIcon(event.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 truncate">{event.title}</p>
            <p className="text-xs text-slate-500 truncate">
              {event.date && format(event.date, 'd MMM yyyy', { locale: it })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getTypeBackground(type) {
  const backgrounds = {
    payment: 'bg-emerald-500/20',
    check: 'bg-blue-500/20',
    anamnesi: 'bg-purple-500/20',
    renewal: 'bg-amber-500/20',
  };
  return backgrounds[type] || 'bg-slate-500/20';
}

function getTypeIcon(type) {
  const icons = {
    payment: <DollarSign size={14} className="text-emerald-400" />,
    check: <Activity size={14} className="text-blue-400" />,
    anamnesi: <FileText size={14} className="text-purple-400" />,
    renewal: <Calendar size={14} className="text-amber-400" />,
  };
  return icons[type] || <Clock size={14} className="text-slate-400" />;
}
