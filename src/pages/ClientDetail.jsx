// src/pages/ClientDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, orderBy } from 'firebase/firestore';
import normalizePhotoURLs from '../utils/normalizePhotoURLs';
import { db, toDate, calcolaStatoPercorso, updateStatoPercorso } from '../firebase';
import { User, Mail, Phone, Calendar, FileText, DollarSign, Trash2, Edit, ArrowLeft, Copy, Check, X, Plus, ZoomIn, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuickNotifyButton from '../components/QuickNotifyButton';

// Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div className="text-center text-red-400 p-8">Errore: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

// PathStatusBadge
const PathStatusBadge = ({ status }) => {
  const styles = {
    attivo: "bg-emerald-900/80 text-emerald-300 border border-emerald-500/30",
    rinnovato: "bg-amber-900/80 text-amber-300 border border-amber-500/30",
    non_rinnovato: "bg-red-900/80 text-red-400 border border-red-500/30",
    na: "bg-slate-700/80 text-slate-300 border border-slate-500/30",
  };
  const labels = { attivo: 'Attivo', rinnovato: 'In Scadenza', non_rinnovato: 'Scaduto', na: 'N/D' };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.na}`}>{labels[status] || 'N/D'}</span>;
};

// MODALE ZOOM FOTO
const PhotoZoomModal = ({ isOpen, onClose, imageUrl, alt }) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={onClose}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.8 }} 
        animate={{ scale: 1 }} 
        exit={{ scale: 0.8 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-full"
      >
        <img src={imageUrl} alt={alt} className="w-full h-auto max-h-screen object-contain rounded-lg shadow-2xl" />
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
        >
          <X size={24} />
        </button>
        <div className="absolute bottom-4 left-4 text-white bg-black/60 px-3 py-1 rounded text-sm">
          {alt}
        </div>
      </motion.div>
    </motion.div>
  );
};

// MODALE RINNOVO
const RenewalModal = ({ isOpen, onClose, client, onSave }) => {
  const [months, setMonths] = useState(3);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bonifico');
  const [customMethod, setCustomMethod] = useState('');
  const [manualExpiry, setManualExpiry] = useState('');

  const handleSave = async () => {
    try {
      const currentExpiry = toDate(client.scadenza) || new Date();
      const expiry = manualExpiry ? new Date(manualExpiry) : new Date(currentExpiry);
      
      if (!manualExpiry) {
        expiry.setMonth(expiry.getMonth() + months);
      }

      const paymentMethod = method === 'altro' ? customMethod : method;
      const payment = {
        amount: parseFloat(amount) || 0,
        duration: manualExpiry ? 'Manuale' : `${months} mesi`,
        paymentDate: new Date(),
        paymentMethod
      };

      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, {
        scadenza: expiry,
        payments: [...(client.payments || []), payment]
      });

      updateStatoPercorso(client.id);
      onSave();
      onClose();
    } catch (err) {
      console.error('Errore rinnovo:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-800/95 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Rinnovo {client.name}</h3>
          <button onClick={onClose} className="text-white hover:text-rose-400">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Mesi di rinnovo</label>
            <select value={months} onChange={e => setMonths(parseInt(e.target.value))} className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
              <option value={1}>1 mese</option>
              <option value={3}>3 mesi</option>
              <option value={6}>6 mesi</option>
              <option value={12}>12 mesi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Oppure data scadenza manuale</label>
            <input type="date" value={manualExpiry} onChange={e => setManualExpiry(e.target.value)} className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Importo</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="es. 150" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Metodo</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
              <option value="bonifico">Bonifico</option>
              <option value="klarna">Klarna 3 rate</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Contanti</option>
              <option value="rateizzato">Rateizzato</option>
              <option value="altro">Altro</option>
            </select>
            {method === 'altro' && (
              <input 
                type="text" 
                value={customMethod} 
                onChange={e => setCustomMethod(e.target.value)} 
                placeholder="Specifica metodo" 
                className="w-full mt-2 p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" 
              />
            )}
          </div>
          <button onClick={handleSave} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold">
            Salva Rinnovo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// MODALE MODIFICA ANAGRAFICA
const EditClientModal = ({ isOpen, onClose, client, onSave }) => {
  const [form, setForm] = useState({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
  });

  const handleSave = async () => {
    try {
      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, form);
      onSave();
      onClose();
    } catch (err) {
      console.error('Errore modifica:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-800/95 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Modifica {client.name}</h3>
          <button onClick={onClose} className="text-white hover:text-rose-400">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefono" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
          <button onClick={handleSave} className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold">
            Salva Modifiche
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// NUOVO MODALE: PROLUNGA SCADENZA
const ExtendExpiryModal = ({ isOpen, onClose, client, onSave }) => {
  const [days, setDays] = useState(7);
  const [manualDate, setManualDate] = useState('');
  const [useManual, setUseManual] = useState(false);

  const handleSave = async () => {
    try {
      const current = toDate(client.scadenza) || new Date();
      const newExpiry = useManual && manualDate ? new Date(manualDate) : new Date(current);
      if (!useManual) {
        newExpiry.setDate(newExpiry.getDate() + days);
      }

      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, { scadenza: newExpiry });

      updateStatoPercorso(client.id);
      onSave();
      onClose();
    } catch (err) {
      console.error('Errore prolungamento:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-800/95 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Prolunga Scadenza</h3>
          <button onClick={onClose} className="text-white hover:text-rose-400">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={useManual} onChange={e => setUseManual(e.target.checked)} className="w-4 h-4 text-cyan-500" />
            <label className="text-sm text-slate-300">Scegli data manuale</label>
          </div>

          {useManual ? (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nuova data scadenza</label>
              <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Aggiungi giorni</label>
              <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
                <option value={1}>+1 giorno</option>
                <option value={3}>+3 giorni</option>
                <option value={7}>+7 giorni</option>
                <option value={15}>+15 giorni</option>
                <option value={30}>+30 giorni</option>
                <option value={60}>+60 giorni</option>
              </select>
            </div>
          )}

          <div className="text-xs text-slate-400 p-3 bg-slate-700/30 rounded-lg">
            <p>Scadenza attuale: <strong>{toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}</strong></p>
            <p>Nuova scadenza: <strong>{
              useManual && manualDate ? new Date(manualDate).toLocaleDateString('it-IT') :
              toDate(client.scadenza) ? new Date(toDate(client.scadenza).getTime() + days * 86400000).toLocaleDateString('it-IT') : 'N/D'
            }</strong></p>
          </div>

          <button onClick={handleSave} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2">
            <CalendarDays size={18} /> Prolunga Scadenza
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// COMPONENTE RIUTILIZZABILE: Campo Anamnesi
const AnamnesiField = ({ label, value }) => (
  <div className="mb-4">
    <h4 className="text-sm font-semibold text-slate-400">{label}</h4>
    <p className="mt-1 p-3 bg-white/5 backdrop-blur-md rounded-lg min-h-[44px] text-white break-words whitespace-pre-wrap shadow-inner">
      {value || 'Non specificato'}
    </p>
  </div>
);

// COMPONENTE TABELLA RATE
const RateTable = ({ rates, canEdit, onAdd, onUpdate, onDelete }) => {
  const [newRate, setNewRate] = useState({ amount: '', dueDate: '', paid: false });
  const [editIdx, setEditIdx] = useState(null);
  const [editRate, setEditRate] = useState({ amount: '', dueDate: '' });

  return (
    <div className="mt-6">
      <h3 className="text-base sm:text-lg font-bold text-slate-200 mb-2">Rate</h3>
      <div className="mobile-table-wrapper">
      <table className="w-full text-xs sm:text-sm bg-slate-800/60 rounded-xl border border-slate-700 min-w-[500px]">
        <thead>
          <tr className="bg-slate-900/50">
            <th className="px-2 py-2">Importo</th>
            <th className="px-2 py-2">Scadenza</th>
            <th className="px-2 py-2">Pagata</th>
            {canEdit && <th className="px-2 py-2">Modifica</th>}
            {canEdit && <th className="px-2 py-2">Azioni</th>}
          </tr>
        </thead>
        <tbody>
          {rates && rates.length > 0 ? rates.map((rate, idx) => (
            <tr key={idx} className="border-b border-slate-700">
              <td className="px-2 py-2">
                {canEdit && editIdx === idx ? (
                  <input type="number" value={editRate.amount} onChange={e => setEditRate({ ...editRate, amount: e.target.value })} className="p-1 rounded bg-slate-700/50 border border-slate-600 text-white w-20" />
                ) : `€${rate.amount}`}
              </td>
              <td className="px-2 py-2">
                {canEdit && editIdx === idx ? (
                  <input type="date" value={editRate.dueDate} onChange={e => setEditRate({ ...editRate, dueDate: e.target.value })} className="p-1 rounded bg-slate-700/50 border border-slate-600 text-white" />
                ) : (rate.dueDate ? new Date(rate.dueDate).toLocaleDateString() : '-')}
              </td>
              <td className="px-2 py-2">
                {canEdit ? (
                  <input type="checkbox" checked={rate.paid} onChange={() => {
                    const update = { ...rate, paid: !rate.paid };
                    if (!rate.paid) update.paidDate = new Date().toISOString();
                    else update.paidDate = null;
                    onUpdate(idx, update);
                  }} />
                ) : (
                  rate.paid ? <span className="text-green-400">Pagata{rate.paidDate ? ` il ${new Date(rate.paidDate).toLocaleDateString('it-IT')}` : ''}</span> : <span className="text-red-400">Da pagare</span>
                )}
              </td>
              {canEdit && (
                <td className="px-2 py-2">
                  {editIdx === idx ? (
                    <>
                      <button onClick={() => { onUpdate(idx, { ...rate, ...editRate }); setEditIdx(null); }} className="text-emerald-400 px-2">Salva</button>
                      <button onClick={() => setEditIdx(null)} className="text-slate-400 px-2">Annulla</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditIdx(idx); setEditRate({ amount: rate.amount, dueDate: rate.dueDate }); }} className="text-cyan-400 px-2">Modifica</button>
                  )}
                </td>
              )}
              {canEdit && (
                <td className="px-2 py-2">
                  <button onClick={() => onDelete(idx)} className="text-red-400 px-2">Elimina</button>
                </td>
              )}
            </tr>
          )) : (
            <tr><td colSpan={canEdit ? 5 : 3} className="text-center py-2 text-slate-400">Nessuna rata</td></tr>
          )}
        </tbody>
      </table>
      </div>
      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <input type="number" placeholder="Importo (€)" value={newRate.amount} onChange={e => setNewRate({ ...newRate, amount: e.target.value })} className="p-2 rounded bg-slate-700/50 border border-slate-600 text-white text-sm w-full sm:w-auto" />
          <input type="date" value={newRate.dueDate} onChange={e => setNewRate({ ...newRate, dueDate: e.target.value })} className="p-2 rounded bg-slate-700/50 border border-slate-600 text-white text-sm w-full sm:w-auto" />
          <button onClick={() => { if (newRate.amount && newRate.dueDate) { onAdd(newRate); setNewRate({ amount: '', dueDate: '', paid: false }); } }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm whitespace-nowrap">Aggiungi rata</button>
        </div>
      )}
    </div>
  );
};

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [checks, setChecks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [anamnesi, setAnamnesi] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showExtend, setShowExtend] = useState(false); // NUOVO
  const [zoomPhoto, setZoomPhoto] = useState({ open: false, url: '', alt: '' });
  const [rates, setRates] = useState([]);
  const [canEditRates, setCanEditRates] = useState(false);
  const [isRateizzato, setIsRateizzato] = useState(false);

  // Recupera ruolo utente da localStorage o sessione (adatta se hai un contesto globale)
  let userRole = null;
  try {
    userRole = JSON.parse(localStorage.getItem('user'))?.role || null;
  } catch {}
  const isAdmin = userRole === 'admin';
  const isCoach = userRole === 'coach';

  useEffect(() => {
    if (!clientId) {
      setError("ID cliente non valido.");
      setTimeout(() => navigate('/clients'), 3000);
      return;
    }

    const clientRef = doc(db, 'clients', clientId);
    const unsubClient = onSnapshot(clientRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setClient(data);
        updateStatoPercorso(clientId);
      } else {
        setError("Cliente non trovato.");
        setTimeout(() => navigate('/clients'), 3000);
      }
      setLoading(false);
    }, (err) => {
      setError("Errore caricamento.");
      setTimeout(() => navigate('/clients'), 3000);
      setLoading(false);
    });

    // === ANAMNESI COMPLETA CON FOTO RISOLTE ===
    const anamnesiRef = doc(db, 'clients', clientId, 'anamnesi', 'initial');
    const unsubAnamnesi = onSnapshot(anamnesiRef, async (docSnap) => {
      if (docSnap.exists()) {
        let data = docSnap.data();

        // RISOLVI FOTO
        if (data.photoURLs) {
          data.photoURLs = normalizePhotoURLs(data.photoURLs);
          console.debug('[ClientDetail] Anamnesi photoURLs normalized:', data.photoURLs);
        }

        setAnamnesi(data);
      } else {
        setAnamnesi(null);
      }
    });

    // === CHECKS CON FOTO RISOLTE ===
    const checksQuery = query(collection(db, 'clients', clientId, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
      const checksData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const resolvedChecks = checksData.map((check) => {
        if (check.photoURLs) {
          check.photoURLs = normalizePhotoURLs(check.photoURLs);
        }
        return check;
      });
      console.debug('[ClientDetail] Checks photoURLs normalized');
      setChecks(resolvedChecks);
    }, (error) => {
      console.error('Errore caricamento checks:', error);
    });

    // === PAGAMENTI ===
    const paymentsQuery = query(collection(db, 'clients', clientId, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubClient(); 
      unsubAnamnesi(); 
      unsubChecks(); 
      unsubPayments();
    };
  }, [clientId, navigate]);

  useEffect(() => {
    // Recupera le rate dal documento cliente
    if (client && client.rate) setRates(client.rate);
    // Recupera flag rateizzato
    if (client && typeof client.rateizzato === 'boolean') setIsRateizzato(client.rateizzato);
    // Permessi: admin/coach possono modificare
    setCanEditRates(isAdmin || isCoach);
  }, [client, isAdmin, isCoach]);

  const handleDelete = async () => {
    if (window.confirm(`Eliminare ${client?.name}?`)) {
      try {
        await deleteDoc(doc(db, 'clients', clientId));
        navigate('/clients');
      } catch (err) {
        alert("Errore eliminazione.");
      }
    }
  };

  const copyCredentialsToClipboard = () => {
    const text = `Ciao ${client.name},\n\nLink: https://MentalFitApp.github.io/PtPro/#/login\nEmail: ${client.email}\nPassword: ${client.tempPassword || 'Contatta admin'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRenewalSaved = () => {
    const clientRef = doc(db, 'clients', clientId);
    onSnapshot(clientRef, (snap) => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
    });
  };

  const handleEditSaved = () => {
    const clientRef = doc(db, 'clients', clientId);
    onSnapshot(clientRef, (snap) => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
    });
  };

  const handleExtendSaved = () => {
    const clientRef = doc(db, 'clients', clientId);
    onSnapshot(clientRef, (snap) => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
    });
  };

  const handleAddRate = async (rate) => {
    const newRates = [...rates, rate];
    setRates(newRates);
    await updateDoc(doc(db, 'clients', client.id), { rate: newRates });
  };
  const handleUpdateRate = async (idx, updatedRate) => {
    const newRates = rates.map((r, i) => i === idx ? { ...r, ...updatedRate } : r);
    setRates(newRates);
    await updateDoc(doc(db, 'clients', client.id), { rate: newRates });
  };
  const handleDeleteRate = async (idx) => {
    const newRates = rates.filter((_, i) => i !== idx);
    setRates(newRates);
    await updateDoc(doc(db, 'clients', client.id), { rate: newRates });
  };
  const handleRateizzatoChange = async (val) => {
    setIsRateizzato(val);
    await updateDoc(doc(db, 'clients', client.id), { rateizzato: val });
  };

  if (loading) return <div className="text-center text-slate-400 p-8">Caricamento...</div>;
  if (error) return <div className="text-center text-red-400 p-8">{error}</div>;
  if (!client) return null;

  const sectionStyle = "bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 shadow-lg border border-white/10";
  const headingStyle = "font-bold mb-4 text-lg text-cyan-300 border-b border-cyan-400/20 pb-2 flex items-center gap-2";

  return (
    <ErrorBoundary>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-5xl mx-auto p-4 sm:p-6">
        <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-slate-400 hover:text-rose-400 mb-6">
          <ArrowLeft size={18} /> Torna ai Clienti
        </button>

        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-slate-50">{client.name}</h1>
            <div className="flex flex-wrap gap-2">
              <QuickNotifyButton userId={clientId} userName={client.name} userType="client" />
              <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg">
                <Edit size={16} /> Modifica
              </button>
              <button onClick={() => setShowRenewal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg">
                <Plus size={16} /> Rinnovo
              </button>
              <button onClick={() => setShowExtend(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg">
                <CalendarDays size={16} /> Prolunga
              </button>
              <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg">
                <Trash2 size={16} /> Elimina
              </button>
            </div>
          </div>


          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
            {['info', 'check', 'payments', 'anamnesi'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
              >
                {tab === 'info' ? 'Informazioni' : tab === 'check' ? 'Check' : tab === 'payments' ? 'Pagamenti' : 'Anamnesi'}
              </button>
            ))}
          </div>

          {/* === CHECK === */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3"><User className="text-slate-400" size={18} /><p>Nome: <span className="font-semibold">{client.name}</span></p></div>
              <div className="flex items-center gap-3">
                <Mail className="text-slate-400" size={18} />
                <div className="flex items-center gap-2">
                  <p>Email: <span className="font-semibold">{client.email}</span></p>
                  <button onClick={copyCredentialsToClipboard} className="p-1 text-slate-400 hover:text-emerald-400">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3"><Phone className="text-slate-400" size={18} /><p>Telefono: <span className="font-semibold">{client.phone || 'N/D'}</span></p></div>
              <div className="flex items-center gap-3"><Calendar className="text-slate-400" size={18} /><p>Scadenza: <span className="font-semibold">{toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D'}</span></p></div>
              <div className="flex items-center gap-3"><DollarSign className="text-slate-400" size={18} /><p>Stato: <PathStatusBadge status={client.statoPercorso} /></p></div>
              {/* Casella rateizzazione solo visuale */}
              <div className="flex items-center gap-3 mt-2">
                <label className="font-semibold text-slate-200 text-sm">Rateizzato:</label>
                <span className={isRateizzato ? 'text-green-400' : 'text-red-400'}>{isRateizzato ? 'Sì' : 'No'}</span>
              </div>
            </div>
          )}
          {activeTab === 'check' && (
            <div className="space-y-4">
              {checks.length > 0 ? checks.map(check => (
                <div key={check.id} className="p-5 bg-slate-700/50 rounded-xl border border-slate-600">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                    <p className="text-sm font-medium text-slate-300">Data: {toDate(check.createdAt)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                    <p className="text-sm text-slate-300">Peso: <span className="font-semibold">{check.weight || 'N/D'} kg</span></p>
                  </div>
                  {check.notes && <p className="text-sm text-slate-400 mb-4 italic">"{check.notes}"</p>}
                  {check.photoURLs && Object.values(check.photoURLs).some(Boolean) && (
                    <div>
                      <p className="text-xs text-slate-400 mb-3">Foto:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(check.photoURLs).map(([type, url]) => url ? (
                          <button
                            key={type}
                            onClick={() => setZoomPhoto({ open: true, url, alt: type })}
                            className="relative group overflow-hidden rounded-xl"
                          >
                            <img src={url} alt={type} className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={28} />
                            </div>
                            <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-2 py-0.5 rounded">
                              {type}
                            </span>
                          </button>
                        ) : null)}
                      </div>
                    </div>
                  )}
                </div>
              )) : <p className="text-center text-slate-400 py-8">Nessun check.</p>}
            </div>
          )}

          {/* === PAGAMENTI === */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Tabella rate modificabile */}
              <div className="mb-6 p-4 bg-slate-900/60 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <label className="font-semibold text-slate-200 text-sm">Rateizzato:</label>
                  {(isAdmin || isCoach) ? (
                    <input type="checkbox" checked={isRateizzato} onChange={e => handleRateizzatoChange(e.target.checked)} />
                  ) : (
                    <span className={isRateizzato ? 'text-green-400' : 'text-red-400'}>{isRateizzato ? 'Sì' : 'No'}</span>
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <RateTable 
                      rates={rates} 
                      canEdit={true} 
                      onAdd={handleAddRate} 
                      onUpdate={handleUpdateRate} 
                      onDelete={handleDeleteRate} 
                    />
                  </div>
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <div className="text-sm text-slate-300">Totale rate pagate:</div>
                    <div className="text-lg font-bold text-emerald-400">
                      €{rates.filter(r => r.paid).reduce((sum, r) => sum + Number(r.amount || 0), 0)}
                    </div>
                    <div className="text-sm text-slate-300 mt-4">Totale da pagare:</div>
                    <div className="text-lg font-bold text-rose-400">
                      €{rates.reduce((sum, r) => sum + Number(r.amount || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Pagamenti legacy */}
              {payments.length > 0 ? payments.map(p => (
                <div key={p.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <p className="text-sm text-slate-400">Data: {toDate(p.paymentDate)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                  <p className="text-sm text-slate-200">Importo: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(p.amount || 0)}</p>
                  <p className="text-sm text-slate-200">Durata: {p.duration}</p>
                  <p className="text-sm text-slate-200">Metodo: {p.paymentMethod}</p>
                </div>
              )) : <p className="text-center text-slate-400">Nessun pagamento.</p>}
            </div>
          )}

          {/* === ANAMNESI COMPLETA === */}
          {activeTab === 'anamnesi' && (
            <div className="space-y-8">
              {anamnesi ? (
                <>
                  {/* DATI ANAGRAFICI */}
                  <div className={sectionStyle}>
                    <h4 className={headingStyle}><FileText size={16} /> Dati Anagrafici</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <AnamnesiField label="Nome" value={anamnesi.firstName} />
                      <AnamnesiField label="Cognome" value={anamnesi.lastName} />
                      <AnamnesiField label="Data di Nascita" value={anamnesi.birthDate} />
                      <AnamnesiField label="Lavoro" value={anamnesi.job} />
                      <AnamnesiField label="Peso (kg)" value={anamnesi.weight} />
                      <AnamnesiField label="Altezza (cm)" value={anamnesi.height} />
                    </div>
                  </div>

                  {/* ABITUDINI ALIMENTARI */}
                  <div className={sectionStyle}>
                    <h4 className={headingStyle}><FileText size={16} /> Abitudini Alimentari</h4>
                    <div className="space-y-4">
                      <AnamnesiField label="Pasti al giorno" value={anamnesi.mealsPerDay} />
                      <AnamnesiField label="Tipo Colazione" value={anamnesi.breakfastType} />
                      <AnamnesiField label="Alimenti preferiti" value={anamnesi.desiredFoods} />
                      <AnamnesiField label="Alimenti da evitare" value={anamnesi.dislikedFoods} />
                      <AnamnesiField label="Allergie/Intolleranze" value={anamnesi.intolerances} />
                      <AnamnesiField label="Problemi di digestione" value={anamnesi.digestionIssues} />
                    </div>
                  </div>

                  {/* ALLENAMENTO */}
                  <div className={sectionStyle}>
                    <h4 className={headingStyle}><FileText size={16} /> Allenamento</h4>
                    <div className="space-y-4">
                      <AnamnesiField label="Allenamenti a settimana" value={anamnesi.workoutsPerWeek} />
                      <AnamnesiField label="Dettagli Allenamento" value={anamnesi.trainingDetails} />
                      <AnamnesiField label="Orario e Durata" value={anamnesi.trainingTime} />
                    </div>
                  </div>

                  {/* SALUTE E OBIETTIVI */}
                  <div className={sectionStyle}>
                    <h4 className={headingStyle}><FileText size={16} /> Salute e Obiettivi</h4>
                    <div className="space-y-4">
                      <AnamnesiField label="Infortuni o problematiche" value={anamnesi.injuries} />
                      <AnamnesiField label="Farmaci" value={anamnesi.medications} />
                      <AnamnesiField label="Integratori" value={anamnesi.supplements} />
                      <AnamnesiField label="Obiettivo Principale" value={anamnesi.mainGoal} />
                      <AnamnesiField label="Durata Percorso" value={anamnesi.programDuration} />
                    </div>
                  </div>

                  {/* FOTO INIZIALI */}
                  <div className={sectionStyle}>
                    <h4 className={headingStyle}><FileText size={16} /> Foto Iniziali</h4>
                    <p className="text-sm text-slate-400 mb-6">Caricate dal cliente al momento dell'iscrizione.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {['front', 'right', 'left', 'back'].map(type => (
                        <div key={type} className="text-center">
                          <h4 className="text-sm font-semibold text-slate-400 capitalize mb-2">
                            {type === 'front' ? 'Frontale' : type === 'back' ? 'Posteriore' : `Laterale ${type === 'left' ? 'Sinistro' : 'Destro'}`}
                          </h4>
                          {anamnesi.photoURLs?.[type] ? (
                            <button
                              onClick={() => setZoomPhoto({ open: true, url: anamnesi.photoURLs[type], alt: type })}
                              className="relative group overflow-hidden rounded-xl w-full h-48"
                            >
                              <img 
                                src={anamnesi.photoURLs[type]} 
                                alt={type} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                                <ZoomIn className="text-white opacity-0 group-hover:opacity-100" size={32} />
                              </div>
                            </button>
                          ) : (
                            <div className="flex justify-center items-center w-full h-48 bg-white/5 backdrop-blur-md rounded-lg text-slate-500">
                              <span>Non caricata</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-400 py-8">Nessuna anamnesi compilata.</p>
              )}
            </div>
          )}

          {/* === RATE === */}
          {activeTab === 'rates' && (
            <div className="space-y-4">
              <RateTable 
                rates={rates} 
                canEdit={canEditRates} 
                onAdd={handleAddRate} 
                onUpdate={handleUpdateRate} 
                onDelete={handleDeleteRate} 
              />
            </div>
          )}
        </div>

        {/* MODALI */}
        <RenewalModal isOpen={showRenewal} onClose={() => setShowRenewal(false)} client={client} onSave={handleRenewalSaved} />
        <EditClientModal isOpen={showEdit} onClose={() => setShowEdit(false)} client={client} onSave={handleEditSaved} />
        <ExtendExpiryModal isOpen={showExtend} onClose={() => setShowExtend(false)} client={client} onSave={handleExtendSaved} />
        <PhotoZoomModal 
          isOpen={zoomPhoto.open} 
          onClose={() => setZoomPhoto({ open: false, url: '', alt: '' })} 
          imageUrl={zoomPhoto.url} 
          alt={zoomPhoto.alt} 
        />
      </motion.div>
    </ErrorBoundary>
  );
}