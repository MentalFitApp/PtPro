import React, { useState } from 'react';
import { updateDoc } from 'firebase/firestore';
import { CalendarDays } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { db, toDate, updateStatoPercorso } from '../../../../firebase';
import { getTenantDoc } from '../../../../config/tenant';
import { useToast } from '../../../../contexts/ToastContext';

export default function ExtendExpiryModal({ isOpen, onClose, client, onSave }) {
  const toast = useToast();
  const [days, setDays] = useState(7);
  const [manualDate, setManualDate] = useState('');
  const [useManual, setUseManual] = useState(false);

  const handleSave = async () => {
    try {
      const current = toDate(client.scadenza) || new Date();
      const newExpiry = useManual && manualDate ? new Date(manualDate) : new Date(current);
      if (!useManual) newExpiry.setDate(newExpiry.getDate() + days);
      const clientRef = getTenantDoc(db, 'clients', client.id);
      await updateDoc(clientRef, { scadenza: newExpiry });
      updateStatoPercorso(client.id);
      onSave?.();
      onClose();
      toast.success('Scadenza prolungata con successo');
    } catch (err) {
      console.error('Errore prolungamento:', err);
      toast.error('Errore durante il prolungamento');
    }
  };

  const currentExpiry = toDate(client?.scadenza);
  const previewExpiry = useManual && manualDate 
    ? new Date(manualDate) 
    : currentExpiry 
      ? new Date(currentExpiry.getTime() + days * 86400000) 
      : null;

  const footer = (
    <button 
      onClick={handleSave} 
      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm"
    >
      <CalendarDays size={18} /> Prolunga Scadenza
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prolunga Scadenza"
      size="sm"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="useManual"
            checked={useManual} 
            onChange={e => setUseManual(e.target.checked)} 
            className="w-4 h-4 accent-indigo-500" 
          />
          <label htmlFor="useManual" className="text-sm text-theme-text-secondary cursor-pointer">
            Scegli data manuale
          </label>
        </div>
        
        {useManual ? (
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Nuova scadenza</label>
            <input 
              type="date" 
              value={manualDate} 
              onChange={e => setManualDate(e.target.value)} 
              className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Aggiungi giorni</label>
            <select 
              value={days} 
              onChange={e => setDays(parseInt(e.target.value))} 
              className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
            >
              {[1, 3, 7, 15, 30, 60].map(d => (
                <option key={d} value={d}>+{d} giorni</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="text-xs text-theme-text-secondary p-3 bg-theme-bg-tertiary/50 border border-theme/30 rounded-lg">
          <p>
            Scadenza attuale: {' '}
            <strong className="text-theme-text-primary">
              {currentExpiry?.toLocaleDateString('it-IT') || 'N/D'}
            </strong>
          </p>
          <p>
            Nuova scadenza: {' '}
            <strong className="text-theme-text-primary">
              {previewExpiry?.toLocaleDateString('it-IT') || 'N/D'}
            </strong>
          </p>
        </div>
      </div>
    </Modal>
  );
}
