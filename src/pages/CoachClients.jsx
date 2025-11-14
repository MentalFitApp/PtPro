import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, getDocs, limit } from 'firebase/firestore';
import { db, toDate, auth } from '../firebase';
import { 
  Users, Search, LogOut, CheckCircle, XCircle, 
  Calendar, Clock, AlertCircle, ArrowUp, ArrowDown 
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function CoachClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    // RIMOSSO il filtro per assignedCoaches: ora carica tutti i clienti
    const q = query(collection(db, 'clients'));

    const unsub = onSnapshot(q, async (snap) => {
      const clientList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // recupere ultimo check per ciascun cliente (in parallelo)
      const checkPromises = clientList.map(async (client) => {
        const checksQuery = query(
          collection(db, 'clients', client.id, 'checks'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const checkSnap = await getDocs(checksQuery);
        const lastCheck = checkSnap.docs[0]?.data()?.createdAt || null;
        return { ...client, lastCheckDate: lastCheck };
      });
      const enriched = await Promise.all(checkPromises);
      setClients(enriched);
      setLoading(false);
    }, (err) => {
      console.error('Errore snapshot:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

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
          return !client.lastCheckDate;
        case 'has-check':
          return !!client.lastCheckDate;
        default:
          return true; // TUTTI
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
          aVal = toDate(a.lastCheckDate) || new Date(0);
          bVal = toDate(b.lastCheckDate) || new Date(0);
          break;
        default:
          aVal = 0; bVal = 0;
      }
      if (aVal < bVal) return sortDirection === 'desc' ? 1 : -1;
      if (aVal > bVal) return sortDirection === 'desc' ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [clients, searchQuery, filter, sortField, sortDirection]);

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/login'));
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-2 mb-4 sm:mb-0">
          <Users size={28} /> Gestione Clienti
        </h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/70 border border-white/10 rounded-lg px-3 py-2 pl-10 w-full outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Cerca nome o email..."
            />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Filtri */}
      <div className="mb-6 flex flex-wrap gap-2 p-2 bg-zinc-900/70 border border-white/10 rounded-lg">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Tutti" />
        <FilterButton active={filter === 'active'} onClick={() => setFilter('active')} label="Attivi" icon={<CheckCircle className="text-emerald-500" size={14} />} />
        <FilterButton active={filter === 'expiring'} onClick={() => setFilter('expiring')} label="In Scadenza" icon={<Clock className="text-amber-500" size={14} />} />
        <FilterButton active={filter === 'expired'} onClick={() => setFilter('expired')} label="Scaduti" icon={<AlertCircle className="text-red-500" size={14} />} />
        <FilterButton active={filter === 'has-check'} onClick={() => setFilter('has-check')} label="Con Check" icon={<CheckCircle className="text-cyan-500" size={14} />} />
        <FilterButton active={filter === 'no-check'} onClick={() => setFilter('no-check')} label="Senza Check" icon={<XCircle className="text-gray-500" size={14} />} />
      </div>

      {/* Tabella con scroll orizzontale */}
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
                  Ultimo Check {getSortIcon('lastCheck')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedClients.map((client) => {
                const lastCheck = toDate(client.lastCheckDate);
                const start = toDate(client.startDate);
                const expiry = toDate(client.scadenza);
                const daysToExpiry = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <tr key={client.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium min-w-[180px]">
                      <button
                        onClick={() => navigate(`/coach/client/${client.id}`)}
                        className="hover:underline hover:text-rose-400"
                      >
                        {client.name || '-'}
                      </button>
                    </td>
                    <td className="p-4 min-w-[140px]">
                      {start ? start.toLocaleDateString('it-IT') : 'N/D'}
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
                      {lastCheck ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="text-emerald-500" size={16} />
                          {lastCheck.toLocaleDateString('it-IT')}
                        </span>
                      ) : (
                        <XCircle className="text-gray-500" size={16} />
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedClients.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-slate-400">
                    Nessun cliente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
