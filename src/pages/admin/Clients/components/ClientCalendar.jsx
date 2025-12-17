// src/pages/admin/Clients/components/ClientCalendar.jsx
import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, FilePenLine, Trash2 } from 'lucide-react';
import { toDate } from '../../../../firebase';

/**
 * Calendario per visualizzare iscrizioni/scadenze clienti
 */
const ClientCalendar = ({
  meseCalendario,
  setMeseCalendario,
  calendarType,
  filter,
  clients,
  filteredClients,
  onDayClick,
  onEditClient,
  onDeleteClient,
  isAdmin
}) => {
  const giorniMese = eachDayOfInterval({
    start: startOfMonth(meseCalendario),
    end: endOfMonth(meseCalendario),
  });

  const clientiDelGiorno = (giorno) => {
    // Quando il filtro "In Scadenza" o "Scaduti" è attivo, forza visualizzazione scadenze
    if (filter === 'expiring' || filter === 'expired') {
      return clients.filter(c => {
        const expiry = toDate(c.scadenza);
        if (!expiry || !isSameDay(expiry, giorno)) return false;
        
        const now = new Date();
        const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        if (filter === 'expiring') {
          return daysToExpiry <= 15 && daysToExpiry > 0;
        } else if (filter === 'expired') {
          return daysToExpiry < 0;
        }
        return false;
      });
    }
    
    if (calendarType === 'scadenze') {
      return clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && isSameDay(expiry, giorno);
      });
    } else {
      return filteredClients.filter(c => {
        const created = toDate(c.createdAt);
        const start = toDate(c.startDate);
        const refDate = created || start;
        return refDate && isSameDay(refDate, giorno);
      });
    }
  };

  const showingExpiries = (filter === 'expiring' || filter === 'expired' || calendarType === 'scadenze');

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700 shadow-xl mx-3 sm:mx-6">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setMeseCalendario(addMonths(meseCalendario, -1))} 
          className="p-2 hover:bg-slate-700 rounded-lg transition"
        >
          <ChevronLeft size={18} className="text-slate-400" />
        </button>
        <h3 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
          <Calendar size={18} className="md:block hidden" /> {format(meseCalendario, "MMMM yyyy")}
        </h3>
        <button 
          onClick={() => setMeseCalendario(addMonths(meseCalendario, 1))} 
          className="p-2 hover:bg-slate-700 rounded-lg transition"
        >
          <ChevronRight size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-3 text-center text-xs md:text-sm">
        {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map((d, i) => (
          <div key={d + '-' + i} className="font-bold text-slate-400 py-2">
            <span className="md:hidden">{d}</span>
            <span className="hidden md:inline">{['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][i]}</span>
          </div>
        ))}
        {Array.from({ length: startOfMonth(meseCalendario).getDay() }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {giorniMese.map(giorno => {
          const clientiGiorno = clientiDelGiorno(giorno);
          
          const bgColor = showingExpiries
            ? (clientiGiorno.length > 0 ? 'bg-amber-900/40 border-amber-600 hover:bg-amber-900/60' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/70')
            : (clientiGiorno.length > 0 ? 'bg-rose-900/40 border-rose-600 hover:bg-rose-900/60' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/70');
          const cardBg = showingExpiries ? 'from-amber-600/30 to-orange-600/30' : 'from-rose-600/30 to-purple-600/30';
          const textColor = showingExpiries ? 'text-amber-300' : 'text-rose-300';
          const dotColor = showingExpiries ? 'bg-amber-500' : 'bg-rose-500';
          
          return (
            <div
              onClick={() => onDayClick(giorno)}
              key={giorno.toISOString()}
              className={`min-h-16 md:min-h-28 p-1 md:p-3 rounded-lg md:rounded-xl border transition-all cursor-pointer ${bgColor}`}
            >
              <p className="text-xs md:text-sm font-bold text-slate-300 mb-0.5 md:mb-1">{format(giorno, "d")}</p>
              <div className="space-y-1 md:space-y-1.5 max-h-12 md:max-h-20 overflow-y-auto">
                {clientiGiorno.slice(0, 2).map(c => (
                  <div
                    key={c.id}
                    className={`hidden md:flex bg-gradient-to-r ${cardBg} p-2 rounded-lg text-xs justify-between items-center`}
                  >
                    <div>
                      <p className={`font-semibold ${textColor}`}>{c.name}</p>
                      <p className="text-cyan-300">
                        {calendarType === 'scadenze' 
                          ? toDate(c.scadenza)?.toLocaleDateString('it-IT')
                          : (toDate(c.startDate) || toDate(c.createdAt))?.toLocaleDateString('it-IT')
                        }
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditClient(c.id); }} 
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <FilePenLine size={14} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteClient(c); }} 
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {clientiGiorno.length > 0 && (
                  <div className={`md:hidden w-2 h-2 ${dotColor} rounded-full mx-auto`}></div>
                )}
              </div>
              {clientiGiorno.length === 0 && (
                <p className="hidden md:block text-xs text-slate-500 italic mt-2">
                  {showingExpiries ? 'Nessuna scadenza' : 'Nessuna iscrizione'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientCalendar;
