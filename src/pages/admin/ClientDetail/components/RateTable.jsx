import React, { useState, memo } from 'react';
import { Plus, X } from 'lucide-react';

/**
 * Tabella per gestire le rate di pagamento
 */
const RateTable = memo(function RateTable({ 
  rates, 
  canEdit, 
  onAdd, 
  onUpdate, 
  onDelete, 
  showAmounts, 
  onRatePaymentToggled 
}) {
  const [newRate, setNewRate] = useState({ amount: '', dueDate: '', paid: false });
  const [editIdx, setEditIdx] = useState(null);
  const [editRate, setEditRate] = useState({ amount: '', dueDate: '' });
  const [togglingIdx, setTogglingIdx] = useState(null);

  const handleTogglePaid = async (idx, rate) => {
    setTogglingIdx(idx);
    try {
      const update = { ...rate, paid: !rate.paid };
      update.paidDate = update.paid ? new Date().toISOString() : null;
      await onUpdate(idx, update);
      if (onRatePaymentToggled) {
        onRatePaymentToggled(update.paid, rate.amount);
      }
    } finally {
      setTogglingIdx(null);
    }
  };

  const handleAddRate = () => {
    if (newRate.amount && newRate.dueDate) {
      onAdd(newRate);
      setNewRate({ amount: '', dueDate: '', paid: false });
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Rate</h3>
      <div className="mobile-table-wrapper">
        <table className="w-full text-xs sm:text-sm bg-slate-900/70 rounded-xl border border-slate-800 min-w-[520px] overflow-hidden">
          <thead>
            <tr className="bg-slate-900 text-slate-300">
              <th className="px-3 py-2 text-left font-semibold">Importo</th>
              <th className="px-3 py-2 text-left font-semibold">Scadenza</th>
              <th className="px-3 py-2 text-left font-semibold">Pagata</th>
              {canEdit && <th className="px-3 py-2 text-left font-semibold">Modifica</th>}
              {canEdit && <th className="px-3 py-2 text-left font-semibold">Azioni</th>}
            </tr>
          </thead>
          <tbody>
            {rates && rates.length > 0 ? rates.map((rate, idx) => (
              <tr key={idx} className="border-b border-slate-800/70">
                <td className="px-3 py-2 text-slate-100">
                  {canEdit && editIdx === idx ? (
                    <input 
                      type="number" 
                      value={editRate.amount} 
                      onChange={e => setEditRate({ ...editRate, amount: e.target.value })} 
                      className="p-1 rounded border border-slate-700 bg-slate-900 text-slate-100 w-24" 
                    />
                  ) : (showAmounts ? `€${rate.amount}` : '€ •••')}
                </td>
                <td className="px-3 py-2 text-slate-100">
                  {canEdit && editIdx === idx ? (
                    <input 
                      type="date" 
                      value={editRate.dueDate} 
                      onChange={e => setEditRate({ ...editRate, dueDate: e.target.value })} 
                      className="p-1 rounded border border-slate-700 bg-slate-900 text-slate-100" 
                    />
                  ) : (rate.dueDate ? new Date(rate.dueDate).toLocaleDateString() : '-')}
                </td>
                <td className="px-3 py-2 text-slate-100">
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <input 
                        type="checkbox" 
                        checked={rate.paid} 
                        disabled={togglingIdx === idx}
                        onChange={() => handleTogglePaid(idx, rate)} 
                        className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:opacity-50"
                      />
                    )}
                    {togglingIdx === idx ? (
                      <span className="text-cyan-300 text-xs animate-pulse">Salvataggio...</span>
                    ) : rate.paid ? (
                      <span className="text-emerald-300 text-xs">
                        {rate.paidDate ? new Date(rate.paidDate).toLocaleDateString('it-IT') : 'Pagata'}
                      </span>
                    ) : (
                      <span className="text-rose-300 text-xs">Da pagare</span>
                    )}
                  </div>
                </td>
                {canEdit && (
                  <td className="px-3 py-2 text-slate-100">
                    {editIdx === idx ? (
                      <>
                        <button 
                          onClick={() => { 
                            onUpdate(idx, { ...rate, ...editRate }); 
                            setEditIdx(null); 
                          }} 
                          className="text-emerald-300 font-semibold px-2"
                        >
                          Salva
                        </button>
                        <button 
                          onClick={() => setEditIdx(null)} 
                          className="text-slate-400 px-2"
                        >
                          Annulla
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => { 
                          setEditIdx(idx); 
                          setEditRate({ amount: rate.amount, dueDate: rate.dueDate }); 
                        }} 
                        className="text-cyan-300 px-2 font-semibold"
                      >
                        Modifica
                      </button>
                    )}
                  </td>
                )}
                {canEdit && (
                  <td className="px-3 py-2">
                    <button 
                      onClick={() => onDelete(idx)} 
                      className="text-rose-300 px-2 font-semibold"
                    >
                      Elimina
                    </button>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={canEdit ? 5 : 3} className="text-center py-3 text-slate-500">
                  Nessuna rata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <input 
            type="number" 
            placeholder="Importo (€)" 
            value={newRate.amount} 
            onChange={e => setNewRate({ ...newRate, amount: e.target.value })} 
            className="p-2 rounded border border-slate-700 bg-slate-900 text-slate-100 text-sm w-full sm:w-auto" 
          />
          <input 
            type="date" 
            value={newRate.dueDate} 
            onChange={e => setNewRate({ ...newRate, dueDate: e.target.value })} 
            className="p-2 rounded border border-slate-700 bg-slate-900 text-slate-100 text-sm w-full sm:w-auto" 
          />
          <button 
            onClick={handleAddRate} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm whitespace-nowrap shadow-sm flex items-center gap-1 justify-center"
          >
            <Plus size={16} /> Aggiungi rata
          </button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.rates) === JSON.stringify(nextProps.rates) && 
         prevProps.canEdit === nextProps.canEdit && 
         prevProps.showAmounts === nextProps.showAmounts;
});

export default RateTable;
