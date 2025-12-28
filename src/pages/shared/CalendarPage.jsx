import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection, getCoachId } from '../../config/tenant';
import { ChevronLeft, ChevronRight, Plus, X, Phone, Users, Trash2, Edit, Save, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, checkNotificationPermission, scheduleEventNotifications, setupForegroundMessageListener } from '../../utils/notifications';
import { notifyNewEvent } from '../../services/notificationService';
import CalendarNotesPanel from '../../components/calendar/CalendarNotesPanel';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';

export default function CalendarPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', endTime: '', type: 'call', note: '', durationMinutes: 30, participants: [], allDay: false });
  const [editingEvent, setEditingEvent] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [view, setView] = useState('month');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStartMin, setSelectStartMin] = useState(null);
  const [selectEndMin, setSelectEndMin] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [editingLeadDetails, setEditingLeadDetails] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', number: '', email: '', source: '', note: '', date: '', time: '' });
  const [modalShowDayEvents, setModalShowDayEvents] = useState(true);
  const dayViewRef = React.useRef(null);
  const [leadStatuses, setLeadStatuses] = useState([]);
  
  // Document title e keyboard shortcuts
  useDocumentTitle('Calendario');
  useEscapeKey(() => {
    setShowEventModal(false);
    setShowLeadDetails(false);
  });

  // Carica status lead dinamici
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const configDoc = await getDoc(getTenantDoc(db, 'settings', 'leadStatuses'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.statuses) {
            setLeadStatuses(data.statuses.filter(s => s.enabled));
          } else {
            setLeadStatuses([
              { id: 'showUp', label: 'Show Up', color: 'green', enabled: true },
              { id: 'chiuso', label: 'Chiuso', color: 'rose', enabled: true },
            ]);
          }
        } else {
          setLeadStatuses([
            { id: 'showUp', label: 'Show Up', color: 'green', enabled: true },
            { id: 'chiuso', label: 'Chiuso', color: 'rose', enabled: true },
          ]);
        }
      } catch (error) {
        console.error('Errore caricamento lead statuses:', error);
      }
    };
    loadStatuses();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    let unsubscribeEvents;
    let unsubscribeMessages;

    const init = async () => {
      // Carica ruolo utente
      const collabDoc = await getDoc(getTenantDoc(db, 'collaboratori', auth.currentUser.uid));
      if (collabDoc.exists()) {
        setUserRole(collabDoc.data().role || '');
      }
      
      const adminDoc = await getDoc(getTenantDoc(db, 'roles', 'admins'));
      const userIsAdmin = adminDoc.exists() && adminDoc.data().uids?.includes(auth.currentUser.uid);
      setIsAdmin(userIsAdmin);

      // Controlla stato notifiche
      const notifPermission = checkNotificationPermission();
      setNotificationsEnabled(notifPermission === 'granted');

      // Setup listener messaggi in foreground
      unsubscribeMessages = setupForegroundMessageListener((payload) => {
        console.log('Notifica ricevuta:', payload);
      });

      // Carica eventi (admin e collaboratori vedono tutti)
      let eventsQuery;
      if (userIsAdmin) {
        // Admin vede tutti gli eventi
        eventsQuery = getTenantCollection(db, 'calendarEvents');
      } else {
        // Collaboratori vedono tutti gli eventi
        eventsQuery = getTenantCollection(db, 'calendarEvents');
      }

      unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date // formato "YYYY-MM-DD"
        }));
        setEvents(eventsData);
        
        // Programma notifiche per eventi di oggi
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = eventsData.filter(e => e.date === today);
        if (notifPermission === 'granted' && todayEvents.length > 0) {
          scheduleEventNotifications(todayEvents);
        }
      });
    };

    init();

    return () => {
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [navigate]);

  // Auto-scroll alla ora corrente nella vista giornaliera
  useEffect(() => {
    if (view === 'day' && dayViewRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      // Scroll all'ora corrente - 2 ore (per avere margine sopra)
      const targetHour = Math.max(0, currentHour - 2);
      // Ogni ora è ~120px (min-h-[120px])
      const scrollPosition = targetHour * 120;
      
      // Piccolo ritardo per assicurarsi che il DOM sia renderizzato
      setTimeout(() => {
        dayViewRef.current?.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [view]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Giorni vuoti prima del primo giorno del mese
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Giorni del mese
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const formatDate = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = formatDate(day);
    return events.filter(event => event.date === dateStr);
  };

  // Helpers per viste settimana/giorno
  const formatISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  const getWeekStart = (d) => {
    const wd = d.getDay(); // 0=Dom
    const start = new Date(d);
    start.setHours(0,0,0,0);
    start.setDate(d.getDate() - wd);
    return start;
  };

  const getWeekDates = (anchor) => {
    const start = getWeekStart(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(start);
      dd.setDate(start.getDate() + i);
      return dd;
    });
  };

  const getEventsForDateObj = (dateObj) => {
    const dateStr = formatISO(dateObj);
    return events
      .filter(e => e.date === dateStr)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handlePrev = () => {
    if (view === 'month') return handlePrevMonth();
    if (view === 'week') return setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    if (view === 'day') return setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
  };

  const handleNext = () => {
    if (view === 'month') return handleNextMonth();
    if (view === 'week') return setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    if (view === 'day') return setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
  };

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDate(day);
    setShowEventModal(true);
    setEditingEvent(null);
    setNewEvent({ title: '', time: '', endTime: '', type: 'call', note: '', durationMinutes: 30, participants: [auth.currentUser?.uid || ''], allDay: false });
    setModalShowDayEvents(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || (!newEvent.allDay && !newEvent.time)) {
      toast.warning(newEvent.allDay ? 'Inserisci il titolo' : 'Inserisci titolo e ora');
      return;
    }

    try {
      const dateStr = formatDate(selectedDate);

      let eventTime = newEvent.time;
      let duration = newEvent.durationMinutes || 30;

      if (newEvent.allDay) {
        // Eventi di tutto il giorno
        eventTime = '00:00';
        duration = 1440; // 24 ore in minuti
      } else {
        // Calcola durata da endTime se presente per eventi normali
        if (newEvent.endTime) {
          const [sh, sm] = (newEvent.time || '00:00').split(':').map(Number);
          const [eh, em] = (newEvent.endTime || '00:00').split(':').map(Number);
          const startM = sh * 60 + sm;
          const endM = eh * 60 + em;
          if (endM <= startM) {
            toast.warning('L\'ora di fine deve essere successiva all\'inizio');
            return;
          }
          duration = endM - startM;
        }
      }

      await addDoc(getTenantCollection(db, 'calendarEvents'), {
        title: newEvent.title,
        time: eventTime,
        type: newEvent.type,
        note: newEvent.note,
        durationMinutes: duration,
        allDay: newEvent.allDay || false,
        date: dateStr,
        createdBy: auth.currentUser.uid,
        participants: [],
        timestamp: new Date()
      });

      // Invia notifica evento al coach
      try {
        const coachId = await getCoachId();
        if (coachId && coachId !== auth.currentUser.uid) {
          await notifyNewEvent({
            title: newEvent.title,
            date: dateStr,
            time: eventTime
          }, coachId, 'coach');
        }
      } catch (notifError) {
        // Notifica non inviata - non critico
      }

      setShowEventModal(false);
      setNewEvent({ title: '', time: '', endTime: '', type: 'call', note: '', durationMinutes: 30, participants: [auth.currentUser?.uid || ''], allDay: false });
      setModalShowDayEvents(true);
    } catch (error) {
      console.error('Errore aggiunta evento:', error);
      toast.error('Errore nell\'aggiungere l\'evento');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEvent.title || (!newEvent.allDay && !newEvent.time)) return;

    try {
      let eventTime = newEvent.time;
      let duration = newEvent.durationMinutes || 30;

      if (newEvent.allDay) {
        // Eventi di tutto il giorno
        eventTime = '00:00';
        duration = 1440; // 24 ore in minuti
      } else {
        // Calcola durata da endTime se presente per eventi normali
        if (newEvent.endTime) {
          const [sh, sm] = (newEvent.time || '00:00').split(':').map(Number);
          const [eh, em] = (newEvent.endTime || '00:00').split(':').map(Number);
          const startM = sh * 60 + sm;
          const endM = eh * 60 + em;
          if (endM <= startM) {
            toast.warning('L\'ora di fine deve essere successiva all\'inizio');
            return;
          }
          duration = endM - startM;
        }
      }

      await updateDoc(getTenantDoc(db, 'calendarEvents', editingEvent.id), {
        title: newEvent.title,
        time: eventTime,
        type: newEvent.type,
        note: newEvent.note,
        durationMinutes: duration,
        allDay: newEvent.allDay || false,

      });

      setShowEventModal(false);
      setEditingEvent(null);
      setNewEvent({ title: '', time: '', endTime: '', type: 'call', note: '', durationMinutes: 30, participants: [auth.currentUser?.uid || ''], allDay: false });
      setModalShowDayEvents(true);
    } catch (error) {
      console.error('Errore aggiornamento evento:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Eliminare questo evento?')) return;
    
    try {
      await deleteDoc(getTenantDoc(db, 'calendarEvents', eventId));
    } catch (error) {
      console.error('Errore eliminazione evento:', error);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    const isAllDay = event.allDay || (event.durationMinutes === 1440);

    setNewEvent({
      title: event.title,
      time: isAllDay ? '' : event.time,
      endTime: isAllDay ? '' : (()=>{
        const [h,m] = (event.time||'00:00').split(':').map(Number);
        const end = (h*60 + m) + (event.durationMinutes || 30);
        const eh = String(Math.floor(end/60)).padStart(2,'0');
        const em = String(end%60).padStart(2,'0');
        return `${eh}:${em}`;
      })(),
      type: event.type || 'call',
      note: event.note || '',
      durationMinutes: isAllDay ? 30 : (event.durationMinutes || 30),
      participants: event.participants || [auth.currentUser?.uid || ''],
      allDay: isAllDay
    });
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Le notifiche sono già attive, informa l'utente
      toast.info('Le notifiche sono attive! Puoi disattivarle dalle impostazioni del browser.');
    } else {
      // Richiedi permesso notifiche
      const token = await requestNotificationPermission(auth.currentUser.uid);
      if (token) {
        setNotificationsEnabled(true);
        toast.success('Notifiche attivate! Riceverai promemoria per le tue chiamate.');
        
        // Programma notifiche per eventi di oggi
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = events.filter(e => e.date === today);
        if (todayEvents.length > 0) {
          scheduleEventNotifications(todayEvents);
        }
      } else {
        toast.error('Permesso notifiche negato. Abilitale dalle impostazioni del browser.');
      }
    }
  };

  const monthYear = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(currentDate);
  const weekDates = getWeekDates(currentDate);
  const weekTitle = `${weekDates[0].toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} - ${weekDates[6].toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  const dayTitle = currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Carica collaboratori (solo admin) per selezionare partecipanti
  useEffect(() => {
    const load = async () => {
      if (!isAdmin) return;
      try {
        // collaboratoriList non utilizzato, commento il caricamento
        // const snap = await getDocs(query(getTenantCollection(db, 'collaboratori'), orderBy('nome')));
        // setCollaboratoriList(snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) })));
      } catch (e) {
        console.error('Errore caricamento collaboratori:', e);
      }
    };
    load();
  }, [isAdmin]);

  const openAdminNewEvent = () => {
    const base = new Date();
    const mins = base.getMinutes();
    const nextQuarter = Math.ceil(mins / 15) * 15;
    if (nextQuarter === 60) base.setHours(base.getHours() + 1);
    const sh = String(base.getHours()).padStart(2,'0');
    const sm = String(nextQuarter === 60 ? 0 : nextQuarter).padStart(2,'0');
    const start = `${sh}:${sm}`;
    const startTotal = parseInt(sh)*60 + parseInt(sm);
    const endTotal = startTotal + 60;
    const eh = String(Math.floor(endTotal/60)).padStart(2,'0');
    const em = String(endTotal%60).padStart(2,'0');
    setSelectedDate(currentDate.getDate());
    setEditingEvent(null);
    setNewEvent({ title: '', time: start, endTime: `${eh}:${em}`, type: 'meeting', note: '', durationMinutes: 60, participants: [auth.currentUser?.uid || ''], allDay: false });
    setModalShowDayEvents(false);
    setShowEventModal(true);
  };

  return (
    <div className="mobile-container py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 min-w-0">
        <h1 className="text-3xl font-bold text-slate-50">Calendario</h1>
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          {/* Switch vista (anche mobile) */}
          <div className="flex items-center bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden text-xs sm:text-sm">
            <button onClick={() => setView('month')} className={`px-3 py-1.5 ${view==='month'?'bg-slate-700 text-white':'text-slate-300 hover:text-white'}`}>Mese</button>
            <button onClick={() => setView('week')} className={`px-3 py-1.5 border-l border-slate-700 ${view==='week'?'bg-slate-700 text-white':'text-slate-300 hover:text-white'}`}>Settimana</button>
            <button onClick={() => setView('day')} className={`px-3 py-1.5 border-l border-slate-700 ${view==='day'?'bg-slate-700 text-white':'text-slate-300 hover:text-white'}`}>Giorno</button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleNotifications}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              notificationsEnabled
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-800/30 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
            }`}
          >
            {notificationsEnabled ? (
              <>
                <Bell className="w-5 h-5" />
                <span className="hidden sm:inline">Notifiche Attive</span>
              </>
            ) : (
              <>
                <BellOff className="w-5 h-5" />
                <span className="hidden sm:inline">Attiva Notifiche</span>
              </>
            )}
          </motion.button>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handlePrev}
              className="p-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-200 rounded-lg border border-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="flex-1 min-w-0 text-sm sm:text-xl font-semibold text-slate-200 text-center capitalize truncate">
              {view === 'month' ? monthYear : view === 'week' ? weekTitle : dayTitle}
            </span>
            <button
              onClick={handleNext}
              className="p-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-200 rounded-lg border border-slate-600"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-200 rounded-lg border border-slate-600 text-xs sm:text-sm"
            >
              Oggi
            </button>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openAdminNewEvent}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/25"
              >
                <Plus className="w-5 h-5" /> Nuovo evento
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="sm:hidden mb-4">
          <button
            onClick={openAdminNewEvent}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-rose-600 to-pink-600 text-white"
          >
            <Plus className="w-5 h-5" /> Nuovo evento
          </button>
        </div>
      )}

      {/* Calendario - Vista Mese */}
      {view === 'month' && (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendario Mensile */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700">
          {/* Intestazione giorni settimana */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
              <div key={day} className="text-center text-slate-400 font-semibold text-[11px] sm:text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Giorni del mese */}
          <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dateStr = day ? formatDate(day) : '';
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = dateStr === todayStr;

            return (
              <motion.div
                key={index}
                whileHover={day ? { scale: 1.02 } : {}}
                className={`min-h-[80px] sm:min-h-[100px] p-2 rounded-lg border transition-colors min-w-0 ${
                  day
                    ? isToday
                      ? 'bg-rose-900/30 border-rose-500/50 cursor-pointer hover:bg-rose-900/40'
                      : 'bg-slate-700/50 border-slate-600 cursor-pointer hover:bg-slate-700/70'
                    : 'bg-transparent border-transparent'
                }`}
                onClick={() => handleDayClick(day)}
              >
                {day && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-rose-300' : 'text-slate-200'}`}>
                      {day}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.type === 'lead') {
                              setSelectedLead(event);
                              setShowLeadDetails(true);
                            } else {
                              // Per call, meeting, altri eventi: apri modal modifica
                              handleEditEvent(event);
                              setSelectedDate(day);
                              setModalShowDayEvents(false);
                              setShowEventModal(true);
                            }
                          }}
                          className={`w-2 h-2 rounded-full cursor-pointer hover:ring-2 ${
                            event.type === 'lead'
                              ? 'bg-emerald-500 hover:ring-emerald-400'
                              : event.type === 'call'
                              ? 'bg-blue-500 hover:ring-blue-400'
                              : 'bg-purple-500 hover:ring-purple-400'
                          }`}
                          title={`${event.time} - ${event.title}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
          </div>
        </div>

        {/* Note/Tasks Panel per Vista Mensile */}
        <CalendarNotesPanel currentDate={currentDate} />
      </div>
      )}

      {/* Calendario - Vista Settimana */}
      {view === 'week' && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700">
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {weekDates.map((d, idx) => {
              const dateStr = formatISO(d);
              const dayEvents = getEventsForDateObj(d);
              const isToday = dateStr === todayStr;
              return (
                <div key={idx} className={`p-2 sm:p-3 rounded-lg border ${isToday ? 'bg-rose-900/30 border-rose-500/50' : 'bg-slate-700/50 border-slate-600'}`}>
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-[11px] sm:text-sm font-semibold text-slate-200 capitalize">{d.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                    <div className={`text-[11px] sm:text-sm font-bold ${isToday ? 'text-rose-300' : 'text-slate-100'}`}>{d.getDate()}</div>
                  </div>
                  <div className="space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">Nessun evento</div>
                    ) : (
                      dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          onClick={() => { 
                            if (ev.type === 'lead') { 
                              setSelectedLead(ev); 
                              setShowLeadDetails(true); 
                            } else {
                              // Per call, meeting, altri eventi: apri modal modifica
                              handleEditEvent(ev);
                              setSelectedDate(d.getDate());
                              setCurrentDate(d);
                              setModalShowDayEvents(false);
                              setShowEventModal(true);
                            }
                          }}
                          className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                            ev.type === 'lead' 
                              ? 'bg-emerald-600/80 text-emerald-100 hover:bg-emerald-500/80' 
                              : ev.type === 'call' 
                              ? 'bg-blue-600/80 text-blue-100 hover:bg-blue-500/80' 
                              : 'bg-purple-600/80 text-purple-100 hover:bg-purple-500/80'
                          }`}
                          title={ev.title}
                        >
                          <div className="text-[11px] font-mono opacity-90">{ev.time}</div>
                          <div className="text-xs truncate">{ev.title}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendario - Vista Giorno */}
      {view === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-6">
          {/* Colonna principale calendario */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-3 sm:p-6 border border-slate-700">
            <div className="mb-4">
              <div className="text-slate-300 text-sm">{currentDate.toLocaleDateString('it-IT', { weekday: 'long' })}</div>
              <div className="text-2xl font-bold text-slate-100">{currentDate.toLocaleDateString('it-IT')}</div>
              <div className="text-xs text-slate-400 mt-1">📅 Vista giornaliera: 00:00 - 23:45 (tutte le ore)</div>
            </div>
            {/* Vista ad ore con selezione a 15' - FULL DAY */}
            <div
              ref={dayViewRef}
              className="relative h-[70vh] overflow-auto rounded-lg border border-slate-700 select-none"
            onMouseUp={() => {
              if (!isSelecting || selectStartMin === null || selectEndMin === null) return;
              const start = Math.min(selectStartMin, selectEndMin);
              const end = Math.max(selectStartMin, selectEndMin) + 15;
              const sh = String(Math.floor(start/60)).padStart(2,'0');
              const sm = String(start%60).padStart(2,'0');
              const eh = String(Math.floor(end/60)).padStart(2,'0');
              const em = String(end%60).padStart(2,'0');
              setIsSelecting(false);
              setSelectStartMin(null);
              setSelectEndMin(null);
              setSelectedDate(currentDate.getDate());
              setEditingEvent(null);
              setNewEvent({ title: '', time: `${sh}:${sm}`, endTime: `${eh}:${em}`, type: 'meeting', note: '', durationMinutes: end-start });
              setModalShowDayEvents(false);
              setShowEventModal(true);
            }}
            onMouseLeave={() => {
              if (!isSelecting || selectStartMin === null || selectEndMin === null) return;
              const start = Math.min(selectStartMin, selectEndMin);
              const end = Math.max(selectStartMin, selectEndMin) + 15;
              const sh = String(Math.floor(start/60)).padStart(2,'0');
              const sm = String(start%60).padStart(2,'0');
              const eh = String(Math.floor(end/60)).padStart(2,'0');
              const em = String(end%60).padStart(2,'0');
              setIsSelecting(false);
              setSelectStartMin(null);
              setSelectEndMin(null);
              setSelectedDate(currentDate.getDate());
              setEditingEvent(null);
              setNewEvent({ title: '', time: `${sh}:${sm}`, endTime: `${eh}:${em}`, type: 'meeting', note: '', durationMinutes: end-start });
              setModalShowDayEvents(false);
              setShowEventModal(true);
            }}
          >
            {(() => {
              const dayEvents = getEventsForDateObj(currentDate).map(ev => ({
                ...ev,
                startMin: (()=>{ const [h,m]=(ev.time||'00:00').split(':').map(Number); return h*60+m; })(),
                dur: ev.durationMinutes || 30,
              }));
              const hours = Array.from({ length: 24 }, (_,h)=>h); // Ore 00:00-23:00 (24 ore)
              
              // Calcola posizione ora corrente
              const now = new Date();
              const isToday = now.getDate() === currentDate.getDate() && 
                             now.getMonth() === currentDate.getMonth() && 
                             now.getFullYear() === currentDate.getFullYear();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const currentTimePosition = (currentMinutes / 60) * 120; // 120px per ora
              
              return (
                <div className="relative">
                  {hours.map(hh => {
                    const hourLabel = String(hh).padStart(2,'0') + ':00';
                    const baseMin = hh*60;
                    const quarters = [0,15,30,45];
                    return (
                      <div key={hh} className="grid grid-cols-[80px,1fr] border-b border-slate-700/60 min-h-[120px]">
                        <div
                          className="px-2 py-3 text-sm text-slate-400 font-mono select-none cursor-pointer hover:text-slate-200 flex items-start font-bold"
                          onClick={() => {
                            // Click sull'ora: seleziona 60 minuti
                            const start = baseMin;
                            const end = baseMin + 60;
                            const sh = String(Math.floor(start/60)).padStart(2,'0');
                            const sm = String(start%60).padStart(2,'0');
                            const eh = String(Math.floor(end/60)).padStart(2,'0');
                            const em = String(end%60).padStart(2,'0');
                            setSelectedDate(currentDate.getDate());
                            setEditingEvent(null);
                            setNewEvent({ title: '', time: `${sh}:${sm}`, endTime: `${eh}:${em}`, type: 'meeting', note: '', durationMinutes: end-start });
                            setModalShowDayEvents(false);
                            setShowEventModal(true);
                          }}
                        >
                          {hourLabel}
                        </div>
                        <div className="py-0.5 pr-1">
                          <div className="grid grid-rows-4 gap-0.5">
                            {quarters.map(q => {
                              const min = baseMin + q;
                              const slotEnd = min + 15;
                              // Trova tutti gli eventi che si sovrappongono con questo slot (anche parzialmente)
                              const overlappingEvents = dayEvents.filter(e => {
                                const eventEnd = e.startMin + e.dur;
                                // L'evento si sovrappone se inizia prima della fine dello slot E finisce dopo l'inizio dello slot
                                return e.startMin < slotEnd && eventEnd > min;
                              });
                              // Raggruppa eventi che iniziano nello stesso slot di 15 minuti
                              const eventsInThisSlot = overlappingEvents.filter(e => e.startMin >= min && e.startMin < slotEnd);
                              const continuingEvents = overlappingEvents.filter(e => e.startMin < min);
                              
                              const inSelection = isSelecting && selectStartMin !== null && selectEndMin !== null &&
                                min >= Math.min(selectStartMin, selectEndMin) && min < Math.max(selectStartMin, selectEndMin);
                              return (
                                <div
                                  key={q}
                                  className={`relative rounded ${inSelection ? 'bg-rose-500/20' : 'bg-slate-900/20'} border border-slate-800/50 h-[28px]`}
                                  onMouseDown={() => { setIsSelecting(true); setSelectStartMin(min); setSelectEndMin(min); }}
                                  onMouseEnter={() => { if (isSelecting) setSelectEndMin(min); }}
                                  onMouseUp={() => {
                                    if (!isSelecting) return;
                                    // Il contenitore gestisce l'apertura del modal su mouseup
                                  }}
                                  onClick={() => {
                                    if (isSelecting) return;
                                    // Click rapido sullo slot: default 30'
                                    const start = min;
                                    const end = min + 30;
                                    const sh = String(Math.floor(start/60)).padStart(2,'0');
                                    const sm = String(start%60).padStart(2,'0');
                                    const eh = String(Math.floor(end/60)).padStart(2,'0');
                                    const em = String(end%60).padStart(2,'0');
                                    setSelectedDate(currentDate.getDate());
                                    setEditingEvent(null);
                                    setNewEvent({ title: '', time: `${sh}:${sm}`, endTime: `${eh}:${em}`, type: 'call', note: '', durationMinutes: end-start });
                                    setModalShowDayEvents(false);
                                    setShowEventModal(true);
                                  }}
                                >
                                  {eventsInThisSlot.length > 0 ? (
                                    <div className="absolute inset-0 m-0.5 flex gap-0.5 overflow-visible">
                                      {eventsInThisSlot.map((starter) => (
                                        <div 
                                          key={starter.id}
                                          className={`flex-1 p-1 rounded text-[10px] shadow cursor-pointer overflow-hidden ${
                                            starter.type === 'lead' ? 'bg-emerald-600/90 text-emerald-100 hover:bg-emerald-600' : 
                                            starter.type === 'call' ? 'bg-blue-600/90 text-blue-100 hover:bg-blue-600' : 
                                            'bg-purple-600/90 text-purple-100 hover:bg-purple-600'
                                          }`}
                                          style={{ minWidth: eventsInThisSlot.length > 1 ? `${100 / eventsInThisSlot.length}%` : '100%' }}
                                          onClick={(e)=>{ 
                                            e.stopPropagation(); 
                                            if (starter.type==='lead'){ 
                                              setSelectedLead(starter); 
                                              setShowLeadDetails(true);
                                            } else { 
                                              handleEditEvent(starter); 
                                              setModalShowDayEvents(false); 
                                              setShowEventModal(true);
                                            } 
                                          }}
                                        >
                                          <div className="font-medium truncate leading-tight">{starter.title}</div>
                                          <div className="text-[9px] opacity-90 font-mono">{starter.time}</div>
                                          {starter.clientName && (
                                            <div className="text-[9px] opacity-80 truncate">{starter.clientName}</div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : continuingEvents.length > 0 ? (
                                    <div className="absolute inset-y-0 left-0 right-0 mx-1 my-2 rounded bg-slate-200/10" />
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Indicatore ora corrente */}
                  {isToday && (
                    <div 
                      className="absolute left-0 right-0 pointer-events-none z-10"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-rose-500 ml-2 shadow-lg shadow-rose-500/50" />
                        <div className="flex-1 h-0.5 bg-rose-500 shadow-lg shadow-rose-500/50" />
                      </div>
                      <div className="absolute left-16 -top-2 text-xs font-bold text-rose-500 bg-slate-900/90 px-2 py-0.5 rounded shadow-lg">
                        {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

          {/* Colonna laterale Note/Tasks */}
          <CalendarNotesPanel currentDate={currentDate} />
        </div>
      )}

      {/* Modale Evento */}
      <AnimatePresence>
        {showEventModal && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-900/95 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              {/* Header fisso - non scrolla */}
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
                <h3 className="text-lg sm:text-2xl font-bold text-slate-100">
                  {formatDate(selectedDate)} - {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toLocaleDateString('it-IT', { weekday: 'long' })}
                </h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                  }}
                  className="text-slate-400 hover:text-rose-400 hover:bg-slate-800 p-2 rounded-lg transition-all flex-shrink-0"
                  aria-label="Chiudi"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Contenuto scrollabile */}
              <div className="overflow-y-auto flex-1 p-4 sm:p-6">

              {/* Lista eventi del giorno (opzionale) */}
              {modalShowDayEvents && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-slate-200">Eventi del giorno</h4>
                </div>
                <div className="space-y-2">
                  {getEventsForDay(selectedDate).length === 0 ? (
                    <p className="text-slate-400 text-sm italic">Nessun evento</p>
                  ) : (
                    (() => {
                      const sortedEvents = getEventsForDay(selectedDate).sort((a, b) => {
                        // Prima gli eventi di tutto il giorno, poi ordinati per ora
                        const aAllDay = a.allDay || a.durationMinutes === 1440;
                        const bAllDay = b.allDay || b.durationMinutes === 1440;

                        if (aAllDay && !bAllDay) return -1;
                        if (!aAllDay && bAllDay) return 1;

                        const timeA = a.time || '00:00';
                        const timeB = b.time || '00:00';
                        return timeA.localeCompare(timeB);
                      });
                      const now = new Date();
                      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                      let currentTimeInserted = false;
                      
                      return sortedEvents.map((event, idx) => {
                        const isAllDay = event.allDay || event.durationMinutes === 1440;
                        const showTimeline = !currentTimeInserted && !isAllDay && event.time > currentTime;
                        if (showTimeline) currentTimeInserted = true;
                        
                        return (
                          <React.Fragment key={event.id}>
                            {showTimeline && (
                              <div className="flex items-center gap-2 py-2">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                                  <span className="text-rose-400 font-mono font-semibold">{currentTime}</span>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-rose-500 via-transparent to-transparent"></div>
                              </div>
                            )}
                            <div
                              onClick={() => {
                                if (event.type === 'lead') {
                                  // Chiudi il modal del giorno e apri dettagli lead
                                  setShowEventModal(false);
                                  setSelectedLead(event);
                                  setShowLeadDetails(true);
                                } else {
                                  // Per call/meeting: passa alla modalità modifica
                                  handleEditEvent(event);
                                  setModalShowDayEvents(false);
                                }
                              }}
                              className={`bg-slate-800/70 p-3 rounded-lg border border-slate-600 flex justify-between items-start shadow-glow cursor-pointer hover:bg-slate-800/90 transition-colors`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {isAllDay ? (
                                    <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-slate-900 font-bold">🌅</span>
                                    </div>
                                  ) : event.type === 'lead' ? (
                                    <Phone size={16} className="text-emerald-400" />
                                  ) : event.type === 'call' ? (
                                    <Phone size={16} className="text-blue-400" />
                                  ) : (
                                    <Users size={16} className="text-purple-400" />
                                  )}
                                  <span className="text-sm font-mono text-slate-400">
                                    {isAllDay ? 'Tutto il giorno' : event.time}
                                  </span>
                                  <span className="font-semibold text-slate-100">{event.title}</span>
                                  {event.type === 'lead' && (
                                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">LEAD</span>
                                  )}
                                </div>
                                {event.note && <p className="text-sm text-slate-300 mt-1">{event.note}</p>}
                                <p className="text-xs text-slate-400 mt-1">
                                  {event.type === 'lead' ? 'Click per dettagli →' : 'Click per modificare →'}
                                </p>
                              </div>
                              {event.type !== 'lead' && (isAdmin || userRole) && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditEvent(event)}
                                    className="text-cyan-400 hover:text-cyan-300"
                                    title="Modifica"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="text-red-400 hover:text-red-300"
                                    title="Elimina"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                            {!currentTimeInserted && idx === sortedEvents.length - 1 && (
                              <div className="flex items-center gap-2 py-2">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                                  <span className="text-rose-400 font-mono font-semibold">{currentTime}</span>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-rose-500 via-transparent to-transparent"></div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
              )}

              {/* Form nuovo/modifica evento */}
              <div className="border-t border-slate-700 pt-6">
                <h4 className="text-lg font-semibold text-slate-200 mb-4">
                  {editingEvent ? 'Modifica evento' : 'Nuovo evento'}
                </h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Titolo evento"
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                  />

                  {/* Toggle evento di tutto il giorno */}
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <div className="font-medium text-white">Evento di tutto il giorno</div>
                      <div className="text-sm text-slate-400">L'evento dura l'intera giornata</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newEvent.allDay || false}
                        onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {!newEvent.allDay && (
                    <>
                      <input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                      <input
                        type="time"
                        value={newEvent.endTime || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                        placeholder="Ora fine"
                      />
                    </>
                  )}

                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="call">Chiamata</option>
                    <option value="meeting">Riunione</option>
                  </select>
                  {!newEvent.allDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Durata</label>
                        <select
                          value={newEvent.durationMinutes}
                          onChange={(e) => setNewEvent({ ...newEvent, durationMinutes: parseInt(e.target.value, 10) })}
                          className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                        >
                          <option value={15}>15 minuti</option>
                          <option value={30}>30 minuti</option>
                          <option value={45}>45 minuti</option>
                          <option value={60}>60 minuti</option>
                          <option value={90}>90 minuti</option>
                          <option value={120}>120 minuti</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {/* Visibilità eventi gestita da regole: tutti i collaboratori possono vedere. */}
                  <textarea
                    value={newEvent.note}
                    onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
                    placeholder="Note (opzionale)"
                    rows="3"
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    {editingEvent ? (
                      <>
                        <Save size={20} /> Salva Modifiche
                      </>
                    ) : (
                      <>
                        <Plus size={20} /> Aggiungi Evento
                      </>
                    )}
                  </button>
                </div>
              </div>
              {/* Fine contenuto scrollabile */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale Dettagli Lead */}
      <AnimatePresence>
        {showLeadDetails && selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLeadDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 w-full max-w-md max-h-[90vh] flex flex-col"
            >
              {/* Header fisso */}
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-emerald-500/20 rounded-xl">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-100">Dettagli Lead</h3>
                    <p className="text-xs sm:text-sm text-emerald-400">Chiamata Programmata</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLeadDetails(false)}
                  className="text-slate-400 hover:text-rose-400 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Contenuto scrollabile */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {selectedLead.leadData && !editingLeadDetails && (
                  <div className="space-y-4">
                    {(!isAdmin && selectedLead.createdBy !== (auth.currentUser?.uid || '')) && (
                      <div className="text-xs text-amber-300 bg-amber-900/30 border border-amber-700/40 px-3 py-2 rounded-lg">
                        Solo lettura: non puoi modificare questo lead.
                      </div>
                    )}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Nome</label>
                    <p className="text-lg font-semibold text-slate-100 mt-1">{selectedLead.leadData.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <label className="text-xs text-slate-400 uppercase tracking-wide">Data</label>
                      <p className="text-sm font-medium text-slate-100 mt-1">
                        {new Date(selectedLead.date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <label className="text-xs text-slate-400 uppercase tracking-wide">Ora</label>
                      <p className="text-sm font-medium text-slate-100 mt-1">{selectedLead.time}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Telefono</label>
                    <p className="text-lg font-mono text-emerald-400 mt-1">{selectedLead.leadData.number}</p>
                  </div>

                  {selectedLead.leadData.email && (
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <label className="text-xs text-slate-400 uppercase tracking-wide">Email</label>
                      <p className="text-sm text-slate-100 mt-1">{selectedLead.leadData.email}</p>
                    </div>
                  )}

                  {selectedLead.leadData.source && (
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <label className="text-xs text-slate-400 uppercase tracking-wide">Provenienza</label>
                      <p className="text-sm text-slate-100 mt-1">{selectedLead.leadData.source}</p>
                    </div>
                  )}

                  {selectedLead.leadData.note && (
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                      <label className="text-xs text-slate-400 uppercase tracking-wide">Note</label>
                      <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{selectedLead.leadData.note}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {(isAdmin || selectedLead.createdBy === (auth.currentUser?.uid || '')) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          try {
                            // Carica il documento lead completo da Firestore
                            if (selectedLead.leadId) {
                              const leadDoc = await getDoc(getTenantDoc(db, 'leads', selectedLead.leadId));
                              if (leadDoc.exists()) {
                                const leadData = leadDoc.data();
                                setLeadForm({
                                  name: leadData.name || '',
                                  number: leadData.number || '',
                                  email: leadData.email || '',
                                  source: leadData.source || '',
                                  note: leadData.note || '',
                                  date: leadData.dataPrenotazione || selectedLead.date || '',
                                  time: leadData.oraPrenotazione || selectedLead.time || '',
                                  dialed: leadData.dialed ?? 0,
                                  amount: leadData.amount ?? '',
                                  mesi: leadData.mesi ?? '',
                                  chiuso: leadData.chiuso ?? false,
                                  showUp: leadData.showUp ?? false,
                                  offer: leadData.offer ?? false,
                                  riprenotato: leadData.riprenotato ?? false,
                                  target: leadData.target ?? false,
                                  settingCall: leadData.settingCall ?? false
                                });
                              } else {
                                // Fallback se il lead non esiste più
                                setLeadForm({
                                  name: selectedLead.leadData.name || '',
                                  number: selectedLead.leadData.number || '',
                                  email: selectedLead.leadData.email || '',
                                  source: selectedLead.leadData.source || '',
                                  note: selectedLead.leadData.note || '',
                                  date: selectedLead.date || '',
                                  time: selectedLead.time || ''
                                });
                              }
                            } else {
                              // Nessun leadId, usa solo i dati embedded
                              setLeadForm({
                                name: selectedLead.leadData.name || '',
                                number: selectedLead.leadData.number || '',
                                email: selectedLead.leadData.email || '',
                                source: selectedLead.leadData.source || '',
                                note: selectedLead.leadData.note || '',
                                date: selectedLead.date || '',
                                time: selectedLead.time || ''
                              });
                            }
                            setEditingLeadDetails(true);
                          } catch (err) {
                            console.error('Errore caricamento lead:', err);
                            toast.error('Errore nel caricamento dei dati del lead');
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                      >
                        <Edit className="w-5 h-5" />
                        Modifica
                      </motion.button>
                    )}
                    {(isAdmin || selectedLead.createdBy === (auth.currentUser?.uid || '')) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          const confirmed = await confirmDelete('questa chiamata dal calendario');
                          if (!confirmed) return;
                          try {
                            // Elimina l'evento dal calendario
                            await deleteDoc(getTenantDoc(db, 'calendarEvents', selectedLead.id));
                            toast.success('Chiamata rimossa dal calendario');
                            setShowLeadDetails(false);
                            setSelectedLead(null);
                          } catch (err) {
                            console.error('Errore eliminazione evento:', err);
                            toast.error('Errore nella rimozione');
                          }
                        }}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                        Elimina
                      </motion.button>
                    )}
                  </div>
                  <div className="grid grid-cols-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowLeadDetails(false);
                        if (isAdmin) {
                          navigate('/collaboratori');
                        } else {
                          navigate('/collaboratore/dashboard');
                        }
                      }}
                      className="w-full bg-slate-800/60 hover:bg-slate-800 text-white border border-slate-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      Apri in dashboard
                    </motion.button>
                  </div>
                </div>
              )}

              {selectedLead.leadData && editingLeadDetails && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <input className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" placeholder="Nome" value={leadForm.name} onChange={(e)=>setLeadForm({...leadForm,name:e.target.value})} />
                    <input className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" placeholder="Telefono" value={leadForm.number} onChange={(e)=>setLeadForm({...leadForm,number:e.target.value})} />
                    <input className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" placeholder="Email" value={leadForm.email} onChange={(e)=>setLeadForm({...leadForm,email:e.target.value})} />
                    <input className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" placeholder="Provenienza" value={leadForm.source} onChange={(e)=>setLeadForm({...leadForm,source:e.target.value})} />
                    <textarea className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" placeholder="Note" rows="3" value={leadForm.note} onChange={(e)=>setLeadForm({...leadForm,note:e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" value={leadForm.date} onChange={(e)=>setLeadForm({...leadForm,date:e.target.value})} />
                      <input type="time" className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" value={leadForm.time} onChange={(e)=>setLeadForm({...leadForm,time:e.target.value})} />
                    </div>
                    {/* Campi extra lead: dialed & co. */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Dialed</label>
                        <input type="number" min="0" className="w-full p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" value={leadForm.dialed ?? 0} onChange={(e)=>setLeadForm({...leadForm, dialed: parseInt(e.target.value||'0',10)})} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Importo (cash)</label>
                        <input type="number" min="0" className="w-full p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" value={leadForm.amount ?? ''} onChange={(e)=>setLeadForm({...leadForm, amount: e.target.value === '' ? '' : parseFloat(e.target.value)})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Mesi</label>
                        <input type="number" min="0" className="w-full p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100" value={leadForm.mesi ?? ''} onChange={(e)=>setLeadForm({...leadForm, mesi: e.target.value === '' ? '' : parseInt(e.target.value,10)})} />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-slate-200">
                          <input type="checkbox" checked={!!leadForm.offer} onChange={(e)=>setLeadForm({...leadForm, offer: e.target.checked})} /> 
                          Warm
                        </label>
                      </div>
                    </div>
                    
                    {/* Status Lead Dinamici */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Status Lead</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {leadStatuses.map(status => (
                          <label key={status.id} className="flex items-center gap-2 text-slate-200 p-2 rounded-lg bg-slate-800/20 border border-slate-700/30 hover:bg-slate-700/40 transition-colors cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!leadForm[status.id]} 
                              onChange={(e)=>setLeadForm({...leadForm, [status.id]: e.target.checked})}
                              className="accent-blue-600"
                            />
                            <span className={`w-2 h-2 rounded-full bg-${status.color}-500`} />
                            <span className="text-sm">{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Altri checkboxes statici */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Altri Flag</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 text-slate-200 p-2 rounded-lg bg-slate-800/20 border border-slate-700/30 hover:bg-slate-700/40 transition-colors cursor-pointer">
                          <input type="checkbox" checked={!!leadForm.riprenotato} onChange={(e)=>setLeadForm({...leadForm, riprenotato: e.target.checked})} className="accent-blue-600" />
                          <span className="text-sm">Riprenotato</span>
                        </label>
                        <label className="flex items-center gap-2 text-slate-200 p-2 rounded-lg bg-slate-800/20 border border-slate-700/30 hover:bg-slate-700/40 transition-colors cursor-pointer">
                          <input type="checkbox" checked={!!leadForm.settingCall} onChange={(e)=>setLeadForm({...leadForm, settingCall: e.target.checked})} className="accent-blue-600" />
                          <span className="text-sm">Setting Call</span>
                        </label>
                        <label className="flex items-center gap-2 text-slate-200 p-2 rounded-lg bg-slate-800/20 border border-slate-700/30 hover:bg-slate-700/40 transition-colors cursor-pointer">
                          <input type="checkbox" checked={!!leadForm.target} onChange={(e)=>setLeadForm({...leadForm, target: e.target.checked})} className="accent-blue-600" />
                          <span className="text-sm">Target</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          if (!selectedLead.leadId) {
                            toast.warning('Lead non collegato (leadId mancante).');
                            return;
                          }
                          // Aggiorna lead con status dinamici
                          const leadUpdateData = {
                            name: leadForm.name,
                            number: leadForm.number,
                            email: leadForm.email,
                            source: leadForm.source,
                            note: leadForm.note,
                            dataPrenotazione: leadForm.date,
                            oraPrenotazione: leadForm.time,
                            dialed: leadForm.dialed ?? 0,
                            amount: leadForm.amount === '' ? null : leadForm.amount,
                            mesi: leadForm.mesi === '' ? null : leadForm.mesi,
                            offer: !!leadForm.offer,
                            riprenotato: !!leadForm.riprenotato,
                            target: !!leadForm.target,
                            settingCall: !!leadForm.settingCall
                          };
                          
                          // Aggiungi tutti gli status dinamici
                          leadStatuses.forEach(status => {
                            leadUpdateData[status.id] = !!leadForm[status.id];
                          });
                          
                          await updateDoc(getTenantDoc(db, 'leads', selectedLead.leadId), leadUpdateData);
                          // Aggiorna evento calendario
                          await updateDoc(getTenantDoc(db, 'calendarEvents', selectedLead.id), {
                            title: `📞 ${leadForm.name}`,
                            date: leadForm.date,
                            time: leadForm.time,
                            leadData: {
                              name: leadForm.name,
                              number: leadForm.number,
                              email: leadForm.email,
                              source: leadForm.source,
                              note: leadForm.note
                            }
                          });
                          setEditingLeadDetails(false);
                        } catch (err) {
                          console.error('Errore aggiornamento lead/evento:', err);
                          toast.error('Errore nel salvataggio.');
                        }
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl"
                    >
                      Salva
                    </motion.button>
                    <button onClick={()=>setEditingLeadDetails(false)} className="flex-1 bg-slate-700/70 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl">Annulla</button>
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
