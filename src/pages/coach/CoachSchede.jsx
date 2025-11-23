import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';
import { Search, FileText, Dumbbell, ArrowUp, ArrowDown } from 'lucide-react';

export default function CoachSchede() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [anamnesiStatus, setAnamnesiStatus] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(getTenantCollection(db, 'clients'), async snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // carica stato anamnesi (solo exists)
      const promises = list.map(c => {
        const anamnesiCollectionRef = getTenantSubcollection(db, 'clients', c.id, 'anamnesi');
        return getDoc(doc(anamnesiCollectionRef.firestore, anamnesiCollectionRef.path, 'initial')).catch(() => ({ exists: () => false }));
      });
      const results = await Promise.all(promises);
      const status = {}; list.forEach((c,i)=> status[c.id] = results[i].exists());
      setAnamnesiStatus(status);
      setClients(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleSort = field => {
    if (sortField === field) setSortDir(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const getIcon = field => sortField === field ? (sortDir === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let arr = clients.filter(c => (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q));
    arr.sort((a,b)=>{
      let av = a[sortField] || ''; let bv = b[sortField] || '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [clients, search, sortField, sortDir]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-500"/></div>;

  return (
    <div className="min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Schede Clienti</h1>
          <p className="text-slate-400 text-sm">Gestisci le schede alimentazione e allenamento dei tuoi clienti.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca cliente..." className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-rose-500" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={()=>toggleSort('name')} className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${sortField==='name'?'bg-rose-600 text-white':'text-slate-400 hover:bg-white/10'}`}>Nome {getIcon('name')}</button>
        <button onClick={()=>toggleSort('email')} className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${sortField==='email'?'bg-rose-600 text-white':'text-slate-400 hover:bg-white/10'}`}>Email {getIcon('email')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          return (
            <div key={c.id} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white leading-tight">{c.name || 'Senza Nome'}</h3>
                  <p className="text-xs text-slate-400">{c.email || 'Nessuna email'}</p>
                </div>
                {anamnesiStatus[c.id] ? <span className="px-2 py-1 text-[10px] rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-600/40">Anamnesi</span> : <span className="px-2 py-1 text-[10px] rounded-full bg-slate-700 text-slate-300 border border-slate-600">No Anamnesi</span>}
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={()=>navigate(`/scheda-alimentazione/${c.id}`)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg">
                  <FileText size={14}/> Alimentazione
                </button>
                <button onClick={()=>navigate(`/scheda-allenamento/${c.id}`)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg">
                  <Dumbbell size={14}/> Allenamento
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center p-8 text-slate-400 border border-dashed border-slate-600 rounded-xl">Nessun cliente trovato.</div>
        )}
      </div>
    </div>
  );
}
