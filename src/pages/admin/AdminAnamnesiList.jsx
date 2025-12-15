// src/pages/admin/AdminAnamnesiList.jsx
// Lista tutte le anamnesi recenti dei clienti per Admin e Coach
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, toDate } from '../../firebase';
import { getTenantCollection, CURRENT_TENANT_ID } from '../../config/tenant';
import { motion } from 'framer-motion';
import { 
  FileText, User, Calendar, ArrowRight, Check, Search, 
  ClipboardList, Activity, Heart, AlertCircle
} from 'lucide-react';
import { useUnreadAnamnesi } from '../../hooks/useUnreadNotifications';
import { UnifiedCard, CardHeaderSimple, CardContent } from '../../components/ui/UnifiedCard';
import { Badge } from '../../components/ui/Badge';

export default function AdminAnamnesiList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCoachView = location.pathname.startsWith('/coach');
  const [anamnesiList, setAnamnesiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadIds, markAsRead, markAllAsRead } = useUnreadAnamnesi();

  useEffect(() => {
    loadAllAnamnesi();
  }, []);

  const loadAllAnamnesi = async () => {
    try {
      setLoading(true);
      
      // Carica tutti i clienti
      const clientsRef = getTenantCollection(db, 'clients');
      const clientsSnap = await getDocs(clientsRef);
      
      const allAnamnesi = [];
      
      // Per ogni cliente, controlla se ha anamnesi compilata
      for (const clientDoc of clientsSnap.docs) {
        const clientData = clientDoc.data();
        // Mostra anamnesi di tutti i clienti (anche storici e archiviati)
        
        // Controlla anamnesi principale (salvata come 'initial')
        const anamRef = doc(db, `tenants/${CURRENT_TENANT_ID}/clients/${clientDoc.id}/anamnesi/initial`);
        const anamSnap = await getDoc(anamRef);
        
        if (anamSnap.exists()) {
          const anamData = anamSnap.data();
          allAnamnesi.push({
            id: anamSnap.id,
            clientId: clientDoc.id,
            clientName: clientData.name || clientData.email,
            clientEmail: clientData.email,
            ...anamData,
            updatedAt: toDate(anamData.submittedAt || anamData.updatedAt || anamData.completedAt || anamData.createdAt),
          });
        }
      }
      
      // Ordina per data aggiornamento decrescente
      allAnamnesi.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      
      setAnamnesiList(allAnamnesi);
    } catch (error) {
      console.error('Errore caricamento anamnesi:', error);
    } finally {
      setLoading(false);
    }
  };

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
            {filteredAnamnesi.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="mx-auto mb-4 text-slate-600" size={48} />
                <p>Nessuna anamnesi trovata</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAnamnesi.slice(0, 50).map((anam, idx) => {
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
              </div>
            )}
          </CardContent>
        </UnifiedCard>
      </div>
    </div>
  );
}
