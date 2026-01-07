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

## 📋 Checklist Pre-Pubblicazione

- [ ] Cambiare `appId` con package univoco
- [ ] Aggiungere `google-services.json`
- [ ] Creare icone app (tutte le dimensioni)
- [ ] Creare splash screen
- [ ] Testare su dispositivo reale
- [ ] Creare keystore e conservarlo al sicuro
- [ ] Buildare AAB (non APK) per Play Store
- [ ] Preparare screenshot (min 2) per listing
- [ ] Scrivere descrizione app
- [ ] Creare privacy policy (obbligatoria)

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
