# Gestione Sicura Admin

## ⚠️ IMPORTANTE: Protezione contro sovrascritture

Questo progetto **NON gestisce automaticamente** gli admin per prevenire sovrascritture accidentali del documento `roles/admins` in Firestore.

### Problema Risolto
Prima, ogni volta che un utente faceva login, il codice provava a:
1. Creare il documento `roles/admins` se non esisteva
2. Aggiungere automaticamente l'UID corrente

Questo causava la **sovrascrittura accidentale** della lista admin esistente, eliminando tutti gli altri admin.

### Soluzione Attuale
- **Rimossa** tutta la logica di auto-gestione admin da `App.jsx`
- Gli admin vengono gestiti **solo manualmente** tramite:
  - Firebase Console
  - Script dedicato `manage-admins.js`

---

## 🔧 Come Gestire Admin

### 1. Via Firebase Console (Consigliato per primo setup)

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto
3. Apri **Firestore Database**
4. Naviga a `roles/admins`
5. Modifica il campo `uids` (array):
   ```json
   {
     "uids": [
       "AeZKjJYu5zMZ4mvffaGiqCBb0cF2",
       "altro_uid_admin"
     ]
   }
   ```

### 2. Via Script (Per operazioni rapide)

Usa lo script sicuro `manage-admins.js`:

#### Listare admin correnti:
```bash
node manage-admins.js list
```

#### Aggiungere un admin:
```bash
node manage-admins.js add <UID_UTENTE>

# Esempio:
node manage-admins.js add AeZKjJYu5zMZ4mvffaGiqCBb0cF2
```

#### Rimuovere un admin:
```bash
node manage-admins.js remove <UID_UTENTE>

# Esempio:
node manage-admins.js remove XyZ123AbC456
```

**Nota**: Lo script usa `arrayUnion` e `arrayRemove` che sono operazioni atomiche sicure che **non sovrascrivono** l'array esistente.

---

## 🛡️ Protezioni Implementate

### Nel Codice (`App.jsx`)
- ✅ **Rimossa** tutta la logica `setDoc` e `updateDoc` su `roles/admins`
- ✅ Solo **lettura** per verificare i permessi
- ✅ Gestione errori con `.catch()` per evitare crash

### Nelle Firestore Rules
```javascript
match /roles/{docId} {
  allow read: if request.auth != null;
  allow write: if isAdmin(); // Solo admin esistenti possono scrivere
}
```

### Nello Script
- ✅ Usa `updateDoc` con `arrayUnion`/`arrayRemove` (operazioni atomiche)
- ✅ **Non usa mai** `setDoc` che sovrascriverebbe tutto
- ✅ Impedisce rimozione dell'ultimo admin
- ✅ Verifica esistenza documento prima di operare

---

## 📋 Checklist Sicurezza

- [ ] Documento `roles/admins` esiste su Firestore
- [ ] Almeno un UID presente nell'array `uids`
- [ ] UID corrisponde a utenti Firebase Authentication validi
- [ ] Nessun codice dell'app usa `setDoc` su `roles/admins`
- [ ] Solo `manage-admins.js` o Firebase Console per modifiche

---

## 🚨 In Caso di Emergenza

Se perdi l'accesso admin:

1. **Verifica Firebase Authentication**: Assicurati che l'utente esista
2. **Controlla Firestore**: Vai su `roles/admins` e verifica l'array `uids`
3. **Aggiungi manualmente**: Usa Firebase Console per aggiungere il tuo UID
4. **Non modificare il codice**: La protezione è intenzionale

---

## 👥 UID Admin Correnti

Per trovare il tuo UID:
```bash
node manage-admins.js list
```

Oppure nella Firebase Console > Authentication > Users > clicca sull'utente > copia UID.

**UID Admin Principale**: `AeZKjJYu5zMZ4mvffaGiqCBb0cF2`

