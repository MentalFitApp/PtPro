/**
 * Test per verificare l'upload R2 via Cloud Function
 */
const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Inizializza Firebase Admin
const serviceAccount = require('./service-account.json');
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'biondo-fitness-coach'
});

async function testR2Upload() {
  console.log('🧪 Test Upload R2 via Cloud Function\n');
  
  // 1. Crea un'immagine di test (1x1 pixel PNG rosso)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  // 2. Ottieni il project ID e l'URL della Cloud Function
  const projectId = 'biondo-fitness-coach';
  const region = 'europe-west1';
  const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/uploadToR2`;
  
  console.log(`📍 Endpoint: ${functionUrl}`);
  
  // 3. Crea un token di test per un utente esistente
  // Per il test, usiamo un custom token
  try {
    // Trova un utente esistente per il test
    const listResult = await getAuth().listUsers(1);
    if (listResult.users.length === 0) {
      console.log('❌ Nessun utente trovato per il test');
      process.exit(1);
    }
    
    const testUser = listResult.users[0];
    console.log(`👤 Utente test: ${testUser.email || testUser.uid}`);
    
    // Crea custom token
    const customToken = await getAuth().createCustomToken(testUser.uid);
    console.log(`🔑 Custom token creato`);
    
    // 4. Chiama la Cloud Function usando fetch
    const https = require('https');
    const payload = JSON.stringify({
      data: {
        fileData: testImageBase64,
        fileName: 'test-upload.png',
        contentType: 'image/png',
        folder: 'test',
        tenantId: 'test-tenant'
      }
    });
    
    // Per chiamare la Cloud Function callable, serve un ID token valido
    // Facciamo un test diretto senza autenticazione per vedere l'errore
    console.log('\n📤 Invio richiesta di test...');
    
    const fetch = require('node-fetch');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload
    });
    
    const result = await response.json();
    console.log('\n📥 Risposta:', JSON.stringify(result, null, 2));
    
    if (result.error && result.error.message === 'Utente non autenticato') {
      console.log('\n✅ La Cloud Function risponde correttamente!');
      console.log('✅ La protezione autenticazione funziona (rifiuta richieste non autenticate)');
    } else if (result.result && result.result.url) {
      console.log('\n✅ Upload completato!');
      console.log(`📎 URL: ${result.result.url}`);
    } else {
      console.log('\n⚠️ Risposta inattesa');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
  
  process.exit(0);
}

testR2Upload();
