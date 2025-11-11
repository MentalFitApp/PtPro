import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, toDate, calcolaStatoPercorso, updateStatoPercorso } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { 
  UserPlus, FilePenLine, Trash2, Search, ArrowUp, ArrowDown, 
  CheckCircle, XCircle, Calendar, Clock, AlertCircle, LogOut, Download, FileText, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from 'papaparse';

// --- COMPONENTI UI ---
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
        <AlertCircle className={type === 'error' ? 'text-red-400' : 'text-emerald-400'} />
        <p>{message}</p>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/10">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const exportToCSV = (clients) => {
  const data = clients.map(client => ({
    Nome: client.name || 'N/D',
    Email: client.email || 'N/D',
    Telefono: client.phone || 'N/D',
    Scadenza: toDate(client.scadenza)?.toLocaleDateString('it-IT') || 'N/D',
    Stato: client.statoPercorso || calcolaStatoPercorso(client.scadenza),
    Pagamenti: client.payments ? client.payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0,
    'Data Inizio': toDate(client.startDate)?.toLocaleDateString('it-IT') || 'N/D',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'clienti.csv';
  link.click();
};

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

const AnamnesiBadge = ({ hasAnamnesi }) => (
  <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${hasAnamnesi ? 'bg-green-900/80 text-green-300 border border-green-500/30' : 'bg-gray-700/80 text-gray-300 border border-gray-500/30'}`}>
    <FileText size={12} /> {hasAnamnesi ? 'Inviata' : 'Non Inviata'}
  </span>
);

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
            <AlertCircle className="h-6 w-6 text-red-400" />
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

const FilterButton = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-sm rounded-md flex items-center gap-1 transition-colors ${
      active 
        ? 'bg-rose-600 text-white' 
        : 'text-slate-400 hover:bg-white/10'
    }`}
  >
    {icon} {label}
  </button>
);

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [anamnesiStatus, setAnamnesiStatus] = useState({});
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 6000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      showNotification(`Errore logout: ${error.message}`, 'error');
    }
  };

  // --- CARICA CLIENTI + ANAMNESI ---
  useEffect(() => {
    const role = sessionStorage.getItem('app_role');
    if (role !== 'admin') {
      signOut(auth).then(() => navigate('/login'));
      return;
    }

    const q = collection(db, "clients");
    const unsub = onSnapshot(q, async (snap) => {
      try {
        const clientList = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id, // GARANTITO
            name: data.name,
            email: data.email,
            phone: data.phone,
            scadenza: data.scadenza,
            startDate: data.startDate,
            statoPercorso: data.statoPercorso || calcolaStatoPercorso(data.scadenza),
            payments: data.payments || []
          };
        });

        console.log('Clienti caricati:', clientList); // DEBUG

        const anamnesiPromises = clientList.map(client => 
          getDoc(doc(db, `clients/${client.id}/anamnesi`, 'initial')).catch(() => ({ exists: () => false }))
        );
        const anamnesiResults = await Promise.all(anamnesiPromises);
        const anamnesiStatusTemp = {};
        clientList.forEach((client, i) => {
          anamnesiStatusTemp[client.id] = anamnesiResults[i].exists();
        });
        setAnamnesiStatus(anamnesiStatusTemp);

        clientList.forEach(client => updateStatoPercorso(client.id));
        setClients(clientList);
        setLoading(false);
      } catch (error) {
        showNotification("Errore caricamento clienti", 'error');
        setLoading(false);
      }
    }, (error) => {
      showNotification("Errore connessione", 'error');
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteDoc(doc(db, 'clients', clientToDelete.id));
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      showNotification('Cliente eliminato!', 'success');
    } catch (error) {
      showNotification(`Errore: ${error.message}`, 'error');
    } finally {
      setClientToDelete(null);
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />;
  };

  // --- Filtri e ordinamento ---
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter(client => {
      const matchesSearch = 
        (client.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const now = new Date();
      const expiry = toDate(client.scadenza);
      const daysToExpiry = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

      switch (filter) {
        case 'active':
          return expiry && expiry > now;
        case 'expiring':
          return expiry && daysToExpiry <= 15 && daysToExpiry > 0;
        case 'expired':
          return expiry && expiry < now;
        case 'no-check':
          return !anamnesiStatus[client.id];
        case 'has-check':
          return anamnesiStatus[client.id];
        default:
          return true;
      }
    });

    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'startDate':
          aVal = toDate(a.startDate) || new Date(0);
          bVal = toDate(b.startDate) || new Date(0);
          break;
        case 'expiry':
          aVal = toDate(a.scadenza) || new Date(0);
          bVal = toDate(b.scadenza) || new Date(0);
          break;
        case 'lastCheck':
          aVal = anamnesiStatus[a.id] ? 1 : 0;
          bVal = anamnesiStatus[b.id] ? 1 : 0;
          break;
        default:
          aVal = 0; bVal = 0;
      }

      if (aVal < bVal) return sortDirection === 'desc' ? 1 : -1;
      if (aVal > bVal) return sortDirection === 'desc' ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [clients, searchQuery, filter, sortField, sortDirection, anamnesiStatus]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
      <ConfirmationModal isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} onConfirm={handleDelete} clientName={clientToDelete?.name} />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-slate-50">Gestione Clienti</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-2 pl-10 w-full md:w-64 outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Cerca per nome o email..."
              />
            </div>
            <button onClick={() => navigate("/new-client")} className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors">
              <UserPlus size={16} /> Nuovo
            </button>
            <button onClick={() => exportToCSV(clients)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors">
              <Download size={16} /> Esporta CSV
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Filtri */}
        <div className="flex flex-wrap gap-2 p-2 bg-zinc-900/70 border border-white/10 rounded-lg">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Tutti" />
          <FilterButton active={filter === 'active'} onClick={() => setFilter('active')} label="Attivi" icon={<CheckCircle className="text-emerald-500" size={14} />} />
          <FilterButton active={filter === 'expiring'} onClick={() => setFilter('expiring')} label="In Scadenza" icon={<Clock className="text-amber-500" size={14} />} />
          <FilterButton active={filter === 'expired'} onClick={() => setFilter('expired')} label="Scaduti" icon={<AlertCircle className="text-red-500" size={14} />} />
          <FilterButton active={filter === 'has-check'} onClick={() => setFilter('has-check')} label="Con Anamnesi" icon={<CheckCircle className="text-cyan-500" size={14} />} />
          <FilterButton active={filter === 'no-check'} onClick={() => setFilter('no-check')} label="Senza Anamnesi" icon={<XCircle className="text-gray-500" size={14} />} />
        </div>

        {/* Tabella */}
        <div className="bg-zinc-950/60 backdrop-blur-xl rounded-2xl gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left text-slate-300">
              <thead className="bg-white/5 text-slate-400 uppercase text-xs sticky top-0 z-10">
                <tr>
                  <th className="p-4 cursor-pointer hover:text-rose-400 flex items-center gap-1 min-w-[180px]" onClick={() => toggleSort('name')}>
                    Nome {getSortIcon('name')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-rose-400 flex items-center gap-1 min-w-[140px]" onClick={() => toggleSort('startDate')}>
                    Inizio {getSortIcon('startDate')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-rose-400 flex items-center gap-1 min-w-[160px]" onClick={() => toggleSort('expiry')}>
                    Scadenza {getSortIcon('expiry')}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-rose-400 flex items-center gap-1 min-w-[160px]" onClick={() => toggleSort('lastCheck')}>
                    Anamnesi {getSortIcon('lastCheck')}
                  </th>
                  <th className="p-4 text-right min-w-[120px]">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedClients.map((c) => {
                  const expiry = toDate(c.scadenza);
                  const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <tr key={c.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium min-w-[180px]">
                        {c.id ? (
                          <button
                            onClick={() => {
                              console.log('Navigazione a cliente:', c.id);
                              navigate(`/client/${c.id}`);
                            }}
                            className="hover:underline hover:text-rose-400"
                          >
                            {c.name || "-"}
                          </button>
                        ) : (
                          <span className="text-red-400">ID mancante</span>
                        )}
                      </td>
                      <td className="p-4 min-w-[140px]">
                        {toDate(c.startDate)?.toLocaleDateString('it-IT') || 'N/D'}
                      </td>
                      <td className="p-4 min-w-[160px]">
                        {expiry ? (
                          <div className="flex items-center gap-2">
                            <span>{expiry.toLocaleDateString('it-IT')}</span>
                            {daysToExpiry !== null && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                daysToExpiry < 0 ? 'bg-red-900/80 text-red-300' :
                                daysToExpiry <= 7 ? 'bg-amber-900/80 text-amber-300' :
                                'bg-emerald-900/80 text-emerald-300'
                              }`}>
                                {daysToExpiry < 0 ? 'Scaduto' : `${daysToExpiry} gg`}
                              </span>
                            )}
                          </div>
                        ) : 'N/D'}
                      </td>
                      <td className="p-4 min-w-[160px]">
                        <AnamnesiBadge hasAnamnesi={anamnesiStatus[c.id]} />
                      </td>
                      <td className="p-4 text-right min-w-[120px]">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => navigate(`/edit/${c.id}`)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded-md" title="Modifica"><FilePenLine size={16}/></button>
                          <button onClick={() => setClientToDelete(c)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-md" title="Elimina"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAndSortedClients.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-slate-400">
                      Nessun cliente trovato con i filtri selezionati.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}