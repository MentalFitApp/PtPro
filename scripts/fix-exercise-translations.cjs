/**
 * Script per correggere le traduzioni degli esercizi e aggiungere alias di ricerca
 * Risolve i problemi segnalati da MattiaCoach:
 * - Chest press (neutra, normale, inclinata)
 * - Pec fly / Pec deck
 * - Leg extension
 * - Leg press (varie)
 * - Hack squat
 * - T-bar row
 * - Esercizi macchine dorso
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'exercisedb');

// Mappatura correzioni nomi italiani e alias
const EXERCISE_FIXES = {
  // ==================== PETTO ====================
  // Chest Press
  '0576': {
    nameIt: 'Chest Press',
    aliases: ['chest press', 'spinta petto', 'pectoral machine', 'chest press macchina', 'pressa petto']
  },
  '0577': {
    nameIt: 'Chest Press (variante)',
    aliases: ['chest press', 'spinta petto', 'pectoral machine', 'chest press macchina', 'pressa petto']
  },
  '1299': {
    nameIt: 'Chest Press Inclinata',
    aliases: ['incline chest press', 'chest press inclinata', 'spinta petto inclinata', 'incline press macchina', 'petto alto macchina']
  },
  '1300': {
    nameIt: 'Chest Press Declinata',
    aliases: ['decline chest press', 'chest press declinata', 'spinta petto declinata', 'decline press macchina', 'petto basso macchina']
  },
  '1301': {
    nameIt: 'Chest Press Convergente',
    aliases: ['inner chest press', 'chest press convergente', 'spinta petto interna', 'petto interno macchina']
  },
  // Pec Fly / Pec Deck
  '0596': {
    nameIt: 'Pec Fly (Pec Deck)',
    aliases: ['pec fly', 'pec deck', 'butterfly', 'croci macchina', 'pectoral fly', 'chest fly machine', 'farfalla']
  },

  // ==================== GAMBE ====================
  // Leg Extension
  '0585': {
    nameIt: 'Leg Extension',
    aliases: ['leg extension', 'estensione gambe', 'quadricipiti macchina', 'estensione quadricipiti']
  },
  // Leg Press varianti - ID corretti dal file upper-legs
  '0739': {
    nameIt: 'Leg Press 45°',
    aliases: ['leg press', 'leg press 45', 'pressa gambe', 'pressa 45 gradi', 'sled leg press']
  },
  '0740': {
    nameIt: 'Leg Press 45° Larga',
    aliases: ['leg press larga', 'wide leg press', 'pressa gambe larga', 'leg press piedi larghi']
  },
  '1580': {
    nameIt: 'Leg Press su una Gamba 45°',
    aliases: ['one leg press', 'single leg press', 'leg press singola', 'pressa una gamba', 'leg press unilaterale']
  },
  // Hack Squat - ID corretti
  '0046': {
    nameIt: 'Hack Squat con Bilanciere',
    aliases: ['hack squat', 'barbell hack squat', 'hack squat bilanciere', 'squat hack']
  },
  '0741': {
    nameIt: 'Hack Squat (piedi stretti)',
    aliases: ['hack squat', 'closer hack squat', 'hack squat stretto', 'sled hack squat']
  },
  '0742': {
    nameIt: 'Hack Squat',
    aliases: ['hack squat', 'sled hack squat', 'hack squat macchina', 'squat guidato']
  },
  '0746': {
    nameIt: 'Hack Squat su Smith Machine',
    aliases: ['smith hack squat', 'hack squat multipower', 'hack squat smith']
  },
  // Leg Curl
  '0584': {
    nameIt: 'Leg Curl in Ginocchio',
    aliases: ['kneeling leg curl', 'leg curl ginocchio', 'femorali macchina']
  },
  '0586': {
    nameIt: 'Leg Curl Sdraiato',
    aliases: ['lying leg curl', 'leg curl sdraiato', 'leg curl prono', 'femorali sdraiato']
  },
  '0599': {
    nameIt: 'Leg Curl Seduto',
    aliases: ['seated leg curl', 'leg curl seduto', 'femorali seduto']
  },

  // ==================== SCHIENA ====================
  // T-Bar Row
  '0606': {
    nameIt: 'T-Bar Row',
    aliases: ['t-bar row', 'tbar row', 't bar', 'rematore t-bar', 'lever t bar', 'rematore landmine']
  },
  // Lever Rows - Verifica ID specifici da file back-translated
  // Cable Rows - questi ID sono corretti per file back-translated
  '0198': {
    nameIt: 'Pulley Basso Seduto',
    aliases: ['cable row', 'seated cable row', 'pulley basso', 'rematore cavi', 'low row']
  },
  '0870': {
    nameIt: 'Pulley Seduto',
    aliases: ['cable seated row', 'seated row', 'pulley', 'rematore cavi seduto']
  }
};

// Alias generici da aggiungere basati sul nome inglese
const ALIAS_PATTERNS = {
  // Petto
  'chest press': ['chest press', 'pressa petto', 'spinta petto', 'pectoral press'],
  'pec fly': ['pec fly', 'pec deck', 'butterfly', 'croci', 'farfalla'],
  'cable fly': ['cable fly', 'croci cavi', 'cable crossover', 'crossover'],
  'dumbbell fly': ['dumbbell fly', 'croci manubri', 'aperture manubri'],
  'bench press': ['bench press', 'panca piana', 'distensioni panca'],
  'incline': ['incline', 'inclinata', 'inclinato', 'petto alto'],
  'decline': ['decline', 'declinata', 'declinato', 'petto basso'],
  
  // Gambe
  'leg extension': ['leg extension', 'estensione gambe', 'quadricipiti'],
  'leg press': ['leg press', 'pressa gambe', 'pressa'],
  'hack squat': ['hack squat', 'squat hack', 'squat guidato'],
  'leg curl': ['leg curl', 'curl gambe', 'femorali', 'bicipite femorale'],
  'squat': ['squat', 'accosciata', 'piegamenti gambe'],
  'lunge': ['lunge', 'affondo', 'affondi'],
  
  // Schiena
  't-bar': ['t-bar', 'tbar', 't bar', 'landmine row'],
  'row': ['row', 'rematore', 'remata', 'tirata'],
  'pulldown': ['pulldown', 'pull down', 'lat machine', 'tirata alta'],
  'seated row': ['seated row', 'pulley', 'rematore seduto'],
  'cable row': ['cable row', 'pulley', 'rematore cavi'],
  'lat': ['lat', 'dorsali', 'latissimus'],
  
  // Spalle
  'shoulder press': ['shoulder press', 'military press', 'lento avanti', 'spinte spalle'],
  'lateral raise': ['lateral raise', 'alzate laterali', 'side raise'],
  'front raise': ['front raise', 'alzate frontali'],
  'rear delt': ['rear delt', 'deltoide posteriore', 'alzate posteriori'],
  
  // Braccia
  'bicep curl': ['bicep curl', 'curl bicipiti', 'flessione bicipiti'],
  'tricep': ['tricep', 'tricipiti', 'estensione tricipiti'],
  'pushdown': ['pushdown', 'push down', 'spinta tricipiti']
};

/**
 * Genera alias automatici basati sul nome dell'esercizio
 */
function generateAutoAliases(exercise) {
  const aliases = new Set();
  const name = (exercise.name || '').toLowerCase();
  const nameIt = (exercise.nameIt || '').toLowerCase();
  
  // Aggiungi il nome originale e tradotto
  if (name) aliases.add(name);
  if (nameIt) aliases.add(nameIt);
  
  // Cerca pattern nel nome e aggiungi alias correlati
  for (const [pattern, patternAliases] of Object.entries(ALIAS_PATTERNS)) {
    if (name.includes(pattern) || nameIt.includes(pattern.toLowerCase())) {
      patternAliases.forEach(a => aliases.add(a.toLowerCase()));
    }
  }
  
  // Aggiungi varianti comuni
  if (name.includes('lever') || name.includes('machine')) {
    aliases.add('macchina');
  }
  if (name.includes('cable')) {
    aliases.add('cavi');
    aliases.add('cable');
  }
  if (name.includes('dumbbell')) {
    aliases.add('manubri');
    aliases.add('manubrio');
  }
  if (name.includes('barbell')) {
    aliases.add('bilanciere');
  }
  if (name.includes('smith')) {
    aliases.add('multipower');
    aliases.add('smith machine');
  }
  
  return Array.from(aliases);
}

/**
 * Processa un singolo file JSON
 */
function processFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File non trovato: ${filename}`);
    return { updated: 0, total: 0 };
  }
  
  console.log(`\n📄 Elaborazione: ${filename}`);
  
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  let updatedCount = 0;
  
  for (const exercise of data) {
    let updated = false;
    
    // Applica fix specifici se presenti
    if (EXERCISE_FIXES[exercise.id]) {
      const fix = EXERCISE_FIXES[exercise.id];
      
      if (fix.nameIt && exercise.nameIt !== fix.nameIt) {
        console.log(`  ✏️  ${exercise.id}: "${exercise.nameIt}" → "${fix.nameIt}"`);
        exercise.nameIt = fix.nameIt;
        updated = true;
      }
      
      // Aggiungi alias specifici
      if (fix.aliases) {
        exercise.aliases = fix.aliases;
        updated = true;
      }
    }
    
    // Genera alias automatici se non presenti
    if (!exercise.aliases || exercise.aliases.length === 0) {
      exercise.aliases = generateAutoAliases(exercise);
      if (exercise.aliases.length > 0) {
        updated = true;
      }
    } else {
      // Merge con alias auto-generati
      const autoAliases = generateAutoAliases(exercise);
      const mergedAliases = new Set([...exercise.aliases, ...autoAliases]);
      if (mergedAliases.size > exercise.aliases.length) {
        exercise.aliases = Array.from(mergedAliases);
        updated = true;
      }
    }
    
    // Correggi traduzioni ibride (es. "Bilanciere Bent Over Rematore")
    if (exercise.nameIt && /[A-Z][a-z]+ [A-Z][a-z]+/.test(exercise.nameIt)) {
      // Mantieni per ora ma logga per revisione manuale
      // console.log(`  ⚠️  Traduzione ibrida: ${exercise.nameIt}`);
    }
    
    if (updated) updatedCount++;
  }
  
  // Salva il file aggiornato
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✅ Aggiornati ${updatedCount}/${data.length} esercizi`);
  
  return { updated: updatedCount, total: data.length };
}

/**
 * Main
 */
async function main() {
  console.log('🏋️ Fix Traduzioni Esercizi + Alias');
  console.log('===================================\n');
  
  // File da processare (solo i -translated.json che sono quelli usati)
  const files = [
    'chest-translated.json',
    'upper-legs-translated.json',
    'back-translated.json',
    'shoulders-translated.json',
    'upper-arms-translated.json',
    'lower-arms-translated.json',
    'lower-legs-translated.json',
    'waist-translated.json',
    'cardio-translated.json',
    'neck-translated.json'
  ];
  
  let totalUpdated = 0;
  let totalExercises = 0;
  
  for (const file of files) {
    const result = processFile(file);
    totalUpdated += result.updated;
    totalExercises += result.total;
  }
  
  // Aggiorna anche all-exercises-translated.json
  console.log('\n📦 Rigenerazione all-exercises-translated.json...');
  const allExercises = [];
  
  for (const file of files) {
    const filepath = path.join(DATA_DIR, file);
    if (fs.existsSync(filepath)) {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      allExercises.push(...data);
    }
  }
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'all-exercises-translated.json'),
    JSON.stringify(allExercises, null, 2),
    'utf8'
  );
  
  console.log(`\n✅ Completato!`);
  console.log(`   📊 Esercizi totali: ${totalExercises}`);
  console.log(`   ✏️  Esercizi aggiornati: ${totalUpdated}`);
  console.log(`   📁 File all-exercises-translated.json rigenerato con ${allExercises.length} esercizi`);
}

main().catch(console.error);
