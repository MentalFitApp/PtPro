import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, Edit, X, Check, Copy, Plus, Archive, ExternalLink, Search, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuideManager() {
  const [guides, setGuides] = useState([]);
  const [leads, setLeads] = useState([]);
  const [showAddGuide, setShowAddGuide] = useState(false);
  const [showAddClient, setShowAddClient] = useState(null);
  const [importo, setImporto] = useState('');
  const [newGuide, setNewGuide] = useState({ id: '', name: '', redirectUrl: '' });

  // TABELLA
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChiuso, setFilterChiuso] = useState('tutti');
  const [filterShowUp, setFilterShowUp] = useState('tutti');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const leadsPerPage = 10;

  // MODIFICA GUIDA
  const [editingGuide, setEditingGuide] = useState(null);
  const [postMessage, setPostMessage] = useState('');
  const [urgencyText, setUrgencyText] = useState('');
  const [countdownDate, setCountdownDate] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'guides'));
    const unsub = onSnapshot(q, snap => {
      setGuides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'guideLeads'));
    const unsub = onSnapshot(q, snap => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddGuide = async () => {
    if (!newGuide.id || !newGuide.name || !newGuide.redirectUrl) {
      return alert('Tutti i campi sono obbligatori');
    }

    await setDoc(doc(db, 'guides', newGuide.id), {
      name: newGuide.name,
      redirectUrl: newGuide.redirectUrl,
      active: true,
      postMessage: '',
      urgencyText: '',
      countdownDate: null
    }, { merge: true });

    setShowAddGuide(false);
    setNewGuide({ id: '', name: '', redirectUrl: '' });
    alert('Guida aggiunta!');
  };

  const archiveGuide = async (id) => {
    await updateDoc(doc(db, 'guides', id), { active: false });
  };

  const copyLink = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/guida/${id}`);
    alert('Link copiato!');
  };

  // --- LEAD EDIT ---
  const handleEditLead = (lead) => {
    setEditingLead(lead.id);
    setEditForm({
      nome: lead.nome || '',
      telefono: lead.telefono || '',
      email: lead.email || '',
      instagram: lead.instagram || '',
      dialed: lead.dialed || false,
      showUp: lead.showUp || false,
      chiuso: lead.chiuso || false,
      importo: lead.importo || 0,
      wantsPromo: lead.wantsPromo || false,
    });
  };

  const handleSaveLeadEdit = async () => {
    if (!editingLead) return;

    try {
      await updateDoc(doc(db, 'guideLeads', editingLead), editForm);
      setEditingLead(null);
      setEditForm({});
    } catch (err) {
      alert('Errore aggiornamento');
    }
  };

  const handleCancelEdit = () => {
    setEditingLead(null);
    setEditForm({});
  };

  const handleDeleteLead = async (id) => {
    if (confirm('Eliminare questo lead?')) {
      await deleteDoc(doc(db, 'guideLeads', id));
    }
  };

  const addToClients = async () => {
    if (!importo || !showAddClient) return;

    await updateDoc(doc(db, 'guideLeads', showAddClient.id), { chiuso: true, importo: parseFloat(importo) });
    setShowAddClient(null);
    setImporto('');
    window.location.href = `/new-client?prefill=${encodeURIComponent(JSON.stringify({
      name: showAddClient.nome,
      email: showAddClient.email,
      phone: showAddClient.telefono,
      paymentAmount: importo,
    }))}`;
  };

  // --- SALVA MODIFICHE GUIDA ---
  const handleSaveGuideEdit = async () => {
    if (!editingGuide) return;

    await updateDoc(doc(db, 'guides', editingGuide.id), {
      postMessage: postMessage.trim() || null,
      urgencyText: urgencyText.trim() || null,
      countdownDate: countdownDate || null
    });

    setEditingGuide(null);
    setPostMessage('');
    setUrgencyText('');
    setCountdownDate('');
  };

  // --- FILTRI & PAGINAZIONE ---
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChiuso = filterChiuso === 'tutti' || (filterChiuso === 'si' ? lead.chiuso : !lead.chiuso);
    const matchesShowUp = filterShowUp === 'tutti' || (filterShowUp === 'si' ? lead.showUp : !lead.showUp);
    return matchesSearch && matchesChiuso && matchesShowUp;
  });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Gestione Guide & Lead</h1>
        <button onClick={() => setShowAddGuide(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Aggiungi Guida
        </button>
      </div>

      {/* GUIDE ATTIVE */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-cyan-300 mb-4">Guide Attive</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.filter(g => g.active).map(g => (
            <motion.div
              key={g.id}
              whileHover={{ scale: 1.02 }}
              className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 relative group"
            >
              <button
                onClick={() => {
                  setEditingGuide(g);
                  setPostMessage(g.postMessage || '');
                  setUrgencyText(g.urgencyText || '');
                  setCountdownDate(g.countdownDate || '');
                }}
                className="absolute top-2 right-2 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit size={16} />
              </button>
              <h3 className="font-bold text-white pr-8">{g.name}</h3>
              <p className="text-xs text-slate-400 truncate">ID: {g.id}</p>

              {g.countdownDate && (
                <div className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                  <Clock size={12} />
                  Scade il: {new Date(g.countdownDate).toLocaleDateString()}
                </div>
              )}

              {g.urgencyText && (
                <p className="text-xs text-amber-400 mt-1 italic">"{g.urgencyText}"</p>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={() => copyLink(g.id)} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-1 rounded flex items-center justify-center gap-1">
                  <Copy size={14} /> Copia
                </button>
                <a href={g.redirectUrl} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded">
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => archiveGuide(g.id)} className="bg-yellow-600 hover:bg-yellow-700 text-white p-1 rounded">
                  <Archive size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* TABELLA LEAD */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-2 sm:p-6 border border-slate-700 overflow-x-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4">
          <h2 className="text-base sm:text-xl font-semibold text-cyan-300">Lead dalle Guide ({filteredLeads.length})</h2>
          <div className="flex gap-1.5 sm:gap-2 text-[10px] sm:text-xs w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-700/50 rounded px-2 py-1 flex-1 sm:flex-none">
              <Search size={12} className="text-slate-400" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                placeholder="Cerca..." 
                className="bg-transparent outline-none w-full sm:w-24 text-white"
              />
            </div>
            <select value={filterChiuso} onChange={e => { setFilterChiuso(e.target.value); setCurrentPage(1); }} className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white flex-1 sm:flex-none">
              <option value="tutti">Tutti</option>
              <option value="si">Chiusi</option>
              <option value="no">No</option>
            </select>
            <select value={filterShowUp} onChange={e => { setFilterShowUp(e.target.value); setCurrentPage(1); }} className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white flex-1 sm:flex-none">
              <option value="tutti">Tutti</option>
              <option value="si">Sì</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <table className="w-full text-[10px] sm:text-sm text-left text-slate-300">
          <thead className="text-[10px] sm:text-xs uppercase bg-slate-900/50">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Az</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3">Data</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Guida</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3">Nome</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3">Tel</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">Email</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">IG</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden md:table-cell">Promo</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden lg:table-cell">Dialed</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Show</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Chiuso</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">€</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map(l => (
              <tr key={l.id} className="border-b border-white/10">
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-center">
                  {editingLead === l.id ? (
                    <div className="flex gap-0.5 sm:gap-1 justify-center">
                      <button onClick={handleSaveLeadEdit} className="text-green-400"><Check size={12} className="sm:hidden" /><Check size={16} className="hidden sm:block" /></button>
                      <button onClick={handleCancelEdit} className="text-red-400"><X size={12} className="sm:hidden" /><X size={16} className="hidden sm:block" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-0.5 sm:gap-1 justify-center">
                      <button onClick={() => handleEditLead(l)} className="text-cyan-400"><Edit size={12} className="sm:hidden" /><Edit size={16} className="hidden sm:block" /></button>
                      <button onClick={() => handleDeleteLead(l.id)} className="text-red-400"><Trash2 size={12} className="sm:hidden" /><Trash2 size={16} className="hidden sm:block" /></button>
                    </div>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs">{new Date(l.timestamp?.toDate()).toLocaleDateString()}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 hidden md:table-cell">{guides.find(g => g.id === l.guideId)?.name}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2">
                  {editingLead === l.id ? (
                    <input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} className="w-full p-1 bg-slate-700/50 border border-slate-600 rounded text-xs" />
                  ) : l.nome}
                </td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2">
                  {editingLead === l.id ? (
                    <input value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} className="w-full p-1 bg-slate-700/50 border border-slate-600 rounded text-xs" />
                  ) : l.telefono}
                </td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 hidden lg:table-cell">{l.email}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 hidden lg:table-cell">{l.instagram || '—'}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-center hidden md:table-cell">
                  {editingLead === l.id ? (
                    <input type="checkbox" checked={editForm.wantsPromo} onChange={e => setEditForm({ ...editForm, wantsPromo: e.target.checked })} className="w-4 h-4" />
                  ) : l.wantsPromo ? (
                    <span className="text-emerald-400 text-xl">Checkmark</span>
                  ) : (
                    <span className="text-rose-400 text-xl">X</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-center hidden lg:table-cell">
                  {editingLead === l.id ? (
                    <input type="checkbox" checked={editForm.dialed} onChange={e => setEditForm({ ...editForm, dialed: e.target.checked })} className="w-4 h-4" />
                  ) : <span className={l.dialed ? 'text-green-400' : 'text-yellow-400'}>{l.dialed ? 'Sì' : 'No'}</span>}
                </td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-center">
                  {editingLead === l.id ? (
                    <input type="checkbox" checked={editForm.showUp} onChange={e => setEditForm({ ...editForm, showUp: e.target.checked })} className="w-4 h-4" />
                  ) : <span className={l.showUp ? 'text-green-400' : 'text-yellow-400'}>{l.showUp ? 'Sì' : 'No'}</span>}
                </td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-center">
                  {editingLead === l.id ? (
                    <input type="checkbox" checked={editForm.chiuso} onChange={e => setEditForm({ ...editForm, chiuso: e.target.checked })} className="w-4 h-4" />
                  ) : <button onClick={() => setShowAddClient(l)} className={l.chiuso ? 'text-green-400' : 'text-green-400'}>{l.chiuso ? `€${l.importo}` : 'Chiudi'}</button>}
                </td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-center">
                  {editingLead === l.id ? (
                    <input type="number" value={editForm.importo || ''} onChange={e => setEditForm({ ...editForm, importo: parseFloat(e.target.value) || 0 })} className="w-16 p-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-center" />
                  ) : <span>€{l.importo || 0}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-3 sm:mt-4 text-[10px] sm:text-xs">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 text-cyan-300 disabled:opacity-50"><ChevronLeft size={14} className="sm:hidden" /><ChevronLeft size={16} className="hidden sm:block" /></button>
            <span className="text-slate-300">Pag {currentPage}/{totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 text-cyan-300 disabled:opacity-50"><ChevronRight size={14} className="sm:hidden" /><ChevronRight size={16} className="hidden sm:block" /></button>
          </div>
        )}
      </div>

      {/* MODAL AGGIUNGI GUIDA */}
      {showAddGuide && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Nuova Guida</h3>
            <input placeholder="ID unico (es: maniglie)" value={newGuide.id} onChange={e => setNewGuide({...newGuide, id: e.target.value.toLowerCase().replace(/\s/g, '')})} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mb-3" />
            <input placeholder="Nome guida" value={newGuide.name} onChange={e => setNewGuide({...newGuide, name: e.target.value})} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mb-3" />
            <input placeholder="Link guida" value={newGuide.redirectUrl} onChange={e => setNewGuide({...newGuide, redirectUrl: e.target.value})} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mb-4" />
            <div className="flex gap-3">
              <button onClick={handleAddGuide} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Aggiungi</button>
              <button onClick={() => setShowAddGuide(false)} className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-white py-2 rounded-lg">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICA GUIDA */}
      {editingGuide && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-white mb-4">Modifica: {editingGuide.name}</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Messaggio Post-Guida</label>
                <textarea
                  placeholder="Es: Complimenti! Hai sbloccato 1 mese omaggio..."
                  value={postMessage}
                  onChange={e => setPostMessage(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white h-24 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Testo Urgency</label>
                <input
                  type="text"
                  placeholder="Es: Offerta valida solo 48 ore!"
                  value={urgencyText}
                  onChange={e => setUrgencyText(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Timer Scadenza</label>
                <input
                  type="datetime-local"
                  value={countdownDate}
                  onChange={e => setCountdownDate(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveGuideEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Salva</button>
              <button onClick={() => setEditingGuide(null)} className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-white py-2 rounded-lg">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHIUDI VENDITA */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Chiudi vendita</h3>
            <input type="number" placeholder="Importo (€)" value={importo} onChange={e => setImporto(e.target.value)} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white mb-4" />
            <div className="flex gap-3">
              <button onClick={addToClients} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Conferma</button>
              <button onClick={() => { setShowAddClient(null); setImporto(''); }} className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-white py-2 rounded-lg">Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}