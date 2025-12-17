const { onCall } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { enforceRateLimit, validators, validateInput, requireAuth, sanitizeObject } = require('./security');

admin.initializeApp();

const db = admin.firestore();

// Configura region europea
setGlobalOptions({ region: 'europe-west1' });

// Definisci i secrets (devono essere creati in Firebase Console o via CLI)
const dailyApiKey = defineSecret('DAILY_API_KEY');
const facebookAppSecret = defineSecret('FACEBOOK_APP_SECRET');

exports.getUidByEmail = onCall(async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'getUidByEmail');
  
  // Validazione input
  const { email } = validateInput(request.data, {
    email: validators.email
  });

  console.log('EMAIL RICEVUTA NELLA FUNZIONE:', email);

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
// Usa secret invece di API key hardcoded
exports.createDailyRoom = onCall(
  { secrets: [dailyApiKey] },
  async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'createDailyRoom');
  
  // Richiede autenticazione
  requireAuth(request);
  
  console.log('📞 createDailyRoom called with data:', request.data);
  
  // Validazione input
  const { roomName, properties } = validateInput(request.data, {
    roomName: validators.nonEmptyString,
    properties: validators.optional(validators.object)
  });
  
  const DAILY_API_KEY = dailyApiKey.value();

  if (!DAILY_API_KEY) {
    console.error('❌ DAILY_API_KEY secret non configurato');
    throw new Error('Configurazione server mancante');
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
// ATTENZIONE: Trigger su path tenant-aware
exports.sendPushNotification = onDocumentCreated('tenants/{tenantId}/notifications/{notificationId}', async (event) => {
  const notification = event.data.data();
  const { tenantId, notificationId } = event.params;
  const { userId, userType, title, body, type } = notification;

  console.log('🔔 TRIGGER: Nuova notifica creata');
  console.log('🏢 Tenant ID:', tenantId);
  console.log('📋 Notification ID:', notificationId);
  console.log('👤 User ID:', userId);
  console.log('🏷️ User Type:', userType);
  console.log('📝 Title:', title);
  console.log('💬 Body:', body);

  try {
    // Recupera il token FCM dell'utente DAL PATH TENANT
    console.log('🔍 Cercando token FCM per userId:', userId, 'in tenant:', tenantId);
    const tokenDoc = await db.collection('tenants').doc(tenantId).collection('fcmTokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
      console.warn('⚠️ Nessun token FCM trovato per:', userId);
      // Prova anche nel path legacy (collezione globale)
      const legacyTokenDoc = await db.collection('fcmTokens').doc(userId).get();
      if (!legacyTokenDoc.exists) {
        console.warn('⚠️ Nessun token FCM neanche in path legacy');
        return null;
      }
      console.log('✅ Token trovato in path legacy, usandolo...');
    }

    const tokenData = tokenDoc.exists ? tokenDoc.data() : (await db.collection('fcmTokens').doc(userId).get()).data();
    const fcmToken = tokenData?.token;
    
    console.log('✅ Token FCM recuperato:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'NULL');
    
    if (!fcmToken) {
      console.warn('⚠️ Token FCM vuoto per:', userId);
      return null;
    }

    // Controlla se le notifiche sono abilitate
    if (tokenData.enabled === false) {
      console.log('🔇 Notifiche disabilitate per utente:', userId);
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
        userType: userType || 'user',
        type: type || 'default',
        tenantId: tenantId
      },
      token: fcmToken,
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'notification-' + notificationId,
          requireInteraction: type === 'call_request',
          vibrate: [200, 100, 200]
        },
        fcmOptions: {
          link: 'https://flowfitpro.it/'
        }
      },
      // Android specifico
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#3b82f6',
          sound: 'default',
          priority: 'high',
          channelId: 'ptpro_notifications'
        },
        priority: 'high'
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
      await db.collection('tenants').doc(tenantId).collection('fcmTokens').doc(userId).delete();
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

// ============================================
// USER-TENANT MAPPING (per login veloce)
// ============================================

/**
 * Helper: Aggiorna il mapping user_tenants per un utente
 * Chiamato quando viene creato/modificato un client, collaboratore, o ruolo
 */
async function updateUserTenantMapping(userId, tenantId, role) {
  try {
    await db.collection('user_tenants').doc(userId).set({
      tenantId,
      role, // 'client', 'collaboratore', 'admin', 'coach', 'superadmin'
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`✅ User-tenant mapping aggiornato: ${userId} → ${tenantId} (${role})`);
  } catch (error) {
    console.error(`❌ Errore aggiornamento user-tenant mapping:`, error);
  }
}

/**
 * Trigger: Quando viene creato un CLIENT, crea mapping user_tenants
 */
exports.onClientCreated = onDocumentCreated(
  'tenants/{tenantId}/clients/{clientId}',
  async (event) => {
    const { tenantId, clientId } = event.params;
    console.log(`🆕 Nuovo client creato: ${clientId} in tenant ${tenantId}`);
    await updateUserTenantMapping(clientId, tenantId, 'client');
  }
);

/**
 * Trigger: Quando viene creato un COLLABORATORE, crea mapping user_tenants
 */
exports.onCollaboratoreCreated = onDocumentCreated(
  'tenants/{tenantId}/collaboratori/{collaboratoreId}',
  async (event) => {
    const { tenantId, collaboratoreId } = event.params;
    console.log(`🆕 Nuovo collaboratore creato: ${collaboratoreId} in tenant ${tenantId}`);
    await updateUserTenantMapping(collaboratoreId, tenantId, 'collaboratore');
  }
);

/**
 * Trigger: Quando viene modificato il documento ROLES (admins/coaches/superadmins)
 * Aggiorna mapping per tutti gli utenti nel ruolo
 */
exports.onRolesChanged = onDocumentWritten(
  'tenants/{tenantId}/roles/{roleType}',
  async (event) => {
    const { tenantId, roleType } = event.params;
    const afterData = event.data?.after?.data();
    
    if (!afterData?.uids || !Array.isArray(afterData.uids)) {
      return;
    }
    
    console.log(`🔄 Ruoli ${roleType} modificati in tenant ${tenantId}: ${afterData.uids.length} utenti`);
    
    // Mappa roleType a role name
    const roleMap = {
      'admins': 'admin',
      'coaches': 'coach', 
      'superadmins': 'superadmin'
    };
    const role = roleMap[roleType] || roleType;
    
    // Aggiorna mapping per tutti gli utenti nel ruolo
    await Promise.all(
      afterData.uids.map(uid => updateUserTenantMapping(uid, tenantId, role))
    );
  }
);

/**
 * Callable function: permette di triggare manualmente l'aggregazione
 * Utile per testing o refresh immediato
 * SECURITY: Richiede autenticazione admin o Platform CEO
 */
exports.triggerStatsAggregation = onCall(
  { cors: true },
  async (request) => {
    // Rate limiting - operazione pesante, limita a 5 per 5 minuti
    enforceRateLimit(request, 'triggerStatsAggregation');
    
    // Richiede autenticazione
    requireAuth(request);
    
    // Validazione input (tenantId è opzionale)
    const { tenantId } = validateInput(request.data || {}, {
      tenantId: validators.optional(validators.tenantId)
    });
    
    console.log('🎯 Aggregazione manuale richiesta', tenantId ? `per tenant: ${tenantId}` : 'per tutti i tenant');
    console.log('👤 Richiesta da:', request.auth.uid);
    
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
    // Rate limiting
    enforceRateLimit(request, 'manychatProxy');
    
    // Richiede autenticazione
    requireAuth(request);
    
    // Validazione input
    const { tenantId, endpoint, method, body } = validateInput(request.data, {
      tenantId: validators.tenantId,
      endpoint: validators.nonEmptyString,
      method: validators.optional(validators.oneOf(['GET', 'POST', 'PUT', 'DELETE'])),
      body: validators.optional(validators.object)
    });
    
    const httpMethod = method || 'GET';

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
    
    if (httpMethod === 'POST') {
      finalBody = { ...finalBody, page_id: parseInt(pageId) };
    } else {
      finalUrl = url.includes('?') 
        ? `${url}&page_id=${pageId}`
        : `${url}?page_id=${pageId}`;
    }

    console.log('🔗 ManyChat API Call:', httpMethod, finalUrl);

    // Fai la richiesta a ManyChat
    const response = await fetch(finalUrl, {
      method: httpMethod,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: httpMethod === 'POST' ? JSON.stringify(finalBody) : undefined
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
// SECURITY: Richiede autenticazione, rate limit stretto
exports.exchangeOAuthToken = onCall(
  {
    region: 'europe-west1',
    secrets: ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET']
  },
  async (request) => {
    // Rate limiting stretto - solo 5 richieste per minuto (operazione sensibile)
    enforceRateLimit(request, 'exchangeOAuthToken');
    
    // Richiede autenticazione
    requireAuth(request);
    
    try {
      // Validazione input
      const { provider, code, tenantId, redirectUri } = validateInput(request.data, {
        provider: validators.nonEmptyString,
        code: validators.nonEmptyString,
        tenantId: validators.tenantId,
        redirectUri: validators.optional(validators.nonEmptyString)
      });

      console.log(`🔐 OAuth exchange per ${provider}, tenant: ${tenantId}, user: ${request.auth.uid}`);

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
        },
        whatsapp: {
          tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
          clientId: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET
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
// SECURITY: Rate limiting, autenticazione, validazione input
exports.instagramProxy = onCall(
  {
    region: 'europe-west1'
  },
  async (request) => {
    // Rate limiting
    enforceRateLimit(request, 'instagramProxy');
    
    // Richiede autenticazione
    requireAuth(request);
    
    try {
      // Validazione input
      const { tenantId, endpoint, params } = validateInput(request.data, {
        tenantId: validators.tenantId,
        endpoint: validators.nonEmptyString,
        params: validators.optional(validators.nonEmptyString)
      });

      console.log(`📞 Instagram API call: ${endpoint} per tenant ${tenantId}, user: ${request.auth.uid}`);

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
// SECURITY: Rate limiting, autenticazione, validazione input
exports.manualSyncInstagram = onCall(
  {
    region: 'europe-west1'
  },
  async (request) => {
    // Rate limiting
    enforceRateLimit(request, 'manualSyncInstagram');
    
    // Richiede autenticazione
    requireAuth(request);
    
    try {
      // Validazione input (tenantId può venire da auth o data)
      const tenantId = request.auth?.token?.tenantId || 
        (request.data?.tenantId ? validateInput({ tenantId: request.data.tenantId }, { tenantId: validators.tenantId }).tenantId : null);
      
      if (!tenantId) {
        throw new Error('Tenant ID non trovato');
      }

      console.log(`🔄 Sync manuale Instagram per tenant: ${tenantId}, user: ${request.auth.uid}`);

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
// SECURITY: Rate limiting, autenticazione, validazione input
exports.manualSyncManyChat = onCall(
  {
    region: 'europe-west1'
  },
  async (request) => {
    // Rate limiting
    enforceRateLimit(request, 'manualSyncManyChat');
    
    // Richiede autenticazione
    requireAuth(request);
    
    try {
      // Validazione input (tenantId può venire da auth o data)
      const tenantId = request.auth?.token?.tenantId || 
        (request.data?.tenantId ? validateInput({ tenantId: request.data.tenantId }, { tenantId: validators.tenantId }).tenantId : null);
      
      if (!tenantId) {
        throw new Error('Tenant ID non trovato');
      }

      console.log(`🔄 Sync manuale per tenant: ${tenantId}, user: ${request.auth.uid}`);

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
 * SECURITY: Richiede autenticazione (solo admin/coach possono generare), rate limiting
 */
exports.generateMagicLink = onCall(async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'generateMagicLink');
  
  // Richiede autenticazione (coach/admin genera per cliente)
  requireAuth(request);
  
  // Validazione input
  const { clientId, tenantId, email, name } = validateInput(request.data, {
    clientId: validators.nonEmptyString,
    tenantId: validators.tenantId,
    email: validators.email,
    name: validators.optional(validators.nonEmptyString)
  });

  console.log('🔗 [MAGIC-LINK] Generazione link per:', email, 'da:', request.auth.uid);

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
 * SECURITY: Rate limiting (no auth - validazione pre-login), validazione input
 */
exports.validateMagicLink = onCall(async (request) => {
  // Rate limiting (importante per prevenire brute force)
  enforceRateLimit(request, 'validateMagicLink');
  
  // Validazione input
  const { token } = validateInput(request.data, {
    token: validators.nonEmptyString
  });

  console.log('🔍 [MAGIC-LINK] Validazione token:', token?.substring(0, 8) + '...');

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
 * SECURITY: Rate limiting stretto (sensibile), validazione input
 */
exports.completeMagicLinkSetup = onCall(async (request) => {
  // Rate limiting stretto (operazione sensibile)
  enforceRateLimit(request, 'completeMagicLinkSetup');
  
  // Validazione input
  const { token, newPassword } = validateInput(request.data, {
    token: validators.nonEmptyString,
    newPassword: validators.nonEmptyString
  });

  console.log('🔐 [MAGIC-LINK] Completamento setup per token:', token?.substring(0, 8) + '...');

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

    // Aggiorna il documento cliente per rimuovere la password temporanea e firstLogin
    const clientRef = db.collection('tenants').doc(tokenData.tenantId).collection('clients').doc(tokenData.clientId);
    await clientRef.update({
      tempPassword: admin.firestore.FieldValue.delete(),
      passwordSetAt: admin.firestore.FieldValue.serverTimestamp(),
      accountActivated: true,
      firstLogin: false  // IMPORTANTE: evita redirect a /first-access
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

// ============================================
// WHATSAPP BUSINESS API INTEGRATION
// ============================================

// Invia messaggio WhatsApp manuale
// SECURITY: Rate limiting, autenticazione, validazione input
exports.sendWhatsAppMessage = onCall(
  { region: 'europe-west1' },
  async (request) => {
    // Rate limiting
    enforceRateLimit(request, 'sendWhatsAppMessage');
    
    // Richiede autenticazione
    requireAuth(request);
    
    try {
      // Validazione input
      const { tenantId, clientId, templateId, customMessage } = validateInput(request.data, {
        tenantId: validators.tenantId,
        clientId: validators.nonEmptyString,
        templateId: validators.optional(validators.nonEmptyString),
        customMessage: validators.optional(validators.nonEmptyString)
      });

      console.log(`📱 Invio WhatsApp per tenant ${tenantId}, client ${clientId}, user: ${request.auth.uid}`);

      // Leggi configurazione WhatsApp del tenant
      const whatsappConfig = await db.doc(`tenants/${tenantId}/integrations/whatsapp`).get();
      
      if (!whatsappConfig.exists || !whatsappConfig.data().enabled) {
        throw new Error('WhatsApp non configurato per questo tenant');
      }

      const { access_token, phone_number_id } = whatsappConfig.data();

      // Leggi dati cliente
      const clientDoc = await db.doc(`tenants/${tenantId}/clients/${clientId}`).get();
      if (!clientDoc.exists) {
        throw new Error('Cliente non trovato');
      }

      const client = clientDoc.data();
      const clientPhone = client.phone?.replace(/[^0-9]/g, '');

      if (!clientPhone) {
        throw new Error('Numero di telefono cliente non valido');
      }

      // Leggi template messaggio
      let messageText = customMessage;
      
      if (!messageText && templateId) {
        const templatesDoc = await db.doc(`tenants/${tenantId}/settings/whatsapp_templates`).get();
        if (templatesDoc.exists) {
          const template = templatesDoc.data().templates?.find(t => t.id === templateId);
          if (template) {
            // Leggi dati trainer per personalizzazione
            const tenantDoc = await db.doc(`tenants/${tenantId}`).get();
            const trainerName = tenantDoc.data()?.ownerName || tenantDoc.data()?.name || 'Il tuo trainer';
            
            messageText = template.message
              .replace(/{nome}/g, client.name || client.displayName || 'Cliente')
              .replace(/{trainer_name}/g, trainerName)
              .replace(/{ora}/g, new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
              .replace(/{data}/g, new Date().toLocaleDateString('it-IT'));
          }
        }
      }

      if (!messageText) {
        throw new Error('Nessun messaggio da inviare');
      }

      // Invia messaggio via WhatsApp Cloud API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: clientPhone,
            type: 'text',
            text: { body: messageText }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Errore WhatsApp API:', error);
        throw new Error(error.error?.message || 'Errore invio messaggio');
      }

      const result = await response.json();
      console.log('✅ Messaggio WhatsApp inviato:', result);

      // Log invio
      await db.collection(`tenants/${tenantId}/whatsapp_logs`).add({
        clientId,
        clientName: client.name || client.displayName,
        clientPhone,
        templateId: templateId || 'custom',
        message: messageText,
        status: 'sent',
        messageId: result.messages?.[0]?.id,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { 
        success: true, 
        messageId: result.messages?.[0]?.id,
        message: 'Messaggio inviato con successo!'
      };

    } catch (error) {
      console.error('💥 Errore sendWhatsAppMessage:', error);
      throw new Error(error.message);
    }
  }
);

// Genera link WhatsApp (fallback senza API)
// SECURITY: Rate limiting, autenticazione, validazione input
exports.generateWhatsAppLink = onCall(
  { region: 'europe-west1' },
  async (request) => {
    // Rate limiting
    enforceRateLimit(request, 'generateWhatsAppLink');
    
    // Richiede autenticazione
    requireAuth(request);
    
    try {
      // Validazione input
      const { tenantId, clientId, templateId } = validateInput(request.data, {
        tenantId: validators.tenantId,
        clientId: validators.nonEmptyString,
        templateId: validators.optional(validators.nonEmptyString)
      });

      // Leggi dati cliente
      const clientDoc = await db.doc(`tenants/${tenantId}/clients/${clientId}`).get();
      if (!clientDoc.exists) {
        throw new Error('Cliente non trovato');
      }

      const client = clientDoc.data();
      let clientPhone = client.phone?.replace(/[^0-9]/g, '');

      // Aggiungi prefisso Italia se manca
      if (clientPhone && !clientPhone.startsWith('39') && clientPhone.length === 10) {
        clientPhone = '39' + clientPhone;
      }

      if (!clientPhone) {
        throw new Error('Numero di telefono cliente non valido');
      }

      // Leggi template messaggio
      let messageText = '';
      
      if (templateId) {
        const templatesDoc = await db.doc(`tenants/${tenantId}/settings/whatsapp_templates`).get();
        if (templatesDoc.exists) {
          const template = templatesDoc.data().templates?.find(t => t.id === templateId);
          if (template) {
            // Leggi dati trainer
            const tenantDoc = await db.doc(`tenants/${tenantId}`).get();
            const trainerName = tenantDoc.data()?.ownerName || tenantDoc.data()?.name || 'Il tuo trainer';
            
            messageText = template.message
              .replace(/{nome}/g, client.name || client.displayName || 'Cliente')
              .replace(/{trainer_name}/g, trainerName)
              .replace(/{ora}/g, new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
              .replace(/{data}/g, new Date().toLocaleDateString('it-IT'));
          }
        }
      }

      // Genera link WhatsApp
      const encodedMessage = encodeURIComponent(messageText);
      const whatsappLink = `https://wa.me/${clientPhone}${messageText ? `?text=${encodedMessage}` : ''}`;

      return { 
        success: true, 
        link: whatsappLink,
        phone: clientPhone,
        message: messageText
      };

    } catch (error) {
      console.error('💥 Errore generateWhatsAppLink:', error);
      throw new Error(error.message);
    }
  }
);

// Scheduler: Controlla scadenze e invia messaggi automatici
exports.checkExpiringSubscriptions = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: 'Europe/Rome',
    region: 'europe-west1'
  },
  async (context) => {
    console.log('🔔 Controllo scadenze abbonamenti...');

    try {
      // Ottieni tutti i tenant con WhatsApp attivo
      const tenantsSnap = await db.collection('tenants').get();
      
      for (const tenantDoc of tenantsSnap.docs) {
        const tenantId = tenantDoc.id;
        
        // Verifica se WhatsApp è configurato
        const whatsappConfig = await db.doc(`tenants/${tenantId}/integrations/whatsapp`).get();
        if (!whatsappConfig.exists || !whatsappConfig.data().enabled) {
          continue;
        }

        // Leggi template
        const templatesDoc = await db.doc(`tenants/${tenantId}/settings/whatsapp_templates`).get();
        if (!templatesDoc.exists) continue;
        
        const templates = templatesDoc.data().templates || [];
        const expiringTemplates = templates.filter(t => 
          t.enabled && 
          t.type === 'automatic' && 
          t.trigger === 'subscription_expiring'
        );

        if (expiringTemplates.length === 0) continue;

        // Leggi clienti con abbonamento attivo
        const clientsSnap = await db.collection(`tenants/${tenantId}/clients`)
          .where('status', '==', 'active')
          .get();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const clientDoc of clientsSnap.docs) {
          const client = clientDoc.data();
          const clientPhone = client.phone?.replace(/[^0-9]/g, '');
          
          if (!clientPhone || !client.subscriptionEnd) continue;

          const expirationDate = client.subscriptionEnd.toDate ? 
            client.subscriptionEnd.toDate() : 
            new Date(client.subscriptionEnd);
          
          const daysUntilExpiration = Math.ceil(
            (expirationDate - today) / (1000 * 60 * 60 * 24)
          );

          // Trova template corrispondente ai giorni
          const matchingTemplate = expiringTemplates.find(t => 
            t.triggerDays === daysUntilExpiration
          );

          if (matchingTemplate) {
            // Verifica se non abbiamo già inviato questo messaggio
            const existingLog = await db.collection(`tenants/${tenantId}/whatsapp_logs`)
              .where('clientId', '==', clientDoc.id)
              .where('templateId', '==', matchingTemplate.id)
              .where('sentAt', '>=', admin.firestore.Timestamp.fromDate(
                new Date(today.getTime() - 24 * 60 * 60 * 1000)
              ))
              .limit(1)
              .get();

            if (existingLog.empty) {
              console.log(`📱 Invio reminder scadenza a ${client.name} (${daysUntilExpiration} giorni)`);
              
              // Invia messaggio (usa la funzione sendWhatsAppMessage internamente)
              try {
                const tenantData = tenantDoc.data();
                const trainerName = tenantData.ownerName || tenantData.name || 'Il tuo trainer';
                
                const messageText = matchingTemplate.message
                  .replace(/{nome}/g, client.name || client.displayName || 'Cliente')
                  .replace(/{trainer_name}/g, trainerName);

                const { access_token, phone_number_id } = whatsappConfig.data();

                const response = await fetch(
                  `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${access_token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      messaging_product: 'whatsapp',
                      recipient_type: 'individual',
                      to: clientPhone.startsWith('39') ? clientPhone : '39' + clientPhone,
                      type: 'text',
                      text: { body: messageText }
                    })
                  }
                );

                if (response.ok) {
                  const result = await response.json();
                  
                  await db.collection(`tenants/${tenantId}/whatsapp_logs`).add({
                    clientId: clientDoc.id,
                    clientName: client.name || client.displayName,
                    clientPhone,
                    templateId: matchingTemplate.id,
                    message: messageText,
                    status: 'sent',
                    messageId: result.messages?.[0]?.id,
                    automatic: true,
                    trigger: 'subscription_expiring',
                    daysUntilExpiration,
                    sentAt: admin.firestore.FieldValue.serverTimestamp()
                  });

                  console.log(`✅ Messaggio inviato a ${client.name}`);
                }
              } catch (sendError) {
                console.error(`❌ Errore invio a ${client.name}:`, sendError);
              }
            }
          }
        }
      }

      console.log('✅ Controllo scadenze completato');
    } catch (error) {
      console.error('💥 Errore checkExpiringSubscriptions:', error);
    }
  }
);

// Scheduler: Auguri di compleanno
exports.sendBirthdayWishes = onSchedule(
  {
    schedule: 'every day 08:00',
    timeZone: 'Europe/Rome',
    region: 'europe-west1'
  },
  async (context) => {
    console.log('🎂 Controllo compleanni...');

    try {
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      const tenantsSnap = await db.collection('tenants').get();
      
      for (const tenantDoc of tenantsSnap.docs) {
        const tenantId = tenantDoc.id;
        
        // Verifica WhatsApp attivo
        const whatsappConfig = await db.doc(`tenants/${tenantId}/integrations/whatsapp`).get();
        if (!whatsappConfig.exists || !whatsappConfig.data().enabled) continue;

        // Leggi template compleanno
        const templatesDoc = await db.doc(`tenants/${tenantId}/settings/whatsapp_templates`).get();
        if (!templatesDoc.exists) continue;
        
        const birthdayTemplate = templatesDoc.data().templates?.find(t => 
          t.enabled && t.type === 'automatic' && t.trigger === 'birthday'
        );

        if (!birthdayTemplate) continue;

        // Cerca clienti con compleanno oggi
        const clientsSnap = await db.collection(`tenants/${tenantId}/clients`)
          .where('status', '==', 'active')
          .get();

        for (const clientDoc of clientsSnap.docs) {
          const client = clientDoc.data();
          
          if (!client.birthDate || !client.phone) continue;

          const birthDate = client.birthDate.toDate ? 
            client.birthDate.toDate() : 
            new Date(client.birthDate);

          if (birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay) {
            const clientPhone = client.phone.replace(/[^0-9]/g, '');
            
            console.log(`🎂 Compleanno di ${client.name}!`);

            try {
              const tenantData = tenantDoc.data();
              const trainerName = tenantData.ownerName || tenantData.name || 'Il tuo trainer';
              
              const messageText = birthdayTemplate.message
                .replace(/{nome}/g, client.name || client.displayName || 'Cliente')
                .replace(/{trainer_name}/g, trainerName);

              const { access_token, phone_number_id } = whatsappConfig.data();

              const response = await fetch(
                `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: clientPhone.startsWith('39') ? clientPhone : '39' + clientPhone,
                    type: 'text',
                    text: { body: messageText }
                  })
                }
              );

              if (response.ok) {
                await db.collection(`tenants/${tenantId}/whatsapp_logs`).add({
                  clientId: clientDoc.id,
                  clientName: client.name,
                  clientPhone,
                  templateId: birthdayTemplate.id,
                  message: messageText,
                  status: 'sent',
                  automatic: true,
                  trigger: 'birthday',
                  sentAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`✅ Auguri inviati a ${client.name}`);
              }
            } catch (sendError) {
              console.error(`❌ Errore invio auguri a ${client.name}:`, sendError);
            }
          }
        }
      }

      console.log('✅ Controllo compleanni completato');
    } catch (error) {
      console.error('💥 Errore sendBirthdayWishes:', error);
    }
  }
);

// ============================================
// SISTEMA INVITI - Onboarding Modernizzato
// ============================================

/**
 * Genera un codice invito breve univoco
 * Formato: 6 caratteri alfanumerici uppercase (es: ABC123)
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Esclusi I,O,0,1 per evitare confusione
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Crea un invito per un nuovo cliente
 * L'invito può essere condiviso via link, QR code o codice breve
 * 
 * @param {Object} request.data
 * @param {string} request.data.tenantId - ID del tenant
 * @param {string} request.data.name - Nome del cliente (opzionale)
 * @param {string} request.data.email - Email del cliente (opzionale)
 * @param {string} request.data.phone - Telefono del cliente (opzionale)
 * @param {string} request.data.planType - Tipo piano (opzionale)
 * @param {number} request.data.duration - Durata in mesi (opzionale)
 * @param {number} request.data.expiryDays - Giorni validità invito (default 7)
 * @param {string} request.data.welcomeMessage - Messaggio personalizzato (opzionale)
 */
exports.createClientInvitation = onCall(async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'createClientInvitation');
  
  // Richiede autenticazione (solo admin/coach)
  requireAuth(request);
  
  // Validazione input
  const { 
    tenantId, 
    name, 
    email, 
    phone, 
    planType, 
    duration,
    paymentAmount,
    expiryDays,
    welcomeMessage,
    leadId // Se viene da conversione lead
  } = validateInput(request.data, {
    tenantId: validators.tenantId,
    name: validators.optional(validators.nonEmptyString),
    email: validators.optional(validators.email),
    phone: validators.optional(validators.nonEmptyString),
    planType: validators.optional(validators.nonEmptyString),
    duration: validators.optional(validators.positiveNumber),
    paymentAmount: validators.optional(validators.positiveNumber),
    expiryDays: validators.optional(validators.positiveNumber),
    welcomeMessage: validators.optional(validators.nonEmptyString),
    leadId: validators.optional(validators.nonEmptyString)
  });

  console.log('📨 [INVITE] Creazione invito per tenant:', tenantId, 'da:', request.auth.uid);

  try {
    // Genera codice univoco
    let inviteCode;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Assicurati che il codice sia univoco
    do {
      inviteCode = generateInviteCode();
      const existingInvite = await db.collection('invitations')
        .where('code', '==', inviteCode)
        .where('status', 'in', ['pending', 'sent'])
        .limit(1)
        .get();
      
      if (existingInvite.empty) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Impossibile generare un codice univoco. Riprova.');
    }

    // Genera token lungo per URL (32 caratteri)
    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');

    // Calcola scadenza (default 7 giorni)
    const validDays = expiryDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validDays);

    // Recupera info tenant per branding
    const tenantDoc = await db.doc(`tenants/${tenantId}`).get();
    const tenantData = tenantDoc.exists ? tenantDoc.data() : {};
    const tenantName = tenantData.name || tenantData.businessName || 'Il tuo coach';

    // Crea documento invito
    const inviteRef = db.collection('invitations').doc(token);
    const inviteData = {
      // Identificatori
      token,
      code: inviteCode,
      tenantId,
      
      // Dati cliente pre-compilati
      clientData: {
        name: name || null,
        email: email ? email.toLowerCase().trim() : null,
        phone: phone || null,
        planType: planType || null,
        duration: duration || null,
        paymentAmount: paymentAmount || null,
      },
      
      // Conversione da lead
      leadId: leadId || null,
      
      // Stato invito
      status: 'pending', // pending | sent | opened | completed | expired | cancelled
      
      // Tracking
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      expiresAt,
      
      // Tracking aperture
      openedAt: null,
      openCount: 0,
      lastOpenedAt: null,
      
      // Completamento
      completedAt: null,
      completedBy: null, // UID del cliente creato
      
      // Personalizzazione
      welcomeMessage: welcomeMessage || null,
      tenantName,
      
      // Reminder
      reminderSentAt: null,
      reminderCount: 0,
    };

    await inviteRef.set(inviteData);

    console.log('✅ [INVITE] Invito creato:', inviteCode, 'token:', token.substring(0, 8) + '...');

    // Genera URL invito
    const baseUrl = process.env.FUNCTIONS_EMULATOR 
      ? 'http://localhost:5173' 
      : 'https://www.flowfitpro.it';
    
    const inviteUrl = `${baseUrl}/invite/${token}`;
    
    // Genera URL breve con codice (fallback se URL non funziona)
    const inviteCodeUrl = `${baseUrl}/invite?code=${inviteCode}`;

    // Genera messaggio WhatsApp precompilato
    const clientNameText = name ? `Ciao ${name}! ` : 'Ciao! ';
    const whatsappMessage = welcomeMessage || 
      `${clientNameText}Sei stato invitato a unirti a ${tenantName}! 🎉\n\n` +
      `Clicca il link per completare la registrazione:\n${inviteUrl}\n\n` +
      `Oppure inserisci il codice: ${inviteCode}\n\n` +
      `Il link è valido per ${validDays} giorni.`;
    
    // Genera link WhatsApp
    const whatsappLink = phone 
      ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    return {
      success: true,
      invitation: {
        token,
        code: inviteCode,
        url: inviteUrl,
        codeUrl: inviteCodeUrl,
        expiresAt: expiresAt.toISOString(),
        expiryDays: validDays,
        whatsappLink,
        whatsappMessage,
        tenantName,
        clientData: inviteData.clientData,
      }
    };

  } catch (error) {
    console.error('💥 [INVITE] Errore creazione:', error);
    throw new Error(error.message || 'Errore nella creazione dell\'invito');
  }
});

/**
 * Valida un invito (per token o codice)
 * Chiamata quando il cliente apre il link invito
 */
exports.validateInvitation = onCall(async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'validateInvitation');
  
  // Non richiede autenticazione (pre-login)
  
  const { token, code } = validateInput(request.data, {
    token: validators.optional(validators.nonEmptyString),
    code: validators.optional(validators.nonEmptyString)
  });

  if (!token && !code) {
    return { valid: false, reason: 'Token o codice richiesto' };
  }

  console.log('🔍 [INVITE] Validazione:', token ? `token ${token.substring(0, 8)}...` : `code ${code}`);

  try {
    let inviteDoc;
    
    if (token) {
      // Ricerca per token (URL diretto)
      inviteDoc = await db.collection('invitations').doc(token).get();
    } else {
      // Ricerca per codice breve
      const inviteQuery = await db.collection('invitations')
        .where('code', '==', code.toUpperCase())
        .where('status', 'in', ['pending', 'sent', 'opened'])
        .limit(1)
        .get();
      
      if (!inviteQuery.empty) {
        inviteDoc = inviteQuery.docs[0];
      }
    }

    if (!inviteDoc || !inviteDoc.exists) {
      console.log('❌ [INVITE] Invito non trovato');
      return { valid: false, reason: 'Invito non valido o già utilizzato' };
    }

    const invite = inviteDoc.data();

    // Controlla stato
    if (invite.status === 'completed') {
      console.log('❌ [INVITE] Invito già completato');
      return { valid: false, reason: 'Questo invito è già stato utilizzato' };
    }

    if (invite.status === 'cancelled') {
      console.log('❌ [INVITE] Invito cancellato');
      return { valid: false, reason: 'Questo invito è stato annullato' };
    }

    if (invite.status === 'expired') {
      console.log('❌ [INVITE] Invito scaduto (status)');
      return { valid: false, reason: 'Questo invito è scaduto. Contatta il tuo coach per un nuovo invito.' };
    }

    // Controlla scadenza
    const now = new Date();
    const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt);
    if (now > expiresAt) {
      console.log('❌ [INVITE] Invito scaduto (data)');
      // Aggiorna status a expired
      await inviteDoc.ref.update({ status: 'expired' });
      return { valid: false, reason: 'Questo invito è scaduto. Contatta il tuo coach per un nuovo invito.' };
    }

    // Aggiorna tracking aperture
    await inviteDoc.ref.update({
      status: invite.status === 'pending' ? 'opened' : invite.status,
      openedAt: invite.openedAt || admin.firestore.FieldValue.serverTimestamp(),
      openCount: admin.firestore.FieldValue.increment(1),
      lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ [INVITE] Invito valido per tenant:', invite.tenantId);

    // Recupera branding tenant
    const tenantDoc = await db.doc(`tenants/${invite.tenantId}`).get();
    const tenantData = tenantDoc.exists ? tenantDoc.data() : {};

    return {
      valid: true,
      invitation: {
        token: invite.token,
        code: invite.code,
        tenantId: invite.tenantId,
        tenantName: invite.tenantName || tenantData.name || 'Coach',
        tenantLogo: tenantData.branding?.logo || tenantData.logoUrl || null,
        tenantColors: tenantData.branding?.colors || null,
        clientData: invite.clientData || {},
        welcomeMessage: invite.welcomeMessage,
        expiresAt: expiresAt.toISOString(),
      }
    };

  } catch (error) {
    console.error('💥 [INVITE] Errore validazione:', error);
    return { valid: false, reason: 'Errore di sistema. Riprova più tardi.' };
  }
});

/**
 * Completa la registrazione da invito
 * Crea l'account cliente e lo collega al tenant
 */
exports.completeInvitation = onCall(async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'completeInvitation');
  
  // Non richiede autenticazione (il cliente non è ancora loggato)
  
  const { 
    token, 
    name, 
    email, 
    password, 
    phone,
    acceptTerms,
    acceptPrivacy 
  } = validateInput(request.data, {
    token: validators.nonEmptyString,
    name: validators.nonEmptyString,
    email: validators.email,
    password: validators.nonEmptyString,
    phone: validators.nonEmptyString, // Telefono obbligatorio
    acceptTerms: validators.optional(validators.boolean),
    acceptPrivacy: validators.optional(validators.boolean)
  });

  console.log('📝 [INVITE] Completamento invito:', token.substring(0, 8) + '...', 'per:', email);

  try {
    // Valida l'invito
    const inviteRef = db.collection('invitations').doc(token);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      throw new Error('Invito non valido');
    }

    const invite = inviteDoc.data();

    // Verifica stato
    if (invite.status === 'completed') {
      throw new Error('Questo invito è già stato utilizzato');
    }

    if (invite.status === 'cancelled' || invite.status === 'expired') {
      throw new Error('Questo invito non è più valido');
    }

    // Verifica scadenza
    const now = new Date();
    const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt);
    if (now > expiresAt) {
      await inviteRef.update({ status: 'expired' });
      throw new Error('Questo invito è scaduto');
    }

    // Verifica che l'email non sia già in uso
    try {
      await admin.auth().getUserByEmail(email.toLowerCase().trim());
      throw new Error('Questa email è già registrata. Prova ad accedere o usa un\'altra email.');
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
      // OK - email non in uso
    }

    // Crea utente Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email.toLowerCase().trim(),
      password,
      displayName: name,
    });

    const newUserId = userRecord.uid;
    console.log('✅ [INVITE] Utente creato:', newUserId);

    // Prepara dati cliente
    const clientData = invite.clientData || {};
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    let expiryDate = null;
    if (clientData.duration) {
      expiryDate = new Date(startDate);
      expiryDate.setMonth(expiryDate.getMonth() + parseInt(clientData.duration, 10));
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 giorni di grazia
    }

    // Crea documento cliente nel tenant
    const clientRef = db.doc(`tenants/${invite.tenantId}/clients/${newUserId}`);
    await clientRef.set({
      name,
      name_lowercase: name.toLowerCase(),
      email: email.toLowerCase().trim(),
      phone: phone || clientData.phone || null,
      status: 'attivo',
      planType: clientData.planType || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      startDate,
      scadenza: expiryDate,
      isClient: true,
      firstLogin: false, // Non serve first login, ha già impostato la password
      assignedCoaches: invite.createdBy ? [invite.createdBy] : [],
      statoPercorso: 'Attivo',
      price: clientData.paymentAmount || null,
      // Registrazione self-service
      registeredViaInvite: true,
      inviteToken: token,
      inviteCode: invite.code,
      // Consensi
      termsAcceptedAt: acceptTerms ? admin.firestore.FieldValue.serverTimestamp() : null,
      privacyAcceptedAt: acceptPrivacy ? admin.firestore.FieldValue.serverTimestamp() : null,
    });

    // Crea mapping globale utente → tenant
    await db.doc(`user_tenants/${newUserId}`).set({
      [invite.tenantId]: {
        role: 'client',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        viaInvite: true,
      }
    }, { merge: true });

    // Aggiorna invito come completato
    await inviteRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedBy: newUserId,
      completedEmail: email.toLowerCase().trim(),
    });

    // Se era collegato a un lead, aggiorna il lead
    if (invite.leadId) {
      const leadRef = db.doc(`tenants/${invite.tenantId}/collaboratori_leads/${invite.leadId}`);
      await leadRef.update({
        status: 'convertito',
        convertedToClientId: newUserId,
        convertedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(err => console.warn('Lead update failed:', err));
    }

    console.log('✅ [INVITE] Registrazione completata per:', email);

    return {
      success: true,
      clientId: newUserId,
      tenantId: invite.tenantId,
      message: 'Registrazione completata! Puoi ora accedere con le tue credenziali.',
    };

  } catch (error) {
    console.error('💥 [INVITE] Errore completamento:', error);
    throw new Error(error.message || 'Errore nella registrazione');
  }
});

/**
 * Lista inviti per un tenant
 * Solo admin/coach possono vedere gli inviti
 */
exports.listInvitations = onCall(async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'listInvitations');
  
  // Richiede autenticazione
  requireAuth(request);
  
  const { tenantId, status, limit: queryLimit } = validateInput(request.data, {
    tenantId: validators.tenantId,
    status: validators.optional(validators.nonEmptyString),
    limit: validators.optional(validators.positiveNumber)
  });

  console.log('📋 [INVITE] Lista inviti per tenant:', tenantId);

  try {
    let query = db.collection('invitations')
      .where('tenantId', '==', tenantId)
      .orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (queryLimit) {
      query = query.limit(queryLimit);
    } else {
      query = query.limit(50);
    }

    const snapshot = await query.get();
    
    const invitations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        token: data.token,
        code: data.code,
        status: data.status,
        clientData: data.clientData,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
        openCount: data.openCount || 0,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
        completedBy: data.completedBy,
      };
    });

    return {
      success: true,
      invitations,
      total: invitations.length,
    };

  } catch (error) {
    console.error('💥 [INVITE] Errore lista:', error);
    throw new Error('Errore nel recupero degli inviti');
  }
});

/**
 * Cancella un invito
 */
exports.cancelInvitation = onCall(async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'cancelInvitation');
  
  // Richiede autenticazione
  requireAuth(request);
  
  const { token } = validateInput(request.data, {
    token: validators.nonEmptyString
  });

  console.log('❌ [INVITE] Cancellazione invito:', token.substring(0, 8) + '...');

  try {
    const inviteRef = db.collection('invitations').doc(token);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      throw new Error('Invito non trovato');
    }

    const invite = inviteDoc.data();

    if (invite.status === 'completed') {
      throw new Error('Impossibile cancellare un invito già completato');
    }

    await inviteRef.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledBy: request.auth.uid,
    });

    console.log('✅ [INVITE] Invito cancellato');

    return { success: true };

  } catch (error) {
    console.error('💥 [INVITE] Errore cancellazione:', error);
    throw new Error(error.message || 'Errore nella cancellazione');
  }
});

/**
 * Reinvia/rigenera un invito scaduto
 */
exports.resendInvitation = onCall(async (request) => {
  // Rate limiting
  enforceRateLimit(request, 'resendInvitation');
  
  // Richiede autenticazione
  requireAuth(request);
  
  const { token, expiryDays } = validateInput(request.data, {
    token: validators.nonEmptyString,
    expiryDays: validators.optional(validators.positiveNumber)
  });

  console.log('🔄 [INVITE] Rigenerazione invito:', token.substring(0, 8) + '...');

  try {
    const inviteRef = db.collection('invitations').doc(token);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      throw new Error('Invito non trovato');
    }

    const invite = inviteDoc.data();

    if (invite.status === 'completed') {
      throw new Error('Impossibile rigenerare un invito già completato');
    }

    // Genera nuova scadenza
    const validDays = expiryDays || 7;
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + validDays);

    // Genera nuovo codice
    let newCode;
    let attempts = 0;
    do {
      newCode = generateInviteCode();
      const existingInvite = await db.collection('invitations')
        .where('code', '==', newCode)
        .where('status', 'in', ['pending', 'sent'])
        .limit(1)
        .get();
      
      if (existingInvite.empty) break;
      attempts++;
    } while (attempts < 10);

    await inviteRef.update({
      code: newCode,
      status: 'pending',
      expiresAt: newExpiresAt,
      reminderCount: admin.firestore.FieldValue.increment(1),
      lastResentAt: admin.firestore.FieldValue.serverTimestamp(),
      resentBy: request.auth.uid,
    });

    // Rigenera URL e messaggio WhatsApp
    const baseUrl = 'https://www.flowfitpro.it';
    const inviteUrl = `${baseUrl}/invite/${token}`;
    
    const clientName = invite.clientData?.name;
    const whatsappMessage = `${clientName ? `Ciao ${clientName}! ` : 'Ciao! '}Ecco il tuo nuovo link di invito per ${invite.tenantName}:\n\n${inviteUrl}\n\nCodice: ${newCode}\n\nValido per ${validDays} giorni.`;
    
    const phone = invite.clientData?.phone;
    const whatsappLink = phone 
      ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    console.log('✅ [INVITE] Invito rigenerato con nuovo codice:', newCode);

    return {
      success: true,
      invitation: {
        token,
        code: newCode,
        url: inviteUrl,
        expiresAt: newExpiresAt.toISOString(),
        whatsappLink,
        whatsappMessage,
      }
    };

  } catch (error) {
    console.error('💥 [INVITE] Errore rigenerazione:', error);
    throw new Error(error.message || 'Errore nella rigenerazione');
  }
});