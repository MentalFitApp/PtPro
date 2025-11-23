const { onCall } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// Configura region europea
setGlobalOptions({ region: 'europe-west1' });

exports.getUidByEmail = onCall(async (request) => {
  const email = request.data?.email?.trim().toLowerCase();

  console.log('EMAIL RICEVUTA NELLA FUNZIONE:', email);

  if (!email) {
    throw new Error('Email mancante');
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('UTENTE TROVATO:', userRecord.uid);
    return { uid: userRecord.uid };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('UTENTE NON TROVATO:', email);
      return { uid: null };
    }
    console.error('ERRORE ADMIN SDK:', error);
    throw new Error('Errore server');
  }
});

// Cloud Function per creare stanze Daily.co
exports.createDailyRoom = onCall(async (request) => {
  console.log('📞 createDailyRoom called with data:', request.data);
  
  const { roomName, properties } = request.data;
  const DAILY_API_KEY = '76a471284c7f6c54eaa60016b63debb0ded806396a21f64d834f7f874432a85d';

  if (!roomName) {
    console.error('❌ roomName mancante');
    throw new Error('roomName è richiesto');
  }

  try {
    console.log('🚀 Creazione stanza Daily.co:', roomName);
    
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: properties || {
          max_participants: 50,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false
        }
      })
    });

    const data = await response.json();
    console.log('📡 Risposta Daily.co API:', response.status, data);
    
    if (!response.ok) {
      console.error('❌ Errore Daily.co API:', data);
      throw new Error(data.error || 'Errore creazione stanza');
    }

    console.log('✅ Stanza creata con successo:', data.url);
    return { 
      url: data.url,
      roomName: data.name 
    };
  } catch (error) {
    console.error('💥 Errore createDailyRoom:', error.message, error.stack);
    throw new Error(`Impossibile creare la stanza Daily.co: ${error.message}`);
  }
});

// Cloud Function per inviare notifiche push via FCM
exports.sendPushNotification = onDocumentCreated('notifications/{notificationId}', async (event) => {
  const notification = event.data.data();
  const notificationId = event.params.notificationId;
  const { userId, userType, title, body } = notification;

  console.log('🔔 TRIGGER: Nuova notifica creata');
  console.log('📋 Notification ID:', notificationId);
  console.log('👤 User ID:', userId);
  console.log('🏷️ User Type:', userType);
  console.log('📝 Title:', title);
  console.log('💬 Body:', body);

  try {
    // Recupera il token FCM dell'utente
    console.log('🔍 Cercando token FCM per userId:', userId);
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
      console.warn('⚠️ Nessun token FCM trovato per:', userId);
      console.log('📂 Documenti disponibili in fcmTokens:', (await db.collection('fcmTokens').get()).size);
      return null;
    }

    const fcmToken = tokenDoc.data().token;
    console.log('✅ Token FCM recuperato:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'NULL');
    
    if (!fcmToken) {
      console.warn('⚠️ Token FCM vuoto per:', userId);
      return null;
    }

    // Prepara il messaggio FCM
    const message = {
      notification: {
        title: title || 'PtPro',
        body: body || 'Hai una nuova notifica',
      },
      data: {
        notificationId: notificationId,
        userId: userId,
        userType: userType,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      token: fcmToken,
      webpush: {
        notification: {
          icon: '/PtPro/logo192.png',
          badge: '/PtPro/logo192.png',
          tag: 'notification-' + notificationId,
          requireInteraction: false,
          vibrate: [200, 100, 200]
        },
        fcmOptions: {
          link: 'https://mentalfitapp.github.io/PtPro/#/'
        }
      }
    };

    console.log('📤 Inviando messaggio FCM...');
    // Invia il messaggio
    const response = await admin.messaging().send(message);
    console.log('✅ Notifica push inviata con successo!');
    console.log('📊 Response:', response);
    
    return response;
  } catch (error) {
    console.error('❌ ERRORE invio notifica push:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Se il token è invalido/scaduto, rimuovilo
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log('🗑️ Token non valido, rimozione...');
      await db.collection('fcmTokens').doc(userId).delete();
    }
    
    return null;
  }
});

// ============================================================
// AGGREGAZIONE STATISTICHE TENANTS
// ============================================================

/**
 * Funzione per aggregare le statistiche di un singolo tenant
 */
async function aggregateTenantStats(tenantId) {
  console.log(`📊 Aggregando stats per tenant: ${tenantId}`);
  
  try {
    const tenantRef = db.collection('tenants').doc(tenantId);
    
    // Query parallele per conteggi
    const [
      usersCount,
      clientsCount,
      collaboratoriCount,
      anamnesisCount
    ] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('users').count().get(),
      db.collection('tenants').doc(tenantId).collection('clients').count().get(),
      db.collection('tenants').doc(tenantId).collection('collaboratori').count().get(),
      db.collection('tenants').doc(tenantId).collection('anamnesis').count().get()
    ]);
    
    const totalUsers = usersCount.data().count;
    const totalClients = clientsCount.data().count;
    const totalCollaboratori = collaboratoriCount.data().count;
    const totalAnamnesi = anamnesisCount.data().count;
    
    // Stima revenue (€50 per cliente)
    const totalRevenue = totalClients * 50;
    
    const stats = {
      totalUsers,
      totalClients,
      totalCollaboratori,
      totalAnamnesi,
      totalRevenue,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Salva stats nel documento tenant
    await tenantRef.set({ stats }, { merge: true });
    
    console.log(`✅ Stats aggiornate per ${tenantId}:`, stats);
    return stats;
  } catch (error) {
    console.error(`❌ Errore aggregazione ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Cloud Function schedulata: esegue ogni ora
 * Aggrega le statistiche di tutti i tenant
 */
exports.aggregateAllTenantsStats = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'Europe/Rome',
    memory: '256MiB',
    timeoutSeconds: 540 // 9 minuti
  },
  async (event) => {
    console.log('🕐 CRON JOB: Aggregazione statistiche tenant avviata');
    
    try {
      const tenantsSnapshot = await db.collection('tenants').get();
      const tenants = tenantsSnapshot.docs;
      
      console.log(`📋 Trovati ${tenants.length} tenant da processare`);
      
      // Processa tutti i tenant in parallelo
      const results = await Promise.allSettled(
        tenants.map(doc => aggregateTenantStats(doc.id))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ Aggregazione completata: ${successful} successi, ${failed} fallimenti`);
      
      return {
        total: tenants.length,
        successful,
        failed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Errore durante aggregazione schedulata:', error);
      throw error;
    }
  }
);

/**
 * Trigger real-time: aggiorna stats quando viene creato/modificato un client
 */
exports.updateStatsOnClientChange = onDocumentWritten(
  'tenants/{tenantId}/clients/{clientId}',
  async (event) => {
    const tenantId = event.params.tenantId;
    console.log(`🔄 Trigger: Client modificato in tenant ${tenantId}`);
    
    // Debounce: aspetta 30 secondi prima di riaggregare
    // (evita troppe chiamate se vengono creati molti client insieme)
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      await aggregateTenantStats(tenantId);
      return { success: true, tenantId };
    } catch (error) {
      console.error('❌ Errore update stats on client change:', error);
      return { success: false, tenantId, error: error.message };
    }
  }
);

/**
 * Trigger real-time: aggiorna stats quando viene creato/modificato un collaboratore
 */
exports.updateStatsOnCollaboratoreChange = onDocumentWritten(
  'tenants/{tenantId}/collaboratori/{collaboratoreId}',
  async (event) => {
    const tenantId = event.params.tenantId;
    console.log(`🔄 Trigger: Collaboratore modificato in tenant ${tenantId}`);
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      await aggregateTenantStats(tenantId);
      return { success: true, tenantId };
    } catch (error) {
      console.error('❌ Errore update stats on collaboratore change:', error);
      return { success: false, tenantId, error: error.message };
    }
  }
);

/**
 * Trigger real-time: aggiorna stats quando viene creato/modificato un user
 */
exports.updateStatsOnUserChange = onDocumentWritten(
  'tenants/{tenantId}/users/{userId}',
  async (event) => {
    const tenantId = event.params.tenantId;
    console.log(`🔄 Trigger: User modificato in tenant ${tenantId}`);
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      await aggregateTenantStats(tenantId);
      return { success: true, tenantId };
    } catch (error) {
      console.error('❌ Errore update stats on user change:', error);
      return { success: false, tenantId, error: error.message };
    }
  }
);

/**
 * Callable function: permette di triggare manualmente l'aggregazione
 * Utile per testing o refresh immediato
 */
exports.triggerStatsAggregation = onCall(
  { cors: true },
  async (request) => {
    const tenantId = request.data?.tenantId;
    
    console.log('🎯 Aggregazione manuale richiesta', tenantId ? `per tenant: ${tenantId}` : 'per tutti i tenant');
    
    try {
      if (tenantId) {
        // Aggrega un singolo tenant
        const stats = await aggregateTenantStats(tenantId);
        return { success: true, tenantId, stats };
      } else {
        // Aggrega tutti i tenant
        const tenantsSnapshot = await db.collection('tenants').get();
        const results = await Promise.allSettled(
          tenantsSnapshot.docs.map(doc => aggregateTenantStats(doc.id))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return {
          success: true,
          total: tenantsSnapshot.size,
          successful,
          failed
        };
      }
    } catch (error) {
      console.error('❌ Errore aggregazione manuale:', error);
      throw new Error(`Aggregazione fallita: ${error.message}`);
    }
  }
);