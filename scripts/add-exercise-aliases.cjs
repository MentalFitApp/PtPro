/**
 * Script per aggiungere alias di ricerca agli esercizi
 * Questo script NON modifica nameIt, ma aggiunge solo alias per facilitare la ricerca
 * 
 * Gli alias permettono di trovare:
 * - Chest press cercando "chest press", "pec deck", ecc.
 * - Leg extension cercando "leg extension", "quadricipiti", ecc.
 * - T-bar row cercando "t-bar", "tbar", ecc.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'exercisedb');

// Alias generici da aggiungere basati sul nome inglese
const ALIAS_PATTERNS = {
  // Petto
  'chest press': ['chest press', 'pressa petto', 'spinta petto', 'pectoral press', 'macchina petto'],
  'lever chest press': ['chest press', 'chest press macchina', 'pressa petto'],
  'incline chest press': ['chest press inclinata', 'incline chest press', 'petto alto macchina'],
  'decline chest press': ['chest press declinata', 'decline chest press', 'petto basso macchina'],
  'pec fly': ['pec fly', 'pec deck', 'butterfly', 'croci', 'farfalla'],
  'lever seated fly': ['pec fly', 'pec deck', 'butterfly', 'croci macchina', 'pectoral fly', 'farfalla'],
  'cable fly': ['cable fly', 'croci cavi', 'cable crossover', 'crossover'],
  'dumbbell fly': ['dumbbell fly', 'croci manubri', 'aperture manubri', 'croci'],
  'bench press': ['bench press', 'panca piana', 'distensioni panca', 'panca'],
  'incline bench': ['panca inclinata', 'incline bench', 'petto alto'],
  'decline bench': ['panca declinata', 'decline bench', 'petto basso'],
  
  // Gambe
  'lever leg extension': ['leg extension', 'estensione gambe', 'quadricipiti macchina', 'estensione quadricipiti'],
  'leg extension': ['leg extension', 'estensione gambe', 'quadricipiti'],
  'leg press': ['leg press', 'pressa gambe', 'pressa'],
  'sled 45': ['leg press', 'leg press 45', 'pressa gambe', 'pressa 45 gradi'],
  'hack squat': ['hack squat', 'squat hack', 'squat guidato', 'hack'],
  'sled hack': ['hack squat', 'hack squat macchina', 'hack sled'],
  'leg curl': ['leg curl', 'curl gambe', 'femorali', 'bicipite femorale'],
  'lying leg curl': ['leg curl sdraiato', 'leg curl prono', 'femorali sdraiato'],
  'seated leg curl': ['leg curl seduto', 'femorali seduto'],
  'squat': ['squat', 'accosciata', 'piegamenti gambe'],
  'lunge': ['lunge', 'affondo', 'affondi'],
  
  // Schiena
  't bar row': ['t-bar row', 'tbar row', 't bar', 'rematore t-bar', 'landmine row', 't-bar'],
  'lever t bar': ['t-bar row', 'tbar', 't bar row', 'rematore t-bar'],
  'row': ['row', 'rematore', 'remata', 'tirata'],
  'seated row': ['seated row', 'pulley', 'rematore seduto', 'pulley basso'],
  'cable row': ['cable row', 'pulley', 'rematore cavi', 'pulley seduto'],
  'cable seated': ['pulley', 'pulley seduto', 'rematore cavi seduto'],
  'high row': ['high row', 'rematore alto', 'row alto'],
  'narrow grip': ['presa stretta', 'narrow grip', 'grip stretto'],
  'pulldown': ['pulldown', 'pull down', 'lat machine', 'tirata alta', 'lat pulldown'],
  'lat pulldown': ['lat pulldown', 'lat machine', 'tirata lat', 'pulldown'],
  'bent over row': ['bent over row', 'rematore piegato', 'rematore busto flesso'],
  
  // Spalle
  'shoulder press': ['shoulder press', 'military press', 'lento avanti', 'spinte spalle'],
  'lateral raise': ['lateral raise', 'alzate laterali', 'side raise', 'laterali'],
  'front raise': ['front raise', 'alzate frontali', 'frontali'],
  'rear delt': ['rear delt', 'deltoide posteriore', 'alzate posteriori', 'posteriori'],
  'face pull': ['face pull', 'tirate al viso', 'facepull'],
  
  // Braccia
  'bicep curl': ['bicep curl', 'curl bicipiti', 'flessione bicipiti', 'curl'],
  'hammer curl': ['hammer curl', 'curl martello', 'curl neutro'],
  'preacher curl': ['preacher curl', 'curl panca scott', 'scott'],
  'tricep': ['tricep', 'tricipiti', 'estensione tricipiti'],
  'pushdown': ['pushdown', 'push down', 'spinta tricipiti', 'tricipiti cavi'],
  'skull crusher': ['skull crusher', 'french press', 'estensione tricipiti sdraiato'],
  'dip': ['dip', 'parallele', 'dips'],
  
  // Equipment aliases
  'lever': ['macchina', 'leva'],
  'cable': ['cavi', 'cable', 'pulley'],
  'dumbbell': ['manubri', 'manubrio', 'dumbbell'],
  'barbell': ['bilanciere', 'barbell'],
  'smith': ['multipower', 'smith machine', 'smith'],
  'sled': ['slitta', 'sled', 'pressa'],
  'kettlebell': ['kettlebell', 'kb'],
  'band': ['elastico', 'banda', 'band', 'resistance band']
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
    // Genera alias automatici
    const autoAliases = generateAutoAliases(exercise);
    
    if (!exercise.aliases) {
      exercise.aliases = autoAliases;
      if (autoAliases.length > 0) updatedCount++;
    } else {
      // Merge con alias esistenti
      const mergedAliases = new Set([...exercise.aliases, ...autoAliases]);
      if (mergedAliases.size > exercise.aliases.length) {
        exercise.aliases = Array.from(mergedAliases);
        updatedCount++;
      }
    }
  }
  
  // Salva il file aggiornato
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✅ Alias aggiunti a ${updatedCount}/${data.length} esercizi`);
  
  return { updated: updatedCount, total: data.length };
}

/**
 * Main
 */
async function main() {
  console.log('🏋️ Aggiunta Alias Esercizi');
  console.log('===========================\n');
  
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
  
  // Rigenera all-exercises-translated.json
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
  console.log(`   🏷️  Esercizi con alias: ${totalUpdated}`);
  console.log(`   📁 File all-exercises-translated.json rigenerato con ${allExercises.length} esercizi`);
}

main().catch(console.error);
