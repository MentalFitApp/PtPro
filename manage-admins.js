// Script per gestire admin in sicurezza
// Esegui con: node manage-admins.js <azione> <uid> [email]
// Azioni disponibili: add, remove, list

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCTkH-FVE5MLNaZ8lNGiM87JpxnHfwKDgM",
  authDomain: "ptmanager-98b18.firebaseapp.com",
  projectId: "ptmanager-98b18",
  storageBucket: "ptmanager-98b18.firebasestorage.app",
  messagingSenderId: "536779976813",
  appId: "1:536779976813:web:5f7d66d39e7e9fcdd0b999"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const [,, action, uid, email] = process.argv;

async function listAdmins() {
  try {
    const adminDocRef = doc(db, 'roles', 'admins');
    const adminDoc = await getDoc(adminDocRef);
    
    if (!adminDoc.exists()) {
      console.log('⚠️  Documento roles/admins non esiste');
      return;
    }
    
    const uids = adminDoc.data().uids || [];
    console.log(`\n📋 Admin totali: ${uids.length}\n`);
    uids.forEach((uid, i) => {
      console.log(`${i + 1}. ${uid}`);
    });
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

async function addAdmin(uid) {
  if (!uid) {
    console.error('❌ UID richiesto. Uso: node manage-admins.js add <uid>');
    process.exit(1);
  }
  
  try {
    const adminDocRef = doc(db, 'roles', 'admins');
    const adminDoc = await getDoc(adminDocRef);
    
    if (!adminDoc.exists()) {
      console.error('❌ Documento roles/admins non esiste. Crealo manualmente su Firebase Console prima.');
      process.exit(1);
    }
    
    const uids = adminDoc.data().uids || [];
    
    if (uids.includes(uid)) {
      console.log('✅ UID già presente negli admin');
      return;
    }
    
    // USA arrayUnion per aggiungere in sicurezza senza sovrascrivere
    await updateDoc(adminDocRef, {
      uids: arrayUnion(uid)
    });
    
    console.log(`✅ Admin aggiunto: ${uid}`);
    await listAdmins();
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

async function removeAdmin(uid) {
  if (!uid) {
    console.error('❌ UID richiesto. Uso: node manage-admins.js remove <uid>');
    process.exit(1);
  }
  
  try {
    const adminDocRef = doc(db, 'roles', 'admins');
    const adminDoc = await getDoc(adminDocRef);
    
    if (!adminDoc.exists()) {
      console.error('❌ Documento roles/admins non esiste');
      process.exit(1);
    }
    
    const uids = adminDoc.data().uids || [];
    
    if (!uids.includes(uid)) {
      console.log('⚠️  UID non trovato negli admin');
      return;
    }
    
    if (uids.length === 1) {
      console.error('❌ Impossibile rimuovere l\'ultimo admin');
      process.exit(1);
    }
    
    // USA arrayRemove per rimuovere in sicurezza
    await updateDoc(adminDocRef, {
      uids: arrayRemove(uid)
    });
    
    console.log(`✅ Admin rimosso: ${uid}`);
    await listAdmins();
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

async function main() {
  if (!action) {
    console.log(`
📖 Uso:
  node manage-admins.js list
  node manage-admins.js add <uid>
  node manage-admins.js remove <uid>

Esempi:
  node manage-admins.js list
  node manage-admins.js add AeZKjJYu5zMZ4mvffaGiqCBb0cF2
  node manage-admins.js remove AeZKjJYu5zMZ4mvffaGiqCBb0cF2
    `);
    process.exit(0);
  }
  
  switch (action) {
    case 'list':
      await listAdmins();
      break;
    case 'add':
      await addAdmin(uid);
      break;
    case 'remove':
      await removeAdmin(uid);
      break;
    default:
      console.error(`❌ Azione sconosciuta: ${action}`);
      console.log('Azioni disponibili: list, add, remove');
      process.exit(1);
  }
  
  process.exit(0);
}

main();
