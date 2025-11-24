# 🚀 Instagram Basic Display - Guida Setup Completa

## ✅ Vantaggi rispetto a Facebook Login
- **Più semplice**: Non serve collegare Facebook Page
- **Meno permessi**: Solo user_profile e user_media
- **Configurazione diretta**: OAuth Instagram senza passare da Facebook
- **Meno errori**: Evita i problemi "App non attiva"

---

## 📋 Setup Completo

### 1. Configura Instagram Basic Display

🔗 **Vai su**: https://developers.facebook.com/apps/1604057627673502/instagram-basic-display/basic-display/

#### A. Valid OAuth Redirect URIs
Aggiungi TUTTI questi URI (uno per riga):
```
http://localhost:5173/oauth/callback
https://[tuo-codespace].app.github.dev/oauth/callback
https://tuo-dominio-produzione.com/oauth/callback
```

**Esempio Codespace**:
```
https://miniature-cod-6vvj6wv5rxr2597w-5173.app.github.dev/oauth/callback
```

#### B. Deauthorize Callback URL
```
https://tuo-dominio.com/oauth/deauthorize
```
O temporaneo:
```
https://[tuo-codespace].app.github.dev/oauth/deauthorize
```

#### C. Data Deletion Request URL
```
https://tuo-dominio.com/oauth/delete
```
O temporaneo:
```
https://[tuo-codespace].app.github.dev/oauth/delete
```

---

### 2. Completa Basic Settings

🔗 **Vai su**: https://developers.facebook.com/apps/1604057627673502/settings/basic/

#### ✅ Campi Obbligatori:

**Display Name**:
```
FlowFit Pro
```
O il nome del tuo brand

**App Domains** (aggiungi tutti):
```
localhost
[tuo-codespace].app.github.dev
tuo-dominio-produzione.com
```

**Privacy Policy URL**:
```
https://tuo-dominio.com/privacy
```
Temporaneo per test:
```
https://[tuo-codespace].app.github.dev/privacy
```

**Terms of Service URL** (opzionale ma consigliato):
```
https://tuo-dominio.com/terms
```

**App Icon** (per Live Mode):
- Dimensioni: 1024x1024 px
- Formato: PNG o JPG
- Logo del tuo brand

---

### 3. Aggiungi Instagram Test User (SOLO per Development Mode)

🔗 **Vai su**: https://developers.facebook.com/apps/1604057627673502/instagram-basic-display/basic-display/

Scroll giù fino a "Instagram Testers"

#### Aggiungi il tuo account Instagram:

1. Clicca **"Add Instagram Testers"**
2. Inserisci il tuo **username Instagram** (non Facebook!)
3. Vai su Instagram app → Settings → Apps and Websites
4. Cerca "Tester Invites" e accetta

**⚠️ IMPORTANTE**: Deve essere un account Instagram, non Facebook!

---

### 4. Ottieni Client ID e Secret

🔗 **Vai su**: https://developers.facebook.com/apps/1604057627673502/instagram-basic-display/basic-display/

Scroll giù fino a "Instagram App ID" e "Instagram App Secret"

#### A. Copia Instagram App ID
```
[sarà diverso dal Facebook App ID]
```

#### B. Genera e copia Instagram App Secret
Clicca su "Show" e copia il secret

#### C. Aggiorna .env locale:
```bash
VITE_INSTAGRAM_CLIENT_ID=tuo_instagram_app_id
```

#### D. Aggiorna Firebase Secrets:
```bash
cd functions
firebase functions:secrets:set INSTAGRAM_CLIENT_ID
# Incolla l'Instagram App ID

firebase functions:secrets:set INSTAGRAM_CLIENT_SECRET
# Incolla l'Instagram App Secret
```

---

### 5. Verifica la Configurazione

#### ✅ Checklist Pre-Test:

- [ ] Valid OAuth Redirect URIs configurati
- [ ] Privacy Policy URL impostato
- [ ] App Domains configurati
- [ ] Instagram Test User aggiunto e accettato
- [ ] INSTAGRAM_CLIENT_ID aggiornato in .env
- [ ] Firebase Secrets aggiornati
- [ ] Cloud Functions deployate

---

### 6. Test del Flow OAuth

#### A. Avvia il dev server:
```bash
npm run dev
```

#### B. Vai su Instagram Hub:
```
http://localhost:5173/instagram
```
O il tuo Codespace URL

#### C. Clicca "Collega Instagram"

#### D. Dovresti vedere:
1. Redirect a Instagram
2. Login con account Instagram (quello aggiunto come tester)
3. Autorizza l'app
4. Redirect a `/oauth/callback`
5. Success! Torna a Instagram Hub

---

## 🔧 Troubleshooting

### "Redirect URI Mismatch"
❌ **Problema**: URL di redirect non corrisponde
✅ **Soluzione**: 
1. Controlla che l'URL in "Valid OAuth Redirect URIs" sia ESATTAMENTE uguale
2. Includi http:// o https://
3. Nessuno spazio o carattere extra

### "Invalid Client ID"
❌ **Problema**: Client ID errato
✅ **Soluzione**:
1. Usa **Instagram App ID** (non Facebook App ID!)
2. Vai in Instagram Basic Display → Basic Display
3. Copia l'ID corretto da lì

### "User not authorized as tester"
❌ **Problema**: Account Instagram non aggiunto come tester
✅ **Soluzione**:
1. In Meta App → Instagram Basic Display → Instagram Testers
2. Aggiungi username Instagram
3. Su Instagram app → Settings → Apps → Tester Invites → Accetta

### "This app is in Development Mode"
❌ **Problema**: App non in Live Mode
✅ **Soluzione A - Development Mode** (test):
- Aggiungi account come Instagram Tester

✅ **Soluzione B - Live Mode** (produzione):
1. Completa tutti i campi obbligatori
2. Carica App Icon
3. In Settings → Basic → Switch to Live

---

## 📊 Dati Accessibili con Instagram Basic Display

### ✅ Con `user_profile`:
- User ID
- Username
- Account type (BUSINESS, MEDIA_CREATOR, PERSONAL)

### ✅ Con `user_media`:
- Media ID
- Caption
- Media type (IMAGE, VIDEO, CAROUSEL_ALBUM)
- Media URL
- Permalink
- Timestamp
- Username

### ❌ NON Disponibili (servono Instagram Graph API Business):
- Insights (like, comments count, reach, impressions)
- Stories
- Commenti dettagliati
- Hashtag analytics
- Audience insights

---

## 🚀 Passaggio a Instagram Graph API (Business) - Futuro

Se in futuro serve analytics avanzati:

1. Switch a **Instagram Graph API**
2. Richiede collegamento a **Facebook Page**
3. Richiede **Business/Creator Account** Instagram
4. Accesso a insights, stories, comments avanzati

Per ora, **Instagram Basic Display è sufficiente** per:
- Mostrare profilo
- Galleria media
- Info base account

---

## 📝 API Endpoints Disponibili

### Profilo Utente:
```
GET https://graph.instagram.com/{user-id}
  ?fields=id,username,account_type,media_count
```

### Media List:
```
GET https://graph.instagram.com/{user-id}/media
  ?fields=id,caption,media_type,media_url,permalink,timestamp
```

### Singolo Media:
```
GET https://graph.instagram.com/{media-id}
  ?fields=id,caption,media_type,media_url,permalink,timestamp,username
```

---

## 🔐 Security Best Practices

1. **Non esporre mai** Client Secret nel frontend
2. **Usa sempre** Cloud Functions per token exchange
3. **Rigenera Secret** se compromesso
4. **Limita redirect URIs** solo ai domini autorizzati
5. **Monitora** usage in App Dashboard

---

## ✅ Stato Attuale

- ✅ **OAuthButton.jsx**: Aggiornato con endpoint Instagram Basic Display
- ✅ **exchangeOAuthToken**: Supporta Instagram Basic Display token exchange
- ✅ **instagramProxy**: Proxies chiamate a graph.instagram.com
- ✅ **InstagramHub.jsx**: UI pronta per mostrare dati
- ⏳ **Deploy Functions**: In corso...
- ⏳ **Test OAuth Flow**: Da fare dopo deploy

---

## 🎯 Next Steps

1. ✅ Finire deploy Cloud Functions
2. ⏳ Configurare Instagram Basic Display su Meta App
3. ⏳ Aggiungere Instagram Test User
4. ⏳ Testare OAuth flow completo
5. ⏳ Verificare dati profilo e media
6. ⏳ Deploy su produzione
7. ⏳ Switch a Live Mode (quando pronto)

---

## 📚 Link Utili

- **App Dashboard**: https://developers.facebook.com/apps/1604057627673502/
- **Instagram Basic Display**: https://developers.facebook.com/apps/1604057627673502/instagram-basic-display/
- **Settings**: https://developers.facebook.com/apps/1604057627673502/settings/basic/
- **Docs Instagram Basic Display**: https://developers.facebook.com/docs/instagram-basic-display-api
- **Privacy**: https://tuo-dominio.com/privacy (già pronta!)
- **Terms**: https://tuo-dominio.com/terms (già pronta!)
