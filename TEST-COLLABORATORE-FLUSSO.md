# Test Flusso Completo Collaboratore Multi-Tenant

## ✅ Modifiche Completate

### 1. Rimozione Funzione "Riaggiunta con UID"
- ❌ Rimossa sezione UI per riaggiunta con UID
- ❌ Rimosso stato `newUid`
- ❌ Rimossa funzione `handleAddByUid`
- ✅ Mantenuta solo funzione principale `handleAddCollaboratore`

### 2. Struttura Multi-Tenant Verificata
```
tenants/
  └── biondo-fitness-coach/        # CURRENT_TENANT_ID
      ├── collaboratori/           # Documento per ogni collaboratore
      │   └── {uid}/
      │       ├── uid
      │       ├── email
      │       ├── nome
      │       ├── ruolo (Setter/Marketing/Vendita)
      │       ├── firstLogin (boolean)
      │       ├── assignedAdmin (array di UID)
      │       ├── dailyReports (array)
      │       └── tracker (object)
      ├── roles/
      │   ├── admins/              # { uids: [...] }
      │   └── coaches/             # { uids: [...] }
      ├── leads/
      └── calendarEvents/
```

## 🔄 Flusso Creazione Nuovo Collaboratore

### STEP 1: Admin aggiunge email
```javascript
// File: src/pages/admin/Collaboratori.jsx
// Funzione: handleAddCollaboratore()

1. Validazione email
2. Controllo se collaboratore già esiste nel tenant
3. Chiamata Cloud Function getUidByEmail:
   - Se utente Firebase esiste → usa UID esistente
   - Se NON esiste → crea nuovo account con password temporanea
4. Salva documento in: tenants/biondo-fitness-coach/collaboratori/{uid}
   {
     uid: "...",
     email: "nuovo@email.com",
     nome: "nuovo",
     ruolo: "Setter",
     firstLogin: true,        // ⚠️ IMPORTANTE
     assignedAdmin: ["admin_uid"],
     dailyReports: [],
     tracker: {},
     personalPipeline: []
   }
5. Invia email reset password
```

### STEP 2: Collaboratore riceve email
- Email di reset password da Firebase Auth
- Contiene link per impostare password

### STEP 3: Primo Accesso
```javascript
// File: src/pages/auth/Login.jsx
// Dopo login con password temporanea:

1. Firebase Auth verifica credenziali
2. Sistema legge documento: tenants/biondo-fitness-coach/collaboratori/{uid}
3. Verifica: firstLogin === true
4. Redirect a: /collaboratore/first-access
```

### STEP 4: Impostazione Password Permanente
```javascript
// File: src/pages/auth/FirstAccess.jsx

1. Utente inserisce:
   - Password temporanea (quella ricevuta via email)
   - Nuova password
   - Conferma nuova password

2. Sistema:
   - Re-autentica con password temporanea
   - Aggiorna password in Firebase Auth
   - Aggiorna documento: { firstLogin: false }
   
3. Redirect a: /collaboratore/dashboard
```

### STEP 5: Accessi Successivi
```javascript
// File: src/pages/auth/Login.jsx

1. Login con email + password permanente
2. Sistema verifica: firstLogin === false
3. Redirect diretto a: /collaboratore/dashboard
```

## 🧪 Test Manuale da Eseguire

### Test 1: Creazione Nuovo Collaboratore
```bash
# Email da testare (NON deve esistere in Firebase Auth)
test-collab-$(date +%s)@example.com

PASSI:
1. ✅ Accedi come admin
2. ✅ Vai a "Gestione" → Collaboratori
3. ✅ Inserisci email nuova
4. ✅ Seleziona ruolo: "Setter"
5. ✅ Clicca "Aggiungi"
6. ✅ Verifica messaggio: "Collaboratore creato! Email di reset inviata."

VERIFICA FIRESTORE:
- Documento creato: tenants/biondo-fitness-coach/collaboratori/{nuovo_uid}
- Campo firstLogin: true
- Campo email: corretto
- Campo ruolo: "Setter"
```

### Test 2: Accesso con Password Temporanea
```bash
PREREQUISITO: Email di reset ricevuta

PASSI:
1. ✅ Apri link da email reset password
2. ✅ Imposta password temporanea (es: TempPass123!)
3. ✅ Vai a /login
4. ✅ Login con: email + TempPass123!
5. ✅ Verifica redirect automatico a: /collaboratore/first-access

NOTA: Se viene rediretto a dashboard invece che first-access,
      significa che firstLogin non è settato correttamente
```

### Test 3: Impostazione Password Permanente
```bash
PREREQUISITO: Test 2 completato

PASSI:
1. ✅ Nella pagina /collaboratore/first-access
2. ✅ Inserisci:
   - Password temporanea: TempPass123!
   - Nuova password: MyNewPass123!
   - Conferma: MyNewPass123!
3. ✅ Clicca "Imposta Nuova Password"
4. ✅ Verifica messaggio: "Password aggiornata! Sarai reindirizzato..."
5. ✅ Verifica redirect a: /collaboratore/dashboard

VERIFICA FIRESTORE:
- Campo firstLogin: false (aggiornato)
```

### Test 4: Secondo Accesso
```bash
PREREQUISITO: Test 3 completato

PASSI:
1. ✅ Logout
2. ✅ Login con: email + MyNewPass123!
3. ✅ Verifica redirect diretto a: /collaboratore/dashboard
4. ✅ Verifica NON passa per first-access

NOTA: Se richiede ancora first-access, c'è un problema
      nell'aggiornamento del campo firstLogin
```

### Test 5: Accesso Dashboard Collaboratore
```bash
PREREQUISITO: Test 4 completato

PASSI:
1. ✅ Verifica caricamento dati collaboratore
2. ✅ Verifica accesso a sezioni:
   - Dashboard principale
   - Leads personali
   - Report giornalieri
   - Calendario
3. ✅ Verifica SOLO vede propri dati (non di altri)

NOTA: Deve vedere solo leads con collaboratoreId === suo uid
```

## 🔍 Debugging

### Verifica Struttura Firestore
```javascript
// Console browser o Firebase Console

// 1. Verifica documento collaboratore
tenants/biondo-fitness-coach/collaboratori/{uid}

// Campi obbligatori:
- uid: string
- email: string
- nome: string
- ruolo: string
- firstLogin: boolean
- assignedAdmin: array
```

### Log Console Importanti
```javascript
// Login.jsx
"🔍 Login check: { uid, isAdmin, isCoach, isClient, isCollaboratore }"
"👤 Collaboratore login, firstLogin: true/false"

// FirstAccess.jsx
"Campo firstLogin aggiornato a false per collaboratore: {uid}"

// CollaboratoreDashboard.jsx
"✅ Collaboratore data loaded: {...}"
"📊 Leads loaded: {count}"
```

## ⚠️ Problemi Comuni e Soluzioni

### Problema 1: "Utente Firebase esiste già"
```
CAUSA: Email già registrata in Firebase Auth
SOLUZIONE: Usa email diversa o elimina utente da Firebase Auth Console
```

### Problema 2: "firstLogin rimane true"
```
CAUSA: Errore update Firestore in FirstAccess
VERIFICA:
1. Path corretto: tenants/biondo-fitness-coach/collaboratori/{uid}
2. Permessi Firestore Rules
3. Console log: "Campo firstLogin aggiornato a false"
```

### Problema 3: "Documento collaboratore non trovato"
```
CAUSA: Non è stato creato in Firestore durante aggiunta
VERIFICA:
1. Errori in console durante handleAddCollaboratore
2. Verifica Cloud Function getUidByEmail funziona
3. Controlla path: tenants/biondo-fitness-coach/collaboratori
```

### Problema 4: "Access denied" alla dashboard
```
CAUSA: Permessi Firestore Rules
VERIFICA:
1. firestore.rules contiene regole per multi-tenant
2. Collaboratore ha accesso al proprio documento
3. Campo collaboratoreId nei leads corrisponde
```

## 📋 Checklist Pre-Produzione

- [ ] Test creazione collaboratore con email nuova
- [ ] Test accesso con password temporanea
- [ ] Test impostazione password permanente
- [ ] Test secondo accesso (senza first-access)
- [ ] Test accesso dashboard e dati collaboratore
- [ ] Verifica email reset password arriva
- [ ] Verifica campo firstLogin si aggiorna correttamente
- [ ] Verifica isolamento dati tra collaboratori
- [ ] Verifica permessi Firestore Rules
- [ ] Test su dispositivo mobile

## 🎯 Prossimi Passi

1. **Eseguire Test Manuali**: Seguire la sequenza Test 1-5
2. **Verificare Logs**: Controllare console per errori
3. **Validare Firestore**: Verificare struttura documenti
4. **Test Mobile**: Ripetere su dispositivo mobile
5. **Documentare Problemi**: Annotare eventuali errori

---

## 📝 Note Tecniche

### Cloud Function getUidByEmail
```javascript
// functions/index.js
exports.getUidByEmail = onCall(async (request) => {
  const email = request.data?.email?.trim().toLowerCase();
  
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return { uid: userRecord.uid }; // Utente esiste
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return { uid: null }; // Utente NON esiste
    }
    throw new Error('Errore server');
  }
});
```

### Tenant Configuration
```javascript
// src/config/tenant.js
export const CURRENT_TENANT_ID = 'biondo-fitness-coach';

// Tutte le query Firestore usano helper:
getTenantCollection(db, 'collaboratori')
getTenantDoc(db, 'collaboratori', uid)
```

### Sicurezza Multi-Tenant
- Ogni query usa path: `tenants/{tenantId}/...`
- Firestore Rules verificano tenantId
- UID collaboratore usato per isolamento dati
- Cloud Functions usano Admin SDK (bypass rules)
