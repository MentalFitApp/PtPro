const { onCall } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
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