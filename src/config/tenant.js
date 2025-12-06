// Configurazione tenant corrente
// Dopo la migrazione multi-tenant, questo file determina quale tenant è attivo

import { collection, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';

export const CURRENT_TENANT_ID = 'biondo-fitness-coach';

// Helper per costruire path tenant
export function getTenantPath(collectionName) {
  return `tenants/${CURRENT_TENANT_ID}/${collectionName}`;
}

export function getTenantCollection(db, collectionName) {
  // Uso: getTenantCollection(db, 'users')
  // Ritorna: collection(db, 'tenants', 'biondo-fitness-coach', 'users')
  return collection(db, 'tenants', CURRENT_TENANT_ID, collectionName);
}

export function getTenantDoc(db, collectionName, docId) {
  // Uso: getTenantDoc(db, 'users', 'userId123')
  // Ritorna: doc(db, 'tenants', 'biondo-fitness-coach', 'users', 'userId123')
  return doc(db, 'tenants', CURRENT_TENANT_ID, collectionName, docId);
}

export function getTenantSubcollection(db, parentCollection, parentId, subcollection) {
  // Uso: getTenantSubcollection(db, 'clients', 'clientId', 'anamnesi')
  // Ritorna: collection(db, 'tenants', 'biondo-fitness-coach', 'clients', 'clientId', 'anamnesi')
  return collection(db, 'tenants', CURRENT_TENANT_ID, parentCollection, parentId, subcollection);
}

// Ottieni l'ID del coach/admin del tenant corrente
export async function getCoachId() {
  try {
    // In un sistema single-tenant come questo, il coach è l'utente con ruolo admin
    // Possiamo recuperarlo dalla sessione o da Firestore
    const role = sessionStorage.getItem('app_role');
    
    // Se l'utente corrente è admin/coach, ritorna il suo ID
    if (role === 'admin' || role === 'coach') {
      return auth.currentUser?.uid || null;
    }
    
    // Per i clienti, ritorna l'ID del tenant owner
    // In futuro si può espandere per recuperare da Firestore
    return null;
  } catch (error) {
    console.error('Errore getCoachId:', error);
    return null;
  }
}

// Esempio di migrazione query:

// PRIMA (single-tenant):
// const usersRef = collection(db, 'users');

// DOPO (multi-tenant):
// import { getTenantCollection } from './config/tenant';
// const usersRef = getTenantCollection(db, 'users');

// PRIMA:
// const userRef = doc(db, 'users', userId);

// DOPO:
// import { getTenantDoc } from './config/tenant';
// const userRef = getTenantDoc(db, 'users', userId);

// PRIMA:
// const anamnesiRef = collection(db, 'clients', clientId, 'anamnesi');

// DOPO:
// import { getTenantSubcollection } from './config/tenant';
// const anamnesiRef = getTenantSubcollection(db, 'clients', clientId, 'anamnesi');
