// Script per verificare landing pages in Firestore
// Esegui nella console del browser quando l'app è aperta

console.log('🔍 Verifica Landing Pages in Firestore...\n');

// Importa le funzioni necessarie
const { collection, getDocs } = window.firebaseImports || {};

if (!window.db) {
  console.error('❌ Firebase non inizializzato. Assicurati che l\'app sia in esecuzione.');
} else {
  const tenantId = localStorage.getItem('tenantId');
  console.log('📋 Tenant ID:', tenantId);
  
  if (!tenantId) {
    console.error('❌ Tenant ID non trovato nel localStorage');
    console.log('💡 Fai login prima di eseguire questo script');
  } else {
    // Query diretta
    const pagesRef = collection(window.db, `tenants/${tenantId}/landingPages`);
    
    getDocs(pagesRef).then(snapshot => {
      console.log('📊 Documenti trovati:', snapshot.size);
      
      if (snapshot.empty) {
        console.log('⚠️ Nessuna landing page trovata in Firestore');
        console.log('💡 Prova a creare una pagina con "Genera con AI"');
      } else {
        console.log('\n📄 Landing Pages trovate:\n');
        snapshot.docs.forEach((doc, idx) => {
          const data = doc.data();
          console.log(`${idx + 1}. ID: ${doc.id}`);
          console.log(`   Title: ${data.title}`);
          console.log(`   Slug: ${data.slug}`);
          console.log(`   Status: ${data.status}`);
          console.log(`   Sections: ${data.sections?.length || 0}`);
          console.log(`   Created: ${data.createdAt?.toDate()}`);
          console.log(`   AI Generated: ${data.aiGenerated ? 'Sì' : 'No'}`);
          console.log('');
        });
      }
    }).catch(error => {
      console.error('❌ Errore query Firestore:', error.message);
      console.log('💡 Dettagli:', error);
    });
  }
}
