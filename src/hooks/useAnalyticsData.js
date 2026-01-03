/**
 * Hook per leggere dati analytics pre-aggregati
 * Legge da tenants/{tenantId}/analytics/current
 * I dati sono aggiornati ogni ora dalla Cloud Function aggregateTenantAnalytics
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getTenantDoc } from '../config/tenant';
import { httpsCallable, getFunctions } from 'firebase/functions';

export function useAnalyticsData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sottoscrizione real-time ai dati analytics
  useEffect(() => {
    setLoading(true);
    setError(null);

    const analyticsRef = getTenantDoc(db, 'analytics', 'current');
    
    const unsubscribe = onSnapshot(
      analyticsRef,
      (doc) => {
        if (doc.exists()) {
          const analyticsData = doc.data();
          setData(analyticsData);
          setLastUpdated(analyticsData.updatedAt?.toDate?.() || new Date());
        } else {
          // Nessun dato ancora - prima aggregazione non eseguita
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Errore caricamento analytics:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Funzione per refresh manuale (chiama Cloud Function)
  const refresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      const functions = getFunctions(undefined, 'europe-west1');
      const refreshAnalytics = httpsCallable(functions, 'refreshTenantAnalytics');
      
      const tenantId = sessionStorage.getItem('current_tenant_id');
      if (!tenantId) {
        throw new Error('Tenant ID non trovato');
      }
      
      await refreshAnalytics({ tenantId });
      // I dati si aggiorneranno automaticamente via onSnapshot
    } catch (err) {
      console.error('Errore refresh analytics:', err);
      setError(err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  // Helper per formattazione valuta
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  }, []);

  // Helper per formattazione percentuale
  const formatPercent = useCallback((value) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value || 0}%`;
  }, []);

  // Calcola se ci sono alerts critici
  const hasAlerts = data?.alertCounts 
    ? (data.alertCounts.expiring > 0 || data.alertCounts.inactive > 0 || data.alertCounts.unreadChecks > 0)
    : false;

  const totalAlerts = data?.alertCounts
    ? (data.alertCounts.expiring + data.alertCounts.inactive + data.alertCounts.unreadChecks)
    : 0;

  return {
    // Dati
    data,
    clients: data?.clients || null,
    revenue: data?.revenue || null,
    checks: data?.checks || null,
    alerts: data?.alerts || null,
    alertCounts: data?.alertCounts || null,
    
    // Stato
    loading,
    error,
    lastUpdated,
    refreshing,
    
    // Helpers
    hasAlerts,
    totalAlerts,
    refresh,
    formatCurrency,
    formatPercent,
  };
}

/**
 * Hook per caricare storico analytics (ultimi N giorni)
 */
export function useAnalyticsHistory(days = 7) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const historyData = [];
        const today = new Date();
        
        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const docRef = getTenantDoc(db, 'analytics', `daily_${dateStr}`);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            historyData.push({
              date: dateStr,
              ...docSnap.data()
            });
          }
        }
        
        // Ordina dal più vecchio al più recente
        setHistory(historyData.reverse());
      } catch (err) {
        console.error('Errore caricamento storico analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [days]);

  return { history, loading };
}

export default useAnalyticsData;
