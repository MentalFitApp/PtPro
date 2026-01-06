#!/usr/bin/env node
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function main() {
  // Cerca tenant biondo-fitness-coach
  const tenantDoc = await db.collection('tenants').doc('biondo-fitness-coach').get();
  console.log('=== TENANT biondo-fitness-coach ===');
  console.log(tenantDoc.exists ? JSON.stringify(tenantDoc.data(), null, 2) : 'Non trovato');
  
  // Cerca landing pages esistenti
  console.log('\n=== LANDING PAGES ESISTENTI ===');
  const landingPagesOld = await db.collection('tenants/biondo-fitness-coach/landingPages').get();
  landingPagesOld.docs.forEach(doc => {
    console.log('OLD:', doc.id, '-', doc.data().title || doc.data().slug);
  });
  
  const landingPagesNew = await db.collection('tenants/biondo-fitness-coach/landing_pages').get();
  landingPagesNew.docs.forEach(doc => {
    console.log('NEW:', doc.id, '-', doc.data().title || doc.data().slug);
  });
  
  // Cerca guida inverno
  const guidaInverno = landingPagesNew.docs.find(d => d.data().slug?.includes('inverno') || d.data().title?.toLowerCase().includes('inverno'));
  if (guidaInverno) {
    console.log('\n=== GUIDA INVERNO ===');
    const data = guidaInverno.data();
    console.log('Title:', data.title);
    console.log('Slug:', data.slug);
    console.log('Blocks count:', data.blocks?.length || 0);
    console.log('Blocks types:', data.blocks?.map(b => b.type).join(', '));
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
