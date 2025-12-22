# Video Splash Screen PWA

## 🎬 Come usare

1. **Carica il tuo video** in questa cartella con il nome `splash.mp4`
2. Il video verrà mostrato automaticamente all'avvio dell'app PWA

## 📋 Requisiti del video

| Proprietà | Valore consigliato |
|-----------|-------------------|
| **Formato** | MP4 (H.264 codec) |
| **Durata** | 3-5 secondi (max 10) |
| **Risoluzione** | 1080x1920 (verticale) |
| **Dimensione** | < 5MB |
| **Audio** | Non necessario (muto) |

⚠️ Il video viene riprodotto **MUTO** per rispettare le policy di autoplay dei browser.

## ⚙️ Configurazione

Nel file `src/App.jsx` puoi modificare:

```jsx
<VideoSplash 
  videoUrl="/videos/splash.mp4"  // URL del video
  showOnce={true}      // true = mostra solo la prima volta
  maxDuration={10}     // timeout massimo in secondi
  allowSkip={true}     // permette di saltare toccando
/>
```

## 🎯 Opzioni

- `showOnce={true}` → Mostra il video solo al primo accesso
- `showOnce={false}` → Mostra il video ad ogni apertura dell'app
- `allowSkip={true}` → L'utente può toccare per saltare
- `allowSkip={false}` → L'utente deve guardare tutto il video

## ☁️ Hosting su R2 (per video grandi)

Se il video è > 2MB, hostalo su Cloudflare R2:

```jsx
videoUrl="https://media.flowfitpro.it/public/videos/splash.mp4"
```

## 🚫 Disabilitare il video

In `src/App.jsx`, imposta `showSplash` a `false`:

```jsx
const [showSplash, setShowSplash] = useState(false);
```
