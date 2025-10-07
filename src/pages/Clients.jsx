import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
// --- 1. NUOVE ICONE DA LUCIDE-REACT ---
import { UserPlus, FilePenLine, Trash2, Search, ChevronDown, ChevronUp, Filter, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Funzioni di utilità (invariate)
function toDate(x) {
  if (!x) return null;
  if (typeof x?.toDate === "function") return x.toDate();
  const d = new Date(x);
  return isNaN(d) ? null : d;
}

const getPaymentStatus = (scadenza) => {
  const expiryDate = toDate(scadenza);
  if (!expiryDate) return 'na';
  const now = new Date();
  const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 15) return 'expiring';
  return 'paid';
};

// Componente Badge con stili aggiornati
const PaymentStatusBadge = ({ status }) => {
  const styles = {
    paid: "bg-emerald-900/80 text-emerald-300 border border-emerald-500/30",
    expiring: "bg-amber-900/80 text-amber-300 border border-amber-500/30",
    expired: "bg-red-900/80 text-red-400 border border-red-500/30",
    na: "bg-zinc-700/80 text-zinc-300 border border-zinc-500/30",
  };
  const labels = { paid: 'Pagato', expiring: 'In Scadenza', expired: 'Scaduto', na: 'N/D' };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{labels[status]}</span>;
};

// --- 2. MODAL DI CONFERMA PERSONALIZZATO ---
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

export default function Clients() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState(null); // Stato per il modal

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  
  // Logica di fetching e filtering (invariata, ma ho sistemato i nomi delle chiavi per coerenza)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    if (filter && ['paid', 'expiring', 'expired'].includes(filter)) setStatusFilter(filter);
  }, [location.search]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteDoc(doc(db, "clients", clientToDelete.id));
      setClientToDelete(null); // Chiudi il modal dopo l'eliminazione
    } catch (error) {
      console.error("Errore delete:", error);
    }
  };

  const filteredClients = useMemo(() => {
    let filtered = clients.filter(c => statusFilter === 'all' || getPaymentStatus(c.scadenza) === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(c =>
        (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => {
      const valA = sortKey === 'name' ? (a.name || '').toLowerCase() : toDate(a[sortKey])?.getTime() || 0;
      const valB = sortKey === 'name' ? (b.name || '').toLowerCase() : toDate(b[sortKey])?.getTime() || 0;
      if (valA === valB) return 0;
      return sortDir === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
    return filtered;
  }, [clients, query, statusFilter, sortKey, sortDir]);

  const clientCounts = useMemo(() => ({
      all: clients.length,
      paid: clients.filter(c => getPaymentStatus(c.scadenza) === 'paid').length,
      expiring: clients.filter(c => getPaymentStatus(c.scadenza) === 'expiring').length,
      expired: clients.filter(c => getPaymentStatus(c.scadenza) === 'expired').length,
  }), [clients]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "scadenza" || key === "createdAt" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ col }) => sortKey === col ? (sortDir === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />) : null;
  const FilterButton = ({ status, label, count }) => (
    <button onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 text-sm rounded-md transition ${statusFilter === status ? 'bg-rose-600 text-white font-semibold' : 'bg-zinc-800 hover:bg-zinc-700 text-slate-300'}`}>
        {label} <span className="text-xs opacity-60">{count}</span>
    </button>
  );

  return (
    <>
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
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    className="bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-2 pl-10 w-full md:w-64 outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Cerca per nome o email..."
                />
            </div>
            <button onClick={() => navigate("/new")} className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors">
                <UserPlus size={16} /> Nuovo
            </button>
          </div>
        </motion.div>
        
        <motion.div variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="flex items-center gap-2 mb-4 p-2 bg-zinc-900/70 border border-white/10 rounded-lg">
          <Filter className="text-slate-400 ml-1" size={16}/>
          <FilterButton status="all" label="Tutti" count={clientCounts.all} />
          <FilterButton status="paid" label="Pagato" count={clientCounts.paid} />
          <FilterButton status="expiring" label="In Scadenza" count={clientCounts.expiring} />
          <FilterButton status="expired" label="Scaduto" count={clientCounts.expired} />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-white/5 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort("name")}>Nome <SortIcon col="name" /></th>
                  <th className="p-4">Stato Pagamento</th>
                  <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort("scadenza")}>Scadenza <SortIcon col="scadenza" /></th>
                  <th className="p-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium"><button className="hover:underline hover:text-rose-400" onClick={() => navigate(`/client/${c.id}`)}>{c.name || "-"}</button></td>
                    <td className="p-4"><PaymentStatusBadge status={getPaymentStatus(c.scadenza)} /></td>
                    <td className="p-4">{toDate(c.scadenza) ? toDate(c.scadenza).toLocaleDateString('it-IT') : "-"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => navigate(`/edit/${c.id}`)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded-md transition-colors" title="Modifica"><FilePenLine size={16}/></button>
                        <button onClick={() => setClientToDelete(c)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors" title="Elimina"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && <tr><td colSpan="4" className="text-center p-8 text-slate-400">Caricamento clienti...</td></tr>}
                {!loading && filteredClients.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-slate-400">Nessun cliente trovato.</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
