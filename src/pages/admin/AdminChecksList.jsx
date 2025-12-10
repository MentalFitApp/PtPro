// src/pages/admin/AdminChecksList.jsx
// Lista tutti i check recenti dei clienti per Admin e Coach
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, collectionGroup } from 'firebase/firestore';
import { db, toDate } from '../../firebase';
import { getTenantCollection, CURRENT_TENANT_ID } from '../../config/tenant';
import { motion } from 'framer-motion';
import { 
  Activity, User, Calendar, Scale, TrendingDown, TrendingUp, 
  ArrowRight, Eye, Clock, Search, Filter, Check
} from 'lucide-react';
import { useUnreadChecks } from '../../hooks/useUnreadNotifications';
import { UnifiedCard, CardHeaderSimple, CardContent, Badge } from '../../components/ui/UnifiedCard';

export default function AdminChecksList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCoachView = location.pathname.startsWith('/coach');
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadIds, markAsRead, markAllAsRead } = useUnreadChecks();

  useEffect(() => {
    loadAllChecks();
  }, []);

  const loadAllChecks = async () => {
    try {
      setLoading(true);
      
      // Carica tutti i clienti
      const clientsRef = getTenantCollection(db, 'clients');
      const clientsSnap = await getDocs(clientsRef);
      
      const allChecks = [];
      
      // Per ogni cliente, carica i suoi check recenti
      for (const clientDoc of clientsSnap.docs) {
        const clientData = clientDoc.data();
        if (clientData.isOldClient) continue;
        
        const checksRef = collection(db, `tenants/${CURRENT_TENANT_ID}/clients/${clientDoc.id}/checks`);
        const checksQuery = query(checksRef, orderBy('createdAt', 'desc'), limit(5));
        const checksSnap = await getDocs(checksQuery);
        
        checksSnap.docs.forEach(checkDoc => {
          const checkData = checkDoc.data();
          allChecks.push({
            id: checkDoc.id,
            clientId: clientDoc.id,
            clientName: clientData.name || clientData.email,
            clientEmail: clientData.email,
            ...checkData,
            createdAt: toDate(checkData.createdAt),
          });
        });
      }
      
      // Ordina per data decrescente
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

  // L'unreadIds contiene "clientId_checkId"
  const isUnread = (check) => unreadIds.includes(`${check.clientId}_${check.id}`);

  const handleViewCheck = (check) => {
    markAsRead(`${check.clientId}_${check.id}`); // Usa formato combinato
    // Naviga al ClientDetail con tab check
    const basePath = isCoachView ? '/coach/client' : '/client';
    navigate(`${basePath}/${check.clientId}?tab=check`);
  };

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
            <p className="text-slate-400 mt-1">Visualizza i check-in dei tuoi clienti</p>
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
            {filteredChecks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="mx-auto mb-4 text-slate-600" size={48} />
                <p>Nessun check trovato</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChecks.slice(0, 50).map((check, idx) => {
                  const unread = isUnread(check); // Passa l'intero oggetto check
                  
                  return (
                    <motion.div
                      key={`${check.clientId}_${check.id}` || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
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
              </div>
            )}
          </CardContent>
        </UnifiedCard>
      </div>
    </div>
  );
}
