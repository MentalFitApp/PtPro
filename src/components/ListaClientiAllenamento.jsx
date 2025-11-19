import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
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

const ListaClientiAllenamento = ({ onBack }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '', 'attiva', 'scaduta', 'in_scadenza'

  useEffect(() => {
    loadClients();
  }, []);

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

  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Status filter
    if (!filterStatus) return true;

    const allenamentoStatus = getStatusForCard(client.schedaAllenamento);
    const alimentazioneStatus = getStatusForCard(client.schedaAlimentazione);

    if (filterStatus === 'attiva') {
      return allenamentoStatus === 'consegnata' && alimentazioneStatus === 'consegnata';
    } else if (filterStatus === 'scaduta') {
      return allenamentoStatus === 'scaduta' || alimentazioneStatus === 'scaduta';
    } else if (filterStatus === 'in_scadenza') {
      const allenamentoDate = toDate(client.schedaAllenamento?.scadenza);
      const alimentazioneDate = toDate(client.schedaAlimentazione?.scadenza);
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const checkInScadenza = (date) => {
        if (!date) return false;
        const scadenza = new Date(date);
        scadenza.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((scadenza - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      };

      return checkInScadenza(allenamentoDate) || checkInScadenza(alimentazioneDate);
    }

    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
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

        {/* Status Filters */}
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
                      <td className="px-4 py-3 text-slate-200 font-medium">{client.name}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{client.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{client.phone || '-'}</td>
                      
                      {/* Scheda Allenamento Status */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${STATUS_COLORS[allenamentoStatus]}`}>
                            {STATUS_ICONS[allenamentoStatus]}
                            {STATUS_LABELS[allenamentoStatus]}
                            {client.schedaAllenamento?.scadenza && allenamentoStatus !== 'mancante' && (
                              <span className="ml-1 text-[10px] opacity-75">
                                ({toDate(client.schedaAllenamento.scadenza)?.toLocaleDateString('it-IT')})
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      
                      {/* Scheda Alimentazione Status */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${STATUS_COLORS[alimentazioneStatus]}`}>
                            {STATUS_ICONS[alimentazioneStatus]}
                            {STATUS_LABELS[alimentazioneStatus]}
                            {client.schedaAlimentazione?.scadenza && alimentazioneStatus !== 'mancante' && (
                              <span className="ml-1 text-[10px] opacity-75">
                                ({toDate(client.schedaAlimentazione.scadenza)?.toLocaleDateString('it-IT')})
                              </span>
                            )}
                          </span>
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
    </motion.div>
  );
};

export default ListaClientiAllenamento;
