# 🎨 Personalizzare Nome App nel Login Google

## ❌ Problema

Quando gli utenti fanno login con Google vedono:
```
Continua su biondo-fitness-coach.firebaseapp.com
```

Invece dovrebbero vedere il nome della tua app (es: "FitFlow" o "PtPro").

---

## ✅ Soluzione: Configura OAuth Consent Screen

### Opzione 1: Google Cloud Console (Consigliata)

#### 1. Vai alla Google Cloud Console

🔗 **Link diretto:** https://console.cloud.google.com/

#### 2. Seleziona il Progetto

- In alto a sinistra, clicca sul dropdown del progetto
- Seleziona il progetto Firebase (dovrebbe chiamarsi come il tuo progetto Firebase)
- Se non lo vedi, cerca "biondo-fitness-coach"

#### 3. Vai a OAuth Consent Screen

1. Nel menu laterale (☰), vai in:
   - **APIs & Services** → **OAuth consent screen**
   
2. Oppure usa il link diretto:
   - https://console.cloud.google.com/apis/credentials/consent

#### 4. Configura il Brand

**User Type:**
- Se solo per la tua organizzazione: scegli **Internal**
- Se pubblico: scegli **External** (richiede verifica Google per app pubbliche)

**App Information:**

```
┌──────────────────────────────────────────────┐
│ App name *                                   │
│ ┌──────────────────────────────────────┐    │
│ │ FitFlow                              │    │ ← Il nome che vedranno gli utenti
│ └──────────────────────────────────────┘    │
│                                              │
│ User support email *                         │
│ ┌──────────────────────────────────────┐    │
│ │ supporto@tuodominio.com          ▼  │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ App logo (opzionale)                         │
│ ┌──────────────────────────────────────┐    │
│ │ [Upload logo.png]                    │    │ ← Logo 120x120px
│ └──────────────────────────────────────┘    │
│                                              │
│ Application home page                        │
│ ┌──────────────────────────────────────┐    │
│ │ https://tuodominio.com               │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ Application privacy policy link              │
│ ┌──────────────────────────────────────┐    │
│ │ https://tuodominio.com/privacy       │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ Application terms of service link            │
│ ┌──────────────────────────────────────┐    │
│ │ https://tuodominio.com/terms         │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ Authorized domains                           │
│ ┌──────────────────────────────────────┐    │
│ │ tuodominio.com                       │    │
│ │ firebaseapp.com                      │    │
│ └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

#### 5. Scopes (Permessi)

Nella sezione **Scopes**, aggiungi:
- `email` - Email address
- `profile` - Basic profile info
- `openid` - OpenID Connect

Questi sono i permessi che l'app richiederà agli utenti.

#### 6. Test Users (se External - opzionale)

Se hai scelto **External** e non hai pubblicato l'app:
- Aggiungi gli email degli utenti che possono testare (max 100)
- Gli altri vedranno errore finché non pubblichi l'app

#### 7. Salva e Pubblica

1. Clicca **Save and Continue** in ogni sezione
2. Clicca **Back to Dashboard**
3. Se External: clicca **Publish App** (richiederà verifica Google per uso pubblico)

---

### Opzione 2: Firebase Console (Limitata)

#### 1. Vai alla Firebase Console

🔗 https://console.firebase.google.com/

#### 2. Impostazioni Progetto

1. Clicca sull'icona ingranaggio ⚙️ in alto a sinistra
2. Vai in **Project settings** (Impostazioni progetto)

#### 3. Cambia Nome Pubblico

1. Nella tab **General**
2. Trova **Public-facing name** (Nome pubblico)
3. Cambialo da "biondo-fitness-coach" a **"FitFlow"** (o il tuo nome)
4. Salva

**Nota:** Questo cambierà il nome in alcune parti ma non nel OAuth screen. Per il login Google devi usare la Google Cloud Console.

---

## 🎨 Personalizzazione Completa

### Logo App (120x120px)

Crea un logo quadrato per la schermata OAuth:

```
Dimensioni: 120x120px
Formato: PNG
Trasparenza: Opzionale
Background: Bianco o trasparente
```

**Dove verrà mostrato:**
- Schermata "Accedi con Google"
- Schermata consensi OAuth
- Lista app collegate in account Google

### Domini Autorizzati

Aggiungi tutti i domini da cui farai login:

```
✅ localhost (già autorizzato di default)
✅ *.firebaseapp.com (già autorizzato)
✅ *.web.app (già autorizzato)
✅ tuodominio.com (aggiungi se custom)
✅ app.tuodominio.com (aggiungi se subdomain)
```

### Privacy Policy e Terms (Obbligatori per External)

Se pubblichi l'app come **External**, devi avere:

1. **Privacy Policy** - Link pubblico a pagina con:
   - Quali dati raccogli
   - Come li usi
   - Come li proteggi
   - Diritti dell'utente (GDPR)

2. **Terms of Service** - Link pubblico a:
   - Condizioni d'uso
   - Limitazioni di responsabilità
   - Termini di servizio

**Esempio percorsi:**
- `https://tuodominio.com/privacy`
- `https://tuodominio.com/terms`

---

## 🔄 Risultato Dopo Setup

### Prima (❌):
```
┌─────────────────────────────────────┐
│  [G]  Accedi con Google             │
│                                     │
│  Scegli un account                  │
│  Continua su                        │
│  biondo-fitness-coach.firebaseapp.com│
│                                     │
│  • user@gmail.com                   │
└─────────────────────────────────────┘
```

### Dopo (✅):
```
┌─────────────────────────────────────┐
│  [Logo] FitFlow                     │
│                                     │
│  Scegli un account                  │
│  per continuare su FitFlow          │
│                                     │
│  • user@gmail.com                   │
│                                     │
│  [Continua]                         │
└─────────────────────────────────────┘
```

---

## 📱 Verifica Google Chrome per Utente

Gli utenti possono vedere le app collegate al loro account:

1. Vai su **Google Account**: https://myaccount.google.com/
2. **Security** → **Third-party apps with account access**
3. Troveranno l'app con il nome configurato

---

## ⚠️ Note Importanti

### App Internal vs External

**Internal (solo tua organizzazione):**
- ✅ Setup veloce (5 minuti)
- ✅ Nessuna verifica Google
- ✅ Solo utenti del tuo Google Workspace
- ❌ Non per clienti esterni

**External (pubblico):**
- ✅ Accessibile a tutti
- ❌ Richiede verifica Google (può richiedere settimane)
- ❌ Serve Privacy Policy e Terms
- ⚠️ In "Testing" mode max 100 utenti

### Verifica Google (per External)

Se pubblichi come **External**, Google richiede verifica:

1. Submit app for verification
2. Google controlla:
   - Privacy Policy
   - Terms of Service
   - Scopes richiesti
   - Sicurezza app
3. Tempo: 2-6 settimane
4. Finché non approvata: avviso "App non verificata"

**Soluzione temporanea:** Usa "Testing" mode e aggiungi email utenti manualmente.

---

## 🐛 Troubleshooting

### Non vedo il progetto in Google Cloud Console

**Soluzione:**
1. Assicurati di essere loggato con lo stesso account Google
2. Vai direttamente al link del progetto:
   - `https://console.cloud.google.com/apis/credentials/consent?project=FIREBASE_PROJECT_ID`
   - Sostituisci `FIREBASE_PROJECT_ID` con il tuo ID progetto

### Cambiamenti non si vedono subito

**Motivo:** Cache browser e Google

**Soluzione:**
1. Logout completo da Google
2. Apri browser in modalità **incognito**
3. Riprova il login
4. Potrebbe volerci qualche minuto (max 1 ora)

### Errore "App non verificata"

**Quando appare:** App External pubblica senza verifica Google

**Soluzione:**
1. **Temporanea:** Clicca "Advanced" → "Go to [app name] (unsafe)"
2. **Definitiva:** Submit app per verifica Google
3. **Alternativa:** Usa "Testing" mode e aggiungi utenti

---

## ✅ Checklist Setup

- [ ] Aperto Google Cloud Console
- [ ] Trovato progetto Firebase
- [ ] Configurato OAuth Consent Screen
- [ ] Cambiato "App name" da "biondo-fitness-coach" a "FitFlow"
- [ ] Aggiunto email di supporto
- [ ] (Opzionale) Caricato logo 120x120px
- [ ] Aggiunto domini autorizzati
- [ ] (Se External) Aggiunto Privacy Policy link
- [ ] (Se External) Aggiunto Terms of Service link
- [ ] Salvato e pubblicato
- [ ] Testato in modalità incognito
- [ ] Verificato che il nome sia cambiato

---

## 🔗 Link Utili

- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **Firebase Console:** https://console.firebase.google.com/
- **Documentazione OAuth:** https://developers.google.com/identity/protocols/oauth2
- **Verifica App:** https://support.google.com/cloud/answer/9110914

---

## 📞 Supporto Rapido

**Voglio solo cambiare il nome velocemente:**

1. Vai su: https://console.cloud.google.com/apis/credentials/consent
2. Seleziona progetto Firebase
3. Clicca "Edit App"
4. Cambia "App name" → **FitFlow**
5. Salva
6. Testa in incognito dopo 5 minuti

**Non ho Privacy Policy/Terms:**

Per testing usa:
- Privacy: `https://tuodominio.com` (homepage)
- Terms: `https://tuodominio.com` (homepage)

Google accetta per testing, ma per produzione serve pagine dedicate.

---

## 🎉 Risultato Finale

Dopo la configurazione, gli utenti vedranno:

✅ **"FitFlow"** invece di "biondo-fitness-coach"
✅ Logo personalizzato (se caricato)
✅ Esperienza professionale
✅ Maggiore fiducia degli utenti
