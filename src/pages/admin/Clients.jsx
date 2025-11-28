import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, toDate, calcolaStatoPercorso, updateStatoPercorso } from "../../firebase";
import { getTenantCollection } from '../../config/tenant';
import { onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getClientAnamnesi, getClientPayments, deleteClient } from '../../services/clientService';
import { 
  UserPlus, FilePenLine, Trash2, Search, ArrowUp, ArrowDown, 
  CheckCircle, XCircle, Calendar, Clock, AlertCircle, LogOut, Download, FileText, X, Menu, Filter, LayoutGrid, List, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from 'papaparse';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from "date-fns";
import QuickActions from '../../components/admin/QuickActions';
import SavedFilters from '../../components/admin/SavedFilters';
import MessageTemplates from '../../components/admin/MessageTemplates';
import BulkOperations from '../../components/admin/BulkOperations';
import { useToast } from '../../contexts/ToastContext';

// --- COMPONENTI UI ---
const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${
          type === 'error' ? 'bg-red-900/80 text-red-300 border-red-500/30' : 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
        } backdrop-blur-md shadow-lg`}
      >
        <AlertCircle className={type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
        <p>{message}</p>
        <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const exportToCSV = (clients) => {
  const data = clients.map(client => ({
    Nome: client.name || 'N/D',
    Email: client.email || 'N/D',
    Telefono: client.phone || 'N/D',
    Scadenza: toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D',
    Stato: client.statoPercorso || calcolaStatoPercorso(client.scadenza),
    Pagamenti: client.payments ? client.payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0,
    'Data Inizio': toDate(client.startDate)?.toLocaleDateString('it-IT') || 'N/D',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'clienti.csv';
  link.click();
};

const AnamnesiBadge = ({ hasAnamnesi }) => (
  <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 border transition-all ${
    hasAnamnesi 
      ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/60' 
      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/70'
  }`}>
    <FileText size={12} /> {hasAnamnesi ? 'Inviata' : 'Non Inviata'}
  </span>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, clientName }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 text-center shadow-xl"
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/40 mb-4">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Conferma Eliminazione</h3>
          <p className="text-sm text-slate-400 mt-2">
            Sei sicuro di voler eliminare il cliente <strong className="text-rose-400">{clientName}</strong>? L&apos;operazione è irreversibile.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={onClose} className="px-6 py-2 text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors border border-slate-600">
              Annulla
            </button>
              <button onClick={onConfirm} className="px-6 py-2 text-sm font-semibold text-white preserve-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">
              Elimina
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- MAIN LAYOUT (STILE DIPENDENTI) ---
const MainLayout = ({ children, title, actions, filters, sortButtons, viewToggle, calendarToggle }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1b2735] to-[#090a0f]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/10"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{title}</h1>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {actions}
            </div>

            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/10"
              >
                <Filter size={18} />
              </button>
              {actions}
            </div>
          </div>
        </div>

        {/* MENU MOBILE */}
        <AnimatePresence>
          {mobileActionsOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="lg:hidden border-t border-slate-700 bg-slate-800/60 backdrop-blur-sm"
            >
              <div className="px-4 py-3 space-y-2">
                {actions}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FILTRO MOBILE */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="lg:hidden border-t border-slate-700 bg-slate-800/60 backdrop-blur-sm"
            >
              <div className="px-4 py-3 space-y-3">
                <div className="flex flex-wrap gap-2">{filters}</div>
                <div className="flex flex-wrap gap-2">{sortButtons}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* FILTRO + TOGGLE CALENDARIO DESKTOP */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-3 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            {filters}
            <div className="ml-auto flex gap-2">
              {calendarToggle}
              {viewToggle}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">{sortButtons}</div>
      </div>

      {/* CONTENUTO */}
      <main className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
        {children}
      </main>
    </div>
  );
};

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [anamnesiStatus, setAnamnesiStatus] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'card'
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [meseCalendario, setMeseCalendario] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(true); // NUOVO
  const [calendarType, setCalendarType] = useState('iscrizioni'); // 'iscrizioni' o 'scadenze'
  const [paymentsTotals, setPaymentsTotals] = useState({});
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState(null);
  const [dayModalClients, setDayModalClients] = useState([]);
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0 });
  const [selectedClients, setSelectedClients] = useState([]);
  const toast = useToast();

  // --- SELEZIONE MULTIPLA ---
  const toggleClientSelection = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClients.length === filteredAndSortedClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredAndSortedClients.map(c => c.id));
    }
  };

  const handleBulkOperationComplete = () => {
    setSelectedClients([]);
    toast.success('Operazione completata con successo!');
  };

  const openDayModal = (giorno) => {
    let clientsForDay;
    
    // Quando il filtro è attivo, mostra solo le scadenze
    if (filter === 'expiring' || filter === 'expired') {
      clientsForDay = filteredAndSortedClients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && isSameDay(expiry, giorno);
      });
    } else if (calendarType === 'scadenze') {
      clientsForDay = filteredAndSortedClients.filter(c => {
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

  // --- TOGGLE CALENDARIO ---
  const calendarToggle = (
    <div className="flex gap-2">
      <button
        onClick={() => setShowCalendar(prev => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
          showCalendar ? 'bg-rose-600 text-white preserve-white' : 'bg-slate-700 text-slate-300'
        }`}
      >
        <Calendar size={14} /> Calendario
      </button>
      {showCalendar && (
        <div className="flex gap-1 bg-slate-700/50 rounded-lg p-0.5">
          <button
            onClick={() => setCalendarType('iscrizioni')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              calendarType === 'iscrizioni' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-300'
            }`}
          >
            Iscrizioni
          </button>
          <button
            onClick={() => setCalendarType('scadenze')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              calendarType === 'scadenze' ? 'bg-amber-600 text-white preserve-white' : 'text-slate-300'
            }`}
          >
            Scadenze
          </button>
        </div>
      )}
    </div>
  );

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      showNotification(`Errore logout: ${error.message}`, 'error');
    }
  };

  // --- CARICA CLIENTI ---
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin') {
      signOut(auth).then(() => navigate('/login'));
      return;
    }

    const q = getTenantCollection(db, 'clients');
    const unsub = onSnapshot(q, async (snap) => {
      try {
        const clientList = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            scadenza: data.scadenza,
            startDate: data.startDate,
            createdAt: data.createdAt,
            statoPercorso: data.statoPercorso || calcolaStatoPercorso(data.scadenza),
            payments: data.payments || [],
            rate: data.rate || []
          };
        });

        // Carica anamnesi e pagamenti usando i services
        const anamnesiPromises = clientList.map(client => 
          getClientAnamnesi(db, client.id, 1)
            .then(anamnesi => ({ clientId: client.id, hasAnamnesi: anamnesi.length > 0 }))
            .catch(() => ({ clientId: client.id, hasAnamnesi: false }))
        );
        
        const anamnesiResults = await Promise.all(anamnesiPromises);
        const anamnesiStatusTemp = {};
        anamnesiResults.forEach(result => {
          anamnesiStatusTemp[result.clientId] = result.hasAnamnesi;
        });
        setAnamnesiStatus(anamnesiStatusTemp);

        // Calcolo totale incasso dalle rate pagate + payments collection usando service
        const paymentsTotalsTemp = {};
        const paymentsPromises = clientList.map(async client => {
          // Totale dalle rate pagate
          const rateArr = Array.isArray(client.rate) ? client.rate : [];
          const rateSum = rateArr.filter(r => r.paid).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
          
          // Totale dalla collection payments usando service
          const payments = await getClientPayments(db, client.id).catch(() => []);
          const paymentsSum = payments.reduce((acc, payment) => acc + (Number(payment.amount) || 0), 0);
          
          paymentsTotalsTemp[client.id] = rateSum + paymentsSum;
        });
        
        await Promise.all(paymentsPromises);
        setPaymentsTotals(paymentsTotalsTemp);

        clientList.forEach(client => updateStatoPercorso(client.id));
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        showNotification("Errore caricamento clienti", 'error');
        setLoading(false);
      }
    }, () => {
      showNotification("Errore connessione", 'error');
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(db, clientToDelete.id);
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      showNotification('Cliente eliminato!', 'success');
    } catch (error) {
      showNotification(error.message || 'Errore eliminazione', 'error');
    } finally {
      setClientToDelete(null);
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />;
  };

  // --- CALCOLA STATISTICHE IN TEMPO REALE ---
  useEffect(() => {
    const now = new Date();
    const total = clients.length;
    let expiring = 0;
    let expired = 0;

    clients.forEach(client => {
      const expiry = toDate(client.scadenza);
      if (expiry) {
        const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        if (daysToExpiry < 0) {
          expired++;
        } else if (daysToExpiry <= 15) {
          expiring++;
        }
      }
    });

    setStats({ total, expiring, expired });
  }, [clients]);

  // --- Filtri e ordinamento ---
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter(client => {
      const matchesSearch = 
        (client.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const now = new Date();
      const expiry = toDate(client.scadenza);
      const daysToExpiry = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

      switch (filter) {
        case 'active': return expiry && expiry > now;
        case 'expiring': return expiry && daysToExpiry <= 15 && daysToExpiry > 0;
        case 'expired': return expiry && expiry < now;
        case 'no-check': return !anamnesiStatus[client.id];
        case 'has-check': return anamnesiStatus[client.id];
        case 'recent': return true;
        default: return true;
      }
    });

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
        case 'startDate': aVal = toDate(a.startDate) || new Date(0); bVal = toDate(b.startDate) || new Date(0); break;
        case 'expiry': aVal = toDate(a.scadenza) || new Date(0); bVal = toDate(b.scadenza) || new Date(0); break;
        case 'lastCheck': aVal = anamnesiStatus[a.id] ? 1 : 0; bVal = anamnesiStatus[b.id] ? 1 : 0; break;
        case 'recent': aVal = toDate(a.startDate) || new Date(0); bVal = toDate(b.startDate) || new Date(0); break;
        default: aVal = 0; bVal = 0;
      }
      if (aVal < bVal) return sortDirection === 'desc' ? 1 : -1;
      if (aVal > bVal) return sortDirection === 'desc' ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [clients, searchQuery, filter, sortField, sortDirection, anamnesiStatus]);

  // --- CALENDARIO ISCRIZIONI (CLIENTI AGGIUNTI) ---
  const giorniMese = eachDayOfInterval({
    start: startOfMonth(meseCalendario),
    end: endOfMonth(meseCalendario),
  });

  const clientiDelGiorno = (giorno) => {
    // Quando il filtro "In Scadenza" o "Scaduti" è attivo, forza visualizzazione scadenze
    if (filter === 'expiring' || filter === 'expired') {
      // Usa TUTTI i clienti (non solo filteredAndSortedClients) per mostrare tutte le date di scadenza nel calendario
      return clients.filter(c => {
        const expiry = toDate(c.scadenza);
        if (!expiry || !isSameDay(expiry, giorno)) return false;
        
        // Applica la logica del filtro alla data
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
    
    // Altrimenti rispetta il toggle calendario
    if (calendarType === 'scadenze') {
      // Mostra TUTTE le scadenze nel calendario, non solo quelle filtrate
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

  // --- TOGGLE VISTA ---
  const viewToggle = (
    <div className="flex items-center gap-1 bg-slate-700/50 border border-slate-600 rounded-lg p-1">
      <button
        onClick={() => setViewMode('list')}
        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:text-slate-200'}`}
        title="Lista"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => setViewMode('card')}
        className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:text-slate-200'}`}
        title="Schede"
      >
        <LayoutGrid size={16} />
      </button>
    </div>
  );

  // --- AZIONI HEADER ---
  const actions = (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
        <input
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1.5 pl-9 w-full min-w-48 outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500"
          placeholder="Cerca..."
        />
      </div>
      <button onClick={() => navigate("/new-client")} className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white preserve-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
        <UserPlus size={14} /> Nuovo
      </button>
      <button onClick={() => exportToCSV(clients)} className="flex items-center gap-1.5 px-2 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white preserve-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
        <Download size={14} /> CSV
      </button>
      <SavedFilters
        currentFilters={{ searchQuery, filter, sortField, sortDirection }}
        onApplyFilter={(savedFilter) => {
          setSearchQuery(savedFilter.searchQuery || '');
          setFilter(savedFilter.filter || 'all');
          setSortField(savedFilter.sortField || 'startDate');
          setSortDirection(savedFilter.sortDirection || 'desc');
        }}
      />
      <MessageTemplates
        onSelectTemplate={(template) => console.log('Template:', template)}
      />
      <button onClick={handleLogout} className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white preserve-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
        <LogOut size={14} /> Logout
      </button>
      <div className="flex gap-2 ml-2">
        {calendarToggle}
        {viewToggle}
      </div>
    </>
  );

  // --- FILTRO BARRA ---
  const filters = (
    <>
      <button onClick={() => setFilter('all')} className={`px-2 py-1 text-xs sm:text-sm rounded-lg transition-colors ${filter === 'all' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:bg-white/10'}`}>Tutti</button>
      <button onClick={() => setFilter('active')} className={`px-2 py-1 text-xs sm:text-sm rounded-lg flex items-center gap-1 transition-colors ${filter === 'active' ? 'bg-emerald-600 text-white preserve-white' : 'text-emerald-400 hover:bg-emerald-900/30'}`}><CheckCircle size={12} /> Attivi</button>
      <button onClick={() => setFilter('expiring')} className={`px-2 py-1 text-xs sm:text-sm rounded-lg flex items-center gap-1 transition-colors ${filter === 'expiring' ? 'bg-amber-600 text-white preserve-white' : 'text-amber-400 hover:bg-amber-900/30'}`}><Clock size={12} /> In Scadenza</button>
      <button onClick={() => setFilter('expired')} className={`px-2 py-1 text-xs sm:text-sm rounded-lg flex items-center gap-1 transition-colors ${filter === 'expired' ? 'bg-red-600 text-white preserve-white' : 'text-red-400 hover:bg-red-900/30'}`}><AlertCircle size={12} /> Scaduti</button>
      <button onClick={() => setFilter('has-check')} className={`px-2 py-1 text-xs sm:text-sm rounded-lg flex items-center gap-1 transition-colors ${filter === 'has-check' ? 'bg-cyan-600 text-white preserve-white' : 'text-cyan-400 hover:bg-cyan-900/30'}`}><CheckCircle size={12} /> Con Anamnesi</button>
      <button onClick={() => setFilter('no-check')} className={`px-2 py-1 text-xs sm:text-sm rounded-lg flex items-center gap-1 transition-colors ${filter === 'no-check' ? 'bg-gray-600 text-white preserve-white' : 'text-gray-400 hover:bg-gray-900/30'}`}><XCircle size={12} /> Senza Anamnesi</button>
      <button onClick={() => { setFilter('recent'); setSortField('recent'); setSortDirection('desc'); }} className={`px-2 py-1 text-xs sm:text-sm rounded-lg flex items-center gap-1 transition-colors ${filter === 'recent' ? 'bg-purple-600 text-white preserve-white' : 'text-purple-400 hover:bg-purple-900/30'}`}><Calendar size={12} /> Più Recenti</button>
    </>
  );

  // --- PULSANTI ORDINAMENTO ---
  const sortButtons = (
    <>
      <button onClick={() => toggleSort('name')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${sortField === 'name' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:bg-white/10'}`}>
        Nome {getSortIcon('name')}
      </button>
      <button onClick={() => toggleSort('startDate')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${sortField === 'startDate' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:bg-white/10'}`}>
        Inizio {getSortIcon('startDate')}
      </button>
      <button onClick={() => toggleSort('expiry')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${sortField === 'expiry' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:bg-white/10'}`}>
        Scadenza {getSortIcon('expiry')}
      </button>
      <button onClick={() => toggleSort('lastCheck')} className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${sortField === 'lastCheck' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:bg-white/10'}`}>
        Anamnesi {getSortIcon('lastCheck')}
      </button>
    </>
  );

  

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1b2735] to-[#090a0f]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="overflow-x-hidden w-full">
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <ConfirmationModal isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} onConfirm={handleDelete} clientName={clientToDelete?.name} />

      <div className="mobile-container py-4 sm:py-6 space-y-4 sm:space-y-6 mobile-safe-bottom">
        {/* HEADER MOBILE */}
        <div className="md:hidden bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 mx-3">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Clienti</h1>
          
          {/* STATISTICHE MOBILE */}
          <div className="flex gap-3 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span className="text-slate-300">Tot: <strong className="text-white">{stats.total}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              <span className="text-slate-300">Scad: <strong className="text-amber-400">{stats.expiring}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
              <span className="text-slate-300">Scad: <strong className="text-red-400">{stats.expired}</strong></span>
            </div>
          </div>
          
          {/* Search Bar Mobile */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2.5 pl-10 w-full outline-none focus:ring-2 focus:ring-rose-500 text-sm text-slate-200 placeholder:text-slate-500"
              placeholder="Cerca clienti..."
            />
          </div>

          {/* Action Buttons Mobile */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => navigate("/new-client")} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white preserve-white text-sm font-medium rounded-lg transition-colors">
              <UserPlus size={16} /> Nuovo
            </button>
            <button onClick={() => exportToCSV(clients)} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white preserve-white text-sm font-medium rounded-lg transition-colors">
              <Download size={16} /> CSV
            </button>
          </div>

          {/* View Toggle Mobile */}
          <div className="flex items-center justify-center gap-1 bg-slate-700/50 border border-slate-600 rounded-lg p-1 mb-3">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md transition-colors text-xs ${viewMode === 'list' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400'}`}
            >
              <List size={14} /> Lista
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md transition-colors text-xs ${viewMode === 'card' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400'}`}
            >
              <LayoutGrid size={14} /> Schede
            </button>
          </div>

          {/* Filter Chips Mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hidden">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-rose-600 text-white preserve-white' : 'bg-slate-700 text-slate-300'}`}>Tutti</button>
            <button onClick={() => setFilter('active')} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'active' ? 'bg-emerald-600 text-white preserve-white' : 'bg-slate-700 text-emerald-400'}`}><CheckCircle size={12} /> Attivi</button>
            <button onClick={() => setFilter('expiring')} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'expiring' ? 'bg-amber-600 text-white preserve-white' : 'bg-slate-700 text-amber-400'}`}><Clock size={12} /> Scadenza</button>
            <button onClick={() => setFilter('expired')} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'expired' ? 'bg-red-600 text-white preserve-white' : 'bg-slate-700 text-red-400'}`}><AlertCircle size={12} /> Scaduti</button>
          </div>
        </div>

        {/* HEADER DESKTOP */}
        <div className="hidden md:block bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 space-y-5 mx-3 sm:mx-6">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">Gestione Clienti</h1>
              {/* STATISTICHE */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span className="text-slate-300">Totale: <strong className="text-white">{stats.total}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-slate-300">In Scadenza: <strong className="text-amber-400">{stats.expiring}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-slate-300">Scaduti: <strong className="text-red-400">{stats.expired}</strong></span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {actions}
            </div>
          </div>

          {/* SEPARATORE */}
          <div className="border-t border-white/10"></div>

          {/* FILTRI */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Filtri</h3>
            <div className="flex flex-wrap gap-2">
              {filters}
            </div>
          </div>

          {/* SEPARATORE */}
          <div className="border-t border-white/10"></div>

          {/* ORDINAMENTO */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Ordinamento</h3>
            <div className="flex flex-wrap gap-2">
              {sortButtons}
            </div>
          </div>
        </div>

        {/* SELEZIONE MULTIPLA - Info Bar */}
        {selectedClients.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-3 sm:mx-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="text-blue-400" size={20} />
              <span className="text-blue-300 font-medium">
                {selectedClients.length} client{selectedClients.length === 1 ? 'e' : 'i'} selezionat{selectedClients.length === 1 ? 'o' : 'i'}
              </span>
            </div>
            <button
              onClick={() => setSelectedClients([])}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Deseleziona tutti
            </button>
          </motion.div>
        )}

        {/* TOGGLE CALENDARIO MOBILE */}
        <div className="md:hidden mx-3">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              showCalendar ? 'bg-rose-600 text-white preserve-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            <Calendar size={16} /> {showCalendar ? 'Nascondi' : 'Mostra'} Calendario
          </button>
        </div>

        {/* CALENDARIO SCADENZE */}
        {showCalendar && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700 shadow-xl mx-3 sm:mx-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setMeseCalendario(addMonths(meseCalendario, -1))} className="p-2 hover:bg-slate-700 rounded-lg transition">
                <ChevronLeft size={18} className="text-slate-400" />
              </button>
              <h3 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Calendar size={18} className="md:block hidden" /> {format(meseCalendario, "MMMM yyyy")}
              </h3>
              <button onClick={() => setMeseCalendario(addMonths(meseCalendario, 1))} className="p-2 hover:bg-slate-700 rounded-lg transition">
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
                
                // Determina se stiamo mostrando scadenze (o per filtro o per toggle)
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
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/edit/${c.id}`); }} className="text-cyan-400 hover:text-cyan-300">
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

        {/* VISTA LISTA - Table with horizontal scroll on mobile */}
        {viewMode === 'list' && (
          <>
            {/* TABLE - Always visible with horizontal scroll on mobile */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 md:p-6 border border-slate-700 shadow-xl mx-3 sm:mx-6">
              <div className="mobile-table-wrapper relative -mx-3 md:mx-0 overflow-x-auto">
                {/* Scroll indicator for mobile */}
                <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-10 bg-gradient-to-l from-slate-800/90 to-transparent pl-8 pr-2">
                  <ChevronRight size={20} className="text-slate-400 animate-pulse" />
                </div>
                <table className="w-full min-w-[800px] text-xs md:text-sm text-left text-slate-300">
                <thead className="text-slate-400 uppercase text-[10px] md:text-xs">
                  <tr>
                    <th className="p-2 md:p-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedClients.length === filteredAndSortedClients.length && filteredAndSortedClients.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2 md:p-4 min-w-[150px] md:min-w-[180px] font-bold sticky left-0 bg-slate-800/95 z-10">Nome</th>
                    <th className="p-2 md:p-4 min-w-[100px] md:min-w-[140px] font-bold">Inizio</th>
                    <th className="p-2 md:p-4 min-w-[120px] md:min-w-[160px] font-bold">Scadenza</th>
                    <th className="p-2 md:p-4 min-w-[120px] md:min-w-[160px] font-bold">Anamnesi</th>
                    <th className="p-2 md:p-4 text-right min-w-[100px] md:min-w-[120px] font-bold sticky right-0 bg-slate-800/95 z-10">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedClients.map((c) => {
                    const expiry = toDate(c.scadenza);
                    const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    const totalPayments = paymentsTotals[c.id] ?? 0;

                    return (
                      <tr key={c.id} className={`border-t border-white/10 hover:bg-white/10 transition-all ${selectedClients.includes(c.id) ? 'bg-blue-500/5' : ''}`}>
                        <td className="p-2 md:p-4">
                          <input
                            type="checkbox"
                            checked={selectedClients.includes(c.id)}
                            onChange={() => toggleClientSelection(c.id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2 md:p-4 font-medium min-w-[150px] md:min-w-[180px] sticky left-0 bg-slate-800/95">
                          <div className="flex items-center justify-between gap-2 md:gap-3">
                            <button onClick={() => navigate(`/client/${c.id}`)} className="text-left hover:text-rose-400 transition-colors truncate">
                              {c.name || "-"}
                            </button>
                            <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-600/50 whitespace-nowrap">
                              €{totalPayments.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 md:p-4 min-w-[100px] md:min-w-[140px] text-[10px] md:text-xs">{toDate(c.startDate)?.toLocaleDateString('it-IT') || 'N/D'}</td>
                        <td className="p-2 md:p-4 min-w-[120px] md:min-w-[160px]">
                          {expiry ? (
                            <div className="flex items-center gap-1 md:gap-2">
                              <span className={`font-medium ${
                                daysToExpiry < 0 ? 'text-red-400' : 
                                daysToExpiry <= 7 ? 'text-amber-400' : 
                                'text-emerald-400'
                              }`}>
                                {expiry.toLocaleDateString('it-IT')}
                              </span>
                              {daysToExpiry !== null && (
                                <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium whitespace-nowrap ${
                                  daysToExpiry < 0 ? 'bg-red-900/40 text-red-300 border border-red-600/50' 
                                  : daysToExpiry <= 7 ? 'bg-amber-900/40 text-amber-300 border border-amber-600/50'
                                  : 'bg-emerald-900/40 text-emerald-300 border border-emerald-600/50'
                                }`}>
                                  {daysToExpiry < 0 ? 'Scaduto' : `${daysToExpiry} gg`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">N/D</span>
                          )}
                        </td>
                        <td className="p-2 md:p-4 min-w-[120px] md:min-w-[160px]"><AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]} /></td>
                        <td className="p-2 md:p-4 text-right min-w-[100px] md:min-w-[120px] sticky right-0 bg-slate-800/95">
                          <div className="flex items-center justify-end gap-1 md:gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/edit/${c.id}`); }}
                              className="p-1.5 md:p-2 text-amber-400 hover:bg-white/10 rounded-lg transition-all min-w-[36px] min-h-[36px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center"
                              title="Modifica"
                            >
                              <FilePenLine size={14}/>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setClientToDelete(c); }}
                              className="p-1.5 md:p-2 text-red-400 hover:bg-white/10 rounded-lg transition-all min-w-[36px] min-h-[36px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center"
                              title="Elimina"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedClients.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12">
                        <EmptyClients onAddClient={() => navigate('/new-client')} />
                      </td>
                    </tr>
                  )}
                </tbody>
                </table>
              </div>
            </div>


          </>
        )}

        {/* VISTA CARD */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6 mx-3 sm:mx-6 max-w-[1800px]">
            {filteredAndSortedClients.map((c) => {
              const expiry = toDate(c.scadenza);
              const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
              const totalPayments = paymentsTotals[c.id] ?? 0;

              return (
                <div key={c.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{c.name}</h3>
                      <p className="text-xs text-rose-400">{c.email}</p>
                      <p className="text-xs text-slate-500">{c.phone || 'N/D'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/client/${c.id}`); }} className="text-xs text-cyan-400 hover:text-cyan-300">Dettagli</button>
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setClientToDelete(c); }} className="text-xs text-red-400 hover:text-red-300">Elimina</button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Inizio</span><span className="text-slate-300">{toDate(c.startDate)?.toLocaleDateString('it-IT') || 'N/D'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Scadenza</span><span className={`font-medium ${daysToExpiry < 0 ? 'text-red-400' : daysToExpiry <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>{expiry?.toLocaleDateString('it-IT') || 'N/D'}</span></div>
                    {daysToExpiry !== null && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Giorni</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          daysToExpiry < 0 ? 'bg-red-900/40 text-red-300 border border-red-600/50' :
                          daysToExpiry <= 7 ? 'bg-amber-900/40 text-amber-300 border border-amber-600/50' :
                          'bg-emerald-900/40 text-emerald-300 border border-emerald-600/50'
                        }`}>
                          {daysToExpiry < 0 ? 'Scaduto' : `${daysToExpiry} gg`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between"><span className="text-slate-400">Pagamenti</span><span className="font-medium text-cyan-400">€{totalPayments.toFixed(2)}</span></div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10"><AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]} /></div>

                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/edit/${c.id}`); }} className="flex-1 py-2 bg-rose-600 text-white preserve-white text-xs rounded-lg hover:bg-rose-700 transition font-medium">
                      Modifica
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredAndSortedClients.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                <Search size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nessun cliente trovato</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CLIENTI AGGIUNTI NEL GIORNO */}
      <AnimatePresence>
        {dayModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDayModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100">
                  {(filter === 'expiring' || filter === 'expired' || calendarType === 'scadenze') ? 'Scadenze del' : 'Clienti aggiunti il'} {dayModalDate ? new Date(dayModalDate).toLocaleDateString('it-IT') : ''}
                </h3>
                <button onClick={() => setDayModalOpen(false)} className="p-1.5 rounded-full hover:bg-white/10">
                  <X size={18} className="text-slate-300" />
                </button>
              </div>

              {dayModalClients.length > 0 ? (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {dayModalClients.map(c => (
                    <div key={c.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-slate-100 font-semibold">{c.name}</p>
                        <p className="text-xs text-rose-300">{c.email}</p>
                        <div className="flex gap-3 text-xs text-slate-400">
                          <span>Inizio: {toDate(c.startDate)?.toLocaleDateString('it-IT') || 'N/D'}</span>
                          <span>Scadenza: {toDate(c.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-600/50">
                          €{(paymentsTotals[c.id] ?? 0).toFixed(2)}
                        </span>
                        <button onClick={() => navigate(`/client/${c.id}`)} className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white preserve-white transition-colors">
                          Dettagli
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Nessun cliente aggiunto in questa data.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Floating Button */}
      <QuickActions position="bottom-right" />

      {/* Bulk Operations Toolbar */}
      <BulkOperations
        selectedClients={selectedClients.map(id => clients.find(c => c.id === id)).filter(Boolean)}
        onClearSelection={() => setSelectedClients([])}
        onOperationComplete={handleBulkOperationComplete}
      />
    </div>
  );
}