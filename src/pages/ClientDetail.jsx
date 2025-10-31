import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage, toDate, calcolaStatoPercorso, updateStatoPercorso } from '../firebase';
import { User, Mail, Phone, Calendar, FileText, DollarSign, Trash2, Edit, ArrowLeft, Copy, Check, AlertCircle, X, Plus, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    na: "bg-zinc-700/80 text-zinc-300 border border-zinc-500/30",
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
      // Usa la scadenza attuale del cliente
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
      await setDoc(clientRef, {
        scadenza: expiry,
        payments: [...(client.payments || []), payment]
      }, { merge: true });

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
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-950/80 rounded-2xl border border-white/10 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Rinnovo {client.name}</h3>
          <button onClick={onClose} className="text-white hover:text-rose-400">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Mesi di rinnovo</label>
            <select value={months} onChange={e => setMonths(parseInt(e.target.value))} className="w-full p-2 bg-zinc-900/70 border border-white/10 rounded-lg text-white">
              <option value={1}>1 mese</option>
              <option value={3}>3 mesi</option>
              <option value={6}>6 mesi</option>
              <option value={12}>12 mesi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Oppure data scadenza manuale</label>
            <input type="date" value={manualExpiry} onChange={e => setManualExpiry(e.target.value)} className="w-full p-2 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Importo</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="es. 150" className="w-full p-2 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Metodo pagamento</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-2 bg-zinc-900/70 border border-white/10 rounded-lg text-white">
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
                className="w-full mt-2 p-2 bg-zinc-900/70 border border-white/10 rounded-lg text-white" 
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
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-950/80 rounded-2xl border border-white/10 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Modifica {client.name}</h3>
          <button onClick={onClose} className="text-white hover:text-rose-400">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="w-full p-2 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full p-2 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefono" className="w-full p-2 bg-zinc-900/70 border border-white/10 rounded-lg text-white" />
          <button onClick={handleSave} className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold">
            Salva Modifiche
          </button>
        </div>
      </motion.div>
    </motion.div>
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
  const [zoomPhoto, setZoomPhoto] = useState({ open: false, url: '', alt: '' });

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

    const anamnesiRef = doc(db, 'clients', clientId, 'anamnesi', 'initial');
    const unsubAnamnesi = onSnapshot(anamnesiRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.photoURLs) {
          const resolved = {};
          for (const [key, path] of Object.entries(data.photoURLs)) {
            if (path && typeof path === 'string' && !path.startsWith('http')) {
              try {
                resolved[key] = await getDownloadURL(ref(storage, path));
              } catch (e) {
                resolved[key] = null;
              }
            } else {
              resolved[key] = path;
            }
          }
          data.photoURLs = resolved;
        }
        setAnamnesi(data);
      } else {
        setAnamnesi(null);
      }
    });

    const checksQuery = query(collection(db, 'clients', clientId, 'checks'), orderBy('createdAt', 'desc'));
    const unsubChecks = onSnapshot(checksQuery, async (snap) => {
      const checksData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const resolvedChecks = await Promise.all(checksData.map(async (check) => {
        if (check.photoURLs) {
          const resolved = {};
          for (const [key, path] of Object.entries(check.photoURLs)) {
            if (path && typeof path === 'string' && !path.startsWith('http')) {
              try {
                resolved[key] = await getDownloadURL(ref(storage, path));
              } catch (e) {
                resolved[key] = null;
              }
            } else {
              resolved[key] = path;
            }
          }
          check.photoURLs = resolved;
        }
        return check;
      }));
      setChecks(resolvedChecks);
    });

    const paymentsQuery = query(collection(db, 'clients', clientId, 'payments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubClient(); unsubAnamnesi(); unsubChecks(); unsubPayments();
    };
  }, [clientId, navigate]);

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
    const text = `Ciao ${client.name},\n\nLink: https://MentalFitApp.github.io/PtPro/#/client-login\nEmail: ${client.email}\nPassword: ${client.tempPassword || 'Contatta admin'}`;
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

  if (loading) return <div className="text-center text-slate-400 p-8">Caricamento...</div>;
  if (error) return <div className="text-center text-red-400 p-8">{error}</div>;
  if (!client) return null;

  return (
    <ErrorBoundary>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-5xl mx-auto p-4 sm:p-6">
        <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-slate-400 hover:text-rose-400 mb-6">
          <ArrowLeft size={18} /> Torna ai Clienti
        </button>

        <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-slate-50">{client.name}</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg"
              >
                <Edit size={16} /> Modifica
              </button>
              <button
                onClick={() => setShowRenewal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg"
              >
                <Plus size={16} /> Rinnovo
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
              >
                <Trash2 size={16} /> Elimina
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 bg-zinc-900/70 p-1 rounded-lg border border-white/10">
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

          {/* Contenuto */}
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
            </div>
          )}

          {activeTab === 'check' && (
            <div className="space-y-6">
              {checks.length > 0 ? checks.map(check => (
                <div key={check.id} className="p-5 bg-zinc-900/70 rounded-xl border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                    <p className="text-sm font-medium text-slate-300">Data: {toDate(check.createdAt)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                    <p className="text-sm text-slate-300">Peso: <span className="font-semibold">{check.weight || 'N/D'} kg</span></p>
                  </div>
                  {check.notes && <p className="text-sm text-slate-400 mb-4 italic">"{check.notes}"</p>}
                  
                  {check.photoURLs && Object.keys(check.photoURLs).length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-3">Foto:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(check.photoURLs).map(([type, url]) => url ? (
                          <button
                            key={type}
                            onClick={() => setZoomPhoto({ open: true, url, alt: type })}
                            className="relative group overflow-hidden rounded-xl"
                          >
                            <img 
                              src={url} 
                              alt={type} 
                              className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-110" 
                            />
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

          {activeTab === 'payments' && (
            <div className="space-y-4">
              {payments.length > 0 ? payments.map(p => (
                <div key={p.id} className="p-4 bg-zinc-900/70 rounded-lg border border-white/10">
                  <p className="text-sm text-slate-400">Data: {toDate(p.paymentDate)?.toLocaleDateString('it-IT') || 'N/D'}</p>
                  <p className="text-sm text-slate-200">Importo: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(p.amount || 0)}</p>
                  <p className="text-sm text-slate-200">Durata: {p.duration}</p>
                  <p className="text-sm text-slate-200">Metodo: {p.paymentMethod}</p>
                </div>
              )) : <p className="text-center text-slate-400">Nessun pagamento.</p>}
            </div>
          )}

          {activeTab === 'anamnesi' && (
            <div className="space-y-4">
              {anamnesi ? (
                <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border p-5">
                  <h4 className="font-bold text-lg text-cyan-300 border-b border-cyan-400/20 pb-2 mb-4">Anamnesi</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                    <div><span className="text-slate-400">Nome:</span> <span className="text-slate-200">{anamnesi.firstName}</span></div>
                    <div><span className="text-slate-400">Cognome:</span> <span className="text-slate-200">{anamnesi.lastName}</span></div>
                    <div><span className="text-slate-400">Peso:</span> <span className="text-slate-200">{anamnesi.weight} kg</span></div>
                    <div><span className="text-slate-400">Obiettivo:</span> <span className="text-slate-200">{anamnesi.mainGoal}</span></div>
                  </div>
                  
                  {anamnesi.photoURLs && Object.keys(anamnesi.photoURLs).length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-3">Foto:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(anamnesi.photoURLs).map(([type, url]) => url ? (
                          <button
                            key={type}
                            onClick={() => setZoomPhoto({ open: true, url, alt: type })}
                            className="relative group overflow-hidden rounded-xl"
                          >
                            <img 
                              src={url} 
                              alt={type} 
                              className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-110" 
                            />
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
              ) : <p className="text-center text-slate-400">Nessuna anamnesi.</p>}
            </div>
          )}
        </div>
      </motion.div>

      {/* MODALI */}
      <RenewalModal isOpen={showRenewal} onClose={() => setShowRenewal(false)} client={client} onSave={handleRenewalSaved} />
      <EditClientModal isOpen={showEdit} onClose={() => setShowEdit(false)} client={client} onSave={handleEditSaved} />
      <PhotoZoomModal 
        isOpen={zoomPhoto.open} 
        onClose={() => setZoomPhoto({ open: false, url: '', alt: '' })} 
        imageUrl={zoomPhoto.url} 
        alt={zoomPhoto.alt} 
      />
    </ErrorBoundary>
  );
}