const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const doc = await db.collection('platform_admins').doc('superadmins').get();
  console.log('Platform admins exists:', doc.exists);
  if (doc.exists) {
    console.log('Data:', doc.data());
  }
  
  const rolesSnap = await db.collection('roles').get();
  console.log('\nRoles:');
  rolesSnap.forEach(doc => {
    console.log(`  ${doc.id}:`, doc.data());
  });
  
  process.exit(0);
}

check();
