const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUser() {
  const email = 'admin12@live.it';
  console.log(`\n🔍 Cercando utente: ${email}\n`);
  
  // 1. Cerca in Firebase Auth
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('✅ FIREBASE AUTH:');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Provider: ${userRecord.providerData.map(p => p.providerId).join(', ')}`);
    
    const uid = userRecord.uid;
    
    // 2. Cerca nella root collection 'users'
    const rootUserDoc = await db.collection('users').doc(uid).get();
    if (rootUserDoc.exists) {
      console.log('\n✅ ROOT USERS (collection "users"):');
      console.log(`   Data:`, JSON.stringify(rootUserDoc.data(), null, 2));
    } else {
      console.log('\n❌ NON trovato in root "users" collection');
    }
    
    // 3. Cerca in tutti i tenant
    const tenantsSnap = await db.collection('tenants').get();
    console.log('\n🔍 Cercando nei tenant...');
    
    for (const tenant of tenantsSnap.docs) {
      const tenantId = tenant.id;
      const userInTenant = await db.collection(`tenants/${tenantId}/users`).doc(uid).get();
      
      if (userInTenant.exists) {
        console.log(`\n✅ TROVATO in tenant "${tenantId}":`);
        console.log(`   Data:`, JSON.stringify(userInTenant.data(), null, 2));
      }
      
      // Cerca anche per email nel tenant
      const byEmailSnap = await db.collection(`tenants/${tenantId}/users`)
        .where('email', '==', email).get();
      
      if (!byEmailSnap.empty && !userInTenant.exists) {
        console.log(`\n⚠️  Trovato per EMAIL in tenant "${tenantId}" ma con UID diverso:`);
        byEmailSnap.forEach(doc => {
          console.log(`   UID nel tenant: ${doc.id}`);
          console.log(`   Data:`, JSON.stringify(doc.data(), null, 2));
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Utente non trovato in Firebase Auth:', error.message);
  }
}

checkUser().then(() => process.exit(0));
