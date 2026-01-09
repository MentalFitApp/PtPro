# 🔔 GUIDA COMPLETA NOTIFICHE PUSH - TROUBLESHOOTING

## ✅ Problema Risolto

**Errore "orderBy is not defined"** → RISOLTO  
Aggiunto import `orderBy` in `notificationService.js`

---

## 🔍 PAGINA DI DEBUG

Vai su: **/notification-debug**

Questa pagina ti permette di:
- ✅ Verificare tutti i permessi
- ✅ Controllare stato Service Worker  
- ✅ Vedere token FCM salvato
- ✅ Inviare notifiche di test
- ✅ Diagnosticare problemi

---

## 📱 COME FUNZIONANO LE NOTIFICHE

### Quando l'app è APERTA:
- Le notifiche vengono gestite da `onMessage` listener
- Appaiono come toast/banner dentro l'app
- Gestite da: `src/hooks/usePushNotifications.jsx`

### Quando l'app è CHIUSA:
- Le notifiche vengono gestite dal Service Worker
- Appaiono nel centro notifiche del sistema
- Gestite da: `service-worker.js` (evento 'push')

---

## 🚨 CHECKLIST COMPLETA

### 1️⃣ PERMESSI BROWSER

**Controlla:**
```javascript
// In DevTools Console
Notification.permission
// Deve essere: "granted"
```

**Se non è "granted":**
1. Vai su `/notification-debug`
2. Clicca "Richiedi Permessi"
3. Accetta nel popup del browser

**Se hai negato i permessi:**
1. Chrome: Impostazioni > Privacy > Notifiche
2. Safari: Preferenze > Siti web > Notifiche
3. Firefox: Opzioni > Privacy > Notifiche
4. Trova il tuo sito e cambia da "Blocca" a "Consenti"

---

### 2️⃣ SERVICE WORKER

**Controlla:**
1. DevTools > Application > Service Workers
2. Deve esserci un SW con stato: "activated and running"
3. URL: `/service-worker.js`

**Se non c'è o non è attivo:**
1. Ricarica la pagina (Ctrl+R)
2. Se ancora non c'è, clicca "Update" in DevTools
3. Se ancora problemi, cancella cache: DevTools > Application > Clear Storage

**Test manuale:**
```javascript
// In DevTools Console
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registrati:', regs.length))
```

---

### 3️⃣ TOKEN FCM

**Controlla su `/notification-debug`:**
- Sezione "Token FCM" deve essere verde
- Deve mostrare un token lungo ~150 caratteri

**Se non c'è token:**
1. Vai in Impostazioni app
2. Sezione "Notifiche Push"
3. Attiva il toggle
4. Accetta i permessi nel popup

**Token salvato in Firestore:**
```
tenants/fitflows/users/{userId}
  - fcmToken: "..." 
  - pushEnabled: true
  - updatedAt: timestamp
```

**Se token non si salva:**
1. Controlla console browser (F12) per errori
2. Verifica permessi Firestore rules
3. Prova disattivare/riattivare notifiche

---

### 4️⃣ HTTPS / SSL

**Notifiche funzionano SOLO su:**
- ✅ `https://...` (produzione)
- ✅ `localhost` (sviluppo)
- ❌ `http://...` (NON FUNZIONA)

**Controlla:**
- Barra indirizzi deve mostrare lucchetto 🔒
- URL deve iniziare con `https://`

---

### 5️⃣ FIREBASE CONFIG

**Verifica nel codice:**

File: `src/firebase.js`
```javascript
messagingSenderId: "..." // Deve essere configurato
```

File: `src/hooks/usePushNotifications.jsx`
```javascript
const VAPID_KEY = "BPBjZH1KnB4fC..." // Deve essere il VAPID key corretto
```

**Ottieni VAPID Key:**
1. Firebase Console
2. Project Settings
3. Cloud Messaging
4. Web Push certificates
5. Copia "Key pair"

---

### 6️⃣ BACKEND / SERVER KEY

**Per inviare notifiche serve:**

File: `.env` (backend/cloud functions)
```bash
FCM_SERVER_KEY=AAAA...
```

**Ottieni Server Key:**
1. Firebase Console
2. Project Settings
3. Cloud Messaging
4. "Server key" (NON API key!)

---

## 🧪 TEST NOTIFICHE PER admin12@live.it

### Metodo 1: Da `/notification-debug`

1. Login come admin12@live.it
2. Vai su `/notification-debug`
3. Se permessi non attivi, clicca "Richiedi Permessi"
4. Clicca "Invia Test"
5. Controlla se arriva notifica

### Metodo 2: Da Settings

1. Login come admin12@live.it
2. Vai su `/settings`
3. Sezione "Notifiche Push"
4. Attiva toggle
5. Chiudi l'app completamente
6. Da altro dispositivo/account admin, invia notifica broadcast da `/notifications`
7. Controlla se arriva su dispositivo di admin12

### Metodo 3: Trigger automatico

Crea un evento che trigger notifica:
- Nuovo cliente
- Nuovo check-in
- Nuova anamnesi
- Richiesta chiamata

---

## 🐛 PROBLEMI COMUNI

### ❌ "Notifiche non arrivano quando app è chiusa"

**Causa possibile:**
1. Service Worker non attivo
2. Token FCM scaduto
3. Permessi browser revocati

**Soluzione:**
```bash
# 1. Verifica SW
DevTools > Application > Service Workers > deve essere "activated"

# 2. Rigenera token
Settings > Notifiche > Disattiva/Riattiva

# 3. Verifica permessi
DevTools Console > Notification.permission > deve essere "granted"
```

---

### ❌ "Token FCM non si salva"

**Causa:** Firestore Rules o errore network

**Soluzione:**
```javascript
// In DevTools Console, testa manualmente:
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { getTenantDoc } from './config/tenant';

const testToken = 'test-token-123';
const userRef = getTenantDoc(db, 'users', auth.currentUser.uid);
await setDoc(userRef, { 
  fcmToken: testToken,
  pushEnabled: true,
  updatedAt: new Date()
}, { merge: true });

// Se questo fallisce, problema è Firestore Rules
```

**Firestore Rules devono permettere:**
```javascript
match /tenants/{tenant}/users/{userId} {
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

---

### ❌ "Permessi sempre 'default' o 'denied'"

**Su desktop:**
1. Impostazioni browser > Privacy > Notifiche
2. Rimuovi il sito dalla lista
3. Ricarica pagina
4. Richiedi permessi di nuovo

**Su mobile:**
1. Impostazioni dispositivo > App
2. Trova browser (Chrome/Safari)
3. Permessi > Notifiche > Consenti
4. Se PWA: Impostazioni > App installate > [TuaApp] > Notifiche > Consenti

---

### ❌ "Su iOS non funzionano"

**iOS richiede:**
- ✅ iOS 16.4 o superiore
- ✅ App installata come PWA (Add to Home Screen)
- ✅ Safari (altri browser non supportano)

**Come installare PWA su iOS:**
1. Apri sito in Safari
2. Tap icona condividi (quadrato con freccia)
3. "Aggiungi a Home"
4. Apri app dalla Home
5. Attiva notifiche

---

### ❌ "Errore: messaging/registration-token-not-registered"

**Causa:** Token scaduto o non valido

**Soluzione:**
1. Elimina token da Firestore:
```javascript
const userRef = getTenantDoc(db, 'users', auth.currentUser.uid);
await updateDoc(userRef, { fcmToken: null, pushEnabled: false });
```

2. Disattiva e riattiva notifiche in Settings
3. Nuovo token verrà generato

---

## 📊 MONITORING

### Log utili

**Service Worker logs:**
```javascript
// In DevTools Console
navigator.serviceWorker.ready.then(reg => {
  console.log('SW pronto:', reg);
  return reg.pushManager.getSubscription();
}).then(sub => console.log('Subscription:', sub));
```

**Firebase Messaging logs:**
```javascript
// In src/hooks/usePushNotifications.jsx
console.log('[Push] Token ottenuto:', token);
console.log('[Push] Permesso:', permission);
```

**Firestore logs:**
```javascript
// Verifica token salvato
const userRef = getTenantDoc(db, 'users', auth.currentUser.uid);
const userSnap = await getDoc(userRef);
console.log('User data:', userSnap.data());
```

---

## 🎯 RIASSUNTO VELOCE

**Per far funzionare notifiche quando app è chiusa:**

1. ✅ HTTPS attivo
2. ✅ `Notification.permission === 'granted'`
3. ✅ Service Worker attivo (DevTools > Application)
4. ✅ Token FCM salvato in Firestore (`users/{uid}/fcmToken`)
5. ✅ Backend configurato con FCM_SERVER_KEY
6. ✅ Su iOS: app installata come PWA

**Test rapido:**
```bash
1. Vai su /notification-debug
2. Verifica che tutti i check siano verdi
3. Clicca "Invia Test"
4. Chiudi app
5. Notifica deve apparire nel centro notifiche
```

---

## 📞 DOVE CHIEDERE AIUTO

Se ancora non funziona, raccogli queste info:

1. Screenshot di `/notification-debug`
2. Console browser (F12 > Console) - screenshot errori
3. DevTools > Application > Service Workers - screenshot
4. Sistema operativo e browser (es: "Windows 11, Chrome 120")
5. Risultato di: `Notification.permission` in console
6. Se su mobile: iOS o Android? PWA installata?

---

**Data aggiornamento:** 2026-01-09  
**Files modificati:**
- ✅ `src/services/notificationService.js` - Fix import orderBy
- ✅ `src/pages/admin/NotificationDebug.jsx` - Pagina debug
- ✅ `src/App.jsx` - Route /notification-debug
- ✅ `service-worker.js` - Gestione push in background
