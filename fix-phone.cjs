const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixPhone() {
  const clientsRef = db.collection('tenants').doc('biondo-fitness-coach').collection('clients');
  const snap = await clientsRef.where('email', '==', 'admin12@live.it').get();
  
  if (!snap.empty) {
    const doc = snap.docs[0];
    const oldPhone = doc.data().phone;
    const newPhone = oldPhone.startsWith('+') ? oldPhone : '+39' + oldPhone;
    
    await doc.ref.update({ phone: newPhone });
    
    console.log('✅ Numero aggiornato!');
    console.log('   Vecchio:', oldPhone);
    console.log('   Nuovo:', newPhone);
    console.log('\n📱 Ora puoi testare il reset SMS con email: admin12@live.it');
  } else {
    console.log('❌ Utente non trovato');
  }
  
  process.exit(0);
}

fixPhone().catch(console.error);
