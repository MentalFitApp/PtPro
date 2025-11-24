# 🚀 Migrazione Instagram - Guida Completa

## ✅ Completato

### Codice e Funzioni
- ✅ **InstagramHub.jsx** convertito da ManyChat a Instagram
- ✅ **Cloud Functions** deployate:
  - `instagramProxy` - Proxy per Instagram Graph API
  - `manualSyncInstagram` - Sincronizzazione manuale
  - `exchangeOAuthToken` - Gestione OAuth (Instagram aggiunto)
- ✅ **Route aggiornate** - `/manychat` → `/instagram`
- ✅ **OAuth Button** configurato per Instagram

---

## 🔧 Azioni Richieste dall'Utente

### 1. Registra App Meta/Facebook Developer

Per usare Instagram Graph API, devi creare un'app su Meta for Developers:

#### Step 1: Crea App Facebook
1. Vai su [Meta for Developers](https://developers.facebook.com/)
2. Clicca **"Create App"**
3. Seleziona tipo: **"Consumer"** o **"Business"**
4. Compila:
   - **App Name**: `PtPro Instagram Integration`
   - **App Contact Email**: la tua email
   - **Business Portfolio**: (opzionale)

#### Step 2: Aggiungi Instagram Graph API
1. Nella dashboard dell'app, vai a **"Add Products"**
2. Trova **"Instagram Graph API"** e clicca **"Set Up"**
3. Configura le impostazioni base

#### Step 3: Ottieni Credenziali OAuth
1. Vai a **Settings → Basic** nel menu laterale
2. Copia:
   - **App ID** (questo è il `CLIENT_ID`)
   - **App Secret** (questo è il `CLIENT_SECRET`) - clicca "Show" per vederlo
3. Scorri fino a **"App Domains"**
   - Aggiungi: `your-domain.com` (il tuo dominio di produzione)
4. Aggiungi **Valid OAuth Redirect URIs**:
   ```
   https://your-domain.com/oauth/callback
   http://localhost:5173/oauth/callback
   ```

#### Step 4: Configura Permessi Instagram
1. Vai a **"Instagram Basic Display"** (se disponibile)
2. O vai su **"Instagram Graph API"** → **"Permissions"**
3. Richiedi i seguenti permessi (scopes):
   - `instagram_basic`
   - `instagram_manage_insights`
   - `instagram_manage_comments`
   - `pages_show_list`
   - `pages_read_engagement`

#### Step 5: Passa l'App in Modalità Live
1. In alto a destra, cambia da **"Development"** a **"Live"**
2. Completa eventuali verifiche richieste da Meta

---

### 2. Aggiungi Environment Variables

Devi aggiungere le credenziali Instagram come variabili d'ambiente.

#### Nel Frontend (.env locale)
Crea/modifica `.env` nella root del progetto:

```env
VITE_INSTAGRAM_CLIENT_ID=your_app_id_here
```

#### Nelle Cloud Functions (Firebase)
Aggiungi le variabili d'ambiente su Firebase:

```bash
cd /workspaces/PtPro
firebase functions:config:set instagram.client_id="YOUR_APP_ID"
firebase functions:config:set instagram.client_secret="YOUR_APP_SECRET"
```

Oppure usa Firebase Secrets Manager (raccomandato):

```bash
firebase functions:secrets:set INSTAGRAM_CLIENT_ID
# Incolla il tuo App ID quando richiesto

firebase functions:secrets:set INSTAGRAM_CLIENT_SECRET
# Incolla il tuo App Secret quando richiesto
```

Poi rideploya le funzioni:
```bash
firebase deploy --only functions:exchangeOAuthToken,functions:instagramProxy
```

---

### 3. Collega Account Instagram Business

⚠️ **IMPORTANTE**: L'account Instagram DEVE essere un **Instagram Business Account** collegato a una **Pagina Facebook**.

#### Come Convertire Instagram in Business:
1. Apri app Instagram
2. Vai a **Profilo → Impostazioni → Account**
3. Clicca **"Passa a un account professionale"**
4. Scegli **"Business"**
5. **Collega a una Pagina Facebook** esistente o creane una nuova

#### Test OAuth Flow:
1. Vai su `https://your-domain.com/instagram`
2. Clicca **"Collega Instagram"**
3. Autorizza l'app
4. Verrai reindirizzato e i dati verranno caricati

---

## 📊 Dati Disponibili

Una volta collegato, avrai accesso a:

### Dashboard
- **Follower count** - Numero di follower
- **Following count** - Numero di account seguiti
- **Post totali** - Numero di post pubblicati
- **Like totali** - Somma like su tutti i post
- **Commenti totali** - Somma commenti su tutti i post
- **Engagement medio** - (like + commenti) / numero post

### Media
- **Post recenti** (ultimi 20)
  - Foto e video con preview
  - Caption/didascalia
  - Like e commenti per post
  - Link diretto a Instagram
  - Data pubblicazione

### Insights
- **Impressioni** (ultime 24h) - Quante volte i tuoi contenuti sono stati visti
- **Reach** (ultime 24h) - Quanti utenti unici hanno visto i contenuti
- **Visite al profilo** (ultime 24h) - Quante persone hanno visitato il profilo
- **Dettagli insights** - Metriche complete da Instagram API

### Messaggi
- Coming soon (richiede permessi aggiuntivi)

---

## ⚙️ Sincronizzazione

### Automatica
I dati vengono sincronizzati **ogni 15 minuti** automaticamente tramite Cloud Function schedulata.

### Manuale
Clicca **"Sincronizza Ora"** in alto a destra nella dashboard Instagram per forzare il refresh immediato.

---

## 🔗 API Instagram Graph Endpoints Utilizzati

```javascript
// Profilo
GET /me?fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url

// Media
GET /me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20

// Insights
GET /me/insights?metric=impressions,reach,profile_views,follower_count&period=day
```

---

## 🐛 Troubleshooting

### "Instagram non configurato"
- Verifica che `INSTAGRAM_CLIENT_ID` e `INSTAGRAM_CLIENT_SECRET` siano configurati
- Rideploya le Cloud Functions

### "Invalid OAuth Redirect URI"
- Verifica che l'URL di redirect sia aggiunto nell'app Facebook
- URL deve essere esatto: `https://your-domain.com/oauth/callback`

### "Access token expired"
- Instagram token scadono dopo 60 giorni
- Sarà necessario ricollegare l'account (implementeremo refresh automatico in futuro)

### "Permessi mancanti"
- Verifica che l'app abbia tutti i permessi (scopes) necessari
- Richiedi i permessi mancanti nella dashboard Meta

### "Account non Business"
- Instagram DEVE essere un Business Account
- Segui la guida sopra per convertirlo

---

## 📝 Note Importanti

1. **Token Scadenza**: I token Instagram scadono dopo 60 giorni. Sarà necessario riautorizzare.
2. **Limiti API**: Instagram Graph API ha rate limits. La sincronizzazione automatica ogni 15 min è sicura.
3. **Dati Storici**: Gli insights sono disponibili solo per gli ultimi 2 anni.
4. **Stories**: Le stories hanno un limite di 24h, poi spariscono dall'API.

---

## 🚀 Prossimi Step (Opzionali)

- [ ] Implementare refresh automatico token
- [ ] Aggiungere gestione messaggi Instagram Direct
- [ ] Analytics avanzati con grafici temporali
- [ ] Export dati in CSV/Excel
- [ ] Notifiche per nuovi follower/commenti
- [ ] Auto-reply ai commenti

---

## 📞 Supporto

Se hai problemi:
1. Controlla i log Firebase: `firebase functions:log`
2. Verifica configurazione Meta app
3. Testa OAuth flow in locale prima del deploy
