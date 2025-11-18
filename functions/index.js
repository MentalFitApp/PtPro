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

// Cloud Function per inviare notifiche push via FCM
exports.sendPushNotification = onDocumentCreated('notifications/{notificationId}', async (event) => {
  const notification = event.data.data();
  const notificationId = event.params.notificationId;
  const { userId, userType, title, body } = notification;

  console.log('Nuova notifica creata per:', userId, userType);

  try {
    // Recupera il token FCM dell'utente
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
      console.log('Nessun token FCM trovato per:', userId);
      return null;
    }

    const fcmToken = tokenDoc.data().token;
    
    if (!fcmToken) {
      console.log('Token FCM vuoto per:', userId);
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

    // Invia il messaggio
    const response = await admin.messaging().send(message);
    console.log('Notifica push inviata con successo:', response);
    
    return response;
  } catch (error) {
    console.error('Errore invio notifica push:', error);
    
    // Se il token è invalido/scaduto, rimuovilo
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log('Token non valido, rimozione...');
      await db.collection('fcmTokens').doc(userId).delete();
    }
    
    return null;
  }
});