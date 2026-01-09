// src/hooks/useRevenueGoal.js
// Hook per gestire il revenue goal condiviso a livello tenant
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTenantId } from '../config/tenant';

/**
 * Hook per gestire il revenue goal mensile condiviso a livello tenant
 * @returns {Object} { revenueGoal, revenueType, setRevenueGoal, loading }
 */
export function useRevenueGoal() {
  const [revenueGoal, setRevenueGoalState] = useState(10000); // Default 10k
  const [revenueType, setRevenueTypeState] = useState('all'); // 'all', 'regular', 'renewals'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      setLoading(false);
      return;
    }

    // Ascolta le modifiche al documento settings del tenant
    const settingsRef = doc(db, `tenants/${tenantId}/settings/revenueGoal`);
    
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setRevenueGoalState(data.goal || 10000);
          setRevenueTypeState(data.type || 'all');
        } else {
          // Se non esiste, crealo con il valore di default
          setDoc(settingsRef, { goal: 10000, type: 'all' }, { merge: true }).catch(console.error);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading revenue goal:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Funzione per aggiornare il goal e il tipo
  const setRevenueGoal = async (newGoal, newType = null) => {
    const tenantId = getCurrentTenantId();
    if (!tenantId) return;

    try {
      const goalValue = parseInt(newGoal, 10);
      if (isNaN(goalValue) || goalValue < 0) {
        console.error('Invalid goal value:', newGoal);
        return;
      }

      const settingsRef = doc(db, `tenants/${tenantId}/settings/revenueGoal`);
      const updateData = { goal: goalValue };
      if (newType !== null) {
        updateData.type = newType;
      }
      
      await setDoc(settingsRef, updateData, { merge: true });
      setRevenueGoalState(goalValue);
      if (newType !== null) {
        setRevenueTypeState(newType);
      }
    } catch (error) {
      console.error('Error updating revenue goal:', error);
    }
  };

  return { revenueGoal, revenueType, setRevenueGoal, loading };
}
