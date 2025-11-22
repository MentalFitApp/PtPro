// Aggiungi il tuo UID a platform_admins/superadmins
// node add-platform-admin.cjs

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDU4GmH6xLhrEd2jSkyATXJOasIyEfisXY",
  authDomain: "biondo-fitness-coach.firebaseapp.com",
  projectId: "biondo-fitness-coach",
  storageBucket: "biondo-fitness-coach.firebasestorage.app",
  messagingSenderId: "1086406111438",
  appId: "1:1086406111438:web:1c8c3d9e49f1ffdb77609f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addPlatformAdmin() {
  const uid = 'FMj9GlrcUmUGpGUODaQe6dHaXcL2';
  
  console.log('\n🔧 Aggiunta UID a platform_admins/superadmins...');
  console.log(`UID: ${uid}\n`);

  try {
    const docRef = doc(db, 'platform_admins', 'superadmins');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Crea il documento
      await setDoc(docRef, {
        uids: [uid],
        createdAt: new Date().toISOString()
      });
      console.log('✅ Documento platform_admins/superadmins creato!');
    } else {
      // Aggiungi UID se non c'è già
      const data = docSnap.data();
      if (data.uids?.includes(uid)) {
        console.log('✅ UID già presente in platform_admins/superadmins');
      } else {
        await updateDoc(docRef, {
          uids: arrayUnion(uid)
        });
        console.log('✅ UID aggiunto a platform_admins/superadmins');
      }
    }

    // Verifica
    const verifySnap = await getDoc(docRef);
    console.log('\n📋 UIDs finali:', verifySnap.data().uids);
    console.log('\n🎉 Ora puoi accedere a /platform-login con questo account!\n');

  } catch (error) {
    console.error('❌ Errore:', error.message);
    
    if (error.message.includes('permissions')) {
      console.log('\n⚠️  Devi aggiungere l\'UID manualmente via Firebase Console:');
      console.log('1. Vai su Firestore');
      console.log('2. Collection: platform_admins');
      console.log('3. Document: superadmins');
      console.log('4. Field: uids (array)');
      console.log(`5. Aggiungi: ${uid}\n`);
    }
  }

  process.exit(0);
}

addPlatformAdmin();
