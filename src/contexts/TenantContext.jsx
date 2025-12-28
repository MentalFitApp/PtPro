/**
 * TenantContext - Gestione dinamica del tenant corrente
 * 
 * Questo context permette di:
 * 1. Determinare automaticamente il tenant dell'utente al login
 * 2. Persistere il tenantId in localStorage
 * 3. Fornire il tenantId a tutti i componenti che ne hanno bisogno
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Fallback tenant per retrocompatibilità (usato solo se non si trova un tenant)
const DEFAULT_TENANT_ID = 'biondo-fitness-coach';

const TenantContext = createContext(null);

/**
 * Hook per accedere al tenant corrente
 */
export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * Cerca in quale tenant esiste l'utente
 * Controlla in ordine: clients, collaboratori, roles/admins, roles/coaches
 */
async function findUserTenant(userId) {
  try {
    // Prima controlla se c'è un tenantId salvato nel profilo utente globale
    const globalUserRef = doc(db, 'users', userId);
    const globalUserDoc = await getDoc(globalUserRef);
    if (globalUserDoc.exists() && globalUserDoc.data()?.tenantId) {
      return globalUserDoc.data().tenantId;
    }

    // Altrimenti cerca in tutti i tenant
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      
      // Check if user is a client in this tenant
      try {
        const clientRef = doc(db, 'tenants', tenantId, 'clients', userId);
        const clientDoc = await getDoc(clientRef);
        if (clientDoc.exists()) {
          return tenantId;
        }
      } catch (e) {
        // Continue to next check
      }

      // Check if user is a collaboratore
      try {
        const collabRef = doc(db, 'tenants', tenantId, 'collaboratori', userId);
        const collabDoc = await getDoc(collabRef);
        if (collabDoc.exists()) {
          return tenantId;
        }
      } catch (e) {
        // Continue to next check
      }

      // Check if user is an admin
      try {
        const adminRef = doc(db, 'tenants', tenantId, 'roles', 'admins');
        const adminDoc = await getDoc(adminRef);
        if (adminDoc.exists() && adminDoc.data()?.uids?.includes(userId)) {
          return tenantId;
        }
      } catch (e) {
        // Continue to next check
      }

      // Check if user is a coach
      try {
        const coachRef = doc(db, 'tenants', tenantId, 'roles', 'coaches');
        const coachDoc = await getDoc(coachRef);
        if (coachDoc.exists() && coachDoc.data()?.uids?.includes(userId)) {
          return tenantId;
        }
      } catch (e) {
        // Continue to next check
      }

      // Check if user is a superadmin
      try {
        const superadminRef = doc(db, 'tenants', tenantId, 'roles', 'superadmins');
        const superadminDoc = await getDoc(superadminRef);
        if (superadminDoc.exists() && superadminDoc.data()?.uids?.includes(userId)) {
          return tenantId;
        }
      } catch (e) {
        // Continue to next tenant
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Provider del contesto tenant
 */
export function TenantProvider({ children }) {
  const [tenantId, setTenantId] = useState(() => {
    // Inizializza da localStorage se disponibile
    return localStorage.getItem('tenantId') || DEFAULT_TENANT_ID;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Aggiorna il tenant corrente e lo persiste
   */
  const updateTenant = useCallback((newTenantId) => {
    if (newTenantId && newTenantId !== tenantId) {
      setTenantId(newTenantId);
      localStorage.setItem('tenantId', newTenantId);
    }
  }, [tenantId]);

  /**
   * Cerca e imposta il tenant per l'utente corrente
   */
  const detectTenant = useCallback(async (userId) => {
    if (!userId) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prima controlla localStorage
      const savedTenantId = localStorage.getItem('tenantId');
      
      // Verifica che il tenant salvato sia ancora valido per questo utente
      if (savedTenantId) {
        // Quick check: verifica che l'utente esista ancora in questo tenant
        const clientRef = doc(db, 'tenants', savedTenantId, 'clients', userId);
        const collabRef = doc(db, 'tenants', savedTenantId, 'collaboratori', userId);
        const adminRef = doc(db, 'tenants', savedTenantId, 'roles', 'admins');
        const coachRef = doc(db, 'tenants', savedTenantId, 'roles', 'coaches');
        
        const [clientDoc, collabDoc, adminDoc, coachDoc] = await Promise.all([
          getDoc(clientRef).catch(() => ({ exists: () => false })),
          getDoc(collabRef).catch(() => ({ exists: () => false })),
          getDoc(adminRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) })),
          getDoc(coachRef).catch(() => ({ exists: () => false, data: () => ({ uids: [] }) }))
        ]);

        const isInTenant = clientDoc.exists() || 
                          collabDoc.exists() || 
                          (adminDoc.exists() && adminDoc.data()?.uids?.includes(userId)) ||
                          (coachDoc.exists() && coachDoc.data()?.uids?.includes(userId));

        if (isInTenant) {
          setTenantId(savedTenantId);
          setIsLoading(false);
          return savedTenantId;
        }
      }

      // Se non c'è tenant salvato o non è valido, cerca
      const foundTenantId = await findUserTenant(userId);
      
      if (foundTenantId) {
        updateTenant(foundTenantId);
        setIsLoading(false);
        return foundTenantId;
      }

      // Fallback al default
      updateTenant(DEFAULT_TENANT_ID);
      setIsLoading(false);
      return DEFAULT_TENANT_ID;

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return DEFAULT_TENANT_ID;
    }
  }, [updateTenant]);

  /**
   * Pulisce il tenant (al logout)
   */
  const clearTenant = useCallback(() => {
    localStorage.removeItem('tenantId');
    setTenantId(DEFAULT_TENANT_ID);
  }, []);

  // Auto-detect tenant quando l'auth cambia
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await detectTenant(user.uid);
      } else {
        // Non pulire al logout per mantenere l'esperienza se l'utente ri-logga
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [detectTenant]);

  const value = {
    tenantId,
    isLoading,
    error,
    updateTenant,
    detectTenant,
    clearTenant,
    // Helper per sapere se siamo nel tenant di default
    isDefaultTenant: tenantId === DEFAULT_TENANT_ID
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export default TenantContext;
