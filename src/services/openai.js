// src/services/openai.js
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Chiama OpenAI API con streaming
 */
export async function callOpenAI({ messages, temperature = 0.7, maxTokens = 2000, stream = false, onStream }) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  if (stream && onStream) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) onStream(content);
          } catch (e) {
            // Ignora errori parsing
          }
        }
      }
    }
  } else {
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

/**
 * Analizza un URL competitor e estrae struttura
 */
export async function analyzeCompetitorURL(url) {
  const messages = [
    {
      role: 'system',
      content: `Sei un esperto di landing pages. Analizza URL di competitor e estrai:
1. Struttura sezioni (hero, features, pricing, testimonials, cta, faq)
2. Per ogni CTA: label e tipo azione (scroll, link, form)
3. Tono e stile comunicazione
4. Target audience

Rispondi in JSON valido con questa struttura:
{
  "sections": [
    { "type": "hero", "title": "...", "subtitle": "...", "ctas": [{"label": "...", "actionType": "scroll|link|form"}] }
  ],
  "style": "professionale|casual|luxury|sportivo",
  "tone": "...",
  "targetAudience": "..."
}`
    },
    {
      role: 'user',
      content: `Analizza questo competitor: ${url}\n\nSe non puoi accedere al sito, usa la tua conoscenza generale dei pattern comuni nelle landing pages del settore fitness/wellness.`
    }
  ];

  const response = await callOpenAI({ messages, temperature: 0.3 });
  
  try {
    // Estrai JSON dalla risposta (può essere wrappato in ```json)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (e) {
    console.error('Parse error:', e, response);
    throw new Error('Risposta AI non valida');
  }
}

/**
 * Analizza uno screenshot e estrae struttura
 * @param {string} base64Image - Immagine in base64
 * @param {Object} options - Opzioni aggiuntive
 * @param {string} options.context - Contesto testuale aggiuntivo
 * @param {string} options.pdfContent - Contenuto estratto da PDF
 */
export async function analyzeScreenshot(base64Image, options = {}) {
  const { context = '', pdfContent = '' } = options;
  
  // Costruisci il prompt con contesto aggiuntivo
  let contextPrompt = '';
  if (context) {
    contextPrompt += `\n\nCONTESTO FORNITO DALL'UTENTE:\n${context}`;
  }
  if (pdfContent) {
    contextPrompt += `\n\nINFORMAZIONI DA PDF ALLEGATO:\n${pdfContent}`;
  }

  const systemPrompt = `Sei un ESPERTO SENIOR di UI/UX e landing page design. Il tuo compito è ANALIZZARE PRECISAMENTE la struttura visiva dello screenshot per REPLICARLA.

ANALISI DETTAGLIATA RICHIESTA:

1. SEZIONI - Per OGNI sezione visibile identifica:
   - Tipo: hero, features, testimonials, pricing, faq, cta, stats, gallery, about, logos, comparison
   - Layout ESATTO: centered, split-left (testo sx/img dx), split-right (img sx/testo dx), fullwidth
   - Numero di colonne: 1, 2, 3, 4
   - Allineamento testo: left, center, right

2. IMMAGINI - Per ogni immagine:
   - Posizione: left, right, center, background, none
   - Dimensione relativa: small (25%), medium (50%), large (75%), full (100%)
   - Tipo suggerito: foto-persona, foto-prodotto, illustrazione, icona, screenshot

3. ELEMENTI UI:
   - Badge/tag sopra titoli
   - Numero di pulsanti CTA e loro stile (primary filled, secondary outline, ghost)
   - Card con bordi/ombre
   - Icone accanto al testo
   - Liste con checkmark
   - Statistiche/numeri

4. SPACING E PROPORZIONI:
   - Padding generale: tight, normal, spacious
   - Gap tra elementi: small, medium, large

5. COLORI (estrai i 3-4 colori dominanti in HEX):
   - Primario (accento/CTA)
   - Secondario (hover/accent2)
   - Background principale
   - Background card/sezioni
   - Testo principale e secondario

IMPORTANTE: Non copiare testo! Usa placeholder descrittivi.

Rispondi SOLO con JSON valido:
{
  "sections": [
    {
      "type": "hero",
      "layout": "split-left|split-right|centered|fullwidth",
      "columns": 1,
      "textAlign": "left|center|right",
      "hasImage": true,
      "imagePosition": "left|right|center|background|none",
      "imageSize": "small|medium|large|full",
      "imageSuggestedType": "foto-persona|foto-prodotto|illustrazione",
      "hasBadge": true,
      "badgeText": "[Testo badge]",
      "title": "[Titolo principale accattivante]",
      "subtitle": "[Sottotitolo descrittivo]",
      "ctas": [
        {"label": "[Testo CTA primario]", "style": "primary"},
        {"label": "[Testo CTA secondario]", "style": "secondary"}
      ],
      "padding": "tight|normal|spacious"
    },
    {
      "type": "features",
      "layout": "grid|list|alternating",
      "columns": 3,
      "hasIcons": true,
      "hasImages": false,
      "hasCards": true,
      "sectionTitle": "[Titolo sezione]",
      "features": [
        {"icon": "emoji", "title": "[Feature 1]", "description": "[Descrizione breve]"},
        {"icon": "emoji", "title": "[Feature 2]", "description": "[Descrizione breve]"},
        {"icon": "emoji", "title": "[Feature 3]", "description": "[Descrizione breve]"}
      ]
    },
    {
      "type": "stats",
      "layout": "row|grid",
      "columns": 4,
      "stats": [
        {"value": "XXX+", "label": "[Etichetta]"},
        {"value": "XX%", "label": "[Etichetta]"}
      ]
    },
    {
      "type": "testimonials",
      "layout": "grid|carousel|single",
      "columns": 3,
      "hasPhoto": true,
      "hasRating": true,
      "testimonials": [
        {"text": "[Recensione placeholder]", "name": "[Nome]", "role": "[Ruolo/Dettaglio]"}
      ]
    },
    {
      "type": "pricing",
      "layout": "cards",
      "columns": 3,
      "hasHighlighted": true,
      "pricing": [
        {"name": "[Piano]", "price": "XX", "period": "/mese", "features": ["[feat1]", "[feat2]"], "highlighted": false, "ctaLabel": "[CTA]"}
      ]
    }
  ],
  "colors": {
    "primary": "#hex",
    "secondary": "#hex", 
    "background": "#hex",
    "cardBackground": "#hex",
    "textPrimary": "#hex",
    "textSecondary": "#hex"
  },
  "typography": {
    "headingStyle": "bold|extrabold|black",
    "bodySize": "small|medium|large"
  },
  "spacing": "tight|normal|spacious",
  "style": "minimal|corporate|bold|elegant|playful|dark|light",
  "borderRadius": "none|small|medium|large|full",
  "hasShadows": true
}`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              },
              {
                type: 'text',
                text: `Analizza la STRUTTURA di questa landing page e crea un template replicabile.${contextPrompt}\n\nRicorda: NON copiare il testo, usa placeholder!`
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.3 // Bassa per output più consistente
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('OpenAI Vision API error:', error);
      throw new Error(error.error?.message || `Errore API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Risposta vuota da OpenAI');
    }
    
    // Estrai JSON dalla risposta
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    
    // Prova a parsare direttamente
    return JSON.parse(content);
  } catch (e) {
    console.error('Errore analisi screenshot:', e);
    
    // Fallback: ritorna struttura base invece di fallire
    if (e.message.includes('JSON')) {
      console.warn('Fallback a struttura base per errore parsing');
      return {
        sections: [
          {
            type: 'hero',
            layout: 'centered',
            title: '[Titolo principale]',
            subtitle: '[Sottotitolo]',
            ctas: [{ label: '[CTA Principale]', style: 'primary' }]
          },
          {
            type: 'features',
            layout: 'grid-3',
            title: '[Le nostre caratteristiche]',
            features: [
              { icon: '✨', title: '[Feature 1]', description: '[Descrizione]' },
              { icon: '🎯', title: '[Feature 2]', description: '[Descrizione]' },
              { icon: '💪', title: '[Feature 3]', description: '[Descrizione]' }
            ]
          },
          {
            type: 'cta',
            title: '[Pronto a iniziare?]',
            ctas: [{ label: '[Contattaci]', style: 'primary' }]
          }
        ],
        colors: ['#3b82f6', '#1e293b'],
        style: 'professional',
        parseError: true,
        errorMessage: e.message
      };
    }
    
    throw e;
  }
}

/**
 * Estrae testo da un PDF (usando pdf.js o servizio esterno)
 */
export async function extractPDFText(pdfFile) {
  // Per ora usiamo un approccio semplice con FileReader
  // In futuro si può integrare pdf.js per estrazione migliore
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // Prova a estrarre testo base (funziona per PDF con testo selezionabile)
        const text = reader.result;
        // Se è binario, non possiamo estrarre facilmente
        if (text.includes('%PDF')) {
          resolve('[PDF caricato - contenuto non estraibile direttamente, usa le immagini come riferimento principale]');
        } else {
          resolve(text.substring(0, 5000)); // Limita a 5000 caratteri
        }
      } catch (e) {
        resolve('[Errore lettura PDF]');
      }
    };
    reader.onerror = () => resolve('[Errore lettura PDF]');
    reader.readAsText(pdfFile);
  });
}

/**
 * Genera sezioni landing page da prompt
 */
export async function generateLandingPage({ businessName, businessType, targetAudience, mainGoal, style }) {
  const messages = [
    {
      role: 'system',
      content: `Sei un esperto copywriter di landing pages. Crea sezioni coinvolgenti e persuasive.

Genera landing page in JSON con questa struttura:
{
  "title": "Titolo SEO-friendly",
  "sections": [
    {
      "type": "hero",
      "props": {
        "title": "...",
        "subtitle": "...",
        "badge": "...",
        "primaryCTA": {"label": "...", "type": "scroll", "target": "section-1"},
        "secondaryCTA": {"label": "...", "type": "link", "url": "#contatti"}
      }
    },
    {
      "type": "features",
      "props": {
        "title": "...",
        "subtitle": "...",
        "features": [
          {"icon": "💪", "title": "...", "description": "..."}
        ]
      }
    }
  ]
}

Tipi sezione disponibili: hero, features, pricing, testimonials, cta, faq, contactForm, videoUpload
CTA types: scroll (target: section-X), link (url), form (formSectionId), video (videoSectionId)`
    },
    {
      role: 'user',
      content: `Crea landing page per:
- Business: ${businessName}
- Settore: ${businessType}
- Target: ${targetAudience}
- Obiettivo: ${mainGoal}
- Stile: ${style}

Includi: hero, features (3-4), pricing (3 piani), testimonials (3), cta, faq (5), contactForm`
    }
  ];

  const response = await callOpenAI({ messages, temperature: 0.8, maxTokens: 3000 });
  
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (e) {
    console.error('Parse error:', e, response);
    throw new Error('Risposta AI non valida');
  }
}

/**
 * Quick edit di una sezione con AI
 */
export async function quickEditSection(section, instruction) {
  const messages = [
    {
      role: 'system',
      content: `Sei un copywriter esperto. Modifica la sezione secondo le istruzioni mantenendo la struttura JSON.

Rispondi solo con il JSON della sezione modificata, senza spiegazioni.`
    },
    {
      role: 'user',
      content: `Sezione attuale:
${JSON.stringify(section, null, 2)}

Istruzione: ${instruction}

Restituisci la sezione modificata in JSON valido.`
    }
  ];

  const response = await callOpenAI({ messages, temperature: 0.7, maxTokens: 1000 });
  
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (e) {
    console.error('Parse error:', e, response);
    throw new Error('Risposta AI non valida');
  }
}

/**
 * Ottimizza SEO di una landing page
 */
export async function optimizeSEO(page) {
  const messages = [
    {
      role: 'system',
      content: `Sei un esperto SEO. Analizza la landing page e suggerisci miglioramenti per title e description.

Rispondi in JSON:
{
  "seoTitle": "max 60 caratteri, keyword-rich",
  "seoDescription": "max 160 caratteri, persuasiva",
  "suggestions": ["suggerimento 1", "suggerimento 2"]
}`
    },
    {
      role: 'user',
      content: `Landing page:
Titolo: ${page.title}
Sezioni: ${page.sections.map(s => s.type).join(', ')}
Contenuto principale: ${JSON.stringify(page.sections[0]?.props || {})}`
    }
  ];

  const response = await callOpenAI({ messages, temperature: 0.5, maxTokens: 500 });
  
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (e) {
    console.error('Parse error:', e, response);
    throw new Error('Risposta AI non valida');
  }
}

/**
 * Genera variante A/B test di una sezione
 */
export async function generateABVariant(section, variantType = 'headline') {
  const messages = [
    {
      role: 'system',
      content: `Sei un esperto di A/B testing. Genera una variante della sezione per testare ${variantType}.

Rispondi solo con il JSON della variante, mantenendo la struttura ma modificando il contenuto per il test.`
    },
    {
      role: 'user',
      content: `Sezione originale:
${JSON.stringify(section, null, 2)}

Crea una variante ottimizzata per testare: ${variantType}
Mantieni la stessa struttura ma prova un approccio diverso nel copy.`
    }
  ];

  const response = await callOpenAI({ messages, temperature: 0.9, maxTokens: 1000 });
  
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (e) {
    console.error('Parse error:', e, response);
    throw new Error('Risposta AI non valida');
  }
}
