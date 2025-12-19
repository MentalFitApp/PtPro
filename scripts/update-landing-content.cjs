/**
 * Script per aggiornare i contenuti della landing page Protocollo Inverno
 * con informazioni più accurate e leggermente esagerate per marketing
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'biondo-fitness-coach'
  });
}

const db = admin.firestore();
const TENANT_ID = 'biondo-fitness-coach';

// Funzione per generare ID blocco
const generateBlockId = (type) => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Nuovi blocchi aggiornati con contenuti reali ma persuasivi
const UPDATED_BLOCKS = [
  // 1. TRUST BAR / SOCIAL PROOF
  {
    id: generateBlockId('socialProof'),
    type: 'socialProof',
    name: 'Social Proof',
    settings: {
      variant: 'stats',
      title: '',
      items: [
        { type: 'stat', value: '⭐ 4.9/5', label: 'Valutazione Clienti' },
        { type: 'stat', value: '500+', label: 'Persone Trasformate' },
        { type: 'stat', value: '0 kg', label: 'Accumulati nelle Feste' },
      ],
      logos: [],
      backgroundColor: 'bg-slate-900/80',
    }
  },
  
  // 2. HERO SECTION
  {
    id: generateBlockId('hero'),
    type: 'hero',
    name: 'Hero Section',
    settings: {
      variant: 'centered',
      title: 'Come Gestire al Meglio l\'Inverno (e le Feste) Senza Perdere la Forma',
      subtitle: 'L\'inverno è il periodo in cui si perde più facilmente il controllo: meno movimento, più cene, più dolci, più scuse. Questa guida ti dà una struttura SEMPLICE per attraversare inverno e feste senza accumulare grasso, perdere tono muscolare o sentirti sempre "indietro".',
      ctaText: 'Scarica GRATIS il Protocollo Inverno',
      ctaAction: 'form_popup',
      ctaLink: '#form',
      secondaryCtaText: 'Scopri cosa contiene',
      secondaryCtaLink: '#benefits',
      backgroundType: 'gradient',
      backgroundGradient: 'from-slate-900 via-blue-900 to-slate-900',
      backgroundImage: '',
      backgroundVideo: '',
      overlay: true,
      overlayOpacity: 50,
      textAlign: 'center',
      minHeight: '90vh',
      showBadge: true,
      badgeText: '🎄 Guida Completa Inverno 2025',
      // Form popup settings
      formPopupTitle: 'Scarica GRATIS il Protocollo Inverno',
      formPopupSubtitle: 'Inserisci i tuoi dati per ricevere subito la guida completa',
      formPopupFields: 'name,email',
      formPopupSubmitText: 'Scarica la Guida GRATIS',
      formPopupSuccessMessage: '🎉 Perfetto! Controlla la tua email per scaricare il Protocollo Inverno!',
      formPopupAfterSubmit: 'message',
    }
  },
  
  // 3. COSA IMPARERAI - BENEFITS
  {
    id: generateBlockId('features'),
    type: 'features',
    name: 'Cosa Imparerai',
    settings: {
      variant: 'grid',
      title: 'Cosa Troverai nel Protocollo Inverno',
      subtitle: 'Non una dieta restrittiva, ma un SISTEMA COMPLETO per vivere le feste senza sensi di colpa e arrivare a gennaio in forma',
      columns: 3,
      items: [
        { 
          icon: '🍽️', 
          title: 'Digiuno Strategico Invernale', 
          description: 'Il metodo 16/8 adattato all\'inverno: finestra alimentare intelligente che ti permette di compensare pranzi e cene abbondanti senza rinunce estreme.' 
        },
        { 
          icon: '📋', 
          title: 'Schema Giornata Tipo Completo', 
          description: 'Orari precisi dal mattino alla sera: cosa mangiare, quando, e come gestire allenamento e pasti per massimizzare i risultati.' 
        },
        { 
          icon: '🎄', 
          title: 'Strategia Giorni di Festa', 
          description: 'Come prepararti PRIMA di una cena importante: digiuno più lungo, allenamento breve, e poi goditi il pasto SENZA sensi di colpa.' 
        },
        { 
          icon: '🏋️', 
          title: '3 Routine di Allenamento Complete', 
          description: 'Forza Totale Corpo, HIIT Brucia-Grassi, Mobilità e Recupero. Allenamenti da 30 minuti che funzionano anche a casa.' 
        },
        { 
          icon: '💊', 
          title: 'Integrazione Strategica', 
          description: 'Quali integratori usare e QUANDO: Vitamina C, Berberina, Cromo, Acido Alfa Lipoico per ottimizzare metabolismo e sensibilità insulinica.' 
        },
        { 
          icon: '🧠', 
          title: 'Mentalità Invernale Vincente', 
          description: 'Chi vince l\'inverno, vince l\'estate. Impara a seguire una struttura semplice invece di cercare motivazione.' 
        },
      ],
      backgroundColor: 'bg-slate-900',
      cardStyle: 'glass',
    }
  },
  
  // 4. PAIN POINTS
  {
    id: generateBlockId('text'),
    type: 'text',
    name: 'Pain Points',
    settings: {
      variant: 'standard',
      content: `
        <div class="text-center max-w-4xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-8">L'Errore che Fanno Tutti in Inverno</h2>
          
          <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-8 mb-8">
            <p class="text-red-400 text-xl italic">"Fa freddo, quindi mangio tutto tanto poi mi alleno a gennaio"</p>
            <p class="text-white text-2xl font-bold mt-4">⚠️ Gennaio NON ripara dicembre.</p>
          </div>
          
          <div class="grid md:grid-cols-3 gap-6 text-left mb-12">
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p class="text-red-400 text-lg mb-2">😤 Accumulo Grasso Inutile</p>
              <p class="text-slate-400">Ogni sgarro non gestito diventa grasso viscerale che poi impieghi mesi a smaltire</p>
            </div>
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p class="text-red-400 text-lg mb-2">💪 Perdita di Tono Muscolare</p>
              <p class="text-slate-400">Meno allenamenti + più carboidrati = muscoli che spariscono sotto uno strato di grasso</p>
            </div>
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p class="text-red-400 text-lg mb-2">🔄 Sempre "Indietro"</p>
              <p class="text-slate-400">A gennaio riparti da zero, ogni anno. Un ciclo infinito che ti tiene lontano dal fisico che vuoi</p>
            </div>
          </div>
          
          <p class="text-cyan-400 text-xl font-semibold">L'obiettivo NON è vivere a dieta. È avere una STRUTTURA SEMPLICE che funziona.</p>
        </div>
      `,
      textAlign: 'center',
      maxWidth: 'max-w-6xl',
      backgroundColor: 'bg-slate-800',
      padding: 'py-16',
    }
  },
  
  // 5. STRATEGIA ALIMENTARE
  {
    id: generateBlockId('features'),
    type: 'features',
    name: 'Strategia Alimentare',
    settings: {
      variant: 'list',
      title: 'Strategia Alimentare Anti-Grasso',
      subtitle: 'In inverno non serve mangiare MENO. Serve mangiare MEGLIO e con LOGICA.',
      columns: 2,
      items: [
        { 
          icon: '⏰', 
          title: 'Finestra 16/8 Adattata', 
          description: 'Primo pasto a tarda mattinata, ultimo a cena. Compensa gli eccessi senza digiuni estremi.' 
        },
        { 
          icon: '🔥', 
          title: 'Pasti Caldi e Sazianti', 
          description: 'Proteine + carboidrati controllati + grassi buoni. Zuppe, minestre, piatti caldi che saziano.' 
        },
        { 
          icon: '🥩', 
          title: 'Priorità Proteine', 
          description: 'Carne, uova, pesce, yogurt greco. Fondamentali per mantenere la massa muscolare.' 
        },
        { 
          icon: '🥗', 
          title: 'Verdure Cotte', 
          description: 'Broccoli, cavolfiore, spinaci. Aiutano digestione e sazietà nei mesi freddi.' 
        },
        { 
          icon: '🍫', 
          title: 'Sgarri Programmati', 
          description: '1-2 pasti liberi a settimana sono gestibili. Non trasformare uno sgarro in 3 giorni fuori controllo.' 
        },
        { 
          icon: '⚖️', 
          title: 'La Costanza Batte la Perfezione', 
          description: 'Non serve essere perfetti. Serve essere costanti con una struttura semplice.' 
        },
      ],
      backgroundColor: 'bg-slate-900',
      cardStyle: 'bordered',
    }
  },
  
  // 6. CTA INTERMEDIO
  {
    id: generateBlockId('cta'),
    type: 'cta',
    name: 'CTA Strategia',
    settings: {
      variant: 'centered',
      title: 'Una Cena NON Fa Ingrassare',
      subtitle: 'La mancanza di STRUTTURA sì. Scarica il protocollo e scopri come goderti le feste senza pagare il conto a gennaio.',
      ctaText: 'Voglio il Protocollo Inverno',
      ctaAction: 'form_popup',
      ctaLink: '#form',
      showSecondaryButton: false,
      backgroundType: 'gradient',
      backgroundGradient: 'from-cyan-600 to-blue-600',
      backgroundImage: '',
      buttonStyle: 'solid',
      animation: 'fadeIn',
      spacing: 'py-20',
      showStats: true,
      stats: [
        { value: '16/8', label: 'Metodo Digiuno' },
        { value: '3', label: 'Routine Allenamento' },
        { value: '30 min', label: 'Workout Completi' },
      ],
      // Form popup
      formPopupTitle: 'Scarica il Protocollo Inverno',
      formPopupSubtitle: 'Ricevi subito la guida completa nella tua email',
      formPopupFields: 'name,email',
      formPopupSubmitText: 'Scarica GRATIS',
      formPopupSuccessMessage: '🎉 Controlla la tua email!',
      formPopupAfterSubmit: 'message',
    }
  },
  
  // 7. ALLENAMENTI
  {
    id: generateBlockId('features'),
    type: 'features',
    name: 'Allenamenti',
    settings: {
      variant: 'grid',
      title: '3 Routine di Allenamento Complete',
      subtitle: 'In inverno non serve allenarsi di PIÙ. Serve allenarsi MEGLIO. 3 allenamenti fatti bene > 5 saltati.',
      columns: 3,
      items: [
        { 
          icon: '💪', 
          title: 'Routine 1: Forza Totale', 
          description: '30 minuti - Squat, Push-up, Affondi, Plank, Rematore, Crunch. 3-4 giri completi per mantenere forza e massa.' 
        },
        { 
          icon: '🔥', 
          title: 'Routine 2: HIIT Brucia-Grassi', 
          description: '20-30 minuti - Burpees, Jump Squat, Mountain Climbers, High Knees. 30 sec ON / 20 sec OFF. Brucia e mantieni.' 
        },
        { 
          icon: '🧘', 
          title: 'Routine 3: Mobilità & Core', 
          description: '30 minuti - Perfetta nei giorni freddi o di poca energia. Recupero, riduzione rigidità, qualità di movimento.' 
        },
      ],
      backgroundColor: 'bg-slate-800',
      cardStyle: 'glass',
    }
  },
  
  // 8. INTEGRAZIONE
  {
    id: generateBlockId('text'),
    type: 'text',
    name: 'Integrazione',
    settings: {
      variant: 'standard',
      content: `
        <div class="text-center max-w-4xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">💊 Integrazione Strategica Inclusa</h2>
          
          <p class="text-xl text-slate-300 mb-8">Per massimizzare i risultati del tuo piano nutrizionale e di allenamento</p>
          
          <div class="grid md:grid-cols-2 gap-6 text-left">
            <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <p class="text-emerald-400 font-bold text-lg mb-2">☀️ Al Mattino</p>
              <p class="text-slate-300">Vitamina C + Multivitaminico per supportare il sistema immunitario e colmare carenze nutrizionali</p>
            </div>
            <div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
              <p class="text-purple-400 font-bold text-lg mb-2">🍽️ Prima dei Pasti</p>
              <p class="text-slate-300">Berberina + Cromo Picolinato + Acido Alfa Lipoico per migliorare sensibilità insulinica (perfetti prima di pasti abbondanti)</p>
            </div>
          </div>
        </div>
      `,
      textAlign: 'center',
      maxWidth: 'max-w-5xl',
      backgroundColor: 'bg-slate-900',
      padding: 'py-16',
    }
  },
  
  // 9. MENTALITÀ
  {
    id: generateBlockId('text'),
    type: 'text',
    name: 'Mentalità',
    settings: {
      variant: 'standard',
      content: `
        <div class="text-center max-w-4xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-8">🧠 Mentalità Invernale Vincente</h2>
          
          <div class="space-y-4 mb-8">
            <p class="text-xl text-slate-300">Chi resta in forma in inverno:</p>
            <div class="flex flex-col md:flex-row justify-center gap-4">
              <div class="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-6 py-3">
                <p class="text-cyan-400 font-semibold">❌ NON cerca motivazione</p>
              </div>
              <div class="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-6 py-3">
                <p class="text-cyan-400 font-semibold">✅ Segue una STRUTTURA</p>
              </div>
              <div class="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-6 py-3">
                <p class="text-cyan-400 font-semibold">✅ Accetta l'imperfezione</p>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-8">
            <p class="text-slate-300 text-lg mb-4">L'inverno non serve per dimagrire a tutti i costi.</p>
            <p class="text-white text-xl font-semibold mb-4">Serve per NON DISTRUGGERE ciò che hai costruito.</p>
            <p class="text-amber-400 text-2xl font-bold">Chi vince l'inverno, vince l'estate. 🏆</p>
          </div>
        </div>
      `,
      textAlign: 'center',
      maxWidth: 'max-w-5xl',
      backgroundColor: 'bg-slate-800',
      padding: 'py-16',
    }
  },
  
  // 10. FINAL CTA
  {
    id: generateBlockId('cta'),
    type: 'cta',
    name: 'Final CTA',
    settings: {
      variant: 'centered',
      title: 'Scarica GRATIS il Protocollo Inverno',
      subtitle: 'Digiuno strategico, 3 routine di allenamento, integrazione, strategia feste. Tutto in una guida pratica da applicare SUBITO.',
      ctaText: 'Scarica il Protocollo GRATIS',
      ctaAction: 'form_popup',
      ctaLink: '#form',
      showSecondaryButton: false,
      backgroundType: 'gradient',
      backgroundGradient: 'from-sky-600 to-cyan-500',
      buttonStyle: 'gradient',
      animation: 'pulse',
      spacing: 'py-24',
      showStats: true,
      stats: [
        { value: '🎁', label: '100% Gratuito' },
        { value: '📧', label: 'Via Email Istantanea' },
        { value: '© MentalFit', label: 'by Biondo Fitness Coach' },
      ],
      // Form popup
      formPopupTitle: 'Ricevi il Protocollo Inverno',
      formPopupSubtitle: 'Inserisci i tuoi dati per ricevere subito la guida completa',
      formPopupFields: 'name,email',
      formPopupSubmitText: 'Scarica GRATIS',
      formPopupSuccessMessage: '🎉 Perfetto! Controlla la tua email per scaricare il Protocollo Inverno!',
      formPopupAfterSubmit: 'message',
    }
  },
];

async function updateLandingPage() {
  try {
    console.log('🚀 Aggiornamento contenuti landing page Protocollo Inverno...\n');
    
    // Trova la landing page
    const snapshot = await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('landing_pages')
      .where('slug', '==', 'protocollo-inverno')
      .get();
    
    if (snapshot.empty) {
      console.log('⚠️  Landing page non trovata');
      process.exit(1);
    }
    
    const doc = snapshot.docs[0];
    
    // Aggiorna con i nuovi blocchi
    await doc.ref.update({
      blocks: UPDATED_BLOCKS,
      title: 'Protocollo Inverno - Guida Completa',
      description: 'Come gestire al meglio l\'inverno e le feste senza perdere la forma. Digiuno strategico, allenamenti, integrazione.',
      'settings.seo.title': 'Protocollo Inverno - Gestisci le Feste Senza Perdere la Forma | MentalFit',
      'settings.seo.description': 'Scarica GRATIS il Protocollo Inverno: digiuno strategico 16/8, 3 routine di allenamento, integrazione e mentalità vincente. By Biondo Fitness Coach.',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Landing page aggiornata con successo!\n');
    
    console.log('📋 Nuovi contenuti:');
    console.log('   • Hero: "Come Gestire al Meglio l\'Inverno Senza Perdere la Forma"');
    console.log('   • 6 benefici dettagliati (digiuno, schema giornata, feste, allenamenti, integrazione, mentalità)');
    console.log('   • Pain points realistici');
    console.log('   • Strategia alimentare anti-grasso');
    console.log('   • 3 routine allenamento (Forza, HIIT, Mobilità)');
    console.log('   • Sezione integrazione (Vitamina C, Berberina, Cromo, ALA)');
    console.log('   • Mentalità vincente ("Chi vince l\'inverno, vince l\'estate")');
    
    console.log('\n🎉 Fatto!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

updateLandingPage();
