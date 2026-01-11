const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const tenantId = 'biondo-fitness-coach';
const userId = 'YDj6eIgOode6mE75pAEAGdw3pOw2';

// Crea 4 check a intervalli settimanali (4, 3, 2, 1 settimane fa)
const checks = [
  { weeksAgo: 4, weight: 60 },
  { weeksAgo: 3, weight: 57.5 },
  { weeksAgo: 2, weight: 55 },
  { weeksAgo: 1, weight: 52.5 }
];

async function createChecks() {
  const checksRef = db.collection('tenants').doc(tenantId).collection('clients').doc(userId).collection('checks');
  
  for (const check of checks) {
    const date = new Date();
    date.setDate(date.getDate() - (check.weeksAgo * 7));
    date.setHours(10, 0, 0, 0);
    
    const checkData = {
      date: admin.firestore.Timestamp.fromDate(date),
      weight: check.weight,
      notes: 'Check di prova #' + (5 - check.weeksAgo),
      photos: {
        front: 'https://placehold.co/400x600/1e293b/64748b?text=Fronte',
        back: 'https://placehold.co/400x600/1e293b/64748b?text=Dietro',
        side: 'https://placehold.co/400x600/1e293b/64748b?text=Lato'
      },
      createdAt: admin.firestore.Timestamp.fromDate(date),
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    const docRef = await checksRef.add(checkData);
    console.log('✅ Check creato:', docRef.id, '- Data:', date.toLocaleDateString('it-IT'), '- Peso:', check.weight + 'kg');
  }
  
  console.log('\n🎉 4 check di prova creati con successo per admin12@live.it!');
  process.exit(0);
}

createChecks().catch(err => {
  console.error('Errore:', err);
  process.exit(1);
});
