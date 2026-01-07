const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function checkUserTenant() {
  try {
    const userTenantRef = db.collection('user_tenants').doc('zqpnkHtDpIMjyhpvWBSo4Y8e8t32');
    const doc = await userTenantRef.get();

    if (doc.exists) {
      console.log('✅ User tenant trovato:');
      console.log('   Dati:', doc.data());
    } else {
      console.log('❌ User tenant NON trovato');
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkUserTenant();