#!/usr/bin/env node
/**
 * Script per creare la landing page "Elimina la Pancetta" per biondo-fitness-coach
 * Design rivoluzionario con Quiz Popup integrato
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

// Quiz Questions personalizzate - Include domande a selezione + domande aperte
const quizQuestions = [
  {
    id: 'problema',
    question: 'Qual è il tuo problema principale?',
    type: 'single',
    options: [
      { value: 'pancetta', label: 'Pancetta che non va via', icon: '🎯', color: '#f97316' },
      { value: 'maniglie', label: 'Maniglie dell\'amore', icon: '💪', color: '#ef4444' },
      { value: 'entrambi', label: 'Entrambi i problemi', icon: '⚡', color: '#8b5cf6' },
      { value: 'altro', label: 'Altro grasso localizzato', icon: '🔥', color: '#ec4899' },
    ]
  },
  {
    id: 'tentativi',
    question: 'Cosa hai già provato senza successo?',
    type: 'multiple',
    maxSelections: 3,
    options: [
      { value: 'diete', label: 'Diete restrittive', icon: '🥗' },
      { value: 'cardio', label: 'Ore di cardio', icon: '🏃' },
      { value: 'palestra', label: 'Palestra senza guida', icon: '🏋️' },
      { value: 'integratori', label: 'Integratori vari', icon: '💊' },
      { value: 'nulla', label: 'Non ho ancora provato nulla', icon: '🌱' },
    ]
  },
  {
    id: 'ostacolo',
    question: 'Qual è il tuo ostacolo principale?',
    type: 'single',
    options: [
      { value: 'tempo', label: 'Non ho tempo', icon: '⏰', color: '#3b82f6' },
      { value: 'motivazione', label: 'Perdo motivazione', icon: '😔', color: '#f59e0b' },
      { value: 'conoscenza', label: 'Non so cosa fare', icon: '❓', color: '#8b5cf6' },
      { value: 'costanza', label: 'Non riesco a essere costante', icon: '📉', color: '#ef4444' },
    ]
  },
  {
    id: 'obiettivo-descrizione',
    question: 'Descrivi brevemente il tuo obiettivo',
    type: 'textarea',
    placeholder: 'Es: Voglio perdere 5kg di grasso addominale per l\'estate, vorrei sentirmi più sicuro/a...',
    maxLength: 400,
  },
  {
    id: 'obiettivo-tempo',
    question: 'In quanto tempo vorresti vedere risultati?',
    type: 'single',
    options: [
      { value: '4-settimane', label: '4 settimane', icon: '🚀', color: '#22c55e' },
      { value: '8-settimane', label: '8 settimane', icon: '📈', color: '#3b82f6' },
      { value: '12-settimane', label: '12 settimane', icon: '🏆', color: '#f97316' },
      { value: 'non-so', label: 'Non ho fretta', icon: '🎯', color: '#8b5cf6' },
    ]
  },
  {
    id: 'impegno',
    question: 'Quanto sei disposto/a a impegnarti?',
    type: 'single',
    options: [
      { value: 'tutto', label: 'Sono pronto/a a dare tutto', icon: '💯', color: '#22c55e' },
      { value: 'molto', label: 'Molto, ma con equilibrio', icon: '⚖️', color: '#3b82f6' },
      { value: 'moderato', label: 'Impegno moderato', icon: '📊', color: '#f59e0b' },
      { value: 'poco', label: 'Il minimo indispensabile', icon: '😅', color: '#ef4444' },
    ]
  }
];

// Contact fields per il form finale - Nome, Cognome, Telefono, Email, Instagram
const quizContactFieldsList = ['nome', 'cognome', 'email', 'phone', 'instagram'];

// Landing Page Data - Design Rivoluzionario
const landingPageData = {
  title: 'Elimina Pancetta e Maniglie - Quiz',
  slug: 'elimina-pancetta-quiz',
  status: 'published',
  isPublished: true,
  
  // SEO
  seo: {
    title: 'Scopri perché non riesci ad eliminare la pancetta | MentalFit',
    description: 'Compila il quiz gratuito e scopri la vera causa del grasso ostinato. Un coach specializzato analizzerà le tue risposte.',
    keywords: 'pancetta, maniglie dell\'amore, grasso addominale, dimagrimento, fitness',
  },
  
  // Global Settings
  settings: {
    primaryColor: '#f97316', // Orange
    secondaryColor: '#dc2626', // Red
    backgroundColor: '#0f172a', // Dark blue-gray
    fontFamily: 'Inter',
    exitIntent: {
      enabled: true,
      title: 'Aspetta! Non perdere questa opportunità',
      subtitle: 'Compila il quiz ora e scopri cosa sta bloccando i tuoi risultati',
    }
  },

  // Blocks - Design moderno e coinvolgente
  blocks: [
    // HERO - Impatto visivo con problema/soluzione
    {
      id: 'hero-main',
      type: 'hero',
      settings: {
        variant: 'centered',
        title: 'Ecco perché NON riesci ad eliminare la pancetta o le maniglie dell\'amore',
        subtitle: '',
        titleColor: '#ffffff',
        subtitleColor: '#94a3b8',
        highlightedWords: 'NON,pancetta,maniglie dell\'amore',
        highlightColor: '#f97316',
        titleSizeCustom: 52,
        subtitleSizeCustom: 20,
        ctaText: '',
        showBadge: false,
        backgroundType: 'gradient',
        backgroundGradient: 'from-slate-950 via-slate-900 to-slate-950',
        overlay: false,
        minHeight: 'auto',
        textAlign: 'center',
        // Padding custom
        customPaddingTop: '60px',
        customPaddingBottom: '20px',
      }
    },

    // SUBTITLE CTA
    {
      id: 'cta-quiz-intro',
      type: 'cta',
      settings: {
        variant: 'minimal',
        title: 'Compila il breve quiz per scoprirlo',
        subtitle: '',
        titleSize: 'text-2xl',
        ctaText: '',
        showSecondaryButton: false,
        backgroundType: 'transparent',
        spacing: 'py-4',
        showStats: false,
      }
    },

    // VIDEO VSL
    {
      id: 'video-vsl',
      type: 'video',
      settings: {
        variant: 'featured',
        title: '',
        subtitle: '',
        videoUrl: '', // Da configurare con URL video VSL
        thumbnailUrl: '',
        autoplay: false,
        muted: false,
        loop: false,
        showControls: true,
        aspectRatio: '16/9',
        backgroundColor: 'bg-transparent',
        // Decorazione custom
        showGlow: true,
        glowColor: '#f97316',
        borderRadius: '24px',
        maxWidth: '900px',
      }
    },

    // CTA QUIZ BUTTON
    {
      id: 'cta-quiz-main',
      type: 'cta',
      settings: {
        variant: 'centered',
        title: '',
        subtitle: '',
        ctaText: '🎯 COMPILA IL QUIZ GRATUITO',
        ctaAction: 'quiz_popup',
        // Quiz Popup Settings
        quizTitle: 'Scopri cosa sta bloccando i tuoi risultati',
        quizSubtitle: 'Rispondi a 6 domande e ricevi una valutazione personalizzata',
        quizQuestions: quizQuestions,
        quizContactTitle: 'Ultimo step: dove ti inviamo i risultati?',
        quizContactSubtitle: 'Un coach analizzerà personalmente le tue risposte',
        quizContactFields: quizContactFieldsList,
        quizResultsTitle: '✅ Quiz completato!',
        quizResultsSubtitle: 'Le tue risposte sono state registrate',
        quizSuccessMessage: 'Un coach specializzato analizzerà personalmente le tue risposte e ti contatterà entro 24 ore con un piano personalizzato.',
        quizAccentColor: '#f97316',
        quizGradientFrom: '#f97316',
        quizGradientTo: '#dc2626',
        // Button style
        buttonStyle: 'gradient',
        buttonGradient: 'from-orange-500 to-red-600',
        buttonSize: 'xl',
        buttonAnimation: 'pulse',
        backgroundType: 'transparent',
        spacing: 'py-10',
        showStats: false,
      }
    },

    // BENEFITS - Cosa scoprirai
    {
      id: 'benefits-discover',
      type: 'features',
      settings: {
        variant: 'list',
        title: 'Compilando il quiz scoprirai:',
        subtitle: '',
        titleColor: '#ffffff',
        titleSize: 'text-3xl',
        columns: 1,
        items: [
          {
            icon: '🔍',
            title: 'Da dove nasce il problema',
            description: 'Se ormonale / alimentare / allenante'
          },
          {
            icon: '⚠️',
            title: 'Le abitudini che ti sabotano',
            description: 'Le abitudini quotidiane che stanno sabotando i tuoi progressi'
          },
          {
            icon: '✅',
            title: 'Cosa fare OGGI',
            description: 'Per vedere risultati già dalle prime settimane'
          }
        ],
        backgroundColor: 'bg-slate-900/50',
        cardStyle: 'minimal',
        iconSize: 'large',
        spacing: 'py-16',
        maxWidth: '800px',
      }
    },

    // COACH ANALYSIS
    {
      id: 'text-coach',
      type: 'text',
      settings: {
        variant: 'highlight',
        content: '<div class="text-center"><p class="text-xl md:text-2xl text-slate-300 leading-relaxed"><span class="text-orange-500 font-semibold">Un coach specializzato</span> analizzerà personalmente le tue risposte e ti dirà <span class="text-white font-semibold">esattamente cosa fare</span> per il tuo caso.</p></div>',
        textAlign: 'center',
        maxWidth: 'max-w-3xl',
        backgroundColor: 'bg-gradient-to-r from-orange-500/10 to-red-500/10',
        borderColor: '#f97316',
        padding: 'py-12 px-8',
        borderRadius: '24px',
      }
    },

    // SOCIAL PROOF - Trasformazioni
    {
      id: 'social-proof-results',
      type: 'text',
      settings: {
        variant: 'standard',
        content: '<h2 class="text-3xl md:text-4xl font-bold text-white text-center mb-4">Centinaia di uomini e donne hanno trasformato il loro corpo grazie al metodo <span class="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">MentalFit</span></h2>',
        textAlign: 'center',
        maxWidth: 'max-w-4xl',
        backgroundColor: 'bg-transparent',
        padding: 'pt-20 pb-8',
      }
    },

    // BENEFITS - Senza sacrifici
    {
      id: 'benefits-without',
      type: 'features',
      settings: {
        variant: 'checklist',
        title: '',
        subtitle: '',
        columns: 1,
        items: [
          {
            icon: '✓',
            title: 'Senza fare ore eccessive inutili di palestra',
            description: ''
          },
          {
            icon: '✓',
            title: 'Senza fare diete rigide da fame',
            description: ''
          },
          {
            icon: '✓',
            title: 'Senza sacrificare la propria vita sociale',
            description: ''
          }
        ],
        backgroundColor: 'bg-transparent',
        cardStyle: 'none',
        checkColor: '#22c55e',
        textColor: '#e2e8f0',
        fontSize: 'text-xl',
        spacing: 'py-8',
        maxWidth: '600px',
        centered: true,
      }
    },

    // URGENCY - PS
    {
      id: 'urgency-ps',
      type: 'text',
      settings: {
        variant: 'callout',
        content: '<div class="space-y-4"><p class="text-lg text-orange-400 font-semibold">PS:</p><p class="text-slate-300 text-lg leading-relaxed">Per assicurare valutazioni precise, accettiamo solo un <span class="text-white font-semibold">numero ristretto di risposte</span>.</p><p class="text-slate-300 text-lg">Se stai leggendo questo messaggio, <span class="text-green-400 font-semibold">la tua finestra è ancora disponibile</span>.</p></div>',
        textAlign: 'left',
        maxWidth: 'max-w-2xl',
        backgroundColor: 'bg-slate-800/50',
        borderColor: '#f97316',
        borderLeft: true,
        padding: 'py-6 px-8',
        marginTop: '32px',
      }
    },

    // FINAL CTA
    {
      id: 'cta-quiz-final',
      type: 'cta',
      settings: {
        variant: 'centered',
        title: '',
        subtitle: '',
        ctaText: '🔥 COMPILA IL QUIZ ORA',
        ctaAction: 'quiz_popup',
        // Quiz settings (stesse del primo)
        quizTitle: 'Scopri cosa sta bloccando i tuoi risultati',
        quizSubtitle: 'Rispondi a 6 domande e ricevi una valutazione personalizzata',
        quizQuestions: quizQuestions,
        quizContactTitle: 'Ultimo step: dove ti inviamo i risultati?',
        quizContactSubtitle: 'Un coach analizzerà personalmente le tue risposte',
        quizContactFields: quizContactFieldsList,
        quizResultsTitle: '✅ Quiz completato!',
        quizResultsSubtitle: 'Le tue risposte sono state registrate',
        quizSuccessMessage: 'Un coach specializzato analizzerà personalmente le tue risposte e ti contatterà entro 24 ore con un piano personalizzato.',
        quizAccentColor: '#f97316',
        quizGradientFrom: '#f97316',
        quizGradientTo: '#dc2626',
        // Button style
        buttonStyle: 'gradient',
        buttonGradient: 'from-orange-500 to-red-600',
        buttonSize: 'xl',
        buttonAnimation: 'bounce',
        backgroundType: 'gradient',
        backgroundGradient: 'from-slate-900 to-slate-950',
        spacing: 'py-16',
        showStats: false,
        // Extra decoration
        showArrow: true,
        glowEffect: true,
      }
    },

    // FOOTER SPACER
    {
      id: 'footer-spacer',
      type: 'divider',
      settings: {
        variant: 'space',
        height: '40px',
        backgroundColor: 'bg-slate-950',
      }
    }
  ],

  // Metadata
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: 'system',
  isAIGenerated: false,
  template: 'quiz-vsl',
  version: 2,
};

async function createLandingPage() {
  try {
    console.log('🚀 Creazione landing page "Elimina Pancetta Quiz" per', TENANT_ID);
    
    // Check if page already exists
    const existingQuery = await db
      .collection(`tenants/${TENANT_ID}/landing_pages`)
      .where('slug', '==', landingPageData.slug)
      .get();
    
    if (!existingQuery.empty) {
      console.log('⚠️  Landing page con slug "elimina-pancetta-quiz" già esistente');
      console.log('   ID esistente:', existingQuery.docs[0].id);
      
      // Update existing
      const docId = existingQuery.docs[0].id;
      await db.collection(`tenants/${TENANT_ID}/landing_pages`).doc(docId).update({
        ...landingPageData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ Landing page aggiornata con successo!');
      console.log('   ID:', docId);
      console.log('   URL: /site/mentalfit/elimina-pancetta-quiz');
      return;
    }
    
    // Create new
    const docRef = await db.collection(`tenants/${TENANT_ID}/landing_pages`).add(landingPageData);
    
    console.log('✅ Landing page creata con successo!');
    console.log('   ID:', docRef.id);
    console.log('   URL: /site/mentalfit/elimina-pancetta-quiz');
    console.log('');
    console.log('📝 Prossimi passi:');
    console.log('   1. Aggiungi l\'URL del video VSL nel blocco "video-vsl"');
    console.log('   2. Personalizza le domande del quiz se necessario');
    console.log('   3. Testa la pagina su mobile');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

createLandingPage().then(() => process.exit(0));
