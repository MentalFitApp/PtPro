#!/usr/bin/env node

/**
 * 🏋️ SCRIPT IMPORT DA EXERCISEDB API
 * 
 * Importa esercizi con GIF animati da ExerciseDB
 * API: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
 * 
 * Setup:
 * 1. Vai su https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
 * 2. Iscriviti (gratis per 100 chiamate/mese)
 * 3. Copia la tua X-RapidAPI-Key
 * 4. Esporta: export EXERCISEDB_API_KEY="tua-key"
 * 5. Run: node scripts/import-from-exercisedb.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = process.env.EXERCISEDB_API_KEY;

if (!API_KEY) {
  console.error('❌ ERRORE: Manca API key');
  console.log('');
  console.log('📝 Setup:');
  console.log('1. Vai su https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb');
  console.log('2. Iscriviti (gratis per test)');
  console.log('3. Copia X-RapidAPI-Key');
  console.log('4. Export: export EXERCISEDB_API_KEY="tua-key"');
  console.log('5. Run: node scripts/import-from-exercisedb.mjs');
  process.exit(1);
}

// Inizializza Firebase
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../service-account.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Mapping body parts italiano
const BODY_PART_MAP = {
  'chest': 'Petto',
  'back': 'Schiena',
  'shoulders': 'Spalle',
  'upper arms': 'Bicipiti',
  'lower arms': 'Avambracci',
  'upper legs': 'Gambe',
  'lower legs': 'Polpacci',
  'waist': 'Addominali',
  'cardio': 'Cardio',
  'neck': 'Collo'
};

// Mapping equipment italiano
const EQUIPMENT_MAP = {
  'barbell': 'Bilanciere',
  'dumbbell': 'Manubri',
  'body weight': 'Corpo libero',
  'cable': 'Cavi',
  'machine': 'Macchina',
  'kettlebell': 'Kettlebell',
  'band': 'Bande elastiche',
  'leverage machine': 'Macchina',
  'stability ball': 'Swiss ball',
  'assisted': 'Assistito',
  'medicine ball': 'Palla medica',
  'ez barbell': 'Bilanciere EZ',
  'roller': 'Rullo',
  'rope': 'Corda',
  'skierg machine': 'Macchina',
  'sled machine': 'Slitta',
  'smith machine': 'Smith Machine',
  'tire': 'Pneumatico',
  'trap bar': 'Trap Bar',
  'weighted': 'Con peso',
  'wheel roller': 'Ab Wheel'
};

async function fetchExercises(offset = 0, limit = 10) {
  const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises?offset=${offset}&limit=${limit}`, {
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function fetchAllExercises(maxPages = 10) {
  console.log('🔄 Fetching esercizi da ExerciseDB (paginato)...');
  
  const allExercises = [];
  let page = 0;
  const pageSize = 10;

  while (page < maxPages) {
    const offset = page * pageSize;
    const exercises = await fetchExercises(offset, pageSize);
    
    if (exercises.length === 0) {
      break; // No more exercises
    }

    allExercises.push(...exercises);
    page++;

    console.log(`📄 Pagina ${page}/${maxPages}: ${exercises.length} esercizi (Totale: ${allExercises.length})`);

    // Rate limiting: pausa tra le richieste
    if (page < maxPages) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`✅ Totale esercizi fetchati: ${allExercises.length}`);
  return allExercises;
}

function translateExercise(exercise) {
  // Skip se manca id
  if (!exercise.id) {
    return null;
  }

  // Costruisci gifUrl da ID (ExerciseDB image endpoint - richiede piano Pro)
  const gifUrl = `https://api.exercisedb.io/image/${exercise.id}`;

  // Traduci nome (lascia inglese per consistenza internazionale)
  const nomeItaliano = exercise.name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id: `exercisedb_${exercise.id}`,
    nome: nomeItaliano,
    nameEn: exercise.name,
    category: exercise.bodyPart,
    attrezzo: EQUIPMENT_MAP[exercise.equipment] || exercise.equipment,
    gruppoMuscolare: BODY_PART_MAP[exercise.bodyPart] || exercise.bodyPart,
    primaryMuscles: [BODY_PART_MAP[exercise.target] || exercise.target],
    secondaryMuscles: exercise.secondaryMuscles || [],
    difficulty: exercise.difficulty || 'intermediate',
    gifUrl: gifUrl,
    videoUrl: gifUrl, // Usa GIF come video
    descrizione: exercise.description || `Esercizio per ${BODY_PART_MAP[exercise.bodyPart] || exercise.bodyPart} con ${EQUIPMENT_MAP[exercise.equipment] || exercise.equipment}`,
    instructions: exercise.instructions || [],
    tips: [],
    isGlobal: true,
    source: 'exercisedb',
    featured: false
  };
}

async function importExercises() {
  console.log('🏋️  IMPORT DA EXERCISEDB');
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
        
        // Skip se non ha gifUrl
        if (!translated) {
          skipped++;
          continue;
        }
        
        // Count per categoria
        const cat = translated.gruppoMuscolare;
        stats[cat] = (stats[cat] || 0) + 1;

        // Check se esiste
        const docRef = db.collection('platform_exercises').doc(translated.id);
        const doc = await docRef.get();

        if (doc.exists) {
          skipped++;
          continue;
        }

        // Importa
        await docRef.set({
          ...translated,
          createdAt: new Date(),
          updatedAt: new Date(),
          views: 0,
          usedInPrograms: 0,
          editable: false
        });

        console.log(`✅ ${translated.nome} (${translated.gruppoMuscolare})`);
        imported++;

        // Rate limit: piccola pausa ogni 50
        if (imported % 50 === 0) {
          console.log(`   ... ${imported} importati, pausa...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ Errore: ${exercise.name}`, error.message);
        errors++;
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
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`);
      });
    console.log('');

    if (imported > 0) {
      console.log('✨ Import completato!');
      console.log('🎁 Hai ora GIF animati professionali per ogni esercizio');
      console.log('💾 I GIF sono hosted da ExerciseDB (nessun costo storage)');
    }

  } catch (error) {
    console.error('❌ ERRORE:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run
importExercises();
