import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SimpleCalendar = ({ reports = [], collaboratori = [], onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getReportsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reports.filter(r => r.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700 p-4 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button 
          onClick={previousMonth}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
        >
          <ChevronLeft size={18} className="text-slate-400" />
        </button>
        <h3 className="text-base font-bold text-slate-100">
          {monthNames[month]} {year}
        </h3>
        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
        >
          <ChevronRight size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const dateReports = getReportsForDate(date);
          const hasReports = dateReports.length > 0;
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <motion.button
              key={day}
              onClick={() => onDateClick && onDateClick(date)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={`
                w-10 h-10 rounded-lg text-sm font-semibold transition-all flex items-center justify-center
                ${isToday ? 'ring-2 ring-cyan-500' : ''}
                ${hasReports 
                  ? 'bg-emerald-900/50 border border-emerald-600/60 text-emerald-200 hover:bg-emerald-800/60' 
                  : 'bg-slate-800/40 border border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center gap-0">
                <span className="leading-none">{day}</span>
                {hasReports && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5"></div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded bg-emerald-900/50 border border-emerald-600/60"></div>
          <span className="text-xs text-slate-400">Con report</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded bg-slate-800/40 border border-slate-700/60"></div>
          <span className="text-[10px] text-slate-400">Senza report</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleCalendar;
