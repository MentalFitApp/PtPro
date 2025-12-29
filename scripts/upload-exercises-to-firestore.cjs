/**
 * 📤 Upload Esercizi su Firestore
 * 
 * Carica tutti gli esercizi da /data/exercisedb/ su Firestore
 * nella collection globale platform_exercises/
 * 
 * Uso: node scripts/upload-exercises-to-firestore.cjs
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ============================================
// CONFIGURAZIONE
// ============================================
const EXERCISES_DIR = path.join(__dirname, '../data/exercisedb');
const BATCH_SIZE = 400; // Firestore limit è 500
const USE_R2_VERSION = true; // Usa versione con URL R2

// ============================================
// FUNZIONE PRINCIPALE
// ============================================

async function uploadExercises() {
  console.log('📤 Upload Esercizi su Firestore\n');
  
  // 1. Carica tutti gli esercizi (preferisci versione tradotta)
  let allExercisesPath = path.join(EXERCISES_DIR, 'all-exercises-translated.json');
  
  if (!fs.existsSync(allExercisesPath)) {
    console.log('⚠️  File tradotto non trovato, uso versione R2...');
    allExercisesPath = path.join(EXERCISES_DIR, 'all-exercises-r2.json');
  }
  
  if (!fs.existsSync(allExercisesPath)) {
    allExercisesPath = path.join(EXERCISES_DIR, 'all-exercises.json');
  }
  
  if (!fs.existsSync(allExercisesPath)) {
    console.error('❌ File esercizi non trovato!');
    console.log('   Esegui prima: node scripts/download-exercisedb.cjs');
    process.exit(1);
  }
  
  console.log(`   📁 Usando: ${path.basename(allExercisesPath)}\n`);
  
  const exercises = JSON.parse(fs.readFileSync(allExercisesPath, 'utf8'));
  console.log(`📊 Trovati ${exercises.length} esercizi da caricare\n`);
  
  // 2. Upload in batch
  const collectionRef = db.collection('platform_exercises');
  
  let uploaded = 0;
  let errors = 0;
  
  // Dividi in batch
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = exercises.slice(i, i + BATCH_SIZE);
    
    for (const exercise of chunk) {
      const docRef = collectionRef.doc(exercise.id);
      batch.set(docRef, {
        ...exercise,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    try {
      await batch.commit();
      uploaded += chunk.length;
      const progress = Math.round((uploaded / exercises.length) * 100);
      console.log(`   ✅ Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${chunk.length} esercizi (${progress}%)`);
    } catch (error) {
      console.error(`   ❌ Errore batch: ${error.message}`);
      errors += chunk.length;
    }
  }
  
  // 3. Crea documento indice
  console.log('\n📑 Creazione indice...');
  
  const indexPath = path.join(EXERCISES_DIR, 'index.json');
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  await db.collection('platform_config').doc('exercises_index').set({
    ...indexData,
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    uploadedCount: uploaded
  });
  
  // 4. Sommario
  console.log('\n═'.repeat(50));
  console.log('📊 RIEPILOGO UPLOAD');
  console.log('═'.repeat(50));
  console.log(`   ✅ Caricati: ${uploaded}`);
  console.log(`   ❌ Errori: ${errors}`);
  console.log(`   📁 Collection: platform_exercises`);
  console.log('═'.repeat(50));
  
  console.log('\n✅ Upload completato!\n');
}

// Esegui
uploadExercises()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Errore:', err);
    process.exit(1);
  });
