/**
 * Landing Page Blocks & Templates Configuration
 * Separato per ottimizzare il caricamento (lazy loading)
 */

// ==================== BLOCCHI DEFAULT ====================

export const DEFAULT_BLOCKS = {
  hero: {
    type: 'hero',
    name: 'Hero Section',
    icon: '🚀',
    settings: {
      variant: 'centered',
      title: 'Trasforma il tuo corpo in 90 giorni',
      subtitle: 'Il metodo scientifico per risultati duraturi',
      ctaText: 'Inizia Ora',
      ctaLink: '#form',
      secondaryCtaText: 'Scopri di più',
      secondaryCtaLink: '#features',
      backgroundType: 'gradient',
      backgroundGradient: 'from-slate-900 via-sky-900 to-slate-900',
      backgroundImage: '',
      backgroundVideo: '',
      overlay: true,
      overlayOpacity: 50,
      textAlign: 'center',
      minHeight: '90vh',
      showBadge: true,
      badgeText: '🔥 Offerta Limitata',
    }
  },
  features: {
    type: 'features',
    name: 'Features Grid',
    icon: '✨',
    settings: {
      variant: 'grid',
      title: 'Perché scegliere noi',
      subtitle: 'Tutto ciò che serve per il tuo successo',
      columns: 3,
      items: [
        { icon: '🎯', title: 'Piano Personalizzato', description: 'Programma creato su misura per i tuoi obiettivi' },
        { icon: '📱', title: 'App Dedicata', description: 'Monitora i progressi ovunque tu sia' },
        { icon: '💬', title: 'Supporto 24/7', description: 'Il tuo coach sempre disponibile via chat' },
        { icon: '📊', title: 'Analisi Avanzate', description: 'Dati e statistiche per ottimizzare i risultati' },
        { icon: '🍎', title: 'Piano Alimentare', description: 'Nutrizione bilanciata e gustosa' },
        { icon: '🏆', title: 'Risultati Garantiti', description: 'O ti rimborsiamo al 100%' },
      ],
      backgroundColor: 'bg-slate-900',
      cardStyle: 'glass',
    }
  },
  testimonials: {
    type: 'testimonials',
    name: 'Testimonials',
    icon: '⭐',
    settings: {
      variant: 'carousel',
      title: 'Cosa dicono i nostri clienti',
      subtitle: 'Storie di trasformazione reali',
      items: [
        { name: 'Marco R.', role: 'Imprenditore', image: '', rating: 5, text: 'Ho perso 15kg in 3 mesi seguendo il programma. Il supporto del coach è stato fondamentale.', beforeAfter: false },
        { name: 'Laura B.', role: 'Manager', image: '', rating: 5, text: 'Finalmente un approccio che funziona! Mi sento più energica e sicura di me.', beforeAfter: false },
        { name: 'Andrea M.', role: 'Avvocato', image: '', rating: 5, text: 'Professionalità e competenza. I risultati parlano da soli.', beforeAfter: false },
      ],
      showRating: true,
      autoplay: true,
      backgroundColor: 'bg-slate-800',
    }
  },
  pricing: {
    type: 'pricing',
    name: 'Pricing Table',
    icon: '💰',
    settings: {
      variant: 'cards',
      title: 'Scegli il tuo piano',
      subtitle: 'Investi nel tuo benessere',
      items: [
        { name: 'Starter', price: '99', currency: '€', period: '/mese', description: 'Perfetto per iniziare', features: ['Piano allenamento base', 'Check settimanale', 'Accesso app'], highlighted: false, ctaText: 'Scegli Starter', ctaLink: '#form' },
        { name: 'Pro', price: '199', currency: '€', period: '/mese', description: 'Il più popolare', features: ['Piano allenamento avanzato', 'Piano alimentare', 'Check bi-settimanale', 'Chat diretta col coach', 'Video analisi'], highlighted: true, badge: 'Più Scelto', ctaText: 'Scegli Pro', ctaLink: '#form' },
        { name: 'Elite', price: '349', currency: '€', period: '/mese', description: 'Supporto totale', features: ['Tutto di Pro', 'Videochiamate settimanali', 'Supporto prioritario', 'Piani personalizzati illimitati'], highlighted: false, ctaText: 'Scegli Elite', ctaLink: '#form' }
      ],
      showComparison: false,
      backgroundColor: 'bg-slate-900',
    }
  },
  cta: {
    type: 'cta',
    name: 'Call to Action',
    icon: '🎯',
    settings: {
      variant: 'centered',
      title: 'Pronto a cambiare la tua vita?',
      subtitle: 'Unisciti a oltre 500 persone che hanno già trasformato il loro corpo',
      // Pulsante principale
      ctaText: 'Prenota una Consulenza Gratuita',
      ctaAction: 'scroll', // 'scroll' | 'redirect' | 'popup' | 'whatsapp' | 'calendly' | 'phone'
      ctaLink: '#form',
      ctaRedirectUrl: '',
      ctaWhatsappNumber: '',
      ctaWhatsappMessage: '',
      ctaCalendlyUrl: '',
      ctaPhoneNumber: '',
      // Pulsante secondario
      showSecondaryButton: false,
      secondaryText: 'Scopri i piani',
      secondaryAction: 'scroll',
      secondaryLink: '#pricing',
      secondaryRedirectUrl: '',
      // Stile
      backgroundType: 'gradient',
      backgroundGradient: 'from-sky-600 to-cyan-500',
      backgroundImage: '',
      buttonStyle: 'gradient',
      secondaryButtonStyle: 'outline',
      animation: 'fadeIn',
      spacing: 'py-24',
      // Stats
      showStats: true,
      stats: [
        { value: '500+', label: 'Clienti Soddisfatti' },
        { value: '15kg', label: 'Persi in Media' },
        { value: '98%', label: 'Tasso di Successo' },
      ]
    }
  },
  form: {
    type: 'form',
    name: 'Contact Form',
    icon: '📝',
    settings: {
      variant: 'standard',
      title: 'Richiedi Informazioni',
      subtitle: 'Compila il form e ti ricontatteremo entro 24 ore',
      fields: [
        { id: 'name', type: 'text', label: 'Nome e Cognome', placeholder: 'Mario Rossi', required: true },
        { id: 'email', type: 'email', label: 'Email', placeholder: 'mario@email.com', required: true },
        { id: 'phone', type: 'tel', label: 'Telefono', placeholder: '+39 333 1234567', required: true },
        { id: 'goal', type: 'select', label: 'Il tuo obiettivo', placeholder: 'Seleziona...', required: true, options: ['Perdere peso', 'Aumentare massa muscolare', 'Tonificare', 'Migliorare performance', 'Altro'] },
        { id: 'message', type: 'textarea', label: 'Messaggio (opzionale)', placeholder: 'Raccontaci di te...', required: false },
      ],
      submitText: 'Invia Richiesta',
      // Azione dopo submit
      afterSubmitAction: 'message', // 'message' | 'redirect' | 'popup' | 'whatsapp' | 'calendly'
      successMessage: 'Grazie! Ti contatteremo presto.',
      redirectUrl: '',
      redirectDelay: 2, // secondi prima del redirect
      popupTitle: 'Grazie per averci contattato!',
      popupContent: 'Ti contatteremo entro 24 ore.',
      popupCtaText: 'Chiudi',
      whatsappNumber: '',
      whatsappMessage: 'Ciao! Ho compilato il form sulla landing page.',
      calendlyUrl: '',
      // Privacy e stile
      privacyText: 'Inviando accetti la nostra Privacy Policy',
      privacyLink: '/privacy',
      backgroundColor: 'bg-slate-800',
      showImage: true,
      imagePosition: 'right',
      imageSrc: '',
      // Lead management
      saveToLeads: true,
      leadSource: 'landing_page',
      leadTags: [],
      sendNotification: true,
      notificationEmail: '',
      // Stile avanzato
      buttonStyle: 'gradient',
      animation: 'fadeIn',
      spacing: 'py-16',
    }
  },
  faq: {
    type: 'faq',
    name: 'FAQ Accordion',
    icon: '❓',
    settings: {
      variant: 'accordion',
      title: 'Domande Frequenti',
      subtitle: 'Trova le risposte alle tue domande',
      items: [
        { question: 'Come funziona il programma?', answer: 'Dopo una consulenza iniziale, creiamo un piano personalizzato che include allenamento, nutrizione e supporto continuo.' },
        { question: 'Quanto tempo ci vuole per vedere risultati?', answer: 'I primi risultati sono visibili già dopo 2-3 settimane. Risultati significativi in 8-12 settimane.' },
        { question: 'Posso allenarmi da casa?', answer: 'Assolutamente sì! Creiamo piani adattati al tuo ambiente, che sia palestra o casa.' },
        { question: 'Come funziona il supporto del coach?', answer: 'Hai accesso diretto via chat e video chiamate settimanali per monitorare i progressi.' },
        { question: 'Cosa succede se non vedo risultati?', answer: 'Offriamo una garanzia soddisfatti o rimborsati entro 30 giorni.' },
      ],
      openFirst: true,
      backgroundColor: 'bg-slate-900',
    }
  },
  countdown: {
    type: 'countdown',
    name: 'Countdown Timer',
    icon: '⏰',
    settings: {
      variant: 'banner',
      title: "L'offerta scade tra:",
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      expiredMessage: 'Offerta scaduta!',
      backgroundColor: 'bg-gradient-to-r from-red-600 to-orange-500',
      sticky: false,
    }
  },
  gallery: {
    type: 'gallery',
    name: 'Image Gallery',
    icon: '🖼️',
    settings: {
      variant: 'grid',
      title: 'Trasformazioni Reali',
      subtitle: 'I risultati dei nostri clienti',
      columns: 3,
      items: [],
      showCaptions: true,
      lightbox: true,
      backgroundColor: 'bg-slate-900',
    }
  },
  video: {
    type: 'video',
    name: 'Video Section',
    icon: '🎬',
    settings: {
      variant: 'featured',
      title: 'Guarda il metodo in azione',
      subtitle: '',
      videoUrl: '',
      thumbnailUrl: '',
      autoplay: false,
      muted: true,
      loop: false,
      showControls: true,
      aspectRatio: '16/9',
      backgroundColor: 'bg-slate-800',
    }
  },
  text: {
    type: 'text',
    name: 'Text Content',
    icon: '📄',
    settings: {
      variant: 'standard',
      content: '<h2>Il tuo titolo qui</h2><p>Il tuo contenuto qui...</p>',
      textAlign: 'left',
      maxWidth: 'max-w-4xl',
      backgroundColor: 'bg-transparent',
      padding: 'py-12',
    }
  },
  divider: {
    type: 'divider',
    name: 'Divider',
    icon: '➖',
    settings: {
      variant: 'line',
      color: 'border-slate-700',
      margin: 'my-8',
    }
  },
  socialProof: {
    type: 'socialProof',
    name: 'Social Proof',
    icon: '📣',
    settings: {
      variant: 'logos',
      title: 'Come visto su',
      items: [
        { type: 'stat', value: '500+', label: 'Clienti Attivi' },
        { type: 'stat', value: '4.9/5', label: 'Valutazione Media' },
        { type: 'stat', value: '15kg', label: 'Persi in Media' },
      ],
      logos: [],
      backgroundColor: 'bg-slate-800/50',
    }
  },
};

// ==================== TEMPLATE LANDING PAGES ====================

export const LANDING_TEMPLATES = {
  fitness: {
    id: 'fitness',
    name: 'Fitness Transformation',
    description: 'Landing page per programmi di trasformazione fisica',
    thumbnail: '/templates/fitness-thumb.jpg',
    blocks: [
      { ...DEFAULT_BLOCKS.hero, id: 'hero-1' },
      { ...DEFAULT_BLOCKS.socialProof, id: 'social-1' },
      { ...DEFAULT_BLOCKS.features, id: 'features-1' },
      { ...DEFAULT_BLOCKS.testimonials, id: 'testimonials-1' },
      { ...DEFAULT_BLOCKS.pricing, id: 'pricing-1' },
      { ...DEFAULT_BLOCKS.faq, id: 'faq-1' },
      { ...DEFAULT_BLOCKS.cta, id: 'cta-1' },
      { ...DEFAULT_BLOCKS.form, id: 'form-1' },
    ]
  },
  coaching: {
    id: 'coaching',
    name: 'Personal Coaching',
    description: 'Per servizi di coaching online 1:1',
    thumbnail: '/templates/coaching-thumb.jpg',
    blocks: [
      { ...DEFAULT_BLOCKS.hero, id: 'hero-1', settings: { ...DEFAULT_BLOCKS.hero.settings, variant: 'split' } },
      { ...DEFAULT_BLOCKS.features, id: 'features-1', settings: { ...DEFAULT_BLOCKS.features.settings, columns: 2 } },
      { ...DEFAULT_BLOCKS.video, id: 'video-1' },
      { ...DEFAULT_BLOCKS.testimonials, id: 'testimonials-1' },
      { ...DEFAULT_BLOCKS.cta, id: 'cta-1' },
      { ...DEFAULT_BLOCKS.form, id: 'form-1' },
    ]
  },
  promo: {
    id: 'promo',
    name: 'Promo / Offerta',
    description: 'Landing page per promozioni a tempo limitato',
    thumbnail: '/templates/promo-thumb.jpg',
    blocks: [
      { ...DEFAULT_BLOCKS.countdown, id: 'countdown-1', settings: { ...DEFAULT_BLOCKS.countdown.settings, sticky: true } },
      { ...DEFAULT_BLOCKS.hero, id: 'hero-1' },
      { ...DEFAULT_BLOCKS.features, id: 'features-1' },
      { ...DEFAULT_BLOCKS.pricing, id: 'pricing-1' },
      { ...DEFAULT_BLOCKS.countdown, id: 'countdown-2' },
      { ...DEFAULT_BLOCKS.form, id: 'form-1' },
    ]
  },
  leadMagnet: {
    id: 'leadMagnet',
    name: 'Lead Magnet',
    description: 'Per download di guide gratuite e lead generation',
    thumbnail: '/templates/lead-thumb.jpg',
    blocks: [
      { ...DEFAULT_BLOCKS.hero, id: 'hero-1', settings: { ...DEFAULT_BLOCKS.hero.settings, title: 'Scarica la Guida Gratuita', subtitle: '10 segreti per trasformare il tuo corpo', ctaText: 'Scarica Ora', minHeight: '70vh' }},
      { ...DEFAULT_BLOCKS.features, id: 'features-1', settings: { ...DEFAULT_BLOCKS.features.settings, title: 'Cosa imparerai', columns: 2 }},
      { ...DEFAULT_BLOCKS.form, id: 'form-1', settings: { ...DEFAULT_BLOCKS.form.settings, title: 'Ricevi la guida via email', fields: [
        { id: 'name', type: 'text', label: 'Nome', placeholder: 'Il tuo nome', required: true },
        { id: 'email', type: 'email', label: 'Email', placeholder: 'La tua email', required: true },
      ]}},
    ]
  },
  blank: {
    id: 'blank',
    name: 'Pagina Vuota',
    description: 'Inizia da zero con una pagina vuota',
    thumbnail: '/templates/blank-thumb.jpg',
    blocks: []
  }
};

// Versione light dei template per la lista (senza i blocchi completi)
export const LANDING_TEMPLATES_LIGHT = {
  fitness: { id: 'fitness', name: 'Fitness Transformation', description: 'Landing page per programmi di trasformazione fisica', preview: '🏋️', blockTypes: ['hero', 'socialProof', 'features', 'testimonials', 'pricing', 'faq', 'cta', 'form'] },
  coaching: { id: 'coaching', name: 'Personal Coaching', description: 'Per servizi di coaching online 1:1', preview: '👨‍🏫', blockTypes: ['hero', 'features', 'video', 'testimonials', 'cta', 'form'] },
  promo: { id: 'promo', name: 'Promo / Offerta', description: 'Landing page per promozioni a tempo limitato', preview: '🔥', blockTypes: ['countdown', 'hero', 'features', 'pricing', 'countdown', 'form'] },
  leadMagnet: { id: 'leadMagnet', name: 'Lead Magnet', description: 'Per download di guide gratuite e lead generation', preview: '📚', blockTypes: ['hero', 'features', 'form'] },
  blank: { id: 'blank', name: 'Pagina Vuota', description: 'Inizia da zero con una pagina vuota', preview: '📄', blockTypes: [] },
};

/**
 * Genera un ID univoco per i blocchi
 */
export const generateBlockId = (type) => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Crea un nuovo blocco con ID univoco
 */
export const createBlock = (type) => {
  const template = DEFAULT_BLOCKS[type];
  if (!template) {
    throw new Error(`Tipo blocco non valido: ${type}`);
  }
  
  return {
    ...JSON.parse(JSON.stringify(template)),
    id: generateBlockId(type),
  };
};
