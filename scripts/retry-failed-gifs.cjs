/**
 * 🔄 Retry Download GIF con Errori
 * 
 * Riprova a scaricare solo le GIF che hanno avuto errori
 * con delay più lunghi per evitare rate limiting
 * 
 * Uso: node scripts/retry-failed-gifs.cjs
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAZIONE
// ============================================
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY_HERE';
const RESOLUTION = '360';
const EXERCISES_DIR = path.join(__dirname, '../data/exercisedb');
const CONCURRENT_DOWNLOADS = 2; // Ridotto per evitare rate limit
const DELAY_BETWEEN_BATCHES = 3000; // 3 secondi tra batch

// R2 Config
const R2_ACCOUNT_ID = '7682069cf34302dfc6988fbe193f2ba6';
const R2_ACCESS_KEY = '91fda93481d38b755d3591081b173be6';
const R2_SECRET_KEY = '5b3b9059a2972cf0b910a05b35d631896187daa809ccb44c6aefb0e06400aede';
const R2_BUCKET = 'fitflow';
const R2_PUBLIC_URL = 'https://media.flowfitpro.it';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY
  }
});

// ============================================
// FUNZIONI
// ============================================

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
    CacheControl: 'public, max-age=31536000'
  }));
  
  return `${R2_PUBLIC_URL}/${key}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processExercise(exerciseId, stats) {
  const r2Key = `exercises/gifs/${exerciseId}.gif`;
  
  try {
    const gifBuffer = await downloadGif(exerciseId);
    await uploadToR2(r2Key, gifBuffer);
    stats.success++;
    return { id: exerciseId, url: `${R2_PUBLIC_URL}/${r2Key}`, success: true };
  } catch (error) {
    stats.failed++;
    return { id: exerciseId, error: error.message, success: false };
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🔄 Retry Download GIF Fallite\n');
  
  // 1. Carica errori
  const errorsPath = path.join(EXERCISES_DIR, 'download-errors.json');
  
  if (!fs.existsSync(errorsPath)) {
    console.log('✅ Nessun errore da riprovare!\n');
    return;
  }
  
  const errors = JSON.parse(fs.readFileSync(errorsPath, 'utf8'));
  console.log(`   📊 Errori da riprovare: ${errors.length}\n`);
  console.log(`   ⏱️ Delay tra batch: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log(`   📥 Download paralleli: ${CONCURRENT_DOWNLOADS}\n`);
  
  // 2. Processa
  const stats = { success: 0, failed: 0 };
  const stillFailed = [];
  const startTime = Date.now();
  
  for (let i = 0; i < errors.length; i += CONCURRENT_DOWNLOADS) {
    const batch = errors.slice(i, i + CONCURRENT_DOWNLOADS);
    
    const results = await Promise.all(
      batch.map(e => processExercise(e.id, stats))
    );
    
    // Raccogli ancora falliti
    results.filter(r => !r.success).forEach(r => stillFailed.push(r));
    
    // Progress
    const total = stats.success + stats.failed;
    const progress = Math.round((total / errors.length) * 100);
    process.stdout.write(
      `\r   📥 Progresso: ${total}/${errors.length} (${progress}%) | ✅ ${stats.success} | ❌ ${stats.failed}   `
    );
    
    await sleep(DELAY_BETWEEN_BATCHES);
  }
  
  console.log('\n');
  
  // 3. Aggiorna file errori
  if (stillFailed.length > 0) {
    fs.writeFileSync(errorsPath, JSON.stringify(stillFailed, null, 2));
    console.log(`   ⚠️ Ancora ${stillFailed.length} errori salvati\n`);
  } else {
    fs.unlinkSync(errorsPath);
    console.log(`   ✅ Tutti gli errori risolti!\n`);
  }
  
  // 4. Aggiorna file esercizi con nuovi URL R2
  if (stats.success > 0) {
    console.log('📦 Aggiornamento file esercizi...\n');
    
    const exercisesPath = path.join(EXERCISES_DIR, 'all-exercises-r2.json');
    const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));
    
    // Crea mappa degli esercizi recuperati
    const recoveredIds = new Set(
      errors.filter(e => !stillFailed.find(f => f.id === e.id)).map(e => e.id)
    );
    
    // Aggiorna URL
    const updated = exercises.map(ex => {
      if (recoveredIds.has(ex.id)) {
        const r2Url = `${R2_PUBLIC_URL}/exercises/gifs/${ex.id}.gif`;
        return {
          ...ex,
          gifUrl: r2Url,
          gifUrlR2: r2Url
        };
      }
      return ex;
    });
    
    fs.writeFileSync(exercisesPath, JSON.stringify(updated, null, 2));
  }
  
  // 5. Sommario
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  
  console.log('═'.repeat(50));
  console.log('📊 RIEPILOGO RETRY');
  console.log('═'.repeat(50));
  console.log(`   ✅ Recuperati: ${stats.success}`);
  console.log(`   ❌ Ancora falliti: ${stats.failed}`);
  console.log(`   ⏱️ Tempo: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
  console.log('═'.repeat(50));
  console.log('');
}

main().catch(console.error);
