import { 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  doc
} from 'firebase/firestore';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../config/tenant';

/**
 * Client Service - Centralizza tutte le operazioni sui clients
 */

// ==================== CLIENTS ====================

export const getClients = async (db, options = {}) => {
  try {
    const { limitCount = 50, startAfterDoc = null, filters = {} } = options;
    
    let q = query(getTenantCollection(db, 'clients'));
    
    // Applica filtri
    if (filters.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    
    if (filters.isArchived !== undefined) {
      q = query(q, where('isArchived', '==', filters.isArchived));
    }
    
    // Ordina per data creazione
    q = query(q, orderBy('createdAt', 'desc'));
    
    // Paginazione
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }
    
    const snapshot = await getDocs(q);
    return {
      clients: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    console.error('Errore getClients:', error);
    throw new Error('Impossibile recuperare i clients: ' + error.message);
  }
};

export const getClient = async (db, clientId) => {
  try {
    const clientRef = doc(getTenantCollection(db, 'clients'), clientId);
    const clientSnap = await getDoc(clientRef);
    
    if (!clientSnap.exists()) {
      throw new Error('Client non trovato');
    }
    
    return { id: clientSnap.id, ...clientSnap.data() };
  } catch (error) {
    console.error('Errore getClient:', error);
    throw new Error('Impossibile recuperare il client: ' + error.message);
  }
};

export const getClientWithDetails = async (db, clientId) => {
  try {
    const client = await getClient(db, clientId);
    
    // Carica subcollections
    const [checks, payments, anamnesi] = await Promise.all([
      getClientChecks(db, clientId),
      getClientPayments(db, clientId),
      getClientAnamnesi(db, clientId)
    ]);
    
    return {
      ...client,
      checks,
      payments,
      anamnesi
    };
  } catch (error) {
    console.error('Errore getClientWithDetails:', error);
    throw new Error('Impossibile recuperare i dettagli del client: ' + error.message);
  }
};

export const createClient = async (db, clientData) => {
  try {
    const docRef = await addDoc(getTenantCollection(db, 'clients'), {
      ...clientData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });
    
    return { id: docRef.id, ...clientData };
  } catch (error) {
    console.error('Errore createClient:', error);
    throw new Error('Impossibile creare il client: ' + error.message);
  }
};

export const updateClient = async (db, clientId, updates) => {
  try {
    const clientRef = doc(getTenantCollection(db, 'clients'), clientId);
    await updateDoc(clientRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    return { id: clientId, ...updates };
  } catch (error) {
    console.error('Errore updateClient:', error);
    throw new Error('Impossibile aggiornare il client: ' + error.message);
  }
};

export const deleteClient = async (db, clientId) => {
  try {
    const clientRef = doc(getTenantCollection(db, 'clients'), clientId);
    await deleteDoc(clientRef);
    
    return { success: true };
  } catch (error) {
    console.error('Errore deleteClient:', error);
    throw new Error('Impossibile eliminare il client: ' + error.message);
  }
};

export const archiveClient = async (db, clientId, archiveSettings = {}) => {
  try {
    const clientRef = doc(getTenantCollection(db, 'clients'), clientId);
    await updateDoc(clientRef, {
      isArchived: true,
      archivedAt: new Date(),
      archiveSettings: {
        blockAppAccess: archiveSettings.blockAppAccess || false,
        blockedScreens: archiveSettings.blockedScreens || [],
        customMessage: archiveSettings.customMessage || '',
        ...archiveSettings
      },
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Errore archiveClient:', error);
    throw new Error('Impossibile archiviare il client: ' + error.message);
  }
};

export const unarchiveClient = async (db, clientId) => {
  try {
    const clientRef = doc(getTenantCollection(db, 'clients'), clientId);
    await updateDoc(clientRef, {
      isArchived: false,
      archivedAt: null,
      archiveSettings: null,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Errore unarchiveClient:', error);
    throw new Error('Impossibile dearchiviare il client: ' + error.message);
  }
};

// ==================== CHECKS ====================

export const getClientChecks = async (db, clientId, limitCount = 50) => {
  try {
    const checksRef = getTenantSubcollection(db, 'clients', clientId, 'checks');
    let q = query(checksRef, orderBy('createdAt', 'desc'));
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // Gestione sicura delle date
      createdAt: doc.data().createdAt?.toDate?.() || null
    }));
  } catch (error) {
    console.error('Errore getClientChecks:', error);
    throw new Error('Impossibile recuperare i check-in: ' + error.message);
  }
};

export const createClientCheck = async (db, clientId, checkData) => {
  try {
    const checksRef = getTenantSubcollection(db, 'clients', clientId, 'checks');
    const docRef = await addDoc(checksRef, {
      ...checkData,
      createdAt: new Date()
    });
    
    return { id: docRef.id, ...checkData };
  } catch (error) {
    console.error('Errore createClientCheck:', error);
    throw new Error('Impossibile creare il check-in: ' + error.message);
  }
};

export const updateClientCheck = async (db, clientId, checkId, updates) => {
  try {
    const checkRef = doc(getTenantSubcollection(db, 'clients', clientId, 'checks'), checkId);
    await updateDoc(checkRef, updates);
    
    return { id: checkId, ...updates };
  } catch (error) {
    console.error('Errore updateClientCheck:', error);
    throw new Error('Impossibile aggiornare il check-in: ' + error.message);
  }
};

// ==================== PAYMENTS ====================

export const getClientPayments = async (db, clientId, limitCount = 50) => {
  try {
    const paymentsRef = getTenantSubcollection(db, 'clients', clientId, 'payments');
    let q = query(paymentsRef, orderBy('paymentDate', 'desc'));
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      paymentDate: doc.data().paymentDate?.toDate?.() || null
    }));
  } catch (error) {
    console.error('Errore getClientPayments:', error);
    throw new Error('Impossibile recuperare i pagamenti: ' + error.message);
  }
};

export const createClientPayment = async (db, clientId, paymentData) => {
  try {
    if (!paymentData.amount || !paymentData.duration || !paymentData.paymentDate) {
      throw new Error('Dati pagamento incompleti');
    }
    
    const paymentsRef = getTenantSubcollection(db, 'clients', clientId, 'payments');
    const docRef = await addDoc(paymentsRef, {
      ...paymentData,
      createdAt: new Date()
    });
    
    return { id: docRef.id, ...paymentData };
  } catch (error) {
    console.error('Errore createClientPayment:', error);
    throw new Error('Impossibile creare il pagamento: ' + error.message);
  }
};

// ==================== ANAMNESI ====================

export const getClientAnamnesi = async (db, clientId, limitCount = 10) => {
  try {
    const anamnesiRef = getTenantSubcollection(db, 'clients', clientId, 'anamnesi');
    let q = query(anamnesiRef, orderBy('createdAt', 'desc'));
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null
    }));
  } catch (error) {
    console.error('Errore getClientAnamnesi:', error);
    throw new Error('Impossibile recuperare le anamnesi: ' + error.message);
  }
};

export const createClientAnamnesi = async (db, clientId, anamnesiData) => {
  try {
    const anamnesiRef = getTenantSubcollection(db, 'clients', clientId, 'anamnesi');
    const docRef = await addDoc(anamnesiRef, {
      ...anamnesiData,
      createdAt: new Date()
    });
    
    return { id: docRef.id, ...anamnesiData };
  } catch (error) {
    console.error('Errore createClientAnamnesi:', error);
    throw new Error('Impossibile creare l\'anamnesi: ' + error.message);
  }
};

// ==================== STATISTICHE ====================

export const getClientsStats = async (db) => {
  try {
    const { clients } = await getClients(db, { limitCount: null });
    
    const stats = {
      total: clients.length,
      active: clients.filter(c => c.isActive).length,
      inactive: clients.filter(c => !c.isActive).length,
      withPayments: 0,
      withChecks: 0,
      withAnamnesi: 0
    };
    
    // Conta clients con subcollections (sample per performance)
    const sampleSize = Math.min(10, clients.length);
    for (let i = 0; i < sampleSize; i++) {
      const client = clients[i];
      const [checks, payments, anamnesi] = await Promise.all([
        getClientChecks(db, client.id, 1),
        getClientPayments(db, client.id, 1),
        getClientAnamnesi(db, client.id, 1)
      ]);
      
      if (checks.length > 0) stats.withChecks++;
      if (payments.length > 0) stats.withPayments++;
      if (anamnesi.length > 0) stats.withAnamnesi++;
    }
    
    return stats;
  } catch (error) {
    console.error('Errore getClientsStats:', error);
    throw new Error('Impossibile recuperare le statistiche: ' + error.message);
  }
};
