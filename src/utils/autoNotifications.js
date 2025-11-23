/**
 * Sistema di Notifiche Automatiche
 * Gestisce alert automatici per scadenze, check-in mancanti, ecc.
 */

import { collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getTenantCollection, getTenantDoc, getTenantSubcollection } from '../../config/tenant';

/**
 * Calcola i giorni rimanenti fino alla scadenza
 */
export const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const expiry = expiryDate instanceof Date ? expiryDate : expiryDate.toDate();
  const now = new Date();
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Ottiene tutti i clienti in scadenza
 * @param {number} daysThreshold - Giorni rimanenti (es: 15, 7, 3)
 * @returns {Array} Lista clienti in scadenza
 */
export const getExpiringClients = async (daysThreshold = 15) => {
  try {
    const clientsRef = getTenantCollection(db, 'clients');
    const snapshot = await getDocs(clientsRef);
    
    const expiringClients = [];
    
    snapshot.forEach(doc => {
      const client = { id: doc.id, ...doc.data() };
      if (client.scadenza) {
        const expiry = client.scadenza.toDate ? client.scadenza.toDate() : new Date(client.scadenza);
        const daysLeft = getDaysUntilExpiry(expiry);
        
        // Cliente in scadenza entro la soglia e non ancora scaduto
        if (daysLeft !== null && daysLeft > 0 && daysLeft <= daysThreshold) {
          expiringClients.push({
            ...client,
            expiryDate: expiry,
            daysLeft,
          });
        }
      }
    });
    
    return expiringClients;
  } catch (error) {
    console.error('Error fetching expiring clients:', error);
    return [];
  }
};

/**
 * Ottiene clienti già scaduti
 */
export const getExpiredClients = async () => {
  try {
    const clientsRef = getTenantCollection(db, 'clients');
    const snapshot = await getDocs(clientsRef);
    
    const expiredClients = [];
    const now = new Date();
    
    snapshot.forEach(doc => {
      const client = { id: doc.id, ...doc.data() };
      if (client.scadenza) {
        const expiry = client.scadenza.toDate ? client.scadenza.toDate() : new Date(client.scadenza);
        if (expiry < now) {
          expiredClients.push({
            ...client,
            expiryDate: expiry,
            daysOverdue: Math.abs(getDaysUntilExpiry(expiry)),
          });
        }
      }
    });
    
    return expiredClients;
  } catch (error) {
    console.error('Error fetching expired clients:', error);
    return [];
  }
};

/**
 * Ottiene clienti senza check-in recenti
 * @param {number} daysThreshold - Giorni senza check-in (default: 7)
 */
export const getClientsMissingCheckIn = async (daysThreshold = 7) => {
  try {
    const clientsRef = getTenantCollection(db, 'clients');
    const clientsSnapshot = await getDocs(clientsRef);
    
    const clientsMissingCheck = [];
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
    
    for (const clientDoc of clientsSnapshot.docs) {
      const client = { id: clientDoc.id, ...clientDoc.data() };
      
      // Verifica se il cliente è attivo (non scaduto)
      if (client.scadenza) {
        const expiry = client.scadenza.toDate ? client.scadenza.toDate() : new Date(client.scadenza);
        if (expiry < new Date()) continue; // Salta clienti scaduti
      }
      
      // Cerca ultimo check del cliente
      const checksRef = getTenantSubcollection(db, 'clients', client.id, 'checks');
      const checksSnapshot = await getDocs(checksRef);
      
      if (checksSnapshot.empty) {
        // Nessun check mai fatto
        clientsMissingCheck.push({
          ...client,
          lastCheckDate: null,
          daysSinceCheck: null,
        });
      } else {
        // Trova il check più recente
        let lastCheckDate = null;
        checksSnapshot.forEach(checkDoc => {
          const check = checkDoc.data();
          if (check.createdAt) {
            const checkDate = check.createdAt.toDate ? check.createdAt.toDate() : new Date(check.createdAt);
            if (!lastCheckDate || checkDate > lastCheckDate) {
              lastCheckDate = checkDate;
            }
          }
        });
        
        // Se l'ultimo check è troppo vecchio
        if (lastCheckDate && lastCheckDate < thresholdDate) {
          const daysSinceCheck = Math.floor((new Date() - lastCheckDate) / (1000 * 60 * 60 * 24));
          clientsMissingCheck.push({
            ...client,
            lastCheckDate,
            daysSinceCheck,
          });
        }
      }
    }
    
    return clientsMissingCheck;
  } catch (error) {
    console.error('Error fetching clients missing check-in:', error);
    return [];
  }
};

/**
 * Crea una notifica nel database
 */
export const createNotification = async (userId, notification) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const notificationRef = getTenantCollection(db, 'notifications');
    const notificationData = {
      userId,
      ...notification,
      createdAt: serverTimestamp(),
      read: false,
    };
    
    // In un'implementazione reale, qui si userebbe addDoc
    // Per ora logghiamo solo
    console.log('Notification created:', notificationData);
    
    return notificationData;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Genera notifiche per clienti in scadenza
 * @param {string} adminId - ID del PT/Admin da notificare
 */
export const generateExpiryNotifications = async (adminId) => {
  const notifications = [];
  
  try {
    // Clienti a 15 giorni
    const clients15Days = await getExpiringClients(15);
    for (const client of clients15Days) {
      if (client.daysLeft === 15) {
        notifications.push({
          type: 'expiry_warning',
          severity: 'info',
          title: 'Abbonamento in Scadenza',
          message: `${client.name} scade tra 15 giorni (${client.expiryDate.toLocaleDateString('it-IT')})`,
          clientId: client.id,
          clientName: client.name,
          daysLeft: 15,
          actionUrl: `/client/${client.id}`,
        });
      }
    }
    
    // Clienti a 7 giorni
    const clients7Days = await getExpiringClients(7);
    for (const client of clients7Days) {
      if (client.daysLeft === 7) {
        notifications.push({
          type: 'expiry_urgent',
          severity: 'warning',
          title: 'Scadenza Imminente',
          message: `${client.name} scade tra 7 giorni! Contattare per rinnovo.`,
          clientId: client.id,
          clientName: client.name,
          daysLeft: 7,
          actionUrl: `/client/${client.id}`,
        });
      }
    }
    
    // Clienti a 3 giorni
    const clients3Days = await getExpiringClients(3);
    for (const client of clients3Days) {
      if (client.daysLeft === 3) {
        notifications.push({
          type: 'expiry_critical',
          severity: 'error',
          title: '🚨 Scadenza Critica',
          message: `${client.name} scade tra 3 giorni! Azione urgente richiesta.`,
          clientId: client.id,
          clientName: client.name,
          daysLeft: 3,
          actionUrl: `/client/${client.id}`,
        });
      }
    }
    
    // Clienti scaduti oggi
    const expiredClients = await getExpiredClients();
    for (const client of expiredClients) {
      if (client.daysOverdue === 0) {
        notifications.push({
          type: 'expired',
          severity: 'error',
          title: '❌ Abbonamento Scaduto',
          message: `${client.name} è scaduto oggi. Rinnovare immediatamente.`,
          clientId: client.id,
          clientName: client.name,
          daysOverdue: 0,
          actionUrl: `/client/${client.id}`,
        });
      }
    }
    
    // Salva le notifiche
    for (const notification of notifications) {
      await createNotification(adminId, notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error generating expiry notifications:', error);
    return [];
  }
};

/**
 * Genera notifiche per check-in mancanti
 */
export const generateCheckInReminders = async (adminId) => {
  const notifications = [];
  
  try {
    const clientsMissing = await getClientsMissingCheckIn(7);
    
    for (const client of clientsMissing) {
      notifications.push({
        type: 'missing_checkin',
        severity: 'info',
        title: 'Check-in Mancante',
        message: client.lastCheckDate 
          ? `${client.name} non fa check-in da ${client.daysSinceCheck} giorni`
          : `${client.name} non ha mai fatto un check-in`,
        clientId: client.id,
        clientName: client.name,
        daysSinceCheck: client.daysSinceCheck,
        actionUrl: `/client/${client.id}/checks`,
      });
    }
    
    // Salva le notifiche
    for (const notification of notifications) {
      await createNotification(adminId, notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error generating check-in reminders:', error);
    return [];
  }
};

/**
 * Ottiene statistiche clienti per dashboard
 */
export const getClientStats = async () => {
  try {
    const [
      expiring15,
      expiring7,
      expiring3,
      expired,
      missingCheck
    ] = await Promise.all([
      getExpiringClients(15),
      getExpiringClients(7),
      getExpiringClients(3),
      getExpiredClients(),
      getClientsMissingCheckIn(7)
    ]);
    
    return {
      expiring: {
        days15: expiring15.filter(c => c.daysLeft > 7 && c.daysLeft <= 15).length,
        days7: expiring7.filter(c => c.daysLeft > 3 && c.daysLeft <= 7).length,
        days3: expiring3.filter(c => c.daysLeft > 0 && c.daysLeft <= 3).length,
        total: expiring15.length,
      },
      expired: expired.length,
      missingCheckIn: missingCheck.length,
      needsAttention: expiring3.length + expired.length + missingCheck.length,
    };
  } catch (error) {
    console.error('Error getting client stats:', error);
    return {
      expiring: { days15: 0, days7: 0, days3: 0, total: 0 },
      expired: 0,
      missingCheckIn: 0,
      needsAttention: 0,
    };
  }
};

/**
 * Funzione principale da chiamare periodicamente (es: ogni giorno)
 * In produzione: usare Firebase Cloud Functions con scheduler
 */
export const runDailyNotifications = async (adminId) => {
  console.log('🔔 Running daily notifications check...');
  
  const [expiryNotifications, checkInReminders] = await Promise.all([
    generateExpiryNotifications(adminId),
    generateCheckInReminders(adminId)
  ]);
  
  const totalNotifications = expiryNotifications.length + checkInReminders.length;
  
  console.log(`✅ Generated ${totalNotifications} notifications:`);
  console.log(`  - ${expiryNotifications.length} expiry alerts`);
  console.log(`  - ${checkInReminders.length} check-in reminders`);
  
  return {
    expiryNotifications,
    checkInReminders,
    total: totalNotifications,
  };
};
