const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkData() {
  try {
    // Trova admin di test-tenant
    const rolesSnap = await db.collection('tenants').doc('test-tenant').collection('roles').doc('admins').get();
    const adminIds = rolesSnap.exists ? rolesSnap.data().users || [] : [];
    console.log('🔑 Admin IDs di test-tenant:', adminIds);
    
    // Verifica pagamenti di un cliente
    const clientsSnap = await db.collection('tenants').doc('test-tenant').collection('clients').limit(1).get();
    if (!clientsSnap.empty) {
      const clientId = clientsSnap.docs[0].id;
      const clientName = clientsSnap.docs[0].data().name;
      const paymentsSnap = await db.collection('tenants').doc('test-tenant')
        .collection('clients').doc(clientId).collection('payments').get();
      
      console.log(`\n💳 Pagamenti di ${clientName} (${paymentsSnap.size} totali):`);
      paymentsSnap.docs.forEach(p => {
        const data = p.data();
        const date = data.paymentDate?.toDate?.();
        console.log(`  - €${data.amount} | ${date?.toLocaleDateString('it-IT')} | isRenewal: ${data.isRenewal}`);
      });
    }
    
    // Verifica chat
    const chatsSnap = await db.collection('tenants').doc('test-tenant').collection('chats').limit(1).get();
    if (!chatsSnap.empty) {
      const chat = chatsSnap.docs[0].data();
      console.log('\n💬 Prima chat:');
      console.log('  Participants:', chat.participants);
      console.log('  UnreadCount:', chat.unreadCount);
      console.log('  LastMessage:', chat.lastMessage);
    } else {
      console.log('\n❌ Nessuna chat trovata!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

checkData();
