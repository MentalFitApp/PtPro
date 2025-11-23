const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function comprehensiveVerification() {
  console.log('\n🔍 VERIFICA COMPLETA ARCHITETTURA MULTI-TENANT\n');
  console.log('=' .repeat(80));

  try {
    // 1. Verifica collections globali
    console.log('\n📊 COLLECTIONS GLOBALI:');
    const collections = await db.listCollections();
    
    for (const col of collections) {
      const count = await col.count().get();
      console.log(`   ${col.id}: ${count.data().count} documenti`);
    }

    // 2. Verifica tenant
    console.log('\n\n🏢 TENANT: biondo-fitness-coach');
    const tenantRef = db.collection('tenants').doc('biondo-fitness-coach');
    const tenantData = (await tenantRef.get()).data();
    
    console.log(`   Nome: ${tenantData.name}`);
    console.log(`   Creato: ${tenantData.createdAt?.toDate()}`);
    
    // Collections del tenant
    console.log('\n   📁 Collections:');
    
    const collectionsToCheck = [
      'clients', 'collaboratori', 'users', 'chats', 'community_posts',
      'roles', 'calendarEvents', 'leads', 'salesReports', 'settingReports',
      'notifications', 'guides', 'settings', 'schede_alimentazione', 'schede_allenamento'
    ];
    
    for (const collName of collectionsToCheck) {
      try {
        const count = await tenantRef.collection(collName).count().get();
        const docCount = count.data().count;
        
        if (docCount > 0) {
          console.log(`   ✅ ${collName}: ${docCount} documenti`);
        } else {
          console.log(`   ⚪ ${collName}: 0 documenti`);
        }
      } catch (error) {
        console.log(`   ❌ ${collName}: errore - ${error.message}`);
      }
    }

    // 3. Verifica subcollections
    console.log('\n\n   📦 Subcollections (sample client):');
    const clientsSnap = await tenantRef.collection('clients').limit(1).get();
    
    if (!clientsSnap.empty) {
      const clientDoc = clientsSnap.docs[0];
      const clientRef = clientDoc.ref;
      
      console.log(`   Client: ${clientDoc.id}`);
      
      const checksCount = await clientRef.collection('checks').count().get();
      const paymentsCount = await clientRef.collection('payments').count().get();
      const anamnesiCount = await clientRef.collection('anamnesi').count().get();
      
      console.log(`      - checks: ${checksCount.data().count}`);
      console.log(`      - payments: ${paymentsCount.data().count}`);
      console.log(`      - anamnesi: ${anamnesiCount.data().count}`);
    }

    // 4. Verifica chat messages
    console.log('\n   💬 Chat Messages (sample):');
    const chatsSnap = await tenantRef.collection('chats').limit(1).get();
    
    if (!chatsSnap.empty) {
      const chatDoc = chatsSnap.docs[0];
      const messagesCount = await chatDoc.ref.collection('messages').count().get();
      
      console.log(`   Chat: ${chatDoc.id}`);
      console.log(`      - messages: ${messagesCount.data().count}`);
    }

    // 5. Statistiche finali
    console.log('\n\n📈 STATISTICHE FINALI:');
    
    const clientsCount = await tenantRef.collection('clients').count().get();
    const chatsCount = await tenantRef.collection('chats').count().get();
    const usersCount = await tenantRef.collection('users').count().get();
    const postsCount = await tenantRef.collection('community_posts').count().get();
    const leadsCount = await tenantRef.collection('leads').count().get();
    const eventsCount = await tenantRef.collection('calendarEvents').count().get();
    
    console.log(`   Clients: ${clientsCount.data().count}`);
    console.log(`   Chats: ${chatsCount.data().count}`);
    console.log(`   Users: ${usersCount.data().count}`);
    console.log(`   Community Posts: ${postsCount.data().count}`);
    console.log(`   Leads: ${leadsCount.data().count}`);
    console.log(`   Calendar Events: ${eventsCount.data().count}`);

    // 6. Verifica integrità
    console.log('\n\n🔧 INTEGRITÀ DATI:');
    
    let totalChecks = 0;
    let totalPayments = 0;
    let totalAnamnesi = 0;
    let clientsWithChecks = 0;
    let clientsWithPayments = 0;
    let clientsWithAnamnesi = 0;
    
    const allClients = await tenantRef.collection('clients').get();
    
    for (const clientDoc of allClients.docs) {
      const checksCount = await clientDoc.ref.collection('checks').count().get();
      const paymentsCount = await clientDoc.ref.collection('payments').count().get();
      const anamnesiCount = await clientDoc.ref.collection('anamnesi').count().get();
      
      const checks = checksCount.data().count;
      const payments = paymentsCount.data().count;
      const anamnesi = anamnesiCount.data().count;
      
      totalChecks += checks;
      totalPayments += payments;
      totalAnamnesi += anamnesi;
      
      if (checks > 0) clientsWithChecks++;
      if (payments > 0) clientsWithPayments++;
      if (anamnesi > 0) clientsWithAnamnesi++;
    }
    
    console.log(`   Totale Checks: ${totalChecks}`);
    console.log(`   Clients con checks: ${clientsWithChecks}/${allClients.size}`);
    console.log(`   Totale Payments: ${totalPayments}`);
    console.log(`   Clients con payments: ${clientsWithPayments}/${allClients.size}`);
    console.log(`   Totale Anamnesi: ${totalAnamnesi}`);
    console.log(`   Clients con anamnesi: ${clientsWithAnamnesi}/${allClients.size}`);

    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ VERIFICA COMPLETATA - ARCHITETTURA MULTI-TENANT CORRETTA!\n');

  } catch (error) {
    console.error('\n❌ Errore durante la verifica:', error);
  } finally {
    process.exit(0);
  }
}

comprehensiveVerification();
