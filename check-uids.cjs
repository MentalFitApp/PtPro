const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkUIDs() {
  // Platform superadmins
  const platformDoc = await db.doc('platform_admins/superadmins').get();
  console.log('🌐 PLATFORM CEOs (root):');
  console.log('  UIDs:', platformDoc.data()?.uids || []);
  
  // Tenant superadmins
  const tenantDoc = await db.doc('tenants/biondo-fitness-coach/roles/superadmins').get();
  console.log('\n🏢 TENANT Biondo SuperAdmins:');
  console.log('  UIDs:', tenantDoc.data()?.uids || []);
  
  // Tenant admins
  const adminDoc = await db.doc('tenants/biondo-fitness-coach/roles/admins').get();
  console.log('\n👔 TENANT Biondo Admins:');
  console.log('  UIDs:', adminDoc.data()?.uids || []);
  
  process.exit(0);
}

checkUIDs().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
