const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verify() {
  console.log('✅ STRUTTURA TENANT FINALE\n');
  console.log('=' .repeat(60));
  
  const tenantRef = db.collection('tenants').doc('biondo-fitness-coach');
  const collections = await tenantRef.listCollections();
  
  console.log('\n📦 tenants/biondo-fitness-coach/\n');
  
  for (const coll of collections) {
    const snap = await coll.get();
    console.log(`  ✓ ${coll.id} (${snap.size} docs)`);
    
    // Mostra dettagli roles
    if (coll.id === 'roles') {
      for (const doc of snap.docs) {
        const data = doc.data();
        console.log(`     └─ ${doc.id}: ${data.uids?.length || 0} UIDs`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ MIGRAZIONE COMPLETATA!');
  console.log('='.repeat(60));
  
  process.exit(0);
}

verify();
