#!/usr/bin/env node

/**
 * Verify Global Foods in Firestore
 * Verifica che gli alimenti siano stati importati correttamente
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
  readFileSync(join(__dirname, '..', 'service-account.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore();

async function verifyFoods() {
  try {
    console.log('🔍 Verifica alimenti in Firestore...\n');

    const foodsRef = db.collection('platform_foods');
    const snapshot = await foodsRef.get();

    console.log(`📊 Totale alimenti trovati: ${snapshot.size}\n`);

    // Raggruppa per categoria
    const byCategory = {};
    
    snapshot.forEach(doc => {
      const food = doc.data();
      if (!byCategory[food.category]) {
        byCategory[food.category] = {
          name: food.categoryName,
          icon: food.categoryIcon,
          count: 0,
          foods: []
        };
      }
      byCategory[food.category].count++;
      byCategory[food.category].foods.push(food.name);
    });

    // Stampa riepilogo
    console.log('📋 Riepilogo per categoria:\n');
    Object.entries(byCategory).sort((a, b) => b[1].count - a[1].count).forEach(([id, cat]) => {
      console.log(`${cat.icon} ${cat.name} (${id})`);
      console.log(`   Alimenti: ${cat.count}`);
      console.log(`   Primi 5: ${cat.foods.slice(0, 5).join(', ')}`);
      console.log('');
    });

    // Cerca specificamente gli integratori
    const integratori = Object.entries(byCategory).find(([id]) => id === 'integratori-snack');
    if (integratori) {
      console.log('💊 INTEGRATORI E SNACK PROTEICI:');
      console.log(`   Totale: ${integratori[1].count} prodotti\n`);
      console.log('   Lista completa:');
      integratori[1].foods.forEach((name, idx) => {
        console.log(`   ${idx + 1}. ${name}`);
      });
    } else {
      console.log('⚠️  Categoria integratori non trovata!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

verifyFoods();
