// src/pages/admin/ClientDetail.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, orderBy, query, updateDoc, deleteDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  DollarSign,
  Trash2,
  Edit,
  ArrowLeft,
  Copy,
  Check,
  X,
  Plus,
  ZoomIn,
  CalendarDays,
  Eye,
  EyeOff,
  AlertTriangle,
  Activity,
  Image,
  CreditCard,
  Info,
  BarChart3,
  Clock,
  Tag,
  ClipboardList,
  Moon,
  NotebookPen,
  CheckCircle,
  Link2,
  Loader2,
  Camera,
  Upload,
  TrendingUp,
  ArrowLeftRight,
  MessageCircle,
  Heart
} from 'lucide-react';
import { uploadToR2 } from '../../cloudflareStorage';
import QuickNotifyButton from '../../components/notifications/QuickNotifyButton';
import WhatsAppButton from '../../components/integrations/WhatsAppButton';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, CLIENT_STATUS_STYLES, CLIENT_STATUS_LABELS, CLIENT_STATUS, DURATION_OPTIONS } from '../../constants/payments';
import { db, toDate, updateStatoPercorso } from '../../firebase';
import { getTenantDoc, getTenantSubcollection, CURRENT_TENANT_ID } from '../../config/tenant';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import normalizePhotoURLs from '../../utils/normalizePhotoURLs';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import ProgressCharts from '../../components/client/ProgressCharts';
import PhotoCompare from '../../components/client/PhotoCompare';
import WorkoutStreak from '../../components/client/WorkoutStreak';
import WorkoutCalendarModal from '../../components/client/WorkoutCalendarModal';
import ClientHabitsOverview from '../../components/admin/ClientHabitsOverview';
import { 
  UnifiedCard, 
  CardHeader, 
  CardHeaderSimple,
  CardContent, 
  CardFooter,
  InfoField,
  DataCard,
  Badge,
  ListItemCard,
  EmptyState,
  CardGrid
} from '../../components/ui/UnifiedCard';
import { ScheduleCallModal, NextCallCard, CallRequestsBadge } from '../../components/calls/CallScheduler';

// Error boundary to avoid full page crash
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-center text-red-400 p-8">Errore: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

const PathStatusBadge = ({ status }) => {
  const normalizeStatus = (value) => {
    if (!value) return CLIENT_STATUS.NA;
    if (CLIENT_STATUS_STYLES[value]) return value;
    const lowered = String(value).toLowerCase();
    if (lowered.includes('scad') && !lowered.includes('in ')) return CLIENT_STATUS.NOT_RENEWED;
    if (lowered.includes('scaden')) return CLIENT_STATUS.RENEWED;
    if (lowered.includes('attiv')) return CLIENT_STATUS.ACTIVE;
    return CLIENT_STATUS.NA;
  };
  const key = normalizeStatus(status);
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${CLIENT_STATUS_STYLES[key] || CLIENT_STATUS_STYLES.na}`}>
      {CLIENT_STATUS_LABELS[key] || 'N/D'}
    </span>
  );
};

const RenewalModal = ({ isOpen, onClose, client, onSave }) => {
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
              isRenewal: true // Marca come rinnovo
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
          isRenewal: true // Marca come rinnovo
        };
        const paymentsRef = getTenantSubcollection(db, 'clients', client.id, 'payments');
        await addDoc(paymentsRef, payment);
      }
      
      updateStatoPercorso(client.id);
      onSave?.();
      onClose();
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

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-[90] p-0 md:p-4">
      <motion.div initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} className="bg-slate-900/95 rounded-t-3xl md:rounded-2xl border border-slate-800 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Rinnovo {client.name}</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-rose-300"><X size={22} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Mesi di rinnovo</label>
            <select value={months} onChange={e => setMonths(parseInt(e.target.value))} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
              {DURATION_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Oppure data scadenza manuale</label>
            <input type="date" value={manualExpiry} onChange={e => setManualExpiry(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </div>
          
          {/* Toggle Rateizzato */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <input 
              type="checkbox" 
              id="rateizzato" 
              checked={isRateizzato} 
              onChange={e => setIsRateizzato(e.target.checked)} 
              className="w-5 h-5 rounded accent-emerald-500"
            />
            <label htmlFor="rateizzato" className="text-sm text-slate-200 cursor-pointer">Pagamento a rate</label>
          </div>
          
          {isRateizzato ? (
            <div className="space-y-3">
              <label className="block text-sm text-slate-300">Rate</label>
              {rates.map((rate, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    value={rate.amount} 
                    onChange={e => updateRate(idx, 'amount', e.target.value)} 
                    placeholder="Importo €" 
                    className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <input 
                    type="date" 
                    value={rate.dueDate} 
                    onChange={e => updateRate(idx, 'dueDate', e.target.value)} 
                    className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
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
                <label className="block text-sm text-slate-300 mb-1">Importo totale</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="es. 150" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Metodo pagamento</label>
                <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                </select>
                {method === PAYMENT_METHODS.ALTRO && (
                  <input type="text" value={customMethod} onChange={e => setCustomMethod(e.target.value)} placeholder="Specifica metodo" className="w-full mt-2 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
                )}
              </div>
            </>
          )}
          
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {saving ? 'Salvataggio...' : 'Salva Rinnovo'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const EditClientModal = ({ isOpen, onClose, client, onSave }) => {
  const toast = useToast();
  const initialDate = client?.scadenza ? toDate(client.scadenza) : null;
  const [form, setForm] = useState({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    statoPercorso: client.statoPercorso || CLIENT_STATUS.NA,
    scadenza: initialDate ? initialDate.toISOString().slice(0, 10) : '',
    rateizzato: !!client.rateizzato,
    isOldClient: !!client.isOldClient,
  });

  useEffect(() => {
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
    } catch (err) {
      console.error('Errore modifica:', err);
      toast.error('Errore durante il salvataggio.');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-[90] p-0 md:p-4">
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="bg-slate-900/90 rounded-t-3xl md:rounded-2xl border border-slate-800 p-6 w-full max-w-2xl shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Modifica cliente</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-rose-300"><X size={22} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefono" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Stato percorso</label>
              <select value={form.statoPercorso} onChange={e => setForm({ ...form, statoPercorso: e.target.value })} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                {Object.keys(CLIENT_STATUS_LABELS).map(key => (<option key={key} value={key}>{CLIENT_STATUS_LABELS[key]}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Scadenza</label>
              <input type="date" value={form.scadenza} onChange={e => setForm({ ...form, scadenza: e.target.value })} className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white w-full" />
            </div>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm text-white">Rateizzato</p>
                <p className="text-xs text-slate-400">Pagamento a rate</p>
              </div>
              <input type="checkbox" checked={form.rateizzato} onChange={e => setForm({ ...form, rateizzato: e.target.checked })} />
            </div>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm text-white">Archivia cliente</p>
                <p className="text-xs text-slate-400">Escludi da liste attive</p>
              </div>
              <input type="checkbox" checked={form.isOldClient} onChange={e => setForm({ ...form, isOldClient: e.target.checked })} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1" />
          <button onClick={handleSave} className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm">Salva</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ExtendExpiryModal = ({ isOpen, onClose, client, onSave }) => {
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
    } catch (err) {
      console.error('Errore prolungamento:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[90] p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900">Prolunga Scadenza</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-rose-500"><X size={22} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={useManual} onChange={e => setUseManual(e.target.checked)} className="w-4 h-4" />
            <label className="text-sm text-slate-700">Scegli data manuale</label>
          </div>
          {useManual ? (
            <div>
              <label className="block text-sm text-slate-600 mb-1">Nuova scadenza</label>
              <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800" />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-slate-600 mb-1">Aggiungi giorni</label>
              <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800">
                {[1,3,7,15,30,60].map(d => (<option key={d} value={d}>+{d} giorni</option>))}
              </select>
            </div>
          )}
          <div className="text-xs text-slate-600 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p>Scadenza attuale: <strong className="text-slate-900">{toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}</strong></p>
            <p>Nuova scadenza: <strong className="text-slate-900">{
              useManual && manualDate ? new Date(manualDate).toLocaleDateString('it-IT') :
              toDate(client.scadenza) ? new Date(toDate(client.scadenza).getTime() + days * 86400000).toLocaleDateString('it-IT') : 'N/D'
            }</strong></p>
          </div>
          <button onClick={handleSave} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm">
            <CalendarDays size={18} /> Prolunga Scadenza
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const EditPaymentModal = ({ isOpen, onClose, payment, client, onSave, onDelete }) => {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [form, setForm] = useState({ amount: 0, duration: '', paymentMethod: PAYMENT_METHODS.BONIFICO, paymentDate: '' });
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
      if (payment.paymentMethod === PAYMENT_METHODS.ALTRO) setCustomMethod(payment.paymentMethod);
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
    } catch (err) {
      console.error('Errore eliminazione pagamento:', err);
      toast.error('Errore durante l\'eliminazione del pagamento');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-[90] p-0 md:p-4">
      <motion.div initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} className="bg-slate-900/95 border border-slate-800 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-2xl p-6 shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Modifica Pagamento</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-400"><X size={22} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Importo (€)</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Data pagamento</label>
            <input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Durata</label>
            <input type="text" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="es. 3 mesi" className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Metodo Pagamento</label>
            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
            {form.paymentMethod === PAYMENT_METHODS.ALTRO && (
              <input type="text" value={customMethod} onChange={e => setCustomMethod(e.target.value)} className="w-full p-2 mt-2 bg-slate-800 border border-slate-700 rounded-lg text-white" placeholder="Specifica metodo" />
            )}
          </div>
          <div className="flex gap-3 pt-2">
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
        </div>
      </motion.div>
    </motion.div>
  );
};

const PhotoZoomModal = ({ isOpen, onClose, imageUrl, alt }) => {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="relative max-w-4xl max-h-full">
        <img src={imageUrl} alt={alt} className="w-full h-auto max-h-screen object-contain rounded-lg shadow-2xl" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><X size={24} /></button>
        <div className="absolute bottom-4 left-4 text-white bg-black/60 px-3 py-1 rounded text-sm">{alt}</div>
      </motion.div>
    </motion.div>
  );
};

const RateTable = React.memo(({ rates, canEdit, onAdd, onUpdate, onDelete, showAmounts, onRatePaymentToggled }) => {
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
                    <input type="number" value={editRate.amount} onChange={e => setEditRate({ ...editRate, amount: e.target.value })} className="p-1 rounded border border-slate-700 bg-slate-900 text-slate-100 w-24" />
                  ) : (showAmounts ? `€${rate.amount}` : '€ •••')}
                </td>
                <td className="px-3 py-2 text-slate-100">
                  {canEdit && editIdx === idx ? (
                    <input type="date" value={editRate.dueDate} onChange={e => setEditRate({ ...editRate, dueDate: e.target.value })} className="p-1 rounded border border-slate-700 bg-slate-900 text-slate-100" />
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
                      <span className="text-emerald-300 text-xs">{rate.paidDate ? new Date(rate.paidDate).toLocaleDateString('it-IT') : 'Pagata'}</span>
                    ) : (
                      <span className="text-rose-300 text-xs">Da pagare</span>
                    )}
                  </div>
                </td>
                {canEdit && (
                  <td className="px-3 py-2 text-slate-100">
                    {editIdx === idx ? (
                      <>
                        <button onClick={() => { onUpdate(idx, { ...rate, ...editRate }); setEditIdx(null); }} className="text-emerald-300 font-semibold px-2">Salva</button>
                        <button onClick={() => setEditIdx(null)} className="text-slate-400 px-2">Annulla</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditIdx(idx); setEditRate({ amount: rate.amount, dueDate: rate.dueDate }); }} className="text-cyan-300 px-2 font-semibold">Modifica</button>
                    )}
                  </td>
                )}
                {canEdit && (
                  <td className="px-3 py-2">
                    <button onClick={() => onDelete(idx)} className="text-rose-300 px-2 font-semibold">Elimina</button>
                  </td>
                )}
              </tr>
            )) : (
              <tr><td colSpan={canEdit ? 5 : 3} className="text-center py-3 text-slate-500">Nessuna rata</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <input type="number" placeholder="Importo (€)" value={newRate.amount} onChange={e => setNewRate({ ...newRate, amount: e.target.value })} className="p-2 rounded border border-slate-700 bg-slate-900 text-slate-100 text-sm w-full sm:w-auto" />
          <input type="date" value={newRate.dueDate} onChange={e => setNewRate({ ...newRate, dueDate: e.target.value })} className="p-2 rounded border border-slate-700 bg-slate-900 text-slate-100 text-sm w-full sm:w-auto" />
          <button onClick={() => { if (newRate.amount && newRate.dueDate) { onAdd(newRate); setNewRate({ amount: '', dueDate: '', paid: false }); } }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm whitespace-nowrap shadow-sm">Aggiungi rata</button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => JSON.stringify(prevProps.rates) === JSON.stringify(nextProps.rates) && prevProps.canEdit === nextProps.canEdit && prevProps.showAmounts === nextProps.showAmounts);

export default function ClientDetail({ role: propRole }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { formatWeight, formatLength, weightLabel, lengthLabel } = useUserPreferences();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [anamnesi, setAnamnesi] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [editingPaymentIndex, setEditingPaymentIndex] = useState(null);
  const [showAmounts, setShowAmounts] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [legacyRates, setLegacyRates] = useState([]);  // Rate dal campo client.rate (legacy)
  const [subcollectionRates, setSubcollectionRates] = useState([]);  // Rate dalla subcollection rates
  const [zoomPhoto, setZoomPhoto] = useState({ open: false, url: '', alt: '' });
  const [showPhotoCompare, setShowPhotoCompare] = useState(false);
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [showWorkoutCalendar, setShowWorkoutCalendar] = useState(false);
  const [nextCall, setNextCall] = useState(null);
  const [magicLink, setMagicLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(null); // 'front' | 'back' | 'left' | 'right' | null
  const [showNewCheck, setShowNewCheck] = useState(false);
  const [newCheckData, setNewCheckData] = useState({ 
    weight: '', 
    bodyFat: '', 
    notes: '', 
    photos: {},
    checkDate: new Date().toISOString().split('T')[0] // Data del check (default oggi)
  });
  const [uploadingCheckPhoto, setUploadingCheckPhoto] = useState(null);
  const photoInputRef = useRef(null);

  // Determina ruolo: prop > sessionStorage > localStorage
  let userRole = propRole || null;
  if (!userRole) {
    try { userRole = sessionStorage.getItem('app_role') || JSON.parse(localStorage.getItem('user'))?.role || null; } catch {}
  }
  const isAdmin = userRole === 'admin';
  const isCoach = userRole === 'coach';
  
  // Permessi basati sul ruolo
  const canManagePayments = isAdmin; // Solo admin può gestire pagamenti
  const canDeleteClient = isAdmin;   // Solo admin può eliminare clienti
  const canEditClient = isAdmin || isCoach; // Entrambi possono modificare
  const backPath = isCoach ? '/coach/clients' : '/clients'; // Path di ritorno

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!clientId) {
      setError('ID cliente non valido.');
      setTimeout(() => navigate(backPath), 3000);
      return;
    }

    const clientRef = getTenantDoc(db, 'clients', clientId);
    const unsubClient = onSnapshot(clientRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setClient(data);
        updateStatoPercorso(clientId);
      } else {
        setError('Cliente non trovato.');
        setTimeout(() => navigate(backPath), 3000);
      }
      setLoading(false);
    }, () => {
      setError('Errore caricamento.');
      setTimeout(() => navigate(backPath), 3000);
      setLoading(false);
    });

    const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', clientId, 'anamnesi');
    const anamnesiRef = doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial');
    const unsubAnamnesi = onSnapshot(anamnesiRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.photoURLs) data.photoURLs = normalizePhotoURLs(data.photoURLs);
        setAnamnesi(data);
      } else {
        setAnamnesi(null);
      }
    });

    const checksQuery = query(getTenantSubcollection(db, 'clients', clientId, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, (snap) => {
      const checksData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const resolvedChecks = checksData.map((check) => {
        if (check.photoURLs) check.photoURLs = normalizePhotoURLs(check.photoURLs);
        return check;
      });
      setChecks(resolvedChecks);
    }, (err) => console.error('Errore caricamento checks:', err));

    // Carica pagamenti dalla subcollection
    const paymentsQuery = query(getTenantSubcollection(db, 'clients', clientId, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
      const paymentsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(paymentsData);
    }, (err) => console.error('Errore caricamento payments:', err));

    // Carica rate dalla subcollection rates (nuove rate da rinnovo)
    const ratesQuery = query(getTenantSubcollection(db, 'clients', clientId, 'rates'), orderBy('dueDate', 'asc'));
    const unsubRates = onSnapshot(ratesQuery, (snap) => {
      const ratesData = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          dueDate: data.dueDate ? (data.dueDate.toDate ? data.dueDate.toDate().toISOString().split('T')[0] : data.dueDate) : '',
          paid: data.paid || false,
          paidDate: data.paidDate ? (data.paidDate.toDate ? data.paidDate.toDate().toISOString() : data.paidDate) : null,
          isRenewal: data.isRenewal || false,
          fromSubcollection: true  // Flag per identificare rate dalla subcollection
        };
      });
      setSubcollectionRates(ratesData);
    }, (err) => console.error('Errore caricamento rates:', err));

    return () => { unsubClient(); unsubAnamnesi(); unsubChecks(); unsubPayments(); unsubRates(); };
  }, [clientId, navigate]);

  // Carica rate legacy dal campo client.rate
  useEffect(() => {
    if (client && client.rate) setLegacyRates(client.rate);
  }, [client]);

  // Combina rate legacy e subcollection
  const rates = useMemo(() => {
    // Prima le legacy (senza id, senza fromSubcollection)
    const legacy = legacyRates.map((r, idx) => ({ ...r, legacyIndex: idx }));
    // Poi le subcollection (con id, con fromSubcollection)
    return [...legacy, ...subcollectionRates];
  }, [legacyRates, subcollectionRates]);

  const sortedPayments = useMemo(() => {
    if (!payments.length) return [];
    return payments
      .map((p, i) => ({ ...p, originalIndex: i }))
      .sort((a, b) => (toDate(b.paymentDate) || new Date(0)) - (toDate(a.paymentDate) || new Date(0)));
  }, [payments]);

  const latestCheck = checks?.[0];
  const previousCheck = checks?.[1];
  const toNumber = (val) => { const num = parseFloat(val); return Number.isFinite(num) ? num : null; };
  const weightValue = toNumber(latestCheck?.weight);
  const prevWeight = toNumber(previousCheck?.weight);
  const weightDelta = weightValue !== null && prevWeight !== null ? weightValue - prevWeight : null;
  const weightDeltaPct = weightDelta !== null && prevWeight ? ((weightDelta / prevWeight) * 100) : null;
  const bodyFatValue = toNumber(latestCheck?.bodyFat);
  const prevBodyFat = toNumber(previousCheck?.bodyFat);
  const bodyFatDelta = bodyFatValue !== null && prevBodyFat !== null ? bodyFatValue - prevBodyFat : null;
  const bodyFatDeltaPct = bodyFatDelta !== null && prevBodyFat ? ((bodyFatDelta / prevBodyFat) * 100) : null;
  const lastCheckAt = latestCheck?.createdAt ? toDate(latestCheck.createdAt) : null;
  
  // Calcola se ha fatto workout oggi
  const todayWorkout = useMemo(() => {
    if (!client) return { done: false, streak: 0 };
    const todayStr = new Date().toISOString().split('T')[0];
    const habits = client.habits || {};
    const workoutLog = client.workoutLog || {};
    const doneToday = (habits[todayStr]?.workout >= 1) || (workoutLog[todayStr]?.completed === true);
    
    // Calcola streak
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hadWorkout = (habits[dateStr]?.workout >= 1) || (workoutLog[dateStr]?.completed === true);
      if (hadWorkout) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return { done: doneToday, streak };
  }, [client]);
  
  // Calcolo Body Fat stimato usando BMI (formula Deurenberg)
  // BF% = (1.20 × BMI) + (0.23 × età) − (10.8 × sesso) − 5.4
  // dove sesso = 1 per maschi, 0 per femmine
  const estimatedBodyFat = useMemo(() => {
    const weight = weightValue || toNumber(anamnesi?.weight);
    const height = toNumber(anamnesi?.height);
    const gender = anamnesi?.gender;
    
    // Calcola età dalla data di nascita
    let age = null;
    if (anamnesi?.birthDate) {
      const birth = new Date(anamnesi.birthDate);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }
    }
    
    if (!weight || !height || !age || !gender) return null;
    
    // Calcola BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // Formula Deurenberg
    const genderFactor = gender === 'male' ? 1 : 0;
    const bf = (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
    
    // Limita a valori ragionevoli
    return Math.max(3, Math.min(50, Math.round(bf * 10) / 10));
  }, [weightValue, anamnesi]);

  // Calcola totali pagamenti
  // Pagato = somma pagamenti subcollection + rate pagate
  const paymentsFromSubcollection = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paidFromRates = rates.filter(r => r.paid).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const paymentsPaid = paymentsFromSubcollection + paidFromRates;
  
  // Totale = client.price se esiste, altrimenti somma rate, altrimenti somma pagamenti
  const ratesTotalAmount = rates.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const paymentsTotal = client?.price ? Number(client.price) : (ratesTotalAmount > 0 ? ratesTotalAmount : paymentsFromSubcollection);
  
  // Ultimo pagamento dalla lista rate pagate o pagamenti subcollection
  const paidRates = rates.filter(r => r.paid).sort((a, b) => (toDate(b.paidDate) || new Date(0)) - (toDate(a.paidDate) || new Date(0)));
  const sortedSubcollectionPayments = [...payments].sort((a, b) => (toDate(b.paymentDate) || new Date(0)) - (toDate(a.paymentDate) || new Date(0)));
  const lastRatePayment = paidRates[0];
  const lastSubcollectionPayment = sortedSubcollectionPayments[0];
  // Scegli il più recente tra rate e subcollection
  const lastPayment = (() => {
    if (!lastRatePayment && !lastSubcollectionPayment) return null;
    if (!lastRatePayment) return { ...lastSubcollectionPayment, paidDate: lastSubcollectionPayment.paymentDate };
    if (!lastSubcollectionPayment) return lastRatePayment;
    const rateDate = toDate(lastRatePayment.paidDate) || new Date(0);
    const subDate = toDate(lastSubcollectionPayment.paymentDate) || new Date(0);
    return rateDate > subDate ? lastRatePayment : { ...lastSubcollectionPayment, paidDate: lastSubcollectionPayment.paymentDate };
  })();

  const photoGallery = useMemo(() => {
    const list = [];
    checks.forEach((check) => {
      if (check.photoURLs) {
        Object.entries(check.photoURLs).forEach(([type, url]) => { if (url) list.push({ url, label: type, date: toDate(check.createdAt) }); });
      }
    });
    if (anamnesi?.photoURLs) {
      Object.entries(anamnesi.photoURLs).forEach(([type, url]) => { if (url) list.push({ url, label: `Anamnesi ${type}`, date: null }); });
    }
    return list.slice(0, 10);
  }, [checks, anamnesi]);

  const activityFeed = useMemo(() => {
    const items = [];
    
    // Aggiungi checks
    checks.forEach((c) => {
      const note = c.notes || '';
      const checkDate = toDate(c.createdAt) || toDate(c.lastUpdatedAt);
      if (checkDate) {
        items.push({ label: 'Check inviato', detail: note ? `Note: ${note.slice(0, 40)}${note.length > 40 ? '…' : ''}` : 'Aggiornato peso/metriche', date: checkDate, icon: 'check' });
      }
    });
    
    // Aggiungi pagamenti dalle rate pagate
    rates.filter(r => r.paid).forEach((r) => {
      const paymentDate = toDate(r.paidDate) || toDate(r.dueDate);
      if (paymentDate) {
        items.push({ label: 'Pagamento registrato', detail: `€${r.amount || 0}`, date: paymentDate, icon: 'payment' });
      }
    });
    
    // Aggiungi anamnesi se compilata
    if (anamnesi?.createdAt || anamnesi?.submittedAt) {
      const anamnesiDate = toDate(anamnesi.submittedAt) || toDate(anamnesi.createdAt);
      if (anamnesiDate) {
        items.push({ label: 'Anamnesi compilata', detail: 'Questionario iniziale completato', date: anamnesiDate, icon: 'anamnesi' });
      }
    }
    
    // Aggiungi creazione cliente
    if (client?.createdAt) {
      const createdDate = toDate(client.createdAt);
      if (createdDate) {
        items.push({ label: 'Cliente registrato', detail: 'Account creato sulla piattaforma', date: createdDate, icon: 'created' });
      }
    }
    
    return items.sort((a, b) => b.date - a.date).slice(0, 8);
  }, [checks, rates, anamnesi, client]);

  const formatDelta = (delta) => {
    if (delta === null || delta === undefined) return 'N/D';
    const fixed = Math.abs(delta).toFixed(1);
    return `${delta > 0 ? '+' : '-'}${fixed}`;
  };
  const formatDeltaPct = (deltaPct) => {
    if (deltaPct === null || deltaPct === undefined || !Number.isFinite(deltaPct)) return '';
    const fixed = Math.abs(deltaPct).toFixed(1);
    return `${deltaPct > 0 ? '+' : '-'}${fixed}%`;
  };

  const renderAnamnesiField = (label, value) => (
    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-white mt-1 whitespace-pre-wrap leading-snug">{value || 'N/D'}</p>
    </div>
  );

  const handleDelete = async () => {
    if (window.confirm(`Eliminare ${client?.name}?`)) {
      try { await deleteDoc(getTenantDoc(db, 'clients', clientId)); navigate(backPath); } catch { toast.error('Errore eliminazione.'); }
    }
  };

  const copyCredentialsToClipboard = async () => {
    if (!client) return;
    
    // Se non c'è magic link, generalo automaticamente
    if (!magicLink) {
      setGeneratingLink(true);
      try {
        const functions = getFunctions(undefined, 'europe-west1');
        const generateMagicLinkFn = httpsCallable(functions, 'generateMagicLink');
        
        const result = await generateMagicLinkFn({
          clientId: client.id,
          tenantId: CURRENT_TENANT_ID,
          email: client.email,
          name: client.name
        });
        
        if (result.data.success) {
          const newMagicLink = result.data.magicLink;
          setMagicLink(newMagicLink);
          
          // Copia messaggio con magic link
          const text = `Ciao ${client.name}, ti invio il link per entrare nel tuo profilo personale dove inizialmente potrai iniziare a caricare i check settimanalmente, vedere i pagamenti e scadenza abbonamento. A breve ci saranno altre novità che potrai vedere su questa piattaforma: Alimentazione, community, videocorsi, e altro ancora 💪\nTu come stai?\n\n🔗 LINK ACCESSO RAPIDO (valido 48h):\n${newMagicLink}\n\n⚠️ Clicca il link sopra per impostare la tua password e accedere direttamente!\n\n📌 Questo poi è il link che dovrai usare ogni volta che vorrai entrare nella tua area personale:\nhttps://www.flowfitpro.it/login`;
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } else {
          toast.error('Errore nella generazione del Magic Link');
        }
      } catch (error) {
        console.error('Errore generazione Magic Link:', error);
        toast.error('Errore: ' + (error.message || 'Riprova più tardi'));
      } finally {
        setGeneratingLink(false);
      }
      return;
    }
    
    // Usa il Magic Link già generato
    const text = `Ciao ${client.name}, ti invio il link per entrare nel tuo profilo personale dove inizialmente potrai iniziare a caricare i check settimanalmente, vedere i pagamenti e scadenza abbonamento. A breve ci saranno altre novità che potrai vedere su questa piattaforma: Alimentazione, community, videocorsi, e altro ancora 💪\nTu come stai?\n\n🔗 LINK ACCESSO RAPIDO (valido 48h):\n${magicLink}\n\n⚠️ Clicca il link sopra per impostare la tua password e accedere direttamente!\n\n📌 Questo poi è il link che dovrai usare ogni volta che vorrai entrare nella tua area personale:\nhttps://www.flowfitpro.it/login`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const generateMagicLinkForClient = async () => {
    if (!client || generatingLink) return;
    
    setGeneratingLink(true);
    try {
      const functions = getFunctions(undefined, 'europe-west1');
      const generateMagicLink = httpsCallable(functions, 'generateMagicLink');
      
      const result = await generateMagicLink({
        clientId: client.id,
        tenantId: CURRENT_TENANT_ID,
        email: client.email,
        name: client.name
      });
      
      if (result.data.success) {
        setMagicLink(result.data.magicLink);
        // Copia automaticamente negli appunti
        navigator.clipboard.writeText(result.data.magicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        toast.error('Errore nella generazione del Magic Link');
      }
    } catch (error) {
      console.error('Errore generazione Magic Link:', error);
      toast.error('Errore: ' + (error.message || 'Riprova più tardi'));
    } finally {
      setGeneratingLink(false);
    }
  };

  // Upload foto anamnesi da admin
  const handleAnamnesiPhotoUpload = async (position, file) => {
    if (!file || !clientId) return;
    
    setUploadingPhoto(position);
    try {
      // Upload su R2
      const photoUrl = await uploadToR2(file, clientId, 'anamnesi_photos', null, true);
      
      // Aggiorna o crea documento anamnesi
      const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', clientId, 'anamnesi');
      const anamnesiDocRef = doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial');
      
      const currentAnamnesi = anamnesi || {};
      const currentPhotos = currentAnamnesi.photoURLs || { front: null, right: null, left: null, back: null };
      
      const updatedPhotos = {
        ...currentPhotos,
        [position]: photoUrl
      };
      
      await setDoc(anamnesiDocRef, {
        ...currentAnamnesi,
        photoURLs: updatedPhotos,
        updatedAt: new Date(),
        updatedBy: 'admin'
      }, { merge: true });
      
      // Aggiorna stato locale
      setAnamnesi(prev => ({
        ...prev,
        photoURLs: updatedPhotos
      }));
      
    } catch (error) {
      console.error('Errore upload foto anamnesi:', error);
      toast.error('Errore nel caricamento: ' + error.message);
    } finally {
      setUploadingPhoto(null);
    }
  };

  // Upload foto per nuovo check
  const handleCheckPhotoUpload = async (position, file) => {
    if (!file) return;
    
    setUploadingCheckPhoto(position);
    try {
      const photoUrl = await uploadToR2(file, clientId, 'check_photos', null, true);
      setNewCheckData(prev => ({
        ...prev,
        photos: { ...prev.photos, [position]: photoUrl }
      }));
    } catch (error) {
      console.error('Errore upload foto check:', error);
      toast.error('Errore nel caricamento: ' + error.message);
    } finally {
      setUploadingCheckPhoto(null);
    }
  };

  // Salva nuovo check
  const handleSaveNewCheck = async () => {
    if (!clientId) return;
    
    try {
      const checksRef = getTenantSubcollection(db, 'clients', clientId, 'checks');
      
      // Usa la data selezionata o oggi
      const checkDate = newCheckData.checkDate 
        ? new Date(newCheckData.checkDate + 'T12:00:00') // Mezzogiorno per evitare problemi timezone
        : new Date();
      
      await addDoc(checksRef, {
        weight: newCheckData.weight ? parseFloat(newCheckData.weight) : null,
        bodyFat: newCheckData.bodyFat ? parseFloat(newCheckData.bodyFat) : null,
        notes: newCheckData.notes || '',
        photoURLs: Object.keys(newCheckData.photos).length > 0 ? newCheckData.photos : null,
        createdAt: checkDate,
        createdBy: 'admin',
        source: 'admin_upload'
      });
      
      setShowNewCheck(false);
      setNewCheckData({ 
        weight: '', 
        bodyFat: '', 
        notes: '', 
        photos: {},
        checkDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Errore salvataggio check:', error);
      toast.error('Errore nel salvataggio: ' + error.message);
    }
  };

  const handleAddRate = async (rate) => {
    // Aggiungi sempre alla subcollection rates (nuovo sistema)
    const ratesRef = getTenantSubcollection(db, 'clients', client.id, 'rates');
    await addDoc(ratesRef, {
      amount: parseFloat(rate.amount) || 0,
      dueDate: rate.dueDate ? new Date(rate.dueDate) : null,
      paid: rate.paid || false,
      paidDate: rate.paidDate ? new Date(rate.paidDate) : null,
      createdAt: new Date(),
      isRenewal: false
    });
  };
  
  const handleUpdateRate = async (idx, updatedRate) => {
    const rate = rates[idx];
    if (rate.fromSubcollection && rate.id) {
      // Update nella subcollection
      const rateRef = doc(getTenantSubcollection(db, 'clients', client.id, 'rates'), rate.id);
      await updateDoc(rateRef, {
        amount: parseFloat(updatedRate.amount) || rate.amount,
        dueDate: updatedRate.dueDate ? new Date(updatedRate.dueDate) : (rate.dueDate ? new Date(rate.dueDate) : null),
        paid: updatedRate.paid ?? rate.paid,
        paidDate: updatedRate.paidDate ? new Date(updatedRate.paidDate) : (updatedRate.paid && !rate.paidDate ? new Date() : null)
      });
    } else {
      // Update nel campo legacy client.rate
      const legacyIdx = rate.legacyIndex;
      const newLegacyRates = legacyRates.map((r, i) => i === legacyIdx ? { ...r, ...updatedRate } : r);
      setLegacyRates(newLegacyRates);
      await updateDoc(getTenantDoc(db, 'clients', client.id), { rate: newLegacyRates });
    }
  };
  
  const handleDeleteRate = async (idx) => {
    const rate = rates[idx];
    if (rate.fromSubcollection && rate.id) {
      // Delete dalla subcollection
      const rateRef = doc(getTenantSubcollection(db, 'clients', client.id, 'rates'), rate.id);
      await deleteDoc(rateRef);
    } else {
      // Delete dal campo legacy client.rate
      const legacyIdx = rate.legacyIndex;
      const newLegacyRates = legacyRates.filter((_, i) => i !== legacyIdx);
      setLegacyRates(newLegacyRates);
      await updateDoc(getTenantDoc(db, 'clients', client.id), { rate: newLegacyRates });
    }
  };

  if (loading) return <div className="text-center text-slate-400 p-8">Caricamento...</div>;
  if (error) return <div className="text-center text-red-400 p-8">{error}</div>;
  if (!client) return null;

  // Tabs - filtra 'payments' se non è admin
  const allTabs = [
    { key: 'overview', label: 'Overview', icon: <FileText size={16} /> },
    { key: 'habits', label: 'Abitudini', icon: <Heart size={16} /> },
    { key: 'check', label: 'Check & Foto', icon: <Calendar size={16} /> },
    { key: 'payments', label: 'Pagamenti', icon: <CreditCard size={16} />, adminOnly: true },
    { key: 'metrics', label: 'Metriche', icon: <BarChart3 size={16} /> },
    { key: 'anamnesi', label: 'Anamnesi', icon: <NotebookPen size={16} /> },
  ];
  const tabs = allTabs.filter(tab => !tab.adminOnly || canManagePayments);

  const infoCard = (
    <UnifiedCard>
      <CardHeader 
        icon={FileText}
        title="Dettagli cliente"
        subtitle="Client Details"
        action={<PathStatusBadge status={client.statoPercorso} />}
      />

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <InfoField icon={User} value={client.name} />
          <div className="flex items-center gap-2">
            <InfoField icon={Mail} value={client.email} />
            <button 
              onClick={generateMagicLinkForClient} 
              disabled={generatingLink}
              className="p-1.5 rounded-md border border-slate-700 text-slate-200 hover:text-blue-300 hover:border-blue-400 bg-slate-800 disabled:opacity-50"
              title="Genera Magic Link"
            >
              {generatingLink ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            </button>
            <button onClick={copyCredentialsToClipboard} className="p-1.5 rounded-md border border-slate-700 text-slate-200 hover:text-emerald-300 hover:border-emerald-400 bg-slate-800" title="Copia credenziali">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <InfoField icon={Phone} value={client.phone || 'N/D'} />
            {client.phone && (
              <WhatsAppButton 
                client={{ ...client, id: clientId }} 
                tenantId={CURRENT_TENANT_ID} 
                variant="icon"
              />
            )}
          </div>
          <InfoField icon={Calendar} value={`Scadenza: ${toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}`} />
          <InfoField icon={Clock} value={`Ultimo check: ${lastCheckAt ? lastCheckAt.toLocaleString('it-IT') : 'N/D'}`} />
          
          <InfoField icon={Activity} value={`Ultimo accesso: ${(() => {
            // Prova lastActive, poi lastCheckAt, poi createdAt come fallback
            const lastActiveDate = client.lastActive ? toDate(client.lastActive) : null;
            if (lastActiveDate) return lastActiveDate.toLocaleString('it-IT');
            if (lastCheckAt) return lastCheckAt.toLocaleString('it-IT');
            const createdDate = client.createdAt ? toDate(client.createdAt) : null;
            if (createdDate) return createdDate.toLocaleString('it-IT');
            return 'N/D';
          })()}`} />
          <InfoField icon={DollarSign} value={`Prezzo: ${client.price ? `€${client.price}` : 'N/D'}`} />
          <InfoField icon={FileText} value={`Anamnesi: ${anamnesi ? 'Compilata ✓' : 'Non inviata'}`} />
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-slate-400" />
            <span className="inline-flex items-center gap-2 flex-wrap">
              <Badge variant="danger" size="sm">{client.tags?.[0] || 'Client'}</Badge>
              {client.rateizzato && <Badge variant="success" size="sm">Rateizzato</Badge>}
            </span>
          </div>
        </div>

        <CardGrid cols={2}>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2 mb-1 text-slate-300">
              <ClipboardList size={15} />
              <span className="font-semibold text-white">Goal</span>
            </div>
            <p className="text-slate-200 leading-snug min-h-[48px]">{anamnesi?.mainGoal || 'Non impostato'}</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2 mb-1 text-slate-300">
              <AlertTriangle size={15} />
              <span className="font-semibold text-white">Infortuni</span>
            </div>
            <p className="text-slate-200 leading-snug min-h-[48px]">{anamnesi?.injuries || 'Non specificato'}</p>
          </div>
        </CardGrid>
      </CardContent>
    </UnifiedCard>
  );

  const metricsCard = (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Metrics Avg"
        subtitle="Ultimi check"
      />
      <CardContent>
        <CardGrid cols={3}>
          <DataCard 
            label="Peso"
            value={weightValue !== null ? formatWeight(weightValue) : 'N/D'}
            delta={weightDelta !== null ? `${formatDelta(weightDelta)} ${formatDeltaPct(weightDeltaPct)}` : undefined}
            deltaType="negative"
          />
          <DataCard 
            label={bodyFatValue !== null ? "Body Fat" : "Body Fat (stima)"}
            value={bodyFatValue !== null ? `${bodyFatValue}%` : (estimatedBodyFat !== null ? `~${estimatedBodyFat}%` : 'N/D')}
            delta={bodyFatDelta !== null ? `${formatDelta(bodyFatDelta)} ${formatDeltaPct(bodyFatDeltaPct)}` : undefined}
            deltaType="negative"
          />
          <DataCard 
            label="Check"
            value={checks.length || 0}
          />
        </CardGrid>
      </CardContent>
    </UnifiedCard>
  );

  const checkCard = (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Check recenti"
        subtitle="Ultimi 5"
        action={
          <button 
            onClick={() => setShowNewCheck(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus size={14} /> Aggiungi Check
          </button>
        }
      />
      <CardContent>
        {checks.length > 0 ? (
          <div className="space-y-3">
            {checks.slice(0, 5).map((check) => (
              <ListItemCard key={check.id}>
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span className="font-semibold">{toDate(check.createdAt)?.toLocaleDateString('it-IT') || 'N/D'}</span>
                  <span className="text-slate-400">{toDate(check.createdAt)?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) || ''}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {check.weight && <Badge variant="default" size="sm">Peso {formatWeight(check.weight)}</Badge>}
                  {check.bodyFat && <Badge variant="default" size="sm">BF {check.bodyFat}%</Badge>}
                  {check.notes && <Badge variant="default" size="sm">Note: {check.notes.slice(0, 30)}{check.notes.length > 30 ? '…' : ''}</Badge>}
                </div>
              </ListItemCard>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            description="Nessun check disponibile."
          />
        )}
      </CardContent>
    </UnifiedCard>
  );

  // Card Progressione con grafici
  const progressCard = (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Progressione"
        subtitle="Andamento peso e BF"
        action={
          <div className="flex items-center gap-1">
            <TrendingUp size={16} className="text-blue-400" />
          </div>
        }
      />
      <CardContent>
        <ProgressCharts checks={checks} />
      </CardContent>
    </UnifiedCard>
  );

  const photosCard = (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Foto recenti"
        subtitle="max 10"
        action={
          <button 
            onClick={() => setShowPhotoCompare(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
          >
            <ArrowLeftRight size={14} />
            Confronta
          </button>
        }
      />
      <CardContent>
        {photoGallery.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {photoGallery.map((photo, idx) => (
              <button 
                key={idx} 
                onClick={() => setZoomPhoto({ open: true, url: photo.url, alt: photo.label })} 
                className="relative overflow-hidden rounded-lg group border border-slate-800 bg-slate-900/60"
              >
                <img 
                  src={photo.url} 
                  alt={photo.label} 
                  className="w-full h-24 object-cover transition-transform group-hover:scale-110" 
                  onError={(e) => {
                    console.warn('[ClientDetail] Failed to load photo:', photo.url);
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-24 flex items-center justify-center text-slate-500 text-xs">Errore caricamento</div>';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100" size={18} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Image}
            description="Nessuna foto caricata."
          />
        )}
      </CardContent>
    </UnifiedCard>
  );

  const paymentsCard = (
    <UnifiedCard>
      <CardHeaderSimple 
        title="Pagamenti"
        action={
          <button 
            onClick={() => setShowAmounts(!showAmounts)} 
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-700 text-slate-200 bg-slate-800 rounded-lg text-xs hover:bg-slate-700" 
            title={showAmounts ? 'Nascondi importi' : 'Mostra importi'}
          >
            {showAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAmounts ? 'Nascondi' : 'Mostra'}
          </button>
        }
      />
      <CardContent>
        <CardGrid cols={2} className="mb-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Pagato</p>
            <p className="text-lg font-semibold text-white">{showAmounts ? `€${paymentsPaid.toFixed(0)}` : '€ •••'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Totale</p>
            <p className="text-lg font-semibold text-white">{showAmounts ? `€${paymentsTotal.toFixed(0)}` : '€ •••'}</p>
          </div>
        </CardGrid>
        
        {/* Lista pagamenti dalla subcollection */}
        {payments.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-slate-400 mb-2 font-medium">Storico pagamenti</p>
            <div className="space-y-2">
              {payments.map((payment, idx) => {
                const pDate = toDate(payment.paymentDate);
                return (
                  <div 
                    key={payment.id || idx} 
                    className="flex items-center justify-between p-3 bg-slate-900/70 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {showAmounts ? `€${payment.amount || 0}` : '€ •••'}
                        </span>
                        {payment.isRenewal && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-400 rounded">Rinnovo</span>
                        )}
                        {payment.duration && (
                          <span className="text-xs text-slate-500">{payment.duration}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">
                          {pDate ? pDate.toLocaleDateString('it-IT') : 'N/D'}
                        </span>
                        {payment.paymentMethod && (
                          <span className="text-xs text-slate-500">
                            • {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPaymentIndex(idx);
                        setShowEditPayment(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Modifica pagamento"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {payments.length === 0 && !lastPayment && (
          <p className="text-slate-400 text-sm mt-2">Nessun pagamento registrato.</p>
        )}
      </CardContent>
    </UnifiedCard>
  );

  const activityCard = (
    <UnifiedCard>
      <CardHeader icon={Activity} title="Activity Log" />
      <CardContent>
        {activityFeed.length > 0 ? (
          <div className="space-y-3">
            {activityFeed.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-100">
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  item.icon === 'payment' ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400' :
                  item.icon === 'anamnesi' ? 'bg-blue-900/30 border-blue-700/50 text-blue-400' :
                  item.icon === 'created' ? 'bg-purple-900/30 border-purple-700/50 text-purple-400' :
                  'bg-slate-900 border-slate-800 text-slate-200'
                }`}>
                  {item.icon === 'payment' ? <CreditCard size={16} /> : 
                   item.icon === 'anamnesi' ? <FileText size={16} /> :
                   item.icon === 'created' ? <User size={16} /> :
                   <CheckCircle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-slate-400 text-xs">{item.date?.toLocaleString('it-IT')}</p>
                  <p className="text-slate-200 text-sm mt-0.5 truncate">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            description="Nessuna attività recente."
          />
        )}
      </CardContent>
    </UnifiedCard>
  );

  const anamnesiCard = (
    <UnifiedCard>
      <CardHeader icon={FileText} title="Anamnesi completa" />
      <CardContent>
        {anamnesi ? (
          <div className="space-y-3">
            <CardGrid cols={4}>
              {renderAnamnesiField('Nome', anamnesi.firstName || client.name)}
              {renderAnamnesiField('Cognome', anamnesi.lastName)}
              {renderAnamnesiField('Data di nascita', anamnesi.birthDate)}
              {renderAnamnesiField('Sesso', anamnesi.gender === 'M' ? 'Maschio' : anamnesi.gender === 'F' ? 'Femmina' : anamnesi.gender === 'male' ? 'Maschio' : anamnesi.gender === 'female' ? 'Femmina' : 'Non specificato')}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Lavoro', anamnesi.job)}
              {renderAnamnesiField(`Peso (${weightLabel})`, anamnesi.weight ? formatWeight(anamnesi.weight) : null)}
              {renderAnamnesiField(`Altezza (${lengthLabel})`, anamnesi.height ? formatLength(anamnesi.height) : null)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Pasti al giorno', anamnesi.mealsPerDay)}
              {renderAnamnesiField('Tipo colazione', anamnesi.breakfastType)}
              {renderAnamnesiField('Durata percorso', anamnesi.programDuration)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Alimenti preferiti', anamnesi.desiredFoods)}
              {renderAnamnesiField('Alimenti da evitare', anamnesi.dislikedFoods)}
              {renderAnamnesiField('Allergie / intolleranze', anamnesi.intolerances)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Problemi digestione', anamnesi.digestionIssues)}
              {renderAnamnesiField('Qualità del sonno', anamnesi.sleepQuality)}
              {renderAnamnesiField('Note generali', anamnesi.note)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Allenamenti a settimana', anamnesi.workoutsPerWeek)}
              {renderAnamnesiField('Dettagli allenamento', anamnesi.trainingDetails)}
              {renderAnamnesiField('Orario e durata', anamnesi.trainingTime)}
            </CardGrid>
            <CardGrid cols={3}>
              {renderAnamnesiField('Infortuni / problematiche', anamnesi.injuries)}
              {renderAnamnesiField('Farmaci', anamnesi.medications)}
              {renderAnamnesiField('Integratori', anamnesi.supplements)}
            </CardGrid>
            <CardGrid cols={2}>
              {renderAnamnesiField('Obiettivo principale', anamnesi.mainGoal)}
              {renderAnamnesiField('Motivazione / dettagli', anamnesi.trainingDetails || anamnesi.programDuration)}
            </CardGrid>
            
            {/* Foto Anamnesi - con possibilità di upload da admin */}
            <div className="pt-4">
              <p className="text-sm font-medium text-slate-300 mb-3">Foto Anamnesi</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['front', 'right', 'left', 'back'].map((pos) => (
                  <div key={pos} className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden text-xs text-slate-300">
                    <div className="px-3 py-2 border-b border-slate-800 capitalize flex items-center justify-between">
                      <span>{pos === 'front' ? 'Frontale' : pos === 'back' ? 'Posteriore' : `Laterale ${pos === 'left' ? 'Sinistra' : 'Destra'}`}</span>
                      <label className="cursor-pointer p-1 hover:bg-slate-700 rounded transition-colors">
                        {uploadingPhoto === pos ? (
                          <Loader2 size={14} className="animate-spin text-blue-400" />
                        ) : (
                          <Upload size={14} className="text-slate-400 hover:text-blue-400" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAnamnesiPhotoUpload(pos, file);
                            e.target.value = '';
                          }}
                          disabled={uploadingPhoto !== null}
                        />
                      </label>
                    </div>
                    {anamnesi?.photoURLs?.[pos] ? (
                      <img 
                        src={anamnesi.photoURLs[pos]} 
                        alt={pos} 
                        className="w-full h-28 object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setZoomPhoto({ open: true, url: anamnesi.photoURLs[pos], alt: pos })}
                      />
                    ) : (
                      <div className="w-full h-28 bg-slate-800 flex items-center justify-center text-slate-500">
                        <Camera size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Se non c'è anamnesi, mostra comunque le foto con possibilità di upload */
          <div className="space-y-4">
            <EmptyState
              icon={FileText}
              title="Nessuna anamnesi testuale"
              description="Il cliente non ha ancora compilato l'anamnesi."
            />
            <div className="pt-2">
              <p className="text-sm font-medium text-slate-300 mb-3">Carica foto anamnesi manualmente</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['front', 'right', 'left', 'back'].map((pos) => (
                  <div key={pos} className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden text-xs text-slate-300">
                    <div className="px-3 py-2 border-b border-slate-800 capitalize flex items-center justify-between">
                      <span>{pos === 'front' ? 'Frontale' : pos === 'back' ? 'Posteriore' : `Laterale ${pos === 'left' ? 'Sinistra' : 'Destra'}`}</span>
                      <label className="cursor-pointer p-1 hover:bg-slate-700 rounded transition-colors">
                        {uploadingPhoto === pos ? (
                          <Loader2 size={14} className="animate-spin text-blue-400" />
                        ) : (
                          <Upload size={14} className="text-slate-400 hover:text-blue-400" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAnamnesiPhotoUpload(pos, file);
                            e.target.value = '';
                          }}
                          disabled={uploadingPhoto !== null}
                        />
                      </label>
                    </div>
                    {anamnesi?.photoURLs?.[pos] ? (
                      <img 
                        src={anamnesi.photoURLs[pos]} 
                        alt={pos} 
                        className="w-full h-28 object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setZoomPhoto({ open: true, url: anamnesi.photoURLs[pos], alt: pos })}
                      />
                    ) : (
                      <div className="w-full h-28 bg-slate-800 flex items-center justify-center text-slate-500">
                        <Camera size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </UnifiedCard>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-transparent">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full px-0 sm:px-0 py-0">

          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              {/* Breadcrumb / Back button */}
              <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm transition-colors">
                <ArrowLeft size={16} /> Torna ai Clienti
              </button>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Profilo Cliente</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{client.name}</h1>
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">{client.tags?.[0] || 'Client'}</span>
                    {client.rateizzato && <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">Rateizzato</span>}
                    {client.isOldClient && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium">
                        <AlertTriangle size={12} /> Archiviato
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400 pt-1">
                    <PathStatusBadge status={client.statoPercorso} />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 text-slate-300 text-xs">
                      <Activity size={12} /> Check: {checks.length || 0}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 text-slate-300 text-xs">
                      <Calendar size={12} /> Ultimo: {lastCheckAt ? lastCheckAt.toLocaleDateString('it-IT') : 'N/D'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                  <QuickNotifyButton userId={clientId} userName={client.name} userType="client" />
                  {!isMobile && (
                    <>
                      {canEditClient && <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm transition-colors"><Edit size={16} /> Modifica</button>}
                      {canManagePayments && <button onClick={() => setShowRenewal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"><Plus size={16} /> Rinnovo</button>}
                      <button onClick={() => setShowExtend(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors"><CalendarDays size={16} /> Prolunga</button>
                      {canDeleteClient && <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm transition-colors"><Trash2 size={16} /> Elimina</button>}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 bg-slate-900/40 p-1.5 rounded-xl border border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-700">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* CTA Banner */}
            {!isMobile && (
              <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Info size={20} /></div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-white">Prova l'app come questo cliente</p>
                    <p className="text-xs text-slate-400">Apri la vista cliente per verificare la customer experience.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors">Mostrami come →</button>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.35fr,1fr] gap-4 lg:gap-6">
                <div className="space-y-4">
                  {infoCard}
                  {/* Card Prossima Chiamata */}
                  <NextCallCard clientId={clientId} isAdmin={isAdmin} onSchedule={() => setShowScheduleCall(true)} />
                  {checkCard}
                  {progressCard}
                  {activityCard}
                </div>
                <div className="space-y-4">
                  {metricsCard}
                  {photosCard}
                  {paymentsCard}
                </div>
              </div>
            )}

            {activeTab === 'check' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,1fr] gap-4 lg:gap-6">
                <div className="space-y-4">
                  {checkCard}
                  {progressCard}
                </div>
                {photosCard}
              </div>
            )}

            {activeTab === 'habits' && (
              <ClientHabitsOverview 
                client={client} 
                onOpenCalendar={() => setShowWorkoutCalendar(true)} 
              />
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                {paymentsCard}
                <RateTable 
                  rates={rates} 
                  canEdit={isAdmin} 
                  onAdd={handleAddRate} 
                  onUpdate={handleUpdateRate} 
                  onDelete={handleDeleteRate} 
                  showAmounts={showAmounts}
                  onRatePaymentToggled={(isPaid, amount) => {
                    if (isPaid) {
                      toast.success(`Rata di €${amount} segnata come pagata! ✓`);
                    } else {
                      toast.info(`Rata di €${amount} segnata come da pagare`);
                    }
                  }}
                />
              </div>
            )}
            {activeTab === 'metrics' && metricsCard}

            {activeTab === 'anamnesi' && anamnesiCard}

            {isMobile && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                {canEditClient && <button onClick={() => setShowEdit(true)} className="px-3 py-2 border border-slate-700 bg-slate-900 text-slate-200 rounded-lg text-sm flex items-center justify-center gap-2"><Edit size={14} /> Modifica</button>}
                {canManagePayments && <button onClick={() => setShowRenewal(true)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm flex items-center justify-center gap-2"><Plus size={14} /> Rinnovo</button>}
                <button onClick={() => setShowExtend(true)} className="px-3 py-2 bg-cyan-600/80 text-white border border-cyan-500/60 rounded-lg text-sm flex items-center justify-center gap-2"><CalendarDays size={14} /> Prolunga</button>
                {canDeleteClient && <button onClick={handleDelete} className="px-3 py-2 bg-rose-600/80 text-white border border-rose-500/60 rounded-lg text-sm flex items-center justify-center gap-2"><Trash2 size={14} /> Elimina</button>}
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {showRenewal && <RenewalModal key="renewal" isOpen={showRenewal} onClose={() => setShowRenewal(false)} client={client} onSave={() => {}} />}
          {showEdit && <EditClientModal key="edit" isOpen={showEdit} onClose={() => setShowEdit(false)} client={client} onSave={() => {}} />}
          {showExtend && <ExtendExpiryModal key="extend" isOpen={showExtend} onClose={() => setShowExtend(false)} client={client} onSave={() => {}} />}
          {showEditPayment && <EditPaymentModal
            key="editPayment"
            isOpen={showEditPayment}
            onClose={() => { setShowEditPayment(false); setEditingPaymentIndex(null); }}
            payment={editingPaymentIndex !== null && payments.length > editingPaymentIndex ? payments[editingPaymentIndex] : null}
            client={client}
            onSave={() => { setEditingPaymentIndex(null); }}
            onDelete={() => { setEditingPaymentIndex(null); }}
          />}
          {zoomPhoto?.open && <PhotoZoomModal key="zoom" isOpen={!!zoomPhoto?.open} onClose={() => setZoomPhoto({ open: false, url: '', alt: '' })} imageUrl={zoomPhoto?.url} alt={zoomPhoto?.alt} />}
          {showPhotoCompare && <PhotoCompare key="photoCompare" checks={checks} anamnesi={anamnesi} onClose={() => setShowPhotoCompare(false)} />}
          {showScheduleCall && <ScheduleCallModal 
            key="scheduleCall"
            isOpen={showScheduleCall} 
            onClose={() => setShowScheduleCall(false)} 
            clientId={clientId}
            clientName={client?.name}
            existingCall={nextCall}
            onSave={() => {}}
          />}
          
          {/* Modale Calendario Workout */}
          <WorkoutCalendarModal 
            key="workoutCalendar"
            isOpen={showWorkoutCalendar}
            onClose={() => setShowWorkoutCalendar(false)}
            clientId={clientId}
          />
          
          {/* Modale Nuovo Check */}
          {showNewCheck && (
            <motion.div
              key="newCheck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNewCheck(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Nuovo Check</h3>
                  <button onClick={() => setShowNewCheck(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Data del check */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Data Check</label>
                    <input
                      type="date"
                      value={newCheckData.checkDate}
                      onChange={(e) => setNewCheckData(prev => ({ ...prev, checkDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-slate-500 mt-1">Seleziona la data in cui è stato effettuato il check</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newCheckData.weight}
                        onChange={(e) => setNewCheckData(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        placeholder="Es: 75.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Body Fat (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newCheckData.bodyFat}
                        onChange={(e) => setNewCheckData(prev => ({ ...prev, bodyFat: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        placeholder="Es: 15.0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Note</label>
                    <textarea
                      value={newCheckData.notes}
                      onChange={(e) => setNewCheckData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                      rows={3}
                      placeholder="Note opzionali..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Foto Check</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['front', 'right', 'left', 'back'].map((pos) => (
                        <div key={pos} className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
                          <div className="text-xs text-center py-1 border-b border-slate-700 text-slate-400 capitalize">
                            {pos === 'front' ? 'Front' : pos === 'back' ? 'Back' : pos === 'left' ? 'Left' : 'Right'}
                          </div>
                          {newCheckData.photos[pos] ? (
                            <div className="relative">
                              <img src={newCheckData.photos[pos]} alt={pos} className="w-full h-20 object-cover" />
                              <button 
                                onClick={() => setNewCheckData(prev => ({ ...prev, photos: { ...prev.photos, [pos]: undefined } }))}
                                className="absolute top-1 right-1 p-1 bg-red-600 rounded-full"
                              >
                                <X size={10} className="text-white" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center h-20 cursor-pointer hover:bg-slate-700 transition-colors">
                              {uploadingCheckPhoto === pos ? (
                                <Loader2 size={20} className="animate-spin text-blue-400" />
                              ) : (
                                <Camera size={20} className="text-slate-500" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleCheckPhotoUpload(pos, file);
                                  e.target.value = '';
                                }}
                                disabled={uploadingCheckPhoto !== null}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowNewCheck(false)}
                    className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveNewCheck}
                    disabled={!newCheckData.weight && !newCheckData.bodyFat && Object.keys(newCheckData.photos).length === 0}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salva Check
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
