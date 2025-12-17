# 📨 Sistema Inviti - Guida Implementazione

> Documento tecnico per il sistema di inviti e onboarding clienti
> Implementato: 17 Dicembre 2025
> Status: ✅ Fase 1 Completata

---

## 📋 Panoramica

Il sistema inviti permette ai coach/admin di invitare nuovi clienti in modo moderno e professionale, eliminando la necessità di gestire password temporanee manualmente.

### Flusso Utente

```
Coach crea invito
       ↓
[Genera codice + link + QR]
       ↓
Condivide via WhatsApp/Email/QR
       ↓
Cliente apre link
       ↓
Cliente completa registrazione
       ↓
Account creato automaticamente
       ↓
Notifica al coach ✓
```

---

## 🗂️ Struttura Dati

### Collection: `invitations`

```javascript
{
  // Identificatori
  token: "abc123def456...", // 32 caratteri hex (usato nell'URL)
  code: "ABC123",           // 6 caratteri alfanumerici (inseribile manualmente)
  tenantId: "tenant_xyz",
  
  // Dati cliente pre-compilati (opzionali)
  clientData: {
    name: "Mario Rossi",
    email: "mario@email.com",
    phone: "+39123456789",
    planType: "completo",
    duration: 3,
    paymentAmount: 150
  },
  
  // Stato invito
  status: "pending", // pending | sent | opened | completed | expired | cancelled
  
  // Tracking
  createdAt: Timestamp,
  createdBy: "coach_uid",
  expiresAt: Date,
  
  // Tracking aperture
  openedAt: Timestamp | null,
  openCount: 3,
  lastOpenedAt: Timestamp,
  
  // Completamento
  completedAt: Timestamp | null,
  completedBy: "client_uid",
  completedEmail: "mario@email.com",
  
  // Personalizzazione
  welcomeMessage: "Benvenuto nel team!",
  tenantName: "FitStudio",
  
  // Reminder
  reminderSentAt: Timestamp | null,
  reminderCount: 0
}
```

---

## 🔧 Cloud Functions

### `createClientInvitation`
Crea un nuovo invito con codice univoco.

**Input:**
```javascript
{
  tenantId: "tenant_xyz",     // required
  name: "Mario Rossi",        // optional
  email: "mario@email.com",   // optional
  phone: "+39123456789",      // optional
  planType: "completo",       // optional
  duration: 3,                // optional (mesi)
  paymentAmount: 150,         // optional
  expiryDays: 7,              // optional (default 7)
  welcomeMessage: "...",      // optional
  leadId: "lead_abc"          // optional (per conversione lead)
}
```

**Output:**
```javascript
{
  success: true,
  invitation: {
    token: "abc123...",
    code: "XYZ789",
    url: "https://flowfitpro.it/invite/abc123...",
    codeUrl: "https://flowfitpro.it/invite?code=XYZ789",
    expiresAt: "2025-12-24T10:00:00Z",
    whatsappLink: "https://wa.me/123456789?text=...",
    whatsappMessage: "Ciao Mario! Sei stato invitato...",
    tenantName: "FitStudio",
    clientData: {...}
  }
}
```

### `validateInvitation`
Valida un invito (per token o codice).

**Input:**
```javascript
{ token: "abc123..." }
// oppure
{ code: "XYZ789" }
```

**Output:**
```javascript
{
  valid: true,
  invitation: {
    token: "abc123...",
    code: "XYZ789",
    tenantId: "tenant_xyz",
    tenantName: "FitStudio",
    tenantLogo: "https://...",
    clientData: {...},
    welcomeMessage: "...",
    expiresAt: "2025-12-24T10:00:00Z"
  }
}
```

### `completeInvitation`
Completa la registrazione del cliente.

**Input:**
```javascript
{
  token: "abc123...",        // required
  name: "Mario Rossi",       // required
  email: "mario@email.com",  // required
  password: "password123",   // required
  phone: "+39123456789",     // optional
  acceptTerms: true,         // optional
  acceptPrivacy: true        // optional
}
```

**Output:**
```javascript
{
  success: true,
  clientId: "new_client_uid",
  tenantId: "tenant_xyz",
  message: "Registrazione completata!"
}
```

### `listInvitations`
Lista inviti per un tenant.

**Input:**
```javascript
{
  tenantId: "tenant_xyz",    // required
  status: "pending",         // optional
  limit: 50                  // optional
}
```

### `cancelInvitation`
Annulla un invito.

**Input:**
```javascript
{
  token: "abc123..."
}
```

### `resendInvitation`
Rigenera un invito scaduto/esistente.

**Input:**
```javascript
{
  token: "abc123...",
  expiryDays: 7    // optional
}
```

---

## 🖥️ Componenti Frontend

### Pagine

| Pagina | Route | Descrizione |
|--------|-------|-------------|
| `NewClient.jsx` | `/new-client` | Form unificato per creare inviti (admin) - include QR, WhatsApp, codice |
| `AcceptInvite.jsx` | `/invite/:token` | Pagina pubblica per accettare inviti |
| `AcceptInvite.jsx` | `/invite?code=XYZ` | Accesso con codice manuale |

### Componenti

| Componente | Descrizione |
|------------|-------------|
| `InvitesManager.jsx` | Widget collassabile nella pagina Clients per gestire inviti |

---

## 🔐 Sicurezza

### Rate Limiting

| Funzione | Limite |
|----------|--------|
| `createClientInvitation` | 20/min |
| `validateInvitation` | 30/min |
| `completeInvitation` | 10/min |
| `listInvitations` | 30/min |
| `cancelInvitation` | 20/min |
| `resendInvitation` | 15/min |

### Autenticazione

- `createClientInvitation`: Richiede auth (admin/coach)
- `validateInvitation`: Pubblica (no auth)
- `completeInvitation`: Pubblica (no auth)
- `listInvitations`: Richiede auth
- `cancelInvitation`: Richiede auth
- `resendInvitation`: Richiede auth

---

## 📱 Integrazione WhatsApp

Il sistema genera automaticamente:

1. **Messaggio precompilato** con:
   - Nome cliente (se disponibile)
   - Nome tenant
   - Link invito
   - Codice invito
   - Validità

2. **Link wa.me** diretto:
   ```
   https://wa.me/39123456789?text=Ciao%20Mario!...
   ```

---

## 📸 QR Code

Generato automaticamente con `react-qr-code`.

Il QR contiene l'URL completo dell'invito:
```
https://www.flowfitpro.it/invite/abc123def456...
```

---

## 🔄 Stati Invito

| Stato | Descrizione |
|-------|-------------|
| `pending` | Appena creato, non ancora aperto |
| `sent` | Marcato come inviato (futuro) |
| `opened` | Cliente ha aperto il link |
| `completed` | Registrazione completata |
| `expired` | Scaduto senza completamento |
| `cancelled` | Annullato manualmente |

---

## 🚀 Deploy

### Cloud Functions

```bash
cd functions
firebase deploy --only functions:createClientInvitation,functions:validateInvitation,functions:completeInvitation,functions:listInvitations,functions:cancelInvitation,functions:resendInvitation
```

### Frontend

Il frontend viene deployato con il normale processo di build:
```bash
npm run build
```

---

## ⏭️ Prossimi Step (Fase 2)

1. **Notifiche**
   - Push notification quando invito completato
   - Centro notifiche in-app

2. **Email**
   - Email di conferma al cliente
   - Email con invito (SMTP tenant)

3. **Reminder automatici**
   - Cloud Function schedulata
   - Reminder dopo 3 giorni se non completato

---

## 📊 Analytics (Futuro)

Metriche da tracciare:
- Tasso di apertura inviti
- Tasso di completamento
- Tempo medio per completamento
- Inviti scaduti vs completati
