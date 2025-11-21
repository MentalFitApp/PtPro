/**
 * SuperAdmin Utility Functions
 * 
 * SuperAdmin ha accesso completo a:
 * - Tutti i clienti (di qualsiasi coach/admin)
 * - Tutti i collaboratori e dipendenti
 * - Tutti i report e statistiche
 * - Tutte le configurazioni app
 * - Gestione ruoli (può assegnare admin, coach, superadmin)
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

/**
 * Verifica se l'utente corrente è superadmin
 * @param {string} userId - UID Firebase dell'utente
 * @returns {Promise<boolean>}
 */
export async function isSuperAdmin(userId) {
  if (!userId) return false;
  
  try {
    const superadminRef = doc(db, 'roles', 'superadmins');
    const superadminDoc = await getDoc(superadminRef);
    
    if (!superadminDoc.exists()) return false;
    
    const uids = superadminDoc.data().uids || [];
    return uids.includes(userId);
  } catch (error) {
    console.error('Error checking superadmin status:', error);
    return false;
  }
}

/**
 * Verifica se l'utente corrente è admin
 * @param {string} userId - UID Firebase dell'utente
 * @returns {Promise<boolean>}
 */
export async function isAdmin(userId) {
  if (!userId) return false;
  
  try {
    // SuperAdmin è anche admin
    const isSuperAdminUser = await isSuperAdmin(userId);
    if (isSuperAdminUser) return true;
    
    const adminRef = doc(db, 'roles', 'admins');
    const adminDoc = await getDoc(adminRef);
    
    if (!adminDoc.exists()) return false;
    
    const uids = adminDoc.data().uids || [];
    return uids.includes(userId);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Ottiene info ruolo utente (superadmin > admin > coach > client > collaboratore)
 * @param {string} userId 
 * @returns {Promise<{role: string, isSuperAdmin: boolean, isAdmin: boolean, isCoach: boolean}>}
 */
export async function getUserRole(userId) {
  if (!userId) return { role: 'guest', isSuperAdmin: false, isAdmin: false, isCoach: false };

  try {
    // Check superadmin first (highest privilege)
    const isSuperAdminUser = await isSuperAdmin(userId);
    if (isSuperAdminUser) {
      return { role: 'superadmin', isSuperAdmin: true, isAdmin: true, isCoach: true };
    }

    // Check admin
    const adminRef = doc(db, 'roles', 'admins');
    const adminDoc = await getDoc(adminRef);
    const isAdminUser = adminDoc.exists() && (adminDoc.data().uids || []).includes(userId);
    
    if (isAdminUser) {
      return { role: 'admin', isSuperAdmin: false, isAdmin: true, isCoach: true };
    }

    // Check coach
    const coachRef = doc(db, 'roles', 'coaches');
    const coachDoc = await getDoc(coachRef);
    const isCoachUser = coachDoc.exists() && (coachDoc.data().uids || []).includes(userId);
    
    if (isCoachUser) {
      return { role: 'coach', isSuperAdmin: false, isAdmin: false, isCoach: true };
    }

    // Check client
    const clientRef = doc(db, 'clients', userId);
    const clientDoc = await getDoc(clientRef);
    if (clientDoc.exists()) {
      return { role: 'client', isSuperAdmin: false, isAdmin: false, isCoach: false };
    }

    // Check collaboratore
    const collabRef = doc(db, 'collaboratori', userId);
    const collabDoc = await getDoc(collabRef);
    if (collabDoc.exists()) {
      const collabRole = collabDoc.data().role || 'collaboratore';
      return { role: collabRole.toLowerCase(), isSuperAdmin: false, isAdmin: false, isCoach: false };
    }

    return { role: 'unknown', isSuperAdmin: false, isAdmin: false, isCoach: false };
  } catch (error) {
    console.error('Error getting user role:', error);
    return { role: 'error', isSuperAdmin: false, isAdmin: false, isCoach: false };
  }
}

/**
 * Aggiunge un utente come superadmin (solo superadmin esistente può farlo)
 * @param {string} currentUserId - UID di chi esegue l'operazione
 * @param {string} targetUserId - UID da promuovere
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function addSuperAdmin(currentUserId, targetUserId) {
  try {
    // Verifica che chi esegue sia superadmin
    const isCurrentSuperAdmin = await isSuperAdmin(currentUserId);
    if (!isCurrentSuperAdmin) {
      return { success: false, message: 'Solo un superadmin può assegnare questo ruolo' };
    }

    const superadminRef = doc(db, 'roles', 'superadmins');
    await setDoc(superadminRef, {
      uids: arrayUnion(targetUserId),
      updatedAt: new Date(),
      updatedBy: currentUserId
    }, { merge: true });

    return { success: true, message: 'Superadmin aggiunto con successo' };
  } catch (error) {
    console.error('Error adding superadmin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Rimuove un utente da superadmin
 * @param {string} currentUserId 
 * @param {string} targetUserId 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function removeSuperAdmin(currentUserId, targetUserId) {
  try {
    const isCurrentSuperAdmin = await isSuperAdmin(currentUserId);
    if (!isCurrentSuperAdmin) {
      return { success: false, message: 'Solo un superadmin può revocare questo ruolo' };
    }

    // Impedisci auto-rimozione
    if (currentUserId === targetUserId) {
      return { success: false, message: 'Non puoi rimuovere te stesso come superadmin' };
    }

    const superadminRef = doc(db, 'roles', 'superadmins');
    await updateDoc(superadminRef, {
      uids: arrayRemove(targetUserId),
      updatedAt: new Date(),
      updatedBy: currentUserId
    });

    return { success: true, message: 'Superadmin rimosso con successo' };
  } catch (error) {
    console.error('Error removing superadmin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Cache in-memory per evitare chiamate ripetute
 */
const roleCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

export async function getUserRoleCached(userId) {
  const cached = roleCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const roleData = await getUserRole(userId);
  roleCache.set(userId, { data: roleData, timestamp: Date.now() });
  return roleData;
}

/**
 * Cancella cache ruolo (utile dopo cambio permessi)
 */
export function clearRoleCache(userId = null) {
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
}
