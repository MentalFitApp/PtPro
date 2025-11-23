const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyzeDatabase() {
  console.log('🔍 Analisi Database Firebase\n');
  console.log('=' .repeat(80));

  try {
    // 1. Controlla struttura tenant
    console.log('\n📁 STRUTTURA TENANTS:');
    const tenantsSnapshot = await db.collection('tenants').get();
    console.log(`   Tenants trovati: ${tenantsSnapshot.size}`);
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      console.log(`\n   ├─ Tenant: ${tenantId}`);
      console.log(`   │  Nome: ${tenantData.name || 'N/A'}`);
      console.log(`   │  Creato: ${tenantData.createdAt?.toDate() || 'N/A'}`);
      
      // Analizza collections del tenant
      const tenantRef = db.collection('tenants').doc(tenantId);
      
      // Clients
      const clientsSnapshot = await tenantRef.collection('clients').count().get();
      console.log(`   │  └─ Clients: ${clientsSnapshot.data().count}`);
      
      // Collaboratori
      const collabSnapshot = await tenantRef.collection('collaboratori').count().get();
      console.log(`   │  └─ Collaboratori: ${collabSnapshot.data().count}`);
      
      // Users
      const usersSnapshot = await tenantRef.collection('users').count().get();
      console.log(`   │  └─ Users: ${usersSnapshot.data().count}`);
      
      // Chats
      const chatsSnapshot = await tenantRef.collection('chats').count().get();
      console.log(`   │  └─ Chats: ${chatsSnapshot.data().count}`);
      
      // Community posts
      const postsSnapshot = await tenantRef.collection('community_posts').count().get();
      console.log(`   │  └─ Community Posts: ${postsSnapshot.data().count}`);
      
      // Schede alimentazione
      const schedeAlimSnapshot = await tenantRef.collection('schede_alimentazione').count().get();
      console.log(`   │  └─ Schede Alimentazione: ${schedeAlimSnapshot.data().count}`);
      
      // Schede allenamento
      const schedeAllenSnapshot = await tenantRef.collection('schede_allenamento').count().get();
      console.log(`   │  └─ Schede Allenamento: ${schedeAllenSnapshot.data().count}`);
      
      // Roles
      console.log(`   │  └─ Roles:`);
      const rolesSnapshot = await tenantRef.collection('roles').get();
      for (const roleDoc of rolesSnapshot.docs) {
        const roleData = roleDoc.data();
        console.log(`   │      • ${roleDoc.id}: ${roleData.uids?.length || 0} utenti`);
      }
      
      // Analizza subcollections di un client (se esistono)
      const clientsSample = await tenantRef.collection('clients').limit(1).get();
      if (!clientsSample.empty) {
        const sampleClient = clientsSample.docs[0];
        const clientRef = tenantRef.collection('clients').doc(sampleClient.id);
        
        const checksCount = await clientRef.collection('checks').count().get();
        const paymentsCount = await clientRef.collection('payments').count().get();
        const anamnesiCount = await clientRef.collection('anamnesi').count().get();
        
        console.log(`   │  └─ Subcollections esempio (client: ${sampleClient.id}):`);
        console.log(`   │      • Checks: ${checksCount.data().count}`);
        console.log(`   │      • Payments: ${paymentsCount.data().count}`);
        console.log(`   │      • Anamnesi: ${anamnesiCount.data().count}`);
      }
    }

    // 2. Controlla platform admins
    console.log('\n\n👑 PLATFORM ADMINS:');
    const platformAdminsSnapshot = await db.collection('platform_admins').get();
    if (platformAdminsSnapshot.empty) {
      console.log('   ⚠️  Nessun platform admin trovato');
    } else {
      for (const doc of platformAdminsSnapshot.docs) {
        const data = doc.data();
        console.log(`   ├─ ${doc.id}: ${data.uids?.length || 0} utenti`);
        if (data.uids) {
          data.uids.forEach(uid => console.log(`   │  └─ ${uid}`));
        }
      }
    }

    // 3. Controlla collections globali (fuori dai tenant)
    console.log('\n\n🌐 COLLECTIONS GLOBALI:');
    const collections = await db.listCollections();
    const globalCollections = collections.filter(col => col.id !== 'tenants' && col.id !== 'platform_admins');
    
    if (globalCollections.length === 0) {
      console.log('   ✅ Nessuna collection globale (tutto è multi-tenant)');
    } else {
      console.log('   ⚠️  Collections trovate fuori dai tenant:');
      for (const col of globalCollections) {
        const count = await col.count().get();
        console.log(`   ├─ ${col.id}: ${count.data().count} documenti`);
      }
    }

    // 4. Verifica integrità dati
    console.log('\n\n🔧 VERIFICA INTEGRITÀ:');
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantRef = db.collection('tenants').doc(tenantId);
      
      // Controlla clients senza checks
      const clientsSnapshot = await tenantRef.collection('clients').get();
      let clientsWithoutChecks = 0;
      let clientsWithoutPayments = 0;
      
      for (const clientDoc of clientsSnapshot.docs) {
        const checksCount = await clientDoc.ref.collection('checks').count().get();
        const paymentsCount = await clientDoc.ref.collection('payments').count().get();
        
        if (checksCount.data().count === 0) clientsWithoutChecks++;
        if (paymentsCount.data().count === 0) clientsWithoutPayments++;
      }
      
      console.log(`\n   Tenant: ${tenantId}`);
      console.log(`   ├─ Clients senza checks: ${clientsWithoutChecks}/${clientsSnapshot.size}`);
      console.log(`   └─ Clients senza payments: ${clientsWithoutPayments}/${clientsSnapshot.size}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analisi completata\n');

  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error);
  } finally {
    process.exit(0);
  }
}

analyzeDatabase();
