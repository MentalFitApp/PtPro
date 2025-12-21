#!/usr/bin/env node
/**
 * Script per impostare una password temporanea per un utente
 * 
 * Usage:
 *   node scripts/set-temp-password.cjs <email> [password]
 * 
 * Se non viene specificata una password, ne viene generata una casuale
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin con il service account
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function setTempPassword(email, password) {
  try {
    // Trova l'utente per email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`\n✅ Utente trovato:`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Display Name: ${userRecord.displayName || 'N/A'}`);
    console.log(`   Ultimo accesso: ${userRecord.metadata.lastSignInTime || 'Mai'}`);
    
    // Genera password se non specificata
    const tempPassword = password || generatePassword();
    
    // Imposta la nuova password
    await admin.auth().updateUser(userRecord.uid, {
      password: tempPassword
    });
    
    console.log(`\n🔐 Password temporanea impostata con successo!`);
    console.log(`\n   Email: ${email}`);
    console.log(`   Password: ${tempPassword}`);
    console.log(`\n⚠️  IMPORTANTE: Cambia la password dopo aver verificato!`);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`\n❌ Utente con email "${email}" non trovato`);
    } else {
      console.error('\n❌ Errore:', error.message);
    }
    process.exit(1);
  }
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('\nErrore: specifica l\'email dell\'utente');
  console.log('\nUsage:');
  console.log('  node scripts/set-temp-password.cjs <email> [password]');
  console.log('\nEsempio:');
  console.log('  node scripts/set-temp-password.cjs utente@email.com');
  console.log('  node scripts/set-temp-password.cjs utente@email.com MiaPassword123');
  process.exit(1);
}

const email = args[0];
const password = args[1] || null;

setTempPassword(email, password);
