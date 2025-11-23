#!/usr/bin/env node

/**
 * Script per configurare la landing page personalizzata per ogni tenant
 * 
 * Uso: node scripts/setup-landing-config.cjs [tenantId]
 * 
 * Se non specifichi il tenantId, userà quello dal .env
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

const defaultLandingConfig = {
  hero: {
    title: "Trasforma il Tuo Business Fitness",
    subtitle: "La piattaforma all-in-one per personal trainer che vogliono crescere e gestire i propri clienti professionalmente",
    ctaPrimary: "Inizia Gratis",
    ctaSecondary: "Guarda Demo",
    backgroundImage: null,
    showStats: true,
    stats: [
      { value: "500+", label: "Personal Trainer" },
      { value: "10K+", label: "Clienti Attivi" },
      { value: "98%", label: "Soddisfazione" }
    ]
  },
  features: [
    {
      icon: "users",
      title: "Gestione Clienti",
      description: "Database completo con anamnesi, schede e progressi. Tutto in un unico posto."
    },
    {
      icon: "calendar",
      title: "Calendario Intelligente",
      description: "Prenota appuntamenti, gestisci sessioni e sincronizza tutto il tuo workflow."
    },
    {
      icon: "chart",
      title: "Analytics Avanzate",
      description: "Monitora le performance del tuo business con dashboard e report dettagliati."
    },
    {
      icon: "message",
      title: "Chat in Real-Time",
      description: "Comunica con i tuoi clienti direttamente dalla piattaforma, sempre connesso."
    },
    {
      icon: "target",
      title: "Schede Personalizzate",
      description: "Crea programmi di allenamento e alimentazione su misura per ogni cliente."
    },
    {
      icon: "zap",
      title: "Automazioni",
      description: "Automatizza promemoria, follow-up e comunicazioni per risparmiare tempo."
    }
  ],
  pricing: {
    plans: [
      {
        name: "Starter",
        price: "29",
        period: "/mese",
        description: "Perfetto per iniziare",
        features: [
          "Fino a 20 clienti",
          "Calendario base",
          "Chat illimitata",
          "Schede allenamento",
          "App mobile",
          "Supporto email"
        ],
        highlighted: false
      },
      {
        name: "Professional",
        price: "79",
        period: "/mese",
        description: "Per professionisti in crescita",
        features: [
          "Clienti illimitati",
          "Calendario avanzato",
          "Chat + videochiamate",
          "Schede personalizzate",
          "Analytics complete",
          "Automazioni",
          "Branding personalizzato",
          "Supporto prioritario"
        ],
        highlighted: true
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Per team e palestre",
        features: [
          "Tutto di Professional",
          "Multi-trainer",
          "API personalizzate",
          "White-label completo",
          "Dominio custom",
          "Account manager dedicato",
          "Training on-site"
        ],
        highlighted: false
      }
    ]
  },
  testimonials: [
    {
      name: "Marco Rossi",
      role: "Personal Trainer",
      avatar: null,
      rating: 5,
      text: "FitFlow ha rivoluzionato il mio modo di lavorare. Risparmio 10 ore a settimana e i miei clienti sono più soddisfatti."
    },
    {
      name: "Sara Bianchi",
      role: "Fitness Coach",
      avatar: null,
      rating: 5,
      text: "Finalmente una piattaforma che capisce le esigenze dei personal trainer. Intuitiva e potentissima!"
    },
    {
      name: "Luca Verdi",
      role: "Studio Owner",
      avatar: null,
      rating: 5,
      text: "Gestiamo 5 trainer e 150+ clienti senza problemi. Il ROI è stato immediato."
    }
  ],
  cta: {
    title: "Pronto a Trasformare il Tuo Business?",
    subtitle: "Unisciti a centinaia di professionisti che stanno crescendo con FitFlow",
    buttonText: "Inizia Ora - È Gratis"
  },
  branding: {
    logoUrl: "/logo192.PNG",
    appName: "FitFlow",
    primaryColor: "#3b82f6",
    accentColor: "#60a5fa"
  },
  seo: {
    title: "FitFlow - Piattaforma per Personal Trainer",
    description: "La piattaforma all-in-one per personal trainer che vogliono crescere e gestire i propri clienti professionalmente",
    keywords: "personal trainer, fitness, gestione clienti, schede allenamento, nutrizione"
  },
  customDomain: null, // Per il piano Enterprise
  enabled: true
};

async function setupLandingConfig(tenantId) {
  try {
    console.log(`\n🚀 Configurazione landing page per tenant: ${tenantId}\n`);

    // Genera uno slug di default dal tenantId
    const defaultSlug = tenantId.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Salva lo slug nel documento tenant principale
    await db.collection('tenants')
      .doc(tenantId)
      .set({ siteSlug: defaultSlug }, { merge: true });

    // Aggiungi lo slug alla configurazione landing
    const landingConfigWithSlug = {
      ...defaultLandingConfig,
      siteSlug: defaultSlug
    };

    // Salva la configurazione in Firestore
    await db.collection('tenants')
      .doc(tenantId)
      .collection('settings')
      .doc('landing')
      .set(landingConfigWithSlug, { merge: true });

    console.log('✅ Configurazione landing page salvata con successo!');
    console.log('\n📝 Puoi personalizzare la landing da:');
    console.log('   Firestore > tenants > ' + tenantId + ' > settings > landing');
    console.log('   Oppure dall\'app: Impostazioni > Sito Web');
    console.log('\n🎨 Campi personalizzabili:');
    console.log('   - Generale: slug, logo, colori, dominio custom');
    console.log('   - Hero: title, subtitle, CTA, stats');
    console.log('   - Features: aggiungi/rimuovi feature');
    console.log('   - Pricing: modifica prezzi e features');
    console.log('   - Testimonials: aggiungi recensioni');
    console.log('   - Contatti: email, telefono, indirizzo, social');
    console.log('\n✨ La landing è accessibile su:');
    console.log('   https://flowfitpro.it/site/' + defaultSlug);
    console.log('   https://flowfitpro.it/site (landing principale)\n');
    
  } catch (error) {
    console.error('❌ Errore durante la configurazione:', error);
    process.exit(1);
  }
}

// Esegui lo script
const tenantId = process.argv[2] || 'mentalfit-default';
setupLandingConfig(tenantId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
