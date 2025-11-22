const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const TENANT_ID = 'biondo-fitness-coach';

async function checkAll() {
  console.log('🔍 VERIFICA COMPLETA TENANT\n');
  
  const tenantRef = db.collection('tenants').doc(TENANT_ID);
  
  // Lista tutte le collections
  const collections = await tenantRef.listCollections();
  
  console.log(`📦 Collections trovate: ${collections.length}\n`);
  
  let totalDocs = 0;
  
  for (const coll of collections) {
    const snapshot = await coll.get();
    totalDocs += snapshot.size;
    
    console.log(`\n📁 ${coll.id}`);
    console.log(`   Documenti: ${snapshot.size}`);
    
    // Per roles, mostra dettagli
    if (coll.id === 'roles') {
      for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log(`   └─ ${doc.id}: ${JSON.stringify(data.uids || [])}`);
      }
    }
    
    // Per altre collections, mostra primi 3 doc IDs
    if (snapshot.size > 0 && coll.id !== 'roles') {
      const docIds = snapshot.docs.slice(0, 3).map(d => d.id);
      console.log(`   └─ Es: ${docIds.join(', ')}${snapshot.size > 3 ? '...' : ''}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 TOTALE: ${collections.length} collections, ${totalDocs} documenti`);
  console.log('='.repeat(60));
  
  // Ora controlla cosa c'è ancora alla root
  console.log('\n\n�� VERIFICA ROOT (da migrare):\n');
  
  const rootCollections = await db.listCollections();
  const toMigrate = [];
  
  for (const coll of rootCollections) {
    if (coll.id === 'platform_admins' || coll.id === 'roles' || coll.id === 'tenants') {
      continue; // Skip collections che devono restare alla root
    }
    
    const snap = await coll.limit(1).get();
    if (snap.size > 0) {
      const fullSnap = await coll.get();
      toMigrate.push({ name: coll.id, count: fullSnap.size });
      console.log(`  ⚠️  ${coll.id} (${fullSnap.size} docs) - DA MIGRARE`);
    }
  }
  
  if (toMigrate.length === 0) {
    console.log('  ✅ Nessuna collection da migrare!');
  } else {
    console.log(`\n\n⚠️  ATTENZIONE: ${toMigrate.length} collections ancora alla root!`);
    console.log('Vuoi che le migri automaticamente?');
  }
  
  process.exit(0);
}

checkAll();
