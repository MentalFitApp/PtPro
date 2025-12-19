import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { getLandingPages } from '../../services/landingPageService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Download,
  MessageCircle,
  Filter,
  Search,
  RefreshCw,
  FileText,
  Eye,
  ChevronDown,
  Check,
  X,
  ArrowUpDown,
  MoreHorizontal,
  ArrowLeft,
  Globe,
  User,
  ClipboardList,
}

/**
 * LandingPagesLeads - Pagina dedicata per gestire tutti i leads delle landing pages
 */
const LandingPagesLeads = () => {
  const { tenantId } = useTenant();
  const toast = useToast();
  
  // State
  const [leads, setLeads] = useState([]);
  const [landingPages, setLandingPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Filters
  const [filterLandingPage, setFilterLandingPage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Mappa dei campi noti con etichette leggibili
  const knownFieldLabels = {
    name: 'Nome Completo',
    nome: 'Nome',
    cognome: 'Cognome',
    firstName: 'Nome',
    lastName: 'Cognome',
    email: 'Email',
    phone: 'Telefono',
    telefono: 'Telefono',
    message: 'Messaggio',
    messaggio: 'Messaggio',
    goal: 'Obiettivo',
    obiettivo: 'Obiettivo',
    note: 'Note',
    eta: 'Età',
    age: 'Età',
    citta: 'Città',
    city: 'Città',
    indirizzo: 'Indirizzo',
    address: 'Indirizzo',
    azienda: 'Azienda',
    company: 'Azienda',
    ruolo: 'Ruolo',
    role: 'Ruolo',
    budget: 'Budget',
    interesse: 'Interesse',
    interest: 'Interesse',
    preferenza: 'Preferenza',
    preference: 'Preferenza',
    servizio: 'Servizio',
    service: 'Servizio',
    data: 'Data Preferita',
    date: 'Data Preferita',
    orario: 'Orario Preferito',
    time: 'Orario Preferito',
  };

  // Campi da escludere dalla visualizzazione (campi di sistema)
  const excludedFields = [
    'id', 'source', 'landingPageId', 'status', 'createdAt', 'updatedAt', 
    'tenantId', 'convertedAt', 'assignedTo', 'utm_source', 'utm_medium', 
    'utm_campaign', 'utm_term', 'utm_content', 'referrer', 'userAgent',
  ];

  // Rileva automaticamente tutti i campi presenti nei leads
  const discoveredFields = useMemo(() => {
    const fieldsSet = new Set();
    leads.forEach(lead => {
      Object.keys(lead).forEach(key => {
        if (!excludedFields.includes(key) && lead[key] !== null && lead[key] !== undefined && lead[key] !== '') {
          fieldsSet.add(key);
        }
      });
    });
    // Ordina con campi comuni prima
    const priorityOrder = ['nome', 'cognome', 'name', 'firstName', 'lastName', 'email', 'phone', 'telefono', 'message', 'messaggio', 'goal', 'obiettivo'];
    return Array.from(fieldsSet).sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [leads]);

  // Helper per ottenere l'etichetta di un campo
  const getFieldLabel = (fieldName) => {
    return knownFieldLabels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');
  };

  // Helper per ottenere il nome completo del lead
  const getLeadDisplayName = (lead) => {
    if (lead.nome && lead.cognome) return `${lead.nome} ${lead.cognome}`;
    if (lead.firstName && lead.lastName) return `${lead.firstName} ${lead.lastName}`;
    if (lead.name) return lead.name;
    if (lead.nome) return lead.nome;
    if (lead.cognome) return lead.cognome;
    return lead.email || 'Senza nome';
  };

  // Helper per ottenere il telefono del lead
  const getLeadPhone = (lead) => {
    return lead.phone || lead.telefono || null;
  };

  // Helper per ottenere l'email del lead
  const getLeadEmail = (lead) => {
    return lead.email || null;
  };

  // Carica landing pages per il filtro
  useEffect(() => {
    const fetchLandingPages = async () => {
      if (!tenantId) return;
      try {
        const pages = await getLandingPages(tenantId);
        setLandingPages(pages);
      } catch (error) {
        console.error('Errore caricamento landing pages:', error);
      }
    };
    fetchLandingPages();
  }, [tenantId]);

  // Carica leads in tempo reale
  useEffect(() => {
    if (!tenantId) return;

    const leadsRef = collection(db, `tenants/${tenantId}/leads`);
    // Query base - filtra solo leads da landing pages
    const q = query(
      leadsRef,
      where('source', '==', 'landing_page'),
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
      // Prova senza filtro source se non esiste l'indice
      const fallbackQuery = query(leadsRef, orderBy('createdAt', 'desc'));
      onSnapshot(fallbackQuery, (snapshot) => {
        const leadsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          }))
          .filter(lead => lead.landingPageId); // Filtra solo quelli con landingPageId
        setLeads(leadsData);
        setIsLoading(false);
      });
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Filtra e ordina leads
  const filteredLeads = leads
    .filter(lead => {
      // Filtro per landing page
      if (filterLandingPage !== 'all' && lead.landingPageId !== filterLandingPage) return false;
      
      // Filtro per status
      if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
      
      // Filtro per ricerca - cerca in tutti i campi
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const displayName = getLeadDisplayName(lead).toLowerCase();
        const email = getLeadEmail(lead)?.toLowerCase() || '';
        const phone = getLeadPhone(lead)?.toLowerCase() || '';
        
        // Cerca anche in tutti gli altri campi
        const otherFieldsMatch = discoveredFields.some(field => {
          const value = lead[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(search);
          }
          return false;
        });
        
        return displayName.includes(search) || email.includes(search) || phone.includes(search) || otherFieldsMatch;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
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
    // Usa i campi scoperti dinamicamente + campi di sistema
    const headers = [...discoveredFields.map(f => getFieldLabel(f)), 'Status', 'Data', 'Landing Page'];
    const rows = filteredLeads.map(lead => {
      const landingPage = landingPages.find(p => p.id === lead.landingPageId);
      const fieldValues = discoveredFields.map(field => lead[field] || '');
      return [
        ...fieldValues,
        lead.status || 'new',
        lead.createdAt?.toLocaleDateString?.('it-IT') || '',
        landingPage?.title || lead.landingPageId || '',
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM per Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-landing-pages-${new Date().toISOString().split('T')[0]}.csv`;
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

  // Get landing page name
  const getLandingPageName = (pageId) => {
    const page = landingPages.find(p => p.id === pageId);
    return page?.title || 'Pagina sconosciuta';
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
      new: 'Nuovo',
      contacted: 'Contattato',
      converted: 'Convertito',
      lost: 'Perso',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${styles[status] || styles.new}`}>
        {labels[status] || labels.new}
      </span>
    );
  };

  // Stats per landing page
  const getStats = () => {
    const total = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const contacted = leads.filter(l => l.status === 'contacted').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    
    return { total, newLeads, contacted, converted, conversionRate };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/landing-pages"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                Leads Landing Pages
              </h1>
              <p className="text-slate-400 mt-1">
                Gestisci tutti i contatti raccolti dalle tue landing pages
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/admin/landing-pages"
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Globe className="w-5 h-5" />
              Gestisci Pagine
            </Link>
            <button
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Esporta CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-sm text-slate-400">Totale Lead</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-blue-500/30">
            <p className="text-sm text-slate-400">Nuovi</p>
            <p className="text-2xl font-bold text-blue-400">{stats.newLeads}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-yellow-500/30">
            <p className="text-sm text-slate-400">Contattati</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.contacted}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-green-500/30">
            <p className="text-sm text-slate-400">Convertiti</p>
            <p className="text-2xl font-bold text-green-400">{stats.converted}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-sm text-slate-400">Conversione</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.conversionRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per nome, email, telefono..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Filter by Landing Page */}
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <select
                value={filterLandingPage}
                onChange={(e) => setFilterLandingPage(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tutte le Landing</option>
                {landingPages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tutti gli status</option>
                <option value="new">Nuovi</option>
                <option value="contacted">Contattati</option>
                <option value="converted">Convertiti</option>
                <option value="lost">Persi</option>
              </select>
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors"
            >
              <ArrowUpDown className="w-5 h-5" />
              {sortOrder === 'desc' ? 'Più recenti' : 'Più vecchi'}
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
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
                  ? 'I lead appariranno qui quando qualcuno compila un form sulle tue landing pages'
                  : 'Prova a modificare i filtri o la ricerca'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Contatto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Landing Page
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id}
                      className={`hover:bg-slate-700/50 transition-colors cursor-pointer ${
                        selectedLead?.id === lead.id ? 'bg-green-500/10' : ''
                      }`}
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowDetailPanel(true);
                      }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold">
                            {getLeadDisplayName(lead)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{getLeadDisplayName(lead)}</p>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                              {getLeadEmail(lead) && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {getLeadEmail(lead)}
                                </span>
                              )}
                              {getLeadPhone(lead) && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {getLeadPhone(lead)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-lg">
                          {getLandingPageName(lead.landingPageId)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-400">
                          {formatDate(lead.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedLead(lead);
                              setShowDetailPanel(true);
                            }}
                            className="p-2 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Vedi dettagli"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {getLeadEmail(lead) && (
                            <a
                              href={`mailto:${getLeadEmail(lead)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                              title="Invia email"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {getLeadPhone(lead) && (
                            <a
                              href={`https://wa.me/${getLeadPhone(lead).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-slate-500">
          Mostrando {filteredLeads.length} di {leads.length} leads
          {discoveredFields.length > 0 && (
            <span className="ml-2">• {discoveredFields.length} campi rilevati</span>
          )}
        </div>
      </div>

      {/* Lead Detail Panel (Slide-over) */}
      <AnimatePresence>
        {showDetailPanel && selectedLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailPanel(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-slate-800 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Panel Header */}
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                    {getLeadDisplayName(selectedLead)[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{getLeadDisplayName(selectedLead)}</h2>
                    <p className="text-sm text-slate-400">{getLandingPageName(selectedLead.landingPageId)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-4 space-y-6">
                {/* Status Section */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Status Lead
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['new', 'contacted', 'converted', 'lost'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedLead.id, status)}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                          selectedLead.status === status
                            ? status === 'new' ? 'bg-blue-500 text-white' :
                              status === 'contacted' ? 'bg-yellow-500 text-white' :
                              status === 'converted' ? 'bg-green-500 text-white' :
                              'bg-red-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {status === 'new' ? '🆕 Nuovo' : status === 'contacted' ? '📞 Contattato' : status === 'converted' ? '✅ Convertito' : '❌ Perso'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Azioni Rapide
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getLeadEmail(selectedLead) && (
                      <a
                        href={`mailto:${getLeadEmail(selectedLead)}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Invia Email
                      </a>
                    )}
                    {getLeadPhone(selectedLead) && (
                      <>
                        <a
                          href={`tel:${getLeadPhone(selectedLead)}`}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Chiama
                        </a>
                        <a
                          href={`https://wa.me/${getLeadPhone(selectedLead).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* All Lead Data */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Tutti i Dati del Lead
                  </h3>
                  <div className="space-y-3">
                    {discoveredFields.map(field => {
                      const value = selectedLead[field];
                      if (value === null || value === undefined || value === '') return null;
                      
                      return (
                        <div key={field} className="flex flex-col">
                          <label className="text-xs text-slate-500 uppercase tracking-wide">
                            {getFieldLabel(field)}
                          </label>
                          <p className="text-white mt-0.5 break-words">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Informazioni Sistema
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Creato il</span>
                      <span className="text-slate-300">{formatDate(selectedLead.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Landing Page</span>
                      <span className="text-slate-300">{getLandingPageName(selectedLead.landingPageId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source</span>
                      <span className="text-slate-300">{selectedLead.source || 'landing_page'}</span>
                    </div>
                    {selectedLead.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ultimo aggiornamento</span>
                        <span className="text-slate-300">{formatDate(selectedLead.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    handleDeleteLead(selectedLead.id);
                    setShowDetailPanel(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-colors border border-red-600/30"
                >
                  <Trash2 className="w-5 h-5" />
                  Elimina Lead
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPagesLeads;
