const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkTenantCollections() {
  console.log('🔍 Controllo collections in tenants/biondo-fitness-coach/\n');
  
  try {
    const tenantRef = db.collection('tenants').doc('biondo-fitness-coach');
    const collections = await tenantRef.listCollections();
    
    console.log(`📊 Trovate ${collections.length} collections:\n`);
    
    for (const collection of collections) {
      const snapshot = await collection.limit(1).get();
      const count = snapshot.size > 0 ? 'con dati' : 'vuota';
      console.log(`  - ${collection.id} (${count})`);
    }
    
    if (collections.length === 0) {
      console.log('\n⚠️  NESSUNA COLLECTION TROVATA!');
      console.log('Verifico se il documento tenants/biondo-fitness-coach esiste...\n');
      
      const tenantDoc = await tenantRef.get();
      console.log(`Documento tenant esiste: ${tenantDoc.exists}`);
      
      if (!tenantDoc.exists) {
        console.log('\n❌ Il documento tenant non esiste!');
        console.log('La migrazione potrebbe non essere avvenuta correttamente.');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
  
  process.exit(0);
}

checkTenantCollections();
