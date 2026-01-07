/**
 * Script per creare un tenant di test completo con admin, cliente, collaboratore e coach
 *
 * Crea un tenant "test-tenant" con:
 * - Admin: test-admin@fitflowsapp.com
 * - Cliente: test-client@fitflowsapp.com
 * - Collaboratore: test-collaboratore@fitflowsapp.com
 * - Coach: test-coach@fitflowsapp.com
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Inizializza Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Configurazione tenant di test
const TEST_TENANT = {
  id: 'test-tenant',
  name: 'Tenant di Test',
  description: 'Tenant creato per testing completo dell\'app'
};

// Configurazione utenti di test
const TEST_USERS = {
  admin: {
    email: 'test-admin@fitflowsapp.com',
    password: 'TestAdmin2026!',
    displayName: 'Test Admin',
    role: 'admin'
  },
  client: {
    email: 'test-client@fitflowsapp.com',
    password: 'TestClient2026!',
    displayName: 'Test Client',
    role: 'client'
  },
  collaboratore: {
    email: 'test-collaboratore@fitflowsapp.com',
    password: 'TestCollab2026!',
    displayName: 'Test Collaboratore',
    role: 'collaboratore'
  },
  coach: {
    email: 'test-coach@fitflowsapp.com',
    password: 'TestCoach2026!',
    displayName: 'Test Coach',
    role: 'coach'
  }
};

async function createUserInAuth(userConfig) {
  console.log(`📧 Creazione utente ${userConfig.displayName} (${userConfig.email})...`);

  try {
    let userRecord = await auth.getUserByEmail(userConfig.email);
    console.log(`⚠️  Utente ${userConfig.email} già esistente, aggiorno...`);

    await auth.updateUser(userRecord.uid, {
      password: userConfig.password,
      displayName: userConfig.displayName,
    });

    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      const userRecord = await auth.createUser({
        email: userConfig.email,
        password: userConfig.password,
        displayName: userConfig.displayName,
      });
      console.log(`✅ Utente ${userConfig.email} creato con UID: ${userRecord.uid}`);
      return userRecord;
    } else {
      throw error;
    }
  }
}

async function setupTenant() {
  console.log('🏢 Creazione tenant di test...\n');

  // Crea documento tenant
  const tenantRef = db.collection('tenants').doc(TEST_TENANT.id);
  await tenantRef.set({
    name: TEST_TENANT.name,
    description: TEST_TENANT.description,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isTestTenant: true
  });

  console.log(`✅ Tenant "${TEST_TENANT.name}" creato con ID: ${TEST_TENANT.id}`);
  return tenantRef;
}

async function setupUserRoles(tenantId, users) {
  console.log('\n👥 Configurazione ruoli utenti nel tenant...\n');

  // Setup admin
  const adminRef = db.collection('tenants').doc(tenantId).collection('roles').doc('admins');
  await adminRef.set({
    uids: [users.admin.uid],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`✅ Admin ${users.admin.displayName} configurato`);

  // Setup coach
  const coachRef = db.collection('tenants').doc(tenantId).collection('roles').doc('coaches');
  await coachRef.set({
    uids: [users.coach.uid],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`✅ Coach ${users.coach.displayName} configurato`);

  // Setup collaboratore
  const collabRef = db.collection('tenants').doc(tenantId).collection('collaboratori').doc(users.collaboratore.uid);
  await collabRef.set({
    name: users.collaboratore.displayName,
    email: users.collaboratore.email,
    role: 'collaboratore',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`✅ Collaboratore ${users.collaboratore.displayName} configurato`);

  // Setup cliente
  const clientRef = db.collection('tenants').doc(tenantId).collection('clients').doc(users.client.uid);
  await clientRef.set({
    name: users.client.displayName,
    email: users.client.email,
    isClient: true,
    assignedCoach: users.coach.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`✅ Cliente ${users.client.displayName} configurato`);
}

async function createTestTenant() {
  console.log('🚀 Creazione tenant di test completo...\n');

  try {
    // 1. Crea tenant
    await setupTenant();

    // 2. Crea tutti gli utenti in Firebase Auth
    const createdUsers = {};
    for (const [key, userConfig] of Object.entries(TEST_USERS)) {
      const userRecord = await createUserInAuth(userConfig);
      createdUsers[key] = {
        ...userConfig,
        uid: userRecord.uid
      };
    }

    // 3. Setup ruoli nel tenant
    await setupUserRoles(TEST_TENANT.id, createdUsers);

    // 4. Salva info utenti globali
    console.log('\n💾 Salvataggio informazioni utenti globali...');
    for (const [key, user] of Object.entries(createdUsers)) {
      const userRef = db.collection('users').doc(user.uid);
      await userRef.set({
        email: user.email,
        displayName: user.displayName,
        tenantId: TEST_TENANT.id,
        role: user.role,
        isTestUser: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log('\n🎉 Tenant di test creato con successo!');
    console.log('\n📋 CREDENZIALI DI ACCESSO:');
    console.log('=====================================');
    Object.values(createdUsers).forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Tenant: ${TEST_TENANT.id}`);
      console.log('');
    });

    console.log('🔗 Puoi ora accedere all\'app con queste credenziali per testare ogni ruolo.');

  } catch (error) {
    console.error('❌ Errore durante la creazione del tenant di test:', error);
    process.exit(1);
  }
}

// Esegui lo script
createTestTenant();