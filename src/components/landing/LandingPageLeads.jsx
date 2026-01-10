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
  Instagram,
  MapPin,
  Target,
  User,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LandingPageLeads - Mostra i leads raccolti da una specifica landing page
 */
export default function LandingPageLeads({ pageId, tenantId, isOpen, onClose }) {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, new, contacted, converted
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(null); // Lead object or null

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
                    className="p-4 rounded-xl border bg-slate-700/50 border-slate-600 hover:border-emerald-500/50 hover:bg-slate-700/70 transition-all cursor-pointer"
                    onClick={() => setShowDetailModal(lead)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold">
                          {(lead.name || lead.nome || lead.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {lead.name || (lead.nome && lead.cognome ? `${lead.nome} ${lead.cognome}` : lead.nome) || 'Nome non fornito'}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            {lead.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {lead.email}
                              </span>
                            )}
                            {(lead.phone || lead.telefono) && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {lead.phone || lead.telefono}
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
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDetailModal(lead); }}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                          title="Vedi dettagli"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header con gradient */}
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {(showDetailModal.name || showDetailModal.nome || showDetailModal.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {showDetailModal.name || 
                         (showDetailModal.nome && showDetailModal.cognome ? `${showDetailModal.nome} ${showDetailModal.cognome}` : showDetailModal.nome) || 
                         'Lead'}
                      </h2>
                      <p className="text-emerald-100 text-sm mt-1">
                        Ricevuto il {formatDate(showDetailModal.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(null)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                
                {/* Status Section */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-slate-400">Status:</span>
                  {['new', 'contacted', 'converted', 'lost'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleUpdateStatus(showDetailModal.id, status);
                        setShowDetailModal(prev => ({ ...prev, status }));
                      }}
                      className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${
                        showDetailModal.status === status
                          ? status === 'new' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' :
                            status === 'contacted' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' :
                            status === 'converted' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' :
                            'bg-red-500 text-white shadow-lg shadow-red-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {status === 'new' ? '🆕 Nuovo' : 
                       status === 'contacted' ? '📞 Contattato' : 
                       status === 'converted' ? '✅ Convertito' : 
                       '❌ Perso'}
                    </button>
                  ))}
                </div>

                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  {showDetailModal.email && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="text-white font-medium truncate">{showDetailModal.email}</p>
                      </div>
                      <a
                        href={`mailto:${showDetailModal.email}`}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Invia Email"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Telefono */}
                  {(showDetailModal.phone || showDetailModal.telefono) && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">Telefono</p>
                        <p className="text-white font-medium">{showDetailModal.phone || showDetailModal.telefono}</p>
                      </div>
                      <a
                        href={`https://wa.me/${(showDetailModal.phone || showDetailModal.telefono).replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Instagram */}
                  {showDetailModal.instagram && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-lg">📸</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">Instagram</p>
                        <p className="text-pink-400 font-medium">{showDetailModal.instagram}</p>
                      </div>
                      <a
                        href={`https://instagram.com/${showDetailModal.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gradient-to-br from-purple-600 to-pink-500 hover:opacity-90 text-white rounded-lg transition-colors"
                        title="Vai su Instagram"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Età */}
                  {showDetailModal.eta && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Età</p>
                        <p className="text-white font-medium">{showDetailModal.eta} anni</p>
                      </div>
                    </div>
                  )}

                  {/* Città */}
                  {showDetailModal.citta && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Città</p>
                        <p className="text-white font-medium">{showDetailModal.citta}</p>
                      </div>
                    </div>
                  )}

                  {/* Obiettivo */}
                  {showDetailModal.goal && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Obiettivo</p>
                        <p className="text-white font-medium">{showDetailModal.goal}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quiz Answers Section */}
                {showDetailModal.quizAnswers && Object.keys(showDetailModal.quizAnswers).length > 0 && (
                  <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-purple-200">Risposte Quiz</h3>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(showDetailModal.quizAnswers).map(([key, value]) => (
                        <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-purple-300 uppercase tracking-wide mb-1">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-white font-medium">
                            {Array.isArray(value) ? value.join(', ') : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messaggio */}
                {showDetailModal.message && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-200">Messaggio</h3>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap">{showDetailModal.message}</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-slate-700 p-4 bg-slate-800/50 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    handleDeleteLead(showDetailModal.id);
                    setShowDetailModal(null);
                  }}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Elimina
                </button>
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
