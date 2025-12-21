#!/usr/bin/env node
/**
 * Script per listare tutti gli utenti che hanno collegato Google
 * 
 * Usage:
 *   node scripts/list-google-linked-users.cjs [tenantId]
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

const db = admin.firestore();

async function listGoogleLinkedUsers(tenantId) {
  console.log('\n🔍 Cercando utenti con Google collegato...\n');
  
  const results = [];
  
  // Se specificato un tenant, cerca solo lì
  const tenantsToCheck = tenantId 
    ? [{ id: tenantId }] 
    : (await db.collection('tenants').get()).docs;
  
  for (const tenantDoc of tenantsToCheck) {
    const tid = tenantDoc.id || tenantDoc;
    console.log(`📂 Tenant: ${tid}`);
    
    // Cerca tutti i client in questo tenant
    const clientsSnapshot = await db.collection('tenants').doc(tid).collection('clients').get();
    
    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = clientDoc.data();
      
      // Salta clienti eliminati
      if (clientData.isDeleted) continue;
      
      // Verifica in Firebase Auth se ha Google collegato
      try {
        const userRecord = await admin.auth().getUser(clientDoc.id);
        const hasGoogle = userRecord.providerData.some(p => p.providerId === 'google.com');
        const hasPassword = userRecord.providerData.some(p => p.providerId === 'password');
        
        if (hasGoogle) {
          results.push({
            tenant: tid,
            uid: clientDoc.id,
            name: clientData.name,
            email: clientData.email,
            hasGoogle,
            hasPassword,
            lastLogin: userRecord.metadata.lastSignInTime,
            linkedProviders: userRecord.providerData.map(p => p.providerId).join(', ')
          });
        }
      } catch (authError) {
        // Utente non esiste in Auth, salta
      }
    }
  }
  
  // Stampa risultati
  console.log('\n' + '='.repeat(80));
  console.log(`📊 UTENTI CON GOOGLE COLLEGATO: ${results.length}`);
  console.log('='.repeat(80) + '\n');
  
  if (results.length === 0) {
    console.log('Nessun utente ha collegato Google.');
    return;
  }
  
  results.forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Tenant: ${user.tenant}`);
    console.log(`   Provider: ${user.linkedProviders}`);
    console.log(`   Ultimo login: ${user.lastLogin || 'Mai'}`);
    console.log('');
  });
  
  console.log('\n💡 SUGGERIMENTO:');
  console.log('Se uno di questi utenti ha problemi con l\'upload di foto,');
  console.log('chiedigli di fare logout e login di nuovo per forzare');
  console.log('il refresh del token di autenticazione.\n');
}

// Main
const args = process.argv.slice(2);
const tenantId = args[0] || null;

listGoogleLinkedUsers(tenantId).then(() => process.exit(0));
