import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Calendar = ({ reports = [], collaboratori = [], onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Protezione da undefined
  if (!Array.isArray(reports)) reports = [];
  if (!Array.isArray(collaboratori)) collaboratori = [];

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const monthReports = reports.filter(r => {
    if (!r?.date) return false;
    const reportDate = new Date(r.date);
    return (
      reportDate.getMonth() === currentMonth.getMonth() &&
      reportDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  const getDayColor = (day) => {
    const reportDateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const reportsForDay = monthReports.filter(r => r.date === reportDateStr);
    const allCompleted = reportsForDay.length === collaboratori.length &&
                         reportsForDay.every(r => r.eodReport && r.tracker);
    const someCompleted = reportsForDay.length > 0 && !allCompleted;

    // ROSSO solo se passato e NESSUN report
    if (reportDateStr < todayStr && reportsForDay.length === 0) return 'bg-red-600';
    if (someCompleted) return 'bg-yellow-500';
    if (allCompleted) return 'bg-green-500';
    return 'bg-gray-700'; // Futuro o oggi senza report
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  return (
    <motion.div 
      className="bg-slate-800/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-4 sm:mb-6 border border-white/10 overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-200">Calendario Report</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button 
            onClick={handlePrevMonth}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-slate-400 hover:text-rose-500 transition-colors rounded"
          >
            Prec
          </button>
          <span className="text-xs sm:text-sm text-slate-300 font-medium">
            {currentMonth.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}
          </span>
          <button 
            onClick={handleNextMonth}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-slate-400 hover:text-rose-500 transition-colors rounded"
          >
            Succ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map((day, i) => (
          <div key={`day-header-${i}`} className="text-[10px] sm:text-xs font-semibold text-slate-400 py-1 sm:py-2">
            <span className="sm:hidden">{day}</span>
            <span className="hidden sm:inline">{['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][i]}</span>
          </div>
        ))}

        {/* Celle vuote prima del primo giorno */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="h-8 sm:h-12" />
        ))}

        {/* Giorni del mese */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const dateStr = date.toISOString().split('T')[0];

          return (
            <motion.button
              key={day}
              onClick={() => onDateClick?.(date)}
              className={`h-8 sm:h-12 w-full rounded text-[10px] sm:text-sm font-medium text-white flex items-center justify-center ${getDayColor(day)} hover:scale-105 active:scale-95 transition-all`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {day}
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-3 sm:mt-6 text-[9px] sm:text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
          <span className="text-slate-400">Completi</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded"></div>
          <span className="text-slate-400">Parziali</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded"></div>
          <span className="text-slate-400">Mancanti</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-700 rounded"></div>
          <span className="text-slate-400">Nessun report</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Calendar;