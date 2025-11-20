import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, CheckCircle, AlertCircle, XCircle, UserPlus, Clock, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { db, toDate } from '../firebase';
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
      const clientsRef = collection(db, 'clients');
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
    if (!scheda || !scheda.scadenza) return 'mancante';
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
        return allenamentoStatus === 'consegnata' && alimentazioneStatus === 'consegnata';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-full overflow-x-hidden"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Torna indietro
        </button>
        <h2 className="text-2xl font-bold text-slate-100">Lista Clienti</h2>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tutti')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
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
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'nuovi'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <UserPlus size={16} />
            Nuovi Clienti (7gg)
          </button>
          <button
            onClick={() => setActiveTab('alimentazione_scade')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'alimentazione_scade'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Clock size={16} />
            Alimentazione in Scadenza
          </button>
          <button
            onClick={() => setActiveTab('allenamento_scade')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'allenamento_scade'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Clock size={16} />
            Allenamento in Scadenza
          </button>
          <button
            onClick={() => setActiveTab('scaduti')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'scaduti'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <AlertTriangle size={16} />
            Scaduti
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca cliente per nome o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Status Filters - Only show in 'tutti' tab */}
        {activeTab === 'tutti' && (
          <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400 flex items-center gap-2">
            <Filter size={16} />
            Filtri:
          </span>
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === '' 
                ? 'bg-rose-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tutti
          </button>
          <button
            onClick={() => setFilterStatus('attiva')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'attiva' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Attiva
          </button>
          <button
            onClick={() => setFilterStatus('scaduta')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'scaduta' 
                ? 'bg-orange-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Scaduta
          </button>
          <button
            onClick={() => setFilterStatus('in_scadenza')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'in_scadenza' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            In Scadenza (7 giorni)
          </button>
        </div>
        )}
      </div>

      {/* Clients List */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Caricamento...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {searchTerm || filterStatus ? 'Nessun cliente trovato' : 'Nessun cliente disponibile'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Telefono</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Scheda Allenamento</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Scheda Alimentazione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredClients.map((client) => {
                  const allenamentoStatus = getStatusForCard(client.schedaAllenamento);
                  const alimentazioneStatus = getStatusForCard(client.schedaAlimentazione);
                  
                  return (
                    <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedClientInfo(client)}
                          className="text-slate-200 font-medium hover:text-rose-400 transition-colors underline decoration-slate-600 hover:decoration-rose-400"
                        >
                          {client.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{client.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{client.phone || '-'}</td>
                      
                      {/* Scheda Allenamento Status */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => navigate(`/scheda-allenamento/${client.id}`)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[allenamentoStatus]}`}
                          >
                            {STATUS_ICONS[allenamentoStatus]}
                            {STATUS_LABELS[allenamentoStatus]}
                            {client.schedaAllenamento?.scadenza && allenamentoStatus !== 'mancante' && (
                              <span className="ml-1 text-[10px] opacity-75">
                                ({toDate(client.schedaAllenamento.scadenza)?.toLocaleDateString('it-IT')})
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                      
                      {/* Scheda Alimentazione Status */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => navigate(`/scheda-alimentazione/${client.id}`)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[alimentazioneStatus]}`}
                          >
                            {STATUS_ICONS[alimentazioneStatus]}
                            {STATUS_LABELS[alimentazioneStatus]}
                            {client.schedaAlimentazione?.scadenza && alimentazioneStatus !== 'mancante' && (
                              <span className="ml-1 text-[10px] opacity-75">
                                ({toDate(client.schedaAlimentazione.scadenza)?.toLocaleDateString('it-IT')})
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
  );
};

export default ListaClientiAllenamento;
