const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function analyze() {
  console.log('\n�� ANALISI STRUTTURA DATABASE\n');
  console.log('='.repeat(60));
  
  const tenantsSnap = await db.collection('tenants').get();
  
  for (const tenant of tenantsSnap.docs) {
    const tenantId = tenant.id;
    console.log(`\n🏢 TENANT: ${tenantId}`);
    console.log('-'.repeat(40));
    
    // Conta users
    const usersSnap = await db.collection(`tenants/${tenantId}/users`).get();
    console.log(`   📁 /users: ${usersSnap.size} documenti`);
    
    // Analizza ruoli in users
    const roleCount = {};
    usersSnap.forEach(doc => {
      const role = doc.data().role || 'no-role';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`      - ${role}: ${count}`);
    });
    
    // Conta clients
    const clientsSnap = await db.collection(`tenants/${tenantId}/clients`).get();
    console.log(`   📁 /clients: ${clientsSnap.size} documenti`);
    
    // Verifica sovrapposizione - utenti che sono sia in users che in clients
    const usersIds = new Set(usersSnap.docs.map(d => d.id));
    const clientsIds = new Set(clientsSnap.docs.map(d => d.id));
    const overlap = [...usersIds].filter(id => clientsIds.has(id));
    console.log(`   🔄 Sovrapposizione (in entrambi): ${overlap.length}`);
    
    // Clients che NON sono in users
    const clientsOnly = [...clientsIds].filter(id => !usersIds.has(id));
    console.log(`   👤 Solo in clients (non in users): ${clientsOnly.length}`);
  }
  
  // Root collections
  console.log('\n📁 ROOT COLLECTIONS:');
  console.log('-'.repeat(40));
  
  const rootUsers = await db.collection('users').get();
  console.log(`   /users: ${rootUsers.size} documenti`);
  
  console.log('\n📝 COME FUNZIONA:');
  console.log('='.repeat(60));
  console.log(`
1. CLIENTS (tenants/{tenantId}/clients/{uid})
   - Contiene TUTTI i clienti del PT
   - Ha dati anagrafici, piani, scadenze, schede
   - È la collezione principale per i dati business

2. USERS (tenants/{tenantId}/users/{uid})
   - Contiene utenti con RUOLI (admin, trainer, client)
   - Usato per autenticazione e permessi
   - NON tutti i clients sono qui!

3. Il PROBLEMA:
   - Un client può essere in /clients ma NON in /users
   - La Cloud Function cercava SOLO in /users
   - Ora cerca in entrambi ✅
`);
}

analyze().then(() => process.exit(0));
