// scripts/update-anamnesi-age-gender.cjs
// Script per identificare le anamnesi esistenti che mancano del campo sesso
// I clienti vedranno un banner per completare l'anamnesi

const admin = require('firebase-admin');

// Inizializza Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAnamnesiMissingGender() {
  console.log('🔍 Cercando anamnesi senza sesso specificato...\n');
  
  // Ottieni tutti i tenant
  const tenantsSnap = await db.collection('tenants').get();
  
  let totalAnamnesi = 0;
  let missingGender = 0;
  const clientsNeedingUpdate = [];
  
  for (const tenantDoc of tenantsSnap.docs) {
    const tenantId = tenantDoc.id;
    console.log(`\n📁 Tenant: ${tenantId}`);
    
    // Ottieni tutti i clienti del tenant
    const clientsSnap = await db.collection(`tenants/${tenantId}/clients`).get();
    
    for (const clientDoc of clientsSnap.docs) {
      const clientId = clientDoc.id;
      const clientData = clientDoc.data();
      const clientName = clientData.name || clientData.displayName || clientId;
      
      // Controlla se ha un'anamnesi
      const anamnesiRef = db.doc(`tenants/${tenantId}/clients/${clientId}/anamnesi/initial`);
      const anamnesiSnap = await anamnesiRef.get();
      
      if (anamnesiSnap.exists) {
        totalAnamnesi++;
        const anamnesiData = anamnesiSnap.data();
        
        // Verifica se manca il sesso
        const hasGender = anamnesiData.gender && (anamnesiData.gender === 'male' || anamnesiData.gender === 'female');
        
        if (!hasGender) {
          missingGender++;
          clientsNeedingUpdate.push({
            tenant: tenantId,
            clientId,
            clientName,
            hasBirthDate: !!anamnesiData.birthDate
          });
          console.log(`  ⚠️  ${clientName} - manca sesso`);
        } else {
          console.log(`  ✓ ${clientName} - completa (sesso: ${anamnesiData.gender})`);
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RIEPILOGO');
  console.log('='.repeat(50));
  console.log(`Anamnesi totali trovate: ${totalAnamnesi}`);
  console.log(`Anamnesi senza sesso: ${missingGender}`);
  
  if (clientsNeedingUpdate.length > 0) {
    console.log('\n📝 Clienti che vedranno il banner:');
    clientsNeedingUpdate.forEach(c => {
      console.log(`   - ${c.clientName} (${c.tenant})`);
    });
    console.log('\nI clienti vedranno automaticamente un banner per completare l\'anamnesi.');
  } else {
    console.log('\n✅ Tutte le anamnesi hanno il sesso specificato!');
  }
}

// Esegui
checkAnamnesiMissingGender()
  .then(() => {
    console.log('\n✅ Script completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Errore:', error);
    process.exit(1);
  });
