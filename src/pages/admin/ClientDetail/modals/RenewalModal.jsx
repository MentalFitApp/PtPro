import React, { useState, useEffect } from 'react';
import { addDoc, updateDoc } from 'firebase/firestore';
import { Check, Plus, X, Loader2 } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, DURATION_OPTIONS } from '../../../../constants/payments';
import { db, toDate, updateStatoPercorso } from '../../../../firebase';
import { getTenantDoc, getTenantSubcollection } from '../../../../config/tenant';
import { useToast } from '../../../../contexts/ToastContext';

export default function RenewalModal({ isOpen, onClose, client, onSave }) {
  const toast = useToast();
  const [months, setMonths] = useState(3);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(PAYMENT_METHODS.BONIFICO);
  const [customMethod, setCustomMethod] = useState('');
  const [manualExpiry, setManualExpiry] = useState('');
  const [isRateizzato, setIsRateizzato] = useState(false);
  const [rates, setRates] = useState([{ amount: '', dueDate: '' }]);
  const [saving, setSaving] = useState(false);

  const addRate = () => setRates([...rates, { amount: '', dueDate: '' }]);
  const removeRate = (idx) => setRates(rates.filter((_, i) => i !== idx));
  const updateRate = (idx, field, value) => {
    const newRates = [...rates];
    newRates[idx][field] = value;
    setRates(newRates);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentExpiry = toDate(client.scadenza) || new Date();
      const expiry = manualExpiry ? new Date(manualExpiry) : new Date(currentExpiry);
      if (!manualExpiry) expiry.setMonth(expiry.getMonth() + months);
      const paymentMethod = method === PAYMENT_METHODS.ALTRO ? customMethod : method;
      
      // Aggiorna scadenza cliente
      const clientRef = getTenantDoc(db, 'clients', client.id);
      await updateDoc(clientRef, { 
        scadenza: expiry,
        rateizzato: isRateizzato 
      });
      
      if (isRateizzato) {
        // Salva le rate nella subcollection rates
        const ratesRef = getTenantSubcollection(db, 'clients', client.id, 'rates');
        for (const rate of rates) {
          if (rate.amount && rate.dueDate) {
            await addDoc(ratesRef, {
              amount: parseFloat(rate.amount) || 0,
              dueDate: new Date(rate.dueDate),
              paid: false,
              createdAt: new Date(),
              isRenewal: true
            });
          }
        }
      } else {
        // Pagamento unico nella subcollection payments
        const payment = {
          amount: parseFloat(amount) || 0,
          duration: manualExpiry ? 'Manuale' : `${months} mesi`,
          paymentDate: new Date(),
          paymentMethod,
          createdAt: new Date(),
          isRenewal: true
        };
        const paymentsRef = getTenantSubcollection(db, 'clients', client.id, 'payments');
        await addDoc(paymentsRef, payment);
      }
      
      updateStatoPercorso(client.id);
      onSave?.();
      onClose();
      toast.success('Rinnovo salvato con successo');
    } catch (err) {
      console.error('Errore rinnovo:', err);
      toast.error('Errore durante il salvataggio del rinnovo');
    } finally {
      setSaving(false);
    }
  };

  // Reset form quando si apre
  useEffect(() => {
    if (isOpen) {
      setMonths(3);
      setAmount('');
      setMethod(PAYMENT_METHODS.BONIFICO);
      setCustomMethod('');
      setManualExpiry('');
      setIsRateizzato(false);
      setRates([{ amount: '', dueDate: '' }]);
    }
  }, [isOpen]);

  const footer = (
    <button 
      onClick={handleSave} 
      disabled={saving}
      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2"
    >
      {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
      {saving ? 'Salvataggio...' : 'Salva Rinnovo'}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rinnovo ${client?.name || ''}`}
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-theme-text-secondary mb-1">Mesi di rinnovo</label>
          <select 
            value={months} 
            onChange={e => setMonths(parseInt(e.target.value))} 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
          >
            {DURATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-theme-text-secondary mb-1">Oppure data scadenza manuale</label>
          <input 
            type="date" 
            value={manualExpiry} 
            onChange={e => setManualExpiry(e.target.value)} 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
          />
        </div>
        
        {/* Toggle Rateizzato */}
        <div className="flex items-center gap-3 p-3 bg-theme-bg-tertiary/50 rounded-lg border border-theme/30">
          <input 
            type="checkbox" 
            id="rateizzato" 
            checked={isRateizzato} 
            onChange={e => setIsRateizzato(e.target.checked)} 
            className="w-5 h-5 rounded accent-emerald-500"
          />
          <label htmlFor="rateizzato" className="text-sm text-theme-text-primary cursor-pointer">
            Pagamento a rate
          </label>
        </div>
        
        {isRateizzato ? (
          <div className="space-y-3">
            <label className="block text-sm text-theme-text-secondary">Rate</label>
            {rates.map((rate, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input 
                  type="number" 
                  value={rate.amount} 
                  onChange={e => updateRate(idx, 'amount', e.target.value)} 
                  placeholder="Importo €" 
                  className="flex-1 p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
                />
                <input 
                  type="date" 
                  value={rate.dueDate} 
                  onChange={e => updateRate(idx, 'dueDate', e.target.value)} 
                  className="flex-1 p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
                />
                {rates.length > 1 && (
                  <button onClick={() => removeRate(idx)} className="p-2 text-rose-400 hover:text-rose-300">
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addRate} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <Plus size={16} /> Aggiungi rata
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm text-theme-text-secondary mb-1">Importo totale</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="es. 150" 
                className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
              />
            </div>
            <div>
              <label className="block text-sm text-theme-text-secondary mb-1">Metodo pagamento</label>
              <select 
                value={method} 
                onChange={e => setMethod(e.target.value)} 
                className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {method === PAYMENT_METHODS.ALTRO && (
                <input 
                  type="text" 
                  value={customMethod} 
                  onChange={e => setCustomMethod(e.target.value)} 
                  placeholder="Specifica metodo" 
                  className="w-full mt-2 p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
                />
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
