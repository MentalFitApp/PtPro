const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTenantDocument() {
  console.log('📝 Creazione documento tenant metadata...\n');
  
  const TENANT_ID = 'biondo-fitness-coach';
  
  const tenantData = {
    id: TENANT_ID,
    name: 'Biondo Fitness Coach',
    displayName: 'Biondo Personal Trainer',
    status: 'active',
    subscription: {
      plan: 'premium',
      status: 'active',
      startDate: admin.firestore.Timestamp.now(),
      billingCycle: 'monthly',
      price: 79.99
    },
    owner: {
      name: 'Marco Biondo',
      email: 'info@biondofitness.com'
    },
    settings: {
      timezone: 'Europe/Rome',
      locale: 'it-IT',
      currency: 'EUR'
    },
    features: {
      community: true,
      courses: true,
      calendar: true,
      chat: true,
      analytics: true
    },
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  };
  
  try {
    await db.collection('tenants').doc(TENANT_ID).set(tenantData);
    console.log('✅ Documento tenant creato con successo!');
    console.log('\n📋 Dati tenant:');
    console.log(JSON.stringify(tenantData, null, 2));
  } catch (error) {
    console.error('❌ Errore:', error);
  }
  
  process.exit(0);
}

createTenantDocument();
