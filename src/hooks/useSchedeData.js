// src/hooks/useSchedeData.js
// Hook centralizzato per caricare dati clienti + schede in modo efficiente
// Mantiene compatibilità multi-tenant leggendo dalle collection corrette

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db, toDate } from '../firebase';
import { getTenantCollection } from '../config/tenant';
import { getDocs } from 'firebase/firestore';

/**
 * Hook per caricare e gestire dati clienti con le loro schede
 * Legge da:
 * - tenants/{tenantId}/clients - lista clienti
 * - tenants/{tenantId}/schede_allenamento - schede allenamento complete
 * - tenants/{tenantId}/schede_alimentazione - schede alimentazione complete
 */
export function useSchedeData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [schedeAllenamento, setSchedeAllenamento] = useState({});
  const [schedeAlimentazione, setSchedeAlimentazione] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);

  // Carica tutti i dati
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Carica in parallelo per performance
      const [clientsSnap, schedeAllenSnap, schedeAlimSnap] = await Promise.all([
        getDocs(getTenantCollection(db, 'clients')),
        getDocs(getTenantCollection(db, 'schede_allenamento')),
        getDocs(getTenantCollection(db, 'schede_alimentazione'))
      ]);

      // Mappa schede allenamento per clientId
      const allenMap = {};
      schedeAllenSnap.docs.forEach(doc => {
        const data = doc.data();
        allenMap[doc.id] = {
          id: doc.id,
          exists: true,
          obiettivo: data.obiettivo || '',
          livello: data.livello || '',
          durataSettimane: data.durataSettimane || '',
          note: data.note || '',
          giorni: data.giorni || {},
          updatedAt: data.updatedAt,
          sentAt: data.sentAt,
        };
      });
      setSchedeAllenamento(allenMap);

      // Mappa schede alimentazione per clientId
      const alimMap = {};
      schedeAlimSnap.docs.forEach(doc => {
        const data = doc.data();
        alimMap[doc.id] = {
          id: doc.id,
          exists: true,
          obiettivo: data.obiettivo || '',
          durataSettimane: data.durataSettimane || '',
          note: data.note || '',
          integrazione: data.integrazione || '',
          giorni: data.giorni || {},
          updatedAt: data.updatedAt,
          publishedAt: data.publishedAt,
        };
      });
      setSchedeAlimentazione(alimMap);

      // Processa clienti con info schede
      const clientsList = clientsSnap.docs
        .filter(doc => {
          const data = doc.data();
          // Escludi eliminati e archiviati
          return !data.isDeleted && !data.isArchived;
        })
        .map(doc => {
          const data = doc.data();
          const clientId = doc.id;
          
          // Determina stato scheda allenamento
          const hasSchedaAllenamento = !!allenMap[clientId];
          const schedaAllenamentoMeta = data.schedaAllenamento || {};
          const allenamentoScadenza = schedaAllenamentoMeta.scadenza 
            ? toDate(schedaAllenamentoMeta.scadenza) 
            : null;
          const allenamentoUpdatedAt = allenMap[clientId]?.updatedAt 
            ? toDate(allenMap[clientId].updatedAt) 
            : null;

          // Determina stato scheda alimentazione
          const hasSchedaAlimentazione = !!alimMap[clientId];
          const schedaAlimentazioneMeta = data.schedaAlimentazione || {};
          const alimentazioneScadenza = schedaAlimentazioneMeta.scadenza 
            ? toDate(schedaAlimentazioneMeta.scadenza) 
            : null;
          const alimentazioneUpdatedAt = alimMap[clientId]?.updatedAt 
            ? toDate(alimMap[clientId].updatedAt) 
            : null;

          // Calcola giorni alla scadenza
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          const giorniAlScadenzaAllenamento = allenamentoScadenza 
            ? Math.ceil((allenamentoScadenza - now) / (1000 * 60 * 60 * 24))
            : null;
          const giorniAlScadenzaAlimentazione = alimentazioneScadenza
            ? Math.ceil((alimentazioneScadenza - now) / (1000 * 60 * 60 * 24))
            : null;

          // Calcola se è nuovo (creato negli ultimi 7 giorni senza schede)
          const createdAt = toDate(data.createdAt || data.startDate);
          const giorniDaCreazione = createdAt 
            ? Math.ceil((now - createdAt) / (1000 * 60 * 60 * 24))
            : null;
          const isNuovo = giorniDaCreazione !== null && 
                          giorniDaCreazione <= 7 && 
                          !hasSchedaAllenamento && 
                          !hasSchedaAlimentazione;

          return {
            id: clientId,
            name: data.name || 'N/D',
            email: data.email || '',
            phone: data.phone || '',
            photoURL: data.photoURL || null,
            createdAt,
            // Scheda Allenamento
            hasSchedaAllenamento,
            allenamentoScadenza,
            allenamentoUpdatedAt,
            giorniAlScadenzaAllenamento,
            allenamentoConsegnata: schedaAllenamentoMeta.consegnata || hasSchedaAllenamento,
            // Scheda Alimentazione
            hasSchedaAlimentazione,
            alimentazioneScadenza,
            alimentazioneUpdatedAt,
            giorniAlScadenzaAlimentazione,
            alimentazioneConsegnata: schedaAlimentazioneMeta.consegnata || hasSchedaAlimentazione,
            // Status
            isNuovo,
            // Per ordinamento
            lastActivity: Math.max(
              allenamentoUpdatedAt?.getTime() || 0,
              alimentazioneUpdatedAt?.getTime() || 0,
              createdAt?.getTime() || 0
            )
          };
        });

      setClients(clientsList);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Errore caricamento dati schede:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica dati all'avvio
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistiche calcolate
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let totaleClienti = clients.length;
    let conAllenamento = 0;
    let conAlimentazione = 0;
    let senzaSchede = 0;
    let nuovi = 0;
    let allenamentoInScadenza = 0;
    let alimentazioneInScadenza = 0;
    let allenamentoScaduto = 0;
    let alimentazioneScaduto = 0;

    clients.forEach(client => {
      if (client.hasSchedaAllenamento) conAllenamento++;
      if (client.hasSchedaAlimentazione) conAlimentazione++;
      if (!client.hasSchedaAllenamento && !client.hasSchedaAlimentazione) senzaSchede++;
      if (client.isNuovo) nuovi++;
      
      // In scadenza (entro 7 giorni)
      if (client.giorniAlScadenzaAllenamento !== null && 
          client.giorniAlScadenzaAllenamento >= 0 && 
          client.giorniAlScadenzaAllenamento <= 7) {
        allenamentoInScadenza++;
      }
      if (client.giorniAlScadenzaAlimentazione !== null && 
          client.giorniAlScadenzaAlimentazione >= 0 && 
          client.giorniAlScadenzaAlimentazione <= 7) {
        alimentazioneInScadenza++;
      }
      
      // Scaduti
      if (client.giorniAlScadenzaAllenamento !== null && client.giorniAlScadenzaAllenamento < 0) {
        allenamentoScaduto++;
      }
      if (client.giorniAlScadenzaAlimentazione !== null && client.giorniAlScadenzaAlimentazione < 0) {
        alimentazioneScaduto++;
      }
    });

    return {
      totaleClienti,
      conAllenamento,
      conAlimentazione,
      conEntrambe: clients.filter(c => c.hasSchedaAllenamento && c.hasSchedaAlimentazione).length,
      senzaSchede,
      nuovi,
      allenamentoInScadenza,
      alimentazioneInScadenza,
      totaleInScadenza: allenamentoInScadenza + alimentazioneInScadenza,
      allenamentoScaduto,
      alimentazioneScaduto,
      totaleScaduti: allenamentoScaduto + alimentazioneScaduto,
    };
  }, [clients]);

  // Funzione di filtro
  const filterClients = useCallback((filterType, searchQuery = '') => {
    let filtered = [...clients];

    // Applica filtro di ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }

    // Applica filtro tipo
    switch (filterType) {
      case 'con-allenamento':
        filtered = filtered.filter(c => c.hasSchedaAllenamento);
        break;
      case 'con-alimentazione':
        filtered = filtered.filter(c => c.hasSchedaAlimentazione);
        break;
      case 'con-entrambe':
        filtered = filtered.filter(c => c.hasSchedaAllenamento && c.hasSchedaAlimentazione);
        break;
      case 'senza-schede':
        filtered = filtered.filter(c => !c.hasSchedaAllenamento && !c.hasSchedaAlimentazione);
        break;
      case 'nuovi':
        filtered = filtered.filter(c => c.isNuovo);
        break;
      case 'allenamento-scade':
        filtered = filtered.filter(c => 
          c.giorniAlScadenzaAllenamento !== null && 
          c.giorniAlScadenzaAllenamento >= 0 && 
          c.giorniAlScadenzaAllenamento <= 7
        );
        break;
      case 'alimentazione-scade':
        filtered = filtered.filter(c => 
          c.giorniAlScadenzaAlimentazione !== null && 
          c.giorniAlScadenzaAlimentazione >= 0 && 
          c.giorniAlScadenzaAlimentazione <= 7
        );
        break;
      case 'scaduti':
        filtered = filtered.filter(c => 
          (c.giorniAlScadenzaAllenamento !== null && c.giorniAlScadenzaAllenamento < 0) ||
          (c.giorniAlScadenzaAlimentazione !== null && c.giorniAlScadenzaAlimentazione < 0)
        );
        break;
      case 'tutti':
      default:
        // Nessun filtro aggiuntivo
        break;
    }

    // Ordina per attività recente
    filtered.sort((a, b) => b.lastActivity - a.lastActivity);

    return filtered;
  }, [clients]);

  return {
    loading,
    error,
    clients,
    schedeAllenamento,
    schedeAlimentazione,
    stats,
    filterClients,
    refresh: loadData,
    lastRefresh
  };
}

export default useSchedeData;
