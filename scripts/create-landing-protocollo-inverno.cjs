/**
 * Script per creare la Landing Page "Protocollo Inverno"
 * per il tenant biondo-fitness-coach
 * 
 * Eseguire con: node scripts/create-landing-protocollo-inverno.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Inizializza Firebase Admin
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

// Landing Page Protocollo Inverno
const landingPageData = {
  title: 'Protocollo Inverno',
  slug: 'protocollo-inverno',
  description: 'Scarica GRATIS il Protocollo Inverno - Goditi le feste senza ingrassare',
  isPublished: true,
  status: 'published',
  template: 'leadMagnet',
  
  blocks: [
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
          { type: 'stat', value: '0 kg', label: 'Messi Durante le Feste' },
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
        title: 'Sei stufo di affrontare gennaio con il rimpianto dei chili accumulati durante le feste?',
        subtitle: 'Dimentica per sempre i danni delle abbuffate natalizie e il gonfiore che ti appesantisce con il Protocollo Inverno.',
        ctaText: 'Scarica GRATIS il Protocollo Inverno',
        ctaAction: 'popup',
        ctaLink: '#form',
        secondaryCtaText: 'Scopri di più',
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
        badgeText: '🎄 Speciale Feste 2025',
      }
    },
    
    // 3. BENEFITS SECTION
    {
      id: generateBlockId('features'),
      type: 'features',
      name: 'Features Grid',
      settings: {
        variant: 'grid',
        title: 'Cosa otterrai con il Protocollo Inverno',
        subtitle: 'Scopri come trasformare le feste in un periodo neutro (o persino positivo) per la tua forma fisica',
        columns: 3,
        items: [
          { 
            icon: '📖', 
            title: 'Guida Pratica Completa', 
            description: 'Scopri tutto quello che devi sapere per goderti pandori, cenoni, aperitivi e brindisi senza pagare un conto salato sulla bilancia.' 
          },
          { 
            icon: '🎯', 
            title: 'Sistema Testato', 
            description: 'Un metodo che ha già permesso a centinaia di persone di passare Natale e Capodanno senza ingrassare un etto.' 
          },
          { 
            icon: '⚡', 
            title: 'Strategie Pratiche', 
            description: 'Trucchi per limitare i danni dell\'alcol, mini-sessioni di movimento, gestione furba degli avanzi e dei dolci.' 
          },
          { 
            icon: '🧠', 
            title: 'Metodo Scientifico', 
            description: 'Impara a neutralizzare gli eccessi in tempo reale, senza ossessioni caloriche e senza sensi di colpa.' 
          },
          { 
            icon: '🍰', 
            title: 'Zero Privazioni', 
            description: 'Gustati il torrone, i tortellini in brodo e lo spumante, sapendo di avere il controllo totale sul risultato finale.' 
          },
          { 
            icon: '🚀', 
            title: 'Inizia il 2026 al Top', 
            description: 'Arriva a gennaio leggero, motivato e con l\'energia al massimo invece di dover "recuperare" per settimane.' 
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
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-8">Conosci perfettamente quella scena...</h2>
            
            <div class="grid md:grid-cols-2 gap-6 text-left mb-12">
              <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <p class="text-red-400 text-lg">😤 Arriva l'Epifania, ti guardi allo specchio… la pancia è più gonfia del solito, i vestiti tirano, la bilancia ti fa arrabbiare.</p>
              </div>
              <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <p class="text-red-400 text-lg">😫 Ti senti pesante, pigro, quasi in colpa per aver "sgarrato troppo".</p>
              </div>
              <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <p class="text-red-400 text-lg">😩 L'idea di tornare in palestra ti sembra un'impresa, e i buoni propositi durano pochissimo.</p>
              </div>
              <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <p class="text-red-400 text-lg">🤔 Quante volte hai pensato: "Bastava un po' più di controllo… ma come si fa con tutte quelle tentazioni?"</p>
              </div>
            </div>
            
            <p class="text-slate-300 text-xl mb-6">Non sei solo. Milioni di persone si allenano e mangiano bene tutto l'anno, ma dicembre arriva come una valanga: pranzi infiniti, dolci ovunque, alcol a fiumi, zero orari.</p>
            
            <p class="text-cyan-400 text-xl font-semibold">Noi del Team MentalFit sappiamo esattamente dove si inceppa il meccanismo e, soprattutto, come aggirarlo senza trasformare le feste in un periodo di privazioni.</p>
          </div>
        `,
        textAlign: 'center',
        maxWidth: 'max-w-6xl',
        backgroundColor: 'bg-slate-800',
        padding: 'py-16',
      }
    },
    
    // 5. SOLUTION CTA
    {
      id: generateBlockId('cta'),
      type: 'cta',
      name: 'Solution CTA',
      settings: {
        variant: 'centered',
        title: 'Il sistema perfetto per chi non vuole scegliere tra feste e forma fisica',
        subtitle: 'Ti alleni con costanza? Segui un\'alimentazione sana 11 mesi su 12? Hai già giurato "quest\'anno mi controllo"… per poi cedere comunque? Allora il Protocollo Inverno è fatto apposta per te.',
        ctaText: 'Voglio il Protocollo Inverno',
        ctaAction: 'popup',
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
          { value: 'Peso stabile', label: 'o in calo a gennaio' },
          { value: 'Energia costante', label: 'durante tutte le feste' },
          { value: 'Zero sensi', label: 'di colpa' },
        ]
      }
    },
    
    // 6. WHAT'S INSIDE
    {
      id: generateBlockId('features'),
      type: 'features',
      name: 'What\'s Inside',
      settings: {
        variant: 'list',
        title: 'Cosa trovi nella guida?',
        subtitle: 'Risultati veri anche nel mese più difficile dell\'anno - quei classici "+3/4 kg" diventeranno solo un ricordo del passato.',
        columns: 2,
        items: [
          { 
            icon: '📋', 
            title: 'Strategia Sequenza Portate', 
            description: 'Scopri l\'ordine intelligente in cui mangiare per minimizzare l\'impatto calorico.' 
          },
          { 
            icon: '🍷', 
            title: 'Trucchi Anti-Alcol', 
            description: 'Come limitare i danni dell\'alcol senza rinunciare ai brindisi.' 
          },
          { 
            icon: '🏃', 
            title: 'Mini-Sessioni Ovunque', 
            description: 'Movimenti rapidi da fare anche a casa della suocera.' 
          },
          { 
            icon: '🍽️', 
            title: 'Gestione Avanzi Furba', 
            description: 'Cosa fare con tutti quei dolci che ti regalano.' 
          },
          { 
            icon: '⚖️', 
            title: 'Pre-Cenone Strategy', 
            description: 'Cosa mangiare PRIMA dei cenoni per arrivare preparato.' 
          },
          { 
            icon: '🔄', 
            title: 'Recovery Day Protocol', 
            description: 'Come compensare il giorno dopo senza digiuni estremi.' 
          },
        ],
        backgroundColor: 'bg-slate-900',
        cardStyle: 'bordered',
      }
    },
    
    // 7. DIFFERENZIAZIONE
    {
      id: generateBlockId('text'),
      type: 'text',
      name: 'Differenziazione',
      settings: {
        variant: 'standard',
        content: `
          <div class="text-center max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">Non è il solito "consiglio da social"</h2>
            
            <p class="text-xl text-slate-300 mb-6">Niente frasi fatte tipo "mangia piano e bevi acqua" o diete restrittive che crollano al primo pandoro.</p>
            
            <p class="text-xl text-white font-semibold mb-8">Questo è un protocollo reale, pensato per persone come te: con vita vera, famiglia, impegni, voglia di festeggiare… ma anche l'obiettivo di rimanere in forma.</p>
            
            <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8 mb-8">
              <p class="text-amber-400 text-lg">⚠️ Le soluzioni generiche ("un po' di moderazione") non reggono 15-20 giorni di tentazioni continue.</p>
              <p class="text-white text-xl font-semibold mt-4">Ti servono strumenti precisi, potenti e flessibili per uscire dalle feste senza un graffio.</p>
            </div>
          </div>
        `,
        textAlign: 'center',
        maxWidth: 'max-w-5xl',
        backgroundColor: 'bg-slate-800',
        padding: 'py-16',
      }
    },
    
    // 8. CTA INTERMEDIO
    {
      id: generateBlockId('cta'),
      type: 'cta',
      name: 'CTA Intermedio',
      settings: {
        variant: 'simple',
        title: 'Non è inevitabile ingrassare a Natale',
        subtitle: 'Se pensi che "alle feste si mette su peso per forza" o "tanto poi recupero", stai cadendo nella trappola più comune.',
        ctaText: 'Sì, voglio il Protocollo Inverno',
        ctaAction: 'popup',
        ctaLink: '#form',
        showSecondaryButton: false,
        backgroundType: 'gradient',
        backgroundGradient: 'from-emerald-600 to-teal-600',
        buttonStyle: 'solid',
        spacing: 'py-16',
        showStats: false,
      }
    },
    
    // 9. SOCIAL PROOF / RISULTATI
    {
      id: generateBlockId('text'),
      type: 'text',
      name: 'Risultati',
      settings: {
        variant: 'standard',
        content: `
          <div class="text-center max-w-4xl mx-auto">
            <p class="text-xl text-slate-300 mb-6">Ho accompagnato tantissime persone nella tua identica situazione:</p>
            
            <p class="text-lg text-slate-400 mb-8">Lavoro intenso fino all'ultimo, riunioni familiari interminabili, dolci regalati da ogni parte… eppure hanno chiuso dicembre con il peso stabile o in calo, e zero gonfiore.</p>
            
            <p class="text-cyan-400 text-xl font-semibold mb-8">E senza sacrifici assurdi: solo mosse intelligenti al momento giusto.</p>
            
            <h3 class="text-2xl font-bold text-white mb-6">Puoi ottenerlo anche tu:</h3>
            
            <div class="grid md:grid-cols-4 gap-4 mb-8">
              <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p class="text-emerald-400 font-semibold">✅ Forma mantenuta</p>
              </div>
              <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p class="text-emerald-400 font-semibold">✅ Energia alta</p>
              </div>
              <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p class="text-emerald-400 font-semibold">✅ Vestiti che calzano</p>
              </div>
              <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p class="text-emerald-400 font-semibold">✅ Motivazione 2026</p>
              </div>
            </div>
            
            <p class="text-xl text-white font-bold">Prima scarichi il Protocollo Inverno, prima smetti di temere dicembre.</p>
          </div>
        `,
        textAlign: 'center',
        maxWidth: 'max-w-5xl',
        backgroundColor: 'bg-slate-900',
        padding: 'py-16',
      }
    },
    
    // 10. FINAL CTA + FORM (popup trigger)
    {
      id: generateBlockId('cta'),
      type: 'cta',
      name: 'Final CTA',
      settings: {
        variant: 'centered',
        title: 'Scarica GRATIS il Protocollo Inverno',
        subtitle: 'È arrivato il momento di liberarti dalla frustrazione e iniziare il 2026 leggero, motivato e con l\'energia al massimo.',
        ctaText: 'Scarica GRATIS il Protocollo Inverno',
        ctaAction: 'popup',
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
          { value: '🔒', label: 'No Spam, Promesso' },
        ]
      }
    },
    
    // 11. FORM (per popup)
    {
      id: generateBlockId('form'),
      type: 'form',
      name: 'Lead Form',
      settings: {
        variant: 'popup',
        title: 'Ricevi il Protocollo Inverno',
        subtitle: 'Inserisci i tuoi dati e ricevi subito la guida gratuita nella tua casella email.',
        fields: [
          { id: 'name', type: 'text', label: 'Nome', placeholder: 'Il tuo nome', required: true },
          { id: 'email', type: 'email', label: 'Email', placeholder: 'La tua email', required: true },
          { id: 'phone', type: 'tel', label: 'WhatsApp (opzionale)', placeholder: '+39 333 1234567', required: false },
        ],
        submitText: 'Scarica il Protocollo GRATIS',
        afterSubmitAction: 'message',
        successMessage: '🎉 Perfetto! Controlla la tua email (anche spam) per scaricare il Protocollo Inverno!',
        redirectUrl: '',
        privacyText: 'Inviando accetti la nostra Privacy Policy. Non invieremo spam.',
        privacyLink: '/privacy',
        backgroundColor: 'bg-slate-800',
        showImage: false,
        saveToLeads: true,
        leadSource: 'protocollo_inverno',
        leadTags: ['lead_magnet', 'protocollo_inverno', 'feste_2025'],
        sendNotification: true,
        notificationEmail: '',
        buttonStyle: 'gradient',
        animation: 'fadeIn',
        spacing: 'py-8',
        isPopup: true,
      }
    },
  ],
  
  settings: {
    seo: {
      title: 'Protocollo Inverno - Goditi le Feste Senza Ingrassare | MentalFit',
      description: 'Scarica GRATIS il Protocollo Inverno: la guida pratica per passare Natale e Capodanno senza mettere su un etto. Sistema testato su centinaia di persone.',
      ogImage: '',
      keywords: ['protocollo inverno', 'dieta natale', 'non ingrassare feste', 'forma fisica natale', 'personal trainer'],
    },
    tracking: {
      facebookPixel: '',
      googleAnalytics: '',
      tiktokPixel: '',
      customScripts: '',
    },
    styles: {
      fontFamily: 'Inter',
      primaryColor: '#0ea5e9',
      secondaryColor: '#22d3ee',
      backgroundColor: '#0f172a',
      textColor: '#f8fafc',
    },
    general: {
      favicon: '',
      showPoweredBy: false,
      customDomain: '',
    },
    popup: {
      enabled: true,
      title: 'Ricevi il Protocollo Inverno',
      triggerOnCta: true,
    },
    exitIntent: {
      enabled: true,
      title: '⏰ Aspetta! Non perdere questa opportunità',
      message: 'Stai per andartene senza scaricare il Protocollo Inverno GRATIS?',
      ctaText: 'Sì, voglio la guida gratuita!',
      ctaLink: '#form',
    }
  },
  
  analytics: {
    views: 0,
    uniqueVisitors: 0,
    conversions: 0,
    conversionRate: 0,
  },
  
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  publishedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function createLandingPage() {
  try {
    console.log('🚀 Creazione Landing Page "Protocollo Inverno"...\n');
    
    // Verifica se esiste già
    const existingQuery = await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('landing_pages')
      .where('slug', '==', 'protocollo-inverno')
      .get();
    
    if (!existingQuery.empty) {
      console.log('⚠️  Una landing page con slug "protocollo-inverno" esiste già.');
      console.log('    Vuoi sovrascriverla? Eliminando quella esistente...\n');
      
      // Elimina quella esistente
      for (const doc of existingQuery.docs) {
        await doc.ref.delete();
        console.log(`   🗑️  Eliminata landing page esistente: ${doc.id}`);
      }
    }
    
    // Crea la nuova landing page
    const docRef = await db
      .collection('tenants')
      .doc(TENANT_ID)
      .collection('landing_pages')
      .add(landingPageData);
    
    console.log('✅ Landing Page creata con successo!');
    console.log(`   📄 ID: ${docRef.id}`);
    console.log(`   🔗 Slug: protocollo-inverno`);
    console.log(`   👤 Tenant: ${TENANT_ID}`);
    console.log(`\n🌐 URL Pubblico: /site/${TENANT_ID}/protocollo-inverno`);
    console.log('\n📝 La landing page è ora modificabile nel Landing Page Builder!');
    console.log('   Vai su: Admin → Landing Pages → Protocollo Inverno → Modifica\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

createLandingPage();
