#!/usr/bin/env node

/**
 * 🏋️ SCRIPT IMPORT ESERCIZI GLOBALI
 * 
 * Importa 79 esercizi nel database globale platform_exercises
 * Categorie: Gambe (20), Petto (15), Schiena (15), Spalle (12), Braccia (12), Core (10)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inizializza Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../service-account.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Carica tutti i JSON esercizi
const legsData = JSON.parse(readFileSync(join(__dirname, '../data/exercises/legs.json'), 'utf8'));
const chestData = JSON.parse(readFileSync(join(__dirname, '../data/exercises/chest.json'), 'utf8'));
const backData = JSON.parse(readFileSync(join(__dirname, '../data/exercises/back.json'), 'utf8'));
const shouldersData = JSON.parse(readFileSync(join(__dirname, '../data/exercises/shoulders.json'), 'utf8'));
const armsData = JSON.parse(readFileSync(join(__dirname, '../data/exercises/arms.json'), 'utf8'));
const coreData = JSON.parse(readFileSync(join(__dirname, '../data/exercises/core.json'), 'utf8'));

const allExercises = [
  ...legsData,
  ...chestData,
  ...backData,
  ...shouldersData,
  ...armsData,
  ...coreData
];

async function importExercises() {
  console.log('🏋️  IMPORT ESERCIZI GLOBALI');
  console.log('=' .repeat(50));
  console.log(`📦 Totale esercizi da importare: ${allExercises.length}`);
  console.log('');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const exercise of allExercises) {
    try {
      const { id, ...exerciseData } = exercise;
      
      // Check se esiste già
      const docRef = db.collection('platform_exercises').doc(id);
      const doc = await docRef.get();
      
      if (doc.exists) {
        console.log(`⏭️  Skip: ${exercise.nome} (già esistente)`);
        skipped++;
        continue;
      }

      // Aggiungi timestamp e metadata
      await docRef.set({
        ...exerciseData,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        usedInPrograms: 0,
        source: 'global',
        editable: false
      });

      console.log(`✅ Importato: ${exercise.nome} (${exercise.gruppoMuscolare})`);
      imported++;

    } catch (error) {
      console.error(`❌ Errore con ${exercise.nome}:`, error.message);
      errors++;
    }
  }

  console.log('');
  console.log('=' .repeat(50));
  console.log('📊 RIEPILOGO');
  console.log(`✅ Importati: ${imported}`);
  console.log(`⏭️  Saltati (già presenti): ${skipped}`);
  console.log(`❌ Errori: ${errors}`);
  console.log(`📦 Totale: ${allExercises.length}`);
  console.log('');
  
  // Stats per categoria
  const stats = {
    legs: legsData.length,
    chest: chestData.length,
    back: backData.length,
    shoulders: shouldersData.length,
    arms: armsData.length,
    core: coreData.length
  };

  console.log('📈 ESERCIZI PER CATEGORIA:');
  console.log(`🦵 Gambe: ${stats.legs}`);
  console.log(`💪 Petto: ${stats.chest}`);
  console.log(`🏋️  Schiena: ${stats.back}`);
  console.log(`👐 Spalle: ${stats.shoulders}`);
  console.log(`💪 Braccia: ${stats.arms}`);
  console.log(`🔥 Core: ${stats.core}`);
  console.log('');

  if (imported > 0) {
    console.log('✨ Database globale popolato con successo!');
    console.log('🌍 Gli esercizi sono ora disponibili per tutti i tenant.');
  }

  process.exit(0);
}

// Esegui import
importExercises().catch((error) => {
  console.error('❌ ERRORE FATALE:', error);
  process.exit(1);
});
