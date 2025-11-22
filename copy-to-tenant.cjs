// Script per copiare TUTTI i dati attuali sotto tenants/biondo-fitness-coach/
// Esegui DOPO aver creato platform_admins/superadmins manualmente
// node copy-to-tenant.cjs

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  writeBatch
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDU4GmH6xLhrEd2jSkyATXJOasIyEfisXY",
  authDomain: "biondo-fitness-coach.firebaseapp.com",
  projectId: "biondo-fitness-coach",
  storageBucket: "biondo-fitness-coach.firebasestorage.app",
  messagingSenderId: "1086406111438",
  appId: "1:1086406111438:web:1c8c3d9e49f1ffdb77609f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = 'biondo-fitness-coach';

// Collections da NON migrare (sono già alla root o non servono)
const SKIP_COLLECTIONS = ['platform_admins', 'tenants'];

async function getAllCollections() {
  // Lista manuale perché Firestore client SDK non può listare collections
  return [
    'users',
    'clients', 
    'roles',
    'collaboratori',
    'community_posts',
    'leads',
    'guides',
    'guideLeads',
    'dipendenti_provvigioni',
    'pagamenti_dipendenti',
    'calendarEvents',
    'fcmTokens',
    'notifications',
    'userStatus',
    'schede_alimentazione',
    'schede_allenamento',
    'community_config',
    'daily_rooms',
    'call_recordings',
    'community_stats',
    'community_channels',
    'courses',
    'course_enrollments',
    'user_progress',
    'quiz_results',
    'certificates',
    'marketingReports',
    'salesReports',
    'settingReports',
    'pagamenti',
    'chats',
    'app-data'
  ];
}

async function copyCollection(collectionName) {
  console.log(`\n📦 Copiando ${collectionName}...`);
  
  try {
    const sourceRef = collection(db, collectionName);
    const snapshot = await getDocs(sourceRef);
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Vuota, skip`);
      return 0;
    }

    console.log(`   📊 Trovati ${snapshot.size} documenti`);
    
    let copied = 0;
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const targetRef = doc(db, 'tenants', TENANT_ID, collectionName, docSnap.id);
      
      batch.set(targetRef, {
        ...data,
        _migratedAt: new Date().toISOString(),
        _tenantId: TENANT_ID
      });

      batchCount++;
      copied++;

      // Commit ogni 450 docs (limite Firestore è 500)
      if (batchCount >= 450) {
        await batch.commit();
        console.log(`   ✓ Salvati ${copied} documenti...`);
        batchCount = 0;
      }
    }

    // Commit rimanenti
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`   ✅ Completato: ${copied} documenti copiati`);
    return copied;
    
  } catch (error) {
    console.error(`   ❌ Errore su ${collectionName}:`, error.message);
    return 0;
  }
}

async function copySubcollections(parentCollection, subCollections) {
  console.log(`\n📂 Copiando subcollections di ${parentCollection}...`);
  
  try {
    const parentSnapshot = await getDocs(collection(db, parentCollection));
    let totalCopied = 0;

    for (const parentDoc of parentSnapshot.docs) {
      for (const subCollName of subCollections) {
        const subRef = collection(db, parentCollection, parentDoc.id, subCollName);
        const subSnapshot = await getDocs(subRef);

        if (!subSnapshot.empty) {
          console.log(`   📄 ${parentDoc.id}/${subCollName}: ${subSnapshot.size} docs`);

          for (const subDoc of subSnapshot.docs) {
            const targetPath = `tenants/${TENANT_ID}/${parentCollection}/${parentDoc.id}/${subCollName}/${subDoc.id}`;
            await setDoc(doc(db, targetPath), {
              ...subDoc.data(),
              _migratedAt: new Date().toISOString(),
              _tenantId: TENANT_ID
            });
            totalCopied++;
          }
        }
      }
    }

    console.log(`   ✅ ${totalCopied} subcollection docs copiati`);
    
  } catch (error) {
    console.error(`   ❌ Errore subcollections:`, error.message);
  }
}

async function createTenantMetadata() {
  console.log(`\n🏢 Creando metadata tenant...`);
  
  const tenantData = {
    tenantId: TENANT_ID,
    name: 'Biondo Fitness Coach',
    displayName: 'Biondo Personal Trainer',
    slug: 'biondo-fitness-coach',
    status: 'active',
    createdAt: new Date().toISOString(),
    subscription: {
      plan: 'premium',
      status: 'active',
      startDate: new Date().toISOString(),
      features: ['community', 'courses', 'chat', 'calendar', 'analytics']
    }
  };

  try {
    await setDoc(doc(db, 'tenants', TENANT_ID), tenantData);
    console.log(`   ✅ Metadata creato`);
  } catch (error) {
    console.error(`   ❌ Errore:`, error.message);
  }
}

async function run() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 COPIA DATI IN TENANT');
  console.log('='.repeat(60));
  console.log(`\nTarget: tenants/${TENANT_ID}/`);
  console.log('\n⚠️  IMPORTANTE: I dati originali NON verranno eliminati!\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Hai già creato platform_admins/superadmins su Firebase Console? (si/no): ', async (answer) => {
    if (answer.toLowerCase() !== 'si') {
      console.log('\n❌ Prima crea platform_admins/superadmins manualmente!');
      console.log('\n1. Vai su Firebase Console > Firestore');
      console.log('2. Crea collection "platform_admins"');
      console.log('3. Document ID: "superadmins"');
      console.log('4. Field: uids (array) = ["FMj9GlrcUmUGpGUODaQe6dHaXcL2"]');
      console.log('5. Save e poi riesegui questo script\n');
      process.exit(0);
    }

    console.log('\n🚀 Inizio copia...\n');

    // Crea metadata
    await createTenantMetadata();

    // Copia collections
    const collections = await getAllCollections();
    let totalCopied = 0;

    for (const collName of collections) {
      const copied = await copyCollection(collName);
      totalCopied += copied;
    }

    // Copia subcollections importanti
    console.log('\n📂 Copiando subcollections...');
    await copySubcollections('clients', ['anamnesi', 'checks', 'payments']);
    await copySubcollections('community_posts', ['comments']);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ COPIA COMPLETATA!');
    console.log('='.repeat(60));
    console.log(`\n📊 Documenti copiati: ${totalCopied}`);
    console.log(`\n🎯 Ora puoi accedere a:`);
    console.log(`   - Platform Dashboard: /platform-login`);
    console.log(`   - Business Dashboard: /ceo-login`);
    console.log(`\n⚠️  I dati originali sono ancora alla root.`);
    console.log(`   NON eliminarli finché non hai testato tutto!\n`);

    process.exit(0);
  });
}

run();
