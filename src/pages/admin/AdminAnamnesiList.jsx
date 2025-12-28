// src/pages/admin/AdminAnamnesiList.jsx
// Lista tutte le anamnesi recenti dei clienti per Admin e Coach
// OTTIMIZZATO: Paginazione + Query parallele + Caricamento incrementale
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, getDoc, limit, startAfter, where } from 'firebase/firestore';
import { db, toDate } from '../../firebase';
import { getTenantCollection, CURRENT_TENANT_ID } from '../../config/tenant';
import { motion } from 'framer-motion';
import { 
  FileText, User, Calendar, ArrowRight, Check, Search, 
  ClipboardList, Activity, Heart, AlertCircle, Loader2
} from 'lucide-react';
import { useUnreadAnamnesi } from '../../hooks/useUnreadNotifications';
import { UnifiedCard, CardHeaderSimple, CardContent } from '../../components/ui/UnifiedCard';
import { Badge } from '../../components/ui/Badge';

// Costanti per paginazione
const BATCH_SIZE = 20; // Numero di clienti per batch
const PARALLEL_QUERIES = 5; // Query parallele alla volta

export default function AdminAnamnesiList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCoachView = location.pathname.startsWith('/coach');
  const [anamnesiList, setAnamnesiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const { unreadIds, markAsRead, markAllAsRead } = useUnreadAnamnesi();
  
  // Cache per i clienti già caricati
  const loadedClientsRef = useRef(new Set());
  const allClientsRef = useRef([]);

  useEffect(() => {
    loadInitialAnamnesi();
  }, []);

  // Funzione per caricare anamnesi in batch con query parallele
  const fetchAnamnesiForClients = async (clientDocs) => {
    const results = [];
    
    // Processa in batch paralleli per velocizzare
    for (let i = 0; i < clientDocs.length; i += PARALLEL_QUERIES) {
      const batch = clientDocs.slice(i, i + PARALLEL_QUERIES);
      
      const batchPromises = batch.map(async (clientDoc) => {
        const clientData = clientDoc.data();
        const clientId = clientDoc.id;
        
        // Salta se già caricato
        if (loadedClientsRef.current.has(clientId)) {
          return null;
        }
        
        try {
          const anamRef = doc(db, `tenants/${CURRENT_TENANT_ID}/clients/${clientId}/anamnesi/initial`);
          const anamSnap = await getDoc(anamRef);
          
          loadedClientsRef.current.add(clientId);
          
          if (anamSnap.exists()) {
            const anamData = anamSnap.data();
            return {
              id: anamSnap.id,
              clientId,
              clientName: clientData.name || clientData.email,
              clientEmail: clientData.email,
              ...anamData,
              updatedAt: toDate(anamData.submittedAt || anamData.updatedAt || anamData.completedAt || anamData.createdAt),
            };
          }
        } catch (err) {
          console.warn(`Errore caricamento anamnesi per ${clientId}:`, err);
        }
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean));
    }
    
    return results;
  };

  const loadInitialAnamnesi = async () => {
    try {
      setLoading(true);
      loadedClientsRef.current.clear();
      
      // Carica solo i primi clienti (ordinati per data creazione più recente se possibile)
      const clientsRef = getTenantCollection(db, 'clients');
      const clientsSnap = await getDocs(clientsRef);
      
      // Memorizza tutti i clienti per il caricamento successivo
      allClientsRef.current = clientsSnap.docs;
      
      // Carica solo il primo batch
      const firstBatch = clientsSnap.docs.slice(0, BATCH_SIZE);
      const anamnesiResults = await fetchAnamnesiForClients(firstBatch);
      
      // Ordina per data aggiornamento decrescente
      anamnesiResults.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      
      setAnamnesiList(anamnesiResults);
      setHasMore(clientsSnap.docs.length > BATCH_SIZE);
    } catch (error) {
      console.error('Errore caricamento anamnesi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carica più anamnesi quando l'utente scrolla o clicca "Carica altri"
  const loadMoreAnamnesi = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      
      const loadedCount = loadedClientsRef.current.size;
      const remainingClients = allClientsRef.current.filter(
        doc => !loadedClientsRef.current.has(doc.id)
      );
      
      if (remainingClients.length === 0) {
        setHasMore(false);
        return;
      }
      
      const nextBatch = remainingClients.slice(0, BATCH_SIZE);
      const newAnamnesi = await fetchAnamnesiForClients(nextBatch);
      
      setAnamnesiList(prev => {
        const combined = [...prev, ...newAnamnesi];
        combined.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        return combined;
      });
      
      setHasMore(remainingClients.length > BATCH_SIZE);
    } catch (error) {
      console.error('Errore caricamento altre anamnesi:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  // Filtra per ricerca
  const filteredAnamnesi = useMemo(() => {
    if (!searchQuery) return anamnesiList;
    const q = searchQuery.toLowerCase();
    return anamnesiList.filter(a => 
      a.clientName?.toLowerCase().includes(q) ||
      a.clientEmail?.toLowerCase().includes(q)
    );
  }, [anamnesiList, searchQuery]);

  // L'unreadIds ora contiene clientId, non docId
  const isUnread = (clientId) => unreadIds.includes(clientId);

  const handleViewAnamnesi = (anam) => {
    markAsRead(anam.clientId); // Usa clientId
    // Naviga al ClientDetail con tab anamnesi
    const basePath = isCoachView ? '/coach/client' : '/client';
    navigate(`${basePath}/${anam.clientId}?tab=anamnesi`);
  };

  // Calcola completezza anamnesi basata sui campi flat
  const getCompleteness = (anam) => {
    // Campi principali del form anamnesi
    const fields = [
      // Dati anagrafici
      'firstName', 'lastName', 'birthDate', 'gender', 'weight', 'height',
      // Abitudini alimentari
      'mealsPerDay', 'desiredFoods', 'dislikedFoods',
      // Allenamento
      'workoutsPerWeek', 'trainingDetails',
      // Obiettivi
      'goals'
    ];
    let filled = 0;
    fields.forEach(f => {
      if (anam[f] && anam[f] !== '') filled++;
    });
    return Math.round((filled / fields.length) * 100);
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
              <FileText className="text-purple-400" />
              Anamnesi Recenti
              {unreadIds.length > 0 && (
                <span className="px-2.5 py-1 bg-purple-500 text-white text-sm rounded-full">
                  {unreadIds.length} nuove
                </span>
              )}
            </h1>
            <p className="text-slate-400 mt-1">Visualizza le anamnesi compilate dai tuoi clienti</p>
          </div>
          
          {unreadIds.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-sm"
            >
              <Check size={16} />
              Segna tutte come lette
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
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Anamnesi List */}
        <UnifiedCard>
          <CardContent>
            {filteredAnamnesi.length === 0 && !loading ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="mx-auto mb-4 text-slate-600" size={48} />
                <p>Nessuna anamnesi trovata</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAnamnesi.map((anam, idx) => {
                  const unread = isUnread(anam.clientId); // Usa clientId
                  const completeness = getCompleteness(anam);
                  
                  return (
                    <motion.div
                      key={anam.clientId || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => handleViewAnamnesi(anam)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-purple-500/50 ${
                        unread 
                          ? 'bg-purple-500/10 border-purple-500/30' 
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-lg ${unread ? 'bg-purple-500/20' : 'bg-slate-700'}`}>
                            <FileText size={20} className={unread ? 'text-purple-400' : 'text-slate-400'} />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{anam.clientName}</span>
                              {unread && (
                                <Badge variant="primary" className="bg-purple-500" size="sm">Nuova</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {anam.updatedAt?.toLocaleDateString('it-IT') || 'N/D'}
                              </span>
                              <span className={`flex items-center gap-1 ${
                                completeness === 100 ? 'text-green-400' : 
                                completeness >= 50 ? 'text-yellow-400' : 'text-slate-400'
                              }`}>
                                <ClipboardList size={12} />
                                {completeness}% completata
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <ArrowRight size={18} className="text-slate-500" />
                      </div>
                      
                      {/* Quick preview icons */}
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        {anam.datiGenerali && (
                          <span className="flex items-center gap-1">
                            <User size={12} className="text-blue-400" />
                            Dati generali
                          </span>
                        )}
                        {anam.obiettivi && (
                          <span className="flex items-center gap-1">
                            <Activity size={12} className="text-green-400" />
                            Obiettivi
                          </span>
                        )}
                        {anam.salute && (
                          <span className="flex items-center gap-1">
                            <Heart size={12} className="text-red-400" />
                            Salute
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Pulsante Carica Altri */}
                {hasMore && !searchQuery && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={loadMoreAnamnesi}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 mx-auto"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Caricamento...
                        </>
                      ) : (
                        <>
                          Carica altre anamnesi
                        </>
                      )}
                    </button>
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
