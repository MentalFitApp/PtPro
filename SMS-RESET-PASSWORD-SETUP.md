# 📱 Setup Reset Password via SMS con Twilio

Guida completa per implementare il reset password via SMS usando Twilio e Firebase Cloud Functions.

## 🎯 Prerequisiti

1. **Account Twilio** (https://www.twilio.com)
   - Registrati gratuitamente (ricevi $15 di credito)
   - Verifica il tuo account per inviare SMS a numeri reali
   - Account trial: può inviare solo a numeri verificati
   - Account production: può inviare a qualsiasi numero

2. **Firebase CLI** installato e autenticato
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Node.js 18+** per le Cloud Functions

---

## 📋 Step 1: Configurazione Twilio

### 1.1 Ottieni le credenziali Twilio

1. Vai su [Twilio Console](https://console.twilio.com)
2. Dashboard → **Account SID** e **Auth Token** (clicca "Show" per rivelare)
3. **Phone Numbers** → Acquista un numero Twilio (o usa quello trial)
   - Formato: `+393123456789` (con prefisso internazionale)

### 1.2 Numeri verificati (solo per account trial)

Se sei in modalità trial, devi verificare i numeri dei destinatari:
- Twilio Console → **Phone Numbers** → **Verified Caller IDs**
- Aggiungi il tuo numero di telefono e completa la verifica

---

## 🔐 Step 2: Configurare i Secrets in Firebase

I secrets vengono salvati in modo sicuro su Firebase (NON nel codice).

### 2.1 Imposta i secrets via CLI

```bash
# Nella directory root del progetto
firebase functions:secrets:set TWILIO_ACCOUNT_SID
# Incolla il valore e premi Enter

firebase functions:secrets:set TWILIO_AUTH_TOKEN
# Incolla il valore e premi Enter

firebase functions:secrets:set TWILIO_PHONE_NUMBER
# Esempio: +393123456789 (con + e prefisso paese)
```

### 2.2 Verifica i secrets configurati

```bash
firebase functions:secrets:access TWILIO_ACCOUNT_SID
firebase functions:secrets:access TWILIO_AUTH_TOKEN
firebase functions:secrets:access TWILIO_PHONE_NUMBER
```

---

## 📦 Step 3: Installare dipendenze Cloud Functions

```bash
cd functions
npm install twilio
cd ..
```

Il package è già presente in `functions/package.json`:
```json
{
  "dependencies": {
    "twilio": "^5.3.5"
  }
}
```

---

## 🚀 Step 4: Deploy delle Cloud Functions

### 4.1 Deploy solo le nuove functions

```bash
# Deploy solo sendSmsPasswordReset e verifySmsResetCode
firebase deploy --only functions:sendSmsPasswordReset,functions:verifySmsResetCode
```

### 4.2 Deploy tutte le functions

```bash
firebase deploy --only functions
```

### 4.3 Verifica deploy

Vai su [Firebase Console](https://console.firebase.google.com):
- **Functions** → Dovresti vedere:
  - ✅ `sendSmsPasswordReset`
  - ✅ `verifySmsResetCode`

---

## 🔥 Step 5: Configurazione Firestore

Le Cloud Functions creano automaticamente 2 collezioni:

### 5.1 `sms_rate_limits` (rate limiting)
Previene spam di SMS (max 3 tentativi in 10 minuti per email).

**Struttura:**
```javascript
{
  [email]: {
    attempts: 1,
    lastAttempt: Timestamp
  }
}
```

### 5.2 `password_reset_otps` (codici OTP)
Salva codici di reset temporanei con scadenza 10 minuti.

**Struttura:**
```javascript
{
  [email]: {
    code: "123456",           // Codice a 6 cifre
    email: "user@example.com",
    phoneNumber: "+393123456789",
    userId: "firebaseUID",
    tenantId: "tenant_id",
    createdAt: Timestamp,
    expiresAt: Timestamp,     // +10 minuti
    verified: false,
    attempts: 0               // Max 5 tentativi
  }
}
```

### 5.3 Regole Firestore (opzionale ma consigliato)

Aggiungi queste regole in `firestore.rules`:

```javascript
match /sms_rate_limits/{email} {
  allow read, write: if false; // Solo Cloud Functions
}

match /password_reset_otps/{email} {
  allow read, write: if false; // Solo Cloud Functions
}
```

Poi deploy:
```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Step 6: Testing

### 6.1 Test frontend

1. Apri la pagina di login: `http://localhost:5173` (o URL produzione)
2. Inserisci un'email con numero di telefono associato
3. Clicca "Hai dimenticato la password?"
4. Se trova un numero → vedi tab **📱 SMS**
5. Clicca tab SMS → clicca "Invia Codice via SMS"
6. Ricevi SMS con codice a 6 cifre
7. Inserisci il codice → clicca "Verifica Codice"
8. Se corretto → apre link Firebase per reset password

### 6.2 Test Cloud Functions da console

```bash
# Test sendSmsPasswordReset
firebase functions:shell

# Nel prompt della shell:
sendSmsPasswordReset({data: {email: 'test@example.com', tenantId: 'your_tenant_id'}})
```

### 6.3 Logs Cloud Functions

```bash
# Visualizza logs in real-time
firebase functions:log --only sendSmsPasswordReset,verifySmsResetCode

# O su Firebase Console → Functions → Logs
```

---

## 📊 Step 7: Monitoraggio Costi Twilio

### SMS Pricing (Pay-as-you-go)
- 🇮🇹 Italia: ~$0.065/SMS (~6 cent)
- 🇺🇸 USA: ~$0.0079/SMS (~0.8 cent)
- 🇪🇺 Europa: ~$0.05-0.10/SMS

### Calcolo costi mensili
- 100 reset/mese = ~$6.50
- 500 reset/mese = ~$32.50
- 1000 reset/mese = ~$65.00

### Monitoraggio
Vai su Twilio Console → **Usage** → **Messages** per vedere:
- SMS inviati
- Costi in tempo reale
- Errori di invio

---

## 🛡️ Sicurezza Best Practices

### ✅ Già implementate

1. **Rate Limiting**
   - Max 3 richieste SMS ogni 10 minuti per email
   - Max 5 tentativi di verifica codice

2. **Scadenza OTP**
   - Codici validi solo 10 minuti
   - Auto-cancellazione dopo verifica

3. **Secrets Management**
   - Credenziali Twilio salvate come Firebase Secrets
   - Mai esposti nel frontend o repository

4. **Validazione Input**
   - Email e tenantId richiesti
   - Formato numero telefono validato
   - Codice OTP solo numeri (6 cifre)

### 🔒 Raccomandazioni aggiuntive

1. **Alert Twilio**: Configura alert su Twilio per spike anomali
2. **Budget Limit**: Imposta limite di spesa mensile su Twilio
3. **Logs Monitoring**: Monitora Firebase Functions logs per abusi
4. **IP Blocking**: Aggiungi IP blocking se noti spam patterns

---

## 🐛 Troubleshooting

### Errore: "Twilio credentials not found"
✅ **Soluzione**: Verifica che i secrets siano configurati correttamente:
```bash
firebase functions:secrets:access TWILIO_ACCOUNT_SID
firebase functions:secrets:access TWILIO_AUTH_TOKEN
firebase functions:secrets:access TWILIO_PHONE_NUMBER
```

### Errore: "Unable to create record: The 'To' number is not a valid phone number"
✅ **Soluzione**: 
- Verifica che il numero sia in formato internazionale: `+393123456789`
- Se account trial: aggiungi numero a Verified Caller IDs

### Errore: "Authenticate with Twilio failed"
✅ **Soluzione**:
- Verifica Account SID e Auth Token su Twilio Console
- Re-deploy functions dopo aver aggiornato i secrets

### SMS non arrivano
✅ **Controlli**:
1. Twilio Console → **Logs** → **Message Logs** (vedi status SMS)
2. Account trial? Verifica numero destinatario
3. Numero bloccato da operatore? Prova con altro numero
4. Credito Twilio esaurito? Controlla saldo

### Codice OTP scaduto troppo velocemente
✅ **Modifica durata**: In `functions/index.js` cambia:
```javascript
const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minuti
// Cambia in 15 minuti:
const expiresAt = new Date(now + 15 * 60 * 1000);
```

---

## 📝 Struttura File Modificati

```
PtPro/
├── functions/
│   ├── index.js             ✅ Aggiunte 2 Cloud Functions
│   └── package.json         ✅ Aggiunto twilio dependency
├── src/
│   └── pages/
│       └── auth/
│           └── Login.jsx    ✅ UI per SMS reset + OTP form
└── SMS-RESET-PASSWORD-SETUP.md  📄 Questo file
```

---

## 🎨 UX Flow Completo

1. **Utente** inserisce email nel login
2. **Frontend** cerca numero telefono associato via Firestore
3. Se **numero trovato** → mostra tab SMS
4. **Utente** clicca "Invia Codice via SMS"
5. **Cloud Function** `sendSmsPasswordReset`:
   - Genera codice OTP a 6 cifre
   - Salva in Firestore con scadenza 10 min
   - Invia SMS tramite Twilio
6. **Utente** inserisce codice ricevuto
7. **Cloud Function** `verifySmsResetCode`:
   - Verifica codice (max 5 tentativi)
   - Se corretto: marca come verificato + genera reset link
8. **Frontend** apre link Firebase per cambio password
9. **Utente** imposta nuova password

---

## 💰 Alternative a Twilio

Se preferisci altri provider SMS:

### AWS SNS (Amazon Simple Notification Service)
- **Pro**: Più economico per grandi volumi
- **Contro**: Setup più complesso
- **Prezzo**: ~$0.00645/SMS

### Vonage (ex Nexmo)
- **Pro**: Buone API, simile a Twilio
- **Prezzo**: ~$0.0055/SMS

### MessageBird
- **Pro**: Copertura globale eccellente
- **Prezzo**: ~$0.05/SMS

**Per cambiarli**: Sostituisci il codice Twilio in `functions/index.js` con il loro SDK.

---

## ✅ Checklist Deploy Produzione

- [ ] Account Twilio verificato (non trial)
- [ ] Numero Twilio acquistato
- [ ] Secrets configurati su Firebase
- [ ] Functions deployate con successo
- [ ] Regole Firestore aggiornate
- [ ] Test invio SMS funzionante
- [ ] Test verifica codice funzionante
- [ ] Monitoring Twilio configurato
- [ ] Budget limit impostato su Twilio
- [ ] Logs Firebase Functions monitorati

---

## 🆘 Support

**Issues comuni**:
- [Twilio Documentation](https://www.twilio.com/docs/sms)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env)
- [Firebase Community](https://stackoverflow.com/questions/tagged/firebase)

**Per problemi specifici del progetto**:
Contatta il team di sviluppo o apri issue su GitHub.

---

## 🚀 Prossimi Miglioramenti

- [ ] Supporto SMS internazionali multi-lingua
- [ ] Personalizzazione messaggio SMS per tenant
- [ ] Statistiche reset password (dashboard admin)
- [ ] Backup email se SMS fallisce
- [ ] Autenticazione 2FA completa (oltre al reset)

---

**Data creazione**: 2026-01-09  
**Versione**: 1.0  
**Autore**: GitHub Copilot  
