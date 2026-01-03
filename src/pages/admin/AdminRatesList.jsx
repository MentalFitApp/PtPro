// src/pages/admin/AdminRatesList.jsx
// Lista tutte le rate (pagamenti a rate) di tutti i clienti per Admin
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, toDate } from '../../firebase';
import { getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { motion } from 'framer-motion';
import { 
  DollarSign, User, Calendar, AlertTriangle, Clock, CheckCircle,
  ArrowRight, Search, Filter, Loader2, TrendingDown, ChevronLeft, ChevronRight,
  ArrowLeft, ExternalLink
} from 'lucide-react';
import { UnifiedCard, CardHeaderSimple, CardContent } from '../../components/ui/UnifiedCard';
import { Badge } from '../../components/ui/Badge';

const RATES_PER_PAGE = 15;

// Helper per calcolare giorni fino/dalla scadenza
const getDaysUntil = (dateValue) => {
  if (!dateValue) return null;
  const date = toDate(dateValue);
  if (!date || isNaN(date.getTime())) return null;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper per formattare data
const formatDate = (dateValue) => {
  if (!dateValue) return 'N/D';
  const date = toDate(dateValue);
  if (!date || isNaN(date.getTime())) return 'N/D';
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Classifica una rata per stato
const getRateStatus = (rate) => {
  if (rate.paid) return 'paid';
  const days = getDaysUntil(rate.dueDate);
  if (days === null) return 'unknown';
  if (days < 0) return 'overdue'; // Scaduta
  if (days === 0) return 'today'; // Scade oggi
  if (days <= 7) return 'soon'; // Entro 7 giorni
  if (days <= 30) return 'upcoming'; // Entro 30 giorni
  return 'future'; // Oltre 30 giorni
};

// Colori per stato
const statusConfig = {
  overdue: { label: 'Scaduta', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: AlertTriangle },
  today: { label: 'Scade oggi', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  soon: { label: 'Entro 7gg', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Clock },
  upcoming: { label: 'Entro 30gg', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Calendar },
  future: { label: 'Futura', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Calendar },
  paid: { label: 'Pagata', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  unknown: { label: 'N/D', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Calendar },
};

// Filtri disponibili
const FILTER_OPTIONS = [
  { value: 'unpaid', label: 'Da pagare' },
  { value: 'overdue', label: 'Scadute' },
  { value: 'soon', label: 'Entro 7 giorni' },
  { value: 'upcoming', label: 'Entro 30 giorni' },
  { value: 'paid', label: 'Pagate' },
  { value: 'all', label: 'Tutte' },
];

export default function AdminRatesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCoachView = location.pathname.startsWith('/coach');
  
  const [rates, setRates] = useState([]);
  const [clientsMap, setClientsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('unpaid'); // Default: solo da pagare
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadAllData();
  }, []);

  // Carica TUTTE le rate di TUTTI i clienti (subcollection + legacy)
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // 1. Carica tutti i clienti
      const clientsRef = getTenantCollection(db, 'clients');
      const clientsSnap = await getDocs(clientsRef);
      
      // Crea mappa clienti
      const map = {};
      clientsSnap.docs.forEach(doc => {
        const data = doc.data();
        map[doc.id] = {
          name: data.name || data.email || 'Cliente sconosciuto',
          email: data.email,
          phone: data.phone,
        };
      });
      setClientsMap(map);
      
      // 2. Carica le rate di ogni cliente in parallelo (subcollection + legacy)
      const allRates = [];
      const ratePromises = clientsSnap.docs.map(async (clientDoc) => {
        const clientId = clientDoc.id;
        const clientData = clientDoc.data();
        
        try {
          // 2a. Rate dalla subcollection
          const ratesRef = getTenantSubcollection(db, 'clients', clientId, 'rates');
          const ratesSnap = await getDocs(ratesRef);
          
          ratesSnap.docs.forEach(rateDoc => {
            const data = rateDoc.data();
            allRates.push({
              id: rateDoc.id,
              clientId,
              amount: data.amount || 0,
              dueDate: data.dueDate,
              paid: data.paid || false,
              paidDate: data.paidDate,
              isRenewal: data.isRenewal || false,
              createdAt: data.createdAt,
              source: 'subcollection',
            });
          });
          
          // 2b. Rate legacy (array 'rate' nel documento cliente)
          if (clientData.rate && Array.isArray(clientData.rate)) {
            clientData.rate.forEach((legacyRate, idx) => {
              allRates.push({
                id: `legacy-${clientId}-${idx}`,
                clientId,
                amount: legacyRate.amount || 0,
                dueDate: legacyRate.dueDate,
                paid: legacyRate.paid || false,
                paidDate: legacyRate.paidDate,
                isRenewal: false,
                createdAt: null,
                source: 'legacy',
              });
            });
          }
        } catch (err) {
          console.warn(`Errore caricamento rate cliente ${clientId}:`, err);
        }
      });
      
      await Promise.all(ratePromises);
      
      // Ordina per data scadenza (più urgenti prima)
      allRates.sort((a, b) => {
        const dateA = toDate(a.dueDate);
        const dateB = toDate(b.dueDate);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      });
      
      setRates(allRates);
    } catch (err) {
      console.error('Errore caricamento rate:', err);
    } finally {
      setLoading(false);
    }
  };

  // Statistiche
  const stats = useMemo(() => {
    let totalAmount = 0;
    let unpaidAmount = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let soonCount = 0;
    let unpaidCount = 0;
    
    rates.forEach(rate => {
      const amount = parseFloat(rate.amount) || 0;
      totalAmount += amount;
      
      if (!rate.paid) {
        unpaidAmount += amount;
        unpaidCount++;
        const days = getDaysUntil(rate.dueDate);
        if (days !== null && days < 0) {
          overdueAmount += amount;
          overdueCount++;
        } else if (days !== null && days <= 7) {
          soonCount++;
        }
      }
    });
    
    return { totalAmount, unpaidAmount, overdueAmount, overdueCount, soonCount, unpaidCount };
  }, [rates]);

  // Filtra e cerca
  const filteredRates = useMemo(() => {
    let result = rates;
    
    // Filtra per stato
    if (filterStatus !== 'all') {
      if (filterStatus === 'unpaid') {
        result = result.filter(r => !r.paid);
      } else if (filterStatus === 'overdue') {
        result = result.filter(r => !r.paid && getDaysUntil(r.dueDate) < 0);
      } else if (filterStatus === 'soon') {
        result = result.filter(r => {
          if (r.paid) return false;
          const days = getDaysUntil(r.dueDate);
          return days !== null && days >= 0 && days <= 7;
        });
      } else if (filterStatus === 'upcoming') {
        result = result.filter(r => {
          if (r.paid) return false;
          const days = getDaysUntil(r.dueDate);
          return days !== null && days > 7 && days <= 30;
        });
      } else if (filterStatus === 'paid') {
        result = result.filter(r => r.paid);
      }
    }
    
    // Cerca per nome cliente
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => {
        const clientName = clientsMap[r.clientId]?.name || '';
        return clientName.toLowerCase().includes(query);
      });
    }
    
    return result;
  }, [rates, filterStatus, searchQuery, clientsMap]);

  // Paginazione
  const totalPages = Math.ceil(filteredRates.length / RATES_PER_PAGE);
  const paginatedRates = useMemo(() => {
    const start = (currentPage - 1) * RATES_PER_PAGE;
    return filteredRates.slice(start, start + RATES_PER_PAGE);
  }, [filteredRates, currentPage]);

  // Reset pagina quando cambiano filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  const goToClientDetail = useCallback((clientId, e) => {
    if (e) e.stopPropagation();
    const basePath = isCoachView ? '/coach/client' : '/client';
    navigate(`${basePath}/${clientId}?tab=payments`);
  }, [navigate, isCoachView]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        <p className="text-slate-400 mt-4">Caricamento rate...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 flex items-center gap-3">
              <DollarSign className="text-cyan-400" />
              Gestione Rate
            </h1>
            <p className="text-slate-400 mt-1">Visualizza tutte le rate dei tuoi clienti</p>
          </div>
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Clienti</span>
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <UnifiedCard variant="stat" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Da incassare</p>
                <p className="text-xl font-bold text-cyan-400">€{stats.unpaidAmount.toLocaleString('it-IT')}</p>
                <p className="text-xs text-slate-500">{stats.unpaidCount} rate</p>
              </div>
            </div>
          </UnifiedCard>

          <UnifiedCard variant="stat" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Scadute</p>
                <p className="text-xl font-bold text-rose-400">€{stats.overdueAmount.toLocaleString('it-IT')}</p>
                <p className="text-xs text-slate-500">{stats.overdueCount} rate</p>
              </div>
            </div>
          </UnifiedCard>

          <UnifiedCard variant="stat" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Entro 7 giorni</p>
                <p className="text-xl font-bold text-amber-400">{stats.soonCount}</p>
                <p className="text-xs text-slate-500">rate in scadenza</p>
              </div>
            </div>
          </UnifiedCard>

          <UnifiedCard variant="stat" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Totale rate</p>
                <p className="text-xl font-bold text-emerald-400">{rates.length}</p>
                <p className="text-xs text-slate-500">nel sistema</p>
              </div>
            </div>
          </UnifiedCard>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === opt.value
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-400 mb-4">
          {filteredRates.length} rate trovate
          {totalPages > 1 && ` - Pagina ${currentPage} di ${totalPages}`}
        </p>

        {/* Rates List */}
        <div className="space-y-3">
          {paginatedRates.length === 0 ? (
            <UnifiedCard className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nessuna rata trovata con i filtri selezionati</p>
            </UnifiedCard>
          ) : (
            paginatedRates.map((rate) => {
              const status = getRateStatus(rate);
              const config = statusConfig[status];
              const StatusIcon = config.icon;
              const days = getDaysUntil(rate.dueDate);
              const clientName = clientsMap[rate.clientId]?.name || 'Cliente sconosciuto';
              
              return (
                <motion.div
                  key={`${rate.clientId}-${rate.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <UnifiedCard className="p-4 hover:border-slate-600 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Status Icon */}
                        <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                          <StatusIcon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                        </div>
                        
                        {/* Client & Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button 
                              onClick={(e) => goToClientDetail(rate.clientId, e)}
                              className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline truncate flex items-center gap-1 transition-colors"
                            >
                              <User className="w-4 h-4" />
                              {clientName}
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </button>
                            <Badge variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                            {rate.isRenewal && (
                              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                Rinnovo
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(rate.dueDate)}
                            </span>
                            {!rate.paid && days !== null && (
                              <span className={`${days < 0 ? 'text-rose-400 font-medium' : days <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                                {days < 0 
                                  ? `⚠️ Scaduta da ${Math.abs(days)} giorni` 
                                  : days === 0 
                                    ? '⏰ Scade oggi!' 
                                    : `Tra ${days} giorni`}
                              </span>
                            )}
                            {rate.paid && rate.paidDate && (
                              <span className="text-emerald-400">
                                ✓ Pagata il {formatDate(rate.paidDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Amount */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-xl font-bold ${rate.paid ? 'text-emerald-400' : status === 'overdue' ? 'text-rose-400' : 'text-slate-100'}`}>
                            €{parseFloat(rate.amount || 0).toLocaleString('it-IT')}
                          </p>
                          {!rate.paid && status === 'overdue' && (
                            <p className="text-xs text-rose-400">Da riscuotere</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </UnifiedCard>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
