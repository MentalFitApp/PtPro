import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, toDate, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  Search, ArrowUp, ArrowDown, CheckCircle, XCircle, Clock,
  AlertCircle, LogOut, LayoutGrid, List, FileText, Calendar,
  ChevronLeft, ChevronRight, FilePenLine, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from 'date-fns';

const AnamnesiBadge = ({ hasAnamnesi }) => (
  <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 border transition-colors ${
    hasAnamnesi
      ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/60'
      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/70'
  }`}>
    <FileText size={12} /> {hasAnamnesi ? 'Inviata' : 'Non Inviata'}
  </span>
);

const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border shadow-xl backdrop-blur-md ${
          type === 'error'
            ? 'bg-red-900/80 text-red-300 border-red-500/30'
            : 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
        }`}
      >
        <AlertCircle className={type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onDismiss}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// Rimosso export CSV con prezzi per policy coach (no prezzi)

export default function CoachClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [anamnesiStatus, setAnamnesiStatus] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0 });
  const [showCalendar, setShowCalendar] = useState(true);
  const [calendarType, setCalendarType] = useState('iscrizioni');
  const [meseCalendario, setMeseCalendario] = useState(new Date());
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState(null);
  const [dayModalClients, setDayModalClients] = useState([]);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  const openDayModal = (giorno) => {
    let clientsForDay;
    
    if (filter === 'expiring' || filter === 'expired') {
      clientsForDay = filteredAndSortedClients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && isSameDay(expiry, giorno);
      });
    } else if (calendarType === 'scadenze') {
      clientsForDay = clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && isSameDay(expiry, giorno);
      });
    } else {
      clientsForDay = filteredAndSortedClients.filter(c => {
        const created = toDate(c.createdAt);
        const start = toDate(c.startDate);
        const referenceDate = created || start;
        return referenceDate && isSameDay(referenceDate, giorno);
      });
    }
    setDayModalDate(giorno);
    setDayModalClients(clientsForDay);
    setDayModalOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteDoc(doc(db, 'clients', clientToDelete.id));
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      showNotification('Cliente eliminato', 'success');
    } catch (error) {
      console.error('Errore eliminazione:', error);
      showNotification('Errore eliminazione', 'error');
    } finally {
      setClientToDelete(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      showNotification('Errore logout', 'error');
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    const q = collection(db, 'clients');
    const unsub = onSnapshot(q, async snap => {
      try {
        const clientList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Anamnesi status
        const anamnesiPromises = clientList.map(client =>
          getDoc(doc(db, `clients/${client.id}/anamnesi`, 'initial')).catch(() => ({ exists: () => false }))
        );
        const anamnesiResults = await Promise.all(anamnesiPromises);
        const anamnesiStatusTemp = {};
        clientList.forEach((client, i) => { anamnesiStatusTemp[client.id] = anamnesiResults[i].exists(); });
        setAnamnesiStatus(anamnesiStatusTemp);
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        console.error('Errore:', error);
        setLoading(false);
        showNotification('Errore caricamento', 'error');
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const now = new Date();
    const total = clients.length;
    let expiring = 0, expired = 0;
    clients.forEach(client => {
      const expiry = toDate(client.scadenza);
      if (expiry) {
        const days = Math.ceil((expiry - now) / 86400000);
        if (days < 0) expired++;
        else if (days <= 15) expiring++;
      }
    });
    setStats({ total, expiring, expired });
  }, [clients]);

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter(c => {
      const match = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
      const expiry = toDate(c.scadenza);
      const days = expiry ? Math.ceil((expiry - new Date()) / 86400000) : null;
      if (filter === 'active') return expiry && days >= 0;
      if (filter === 'expiring') return days !== null && days > 0 && days <= 15;
      if (filter === 'expired') return days !== null && days < 0;
      if (filter === 'no-check') return !anamnesiStatus[c.id];
      if (filter === 'has-check') return anamnesiStatus[c.id];
      return true;
    });
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'name') { aVal = a.name || ''; bVal = b.name || ''; }
      else if (sortField === 'startDate') { aVal = toDate(a.startDate) || new Date(0); bVal = toDate(b.startDate) || new Date(0); }
      else if (sortField === 'expiry') { aVal = toDate(a.scadenza) || new Date(0); bVal = toDate(b.scadenza) || new Date(0); }
      else if (sortField === 'lastCheck') { aVal = anamnesiStatus[a.id] ? 1 : 0; bVal = anamnesiStatus[b.id] ? 1 : 0; }
      if (aVal < bVal) return sortDirection === 'desc' ? 1 : -1;
      if (aVal > bVal) return sortDirection === 'desc' ? -1 : 1;
      return 0;
    });
    return filtered;
  }, [clients, searchQuery, filter, sortField, sortDirection, anamnesiStatus]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDirection(p => p === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const getSortIcon = (field) => sortField === field ? (sortDirection === 'desc' ? <ArrowDown size={14}/> : <ArrowUp size={14}/>) : null;

  const giorniMese = eachDayOfInterval({
    start: startOfMonth(meseCalendario),
    end: endOfMonth(meseCalendario),
  });

  const clientiDelGiorno = (giorno) => {
    if (filter === 'expiring' || filter === 'expired') {
      return clients.filter(c => {
        const expiry = toDate(c.scadenza);
        if (!expiry || !isSameDay(expiry, giorno)) return false;
        const now = new Date();
        const daysToExpiry = Math.ceil((expiry - now) / 86400000);
        if (filter === 'expiring') return daysToExpiry <= 15 && daysToExpiry > 0;
        else if (filter === 'expired') return daysToExpiry < 0;
        return false;
      });
    }
    
    if (calendarType === 'scadenze') {
      return clients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && isSameDay(expiry, giorno);
      });
    } else {
      return filteredAndSortedClients.filter(c => {
        const created = toDate(c.createdAt);
        const start = toDate(c.startDate);
        const refDate = created || start;
        return refDate && isSameDay(refDate, giorno);
      });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1b2735] to-[#090a0f]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1b2735] to-[#090a0f]">
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <header className="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Gestione Clienti</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 pl-10 w-48 outline-none focus:ring-2 focus:ring-rose-500 text-sm text-slate-200" placeholder="Cerca..."/>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg"><LogOut size={16}/> Logout</button>
              <div className="flex gap-1 bg-slate-700/50 border border-slate-600 rounded-lg p-1">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}><List size={16}/></button>
                <button onClick={() => setViewMode('card')} className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}><LayoutGrid size={16}/></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-3 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'all' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>Tutti</button>
            <button onClick={() => setFilter('active')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${filter === 'active' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-900/30'}`}><CheckCircle size={14}/> Attivi</button>
            <button onClick={() => setFilter('expiring')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${filter === 'expiring' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-amber-900/30'}`}><Clock size={14}/> In Scadenza</button>
            <button onClick={() => setFilter('expired')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${filter === 'expired' ? 'bg-red-600 text-white' : 'text-red-400 hover:bg-red-900/30'}`}><AlertCircle size={14}/> Scaduti</button>
            <button onClick={() => setFilter('has-check')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${filter === 'has-check' ? 'bg-cyan-600 text-white' : 'text-cyan-400 hover:bg-cyan-900/30'}`}><CheckCircle size={14}/> Con Anamnesi</button>
            <button onClick={() => setFilter('no-check')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${filter === 'no-check' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-900/30'}`}><XCircle size={14}/> Senza Anamnesi</button>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowCalendar(prev => !prev)} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${showCalendar ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                <Calendar size={14}/> Calendario
              </button>
              {showCalendar && (
                <div className="flex gap-1 bg-slate-700/50 rounded-lg p-0.5">
                  <button onClick={() => setCalendarType('iscrizioni')} className={`px-2 py-1 text-xs rounded ${calendarType === 'iscrizioni' ? 'bg-rose-600 text-white' : 'text-slate-300'}`}>Iscrizioni</button>
                  <button onClick={() => setCalendarType('scadenze')} className={`px-2 py-1 text-xs rounded ${calendarType === 'scadenze' ? 'bg-amber-600 text-white' : 'text-slate-300'}`}>Scadenze</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => toggleSort('name')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${sortField === 'name' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>Nome {getSortIcon('name')}</button>
          <button onClick={() => toggleSort('startDate')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${sortField === 'startDate' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>Inizio {getSortIcon('startDate')}</button>
          <button onClick={() => toggleSort('expiry')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${sortField === 'expiry' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>Scadenza {getSortIcon('expiry')}</button>
          <button onClick={() => toggleSort('lastCheck')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${sortField === 'lastCheck' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>Anamnesi {getSortIcon('lastCheck')}</button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-4"><h3 className="text-sm text-slate-400 mb-1">Totale Clienti</h3><p className="text-2xl font-bold text-white">{stats.total}</p></div>
          <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-4"><h3 className="text-sm text-amber-400 mb-1">In Scadenza</h3><p className="text-2xl font-bold text-amber-300">{stats.expiring}</p></div>
          <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4"><h3 className="text-sm text-red-400 mb-1">Scaduti</h3><p className="text-2xl font-bold text-red-300">{stats.expired}</p></div>
        </div>

        {showCalendar && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700 shadow-xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setMeseCalendario(addMonths(meseCalendario, -1))} className="p-2 hover:bg-slate-700 rounded-lg"><ChevronLeft size={18} className="text-slate-400"/></button>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Calendar size={18}/> {format(meseCalendario, "MMMM yyyy")}</h3>
              <button onClick={() => setMeseCalendario(addMonths(meseCalendario, 1))} className="p-2 hover:bg-slate-700 rounded-lg"><ChevronRight size={18} className="text-slate-400"/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-3 text-center text-xs md:text-sm">
              {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map((d, i) => (
                <div key={d + '-' + i} className="font-bold text-slate-400 py-2">
                  <span className="md:hidden">{d}</span>
                  <span className="hidden md:inline">{['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][i]}</span>
                </div>
              ))}
              {Array.from({ length: startOfMonth(meseCalendario).getDay() }, (_, i) => <div key={`empty-${i}`}/>)}
              {giorniMese.map(giorno => {
                const clientiGiorno = clientiDelGiorno(giorno);
                const showingExpiries = (filter === 'expiring' || filter === 'expired' || calendarType === 'scadenze');
                const bgColor = showingExpiries
                  ? (clientiGiorno.length > 0 ? 'bg-amber-900/40 border-amber-600 hover:bg-amber-900/60' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/70')
                  : (clientiGiorno.length > 0 ? 'bg-rose-900/40 border-rose-600 hover:bg-rose-900/60' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/70');
                const cardBg = showingExpiries ? 'from-amber-600/30 to-orange-600/30' : 'from-rose-600/30 to-purple-600/30';
                const textColor = showingExpiries ? 'text-amber-300' : 'text-rose-300';
                const dotColor = showingExpiries ? 'bg-amber-500' : 'bg-rose-500';
                
                return (
                  <div
                    onClick={() => openDayModal(giorno)}
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
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/coach/client/${c.id}`); }} className="text-cyan-400 hover:text-cyan-300">
                              <FilePenLine size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setClientToDelete(c); }} className="text-red-400 hover:text-red-300">
                              <Trash2 size={14} />
                            </button>
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
        )}

        {viewMode === 'list' && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-white/5 text-slate-400 uppercase text-xs"><tr><th className="p-4">Nome</th><th className="p-4">Email</th><th className="p-4">Inizio</th><th className="p-4">Scadenza</th><th className="p-4">Stato</th><th className="p-4">Anamnesi</th></tr></thead>
                <tbody>
                  {filteredAndSortedClients.map((c) => {
                    const start = toDate(c.startDate);
                    const expiry = toDate(c.scadenza);
                    const days = expiry ? Math.ceil((expiry - new Date()) / 86400000) : null;
                    return (
                      <tr key={c.id} className="border-t border-white/10 hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/coach/client/${c.id}`)}>
                        <td className="p-4 font-medium">{c.name || '-'}</td>
                        <td className="p-4 text-slate-400">{c.email || '-'}</td>
                        <td className="p-4">{start ? start.toLocaleDateString('it-IT') : 'N/D'}</td>
                        <td className="p-4">{expiry ? <div className="flex items-center gap-2"><span>{expiry.toLocaleDateString('it-IT')}</span>{days !== null && <span className={`text-xs px-2 py-1 rounded-full ${days < 0 ? 'bg-red-900/80 text-red-300' : days <= 7 ? 'bg-amber-900/80 text-amber-300' : 'bg-emerald-900/80 text-emerald-300'}`}>{days < 0 ? 'Scaduto' : `${days} gg`}</span>}</div> : 'N/D'}</td>
                        <td className="p-4">{days !== null && <span className={`px-2 py-1 text-xs rounded-full ${days < 0 ? 'bg-red-900/40 text-red-300' : days <= 15 ? 'bg-amber-900/40 text-amber-300' : 'bg-emerald-900/40 text-emerald-300'}`}>{days < 0 ? 'Scaduto' : days <= 15 ? 'In Scadenza' : 'Attivo'}</span>}</td>
                        <td className="p-4"><AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]}/></td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedClients.length === 0 && <tr><td colSpan="6" className="text-center p-8 text-slate-400">Nessun cliente trovato.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedClients.map((c) => {
              const start = toDate(c.startDate);
              const expiry = toDate(c.scadenza);
              const days = expiry ? Math.ceil((expiry - new Date()) / 86400000) : null;
              return (
                <motion.div key={c.id} whileHover={{scale:1.02}} onClick={() => navigate(`/coach/client/${c.id}`)} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-rose-500/50">
                  <h3 className="text-lg font-semibold text-white mb-2">{c.name || '-'}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="text-slate-200">{c.email || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Inizio:</span><span className="text-slate-200">{start ? start.toLocaleDateString('it-IT') : 'N/D'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Scadenza:</span><span className="text-slate-200">{expiry ? expiry.toLocaleDateString('it-IT') : 'N/D'}</span></div>
                    {days !== null && <div className="flex justify-between items-center pt-2 border-t border-slate-700"><span className="text-slate-400">Stato:</span><span className={`px-2 py-1 text-xs rounded-full ${days < 0 ? 'bg-red-900/40 text-red-300' : days <= 15 ? 'bg-amber-900/40 text-amber-300' : 'bg-emerald-900/40 text-emerald-300'}`}>{days < 0 ? 'Scaduto' : days <= 15 ? `Scade in ${days}gg` : 'Attivo'}</span></div>}
                    <div className="pt-2"><AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]}/></div>
                  </div>
                </motion.div>
              );
            })}
            {filteredAndSortedClients.length === 0 && <div className="col-span-full text-center p-8 text-slate-400">Nessun cliente trovato.</div>}
          </div>
        )}

        {/* MODAL CLIENTI DEL GIORNO */}
        {dayModalOpen && (
          <div onClick={() => setDayModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100">
                  {calendarType === 'scadenze' ? 'Scadenze' : 'Iscrizioni'} del {dayModalDate && format(dayModalDate, "d MMMM yyyy")}
                </h3>
                <button onClick={() => setDayModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X size={18} className="text-slate-400"/>
                </button>
              </div>
              {dayModalClients.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nessun cliente in questa data</p>
              ) : (
                <div className="space-y-3">
                  {dayModalClients.map(c => (
                    <div key={c.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white">{c.name}</p>
                          <p className="text-sm text-slate-400">{c.email || 'N/D'}</p>
                          {calendarType === 'scadenze' && (
                            <p className="text-xs text-amber-300 mt-1">Scade: {toDate(c.scadenza)?.toLocaleDateString('it-IT')}</p>
                          )}
                          {calendarType === 'iscrizioni' && (
                            <p className="text-xs text-rose-300 mt-1">Iscritto: {(toDate(c.startDate) || toDate(c.createdAt))?.toLocaleDateString('it-IT')}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { navigate(`/coach/client/${c.id}`); setDayModalOpen(false); }} className="p-2 text-cyan-400 hover:bg-white/10 rounded-lg">
                            <FilePenLine size={16}/>
                          </button>
                          <button onClick={() => { setClientToDelete(c); setDayModalOpen(false); }} className="p-2 text-red-400 hover:bg-white/10 rounded-lg">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL CONFERMA ELIMINAZIONE */}
        {clientToDelete && (
          <div onClick={() => setClientToDelete(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 text-center shadow-xl">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/40 mb-4">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Conferma Eliminazione</h3>
              <p className="text-sm text-slate-400 mt-2">
                Sei sicuro di voler eliminare il cliente <strong className="text-rose-400">{clientToDelete.name}</strong>?
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <button onClick={() => setClientToDelete(null)} className="px-6 py-2 text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors border border-slate-600">
                  Annulla
                </button>
                <button onClick={handleDelete} className="px-6 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">
                  Elimina
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
