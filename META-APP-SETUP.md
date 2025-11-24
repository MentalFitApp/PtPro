w# Instagram Basic Display Setup

## ⚡ AGGIORNAMENTO: Usato Instagram Basic Display API

Abbiamo switchato da Facebook Login a **Instagram Basic Display API** per evitare i problemi di configurazione Facebook.

### Cosa è cambiato:
- ✅ OAuth URL: `https://api.instagram.com/oauth/authorize`
- ✅ Scopes: `user_profile`, `user_media` (più semplici)
- ✅ Non serve collegare Facebook Page
- ✅ API endpoint: `https://graph.instagram.com`

---

## SOLUZIONE: Completa la configurazione App

### 1. Vai alle Impostazioni di Base
🔗 https://developers.facebook.com/apps/1604057627673502/settings/basic/

### 2. Completa TUTTI i campi obbligatori:

#### ✅ Informazioni di Base
- **Nome visualizzato**: FlowFit Pro (o il tuo brand)
- **Email di contatto**: tuo-email@dominio.com
- **Categoria**: Business and Pages o Fitness

#### ✅ Privacy Policy URL (OBBLIGATORIO)
```
https://tuo-dominio-produzione.com/privacy
```
O per test locale (temporaneo):
```
https://[tuo-codespace-url]/privacy
```

#### ✅ Terms of Service URL (Consigliato)
```
https://tuo-dominio-produzione.com/terms
```

#### ✅ User Data Deletion (OBBLIGATORIO per Live Mode)
Aggiungi URL callback per cancellazione dati:
```
https://tuo-dominio.com/api/delete-user-data
```

**OPPURE** fornisci un indirizzo email:
```
privacy@flowfitpro.it
```

#### ✅ App Icon (Obbligatorio per Live Mode)
- Dimensioni: 1024x1024 px
- Formato: PNG o JPG
- Logo del tuo brand

---

## 3. Configura Instagram Basic Display

### Vai a: Products → Instagram Basic Display → Basic Display
🔗 https://developers.facebook.com/apps/1604057627673502/instagram-basic-display/basic-display/

#### OAuth Redirect URIs
Aggiungi TUTTI questi URL:
```
http://localhost:5173/oauth/callback
https://[tuo-codespace].app.github.dev/oauth/callback
https://tuo-dominio-produzione.com/oauth/callback
```

#### Deauthorize Callback URL
```
https://tuo-dominio.com/oauth/deauthorize
```

#### Data Deletion Request URL
```
https://tuo-dominio.com/oauth/delete
```

---

## 4. Aggiungi Tester (per Development Mode)

### Vai a: Roles → Roles
🔗 https://developers.facebook.com/apps/1604057627673502/roles/roles/

1. Clicca **"Add Testers"**
2. Inserisci il tuo account Facebook/Instagram
3. Vai su Facebook e accetta l'invito in:
   - https://www.facebook.com/settings?tab=applications
   - Sezione "Apps, Websites and Games"
   - Cerca l'app e accetta

---

## 5. OPPURE: Passa a Live Mode (Produzione)

⚠️ **Requisiti per Live Mode:**
- ✅ Privacy Policy URL valido
- ✅ Terms of Service URL
- ✅ User Data Deletion configurato
- ✅ App Icon caricato
- ✅ Tutte le info di base complete
- ✅ App Review completato (per permessi avanzati)

### Come attivare Live Mode:
1. Vai in Settings → Basic
2. In alto trovi il toggle "App Mode"
3. Passa da **Development** a **Live**

**NOTA**: In Live Mode NON serve aggiungere tester, l'app funziona per tutti!

---

## 6. Verifica OAuth URLs

Nel tuo codice (`OAuthButton.jsx`), assicurati di usare:

```javascript
const providers = {
  instagram: {
    name: 'Instagram',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID,
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: [
      'instagram_basic',
      'instagram_manage_insights',
      'instagram_manage_comments',
      'pages_show_list',
      'pages_read_engagement',
      'business_management'
    ].join(','),
  }
};
```

---

## 7. Test della Configurazione

### Development Mode (con tester):
1. Assicurati di essere aggiunto come tester
2. Accetta l'invito su Facebook
3. Prova il login Instagram

### Live Mode:
1. Completa tutti i requisiti sopra
2. Passa a Live Mode
3. L'app funziona per tutti (nessun tester necessario)

---

## Troubleshooting

### "App non attiva"
→ Aggiungi tester (Dev Mode) o passa a Live Mode

### "Invalid redirect_uri"
→ Verifica che l'URL sia esattamente quello configurato (incluso http/https)

### "Privacy Policy URL required"
→ Aggiungi URL valido in Settings → Basic

### "User data deletion required"
→ Configura callback URL o email in Settings → Basic

---

## Prossimi Passi

1. **IMMEDIATO**: Completa Privacy Policy URL
2. **IMMEDIATO**: Aggiungi Data Deletion callback/email
3. **OPZIONALE**: Carica App Icon
4. **OPZIONALE**: Aggiungi Terms URL
5. **SCEGLI**:
   - Opzione A: Aggiungi te stesso come tester
   - Opzione B: Passa a Live Mode (se hai completato tutto)

---

## Link Utili

- **App Dashboard**: https://developers.facebook.com/apps/1604057627673502/
- **Settings Basic**: https://developers.facebook.com/apps/1604057627673502/settings/basic/
- **Instagram Display**: https://developers.facebook.com/apps/1604057627673502/instagram-basic-display/
- **Roles**: https://developers.facebook.com/apps/1604057627673502/roles/roles/
- **Privacy Policy (tua)**: https://tuo-dominio.com/privacy
- **Terms (tua)**: https://tuo-dominio.com/terms

---

✅ **Le pagine Privacy e Terms sono già create e funzionanti!**
- Locale: http://localhost:5173/privacy e /terms
- Modificabili da: CEO Dashboard → Landing Pages → Pulsanti "Modifica"
- Firestore: `platform/settings/landingPages/privacy` e `/terms`
