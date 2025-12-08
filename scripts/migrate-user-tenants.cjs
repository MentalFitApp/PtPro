/**
 * Script di migrazione: Popola la collezione user_tenants
 * per tutti gli utenti esistenti nel tenant corrente.
 * 
 * Questo script è SICURO: non modifica dati esistenti,
 * aggiunge solo mapping nella nuova collezione user_tenants.
 * 
 * Uso:
 *   node scripts/migrate-user-tenants.cjs [tenantId]
 * 
 * Se non specifichi tenantId, usa 'biondo-fitness-coach' come default.
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Errore: service-account.json non trovato');
  console.log('   Scarica il file da Firebase Console > Impostazioni progetto > Account di servizio');
  process.exit(1);
}

const db = admin.firestore();

// Configurazione
const DEFAULT_TENANT_ID = 'biondo-fitness-coach';
const tenantId = process.argv[2] || DEFAULT_TENANT_ID;

async function migrateUserTenants() {
  console.log('🚀 Migrazione user_tenants iniziata');
  console.log(`📍 Tenant: ${tenantId}`);
  console.log('');

  const stats = {
    clients: 0,
    collaboratori: 0,
    admins: 0,
    coaches: 0,
    superadmins: 0,
    errors: 0,
    skipped: 0
  };

  const batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH = 500;

  async function addToMapping(userId, role) {
    const ref = db.collection('user_tenants').doc(userId);
    
    // Controlla se esiste già
    const existing = await ref.get();
    if (existing.exists) {
      console.log(`  ⏭️  ${userId} già mappato (${existing.data().role})`);
      stats.skipped++;
      return;
    }

    batch.set(ref, {
      tenantId,
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    batchCount++;
    console.log(`  ✅ ${userId} → ${tenantId} (${role})`);

    // Commit batch ogni 500 operazioni
    if (batchCount >= MAX_BATCH) {
      await batch.commit();
      console.log(`  📦 Batch committato (${batchCount} documenti)`);
      batchCount = 0;
    }
  }

  try {
    // 1. Migra CLIENTS
    console.log('👥 Migrando clients...');
    const clientsSnapshot = await db.collection('tenants').doc(tenantId).collection('clients').get();
    for (const doc of clientsSnapshot.docs) {
      try {
        await addToMapping(doc.id, 'client');
        stats.clients++;
      } catch (e) {
        console.error(`  ❌ Errore client ${doc.id}:`, e.message);
        stats.errors++;
      }
    }

    // 2. Migra COLLABORATORI
    console.log('🤝 Migrando collaboratori...');
    const collabSnapshot = await db.collection('tenants').doc(tenantId).collection('collaboratori').get();
    for (const doc of collabSnapshot.docs) {
      try {
        await addToMapping(doc.id, 'collaboratore');
        stats.collaboratori++;
      } catch (e) {
        console.error(`  ❌ Errore collaboratore ${doc.id}:`, e.message);
        stats.errors++;
      }
    }

    // 3. Migra ADMINS
    console.log('👔 Migrando admins...');
    const adminsDoc = await db.collection('tenants').doc(tenantId).collection('roles').doc('admins').get();
    if (adminsDoc.exists && adminsDoc.data()?.uids) {
      for (const uid of adminsDoc.data().uids) {
        try {
          await addToMapping(uid, 'admin');
          stats.admins++;
        } catch (e) {
          console.error(`  ❌ Errore admin ${uid}:`, e.message);
          stats.errors++;
        }
      }
    }

    // 4. Migra COACHES
    console.log('🏋️ Migrando coaches...');
    const coachesDoc = await db.collection('tenants').doc(tenantId).collection('roles').doc('coaches').get();
    if (coachesDoc.exists && coachesDoc.data()?.uids) {
      for (const uid of coachesDoc.data().uids) {
        try {
          await addToMapping(uid, 'coach');
          stats.coaches++;
        } catch (e) {
          console.error(`  ❌ Errore coach ${uid}:`, e.message);
          stats.errors++;
        }
      }
    }

    // 5. Migra SUPERADMINS
    console.log('👑 Migrando superadmins...');
    const superadminsDoc = await db.collection('tenants').doc(tenantId).collection('roles').doc('superadmins').get();
    if (superadminsDoc.exists && superadminsDoc.data()?.uids) {
      for (const uid of superadminsDoc.data().uids) {
        try {
          await addToMapping(uid, 'superadmin');
          stats.superadmins++;
        } catch (e) {
          console.error(`  ❌ Errore superadmin ${uid}:`, e.message);
          stats.errors++;
        }
      }
    }

    // Commit finale
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  📦 Batch finale committato (${batchCount} documenti)`);
    }

    // Report
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📊 REPORT MIGRAZIONE');
    console.log('═══════════════════════════════════════');
    console.log(`  👥 Clients:       ${stats.clients}`);
    console.log(`  🤝 Collaboratori: ${stats.collaboratori}`);
    console.log(`  👔 Admins:        ${stats.admins}`);
    console.log(`  🏋️ Coaches:       ${stats.coaches}`);
    console.log(`  👑 Superadmins:   ${stats.superadmins}`);
    console.log('───────────────────────────────────────');
    console.log(`  ✅ Totale migrati: ${stats.clients + stats.collaboratori + stats.admins + stats.coaches + stats.superadmins}`);
    console.log(`  ⏭️  Già presenti:   ${stats.skipped}`);
    console.log(`  ❌ Errori:         ${stats.errors}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('✅ Migrazione completata!');

  } catch (error) {
    console.error('💥 Errore fatale:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrateUserTenants();
