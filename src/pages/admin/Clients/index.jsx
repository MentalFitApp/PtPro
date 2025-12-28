// src/pages/admin/Clients/index.jsx
// Versione refactored - Componente principale ridotto che usa moduli estratti
import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, Search, ArrowUp, ArrowDown, 
  CheckCircle, XCircle, Calendar, Clock, AlertCircle, 
  Download, Filter, LayoutGrid, List, Archive, Trash2, RotateCcw
} from 'lucide-react';

// Hooks
import { useClientsState } from './hooks';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { usePageInfo } from '../../../contexts/PageContext';
import { useConfirm } from '../../../contexts/ConfirmContext';

// Componenti estratti
import {
  Notification,
  ConfirmationModal,
  DayModal,
  ClientCalendar,
  ClientListView,
  ClientCardView
} from './components';

// Componenti esistenti
import BulkOperations from '../../../components/admin/BulkOperations';
import InvitesManager from '../../../components/admin/InvitesManager';
import FilterPanel, { FilterSection, FilterCheckbox, FilterDateRange } from '../../../components/layout/FilterPanel';
import KanbanBoard, { KanbanCard } from '../../../components/layout/KanbanBoard';
import { toDate } from '../../../firebase';
import { FileText, FilePenLine } from 'lucide-react';

// Utils
import { exportToCSV } from './utils';

export default function Clients({ role: propRole }) {
  const { confirmDelete } = useConfirm();
  const {
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
    // Cestino
    showTrash,
    setShowTrash,
    deletedClients,
    handleRestore,
    handlePermanentDelete,
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
  } = useClientsState(propRole);

  // Document title
  useDocumentTitle('Clienti');
  
  // Imposta titolo nell'header
  usePageInfo({
    pageTitle: 'Clienti',
    pageSubtitle: `${stats.total} clienti totali`,
    breadcrumbs: [
      { label: 'Dashboard', to: '/' },
      { label: 'Clienti' }
    ]
  }, [stats.total]);

  // Sort icon helper (memoizzato)
  const getSortIcon = useCallback((field) => {
    if (sortField !== field) return null;
    return sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />;
  }, [sortField, sortDirection]);

  // Loading state
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="overflow-x-hidden w-full">
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
      
      {/* Filter Panel */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        title="Filtri Avanzati"
        footer={
          <div className="flex gap-2">
            <button
              onClick={resetAdvancedFilters}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setFilterPanelOpen(false)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Applica
            </button>
          </div>
        }
      >
        <FilterSection title="Stato Cliente" icon={CheckCircle} defaultOpen={true}>
          <FilterCheckbox
            label="Attivi"
            checked={advancedFilters.states.active}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              states: { ...prev.states, active: e.target.checked }
            }))}
            count={clients.filter(c => {
              const expiry = toDate(c.scadenza);
              return expiry && expiry > new Date();
            }).length}
          />
          <FilterCheckbox
            label="In Scadenza (15gg)"
            checked={advancedFilters.states.expiring}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              states: { ...prev.states, expiring: e.target.checked }
            }))}
            count={stats.expiring}
          />
          <FilterCheckbox
            label="Scaduti"
            checked={advancedFilters.states.expired}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              states: { ...prev.states, expired: e.target.checked }
            }))}
            count={stats.expired}
          />
        </FilterSection>

        <FilterSection title="Anamnesi" icon={FileText}>
          <div className="space-y-2">
            {[
              { value: null, label: 'Tutte' },
              { value: true, label: 'Solo con Anamnesi' },
              { value: false, label: 'Solo senza Anamnesi' }
            ].map(opt => (
              <label key={String(opt.value)} className="flex items-center gap-2 p-2 hover:bg-slate-800/30 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="anamnesi"
                  checked={advancedFilters.hasAnamnesi === opt.value}
                  onChange={() => setAdvancedFilters(prev => ({ ...prev, hasAnamnesi: opt.value }))}
                  className="accent-blue-500"
                />
                <span className="text-sm text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Range Date" icon={Calendar}>
          <FilterDateRange
            label="Periodo di Iscrizione"
            startDate={advancedFilters.dateRange.start}
            endDate={advancedFilters.dateRange.end}
            onStartChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, start: e.target.value }
            }))}
            onEndChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, end: e.target.value }
            }))}
          />
        </FilterSection>
      </FilterPanel>

      <div className="mobile-container py-4 sm:py-6 space-y-4 sm:space-y-6 mobile-safe-bottom">
        {/* HEADER MOBILE */}
        <div className="md:hidden bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 mx-3">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Clienti</h1>
          
          {/* Stats */}
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
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2.5 pl-10 w-full outline-none focus:ring-2 focus:ring-rose-500 text-sm text-slate-200 placeholder:text-slate-500"
              placeholder="Cerca clienti..."
            />
          </div>

          {/* Actions */}
          <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-1'} gap-2 mb-3`}>
            <button onClick={() => setFilterPanelOpen(true)} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white preserve-white text-sm font-medium rounded-lg transition-colors">
              <Filter size={16} />
            </button>
            {isAdmin && (
              <>
                <button onClick={() => navigate("/new-client")} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white preserve-white text-sm font-medium rounded-lg transition-colors">
                  <UserPlus size={16} />
                </button>
                <button onClick={() => exportToCSV(clients)} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white preserve-white text-sm font-medium rounded-lg transition-colors">
                  <Download size={16} />
                </button>
              </>
            )}
          </div>

          {/* View Toggle */}
          <div className="grid grid-cols-3 gap-1 bg-slate-700/50 border border-slate-600 rounded-lg p-1 mb-3">
            {[
              { key: 'list', icon: List, label: 'Lista' },
              { key: 'card', icon: LayoutGrid, label: 'Card' },
              { key: 'kanban', icon: LayoutGrid, label: 'Board', rotate: true }
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-md transition-colors text-xs ${viewMode === v.key ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400'}`}
              >
                <v.icon size={14} className={v.rotate ? 'rotate-90' : ''} /> {v.label}
              </button>
            ))}
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hidden">
            <button onClick={() => { setFilter('all'); setShowArchived(false); setShowTrash(false); }} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${filter === 'all' && !showArchived && !showTrash ? 'bg-rose-600 text-white preserve-white' : 'bg-slate-700 text-slate-300'}`}>Tutti</button>
            <button onClick={() => { setFilter('active'); setShowArchived(false); setShowTrash(false); }} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'active' ? 'bg-emerald-600 text-white preserve-white' : 'bg-slate-700 text-emerald-400'}`}><CheckCircle size={12} /> Attivi</button>
            <button onClick={() => { setFilter('expiring'); setShowArchived(false); setShowTrash(false); }} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'expiring' ? 'bg-amber-600 text-white preserve-white' : 'bg-slate-700 text-amber-400'}`}><Clock size={12} /> Scadenza</button>
            <button onClick={() => { setFilter('expired'); setShowArchived(false); setShowTrash(false); }} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'expired' ? 'bg-red-600 text-white preserve-white' : 'bg-slate-700 text-red-400'}`}><AlertCircle size={12} /> Scaduti</button>
            <button onClick={() => { setShowArchived(!showArchived); setShowTrash(false); }} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${showArchived ? 'bg-slate-600 text-white preserve-white' : 'bg-slate-700 text-slate-400'}`}><Archive size={12} /> {showArchived ? 'Archiviati' : 'Archivio'}</button>
            <button onClick={() => { setShowTrash(!showTrash); setShowArchived(false); }} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${showTrash ? 'bg-red-600 text-white preserve-white' : 'bg-slate-700 text-slate-400'}`}><Trash2 size={12} /> Cestino {deletedClients.length > 0 && `(${deletedClients.length})`}</button>
          </div>
        </div>

        {/* HEADER DESKTOP */}
        <div className="hidden md:block bg-slate-900/60 border border-white/10 shadow-glow rounded-2xl p-6 mx-3 sm:mx-6">
          {/* Riga 1: Titolo + Azioni principali */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-2">Clienti</h1>
              <div className="flex gap-4 text-sm">
                <span className="text-slate-400">Totale: <strong className="text-white">{stats.total}</strong></span>
                <span className="text-slate-400">In scadenza: <strong className="text-amber-400">{stats.expiring}</strong></span>
                <span className="text-slate-400">Scaduti: <strong className="text-red-400">{stats.expired}</strong></span>
              </div>
            </div>
            
            {/* Azioni principali */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button onClick={() => navigate("/new-client")} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white preserve-white text-sm font-medium rounded-lg transition-colors">
                    <UserPlus size={16} /> Nuovo Cliente
                  </button>
                  <button onClick={() => exportToCSV(clients)} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600">
                    <Download size={16} /> CSV
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Riga 2: Ricerca + Filtri rapidi + Vista */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Ricerca */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 pl-10 w-full outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 text-sm text-slate-200 placeholder:text-slate-500"
                placeholder="Cerca cliente..."
              />
            </div>

            {/* Filtri rapidi */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:text-slate-200'}`}>Tutti</button>
              <button onClick={() => setFilter('active')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'active' ? 'bg-emerald-600 text-white preserve-white' : 'text-emerald-400 hover:bg-emerald-900/30'}`}>Attivi</button>
              <button onClick={() => setFilter('expiring')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'expiring' ? 'bg-amber-600 text-white preserve-white' : 'text-amber-400 hover:bg-amber-900/30'}`}>Scadenza</button>
              <button onClick={() => setFilter('expired')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'expired' ? 'bg-red-600 text-white preserve-white' : 'text-red-400 hover:bg-red-900/30'}`}>Scaduti</button>
            </div>

            {/* Filtri avanzati */}
            <button
              onClick={() => setFilterPanelOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-slate-700"
            >
              <Filter size={16} /> Filtri
            </button>

            {/* Separatore */}
            <div className="w-px h-8 bg-slate-700"></div>

            {/* Vista */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
              {[
                { key: 'list', icon: List, title: 'Lista' },
                { key: 'card', icon: LayoutGrid, title: 'Card' },
                { key: 'kanban', icon: LayoutGrid, rotate: true, title: 'Kanban' }
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  title={v.title}
                  className={`p-2 rounded-md transition-colors ${viewMode === v.key ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <v.icon size={16} className={v.rotate ? 'rotate-90' : ''} />
                </button>
              ))}
            </div>

            {/* Calendario */}
            <button
              onClick={() => setShowCalendar(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors border ${showCalendar ? 'bg-rose-600 border-rose-600 text-white preserve-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'}`}
            >
              <Calendar size={16} />
            </button>
          </div>

          {/* Riga 3: Ordinamento + Info aggiuntive (solo se calendario attivo) */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider mr-2">Ordina:</span>
              {[
                { key: 'name', label: 'Nome' },
                { key: 'startDate', label: 'Inizio' },
                { key: 'expiry', label: 'Scadenza' }
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleSort(s.key)}
                  className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${sortField === s.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {s.label} {getSortIcon(s.key)}
                </button>
              ))}
              <button 
                onClick={() => { setShowArchived(!showArchived); setShowTrash(false); }} 
                className={`ml-2 px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${showArchived ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Archive size={12} /> {showArchived ? 'Archiviati' : 'Archivio'}
              </button>
              <button 
                onClick={() => { setShowTrash(!showTrash); setShowArchived(false); }} 
                className={`ml-1 px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${showTrash ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Trash2 size={12} /> Cestino {deletedClients.length > 0 && `(${deletedClients.length})`}
              </button>
            </div>
            
            {showCalendar && (
              <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setCalendarType('iscrizioni')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${calendarType === 'iscrizioni' ? 'bg-rose-600 text-white preserve-white' : 'text-slate-400'}`}
                >
                  Iscrizioni
                </button>
                <button
                  onClick={() => setCalendarType('scadenze')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${calendarType === 'scadenze' ? 'bg-amber-600 text-white preserve-white' : 'text-slate-400'}`}
                >
                  Scadenze
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selection Bar */}
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

        {/* Calendar Toggle Mobile */}
        <div className="md:hidden mx-3">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${showCalendar ? 'bg-rose-600 text-white preserve-white' : 'bg-slate-700 text-slate-300'}`}
          >
            <Calendar size={16} /> {showCalendar ? 'Nascondi' : 'Mostra'} Calendario
          </button>
        </div>

        {/* Invites Manager - Solo Admin */}
        {isAdmin && (
          <div className="mx-3 sm:mx-6">
            <InvitesManager />
          </div>
        )}

        {/* Calendar */}
        {showCalendar && !showTrash && (
          <ClientCalendar
            meseCalendario={meseCalendario}
            setMeseCalendario={setMeseCalendario}
            calendarType={calendarType}
            filter={filter}
            clients={clients}
            filteredClients={filteredAndSortedClients}
            onDayClick={openDayModal}
            onEditClient={(id) => navigate(`/edit/${id}`)}
            onDeleteClient={setClientToDelete}
            isAdmin={isAdmin}
          />
        )}

        {/* CESTINO */}
        {showTrash && (
          <div className="mx-3 sm:mx-6">
            <div className="bg-slate-900/60 border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Cestino</h2>
                  <p className="text-sm text-slate-400">{deletedClients.length} clienti eliminati</p>
                </div>
              </div>
              
              {deletedClients.length === 0 ? (
                <div className="text-center py-8">
                  <Trash2 size={48} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">Il cestino è vuoto</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deletedClients.map(client => (
                    <div key={client.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-medium">
                          {client.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{client.name || 'Senza nome'}</p>
                          <p className="text-sm text-slate-400">{client.email || 'Email non disponibile'}</p>
                          {client.deletedAt && (
                            <p className="text-xs text-red-400">
                              Eliminato il {new Date(client.deletedAt?.toDate?.() || client.deletedAt).toLocaleDateString('it-IT')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestore(client.id)}
                          className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <RotateCcw size={14} /> Ripristina
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await confirmDelete('questo cliente definitivamente');
                            if (confirmed) {
                              handlePermanentDelete(client.id);
                            }
                          }}
                          className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Views */}
        {!showTrash && viewMode === 'list' && (
          <div className="mx-3 sm:mx-6">
            <ClientListView
              clients={filteredAndSortedClients}
              selectedClients={selectedClients}
              toggleClientSelection={toggleClientSelection}
              toggleSelectAll={toggleSelectAll}
              anamnesiStatus={anamnesiStatus}
              paymentsTotals={paymentsTotals}
              isAdmin={isAdmin}
              isCoach={isCoach}
              filter={filter}
              onDeleteClient={setClientToDelete}
              getClientPath={getClientPath}
            />
          </div>
        )}

        {!showTrash && viewMode === 'card' && (
          <div className="mx-3 sm:mx-6">
            <ClientCardView
              clients={filteredAndSortedClients}
              anamnesiStatus={anamnesiStatus}
              paymentsTotals={paymentsTotals}
              isAdmin={isAdmin}
              onDeleteClient={setClientToDelete}
              getClientPath={getClientPath}
            />
          </div>
        )}

        {!showTrash && viewMode === 'kanban' && (
          <div className="mx-3 sm:mx-6">
            <KanbanBoard
              columns={[
                {
                  id: 'active',
                  title: 'Attivi',
                  color: 'emerald',
                  icon: CheckCircle,
                  items: filteredAndSortedClients.filter(c => {
                    const expiry = toDate(c.scadenza);
                    const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return expiry && daysToExpiry > 15;
                  })
                },
                {
                  id: 'expiring',
                  title: 'In Scadenza',
                  color: 'amber',
                  icon: Clock,
                  items: filteredAndSortedClients.filter(c => {
                    const expiry = toDate(c.scadenza);
                    const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return expiry && daysToExpiry <= 15 && daysToExpiry > 0;
                  })
                },
                {
                  id: 'expired',
                  title: 'Scaduti',
                  color: 'red',
                  icon: XCircle,
                  items: filteredAndSortedClients.filter(c => {
                    const expiry = toDate(c.scadenza);
                    return expiry && expiry < new Date();
                  })
                },
                {
                  id: 'no-expiry',
                  title: 'Senza Scadenza',
                  color: 'slate',
                  icon: AlertCircle,
                  items: filteredAndSortedClients.filter(c => !toDate(c.scadenza))
                }
              ]}
              onItemMove={() => {}}
              renderCard={(client) => (
                <KanbanCard
                  title={client.name || 'N/D'}
                  subtitle={client.email}
                  badge={isAdmin ? (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold">
                      €{(paymentsTotals[client.id] || 0).toFixed(0)}
                    </span>
                  ) : null}
                  onClick={() => navigate(getClientPath(client.id))}
                  actions={
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/edit/${client.id}`); }}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                      >
                        <FilePenLine size={14} className="text-blue-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setClientToDelete(client); }}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </>
                  }
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Scadenza:</span>
                    <span className="font-medium text-slate-300">
                      {toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}
                    </span>
                  </div>
                </KanbanCard>
              )}
              emptyState="Nessun cliente in questa categoria"
            />
          </div>
        )}
      </div>

      {/* Day Modal */}
      <DayModal
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        date={dayModalDate}
        clients={dayModalClients}
        calendarType={calendarType}
        filter={filter}
        paymentsTotals={paymentsTotals}
        isAdmin={isAdmin}
        onClientClick={(id) => navigate(getClientPath(id))}
      />

      {/* Floating Components */}
      <BulkOperations
        selectedClients={selectedClients.map(id => clients.find(c => c.id === id)).filter(Boolean)}
        onClearSelection={() => setSelectedClients([])}
        onOperationComplete={handleBulkOperationComplete}
      />
    </div>
  );
}
