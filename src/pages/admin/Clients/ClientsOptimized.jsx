// src/pages/admin/Clients/ClientsOptimized.jsx
// Versione ottimizzata della pagina Clients con virtualizzazione e caching

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, Filter, LayoutGrid, List, Download, RefreshCw } from 'lucide-react';
import { useClientsState } from './hooks';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { usePageInfo } from '../../../contexts/PageContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { VirtualList } from '../../../components/ui/VirtualList';
import { useFirestoreSnapshot } from '../../../hooks/useFirestoreOptimized';
import { getTenantCollection } from '../../../config/tenant';
import { db } from '../../../firebase';
import {
  Notification,
  ConfirmationModal,
  ClientListView,
  ClientCardView
} from './components';
import FilterPanel from '../../../components/layout/FilterPanel';

// Client Card per virtualizzazione (altezza fissa)
const VirtualClientCard = ({ client, onClick, onDelete, isSelected, onSelect }) => (
  <div className="p-4 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-xl hover:bg-slate-800/60 transition-all">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0" onClick={onClick}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {client.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{client.name || 'Senza nome'}</h3>
          <p className="text-sm text-slate-400 truncate">{client.email || 'Email non disponibile'}</p>
        </div>
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelect(client.id);
        }}
        className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 bg-slate-700"
      />
    </div>
  </div>
);

// Altezza fissa per client card
const CLIENT_CARD_HEIGHT = 88; // px
const CONTAINER_HEIGHT = typeof window !== 'undefined' ? window.innerHeight - 250 : 600;

export default function ClientsOptimized({ role: propRole }) {
  const { confirmDelete } = useConfirm();
  
  // Usa snapshot ottimizzato per clients
  const { data: clientsRaw, loading: clientsLoading, invalidateCache } = useFirestoreSnapshot(
    getTenantCollection(db, 'clients'),
    {
      cacheKey: 'clients-list',
      cacheTTL: 3 * 60 * 1000, // 3 minuti
      debounceMs: 150
    }
  );

  const {
    // UI e filtri
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    viewMode,
    setViewMode,
    notification,
    setNotification,
    // Selezione
    selectedClients,
    toggleClientSelection,
    toggleSelectAll,
    // Eliminazione
    clientToDelete,
    setClientToDelete,
    handleDelete,
    // Altri
    isAdmin,
    navigate
  } = useClientsState(propRole);

  useDocumentTitle('Clienti');
  usePageInfo({
    pageTitle: 'Clienti',
    pageSubtitle: `${clientsRaw?.length || 0} clienti totali`,
    breadcrumbs: [
      { label: 'Dashboard', to: '/' },
      { label: 'Clienti' }
    ]
  }, [clientsRaw?.length]);

  // Filtra e ordina clienti (memoizzato)
  const filteredClients = useMemo(() => {
    if (!clientsRaw) return [];
    
    let filtered = [...clientsRaw];
    
    // Filtro ricerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
      );
    }
    
    // Filtro stato
    if (filter !== 'tutti') {
      const now = new Date();
      filtered = filtered.filter(c => {
        const expiry = c.scadenza?.toDate?.() || null;
        if (filter === 'attivi') return expiry && expiry > now;
        if (filter === 'scaduti') return !expiry || expiry <= now;
        return true;
      });
    }
    
    return filtered;
  }, [clientsRaw, searchQuery, filter]);

  // Handler refresh
  const handleRefresh = useCallback(() => {
    invalidateCache();
  }, [invalidateCache]);

  // Loading
  if (clientsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Notification
        message={notification.message}
        type={notification.type}
        onDismiss={() => setNotification({ message: '', type: '' })}
      />

      <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDelete}
        clientName={clientToDelete?.name}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="px-4 sm:px-6 py-4">
          {/* Search e Actions */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cerca per nome o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            
            <button
              onClick={() => navigate('/new-client')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Nuovo</span>
            </button>

            <button
              onClick={handleRefresh}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Filtri rapidi */}
          <div className="flex items-center gap-2">
            {['tutti', 'attivi', 'scaduti'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}

            <div className="flex-1" />

            {/* View mode toggle */}
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>

          {/* Info risultati */}
          <div className="mt-3 text-sm text-slate-400">
            {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clienti'}
            {selectedClients.length > 0 && (
              <span className="ml-2">
                • {selectedClients.length} selezionat{selectedClients.length === 1 ? 'o' : 'i'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lista Virtualizzata */}
      <div className="px-4 sm:px-6 py-4">
        {viewMode === 'list' && filteredClients.length > 50 ? (
          // Virtualizzazione per liste lunghe
          <VirtualList
            items={filteredClients}
            itemHeight={CLIENT_CARD_HEIGHT}
            containerHeight={CONTAINER_HEIGHT}
            renderItem={(client) => (
              <VirtualClientCard
                client={client}
                onClick={() => navigate(`/client/${client.id}`)}
                onDelete={() => setClientToDelete(client)}
                isSelected={selectedClients.includes(client.id)}
                onSelect={toggleClientSelection}
              />
            )}
            className="bg-slate-900"
          />
        ) : viewMode === 'list' ? (
          // Lista normale per pochi elementi
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <VirtualClientCard
                key={client.id}
                client={client}
                onClick={() => navigate(`/client/${client.id}`)}
                onDelete={() => setClientToDelete(client)}
                isSelected={selectedClients.includes(client.id)}
                onSelect={toggleClientSelection}
              />
            ))}
          </div>
        ) : (
          // Card view
          <ClientCardView
            clients={filteredClients}
            selectedClients={selectedClients}
            toggleClientSelection={toggleClientSelection}
            isAdmin={isAdmin}
            onDeleteClient={setClientToDelete}
            getClientPath={(id) => `/client/${id}`}
          />
        )}

        {/* Empty state */}
        {filteredClients.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <Search size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nessun cliente trovato</h3>
            <p className="text-slate-400">
              {searchQuery
                ? 'Prova a modificare i criteri di ricerca'
                : 'Inizia aggiungendo il primo cliente'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
