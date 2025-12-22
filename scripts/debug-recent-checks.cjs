const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const TENANT_ID = 'jacopo-fitness-club';

async function debugRecentChecks() {
  try {
    // Trova tutti i clienti
    const clientsSnap = await db.collection(`tenants/${TENANT_ID}/clients`).limit(10).get();
    
    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id;
      const clientData = clientDoc.data();
      console.log(`\n=== Cliente: ${clientData.name || clientId} ===`);
      
      // Trova ultimi 3 check
      const checksSnap = await db.collection(`tenants/${TENANT_ID}/clients/${clientId}/checks`)
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get();
      
      if (checksSnap.empty) {
        console.log('  Nessun check');
        continue;
      }
      
      for (const checkDoc of checksSnap.docs) {
        const check = checkDoc.data();
        console.log(`  Check ${checkDoc.id}:`);
        console.log(`    peso: ${check.weight}`);
        console.log(`    createdAt: ${check.createdAt?.toDate()}`);
        console.log(`    photoURLs:`, JSON.stringify(check.photoURLs, null, 2));
      }
    }
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    process.exit(0);
  }
}

debugRecentChecks();
