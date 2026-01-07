const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const auth = admin.auth();

async function checkAuthUser() {
  try {
    const user = await auth.getUserByEmail('test-admin@fitflowsapp.com');
    console.log('✅ Utente trovato in Firebase Auth:');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('   Display Name:', user.displayName);
    console.log('   Email Verified:', user.emailVerified);
    console.log('   Disabled:', user.disabled);
  } catch (error) {
    console.error('❌ Errore nel recupero utente:', error.message);
  }
}

checkAuthUser();