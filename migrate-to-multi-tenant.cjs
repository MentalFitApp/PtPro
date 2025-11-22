// Script di migrazione a struttura multi-tenant
// Migra tutti i dati attuali sotto tenants/biondo-fitness-coach/
// Esegui con: node migrate-to-multi-tenant.cjs

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  writeBatch,
  deleteDoc 
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
const COLLECTIONS_TO_MIGRATE = [
  'users',
  'clients', 
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
  'pagamenti'
];

const ROLES_COLLECTIONS = ['superadmins', 'admins', 'coaches'];

async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrando collection: ${collectionName}...`);
  
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Collection vuota, skip`);
      return { success: 0, errors: 0 };
    }

    let successCount = 0;
    let errorCount = 0;

    // Migra in batch di 500 per efficienza
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        const newDocRef = doc(db, 'tenants', TENANT_ID, collectionName, docSnap.id);
        
        batch.set(newDocRef, {
          ...data,
          migratedAt: new Date().toISOString(),
          tenantId: TENANT_ID
        });

        batchCount++;

        // Commit batch ogni 500 documenti
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`   ✓ Batch di ${batchCount} documenti committato`);
          batchCount = 0;
        }

        successCount++;
      } catch (error) {
        console.error(`   ❌ Errore documento ${docSnap.id}:`, error.message);
        errorCount++;
      }
    }

    // Commit rimanenti
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`   ✅ Migrati ${successCount} documenti (${errorCount} errori)`);
    
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error(`   ❌ Errore migrazione ${collectionName}:`, error.message);
    return { success: 0, errors: 1 };
  }
}

async function migrateSubcollections(collectionName, subcollections) {
  console.log(`\n📦 Migrando subcollections di ${collectionName}...`);
  
  try {
    const parentDocs = await getDocs(collection(db, collectionName));
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const parentDoc of parentDocs.docs) {
      for (const subCollName of subcollections) {
        const subColRef = collection(db, collectionName, parentDoc.id, subCollName);
        const subSnapshot = await getDocs(subColRef);

        if (!subSnapshot.empty) {
          console.log(`   📂 ${parentDoc.id}/${subCollName}: ${subSnapshot.size} docs`);

          for (const subDoc of subSnapshot.docs) {
            try {
              const newPath = `tenants/${TENANT_ID}/${collectionName}/${parentDoc.id}/${subCollName}/${subDoc.id}`;
              await setDoc(doc(db, newPath), {
                ...subDoc.data(),
                migratedAt: new Date().toISOString(),
                tenantId: TENANT_ID
              });
              totalSuccess++;
            } catch (error) {
              console.error(`   ❌ Errore:`, error.message);
              totalErrors++;
            }
          }
        }
      }
    }

    console.log(`   ✅ Subcollections: ${totalSuccess} docs migrati (${totalErrors} errori)`);
  } catch (error) {
    console.error(`   ❌ Errore migrazione subcollections:`, error.message);
  }
}

async function migrateRoles() {
  console.log(`\n🔐 Migrando roles...`);
  
  for (const roleName of ROLES_COLLECTIONS) {
    try {
      const roleDoc = await getDoc(doc(db, 'roles', roleName));
      
      if (roleDoc.exists()) {
        const newRoleRef = doc(db, 'tenants', TENANT_ID, 'roles', roleName);
        await setDoc(newRoleRef, {
          ...roleDoc.data(),
          migratedAt: new Date().toISOString(),
          tenantId: TENANT_ID
        });
        console.log(`   ✅ Ruolo ${roleName} migrato`);
      }
    } catch (error) {
      console.error(`   ❌ Errore ruolo ${roleName}:`, error.message);
    }
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
      features: [
        'community',
        'courses',
        'chat',
        'calendar',
        'analytics',
        'custom_branding'
      ]
    },
    settings: {
      branding: {
        primaryColor: '#8b5cf6',
        logo: null
      },
      features: {
        communityEnabled: true,
        coursesEnabled: true,
        paymentsEnabled: true
      }
    },
    stats: {
      usersCount: 0,
      clientsCount: 0,
      activeUsers: 0
    }
  };

  try {
    await setDoc(doc(db, 'tenants', TENANT_ID), tenantData);
    console.log(`   ✅ Metadata tenant creato`);
  } catch (error) {
    console.error(`   ❌ Errore metadata:`, error.message);
  }
}

async function createPlatformAdmin(adminUid) {
  console.log(`\n👑 Creando CEO Platform Admin...`);
  
  try {
    await setDoc(doc(db, 'platform_admins', 'superadmins'), {
      uids: [adminUid],
      createdAt: new Date().toISOString()
    });
    console.log(`   ✅ CEO Platform Admin creato (UID: ${adminUid})`);
  } catch (error) {
    console.error(`   ❌ Errore:`, error.message);
  }
}

async function runMigration() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MIGRAZIONE MULTI-TENANT');
  console.log('='.repeat(60));
  console.log(`\nTenant ID: ${TENANT_ID}`);
  console.log(`Collections da migrare: ${COLLECTIONS_TO_MIGRATE.length}`);
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n⚠️  ATTENZIONE: Questa operazione copierà tutti i dati sotto tenants/biondo-fitness-coach/\n   I dati originali NON verranno cancellati automaticamente.\n\nInserisci il tuo UID per diventare CEO Platform: ', async (ceoUid) => {
    
    if (!ceoUid || ceoUid.length < 20) {
      console.log('\n❌ UID non valido');
      process.exit(1);
    }

    console.log('\n🔄 Inizio migrazione...\n');

    // 1. Crea metadata tenant
    await createTenantMetadata();

    // 2. Migra collections principali
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      const result = await migrateCollection(collectionName);
      totalSuccess += result.success;
      totalErrors += result.errors;
    }

    // 3. Migra subcollections specifiche
    await migrateSubcollections('clients', ['anamnesi', 'checks', 'payments']);
    await migrateSubcollections('courses', ['modules']);
    await migrateSubcollections('community_posts', ['comments']);

    // 4. Migra roles
    await migrateRoles();

    // 5. Crea CEO Platform Admin
    await createPlatformAdmin(ceoUid);

    // Riepilogo
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRAZIONE COMPLETATA');
    console.log('='.repeat(60));
    console.log(`\n📊 Statistiche:`);
    console.log(`   Documenti migrati: ${totalSuccess}`);
    console.log(`   Errori: ${totalErrors}`);
    console.log(`\n🏢 Struttura creata:`);
    console.log(`   tenants/${TENANT_ID}/`);
    console.log(`   platform_admins/superadmins`);
    
    console.log(`\n⚠️  PROSSIMI PASSI:`);
    console.log(`   1. Aggiorna Firestore Rules`);
    console.log(`   2. Aggiorna frontend per leggere da tenants/${TENANT_ID}/`);
    console.log(`   3. Testa tutto funzioni`);
    console.log(`   4. SOLO DOPO: Elimina vecchie collections root`);
    console.log(`\n   Script pronto: node cleanup-old-collections.cjs`);

    process.exit(0);
  });
}

runMigration();
