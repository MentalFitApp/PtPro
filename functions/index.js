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

// Cloud Function per interagire con ManyChat API
exports.manychatProxy = onCall(
  {
    region: 'europe-west1',
    cors: true
  },
  async (request) => {
    const { tenantId, endpoint, method = 'GET', body } = request.data;
  
  if (!tenantId) {
    throw new Error('tenantId è richiesto');
  }

  try {
    // Recupera configurazione ManyChat dal tenant
    const configRef = db.doc(`tenants/${tenantId}/integrations/manychat`);
    const configSnap = await configRef.get();
    
    if (!configSnap.exists) {
      throw new Error('Configurazione ManyChat non trovata');
    }

    const { apiKey, pageId } = configSnap.data();
    
    if (!apiKey) {
      throw new Error('API Key ManyChat non configurata');
    }

    // Costruisci URL e body
    const baseUrl = 'https://api.manychat.com/fb';
    const url = `${baseUrl}${endpoint}`;
    
    // Per POST, il page_id va nel body; per GET, nell'URL
    let finalUrl = url;
    let finalBody = body || {};
    
    if (method === 'POST') {
      finalBody = { ...finalBody, page_id: parseInt(pageId) };
    } else {
      finalUrl = url.includes('?') 
        ? `${url}&page_id=${pageId}`
        : `${url}?page_id=${pageId}`;
    }

    console.log('🔗 ManyChat API Call:', method, finalUrl);

    // Fai la richiesta a ManyChat
    const response = await fetch(finalUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: method === 'POST' ? JSON.stringify(finalBody) : undefined
    });

    // Ottieni il testo della risposta per debug
    const responseText = await response.text();
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Text:', responseText.substring(0, 500));

    // Prova a parsare come JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Impossibile parsare risposta come JSON');
      throw new Error(`ManyChat API ha restituito una risposta non valida. Status: ${response.status}`);
    }

    if (!response.ok) {
      console.error('❌ ManyChat API Error:', data);
      throw new Error(data.message || 'Errore API ManyChat');
    }

    return data;
  } catch (error) {
    console.error('❌ Errore manychatProxy:', error);
    throw new Error(error.message || 'Errore comunicazione con ManyChat');
  }
}
);

// OAuth Token Exchange - Gestisce lo scambio code->token per tutti i provider
exports.exchangeOAuthToken = onCall(
  {
    region: 'europe-west1',
    secrets: ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET']
  },
  async (request) => {
    try {
      const { provider, code, tenantId, redirectUri } = request.data;

      if (!provider || !code || !tenantId) {
        throw new Error('Parametri mancanti');
      }

      console.log(`🔐 OAuth exchange per ${provider}, tenant: ${tenantId}`);

      // Configurazioni provider
      const providerConfigs = {
        google: {
          tokenUrl: 'https://oauth2.googleapis.com/token',
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        },
        stripe: {
          tokenUrl: 'https://connect.stripe.com/oauth/token',
          clientId: process.env.STRIPE_CLIENT_ID,
          clientSecret: process.env.STRIPE_CLIENT_SECRET
        },
        calendly: {
          tokenUrl: 'https://auth.calendly.com/oauth/token',
          clientId: process.env.CALENDLY_CLIENT_ID,
          clientSecret: process.env.CALENDLY_CLIENT_SECRET
        },
        zoom: {
          tokenUrl: 'https://zoom.us/oauth/token',
          clientId: process.env.ZOOM_CLIENT_ID,
          clientSecret: process.env.ZOOM_CLIENT_SECRET
        },
        instagram: {
          tokenUrl: 'https://api.instagram.com/oauth/access_token',
          clientId: process.env.INSTAGRAM_CLIENT_ID,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET
        }
      };

      const config = providerConfigs[provider];
      if (!config) {
        throw new Error(`Provider ${provider} non supportato`);
      }

      // Scambia code con access_token
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorData}`);
      }

      const tokenData = await tokenResponse.json();
      console.log(`✅ Token ottenuto per ${provider}`);

      // Per Instagram Basic Display, ottieni user_id
      let instagramUserId = null;
      if (provider === 'instagram') {
        try {
          // Ottieni info utente Instagram
          const userResponse = await fetch(
            `https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`
          );
          const userData = await userResponse.json();
          
          if (userData.id) {
            instagramUserId = userData.id;
            console.log(`✅ Instagram User ID: ${instagramUserId}, Username: ${userData.username}`);
          }
        } catch (igError) {
          console.error('⚠️ Errore recupero Instagram User:', igError);
          // Continua comunque, salva almeno il token
        }
      }

      // Salva token in Firestore
      await db.doc(`tenants/${tenantId}/integrations/${provider}`).set({
        enabled: true,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: tokenData.expires_in 
          ? admin.firestore.Timestamp.fromMillis(Date.now() + (tokenData.expires_in * 1000))
          : null,
        scope: tokenData.scope || '',
        instagram_user_id: instagramUserId,
        connected_at: admin.firestore.FieldValue.serverTimestamp(),
        last_sync: null
      }, { merge: true });

      console.log(`💾 Token salvato per ${provider} - tenant ${tenantId}`);

      return {
        success: true,
        provider,
        message: 'OAuth completato con successo'
      };

    } catch (error) {
      console.error('❌ Errore OAuth exchange:', error);
      throw new Error(error.message);
    }
  }
);

// Instagram Proxy - Proxy per chiamate API Instagram Graph
exports.instagramProxy = onCall(
  {
    region: 'europe-west1'
  },
  async (request) => {
    try {
      const { tenantId, endpoint, params } = request.data;

      if (!tenantId || !endpoint) {
        throw new Error('tenantId ed endpoint sono richiesti');
      }

      console.log(`📞 Instagram API call: ${endpoint} per tenant ${tenantId}`);

      // Leggi access token da Firestore
      const integrationDoc = await db
        .doc(`tenants/${tenantId}/integrations/instagram`)
        .get();

      if (!integrationDoc.exists || !integrationDoc.data().access_token) {
        throw new Error('Instagram non configurato o access token mancante');
      }

      const { access_token, instagram_user_id } = integrationDoc.data();

      // Se l'endpoint è /me, sostituisci con l'ID reale dell'utente
      let finalEndpoint = endpoint;
      if (endpoint === '/me' && instagram_user_id) {
        finalEndpoint = `/${instagram_user_id}`;
        console.log(`📝 Endpoint /me sostituito con /${instagram_user_id}`);
      } else if (endpoint.startsWith('/me/') && instagram_user_id) {
        finalEndpoint = endpoint.replace('/me/', `/${instagram_user_id}/`);
        console.log(`📝 Endpoint ${endpoint} sostituito con ${finalEndpoint}`);
      }

      // Costruisci URL Instagram Graph API (Basic Display usa graph.instagram.com)
      const baseUrl = 'https://graph.instagram.com';
      const fullUrl = `${baseUrl}${finalEndpoint}${params ? `?${params}&access_token=${access_token}` : `?access_token=${access_token}`}`;

      console.log(`🔗 Chiamata Instagram: ${fullUrl.replace(access_token, 'HIDDEN')}`);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Instagram API error: ${response.status}`, errorText);
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Instagram API response ricevuta`);

      return data;

    } catch (error) {
      console.error('❌ Errore instagramProxy:', error);
      throw new Error(error.message);
    }
  }
);

// Sincronizzazione manuale Instagram (singolo tenant)
exports.manualSyncInstagram = onCall(
  {
    region: 'europe-west1'
  },
  async (request) => {
    try {
      const tenantId = request.auth?.token?.tenantId || request.data?.tenantId;
      
      if (!tenantId) {
        throw new Error('Tenant ID non trovato');
      }

      console.log(`🔄 Sync manuale Instagram per tenant: ${tenantId}`);

      // Leggi configurazione Instagram
      const integrationDoc = await db
        .doc(`tenants/${tenantId}/integrations/instagram`)
        .get();
      
      if (!integrationDoc.exists || !integrationDoc.data().enabled) {
        throw new Error('Instagram non configurato per questo tenant');
      }

      const { access_token } = integrationDoc.data();
      if (!access_token) {
        throw new Error('Access token mancante');
      }

      // Chiama Instagram Graph API per profilo
      const profileUrl = 'https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count,follows_count&access_token=' + access_token;
      const profileResponse = await fetch(profileUrl);
      
      if (!profileResponse.ok) {
        throw new Error(`Instagram API error: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();

      // Salva stats
      await db.doc(`tenants/${tenantId}/instagram_data/profile`).set({
        username: profileData.username,
        account_type: profileData.account_type,
        followers_count: profileData.followers_count,
        follows_count: profileData.follows_count,
        media_count: profileData.media_count,
        last_sync: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Sync completata per tenant ${tenantId}`);

      return {
        success: true,
        profile: profileData
      };

    } catch (error) {
      console.error(`❌ Errore sync Instagram:`, error);
      throw new Error(error.message);
    }
  }
);

// Funzione callable per sincronizzazione manuale (singolo tenant)
exports.manualSyncManyChat = onCall(
  {
    region: 'europe-west1'
  },
  async (request) => {
    try {
      const tenantId = request.auth?.token?.tenantId || request.data?.tenantId;
      
      if (!tenantId) {
        throw new Error('Tenant ID non trovato');
      }

      console.log(`🔄 Sync manuale per tenant: ${tenantId}`);

      // Leggi configurazione ManyChat
      const integrationDoc = await db
        .doc(`tenants/${tenantId}/integrations/manychat`)
        .get();
      
      if (!integrationDoc.exists || !integrationDoc.data().enabled) {
        throw new Error('ManyChat non configurato per questo tenant');
      }

      const { apiKey, pageId } = integrationDoc.data();
      if (!apiKey || !pageId) {
        throw new Error('API key o Page ID mancanti');
      }

      // Chiama ManyChat API
      const pageInfoUrl = `https://api.manychat.com/fb/page/getInfo?page_id=${pageId}`;
      const pageInfoResponse = await fetch(pageInfoUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!pageInfoResponse.ok) {
        throw new Error(`ManyChat API error: ${pageInfoResponse.status}`);
      }

      const pageInfoData = await pageInfoResponse.json();

      // Salva stats
      await db.doc(`tenants/${tenantId}/stats/manychat`).set({
        page_name: pageInfoData.data?.name || '',
        page_id: pageId,
        is_pro: pageInfoData.data?.is_pro || false,
        timezone: pageInfoData.data?.timezone || '',
        last_sync: admin.firestore.FieldValue.serverTimestamp(),
        sync_status: 'success',
        sync_type: 'manual'
      }, { merge: true });

      console.log(`✅ Sync manuale completato per ${tenantId}`);
      return { success: true, tenant: tenantId };

    } catch (error) {
      console.error('❌ Errore sync manuale:', error);
      throw new Error(error.message);
    }
  }
);

// Scheduled function per sincronizzare dati ManyChat di tutti i tenant
// Esegue ogni 15 minuti
exports.syncManyChatData = onSchedule(
  {
    schedule: 'every 15 minutes',
    region: 'europe-west1',
    timeoutSeconds: 540,
    memory: '512MiB'
  },
  async (event) => {
    try {
      console.log('🔄 Inizio sincronizzazione ManyChat per tutti i tenant');

      // Trova tutti i tenant con ManyChat configurato
      const tenantsSnapshot = await db.collection('tenants').get();
      let processedTenants = 0;

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenantId = tenantDoc.id;
        
        // Controlla se ha ManyChat configurato
        const integrationDoc = await db
          .doc(`tenants/${tenantId}/integrations/manychat`)
          .get();
        
        if (!integrationDoc.exists || !integrationDoc.data().enabled) {
          continue;
        }

        const { apiKey, pageId } = integrationDoc.data();
        if (!apiKey || !pageId) {
          console.warn(`⚠️ Tenant ${tenantId}: API key o Page ID mancanti`);
          continue;
        }

        console.log(`📊 Sincronizzazione tenant: ${tenantId}`);

        try {
          // Chiama ManyChat API per ottenere info pagina
          const pageInfoUrl = `https://api.manychat.com/fb/page/getInfo?page_id=${pageId}`;
          const pageInfoResponse = await fetch(pageInfoUrl, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!pageInfoResponse.ok) {
            throw new Error(`Page Info failed: ${pageInfoResponse.status}`);
          }

          const pageInfoData = await pageInfoResponse.json();
          console.log(`✅ ${tenantId}: Page info ottenuto`);

          // Salva stats base
          await db.doc(`tenants/${tenantId}/stats/manychat`).set({
            page_name: pageInfoData.data?.name || '',
            page_id: pageId,
            is_pro: pageInfoData.data?.is_pro || false,
            timezone: pageInfoData.data?.timezone || '',
            last_sync: admin.firestore.FieldValue.serverTimestamp(),
            sync_status: 'success'
          }, { merge: true });

          processedTenants++;
          console.log(`✅ ${tenantId}: Sincronizzazione completata`);

        } catch (error) {
          console.error(`❌ Errore sincronizzazione ${tenantId}:`, error.message);
          
          // Salva errore
          await db.doc(`tenants/${tenantId}/stats/manychat`).set({
            last_sync: admin.firestore.FieldValue.serverTimestamp(),
            sync_status: 'error',
            sync_error: error.message
          }, { merge: true });
        }
      }

      console.log(`✅ Sincronizzazione completata: ${processedTenants} tenant processati`);
      return { success: true, tenants_processed: processedTenants };

    } catch (error) {
      console.error('❌ Errore sync ManyChat:', error);
      throw error;
    }
  }
);

// Webhook endpoint per ricevere eventi da ManyChat
// URL: https://europe-west1-biondo-fitness-coach.cloudfunctions.net/manychatWebhook
const { onRequest } = require('firebase-functions/v2/https');

exports.manychatWebhook = onRequest(
  {
    region: 'europe-west1',
    cors: true
  },
  async (req, res) => {
    try {
      // ManyChat invia POST con i dati dell'evento
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const webhookData = req.body;
      console.log('📥 Webhook ManyChat ricevuto:', JSON.stringify(webhookData, null, 2));

      // Estrai dati importanti
      const {
        event_type,
        page_id,
        subscriber,
        timestamp
      } = webhookData;

      if (!page_id) {
        console.error('❌ page_id mancante nel webhook');
        res.status(400).send('Missing page_id');
        return;
      }

      // Trova il tenant associato a questo page_id
      const tenantsSnapshot = await db.collection('tenants').get();
      let tenantId = null;

      for (const tenantDoc of tenantsSnapshot.docs) {
        const integrationDoc = await db
          .doc(`tenants/${tenantDoc.id}/integrations/manychat`)
          .get();
        
        if (integrationDoc.exists && integrationDoc.data().pageId === page_id.toString()) {
          tenantId = tenantDoc.id;
          break;
        }
      }

      if (!tenantId) {
        console.warn('⚠️ Nessun tenant trovato per page_id:', page_id);
        res.status(404).send('Tenant not found');
        return;
      }

      console.log('✅ Tenant identificato:', tenantId);

      // Salva l'evento in Firestore
      const eventRef = db.collection(`tenants/${tenantId}/manychat_events`).doc();
      await eventRef.set({
        event_type,
        page_id,
        subscriber: subscriber || null,
        timestamp: timestamp || admin.firestore.FieldValue.serverTimestamp(),
        raw_data: webhookData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('💾 Evento salvato:', eventRef.id);

      // Se è un nuovo subscriber, salvalo nella collezione subscribers
      if (event_type === 'user_subscribed' && subscriber) {
        const subscriberRef = db
          .doc(`tenants/${tenantId}/manychat_subscribers/${subscriber.id}`);
        
        await subscriberRef.set({
          subscriber_id: subscriber.id,
          first_name: subscriber.first_name || '',
          last_name: subscriber.last_name || '',
          name: subscriber.name || `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim(),
          profile_pic: subscriber.profile_pic || null,
          locale: subscriber.locale || '',
          gender: subscriber.gender || '',
          timezone: subscriber.timezone || '',
          subscribed_at: subscriber.subscribed_at ? new Date(subscriber.subscribed_at * 1000) : admin.firestore.FieldValue.serverTimestamp(),
          last_interaction: admin.firestore.FieldValue.serverTimestamp(),
          tags: subscriber.tags || [],
          custom_fields: subscriber.custom_fields || {},
          status: 'active',
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('👤 Subscriber salvato/aggiornato:', subscriber.id);

        // Aggiorna contatore subscribers nel tenant
        const statsRef = db.doc(`tenants/${tenantId}/stats/manychat`);
        await statsRef.set({
          total_subscribers: admin.firestore.FieldValue.increment(1),
          last_updated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // Aggiorna ultima interazione se c'è un subscriber
      if (subscriber && subscriber.id) {
        const subscriberRef = db
          .doc(`tenants/${tenantId}/manychat_subscribers/${subscriber.id}`);
        
        await subscriberRef.set({
          last_interaction: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      res.status(200).json({ success: true, event_id: eventRef.id });
    } catch (error) {
      console.error('❌ Errore webhook ManyChat:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================
// ARCHIVIAZIONE AUTOMATICA CLIENTI INATTIVI
// ============================================
// Eseguito ogni giorno alle 02:00 (ora italiana)
exports.autoArchiveInactiveClients = onSchedule({
  schedule: 'every day 02:00',
  timeZone: 'Europe/Rome',
  region: 'europe-west1'
}, async (event) => {
  console.log('🤖 [AUTO-ARCHIVE] Inizio controllo clienti inattivi...');
  
  try {
    // 1. Recupera tutti i tenant
    const tenantsSnapshot = await db.collection('tenants').get();
    console.log(`📊 [AUTO-ARCHIVE] Trovati ${tenantsSnapshot.size} tenant da controllare`);

    let totalArchived = 0;

    // 2. Per ogni tenant
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      console.log(`\n🏢 [AUTO-ARCHIVE] Controllo tenant: ${tenantId}`);

      try {
        // 2.1 Carica impostazioni archiviazione del tenant
        const settingsRef = db.doc(`tenants/${tenantId}/settings/clientArchiveSettings`);
        const settingsSnap = await settingsRef.get();

        if (!settingsSnap.exists) {
          console.log(`⚠️ [AUTO-ARCHIVE] Nessuna impostazione trovata per ${tenantId}, skip`);
          continue;
        }

        const settings = settingsSnap.data();

        // 2.2 Verifica se l'archiviazione automatica è abilitata
        if (!settings.autoArchive?.enabled) {
          console.log(`❌ [AUTO-ARCHIVE] Archiviazione automatica disabilitata per ${tenantId}, skip`);
          continue;
        }

        const daysAfterExpiry = settings.autoArchive.inactivityDays || 7;
        console.log(`⏱️ [AUTO-ARCHIVE] Soglia scadenza: ${daysAfterExpiry} giorni dopo la scadenza`);

        // 2.3 Calcola data limite (oggi - giorni dopo scadenza)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalizza a mezzanotte
        const limitDate = new Date(now.getTime() - (daysAfterExpiry * 24 * 60 * 60 * 1000));
        console.log(`📅 [AUTO-ARCHIVE] Data limite scadenza: ${limitDate.toISOString()}`);

        // 2.4 Recupera tutti i clienti del tenant non già archiviati
        const clientsRef = db.collection(`tenants/${tenantId}/clients`);
        const clientsSnapshot = await clientsRef
          .where('isArchived', '!=', true)
          .get();

        console.log(`👥 [AUTO-ARCHIVE] Trovati ${clientsSnapshot.size} clienti attivi da verificare`);

        let archivedInTenant = 0;

        // 2.5 Per ogni cliente
        for (const clientDoc of clientsSnapshot.docs) {
          const clientId = clientDoc.id;
          const clientData = clientDoc.data();

          try {
            // Ottieni data di scadenza
            if (!clientData.scadenza) {
              console.log(`⚠️ [AUTO-ARCHIVE] Cliente ${clientId} senza data di scadenza, skip`);
              continue;
            }

            const expiryDate = clientData.scadenza.toDate();
            expiryDate.setHours(23, 59, 59, 999); // Fine della giornata di scadenza

            // Verifica se la scadenza è passata da più di N giorni
            if (expiryDate < limitDate) {
              const daysSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
              console.log(`🔴 [AUTO-ARCHIVE] Cliente ${clientData.name || clientId} scaduto da ${daysSinceExpiry} giorni, archiviazione...`);

              // Archivia il cliente con le impostazioni configurate
              await clientDoc.ref.update({
                isArchived: true,
                archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                archivedBy: 'system',
                archivedReason: `Abbonamento scaduto da ${daysSinceExpiry} giorni`,
                archiveSettings: {
                  blockAppAccess: settings.archiveActions?.blockAppAccess || true,
                  blockedScreens: settings.archiveActions?.blockedScreens || [],
                  customMessage: settings.archiveActions?.customMessage || 
                    'Il tuo abbonamento è scaduto. Contatta il tuo trainer per rinnovarlo e riattivare l\'accesso.'
                }
              });

              archivedInTenant++;
              totalArchived++;
              console.log(`✅ [AUTO-ARCHIVE] Cliente ${clientData.name || clientId} archiviato con successo`);
            }
          } catch (clientError) {
            console.error(`❌ [AUTO-ARCHIVE] Errore archiviazione cliente ${clientId}:`, clientError);
          }
        }

        console.log(`📦 [AUTO-ARCHIVE] Tenant ${tenantId}: ${archivedInTenant} clienti archiviati`);

      } catch (tenantError) {
        console.error(`❌ [AUTO-ARCHIVE] Errore elaborazione tenant ${tenantId}:`, tenantError);
      }
    }

    console.log(`\n✨ [AUTO-ARCHIVE] Completato! Totale clienti archiviati: ${totalArchived}`);
    return { success: true, totalArchived };

  } catch (error) {
    console.error('💥 [AUTO-ARCHIVE] Errore critico:', error);
    throw error;
  }
});

// ============================================
// MAGIC LINK - Sistema di accesso semplificato
// ============================================

/**
 * Genera un Magic Link per un cliente
 * Il link permette al cliente di impostare la propria password senza conoscere quella temporanea
 */
exports.generateMagicLink = onCall(async (request) => {
  const { clientId, tenantId, email, name } = request.data;

  console.log('🔗 [MAGIC-LINK] Generazione link per:', email);

  if (!clientId || !tenantId || !email) {
    throw new Error('Parametri mancanti: clientId, tenantId e email sono richiesti');
  }

  try {
    // Genera un token univoco (32 caratteri hex)
    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');
    
    // Scadenza: 48 ore da adesso
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Salva il token nel database
    const tokenRef = db.collection('magicLinks').doc(token);
    await tokenRef.set({
      token,
      clientId,
      tenantId,
      email: email.toLowerCase().trim(),
      name: name || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      used: false,
      usedAt: null
    });

    console.log('✅ [MAGIC-LINK] Token generato:', token.substring(0, 8) + '...');

    // Ritorna il link completo
    const baseUrl = 'https://www.flowfitpro.it';
    const magicLink = `${baseUrl}/setup/${token}`;

    return { 
      success: true, 
      magicLink,
      expiresAt: expiresAt.toISOString()
    };

  } catch (error) {
    console.error('💥 [MAGIC-LINK] Errore generazione:', error);
    throw new Error('Errore nella generazione del Magic Link');
  }
});

/**
 * Valida un Magic Link token
 * Ritorna i dati del cliente se il token è valido
 */
exports.validateMagicLink = onCall(async (request) => {
  const { token } = request.data;

  console.log('🔍 [MAGIC-LINK] Validazione token:', token?.substring(0, 8) + '...');

  if (!token) {
    throw new Error('Token mancante');
  }

  try {
    const tokenRef = db.collection('magicLinks').doc(token);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      console.log('❌ [MAGIC-LINK] Token non trovato');
      return { valid: false, reason: 'Token non valido o scaduto' };
    }

    const tokenData = tokenDoc.data();

    // Controlla se già usato
    if (tokenData.used) {
      console.log('❌ [MAGIC-LINK] Token già utilizzato');
      return { valid: false, reason: 'Questo link è già stato utilizzato' };
    }

    // Controlla scadenza
    const now = new Date();
    const expiresAt = tokenData.expiresAt?.toDate ? tokenData.expiresAt.toDate() : new Date(tokenData.expiresAt);
    if (now > expiresAt) {
      console.log('❌ [MAGIC-LINK] Token scaduto');
      return { valid: false, reason: 'Questo link è scaduto. Richiedi un nuovo link al tuo coach.' };
    }

    console.log('✅ [MAGIC-LINK] Token valido per:', tokenData.email);

    return {
      valid: true,
      email: tokenData.email,
      name: tokenData.name,
      clientId: tokenData.clientId,
      tenantId: tokenData.tenantId
    };

  } catch (error) {
    console.error('💥 [MAGIC-LINK] Errore validazione:', error);
    throw new Error('Errore nella validazione del link');
  }
});

/**
 * Completa il setup account: imposta la nuova password e marca il token come usato
 */
exports.completeMagicLinkSetup = onCall(async (request) => {
  const { token, newPassword } = request.data;

  console.log('🔐 [MAGIC-LINK] Completamento setup per token:', token?.substring(0, 8) + '...');

  if (!token || !newPassword) {
    throw new Error('Token e password sono richiesti');
  }

  if (newPassword.length < 6) {
    throw new Error('La password deve essere di almeno 6 caratteri');
  }

  try {
    // Valida il token
    const tokenRef = db.collection('magicLinks').doc(token);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      throw new Error('Token non valido');
    }

    const tokenData = tokenDoc.data();

    if (tokenData.used) {
      throw new Error('Questo link è già stato utilizzato');
    }

    const now = new Date();
    const expiresAt = tokenData.expiresAt?.toDate ? tokenData.expiresAt.toDate() : new Date(tokenData.expiresAt);
    if (now > expiresAt) {
      throw new Error('Questo link è scaduto');
    }

    // Trova l'utente Firebase Auth tramite email
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(tokenData.email);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        throw new Error('Account non trovato. Contatta il tuo coach.');
      }
      throw authError;
    }

    // Aggiorna la password dell'utente
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    console.log('✅ [MAGIC-LINK] Password aggiornata per:', tokenData.email);

    // Marca il token come usato
    await tokenRef.update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Aggiorna il documento cliente per rimuovere la password temporanea
    const clientRef = db.collection('tenants').doc(tokenData.tenantId).collection('clients').doc(tokenData.clientId);
    await clientRef.update({
      tempPassword: admin.firestore.FieldValue.delete(),
      passwordSetAt: admin.firestore.FieldValue.serverTimestamp(),
      accountActivated: true
    });

    console.log('✅ [MAGIC-LINK] Setup completato per:', tokenData.email);

    return { 
      success: true, 
      email: tokenData.email,
      message: 'Account attivato con successo! Ora puoi accedere.'
    };

  } catch (error) {
    console.error('💥 [MAGIC-LINK] Errore completamento:', error);
    throw new Error(error.message || 'Errore nel completamento del setup');
  }
});