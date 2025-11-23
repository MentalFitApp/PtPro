const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createSuperadminsDoc() {
  const tenantId = 'biondo-fitness-coach';
  
  // Leggi gli admin esistenti per promuoverli a superadmin
  const adminsRef = db.doc(`tenants/${tenantId}/roles/admins`);
  const adminsDoc = await adminsRef.get();
  
  const adminUids = adminsDoc.exists ? (adminsDoc.data().uids || []) : [];
  
  console.log('📋 Admin UIDs trovati:', adminUids);
  
  // Crea documento superadmins nel tenant
  const superadminsRef = db.doc(`tenants/${tenantId}/roles/superadmins`);
  await superadminsRef.set({
    uids: adminUids, // Promuovi tutti gli admin a superadmin
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('✅ Documento superadmins creato con', adminUids.length, 'UIDs');
  
  // Verifica anche platform_admins a livello root
  const rootAdminsRef = db.doc('platform_admins/superadmins');
  const rootAdminsDoc = await rootAdminsRef.get();
  
  if (!rootAdminsDoc.exists) {
    console.log('⚠️  platform_admins/superadmins NON esiste - crealo manualmente per Platform CEO');
  } else {
    console.log('✅ platform_admins/superadmins esiste con UIDs:', rootAdminsDoc.data().uids);
  }
  
  process.exit(0);
}

createSuperadminsDoc().catch(err => {
  console.error('❌ Errore:', err);
  process.exit(1);
});
