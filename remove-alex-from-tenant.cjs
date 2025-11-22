const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function removeAlexFromTenant() {
  const alexUID = 'AeZKjJYu5zMZ4mvffaGiqCBb0cF2';
  const tenantId = 'biondo-fitness-coach';
  
  console.log('🔧 Rimozione Alex dal tenant Biondo...\n');
  
  // Rimuovi da superadmins
  const superadminsRef = db.doc(`tenants/${tenantId}/roles/superadmins`);
  const superadminsDoc = await superadminsRef.get();
  const superadminsUIDs = (superadminsDoc.data()?.uids || []).filter(uid => uid !== alexUID);
  
  await superadminsRef.update({ uids: superadminsUIDs });
  console.log('✅ Rimosso da superadmins. Nuovi UIDs:', superadminsUIDs);
  
  // Rimuovi da admins
  const adminsRef = db.doc(`tenants/${tenantId}/roles/admins`);
  const adminsDoc = await adminsRef.get();
  const adminsUIDs = (adminsDoc.data()?.uids || []).filter(uid => uid !== alexUID);
  
  await adminsRef.update({ uids: adminsUIDs });
  console.log('✅ Rimosso da admins. Nuovi UIDs:', adminsUIDs);
  
  console.log('\n✅ COMPLETATO!');
  console.log('Alex ora può accedere SOLO a Platform Dashboard (/platform-login)');
  console.log('Biondo può accedere SOLO a Business Dashboard (/ceo-login)');
  
  process.exit(0);
}

removeAlexFromTenant().catch(err => {
  console.error('❌ Errore:', err);
  process.exit(1);
});
