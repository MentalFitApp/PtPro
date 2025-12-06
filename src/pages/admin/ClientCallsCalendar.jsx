// src/pages/admin/ClientCallsCalendar.jsx
// Calendario dedicato alle chiamate con i clienti
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs } from 'firebase/firestore';
import { db, auth, toDate } from '../../firebase';
import { getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { 
  ChevronLeft, ChevronRight, Phone, Video, User, 
  Calendar, Clock, ArrowLeft, MessageCircle, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Giorni della settimana
const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

export default function ClientCallsCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState('month'); // 'month' | 'week'

  // Carica tutte le chiamate programmate
  useEffect(() => {
    const loadCalls = async () => {
      setLoading(true);
      const allCalls = [];
      
      try {
        const clientsSnap = await getDocs(getTenantCollection(db, 'clients'));
        
        for (const clientDoc of clientsSnap.docs) {
          const clientData = clientDoc.data();
          if (clientData.isOldClient) continue;
          
          try {
            const callsSnap = await getDocs(getTenantSubcollection(db, 'clients', clientDoc.id, 'calls'));
            callsSnap.forEach(callDoc => {
              const data = callDoc.data();
              
              // Chiamate programmate (next)
              if (callDoc.id === 'next' && data?.scheduledAt) {
                const scheduledDate = toDate(data.scheduledAt);
                if (scheduledDate) {
                  allCalls.push({
                    id: `${clientDoc.id}-next`,
                    clientId: clientDoc.id,
                    clientName: clientData.name || 'Cliente',
                    clientPhoto: clientData.photoURL,
                    scheduledAt: scheduledDate,
                    callType: data.callType || 'phone',
                    notes: data.notes || '',
                    status: 'scheduled'
                  });
                }
              }
              
              // Richieste di chiamata (pending)
              if (callDoc.id === 'request' && data?.status === 'pending') {
                const requestDate = toDate(data.requestedAt || data.createdAt);
                allCalls.push({
                  id: `${clientDoc.id}-request`,
                  clientId: clientDoc.id,
                  clientName: clientData.name || 'Cliente',
                  clientPhoto: clientData.photoURL,
                  scheduledAt: requestDate || new Date(),
                  callType: data.callType || 'phone',
                  notes: data.notes || data.message || '',
                  status: 'pending',
                  preferredTime: data.preferredTime
                });
              }
            });
          } catch (e) {
            console.error(`Error loading calls for ${clientData.name}:`, e);
          }
        }
        
        setCalls(allCalls.sort((a, b) => a.scheduledAt - b.scheduledAt));
      } catch (e) {
        console.error('Error loading calls:', e);
      }
      
      setLoading(false);
    };
    
    loadCalls();
  }, []);

  // Genera i giorni del mese corrente
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Aggiusta per iniziare da lunedì
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const days = [];
    
    // Giorni del mese precedente
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Giorni del mese corrente
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Giorni del mese successivo
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [currentDate]);

  // Chiamate per ogni giorno
  const callsByDay = useMemo(() => {
    const map = {};
    calls.forEach(call => {
      const key = call.scheduledAt.toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(call);
    });
    return map;
  }, [calls]);

  // Chiamate del giorno selezionato
  const selectedDayCalls = useMemo(() => {
    if (!selectedDay) return [];
    return callsByDay[selectedDay.toDateString()] || [];
  }, [selectedDay, callsByDay]);

  // Navigazione mese
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date) => selectedDay && date.toDateString() === selectedDay.toDateString();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Phone className="text-cyan-400" size={24} />
                Calendario Chiamate
              </h1>
              <p className="text-sm text-slate-400">Gestisci le chiamate con i tuoi clienti</p>
            </div>
          </div>
          
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Oggi
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Calendario */}
          <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-700/50">
              {DAYS.map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-slate-400">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayCalls = callsByDay[day.date.toDateString()] || [];
                const hasScheduled = dayCalls.some(c => c.status === 'scheduled');
                const hasPending = dayCalls.some(c => c.status === 'pending');
                
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(day.date)}
                    className={`
                      min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border-b border-r border-slate-700/30 cursor-pointer transition-colors
                      ${!day.isCurrentMonth ? 'bg-slate-900/30' : 'hover:bg-slate-700/30'}
                      ${isSelected(day.date) ? 'bg-cyan-500/10 ring-2 ring-cyan-500/50' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday(day.date) ? 'bg-cyan-500 text-white' : ''}
                      ${!day.isCurrentMonth ? 'text-slate-600' : 'text-slate-300'}
                    `}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Call indicators */}
                    <div className="space-y-0.5">
                      {dayCalls.slice(0, 3).map((call, cIdx) => (
                        <div 
                          key={cIdx}
                          className={`
                            text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate
                            ${call.status === 'pending' 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-cyan-500/20 text-cyan-400'
                            }
                          `}
                        >
                          <span className="hidden sm:inline">
                            {call.scheduledAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="sm:hidden">{call.clientName.charAt(0)}</span>
                          <span className="hidden sm:inline ml-1">{call.clientName.split(' ')[0]}</span>
                        </div>
                      ))}
                      {dayCalls.length > 3 && (
                        <div className="text-[10px] text-slate-500 pl-1">
                          +{dayCalls.length - 3} altre
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar - Dettagli giorno */}
          <div className="space-y-4">
            
            {/* Selected Day Details */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-cyan-400" />
                {selectedDay 
                  ? selectedDay.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Seleziona un giorno'
                }
              </h3>
              
              {selectedDay && (
                <div className="space-y-3">
                  {selectedDayCalls.length > 0 ? (
                    selectedDayCalls.map((call, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => navigate(`/clients/${call.clientId}`)}
                        className={`
                          p-3 rounded-xl cursor-pointer transition-colors
                          ${call.status === 'pending' 
                            ? 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20' 
                            : 'bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                            ${call.status === 'pending' ? 'bg-amber-500/30' : 'bg-cyan-500/30'}
                          `}>
                            {call.callType === 'video' ? (
                              <Video size={18} className={call.status === 'pending' ? 'text-amber-400' : 'text-cyan-400'} />
                            ) : (
                              <Phone size={18} className={call.status === 'pending' ? 'text-amber-400' : 'text-cyan-400'} />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{call.clientName}</p>
                              {call.status === 'pending' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-400">
                                  Richiesta
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock size={12} />
                              {call.scheduledAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              {call.preferredTime && ` - Preferenza: ${call.preferredTime}`}
                            </p>
                            
                            {call.notes && (
                              <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                <MessageCircle size={10} className="mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{call.notes}</span>
                              </p>
                            )}
                          </div>
                          
                          <ExternalLink size={14} className="text-slate-500 flex-shrink-0" />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <Phone size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nessuna chiamata</p>
                    </div>
                  )}
                </div>
              )}
              
              {!selectedDay && (
                <div className="text-center py-6 text-slate-500">
                  <Calendar size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Clicca su un giorno per vedere le chiamate</p>
                </div>
              )}
            </div>

            {/* Upcoming Calls Summary */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                Prossime chiamate
              </h3>
              
              <div className="space-y-2">
                {calls
                  .filter(c => c.scheduledAt >= new Date() && c.status === 'scheduled')
                  .slice(0, 5)
                  .map((call, idx) => {
                    const isToday = call.scheduledAt.toDateString() === new Date().toDateString();
                    const isTomorrow = call.scheduledAt.toDateString() === new Date(Date.now() + 86400000).toDateString();
                    
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          setSelectedDay(call.scheduledAt);
                          setCurrentDate(call.scheduledAt);
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 cursor-pointer hover:bg-slate-800/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isToday ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          {call.callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{call.clientName}</p>
                          <p className="text-xs text-slate-400">
                            {isToday ? 'Oggi' : isTomorrow ? 'Domani' : call.scheduledAt.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}
                            {' '}ore {call.scheduledAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                }
                
                {calls.filter(c => c.scheduledAt >= new Date() && c.status === 'scheduled').length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">Nessuna chiamata programmata</p>
                )}
              </div>
            </div>

            {/* Pending Requests */}
            {calls.filter(c => c.status === 'pending').length > 0 && (
              <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl border border-amber-500/30 p-4">
                <h3 className="font-semibold text-amber-300 mb-3 flex items-center gap-2">
                  <Phone size={16} />
                  Richieste in attesa
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-400 text-xs">
                    {calls.filter(c => c.status === 'pending').length}
                  </span>
                </h3>
                
                <div className="space-y-2">
                  {calls
                    .filter(c => c.status === 'pending')
                    .slice(0, 3)
                    .map((call, idx) => (
                      <div 
                        key={idx}
                        onClick={() => navigate(`/clients/${call.clientId}`)}
                        className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                          <Phone size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{call.clientName}</p>
                          <p className="text-xs text-amber-400/70">
                            {call.preferredTime || 'Da programmare'}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
