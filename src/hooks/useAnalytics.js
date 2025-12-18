// src/hooks/useAnalytics.js
// Hook per statistiche dashboard aggregate con caching e real-time updates

import { useState, useEffect, useMemo, useCallback } from 'react';
import { query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getTenantCollection, getTenantSubcollection } from '../config/tenant';
import { toDate } from '../firebase';

// Utility per date
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateKey = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Hook principale per analytics dashboard
 * @param {Object} options - Opzioni di configurazione
 * @param {boolean} options.realtime - Se true, usa onSnapshot (default: true)
 * @param {number} options.refreshInterval - Intervallo refresh in ms (default: 60000)
 */
export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Dati grezzi
  const [clients, setClients] = useState([]);
  const [checksData, setChecksData] = useState([]);
  
  // Load clients con real-time
  useEffect(() => {
    const clientsRef = getTenantCollection(db, 'clients');
    
    const unsub = onSnapshot(clientsRef, (snap) => {
      const clientsList = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: toDate(d.data().createdAt),
        scadenza: toDate(d.data().scadenza),
        lastActivity: toDate(d.data().lastActivity || d.data().updatedAt)
      }));
      setClients(clientsList);
      setLastUpdated(new Date());
    }, (err) => {
      console.error('Error loading clients:', err);
      setError(err);
    });
    
    return () => unsub();
  }, []);
  
  // Load checks recenti (ultimi 30 giorni)
  useEffect(() => {
    const loadChecks = async () => {
      try {
        const thirtyDaysAgo = getDaysAgo(30);
        const allChecks = [];
        
        // Per ogni cliente, carica i check
        for (const client of clients) {
          try {
            const checksRef = getTenantSubcollection(db, 'clients', client.id, 'checks');
            const q = query(checksRef, orderBy('createdAt', 'desc'), limit(10));
            const snap = await getDocs(q);
            
            snap.docs.forEach(doc => {
              const data = doc.data();
              const createdAt = toDate(data.createdAt);
              if (createdAt && createdAt >= thirtyDaysAgo) {
                allChecks.push({
                  id: doc.id,
                  clientId: client.id,
                  clientName: client.name,
                  createdAt,
                  viewedByCoach: data.viewedByCoach || false,
                  ...data
                });
              }
            });
          } catch (e) {
            // Ignora errori per singolo cliente
          }
        }
        
        setChecksData(allChecks.sort((a, b) => b.createdAt - a.createdAt));
      } catch (err) {
        console.error('Error loading checks:', err);
      }
    };
    
    if (clients.length > 0) {
      loadChecks();
    }
  }, [clients]);
  
  // ============ STATISTICHE CALCOLATE ============
  
  // Statistiche clienti
  const clientStats = useMemo(() => {
    const now = new Date();
    const weekAgo = getDaysAgo(7);
    const monthAgo = getDaysAgo(30);
    
    const total = clients.length;
    const active = clients.filter(c => !c.archived && !c.deleted).length;
    
    // Nuovi questa settimana
    const newThisWeek = clients.filter(c => c.createdAt && c.createdAt >= weekAgo).length;
    const newThisMonth = clients.filter(c => c.createdAt && c.createdAt >= monthAgo).length;
    
    // Scadenze
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = clients.filter(c => {
      if (!c.scadenza) return false;
      return c.scadenza >= now && c.scadenza <= nextWeek;
    }).length;
    
    const expired = clients.filter(c => {
      if (!c.scadenza) return false;
      return c.scadenza < now;
    }).length;
    
    // Clienti inattivi (no check da 7+ giorni)
    const inactive = clients.filter(c => {
      if (!c.lastActivity) return true;
      return c.lastActivity < weekAgo;
    }).length;
    
    return {
      total,
      active,
      newThisWeek,
      newThisMonth,
      expiringSoon,
      expired,
      inactive,
      // Trend (vs settimana scorsa) - placeholder
      trend: newThisWeek > 0 ? `+${newThisWeek}` : '0'
    };
  }, [clients]);
  
  // Statistiche check-in
  const checkStats = useMemo(() => {
    const todayStart = getStartOfDay();
    const yesterday = getDaysAgo(1);
    const weekAgo = getDaysAgo(7);
    const lastWeekStart = getDaysAgo(14);
    
    const todayChecks = checksData.filter(c => c.createdAt >= todayStart).length;
    const yesterdayChecks = checksData.filter(c => 
      c.createdAt >= yesterday && c.createdAt < todayStart
    ).length;
    
    const thisWeekChecks = checksData.filter(c => c.createdAt >= weekAgo).length;
    const lastWeekChecks = checksData.filter(c => 
      c.createdAt >= lastWeekStart && c.createdAt < weekAgo
    ).length;
    
    // Unread
    const unread = checksData.filter(c => !c.viewedByCoach).length;
    
    // Trend
    const trendVsYesterday = todayChecks - yesterdayChecks;
    const trendVsLastWeek = thisWeekChecks - lastWeekChecks;
    
    // Check per giorno (ultimi 7 giorni)
    const dailyChecks = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = getDaysAgo(i);
      const dayEnd = i === 0 ? new Date() : getDaysAgo(i - 1);
      const count = checksData.filter(c => 
        c.createdAt >= dayStart && c.createdAt < dayEnd
      ).length;
      
      dailyChecks.push({
        date: formatDateKey(dayStart),
        day: dayStart.toLocaleDateString('it-IT', { weekday: 'short' }),
        count
      });
    }
    
    return {
      today: todayChecks,
      yesterday: yesterdayChecks,
      thisWeek: thisWeekChecks,
      lastWeek: lastWeekChecks,
      unread,
      trendVsYesterday: trendVsYesterday >= 0 ? `+${trendVsYesterday}` : `${trendVsYesterday}`,
      trendVsLastWeek: trendVsLastWeek >= 0 ? `+${trendVsLastWeek}` : `${trendVsLastWeek}`,
      dailyChecks,
      total: checksData.length
    };
  }, [checksData]);
  
  // Lista clienti con alert
  const alertClients = useMemo(() => {
    const now = new Date();
    const weekAgo = getDaysAgo(7);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const alerts = [];
    
    clients.forEach(client => {
      if (client.archived || client.deleted) return;
      
      // Inattivo da 7+ giorni
      if (!client.lastActivity || client.lastActivity < weekAgo) {
        alerts.push({
          type: 'inactive',
          severity: 'warning',
          clientId: client.id,
          clientName: client.name,
          message: 'Inattivo da 7+ giorni',
          daysInactive: client.lastActivity 
            ? Math.floor((now - client.lastActivity) / (1000 * 60 * 60 * 24))
            : 'N/A'
        });
      }
      
      // Scadenza imminente
      if (client.scadenza && client.scadenza >= now && client.scadenza <= nextWeek) {
        const daysLeft = Math.ceil((client.scadenza - now) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'expiring',
          severity: daysLeft <= 3 ? 'critical' : 'warning',
          clientId: client.id,
          clientName: client.name,
          message: `Scade tra ${daysLeft} giorni`,
          daysLeft
        });
      }
      
      // Scaduto
      if (client.scadenza && client.scadenza < now) {
        const daysExpired = Math.floor((now - client.scadenza) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'expired',
          severity: 'critical',
          clientId: client.id,
          clientName: client.name,
          message: `Scaduto da ${daysExpired} giorni`,
          daysExpired
        });
      }
    });
    
    // Ordina per severità
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [clients]);
  
  // Check non letti con dettagli
  const unreadChecks = useMemo(() => {
    return checksData
      .filter(c => !c.viewedByCoach)
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        clientId: c.clientId,
        clientName: c.clientName,
        createdAt: c.createdAt,
        timeAgo: getTimeAgo(c.createdAt)
      }));
  }, [checksData]);
  
  // Attività recente (timeline)
  const recentActivity = useMemo(() => {
    const activities = [];
    
    // Aggiungi nuovi clienti
    clients
      .filter(c => c.createdAt && c.createdAt >= getDaysAgo(7))
      .forEach(c => {
        activities.push({
          type: 'new_client',
          icon: 'user-plus',
          title: `Nuovo cliente: ${c.name}`,
          subtitle: 'Si è registrato',
          timestamp: c.createdAt,
          color: 'emerald'
        });
      });
    
    // Aggiungi check recenti
    checksData
      .slice(0, 20)
      .forEach(c => {
        activities.push({
          type: 'check',
          icon: 'clipboard-check',
          title: c.clientName,
          subtitle: 'Ha inviato un check-in',
          timestamp: c.createdAt,
          color: c.viewedByCoach ? 'slate' : 'sky',
          unread: !c.viewedByCoach
        });
      });
    
    // Ordina per timestamp
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);
  }, [clients, checksData]);
  
  // Refresh manuale
  const refresh = useCallback(() => {
    setLastUpdated(new Date());
  }, []);
  
  // Set loading false quando abbiamo i dati base
  useEffect(() => {
    if (clients.length >= 0) {
      setLoading(false);
    }
  }, [clients]);
  
  return {
    loading,
    error,
    lastUpdated,
    refresh,
    
    // Statistiche
    clientStats,
    checkStats,
    
    // Liste
    alertClients,
    unreadChecks,
    recentActivity,
    
    // Dati grezzi (per componenti custom)
    clients,
    checksData
  };
}

/**
 * Hook per statistiche singolo cliente
 */
export function useClientAnalytics(clientId) {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  
  useEffect(() => {
    if (!clientId) return;
    
    const loadClientData = async () => {
      try {
        // Load checks
        const checksRef = getTenantSubcollection(db, 'clients', clientId, 'checks');
        const checksSnap = await getDocs(query(checksRef, orderBy('createdAt', 'desc'), limit(50)));
        
        const checksList = checksSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: toDate(doc.data().createdAt)
        }));
        
        setChecks(checksList);
        
        // Estrai misure dai check
        const measurementsList = checksList
          .filter(c => c.weight || c.measurements)
          .map(c => ({
            date: c.createdAt,
            weight: c.weight,
            ...c.measurements
          }));
        
        setMeasurements(measurementsList);
        setLoading(false);
      } catch (err) {
        console.error('Error loading client analytics:', err);
        setLoading(false);
      }
    };
    
    loadClientData();
  }, [clientId]);
  
  // Calcola trend peso
  const weightTrend = useMemo(() => {
    const weightsWithDates = measurements
      .filter(m => m.weight)
      .sort((a, b) => a.date - b.date);
    
    if (weightsWithDates.length < 2) return null;
    
    const first = weightsWithDates[0].weight;
    const last = weightsWithDates[weightsWithDates.length - 1].weight;
    const diff = last - first;
    
    return {
      start: first,
      current: last,
      diff: diff.toFixed(1),
      trend: diff < 0 ? 'down' : diff > 0 ? 'up' : 'stable',
      percentage: ((diff / first) * 100).toFixed(1)
    };
  }, [measurements]);
  
  // Frequenza check-in
  const checkFrequency = useMemo(() => {
    if (checks.length < 2) return null;
    
    const sortedChecks = [...checks].sort((a, b) => a.createdAt - b.createdAt);
    const firstCheck = sortedChecks[0].createdAt;
    const lastCheck = sortedChecks[sortedChecks.length - 1].createdAt;
    
    const daysDiff = Math.max(1, Math.floor((lastCheck - firstCheck) / (1000 * 60 * 60 * 24)));
    const avgPerWeek = ((checks.length / daysDiff) * 7).toFixed(1);
    
    return {
      total: checks.length,
      avgPerWeek,
      lastCheck: lastCheck
    };
  }, [checks]);
  
  return {
    loading,
    checks,
    measurements,
    weightTrend,
    checkFrequency
  };
}

// Utility per "time ago"
function getTimeAgo(date) {
  if (!date) return '';
  
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Adesso';
  if (minutes < 60) return `${minutes} min fa`;
  if (hours < 24) return `${hours} ore fa`;
  if (days === 1) return 'Ieri';
  if (days < 7) return `${days} giorni fa`;
  
  return date.toLocaleDateString('it-IT');
}

export default useAnalytics;
