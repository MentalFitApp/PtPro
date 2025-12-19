/**
 * Script per fixare i pagamenti mancanti dei clienti creati via invito
 * 
 * Uso: node scripts/fix-invite-payments.cjs [--dry-run]
 * 
 * --dry-run: mostra cosa farebbe senza applicare modifiche
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const DRY_RUN = process.argv.includes('--dry-run');

async function fixInvitePayments() {
  console.log('🔧 Fix Pagamenti Clienti Invito');
  console.log('================================');
  if (DRY_RUN) {
    console.log('⚠️  MODALITÀ DRY-RUN: nessuna modifica verrà applicata\n');
  }

  try {
    // Trova tutti i tenant
    const tenantsSnap = await db.collection('tenants').get();
    console.log(`📊 Trovati ${tenantsSnap.size} tenant\n`);

    let totalFixed = 0;
    let totalSkipped = 0;
    let totalRatesFixed = 0;

    for (const tenantDoc of tenantsSnap.docs) {
      const tenantId = tenantDoc.id;
      const tenantName = tenantDoc.data().name || tenantId;
      
      // Trova clienti creati via invito
      const clientsSnap = await db.collection(`tenants/${tenantId}/clients`)
        .where('registeredViaInvite', '==', true)
        .get();

      if (clientsSnap.empty) continue;

      console.log(`\n🏢 Tenant: ${tenantName} (${clientsSnap.size} clienti via invito)`);

      for (const clientDoc of clientsSnap.docs) {
        const clientId = clientDoc.id;
        const clientData = clientDoc.data();
        const clientName = clientData.name || 'N/D';

        // Controlla se ha già pagamenti nella subcollection
        const paymentsSnap = await db.collection(`tenants/${tenantId}/clients/${clientId}/payments`).limit(1).get();
        const ratesSnap = await db.collection(`tenants/${tenantId}/clients/${clientId}/rates`).limit(1).get();
        
        const hasPayments = !paymentsSnap.empty;
        const hasRates = !ratesSnap.empty;

        // Se è rateizzato e non ha rate nella subcollection
        if (clientData.rateizzato && clientData.rate && clientData.rate.length > 0 && !hasRates) {
          console.log(`  📋 ${clientName}: ${clientData.rate.length} rate da creare`);
          
          if (!DRY_RUN) {
            for (const rate of clientData.rate) {
              const rateRef = db.collection(`tenants/${tenantId}/clients/${clientId}/rates`).doc();
              await rateRef.set({
                amount: parseFloat(rate.amount) || 0,
                dueDate: rate.dueDate ? new Date(rate.dueDate) : null,
                paid: rate.paid || false,
                paidDate: rate.paidDate ? new Date(rate.paidDate) : null,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isRenewal: false,
                source: 'fix-script'
              });
            }
            console.log(`     ✅ ${clientData.rate.length} rate create`);
          }
          totalRatesFixed += clientData.rate.length;
        }
        // Se ha un price ma non ha pagamenti e non è rateizzato
        else if (clientData.price && parseFloat(clientData.price) > 0 && !hasPayments && !clientData.rateizzato) {
          console.log(`  💳 ${clientName}: €${clientData.price} (${clientData.paymentMethod || 'N/D'})`);
          
          if (!DRY_RUN) {
            const paymentRef = db.collection(`tenants/${tenantId}/clients/${clientId}/payments`).doc();
            await paymentRef.set({
              amount: parseFloat(clientData.price),
              duration: clientData.duration ? `${clientData.duration} mesi` : null,
              paymentDate: clientData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
              paymentMethod: clientData.paymentMethod || null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              isRenewal: false,
              source: 'fix-script'
            });
            console.log(`     ✅ Pagamento creato`);
          }
          totalFixed++;
        } else if (hasPayments || hasRates) {
          // Già ha pagamenti/rate
          totalSkipped++;
        } else if (!clientData.price || parseFloat(clientData.price) === 0) {
          // Non ha importo
          console.log(`  ⏭️  ${clientName}: nessun importo definito`);
          totalSkipped++;
        }
      }
    }

    console.log('\n================================');
    console.log('📊 RIEPILOGO:');
    console.log(`   - Pagamenti ${DRY_RUN ? 'da creare' : 'creati'}: ${totalFixed}`);
    console.log(`   - Rate ${DRY_RUN ? 'da creare' : 'create'}: ${totalRatesFixed}`);
    console.log(`   - Saltati (già presenti o senza importo): ${totalSkipped}`);
    
    if (DRY_RUN && (totalFixed > 0 || totalRatesFixed > 0)) {
      console.log('\n💡 Esegui senza --dry-run per applicare le modifiche');
    }

  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixInvitePayments();
