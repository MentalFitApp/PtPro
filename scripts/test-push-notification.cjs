#!/usr/bin/env node
/**
 * Script per testare l'invio di notifiche push
 * 
 * Uso: node scripts/test-push-notification.cjs <userId>
 * 
 * Questo script:
 * 1. Verifica se l'utente ha un token FCM salvato
 * 2. Crea una notifica di test in Firestore
 * 3. La Cloud Function la intercetterà e invierà la push
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const TENANT_ID = 'biondo-fitness-coach';

async function testPushNotification(userId) {
  console.log('\n🔔 Test Push Notification');
  console.log('='.repeat(50));
  console.log('Tenant:', TENANT_ID);
  console.log('User ID:', userId);
  
  // 1. Verifica token FCM
  console.log('\n📱 Verificando token FCM...');
  const tokenDoc = await db.collection('tenants').doc(TENANT_ID).collection('fcmTokens').doc(userId).get();
  
  if (!tokenDoc.exists) {
    console.log('❌ Nessun token FCM trovato per questo utente!');
    console.log('');
    console.log('L\'utente deve:');
    console.log('1. Accedere all\'app da browser (Android Chrome o iOS Safari PWA)');
    console.log('2. Accettare le notifiche quando richiesto');
    console.log('3. Verificare che il token sia salvato in Firestore');
    
    // Controlla anche path legacy
    const legacyDoc = await db.collection('fcmTokens').doc(userId).get();
    if (legacyDoc.exists) {
      console.log('\n⚠️  Token trovato in path LEGACY (fcmTokens root)');
      console.log('Token:', legacyDoc.data().token?.substring(0, 40) + '...');
    }
    
    return;
  }
  
  const tokenData = tokenDoc.data();
  console.log('✅ Token FCM trovato!');
  console.log('   Platform:', tokenData.platform);
  console.log('   isPWA:', tokenData.isPWA);
  console.log('   enabled:', tokenData.enabled);
  console.log('   Token:', tokenData.token?.substring(0, 40) + '...');
  console.log('   updatedAt:', tokenData.updatedAt?.toDate?.() || tokenData.updatedAt);
  
  // 2. Crea notifica di test
  console.log('\n📤 Creando notifica di test...');
  const notificationRef = await db.collection('tenants').doc(TENANT_ID).collection('notifications').add({
    userId: userId,
    userType: 'client',
    title: '🧪 Test Notifica',
    body: 'Questa è una notifica di test inviata alle ' + new Date().toLocaleTimeString('it-IT'),
    type: 'test',
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('✅ Notifica creata con ID:', notificationRef.id);
  console.log('\n🚀 La Cloud Function dovrebbe intercettarla e inviare la push!');
  console.log('\n💡 Controlla i log della Cloud Function con:');
  console.log('   firebase functions:log --only sendPushNotification');
}

// Esecuzione
const userId = process.argv[2];

if (!userId) {
  console.log('\n❌ Devi specificare un userId!');
  console.log('\nUso: node scripts/test-push-notification.cjs <userId>');
  console.log('\nEsempio:');
  console.log('  node scripts/test-push-notification.cjs AeZKjJYu5zMZ4mvffaGiqCBb0cF2');
  
  // Lista utenti con token
  console.log('\n📋 Utenti con token FCM:');
  db.collection('tenants').doc(TENANT_ID).collection('fcmTokens').get()
    .then(snap => {
      if (snap.empty) {
        console.log('   Nessun utente ha ancora registrato un token FCM');
      } else {
        snap.forEach(doc => {
          const data = doc.data();
          console.log(`   - ${doc.id} (${data.platform || 'unknown'})`);
        });
      }
      process.exit(0);
    });
} else {
  testPushNotification(userId)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Errore:', err);
      process.exit(1);
    });
}
