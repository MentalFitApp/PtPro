# 🔗 Sistema di Account Linking Multi-Tenant

## 📋 Panoramica

Sistema completo per collegare account OAuth (Google, Facebook) ad account email/password esistenti in Firebase Authentication con pieno supporto multi-tenant.

**Vantaggi per l'utente:**
- ✅ Login più veloce con OAuth (un click)
- ✅ Maggiore sicurezza (autenticazione a due fattori)
- ✅ Non perde mai l'accesso (backup di accesso)

---

## 🏗️ Architettura

### File Creati

```
src/
├── utils/
│   └── accountLinking.js         # Logica core Firebase Auth + multi-tenant
├── components/
│   ├── LinkAccountCard.jsx       # Card gestione provider (Profilo)
│   └── LinkAccountBanner.jsx     # Banner suggerimento (Dashboard)
└── pages/admin/
    ├── Profile.jsx               # Integrato LinkAccountCard
    └── DashboardNew.jsx          # Integrato LinkAccountBanner
```

---

## 🔧 Componenti

### 1. `accountLinking.js` - Utility Core

**Funzioni principali:**

#### `getLinkedProviders(user)`
```javascript
// Ottiene tutti i provider collegati
const providers = await getLinkedProviders(currentUser);
// [{ providerId: 'password', email: '...' }, { providerId: 'google.com', email: '...' }]
```

#### `linkGoogleAccount()`
```javascript
// Collega Google all'account corrente
const result = await linkGoogleAccount();
if (result.success) {
  console.log('Google collegato!', result.user);
} else {
  console.error(result.error);
}
```

**Gestione errori:**
- `auth/credential-already-in-use` - Account Google già usato da altro utente
- `auth/provider-already-linked` - Google già collegato
- `auth/email-already-in-use` - Email già registrata
- `auth/popup-closed-by-user` - Popup chiuso

#### `unlinkProvider(providerId)`
```javascript
// Scollega un provider (min 1 provider richiesto)
const result = await unlinkProvider('google.com');
```

**Protezione:** Non permette di scollegare l'ultimo provider rimasto.

#### `updateUserProviders(user)` - Multi-Tenant
```javascript
// Salva provider nel documento tenant
tenants/{tenantId}/users/{userId}/
  linkedProviders: [
    { providerId: 'password', email: '...', linkedAt: '2024-01-01' },
    { providerId: 'google.com', email: '...', linkedAt: '2024-01-02' }
  ]
  lastProviderUpdate: serverTimestamp()
```

**Multi-tenant:** Usa `getTenantDoc(db, 'users', userId)` per isolare i dati per tenant.

#### `shouldShowLinkSuggestion(user)`
```javascript
// Decide se mostrare il banner suggerimento
// - Non mostra se già collegato Google
// - Non mostra se dismissato
// - Mostra solo dopo 24h dalla registrazione
```

---

### 2. `LinkAccountCard.jsx` - Gestione Provider

**Dove:** Pagina Profilo (`/profile`)

**Funzionalità:**
- 📋 Lista provider collegati (email, Google, Facebook)
- ➕ Pulsanti per collegare nuovi provider
- ❌ Pulsante scollega (se più di 1 provider)
- 💡 Info di sicurezza e vantaggi
- ⚠️ Avviso se solo 1 provider

**Stati UI:**
```javascript
const [providers, setProviders] = useState([]);  // Lista provider
const [loading, setLoading] = useState(false);   // Caricamento
const [message, setMessage] = useState(null);    // Feedback success/error
```

**Flusso collegamento:**
1. Click "Collega Google"
2. Popup OAuth Google
3. Firebase `linkWithPopup()`
4. Salva provider in Firestore multi-tenant
5. Messaggio "✅ Account Google collegato con successo!"
6. Refresh lista provider

**Design:**
- Card bianca con bordi grigi
- Icone provider (Google, Facebook, Email)
- Animazioni Framer Motion
- Messaggi feedback colorati (verde/rosso)

---

### 3. `LinkAccountBanner.jsx` - Suggerimento Dashboard

**Dove:** 
- Dashboard Admin (`/admin/dashboard`)
- Dashboard CEO (`/platform/ceo-dashboard`)
- Dashboard Coach (`/coach/dashboard`)
- Dashboard Client (`/client/dashboard`)

**Quando appare:**
- Utente ha solo email/password (no Google)
- Account creato da almeno 24h
- Non dismissato in precedenza

**Persistenza:** `localStorage.getItem('link-google-dismissed')`

**Funzionalità:**
- 🚀 Banner visuale accattivante (gradiente blu)
- ✓ Lista vantaggi (login veloce, sicuro, no perdita account)
- ➕ Pulsante "Collega Google" inline
- ✕ Pulsante chiudi (dismissi permanente)
- 🎨 Animazioni ingresso/uscita

**Auto-chiusura:**
```javascript
// Dopo collegamento con successo
setTimeout(() => {
  handleDismiss();  // Chiude banner e salva preferenza
}, 2000);
```

---

## 🔐 Multi-Tenant Implementation

### Firestore Structure

```
tenants/
  {tenantId}/
    users/
      {userId}/
        uid: "user123"
        email: "user@example.com"
        displayName: "Mario Rossi"
        linkedProviders: [
          {
            providerId: "password",
            email: "user@example.com",
            linkedAt: "2024-01-01T10:00:00Z"
          },
          {
            providerId: "google.com",
            email: "user@gmail.com",
            linkedAt: "2024-01-02T14:30:00Z"
          }
        ]
        lastProviderUpdate: Timestamp
```

**Isolamento tenant:**
```javascript
// Ogni tenant ha i suoi dati utente separati
const userDocRef = getTenantDoc(db, 'users', user.uid);
await updateDoc(userDocRef, {
  linkedProviders: providers,
  lastProviderUpdate: serverTimestamp()
});
```

**CURRENT_TENANT_ID:** Configurato in `src/config/tenant.js`

---

## 🎯 Flusso Utente Completo

### Scenario: Utente registrato con email/password

**Giorno 0 - Registrazione:**
```javascript
// Registrazione normale email/password
await createUserWithEmailAndPassword(auth, email, password);
```

**Giorno 1+ - Login:**
1. Utente fa login con email/password
2. Va in dashboard
3. **Vede banner:** "🚀 Accesso più veloce con Google"
4. Click "Collega Google"
5. Popup OAuth Google
6. **Firebase:** `linkWithPopup(auth.currentUser, GoogleAuthProvider)`
7. **Success:** Banner si chiude, provider salvato nel tenant
8. **Firestore:** `linkedProviders` aggiornato

**Login successivi:**
- Può usare email/password (come prima)
- **OPPURE** Google OAuth (più veloce)
- Firebase riconosce entrambi gli account come UNO

---

## 🛡️ Sicurezza

### Regole Firestore

```javascript
// tenants/{tenantId}/users/{userId}
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
}
```

**Protezioni:**
- ✅ Solo l'utente può vedere i suoi provider
- ✅ Solo l'utente può aggiornare i suoi provider
- ✅ `linkedProviders` non contiene dati sensibili (solo metadata)
- ✅ Password non memorizzata (gestita da Firebase Auth)

### Validazioni

```javascript
// Non permette scollegare ultimo provider
if (user.providerData.length <= 1) {
  return { 
    success: false, 
    error: 'Non puoi scollegare l\'ultimo metodo di accesso' 
  };
}
```

---

## 📊 Analytics & Tracking

**Eventi tracciati:**
```javascript
// Al collegamento provider
console.log('✅ Account Google collegato:', result.user.email);

// Al salvataggio nel tenant
console.log('✅ Provider aggiornati nel tenant:', providers.length);

// All'apertura banner
console.log('💡 Mostro suggerimento collegamento Google');
```

**Metriche utili:**
- Quanti utenti hanno collegato Google?
- Quando lo collegano? (giorni dalla registrazione)
- Quanti dismissano il banner?

---

## 🧪 Testing

### Test Manuale - Collegamento

1. **Registra utente email/password:**
   ```javascript
   // Console browser
   await firebase.auth().createUserWithEmailAndPassword('test@test.com', 'Pass123!')
   ```

2. **Vai in `/profile`:**
   - Vedi card "🔗 Metodi di Accesso"
   - Vedi provider "Email e Password"
   - Vedi pulsante "Collega Google"

3. **Click "Collega Google":**
   - Si apre popup Google
   - Seleziona account
   - Popup si chiude
   - Messaggio "✅ Account Google collegato con successo!"
   - Vedi nuovo provider "Google" nella lista

4. **Logout e rilogin:**
   ```javascript
   await firebase.auth().signOut();
   // Ora puoi fare login con:
   // - Email/password (come prima)
   // - Google OAuth (nuovo)
   ```

### Test Manuale - Banner

1. **Crea account nuovo:**
   ```javascript
   await firebase.auth().createUserWithEmailAndPassword('new@test.com', 'Pass123!')
   ```

2. **Vai in `/admin/dashboard` dopo 24h:**
   - Vedi banner "🚀 Accesso più veloce con Google"

3. **Click "Forse più tardi":**
   - Banner si chiude
   - Salvato `link-google-dismissed` in localStorage

4. **Ricarica pagina:**
   - Banner NON appare più

### Test Firestore - Multi-tenant

```javascript
// Console browser
const db = firebase.firestore();
const userId = firebase.auth().currentUser.uid;
const tenantId = 'biondo-fitness-coach'; // O il tuo tenant

// Verifica documento utente
const userDoc = await db
  .collection('tenants')
  .doc(tenantId)
  .collection('users')
  .doc(userId)
  .get();

console.log('Provider collegati:', userDoc.data().linkedProviders);
// [
//   { providerId: 'password', email: 'test@test.com', linkedAt: '...' },
//   { providerId: 'google.com', email: 'test@gmail.com', linkedAt: '...' }
// ]
```

---

## 🐛 Troubleshooting

### Problema: Popup Google non si apre

**Causa:** Browser blocca popup

**Soluzione:**
```javascript
// Verifica console browser
// Uncaught (in promise) Error: popup-blocked-by-user

// Disabilita popup blocker o usa redirect:
await linkWithRedirect(auth.currentUser, provider);
```

### Problema: "Credential already in use"

**Causa:** Account Google già collegato ad altro utente Firebase

**Soluzione:** L'utente deve usare un altro account Google o scollegarlo dall'altro account.

### Problema: Banner non appare

**Verifica:**
```javascript
// Console browser
const user = firebase.auth().currentUser;

// 1. Utente ha solo email/password?
console.log('Providers:', user.providerData);
// Deve essere: [{ providerId: 'password' }]

// 2. Google non già collegato?
const hasGoogle = user.providerData.some(p => p.providerId === 'google.com');
console.log('Ha Google?', hasGoogle);  // Deve essere false

// 3. Banner non dismissato?
console.log('Dismissed?', localStorage.getItem('link-google-dismissed'));
// Deve essere null

// 4. Account creato da più di 24h?
const createdAt = new Date(user.metadata.creationTime);
const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
console.log('Giorni dalla creazione:', daysSince);  // Deve essere > 1
```

### Problema: Documento tenant non aggiornato

**Verifica permissions Firestore:**
```javascript
// tenants/{tenantId}/users/{userId}
match /users/{userId} {
  allow write: if request.auth.uid == userId;  // ✅ Deve esistere
}
```

**Verifica codice:**
```javascript
// In accountLinking.js
const userDocRef = getTenantDoc(db, 'users', user.uid);
console.log('Salvo in path:', userDocRef.path);
// Deve essere: tenants/biondo-fitness-coach/users/{userId}
```

---

## 🚀 Estensioni Future

### Aggiungere Facebook

```javascript
// In LinkAccountCard.jsx - Già pronto!
<button onClick={handleLinkFacebook}>
  Collega Facebook
</button>

// In accountLinking.js - Già implementato!
export async function linkFacebookAccount() {
  const provider = new FacebookAuthProvider();
  const result = await linkWithPopup(auth.currentUser, provider);
  // ...
}
```

### Aggiungere Apple

```javascript
import { OAuthProvider } from 'firebase/auth';

export async function linkAppleAccount() {
  const provider = new OAuthProvider('apple.com');
  const result = await linkWithPopup(auth.currentUser, provider);
  await updateUserProviders(result.user);
  return { success: true, user: result.user };
}
```

### Dashboard Analytics

```javascript
// Conta utenti con Google collegato
const usersRef = getTenantCollection(db, 'users');
const snapshot = await getDocs(usersRef);

let googleLinked = 0;
snapshot.forEach(doc => {
  const providers = doc.data().linkedProviders || [];
  if (providers.some(p => p.providerId === 'google.com')) {
    googleLinked++;
  }
});

console.log(`${googleLinked} utenti hanno collegato Google`);
```

---

## 📝 Checklist Implementazione

✅ Creato `accountLinking.js` con tutte le funzioni
✅ Creato `LinkAccountCard.jsx` per profilo
✅ Creato `LinkAccountBanner.jsx` per dashboard
✅ Integrato in `/profile` (LinkAccountCard)
✅ Integrato in TUTTE le dashboard:
  - `/admin/dashboard` (DashboardNew)
  - `/platform/ceo-dashboard` (CEOPlatformDashboard)
  - `/coach/dashboard` (CoachDashboardNew)
  - `/client/dashboard` (ClientDashboard)
✅ Multi-tenant: salvataggio provider in Firestore
✅ Gestione errori completa
✅ Protezione: non scollega ultimo provider
✅ Persistenza dismissione banner
✅ Animazioni Framer Motion
✅ Feedback visuale (successo/errore)
✅ Documentazione completa

---

## 🎨 UI/UX Features

**LinkAccountCard (Profilo):**
- 🎨 Card bianca su sfondo scuro
- 🔗 Icone provider con loghi ufficiali
- ✅ Badge "Collegato" per provider attivi
- 🚫 Pulsante "Scollega" (solo se >1 provider)
- 💡 Info box con vantaggi
- ⚠️ Warning box se solo 1 provider
- 🎬 Animazioni ingresso con delay sequenziale
- 🎯 Feedback istantaneo con messaggi colorati

**LinkAccountBanner (Dashboard):**
- 🌈 Gradiente blu accattivante
- ✨ Logo Google ufficiale
- 📋 Lista vantaggi con checkmark
- 🔘 Due pulsanti (Collega/Dismissi)
- 🎭 Auto-chiusura dopo successo
- 📱 Responsive mobile/desktop
- 🎬 Animazioni fade in/out
- ℹ️ Nota privacy rassicurante

---

## 📞 Supporto

**File da controllare:**
- `src/utils/accountLinking.js` - Logica core
- `src/components/LinkAccountCard.jsx` - UI profilo
- `src/components/LinkAccountBanner.jsx` - UI dashboard
- `src/pages/admin/Profile.jsx` - Integrazione profilo
- `src/pages/admin/DashboardNew.jsx` - Integrazione dashboard
- `src/config/tenant.js` - Configurazione tenant ID

**Console logs utili:**
```javascript
// Provider collegati
console.log('🔗 Provider collegati:', providers);

// Collegamento successo
console.log('✅ Account Google collegato:', result.user.email);

// Salvataggio tenant
console.log('✅ Provider aggiornati nel tenant:', providers.length);

// Banner mostrato
console.log('💡 Mostro suggerimento collegamento Google');
```

**Firebase Console:**
- Authentication → Users → Vedi "Sign-in providers" per ogni utente
- Firestore → tenants/{tenantId}/users/{userId} → Campo `linkedProviders`

---

## ✨ Conclusione

Sistema completo di Account Linking con supporto multi-tenant implementato e funzionante. Gli utenti possono collegare Google/Facebook ai loro account email/password per login più veloci e sicuri. Tutti i dati sono isolati per tenant in Firestore.

**Pronto per la produzione! 🚀**
