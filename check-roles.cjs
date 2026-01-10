const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUserRoles() {
  const tenantId = 'biondo-fitness-coach';
  const userId = '3j0AXIRa4XdHq1ywCl4UBxJNsku2';
  
  console.log('Checking roles for:');
  console.log('  Tenant:', tenantId);
  console.log('  User:', userId);
  console.log('');
  
  // Check admins
  const adminsDoc = await db.doc(`tenants/${tenantId}/roles/admins`).get();
  console.log('📋 Admins doc exists:', adminsDoc.exists);
  if (adminsDoc.exists) {
    const uids = adminsDoc.data().uids || [];
    console.log('   Admin UIDs:', uids);
    console.log('   User is admin:', uids.includes(userId));
  }
  
  // Check coaches
  const coachesDoc = await db.doc(`tenants/${tenantId}/roles/coaches`).get();
  console.log('📋 Coaches doc exists:', coachesDoc.exists);
  if (coachesDoc.exists) {
    const uids = coachesDoc.data().uids || [];
    console.log('   Coach UIDs:', uids);
    console.log('   User is coach:', uids.includes(userId));
  }
  
  // Check if schede_alimentazione collection exists
  console.log('\n📂 Checking schede_alimentazione...');
  const schedeSnap = await db.collection(`tenants/${tenantId}/schede_alimentazione`).limit(5).get();
  console.log('   Documents found:', schedeSnap.size);
  schedeSnap.forEach(doc => {
    console.log('   -', doc.id);
  });
  
  process.exit(0);
}

checkUserRoles();
