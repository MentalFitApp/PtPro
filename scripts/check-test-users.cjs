const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function checkTestUsers() {
  console.log('🔍 Controllo utenti di test nel tenant test-tenant...\n');

  try {
    // Controlla admin
    const adminRef = db.collection('tenants').doc('test-tenant').collection('roles').doc('admins');
    const adminDoc = await adminRef.get();
    console.log('👨‍💼 Admin:', adminDoc.exists ? '✅ Esiste' : '❌ Non trovato');
    if (adminDoc.exists) {
      console.log('   UIDs:', adminDoc.data().uids);
    }

    // Controlla coach
    const coachRef = db.collection('tenants').doc('test-tenant').collection('roles').doc('coaches');
    const coachDoc = await coachRef.get();
    console.log('🏋️ Coach:', coachDoc.exists ? '✅ Esiste' : '❌ Non trovato');
    if (coachDoc.exists) {
      console.log('   UIDs:', coachDoc.data().uids);
    }

    // Controlla clienti
    const clientsRef = db.collection('tenants').doc('test-tenant').collection('clients');
    const clientsSnapshot = await clientsRef.get();
    console.log('👥 Clienti:', clientsSnapshot.size, 'trovati');
    clientsSnapshot.forEach(doc => {
      console.log('   -', doc.id, ':', doc.data().name || 'senza nome');
    });

    // Controlla collaboratori
    const collabRef = db.collection('tenants').doc('test-tenant').collection('collaboratori');
    const collabSnapshot = await collabRef.get();
    console.log('👷 Collaboratori:', collabSnapshot.size, 'trovati');
    collabSnapshot.forEach(doc => {
      console.log('   -', doc.id, ':', doc.data().name || 'senza nome');
    });

    // Controlla user_tenants
    const userTenantsRef = db.collection('user_tenants');
    const userTenantsSnapshot = await userTenantsRef.get();
    console.log('🏢 User tenants:', userTenantsSnapshot.size, 'trovati');
    userTenantsSnapshot.forEach(doc => {
      console.log('   -', doc.id, ':', Object.keys(doc.data()));
    });

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkTestUsers();