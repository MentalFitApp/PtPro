const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const tenantId = 'biondo-fitness-coach';

async function debug() {
  console.log('=== DEBUG RINNOVI COMPLETO ===\n');
  
  const clientsSnap = await db.collection('tenants').doc(tenantId).collection('clients').get();
  
  let clientsWithMultiplePayments = [];
  let clientsWithRates = [];
  let paymentsWithRenewalFlag = [];
  let ratesWithRenewalFlag = [];
  let totalPayments = 0;
  let totalRates = 0;
  
  for (const c of clientsSnap.docs) {
    const client = c.data();
    const paymentsSnap = await db.collection('tenants').doc(tenantId).collection('clients').doc(c.id).collection('payments').get();
    const ratesSnap = await db.collection('tenants').doc(tenantId).collection('clients').doc(c.id).collection('rates').get();
    
    totalPayments += paymentsSnap.size;
    totalRates += ratesSnap.size;
    
    if (paymentsSnap.size > 1) {
      clientsWithMultiplePayments.push({ name: client.name, count: paymentsSnap.size });
    }
    
    paymentsSnap.docs.forEach(p => {
      const data = p.data();
      if (data.isRenewal === true) {
        paymentsWithRenewalFlag.push({ 
          client: client.name, 
          amount: data.amount, 
          date: data.paymentDate?.toDate?.() || data.paymentDate 
        });
      }
    });
    
    if (ratesSnap.size > 0) {
      clientsWithRates.push({ name: client.name, count: ratesSnap.size });
      ratesSnap.docs.forEach(r => {
        const data = r.data();
        if (data.isRenewal === true) {
          ratesWithRenewalFlag.push({ 
            client: client.name, 
            amount: data.amount, 
            paid: data.paid,
            paidDate: data.paidDate?.toDate?.() || data.paidDate 
          });
        }
      });
    }
  }
  
  console.log('Totale clienti:', clientsSnap.size);
  console.log('Totale payments in subcollection:', totalPayments);
  console.log('Totale rates in subcollection:', totalRates);
  console.log('');
  console.log('Clienti con >1 payment:', JSON.stringify(clientsWithMultiplePayments, null, 2));
  console.log('');
  console.log('Clienti con rates subcollection:', JSON.stringify(clientsWithRates, null, 2));
  console.log('');
  console.log('Payments con isRenewal=true:', JSON.stringify(paymentsWithRenewalFlag, null, 2));
  console.log('');
  console.log('Rates con isRenewal=true:', JSON.stringify(ratesWithRenewalFlag, null, 2));
}

debug().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
