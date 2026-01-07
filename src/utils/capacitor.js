/**
 * Capacitor Plugin Initialization
 * Questo file inizializza tutti i plugin Capacitor per l'app nativa
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications } from '@capacitor/push-notifications';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Verifica se l'app sta girando su piattaforma nativa
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Inizializza tutti i plugin Capacitor
 * Chiamare questa funzione all'avvio dell'app
 */
export async function initializeCapacitor() {
  if (!isNativePlatform()) {
    console.log('Running in web mode - Capacitor plugins disabled');
    return;
  }

  console.log(`Running on ${getPlatform()} platform`);

  try {
    // Inizializza Status Bar
    await initializeStatusBar();
    
    // Inizializza Push Notifications
    await initializePushNotifications();
    
    // Inizializza Keyboard listener
    initializeKeyboard();
    
    // Inizializza App lifecycle listeners
    initializeAppListeners();
    
    // Nascondi Splash Screen dopo inizializzazione
    await SplashScreen.hide();
    
    console.log('Capacitor initialized successfully');
  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
}

/**
 * Configura la Status Bar per tema scuro (Nebula theme)
 */
async function initializeStatusBar() {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
  } catch (error) {
    console.error('StatusBar error:', error);
  }
}

/**
 * Inizializza Push Notifications
 */
async function initializePushNotifications() {
  try {
    // Richiedi permesso
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      // Registra per ricevere push notifications
      await PushNotifications.register();
    }

    // Listener per token FCM
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      // Salva il token per inviarlo al backend
      savePushToken(token.value);
    });

    // Listener per errori di registrazione
    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err.error);
    });

    // Listener per notifiche ricevute (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      // Gestisci la notifica in foreground
      handleForegroundNotification(notification);
    });

    // Listener per tap su notifica
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
      // Naviga alla schermata appropriata
      handleNotificationAction(notification);
    });

  } catch (error) {
    console.error('PushNotifications error:', error);
  }
}

/**
 * Salva il token FCM (da inviare al backend)
 */
function savePushToken(token) {
  // Salva in localStorage per ora, poi inviare a Firebase
  localStorage.setItem('fcm_token_native', token);
  
  // TODO: Inviare al backend quando l'utente è autenticato
  // import { updateUserPushToken } from './firebase';
  // updateUserPushToken(userId, token);
}

/**
 * Gestisce notifiche ricevute in foreground
 */
function handleForegroundNotification(notification) {
  // Mostra un toast o badge nell'app
  const event = new CustomEvent('capacitor-notification', {
    detail: notification
  });
  window.dispatchEvent(event);
}

/**
 * Gestisce il tap su una notifica
 */
function handleNotificationAction(notification) {
  const data = notification.notification?.data;
  
  if (data?.type === 'chat') {
    window.location.href = `/chat/${data.chatId}`;
  } else if (data?.type === 'workout') {
    window.location.href = '/scheda-allenamento';
  } else if (data?.type === 'nutrition') {
    window.location.href = '/scheda-alimentazione';
  }
}

/**
 * Inizializza listener per la tastiera
 */
function initializeKeyboard() {
  Keyboard.addListener('keyboardWillShow', (info) => {
    document.body.classList.add('keyboard-open');
    document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
  });

  Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-open');
    document.documentElement.style.setProperty('--keyboard-height', '0px');
  });
}

/**
 * Inizializza listener per il ciclo di vita dell'app
 */
function initializeAppListeners() {
  // Gestisci il pulsante back di Android
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // Mostra dialog di conferma uscita
      const confirmExit = window.confirm('Vuoi uscire dall\'app?');
      if (confirmExit) {
        App.exitApp();
      }
    }
  });

  // App in background
  App.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active?', isActive);
    
    if (isActive) {
      // App tornata in foreground - refresh dati se necessario
      window.dispatchEvent(new CustomEvent('app-resumed'));
    } else {
      // App andata in background - salva stato se necessario
      window.dispatchEvent(new CustomEvent('app-paused'));
    }
  });

  // Deep links
  App.addListener('appUrlOpen', (event) => {
    console.log('App opened with URL:', event.url);
    // Gestisci deep links (es. fitflows://workout/123)
    handleDeepLink(event.url);
  });
}

/**
 * Gestisce deep links
 */
function handleDeepLink(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Naviga al path appropriato
    if (path) {
      window.location.href = path;
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
}

/**
 * Utility per mostrare/nascondere splash screen
 */
export const showSplash = () => SplashScreen.show();
export const hideSplash = () => SplashScreen.hide();

/**
 * Utility per haptic feedback
 */
export async function vibrate(type = 'medium') {
  if (!isNativePlatform()) return;
  
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    
    const styles = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    };
    
    await Haptics.impact({ style: styles[type] || ImpactStyle.Medium });
  } catch (error) {
    console.error('Haptics error:', error);
  }
}

export default {
  initializeCapacitor,
  isNativePlatform,
  getPlatform,
  vibrate,
  showSplash,
  hideSplash
};
