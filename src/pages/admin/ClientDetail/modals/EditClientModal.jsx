import React, { useState, useEffect } from 'react';
import { updateDoc } from 'firebase/firestore';
import { Modal } from '../../../../components/ui/Modal';
import { CLIENT_STATUS, CLIENT_STATUS_LABELS } from '../../../../constants/payments';
import { db, toDate, updateStatoPercorso } from '../../../../firebase';
import { getTenantDoc } from '../../../../config/tenant';
import { useToast } from '../../../../contexts/ToastContext';

export default function EditClientModal({ isOpen, onClose, client, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    statoPercorso: CLIENT_STATUS.NA,
    scadenza: '',
    rateizzato: false,
    isOldClient: false,
  });

  useEffect(() => {
    if (client) {
      const nextDate = client?.scadenza ? toDate(client.scadenza) : null;
      setForm({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        statoPercorso: client.statoPercorso || CLIENT_STATUS.NA,
        scadenza: nextDate ? nextDate.toISOString().slice(0, 10) : '',
        rateizzato: !!client.rateizzato,
        isOldClient: !!client.isOldClient,
      });
    }
  }, [client]);

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        statoPercorso: form.statoPercorso,
        rateizzato: form.rateizzato,
        isOldClient: form.isOldClient,
      };
      if (form.scadenza) payload.scadenza = new Date(form.scadenza);
      const clientRef = getTenantDoc(db, 'clients', client.id);
      await updateDoc(clientRef, payload);
      updateStatoPercorso(client.id);
      onSave?.();
      onClose();
      toast.success('Cliente modificato con successo');
    } catch (err) {
      console.error('Errore modifica:', err);
      toast.error('Errore durante il salvataggio.');
    }
  };

  const footer = (
    <button 
      onClick={handleSave} 
      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm"
    >
      Salva
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica cliente"
      size="lg"
      footer={footer}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <input 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            placeholder="Nome" 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
          />
          <input 
            value={form.email} 
            onChange={e => setForm({ ...form, email: e.target.value })} 
            placeholder="Email" 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
          />
          <input 
            value={form.phone} 
            onChange={e => setForm({ ...form, phone: e.target.value })} 
            placeholder="Telefono" 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
          />
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Stato percorso</label>
            <select 
              value={form.statoPercorso} 
              onChange={e => setForm({ ...form, statoPercorso: e.target.value })} 
              className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
            >
              {Object.keys(CLIENT_STATUS_LABELS).map(key => (
                <option key={key} value={key}>{CLIENT_STATUS_LABELS[key]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Scadenza</label>
            <input 
              type="date" 
              value={form.scadenza} 
              onChange={e => setForm({ ...form, scadenza: e.target.value })} 
              className="p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary w-full" 
            />
          </div>
          <div className="flex items-center justify-between bg-theme-bg-tertiary border border-theme/30 rounded-lg px-3 py-2">
            <div>
              <p className="text-sm text-theme-text-primary">Rateizzato</p>
              <p className="text-xs text-theme-text-secondary">Pagamento a rate</p>
            </div>
            <input 
              type="checkbox" 
              checked={form.rateizzato} 
              onChange={e => setForm({ ...form, rateizzato: e.target.checked })} 
              className="w-5 h-5 accent-emerald-500"
            />
          </div>
          <div className="flex items-center justify-between bg-theme-bg-tertiary border border-theme/30 rounded-lg px-3 py-2">
            <div>
              <p className="text-sm text-theme-text-primary">Archivia cliente</p>
              <p className="text-xs text-theme-text-secondary">Escludi da liste attive</p>
            </div>
            <input 
              type="checkbox" 
              checked={form.isOldClient} 
              onChange={e => setForm({ ...form, isOldClient: e.target.checked })} 
              className="w-5 h-5 accent-emerald-500"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
