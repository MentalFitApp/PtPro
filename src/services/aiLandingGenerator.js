import { getFunctions, httpsCallable } from 'firebase/functions';
import { DEFAULT_BLOCKS, generateBlockId } from '../config/landingBlocks';

const functions = getFunctions();

/**
 * AI Landing Page Generator Service
 * Genera contenuti per landing pages usando OpenAI
 */

// ==================== PROMPT TEMPLATES ====================

const SYSTEM_PROMPT = `Sei un esperto copywriter specializzato in landing pages ad alta conversione per personal trainer e professionisti del fitness.
Scrivi in italiano, con tono professionale ma coinvolgente.
Usa parole che creano urgenza e desiderio di agire.
Includi sempre benefici concreti e specifici.
Evita frasi generiche - sii specifico e persuasivo.`;

const LANDING_PAGE_PROMPT = (businessInfo, goal, target) => `
Crea una landing page completa per:
- Business: ${businessInfo}
- Obiettivo: ${goal}
- Target: ${target}

Genera i contenuti per ogni sezione in formato JSON con questa struttura:
{
  "hero": {
    "title": "Titolo principale (max 10 parole, impatto emotivo)",
    "subtitle": "Sottotitolo che amplifica il messaggio (max 20 parole)",
    "ctaText": "Testo del pulsante CTA (max 4 parole)",
    "badgeText": "Badge di urgenza (es: '🔥 Offerta Limitata')"
  },
  "features": {
    "title": "Titolo sezione features",
    "subtitle": "Sottotitolo features",
    "items": [
      { "icon": "emoji appropriato", "title": "Feature 1", "description": "Descrizione benefit" },
      { "icon": "emoji", "title": "Feature 2", "description": "Descrizione" },
      { "icon": "emoji", "title": "Feature 3", "description": "Descrizione" },
      { "icon": "emoji", "title": "Feature 4", "description": "Descrizione" },
      { "icon": "emoji", "title": "Feature 5", "description": "Descrizione" },
      { "icon": "emoji", "title": "Feature 6", "description": "Descrizione" }
    ]
  },
  "testimonials": {
    "title": "Titolo sezione testimonial",
    "subtitle": "Sottotitolo",
    "items": [
      { "name": "Nome Cliente", "role": "Professione", "text": "Testimonial convincente (max 30 parole)", "rating": 5 },
      { "name": "Nome 2", "role": "Professione", "text": "Testimonial", "rating": 5 },
      { "name": "Nome 3", "role": "Professione", "text": "Testimonial", "rating": 5 }
    ]
  },
  "pricing": {
    "title": "Titolo sezione prezzi",
    "subtitle": "Sottotitolo",
    "items": [
      { "name": "Piano Base", "price": "99", "period": "/mese", "description": "Per iniziare", "features": ["Feature 1", "Feature 2", "Feature 3"], "highlighted": false },
      { "name": "Piano Pro", "price": "199", "period": "/mese", "description": "Il più popolare", "features": ["Tutto di Base", "Feature 4", "Feature 5", "Feature 6"], "highlighted": true, "badge": "Più Scelto" },
      { "name": "Piano Premium", "price": "349", "period": "/mese", "description": "Supporto totale", "features": ["Tutto di Pro", "Feature 7", "Feature 8"], "highlighted": false }
    ]
  },
  "cta": {
    "title": "Titolo CTA finale (crea urgenza)",
    "subtitle": "Sottotitolo con social proof",
    "ctaText": "Testo pulsante finale",
    "stats": [
      { "value": "500+", "label": "Etichetta" },
      { "value": "98%", "label": "Etichetta" },
      { "value": "5★", "label": "Etichetta" }
    ]
  },
  "faq": {
    "title": "Domande Frequenti",
    "items": [
      { "question": "Domanda 1?", "answer": "Risposta convincente" },
      { "question": "Domanda 2?", "answer": "Risposta" },
      { "question": "Domanda 3?", "answer": "Risposta" },
      { "question": "Domanda 4?", "answer": "Risposta" },
      { "question": "Domanda 5?", "answer": "Risposta" }
    ]
  },
  "form": {
    "title": "Titolo form contatto",
    "subtitle": "Sottotitolo che incentiva la compilazione"
  },
  "pageMeta": {
    "title": "Titolo pagina per SEO (max 60 caratteri)",
    "description": "Meta description SEO (max 160 caratteri)",
    "slug": "slug-url-suggerito"
  }
}

Rispondi SOLO con il JSON, senza markdown o altro testo.`;

const SINGLE_BLOCK_PROMPT = (blockType, context) => `
Genera contenuti per un blocco "${blockType}" di una landing page.
Contesto: ${context}

Rispondi SOLO con un oggetto JSON contenente i campi appropriati per il tipo di blocco.
`;

const REWRITE_PROMPT = (text, style) => `
Riscrivi questo testo per una landing page in stile "${style}":
"${text}"

Rispondi SOLO con il testo riscritto, senza virgolette o altro.
Stili disponibili:
- persuasivo: crea urgenza e desiderio
- professionale: tono autorevole e affidabile
- amichevole: tono colloquiale e vicino
- esclusivo: tono premium e luxury
- energetico: tono dinamico e motivazionale
`;

// ==================== GENERATE FUNCTIONS ====================

/**
 * Genera una landing page completa da un prompt
 */
export const generateLandingPage = async (options) => {
  const { businessInfo, goal, target, apiKey } = options;
  
  try {
    // Usa Cloud Function o chiamata diretta OpenAI
    const generateContent = httpsCallable(functions, 'generateLandingPageContent');
    
    const result = await generateContent({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: LANDING_PAGE_PROMPT(businessInfo, goal, target),
      apiKey, // Se l'utente ha la propria API key
    });
    
    if (result.data?.content) {
      return parseAIResponse(result.data.content);
    }
    
    throw new Error('Risposta AI non valida');
  } catch (error) {
    console.error('Errore generazione AI:', error);
    
    // Fallback: chiamata diretta a OpenAI se la Cloud Function non è disponibile
    if (apiKey) {
      return generateWithDirectAPI(options);
    }
    
    throw error;
  }
};

/**
 * Chiamata diretta a OpenAI (fallback)
 */
const generateWithDirectAPI = async ({ businessInfo, goal, target, apiKey }) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: LANDING_PAGE_PROMPT(businessInfo, goal, target) },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Errore API OpenAI');
  }
  
  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content);
};

/**
 * Genera contenuto per un singolo blocco
 */
export const generateBlockContent = async (blockType, context, apiKey) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: SINGLE_BLOCK_PROMPT(blockType, context) },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Errore generazione blocco');
    }
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Errore generazione blocco:', error);
    throw error;
  }
};

/**
 * Riscrivi testo con stile specifico
 */
export const rewriteText = async (text, style, apiKey) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: REWRITE_PROMPT(text, style) },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Errore riscrittura');
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Errore riscrittura:', error);
    throw error;
  }
};

// ==================== PARSE & BUILD ====================

/**
 * Parse della risposta AI e costruzione dei blocchi
 */
const parseAIResponse = (content) => {
  try {
    // Rimuovi eventuali markdown code blocks
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiData = JSON.parse(cleanContent);
    
    // Costruisci i blocchi
    const blocks = [];
    
    // Hero
    if (aiData.hero) {
      blocks.push({
        id: generateBlockId('hero'),
        type: 'hero',
        settings: {
          ...DEFAULT_BLOCKS.hero.settings,
          ...aiData.hero,
        },
      });
    }
    
    // Features
    if (aiData.features) {
      blocks.push({
        id: generateBlockId('features'),
        type: 'features',
        settings: {
          ...DEFAULT_BLOCKS.features.settings,
          title: aiData.features.title,
          subtitle: aiData.features.subtitle,
          items: aiData.features.items,
        },
      });
    }
    
    // Testimonials
    if (aiData.testimonials) {
      blocks.push({
        id: generateBlockId('testimonials'),
        type: 'testimonials',
        settings: {
          ...DEFAULT_BLOCKS.testimonials.settings,
          title: aiData.testimonials.title,
          subtitle: aiData.testimonials.subtitle,
          items: aiData.testimonials.items,
        },
      });
    }
    
    // Pricing
    if (aiData.pricing) {
      blocks.push({
        id: generateBlockId('pricing'),
        type: 'pricing',
        settings: {
          ...DEFAULT_BLOCKS.pricing.settings,
          title: aiData.pricing.title,
          subtitle: aiData.pricing.subtitle,
          items: aiData.pricing.items.map(item => ({
            ...item,
            currency: '€',
            ctaText: 'Scegli ' + item.name,
            ctaLink: '#form',
          })),
        },
      });
    }
    
    // CTA
    if (aiData.cta) {
      blocks.push({
        id: generateBlockId('cta'),
        type: 'cta',
        settings: {
          ...DEFAULT_BLOCKS.cta.settings,
          title: aiData.cta.title,
          subtitle: aiData.cta.subtitle,
          ctaText: aiData.cta.ctaText,
          stats: aiData.cta.stats,
        },
      });
    }
    
    // FAQ
    if (aiData.faq) {
      blocks.push({
        id: generateBlockId('faq'),
        type: 'faq',
        settings: {
          ...DEFAULT_BLOCKS.faq.settings,
          title: aiData.faq.title,
          items: aiData.faq.items,
        },
      });
    }
    
    // Form
    if (aiData.form) {
      blocks.push({
        id: generateBlockId('form'),
        type: 'form',
        settings: {
          ...DEFAULT_BLOCKS.form.settings,
          title: aiData.form.title,
          subtitle: aiData.form.subtitle,
        },
      });
    }
    
    return {
      blocks,
      meta: aiData.pageMeta || {},
    };
  } catch (error) {
    console.error('Errore parsing risposta AI:', error);
    throw new Error('Impossibile interpretare la risposta AI');
  }
};

// ==================== PRESET PROMPTS ====================

export const AI_PRESETS = {
  weightLoss: {
    name: 'Perdita Peso',
    icon: '⚖️',
    businessInfo: 'Personal trainer specializzato in perdita peso e ricomposizione corporea',
    goal: 'Acquisire clienti interessati a perdere peso in modo sano e duraturo',
    target: 'Adulti 30-55 anni, sedentari o poco attivi, che vogliono perdere 10-20kg',
  },
  muscleGain: {
    name: 'Massa Muscolare',
    icon: '💪',
    businessInfo: 'Coach fitness specializzato in ipertrofia e bodybuilding naturale',
    goal: 'Acquisire clienti che vogliono aumentare massa muscolare',
    target: 'Uomini 20-40 anni interessati a costruire un fisico muscoloso',
  },
  onlineCoaching: {
    name: 'Coaching Online',
    icon: '📱',
    businessInfo: 'Personal trainer che offre coaching online personalizzato',
    goal: 'Vendere programmi di allenamento online con supporto del coach',
    target: 'Persone impegnate che preferiscono allenarsi da casa o in autonomia',
  },
  athleticPerformance: {
    name: 'Performance Atletica',
    icon: '🏃',
    businessInfo: 'Preparatore atletico per sportivi e atleti amatoriali',
    goal: 'Acquisire atleti che vogliono migliorare le performance sportive',
    target: 'Sportivi amatoriali e semi-professionisti di varie discipline',
  },
  wellness: {
    name: 'Benessere Generale',
    icon: '🧘',
    businessInfo: 'Coach wellness che combina fitness, nutrizione e mindfulness',
    goal: 'Attrarre clienti interessati a uno stile di vita sano e equilibrato',
    target: 'Adulti 35-60 anni interessati al benessere olistico',
  },
  postPartum: {
    name: 'Post Parto',
    icon: '👶',
    businessInfo: 'Personal trainer specializzato in recupero post-parto',
    goal: 'Aiutare neo-mamme a recuperare forma fisica in sicurezza',
    target: 'Donne che hanno partorito negli ultimi 6-24 mesi',
  },
};

export default {
  generateLandingPage,
  generateBlockContent,
  rewriteText,
  AI_PRESETS,
};
