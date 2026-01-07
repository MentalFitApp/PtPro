#!/usr/bin/env node
/**
 * Script per aggiornare la landing page "biondo-fitness-coach"
 * - Rimuove "pancetta e maniglie" dal titolo
 * - Rimuove mouse animato dall'header
 * - Aggiunge 8 nuove domande al quiz
 * - Aggiunge supporto video post-quiz
 */

const admin = require('firebase-admin');
const path = require('path');

// Inizializza Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const TENANT_ID = 'biondo-fitness-coach';
const LANDING_SLUG = 'elimina-pancetta-quiz';

// Quiz Questions AGGIORNATE - 14 domande totali (6 originali + 8 nuove)
const quizQuestions = [
  // Domanda 1 - Situazione attuale
  {
    id: 'situazione-attuale',
    question: 'Come descriveresti la tua situazione fisica attuale?',
    type: 'single',
    options: [
      { value: 'sovrappeso-leggero', label: 'Leggermente sovrappeso', iconType: 'svg', iconName: 'target', color: '#22c55e' },
      { value: 'sovrappeso-moderato', label: 'Sovrappeso moderato', iconType: 'svg', iconName: 'progress', color: '#f59e0b' },
      { value: 'sovrappeso-importante', label: 'Sovrappeso importante', iconType: 'svg', iconName: 'fire', color: '#ef4444' },
      { value: 'normopeso-tonico', label: 'Normopeso ma voglio tonificare', iconType: 'svg', iconName: 'muscle', color: '#3b82f6' },
    ]
  },
  // Domanda 2 - Problema principale (modificata - senza "pancetta")
  {
    id: 'problema',
    question: 'Qual è il tuo problema principale?',
    type: 'single',
    options: [
      { value: 'grasso-addominale', label: 'Grasso addominale ostinato', iconType: 'svg', iconName: 'target', color: '#f97316' },
      { value: 'grasso-fianchi', label: 'Grasso sui fianchi', iconType: 'svg', iconName: 'muscle', color: '#ef4444' },
      { value: 'grasso-generalizzato', label: 'Grasso generalizzato', iconType: 'svg', iconName: 'energy', color: '#8b5cf6' },
      { value: 'mancanza-tono', label: 'Mancanza di tono muscolare', iconType: 'svg', iconName: 'gym', color: '#3b82f6' },
    ]
  },
  // Domanda 3 - Da quanto tempo
  {
    id: 'durata-problema',
    question: 'Da quanto tempo combatti con questo problema?',
    type: 'single',
    options: [
      { value: 'meno-6-mesi', label: 'Meno di 6 mesi', iconType: 'svg', iconName: 'time', color: '#22c55e' },
      { value: '6-12-mesi', label: 'Da 6 mesi a 1 anno', iconType: 'svg', iconName: 'progress', color: '#3b82f6' },
      { value: '1-3-anni', label: 'Da 1 a 3 anni', iconType: 'svg', iconName: 'consistency', color: '#f59e0b' },
      { value: 'oltre-3-anni', label: 'Oltre 3 anni', iconType: 'svg', iconName: 'fire', color: '#ef4444' },
    ]
  },
  // Domanda 4 - Hai già fatto percorsi
  {
    id: 'percorsi-precedenti',
    question: 'Hai già seguito un percorso con un professionista?',
    type: 'single',
    options: [
      { value: 'mai', label: 'No, mai', iconType: 'svg', iconName: 'sprout', color: '#22c55e' },
      { value: 'nutrizionista', label: 'Sì, con un nutrizionista', iconType: 'svg', iconName: 'diet', color: '#3b82f6' },
      { value: 'pt', label: 'Sì, con un personal trainer', iconType: 'svg', iconName: 'gym', color: '#8b5cf6' },
      { value: 'entrambi', label: 'Sì, entrambi', iconType: 'svg', iconName: 'trophy', color: '#f59e0b' },
      { value: 'online', label: 'Sì, programmi online/app', iconType: 'svg', iconName: 'target', color: '#64748b' },
    ]
  },
  // Domanda 5 - Risultati precedenti
  {
    id: 'risultati-precedenti',
    question: 'Se hai provato in passato, quali risultati hai ottenuto?',
    type: 'single',
    options: [
      { value: 'nessuno', label: 'Nessun risultato', iconType: 'svg', iconName: 'question', color: '#ef4444' },
      { value: 'pochi', label: 'Pochi risultati, poi mollato', iconType: 'svg', iconName: 'progress', color: '#f59e0b' },
      { value: 'buoni-ripresi', label: 'Buoni risultati ma ho ripreso peso', iconType: 'svg', iconName: 'consistency', color: '#3b82f6' },
      { value: 'non-provato', label: 'Non ho mai provato seriamente', iconType: 'svg', iconName: 'sprout', color: '#22c55e' },
    ]
  },
  // Domanda 6 - Tentativi fai da te
  {
    id: 'tentativi',
    question: 'Cosa hai già provato da solo senza successo?',
    type: 'multiple',
    maxSelections: 3,
    options: [
      { value: 'diete', label: 'Diete restrittive', iconType: 'svg', iconName: 'diet', color: '#22c55e' },
      { value: 'cardio', label: 'Ore di cardio', iconType: 'svg', iconName: 'cardio', color: '#3b82f6' },
      { value: 'palestra', label: 'Palestra senza guida', iconType: 'svg', iconName: 'gym', color: '#64748b' },
      { value: 'integratori', label: 'Integratori vari', iconType: 'svg', iconName: 'supplement', color: '#a855f7' },
      { value: 'digiuno', label: 'Digiuno intermittente', iconType: 'svg', iconName: 'time', color: '#f59e0b' },
      { value: 'nulla', label: 'Non ho ancora provato nulla', iconType: 'svg', iconName: 'sprout', color: '#10b981' },
    ]
  },
  // Domanda 7 - Attività fisica attuale
  {
    id: 'attivita-attuale',
    question: 'Quanta attività fisica fai attualmente?',
    type: 'single',
    options: [
      { value: 'nulla', label: 'Nessuna / Sedentario', iconType: 'svg', iconName: 'time', color: '#ef4444' },
      { value: '1-2-settimana', label: '1-2 volte a settimana', iconType: 'svg', iconName: 'sprout', color: '#f59e0b' },
      { value: '3-4-settimana', label: '3-4 volte a settimana', iconType: 'svg', iconName: 'progress', color: '#22c55e' },
      { value: 'oltre-4', label: 'Oltre 4 volte a settimana', iconType: 'svg', iconName: 'fire', color: '#3b82f6' },
    ]
  },
  // Domanda 8 - Alimentazione
  {
    id: 'alimentazione',
    question: 'Come descriveresti la tua alimentazione attuale?',
    type: 'single',
    options: [
      { value: 'disordinata', label: 'Molto disordinata', iconType: 'svg', iconName: 'question', color: '#ef4444' },
      { value: 'abbastanza-disordinata', label: 'Abbastanza disordinata', iconType: 'svg', iconName: 'progress', color: '#f59e0b' },
      { value: 'discreta', label: 'Discreta, ma posso migliorare', iconType: 'svg', iconName: 'target', color: '#3b82f6' },
      { value: 'buona', label: 'Buona, mi manca solo la guida', iconType: 'svg', iconName: 'trophy', color: '#22c55e' },
    ]
  },
  // Domanda 9 - Ostacolo principale
  {
    id: 'ostacolo',
    question: 'Qual è il tuo ostacolo principale?',
    type: 'single',
    options: [
      { value: 'tempo', label: 'Non ho tempo', iconType: 'svg', iconName: 'time', color: '#f59e0b' },
      { value: 'motivazione', label: 'Perdo motivazione facilmente', iconType: 'svg', iconName: 'motivation', color: '#ef4444' },
      { value: 'conoscenza', label: 'Non so cosa fare', iconType: 'svg', iconName: 'question', color: '#6366f1' },
      { value: 'costanza', label: 'Non riesco a essere costante', iconType: 'svg', iconName: 'consistency', color: '#ec4899' },
      { value: 'stress', label: 'Stress e stanchezza', iconType: 'svg', iconName: 'energy', color: '#8b5cf6' },
    ]
  },
  // Domanda 10 - Tempo disponibile
  {
    id: 'tempo-disponibile',
    question: 'Quanto tempo puoi dedicare all\'allenamento?',
    type: 'single',
    options: [
      { value: '20-30-min', label: '20-30 minuti', iconType: 'svg', iconName: 'time', color: '#f59e0b' },
      { value: '30-45-min', label: '30-45 minuti', iconType: 'svg', iconName: 'progress', color: '#3b82f6' },
      { value: '45-60-min', label: '45-60 minuti', iconType: 'svg', iconName: 'gym', color: '#22c55e' },
      { value: 'oltre-60', label: 'Oltre 1 ora', iconType: 'svg', iconName: 'fire', color: '#8b5cf6' },
    ]
  },
  // Domanda 11 - Età
  {
    id: 'fascia-eta',
    question: 'In quale fascia di età rientri?',
    type: 'single',
    options: [
      { value: '18-25', label: '18-25 anni', iconType: 'svg', iconName: 'rocket', color: '#22c55e' },
      { value: '26-35', label: '26-35 anni', iconType: 'svg', iconName: 'fire', color: '#3b82f6' },
      { value: '36-45', label: '36-45 anni', iconType: 'svg', iconName: 'target', color: '#f59e0b' },
      { value: '46-55', label: '46-55 anni', iconType: 'svg', iconName: 'balance', color: '#8b5cf6' },
      { value: 'oltre-55', label: 'Oltre 55 anni', iconType: 'svg', iconName: 'trophy', color: '#64748b' },
    ]
  },
  // Domanda 12 - Obiettivo descrizione
  {
    id: 'obiettivo-descrizione',
    question: 'Descrivi brevemente il tuo obiettivo',
    type: 'textarea',
    placeholder: 'Es: Voglio perdere 5kg di grasso, sentirmi più energico, migliorare la mia autostima...',
    maxLength: 400,
  },
  // Domanda 13 - Tempistica
  {
    id: 'obiettivo-tempo',
    question: 'In quanto tempo vorresti vedere risultati?',
    type: 'single',
    options: [
      { value: '4-settimane', label: '4 settimane', iconType: 'svg', iconName: 'rocket', color: '#22c55e' },
      { value: '8-settimane', label: '8 settimane', iconType: 'svg', iconName: 'progress', color: '#3b82f6' },
      { value: '12-settimane', label: '12 settimane', iconType: 'svg', iconName: 'trophy', color: '#f97316' },
      { value: 'non-so', label: 'Non ho fretta, voglio risultati duraturi', iconType: 'svg', iconName: 'target', color: '#8b5cf6' },
    ]
  },
  // Domanda 14 - Impegno
  {
    id: 'impegno',
    question: 'Quanto sei disposto/a a impegnarti?',
    type: 'single',
    options: [
      { value: 'tutto', label: 'Sono pronto/a a dare tutto', iconType: 'svg', iconName: 'fire', color: '#22c55e' },
      { value: 'molto', label: 'Molto, ma con equilibrio', iconType: 'svg', iconName: 'balance', color: '#3b82f6' },
      { value: 'moderato', label: 'Impegno moderato', iconType: 'svg', iconName: 'progress', color: '#f59e0b' },
      { value: 'poco', label: 'Il minimo indispensabile', iconType: 'svg', iconName: 'time', color: '#ef4444' },
    ]
  }
];

// Contact fields per il form finale
const quizContactFieldsList = ['nome', 'cognome', 'email', 'phone', 'instagram'];

async function updateLandingPage() {
  try {
    console.log('🚀 Aggiornamento landing page per', TENANT_ID);
    
    // Trova la landing page
    const existingQuery = await db
      .collection(`tenants/${TENANT_ID}/landing_pages`)
      .where('slug', '==', LANDING_SLUG)
      .get();
    
    if (existingQuery.empty) {
      console.log('❌ Landing page non trovata con slug:', LANDING_SLUG);
      process.exit(1);
    }
    
    const docId = existingQuery.docs[0].id;
    const currentData = existingQuery.docs[0].data();
    console.log('📄 Landing page trovata, ID:', docId);
    
    // Aggiorna i blocks
    const updatedBlocks = currentData.blocks.map(block => {
      // 1. Aggiorna Hero - rimuovi "pancetta o le maniglie dell'amore" e mouse animato
      if (block.id === 'hero-main' && block.type === 'hero') {
        return {
          ...block,
          settings: {
            ...block.settings,
            title: 'Ecco perché NON riesci ad eliminare il grasso ostinato',
            highlightedWords: 'NON,grasso ostinato',
            showScrollIndicator: false, // Rimuove mouse animato
          }
        };
      }
      
      // 2. Aggiorna SEO nel titolo
      if (block.id === 'cta-quiz-intro' && block.type === 'cta') {
        return {
          ...block,
          settings: {
            ...block.settings,
            title: 'Compila il breve quiz per scoprire cosa ti blocca',
          }
        };
      }
      
      // 3. Aggiorna CTA principale con nuove domande + video post-quiz
      if (block.id === 'cta-quiz-main' && block.type === 'cta') {
        return {
          ...block,
          settings: {
            ...block.settings,
            quizTitle: 'Scopri cosa sta bloccando i tuoi risultati',
            quizSubtitle: 'Rispondi a 14 domande e ricevi una valutazione personalizzata',
            quizQuestions: quizQuestions,
            quizContactFields: quizContactFieldsList,
            // Video dopo completamento quiz (URL da configurare)
            quizResultsVideoUrl: '', // Inserire qui l'URL del video
          }
        };
      }
      
      // 4. Aggiorna CTA finale con le stesse modifiche
      if (block.id === 'cta-quiz-final' && block.type === 'cta') {
        return {
          ...block,
          settings: {
            ...block.settings,
            quizTitle: 'Scopri cosa sta bloccando i tuoi risultati',
            quizSubtitle: 'Rispondi a 14 domande e ricevi una valutazione personalizzata',
            quizQuestions: quizQuestions,
            quizContactFields: quizContactFieldsList,
            // Video dopo completamento quiz (URL da configurare)
            quizResultsVideoUrl: '', // Inserire qui l'URL del video
          }
        };
      }
      
      // 5. Aggiorna testo benefits (rimuovi riferimento pancetta/maniglie)
      if (block.id === 'social-proof-results' && block.type === 'text') {
        return {
          ...block,
          settings: {
            ...block.settings,
            content: '<h2 class="text-3xl md:text-4xl font-bold text-white text-center mb-4">Centinaia di uomini e donne hanno trasformato il loro corpo grazie al metodo <span class="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">MentalFit</span></h2>',
          }
        };
      }
      
      return block;
    });
    
    // Aggiorna anche SEO
    const updatedSeo = {
      ...currentData.seo,
      title: 'Scopri perché non riesci ad eliminare il grasso ostinato | MentalFit',
      description: 'Compila il quiz gratuito e scopri la vera causa del grasso ostinato. Un coach specializzato analizzerà le tue risposte.',
      keywords: 'grasso ostinato, grasso addominale, dimagrimento, fitness, trasformazione fisica',
    };
    
    // Salva le modifiche
    await db.collection(`tenants/${TENANT_ID}/landing_pages`).doc(docId).update({
      blocks: updatedBlocks,
      seo: updatedSeo,
      title: 'Elimina Grasso Ostinato - Quiz',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('');
    console.log('✅ Landing page aggiornata con successo!');
    console.log('');
    console.log('📝 Modifiche applicate:');
    console.log('   ✓ Titolo cambiato da "pancetta o maniglie" a "grasso ostinato"');
    console.log('   ✓ Rimosso mouse animato dall\'header');
    console.log('   ✓ Quiz aggiornato a 14 domande (8 nuove)');
    console.log('   ✓ Aggiunto supporto video post-quiz');
    console.log('');
    console.log('⚠️  Per aggiungere il video post-quiz:');
    console.log('   1. Vai nel pannello admin > Landing Pages');
    console.log('   2. Modifica la landing page');
    console.log('   3. Nel blocco CTA con quiz, cerca "quizResultsVideoUrl"');
    console.log('   4. Inserisci l\'URL del video YouTube/Vimeo');
    console.log('');
    console.log('   OPPURE modifica questo script e ri-eseguilo con l\'URL del video.');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

updateLandingPage().then(() => process.exit(0));
