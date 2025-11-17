# DEBUG COLLABORATORE LOGIN - ERR_BLOCKED_BY_CLIENT

## PROBLEMA IDENTIFICATO
L'errore `ERR_BLOCKED_BY_CLIENT` blocca le richieste Firestore impedendo il login dei collaboratori.

## CHECKLIST VERIFICA

### 1. Verifica Firebase Console
```
1. Vai su Firebase Console → Firestore Database
2. Cerca la collection "collaboratori"
3. Verifica che esista un documento con:
   - ID = UID dell'utente
   - Campi: email, nome, ruolo, firstLogin, uid
```

### 2. Verifica Browser
```bash
# DISABILITA TUTTE LE ESTENSIONI:
- uBlock Origin
- AdBlock Plus
- Privacy Badger
- Brave Shields
- Ghostery
- NoScript

# POI RIPROVA IL LOGIN
```

### 3. Test con Console Browser
Apri DevTools (F12) e incolla questo nella Console:

```javascript
// Test 1: Verifica configurazione Firebase
console.log('Firebase Config:', window.location.origin);

// Test 2: Verifica se Firestore è raggiungibile
fetch('https://firestore.googleapis.com/v1/projects/biondo-fitness-coach/databases/(default)/documents/collaboratori')
  .then(r => console.log('Firestore OK:', r.status))
  .catch(e => console.error('Firestore BLOCCATO:', e));

// Test 3: Verifica autenticazione
import { auth } from './firebase';
console.log('User:', auth.currentUser?.email);
```

### 4. Verifica Regole Firestore
Le regole sono corrette:
```javascript
match /collaboratori/{collabId} {
  allow read, list: if isAdmin() || isCollaboratore(collabId) || isSetter();
  allow create: if isAdmin();
  allow update: if isCollaboratore(collabId) || isAdmin();
  allow delete: if isAdmin();
}

function isCollaboratore(userId) {
  return request.auth != null &&
         request.auth.uid == userId &&
         exists(/databases/$(database)/documents/collaboratori/$(userId));
}
```

### 5. Verifica CORS (Firebase Hosting)
Se deployato su Firebase Hosting, verifica `firebase.json`:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          }
        ]
      }
    ]
  }
}
```

## SOLUZIONE TEMPORANEA

### Opzione A: Whitelist Domini
Aggiungi questi domini alla whitelist dell'ad-blocker:
```
*.googleapis.com
*.firebaseio.com
*.firestore.googleapis.com
firebaseapp.com
```

### Opzione B: Test in Incognito
1. Apri browser in modalità incognito
2. Disabilita estensioni in incognito
3. Prova il login

### Opzione C: Usa altro Browser
Prova con un browser pulito senza estensioni (es. Edge, Safari)

## VERIFICA DOCUMENTO COLLABORATORE

Esegui questo script per verificare i dati:

```javascript
// In Firebase Console → Firestore → Run Query
// Oppure usa questo in un file test.js

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

async function checkCollab(uid) {
  const collabRef = doc(db, 'collaboratori', uid);
  const snap = await getDoc(collabRef);
  
  if (snap.exists()) {
    console.log('✅ Documento trovato:', snap.data());
  } else {
    console.error('❌ Documento NON trovato per UID:', uid);
  }
}

// Sostituisci con UID reale
checkCollab('UID_DEL_COLLABORATORE_QUI');
```

## SE NIENTE FUNZIONA

### Verifica Network Tab
1. Apri DevTools → Network
2. Filtra per "firestore"
3. Prova login
4. Cerca richieste con stato "blocked"
5. Fai screenshot e condividi

### Log Completo
Aggiungi logging in App.jsx:

```javascript
// In App.jsx, riga ~120
const collabDoc = await getDoc(collabDocRef);
console.log('🔍 Collab Doc Exists:', collabDoc.exists());
console.log('🔍 Collab Data:', collabDoc.data());
console.log('🔍 Current User UID:', currentUser.uid);
```
