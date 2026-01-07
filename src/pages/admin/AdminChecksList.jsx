// src/pages/admin/AdminChecksList.jsx
// Lista tutti i check recenti dei clienti per Admin e Coach
// USA query parallele per caricare tutti i check in modo efficiente
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, startAfter, where } from 'firebase/firestore';
import { db, toDate } from '../../firebase';
import { getTenantCollection, getCurrentTenantId } from '../../config/tenant';
import { motion } from 'framer-motion';
import { 
  Activity, User, Calendar, Scale, TrendingDown, TrendingUp, 
  ArrowRight, Eye, Clock, Search, Filter, Check, Loader2
} from 'lucide-react';
import { useUnreadChecks } from '../../hooks/useUnreadNotifications';
import { UnifiedCard, CardHeaderSimple, CardContent } from '../../components/ui/UnifiedCard';
import { Badge } from '../../components/ui/Badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CHECKS_PER_PAGE = 15;

export default function AdminChecksList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCoachView = location.pathname.startsWith('/coach');
  const [checks, setChecks] = useState([]);
  const [clientsMap, setClientsMap] = useState({}); // Mappa clientId -> clientData
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { unreadIds, markAsRead, markAllAsRead } = useUnreadChecks();

  useEffect(() => {
    loadAllData();
  }, []);

  // Carica TUTTI i check di TUTTI i clienti
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
          name: data.name || data.email,
          email: data.email
        };
      });
      setClientsMap(map);
      
      // 2. Carica TUTTI i check per ogni cliente in parallelo
      const allChecks = [];
      
      const promises = clientsSnap.docs.map(async (clientDoc) => {
        const clientId = clientDoc.id;
        const clientInfo = map[clientId] || {};
        
        try {
          const checksRef = collection(db, `tenants/${getCurrentTenantId()}/clients/${clientId}/checks`);
          const checksQuery = query(checksRef, orderBy('createdAt', 'desc'));
          const checksSnap = await getDocs(checksQuery);
          
          return checksSnap.docs.map(checkDoc => {
            const checkData = checkDoc.data();
            return {
              id: checkDoc.id,
              clientId,
              clientName: clientInfo.name || 'Cliente',
              clientEmail: clientInfo.email || '',
              ...checkData,
              createdAt: toDate(checkData.createdAt),
            };
          });
        } catch (err) {
          console.warn(`Errore caricamento checks per ${clientId}:`, err);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(checksArray => allChecks.push(...checksArray));
      
      // 3. Ordina tutti per data decrescente
      allChecks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setChecks(allChecks);
    } catch (error) {
      console.error('Errore caricamento checks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtra per ricerca
  const filteredChecks = useMemo(() => {
    if (!searchQuery) return checks;
    const q = searchQuery.toLowerCase();
    return checks.filter(c => 
      c.clientName?.toLowerCase().includes(q) ||
      c.clientEmail?.toLowerCase().includes(q)
    );
  }, [checks, searchQuery]);

  // Paginazione
  const totalPages = Math.ceil(filteredChecks.length / CHECKS_PER_PAGE);
  const paginatedChecks = useMemo(() => {
    const start = (currentPage - 1) * CHECKS_PER_PAGE;
    return filteredChecks.slice(start, start + CHECKS_PER_PAGE);
  }, [filteredChecks, currentPage]);

  // Reset pagina quando cambia la ricerca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // L'unreadIds contiene "clientId_checkId"
  const isUnread = (check) => unreadIds.includes(`${check.clientId}_${check.id}`);

  const handleViewCheck = (check) => {
    markAsRead(`${check.clientId}_${check.id}`);
    const basePath = isCoachView ? '/coach/client' : '/client';
    navigate(`${basePath}/${check.clientId}?tab=check`);
  };

  // Statistiche rapide
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      total: checks.length,
      thisWeek: checks.filter(c => c.createdAt && c.createdAt >= weekStart).length,
      thisMonth: checks.filter(c => c.createdAt && c.createdAt >= monthStart).length,
      unread: unreadIds.length
    };
  }, [checks, unreadIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-64 bg-slate-800 rounded-lg" />
            <div className="h-96 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="text-blue-400" />
              Check Recenti
              {unreadIds.length > 0 && (
                <span className="px-2.5 py-1 bg-blue-500 text-white text-sm rounded-full">
                  {unreadIds.length} nuovi
                </span>
              )}
            </h1>
            <p className="text-slate-400 mt-1">
              {stats.total} check totali • {stats.thisWeek} questa settimana • {stats.thisMonth} questo mese
            </p>
          </div>
          
          {unreadIds.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-sm"
            >
              <Check size={16} />
              Segna tutti come letti
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-400">Check totali</div>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="text-2xl font-bold text-purple-400">{stats.thisWeek}</div>
            <div className="text-sm text-slate-400">Questa settimana</div>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="text-2xl font-bold text-cyan-400">{stats.thisMonth}</div>
            <div className="text-sm text-slate-400">Questo mese</div>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="text-2xl font-bold text-blue-400">{stats.unread}</div>
            <div className="text-sm text-slate-400">Non letti</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cerca per nome cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Checks List */}
        <UnifiedCard>
          <CardContent>
            {filteredChecks.length === 0 && !loading ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="mx-auto mb-4 text-slate-600" size={48} />
                <p>Nessun check trovato</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedChecks.map((check, idx) => {
                  const unread = isUnread(check);
                  
                  return (
                    <motion.div
                      key={`${check.clientId}_${check.id}` || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                      onClick={() => handleViewCheck(check)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-blue-500/50 ${
                        unread 
                          ? 'bg-blue-500/10 border-blue-500/30' 
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-lg ${unread ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
                            <Activity size={20} className={unread ? 'text-blue-400' : 'text-slate-400'} />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{check.clientName}</span>
                              {unread && (
                                <Badge variant="primary" size="sm">Nuovo</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {check.createdAt?.toLocaleDateString('it-IT') || 'N/D'}
                              </span>
                              {check.weight && (
                                <span className="flex items-center gap-1">
                                  <Scale size={12} />
                                  {check.weight} kg
                                </span>
                              )}
                              {check.bodyFat && (
                                <span className="text-cyan-400">BF: {check.bodyFat}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <ArrowRight size={18} className="text-slate-500" />
                      </div>
                    </motion.div>
                  );
                })}

                {/* Paginazione */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-700 mt-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center gap-2">
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
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
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
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                    
                    <span className="text-sm text-slate-400 ml-2">
                      Pagina {currentPage} di {totalPages}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </UnifiedCard>
      </div>
    </div>
  );
}
