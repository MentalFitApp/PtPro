// scripts/update-anamnesi-age-gender.cjs
// Script per aggiornare le anamnesi esistenti richiedendo età e sesso
// I clienti che hanno già compilato l'anamnesi dovranno aggiungere questi nuovi campi

const admin = require('firebase-admin');

// Inizializza Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateAnamnesiWithAgeGender() {
  console.log('🔍 Cercando anamnesi da aggiornare...\n');
  
  // Ottieni tutti i tenant
  const tenantsSnap = await db.collection('tenants').get();
  
  let totalAnamnesi = 0;
  let needsUpdate = 0;
  let updated = 0;
  
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
        
        // Verifica se manca età o sesso
        const hasAge = anamnesiData.age !== undefined && anamnesiData.age !== null && anamnesiData.age !== '';
        const hasGender = anamnesiData.gender !== undefined && anamnesiData.gender !== null && anamnesiData.gender !== '';
        
        if (!hasAge || !hasGender) {
          needsUpdate++;
          console.log(`  ⚠️  ${clientName} - manca: ${!hasAge ? 'età' : ''} ${!hasGender ? 'sesso' : ''}`);
          
          // Calcola età dalla data di nascita se presente
          let calculatedAge = null;
          if (anamnesiData.birthDate) {
            const birthDate = new Date(anamnesiData.birthDate);
            if (!isNaN(birthDate.getTime())) {
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              calculatedAge = age;
            }
          }
          
          // Prepara update
          const updateData = {
            needsAgeGenderUpdate: true, // Flag per mostrare prompt al cliente
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          // Se abbiamo calcolato l'età, la aggiungiamo
          if (calculatedAge && !hasAge) {
            updateData.age = calculatedAge;
            console.log(`    📊 Età calcolata dalla data di nascita: ${calculatedAge} anni`);
          }
          
          // Aggiorna il documento
          await anamnesiRef.update(updateData);
          updated++;
          console.log(`    ✅ Flaggato per aggiornamento`);
        } else {
          console.log(`  ✓ ${clientName} - completa (età: ${anamnesiData.age}, sesso: ${anamnesiData.gender})`);
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RIEPILOGO');
  console.log('='.repeat(50));
  console.log(`Anamnesi totali trovate: ${totalAnamnesi}`);
  console.log(`Anamnesi che necessitano aggiornamento: ${needsUpdate}`);
  console.log(`Anamnesi flaggate per update: ${updated}`);
  console.log('\nI clienti vedranno un avviso per completare età e sesso al prossimo accesso.');
}

// Esegui
updateAnamnesiWithAgeGender()
  .then(() => {
    console.log('\n✅ Script completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Errore:', error);
    process.exit(1);
  });
