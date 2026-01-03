const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debug() {
  // Trova tutti i tenants
  const tenantsSnap = await db.collection('tenants').get();
  console.log('\n📁 TENANTS TROVATI:');
  for (const doc of tenantsSnap.docs) {
    console.log(`  - ${doc.id}`);
    
    // Conta utenti in questo tenant
    const usersSnap = await db.collection(`tenants/${doc.id}/users`).get();
    console.log(`    Utenti: ${usersSnap.size}`);
    
    // Mostra primi 3 utenti
    const users = usersSnap.docs.slice(0, 3);
    for (const u of users) {
      const data = u.data();
      console.log(`      - ${u.id}: ${data.email || 'no email'} (role: ${data.role || 'none'})`);
    }
  }
  
  // Controlla anche la root collection 'users'
  const rootUsersSnap = await db.collection('users').get();
  console.log('\n📁 ROOT USERS (collection "users"):');
  console.log(`  Totale: ${rootUsersSnap.size}`);
  for (const u of rootUsersSnap.docs.slice(0, 5)) {
    const data = u.data();
    console.log(`  - ${u.id}: ${data.email || 'no email'}`);
    console.log(`    tenantId: ${data.tenantId || 'NONE'}`);
    console.log(`    tenants: ${JSON.stringify(data.tenants) || 'NONE'}`);
    console.log(`    role: ${data.role || 'NONE'}`);
  }
}

debug().then(() => process.exit(0));
