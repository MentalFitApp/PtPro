# 🚨 CRITICITÀ E RISCHI - PtPro

> Documento di tracking per problemi critici da risolvere
> Creato: 03 Gennaio 2026
> Status: IN CORSO

---

## 📋 INDICE

1. [Criticità Immediate](#-1-criticità-immediate-fix-entro-24h)
2. [Problemi Business Logic](#-2-problemi-business-logic)
3. [Scalabilità](#-3-problemi-scalabilità)
4. [UX/Affidabilità](#-4-problemi-uxaffidabilità)
5. [Compliance/Legale](#-5-rischi-legalicomplicance)
6. [Dipendenze](#-6-dipendenze-e-manutenibilità)
7. [Matrice Rischi](#-matrice-rischi)
8. [Changelog Fix](#-changelog-fix)

---

## 🔴 1. CRITICITÀ IMMEDIATE (Fix entro 24h)

### 1.1 API Keys R2 Esposti nel Frontend Bundle ✅ RISOLTO

**Status:** ✅ COMPLETATO (03 Gennaio 2026)
**Priorità:** 🔴 CRITICA
**Tempo impiegato:** ~1 ora

**Soluzione implementata:**
1. ✅ Create Cloud Functions `uploadToR2` e `deleteFromR2` in `functions/index.js`
2. ✅ Modificato `src/cloudflareStorage.js` per usare Cloud Functions
3. ✅ Modificato `src/services/landingMediaUpload.js` per usare Cloud Functions
4. ✅ Aggiornato `.github/workflows/deploy.yml` (rimosse variabili R2 sensibili)
5. ✅ Aggiornato `.env.example` con istruzioni per Firebase Secrets
6. ✅ Rimosse `VITE_R2_ACCESS_KEY_ID`, `VITE_R2_SECRET_ACCESS_KEY`, `VITE_R2_ACCOUNT_ID`, `VITE_R2_BUCKET_NAME` da `.env`

**⚠️ ALTRE API KEYS DA SPOSTARE (prossimo fix):**
- `VITE_OPENAI_API_KEY` - Esposta nel bundle, da spostare in Cloud Function
- `VITE_DAILY_API_KEY` - Esposta nel bundle, già esiste secret ma usata anche frontend

**Nuove dipendenze functions:**
- `@aws-sdk/client-s3`
- `uuid`

**Firebase Secrets configurati e Cloud Functions deployate:**
```bash
✅ firebase functions:secrets:set R2_ACCOUNT_ID
✅ firebase functions:secrets:set R2_ACCESS_KEY_ID
✅ firebase functions:secrets:set R2_SECRET_ACCESS_KEY
✅ firebase functions:secrets:set R2_BUCKET_NAME
✅ firebase functions:secrets:set R2_PUBLIC_URL
✅ firebase deploy --only functions:uploadToR2,functions:deleteFromR2
firebase functions:secrets:set R2_BUCKET_NAME
firebase functions:secrets:set R2_PUBLIC_URL
```

**Test di verifica:**
- [x] Bundle JS non contiene più `VITE_R2_ACCESS_KEY_ID`
- [x] Bundle JS non contiene più `VITE_R2_SECRET_ACCESS_KEY`
- [x] Variabili rimosse da `.env` locale
- [ ] Upload funziona tramite Cloud Function (richiede deploy functions)
- [ ] Delete funziona tramite Cloud Function (richiede deploy functions)

**⚠️ AZIONE RICHIESTA - Configurare Firebase Secrets:**
```bash
# Da terminale con Firebase CLI configurato:
firebase functions:secrets:set R2_ACCOUNT_ID
firebase functions:secrets:set R2_ACCESS_KEY_ID
firebase functions:secrets:set R2_SECRET_ACCESS_KEY
firebase functions:secrets:set R2_BUCKET_NAME
firebase functions:secrets:set R2_PUBLIC_URL

# Poi deploy delle functions:
firebase deploy --only functions
```

---

### 1.2 TenantId Manipolabile da localStorage ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🔴 CRITICA
**Tempo stimato:** 2 ore

**File interessati (20+):**
- `src/contexts/TenantContext.jsx`
- `src/hooks/useChat.js`
- `src/hooks/useTenantBranding.js`
- `src/hooks/useUnreadNotifications.js`
- `src/pages/auth/Login.jsx`
- E molti altri...

**Problema:**
```javascript
const tenantId = localStorage.getItem('tenantId');
```

Il tenantId viene letto da localStorage che è manipolabile dall'utente tramite DevTools.

**Impatto potenziale:**
- ❌ Utente cambia tenantId → potenziale accesso a dati altri tenant
- ❌ Le Firestore rules mitigano MA un bug = data breach totale
- ❌ Logging/analytics corrotti

**Soluzione:**
1. Salvare tenantId nei Firebase Auth custom claims durante login
2. Leggere tenantId da `auth.currentUser.getIdTokenResult().claims.tenantId`
3. localStorage solo come cache, sempre validato contro claims
4. Cloud Function `setUserTenant` per cambiare tenant (validato)

**Test di verifica:**
- [ ] Modificare localStorage.tenantId non cambia il tenant effettivo
- [ ] Solo admin può assegnare utenti a tenant
- [ ] Claims vengono refreshati al login

---

### 1.3 ~100+ console.log in Produzione ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟠 ALTA
**Tempo stimato:** 1 ora

**Problema:**
Console.log sparsi ovunque nel codice, alcuni con dati sensibili.

**Impatto potenziale:**
- ❌ Information disclosure in browser console
- ❌ Performance degradata
- ❌ Dati sensibili potenzialmente loggati
- ❌ Non professionale

**Soluzione:**
1. Creare utility `src/utils/logger.js`:
```javascript
const isDev = import.meta.env.DEV;
export const log = isDev ? console.log.bind(console) : () => {};
export const warn = isDev ? console.warn.bind(console) : () => {};
export const error = console.error.bind(console); // Sempre attivo
```

2. Search & replace `console.log` → `log` (import da logger)
3. ESLint rule per bloccare console.log diretto

**Test di verifica:**
- [ ] `grep -r "console.log" src/` non trova risultati (escluso logger.js)
- [ ] In produzione, console è pulita
- [ ] Errori critici ancora loggati

---

## 🟠 2. PROBLEMI BUSINESS LOGIC

### 2.1 Nessuna Integrazione Pagamenti Reale ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🔴 CRITICA per business
**Tempo stimato:** 4-5 settimane

**Problema:**
Il sistema registra solo pagamenti manuali inseriti dall'admin. Non c'è checkout automatico.

**Manca:**
- [ ] Integrazione Stripe
- [ ] Integrazione PayPal
- [ ] Webhook per pagamenti ricorrenti
- [ ] Gestione automatica rinnovi subscription
- [ ] Gestione refund
- [ ] Gestione dispute
- [ ] Fatturazione elettronica SDI (obbligatoria Italia)

**Impatto potenziale:**
- ❌ Friction altissima per clienti (pagamento manuale)
- ❌ Revenue non prevedibile (no subscription automatiche)
- ❌ Stato pagamento non sincronizzato
- ❌ Problemi legali per mancanza fattura elettronica

**Soluzione:**
Vedere UPGRADE-ROADMAP.md sezione #17 e #30

---

### 2.2 Grace Period Non Implementato ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟠 ALTA
**Tempo stimato:** 2 ore

**File interessati:**
- `functions/index.js` - aggregateTenantAnalytics
- Queries che filtrano per `scadenza >= now`

**Problema:**
Quando `scadenza === oggi`, il cliente viene immediatamente marcato come scaduto.

**Impatto potenziale:**
- ❌ Cliente perde accesso alla mezzanotte esatta
- ❌ Esperienza utente pessima
- ❌ Potenziali dispute

**Soluzione:**
1. Aggiungere campo `gracePeriodDays` nelle settings tenant (default: 3)
2. Query usano `scadenza + gracePeriodDays >= now`
3. Notifica "in grace period" invece di "scaduto"
4. Accesso limitato durante grace (solo visualizzazione?)

---

### 2.3 Nessun Sistema Backup/Export ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟠 ALTA
**Tempo stimato:** 2 settimane

**Problema:**
- Nessun backup automatico dei dati
- Clienti non possono esportare i propri dati
- Nessun disaster recovery plan

**Impatto potenziale:**
- ❌ Perdita accesso Firebase = perdita TOTALE dati
- ❌ GDPR violation (diritto portabilità dati)
- ❌ Nessun recovery da errori umani

**Soluzione:**
1. Scheduled Cloud Function backup giornaliero su Cloud Storage
2. Export dati cliente in JSON/CSV su richiesta
3. Export completo tenant per admin
4. Retention policy (30 giorni backup)

---

## 🟡 3. PROBLEMI SCALABILITÀ

### 3.1 Query Firestore O(n²) in Analytics ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟠 ALTA
**Tempo stimato:** 3 ore

**File:** `functions/index.js` - aggregateTenantAnalytics (linee ~750-900)

**Problema:**
```javascript
for (const client of clients) {  // O(n)
  const paymentsSnap = await tenantRef
    .collection('clients').doc(client.id)
    .collection('payments').get();  // O(m) query per ogni client
}
```

**Impatto potenziale:**
- 100 clienti = 100 query separate = ~2-3 secondi
- 1000 clienti = 1000 query = timeout + €€€ costi
- 10000 clienti = impossibile

**Soluzione:**
1. Collection Group Query per payments:
```javascript
const allPayments = await db.collectionGroup('payments')
  .where('tenantId', '==', tenantId)
  .where('date', '>=', startOfMonth)
  .get();
```
2. Aggregare in memoria invece di query singole
3. Indice Firestore per collection group

---

### 3.2 Nessun Caching Client-Side ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟡 MEDIA
**Tempo stimato:** 1 settimana

**Problema:**
Ogni navigazione = nuove query Firestore. Nessun caching.

**Impatto potenziale:**
- ❌ Costi Firebase elevati
- ❌ UX lenta su connessioni lente
- ❌ Sprechi bandwidth

**Soluzione:**
1. Implementare React Query o SWR
2. Stale-while-revalidate pattern
3. Cache persistence con IndexedDB
4. Invalidation intelligente

---

### 3.3 Bundle Size Non Ottimizzato ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟡 MEDIA
**Tempo stimato:** 4 ore

**Problema:**
```javascript
import * as Sentry from '@sentry/react';
```
Import completo invece di tree-shaking.

**Impatto potenziale:**
- ❌ First paint lento
- ❌ Mobile 3G = UX terribile
- ❌ Lighthouse score basso

**Soluzione:**
1. Analizzare bundle con `vite-bundle-visualizer`
2. Lazy load Sentry
3. Dynamic imports per routes
4. Code splitting per componenti pesanti

---

## 🟣 4. PROBLEMI UX/AFFIDABILITÀ

### 4.1 Azioni Distruttive Inconsistenti ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟡 MEDIA
**Tempo stimato:** 1 ora

**File con window.confirm():**
- `src/pages/shared/CalendarPage.jsx`
- `src/components/workouts/WorkoutEditor.jsx`
- Altri...

**Problema:**
Alcune azioni usano `window.confirm()` nativo, altre `useConfirm()` custom.

**Impatto potenziale:**
- ❌ UX inconsistente
- ❌ Non professionale
- ❌ confirm() bloccante e bypassabile

**Soluzione:**
1. Cercare tutti `window.confirm` e `confirm(`
2. Sostituire con `useConfirm()` hook esistente
3. ESLint rule per bloccare confirm nativo

---

### 4.2 Error Handling Generico ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟡 MEDIA
**Tempo stimato:** 3 ore

**Problema:**
```javascript
catch(err) {
  setError(err.message || 'Errore di connessione');
}
```

Messaggi generici, nessun recovery.

**Impatto potenziale:**
- ❌ Utente non capisce cosa è andato storto
- ❌ Debug impossibile
- ❌ Nessun retry automatico

**Soluzione:**
1. Creare error boundary globale
2. Categorizzare errori (network, auth, validation, server)
3. Messaggi user-friendly per categoria
4. Retry automatico per errori transitori
5. Sentry integration per tracking

---

### 4.3 Loading States Incompleti ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟢 BASSA
**Tempo stimato:** 2 ore

**Problema:**
Non tutte le azioni mostrano loading state, skeleton inconsistenti.

**Impatto potenziale:**
- ❌ Utente non sa se azione è in corso
- ❌ Double-submit possibile
- ❌ Percezione app lenta

**Soluzione:**
1. Audit di tutti i button con azioni async
2. Aggiungere `disabled={loading}` + spinner
3. Skeleton components standardizzati
4. Optimistic updates dove possibile

---

## 🔵 5. RISCHI LEGALI/COMPLIANCE

### 5.1 GDPR Compliance ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟠 ALTA
**Tempo stimato:** 2 settimane

**Manca:**
- [ ] Export dati utente (portabilità)
- [ ] Cancellazione completa account (diritto all'oblio)
- [ ] Consenso cookie/tracking esplicito
- [ ] Privacy policy dinamica per tenant
- [ ] Data processing agreement per tenant
- [ ] Log accessi ai dati personali

**Impatto potenziale:**
- ❌ Multe fino a €20M o 4% fatturato
- ❌ Reputazione distrutta
- ❌ Cause legali da utenti

---

### 5.2 Fatturazione Elettronica Italia ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟠 ALTA
**Tempo stimato:** 3-4 settimane

**Problema:**
Obbligatoria per tutti i professionisti in Italia dal 2019.

**Manca:**
- [ ] Integrazione SDI (Sistema di Interscambio)
- [ ] Generazione XML FatturaPA
- [ ] Conservazione sostitutiva 10 anni
- [ ] Gestione note di credito

**Impatto potenziale:**
- ❌ Sanzioni fiscali
- ❌ Impossibilità operare legalmente
- ❌ Clienti non possono detrarre IVA

---

### 5.3 Termini e Condizioni ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟡 MEDIA
**Tempo stimato:** 1 settimana (legale)

**Manca:**
- [ ] T&C per utenti finali
- [ ] T&C per tenant (SaaS agreement)
- [ ] Acceptable use policy
- [ ] SLA (Service Level Agreement)

---

## 🟤 6. DIPENDENZE E MANUTENIBILITÀ

### 6.1 Vulnerabilità NPM ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟡 MEDIA
**Tempo stimato:** 30 minuti

**Problema:**
```
10 moderate severity vulnerabilities
- undici 6.0.0-6.21.1 (DoS, certificate validation)
```

**Soluzione:**
```bash
npm audit fix
# Se non basta:
npm update firebase
```

---

### 6.2 Catch Blocks Vuoti ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟡 MEDIA
**Tempo stimato:** 2 ore

**Problema:**
```javascript
try { ... } catch {} // Errore ignorato silenziosamente
```

**File interessati:** Multipli

**Soluzione:**
1. Cercare `catch {}` e `catch(e) {}`
2. Aggiungere almeno logging errore
3. ESLint rule `no-empty` per catch

---

### 6.3 Test Mancanti ⏳

**Status:** ⏳ DA FARE
**Priorità:** 🟡 MEDIA
**Tempo stimato:** Ongoing

**Problema:**
- Nessun unit test
- Nessun integration test
- Nessun E2E test

**Impatto potenziale:**
- ❌ Regressioni non rilevate
- ❌ Refactoring rischioso
- ❌ Deploy = speranza

**Soluzione:**
1. Setup Vitest per unit tests
2. Setup Playwright per E2E
3. Test critici: auth, payments, multi-tenant isolation
4. CI/CD con test obbligatori

---

## 📊 MATRICE RISCHI

| # | Rischio | Probabilità | Impatto | Urgenza | Status |
|---|---------|-------------|---------|---------|--------|
| 1.1 | R2 API Keys leak | 🔴 Alta | 🔴 Catastrofico | ⚡ 24h | ✅ FATTO |
| 1.2 | Tenant data leak | 🟡 Media | 🔴 Catastrofico | ⚡ 24h | ⏳ |
| 1.3 | console.log prod | 🔴 Certa | 🟡 Medio | 🔶 1 sett | ⏳ |
| 2.1 | No pagamenti | 🔴 Certa | 🟠 Alto | 🔶 1 mese | ⏳ |
| 2.2 | No grace period | 🔴 Certa | 🟡 Medio | 🔶 1 sett | ⏳ |
| 2.3 | No backup | 🟡 Media | 🔴 Catastrofico | 🔷 3 mesi | ⏳ |
| 3.1 | Query O(n²) | 🟡 Media | 🟠 Alto | 🔶 1 mese | ⏳ |
| 3.2 | No caching | 🔴 Certa | 🟡 Medio | 🔷 3 mesi | ⏳ |
| 3.3 | Bundle size | 🔴 Certa | 🟢 Basso | 🔷 3 mesi | ⏳ |
| 4.1 | confirm() | 🔴 Certa | 🟢 Basso | 🔷 3 mesi | ⏳ |
| 4.2 | Error generic | 🔴 Certa | 🟡 Medio | 🔶 1 mese | ⏳ |
| 5.1 | GDPR | 🟡 Media | 🟠 Alto | 🔶 1 mese | ⏳ |
| 5.2 | Fattura elett. | 🔴 Certa | 🟠 Alto | 🔶 1 mese | ⏳ |
| 6.1 | NPM vulns | 🔴 Certa | 🟡 Medio | 🔶 1 sett | ⏳ |
| 6.2 | catch vuoti | 🔴 Certa | 🟡 Medio | 🔶 1 mese | ⏳ |
| 6.3 | No tests | 🔴 Certa | 🟠 Alto | 🔷 ongoing | ⏳ |

---

## ✅ CHANGELOG FIX

### 03 Gennaio 2026
- ✅ **1.1 R2 API Keys** - RISOLTO
  - Cloud Functions `uploadToR2` e `deleteFromR2` create in `functions/index.js`
  - `src/cloudflareStorage.js` - Rimosso S3Client diretto, usa Cloud Function
  - `src/services/landingMediaUpload.js` - Rimosso S3Client diretto, usa Cloud Function
  - `.github/workflows/deploy.yml` - Rimosse variabili R2 sensibili
  - `.env` - Rimosse VITE_R2_ACCESS_KEY_ID, VITE_R2_SECRET_ACCESS_KEY, VITE_R2_ACCOUNT_ID, VITE_R2_BUCKET_NAME
  - `.env.example` - Aggiornato con istruzioni Firebase Secrets
  - `functions/package.json` - Aggiunte dipendenze @aws-sdk/client-s3, uuid
  - Bundle verificato: nessuna credenziale R2 presente ✅
- 📝 Creato documento CRITICAL-ISSUES.md
- 🔍 Audit completo progetto

### [Data] - Template
```
- ✅ **[Numero Issue]** - [Titolo]
  - File modificati: ...
  - Test: PASSED
```

---

## 🎯 PROSSIMI PASSI

1. **OGGI:** Fix 1.1 (R2 Keys) e 1.2 (TenantId)
2. **Questa settimana:** Fix 1.3, 6.1, 2.2
3. **Questo mese:** Fix 3.1, 4.2, 5.1

---

> 📝 Aggiornare questo documento man mano che i fix vengono completati
