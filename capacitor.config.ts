import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitflows.app',
  appName: 'FitFlows',
  webDir: 'dist',
  server: {
    // App carica da Vercel - aggiornamenti istantanei senza nuovo build!
    url: 'https://biondo-pt-pro.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e', // Colore Nebula theme
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#6366f1' // Indigo accent
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false // Metti true per debug
  }
};

export default config;
