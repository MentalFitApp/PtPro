const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const TENANT_ID = 'biondo-fitness-coach';

async function migrateRoles() {
  console.log('🔐 Migrazione roles nel tenant...\n');
  
  try {
    // Leggi roles dalla root
    const rolesSnapshot = await db.collection('roles').get();
    
    console.log(`📋 Trovati ${rolesSnapshot.size} documenti in roles/`);
    
    for (const roleDoc of rolesSnapshot.docs) {
      const roleData = roleDoc.data();
      const roleId = roleDoc.id;
      
      console.log(`\n  📝 ${roleId}:`);
      console.log(`     UIDs: ${roleData.uids?.length || 0}`);
      
      // Copia nel tenant
      const tenantRoleRef = db.collection('tenants')
        .doc(TENANT_ID)
        .collection('roles')
        .doc(roleId);
      
      await tenantRoleRef.set(roleData);
      console.log(`     ✅ Copiato in tenants/${TENANT_ID}/roles/${roleId}`);
    }
    
    console.log('\n✅ Migrazione roles completata!');
    console.log('\n📝 Ora aggiorna il frontend per leggere da getTenantCollection(db, "roles")');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
  
  process.exit(0);
}

migrateRoles();
