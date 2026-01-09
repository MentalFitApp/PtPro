// Script completo per testare il sistema di notifiche push
// Usa: node test-notifications-complete.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fetch from 'node-fetch';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('🔔 TEST NOTIFICHE PUSH - CHECK COMPLETO');
console.log('==========================================\n');

// Step 1: Trova l'utente nel tenant
async function findUserInTenant(email) {
  console.log(`📧 1. Cerco utente: ${email}`);
  
  try {
    // Cerca nei clients
    const clientsRef = collection(db, 'tenants/fitflows/clients');
    const clientQ = query(clientsRef, where('email', '==', email));
    const clientSnap = await getDocs(clientQ);
    
    if (!clientSnap.empty) {
      const userData = { id: clientSnap.docs[0].id, ...clientSnap.docs[0].data() };
      console.log(`   ✅ Trovato come CLIENT: ${userData.name || userData.email}`);
      return { ...userData, role: 'client' };
    }
    
    // Cerca nei collaboratori
    const collabRef = collection(db, 'tenants/fitflows/collaboratori');
    const collabQ = query(collabRef, where('email', '==', email));
    const collabSnap = await getDocs(collabQ);
    
    if (!collabSnap.empty) {
      const userData = { id: collabSnap.docs[0].id, ...collabSnap.docs[0].data() };
      console.log(`   ✅ Trovato come COLLABORATORE: ${userData.nome || userData.email}`);
      return { ...userData, role: 'admin' };
    }
    
    console.log('   ❌ Utente non trovato nel tenant');
    return null;
  } catch (error) {
    console.error('   ❌ Errore ricerca utente:', error.message);
    return null;
  }
}

// Step 2: Verifica token FCM salvato
async function checkFCMToken(userId) {
  console.log(`\n🎫 2. Verifico token FCM per utente: ${userId}`);
  
  try {
    const userRef = doc(db, `tenants/fitflows/users/${userId}`);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('   ⚠️  Documento users non trovato, creo...');
      await setDoc(userRef, {
        fcmToken: null,
        pushEnabled: false,
        updatedAt: new Date()
      });
      console.log('   ✅ Documento users creato');
      return null;
    }
    
    const data = userSnap.data();
    const token = data.fcmToken;
    
    if (!token) {
      console.log('   ❌ Nessun token FCM salvato');
      console.log('   💡 L\'utente deve:');
      console.log('      1. Aprire l\'app');
      console.log('      2. Andare in Impostazioni');
      console.log('      3. Attivare le notifiche push');
      return null;
    }
    
    console.log('   ✅ Token FCM trovato:', token.substring(0, 50) + '...');
    console.log(`   📱 Push abilitati: ${data.pushEnabled ? 'SÌ' : 'NO'}`);
    console.log(`   🕐 Ultimo aggiornamento: ${data.updatedAt?.toDate?.() || 'N/D'}`);
    
    return token;
  } catch (error) {
    console.error('   ❌ Errore verifica token:', error.message);
    return null;
  }
}

// Step 3: Verifica permessi browser
async function checkBrowserPermissions() {
  console.log('\n🌐 3. Verifica permessi browser');
  console.log('   💡 DA FARE MANUALMENTE NEL BROWSER:');
  console.log('      1. Apri DevTools (F12)');
  console.log('      2. Console > scrivi: Notification.permission');
  console.log('      3. Deve essere "granted" (non "default" o "denied")');
  console.log('      4. Se non è "granted", vai in Impostazioni > Privacy e sicurezza > Notifiche');
  console.log('      5. Aggiungi il sito alla lista consentiti');
}

// Step 4: Test invio notifica
async function sendTestNotification(token) {
  console.log('\n📤 4. Invio notifica di test...');
  
  if (!FCM_SERVER_KEY) {
    console.log('   ❌ FCM_SERVER_KEY non configurato');
    console.log('   💡 Aggiungi FCM_SERVER_KEY nel file .env');
    console.log('      Vai su: Firebase Console > Project Settings > Cloud Messaging');
    return false;
  }
  
  const message = {
    to: token,
    notification: {
      title: '🎉 Test Notifica - FitFlows',
      body: 'Se vedi questo messaggio, le notifiche funzionano!',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'test-notification',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    },
    data: {
      type: 'test',
      timestamp: Date.now().toString(),
      url: '/dashboard'
    },
    priority: 'high',
    webpush: {
      headers: {
        Urgency: 'high'
      },
      notification: {
        title: '🎉 Test Notifica - FitFlows',
        body: 'Se vedi questo messaggio, le notifiche funzionano!',
        icon: '/logo192.png',
        badge: '/logo192.png',
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'Apri App' },
          { action: 'dismiss', title: 'Chiudi' }
        ]
      }
    }
  };
  
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    const result = await response.json();
    
    if (result.success === 1) {
      console.log('   ✅ Notifica inviata con successo!');
      console.log('   📱 ID Messaggio:', result.results[0].message_id);
      console.log('\n   💡 CONTROLLA:');
      console.log('      - Notifica dovrebbe apparire sul dispositivo');
      console.log('      - Se app è chiusa: notifica nel centro notifiche');
      console.log('      - Se app è aperta: notifica come toast/banner');
      return true;
    } else {
      console.log('   ❌ Errore invio notifica');
      console.log('   Errore:', result.results[0].error);
      
      if (result.results[0].error === 'InvalidRegistration') {
        console.log('\n   💡 Token non valido o scaduto');
        console.log('      1. L\'utente deve disattivare e riattivare le notifiche');
        console.log('      2. Oppure cancellare cache browser e rifare login');
      } else if (result.results[0].error === 'NotRegistered') {
        console.log('\n   💡 Token disattivato o app disinstallata');
        console.log('      L\'utente deve riattivare le notifiche');
      }
      
      return false;
    }
  } catch (error) {
    console.error('   ❌ Errore chiamata FCM:', error.message);
    return false;
  }
}

// Step 5: Verifica Service Worker
async function checkServiceWorker() {
  console.log('\n⚙️  5. Verifica Service Worker');
  console.log('   💡 DA FARE MANUALMENTE NEL BROWSER:');
  console.log('      1. Apri DevTools > Application > Service Workers');
  console.log('      2. Verifica che ci sia un SW attivo');
  console.log('      3. URL deve essere: /service-worker.js o /firebase-messaging-sw.js');
  console.log('      4. Status deve essere: activated and running');
  console.log('      5. Se non c\'è, ricarica pagina o fai Update');
}

// Step 6: Verifica configurazione Firebase
async function checkFirebaseConfig() {
  console.log('\n🔧 6. Verifica configurazione Firebase');
  
  console.log('   ✅ Project ID:', firebaseConfig.projectId);
  console.log('   ✅ Messaging Sender ID:', firebaseConfig.messagingSenderId);
  
  if (!FCM_SERVER_KEY) {
    console.log('   ❌ FCM Server Key NON configurato');
    console.log('   💡 Aggiungi nel .env: FCM_SERVER_KEY=<chiave>');
    console.log('      Vai su: Firebase Console > Project Settings > Cloud Messaging');
    console.log('      Copia "Server key" (non API key!)');
  } else {
    console.log('   ✅ FCM Server Key configurato');
  }
}

// Step 7: Checklist finale
function printChecklist() {
  console.log('\n\n📋 CHECKLIST COMPLETA PER NOTIFICHE PUSH');
  console.log('==========================================\n');
  
  console.log('☐ 1. PERMESSI BROWSER');
  console.log('   - Notification.permission deve essere "granted"');
  console.log('   - Controllabile in DevTools console');
  console.log('');
  
  console.log('☐ 2. SERVICE WORKER');
  console.log('   - Deve essere registrato e attivo');
  console.log('   - Verifica in DevTools > Application > Service Workers');
  console.log('');
  
  console.log('☐ 3. TOKEN FCM');
  console.log('   - Utente deve avere token salvato in Firestore');
  console.log('   - Attivare notifiche in Impostazioni app');
  console.log('');
  
  console.log('☐ 4. FIREBASE CONFIG');
  console.log('   - FCM_SERVER_KEY configurato nel backend');
  console.log('   - VAPID_KEY corretto nel frontend');
  console.log('');
  
  console.log('☐ 5. BACKGROUND/FOREGROUND');
  console.log('   - App chiusa: gestito da service-worker.js');
  console.log('   - App aperta: gestito da onMessage listener');
  console.log('');
  
  console.log('☐ 6. HTTPS');
  console.log('   - Notifiche funzionano solo su HTTPS o localhost');
  console.log('   - Verifica URL nella barra indirizzi');
  console.log('');
  
  console.log('💡 PROBLEMI COMUNI:');
  console.log('   1. Token scaduto → Disattiva/Riattiva notifiche');
  console.log('   2. Permessi negati → Vai in impostazioni browser');
  console.log('   3. SW non attivo → Ricarica pagina');
  console.log('   4. App non in HTTPS → Usa dominio con SSL');
  console.log('');
}

// MAIN EXECUTION
async function main() {
  const testEmail = 'admin12@live.it';
  
  try {
    // Step 1: Trova utente
    const user = await findUserInTenant(testEmail);
    if (!user) {
      console.log('\n❌ TEST FALLITO: Utente non trovato');
      return;
    }
    
    // Step 2: Verifica token
    const token = await checkFCMToken(user.id);
    
    // Step 3: Verifica permessi browser
    checkBrowserPermissions();
    
    // Step 4: Invia notifica se token presente
    if (token) {
      await sendTestNotification(token);
    }
    
    // Step 5: Verifica Service Worker
    checkServiceWorker();
    
    // Step 6: Verifica config
    checkFirebaseConfig();
    
    // Step 7: Checklist
    printChecklist();
    
    console.log('\n✅ TEST COMPLETATO\n');
    
  } catch (error) {
    console.error('\n❌ ERRORE DURANTE IL TEST:', error.message);
    console.error(error.stack);
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
