// Script per aggiungere ruolo CEO a un utente
// Esegui con: node add-ceo-to-user.js <uid>

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, arrayUnion } = require('firebase/firestore');

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

const [,, uid] = process.argv;

async function addCEORole(userId) {
  if (!userId) {
    console.error('❌ UID richiesto. Uso: node add-ceo-to-user.js <uid>');
    process.exit(1);
  }
  
  try {
    console.log('\n🔧 Aggiunta ruolo CEO...\n');
    
    // Riferimento al documento utente
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ Utente non trovato con UID:', userId);
      process.exit(1);
    }
    
    const userData = userDoc.data();
    const currentRoles = userData.roles || [];
    
    console.log(`👤 Utente: ${userData.displayName || userData.email || 'N/A'}`);
    console.log(`📧 Email: ${userData.email || 'N/A'}`);
    console.log(`📋 Ruoli attuali: ${currentRoles.join(', ') || 'Nessuno'}`);
    
    // Verifica se ha già il ruolo
    if (currentRoles.includes('ceo')) {
      console.log('\n✅ L\'utente ha già il ruolo CEO!\n');
      process.exit(0);
    }
    
    // Aggiungi ruolo CEO
    await updateDoc(userRef, {
      roles: arrayUnion('ceo')
    });
    
    console.log('\n✅ Ruolo CEO aggiunto con successo!');
    
    // Verifica finale
    const updatedDoc = await getDoc(userRef);
    const updatedRoles = updatedDoc.data().roles;
    console.log(`📋 Ruoli aggiornati: ${updatedRoles.join(', ')}`);
    console.log('\n🎉 Ora puoi accedere al CEO Dashboard su /ceo-login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

addCEORole(uid);
