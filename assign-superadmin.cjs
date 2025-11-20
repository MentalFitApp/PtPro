#!/usr/bin/env node
/**
 * Script per assegnare il ruolo SuperAdmin al primo utente
 * 
 * Usage:
 *   node assign-superadmin.cjs <email>
 * 
 * Esempio:
 *   node assign-superadmin.cjs admin@mentalfit.it
 * 
 * Questo script:
 * 1. Cerca l'utente per email in Firebase Auth
 * 2. Aggiunge il suo UID al documento roles/superadmins
 * 3. Crea il documento se non esiste
 */

const dotenv = require('dotenv');
dotenv.config();

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('\nErrore: specifica l\'email dell\'utente da promuovere');
  console.log('\nUsage:');
  console.log('  node assign-superadmin.cjs <email>');
  console.log('\nEsempio:');
  console.log('  node assign-superadmin.cjs admin@mentalfit.it');
  process.exit(1);
}

const targetEmail = args[0];

// Validate env
const required = ['VITE_API_KEY', 'VITE_AUTH_DOMAIN', 'VITE_PROJECT_ID', 'VITE_STORAGE_BUCKET', 'VITE_MESSAGING_SENDER_ID', 'VITE_APP_ID'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing environment variables:', missing.join(', '));
  process.exit(1);
}

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, arrayUnion } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
  measurementId: process.env.VITE_MEASUREMENT_ID || undefined
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log(`\n=== Assegnazione SuperAdmin ===`);
  console.log(`Target email: ${targetEmail}\n`);

  // Step 1: Login come admin esistente (opzionale, se necessario per le rules)
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    console.log('Autenticazione admin...');
    try {
      await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
      console.log('✓ Autenticato come admin\n');
    } catch (err) {
      console.warn('⚠ Autenticazione fallita, procedo senza auth:', err.message);
    }
  }

  // Step 2: Cerca utente per email (richiede Admin SDK o REST API)
  // Nota: Firebase Client SDK non ha getUserByEmail, serve Admin SDK o workaround
  console.log('ATTENZIONE: Firebase Client SDK non supporta ricerca per email.');
  console.log('Opzioni:');
  console.log('1. Usa Firebase Admin SDK (backend/server)');
  console.log('2. Trova manualmente UID da Firebase Console → Authentication');
  console.log('3. Usa questo script con UID diretto:\n');
  
  const uid = args[1]; // Secondo argomento può essere UID
  if (!uid) {
    console.log('Usage alternativo con UID:');
    console.log(`  node assign-superadmin.cjs ${targetEmail} <UID>`);
    console.log('\nPer ottenere UID:');
    console.log('  1. Vai su Firebase Console → Authentication');
    console.log('  2. Trova utente con email ' + targetEmail);
    console.log('  3. Copia il suo UID');
    console.log('  4. Esegui: node assign-superadmin.cjs ' + targetEmail + ' <UID>\n');
    process.exit(0);
  }

  console.log(`Promuovo UID: ${uid} a SuperAdmin...\n`);

  // Step 3: Aggiungi al documento roles/superadmins
  try {
    const superadminRef = doc(db, 'roles', 'superadmins');
    const superadminDoc = await getDoc(superadminRef);

    if (!superadminDoc.exists()) {
      console.log('Documento roles/superadmins non esiste, lo creo...');
      await setDoc(superadminRef, {
        uids: [uid],
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid || 'script'
      });
      console.log('✓ Documento creato e UID aggiunto');
    } else {
      const existingUids = superadminDoc.data().uids || [];
      if (existingUids.includes(uid)) {
        console.log('⚠ UID già presente come superadmin');
      } else {
        await setDoc(superadminRef, {
          uids: arrayUnion(uid),
          updatedAt: new Date(),
          updatedBy: auth.currentUser?.uid || 'script'
        }, { merge: true });
        console.log('✓ UID aggiunto a superadmins');
      }
    }

    console.log('\n=== Completato ===');
    console.log(`Email: ${targetEmail}`);
    console.log(`UID: ${uid}`);
    console.log('Ruolo: SuperAdmin');
    console.log('\nL\'utente ora ha accesso completo a tutta l\'app.\n');
  } catch (error) {
    console.error('Errore:', error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});
