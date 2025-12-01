# Sistema di Gestione Permessi Clienti

## Panoramica

Sistema di controllo accessi granulare a livello tenant per gestire le autorizzazioni dei clienti. Gli admin possono limitare l'accesso alle pagine e funzionalità dell'app per ogni cliente individualmente.

## Funzionalità Principali

### 1. **Accesso Generale**
- Possibilità di revocare completamente l'accesso all'app per un cliente
- Quando revocato, il cliente vede un messaggio di "Accesso Negato"
- Utile per sospendere temporaneamente un cliente

### 2. **Controllo Pagine**
Gli admin possono abilitare/disabilitare l'accesso a:
- Dashboard
- Anamnesi
- Check Periodici
- Pagamenti
- Chat
- Scheda Alimentazione
- Scheda Allenamento
- Corsi
- Community
- Impostazioni

### 3. **Controllo Funzionalità**
Controllo granulare su features specifiche:
- **Sostituzione Alimenti**: Abilita/disabilita il bottone di swap nella scheda alimentazione
- **Esportazione PDF**: Controllo del pulsante "Esporta PDF" nelle schede
- **Prenotazioni Calendario**: Controllo accesso al calendario booking

## Architettura Tecnica

### Schema Firestore

```javascript
// Collection: tenants/{tenantId}/clients/{clientId}
{
  // ... altri campi esistenti ...
  permissions: {
    access: true,  // Accesso generale all'app
    pages: {
      'dashboard': true,
      'anamnesi': true,
      'checks': true,
      'payments': true,
      'chat': true,
      'scheda-alimentazione': true,
      'scheda-allenamento': true,
      'courses': true,
      'community': true,
      'settings': true
    },
    features: {
      'food-swap': true,
      'pdf-export': true,
      'calendar-booking': true
    }
  }
}
```

### Componenti

#### 1. **ClientPermissions** (`/pages/admin/ClientPermissions.jsx`)
- UI admin per gestire permessi
- Layout 2 colonne: lista clienti + pannello permessi
- Quick actions: "Abilita Tutto" / "Disabilita Tutto"
- Ricerca clienti
- Indicatori visivi dello stato (locked/unlocked)

#### 2. **ProtectedClientRoute** (`/components/ProtectedClientRoute.jsx`)
- Wrapper component per proteggere le rotte client
- Verifica permessi da Firestore prima di renderizzare
- Mostra pagina "Accesso Negato" se non autorizzato
- Supporta loading states

#### 3. **useFeaturePermission** Hook
- Custom hook per controllare permessi features
- Utilizzabile in qualsiasi componente client
- Ritorna `{ hasPermission, loading }`

### Utilizzo

#### Proteggere una Rotta Client

```jsx
// In App.jsx
<Route 
  path="/client/dashboard" 
  element={
    <ProtectedClientRoute requiredPermission="dashboard">
      <ClientDashboard />
    </ProtectedClientRoute>
  } 
/>
```

#### Controllare una Feature

```jsx
// In un componente client
import { useFeaturePermission } from '../components/ProtectedClientRoute';

function MyComponent() {
  const { hasPermission: canSwapFoods, loading } = useFeaturePermission('food-swap');
  
  return (
    <>
      {canSwapFoods && (
        <button onClick={handleSwap}>Sostituisci Alimento</button>
      )}
    </>
  );
}
```

## Pagina Admin: Gestione Permessi

### Accesso
- URL: `/client-permissions`
- Menu: Sidebar Admin → Avanzate → Permessi Clienti
- Icona: Shield (Scudo)

### Funzionalità UI

1. **Ricerca Clienti**
   - Search bar con filtraggio real-time
   - Ricerca per nome o email

2. **Lista Clienti**
   - Ordinamento alfabetico
   - Indicatore visivo accesso (lucchetto verde/rosso)
   - Click per selezionare

3. **Pannello Permessi**
   - Toggle Accesso Generale (grande, evidenziato)
   - Quick Actions (Abilita/Disabilita tutto)
   - Sezione Pagine (grid 2 colonne su desktop)
   - Sezione Funzionalità
   - Pulsante Salva (con loading state)

4. **Notifiche**
   - Successo/Errore con auto-dismiss (3s)
   - Feedback visivo immediato

## Flusso Utente

### Admin
1. Accede a `/client-permissions`
2. Cerca/seleziona cliente dalla lista
3. Configura permessi tramite toggle
4. Salva modifiche
5. Riceve conferma

### Cliente
1. Tenta di accedere a una pagina protetta
2. **ProtectedClientRoute** verifica permessi
3. Se autorizzato → mostra contenuto
4. Se negato → mostra pagina "Accesso Negato" con:
   - Messaggio chiaro
   - Link "Torna alla Dashboard"
   - Link "Contatta Trainer"

## Permessi di Default

Quando un cliente viene creato senza permessi espliciti:

```javascript
const DEFAULT_PERMISSIONS = {
  access: true,
  pages: {
    dashboard: true,
    anamnesi: true,
    checks: true,
    payments: true,
    chat: true,
    'scheda-alimentazione': true,
    'scheda-allenamento': true,
    courses: true,
    community: true,
    settings: true,
  },
  features: {
    'food-swap': true,
    'pdf-export': true,
    'calendar-booking': true,
  }
};
```

## Miglioramenti Futuri

### Possibili Estensioni
1. **Permessi Temporanei**
   - Revoca accesso con scadenza automatica
   - Esempio: sospensione per mancato pagamento

2. **Template Permessi**
   - Pre-configurazioni salvabili
   - Esempio: "Abbonamento Base", "Abbonamento Premium"

3. **Log Modifiche**
   - Storico delle modifiche permessi
   - Chi ha modificato cosa e quando

4. **Notifiche Cliente**
   - Email automatica quando vengono modificati i permessi
   - Notifica push in-app

5. **Permessi a Livello Collaboratore**
   - Estensione del sistema ai collaboratori
   - Controllo accessi anche per i coach

## Note Implementazione

### Performance
- Verifica permessi ad ogni accesso pagina (cache possibile in futuro)
- Loading state per UX fluida
- Nessun impatto su clienti con permessi default completi

### Sicurezza
- Validazione lato client + server (Firestore Rules da aggiornare)
- Permessi stored direttamente nel documento cliente
- No bypass possibile via URL diretta

### Compatibilità
- Retrocompatibile: clienti esistenti senza `permissions` field usano DEFAULT_PERMISSIONS
- Non richiede migrazione dati
- Nessun breaking change

## File Modificati

1. **Nuovi File**
   - `/src/pages/admin/ClientPermissions.jsx` - UI gestione permessi
   - `/src/components/ProtectedClientRoute.jsx` - Route protection + hook

2. **File Modificati**
   - `/src/App.jsx` - Rotte protette + import ProtectedClientRoute
   - `/src/components/layout/MainLayout.jsx` - Link sidebar admin
   - `/src/pages/client/ClientSchedaAlimentazione.jsx` - Feature permissions (swap, pdf)

3. **File Rimossi**
   - Riferimenti a `SuperAdminSettings` (sostituiti con sistema tenant-level)

## Differenze da SuperAdmin

### Prima (SuperAdmin)
- Controllo a livello **piattaforma**
- Solo owner della piattaforma poteva gestire
- Nessun controllo granulare per tenant

### Dopo (Client Permissions)
- Controllo a livello **tenant**
- Ogni admin del tenant gestisce i suoi clienti
- Controllo granulare per pagina e feature
- Scalabile e multi-tenant friendly
