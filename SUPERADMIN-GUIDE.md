# 🛡️ Guida SuperAdmin

## Cos'è il SuperAdmin?

Il **SuperAdmin** è il ruolo più elevato nella piattaforma PtPro. Ha accesso completo a:

- ✅ **Tutti i clienti** (di qualsiasi coach/admin)
- ✅ **Tutti i collaboratori** e dipendenti
- ✅ **Tutti i report** e statistiche globali
- ✅ **Gestione ruoli** (può assegnare admin, coach, altri superadmin)
- ✅ **Tutte le configurazioni** app
- ✅ **Dashboard globale** con metriche piattaforma

## Assegnare il primo SuperAdmin

### Prerequisiti
1. Account Firebase attivo
2. Utente già registrato nell'app
3. Conoscere l'**email** dell'utente da promuovere

### Metodo 1: Via Console Firebase (Consigliato)

1. **Vai su Firebase Console**
   - https://console.firebase.google.com/
   - Seleziona il progetto PtPro

2. **Authentication → Users**
   - Trova l'utente da promuovere
   - Copia il suo **UID** (es. `abc123xyz456`)

3. **Firestore Database → roles → superadmins**
   - Se il documento non esiste, crealo
   - Struttura:
   ```json
   {
     "uids": ["UID_UTENTE"],
     "createdAt": "timestamp",
     "createdBy": "manual"
   }
   ```

4. **Aggiungi UID**
   - Nel campo `uids`, aggiungi l'UID come array
   - Esempio: `["abc123xyz456"]`
   - Salva

✅ L'utente è ora SuperAdmin!

### Metodo 2: Via Script (Avanzato)

Usa lo script fornito:

```bash
# Trova UID da Firebase Console → Authentication
pnpm superadmin:assign <email> <UID>
```

Esempio:
```bash
pnpm superadmin:assign admin@mentalfit.it abc123xyz456
```

Lo script:
- Verifica credenziali Firebase
- Aggiunge UID a `roles/superadmins`
- Crea documento se non esiste

## Verificare Permessi SuperAdmin

Dopo assegnazione, l'utente:

1. **Login normale** con email/password
2. **Accesso Dashboard** → Vede icona SuperAdmin
3. **Vista globale** → Tutti i clienti di tutti i coach
4. **Gestione ruoli** → Può promuovere altri admin/coach

## Differenze tra Ruoli

| Funzione | SuperAdmin | Admin | Coach | Client |
|----------|:----------:|:-----:|:-----:|:------:|
| Vede tutti i clienti | ✅ | ✅ | ✅ | ❌ |
| Gestisce propri clienti | ✅ | ✅ | ✅ | ❌ |
| Vede clienti altri coach | ✅ | ❌ | ❌ | ❌ |
| Gestisce collaboratori | ✅ | ✅ | ❌ | ❌ |
| Gestisce ruoli | ✅ | ❌ | ❌ | ❌ |
| Dashboard globale | ✅ | ❌ | ❌ | ❌ |
| Statistiche globali | ✅ | Solo proprie | Solo proprie | ❌ |

## Funzionalità SuperAdmin

### 1. Dashboard Globale
`/superadmin/dashboard`

- **Statistiche piattaforma**
  - Clienti totali e attivi
  - Coach e collaboratori
  - Revenue totale e mensile
  - Ultimi pagamenti

- **Vista attività recenti**
  - Ultimi clienti aggiunti
  - Ultimi pagamenti ricevuti
  - Performance coach

### 2. Gestione Multi-Coach

Il SuperAdmin vede **TUTTI** i clienti, anche quelli assegnati ad altri coach:

```javascript
// Query normale (coach/admin): solo propri clienti
const clientsRef = collection(db, 'clients');

// Query SuperAdmin: TUTTI i clienti
// Le Firestore Rules riconoscono automaticamente il ruolo
```

### 3. Assegnare Altri SuperAdmin

**Solo un SuperAdmin può creare altri SuperAdmin.**

Utilizza utility JavaScript:

```javascript
import { addSuperAdmin } from './utils/superadmin';

// currentUserId: UID superadmin corrente
// targetUserId: UID da promuovere
const result = await addSuperAdmin(currentUserId, targetUserId);
console.log(result.message);
```

Oppure via Console Firebase manualmente.

### 4. Rimuovere SuperAdmin

```javascript
import { removeSuperAdmin } from './utils/superadmin';

const result = await removeSuperAdmin(currentUserId, targetUserId);

// Nota: non puoi rimuovere te stesso
```

## Sicurezza

### Firestore Rules

Le regole Firestore controllano automaticamente:

```javascript
function isSuperAdmin() {
  return request.auth != null &&
         exists(/databases/$(database)/documents/roles/superadmins) &&
         request.auth.uid in get(/databases/$(database)/documents/roles/superadmins).data.uids;
}
```

Ogni operazione sensibile verifica questo ruolo **lato server**.

### Best Practices

1. **Mantieni pochi SuperAdmin**
   - Idealmente 1-2 persone
   - Solo owner/founder dell'azienda

2. **Non condividere credenziali**
   - Ogni SuperAdmin ha account personale
   - Non riutilizzare password

3. **Audit trail**
   - Ogni cambio ruolo logga `updatedBy`
   - Monitoraggio attività SuperAdmin

4. **Revoca immediata**
   - Se qualcuno lascia: rimuovi accesso subito
   - Cambia password se necessario

## Utility JavaScript

### Verifica ruolo utente

```javascript
import { isSuperAdmin, getUserRole } from './utils/superadmin';

// Check semplice
const isSuper = await isSuperAdmin(userId);

// Info completa ruolo
const roleInfo = await getUserRole(userId);
console.log(roleInfo);
// { role: 'superadmin', isSuperAdmin: true, isAdmin: true, isCoach: true }
```

### Cache ruoli

```javascript
import { getUserRoleCached, clearRoleCache } from './utils/superadmin';

// Usa cache (5 minuti TTL)
const role = await getUserRoleCached(userId);

// Invalida cache dopo cambio ruolo
clearRoleCache(userId);
```

## Troubleshooting

### "Accesso Negato" dopo assegnazione

1. **Verifica UID corretto**
   - Console Firebase → Authentication
   - Copia UID esatto (case-sensitive)

2. **Verifica documento Firestore**
   - Firestore → `roles/superadmins`
   - Campo `uids` deve contenere UID

3. **Logout/Login**
   - Ricarica app
   - Fai logout e login

4. **Verifica Firestore Rules**
   - Firebase Console → Firestore → Rules
   - Cerca funzione `isSuperAdmin()`
   - Deve esistere e chiamare documento `roles/superadmins`

### Script assegnazione fallisce

**Errore: "Missing environment variables"**
- Verifica `.env` ha tutte le chiavi Firebase
- Esegui `source .env` se necessario

**Errore: "Permission denied"**
- Lo script Client SDK ha limitazioni
- Usa Console Firebase manualmente (Metodo 1)

**Errore: "User not found"**
- Fornisci UID esplicito come secondo argomento
- Firebase Client SDK non ha `getUserByEmail()`

## Limitazioni

### Cosa il SuperAdmin NON può fare

1. **Resettare password altri utenti**
   - Serve Firebase Admin SDK (backend)
   - O "Password Reset" via email

2. **Eliminare account Firebase Auth**
   - Solo via Console Firebase
   - O backend con Admin SDK

3. **Modificare Firestore Rules**
   - Solo via Console Firebase
   - O CI/CD deployment

4. **Accesso billing Cloudflare/Firebase**
   - Serve account owner Google/Cloudflare

### Escalation a Owner

Per operazioni più critiche:
- Contatta owner progetto (Google Cloud)
- Accesso console billing
- Deploy Firestore Rules/Functions

## Roadmap Future

- [ ] UI gestione ruoli in-app
- [ ] Log audit SuperAdmin actions
- [ ] 2FA obbligatoria per SuperAdmin
- [ ] Dashboard analytics avanzati
- [ ] Export dati completo piattaforma

---

**Ultimo aggiornamento:** 20 Novembre 2024  
**Versione:** 1.0.0  
**Contatto:** support@mentalfit.it
