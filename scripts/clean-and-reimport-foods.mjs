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
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function cleanAndReimport() {
  console.log('🧹 Pulizia collezione platform_foods...\n');
  
  // 1. Elimina tutti i documenti esistenti
  const snapshot = await db.collection('platform_foods').get();
  const batch = db.batch();
  let deleteCount = 0;
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
    deleteCount++;
  });
  
  if (deleteCount > 0) {
    await batch.commit();
    console.log(`✅ Eliminati ${deleteCount} documenti esistenti\n`);
  }
  
  // 2. Carica i dati dal JSON
  const foodsData = JSON.parse(
    readFileSync(join(__dirname, 'data', 'globalFoods.json'), 'utf8')
  );
  
  console.log('📥 Importazione nuovi alimenti...\n');
  
  let totalFoods = 0;
  const categoryStats = {};
  
  // 3. Importa ogni categoria
  for (const category of foodsData.categories) {
    console.log(`📂 ${category.name} ${category.icon}`);
    console.log(`   Descrizione: ${category.description}`);
    
    // Usa un Set per tracciare i nomi già inseriti (evita duplicati)
    const insertedNames = new Set();
    const foodsToInsert = [];
    
    for (const food of category.foods) {
      // Normalizza il nome per il confronto (lowercase, trim)
      const normalizedName = food.name.toLowerCase().trim();
      
      if (!insertedNames.has(normalizedName)) {
        insertedNames.add(normalizedName);
        foodsToInsert.push({
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          unit: food.unit,
          category: category.id,
          categoryName: category.name,
          categoryIcon: category.icon,
          createdAt: new Date(),
          isGlobal: true
        });
      }
    }
    
    // Batch write per questa categoria
    const categoryBatch = db.batch();
    for (const foodData of foodsToInsert) {
      const docRef = db.collection('platform_foods').doc();
      categoryBatch.set(docRef, foodData);
    }
    
    await categoryBatch.commit();
    
    categoryStats[category.name] = foodsToInsert.length;
    totalFoods += foodsToInsert.length;
    
    console.log(`   ✅ Importati ${foodsToInsert.length} alimenti unici\n`);
  }
  
  console.log('\n✨ Importazione completata!\n');
  console.log(`📊 Totale alimenti importati: ${totalFoods}`);
  console.log(`📁 Categorie totali: ${foodsData.categories.length}\n`);
  
  console.log('📋 Riepilogo dettagliato:');
  for (const [categoryName, count] of Object.entries(categoryStats)) {
    console.log(`   ${categoryName}: ${count} alimenti`);
  }
}

cleanAndReimport()
  .then(() => {
    console.log('\n✅ Operazione completata con successo!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Errore:', error);
    process.exit(1);
  });
