const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function searchUser() {
  const email = 'admin12@live.it';
  console.log(`\n🔍 Ricerca approfondita per: ${email}\n`);
  
  // 1. Cerca per email in TUTTE le subcollection users di tutti i tenant
  const tenantsSnap = await db.collection('tenants').get();
  
  for (const tenant of tenantsSnap.docs) {
    const tenantId = tenant.id;
    
    // Cerca per email
    const byEmail = await db.collection(`tenants/${tenantId}/users`)
      .where('email', '==', email).get();
    
    if (!byEmail.empty) {
      console.log(`✅ Trovato in tenant "${tenantId}" per email:`);
      byEmail.forEach(doc => {
        console.log(`   Document ID: ${doc.id}`);
        console.log(`   Data:`, JSON.stringify(doc.data(), null, 2));
      });
    }
    
    // Cerca anche nei clients
    const clientsByEmail = await db.collection(`tenants/${tenantId}/clients`)
      .where('email', '==', email).get();
    
    if (!clientsByEmail.empty) {
      console.log(`✅ Trovato in tenant "${tenantId}" CLIENTS:`);
      clientsByEmail.forEach(doc => {
        console.log(`   Document ID: ${doc.id}`);
        console.log(`   Data:`, JSON.stringify(doc.data(), null, 2));
      });
    }
  }
  
  // 2. Cerca nella root users per email
  const rootByEmail = await db.collection('users')
    .where('email', '==', email).get();
  
  if (!rootByEmail.empty) {
    console.log(`\n✅ Trovato in ROOT users per email:`);
    rootByEmail.forEach(doc => {
      console.log(`   Document ID: ${doc.id}`);
      console.log(`   Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }
  
  // 3. Cerca tutti gli utenti con "admin" nel nome/email
  console.log(`\n🔍 Cercando utenti con "admin" nell'email in tutti i tenant...`);
  for (const tenant of tenantsSnap.docs) {
    const tenantId = tenant.id;
    const allUsers = await db.collection(`tenants/${tenantId}/users`).get();
    
    allUsers.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase().includes('admin')) {
        console.log(`   ${tenantId}: ${doc.id} - ${data.email} (role: ${data.role})`);
      }
    });
  }
}

searchUser().then(() => process.exit(0));
