# 📊 Sistema di Analytics Landing Pages

## Overview

Il sistema traccia automaticamente tutte le interazioni degli utenti con le landing pages, inclusi:

### Eventi Tracciati

1. **Page Views** (`type: 'view'`)
   - Ogni visualizzazione della pagina
   - User agent e referrer per stima visitatori unici
   
2. **Quiz Events** (`type: 'quiz_event'`)
   - `quiz_opened`: Apertura del popup quiz
   - `quiz_step`: Completamento di ogni step
   - `quiz_partial`: Abbandono con risposte parziali
   - `quiz_completed`: Quiz completato con successo
   
3. **Conversions** (`type: 'conversion'`)
   - Click su CTA che portano a conversione

## Script di Analisi

### Analizzare Statistiche Pagina

```bash
node scripts/analyze-elimina-pancetta-stats.cjs
```

**Output:**
- Visualizzazioni totali e visitatori unici
- Eventi quiz dettagliati (aperture, step, abbandoni, completamenti)
- Lead raccolti e loro sorgente
- Funnel di conversione completo
- Trend ultimi 7 giorni
- Suggerimenti per migliorare conversioni

### Metriche Funnel

Il funnel completo include:

1. **Visualizzazioni pagina** (100%)
2. **Click apertura quiz** (% su visite)
3. **Quiz abbandonati** (% su aperture)
4. **Quiz completati** (% su aperture)

**KPI Principali:**
- Tasso di completamento quiz = completati / aperture
- Tasso di abbandono = abbandonati / aperture
- Tasso conversione totale = completati / visualizzazioni

## Collection Firestore

### `tenants/{tenantId}/landing_analytics`

Tutti gli eventi vengono salvati qui con struttura:

```javascript
{
  pageId: "...",           // ID della landing page
  pageSlug: "...",         // Slug per reference
  type: "...",             // view, quiz_event, conversion
  eventType: "...",        // Per quiz_event: quiz_opened, quiz_step, quiz_partial, quiz_completed
  step: 0,                 // Step corrente nel quiz
  totalSteps: 7,           // Totale step del quiz
  answersCount: 3,         // Numero risposte date
  timestamp: Timestamp,    // Quando è avvenuto
  userAgent: "...",        // Browser info
  referrer: "..."          // Da dove arriva
}
```

### Permessi

✅ **CREATE**: Pubblico (con validazione anti-spam)
🔒 **READ/UPDATE/DELETE**: Solo admin

## Implementazione Componenti

### QuizPopup.jsx

Il componente traccia automaticamente:

```jsx
// All'apertura
trackQuizEvent('quiz_opened');

// Ad ogni step
trackQuizEvent('quiz_step', { questionId, answerType });

// All'abbandono (se ha risposte parziali)
trackQuizEvent('quiz_partial', { answersCount, lastStep });

// Al completamento
trackQuizEvent('quiz_completed', { answersCount, contactFieldsCount });
```

## Best Practices

### Quando Analizzare

- **Giornaliero**: Check trend e identificare problemi
- **Settimanale**: Analisi dettagliata funnel e ottimizzazioni
- **Mensile**: Report completo e confronto periodi

### Soglie di Attenzione

⚠️ **Tasso completamento < 50%**: Quiz troppo lungo o complesso
⚠️ **Click quiz < 10% visite**: CTA non abbastanza visibile
✅ **Tasso completamento > 70%**: Quiz ben strutturato
✅ **Conversione totale > 10%**: Ottimo risultato

## Troubleshooting

### Nessun evento tracciato

1. Verifica che `pageId` e `tenantId` siano passati correttamente
2. Controlla console per errori Firebase
3. Verifica Firestore rules per `landing_analytics`

### Dati incompleti

- Eventi quiz richiedono che il popup non sia in modalità preview
- Alcuni eventi vengono tracciati solo quando l'utente non è autenticato

## Roadmap

- [ ] Dashboard visuale per analytics
- [ ] Export dati in CSV
- [ ] Heatmap click su pagina
- [ ] A/B testing automatico
- [ ] Integrazione Google Analytics
- [ ] Webhook per eventi critici
