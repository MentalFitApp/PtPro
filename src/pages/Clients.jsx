import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth, toDate, calcolaStatoPercorso, updateStatoPercorso } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { UserPlus, FilePenLine, Trash2, Search, ChevronDown, ChevronUp, Filter, AlertTriangle, LogOut, Download, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from 'papaparse';

// --- COMPONENTI UI RIUTILIZZABILI ---
const Notification = ({ message, type, onDismiss }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg border ${
          type === 'error' ? 'bg-red-900/80 text-red-300 border-red-500/30' : 'bg-emerald-900/80 text-emerald-300 border-emerald-500/30'
        } backdrop-blur-md shadow-lg`}
      >
        <AlertTriangle className={type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
        <p>{message}</p>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/10">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// Funzione per esportare in CSV
const exportToCSV = (clients) => {
  const data = clients.map(client => ({
    Nome: client.name || 'N/D',
    Email: client.email || 'N/D',
    Telefono: client.phone || 'N/D',
    Scadenza: toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D',
    Stato: client.statoPercorso || calcolaStatoPercorso(client.scadenza),
    Pagamenti: client.payments ? client.payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0,
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'clienti.csv';
  link.click();
};

// Componente Badge
const PathStatusBadge = ({ status }) => {
  const styles = {
    attivo: "bg-emerald-900/80 text-emerald-300 border border-emerald-500/30",
    rinnovato: "bg-amber-900/80 text-amber-300 border border-amber-500/30",
    non_rinnovato: "bg-red-900/80 text-red-400 border border-red-500/30",
    na: "bg-zinc-700/80 text-zinc-300 border border-zinc-500/30",
  };
  const labels = { attivo: 'Attivo', rinnovato: 'In Scadenza', non_rinnovato: 'Scaduto', na: 'N/D' };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{labels[status]}</span>;
};

// Componente AnamnesiBadge
const AnamnesiBadge = ({ hasAnamnesi }) => (
  <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${hasAnamnesi ? 'bg-green-900/80 text-green-300 border border-green-500/30' : 'bg-gray-700/80 text-gray-300 border border-gray-500/30'}`}>
    <FileText size={12} /> {hasAnamnesi ? 'Inviata' : 'Non Inviata'}
  </span>
);

// Modal di conferma
const ConfirmationModal = ({ isOpen, onClose, onConfirm, clientName }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-zinc-950/80 rounded-2xl gradient-border p-6 text-center shadow-2xl shadow-black/40"
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-50">Conferma Eliminazione</h3>
          <p className="text-sm text-slate-400 mt-2">
            Sei sicuro di voler eliminare il cliente <strong className="text-red-400">{clientName}</strong>? L'operazione è irreversibile.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={onClose} className="px-6 py-2 text-sm font-semibold text-slate-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
              Annulla
            </button>
            <button onClick={onConfirm} className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
              Elimina
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Componente FilterButton
const FilterButton = ({ status, label, count }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = new URLSearchParams(location.search).get('filter') === status || (status === 'all' && !new URLSearchParams(location.search).get('filter'));

  return (
    <button
      onClick={() => navigate(status === 'all' ? '/clients' : `/clients?filter=${status}`)}
      className={`px-3 py-1 text-sm rounded-md transition-colors ${isActive ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
    >
      {label} ({count})
    </button>
  );
};

// Componente SortIcon
const SortIcon = ({ col, sortKey, sortDir }) => {
  return sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={14} className="inline" /> : <ChevronDown size={14} className="inline" />) : null;
};

export default function Clients() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(new URLSearchParams(location.search).get('filter') || "all");
  const [dateFilter, setDateFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [anamnesiStatus, setAnamnesiStatus] = useState({});
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [sortKey, setSortKey] = useState("createdAt"); // Assicuriamo che sortKey sia sempre definito
  const [sortDir, setSortDir] = useState("desc");

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      showNotification(`Errore durante il logout: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    console.log('Utente autenticato:', auth.currentUser?.uid, 'Email:', auth.currentUser?.email);
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin' && role !== 'coach') {
      console.warn('Accesso non autorizzato a Clients, redirect');
      signOut(auth).then(() => {
        navigate('/login');
      }).catch(err => {
        console.error('Errore durante il logout:', err);
        showNotification(`Errore durante il logout: ${err.message}`, 'error');
      });
      return;
    }

    const unsub = onSnapshot(collection(db, "clients"), async (snap) => {
      try {
        const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Clienti recuperati da Firestore:', clientList);

        // Verifica stato anamnesi per ogni cliente
        const anamnesiStatusTemp = {};
        for (const client of clientList) {
          try {
            const anamnesiRef = doc(db, `clients/${client.id}/anamnesi`, 'initial');
            const anamnesiDoc = await getDoc(anamnesiRef);
            anamnesiStatusTemp[client.id] = anamnesiDoc.exists();
          } catch (err) {
            console.error(`Errore nel recupero anamnesi per cliente ${client.id}:`, err);
            if (err.code === 'permission-denied') {
              showNotification("Permessi insufficienti per accedere ai dati dell'anamnesi.", 'error');
            }
            anamnesiStatusTemp[client.id] = false;
          }
        }
        setAnamnesiStatus(anamnesiStatusTemp);

        // Aggiorna stato percorso e imposta lista clienti
        clientList.forEach(client => updateStatoPercorso(client.id));
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        console.error("Errore nel recupero dei clienti:", error);
        if (error.code === 'permission-denied') {
          showNotification("Permessi insufficienti per accedere ai dati dei clienti.", 'error');
          navigate('/login');
        }
        setLoading(false);
      }
    }, (error) => {
      console.error("Errore snapshot clienti:", error);
      if (error.code === 'permission-denied') {
        showNotification("Permessi insufficienti per accedere ai dati dei clienti.", 'error');
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteDoc(doc(db, 'clients', clientToDelete.id));
      showNotification('Cliente eliminato con successo!', 'success');
    } catch (error) {
      console.error("Errore nell'eliminazione del cliente:", error);
      showNotification(`Errore nell'eliminazione del cliente: ${error.message}`, 'error');
    } finally {
      setClientToDelete(null);
    }
  };

  const toggleSort = (key) => {
    if (!key) return; // Protezione contro key undefined
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredClients = useMemo(() => {
    console.log('Calcolo filteredClients con:', { query, statusFilter, dateFilter, paymentFilter, sortKey, sortDir });
    let result = [...clients];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(c => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c.statoPercorso === statusFilter);
    }
    if (dateFilter) {
      const date = new Date(dateFilter);
      if (!isNaN(date)) {
        result = result.filter(c => toDate(c.createdAt)?.toDateString() === date.toDateString());
      } else {
        showNotification('Data non valida.', 'error');
      }
    }
    if (paymentFilter) {
      const paymentValue = parseFloat(paymentFilter);
      if (!isNaN(paymentValue) && paymentValue >= 0) {
        result = result.filter(c => {
          const totalPayments = c.payments ? c.payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;
          return totalPayments < paymentValue;
        });
      } else {
        showNotification('Valore di pagamento non valido.', 'error');
      }
    }
    return result.sort((a, b) => {
      if (!sortKey) return 0; // Protezione contro sortKey undefined
      const aVal = a[sortKey] || '';
      const bVal = b[sortKey] || '';
      if (sortKey === 'scadenza' || sortKey === 'createdAt') {
        const aDate = toDate(aVal) || new Date(0);
        const bDate = toDate(bVal) || new Date(0);
        return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return sortDir === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    });
  }, [clients, query, statusFilter, dateFilter, paymentFilter, sortKey, sortDir]);

  const clientCounts = useMemo(() => ({
    all: clients.length,
    attivo: clients.filter(c => c.statoPercorso === 'attivo').length,
    rinnovato: clients.filter(c => c.statoPercorso === 'rinnovato').length,
    non_rinnovato: clients.filter(c => c.statoPercorso === 'non_rinnovato').length,
  }), [clients]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDelete}
        clientName={clientToDelete?.name}
      />
      <motion.div 
        className="w-full"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-slate-50">Gestione Clienti</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                className="bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-2 pl-10 w-full md:w-64 outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Cerca per nome o email..."
              />
            </div>
            <button onClick={() => navigate("/new")} className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors">
              <UserPlus size={16} /> Nuovo
            </button>
            <button onClick={() => exportToCSV(clients)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors">
              <Download size={16} /> Esporta CSV
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </motion.div>
        
        <motion.div variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-zinc-900/70 border border-white/10 rounded-lg">
          <Filter className="text-slate-400 ml-1" size={16}/>
          <FilterButton status="all" label="Tutti" count={clientCounts.all} />
          <FilterButton status="attivo" label="Attivo" count={clientCounts.attivo} />
          <FilterButton status="rinnovato" label="In Scadenza" count={clientCounts.rinnovato} />
          <FilterButton status="non_rinnovato" label="Scaduto" count={clientCounts.non_rinnovato} />
          <div className="relative w-full sm:w-40">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  const date = new Date(value);
                  const today = new Date();
                  if (date > today) {
                    showNotification('La data di filtro non può essere futura.', 'error');
                    return;
                  }
                }
                setDateFilter(value);
              }}
              className="bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="relative w-full sm:w-40">
            <input
              type="number"
              placeholder="Pagamenti <"
              value={paymentFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value && (isNaN(value) || parseFloat(value) < 0)) {
                  showNotification('Inserisci un valore di pagamento valido.', 'error');
                  return;
                }
                setPaymentFilter(value);
              }}
              className="bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-white/5 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort("name")}>Nome <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} /></th>
                  <th className="p-4">Stato Percorso</th>
                  <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort("scadenza")}>Scadenza <SortIcon col="scadenza" sortKey={sortKey} sortDir={sortDir} /></th>
                  <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>Data Iscrizione <SortIcon col="createdAt" sortKey={sortKey} sortDir={sortDir} /></th>
                  <th className="p-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">
                      <button
                        className="hover:underline hover:text-rose-400"
                        onClick={() => {
                          console.log('Navigazione a /client/', c.id);
                          navigate(`/client/${c.id}`);
                        }}
                      >
                        {c.name || "-"}
                      </button>
                    </td>
                    <td className="p-4 flex gap-2 items-center">
                      <PathStatusBadge status={c.statoPercorso || calcolaStatoPercorso(c.scadenza)} />
                      <AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]} />
                    </td>
                    <td className="p-4">{toDate(c.scadenza)?.toLocaleDateString('it-IT') || "-"}</td>
                    <td className="p-4">{toDate(c.createdAt)?.toLocaleDateString('it-IT') || "-"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => navigate(`/edit/${c.id}`)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded-md" title="Modifica"><FilePenLine size={16}/></button>
                        <button onClick={() => setClientToDelete(c)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-md" title="Elimina"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && <tr><td colSpan="5" className="text-center p-8 text-slate-400">Caricamento clienti...</td></tr>}
                {!loading && filteredClients.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-slate-400">Nessun cliente trovato.</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}