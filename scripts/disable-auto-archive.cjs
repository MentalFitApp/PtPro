/**
 * Script per DISABILITARE l'archiviazione automatica dei clienti
 * 
 * Uso: node scripts/disable-auto-archive.cjs
 * 
 * Questo disabilita la cloud function che archivia automaticamente
 * i clienti dopo la scadenza dell'abbonamento.
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Configurazione
const args = process.argv.slice(2);
const tenantArg = args.find(a => a.startsWith('--tenant='));
const TENANT_ID = tenantArg ? tenantArg.split('=')[1] : process.env.VITE_TENANT_ID || 'flowfit';

async function disableAutoArchive() {
  console.log('\n🔧 DISABLE AUTO-ARCHIVE');
  console.log('========================');
  console.log(`📍 Tenant: ${TENANT_ID}\n`);

  try {
    const settingsRef = db.doc(`tenants/${TENANT_ID}/settings/clientArchiveSettings`);
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      console.log('⚠️  Nessuna impostazione di archiviazione trovata.');
      console.log('    L\'archiviazione automatica non è mai stata configurata per questo tenant.');
      process.exit(0);
    }

    const currentSettings = settingsSnap.data();
    
    console.log('📊 Impostazioni attuali:');
    console.log(`   Auto-archive abilitato: ${currentSettings.autoArchive?.enabled ? 'SÌ ⚠️' : 'NO ✓'}`);
    console.log(`   Giorni dopo scadenza: ${currentSettings.autoArchive?.inactivityDays || 'N/D'}`);
    console.log('');

    if (!currentSettings.autoArchive?.enabled) {
      console.log('✅ L\'archiviazione automatica è già DISABILITATA!');
      process.exit(0);
    }

    // Disabilita
    await settingsRef.update({
      'autoArchive.enabled': false,
      'autoArchive.disabledAt': admin.firestore.FieldValue.serverTimestamp(),
      'autoArchive.disabledBy': 'script-disable-auto-archive'
    });

    console.log('✅ Archiviazione automatica DISABILITATA con successo!');
    console.log('');
    console.log('   I clienti NON verranno più archiviati automaticamente alla scadenza.');
    console.log('   Puoi sempre riabilitarla dalle impostazioni dell\'app.');

  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Esegui
disableAutoArchive();
