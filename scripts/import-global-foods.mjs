#!/usr/bin/env node

/**
 * Import Global Foods Collection
 * 
 * Importa alimenti globali con macro nutrizionali corrette nel database Firestore.
 * Tutti gli alimenti sono accessibili a tutti i tenant per la creazione di schede alimentari.
 * 
 * Collezione Firestore: platform_foods
 * 
 * Ogni alimento contiene:
 * - name: Nome italiano dell'alimento
 * - calories: Calorie per 100g
 * - protein: Proteine in grammi per 100g
 * - carbs: Carboidrati in grammi per 100g
 * - fat: Grassi in grammi per 100g
 * - category: ID categoria (carni-bianche, carni-rosse, pesce, ecc.)
 * - categoryName: Nome leggibile della categoria
 * - categoryIcon: Emoji icona della categoria
 * - unit: Unità di misura base (per 100g / per 100ml)
 * 
 * Le macro vengono scalate automaticamente dall'UI in base alla grammatura inserita dall'utente.
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

async function importGlobalFoods() {
  try {
    console.log('🍽️  Inizio importazione alimenti globali...\n');

    // Leggi il file JSON con tutti gli alimenti
    const foodsData = JSON.parse(
      readFileSync(join(__dirname, 'data', 'globalFoods.json'), 'utf8')
    );

    const batch = db.batch();
    let totalCount = 0;

    // Processa ogni categoria
    for (const category of foodsData.categories) {
      console.log(`📂 Categoria: ${category.name} ${category.icon}`);
      console.log(`   Descrizione: ${category.description}`);
      console.log(`   Alimenti: ${category.foods.length}`);

      // Aggiungi ogni alimento della categoria
      for (const food of category.foods) {
        const foodRef = db.collection('platform_foods').doc();
        
        const foodData = {
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          unit: food.unit,
          category: category.id,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryDescription: category.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        batch.set(foodRef, foodData);
        totalCount++;
      }

      console.log(`   ✅ Preparati ${category.foods.length} alimenti\n`);
    }

    // Commit del batch
    console.log(`💾 Salvataggio ${totalCount} alimenti in Firestore...`);
    await batch.commit();

    console.log('\n✅ Importazione completata con successo!');
    console.log(`📊 Totale alimenti importati: ${totalCount}`);
    console.log(`📁 Categorie totali: ${foodsData.categories.length}`);
    console.log('\n📍 Collezione Firestore: platform_foods');
    console.log('🌍 Accessibile a tutti i tenant');
    
    // Riepilogo per categoria
    console.log('\n📋 Riepilogo per categoria:');
    for (const category of foodsData.categories) {
      console.log(`   ${category.icon} ${category.name}: ${category.foods.length} alimenti`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error);
    process.exit(1);
  }
}

// Esegui l'importazione
importGlobalFoods();
