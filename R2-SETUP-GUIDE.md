# 📦 Guida Setup Cloudflare R2 Storage

Questa guida ti aiuta a configurare Cloudflare R2 per lo storage di foto e video nell'app PtPro.

## 🎯 Perché R2?

| Caratteristica | Firebase Storage | Cloudflare R2 | Risparmio |
|---------------|------------------|---------------|-----------|
| **Storage** | €0.026/GB/mese | €0.015/GB/mese | **42%** |
| **Download** | €0.12/GB | **€0 (gratis)** | **100%** |
| **Upload** | €0.036/GB | €0.0045/GB | **87%** |
| **Tier Gratis** | 5GB + 1GB/giorno download | 10GB + 1M operazioni/mese | **Migliore** |

### Esempio Costi Reali (100 PT con 500MB media ciascuno)

**Firebase:**
- Storage: 50GB × €0.026 = €1.30/mese
- Download: 20GB/giorno × €0.12 = €72/mese
- **Totale: €73.30/mese**

**R2:**
- Storage: 50GB × €0.015 = €0.75/mese
- Download: €0 (gratis!)
- **Totale: €0.75/mese**

**💰 Risparmio: €72.55/mese (99% in meno!)**

---

## 🚀 Setup Passo-Passo

### Step 1: Crea Account Cloudflare

1. Vai su [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Crea un account gratuito o accedi
3. Non serve aggiungere un dominio per usare R2

### Step 2: Attiva R2 Storage

1. Nel menu laterale, clicca su **R2 Object Storage**
2. Se è la prima volta, clicca **Purchase R2** (non ti verrà addebitato nulla finché non superi i limiti gratuiti)
3. Accetta i termini e attiva R2

### Step 3: Crea un Bucket

1. Clicca **Create Bucket**
2. Configura:
   - **Bucket name**: `ptpro-media` (o nome a tua scelta)
   - **Location**: `Automatic` (o scegli una regione specifica)
3. Clicca **Create Bucket**

### Step 4: Configura CORS (Importante!)

Per permettere al browser di caricare file, devi configurare CORS:

1. Apri il bucket appena creato
2. Vai su **Settings** → **CORS Policy**
3. Clicca **Edit CORS Policy** e incolla:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://mentalfitapp.github.io",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

4. Sostituisci `your-production-domain.com` con il tuo dominio effettivo
5. Clicca **Save**

### Step 5: Genera API Token

1. Torna alla pagina principale R2
2. Clicca **Manage R2 API Tokens**
3. Clicca **Create API Token**
4. Configura:
   - **Token name**: `ptpro-app-token`
   - **Permissions**: 
     - ✅ Object Read & Write
     - ✅ Apply to specific bucket: `ptpro-media`
   - **TTL**: No expiry (o scegli una scadenza)
5. Clicca **Create API Token**
6. **IMPORTANTE**: Copia e salva in modo sicuro:
   - **Access Key ID**: `xxxxxxxxxxxxxxxxx`
   - **Secret Access Key**: `yyyyyyyyyyyyyyyy`
   - Questi dati **non saranno mostrati di nuovo**!

### Step 6: Trova il tuo Account ID

1. Nella dashboard R2, guarda l'URL del browser
2. L'Account ID è nella URL: `https://dash.cloudflare.com/{QUESTO_È_ACCOUNT_ID}/r2`
3. Oppure lo trovi nella sezione "R2" sotto "Account ID"

### Step 7: Configura l'App

1. Apri il file `.env` nella root del progetto
2. Compila le variabili R2:

```env
VITE_R2_ACCOUNT_ID=your_account_id_here
VITE_R2_ACCESS_KEY_ID=your_access_key_from_step5
VITE_R2_SECRET_ACCESS_KEY=your_secret_key_from_step5
VITE_R2_BUCKET_NAME=ptpro-media
VITE_R2_PUBLIC_URL=https://pub-your_account_id.r2.dev
```

3. Salva il file

### Step 8: (Opzionale) Configura Custom Domain

Per URL più puliti tipo `https://media.tuodominio.com/file.jpg`:

1. Nel bucket, vai su **Settings** → **Public Access**
2. Clicca **Connect Domain**
3. Inserisci il tuo sottodominio (es. `media.tuodominio.com`)
4. Cloudflare ti darà un record DNS da aggiungere
5. Aggiungi il record DNS nel tuo dominio
6. Aspetta la propagazione (5-10 minuti)
7. Aggiorna `.env`:
   ```env
   VITE_R2_PUBLIC_URL=https://media.tuodominio.com
   ```

### Step 9: Testa l'Upload

1. Riavvia il server di sviluppo:
   ```bash
   npm run dev
   ```

2. Vai nella sezione Anamnesi o Check di un cliente
3. Prova a caricare una foto
4. Dovresti vedere nel console:
   ```
   Compressione: 2450KB -> 580KB (76% riduzione)
   Upload completato su R2: abc123.jpg -> https://...
   ```

---

## 🔧 Troubleshooting

### Errore: "Configurazione R2 mancante"

**Causa**: Variabili d'ambiente non configurate  
**Soluzione**: Verifica che `.env` contenga tutte le variabili `VITE_R2_*`

### Errore: "CORS policy blocked"

**Causa**: CORS non configurato nel bucket  
**Soluzione**: Segui Step 4 e aggiungi la tua origin alla policy CORS

### Errore: "Access Denied"

**Causa**: Token API senza permessi sufficienti  
**Soluzione**: Ricrea il token con permessi "Object Read & Write"

### Le immagini non si vedono

**Causa**: Bucket non pubblicamente accessibile  
**Soluzione**: 
1. Vai su Settings → Public Access
2. Abilita "Allow Public Access" per il bucket
3. Oppure usa un Custom Domain

### Upload lento

**Causa**: Immagini troppo grandi  
**Soluzione**: La compressione automatica è già attiva. Se persiste:
- Riduci `maxSizeMB` in `cloudflareStorage.js` (riga 49)
- Verifica la connessione internet

---

## 📊 Monitoraggio Uso

1. Vai su **R2 Dashboard**
2. Seleziona il tuo bucket
3. Vedi statistiche in tempo reale:
   - Storage usato (GB)
   - Operazioni (read/write)
   - Bandwidth (download)

### Alert Costi

Imposta alert per evitare sorprese:

1. Dashboard Cloudflare → **Notifications**
2. **Add notification**
3. Scegli "R2 Usage Alert"
4. Imposta soglia (es. €5/mese)
5. Riceverai email se superi la soglia

---

## 🔐 Sicurezza

### Best Practices

✅ **DO:**
- Conserva le credenziali R2 in `.env` (mai in git)
- Usa token con permessi minimi necessari
- Ruota i token ogni 3-6 mesi
- Abilita CORS solo per i tuoi domini
- Usa Custom Domain per produzione

❌ **DON'T:**
- Non committare `.env` su git
- Non condividere Secret Access Key
- Non dare permessi "Admin" al token
- Non abilitare CORS per `*` (tutti i domini)

### File `.gitignore`

Verifica che `.env` sia ignorato da git:

```
# .gitignore
.env
.env.local
```

---

## 🎓 Compressione Immagini

L'app comprime automaticamente le immagini prima dell'upload:

### Parametri Attuali
- **Max size**: 1MB finale
- **Max resolution**: 1920px (larghezza o altezza)
- **Qualità**: Automatica (mantiene buona qualità visiva)
- **Riduzione media**: 70-80%

### Esempio
- Foto originale: 3.5MB (4032×3024px)
- Dopo compressione: 680KB (1920×1440px)
- **Risparmio**: 80% dimensione, 52% risoluzione

### Personalizzare la Compressione

Modifica `src/cloudflareStorage.js`, funzione `compressImage`:

```javascript
const options = {
  maxSizeMB: 1,           // Cambia per file più grandi/piccoli
  maxWidthOrHeight: 1920, // Cambia per più/meno qualità
  useWebWorker: true,     // Lascia true per performance
};
```

---

## 📈 Migrazione da Firebase

Se hai già file su Firebase Storage:

### Opzione 1: Doppio Storage (Consigliato per transizione)

Mantieni entrambi attivi:
- Nuovi upload vanno su R2
- File vecchi restano su Firebase
- Migra gradualmente i file più usati

### Opzione 2: Migrazione Completa

1. Scarica tutti i file da Firebase:
   ```bash
   gsutil -m cp -r gs://your-bucket-name/* ./firebase-backup/
   ```

2. Carica su R2 usando AWS CLI:
   ```bash
   aws s3 sync ./firebase-backup/ s3://ptpro-media/ \
     --endpoint-url https://{account-id}.r2.cloudflarestorage.com
   ```

3. Aggiorna i riferimenti nel database Firestore

---

## 💡 Tips & Tricks

### Organizzazione File

Struttura consigliata nel bucket:

```
clients/
├── {clientId}/
│   ├── anamnesi_photos/
│   │   ├── uuid1.jpg
│   │   └── uuid2.jpg
│   ├── check_photos/
│   │   ├── uuid3.jpg
│   │   └── uuid4.mp4
│   └── profile/
│       └── avatar.jpg
└── shared/
    └── templates/
```

### Backup Automatici

Configura backup automatici con Cloudflare Workers:

```javascript
// worker.js - esempio backup settimanale
export default {
  async scheduled(event, env, ctx) {
    // Copia bucket su secondo bucket di backup
    // ...
  }
}
```

### Cache & Performance

R2 include automaticamente:
- Cache CDN globale
- Gzip compression
- HTTP/2 e HTTP/3
- Zero-egress (nessun costo download)

---

## 📞 Supporto

### Problemi con questo Setup?

1. Verifica la [documentazione ufficiale R2](https://developers.cloudflare.com/r2/)
2. Controlla il [Cloudflare Community Forum](https://community.cloudflare.com/)
3. Apri un issue su questo repository

### Costi Superiori all'Atteso?

1. Controlla usage su R2 Dashboard
2. Verifica se hai configurato cache correttamente
3. Considera di ridurre la qualità compressione (se appropriate)

---

## ✅ Checklist Setup

Prima di andare in produzione, verifica:

- [ ] Account Cloudflare creato
- [ ] Bucket R2 configurato
- [ ] CORS policy configurata
- [ ] API Token generato e salvato
- [ ] `.env` configurato con tutte le variabili R2
- [ ] Upload test eseguito con successo
- [ ] Compressione immagini funzionante
- [ ] (Opzionale) Custom Domain configurato
- [ ] Monitoring e alert configurati
- [ ] `.env` ignorato da git

---

**🎉 Setup completato! Ora puoi caricare foto e video risparmiando fino al 99% sui costi!**
