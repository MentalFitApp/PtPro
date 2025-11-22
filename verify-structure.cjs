const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyStructure() {
  console.log('🔍 VERIFICA STRUTTURA DATABASE MULTI-TENANT\n');
  console.log('='.repeat(60));
  
  // 1. Collections root
  console.log('\n📂 ROOT LEVEL:');
  const rootCollections = await db.listCollections();
  for (const coll of rootCollections) {
    const snap = await coll.limit(5).get();
    console.log(`  ✓ ${coll.id} (${snap.size > 0 ? 'con dati' : 'vuota'})`);
  }
  
  // 2. Tenant document
  console.log('\n📂 TENANTS:');
  const tenantsSnap = await db.collection('tenants').get();
  console.log(`  Totale tenants: ${tenantsSnap.size}`);
  
  for (const tenantDoc of tenantsSnap.docs) {
    console.log(`\n  📌 Tenant: ${tenantDoc.id}`);
    const tenantData = tenantDoc.data();
    console.log(`     Nome: ${tenantData.displayName || tenantData.name}`);
    console.log(`     Status: ${tenantData.status}`);
    console.log(`     Piano: ${tenantData.subscription?.plan || 'N/A'}`);
    
    // Collections del tenant
    const tenantCollections = await tenantDoc.ref.listCollections();
    console.log(`\n     Collections (${tenantCollections.length}):`);
    
    for (const coll of tenantCollections) {
      const collSnap = await coll.limit(1).get();
      const count = collSnap.size;
      
      // Conta tutti i documenti
      const fullSnap = await coll.get();
      console.log(`       └─ ${coll.id}: ${fullSnap.size} docs`);
    }
  }
  
  // 3. Platform admins
  console.log('\n📂 PLATFORM ADMINS:');
  const platformAdminDoc = await db.collection('platform_admins').doc('superadmins').get();
  if (platformAdminDoc.exists()) {
    const uids = platformAdminDoc.data().uids || [];
    console.log(`  ✓ Superadmins: ${uids.length} UIDs`);
    uids.forEach(uid => console.log(`     - ${uid}`));
  }
  
  // 4. Roles (business admins)
  console.log('\n📂 ROLES (Business level):');
  const rolesSnap = await db.collection('roles').get();
  for (const roleDoc of rolesSnap.docs) {
    const uids = roleDoc.data().uids || [];
    console.log(`  ✓ ${roleDoc.id}: ${uids.length} UIDs`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ STRUTTURA MULTI-TENANT VERIFICATA!');
  console.log('='.repeat(60));
  
  process.exit(0);
}

verifyStructure();
