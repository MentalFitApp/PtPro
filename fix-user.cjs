const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixUser() {
  const email = 'admin12@live.it';
  const tenantId = 'biondo-fitness-coach'; // Il tenant principale
  
  const userRecord = await admin.auth().getUserByEmail(email);
  const uid = userRecord.uid;
  
  console.log(`\n🔧 Fixing user: ${email} (UID: ${uid})`);
  console.log(`   Adding to tenant: ${tenantId}`);
  
  // Crea documento in tenants/{tenantId}/users/{uid}
  const userRef = db.collection(`tenants/${tenantId}/users`).doc(uid);
  
  await userRef.set({
    email: email,
    role: 'admin', // o 'trainer' se preferisci
    tenantId: tenantId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    displayName: userRecord.displayName || 'Admin',
  }, { merge: true });
  
  console.log(`\n✅ Utente creato in tenants/${tenantId}/users/${uid}`);
  
  // Verifica
  const check = await userRef.get();
  console.log('   Dati salvati:', JSON.stringify(check.data(), null, 2));
}

fixUser().then(() => process.exit(0));
