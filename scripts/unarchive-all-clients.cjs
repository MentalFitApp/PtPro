/**
 * Script per rimuovere TUTTI i clienti dall'archivio
 * 
 * Uso: node scripts/unarchive-all-clients.cjs
 * 
 * Opzioni:
 *   --dry-run    Mostra solo cosa verrebbe modificato senza salvare
 *   --tenant=ID  Specifica un tenant ID (default: usa CURRENT_TENANT_ID dal .env)
 *   --all        Controlla TUTTI i campi di archiviazione (isArchived, isOldClient, archiviato)
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configurazione
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const checkAll = args.includes('--all');
const tenantArg = args.find(a => a.startsWith('--tenant='));
const TENANT_ID = tenantArg ? tenantArg.split('=')[1] : process.env.VITE_TENANT_ID || 'flowfit';

async function unarchiveAllClients() {
  console.log('\n🔓 UNARCHIVE ALL CLIENTS');
  console.log('========================');
  console.log(`📍 Tenant: ${TENANT_ID}`);
  console.log(`🔍 Modalità: ${isDryRun ? 'DRY RUN (nessuna modifica)' : 'LIVE (modifiche effettive)'}`);
  console.log('');

  try {
    // 1. Trova tutti i clienti archiviati
    const clientsRef = db.collection(`tenants/${TENANT_ID}/clients`);
    const archivedSnapshot = await clientsRef
      .where('isArchived', '==', true)
      .get();

    console.log(`📊 Trovati ${archivedSnapshot.size} clienti archiviati\n`);

    if (archivedSnapshot.empty) {
      console.log('✅ Nessun cliente archiviato da ripristinare!');
      process.exit(0);
    }

    // 2. Mostra elenco clienti archiviati
    console.log('📋 Clienti archiviati:');
    console.log('─'.repeat(80));
    
    const clients = [];
    archivedSnapshot.forEach(doc => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        name: data.name || 'N/D',
        email: data.email || 'N/D',
        archivedAt: data.archivedAt?.toDate?.()?.toLocaleString('it-IT') || 'N/D',
        archivedBy: data.archivedBy || 'N/D',
        archivedReason: data.archivedReason || 'N/D',
        scadenza: data.scadenza?.toDate?.()?.toLocaleDateString('it-IT') || 'N/D'
      });
      
      console.log(`  • ${data.name || doc.id}`);
      console.log(`    Email: ${data.email || 'N/D'}`);
      console.log(`    Scadenza: ${data.scadenza?.toDate?.()?.toLocaleDateString('it-IT') || 'N/D'}`);
      console.log(`    Archiviato il: ${data.archivedAt?.toDate?.()?.toLocaleString('it-IT') || 'N/D'}`);
      console.log(`    Motivo: ${data.archivedReason || 'N/D'}`);
      console.log(`    Da: ${data.archivedBy || 'N/D'}`);
      console.log('');
    });

    console.log('─'.repeat(80));

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN - Nessuna modifica effettuata');
      console.log('    Rimuovi --dry-run per eseguire lo script realmente');
      process.exit(0);
    }

    // 3. Chiedi conferma
    console.log('\n⚠️  ATTENZIONE: Stai per rimuovere dall\'archivio TUTTI i clienti sopra elencati!');
    console.log('    Premi CTRL+C entro 5 secondi per annullare...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Rimuovi dall'archivio
    console.log('🔄 Rimozione dall\'archivio in corso...\n');
    
    const batch = db.batch();
    let count = 0;

    for (const doc of archivedSnapshot.docs) {
      batch.update(doc.ref, {
        isArchived: false,
        archivedAt: admin.firestore.FieldValue.delete(),
        archivedBy: admin.firestore.FieldValue.delete(),
        archivedReason: admin.firestore.FieldValue.delete(),
        archiveSettings: admin.firestore.FieldValue.delete(),
        unarchivedAt: admin.firestore.FieldValue.serverTimestamp(),
        unarchivedBy: 'script-bulk-unarchive'
      });
      count++;
      
      // Firestore batch limit è 500
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`  ✓ Processati ${count} clienti...`);
      }
    }

    // Commit finale
    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`\n✅ COMPLETATO! ${count} clienti rimossi dall'archivio.`);
    
    // 5. Mostra suggerimento per disabilitare archiviazione automatica
    console.log('\n' + '═'.repeat(80));
    console.log('💡 SUGGERIMENTO:');
    console.log('   Se vuoi DISABILITARE l\'archiviazione automatica, vai su:');
    console.log('   Impostazioni → Archiviazione Clienti → Disabilita "Archiviazione automatica"');
    console.log('');
    console.log('   Oppure esegui lo script: node scripts/disable-auto-archive.cjs');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Esegui
unarchiveAllClients();
