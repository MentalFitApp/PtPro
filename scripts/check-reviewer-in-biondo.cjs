/**
 * Script per verificare se reviewer@fitflowsapp.com esiste nel tenant biondo
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkReviewerInTenant() {
  console.log('🔍 Controllo presenza reviewer nel tenant biondo-fitness-coach...\n');
  
  const clientsRef = db.collection('tenants').doc('biondo-fitness-coach').collection('clients');
  const snapshot = await clientsRef.get();
  
  const reviewerClients = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.email && (data.email.includes('reviewer') || data.email.includes('fitflowsapp'))) {
      reviewerClients.push({ id: doc.id, ...data });
    }
  });
  
  console.log(`Trovati ${reviewerClients.length} clienti con email reviewer/fitflowsapp:\n`);
  reviewerClients.forEach(client => {
    console.log(`- ID: ${client.id}`);
    console.log(`  Email: ${client.email}`);
    console.log(`  Nome: ${client.name || 'N/A'}`);
    console.log(`  createdAt: ${client.createdAt?.toDate ? client.createdAt.toDate() : client.createdAt}`);
    console.log(`  isOldClient: ${client.isOldClient || false}`);
    console.log('');
  });
  
  // Controlla anche gli utenti nella root del tenant
  const usersRef = db.collection('tenants').doc('biondo-fitness-coach').collection('users');
  const usersSnapshot = await usersRef.get();
  
  const reviewerUsers = [];
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.email && (data.email.includes('reviewer') || data.email.includes('fitflowsapp'))) {
      reviewerUsers.push({ id: doc.id, ...data });
    }
  });
  
  console.log(`\nTrovati ${reviewerUsers.length} utenti con email reviewer/fitflowsapp:\n`);
  reviewerUsers.forEach(user => {
    console.log(`- ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Nome: ${user.name || 'N/A'}`);
    console.log(`  Role: ${user.role || 'N/A'}`);
    console.log('');
  });
}

checkReviewerInTenant()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Errore:', err);
    process.exit(1);
  });
