/**
 * 🇮🇹 Traduzione Esercizi con OpenAI
 * 
 * Traduce nomi e istruzioni degli esercizi in italiano
 * usando GPT-4 per traduzioni accurate nel contesto fitness
 * 
 * Uso: node scripts/translate-exercises-openai.cjs
 * 
 * NOTA: Costa circa $2-5 per tradurre tutti i 1324 esercizi
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAZIONE
// ============================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';
const EXERCISES_DIR = path.join(__dirname, '../data/exercisedb');
const BATCH_SIZE = 10; // Esercizi per chiamata API
const DELAY_BETWEEN_CALLS = 500; // ms

// ============================================
// PROMPT SISTEMA
// ============================================
const SYSTEM_PROMPT = `Sei un traduttore esperto di fitness e bodybuilding. 
Traduci i nomi degli esercizi e le istruzioni dall'inglese all'italiano.

REGOLE IMPORTANTI:
1. Usa la terminologia corretta del fitness italiano
2. Mantieni i nomi tecnici dove appropriato (es: "deadlift" → "stacco da terra", "squat" → "squat")
3. Le istruzioni devono essere chiare e actionable
4. Usa il "tu" informale
5. Rispondi SOLO con il JSON richiesto, niente altro

TRADUZIONI STANDARD:
- bench press → panca piana
- deadlift → stacco da terra
- squat → squat
- pull-up → trazioni alla sbarra
- push-up → piegamenti sulle braccia
- row → rematore
- curl → curl
- press → spinta/pressa
- fly → croci
- raise → alzate
- lunge → affondi
- crunch → crunch
- plank → plank
- dip → dip alle parallele`;

// ============================================
// FUNZIONI
// ============================================

async function translateBatch(exercises) {
  const prompt = `Traduci questi ${exercises.length} esercizi in italiano.

INPUT:
${JSON.stringify(exercises.map(e => ({
  id: e.id,
  name: e.name,
  instructions: e.instructions
})), null, 2)}

OUTPUT (JSON array con stessa struttura):
[
  {
    "id": "...",
    "nameIt": "Nome in italiano",
    "instructionsIt": ["Istruzione 1", "Istruzione 2", ...]
  },
  ...
]`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Più economico ma buono per traduzioni
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Bassa per consistenza
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API Error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Estrai JSON dalla risposta
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Risposta non contiene JSON valido');
  }
  
  return JSON.parse(jsonMatch[0]);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// FUNZIONE PRINCIPALE
// ============================================

async function main() {
  console.log('🇮🇹 Traduzione Esercizi con OpenAI\n');
  
  // 1. Carica esercizi
  // Preferisci versione R2 se esiste
  let inputFile = 'all-exercises-r2.json';
  let inputPath = path.join(EXERCISES_DIR, inputFile);
  
  if (!fs.existsSync(inputPath)) {
    inputFile = 'all-exercises.json';
    inputPath = path.join(EXERCISES_DIR, inputFile);
  }
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Nessun file esercizi trovato!');
    process.exit(1);
  }
  
  console.log(`   📁 Input: ${inputFile}`);
  
  const exercises = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`   📊 Totale esercizi: ${exercises.length}\n`);
  
  // 2. Carica traduzioni esistenti (per riprendere)
  const translationsPath = path.join(EXERCISES_DIR, 'translations-cache.json');
  let translationsCache = {};
  
  if (fs.existsSync(translationsPath)) {
    translationsCache = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
    console.log(`   📦 Cache esistente: ${Object.keys(translationsCache).length} traduzioni\n`);
  }
  
  // 3. Filtra esercizi non ancora tradotti
  const toTranslate = exercises.filter(e => !translationsCache[e.id]);
  console.log(`   🔄 Da tradurre: ${toTranslate.length}\n`);
  
  if (toTranslate.length === 0) {
    console.log('✅ Tutti gli esercizi sono già tradotti!\n');
  } else {
    // 4. Traduci in batch
    const startTime = Date.now();
    let translated = 0;
    let errors = 0;
    
    for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
      const batch = toTranslate.slice(i, i + BATCH_SIZE);
      
      try {
        const results = await translateBatch(batch);
        
        // Salva in cache
        for (const result of results) {
          translationsCache[result.id] = {
            nameIt: result.nameIt,
            instructionsIt: result.instructionsIt
          };
        }
        
        translated += batch.length;
        
        // Salva cache progressivamente
        fs.writeFileSync(translationsPath, JSON.stringify(translationsCache, null, 2));
        
      } catch (error) {
        console.error(`\n   ❌ Errore batch ${i}: ${error.message}`);
        errors += batch.length;
      }
      
      // Progress
      const progress = Math.round(((translated + errors) / toTranslate.length) * 100);
      process.stdout.write(
        `\r   📝 Progresso: ${translated + errors}/${toTranslate.length} (${progress}%) | ` +
        `✅ ${translated} | ❌ ${errors}   `
      );
      
      await sleep(DELAY_BETWEEN_CALLS);
    }
    
    console.log('\n');
  }
  
  // 5. Applica traduzioni a tutti gli esercizi
  console.log('📦 Applicazione traduzioni...\n');
  
  const translatedExercises = exercises.map(ex => ({
    ...ex,
    nameIt: translationsCache[ex.id]?.nameIt || ex.nameIt,
    instructionsIt: translationsCache[ex.id]?.instructionsIt || ex.instructions
  }));
  
  // 6. Salva file finale
  const outputPath = path.join(EXERCISES_DIR, 'all-exercises-translated.json');
  fs.writeFileSync(outputPath, JSON.stringify(translatedExercises, null, 2));
  
  // Salva anche per categoria
  const byBodyPart = {};
  for (const ex of translatedExercises) {
    const bp = ex.bodyPart;
    if (!byBodyPart[bp]) byBodyPart[bp] = [];
    byBodyPart[bp].push(ex);
  }
  
  for (const [bodyPart, list] of Object.entries(byBodyPart)) {
    const fileName = bodyPart.replace(/\s+/g, '-') + '-translated.json';
    const filePath = path.join(EXERCISES_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
  }
  
  // 7. Sommario
  console.log('═'.repeat(50));
  console.log('📊 RIEPILOGO TRADUZIONE');
  console.log('═'.repeat(50));
  console.log(`   📝 Esercizi tradotti: ${Object.keys(translationsCache).length}`);
  console.log(`   📁 Output: all-exercises-translated.json`);
  console.log('═'.repeat(50));
  
  console.log('\n✅ Traduzione completata!\n');
  console.log('📌 Prossimo passo:');
  console.log('   node scripts/upload-exercises-to-firestore.cjs');
  console.log('   (modifica per usare all-exercises-translated.json)\n');
}

// Esegui
main().catch(console.error);
