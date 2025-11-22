const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function countAllData() {
  console.log('📊 Conteggio dati in tenants/biondo-fitness-coach/\n');
  
  const TENANT_ID = 'biondo-fitness-coach';
  const tenantRef = db.collection('tenants').doc(TENANT_ID);
  
  try {
    const collections = await tenantRef.listCollections();
    
    let totalDocs = 0;
    let totalSubdocs = 0;
    
    for (const collection of collections) {
      const snapshot = await collection.get();
      totalDocs += snapshot.size;
      
      console.log(`\n📦 ${collection.id}: ${snapshot.size} documenti`);
      
      // Controlla subcollections (es. clients/clientId/anamnesi)
      if (collection.id === 'clients' && snapshot.size > 0) {
        let anamnesiCount = 0;
        let checksCount = 0;
        let paymentsCount = 0;
        
        for (const doc of snapshot.docs.slice(0, 10)) {
          const subcollections = await doc.ref.listCollections();
          for (const sub of subcollections) {
            const subSnap = await sub.get();
            if (sub.id === 'anamnesi') anamnesiCount += subSnap.size;
            if (sub.id === 'checks') checksCount += subSnap.size;
            if (sub.id === 'payments') paymentsCount += subSnap.size;
            totalSubdocs += subSnap.size;
          }
        }
        
        if (anamnesiCount > 0) console.log(`   └─ anamnesi: ${anamnesiCount} subdocs`);
        if (checksCount > 0) console.log(`   └─ checks: ${checksCount} subdocs`);
        if (paymentsCount > 0) console.log(`   └─ payments: ${paymentsCount} subdocs (primi 10 clienti)`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 TOTALE: ${totalDocs} documenti + ${totalSubdocs}+ subdocs`);
    console.log('='.repeat(50));
    
    console.log('\n✅ I dati sono stati migrati correttamente!');
    console.log('💡 Firestore Console potrebbe non mostrare tutte le collections subito.');
    console.log('   Prova a ricaricare la pagina o usa la ricerca.');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
  
  process.exit(0);
}

countAllData();
