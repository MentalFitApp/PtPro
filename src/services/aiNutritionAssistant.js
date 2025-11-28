/**
 * AI Nutrition Assistant Service
 * Utilizza OpenAI per generare suggerimenti personalizzati sulle schede alimentazione
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Funzione helper per convertire immagine a base64
async function imageToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Errore conversione immagine:', error);
    return null;
  }
}

/**
 * Genera suggerimenti AI per la scheda alimentazione
 * @param {Object} clientData - Dati del cliente (nome, età, etc.)
 * @param {Object} anamnesisData - Anamnesi completa del cliente
 * @param {Object} schedaData - Dati attuali della scheda (obiettivo, durata, etc.)
 * @param {string} contextType - Tipo di contesto: 'general', 'meal', 'integration'
 * @param {Object} mealContext - Contesto specifico del pasto (opzionale)
 * @returns {Promise<Object>} Suggerimenti strutturati
 */
export async function generateNutritionSuggestions({
  clientData,
  anamnesisData,
  schedaData,
  contextType = 'general',
  mealContext = null,
  coachId = null
}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key non configurata. Aggiungi VITE_OPENAI_API_KEY nel file .env');
  }

  // Carica contesto di apprendimento dai feedback passati
  const { buildLearningContext, getDoNotShowPreferences } = await import('./aiFeedbackService');
  const learningContext = await buildLearningContext({ obiettivo: schedaData.obiettivo });
  const doNotShowTypes = coachId ? await getDoNotShowPreferences({ coachId, obiettivo: schedaData.obiettivo }) : [];

  // Costruisci il prompt personalizzato
  const systemPrompt = `Sei un nutrizionista sportivo esperto. Analizza i dati del cliente e fornisci suggerimenti CONCRETI e SPECIFICI per modificare la scheda alimentazione.

IMPORTANTE: 
1. Ogni suggerimento deve contenere un'azione CONCRETA applicabile (es: "Sostituisci 100g di riso con 120g di pasta integrale nel pranzo")
2. Specifica SEMPRE quantità, alimenti specifici e il pasto/momento in cui applicare il cambiamento
3. Usa alimenti REALI presenti nel database italiano (pasta, riso, pollo, salmone, verdure, etc.)

Rispondi SEMPRE in formato JSON valido con questa struttura esatta:
{
  "suggerimenti": [
    {
      "tipo": "sostituzione|aggiunta|rimozione|integrazione",
      "priorita": "alta|media|bassa",
      "titolo": "Azione specifica (es: Sostituisci riso con pasta integrale)",
      "descrizione": "Motivazione scientifica dettagliata",
      "azione": {
        "tipo": "replace_food|add_food|remove_food|add_supplement",
        "dati": {
          "pastoNome": "Colazione|Spuntino|Pranzo|Cena",
          "alimentoDaRimuovere": "nome esatto alimento da sostituire (se tipo=replace_food)",
          "alimentoDaAggiungere": {
            "nome": "Nome alimento specifico",
            "quantita": 120,
            "kcal": 150,
            "proteine": 5,
            "carboidrati": 30,
            "grassi": 1
          }
        }
      }
    }
  ],
  "macrosSuggeriti": {
    "calorie": 2000,
    "proteine": 150,
    "carboidrati": 200,
    "grassi": 67
  },
  "note": "Note aggiuntive generali"
}`;

  let userPrompt = buildPrompt(clientData, anamnesisData, schedaData, contextType, mealContext);
  
  // Aggiungi contesto di apprendimento se disponibile
  if (learningContext) {
    userPrompt += learningContext;
  }
  
  // Aggiungi filtro per suggerimenti da non mostrare
  if (doNotShowTypes.length > 0) {
    userPrompt += `\n\n⚠️ NON includere suggerimenti di tipo: ${doNotShowTypes.join(', ')}. L'utente ha indicato di non essere interessato a questi.`;
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modello economico ma potente
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore chiamata OpenAI API');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Errore AI Assistant:', error);
    throw error;
  }
}

/**
 * Costruisce il prompt personalizzato in base al contesto
 */
function buildPrompt(clientData, anamnesisData, schedaData, contextType, mealContext) {
  const baseInfo = `
DATI CLIENTE:
- Nome: ${clientData.name || 'N/D'}
- Età: ${clientData.age || 'N/D'} anni
- Sesso: ${clientData.gender || 'N/D'}

ANAMNESI:
${formatAnamnesis(anamnesisData)}

SCHEDA ATTUALE:
- Obiettivo: ${schedaData.obiettivo || 'Non specificato'}
- Durata: ${schedaData.durataSettimane || 'N/D'} settimane
- Note: ${schedaData.note || 'Nessuna nota'}
- Integrazione: ${schedaData.integrazione || 'Nessuna integrazione specificata'}
`;

  switch (contextType) {
    case 'general':
      const currentMeals = schedaData.giorni?.[Object.keys(schedaData.giorni)[0]] || {};
      const mealsList = currentMeals.pasti?.map(p => 
        `${p.nome}: ${p.alimenti?.map(a => `${a.nome} ${a.quantita}g`).join(', ') || 'vuoto'}`
      ).join('\n') || 'Nessun pasto configurato';

      return `${baseInfo}

PASTI ATTUALI (primo giorno):
${mealsList}

RICHIESTA: Analizza la scheda e fornisci 3-5 suggerimenti CONCRETI per ottimizzarla. OGNI suggerimento DEVE:
1. Specificare QUALE alimento sostituire/aggiungere/rimuovere
2. Indicare QUANTITÀ esatte in grammi
3. Specificare IN QUALE PASTO (Colazione/Pranzo/Cena/Spuntino)
4. Includere valori nutrizionali precisi (kcal, proteine, carboidrati, grassi)

Esempio di suggerimento CORRETTO:
"Sostituisci 80g di riso bianco con 100g di riso integrale nel Pranzo per aumentare fibre e rallentare assorbimento glucidi (riso integrale: 350kcal/100g, 7g proteine, 77g carbo, 3g grassi)"

Obiettivo: ${schedaData.obiettivo}
Focus su: ${schedaData.obiettivo === 'Massa' ? 'aumento calorico e proteico' : schedaData.obiettivo === 'Definizione' ? 'riduzione calorica mantenendo proteine' : 'bilanciamento nutrizionale'}`;

    case 'meal':
      return `${baseInfo}

CONTESTO PASTO:
- Nome pasto: ${mealContext?.nome || 'N/D'}
- Orario: ${mealContext?.orario || 'N/D'}
- Alimenti attuali: ${formatMealFoods(mealContext?.alimenti)}

RICHIESTA: Analizza questo specifico pasto e suggerisci:
1. Alimenti da aggiungere per migliorare il bilancio nutrizionale
2. Eventuali sostituzioni per ottimizzare i macros
3. Timing ottimale per questo pasto
4. Note specifiche su quantità e preparazione`;

    case 'integration':
      return `${baseInfo}

RICHIESTA: Suggerisci un protocollo di integrazione personalizzato considerando:
1. Obiettivo specifico del cliente
2. Eventuale attività fisica
3. Carenze nutrizionali evidenti
4. Timing di assunzione ottimale
5. Dosaggi consigliati

Fornisci suggerimenti pratici e cliccabili per implementare gli integratori nella scheda.`;

    default:
      return baseInfo;
  }
}

/**
 * Formatta i dati dell'anamnesi in testo leggibile
 */
function formatAnamnesis(anamnesis) {
  if (!anamnesis) return 'Anamnesi non disponibile';

  const sections = [];

  if (anamnesis.peso || anamnesis.altezza) {
    sections.push(`- Antropometria: Peso ${anamnesis.peso || 'N/D'}kg, Altezza ${anamnesis.altezza || 'N/D'}cm`);
  }

  if (anamnesis.attivitaFisica) {
    sections.push(`- Attività fisica: ${anamnesis.attivitaFisica}`);
  }

  if (anamnesis.obiettivo) {
    sections.push(`- Obiettivo dichiarato: ${anamnesis.obiettivo}`);
  }

  if (anamnesis.allergie || anamnesis.intolleranze) {
    sections.push(`- Allergie/Intolleranze: ${anamnesis.allergie || anamnesis.intolleranze || 'Nessuna'}`);
  }

  if (anamnesis.patologie) {
    sections.push(`- Patologie: ${anamnesis.patologie}`);
  }

  if (anamnesis.alimentazioneAttuale) {
    sections.push(`- Alimentazione attuale: ${anamnesis.alimentazioneAttuale}`);
  }

  return sections.length > 0 ? sections.join('\n') : 'Dati anamnesi limitati';
}

/**
 * Formatta la lista alimenti di un pasto
 */
function formatMealFoods(alimenti) {
  if (!alimenti || alimenti.length === 0) return 'Nessun alimento inserito';
  
  return alimenti.map(a => 
    `${a.nome} (${a.quantita}g: ${a.kcal || 0}kcal, P:${a.proteine || 0}g, C:${a.carboidrati || 0}g, G:${a.grassi || 0}g)`
  ).join(', ');
}

/**
 * Genera consigli personalizzati su integratori e dosaggi
 * @param {Object} clientData - Dati del cliente
 * @param {Object} anamnesisData - Anamnesi completa
 * @param {Object} schedaData - Scheda alimentazione attuale
 * @returns {Promise<Object>} Protocollo integratori con dosaggi
 */
export async function generateSupplementSuggestions({
  clientData,
  anamnesisData,
  schedaData
}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key non configurata');
  }

  const systemPrompt = `Sei un nutrizionista sportivo esperto in integrazione alimentare. Analizza i dati del cliente e suggerisci un protocollo di integrazione PERSONALIZZATO.

IMPORTANTE:
1. Considera sempre l'obiettivo specifico (Massa, Definizione, etc.)
2. Valuta eventuali carenze nutrizionali evidenti dalla scheda alimentazione
3. Suggerisci SOLO integratori utili, non vendere per vendere
4. Specifica dosaggi precisi e timing di assunzione
5. Dai motivazioni scientifiche per ogni integratore suggerito

Rispondi in formato JSON con questa struttura:
{
  "integratori": [
    {
      "nome": "Nome integratore (es: Proteine Whey)",
      "dosaggio": "30g al giorno",
      "timing": "Post-workout + Colazione",
      "motivazione": "Perché è utile per questo cliente",
      "priorita": "alta|media|bassa",
      "tipo": "proteine|creatina|omega3|vitamine|altro"
    }
  ],
  "protocolloGiornaliero": {
    "Mattina": ["Vitamina D 2000UI", "Omega-3 1g"],
    "Pre-workout": ["Creatina 5g", "Caffeina 200mg"],
    "Post-workout": ["Proteine Whey 30g"],
    "Sera": ["Magnesio 400mg", "ZMA"]
  },
  "note": "Note aggiuntive sul protocollo e avvertenze",
  "costo_mensile_stimato": "Stima costo mensile in euro"
}`;

  const userPrompt = `
DATI CLIENTE:
- Nome: ${clientData.name || 'N/D'}
- Età: ${anamnesisData?.age || clientData.age || 'N/D'} anni
- Sesso: ${anamnesisData?.sesso || clientData.gender || 'N/D'}
- Peso: ${anamnesisData?.peso || 'N/D'} kg
- Altezza: ${anamnesisData?.altezza || 'N/D'} cm
- Attività fisica: ${anamnesisData?.attivitaFisica || 'Moderata'}
- Obiettivo: ${schedaData.obiettivo || 'Non specificato'}

ANAMNESI:
- Allergie/Intolleranze: ${anamnesisData?.allergie || anamnesisData?.intolleranze || 'Nessuna'}
- Patologie: ${anamnesisData?.patologie || 'Nessuna'}
- Integrazione attuale: ${schedaData.integrazione || 'Nessuna'}

SCHEDA ALIMENTAZIONE ATTUALE:
${schedaData.note || 'Nessuna nota disponibile'}

RICHIESTA: Suggerisci un protocollo di integrazione PERSONALIZZATO per questo cliente.
Focus su:
1. Colmare eventuali gap nutrizionali evidenti
2. Supportare l'obiettivo "${schedaData.obiettivo}"
3. Ottimizzare performance e recupero
4. Considerare budget (prioritizzare integratori essenziali)

Includi SOLO integratori realmente utili per questo specifico cliente.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore generazione protocollo integratori');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Errore AI Integratori:', error);
    throw error;
  }
}

/**
 * Genera suggerimenti rapidi per macros
 */
export async function generateMacroSuggestions(clientData, anamnesisData, obiettivo) {
  const prompt = `
Cliente: ${clientData.name}, ${clientData.age} anni, ${clientData.gender}
Peso: ${anamnesisData?.peso || 'N/D'} kg
Altezza: ${anamnesisData?.altezza || 'N/D'} cm
Obiettivo: ${obiettivo}

Calcola i macronutrienti giornalieri ottimali in formato JSON:
{
  "calorie": numero,
  "proteine": numero_grammi,
  "carboidrati": numero_grammi,
  "grassi": numero_grammi,
  "note": "breve spiegazione"
}`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Sei un nutrizionista esperto. Calcola macros in base ai dati forniti.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error('Errore calcolo macros');

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Errore calcolo macros:', error);
    return null;
  }
}

/**
 * Genera una scheda alimentazione completa per 7 giorni
 * @param {Object} clientData - Dati del cliente
 * @param {Object} anamnesisData - Anamnesi completa
 * @param {string} obiettivo - Obiettivo della scheda
 * @param {Array} anamnesisPhotos - Array di URL foto anamnesi (opzionale)
 * @returns {Promise<Object>} Scheda completa con 7 giorni di pasti
 */
export async function generateCompleteSchedule({
  clientData,
  anamnesisData,
  obiettivo,
  durataSettimane = 4,
  anamnesisPhotos = [],
  mode = 'full'
}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key non configurata');
  }

  const systemPrompt = `Sei un nutrizionista sportivo esperto. Crea una scheda alimentazione COMPLETA di 7 giorni con 5 pasti al giorno (Colazione, Spuntino, Pranzo, Spuntino, Cena).

IMPORTANTE:
1. Ogni alimento deve avere: nome, quantità in grammi, kcal per 100g, proteine, carboidrati, grassi
2. Usa alimenti REALI italiani (pasta, riso, pollo, salmone, verdure, frutta, etc.)
3. Varia gli alimenti tra i giorni per evitare monotonia
4. Rispetta i macros target per l'obiettivo specifico
5. Considera eventuali allergie/intolleranze del cliente

Rispondi in JSON con questa struttura:
{
  "schedaCompleta": {
    "Lunedì": { "pasti": [...] },
    "Martedì": { "pasti": [...] },
    ... tutti i 7 giorni
  },
  "macrosTotaliGiornalieri": { "calorie": X, "proteine": X, "carboidrati": X, "grassi": X },
  "note": "Note sulla scheda e consigli generali"
}

Struttura di ogni pasto:
{
  "nome": "Colazione|Spuntino|Pranzo|Cena",
  "alimenti": [
    {
      "nome": "Alimento specifico",
      "quantita": 100,
      "kcal": 350,
      "proteine": 7,
      "carboidrati": 77,
      "grassi": 3
    }
  ]
}`;

  // Estrai numero pasti dall'anamnesi (cerca pattern come "3 pasti", "pasti: 4", etc.)
  let numeroPasti = 5; // Default
  if (anamnesisData?.numeroPasti) {
    numeroPasti = parseInt(anamnesisData.numeroPasti);
  } else if (anamnesisData?.note) {
    const match = anamnesisData.note.match(/pasti[:\s]*(\d)/i);
    if (match) {
      numeroPasti = parseInt(match[1]);
    }
  }
  
  // Adatta i pasti in base alle preferenze
  let pastiConfig = '';
  if (numeroPasti === 3) {
    pastiConfig = '3 pasti: Colazione, Pranzo, Cena';
  } else if (numeroPasti === 4) {
    pastiConfig = '4 pasti: Colazione, Pranzo, Spuntino pomeridiano, Cena';
  } else if (numeroPasti === 6) {
    pastiConfig = '6 pasti: Colazione, Spuntino, Pranzo, Spuntino, Cena, Spuntino serale';
  } else {
    pastiConfig = '5 pasti: Colazione, Spuntino, Pranzo, Spuntino, Cena';
  }

  const userPrompt = `
DATI CLIENTE:
- Nome: ${clientData.name || 'N/D'}
- Età: ${anamnesisData?.age || clientData.age || 'N/D'} anni
- Sesso: ${anamnesisData?.sesso || clientData.gender || 'N/D'}
- Peso: ${anamnesisData?.peso || 'N/D'} kg
- Altezza: ${anamnesisData?.altezza || 'N/D'} cm
- Attività fisica: ${anamnesisData?.attivitaFisica || 'Moderata'}
- Allergie/Intolleranze: ${anamnesisData?.allergie || anamnesisData?.intolleranze || 'Nessuna'}
- Patologie: ${anamnesisData?.patologie || 'Nessuna'}
- PREFERENZA PASTI: ${numeroPasti} pasti al giorno

OBIETTIVO: ${obiettivo}
DURATA: ${durataSettimane} settimane

${anamnesisData?.note ? `NOTE ANAMNESI: ${anamnesisData.note}` : ''}

IMPORTANTE: Il cliente PREFERISCE ${numeroPasti} PASTI AL GIORNO.
Struttura la scheda con: ${pastiConfig}

${mode === 'template' ? 'MODALITÀ TEMPLATE: Crea una scheda base veloce e generica per questo obiettivo, senza personalizzazioni eccessive.' : 'MODALITÀ PERSONALIZZATA: Analizza attentamente tutti i dati anamnesi per creare una scheda su misura.'}

RICHIESTA: Crea una scheda alimentazione completa di 7 giorni ottimizzata per l'obiettivo "${obiettivo}".
Includi ESATTAMENTE ${numeroPasti} pasti al giorno (${pastiConfig}) con alimenti specifici, quantità precise e valori nutrizionali completi.`;

  try {
    // Prepara i messaggi per l'API
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Se ci sono foto anamnesi, le aggiungiamo al contesto
    if (anamnesisPhotos && anamnesisPhotos.length > 0) {
      const photoAnalysisPrompt = `
FOTO ANAMNESI CLIENTE:
Ho ${anamnesisPhotos.length} foto del cliente che mostrano la sua composizione corporea attuale.
Analizza queste foto per ottimizzare ulteriormente la scheda considerando:
- Distribuzione della massa muscolare
- Percentuale di grasso corporeo visibile
- Zone da prioritizzare in base all'obiettivo
`;
      
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: photoAnalysisPrompt },
          ...anamnesisPhotos.slice(0, 3).map(url => ({ // Max 3 foto per non superare limiti
            type: 'image_url',
            image_url: { url }
          }))
        ]
      });
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: anamnesisPhotos.length > 0 ? 'gpt-4o' : 'gpt-4o-mini', // gpt-4o supporta le immagini
        messages,
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore generazione scheda completa');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Errore generazione scheda completa:', error);
    throw error;
  }
}

export default {
  generateNutritionSuggestions,
  generateMacroSuggestions,
  generateCompleteSchedule,
  generateSupplementSuggestions
};
