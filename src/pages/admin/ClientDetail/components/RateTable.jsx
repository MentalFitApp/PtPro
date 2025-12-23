import React, { useState, memo } from 'react';
import { Plus, X, Calendar } from 'lucide-react';

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
  const [editRate, setEditRate] = useState({ amount: '', dueDate: '', paidDate: '' });
  const [togglingIdx, setTogglingIdx] = useState(null);
  // Stato per mostrare il picker della data di pagamento
  const [paymentDatePickerIdx, setPaymentDatePickerIdx] = useState(null);
  const [selectedPaymentDate, setSelectedPaymentDate] = useState('');

  const handleTogglePaid = async (idx, rate) => {
    if (!rate.paid) {
      // Se stiamo segnando come pagata, mostriamo il picker per la data
      setPaymentDatePickerIdx(idx);
      // Default: oggi
      setSelectedPaymentDate(new Date().toISOString().split('T')[0]);
    } else {
      // Se stiamo segnando come NON pagata, procediamo direttamente
      setTogglingIdx(idx);
      try {
        const update = { ...rate, paid: false, paidDate: null };
        await onUpdate(idx, update);
        if (onRatePaymentToggled) {
          onRatePaymentToggled(false, rate.amount);
        }
      } finally {
        setTogglingIdx(null);
      }
    }
  };

  const confirmPaymentDate = async (idx, rate) => {
    setTogglingIdx(idx);
    try {
      // Usa la data selezionata (imposta a mezzanotte per evitare problemi di timezone)
      const paymentDate = selectedPaymentDate 
        ? new Date(selectedPaymentDate + 'T12:00:00').toISOString()
        : new Date().toISOString();
      
      const update = { ...rate, paid: true, paidDate: paymentDate };
      await onUpdate(idx, update);
      if (onRatePaymentToggled) {
        onRatePaymentToggled(true, rate.amount);
      }
    } finally {
      setTogglingIdx(null);
      setPaymentDatePickerIdx(null);
      setSelectedPaymentDate('');
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {canEdit && (
                      <input 
                        type="checkbox" 
                        checked={rate.paid} 
                        disabled={togglingIdx === idx || paymentDatePickerIdx === idx}
                        onChange={() => handleTogglePaid(idx, rate)} 
                        className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:opacity-50"
                      />
                    )}
                    {togglingIdx === idx ? (
                      <span className="text-cyan-300 text-xs animate-pulse">Salvataggio...</span>
                    ) : paymentDatePickerIdx === idx ? (
                      // Mostra picker data pagamento
                      <div className="flex flex-col gap-2 p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-cyan-400" />
                          <span className="text-xs text-slate-300">Data pagamento:</span>
                        </div>
                        <input
                          type="date"
                          value={selectedPaymentDate}
                          onChange={e => setSelectedPaymentDate(e.target.value)}
                          className="p-1 text-xs rounded border border-slate-600 bg-slate-900 text-slate-100"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => confirmPaymentDate(idx, rate)}
                            className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                          >
                            Conferma
                          </button>
                          <button
                            onClick={() => {
                              setPaymentDatePickerIdx(null);
                              setSelectedPaymentDate('');
                            }}
                            className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-700 text-white rounded"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
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
