# 🔧 Configurazione Firebase per GitHub Codespaces

## Problema
Quando sviluppi in **GitHub Codespaces**, Firebase OAuth non funziona perché il dominio temporaneo non è autorizzato.

### Errore Tipico
```
The current domain is not authorized for OAuth operations.
Add your domain (miniature-cod-6vvj6wv5rxr2597w-5173.app.github.dev) 
to the OAuth redirect domains list in the Firebase console
```

## ✅ Soluzione: Autorizza Domini Codespaces

### Passo 1: Trova il Tuo Dominio Codespaces
Il dominio cambia ad ogni Codespace, ma segue questo pattern:
```
[nome-random]-[porta].app.github.dev
```

Esempio:
```
miniature-cod-6vvj6wv5rxr2597w-5173.app.github.dev
```

### Passo 2: Aggiungi Domini Wildcard su Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto **PtPro**
3. Vai su **Authentication** → **Settings** → **Authorized domains**
4. Clicca **Add domain**
5. Aggiungi questi pattern:

```
*.app.github.dev
localhost
127.0.0.1
```

**Nota**: Firebase supporta wildcard `*` per sottodomini.

### Passo 3: Verifica
- Ricarica l'app in Codespaces
- L'errore OAuth dovrebbe sparire
- Login funzionerà correttamente

## 🚀 Domini da Configurare

### Sviluppo
```
localhost
127.0.0.1
*.app.github.dev          ← Codespaces
*.gitpod.io               ← Gitpod (se usato)
*.codesandbox.io          ← CodeSandbox (se usato)
```

### Produzione (da aggiungere al deploy)
```
fitflowpro.app
www.fitflowpro.app
*.fitflowpro.app          ← Per tenant personalizzati
```

## 🔐 Sicurezza

### Wildcard sono Sicuri?
✅ **Sì**, perché:
- Firebase valida comunque l'origine della richiesta
- Solo app con le tue credenziali Firebase possono autenticare
- Utile per ambienti di sviluppo temporanei

### Best Practice
- ✅ Usa wildcard per sviluppo (`*.app.github.dev`)
- ✅ Specifica domini esatti per produzione (`fitflowpro.app`)
- ❌ Non condividere API keys pubblicamente
- ❌ Non disabilitare le restrizioni di dominio

## 🐛 Troubleshooting

### Errore Persiste dopo Aggiunta Dominio
1. **Svuota cache browser** (Ctrl+Shift+Del)
2. **Riavvia Codespace**
3. **Verifica dominio corretto** in console → Network → Headers

### Come Trovare il Dominio Attuale
```javascript
// In console browser:
console.log(window.location.hostname);

// Output esempio:
// miniature-cod-6vvj6wv5rxr2597w-5173.app.github.dev
```

### Test Rapido
```javascript
// Verifica se dominio è autorizzato
firebase.auth().onAuthStateChanged((user) => {
  console.log('Auth OK, user:', user?.email);
});
```

## 📱 Configurazione Multi-Tenant PWA

Per il **manifest dinamico** (Opzione 1), assicurati che:

### 1. Domini PWA Configurati
Ogni tenant può avere il suo sottodominio:
```
palestra-roma.fitflowpro.app
studio-fit.fitflowpro.app
wellness-spa.fitflowpro.app
```

Aggiungi su Firebase:
```
*.fitflowpro.app
```

### 2. Service Worker Registrato
Il service worker gestisce il manifest dinamico:
```javascript
// index.html
<script src="/manifest-generator.js"></script>
```

### 3. localStorage Branding
Al primo login, il branding viene salvato:
```javascript
localStorage.setItem('tenantBranding', JSON.stringify({
  appName: 'Palestra Roma',
  logoUrl: 'https://r2.../logo.png',
  ...
}));
```

### 4. Manifest Personalizzato
Il browser legge il manifest dinamico:
```json
{
  "name": "Palestra Roma",
  "short_name": "PalestraRM",
  "icons": [{ "src": "logo-personalizzato.png" }]
}
```

## ✨ Risultato Finale

### Prima (Statico)
- Icona: Logo FitFlow generico
- Nome: "FitFlow Pro"
- Uguale per tutti

### Dopo (Dinamico)
- Icona: Logo tenant personalizzato (se disponibile)
- Nome: Nome personalizzato tenant
- Univoco per ogni tenant

**Nota**: Il cambio è **dentro l'app**, non sull'icona della home screen (limitazione iOS/Android).

## 🎯 Prossimi Passi

1. ✅ Aggiungi `*.app.github.dev` ai domini Firebase
2. ✅ Testa login in Codespaces
3. ✅ Verifica manifest dinamico funziona
4. 🔄 Quando deploy in produzione, aggiungi dominio reale

---

**Aggiornato**: 23 Novembre 2025  
**Versione**: Sistema Multi-Tenant con PWA Dinamica
