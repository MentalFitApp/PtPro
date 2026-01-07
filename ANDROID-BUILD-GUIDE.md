# 📱 FitFlows Android Build Guide

## Setup Completato ✅

Capacitor è stato configurato con successo per il progetto FitFlows.

## 📦 Plugin Installati

| Plugin | Funzionalità |
|--------|-------------|
| `@capacitor/android` | Piattaforma Android |
| `@capacitor/splash-screen` | Splash screen nativo |
| `@capacitor/status-bar` | Controllo status bar |
| `@capacitor/push-notifications` | Notifiche push native |
| `@capacitor/keyboard` | Gestione tastiera |
| `@capacitor/app` | Lifecycle app |
| `@capacitor/haptics` | Vibrazione/feedback |
| `@capacitor/camera` | Accesso fotocamera |
| `@capacitor/filesystem` | File system |
| `@capacitor/preferences` | Storage locale |

---

## 🛠️ Script NPM Disponibili

```bash
# Sincronizza web assets con Android
npm run android:sync

# Apri il progetto in Android Studio
npm run android:open

# Build completo (web + sync)
npm run android:build

# Build e run su dispositivo/emulatore
npm run android:run

# Solo copia assets (senza plugins update)
npm run android:copy
```

---

## 🚀 Come Creare l'APK per Play Store

### 1. Requisiti

- **Android Studio** installato ([Download](https://developer.android.com/studio))
- **JDK 17+** installato
- Account **Google Play Console** ($25 una tantum)

### 2. Apri il Progetto

```bash
npm run android:open
```

Questo aprirà Android Studio con il progetto.

### 3. Configura il Signing Key

Per pubblicare su Play Store, serve una chiave di firma:

```bash
# Genera keystore (esegui una sola volta, conserva il file!)
keytool -genkey -v -keystore fitflows-release.keystore -alias fitflows -keyalg RSA -keysize 2048 -validity 10000
```

### 4. Build Release APK/AAB

In Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Scegli **Android App Bundle** (AAB) per Play Store
3. Seleziona il keystore creato
4. Seleziona **release** come build variant
5. Click **Finish**

Il file AAB sarà in: `android/app/release/app-release.aab`

---

## 📝 Configurazione App

### Modificare Nome App e Package ID

Modifica [capacitor.config.ts](capacitor.config.ts):

```typescript
const config: CapacitorConfig = {
  appId: 'com.fitflows.app',  // Il tuo package ID univoco
  appName: 'FitFlows',        // Nome mostrato sotto l'icona
  // ...
};
```

Dopo la modifica:
```bash
npm run android:sync
```

### Icona e Splash Screen

Le risorse grafiche vanno in:
```
android/app/src/main/res/
├── mipmap-hdpi/
│   └── ic_launcher.png (72x72)
├── mipmap-mdpi/
│   └── ic_launcher.png (48x48)
├── mipmap-xhdpi/
│   └── ic_launcher.png (96x96)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (144x144)
├── mipmap-xxxhdpi/
│   └── ic_launcher.png (192x192)
└── drawable/
    └── splash.png (your splash screen)
```

**Tool consigliato:** [Icon Kitchen](https://icon.kitchen/) per generare tutte le dimensioni.

---

## 🔔 Push Notifications Setup

### 1. Firebase Console

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto FitFlows
3. **Project Settings** → **General**
4. Scorri a "Your apps" → **Add app** → **Android**
5. Package name: `com.fitflow.app`
6. Scarica `google-services.json`

### 2. Aggiungi il file

Copia `google-services.json` in:
```
android/app/google-services.json
```

### 3. Verifica

Il file [android/app/build.gradle](android/app/build.gradle) dovrebbe già avere:
```gradle
apply plugin: 'com.google.gms.google-services'
```

---

## 🧪 Testing

### Su Emulatore

```bash
# Avvia emulatore da Android Studio, poi:
npm run android:run
```

### Su Dispositivo Fisico

1. Abilita **Opzioni sviluppatore** sul telefono
2. Abilita **Debug USB**
3. Collega via USB
4. ```bash
   npm run android:run
   ```

### Live Reload (Sviluppo)

Modifica [capacitor.config.ts](capacitor.config.ts):

```typescript
server: {
  url: 'http://TUO_IP_LOCALE:5173',
  cleartext: true
}
```

Poi:
```bash
npm run dev  # Terminal 1
npm run android:run  # Terminal 2
```

---

## � Screenshot per Play Store

### Requisiti Google Play

- **Minimo**: 2 screenshot
- **Massimo**: 8 screenshot
- **Formato**: PNG o JPEG
- **Dimensione max**: 8 MB per file
- **Proporzioni**: 16:9 o 9:16
- **Dimensioni lati**: tra 320 px e 3840 px

### Come Creare Screenshot da PC

#### Opzione 1: Chrome DevTools (Consigliato)

1. **Avvia l'app in dev**:
   ```bash
   npm run dev
   ```

2. **Apri Chrome** e vai su `http://localhost:5173`

3. **Apri DevTools**: `F12` o `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Opt+I` (Mac)

4. **Attiva modalità dispositivo**: Click sull'icona telefono/tablet in alto o premi `Ctrl+Shift+M`

5. **Seleziona dispositivo**: Nel menu dropdown scegli:
   - **Pixel 5** (1080 x 2340) - Raccomandato per 9:16
   - **Galaxy S20** (1440 x 3200)
   - **iPhone 12 Pro** (1170 x 2532)

6. **Naviga nell'app** e posizionati sulla schermata da catturare

7. **Cattura screenshot**:
   - Click sui 3 puntini in alto a destra nel DevTools
   - **More tools** → **Capture screenshot** (cattura solo viewport)
   - Oppure **Capture full size screenshot** (intera pagina con scroll)

8. **Screenshot consigliati da fare**:
   - Dashboard admin con statistiche
   - Area clienti con lista
   - Dettaglio cliente con schede
   - Chat professionale
   - Landing page AI generator
   - Check periodici con foto
   - Scheda allenamento
   - Analytics revenue

#### Opzione 2: Dimensioni Custom

Se vuoi dimensioni specifiche:

1. In DevTools, click su **Edit** nel menu dispositivi
2. **Add custom device**:
   - **Device name**: Play Store Screenshot
   - **Width**: 1080
   - **Height**: 1920
   - **Device pixel ratio**: 2

#### Opzione 3: Firefox Developer Tools

1. Apri Firefox e vai su `http://localhost:5173`
2. `F12` → Click icona **Responsive Design Mode** (Ctrl+Shift+M)
3. Seleziona dimensioni: 1080 x 1920
4. Click sull'icona **fotocamera** per screenshot

#### Opzione 4: Online Tools

- [Responsive Screenshot Generator](https://websiteresponsive.com/)
- [Screely](https://screely.com/) - Aggiunge mockup dispositivo

### Post-Processing (Opzionale)

Usa strumenti per migliorare gli screenshot:

- **Mockup dispositivo**: [Mockuphone](https://mockuphone.com/)
- **Add frame**: [Device Frames](https://deviceframes.com/)
- **Resize/Optimize**: [TinyPNG](https://tinypng.com/)

### Verifica Finale

Prima di caricare, controlla:
- ✅ Proporzioni 9:16 (es: 1080x1920)
- ✅ Dimensione file < 8 MB
- ✅ Formato PNG o JPEG
- ✅ Nessun dato sensibile visibile
- ✅ UI pulita e professionale

---

## 📋 Checklist Pre-Pubblicazione

- [ ] Cambiare `appId` con package univoco
- [ ] Aggiungere `google-services.json`
- [ ] Creare icone app (tutte le dimensioni)
- [ ] Creare splash screen
- [ ] Testare su dispositivo reale
- [ ] Creare keystore e conservarlo al sicuro
- [ ] Buildare AAB (non APK) per Play Store
- [ ] **Creare 2-8 screenshot** (1080x1920 o 1440x2560)
- [ ] Scrivere descrizione app
- [ ] Creare privacy policy (obbligatoria)
- [ ] Creare feature graphic (1024x500 px)

---

## 🔧 Troubleshooting

### "SDK location not found"

Crea file `android/local.properties`:
```
sdk.dir=/Users/TUOUSERNAME/Library/Android/sdk
```

### Errore Gradle

```bash
cd android
./gradlew clean
cd ..
npm run android:sync
```

### App crash al boot

Controlla i log:
```bash
adb logcat | grep -i fitflows
```

---

## 📚 Risorse Utili

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Publishing Guide](https://capacitorjs.com/docs/android/deploying-to-google-play)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
