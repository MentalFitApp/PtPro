# 📊 CEO Dashboard - Guida Rapida

## Panoramica
Il CEO Dashboard è un portale dedicato separato dal business principale, accessibile solo agli utenti con ruolo "CEO". Fornisce una visione completa delle metriche chiave della piattaforma.

## Caratteristiche

### 🔐 Accesso Sicuro
- Login dedicato su `/ceo-login`
- Verifica ruolo CEO prima di ogni accesso
- Non visibile nella sidebar del business principale
- Accesso diretto tramite URL

### 📈 Metriche Disponibili

#### KPI Cards
- **Utenti Totali**: Numero complessivo di utenti registrati
- **Clienti Attivi**: Clienti totali nella piattaforma
- **Fatturato**: Revenue totale da tutti i pagamenti
- **Utenti Attivi**: Utenti attivi oggi

#### Statistiche Community
- Utenti community registrati
- Post totali pubblicati
- Engagement rate

#### Statistiche Salute
- Check salute completati
- Anamnesi compilate

#### Statistiche Finanziarie
- Pagamenti totali processati
- Fatturato totale
- Importo medio pagamento

### 📊 Activity Feed
- Lista degli ultimi post della community
- Timestamp e autore
- Metriche engagement (likes, commenti)

## Installazione

### 1. Assegnare Ruolo CEO
Esegui lo script di assegnazione ruolo:

```bash
node assign-ceo-role.cjs
```

Inserisci l'email dell'utente da promuovere a CEO quando richiesto.

### 2. Accedere al Dashboard

**URL di accesso**: `https://tuodominio.com/ceo-login`

Usa le credenziali dell'account con ruolo CEO.

## Struttura File

```
src/
  pages/
    ceo/
      CEOLogin.jsx       # Pagina login dedicata
      CEODashboard.jsx   # Dashboard principale
```

## Sicurezza

### Frontend
- Verifica ruolo CEO in `CEODashboard.jsx`
- Redirect automatico a `/ceo-login` se non autenticato
- Check ruolo prima di caricare dati

### Backend (Firestore Rules)
```javascript
function isCEO() {
  return request.auth != null &&
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         'ceo' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
}
```

Permessi CEO su:
- ✅ Lettura `users` collection (per stats)
- ✅ Lettura `clients` collection
- ✅ Lettura `payments` (collectionGroup)
- ✅ Lettura `checks` e `anamnesi`
- ✅ Lettura `community_posts`

## Route

```javascript
// Route pubbliche
<Route path="/ceo-login" element={<CEOLogin />} />

// Route protette (richiede ruolo CEO)
<Route path="/ceo" element={<CEODashboard />} />
```

## Database Schema

### User Document (con ruolo CEO)
```javascript
{
  uid: "user123",
  email: "ceo@esempio.com",
  roles: ["ceo"],  // ← Ruolo richiesto
  displayName: "CEO Name",
  // ... altri campi
}
```

## Manutenzione

### Aggiungere Nuove Metriche
1. Modifica `loadAllStats()` in `CEODashboard.jsx`
2. Aggiungi query Firestore necessarie
3. Aggiorna state `stats`
4. Crea nuovo KPICard o sezione stats

### Rimuovere Ruolo CEO
```javascript
// Firestore Console o script
db.collection('users').doc(uid).update({
  roles: admin.firestore.FieldValue.arrayRemove('ceo')
});
```

## Considerazioni Multi-Tenant

Il dashboard attuale lavora con la struttura single-tenant.

**Per il futuro multi-tenant**, considera:
- Filtrare dati per `tenantId`
- Aggregare stats da più tenant
- Dashboard multi-tenant con switch tenant
- Permessi granulari per tenant

## Troubleshooting

### "Accesso negato"
- Verifica che l'utente abbia `roles: ["ceo"]` in Firestore
- Controlla che le Firestore rules siano aggiornate
- Verifica autenticazione Firebase

### Dashboard vuoto
- Controlla console browser per errori Firestore
- Verifica permessi lettura su tutte le collection usate
- Controlla che esistano dati nelle collection

### Login non funziona
- Verifica che `/ceo-login` sia in `publicPaths` (App.jsx)
- Controlla credenziali Firebase Auth
- Verifica che l'utente esista in `users` collection

## Prossimi Sviluppi

- [ ] Grafici interattivi (recharts/chart.js)
- [ ] Export dati CSV
- [ ] Notifiche real-time per metriche critiche
- [ ] Dashboard personalizzabile
- [ ] Filtri temporali avanzati
- [ ] Multi-tenant support
- [ ] Analytics avanzate

## Supporto

Per assistenza o modifiche, contatta il team di sviluppo.

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Novembre 2025
