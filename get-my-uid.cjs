// Script veloce per ottenere il tuo UID
// Esegui con: node get-my-uid.cjs

const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const readline = require('readline');

const firebaseConfig = {
  apiKey: "AIzaSyCTkH-FVE5MLNaZ8lNGiM87JpxnHfwKDgM",
  authDomain: "ptmanager-98b18.firebaseapp.com",
  projectId: "ptmanager-98b18",
  storageBucket: "ptmanager-98b18.firebasestorage.app",
  messagingSenderId: "536779976813",
  appId: "1:536779976813:web:5f7d66d39e7e9fcdd0b999"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔑 Per ottenere il tuo UID:');
console.log('\n1. Apri Firebase Console');
console.log('2. Vai su Authentication > Users');
console.log('3. Cerca la tua email e copia lo User UID');
console.log('\nOPPURE\n');
console.log('Apri l\'app, fai login, apri Console (F12) e scrivi:');
console.log('  firebase.auth().currentUser.uid\n');

rl.question('Inserisci il tuo UID: ', (uid) => {
  if (uid && uid.length > 20) {
    console.log('\n✅ UID valido:', uid);
    console.log('\nOra esegui la migrazione con:');
    console.log(`  node migrate-to-multi-tenant.cjs\n`);
  } else {
    console.log('\n❌ UID non valido\n');
  }
  process.exit(0);
});
