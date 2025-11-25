import { collection, doc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { deleteUser } from 'firebase/auth';
import { logger } from './logger';

/**
 * Esporta tutti i dati di un utente (GDPR Art. 20)
 * @param {string} userId - UID dell'utente
 * @param {string} tenantId - ID del tenant
 * @returns {Promise<Object>} Dati completi dell'utente
 */
export async function exportUserData(userId, tenantId) {
  try {
    const userData = {
      exportDate: new Date().toISOString(),
      userId,
      tenantId,
      data: {}
    };

    // 1. Dati profilo cliente
    const clientRef = doc(db, `tenants/${tenantId}/clients`, userId);
    const clientSnap = await getDoc(clientRef);
    if (clientSnap.exists()) {
      userData.data.profile = clientSnap.data();
    }

    // 2. Anamnesi (subcollection di clients)
    try {
      const anamCollectionRef = collection(db, `tenants/${tenantId}/clients/${userId}/anamnesi`);
      const anamSnap = await getDocs(anamCollectionRef);
      userData.data.anamnesi = anamSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      logger.info('Anamnesi not found, skipping');
      userData.data.anamnesi = [];
    }

    // 3. Check (subcollection di clients)
    try {
      const checksCollectionRef = collection(db, `tenants/${tenantId}/clients/${userId}/checks`);
      const checkSnap = await getDocs(checksCollectionRef);
      userData.data.checks = checkSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      logger.info('Checks not found, skipping');
      userData.data.checks = [];
    }

    // 4. Pagamenti (subcollection di clients)
    try {
      const paymentsCollectionRef = collection(db, `tenants/${tenantId}/clients/${userId}/payments`);
      const paymentsSnap = await getDocs(paymentsCollectionRef);
      userData.data.payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      logger.info('Payments not found, skipping');
      userData.data.payments = [];
    }

    // 5. Schede Alimentazione (subcollection di clients)
    try {
      const alimentazioneCollectionRef = collection(db, `tenants/${tenantId}/clients/${userId}/schedeAlimentazione`);
      const alimentazioneSnap = await getDocs(alimentazioneCollectionRef);
      userData.data.schedeAlimentazione = alimentazioneSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      logger.info('Schede alimentazione not found, skipping');
      userData.data.schedeAlimentazione = [];
    }

    // 6. Schede Allenamento (subcollection di clients)
    try {
      const allenamentoCollectionRef = collection(db, `tenants/${tenantId}/clients/${userId}/schedeAllenamento`);
      const allenamentoSnap = await getDocs(allenamentoCollectionRef);
      userData.data.schedeAllenamento = allenamentoSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      logger.info('Schede allenamento not found, skipping');
      userData.data.schedeAllenamento = [];
    }

    // 7. Messaggi Chat (se esistono come root collection)
    try {
      const messagesQuery = query(
        collection(db, `tenants/${tenantId}/messages`),
        where('senderId', '==', userId)
      );
      const messagesSnap = await getDocs(messagesQuery);
      userData.data.messages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      logger.info('Messages not found, skipping');
      userData.data.messages = [];
    }

    // 8. Notifiche (subcollection di clients)
    try {
      const notificationsCollectionRef = collection(db, `tenants/${tenantId}/clients/${userId}/notifications`);
      const notificationsSnap = await getDocs(notificationsCollectionRef);
      userData.data.notifications = notificationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      logger.info('Notifications not found, skipping');
      userData.data.notifications = [];
    }

    // 9. Community posts (se esiste)
    try {
      const postsQuery = query(
        collection(db, `tenants/${tenantId}/community_posts`),
        where('authorId', '==', userId)
      );
      const postsSnap = await getDocs(postsQuery);
      userData.data.communityPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      logger.info('Community posts not found, skipping');
    }

    return userData;
  } catch (error) {
    logger.error('Error exporting user data:', error);
    throw new Error('Impossibile esportare i dati. Riprova più tardi.');
  }
}

/**
 * Scarica i dati come file JSON
 * @param {Object} userData - Dati esportati
 * @param {string} filename - Nome file (opzionale)
 */
export function downloadUserDataAsJSON(userData, filename) {
  const dataStr = JSON.stringify(userData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `dati-utente-${userData.userId}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Elimina tutti i dati di un utente (GDPR Art. 17 - Diritto all'oblio)
 * ATTENZIONE: Questa è un'operazione IRREVERSIBILE
 * @param {string} userId - UID dell'utente
 * @param {string} tenantId - ID del tenant
 * @returns {Promise<Object>} Risultato della cancellazione
 */
export async function deleteUserData(userId, tenantId) {
  try {
    const deletedCollections = [];
    let totalDocsDeleted = 0;

    // 1. Elimina profilo cliente
    const clientRef = doc(db, `tenants/${tenantId}/clients`, userId);
    await deleteDoc(clientRef);
    deletedCollections.push('clients');
    totalDocsDeleted++;

    // Helper per eliminare documenti da una query
    const deleteFromQuery = async (collectionName, field = 'userId') => {
      const q = query(
        collection(db, `tenants/${tenantId}/${collectionName}`),
        where(field, '==', userId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return 0;

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      deletedCollections.push(collectionName);
      return snapshot.size;
    };

    // 2. Elimina tutte le collezioni associate
    totalDocsDeleted += await deleteFromQuery('anamnesi');
    totalDocsDeleted += await deleteFromQuery('checks');
    totalDocsDeleted += await deleteFromQuery('payments');
    totalDocsDeleted += await deleteFromQuery('schedeAlimentazione');
    totalDocsDeleted += await deleteFromQuery('schedeAllenamento');
    totalDocsDeleted += await deleteFromQuery('messages', 'senderId');
    totalDocsDeleted += await deleteFromQuery('notifications');

    // 3. Community (opzionale)
    try {
      totalDocsDeleted += await deleteFromQuery('community_posts', 'authorId');
      totalDocsDeleted += await deleteFromQuery('community_comments', 'authorId');
    } catch (e) {
      console.log('Community collections not found, skipping');
    }

    // 4. Elimina account Firebase Auth (SOLO se l'utente corrente)
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId) {
      await deleteUser(currentUser);
    }

    return {
      success: true,
      deletedCollections,
      totalDocsDeleted,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw new Error('Impossibile eliminare i dati. Riprova più tardi o contatta il supporto.');
  }
}

/**
 * Verifica se l'utente ha il diritto di eliminare i dati
 * (Es: controlla se ci sono pagamenti attivi, contratti in corso, etc.)
 */
export async function canDeleteAccount(userId, tenantId) {
  try {
    // Controlla pagamenti attivi
    const paymentsQuery = query(
      collection(db, `tenants/${tenantId}/payments`),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const paymentsSnap = await getDocs(paymentsQuery);

    if (!paymentsSnap.empty) {
      return {
        canDelete: false,
        reason: 'Hai pagamenti attivi. Contatta l\'amministratore per chiudere il tuo account.'
      };
    }

    // Aggiungi altri controlli se necessario
    // Es: contratti attivi, ordini in sospeso, etc.

    return {
      canDelete: true,
      reason: null
    };
  } catch (error) {
    console.error('Error checking account deletion eligibility:', error);
    return {
      canDelete: false,
      reason: 'Errore durante la verifica. Riprova più tardi.'
    };
  }
}
