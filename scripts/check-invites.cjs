const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function checkInvites() {
  console.log('🔍 Controllo inviti nel database...\n');

  try {
    const snapshot = await db.collection('invitations').get();
    console.log('📧 Totale inviti trovati:', snapshot.size);

    const invitesByTenant = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const tenantId = data.tenantId || 'NO_TENANT';

      if (!invitesByTenant[tenantId]) {
        invitesByTenant[tenantId] = [];
      }

      invitesByTenant[tenantId].push({
        id: doc.id,
        code: data.code,
        status: data.status,
        clientData: data.clientData
      });
    });

    console.log('\n🏢 Inviti per tenant:');
    Object.entries(invitesByTenant).forEach(([tenantId, invites]) => {
      console.log(`  ${tenantId}: ${invites.length} inviti`);
      if (tenantId === 'biondo-fitness-coach') {
        console.log('    Alcuni inviti del tenant Biondo:');
        invites.slice(0, 3).forEach(invite => {
          console.log(`      - ${invite.code} (${invite.status})`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkInvites();