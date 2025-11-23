import { 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  doc
} from 'firebase/firestore';
import { getTenantCollection } from '../config/tenant';

/**
 * Lead Service - Gestione leads e conversioni
 */

export const getLeads = async (db, options = {}) => {
  try {
    const { limitCount = 50, status = null, startDate = null, endDate = null } = options;
    
    let q = getTenantCollection(db, 'leads');
    
    // Filtro per stato
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    // Filtro per data
    if (startDate && endDate) {
      q = query(q, where('createdAt', '>=', startDate), where('createdAt', '<=', endDate));
    }
    
    // Ordina per data creazione
    q = query(q, orderBy('createdAt', 'desc'));
    
    // Limita risultati
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
    console.error('Errore getLeads:', error);
    throw new Error('Impossibile recuperare i leads: ' + error.message);
  }
};

export const createLead = async (db, leadData) => {
  try {
    const docRef = await addDoc(getTenantCollection(db, 'leads'), {
      ...leadData,
      createdAt: new Date(),
      status: leadData.status || 'nuovo'
    });
    
    return { id: docRef.id, ...leadData };
  } catch (error) {
    console.error('Errore createLead:', error);
    throw new Error('Impossibile creare il lead: ' + error.message);
  }
};

export const updateLead = async (db, leadId, updates) => {
  try {
    const leadRef = doc(getTenantCollection(db, 'leads'), leadId);
    await updateDoc(leadRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    return { id: leadId, ...updates };
  } catch (error) {
    console.error('Errore updateLead:', error);
    throw new Error('Impossibile aggiornare il lead: ' + error.message);
  }
};

export const deleteLead = async (db, leadId) => {
  try {
    const leadRef = doc(getTenantCollection(db, 'leads'), leadId);
    await deleteDoc(leadRef);
    
    return { success: true };
  } catch (error) {
    console.error('Errore deleteLead:', error);
    throw new Error('Impossibile eliminare il lead: ' + error.message);
  }
};

export const getLeadStats = async (db, startDate, endDate) => {
  try {
    const leads = await getLeads(db, { limitCount: null, startDate, endDate });
    
    return {
      total: leads.length,
      nuovo: leads.filter(l => l.status === 'nuovo').length,
      contattato: leads.filter(l => l.status === 'contattato').length,
      interessato: leads.filter(l => l.status === 'interessato').length,
      convertito: leads.filter(l => l.status === 'convertito').length,
      perso: leads.filter(l => l.status === 'perso').length,
      conversionRate: leads.length > 0 
        ? ((leads.filter(l => l.status === 'convertito').length / leads.length) * 100).toFixed(1)
        : 0
    };
  } catch (error) {
    console.error('Errore getLeadStats:', error);
    throw new Error('Impossibile recuperare le statistiche leads: ' + error.message);
  }
};
