const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const TENANT_ID = 'biondo-fitness-coach';

// Collections da NON migrare (devono restare alla root)
const KEEP_AT_ROOT = ['platform_admins', 'roles', 'tenants'];

async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrazione ${collectionName}...`);
  
  try {
    const sourceRef = db.collection(collectionName);
    const snapshot = await sourceRef.get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Vuota, skip`);
      return { success: true, count: 0 };
    }
    
    console.log(`   📊 ${snapshot.size} documenti`);
    
    const batch = db.batch();
    let batchCount = 0;
    let processed = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const targetRef = db.collection('tenants').doc(TENANT_ID).collection(collectionName).doc(doc.id);
      
      batch.set(targetRef, data);
      batchCount++;
      processed++;
      
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`   ✅ ${processed} documenti...`);
        batchCount = 0;
      }
      
      // Migra subcollections
      const subcollections = await doc.ref.listCollections();
      for (const sub of subcollections) {
        const subDocs = await sub.get();
        for (const subDoc of subDocs.docs) {
          const targetSubRef = db.collection('tenants')
            .doc(TENANT_ID)
            .collection(collectionName)
            .doc(doc.id)
            .collection(sub.id)
            .doc(subDoc.id);
          
          batch.set(targetSubRef, subDoc.data());
          batchCount++;
          
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`   ✅ Completato: ${processed} docs`);
    return { success: true, count: processed };
    
  } catch (error) {
    console.error(`   ❌ Errore: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 MIGRAZIONE COMPLETA AL TENANT\n');
  console.log('='.repeat(60));
  
  const rootCollections = await db.listCollections();
  const toMigrate = [];
  
  for (const coll of rootCollections) {
    if (KEEP_AT_ROOT.includes(coll.id)) continue;
    
    const snap = await coll.limit(1).get();
    if (snap.size > 0) {
      toMigrate.push(coll.id);
    }
  }
  
  console.log(`\n📋 Collections da migrare: ${toMigrate.length}`);
  console.log(toMigrate.join(', '));
  console.log('\n' + '='.repeat(60));
  
  let migrated = 0;
  let failed = 0;
  let totalDocs = 0;
  
  for (const collName of toMigrate) {
    const result = await migrateCollection(collName);
    
    if (result.success) {
      migrated++;
      totalDocs += result.count;
    } else {
      failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RIEPILOGO FINALE');
  console.log('='.repeat(60));
  console.log(`✅ Collections migrate: ${migrated}`);
  console.log(`❌ Fallite: ${failed}`);
  console.log(`📄 Totale documenti: ${totalDocs}`);
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('\n✅ MIGRAZIONE COMPLETATA CON SUCCESSO!');
    console.log('\n📝 Prossimi passi:');
    console.log('1. Aggiorna il frontend per le nuove collections');
    console.log('2. Testa tutte le funzionalità');
    console.log('3. Elimina dati dalla root dopo test');
  }
  
  process.exit(0);
}

main();
