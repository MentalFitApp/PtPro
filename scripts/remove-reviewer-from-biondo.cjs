/**
 * Script per rimuovere reviewer@fitflowsapp.com dal tenant biondo-fitness-coach
 * Questo account dovrebbe esistere solo nel tenant google-play-reviewer
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function removeReviewerFromBiondo() {
  console.log('🗑️  Rimozione reviewer dal tenant biondo-fitness-coach...\n');
  
  const tenantId = 'biondo-fitness-coach';
  const reviewerId = 'KWiJeEhf7FhZia8wFfb2b67u2lq2';
  
  try {
    // 1. Rimuovi dalla collezione clients
    const clientRef = db.collection('tenants').doc(tenantId).collection('clients').doc(reviewerId);
    const clientDoc = await clientRef.get();
    
    if (clientDoc.exists) {
      console.log('✅ Trovato nella collezione clients, elimino...');
      await clientRef.delete();
      console.log('   Cliente rimosso.');
    } else {
      console.log('⚠️  Non trovato nella collezione clients.');
    }
    
    // 2. Rimuovi dalla collezione users
    const userRef = db.collection('tenants').doc(tenantId).collection('users').doc(reviewerId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('✅ Trovato nella collezione users, elimino...');
      await userRef.delete();
      console.log('   Utente rimosso.');
    } else {
      console.log('⚠️  Non trovato nella collezione users.');
    }
    
    // 3. Verifica nel documento tenants se c'è admin_uids o superAdminUid
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (tenantDoc.exists) {
      const data = tenantDoc.data();
      let needsUpdate = false;
      const updates = {};
      
      if (data.admin_uids && data.admin_uids.includes(reviewerId)) {
        console.log('✅ Trovato in admin_uids, rimuovo...');
        updates.admin_uids = data.admin_uids.filter(uid => uid !== reviewerId);
        needsUpdate = true;
      }
      
      if (data.superAdminUid === reviewerId) {
        console.log('✅ Trovato come superAdmin, rimuovo...');
        updates.superAdminUid = admin.firestore.FieldValue.delete();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await db.collection('tenants').doc(tenantId).update(updates);
        console.log('   Documento tenant aggiornato.');
      }
    }
    
    console.log('\n✅ Rimozione completata!');
    console.log('\nIl reviewer ora dovrebbe essere visibile solo nel tenant google-play-reviewer.');
    
  } catch (error) {
    console.error('❌ Errore durante la rimozione:', error);
    throw error;
  }
}

removeReviewerFromBiondo()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Errore:', err);
    process.exit(1);
  });
