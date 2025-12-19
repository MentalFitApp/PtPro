// src/pages/admin/Clients/hooks/useClientsState.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, toDate, calcolaStatoPercorso, updateStatoPercorso } from '../../../../firebase';
import { getTenantCollection } from '../../../../config/tenant';
import { getClientAnamnesi, getClientPayments, deleteClient } from '../../../../services/clientService';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useToast } from '../../../../contexts/ToastContext';

/**
 * Custom hook per gestire tutto lo stato di Clients
 * Consolida ~25 useState in un unico hook organizzato
 */
export default function useClientsState(propRole) {
  const navigate = useNavigate();
  const toast = useToast();

  // === RUOLO ===
  let userRole = propRole;
  if (!userRole) {
    try { 
      userRole = sessionStorage.getItem('app_role') || JSON.parse(localStorage.getItem('user'))?.role || null; 
    } catch {}
  }
  const isAdmin = userRole === 'admin' || !userRole;
  const isCoach = userRole === 'coach';

  // === DATI PRINCIPALI ===
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anamnesiStatus, setAnamnesiStatus] = useState({});
  const [paymentsTotals, setPaymentsTotals] = useState({});

  // === FILTRI E ORDINAMENTO ===
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showArchived, setShowArchived] = useState(false);

  // === UI STATE ===
  const [viewMode, setViewMode] = useState('list');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [clientToDelete, setClientToDelete] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);

  // === CALENDARIO ===
  const [meseCalendario, setMeseCalendario] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState('iscrizioni');
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState(null);
  const [dayModalClients, setDayModalClients] = useState([]);

  // === FILTRI AVANZATI ===
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    hasAnamnesi: null,
    paymentRange: { min: 0, max: 10000 },
    dateRange: { start: '', end: '' },
    states: { active: true, expiring: true, expired: true, renewed: true }
  });

  // === STATISTICHE ===
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0 });

  // === HELPER FUNCTIONS ===
  const getClientPath = useCallback((clientId) => 
    isCoach ? `/coach/client/${clientId}` : `/admin/client/${clientId}`, 
  [isCoach]);

  const showNotification = useCallback((message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      showNotification(`Errore logout: ${error.message}`, 'error');
    }
  }, [navigate, showNotification]);

  // === CARICAMENTO DATI ===
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'coach') {
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
            rate: data.rate || [],
            isArchived: data.isArchived || false,
            archivedAt: data.archivedAt,
            archiveSettings: data.archiveSettings,
            // Usa campo denormalizzato se disponibile
            hasAnamnesi: data.hasAnamnesi
          };
        });

        // Anamnesi: controlla solo per clienti che non hanno il campo denormalizzato
        // Usa batch da 10 per evitare troppe query parallele
        const clientsWithoutAnamnesiField = clientList.filter(c => c.hasAnamnesi === undefined);
        const anamnesiStatusTemp = {};
        
        // Inizializza con valori denormalizzati
        clientList.forEach(c => {
          if (c.hasAnamnesi !== undefined) {
            anamnesiStatusTemp[c.id] = c.hasAnamnesi;
          }
        });

        // Carica in batch da 10 per evitare N+1 estremo
        const BATCH_SIZE = 10;
        for (let i = 0; i < clientsWithoutAnamnesiField.length; i += BATCH_SIZE) {
          const batch = clientsWithoutAnamnesiField.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batch.map(client => 
              getClientAnamnesi(db, client.id, 1)
                .then(anamnesi => ({ clientId: client.id, hasAnamnesi: anamnesi.length > 0 }))
                .catch(() => ({ clientId: client.id, hasAnamnesi: false }))
            )
          );
          batchResults.forEach(result => {
            anamnesiStatusTemp[result.clientId] = result.hasAnamnesi;
          });
        }
        
        setAnamnesiStatus(anamnesiStatusTemp);

        // Badge: clienti senza anamnesi
        const missingAnamnesi = Object.values(anamnesiStatusTemp).filter(v => !v).length;
        try {
          localStorage.setItem('ff_badge_clients', String(missingAnamnesi));
          window.dispatchEvent(new Event('ff-badges-updated'));
        } catch {}

        // Pagamenti (solo admin) - carica in batch per evitare N+1 estremo
        if (isAdmin) {
          const paymentsTotalsTemp = {};
          const PAYMENT_BATCH_SIZE = 10;
          
          for (let i = 0; i < clientList.length; i += PAYMENT_BATCH_SIZE) {
            const batch = clientList.slice(i, i + PAYMENT_BATCH_SIZE);
            const batchResults = await Promise.all(
              batch.map(async client => {
                const rateArr = Array.isArray(client.rate) ? client.rate : [];
                const rateSum = rateArr.filter(r => r.paid).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
                const payments = await getClientPayments(db, client.id).catch(() => []);
                const paymentsSum = payments.reduce((acc, payment) => acc + (Number(payment.amount) || 0), 0);
                return { clientId: client.id, total: rateSum + paymentsSum };
              })
            );
            batchResults.forEach(result => {
              paymentsTotalsTemp[result.clientId] = result.total;
            });
          }
          
          setPaymentsTotals(paymentsTotalsTemp);
        }

        clientList.forEach(client => updateStatoPercorso(client.id));
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        showNotification('Errore caricamento clienti', 'error');
        setLoading(false);
      }
    }, () => {
      showNotification('Errore connessione', 'error');
      setLoading(false);
    });

    return () => unsub();
  }, [navigate, isAdmin, showNotification]);

  // === STATISTICHE IN TEMPO REALE ===
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

  // === FILTRI E ORDINAMENTO ===
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter(client => {
      if (!showArchived && client.isArchived) return false;
      if (showArchived && !client.isArchived) return false;

      const matchesSearch = 
        (client.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(debouncedSearch.toLowerCase());

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
  }, [clients, debouncedSearch, filter, sortField, sortDirection, anamnesiStatus, showArchived]);

  // === AZIONI ===
  const handleDelete = useCallback(async () => {
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
  }, [clientToDelete, showNotification]);

  const toggleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const toggleClientSelection = useCallback((clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedClients.length === filteredAndSortedClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredAndSortedClients.map(c => c.id));
    }
  }, [selectedClients.length, filteredAndSortedClients]);

  const handleBulkOperationComplete = useCallback(() => {
    setSelectedClients([]);
    toast.success('Operazione completata con successo!');
  }, [toast]);

  const openDayModal = useCallback((giorno) => {
    let clientsForDay;
    
    if (filter === 'expiring' || filter === 'expired') {
      clientsForDay = filteredAndSortedClients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && expiry.toDateString() === giorno.toDateString();
      });
    } else if (calendarType === 'scadenze') {
      clientsForDay = filteredAndSortedClients.filter(c => {
        const expiry = toDate(c.scadenza);
        return expiry && expiry.toDateString() === giorno.toDateString();
      });
    } else {
      clientsForDay = filteredAndSortedClients.filter(c => {
        const created = toDate(c.createdAt);
        const start = toDate(c.startDate);
        const referenceDate = created || start;
        return referenceDate && referenceDate.toDateString() === giorno.toDateString();
      });
    }
    setDayModalDate(giorno);
    setDayModalClients(clientsForDay);
    setDayModalOpen(true);
  }, [filter, calendarType, filteredAndSortedClients]);

  const resetAdvancedFilters = useCallback(() => {
    setAdvancedFilters({
      hasAnamnesi: null,
      paymentRange: { min: 0, max: 10000 },
      dateRange: { start: '', end: '' },
      states: { active: true, expiring: true, expired: true, renewed: true }
    });
  }, []);

  return {
    // Ruolo
    isAdmin,
    isCoach,
    
    // Dati
    clients,
    loading,
    anamnesiStatus,
    paymentsTotals,
    stats,
    filteredAndSortedClients,
    
    // Filtri
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    sortField,
    sortDirection,
    toggleSort,
    showArchived,
    setShowArchived,
    
    // Filtri avanzati
    filterPanelOpen,
    setFilterPanelOpen,
    advancedFilters,
    setAdvancedFilters,
    resetAdvancedFilters,
    
    // UI
    viewMode,
    setViewMode,
    notification,
    setNotification,
    showNotification,
    
    // Selezione
    selectedClients,
    setSelectedClients,
    toggleClientSelection,
    toggleSelectAll,
    handleBulkOperationComplete,
    
    // Eliminazione
    clientToDelete,
    setClientToDelete,
    handleDelete,
    
    // Calendario
    meseCalendario,
    setMeseCalendario,
    showCalendar,
    setShowCalendar,
    calendarType,
    setCalendarType,
    dayModalOpen,
    setDayModalOpen,
    dayModalDate,
    dayModalClients,
    openDayModal,
    
    // Navigazione
    getClientPath,
    handleLogout,
    navigate
  };
}
