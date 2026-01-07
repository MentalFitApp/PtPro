/**
 * Script per pulire completamente il tenant di test
 * Rimuove tutti i dati prima di ripopolare
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Inizializza Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const TENANT_ID = 'test-tenant';

async function deleteCollection(collectionRef, batchSize = 100) {
  const query = collectionRef.limit(batchSize);
  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

async function cleanTenant() {
  try {
    console.log(`🧹 Pulizia tenant: ${TENANT_ID}\n`);

    // Ottieni tutti i clienti
    const clientsRef = db.collection('tenants').doc(TENANT_ID).collection('clients');
    const clientsSnap = await clientsRef.get();
    
    console.log(`📋 Trovati ${clientsSnap.size} clienti da pulire...\n`);

    // Elimina subcollections per ogni cliente
    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id;
      const clientName = clientDoc.data().name || clientId;
      
      console.log(`  🗑️  Pulizia cliente: ${clientName}`);
      
      // Elimina subcollections
      const subcollections = ['payments', 'rates', 'checks', 'anamnesi', 'workouts', 'nutrition', 'calls'];
      
      for (const subCol of subcollections) {
        const subRef = clientDoc.ref.collection(subCol);
        await deleteCollection(subRef);
      }
      
      // Elimina il documento cliente
      await clientDoc.ref.delete();
    }

    // Elimina altre collezioni
    console.log('\n🗑️  Pulizia altre collezioni...');
    
    const collections = ['chats', 'calendar', 'callRequests', 'leads', 'stats'];
    for (const colName of collections) {
      const colRef = db.collection('tenants').doc(TENANT_ID).collection(colName);
      await deleteCollection(colRef);
      console.log(`  ✅ ${colName} pulito`);
    }

    console.log('\n✅ Pulizia completata!\n');
    console.log('💡 Esegui ora: node scripts/populate-test-data.cjs\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
    process.exit(1);
  }
}

cleanTenant();
