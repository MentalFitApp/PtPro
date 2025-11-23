# 🎨 Guida alla Personalizzazione del Logo

## Panoramica
Ogni tenant può ora personalizzare completamente la propria area caricando un **logo personalizzato** oltre ai nomi delle aree.

## Come Caricare il Logo

### 1. Accedi alla Pagina di Personalizzazione
- Vai su **Dashboard Admin** → **Personalizzazione** (icona tavolozza 🎨)
- Oppure naviga direttamente a `/admin/branding`

### 2. Carica il Tuo Logo
- Clicca su "**Carica Logo**" o trascina un'immagine
- Formati supportati: **JPG, PNG, WebP**
- Dimensione massima: **5MB**
- Dimensioni consigliate: **200x50px** (proporzioni orizzontali)

### 3. Visualizza l'Anteprima
- Il logo apparirà immediatamente in anteprima
- Puoi rimuoverlo cliccando sulla **X rossa** in alto a destra

### 4. Salva le Modifiche
- Clicca su "**Salva Modifiche**"
- Ricarica la pagina per vedere il logo nell'header

## Dove Appare il Logo

Il logo personalizzato sostituisce il design predefinito in:

### 📱 Header Mobile (sempre fisso)
- Mostra **solo il logo** (massimo 120px larghezza)
- Ottimizzato per iOS e Android con safe area

### 💻 Sidebar Desktop
- Mostra il logo quando **espansa** (massimo larghezza completa)
- Mostra versione **compatta** (60px) quando collassata
- Centrato verticalmente per design pulito

### ✨ Fallback Automatico
Se non carichi un logo, viene mostrato il design predefinito:
- Icona gradient blu-cyan
- Nome app personalizzato
- Sottotitolo area ruolo

## Requisiti Tecnici

### Dimensioni Ottimali
```
Larghezza: 200-250px
Altezza: 40-60px
Formato: PNG con sfondo trasparente (consigliato)
Risoluzione: 2x per Retina display
```

### Linee Guida Design
- ✅ Logo **orizzontale** funziona meglio
- ✅ Testo **leggibile** su sfondo scuro (slate-900)
- ✅ Colori **contrastanti** (bianco, blue, cyan)
- ❌ Evita loghi troppo **alti** (max 60px)
- ❌ Evita dettagli troppo **piccoli** su mobile

## Storage e Performance

### Cloudflare R2
- Tutti i logo vengono caricati su **Cloudflare R2**
- Compressione automatica delle immagini (70-80% riduzione)
- Bandwidth **gratuito** (nessun costo aggiuntivo)
- CDN globale per caricamento veloce

### Path Storage
```
r2://tenant-{tenantId}/branding/{filename}
```

### Sicurezza
- Solo **admin del tenant** possono modificare il logo
- Isolamento completo: ogni tenant vede solo il proprio
- Validazione file lato client e server

## Esempi di Utilizzo

### Palestra Locale
```
Logo: "PalestraRoma_Logo.png"
AppName: "Palestra Roma"
AdminArea: "Area Gestione"
```

### Studio Personal Training
```
Logo: "StudioFit_Horizontal.png"
AppName: "Studio FitPro"
ClientArea: "Il Mio Percorso"
```

### Centro Benessere
```
Logo: "WellnessCenter_White.png"
AppName: "Wellness & Spa"
CoachArea: "Area Trainer"
```

## Risoluzione Problemi

### Logo Non Appare
1. Controlla di aver cliccato "**Salva Modifiche**"
2. **Ricarica la pagina** (Ctrl/Cmd + R)
3. Verifica la console per errori di caricamento
4. Assicurati che l'immagine sia sotto 5MB

### Logo Troppo Grande
- Il sistema limita automaticamente a max-width
- Su mobile: 120px larghezza massima
- Desktop sidebar: adatta alla larghezza disponibile

### Logo Non Centrato
- Usa immagini con **proporzioni orizzontali**
- Aggiungi padding trasparente se necessario
- Formato PNG con alpha channel funziona meglio

### Errore Upload
- Verifica formato file (JPG, PNG, WebP)
- Controlla dimensione (max 5MB)
- Prova a comprimere l'immagine prima dell'upload
- Usa strumenti come TinyPNG o Squoosh

## API e Integrazione

### Struttura Dati Firestore
```javascript
tenants/{tenantId}/settings/branding
{
  appName: "Nome App",
  logoUrl: "https://pub-xxx.r2.dev/tenant-xxx/branding/logo.png",
  adminAreaName: "Area Personale",
  clientAreaName: "Area Cliente",
  coachAreaName: "Area Coach",
  collaboratoreAreaName: "Area Collaboratore",
  updatedAt: "2025-01-15T10:30:00.000Z"
}
```

### Hook React
```javascript
import { useTenantBranding } from '../hooks/useTenantBranding';

function MyComponent() {
  const { branding, loading } = useTenantBranding();
  
  if (loading) return <Spinner />;
  
  return (
    <img src={branding.logoUrl} alt={branding.appName} />
  );
}
```

### Caricamento Programmatico
```javascript
import { uploadToR2 } from '../storageUtils';

const file = /* File object */;
const tenantId = localStorage.getItem('tenantId');

const logoUrl = await uploadToR2(file, tenantId, 'branding');
// logoUrl pronto per essere salvato in Firestore
```

## Roadmap Future

### Prossime Funzionalità
- [ ] Editor colori tema (primary, accent, background)
- [ ] Upload favicon personalizzato
- [ ] Watermark automatico su foto clienti
- [ ] Template pre-configurati (palestra, yoga, crossfit, ecc.)
- [ ] A/B testing nomi aree per conversione

---

**Ultimo aggiornamento:** 23 Novembre 2025  
**Versione:** 2.1.0 - Sistema Branding Completo
