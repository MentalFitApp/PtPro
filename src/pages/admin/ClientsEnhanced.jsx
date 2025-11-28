// ESEMPIO DI INTEGRAZIONE - src/pages/admin/ClientsEnhanced.jsx
// Questo file mostra come integrare i nuovi componenti nella pagina Clients esistente

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, toDate, calcolaStatoPercorso } from "../../firebase";
import { getTenantCollection } from '../../config/tenant';
import { onSnapshot } from "firebase/firestore";
import { getClientAnamnesi, getClientPayments, deleteClient } from '../../services/clientService';
import { 
  UserPlus, Search, Download, LayoutGrid, List
} from "lucide-react";
import { motion } from "framer-motion";

// ✨ NUOVI COMPONENTI
import QuickActions from '../../components/admin/QuickActions';
import SavedFilters from '../../components/admin/SavedFilters';
import BulkOperations from '../../components/admin/BulkOperations';
import MessageTemplates from '../../components/admin/MessageTemplates';
import { useToast } from '../../contexts/ToastContext';

export default function ClientsEnhanced() {
  const navigate = useNavigate();
  const toast = useToast();

  // Stati esistenti
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('list');

  // ✨ NUOVI STATI per funzionalità avanzate
  const [selectedClients, setSelectedClients] = useState([]);
  const [savedFiltersConfig, setSavedFiltersConfig] = useState({
    searchQuery: '',
    filter: 'all',
    sortField: 'startDate',
    sortDirection: 'desc',
  });

  // Carica clienti (logica esistente)
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin') {
      navigate('/login');
      return;
    }

    const q = getTenantCollection(db, 'clients');
    const unsub = onSnapshot(q, async (snap) => {
      const clientList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientList);
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  // Filtra e ordina clienti
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    // Ricerca
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro stato
    if (filter !== 'all') {
      filtered = filtered.filter(c => {
        const stato = calcolaStatoPercorso(c.scadenza);
        if (filter === 'active') return stato === 'attivo';
        if (filter === 'expiring') return stato === 'in_scadenza';
        if (filter === 'expired') return stato === 'scaduto';
        return true;
      });
    }

    // Ordinamento
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      return aVal > bVal ? modifier : -modifier;
    });

    return filtered;
  }, [clients, searchQuery, filter, sortField, sortDirection]);

  // ✨ HANDLER per filtri salvati
  const handleApplySavedFilter = (savedFilter) => {
    setSearchQuery(savedFilter.searchQuery || '');
    setFilter(savedFilter.filter || 'all');
    setSortField(savedFilter.sortField || 'startDate');
    setSortDirection(savedFilter.sortDirection || 'desc');
    toast.success('Filtro applicato!');
  };

  // ✨ HANDLER per selezione clienti
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

  // ✨ HANDLER per bulk operations
  const handleBulkOperationComplete = () => {
    setSelectedClients([]);
    // Ricarica dati se necessario
    toast.success('Operazione completata!');
  };

  // ✨ HANDLER per template messaggi
  const handleSelectTemplate = (template) => {
    // Apri dialog invio email/SMS con template precompilato
    console.log('Template selezionato:', template);
    toast.info(`Template "${template.name}" pronto per l'invio`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER con statistiche */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Clienti</h1>
          <p className="text-slate-400">
            {filteredAndSortedClients.length} di {clients.length} clienti
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/new-client')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white preserve-white rounded-lg transition-all"
          >
            <UserPlus size={18} />
            Nuovo Cliente
          </button>

          <button
            onClick={() => exportToCSV(filteredAndSortedClients)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white preserve-white rounded-lg transition-all"
          >
            <Download size={18} />
            Esporta
          </button>
        </div>
      </div>

      {/* ✨ TOOLBAR AVANZATA con nuovi componenti */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Ricerca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca clienti..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtri Rapidi */}
        <div className="flex gap-2">
          {['all', 'active', 'expiring', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white preserve-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'Tutti' : 
               f === 'active' ? 'Attivi' : 
               f === 'expiring' ? 'In Scadenza' : 'Scaduti'}
            </button>
          ))}
        </div>

        {/* ✨ FILTRI SALVATI */}
        <SavedFilters
          currentFilters={savedFiltersConfig}
          onApplyFilter={handleApplySavedFilter}
          storageKey="clients_saved_filters"
        />

        {/* ✨ TEMPLATE MESSAGGI */}
        <MessageTemplates
          onSelectTemplate={handleSelectTemplate}
          storageKey="clients_message_templates"
        />

        {/* View Mode */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-all ${
              viewMode === 'list' ? 'bg-slate-700 text-white preserve-white' : 'text-slate-400'
            }`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded transition-all ${
              viewMode === 'card' ? 'bg-slate-700 text-white preserve-white' : 'text-slate-400'
            }`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* ✨ SELEZIONE MULTIPLA - Info bar */}
      {selectedClients.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-300 font-medium">
            {selectedClients.length} clienti selezionati
          </span>
          <button
            onClick={() => setSelectedClients([])}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Deseleziona tutti
          </button>
        </div>
      )}

      {/* TABELLA CLIENTI con checkbox */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              {/* ✨ CHECKBOX SELEZIONA TUTTI */}
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.length === filteredAndSortedClients.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="p-4 text-left text-sm font-semibold text-slate-300">Nome</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-300">Email</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-300">Telefono</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-300">Scadenza</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-300">Stato</th>
              <th className="p-4 text-left text-sm font-semibold text-slate-300">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedClients.map((client) => (
              <motion.tr
                key={client.id}
                layout
                className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                  selectedClients.includes(client.id) ? 'bg-blue-500/5' : ''
                }`}
              >
                {/* ✨ CHECKBOX SELEZIONE */}
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => toggleClientSelection(client.id)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="p-4 text-white font-medium">{client.name}</td>
                <td className="p-4 text-slate-400">{client.email}</td>
                <td className="p-4 text-slate-400">{client.phone}</td>
                <td className="p-4 text-slate-400">
                  {toDate(client.scadenza)?.toLocaleDateString('it-IT')}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    calcolaStatoPercorso(client.scadenza) === 'attivo' 
                      ? 'bg-green-500/20 text-green-400'
                      : calcolaStatoPercorso(client.scadenza) === 'in_scadenza'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {calcolaStatoPercorso(client.scadenza)}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => navigate(`/admin/client/${client.id}`)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Dettagli
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedClients.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>Nessun cliente trovato</p>
          </div>
        )}
      </div>

      {/* ✨ QUICK ACTIONS - Floating button */}
      <QuickActions position="bottom-right" />

      {/* ✨ BULK OPERATIONS - Toolbar per selezione multipla */}
      <BulkOperations
        selectedClients={selectedClients.map(id => 
          clients.find(c => c.id === id)
        ).filter(Boolean)}
        onClearSelection={() => setSelectedClients([])}
        onOperationComplete={handleBulkOperationComplete}
      />
    </div>
  );
}

// Helper function (esistente)
const exportToCSV = (clients) => {
  // Implementazione esistente...
  console.log('Export CSV:', clients);
};
