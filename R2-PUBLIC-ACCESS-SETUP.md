# 🌐 Cloudflare R2 Public Access Setup

## Problema: Immagini Non Visibili

Se vedi errori come:
```
GET https://flowfitpro.it/clients/.../photo.jpg net::ERR_NAME_NOT_RESOLVED
```

Significa che il bucket R2 non è configurato per l'accesso pubblico o il dominio personalizzato non è configurato correttamente.

## Soluzione: Abilita Accesso Pubblico R2

### Opzione 1: Usa l'URL Pubblico R2 (CONSIGLIATO)

Questa è la soluzione più semplice e veloce:

#### 1. Abilita Accesso Pubblico sul Bucket

1. **Vai alla Dashboard Cloudflare**
   - Apri: https://dash.cloudflare.com/
   - Vai su: **R2 Object Storage**

2. **Apri il Bucket `fitflow`**
   - Clicca sul bucket **fitflow**

3. **Abilita Public Access**
   - Vai alla tab: **Settings**
   - Trova la sezione: **Public Access**
   - Clicca su: **Allow Access** (o **Connect Domain**)
   - Seleziona: **Allow Access via R2.dev subdomain**
   - Conferma l'operazione

4. **Copia l'URL Pubblico**
   - Dopo aver abilitato l'accesso pubblico, vedrai un URL tipo:
     ```
     https://pub-7682069cf34302dfc6988fbe193f2ba6.r2.dev
     ```
   - **IMPORTANTE**: Non è necessario copiare questo URL, il codice lo genera automaticamente

#### 2. Verifica la Configurazione `.env`

Il file `.env` dovrebbe avere `VITE_R2_PUBLIC_URL` vuoto:

```env
VITE_R2_ACCOUNT_ID=7682069cf34302dfc6988fbe193f2ba6
VITE_R2_ACCESS_KEY_ID=91fda93481d38b755d3591081b173be6
VITE_R2_SECRET_ACCESS_KEY=5b3b9059a2972cf0b910a05b35d631896187daa809ccb44c6aefb0e06400aede
VITE_R2_BUCKET_NAME=fitflow
VITE_R2_PUBLIC_URL=
```

**Nota**: Lasciando `VITE_R2_PUBLIC_URL` vuoto, il codice userà automaticamente l'URL pubblico R2 di default.

#### 3. Ricostruisci l'Applicazione

```bash
npm run build
```

Oppure se stai testando in locale:
```bash
npm run dev
```

### Opzione 2: Configura Custom Domain (AVANZATO)

Se vuoi usare un dominio personalizzato come `flowfitpro.it`:

#### 1. Aggiungi Custom Domain in R2

1. Nel bucket `fitflow`, vai su **Settings** → **Public Access**
2. Clicca su: **Connect Domain**
3. Inserisci il dominio: `media.flowfitpro.it` (usa un sottodominio!)
4. Cloudflare ti darà un record CNAME da aggiungere al DNS

#### 2. Configura DNS

1. Vai su: **Cloudflare DNS** (nel tuo account dove è registrato flowfitpro.it)
2. Aggiungi un record CNAME:
   - **Tipo**: CNAME
   - **Nome**: media (o storage, o files)
   - **Target**: Il target fornito da R2 (es: `fitflow.7682069cf34302dfc6988fbe193f2ba6.r2.cloudflarestorage.com`)
   - **Proxy status**: Può essere arancione (proxied) o grigio (DNS only)

#### 3. Attendi Propagazione DNS

Può richiedere da pochi minuti a 24 ore. Verifica con:
```bash
nslookup media.flowfitpro.it
```

#### 4. Aggiorna `.env`

```env
VITE_R2_PUBLIC_URL=https://media.flowfitpro.it
```

**IMPORTANTE**: Non usare il dominio principale `flowfitpro.it`, usa sempre un sottodominio!

## Verifica che Funzioni

### 1. Test nel Browser

1. Apri l'app
2. Carica una foto (es: in un check)
3. Apri Developer Tools (F12) → Console
4. Dovresti vedere un log tipo:
   ```
   Upload completato su R2: abc123.jpg -> https://pub-7682069cf34302dfc6988fbe193f2ba6.r2.dev/clients/.../abc123.jpg
   ```

### 2. Verifica l'Immagine si Carica

1. L'immagine dovrebbe essere visibile nell'app
2. Non dovrebbero esserci errori `ERR_NAME_NOT_RESOLVED` nella console
3. Cliccando sull'immagine dovrebbe aprirsi un popup (non reindirizzare)

### 3. Test Diretto dell'URL

Copia l'URL dell'immagine dalla console e aprilo in una nuova tab del browser:
- ✅ Se vedi l'immagine: tutto funziona!
- ❌ Se vedi errore 403: il bucket non è pubblico
- ❌ Se vedi errore DNS: il dominio non è configurato correttamente

## Problemi Comuni

### "ERR_NAME_NOT_RESOLVED"

**Causa**: Il dominio `flowfitpro.it` non è configurato per R2 o non esiste

**Soluzione**: 
- Usa l'Opzione 1 (URL pubblico R2 di default)
- Lascia `VITE_R2_PUBLIC_URL` vuoto nel `.env`
- Ricostruisci l'app con `npm run build`

### "403 Forbidden" quando si apre l'immagine

**Causa**: Il bucket R2 non ha l'accesso pubblico abilitato

**Soluzione**:
- Vai su Cloudflare → R2 → bucket `fitflow` → Settings → Public Access
- Abilita "Allow Access via R2.dev subdomain"

### Le immagini caricate prima non si vedono

**Causa**: Gli URL vecchi usavano un dominio diverso

**Soluzione**: 
- Le immagini sono ancora su R2, ma con URL diversi
- Potrebbe essere necessario ri-caricarle o fare una migrazione URL nel database

### Il popup non si apre / reindirizza a un altro sito

**Causa**: Il componente React non gestisce correttamente il click sulle immagini

**Soluzione**: Verificare che i componenti usino un modal/lightbox invece di `<a href>` links.

## Configurazione GitHub Secrets

Non dimenticare di aggiornare anche i GitHub Secrets per il deployment:

1. Vai su: https://github.com/MentalFitApp/PtPro/settings/secrets/actions
2. Modifica il secret: `VITE_R2_PUBLIC_URL`
3. Imposta il valore a:
   - **Vuoto** (se usi URL pubblico R2 di default) - CONSIGLIATO
   - Oppure il tuo custom domain (es: `https://media.flowfitpro.it`)

## Riepilogo

✅ **Soluzione Raccomandata**: Usa l'URL pubblico R2 di default
- Lascia `VITE_R2_PUBLIC_URL` vuoto
- Abilita "Public Access" nel bucket R2
- Ricostruisci l'app

❌ **Evita**: Usare domini personalizzati senza configurarli correttamente nel DNS
