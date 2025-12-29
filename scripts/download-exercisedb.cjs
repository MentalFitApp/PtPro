/**
 * 📥 Download e Suddivisione ExerciseDB
 * 
 * Questo script:
 * 1. Scarica tutti i 1324 esercizi da ExerciseDB
 * 2. Li suddivide per bodyPart (categoria muscolare)
 * 3. Aggiunge traduzione italiana automatica
 * 4. Salva in file JSON organizzati
 * 
 * Uso: node scripts/download-exercisedb.cjs
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAZIONE
// ============================================
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY_HERE';
const OUTPUT_DIR = path.join(__dirname, '../data/exercisedb');
const IMAGE_BASE_URL = 'https://exercisedb.p.rapidapi.com/image';
const RESOLUTION = '360'; // 180, 360, 720, 1080

// ============================================
// DIZIONARIO TRADUZIONI ITALIANO
// ============================================
const BODY_PART_IT = {
  'back': 'Schiena',
  'cardio': 'Cardio',
  'chest': 'Petto',
  'lower arms': 'Avambracci',
  'lower legs': 'Polpacci',
  'neck': 'Collo',
  'shoulders': 'Spalle',
  'upper arms': 'Braccia',
  'upper legs': 'Gambe',
  'waist': 'Addome'
};

const TARGET_IT = {
  'abductors': 'Abduttori',
  'abs': 'Addominali',
  'adductors': 'Adduttori',
  'biceps': 'Bicipiti',
  'calves': 'Polpacci',
  'cardiovascular system': 'Sistema cardiovascolare',
  'delts': 'Deltoidi',
  'forearms': 'Avambracci',
  'glutes': 'Glutei',
  'hamstrings': 'Femorali',
  'hip flexors': 'Flessori anca',
  'lats': 'Dorsali',
  'levator scapulae': 'Elevatore scapola',
  'pectorals': 'Pettorali',
  'quads': 'Quadricipiti',
  'serratus anterior': 'Dentato anteriore',
  'spine': 'Colonna vertebrale',
  'traps': 'Trapezi',
  'triceps': 'Tricipiti',
  'upper back': 'Dorsali alti'
};

const EQUIPMENT_IT = {
  'assisted': 'Assistito',
  'band': 'Elastico',
  'barbell': 'Bilanciere',
  'body weight': 'Corpo libero',
  'bosu ball': 'Bosu ball',
  'cable': 'Cavo',
  'dumbbell': 'Manubrio',
  'elliptical machine': 'Ellittica',
  'ez barbell': 'Bilanciere EZ',
  'hammer': 'Hammer',
  'kettlebell': 'Kettlebell',
  'leverage machine': 'Macchina a leva',
  'medicine ball': 'Palla medica',
  'olympic barbell': 'Bilanciere olimpico',
  'resistance band': 'Banda elastica',
  'roller': 'Rullo',
  'rope': 'Corda',
  'skierg machine': 'SkiErg',
  'sled machine': 'Slitta',
  'smith machine': 'Multipower',
  'stability ball': 'Fitball',
  'stationary bike': 'Cyclette',
  'stepmill machine': 'Stepper',
  'tire': 'Pneumatico',
  'trap bar': 'Trap bar',
  'upper body ergometer': 'Ergometro braccia',
  'weighted': 'Con zavorra',
  'wheel roller': 'Ab wheel'
};

const DIFFICULTY_IT = {
  'beginner': 'Principiante',
  'intermediate': 'Intermedio',
  'advanced': 'Avanzato',
  'expert': 'Esperto'
};

// Traduzioni comuni per nomi esercizi
const EXERCISE_NAME_TRANSLATIONS = {
  // Movimenti base
  'push-up': 'piegamenti',
  'push up': 'piegamenti',
  'pull-up': 'trazioni',
  'pull up': 'trazioni',
  'squat': 'squat',
  'deadlift': 'stacco',
  'bench press': 'panca piana',
  'row': 'rematore',
  'curl': 'curl',
  'extension': 'estensione',
  'press': 'spinta',
  'fly': 'croci',
  'raise': 'alzate',
  'lunge': 'affondi',
  'crunch': 'crunch',
  'plank': 'plank',
  'dip': 'dip',
  'shrug': 'scrollate',
  
  // Posizioni
  'incline': 'inclinata',
  'decline': 'declinata',
  'seated': 'seduto',
  'standing': 'in piedi',
  'lying': 'sdraiato',
  'prone': 'prono',
  'supine': 'supino',
  'kneeling': 'in ginocchio',
  
  // Varianti
  'wide grip': 'presa larga',
  'close grip': 'presa stretta',
  'reverse grip': 'presa inversa',
  'underhand': 'presa supina',
  'overhand': 'presa prona',
  'single arm': 'singolo braccio',
  'single leg': 'singola gamba',
  'alternating': 'alternato',
  
  // Attrezzatura
  'barbell': 'bilanciere',
  'dumbbell': 'manubrio',
  'cable': 'cavo',
  'machine': 'macchina',
  'band': 'elastico',
  'kettlebell': 'kettlebell',
  'smith': 'multipower',
  
  // Muscoli
  'chest': 'petto',
  'back': 'schiena',
  'shoulder': 'spalla',
  'bicep': 'bicipite',
  'tricep': 'tricipite',
  'leg': 'gamba',
  'calf': 'polpaccio',
  'ab': 'addominale',
  'glute': 'gluteo',
  'lat': 'dorsale',
  'trap': 'trapezio',
  'rear delt': 'deltoide posteriore',
  'front delt': 'deltoide anteriore',
  'lateral': 'laterale'
};

// ============================================
// FUNZIONI UTILITÀ
// ============================================

function translateExerciseName(name) {
  let translated = name.toLowerCase();
  
  // Applica traduzioni note
  for (const [en, it] of Object.entries(EXERCISE_NAME_TRANSLATIONS)) {
    translated = translated.replace(new RegExp(en, 'gi'), it);
  }
  
  // Capitalizza prima lettera di ogni parola
  return translated
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function translateSecondaryMuscles(muscles) {
  return muscles.map(muscle => {
    const lower = muscle.toLowerCase();
    return TARGET_IT[lower] || muscle;
  });
}

function buildGifUrl(exerciseId) {
  return `${IMAGE_BASE_URL}?exerciseId=${exerciseId}&resolution=${RESOLUTION}&rapidapi-key=${RAPIDAPI_KEY}`;
}

function transformExercise(exercise) {
  return {
    // ID e nomi
    id: exercise.id,
    name: exercise.name,
    nameIt: translateExerciseName(exercise.name),
    
    // Categorizzazione
    bodyPart: exercise.bodyPart,
    bodyPartIt: BODY_PART_IT[exercise.bodyPart] || exercise.bodyPart,
    target: exercise.target,
    targetIt: TARGET_IT[exercise.target] || exercise.target,
    equipment: exercise.equipment,
    equipmentIt: EQUIPMENT_IT[exercise.equipment] || exercise.equipment,
    
    // Muscoli
    secondaryMuscles: exercise.secondaryMuscles,
    secondaryMusclesIt: translateSecondaryMuscles(exercise.secondaryMuscles),
    
    // Media
    gifUrl: buildGifUrl(exercise.id),
    
    // Istruzioni (in inglese per ora)
    instructions: exercise.instructions,
    description: exercise.description || '',
    
    // Difficoltà
    difficulty: exercise.difficulty || 'intermediate',
    difficultyIt: DIFFICULTY_IT[exercise.difficulty] || 'Intermedio',
    category: exercise.category || 'strength',
    
    // Metadata
    isGlobal: true,
    source: 'exercisedb',
    createdAt: new Date().toISOString()
  };
}

// ============================================
// FUNZIONE PRINCIPALE
// ============================================

async function main() {
  console.log('📥 Download ExerciseDB - Inizio\n');
  
  // 1. Fetch tutti gli esercizi
  console.log('⏳ Scaricamento esercizi da API...');
  
  const response = await fetch(
    'https://exercisedb.p.rapidapi.com/exercises?limit=2000',
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  const exercises = await response.json();
  console.log(`✅ Scaricati ${exercises.length} esercizi\n`);
  
  // 2. Crea directory output
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // 3. Trasforma e raggruppa per bodyPart
  console.log('🔄 Trasformazione e traduzione...');
  
  const byBodyPart = {};
  const allTransformed = [];
  
  for (const exercise of exercises) {
    const transformed = transformExercise(exercise);
    allTransformed.push(transformed);
    
    const bp = exercise.bodyPart;
    if (!byBodyPart[bp]) {
      byBodyPart[bp] = [];
    }
    byBodyPart[bp].push(transformed);
  }
  
  // 4. Salva file per categoria
  console.log('\n📁 Salvataggio file per categoria:\n');
  
  const stats = [];
  
  for (const [bodyPart, exerciseList] of Object.entries(byBodyPart)) {
    const fileName = bodyPart.replace(/\s+/g, '-') + '.json';
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(exerciseList, null, 2));
    
    const stat = {
      bodyPart,
      bodyPartIt: BODY_PART_IT[bodyPart] || bodyPart,
      count: exerciseList.length,
      fileName
    };
    stats.push(stat);
    
    console.log(`   📄 ${fileName}: ${exerciseList.length} esercizi (${stat.bodyPartIt})`);
  }
  
  // 5. Salva file completo
  const allFilePath = path.join(OUTPUT_DIR, 'all-exercises.json');
  fs.writeFileSync(allFilePath, JSON.stringify(allTransformed, null, 2));
  console.log(`\n   📄 all-exercises.json: ${allTransformed.length} esercizi totali`);
  
  // 6. Salva indice/sommario
  const indexData = {
    totalExercises: allTransformed.length,
    lastUpdated: new Date().toISOString(),
    resolution: RESOLUTION,
    categories: stats.sort((a, b) => b.count - a.count),
    bodyParts: Object.keys(BODY_PART_IT),
    targets: Object.keys(TARGET_IT),
    equipment: Object.keys(EQUIPMENT_IT)
  };
  
  const indexFilePath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexFilePath, JSON.stringify(indexData, null, 2));
  console.log(`   📄 index.json: sommario database\n`);
  
  // 7. Sommario finale
  console.log('═'.repeat(50));
  console.log('📊 RIEPILOGO DOWNLOAD');
  console.log('═'.repeat(50));
  console.log(`   Totale esercizi: ${allTransformed.length}`);
  console.log(`   Categorie: ${stats.length}`);
  console.log(`   Directory: ${OUTPUT_DIR}`);
  console.log(`   Risoluzione GIF: ${RESOLUTION}px`);
  console.log('═'.repeat(50));
  
  console.log('\n✅ Download completato!\n');
  console.log('📌 Prossimi passi:');
  console.log('   1. Esegui: node scripts/upload-exercises-to-firestore.cjs');
  console.log('   2. (Opzionale) Migliora traduzioni con OpenAI');
  console.log('   3. (Opzionale) Scarica GIF su R2 per caching locale\n');
}

// Esegui
main().catch(console.error);
