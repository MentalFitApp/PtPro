// src/pages/admin/Clients/components/ClientCardView.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Archive } from 'lucide-react';
import { toDate } from '../../../../firebase';
import AnamnesiBadge from './AnamnesiBadge';

/**
 * Vista card dei clienti
 */
const ClientCardView = ({
  clients,
  anamnesiStatus,
  paymentsTotals,
  isAdmin,
  onDeleteClient,
  getClientPath
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
      {clients.map((c) => {
        const expiry = toDate(c.scadenza);
        const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const totalPayments = paymentsTotals[c.id] ?? 0;

        return (
          <div 
            key={c.id} 
            className="bg-slate-900/70 backdrop-blur-xl rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all shadow-xl"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-slate-100">{c.name}</h3>
                  {c.isArchived && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-slate-600/40 text-slate-300 border border-slate-500/50">
                      <Archive size={10} /> Archiviato
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-400">{c.email}</p>
                <p className="text-xs text-slate-500">{c.phone || 'N/D'}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(getClientPath(c.id)); }} 
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Dettagli
                </button>
                {isAdmin && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteClient(c); }} 
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Elimina
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Inizio</span>
                <span className="text-slate-300">{toDate(c.startDate)?.toLocaleDateString('it-IT') || 'N/D'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scadenza</span>
                <span className={`font-medium ${daysToExpiry < 0 ? 'text-red-400' : daysToExpiry <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {expiry?.toLocaleDateString('it-IT') || 'N/D'}
                </span>
              </div>
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
              {isAdmin && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Pagamenti</span>
                  <span className="font-medium text-cyan-400">€{totalPayments.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]} />
            </div>

            <div className="mt-4 flex gap-2">
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/edit/${c.id}`); }} 
                className="flex-1 py-2 bg-rose-600 text-white preserve-white text-xs rounded-lg hover:bg-rose-700 transition font-medium"
              >
                Modifica
              </button>
            </div>
          </div>
        );
      })}
      {clients.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          <Search size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nessun cliente trovato</p>
        </div>
      )}
    </div>
  );
};

export default ClientCardView;
