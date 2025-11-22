/**
 * Script di migrazione con Firebase Admin SDK
 * Copia tutti i dati dalla root a tenants/biondo-fitness-coach/
 * 
 * Prerequisiti:
 * 1. Scaricare service-account.json da Firebase Console
 * 2. npm install firebase-admin (già presente)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Verifica che esista il file service-account.json
const serviceAccountPath = path.join(__dirname, 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ File service-account.json non trovato!');
  console.error('Scaricalo da: https://console.firebase.google.com/project/biondo-fitness-coach/settings/serviceaccounts/adminsdk');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Inizializza Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://biondo-fitness-coach.firebaseio.com'
});

const db = admin.firestore();
const TENANT_ID = 'biondo-fitness-coach';

// Collections da migrare (escludo platform_admins e roles che restano alla root)
const COLLECTIONS_TO_MIGRATE = [
  'users',
  'clients',
  'community_posts',
  'community_comments',
  'community_likes',
  'community_user_profiles',
  'anamnesi',
  'schede_alimentazione',
  'schede_allenamento',
  'checks',
  'payments',
  'calendar_events',
  'notifications',
  'updates',
  'collaboratori',
  'business_history',
  'alimentazione_allenamento',
  'admin_checks',
  'lista_alimenti',
  'lista_esercizi',
  'guide_posts',
  'guide_categories',
  'statistics',
  'chat_rooms',
  'chat_messages',
  'dipendenti',
  'client_payments',
  'coach_updates',
  'guide_captures'
];

async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrazione ${collectionName}...`);
  
  try {
    const sourceRef = db.collection(collectionName);
    const snapshot = await sourceRef.get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  ${collectionName} vuota, skip`);
      return { success: true, count: 0, subcollections: 0 };
    }
    
    console.log(`   📊 Trovati ${snapshot.size} documenti`);
    
    let processed = 0;
    let errors = 0;
    let subcollectionsCount = 0;
    
    // Processa in batch di 100 documenti
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const targetRef = db.collection('tenants').doc(TENANT_ID).collection(collectionName).doc(doc.id);
        
        batch.set(targetRef, data);
        batchCount++;
        processed++;
        
        // Commit batch ogni 500 operazioni (limite Firestore)
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`   ✅ Committati ${processed} documenti...`);
          batchCount = 0;
        }
        
        // Migra anche le subcollections
        const subcollections = await doc.ref.listCollections();
        for (const subcollection of subcollections) {
          const subDocs = await subcollection.get();
          if (!subDocs.empty) {
            console.log(`      📁 Subcollection: ${subcollection.id} (${subDocs.size} docs)`);
            
            for (const subDoc of subDocs.docs) {
              const subData = subDoc.data();
              const targetSubRef = db.collection('tenants')
                .doc(TENANT_ID)
                .collection(collectionName)
                .doc(doc.id)
                .collection(subcollection.id)
                .doc(subDoc.id);
              
              batch.set(targetSubRef, subData);
              batchCount++;
              subcollectionsCount++;
              
              if (batchCount >= 500) {
                await batch.commit();
                console.log(`   ✅ Committati ${processed} documenti + ${subcollectionsCount} subdocs...`);
                batchCount = 0;
              }
            }
          }
        }
        
      } catch (err) {
        console.error(`   ❌ Errore su documento ${doc.id}:`, err.message);
        errors++;
      }
    }
    
    // Commit finale
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`   ✅ ${collectionName} completata: ${processed} docs, ${subcollectionsCount} subdocs, ${errors} errori`);
    
    return { success: true, count: processed, subcollections: subcollectionsCount, errors };
    
  } catch (err) {
    console.error(`   ❌ Errore fatale su ${collectionName}:`, err);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🚀 Inizio migrazione multi-tenant');
  console.log(`📍 Target: tenants/${TENANT_ID}/`);
  console.log(`📋 Collections da migrare: ${COLLECTIONS_TO_MIGRATE.length}\n`);
  
  const results = {
    successful: 0,
    failed: 0,
    totalDocs: 0,
    totalSubdocs: 0,
    totalErrors: 0
  };
  
  const startTime = Date.now();
  
  for (const collectionName of COLLECTIONS_TO_MIGRATE) {
    const result = await migrateCollection(collectionName);
    
    if (result.success) {
      results.successful++;
      results.totalDocs += result.count || 0;
      results.totalSubdocs += result.subcollections || 0;
      results.totalErrors += result.errors || 0;
    } else {
      results.failed++;
      console.error(`❌ Migrazione fallita per ${collectionName}:`, result.error);
    }
    
    // Piccola pausa per non sovraccaricare Firestore
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RIEPILOGO MIGRAZIONE');
  console.log('='.repeat(60));
  console.log(`✅ Collections migrate con successo: ${results.successful}`);
  console.log(`❌ Collections fallite: ${results.failed}`);
  console.log(`📄 Totale documenti copiati: ${results.totalDocs}`);
  console.log(`📁 Totale subdocumenti copiati: ${results.totalSubdocs}`);
  console.log(`⚠️  Errori totali: ${results.totalErrors}`);
  console.log(`⏱️  Tempo impiegato: ${duration}s`);
  console.log('='.repeat(60));
  
  if (results.failed === 0 && results.totalErrors === 0) {
    console.log('\n✅ MIGRAZIONE COMPLETATA CON SUCCESSO!');
    console.log('\n📝 Prossimi passi:');
    console.log('1. Aggiorna il frontend per usare getTenantCollection()');
    console.log('2. Testa tutte le funzionalità');
    console.log('3. Quando tutto funziona, elimina i dati dalla root (BACKUP PRIMA!)');
  } else {
    console.log('\n⚠️  MIGRAZIONE COMPLETATA CON ALCUNI ERRORI');
    console.log('Controlla i log sopra per dettagli');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Gestione errori globale
process.on('unhandledRejection', (error) => {
  console.error('❌ Errore non gestito:', error);
  process.exit(1);
});

main();
