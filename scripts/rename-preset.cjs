const admin = require('firebase-admin');
const sa = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa), projectId: 'biondo-fitness-coach' });
}

const db = admin.firestore();

db.collection('tenants').doc('biondo-fitness-coach')
  .collection('form_popup_presets').doc('protocollo_maglietta_piena')
  .update({ name: 'Dati 1', description: 'Form lead qualificati fitness' })
  .then(() => {
    console.log('✅ Preset rinominato in "Dati 1"');
    process.exit(0);
  });
