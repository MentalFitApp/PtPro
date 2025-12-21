#!/usr/bin/env node
/**
 * Script per verificare lo stato di un utente e i suoi provider collegati
 * 
 * Usage:
 *   node scripts/check-user-linking.cjs <email>
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

async function checkUser(email) {
  try {
    // 1. Trova l'utente in Firebase Auth
    console.log('\n🔍 Cercando utente:', email);
    const userRecord = await admin.auth().getUserByEmail(email);
    
    console.log('\n✅ UTENTE AUTH TROVATO:');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Email Verified: ${userRecord.emailVerified}`);
    console.log(`   Display Name: ${userRecord.displayName || 'N/A'}`);
    console.log(`   Ultimo accesso: ${userRecord.metadata.lastSignInTime || 'Mai'}`);
    console.log(`   Creato: ${userRecord.metadata.creationTime}`);
    
    // 2. Lista provider collegati
    console.log('\n📱 PROVIDER COLLEGATI:');
    if (userRecord.providerData && userRecord.providerData.length > 0) {
      userRecord.providerData.forEach((provider, idx) => {
        console.log(`   ${idx + 1}. ${provider.providerId}`);
        console.log(`      Email: ${provider.email || 'N/A'}`);
        console.log(`      UID provider: ${provider.uid}`);
        console.log(`      Display Name: ${provider.displayName || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️ Nessun provider (strano!)');
    }
    
    // 3. Cerca in user_tenants
    console.log('\n📂 USER_TENANTS:');
    const userTenantDoc = await db.collection('user_tenants').doc(userRecord.uid).get();
    if (userTenantDoc.exists) {
      const data = userTenantDoc.data();
      console.log(`   Documento trovato:`);
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !value.toDate) {
          console.log(`   - ${key}: ${JSON.stringify(value)}`);
        } else if (value && value.toDate) {
          console.log(`   - ${key}: ${value.toDate().toISOString()}`);
        } else {
          console.log(`   - ${key}: ${value}`);
        }
      });
    } else {
      console.log(`   ⚠️ Documento user_tenants NON TROVATO per UID: ${userRecord.uid}`);
    }
    
    // 4. Cerca in tutti i tenant come client
    console.log('\n🏢 RICERCA IN TUTTI I TENANT:');
    const tenantsSnapshot = await db.collection('tenants').get();
    
    let foundInTenants = [];
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      
      // Cerca come client
      const clientDoc = await db.collection('tenants').doc(tenantId).collection('clients').doc(userRecord.uid).get();
      if (clientDoc.exists) {
        const clientData = clientDoc.data();
        foundInTenants.push({
          tenantId,
          role: 'client',
          name: clientData.name,
          email: clientData.email,
          isClient: clientData.isClient,
          isDeleted: clientData.isDeleted,
          createdAt: clientData.createdAt?.toDate?.()?.toISOString() || 'N/A'
        });
      }
      
      // Cerca come collaboratore
      const collabDoc = await db.collection('tenants').doc(tenantId).collection('collaboratori').doc(userRecord.uid).get();
      if (collabDoc.exists) {
        const collabData = collabDoc.data();
        foundInTenants.push({
          tenantId,
          role: 'collaboratore',
          name: collabData.name,
          email: collabData.email
        });
      }
      
      // Cerca negli admin/coach
      const adminsDoc = await db.collection('tenants').doc(tenantId).collection('roles').doc('admins').get();
      if (adminsDoc.exists && adminsDoc.data().uids?.includes(userRecord.uid)) {
        foundInTenants.push({
          tenantId,
          role: 'admin'
        });
      }
      
      const coachesDoc = await db.collection('tenants').doc(tenantId).collection('roles').doc('coaches').get();
      if (coachesDoc.exists && coachesDoc.data().uids?.includes(userRecord.uid)) {
        foundInTenants.push({
          tenantId,
          role: 'coach'
        });
      }
    }
    
    if (foundInTenants.length > 0) {
      console.log(`   Trovato in ${foundInTenants.length} posizione/i:`);
      foundInTenants.forEach((item, idx) => {
        console.log(`   ${idx + 1}. Tenant: ${item.tenantId}`);
        console.log(`      Ruolo: ${item.role}`);
        if (item.name) console.log(`      Nome: ${item.name}`);
        if (item.email) console.log(`      Email doc: ${item.email}`);
        if (item.isClient !== undefined) console.log(`      isClient: ${item.isClient}`);
        if (item.isDeleted !== undefined) console.log(`      isDeleted: ${item.isDeleted}`);
        if (item.createdAt) console.log(`      Creato: ${item.createdAt}`);
      });
    } else {
      console.log(`   ⚠️ NON trovato in nessun tenant!`);
    }
    
    // 5. Riepilogo problema
    console.log('\n📋 RIEPILOGO:');
    const hasGoogle = userRecord.providerData.some(p => p.providerId === 'google.com');
    const hasPassword = userRecord.providerData.some(p => p.providerId === 'password');
    const hasUserTenant = userTenantDoc.exists;
    const isClientInTenant = foundInTenants.some(t => t.role === 'client' && t.isClient && !t.isDeleted);
    
    if (hasGoogle && hasPassword) {
      console.log('   ✅ Ha sia email/password che Google collegato');
    } else if (hasGoogle) {
      console.log('   ℹ️ Ha solo Google (potrebbe essere problema se era originariamente email/password)');
    } else if (hasPassword) {
      console.log('   ℹ️ Ha solo email/password');
    }
    
    if (!hasUserTenant) {
      console.log('   ⚠️ PROBLEMA: Manca documento user_tenants!');
      console.log('      Questo potrebbe causare problemi al login.');
    }
    
    if (!isClientInTenant && foundInTenants.length === 0) {
      console.log('   ⚠️ PROBLEMA: Non è registrato come client in nessun tenant!');
    } else if (isClientInTenant) {
      console.log('   ✅ È un client attivo');
    }
    
    // Suggerimento fix
    if (!hasUserTenant && foundInTenants.length > 0) {
      console.log('\n🔧 SOLUZIONE SUGGERITA:');
      console.log('   Creare il documento user_tenants per questo utente.');
      console.log('   Esegui: node scripts/fix-user-tenant.cjs ' + email);
    }
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`\n❌ Utente con email "${email}" non trovato in Firebase Auth`);
    } else {
      console.error('\n❌ Errore:', error.message);
    }
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('\nErrore: specifica l\'email dell\'utente');
  console.log('\nUsage:');
  console.log('  node scripts/check-user-linking.cjs <email>');
  process.exit(1);
}

checkUser(args[0]).then(() => process.exit(0));
