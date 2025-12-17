import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  Eye,
  Trash2,
  Check,
  X,
  Download,
  MessageCircle,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LandingPageLeads - Mostra i leads raccolti da una specifica landing page
 */
export default function LandingPageLeads({ pageId, tenantId, isOpen, onClose }) {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filter, setFilter] = useState('all'); // all, new, contacted, converted
  const [searchTerm, setSearchTerm] = useState('');

  // Carica leads in tempo reale
  useEffect(() => {
    if (!pageId || !tenantId) return;

    const leadsRef = collection(db, `tenants/${tenantId}/leads`);
    const q = query(
      leadsRef,
      where('landingPageId', '==', pageId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      }));
      setLeads(leadsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Errore caricamento leads:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pageId, tenantId]);

  // Filtra leads
  const filteredLeads = leads.filter(lead => {
    // Filtro per status
    if (filter !== 'all' && lead.status !== filter) return false;
    
    // Filtro per ricerca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.phone?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  // Aggiorna status lead
  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      await updateDoc(doc(db, `tenants/${tenantId}/leads`, leadId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      toast?.showToast?.('Status aggiornato', 'success');
    } catch (error) {
      console.error('Errore aggiornamento:', error);
      toast?.showToast?.('Errore aggiornamento', 'error');
    }
  };

  // Elimina lead
  const handleDeleteLead = async (leadId) => {
    if (!confirm('Sei sicuro di voler eliminare questo lead?')) return;
    
    try {
      await deleteDoc(doc(db, `tenants/${tenantId}/leads`, leadId));
      toast?.showToast?.('Lead eliminato', 'success');
      setSelectedLead(null);
    } catch (error) {
      console.error('Errore eliminazione:', error);
      toast?.showToast?.('Errore eliminazione', 'error');
    }
  };

  // Esporta leads in CSV
  const handleExportCSV = () => {
    const headers = ['Nome', 'Email', 'Telefono', 'Status', 'Data', 'Obiettivo', 'Note'];
    const rows = filteredLeads.map(lead => [
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.status || 'new',
      lead.createdAt?.toLocaleDateString?.('it-IT') || '',
      lead.goal || '',
      lead.note || '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-landing-${pageId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast?.showToast?.('CSV esportato!', 'success');
  };

  // Formatta data
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge
  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      converted: 'bg-green-500/20 text-green-400 border-green-500/30',
      lost: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const labels = {
      new: '🆕 Nuovo',
      contacted: '📞 Contattato',
      converted: '✅ Convertito',
      lost: '❌ Perso',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${styles[status] || styles.new}`}>
        {labels[status] || labels.new}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Lead della Landing Page</h2>
                <p className="text-sm text-slate-400">
                  {leads.length} lead totali • {filteredLeads.length} visualizzati
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per nome, email, telefono..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tutti</option>
                <option value="new">Nuovi</option>
                <option value="contacted">Contattati</option>
                <option value="converted">Convertiti</option>
                <option value="lost">Persi</option>
              </select>
            </div>

            {/* Export */}
            <button
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Esporta CSV
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  {leads.length === 0 ? 'Nessun lead ancora' : 'Nessun risultato'}
                </h3>
                <p className="text-sm text-slate-500">
                  {leads.length === 0 
                    ? 'I lead appariranno qui quando qualcuno compila il form'
                    : 'Prova a modificare i filtri o la ricerca'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedLead?.id === lead.id
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedLead(lead.id === selectedLead?.id ? null : lead)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold">
                          {(lead.name || lead.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{lead.name || 'Nome non fornito'}</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            {lead.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {lead.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(lead.status)}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(lead.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {selectedLead?.id === lead.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-600 space-y-4"
                      >
                        {/* Campi extra */}
                        <div className="grid grid-cols-2 gap-4">
                          {lead.goal && (
                            <div>
                              <label className="text-xs text-slate-400">Obiettivo</label>
                              <p className="text-white">{lead.goal}</p>
                            </div>
                          )}
                          {lead.message && (
                            <div className="col-span-2">
                              <label className="text-xs text-slate-400">Messaggio</label>
                              <p className="text-white">{lead.message}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 mr-2">Cambia status:</span>
                          {['new', 'contacted', 'converted', 'lost'].map((status) => (
                            <button
                              key={status}
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(lead.id, status); }}
                              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                lead.status === status
                                  ? 'bg-green-500 text-white'
                                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                              }`}
                            >
                              {status === 'new' ? 'Nuovo' : status === 'contacted' ? 'Contattato' : status === 'converted' ? 'Convertito' : 'Perso'}
                            </button>
                          ))}
                          
                          <div className="flex-1" />
                          
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="border-t border-slate-700 p-4 bg-slate-800/50">
            <div className="flex items-center justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {leads.filter(l => l.status === 'new').length}
                </p>
                <p className="text-xs text-slate-400">Nuovi</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {leads.filter(l => l.status === 'contacted').length}
                </p>
                <p className="text-xs text-slate-400">Contattati</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {leads.filter(l => l.status === 'converted').length}
                </p>
                <p className="text-xs text-slate-400">Convertiti</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {leads.length > 0 
                    ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)
                    : 0
                  }%
                </p>
                <p className="text-xs text-slate-400">Conversione</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
