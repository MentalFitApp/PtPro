// Script rapido per aggiungere ruolo CEO
// Esegui con: node add-ceo-role-quick.cjs

const admin = require('firebase-admin');

// Inizializza Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// UID dell'utente che ha provato ad accedere
const uid = 'FMj9GlrcUmUGpGUODaQe6dHaXcL2';

async function addCEORole() {
  try {
    console.log('\n🔧 Aggiunta ruolo CEO...\n');
    
    // Leggi documento utente
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log('❌ Utente non trovato');
      process.exit(1);
    }
    
    const userData = userDoc.data();
    const currentRoles = userData.roles || [];
    
    console.log(`👤 Utente: ${userData.displayName || userData.email}`);
    console.log(`📋 Ruoli attuali: ${currentRoles.join(', ') || 'Nessuno'}`);
    
    // Aggiungi CEO se non presente
    if (currentRoles.includes('ceo')) {
      console.log('\n✅ Ha già il ruolo CEO!');
    } else {
      await userRef.update({
        roles: admin.firestore.FieldValue.arrayUnion('ceo')
      });
      console.log('\n✅ Ruolo CEO aggiunto!');
    }
    
    // Verifica
    const updatedDoc = await userRef.get();
    const updatedRoles = updatedDoc.data().roles;
    console.log(`\n📋 Ruoli finali: ${updatedRoles.join(', ')}`);
    console.log('\n✨ Ora puoi accedere a /ceo-login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

addCEORole();
