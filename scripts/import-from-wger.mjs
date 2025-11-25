import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

// Inizializza Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Mappatura categorie WGER -> italiano
const CATEGORY_MAP = {
  'Abs': 'Addominali',
  'Arms': 'Braccia',
  'Back': 'Schiena',
  'Calves': 'Polpacci',
  'Cardio': 'Cardio',
  'Chest': 'Petto',
  'Legs': 'Gambe',
  'Shoulders': 'Spalle'
};

// Mappatura equipaggiamento WGER -> italiano
const EQUIPMENT_MAP = {
  'Barbell': 'Bilanciere',
  'Dumbbell': 'Manubri',
  'Kettlebell': 'Kettlebell',
  'SZ-Bar': 'SZ-Bar',
  'Gym mat': 'Tappetino',
  'Bench': 'Panca',
  'Pull-up bar': 'Sbarra trazioni',
  'Swiss Ball': 'Swiss Ball',
  'Body weight': 'Corpo libero',
  'Incline bench': 'Panca inclinata',
  'none (bodyweight exercise)': 'Corpo libero'
};

// Mappatura muscoli WGER -> italiano
const MUSCLE_MAP = {
  'Abs': 'Addominali',
  'Biceps': 'Bicipiti',
  'Triceps': 'Tricipiti',
  'Shoulders': 'Spalle',
  'Chest': 'Petto',
  'Lats': 'Dorsali',
  'Lower Back': 'Lombari',
  'Quadriceps': 'Quadricipiti',
  'Hamstrings': 'Femorali',
  'Glutes': 'Glutei',
  'Calves': 'Polpacci'
};

const DIFFICULTY_MAP = {
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'advanced': 'advanced'
};

async function fetchAllExercises() {
  console.log('🔄 Fetching esercizi da WGER (paginato)...');
  
  const allExercises = [];
  let nextUrl = 'https://wger.de/api/v2/exerciseinfo/?limit=50';
  let page = 0;

  while (nextUrl && page < 20) { // Limito a 20 pagine = ~1000 esercizi
    const response = await fetch(nextUrl);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    allExercises.push(...data.results);
    nextUrl = data.next;
    page++;

    console.log(`📄 Pagina ${page}: ${data.results.length} esercizi (Totale: ${allExercises.length})`);

    // Rate limiting
    if (nextUrl) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`✅ Totale esercizi fetchati: ${allExercises.length}`);
  return allExercises;
}

function translateExercise(exercise) {
  // Skip se non ha immagini
  if (!exercise.images || exercise.images.length === 0) {
    return null;
  }

  // Prendi traduzione italiana o inglese
  const italianTranslation = exercise.translations.find(t => t.language === 13); // 13 = italiano
  const englishTranslation = exercise.translations.find(t => t.language === 2); // 2 = inglese
  const translation = italianTranslation || englishTranslation || exercise.translations[0];

  if (!translation) {
    return null;
  }

  // Prendi prima immagine principale o prima disponibile
  const mainImage = exercise.images.find(img => img.is_main) || exercise.images[0];
  const imageUrl = mainImage.image;

  // Categoria
  const category = exercise.category?.name || 'General';
  const categoryIt = CATEGORY_MAP[category] || category;

  // Equipaggiamento
  const equipment = exercise.equipment[0]?.name || 'Corpo libero';
  const equipmentIt = EQUIPMENT_MAP[equipment] || equipment;

  // Muscoli
  const primaryMuscles = exercise.muscles.map(m => 
    MUSCLE_MAP[m.name_en] || m.name_en || m.name
  ).filter(Boolean);

  const secondaryMuscles = exercise.muscles_secondary.map(m => 
    MUSCLE_MAP[m.name_en] || m.name_en || m.name
  ).filter(Boolean);

  // Pulisci descrizione HTML
  const description = translation.description
    ?.replace(/<[^>]*>/g, '')
    ?.trim() || '';

  // Estrai istruzioni (se presenti nel testo)
  const instructions = description.split(/\.\s+/).filter(s => s.length > 10);

  return {
    id: `wger_${exercise.id}`,
    nome: translation.name,
    nameEn: englishTranslation?.name || translation.name,
    category: categoryIt,
    attrezzo: equipmentIt,
    gruppoMuscolare: categoryIt,
    primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : [categoryIt],
    secondaryMuscles: secondaryMuscles,
    difficulty: 'intermediate', // WGER non ha difficoltà, default intermediate
    gifUrl: imageUrl,
    videoUrl: imageUrl, // Usa immagine come preview
    descrizione: description,
    instructions: instructions.slice(0, 5), // Max 5 step
    tips: [],
    isGlobal: true,
    source: 'wger',
    featured: false,
    license: 'CC-BY-SA 4.0',
    licenseUrl: exercise.license?.url || 'https://creativecommons.org/licenses/by-sa/4.0/'
  };
}

async function importExercises() {
  console.log('🏋️  IMPORT DA WGER');
  console.log('=' .repeat(60));
  console.log('');

  try {
    // Fetch da API (paginato)
    const exercises = await fetchAllExercises();
    console.log('');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Stats per categoria
    const stats = {};

    for (const exercise of exercises) {
      try {
        const translated = translateExercise(exercise);
        
        // Skip se non ha immagini
        if (!translated) {
          skipped++;
          continue;
        }

        // Controlla se esiste già
        const existingDoc = await db.collection('platform_exercises').doc(translated.id).get();
        if (existingDoc.exists) {
          skipped++;
          continue;
        }

        // Importa in Firestore
        await db.collection('platform_exercises').doc(translated.id).set(translated);

        // Stats
        const cat = translated.category;
        stats[cat] = (stats[cat] || 0) + 1;

        imported++;

        // Log ogni 10 esercizi
        if (imported % 10 === 0) {
          console.log(`✅ Importati: ${imported}...`);
        }

        // Pausa ogni 50 per non sovraccaricare Firestore
        if (imported % 50 === 0) {
          console.log(`   ... pausa ...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        errors++;
        console.error(`❌ Errore su esercizio ${exercise.id}:`, error.message);
      }
    }

    console.log('');
    console.log('=' .repeat(60));
    console.log('📊 RIEPILOGO');
    console.log(`✅ Importati: ${imported}`);
    console.log(`⏭️  Saltati: ${skipped}`);
    console.log(`❌ Errori: ${errors}`);
    console.log(`📦 Totale: ${exercises.length}`);
    console.log('');
    console.log('📈 ESERCIZI PER GRUPPO MUSCOLARE:');
    Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`);
      });
    console.log('');
    console.log('✨ Import completato!');
    console.log('🎁 Tutti gli esercizi hanno immagini JPG');
    console.log('💾 Immagini hosted su wger.de (nessun costo storage)');
    console.log('📄 Licenza: CC-BY-SA 4.0 (uso commerciale consentito)');

  } catch (error) {
    console.error('❌ Errore durante import:', error);
  } finally {
    process.exit(0);
  }
}

// Esegui import
importExercises();
