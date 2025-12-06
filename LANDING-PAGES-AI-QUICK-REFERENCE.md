# 🎯 Quick Reference - Landing Pages AI Functions

## API OpenAI - Come Usare

### 1. Genera Landing Page Completa
```javascript
import { generateLandingPage } from '../services/openai';

const result = await generateLandingPage({
  businessName: 'FitPro Gym',
  businessType: 'Palestra e Personal Training',
  targetAudience: 'Persone 25-45 anni che vogliono rimettersi in forma',
  mainGoal: 'Generare prenotazioni per sessione prova gratuita',
  style: 'moderno e motivazionale'
});

// result.sections = [{ type: 'hero', props: {...} }, ...]
```

### 2. Analizza Competitor URL
```javascript
import { analyzeCompetitorURL } from '../services/openai';

const analysis = await analyzeCompetitorURL('https://competitor.com');

// analysis = {
//   sections: [{ type: 'hero', title: '...', ctas: [...] }],
//   style: 'professionale',
//   tone: 'friendly and motivational',
//   targetAudience: 'fitness enthusiasts'
// }
```

### 3. Analizza Screenshot
```javascript
import { analyzeScreenshot } from '../services/openai';

// 1. Converti file in base64
const file = e.target.files[0];
const reader = new FileReader();
reader.onload = async () => {
  const base64 = reader.result.split(',')[1];
  
  // 2. Analizza con Vision AI
  const analysis = await analyzeScreenshot(base64);
  
  // analysis = {
  //   sections: [...],
  //   colors: ['#3B82F6', '#8B5CF6'],
  //   layout: 'multi-column'
  // }
};
reader.readAsDataURL(file);
```

### 4. Quick Edit Sezione
```javascript
import { quickEditSection } from '../services/openai';

const updatedSection = await quickEditSection(
  section, // sezione corrente
  "Rendi il titolo più emozionale e aggiungi emoji"
);

// updatedSection = {
//   type: 'hero',
//   props: {
//     title: '🔥 Trasforma il Tuo Corpo Ora!',
//     ...
//   }
// }
```

### 5. Ottimizza SEO
```javascript
import { optimizeSEO } from '../services/openai';

const seo = await optimizeSEO(page);

// seo = {
//   seoTitle: 'FitPro Gym - Allenamento Personalizzato Milano | Prova Gratis',
//   seoDescription: 'Raggiungi i tuoi obiettivi fitness con trainer professionisti. Prima sessione gratuita. Prenota ora!',
//   suggestions: [
//     'Aggiungi schema markup per local business',
//     'Ottimizza immagini con alt text descrittivi'
//   ]
// }
```

### 6. Genera Variante A/B
```javascript
import { generateABVariant } from '../services/openai';

const variant = await generateABVariant(section, 'headline');

// variant = versione alternativa con copy diverso
// Stesso type e struttura, diverso contenuto
```

---

## Esempi Prompt Efficaci

### Generazione Landing Page
```
✅ BUONO:
"Landing page per palestra boutique a Milano. Target: donne 30-45 anni professioniste che vogliono tenersi in forma senza perdere tempo. Obiettivo: prenotare 3 sessioni prova. Stile: elegante, motivazionale, luxury."

❌ CATTIVO:
"Landing page per palestra"
```

### Quick Edit
```
✅ BUONO:
"Cambia il titolo da formale a motivazionale e aggiungi urgency"
"Traduci il testo in inglese mantenendo lo stesso tono"
"Rendi la CTA più action-oriented"
"Aggiungi 3 bullet points con benefici specifici"

❌ CATTIVO:
"Migliora"
"Cambia"
```

---

## Timer Configuration

### Countdown (Durata Fissa)
```javascript
{
  timerEnabled: true,
  timerType: 'countdown',
  timerDuration: 3600, // 1 ora in secondi
  timerMessage: 'Offerta scade tra: ',
  timerUnlockSection: 'section-xyz' // ID sezione da sbloccare
}
```

### Deadline (Data Specifica)
```javascript
{
  timerEnabled: true,
  timerType: 'deadline',
  timerEndDate: '2025-12-31T23:59:59', // ISO datetime
  timerMessage: 'Black Friday termina tra: ',
  timerUnlockSection: 'section-xyz'
}
```

### Evergreen (Per Utente)
```javascript
{
  timerEnabled: true,
  timerType: 'evergreen',
  timerDuration: 86400, // 24 ore
  timerMessage: 'Il tuo sconto personale scade tra: ',
  timerUnlockSection: 'section-xyz'
}
// Timer parte quando utente visita per la prima volta
// Salvato in localStorage
```

---

## Exit Intent Configuration

```javascript
{
  exitIntentEnabled: true,
  exitIntentTitle: 'Aspetta! Non Andare Via 🎁',
  exitIntentMessage: 'Ricevi uno sconto esclusivo del 20% sulla prima sessione. Valido solo per i prossimi 10 minuti!',
  exitIntentCTA: 'Richiedi Sconto Ora'
}
```

**Trigger**: Mouse esce dalla finestra (clientY <= 0)
**Show**: Una sola volta per sessione
**Action**: Click CTA → scroll a form sezione

---

## A/B Testing Setup

```javascript
{
  abTestEnabled: true,
  abVariants: [
    {
      id: 'variant-1',
      sectionId: 'hero-section-id',
      originalSection: { /* sezione originale */ },
      variantSection: { /* sezione variante generata da AI */ },
      trafficSplit: 50, // 50% traffico
      views: 0,
      conversions: 0,
      conversionRate: 0
    }
  ]
}
```

**Note**: Metriche attualmente simulate, da integrare con Firebase Analytics

---

## Analytics Events

```javascript
{
  trackingEnabled: true,
  trackingEvents: {
    pageView: true,        // Track quando pagina caricata
    scrollDepth: true,     // Track 25%, 50%, 75%, 100%
    ctaClicks: true,       // Track click su bottoni CTA
    formSubmit: true,      // Track invio form
    videoPlay: true        // Track play video
  }
}
```

**Output**: `console.log('Analytics: Event Name')`
**Integrazione**: Sostituire console.log con GA/Mixpanel

---

## Gestione Errori

### Try/Catch Pattern
```javascript
try {
  const result = await generateLandingPage(params);
  // Usa result
} catch (error) {
  console.error('AI generation error:', error);
  
  // Fallback a placeholder
  const fallback = generatePlaceholderSections();
  // Usa fallback
}
```

### Timeout Configuration
```javascript
// In openai.js
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

await fetch(OPENAI_API_URL, {
  signal: controller.signal,
  // ...
});
```

---

## Best Practices

### 1. Caching Risultati AI
```javascript
// Salva risultati in Firestore per evitare rigenerazioni
const cacheKey = `ai_result_${hash(params)}`;
const cached = await getDoc(doc(db, 'aiCache', cacheKey));

if (cached.exists()) {
  return cached.data().result;
}

const result = await callOpenAI(params);
await setDoc(doc(db, 'aiCache', cacheKey), { result });
return result;
```

### 2. Rate Limiting
```javascript
// Limita chiamate AI per utente
const userKey = `ai_calls_${userId}_${today}`;
const calls = parseInt(localStorage.getItem(userKey) || '0');

if (calls >= 10) {
  throw new Error('Limite giornaliero raggiunto (10 generazioni/giorno)');
}

await callOpenAI(params);
localStorage.setItem(userKey, (calls + 1).toString());
```

### 3. Validazione Output
```javascript
const result = await callOpenAI(params);

// Valida struttura
if (!result.sections || !Array.isArray(result.sections)) {
  throw new Error('Invalid AI response structure');
}

// Valida ogni sezione
result.sections.forEach(section => {
  if (!section.type || !section.props) {
    throw new Error(`Invalid section: ${JSON.stringify(section)}`);
  }
});

return result;
```

### 4. Fallback Intelligente
```javascript
async function generateWithFallback(params) {
  try {
    // Prima prova API reale
    return await generateLandingPage(params);
  } catch (error) {
    console.warn('AI API failed, using fallback:', error);
    
    // Fallback a template predefinito
    return {
      sections: [
        { type: 'hero', props: { /* template hero */ } },
        { type: 'features', props: { /* template features */ } },
        // ...
      ]
    };
  }
}
```

---

## Debugging

### Enable Verbose Logging
```javascript
// openai.js
const DEBUG = import.meta.env.MODE === 'development';

if (DEBUG) {
  console.log('OpenAI Request:', {
    model: 'gpt-4o-mini',
    messages,
    temperature,
    maxTokens
  });
}

const response = await fetch(OPENAI_API_URL, ...);

if (DEBUG) {
  console.log('OpenAI Response:', await response.clone().json());
}
```

### Monitor API Costs
```javascript
// Track tokens used
let totalTokens = 0;

const trackUsage = (usage) => {
  totalTokens += usage.total_tokens;
  const cost = (usage.prompt_tokens * 0.00015 + usage.completion_tokens * 0.0006) / 1000;
  console.log(`Tokens: ${usage.total_tokens}, Cost: $${cost.toFixed(4)}`);
};

const data = await response.json();
if (data.usage) trackUsage(data.usage);
```

---

## Performance Tips

### 1. Parallel Requests
```javascript
// ❌ Sequential (lento)
const result1 = await generateSection1();
const result2 = await generateSection2();

// ✅ Parallel (veloce)
const [result1, result2] = await Promise.all([
  generateSection1(),
  generateSection2()
]);
```

### 2. Stream Responses (per UX migliore)
```javascript
await callOpenAI({
  messages,
  stream: true,
  onStream: (chunk) => {
    // Mostra testo mentre viene generato
    setPreview(prev => prev + chunk);
  }
});
```

### 3. Reduce Token Usage
```javascript
// Usa max_tokens per limitare costi
await callOpenAI({
  messages,
  maxTokens: 500, // Limita risposta
  temperature: 0.7
});
```

---

## Sicurezza

### 1. Rate Limiting Backend
```javascript
// Cloud Function
exports.aiProxy = functions.https.onCall(async (data, context) => {
  // Verifica autenticazione
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated');
  }

  // Rate limit
  const uid = context.auth.uid;
  const calls = await checkRateLimit(uid);
  if (calls > 100) {
    throw new functions.https.HttpsError('resource-exhausted');
  }

  // Chiamata OpenAI
  const result = await callOpenAI(data.params);
  return result;
});
```

### 2. API Key Protection
```javascript
// ❌ MAI esporre API key in frontend
const OPENAI_API_KEY = 'sk-proj-...'; // ❌ NO!

// ✅ Usa backend proxy
const result = await fetch('/api/ai-generate', {
  method: 'POST',
  body: JSON.stringify(params)
});
```

---

## Esempi Completi

### Workflow 1: Genera Landing da Zero
```javascript
// 1. Utente apre AI Assistant
setShowAIModal(true);

// 2. Compila form
const params = {
  businessName: 'FitPro',
  businessType: 'Palestra',
  targetAudience: 'Professionisti 30-45',
  mainGoal: 'Lead generation',
  style: 'professionale'
};

// 3. Genera con AI
const result = await generateLandingPage(params);

// 4. Converti in sezioni
const sections = result.sections.map((s, i) => ({
  id: `section-${Date.now()}-${i}`,
  type: s.type,
  props: s.props
}));

// 5. Applica all'editor
setPage(prev => ({ ...prev, sections }));
setShowAIModal(false);
```

### Workflow 2: Quick Edit Sezione
```javascript
// 1. Utente click Wand2 su sezione
setShowAIInput(true);

// 2. Scrivi prompt
const instruction = "Rendi il titolo più emozionale con emoji";

// 3. Chiama AI
setAiLoading(true);
const updated = await quickEditSection(section, instruction);

// 4. Applica modifiche
onUpdate(updated.props);
setAiLoading(false);
alert('✓ Sezione modificata!');
```

### Workflow 3: Analizza Competitor
```javascript
// 1. Modalità URL
const url = 'https://competitor.com';

// 2. Analizza
setAnalyzingStep('structure');
const analysis = await analyzeCompetitorURL(url);

// 3. Estrai CTAs
const ctas = [];
analysis.sections.forEach(s => {
  s.ctas?.forEach(cta => {
    ctas.push({
      id: `cta-${ctas.length}`,
      text: cta.label,
      suggestedAction: cta.actionType
    });
  });
});

// 4. Mostra wizard mapping
setDetectedCTAs(ctas);
setAnalyzingStep('actions');

// 5. Utente mappa azioni...
// 6. Genera sezioni finali
```

---

**Pro Tip**: Salva sempre un backup prima di applicare modifiche AI massive!
