import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, CheckCircle, AlertCircle, XCircle, UserPlus, Clock, AlertTriangle, X, ExternalLink, ChevronRight } from 'lucide-react';
import { db, toDate } from '../firebase';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../config/tenant';
import { collection, getDocs } from 'firebase/firestore';

const STATUS_COLORS = {
  consegnata: 'bg-emerald-900/30 border-emerald-600/50 text-emerald-300',
  scaduta: 'bg-orange-900/30 border-orange-600/50 text-orange-300',
  mancante: 'bg-red-900/30 border-red-600/50 text-red-300'
};

const STATUS_ICONS = {
  consegnata: <CheckCircle size={16} />,
  scaduta: <AlertCircle size={16} />,
  mancante: <XCircle size={16} />
};

const STATUS_LABELS = {
  consegnata: 'Consegnata',
  scaduta: 'Scaduta',
  mancante: 'Mancante'
};

const calculateCardStatus = (scadenzaDate) => {
  if (!scadenzaDate) return 'mancante';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const scadenza = new Date(scadenzaDate);
  scadenza.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((scadenza - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'scaduta';
  if (diffDays <= 7) return 'scaduta'; // In scadenza entro 7 giorni
  return 'consegnata';
};

const ListaClientiAllenamento = ({ onBack, initialFilter }) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '', 'attiva', 'scaduta', 'in_scadenza'
  const [activeTab, setActiveTab] = useState(initialFilter || 'tutti'); // 'tutti', 'nuovi', 'alimentazione_scade', 'allenamento_scade', 'scaduti'
  const [selectedClientInfo, setSelectedClientInfo] = useState(null); // For client info modal

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (initialFilter) {
      setActiveTab(initialFilter);
    }
  }, [initialFilter]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const clientsRef = getTenantCollection(db, 'clients');
      const snapshot = await getDocs(clientsRef);
      const clientsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'N/D',
          email: data.email || '',
          phone: data.phone || '',
          createdAt: data.createdAt || data.startDate || null,
          // Scheda Allenamento
          schedaAllenamento: data.schedaAllenamento || {},
          // Scheda Alimentazione
          schedaAlimentazione: data.schedaAlimentazione || {}
        };
      });
      setClients(clientsData);
    } catch (error) {
      console.error('Errore nel caricamento dei clienti:', error);
    }
    setLoading(false);
  };

  const getStatusForCard = (scheda) => {
    if (!scheda) return 'mancante';
    
    // Se è stata consegnata ma non ha scadenza, è comunque attiva
    if (scheda.consegnata && !scheda.scadenza) return 'consegnata';
    
    // Se non ha né consegnata né scadenza, è mancante
    if (!scheda.scadenza) return 'mancante';
    
    // Altrimenti calcola lo stato in base alla scadenza
    return calculateCardStatus(toDate(scheda.scadenza));
  };

  const getDaysUntilExpiry = (scadenzaDate) => {
    if (!scadenzaDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const scadenza = new Date(toDate(scadenzaDate));
    scadenza.setHours(0, 0, 0, 0);
    return Math.ceil((scadenza - now) / (1000 * 60 * 60 * 24));
  };

  const isNewClient = (client) => {
    if (!client.createdAt) return false;
    const createdDate = toDate(client.createdAt);
    if (!createdDate) return false;
    const daysSinceCreated = Math.ceil((new Date() - createdDate) / (1000 * 60 * 60 * 24));
    return daysSinceCreated <= 7 && 
           getStatusForCard(client.schedaAllenamento) === 'mancante' && 
           getStatusForCard(client.schedaAlimentazione) === 'mancante';
  };

  const getFilteredAndSortedClients = () => {
    let filtered = clients.filter(client => {
      // Search filter
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Tab filter
      if (activeTab === 'nuovi') {
        return isNewClient(client);
      } else if (activeTab === 'alimentazione_scade') {
        const days = getDaysUntilExpiry(client.schedaAlimentazione?.scadenza);
        return days !== null && days >= 0 && days <= 7;
      } else if (activeTab === 'allenamento_scade') {
        const days = getDaysUntilExpiry(client.schedaAllenamento?.scadenza);
        return days !== null && days >= 0 && days <= 7;
      } else if (activeTab === 'scaduti') {
        const allenamentoDays = getDaysUntilExpiry(client.schedaAllenamento?.scadenza);
        const alimentazioneDays = getDaysUntilExpiry(client.schedaAlimentazione?.scadenza);
        return (allenamentoDays !== null && allenamentoDays < 0) || 
               (alimentazioneDays !== null && alimentazioneDays < 0);
      }

      // Status filter (for 'tutti' tab)
      if (!filterStatus) return true;

      const allenamentoStatus = getStatusForCard(client.schedaAllenamento);
      const alimentazioneStatus = getStatusForCard(client.schedaAlimentazione);

      if (filterStatus === 'attiva') {
        return allenamentoStatus === 'consegnata' || alimentazioneStatus === 'consegnata';
      } else if (filterStatus === 'scaduta') {
        return allenamentoStatus === 'scaduta' || alimentazioneStatus === 'scaduta';
      } else if (filterStatus === 'in_scadenza') {
        const allenamentoDays = getDaysUntilExpiry(client.schedaAllenamento?.scadenza);
        const alimentazioneDays = getDaysUntilExpiry(client.schedaAlimentazione?.scadenza);
        return (allenamentoDays !== null && allenamentoDays >= 0 && allenamentoDays <= 7) ||
               (alimentazioneDays !== null && alimentazioneDays >= 0 && alimentazioneDays <= 7);
      }

      return true;
    });

    // Sort by expiry date for expiring tabs
    if (activeTab === 'alimentazione_scade') {
      filtered.sort((a, b) => {
        const daysA = getDaysUntilExpiry(a.schedaAlimentazione?.scadenza) || 999;
        const daysB = getDaysUntilExpiry(b.schedaAlimentazione?.scadenza) || 999;
        return daysA - daysB;
      });
    } else if (activeTab === 'allenamento_scade') {
      filtered.sort((a, b) => {
        const daysA = getDaysUntilExpiry(a.schedaAllenamento?.scadenza) || 999;
        const daysB = getDaysUntilExpiry(b.schedaAllenamento?.scadenza) || 999;
        return daysA - daysB;
      });
    } else if (activeTab === 'scaduti') {
      filtered.sort((a, b) => {
        const daysA = Math.min(
          getDaysUntilExpiry(a.schedaAllenamento?.scadenza) || 999,
          getDaysUntilExpiry(a.schedaAlimentazione?.scadenza) || 999
        );
        const daysB = Math.min(
          getDaysUntilExpiry(b.schedaAllenamento?.scadenza) || 999,
          getDaysUntilExpiry(b.schedaAlimentazione?.scadenza) || 999
        );
        return daysA - daysB;
      });
    }

    return filtered;
  };

  const filteredClients = getFilteredAndSortedClients();

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3 w-full"
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm whitespace-nowrap flex-shrink-0"
          >
            ← Indietro
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 truncate">Lista Clienti</h2>
        </div>

      {/* Tabs */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-1.5 sm:p-3 w-full">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <button
            onClick={() => setActiveTab('tutti')}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'tutti'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Filter size={16} />
            Tutti
          </button>
          <button
            onClick={() => setActiveTab('nuovi')}
            className={`px-2 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'nuovi'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <UserPlus size={16} />
            Nuovi (7gg)
          </button>
          <button
            onClick={() => setActiveTab('alimentazione_scade')}
            className={`px-2 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'alimentazione_scade'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Clock size={16} />
            Alimentazione ⇣
          </button>
          <button
            onClick={() => setActiveTab('allenamento_scade')}
            className={`px-2 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'allenamento_scade'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Clock size={16} />
            Allenamento ⇣
          </button>
          <button
            onClick={() => setActiveTab('scaduti')}
            className={`px-2 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
              activeTab === 'scaduti'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <AlertTriangle size={16} />
            Scaduti
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 w-full">
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cerca cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Status Filters - Only show in 'tutti' tab */}
        {activeTab === 'tutti' && (
          <div className="flex items-center gap-1.5 flex-wrap w-full">
          <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <Filter size={14} />
            Filtri:
          </span>
          <button
            onClick={() => setFilterStatus('')}
            className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filterStatus === '' 
                ? 'bg-rose-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tutti
          </button>
          <button
            onClick={() => setFilterStatus('attiva')}
            className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filterStatus === 'attiva' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Attiva
          </button>
          <button
            onClick={() => setFilterStatus('scaduta')}
            className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filterStatus === 'scaduta' 
                ? 'bg-orange-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Scaduta
          </button>
          <button
            onClick={() => setFilterStatus('in_scadenza')}
            className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filterStatus === 'in_scadenza' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            In Scadenza
          </button>
        </div>
        )}
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">
          Caricamento...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          {searchTerm || filterStatus ? 'Nessun cliente trovato' : 'Nessun cliente disponibile'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 w-full">
          {filteredClients.map((client) => {
            const allenamentoStatus = getStatusForCard(client.schedaAllenamento);
            const alimentazioneStatus = getStatusForCard(client.schedaAlimentazione);
            const allenamentoDays = getDaysUntilExpiry(client.schedaAllenamento?.scadenza);
            const alimentazioneDays = getDaysUntilExpiry(client.schedaAlimentazione?.scadenza);
            
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-rose-600/50 hover:shadow-lg hover:shadow-rose-600/10 transition-all w-full group"
              >
                {/* Header con più info */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedClientInfo(client)}
                      className="text-sm sm:text-base font-bold text-slate-100 hover:text-rose-400 transition-colors text-left truncate block w-full group-hover:text-rose-300"
                    >
                      {client.name}
                    </button>
                    {client.email && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{client.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {client.age && (
                        <span className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded">
                          {client.age} anni
                        </span>
                      )}
                      {client.goal && (
                        <span className="text-xs px-2 py-0.5 bg-blue-900/30 border border-blue-600/30 text-blue-300 rounded">
                          {client.goal}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/client-detail/${client.id}`)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200 flex-shrink-0"
                    title="Dettagli completi"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>

                {/* Schede con più spazio */}
                <div className="space-y-2">
                  {/* Allenamento */}
                  <div className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700 hover:border-blue-600/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`inline-flex items-center p-1 rounded border ${STATUS_COLORS[allenamentoStatus]}`}>
                        {STATUS_ICONS[allenamentoStatus]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400">Allenamento</p>
                        {client.schedaAllenamento?.scadenza ? (
                          <p className={`text-sm font-semibold ${
                            allenamentoDays < 0 ? 'text-red-400' : 
                            allenamentoDays <= 7 ? 'text-orange-400' : 
                            'text-emerald-400'
                          }`}>
                            {allenamentoDays < 0 ? `Scaduta ${Math.abs(allenamentoDays)}gg fa` : `${allenamentoDays} giorni`}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500">Non assegnata</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/scheda-allenamento/${client.id}`)}
                      className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0 font-medium"
                    >
                      Apri
                    </button>
                  </div>

                  {/* Alimentazione */}
                  <div className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700 hover:border-emerald-600/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`inline-flex items-center p-1 rounded border ${STATUS_COLORS[alimentazioneStatus]}`}>
                        {STATUS_ICONS[alimentazioneStatus]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400">Alimentazione</p>
                        {client.schedaAlimentazione?.scadenza ? (
                          <p className={`text-sm font-semibold ${
                            alimentazioneDays < 0 ? 'text-red-400' : 
                            alimentazioneDays <= 7 ? 'text-orange-400' : 
                            'text-emerald-400'
                          }`}>
                            {alimentazioneDays < 0 ? `Scaduta ${Math.abs(alimentazioneDays)}gg fa` : `${alimentazioneDays} giorni`}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500">Non assegnata</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/scheda-alimentazione/${client.id}`)}
                      className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex-shrink-0 font-medium"
                    >
                      Apri
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Client Info Modal */}
      <AnimatePresence>
        {selectedClientInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClientInfo(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-100">Informazioni Cliente</h3>
                  <button
                    onClick={() => setSelectedClientInfo(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Client Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nome:</span>
                      <span className="text-slate-100 font-semibold">{selectedClientInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-slate-300">{selectedClientInfo.email || 'N/D'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Telefono:</span>
                      <span className="text-slate-300">{selectedClientInfo.phone || 'N/D'}</span>
                    </div>
                  </div>

                  {/* Card Status */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">Stato Schede</h4>
                    
                    {/* Allenamento */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-300">Scheda Allenamento</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[getStatusForCard(selectedClientInfo.schedaAllenamento)]}`}>
                          {STATUS_ICONS[getStatusForCard(selectedClientInfo.schedaAllenamento)]}
                          {STATUS_LABELS[getStatusForCard(selectedClientInfo.schedaAllenamento)]}
                        </span>
                      </div>
                      {selectedClientInfo.schedaAllenamento?.scadenza && (
                        <div className="text-sm text-slate-400">
                          <div>Scadenza: {toDate(selectedClientInfo.schedaAllenamento.scadenza)?.toLocaleDateString('it-IT')}</div>
                          <div className="mt-1">
                            {(() => {
                              const days = getDaysUntilExpiry(selectedClientInfo.schedaAllenamento.scadenza);
                              if (days < 0) return <span className="text-red-400">Scaduta da {Math.abs(days)} giorni</span>;
                              if (days <= 7) return <span className="text-orange-400">Scade tra {days} giorni</span>;
                              return <span className="text-emerald-400">Scade tra {days} giorni</span>;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Alimentazione */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-300">Scheda Alimentazione</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[getStatusForCard(selectedClientInfo.schedaAlimentazione)]}`}>
                          {STATUS_ICONS[getStatusForCard(selectedClientInfo.schedaAlimentazione)]}
                          {STATUS_LABELS[getStatusForCard(selectedClientInfo.schedaAlimentazione)]}
                        </span>
                      </div>
                      {selectedClientInfo.schedaAlimentazione?.scadenza && (
                        <div className="text-sm text-slate-400">
                          <div>Scadenza: {toDate(selectedClientInfo.schedaAlimentazione.scadenza)?.toLocaleDateString('it-IT')}</div>
                          <div className="mt-1">
                            {(() => {
                              const days = getDaysUntilExpiry(selectedClientInfo.schedaAlimentazione.scadenza);
                              if (days < 0) return <span className="text-red-400">Scaduta da {Math.abs(days)} giorni</span>;
                              if (days <= 7) return <span className="text-orange-400">Scade tra {days} giorni</span>;
                              return <span className="text-emerald-400">Scade tra {days} giorni</span>;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      setSelectedClientInfo(null);
                      navigate(`/client-detail/${selectedClientInfo.id}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink size={18} />
                    Visualizza Cliente
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ListaClientiAllenamento;