# 📍 Dove Trovare il Pulsante OAuth Instagram

## 🎯 Accesso Veloce

### Passo 1: Accedi al Menu
1. Fai login come **Admin/CEO**
2. Guarda la sidebar a sinistra

### Passo 2: Vai su Instagram
Nel menu sotto **"Impostazioni"** troverai:
- 🎨 Branding
- 🌐 Sito Web
- 📷 **Instagram** ← CLICCA QUI

Oppure vai direttamente a: **`/instagram`**

---

## ✨ Cosa Fa il Pulsante OAuth?

### Prima Volta (Non Connesso)
Quando accedi a `/instagram` per la prima volta, vedrai:

```
┌─────────────────────────────────────┐
│   📷 INSTAGRAM HUB                  │
│                                     │
│   Collega Instagram                 │
│                                     │
│   ┌───────────────────────────┐   │
│   │  🔵 Analytics             │   │
│   │  📸 Media                 │   │
│   │  💬 Messaggi              │   │
│   │  ❤️  Engagement            │   │
│   └───────────────────────────┘   │
│                                     │
│   [📷 Collega Instagram]  ← QUESTO │
│                                     │
└─────────────────────────────────────┘
```

### Quando Clicchi "Collega Instagram"

Il pulsante OAuth **avvia il flusso di autorizzazione**:

1. **Ti porta su Instagram/Facebook** 
   - Vieni reindirizzato a `https://api.instagram.com/oauth/authorize`
   - Vedi la schermata di autorizzazione ufficiale Instagram

2. **Richiede i permessi necessari**:
   - 📊 Visualizzare statistiche account (follower, impressioni)
   - 📷 Accedere ai tuoi post e media
   - 💬 Leggere commenti e engagement
   - 📈 Analizzare insights e metriche

3. **Salva il token in modo sicuro**
   - Dopo l'autorizzazione, Instagram genera un `access_token`
   - Il token viene salvato in **Firestore** in `tenants/{tuoTenantId}/integrations/instagram`
   - Il token è crittografato e mai esposto al frontend

4. **Carica i tuoi dati**
   - Profilo Instagram (username, follower, following)
   - Ultimi 20 post con foto/video
   - Statistiche engagement (like, commenti)
   - Insights giornalieri (impressioni, reach, visite profilo)

---

## 🔐 Sicurezza OAuth

### Perché Usiamo OAuth?

❌ **MALE** (vecchio modo con API key):
```javascript
const API_KEY = "abc123...";  // ← Esposta nel codice!
fetch('https://api.instagram.com/...', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});
```

✅ **BENE** (OAuth flow sicuro):
1. User clicca "Collega Instagram"
2. Instagram chiede conferma all'utente
3. User autorizza l'app
4. Instagram genera token univoco
5. Token salvato server-side (Cloud Function)
6. Frontend chiama solo proxy functions

### Vantaggi OAuth
- 🔒 **Token temporaneo** (scade dopo 60 giorni)
- 👤 **User consapevole** (sa che permessi diamo)
- 🚫 **Revocabile** (user può disconnettere quando vuole)
- 🛡️ **Sicuro** (token mai esposto nel browser)

---

## 📊 Dopo la Connessione

Una volta collegato Instagram, la dashboard mostra:

### Tab: Dashboard
```
┌─────────────────────────────────────┐
│  👥 Follower        🖼️ Post         │
│  1,234              156             │
│                                     │
│  ❤️  Like Totali     👁️ Impressioni │
│  45,678             12,345          │
└─────────────────────────────────────┘
```

### Tab: Media
```
┌─────┬─────┬─────┐
│ 📷  │ 🎥  │ 📷  │
│ 234 │ 156 │ 789 │
│ ❤️💬 │ ❤️💬 │ ❤️💬 │
└─────┴─────┴─────┘
```

### Tab: Insights
```
📈 Impressioni: 12,345 (oggi)
🎯 Reach: 8,901 utenti unici
👀 Visite Profilo: 456
```

### Tab: Impostazioni
```
✅ Instagram Connesso
   Connesso il 24/11/2025

[🔄 Sincronizza Ora]  [❌ Disconnetti]
```

---

## 🔄 Sincronizzazione

### Automatica
- Ogni **15 minuti** (Cloud Function schedulata)
- Carica automaticamente nuovi post, follower, insights

### Manuale
- Clicca **"Sincronizza Ora"** in alto a destra
- Forza refresh immediato dei dati

---

## ❓ FAQ

### Il pulsante non appare?
1. Verifica di essere **Admin** o **CEO**
2. Controlla che `/instagram` route sia attiva
3. Refresh browser (Ctrl+F5)

### "Instagram non configurato"?
1. Verifica `VITE_INSTAGRAM_CLIENT_ID` in `.env`
2. Verifica Firebase Functions config:
   ```bash
   firebase functions:config:get
   ```

### Disconnessione
- Vai su `/instagram` → Tab **Impostazioni**
- Clicca **"Disconnetti"**
- Puoi ricollegare in qualsiasi momento

### Token scaduto?
- Instagram token durano 60 giorni
- Ricollega l'account cliccando di nuovo "Collega Instagram"

---

## 🚀 In Sintesi

**Percorso**: Login → Menu Sidebar → Impostazioni → Instagram → [Collega Instagram]

**Flusso Completo**:
```
1. Clicca "Collega Instagram"
        ↓
2. Redirect a Instagram (autorizza app)
        ↓
3. Instagram ti riporta a /oauth/callback
        ↓
4. Cloud Function salva token
        ↓
5. Redirect a /instagram con dati caricati
        ↓
6. ✅ Fatto! Vedi dashboard completa
```
