const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDettagli() {
  const tenantId = 'biondo-fitness-coach';
  const now = new Date();
  
  const clientsSnap = await db.collection('tenants').doc(tenantId).collection('clients').get();
  const allenSnap = await db.collection('tenants').doc(tenantId).collection('schede_allenamento').get();
  const alimSnap = await db.collection('tenants').doc(tenantId).collection('schede_alimentazione').get();
  
  console.log('=== DETTAGLIO SCADENZE ===');
  console.log('Data odierna:', now.toLocaleDateString('it-IT'));
  console.log('');
  console.log('Schede allenamento:', allenSnap.size);
  console.log('Schede alimentazione:', alimSnap.size);
  console.log('');
  
  clientsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.isDeleted || data.isArchived) return;
    
    const hasAllen = allenSnap.docs.some(s => s.id === doc.id);
    const hasAlim = alimSnap.docs.some(s => s.id === doc.id);
    
    if (!hasAllen && !hasAlim) return;
    
    const allenScad = data.schedaAllenamento?.scadenza;
    const alimScad = data.schedaAlimentazione?.scadenza;
    
    let allenStatus = '-';
    let alimStatus = '-';
    
    if (hasAllen && allenScad) {
      const scad = allenScad.toDate();
      const giorni = Math.ceil((scad - now) / (1000*60*60*24));
      if (giorni < 0) allenStatus = 'SCADUTA (' + Math.abs(giorni) + 'g fa)';
      else if (giorni <= 7) allenStatus = 'IN SCADENZA (' + giorni + 'g)';
      else allenStatus = 'OK (' + giorni + 'g)';
    } else if (hasAllen) {
      allenStatus = 'NO SCADENZA';
    }
    
    if (hasAlim && alimScad) {
      const scad = alimScad.toDate();
      const giorni = Math.ceil((scad - now) / (1000*60*60*24));
      if (giorni < 0) alimStatus = 'SCADUTA (' + Math.abs(giorni) + 'g fa)';
      else if (giorni <= 7) alimStatus = 'IN SCADENZA (' + giorni + 'g)';
      else alimStatus = 'OK (' + giorni + 'g)';
    } else if (hasAlim) {
      alimStatus = 'NO SCADENZA';
    }
    
    console.log(data.name + ':');
    if (hasAllen) console.log('  Allen: ' + allenStatus);
    if (hasAlim) console.log('  Alim:  ' + alimStatus);
  });
  
  process.exit(0);
}

checkDettagli();
