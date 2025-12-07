const admin = require('firebase-admin');
const sa = require('../service-account.json');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const snap = await db.collection('tenants/biondo-fitness-coach/clients').get();
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.name && d.name.includes('Marco')) {
      console.log('Nome:', d.name);
      console.log('ID:', doc.id);
      console.log('isOldClient:', d.isOldClient);
      console.log('rateizzato:', d.rateizzato);
    }
  }
  process.exit(0);
})();
