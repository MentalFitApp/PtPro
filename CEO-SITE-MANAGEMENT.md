# CEO Dashboard - Gestione Siti e Personalizzazioni

## 📋 Panoramica

La CEO Dashboard ora include funzionalità complete per la gestione e personalizzazione dei siti multi-tenant.

## 🎨 Funzionalità Implementate

### 1. **Landing Page Management**

#### Visualizza Siti
- Lista completa di tutti i tenant con siti
- Informazioni visualizzate:
  - Nome tenant e ID
  - Slug personalizzato (URL)
  - Dominio custom (se configurato)
  - Status (Pubblicato/Bozza)
  - Data ultimo aggiornamento

#### Editor Landing Page
Accesso completo alla configurazione landing page:

**Tab Generale:**
- Slug sito (URL personalizzato): `/site/nome-sito`
- Dominio custom per piano Enterprise
- Toggle pubblicazione (abilita/disabilita sito)

**Tab Hero Section:**
- Titolo principale
- Sottotitolo/descrizione
- Testo CTA primario
- Testo CTA secondario

**Tab Branding:**
- Nome app visualizzato
- URL logo
- Colore primario (con picker + hex)
- Colore accento (con picker + hex)

**Tab SEO:**
- Meta title per motori di ricerca
- Meta description
- Keywords (separate da virgola)

### 2. **Branding Editor**

Personalizzazione completa dell'identità del tenant:

- **Nome App**: Brand principale
- **Nomi Aree Personalizzate**:
  - Area Admin
  - Area Cliente  
  - Area Coach
  - Area Collaboratore
- **Logo**: URL immagine con preview
- **Colori**:
  - Colore primario
  - Colore accento
- **Preview Live**: Anteprima immediata delle modifiche

### 3. **Azioni Rapide sui Siti**

#### Pulsanti Tabella:
1. **👁️ Visualizza**: Apre il sito in nuova tab (`/site/slug`)
2. **✏️ Modifica Landing**: Apre editor configurazione landing
3. **⚙️ Modifica Branding**: Apre editor branding
4. **🔒 Pubblica/Bozza**: Toggle status sito
5. **🗑️ Elimina**: Elimina tenant (con conferma)

### 4. **API di Gestione**

File: `src/pages/platform/CEOSiteManagement.jsx`

Funzioni disponibili:
```javascript
// Carica configurazione landing
loadLandingConfig(tenantId)

// Salva configurazione landing
saveLandingConfig(tenantId, config)

// Carica branding
loadBrandingConfig(tenantId)

// Salva branding
saveBrandingConfig(tenantId, config)

// Cambia status sito
toggleSiteStatus(tenantId, currentStatus)

// Elimina tenant
deleteTenant(tenantId)

// Crea nuovo tenant
createTenant(tenantData)

// Duplica configurazione landing
duplicateLanding(sourceTenantId, targetTenantId)
```

## 🔐 Permessi Firestore

### Regole Aggiornate:

```javascript
// Metadata tenant - lettura pubblica per routing
match /tenants/{tenantId} {
  allow read: if true;
  allow write: if isPlatformCEO();
}

// Landing page - lettura pubblica, scrittura CEO/Admin
match /tenants/{tenantId}/settings/landing {
  allow read: if true;
  allow write: if isTenantAdmin(tenantId) || isPlatformCEO();
}

// Branding - autenticati leggono, CEO/Admin scrivono
match /tenants/{tenantId}/settings/branding {
  allow read: if request.auth != null;
  allow write: if isTenantAdmin(tenantId) || isPlatformCEO();
}

// Analytics landing pages
match /tenants/{tenantId}/landing_analytics/{docId} {
  allow read: if isTenantAdmin(tenantId) || isPlatformCEO();
  allow create: if true; // Tracking pubblico
}

// Collection globali
match /custom_domains/{domainId} {
  allow read, write: if isPlatformCEO();
}

match /site_templates/{templateId} {
  allow read: if request.auth != null;
  allow write: if isPlatformCEO();
}
```

## 📦 Componenti Creati

### 1. `LandingEditorModal.jsx`
Modal completo per editing landing page con:
- 4 tab (Generale, Hero, Branding, SEO)
- Validazione input (slug solo lettere/numeri/trattini)
- Preview live colori
- Salvataggio con feedback

### 2. `BrandingEditorModal.jsx`
Modal branding con:
- Input per nomi aree personalizzate
- Color picker dual (picker + hex input)
- Preview logo
- Preview live del branding

### 3. `CEOSiteManagement.jsx`
Utility functions per:
- CRUD operazioni configurazioni
- Gestione status siti
- Creazione/duplicazione tenant

## 🚀 Come Usare

### Accesso CEO Dashboard
1. Login con account Platform CEO: `/platform-login`
2. Naviga alla sezione "Landing Pages"

### Modificare una Landing Page
1. Clicca icona ✏️ sulla riga del tenant
2. Modifica campi desiderati nei vari tab
3. Clicca "Salva Modifiche"
4. Il sito sarà aggiornato immediatamente

### Personalizzare Branding
1. Clicca icona ⚙️ sulla riga del tenant
2. Modifica nome app, aree, logo, colori
3. Visualizza preview live
4. Salva per applicare modifiche

### Pubblicare/Nascondere Sito
1. Clicca icona 🔒/🔓 sulla riga del tenant
2. Conferma azione
3. Status cambia da "Pubblicato" a "Bozza" (o viceversa)

### Eliminare Tenant
1. Clicca icona 🗑️ sulla riga del tenant
2. Conferma operazione (⚠️ IRREVERSIBILE)
3. Tenant e configurazioni eliminate

## 📊 Struttura Dati

### Tenant Document
```javascript
{
  name: "Nome Tenant",
  status: "active" | "draft",
  siteSlug: "nome-sito",
  customDomain: "www.sito.com", // opzionale
  plan: "professional" | "enterprise",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  stats: {
    totalUsers: 0,
    totalClients: 0,
    totalRevenue: 0
  }
}
```

### Landing Config
```javascript
{
  hero: {
    title: "Titolo principale",
    subtitle: "Descrizione",
    ctaPrimary: "Inizia Ora",
    ctaSecondary: "Scopri di più",
    showStats: true,
    stats: [...]
  },
  features: [...],
  branding: {
    appName: "FitFlow",
    logoUrl: "/logo.png",
    primaryColor: "#3b82f6",
    accentColor: "#60a5fa"
  },
  siteSlug: "nome-sito",
  customDomain: null,
  enabled: true,
  seo: {
    title: "SEO Title",
    description: "SEO Description",
    keywords: "keyword1, keyword2"
  }
}
```

### Branding Config
```javascript
{
  appName: "FitFlow",
  adminAreaName: "Area Personale",
  clientAreaName: "Area Cliente",
  coachAreaName: "Area Coach",
  collaboratoreAreaName: "Area Collaboratore",
  logoUrl: "/logo.png",
  primaryColor: "#3b82f6",
  accentColor: "#60a5fa"
}
```

## ⚡ Performance

- **Caricamento Ottimizzato**: Stats aggregate salvate nel documento tenant
- **Query Efficienti**: Solo metadati caricati nella lista
- **Lazy Loading**: Configurazioni caricate solo all'apertura modal
- **Caching**: Usa dati esistenti quando possibile

## 🔧 Troubleshooting

### Sito non visibile dopo pubblicazione
- Verifica `enabled: true` in landing config
- Controlla `status: 'active'` nel documento tenant
- Verifica slug univoco e valido

### Branding non applicato
- Ricarica pagina dopo salvataggio
- Verifica che il tenant ID sia corretto
- Controlla permessi Firestore

### Colori non visualizzati correttamente
- Usa formato hex valido (#RRGGBB)
- Verifica che i colori abbiano contrasto sufficiente
- Testa in modalità light/dark theme

## 🎯 Prossimi Sviluppi

- [ ] Template landing page predefiniti
- [ ] Bulk editing (modifica multipla tenant)
- [ ] Export/Import configurazioni
- [ ] Analytics traffico landing pages
- [ ] A/B testing configurazioni
- [ ] Gestione media library per immagini
- [ ] Editor WYSIWYG per contenuti
- [ ] Versioning configurazioni

## 📝 Note Importanti

⚠️ **Eliminazione Tenant**: Operazione IRREVERSIBILE
⚠️ **Slug Unici**: Due tenant non possono avere stesso slug
⚠️ **Domini Custom**: Richiedono configurazione DNS esterna
⚠️ **Permessi**: Solo Platform CEO può eliminare tenant

---

**Ultima modifica**: 23 Novembre 2025
**Versione**: 2.0.0
