const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkClient() {
  const clientDoc = await db.doc('tenants/biondo-fitness-coach/clients/9tjgSZ4FrhZYCelZ2rrg9v8rbo73').get();
  const data = clientDoc.data();
  
  console.log('=== FLAGS CLIENT ===');
  console.log('isOldClient:', data.isOldClient);
  console.log('archiviato:', data.archiviato);
  console.log('statoPercorso:', data.statoPercorso);
  console.log('');
  
  // Controlla rate nel documento
  if (data.rate && data.rate.length > 0) {
    console.log('=== RATE NEL DOCUMENTO ===');
    data.rate.forEach((r, i) => {
      console.log(`Rata ${i+1}:`);
      console.log('  Importo:', r.amount);
      console.log('  Scadenza:', r.dueDate);
      console.log('  Pagata:', r.paid);
      console.log('  Data pagamento:', r.paidDate);
    });
  }
  
  process.exit(0);
}

checkClient().catch(e => { console.error(e); process.exit(1); });
