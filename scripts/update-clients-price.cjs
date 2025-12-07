const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function updateAllClientsPrices() {
  const clientsSnap = await db.collection('tenants/biondo-fitness-coach/clients').get();
  
  console.log(`Trovati ${clientsSnap.size} clienti\n`);
  
  let updated = 0;
  let skipped = 0;
  let noPayments = 0;
  
  for (const clientDoc of clientsSnap.docs) {
    const clientData = clientDoc.data();
    const clientId = clientDoc.id;
    
    // Se ha già un prezzo, skip
    if (clientData.price) {
      console.log(`⏭️  ${clientData.name || clientData.email}: già ha price=${clientData.price}`);
      skipped++;
      continue;
    }
    
    // Calcola prezzo: prima dalle rate, poi dai pagamenti
    let totalPrice = 0;
    
    // 1. Se rateizzato, somma le rate
    if (clientData.rateizzato && clientData.rate && clientData.rate.length > 0) {
      totalPrice = clientData.rate.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      console.log(`📊 ${clientData.name || clientData.email}: calcolato da rate = €${totalPrice}`);
    } else {
      // 2. Altrimenti somma i pagamenti dalla subcollection
      const paymentsSnap = await db.collection('tenants/biondo-fitness-coach/clients/' + clientId + '/payments').get();
      paymentsSnap.docs.forEach(doc => {
        totalPrice += Number(doc.data().amount || 0);
      });
      
      if (totalPrice > 0) {
        console.log(`💰 ${clientData.name || clientData.email}: calcolato da payments = €${totalPrice}`);
      }
    }
    
    if (totalPrice > 0) {
      await db.collection('tenants/biondo-fitness-coach/clients').doc(clientId).update({
        price: totalPrice
      });
      console.log(`   ✅ Aggiornato!`);
      updated++;
    } else {
      console.log(`⚠️  ${clientData.name || clientData.email}: nessun pagamento trovato`);
      noPayments++;
    }
  }
  
  console.log(`\n=== RIEPILOGO ===`);
  console.log(`Aggiornati: ${updated}`);
  console.log(`Già con prezzo: ${skipped}`);
  console.log(`Senza pagamenti: ${noPayments}`);
}

updateAllClientsPrices().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
