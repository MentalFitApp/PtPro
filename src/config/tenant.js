/**
 * Configurazione tenant corrente - SISTEMA DINAMICO
 * 
 * Il tenant viene determinato automaticamente al login e salvato in localStorage.
 * Le funzioni helper usano sempre il tenant corrente dinamicamente.
 * 
 * Per usare il TenantContext nei componenti React:
 * import { useTenant } from '../contexts/TenantContext';
 * const { tenantId } = useTenant();
 */

import { collection, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';

// Fallback tenant per retrocompatibilità
export const DEFAULT_TENANT_ID = 'biondo-fitness-coach';

/**
 * Ottiene il tenant ID corrente
 * Priorità: localStorage > sessionStorage > default
 */
export function getCurrentTenantId() {
  // Prima controlla localStorage (persistente)
  const storedTenantId = localStorage.getItem('tenantId');
  if (storedTenantId) {
    return storedTenantId;
  }
  
  // Fallback a sessionStorage (per sessione)
  const sessionTenantId = sessionStorage.getItem('tenantId');
  if (sessionTenantId) {
    return sessionTenantId;
  }
  
  // Fallback finale
  return DEFAULT_TENANT_ID;
}

/**
 * @deprecated Usa getCurrentTenantId() per valore dinamico
 * Questa costante è mantenuta per retrocompatibilità ma restituisce
 * il valore al momento dell'import, non dinamicamente.
 * Per codice nuovo, usare getCurrentTenantId() nelle funzioni.
 */
export const CURRENT_TENANT_ID = DEFAULT_TENANT_ID;

/**
 * Imposta il tenant ID corrente
 */
export function setCurrentTenantId(tenantId) {
  if (tenantId) {
    localStorage.setItem('tenantId', tenantId);
    sessionStorage.setItem('tenantId', tenantId);
    console.log('🏢 Tenant impostato:', tenantId);
  }
}

/**
 * Pulisce il tenant ID (da usare al logout)
 */
export function clearCurrentTenantId() {
  localStorage.removeItem('tenantId');
  sessionStorage.removeItem('tenantId');
  console.log('🧹 Tenant pulito');
}

// ============ HELPER FUNCTIONS ============

/**
 * Helper per costruire path tenant
 */
export function getTenantPath(collectionName) {
  const tenantId = getCurrentTenantId();
  return `tenants/${tenantId}/${collectionName}`;
}

/**
 * Ottiene una collection all'interno del tenant corrente
 * @param {Firestore} db - Istanza Firestore
 * @param {string} collectionName - Nome della collection
 * @returns {CollectionReference}
 */
export function getTenantCollection(db, collectionName) {
  const tenantId = getCurrentTenantId();
  return collection(db, 'tenants', tenantId, collectionName);
}

/**
 * Ottiene un documento all'interno del tenant corrente
 * @param {Firestore} db - Istanza Firestore
 * @param {string} collectionName - Nome della collection
 * @param {string} docId - ID del documento
 * @returns {DocumentReference}
 */
export function getTenantDoc(db, collectionName, docId) {
  const tenantId = getCurrentTenantId();
  return doc(db, 'tenants', tenantId, collectionName, docId);
}

/**
 * Ottiene una subcollection all'interno del tenant corrente
 * @param {Firestore} db - Istanza Firestore
 * @param {string} parentCollection - Collection padre
 * @param {string} parentId - ID del documento padre
 * @param {string} subcollection - Nome della subcollection
 * @returns {CollectionReference}
 */
export function getTenantSubcollection(db, parentCollection, parentId, subcollection) {
  const tenantId = getCurrentTenantId();
  return collection(db, 'tenants', tenantId, parentCollection, parentId, subcollection);
}

/**
 * Ottiene l'ID del coach/admin del tenant corrente
 */
export async function getCoachId() {
  try {
    const role = sessionStorage.getItem('app_role');
    
    // Se l'utente corrente è admin/coach, ritorna il suo ID
    if (role === 'admin' || role === 'coach') {
      return auth.currentUser?.uid || null;
    }
    
    return null;
  } catch (error) {
    console.error('Errore getCoachId:', error);
    return null;
  }
}

// ============ UTILITY AVANZATE ============

/**
 * Crea riferimenti per un tenant specifico (utile per operazioni cross-tenant)
 * @param {string} specificTenantId - ID del tenant specifico
 */
export function createTenantHelpers(specificTenantId) {
  return {
    getCollection: (db, collectionName) => 
      collection(db, 'tenants', specificTenantId, collectionName),
    
    getDoc: (db, collectionName, docId) => 
      doc(db, 'tenants', specificTenantId, collectionName, docId),
    
    getSubcollection: (db, parentCollection, parentId, subcollection) => 
      collection(db, 'tenants', specificTenantId, parentCollection, parentId, subcollection),
    
    getPath: (collectionName) => 
      `tenants/${specificTenantId}/${collectionName}`
  };
}

// ============ DEBUG ============

/**
 * Debug: mostra info sul tenant corrente
 */
export function debugTenantInfo() {
  const tenantId = getCurrentTenantId();
  console.group('🏢 Tenant Info');
  console.log('Current Tenant ID:', tenantId);
  console.log('localStorage:', localStorage.getItem('tenantId'));
  console.log('sessionStorage:', sessionStorage.getItem('tenantId'));
  console.log('Default:', DEFAULT_TENANT_ID);
  console.log('Is Default:', tenantId === DEFAULT_TENANT_ID);
  console.groupEnd();
  return tenantId;
}

// Esponi la funzione di debug globalmente in development
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  window.debugTenant = debugTenantInfo;
}
