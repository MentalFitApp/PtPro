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
 */
export async function analyzeScreenshot(base64Image) {
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
          content: `Sei un esperto di landing pages. Analizza lo screenshot e estrai:
1. Struttura sezioni visibili (hero, features, pricing, etc)
2. Per ogni CTA: testo del bottone e tipo azione probabile
3. Colori dominanti
4. Layout (single column, grid, etc)

Rispondi in JSON valido con questa struttura:
{
  "sections": [
    { "type": "hero", "title": "...", "subtitle": "...", "ctas": [{"label": "...", "actionType": "scroll|link|form"}] }
  ],
  "colors": ["#hex1", "#hex2"],
  "layout": "single-column|multi-column|grid"
}`
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
              text: 'Analizza questa landing page'
            }
          ]
        }
      ],
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI Vision API error');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (e) {
    console.error('Parse error:', e, content);
    throw new Error('Risposta AI non valida');
  }
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
