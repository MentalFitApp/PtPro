/**
 * Script per aggiungere un tenant come editor di esercizi globali
 * 
 * Usage: node add-exercise-editor.cjs <tenantId>
 * Example: node add-exercise-editor.cjs biondo-fitness-coach
 */

const admin = require('firebase-admin');

// Inizializza Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addExerciseEditor(tenantId) {
  if (!tenantId) {
    console.error('❌ Specifica il tenantId come argomento');
    console.log('Usage: node add-exercise-editor.cjs <tenantId>');
    process.exit(1);
  }

  try {
    // Verifica che il tenant esista
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      console.error(`❌ Tenant "${tenantId}" non trovato`);
      process.exit(1);
    }

    console.log(`✅ Tenant trovato: ${tenantDoc.data().name || tenantId}`);

    // Aggiungi il tenant alla lista degli editor
    const editorsRef = db.collection('platform_admins').doc('exercise_editors');
    const editorsDoc = await editorsRef.get();
    
    let tenantIds = [];
    if (editorsDoc.exists) {
      tenantIds = editorsDoc.data().tenantIds || [];
    }

    if (tenantIds.includes(tenantId)) {
      console.log(`ℹ️ Il tenant "${tenantId}" è già un editor di esercizi globali`);
    } else {
      tenantIds.push(tenantId);
      await editorsRef.set({
        tenantIds,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        description: 'Lista dei tenant che possono modificare i nomi degli esercizi globali'
      });
      console.log(`✅ Tenant "${tenantId}" aggiunto come editor di esercizi globali!`);
    }

    console.log('\n📋 Lista attuale editor:');
    tenantIds.forEach(id => console.log(`   - ${id}`));

  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Esegui
const tenantId = process.argv[2];
addExerciseEditor(tenantId);
