// Test rapido OpenAI landing page generation
import { generateLandingPage } from './src/services/openai.js';

async function testGeneration() {
  console.log('🧪 Test generazione landing page...\n');

  try {
    const result = await generateLandingPage({
      businessType: 'Palestra CrossFit',
      targetAudience: 'atleti e principianti',
      goal: 'lead-generation',
      style: 'energetic',
      additionalInfo: 'Specializzati in allenamenti ad alta intensità, ambiente motivante'
    });

    console.log('✅ Risultato AI:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n📊 Statistiche:');
    console.log(`- Titolo: ${result.title}`);
    console.log(`- Sezioni generate: ${result.sections?.length || 0}`);
    console.log(`- SEO Title: ${result.seo?.metaTitle}`);
    console.log(`- SEO Description: ${result.seo?.metaDescription}`);

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

testGeneration();
