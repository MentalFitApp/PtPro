// Script per assegnare il ruolo CEO a un utente
// Esegui con: node assign-ceo-role.cjs

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

async function assignCEORole() {
  console.log('\n=== ASSEGNAZIONE RUOLO CEO ===\n');
  
  rl.question('Inserisci l\'email dell\'utente da promuovere a CEO: ', async (email) => {
    try {
      // Trova l'utente per email
      const userRecord = await admin.auth().getUserByEmail(email);
      const uid = userRecord.uid;
      
      console.log(`\nUtente trovato: ${userRecord.email}`);
      console.log(`UID: ${uid}`);
      
      // Ottieni il documento utente
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.log('❌ Documento utente non trovato in Firestore');
        process.exit(1);
      }
      
      const userData = userDoc.data();
      const currentRoles = userData.roles || [];
      
      console.log(`\nRuoli attuali: ${currentRoles.join(', ') || 'Nessuno'}`);
      
      // Aggiungi ruolo CEO se non presente
      if (currentRoles.includes('ceo')) {
        console.log('✅ L\'utente ha già il ruolo CEO');
      } else {
        await userRef.update({
          roles: [...currentRoles, 'ceo']
        });
        console.log('✅ Ruolo CEO aggiunto con successo!');
      }
      
      // Mostra info aggiornate
      const updatedDoc = await userRef.get();
      const updatedData = updatedDoc.data();
      console.log(`\nRuoli aggiornati: ${updatedData.roles.join(', ')}`);
      
      console.log('\n✨ Operazione completata!');
      console.log(`\nL\'utente può ora accedere al CEO Dashboard tramite:`);
      console.log(`https://tuodominio.com/ceo-login`);
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Errore:', error.message);
      process.exit(1);
    }
  });
}

assignCEORole();
