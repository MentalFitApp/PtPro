const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function fixUserTenants() {
  const testUsers = [
    { uid: 'zqpnkHtDpIMjyhpvWBSo4Y8e8t32', role: 'admin' },
    { uid: '6qqKa5SQgxPdUUJhPSwFqrPPRzl2', role: 'client' },
    { uid: '66Lyb86WZYRFiboYiUz4HsfjCLf2', role: 'collaboratore' },
    { uid: 'GeVPjbfGZeQgeQg41Ru5FDt34eo1', role: 'coach' }
  ];

  for (const user of testUsers) {
    try {
      const userTenantRef = db.collection('user_tenants').doc(user.uid);

      // Crea il documento nel formato corretto
      await userTenantRef.set({
        'test-tenant': {
          role: user.role,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active'
        }
      });

      console.log('✅ Corretto user_tenant per', user.role, '-', user.uid);
    } catch (error) {
      console.error('❌ Errore per', user.role, ':', error.message);
    }
  }
}

fixUserTenants();