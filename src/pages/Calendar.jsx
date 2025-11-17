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
      className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-200">Calendario Report</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="px-3 py-1 text-slate-400 hover:text-rose-500 transition-colors rounded"
          >
            Previous
          </button>
          <span className="mx-2 text-slate-300 font-medium">
            {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={handleNextMonth}
            className="px-3 py-1 text-slate-400 hover:text-rose-500 transition-colors rounded"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
          <div key={day} className="text-xs font-semibold text-slate-400 py-2">
            {day}
          </div>
        ))}

        {/* Celle vuote prima del primo giorno */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="h-12" />
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
              className={`h-12 w-full rounded-lg text-sm font-medium text-white flex items-center justify-center ${getDayColor(day)} hover:scale-105 active:scale-95 transition-all`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {day}
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-center gap-6 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-slate-400">Tutti completi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-slate-400">Parziali</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span className="text-slate-400">Mancanti (passati)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded"></div>
          <span className="text-slate-400">Nessun report</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Calendar;