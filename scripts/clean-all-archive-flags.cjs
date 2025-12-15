/**
 * Script per rimuovere i flag di ARCHIVIAZIONE dai clienti
 * 
 * Pulisce solo: isArchived (NON tocca isOldClient che significa "cliente storico")
 * 
 * Uso: node scripts/clean-all-archive-flags.cjs --tenant=biondo-fitness-coach
 * 
 * Opzioni:
 *   --dry-run    Mostra solo cosa verrebbe modificato senza salvare
 *   --tenant=ID  Specifica un tenant ID (obbligatorio)
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
const isDryRun = args.includes('--dry-run');
const tenantArg = args.find(a => a.startsWith('--tenant='));
const TENANT_ID = tenantArg ? tenantArg.split('=')[1] : null;

if (!TENANT_ID) {
  console.error('❌ Errore: specifica il tenant con --tenant=ID');
  process.exit(1);
}

async function cleanAllArchiveFlags() {
  console.log('\n🧹 CLEAN ALL ARCHIVE FLAGS');
  console.log('===========================');
  console.log(`📍 Tenant: ${TENANT_ID}`);
  console.log(`🔍 Modalità: ${isDryRun ? 'DRY RUN (nessuna modifica)' : 'LIVE (modifiche effettive)'}`);
  console.log('');

  try {
    // 1. Recupera TUTTI i clienti del tenant
    const clientsRef = db.collection(`tenants/${TENANT_ID}/clients`);
    const allClientsSnapshot = await clientsRef.get();

    console.log(`📊 Totale clienti nel tenant: ${allClientsSnapshot.size}\n`);

    // 2. Trova clienti con flag di archiviazione (solo isArchived, NON isOldClient)
    const clientsToClean = [];
    
    allClientsSnapshot.forEach(doc => {
      const data = doc.data();
      const flags = [];
      
      // Solo isArchived è considerato "archiviazione"
      // isOldClient significa "cliente storico" ed è un dato valido
      if (data.isArchived === true) flags.push('isArchived');
      
      if (flags.length > 0) {
        clientsToClean.push({
          id: doc.id,
          ref: doc.ref,
          name: data.name || 'N/D',
          email: data.email || 'N/D',
          flags: flags,
          scadenza: data.scadenza?.toDate?.()?.toLocaleDateString('it-IT') || 'N/D'
        });
      }
    });

    console.log(`🔴 Trovati ${clientsToClean.length} clienti con flag di archiviazione\n`);

    if (clientsToClean.length === 0) {
      console.log('✅ Nessun cliente da pulire!');
      process.exit(0);
    }

    // 3. Mostra elenco
    console.log('📋 Clienti con flag di archiviazione:');
    console.log('─'.repeat(80));
    
    for (const client of clientsToClean) {
      console.log(`  • ${client.name}`);
      console.log(`    Email: ${client.email}`);
      console.log(`    Scadenza: ${client.scadenza}`);
      console.log(`    Flag attivi: ${client.flags.join(', ')}`);
      console.log('');
    }

    console.log('─'.repeat(80));

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN - Nessuna modifica effettuata');
      console.log('    Rimuovi --dry-run per eseguire lo script realmente');
      process.exit(0);
    }

    // 4. Chiedi conferma
    console.log('\n⚠️  ATTENZIONE: Stai per RIMUOVERE tutti i flag di archiviazione!');
    console.log('    I clienti elencati torneranno visibili come clienti normali.');
    console.log('    Premi CTRL+C entro 5 secondi per annullare...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Pulisci i flag
    console.log('🔄 Pulizia flag in corso...\n');
    
    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const client of clientsToClean) {
      const updateData = {
        // Rimuovi solo il flag di archiviazione (NON isOldClient!)
        isArchived: false,
        // Rimuovi i metadati di archiviazione
        archivedAt: admin.firestore.FieldValue.delete(),
        archivedBy: admin.firestore.FieldValue.delete(),
        archivedReason: admin.firestore.FieldValue.delete(),
        archiveSettings: admin.firestore.FieldValue.delete(),
        // Aggiungi timestamp di pulizia
        archiveFlagsCleanedAt: admin.firestore.FieldValue.serverTimestamp(),
        archiveFlagsCleanedBy: 'script-clean-all-archive-flags'
      };
      
      batch.update(client.ref, updateData);
      count++;
      batchCount++;
      
      // Firestore batch limit è 500
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  ✓ Processati ${count} clienti...`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit finale se ci sono operazioni pendenti
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`\n✅ COMPLETATO! ${count} clienti puliti dai flag di archiviazione.`);
    
    // 6. Riepilogo
    console.log('\n' + '═'.repeat(80));
    console.log('📋 RIEPILOGO:');
    console.log(`   • ${count} clienti processati`);
    console.log('   • Flag rimossi: isArchived');
    console.log('   • I clienti sono ora visibili normalmente nella lista');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Esegui
cleanAllArchiveFlags();
