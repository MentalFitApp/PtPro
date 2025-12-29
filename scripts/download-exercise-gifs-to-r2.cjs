/**
 * 🖼️ Download GIF Esercizi su Cloudflare R2
 * 
 * Scarica tutte le GIF da ExerciseDB e le carica su R2
 * per evitare dipendenza dall'API e costi ricorrenti
 * 
 * Uso: node scripts/download-exercise-gifs-to-r2.cjs
 * 
 * NOTA: Questo processo può richiedere 30-60 minuti per 1324 GIF
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAZIONE
// ============================================
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY_HERE';
const RESOLUTION = '360'; // 180, 360, 720, 1080
const EXERCISES_DIR = path.join(__dirname, '../data/exercisedb');
const CONCURRENT_DOWNLOADS = 5; // Download paralleli
const DELAY_BETWEEN_BATCHES = 1000; // ms

// R2 Config (da .env)
const R2_ACCOUNT_ID = '7682069cf34302dfc6988fbe193f2ba6';
const R2_ACCESS_KEY = '91fda93481d38b755d3591081b173be6';
const R2_SECRET_KEY = '5b3b9059a2972cf0b910a05b35d631896187daa809ccb44c6aefb0e06400aede';
const R2_BUCKET = 'fitflow';
const R2_PUBLIC_URL = 'https://media.flowfitpro.it';

// Inizializza S3 Client per R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY
  }
});

// ============================================
// FUNZIONI UTILITÀ
// ============================================

async function checkIfExists(key) {
  try {
    await r2Client.send(new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key
    }));
    return true;
  } catch {
    return false;
  }
}

async function downloadGif(exerciseId) {
  const url = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=${RESOLUTION}&rapidapi-key=${RAPIDAPI_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}

async function uploadToR2(key, buffer) {
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/gif',
    CacheControl: 'public, max-age=31536000' // 1 anno
  }));
  
  return `${R2_PUBLIC_URL}/${key}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processExercise(exercise, stats) {
  const r2Key = `exercises/gifs/${exercise.id}.gif`;
  
  // Controlla se esiste già
  const exists = await checkIfExists(r2Key);
  if (exists) {
    stats.skipped++;
    return `${R2_PUBLIC_URL}/${r2Key}`;
  }
  
  try {
    // Download da ExerciseDB
    const gifBuffer = await downloadGif(exercise.id);
    
    // Upload su R2
    const r2Url = await uploadToR2(r2Key, gifBuffer);
    
    stats.uploaded++;
    return r2Url;
  } catch (error) {
    stats.errors++;
    stats.errorList.push({ id: exercise.id, error: error.message });
    return null;
  }
}

// ============================================
// FUNZIONE PRINCIPALE
// ============================================

async function main() {
  console.log('🖼️ Download GIF Esercizi su R2\n');
  console.log(`   Risoluzione: ${RESOLUTION}px`);
  console.log(`   Bucket R2: ${R2_BUCKET}`);
  console.log(`   Download paralleli: ${CONCURRENT_DOWNLOADS}\n`);
  
  // 1. Carica lista esercizi
  const allExercisesPath = path.join(EXERCISES_DIR, 'all-exercises.json');
  
  if (!fs.existsSync(allExercisesPath)) {
    console.error('❌ File all-exercises.json non trovato!');
    console.log('   Esegui prima: node scripts/download-exercisedb.cjs');
    process.exit(1);
  }
  
  const exercises = JSON.parse(fs.readFileSync(allExercisesPath, 'utf8'));
  console.log(`📊 Trovati ${exercises.length} esercizi\n`);
  
  // 2. Processa in batch
  const stats = {
    uploaded: 0,
    skipped: 0,
    errors: 0,
    errorList: []
  };
  
  const updatedExercises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < exercises.length; i += CONCURRENT_DOWNLOADS) {
    const batch = exercises.slice(i, i + CONCURRENT_DOWNLOADS);
    
    const results = await Promise.all(
      batch.map(ex => processExercise(ex, stats))
    );
    
    // Aggiorna URL degli esercizi
    batch.forEach((ex, idx) => {
      const newUrl = results[idx];
      updatedExercises.push({
        ...ex,
        gifUrl: newUrl || ex.gifUrl, // Mantieni originale se errore
        gifUrlR2: newUrl,
        gifUrlOriginal: ex.gifUrl
      });
    });
    
    // Progress
    const total = stats.uploaded + stats.skipped + stats.errors;
    const progress = Math.round((total / exercises.length) * 100);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const eta = Math.round((elapsed / total) * (exercises.length - total));
    
    process.stdout.write(
      `\r   📥 Progresso: ${total}/${exercises.length} (${progress}%) | ` +
      `✅ ${stats.uploaded} | ⏭️ ${stats.skipped} | ❌ ${stats.errors} | ` +
      `ETA: ${Math.floor(eta / 60)}m ${eta % 60}s   `
    );
    
    // Delay per non sovraccaricare
    await sleep(DELAY_BETWEEN_BATCHES);
  }
  
  console.log('\n');
  
  // 3. Salva file aggiornato
  const updatedPath = path.join(EXERCISES_DIR, 'all-exercises-r2.json');
  fs.writeFileSync(updatedPath, JSON.stringify(updatedExercises, null, 2));
  
  // Salva anche per categoria
  const byBodyPart = {};
  for (const ex of updatedExercises) {
    const bp = ex.bodyPart;
    if (!byBodyPart[bp]) byBodyPart[bp] = [];
    byBodyPart[bp].push(ex);
  }
  
  for (const [bodyPart, list] of Object.entries(byBodyPart)) {
    const fileName = bodyPart.replace(/\s+/g, '-') + '-r2.json';
    const filePath = path.join(EXERCISES_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
  }
  
  // 4. Salva errori se presenti
  if (stats.errorList.length > 0) {
    const errorsPath = path.join(EXERCISES_DIR, 'download-errors.json');
    fs.writeFileSync(errorsPath, JSON.stringify(stats.errorList, null, 2));
    console.log(`   ⚠️ Errori salvati in: download-errors.json`);
  }
  
  // 5. Sommario
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  
  console.log('═'.repeat(50));
  console.log('📊 RIEPILOGO DOWNLOAD GIF');
  console.log('═'.repeat(50));
  console.log(`   ✅ Caricati su R2: ${stats.uploaded}`);
  console.log(`   ⏭️ Già esistenti: ${stats.skipped}`);
  console.log(`   ❌ Errori: ${stats.errors}`);
  console.log(`   ⏱️ Tempo totale: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
  console.log(`   📁 File aggiornato: all-exercises-r2.json`);
  console.log('═'.repeat(50));
  
  console.log('\n✅ Download completato!\n');
  console.log('📌 Prossimo passo:');
  console.log('   node scripts/upload-exercises-to-firestore.cjs');
  console.log('   (usa all-exercises-r2.json per URL R2)\n');
}

// Esegui
main().catch(console.error);
