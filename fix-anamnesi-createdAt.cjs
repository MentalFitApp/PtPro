// Script per aggiungere createdAt alle anamnesi che hanno solo submittedAt
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDWin4e1dTE92XCB8Cqme-HF_T0b15uxyU",
  authDomain: "pt-manager-v2.firebaseapp.com",
  projectId: "pt-manager-v2",
  storageBucket: "pt-manager-v2.firebasestorage.app",
  messagingSenderId: "637813155759",
  appId: "1:637813155759:web:b7f5c55e4a10bb6ddb4c5f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixAnamnesiCreatedAt() {
  try {
    const clientsSnapshot = await getDocs(collection(db, 'clients'));
    let totalFixed = 0;
    let totalSkipped = 0;

    for (const clientDoc of clientsSnapshot.docs) {
      const clientId = clientDoc.id;
      const anamnesiSnapshot = await getDocs(collection(db, 'clients', clientId, 'anamnesi'));

      for (const anamnesiDoc of anamnesiSnapshot.docs) {
        const data = anamnesiDoc.data();
        
        // Se non ha createdAt ma ha submittedAt, copialo
        if (!data.createdAt && data.submittedAt) {
          await updateDoc(doc(db, 'clients', clientId, 'anamnesi', anamnesiDoc.id), {
            createdAt: data.submittedAt
          });
          console.log(`✅ Aggiunto createdAt per anamnesi ${anamnesiDoc.id} del cliente ${clientId}`);
          totalFixed++;
        } else if (!data.createdAt && !data.submittedAt) {
          console.log(`⚠️ Anamnesi ${anamnesiDoc.id} del cliente ${clientId} non ha né createdAt né submittedAt`);
          totalSkipped++;
        } else {
          totalSkipped++;
        }
      }
    }

    console.log(`\n📊 Riepilogo:`);
    console.log(`   Anamnesi aggiornate: ${totalFixed}`);
    console.log(`   Anamnesi già corrette o senza timestamp: ${totalSkipped}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

fixAnamnesiCreatedAt();
