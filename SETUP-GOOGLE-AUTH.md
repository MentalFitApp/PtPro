# 🔧 Setup Google Authentication - Firebase

## ❌ Errore: `auth/operation-not-allowed`

**Causa:** Il provider Google OAuth non è abilitato nella console Firebase.

---

## ✅ Soluzione: Abilita Google Sign-In

### 1. Vai alla Console Firebase

🔗 **Link diretto:** https://console.firebase.google.com/

### 2. Seleziona il tuo progetto

- Clicca sul progetto **PtPro** (o il nome del tuo progetto)

### 3. Vai in Authentication

1. Nel menu laterale, clicca **Build** → **Authentication**
2. Clicca sulla tab **Sign-in method** in alto

### 4. Abilita Google Provider

#### Passo 1: Aggiungi Provider
- Clicca su **"Add new provider"** (o "Aggiungi nuovo provider")
- Oppure trova **Google** nella lista e clicca sull'icona della matita ✏️

#### Passo 2: Abilita
- Attiva il toggle **"Enable"** (Abilita)

#### Passo 3: Configura Email
- **Project support email:** Seleziona la tua email dal dropdown
  - Questa email sarà mostrata agli utenti durante il login Google

#### Passo 4: Salva
- Clicca **"Save"** (Salva)

---

## 📋 Configurazione Completa

### Screenshot delle impostazioni:

```
┌─────────────────────────────────────────────────┐
│ Google                                    ✏️  🗑️ │
├─────────────────────────────────────────────────┤
│ ✅ Enable (Attiva)                              │
│                                                 │
│ Web SDK configuration                           │
│ Web client ID: [auto-generato]                 │
│ Web client secret: [auto-generato]             │
│                                                 │
│ Project support email *                         │
│ ┌──────────────────────────────────────┐       │
│ │ tua-email@esempio.com            ▼  │       │
│ └──────────────────────────────────────┘       │
│                                                 │
│        [Cancel]          [Save]                │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Verifica Configurazione

### Test dalla Console Browser

```javascript
// Apri console del browser (F12)
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();

// Prova login
signInWithPopup(auth, provider)
  .then((result) => {
    console.log('✅ Google login OK:', result.user.email);
  })
  .catch((error) => {
    console.error('❌ Errore:', error.code, error.message);
  });
```

### Test dall'App

1. Vai alla pagina `/login`
2. Clicca **"Accedi con Google"**
3. Seleziona account Google
4. Se funziona → ✅ Configurazione corretta
5. Se errore → Verifica i passi sopra

---

## 🔐 Provider Supportati

Puoi abilitare anche altri provider nella stessa sezione:

### Provider OAuth Disponibili:
- ✅ **Google** (implementato)
- ✅ **Facebook** (codice pronto, da abilitare)
- ⬜ **Apple** (da implementare)
- ⬜ **Microsoft** (da implementare)
- ⬜ **Twitter** (da implementare)
- ⬜ **GitHub** (da implementare)

---

## 🌐 Domini Autorizzati

Firebase autorizza automaticamente questi domini:
- `localhost` (sviluppo locale)
- `*.firebaseapp.com` (hosting Firebase)
- `*.web.app` (hosting Firebase)

### Aggiungere Domini Custom:

1. Vai in **Authentication** → **Settings** → **Authorized domains**
2. Clicca **"Add domain"**
3. Inserisci il tuo dominio (es: `tuodominio.com`)
4. Salva

---

## 🐛 Troubleshooting

### Errore: `auth/unauthorized-domain`

**Problema:** Il dominio da cui stai facendo login non è autorizzato.

**Soluzione:**
1. Authentication → Settings → Authorized domains
2. Aggiungi il dominio (senza `http://` o `https://`)
3. Esempi:
   - ✅ `localhost`
   - ✅ `miapp.vercel.app`
   - ✅ `tuodominio.com`
   - ❌ `https://tuodominio.com` (sbagliato)

### Errore: `auth/popup-blocked`

**Problema:** Browser blocca il popup OAuth.

**Soluzione:**
1. Consenti popup per il tuo sito
2. Oppure usa redirect invece di popup:

```javascript
import { signInWithRedirect } from 'firebase/auth';

// Invece di signInWithPopup
await signInWithRedirect(auth, provider);
```

### Errore: `auth/cancelled-popup-request`

**Problema:** Popup già aperto, utente ha cliccato di nuovo.

**Soluzione:** Ignoralo o disabilita il pulsante durante il caricamento:

```javascript
const [loading, setLoading] = useState(false);

const handleGoogleLogin = async () => {
  if (loading) return; // Previene doppio click
  setLoading(true);
  
  try {
    await signInWithPopup(auth, provider);
  } finally {
    setLoading(false);
  }
};
```

---

## 📱 Configurazione Mobile (opzionale)

### Per app iOS/Android:

1. **iOS:**
   - Scarica `GoogleService-Info.plist`
   - Aggiungi al progetto Xcode
   - Configura URL schemes

2. **Android:**
   - Scarica `google-services.json`
   - Aggiungi in `android/app/`
   - Configura SHA-1 fingerprint

3. **React Native / Expo:**
   - Installa `@react-native-firebase/auth`
   - Segui documentazione Firebase

---

## ✅ Checklist Setup Completo

- [ ] Google provider abilitato in Firebase Console
- [ ] Email di supporto configurata
- [ ] Domini autorizzati aggiunti (se necessario)
- [ ] Test login Google da browser
- [ ] Test login Google da app
- [ ] Verifica salvamento provider in Firestore
- [ ] Test logout e re-login
- [ ] Test collegamento account (linking)

---

## 🔗 Link Utili

- **Firebase Console:** https://console.firebase.google.com/
- **Documentazione Google Sign-In:** https://firebase.google.com/docs/auth/web/google-signin
- **Gestione Provider:** https://firebase.google.com/docs/auth/web/account-linking
- **Troubleshooting Auth:** https://firebase.google.com/docs/auth/web/start#troubleshooting

---

## 📞 Supporto

Se continui ad avere problemi:

1. Verifica che il provider sia **abilitato** (toggle verde)
2. Controlla la **console browser** per errori dettagliati
3. Verifica che l'email di supporto sia **configurata**
4. Prova in **modalità incognito** (cache pulita)
5. Controlla i **domini autorizzati**

---

## 🎉 Dopo il Setup

Una volta abilitato Google:

✅ Gli utenti possono **collegare** Google al loro account email/password
✅ Gli utenti possono **fare login** con Google (se già collegato)
✅ Il banner suggerimento apparirà dopo 24h dalla registrazione
✅ La card nel profilo mostrerà Google come provider collegato

**Nota:** Gli utenti devono prima **registrarsi con email/password**, poi possono **collegare Google** per login più veloce.
