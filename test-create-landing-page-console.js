// TEST: Verifica creazione landing page
// Da eseguire nella console del browser con l'app aperta

console.log('🧪 TEST: Creazione Landing Page\n');

// Importa le funzioni necessarie dal modulo
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './src/firebase';
import { getTenantCollection } from './src/config/tenant';

async function testCreateLandingPage() {
  try {
    console.log('1️⃣ User ID:', auth.currentUser?.uid);
    console.log('2️⃣ Tenant ID: biondo-fitness-coach (hardcoded)');
    
    const testPageData = {
      title: 'TEST - Landing Page di Prova',
      slug: 'test-' + Date.now(),
      status: 'draft',
      aiGenerated: false,
      sections: [
        {
          type: 'hero',
          props: {
            title: 'Pagina di Test',
            subtitle: 'Creata dalla console',
            ctaText: 'Scopri di più',
            ctaLink: '#test'
          }
        }
      ],
      seo: {
        metaTitle: 'Test Page',
        metaDescription: 'Una pagina di test',
        ogImage: ''
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser.uid
    };

    console.log('3️⃣ Dati da salvare:', testPageData);
    console.log('4️⃣ Salvataggio in corso...');

    const docRef = await addDoc(
      getTenantCollection(db, 'landingPages'),
      testPageData
    );

    console.log('✅ SUCCESSO!');
    console.log('   ID documento:', docRef.id);
    console.log('   Path completo:', docRef.path);
    console.log('\n💡 Ora ricarica la pagina /landing-pages per vederla!');

  } catch (error) {
    console.error('❌ ERRORE:', error);
    console.error('   Codice:', error.code);
    console.error('   Messaggio:', error.message);
  }
}

testCreateLandingPage();
