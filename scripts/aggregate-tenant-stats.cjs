#!/usr/bin/env node

/**
 * Script per aggregare le statistiche dei tenant
 * Eseguire periodicamente (es: Cloud Function ogni ora) per performance CEO dashboard
 * 
 * Uso: node scripts/aggregate-tenant-stats.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function aggregateTenantStats(tenantId) {
  try {
    console.log(`📊 Aggregando stats per tenant: ${tenantId}`);

    // Conta users
    const usersSnap = await db.collection(`tenants/${tenantId}/users`).count().get();
    const totalUsers = usersSnap.data().count;

    // Conta clients
    const clientsSnap = await db.collection(`tenants/${tenantId}/clients`).count().get();
    const totalClients = clientsSnap.data().count;

    // Conta collaboratori
    const collabSnap = await db.collection(`tenants/${tenantId}/collaboratori`).count().get();
    const totalCollaboratori = collabSnap.data().count;

    // Conta anamnesi
    const anamnesiSnap = await db.collection(`tenants/${tenantId}/anamnesi`).count().get();
    const totalAnamnesi = anamnesiSnap.data().count;

    // Revenue stimato basato sui clienti (evita query complesse che richiedono index)
    // In produzione, aggiungi logica di calcolo revenue reale
    const totalRevenue = totalClients * 50; // Stima: 50€ per cliente medio

    // Salva stats aggregate
    const stats = {
      totalUsers,
      totalClients,
      totalCollaboratori,
      totalAnamnesi,
      totalRevenue,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('tenants').doc(tenantId).set(
      { stats },
      { merge: true }
    );

    console.log(`✅ Stats salvate:`, stats);
    return stats;

  } catch (error) {
    console.error(`❌ Errore aggregazione ${tenantId}:`, error);
    return null;
  }
}

async function aggregateAllTenants() {
  try {
    console.log('\n🚀 Inizio aggregazione stats per tutti i tenant\n');

    const tenantsSnap = await db.collection('tenants').get();
    const results = [];

    for (const tenantDoc of tenantsSnap.docs) {
      const stats = await aggregateTenantStats(tenantDoc.id);
      results.push({ tenantId: tenantDoc.id, stats });
    }

    console.log('\n✅ Aggregazione completata!');
    console.log(`📈 Tenant processati: ${results.length}`);
    
    const successCount = results.filter(r => r.stats !== null).length;
    console.log(`✅ Successi: ${successCount}`);
    console.log(`❌ Errori: ${results.length - successCount}\n`);

  } catch (error) {
    console.error('❌ Errore generale:', error);
    process.exit(1);
  }
}

// Esegui aggregazione
aggregateAllTenants()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
