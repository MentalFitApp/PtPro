// src/components/calls/CallRequestsPanel.jsx
// Pannello per admin che mostra le richieste di chiamata pendenti dai clienti
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, toDate } from '../../firebase';
import { getTenantCollection, getTenantSubcollection } from '../../config/tenant';
import { Phone, X, Calendar, Clock, User, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CallRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    // Carica tutti i clienti e verifica chi ha una richiesta pendente
    const loadRequests = async () => {
      try {
        const clientsRef = getTenantCollection(db, 'clients');
        const clientsSnap = await getDocs(clientsRef);
        const requestsList = [];
        
        // Per ogni cliente, controlla se ha una richiesta di chiamata
        for (const clientDoc of clientsSnap.docs) {
          const clientData = { id: clientDoc.id, ...clientDoc.data() };
          
          try {
            const callsRef = getTenantSubcollection(db, 'clients', clientDoc.id, 'calls');
            const callsSnap = await getDocs(callsRef);
            
            callsSnap.forEach((reqDoc) => {
              if (reqDoc.id === 'request' && reqDoc.data()?.status === 'pending') {
                requestsList.push({
                  clientId: clientDoc.id,
                  clientName: clientData.name || clientData.email || 'Cliente',
                  clientEmail: clientData.email,
                  requestedAt: reqDoc.data().requestedAt,
                  ...reqDoc.data()
                });
              }
            });
          } catch (err) {
            // Ignora errori per singoli clienti
          }
        }
        
        // Ordina per data richiesta (più recenti prima)
        requestsList.sort((a, b) => {
          const dateA = toDate(a.requestedAt) || new Date(0);
          const dateB = toDate(b.requestedAt) || new Date(0);
          return dateB - dateA;
        });
        
        if (isMounted) {
          setRequests(requestsList);
          setLoading(false);
        }
      } catch (err) {
        console.error('Errore caricamento richieste:', err);
        if (isMounted) setLoading(false);
      }
    };
    
    loadRequests();
    
    // Refresh ogni 30 secondi
    const interval = setInterval(loadRequests, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = async (clientId) => {
    try {
      const requestRef = doc(getTenantSubcollection(db, 'clients', clientId, 'calls'), 'request');
      await deleteDoc(requestRef);
    } catch (err) {
      console.error('Errore dismissing request:', err);
    }
  };

  const handleSchedule = (clientId) => {
    navigate(`/clients/${clientId}`);
  };

  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 animate-pulse">
        <div className="h-20 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null; // Non mostrare nulla se non ci sono richieste
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <Phone size={18} className="text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">Richieste Chiamata</h3>
          <p className="text-xs text-slate-400">{requests.length} cliente{requests.length > 1 ? 'i' : ''} in attesa</p>
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {requests.slice(0, 5).map((req) => {
            const requestDate = toDate(req.requestedAt);
            return (
              <motion.div
                key={req.clientId}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{req.clientName}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {requestDate?.toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) || 'N/D'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleSchedule(req.clientId)}
                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                      title="Vai al cliente"
                    >
                      <Calendar size={14} />
                    </button>
                    <button
                      onClick={() => handleDismiss(req.clientId)}
                      className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400"
                      title="Ignora"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {requests.length > 5 && (
          <p className="text-xs text-center text-slate-500 pt-2">
            +{requests.length - 5} altre richieste
          </p>
        )}
      </div>
    </div>
  );
};

export default CallRequestsPanel;
