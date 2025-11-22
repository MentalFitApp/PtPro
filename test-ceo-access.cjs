// Script di test per verificare accesso CEO
// Esegui con: node test-ceo-access.cjs

const admin = require('firebase-admin');
const readline = require('readline');

// Inizializza Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testCEOAccess() {
  console.log('\n=== TEST ACCESSO CEO ===\n');
  
  rl.question('Inserisci l\'email dell\'utente da verificare: ', async (email) => {
    try {
      // Trova l'utente per email
      const userRecord = await admin.auth().getUserByEmail(email);
      const uid = userRecord.uid;
      
      console.log(`\n📧 Email: ${userRecord.email}`);
      console.log(`🆔 UID: ${uid}`);
      
      // Ottieni il documento utente
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.log('❌ Documento utente non trovato in Firestore');
        process.exit(1);
      }
      
      const userData = userDoc.data();
      const roles = userData.roles || [];
      
      console.log(`\n👤 Display Name: ${userData.displayName || 'N/A'}`);
      console.log(`📋 Ruoli: ${roles.join(', ') || 'Nessuno'}`);
      
      // Verifica accesso CEO
      const hasCEORole = roles.includes('ceo');
      
      console.log('\n' + '='.repeat(50));
      if (hasCEORole) {
        console.log('✅ ACCESSO CEO: AUTORIZZATO');
        console.log('\nL\'utente può accedere a:');
        console.log('  • /ceo-login (Login CEO)');
        console.log('  • /ceo (CEO Dashboard)');
        console.log('\nDati accessibili:');
        console.log('  • Statistiche utenti');
        console.log('  • Statistiche clienti');
        console.log('  • Pagamenti e fatturato');
        console.log('  • Community posts');
        console.log('  • Checks e anamnesi');
      } else {
        console.log('❌ ACCESSO CEO: NEGATO');
        console.log('\nL\'utente NON ha il ruolo CEO.');
        console.log('\nPer assegnare il ruolo, esegui:');
        console.log('  node assign-ceo-role.cjs');
      }
      console.log('='.repeat(50) + '\n');
      
      // Test aggiuntivi
      if (hasCEORole) {
        console.log('🔍 Test lettura dati...\n');
        
        // Test conteggio users
        const usersSnapshot = await db.collection('users').get();
        console.log(`  ✓ Users: ${usersSnapshot.size} documenti`);
        
        // Test conteggio clients
        const clientsSnapshot = await db.collection('clients').get();
        console.log(`  ✓ Clients: ${clientsSnapshot.size} documenti`);
        
        // Test conteggio posts
        const postsSnapshot = await db.collection('community_posts').get();
        console.log(`  ✓ Community Posts: ${postsSnapshot.size} documenti`);
        
        console.log('\n✨ Tutti i test superati!\n');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Errore:', error.message);
      process.exit(1);
    }
  });
}

testCEOAccess();
