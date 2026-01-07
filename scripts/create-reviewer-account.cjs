/**
 * Script per creare un account ADMIN semplice per i revisori Google Play
 *
 * Crea un tenant esclusivo "google-play-reviewer" e assegna l'account
 * come admin normale in quel tenant. Nessuna selezione ruoli complessa.
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

// Configurazione account reviewer semplice (solo admin)
const REVIEWER_CONFIG = {
  email: 'reviewer@fitflowsapp.com',
  password: 'FitFlows2026!Review',
  displayName: 'Google Play Reviewer',
  // Tenant dedicato per i reviewer
  tenantId: 'google-play-reviewer',
};

async function createReviewerAccount() {
  console.log('🚀 Creazione account DEDICATO per revisori Google Play...\n');

  try {
    // 1. Crea utente in Firebase Auth
    let userRecord;
    
    try {
      // Controlla se esiste già
      userRecord = await auth.getUserByEmail(REVIEWER_CONFIG.email);
      console.log('⚠️  Utente già esistente, aggiorno...');
      
      // Aggiorna
      await auth.updateUser(userRecord.uid, {
        password: REVIEWER_CONFIG.password,
        displayName: REVIEWER_CONFIG.displayName,
      });
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Crea nuovo utente
        userRecord = await auth.createUser({
          email: REVIEWER_CONFIG.email,
          password: REVIEWER_CONFIG.password,
          displayName: REVIEWER_CONFIG.displayName,
          emailVerified: true,
        });
        console.log('✅ Utente creato in Firebase Auth');
      } else {
        throw error;
      }
    }

    const uid = userRecord.uid;
    console.log(`   UID: ${uid}`);

    // 2. Crea tenant dedicato per i reviewer
    console.log(`\n🏗️  Creazione tenant dedicato: ${REVIEWER_CONFIG.tenantId}`);
    
    // Crea documento tenant principale
    await db.collection('tenants').doc(REVIEWER_CONFIG.tenantId).set({
      name: 'Google Play Reviewer Tenant',
      description: 'Tenant dedicato per test e review su Google Play',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isReviewerTenant: true,
      status: 'active',
    }, { merge: true });
    console.log('✅ Tenant dedicato creato');

    // 3. Crea documento utente semplice (solo admin)
    const userData = {
      email: REVIEWER_CONFIG.email,
      displayName: REVIEWER_CONFIG.displayName,
      role: 'admin',
      tenantId: REVIEWER_CONFIG.tenantId,
      tenants: [REVIEWER_CONFIG.tenantId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isReviewerAccount: true,
      onboardingCompleted: true,
    };
    await db.collection('users').doc(uid).set(userData, { merge: true });
    console.log('✅ Documento utente creato (ruolo: admin)');

    // 4. Aggiungi agli ADMINS del tenant
    const adminsRef = db.collection('tenants').doc(REVIEWER_CONFIG.tenantId).collection('roles').doc('admins');
    await adminsRef.set({
      uids: admin.firestore.FieldValue.arrayUnion(uid)
    }, { merge: true });
    console.log('✅ Aggiunto a roles/admins');

    // 5. Crea documento nella collection USERS del tenant
    await db.collection('tenants').doc(REVIEWER_CONFIG.tenantId).collection('users').doc(uid).set({
      uid: uid,
      email: REVIEWER_CONFIG.email,
      displayName: REVIEWER_CONFIG.displayName,
      role: 'admin',
      isReviewerAccount: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('✅ Documento tenant/users creato');

    // 6. Aggiungi alcuni dati di esempio semplici
    await db.collection('tenants').doc(REVIEWER_CONFIG.tenantId).collection('clients').add({
      name: 'Cliente Esempio',
      surname: 'Test',
      email: 'cliente@esempio.com',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Cliente di esempio creato');

    // 7. Output finale
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ACCOUNT ADMIN REVIEWER CREATO CON SUCCESSO!');
    console.log('='.repeat(60));
    console.log('\n📋 CREDENZIALI PER GOOGLE PLAY CONSOLE:\n');
    console.log(`   Email:    ${REVIEWER_CONFIG.email}`);
    console.log(`   Password: ${REVIEWER_CONFIG.password}`);
    console.log('\n🏢 TENANT DEDICATO:');
    console.log(`   ✅ ${REVIEWER_CONFIG.tenantId} (tenant esclusivo per reviewer)`);
    console.log('\n🔑 RUOLO:');
    console.log('   ✅ ADMIN - Accesso completo a tutte le funzionalità');
    console.log('\n📝 ISTRUZIONI PER I REVISORI:');
    console.log('   1. Aprire l\'app FitFlows');
    console.log('   2. Accedere con le credenziali fornite');
    console.log('   3. Selezionare automaticamente il tenant "google-play-reviewer"');
    console.log('   4. Testare tutte le funzionalità admin disponibili');
    console.log('\n⚠️  NOTE:');
    console.log('   - Account admin semplice e pulito');
    console.log('   - Tenant dedicato senza interferenze');
    console.log('   - Dati di esempio inclusi per test completi');
    console.log('   - Non richiede selezione ruoli complessa');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

createReviewerAccount();
