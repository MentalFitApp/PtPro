# 🚀 Guida Migrazione Multi-Tenant

## Panoramica

Questa guida spiega come migrare il progetto attuale (business di Biondo) a una struttura multi-tenant, dove Biondo diventa il primo tenant della piattaforma FitFlow.

## Struttura Prima (Single-Tenant)

```
Firebase Root/
├── users/               ← Community members di Biondo
├── clients/             ← Clienti PT di Biondo
├── roles/
│   ├── superadmins      ← Tu come owner di Biondo
│   ├── admins
│   └── coaches
├── community_posts/
├── collaboratori/
└── ...altre collections
```

## Struttura Dopo (Multi-Tenant)

```
Firebase Root/
├── platform_admins/
│   └── superadmins      ← TU come CEO della piattaforma
│
├── tenants/
│   ├── biondo-fitness-coach/    ← Biondo come tenant
│   │   ├── users/
│   │   ├── clients/
│   │   ├── roles/
│   │   ├── community_posts/
│   │   └── ...tutte le altre collections
│   │
│   ├── mario-pt-roma/           ← Altri business
│   └── ...
│
└── subscriptions/               ← Piano pagamento per ogni tenant
```

---

## 📋 Step-by-Step Migration

### Step 1: Backup Dati (IMPORTANTE!)

```bash
# Esporta tutto Firestore via Firebase Console
# Firestore Database > Import/Export > Export
```

### Step 2: Esegui Script Migrazione

```bash
node migrate-to-multi-tenant.cjs
```

**Lo script ti chiederà:**
- Il tuo UID per diventare CEO Platform
- Conferma prima di procedere

**Lo script farà:**
1. Crea `tenants/biondo-fitness-coach/` con metadata
2. Copia TUTTE le collections attuali sotto `tenants/biondo-fitness-coach/`
3. Migra subcollections (anamnesi, checks, payments, comments, ecc.)
4. Copia `roles/` sotto `tenants/biondo-fitness-coach/roles/`
5. Crea `platform_admins/superadmins` con il tuo UID

### Step 3: Aggiorna Firestore Rules

Sostituisci le rules attuali con quelle multi-tenant:

```bash
# Copia il contenuto di firestore-multitenant.rules
# Vai su Firebase Console > Firestore > Rules
# Incolla e Pubblica
```

O via CLI:
```bash
firebase deploy --only firestore:rules
```

### Step 4: Aggiorna Frontend per Leggere da Tenant

**Crea un file di configurazione tenant:**

```javascript
// src/config/tenant.js
export const CURRENT_TENANT_ID = 'biondo-fitness-coach';

// Helper functions
export function getTenantCollection(collectionName) {
  return `tenants/${CURRENT_TENANT_ID}/${collectionName}`;
}

export function getTenantDoc(collectionName, docId) {
  return `tenants/${CURRENT_TENANT_ID}/${collectionName}/${docId}`;
}
```

**Aggiorna firebase.js per includere helper:**

```javascript
// src/firebase.js
import { CURRENT_TENANT_ID, getTenantCollection } from './config/tenant';

// Usa nei componenti
collection(db, getTenantCollection('users'))
// invece di
collection(db, 'users')
```

### Step 5: Test Completo

1. **Accedi come SuperAdmin** a `/ceo-login`
   - Verifica che vedi il dashboard business di Biondo
   - Controlla che le stats siano corrette

2. **Accedi come Platform CEO** a `/platform-login`
   - Usa l'email/password con UID inserito nello script
   - Verifica che vedi tutti i tenants (per ora solo Biondo)
   - Controlla stats platform

3. **Testa tutte le funzionalità principali:**
   - ✅ Login utenti
   - ✅ Community posts
   - ✅ Chat
   - ✅ Clienti e anamnesi
   - ✅ Pagamenti
   - ✅ Corsi
   - ✅ Calendar

### Step 6: Cleanup (SOLO DOPO TEST OK!)

**NON FARE subito dopo la migrazione!** Aspetta almeno 1 settimana.

Quando sei sicuro che tutto funzioni:

```bash
node cleanup-old-collections.cjs
```

Questo script eliminerà le vecchie collections alla root.

---

## 🎯 Accessi Post-Migrazione

### CEO Platform (TU)
- **URL**: `/platform-login`
- **Accesso**: UID in `platform_admins/superadmins`
- **Vede**: Tutti i tenants, stats globali, subscriptions

### Business Owner (Biondo)
- **URL**: `/ceo-login`
- **Accesso**: UID in `tenants/biondo-fitness-coach/roles/superadmins`
- **Vede**: Solo dati del proprio business

### Utenti Normali
- **URL**: `/login`
- **Accesso**: Account normale
- **Vede**: Solo dati del proprio tenant

---

## 🔧 Aggiungere un Nuovo Tenant

### Via Firebase Console

1. Vai su Firestore
2. Crea documento in `tenants/{nuovo-tenant-id}`
3. Struttura:

```javascript
{
  tenantId: "nuovo-business",
  name: "Nuovo Business PT",
  displayName: "Mario PT Roma",
  slug: "mario-pt-roma",
  status: "active",
  createdAt: "2025-11-22T...",
  subscription: {
    plan: "premium",
    status: "trial",
    startDate: "2025-11-22T...",
    features: ["community", "courses", "chat"]
  }
}
```

4. Crea subcollections:
   - `tenants/nuovo-business/roles/superadmins` → { uids: ["uid-owner"] }
   - `tenants/nuovo-business/users/`
   - `tenants/nuovo-business/clients/`

### Via Script (TODO)

```bash
node create-new-tenant.cjs --name="Mario PT" --owner-email="mario@example.com"
```

---

## 📊 Dashboard Disponibili

### 1. Platform CEO Dashboard
- **Path**: `/platform-dashboard`
- **Per**: CEO della piattaforma (tu)
- **Mostra**:
  - Totale tenants attivi
  - MRR (Monthly Recurring Revenue)
  - Utenti totali di tutti i business
  - Lista tenants con stats

### 2. Business Dashboard
- **Path**: `/ceo`
- **Per**: Proprietario del business (Biondo)
- **Mostra**:
  - Stats del singolo business
  - Community posts
  - Clienti e revenue
  - Checks e anamnesi

---

## 🔐 Sicurezza

### Platform CEO
- Ha accesso a TUTTI i dati di TUTTI i tenants
- Può creare/eliminare tenants
- Gestisce subscriptions
- Vede analytics globali

### Tenant Owner
- Ha accesso solo ai dati del proprio tenant
- Non può vedere altri tenants
- Gestisce il proprio team (admin, coach)
- Gestisce i propri clienti

### Utenti Normali
- Possono accedere solo al proprio tenant
- Vedono solo i propri dati
- Non possono cambiare tenant

---

## 🚨 Troubleshooting

### "Permission denied" dopo migrazione
1. Verifica che le nuove rules siano pubblicate
2. Controlla che `platform_admins/superadmins` contenga il tuo UID
3. Controlla che `tenants/biondo-fitness-coach/roles/superadmins` esista

### Dashboard Platform vuoto
1. Verifica che `tenants/` collection esista
2. Controlla che i dati siano stati migrati
3. Guarda console browser per errori Firestore

### Frontend non trova dati
1. Verifica di usare `getTenantCollection()` ovunque
2. Controlla `CURRENT_TENANT_ID` in `config/tenant.js`
3. Assicurati che le queries usino il path corretto

### Performance lente
1. Aggiungi indici compositi su Firestore
2. Usa query con `where('tenantId', '==', TENANT_ID)`
3. Implementa pagination su liste grandi

---

## 📈 Prossimi Step

Dopo la migrazione multi-tenant:

1. **Implementa Tenant Selector**
   - UI per Platform CEO per switchare tra tenants
   - Context React per tenantId corrente

2. **Subscription Management**
   - Integra Stripe per pagamenti
   - Auto-suspend tenant se subscription scade
   - Email notifiche rinnovo

3. **White-Label per Tenants**
   - Custom domain per ogni tenant
   - Custom branding (logo, colori)
   - Custom email templates

4. **Analytics Avanzate**
   - Dashboard comparativo tra tenants
   - Retention metrics
   - Churn analysis

5. **Onboarding Automatico**
   - Wizard per nuovo tenant
   - Setup automatico collections
   - Invito owner via email

---

## 📞 Supporto

Per problemi o domande sulla migrazione, contatta il team di sviluppo.

**IMPORTANTE**: Non eliminare mai i dati originali finché non hai testato TUTTO nella nuova struttura!

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Novembre 2025
