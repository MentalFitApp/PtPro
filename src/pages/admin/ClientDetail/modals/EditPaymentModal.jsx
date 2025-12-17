import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Check, Trash2, Loader2 } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../../../constants/payments';
import { toDate } from '../../../../firebase';
import { getTenantSubcollection } from '../../../../config/tenant';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirm } from '../../../../contexts/ConfirmContext';

export default function EditPaymentModal({ isOpen, onClose, payment, client, db, onSave, onDelete }) {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [form, setForm] = useState({ 
    amount: 0, 
    duration: '', 
    paymentMethod: PAYMENT_METHODS.BONIFICO, 
    paymentDate: '' 
  });
  const [customMethod, setCustomMethod] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (payment) {
      const pDate = toDate(payment.paymentDate);
      setForm({
        amount: payment.amount || 0,
        duration: payment.duration || '',
        paymentMethod: payment.paymentMethod || PAYMENT_METHODS.BONIFICO,
        paymentDate: pDate ? pDate.toISOString().split('T')[0] : ''
      });
      if (payment.paymentMethod === PAYMENT_METHODS.ALTRO) {
        setCustomMethod(payment.paymentMethod);
      }
    }
  }, [payment]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!payment?.id) {
        console.error('ID pagamento non valido');
        return;
      }
      const paymentMethod = form.paymentMethod === PAYMENT_METHODS.ALTRO ? customMethod : form.paymentMethod;
      const paymentRef = doc(getTenantSubcollection(db, 'clients', client.id, 'payments'), payment.id);
      await updateDoc(paymentRef, {
        amount: parseFloat(form.amount) || 0,
        duration: form.duration,
        paymentMethod,
        paymentDate: form.paymentDate ? new Date(form.paymentDate) : new Date()
      });
      onSave?.();
      onClose();
      toast.success('Pagamento modificato con successo');
    } catch (err) {
      console.error('Errore modifica pagamento:', err);
      toast.error('Errore durante la modifica del pagamento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmDelete('questo pagamento');
    if (!ok) return;
    setDeleting(true);
    try {
      if (!payment?.id) return;
      const paymentRef = doc(getTenantSubcollection(db, 'clients', client.id, 'payments'), payment.id);
      await deleteDoc(paymentRef);
      onDelete?.();
      onClose();
      toast.success('Pagamento eliminato');
    } catch (err) {
      console.error('Errore eliminazione pagamento:', err);
      toast.error('Errore durante l\'eliminazione del pagamento');
    } finally {
      setDeleting(false);
    }
  };

  const footer = (
    <div className="flex gap-3 w-full">
      <button 
        onClick={handleDelete} 
        disabled={deleting}
        className="flex-1 py-2 bg-rose-600/80 hover:bg-rose-600 disabled:bg-rose-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
      >
        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        Elimina
      </button>
      <button 
        onClick={handleSave} 
        disabled={saving}
        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        Salva
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica Pagamento"
      size="sm"
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-theme-text-secondary mb-1">Importo (€)</label>
          <input 
            type="number" 
            value={form.amount} 
            onChange={e => setForm({ ...form, amount: e.target.value })} 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
          />
        </div>
        <div>
          <label className="block text-sm text-theme-text-secondary mb-1">Data pagamento</label>
          <input 
            type="date" 
            value={form.paymentDate} 
            onChange={e => setForm({ ...form, paymentDate: e.target.value })} 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
          />
        </div>
        <div>
          <label className="block text-sm text-theme-text-secondary mb-1">Durata</label>
          <input 
            type="text" 
            value={form.duration} 
            onChange={e => setForm({ ...form, duration: e.target.value })} 
            placeholder="es. 3 mesi" 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
          />
        </div>
        <div>
          <label className="block text-sm text-theme-text-secondary mb-1">Metodo Pagamento</label>
          <select 
            value={form.paymentMethod} 
            onChange={e => setForm({ ...form, paymentMethod: e.target.value })} 
            className="w-full p-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary"
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {form.paymentMethod === PAYMENT_METHODS.ALTRO && (
            <input 
              type="text" 
              value={customMethod} 
              onChange={e => setCustomMethod(e.target.value)} 
              className="w-full p-2 mt-2 bg-theme-bg-tertiary border border-theme/50 rounded-lg text-theme-text-primary" 
              placeholder="Specifica metodo" 
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
