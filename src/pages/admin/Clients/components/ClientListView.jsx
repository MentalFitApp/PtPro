// src/pages/admin/Clients/components/ClientListView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePenLine, Trash2, Search, Archive, ChevronDown } from 'lucide-react';
import { toDate } from '../../../../firebase';
import { EmptyClients } from '../../../../components/ui/EmptyState';
import AnamnesiBadge from './AnamnesiBadge';

const CLIENTS_PER_PAGE = 20;

/**
 * Vista lista clienti (desktop table + mobile cards)
 */
const ClientListView = ({
  clients,
  selectedClients,
  toggleClientSelection,
  toggleSelectAll,
  anamnesiStatus,
  paymentsTotals,
  isAdmin,
  isCoach,
  filter,
  onDeleteClient,
  getClientPath
}) => {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(CLIENTS_PER_PAGE);
  
  // Reset visibleCount quando cambia il filtro o la lista clienti
  useEffect(() => {
    setVisibleCount(CLIENTS_PER_PAGE);
  }, [filter, clients.length]);
  
  // Clienti visibili (limitati)
  const displayedClients = clients.slice(0, visibleCount);
  const hasMore = clients.length > visibleCount;
  const remainingCount = clients.length - visibleCount;

  return (
    <>
      {/* Mobile filter pills */}
      <div className="md:hidden sticky top-16 z-30 px-3 mb-3">
        {/* Filter pills handled by parent */}
      </div>

      {/* MOBILE CARD STACK */}
      <div className="md:hidden space-y-4">
        {displayedClients.map((c) => {
          const expiry = toDate(c.scadenza);
          const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
          const totalPayments = paymentsTotals[c.id] ?? 0;

          const expiryColor = daysToExpiry === null
            ? 'text-slate-400'
            : daysToExpiry < 0
              ? 'text-red-400'
              : daysToExpiry <= 7
                ? 'text-amber-400'
                : 'text-emerald-400';

          return (
            <div key={c.id} className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-xl p-4 shadow-xl">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-semibold text-white truncate">{c.name || '-'}</p>
                    {c.isArchived && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-slate-600/40 text-slate-200 border border-slate-500/60 whitespace-nowrap">
                        <Archive size={10} /> Archiviato
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{c.email || 'Email non presente'}</p>
                  <p className="text-xs text-slate-500 truncate">{c.phone || 'Telefono non presente'}</p>
                </div>
                <div className="text-right shrink-0">
                  {isAdmin && (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-cyan-900/50 text-cyan-200 border border-cyan-600/50 inline-block mb-1">
                      €{totalPayments.toFixed(2)}
                    </span>
                  )}
                  <p className={`text-xs font-medium ${expiryColor}`}>
                    {expiry ? expiry.toLocaleDateString('it-IT') : 'N/D'}
                  </p>
                  {daysToExpiry !== null && (
                    <p className="text-[10px] text-slate-400">{daysToExpiry < 0 ? 'Scaduto' : `${daysToExpiry} gg`}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="bg-slate-900/70 rounded-lg px-3 py-2 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Inizio</p>
                  <p className="font-medium text-white">{toDate(c.startDate)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                </div>
                <div className="bg-slate-900/70 rounded-lg px-3 py-2 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Anamnesi</p>
                  <div className="mt-1"><AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]} /></div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigate(getClientPath(c.id))}
                  className="w-full py-2.5 rounded-lg bg-rose-600 text-white preserve-white text-sm font-semibold hover:bg-rose-700 transition"
                >
                  Dettagli
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/edit/${c.id}`)}
                  className="w-full py-2.5 rounded-lg bg-slate-700 text-slate-100 text-sm font-semibold hover:bg-slate-600 transition border border-slate-600"
                >
                  Modifica
                </button>
              </div>
            </div>
          );
        })}

        {clients.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Search size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nessun cliente trovato</p>
          </div>
        )}

        {/* Pulsante Mostra altri - Mobile */}
        {hasMore && (
          <button
            onClick={() => setVisibleCount(prev => prev + CLIENTS_PER_PAGE)}
            className="w-full py-3 mt-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-700/60 transition flex items-center justify-center gap-2"
          >
            <ChevronDown size={18} />
            Mostra altri {Math.min(remainingCount, CLIENTS_PER_PAGE)} clienti
            <span className="text-slate-500">({remainingCount} rimanenti)</span>
          </button>
        )}
      </div>

      {/* TABLE - Desktop professional view */}
      <div className="hidden md:block bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/60">
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === clients.length && clients.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Inizio</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Scadenza</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Anamnesi</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {displayedClients.map((c) => {
                const expiry = toDate(c.scadenza);
                const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const totalPayments = paymentsTotals[c.id] ?? 0;

                return (
                  <tr 
                    key={c.id} 
                    onClick={() => navigate(getClientPath(c.id))}
                    className={`border-b border-slate-700/30 transition-colors hover:bg-slate-800/50 cursor-pointer ${selectedClients.includes(c.id) ? 'bg-blue-500/10' : ''}`}
                  >
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(c.id)}
                        onChange={() => toggleClientSelection(c.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(getClientPath(c.id)); }} 
                          className="text-left hover:text-blue-400 transition-colors truncate flex items-center gap-2"
                        >
                          {c.name || "-"}
                          {c.isArchived && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-400 border border-slate-600/50">
                              <Archive size={10} /> Archiviato
                            </span>
                          )}
                        </button>
                        {isAdmin && (
                          <span className="text-xs px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-medium">
                            €{totalPayments.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{toDate(c.startDate)?.toLocaleDateString('it-IT') || 'N/D'}</td>
                    <td className="px-4 py-3.5">
                      {expiry ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            daysToExpiry < 0 ? 'text-red-400' : 
                            daysToExpiry <= 7 ? 'text-amber-400' : 
                            'text-emerald-400'
                          }`}>
                            {expiry.toLocaleDateString('it-IT')}
                          </span>
                          {daysToExpiry !== null && (
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                              daysToExpiry < 0 ? 'bg-red-500/10 text-red-400' 
                              : daysToExpiry <= 7 ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {daysToExpiry < 0 ? 'Scaduto' : `${daysToExpiry}g`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">N/D</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5"><AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]} /></td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/edit/${c.id}`); }}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition-all"
                          title="Modifica"
                        >
                          <FilePenLine size={16}/>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteClient(c); }}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                            title="Elimina"
                          >
                            <Trash2 size={16}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {clients.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12">
                    <EmptyClients onAddClient={isAdmin ? () => navigate('/new-client') : null} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pulsante Mostra altri - Desktop */}
        {hasMore && (
          <button
            onClick={() => setVisibleCount(prev => prev + CLIENTS_PER_PAGE)}
            className="w-full py-3 bg-slate-800/40 border-t border-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-700/40 transition flex items-center justify-center gap-2"
          >
            <ChevronDown size={18} />
            Mostra altri {Math.min(remainingCount, CLIENTS_PER_PAGE)} clienti
            <span className="text-slate-500">({remainingCount} rimanenti)</span>
          </button>
        )}
      </div>
    </>
  );
};

export default ClientListView;
