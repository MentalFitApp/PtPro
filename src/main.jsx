import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import App from './App.jsx';
import './index.css';
import './styles/animations.css';
import { initializeCapacitor } from './utils/capacitor.js';

// Inizializza Sentry per error tracking (solo in produzione)
if (import.meta.env.PROD) {
  const isNative = Capacitor.isNativePlatform();
  
  Sentry.init({
    dsn: "https://9ae7649cfa3cff61a8edc7bb18bf439b@o4510609943035904.ingest.de.sentry.io/4510609944739920",
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      // Disabilita Replay su piattaforme native per evitare errori di lifecycle
      ...(!isNative ? [Sentry.replayIntegration({
        // Mostra tutto il testo (non mascherare)
        maskAllText: false,
        // Mostra tutte le immagini
        blockAllMedia: false,
        // Non mascherare gli input
        maskAllInputs: false,
      })] : [])
    ],
    // Tracing - Cattura 100% delle transazioni su web, ridotto su native
    tracesSampleRate: isNative ? 0.3 : 1.0,
    // URLs per distributed tracing
    tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app/],
    // Session Replay (solo per web)
    replaysSessionSampleRate: isNative ? 0 : 0.1, // 10% delle sessioni su web, 0% su native
    replaysOnErrorSampleRate: isNative ? 0 : 1.0, // 100% delle sessioni con errori su web, 0% su native
    
    // Ignora errori comuni non critici
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /Loading chunk \d+ failed/,
      'Connection to Indexed Database server lost', // IndexedDB browser issue
      'Java object is gone', // Android lifecycle issue
      'enableButtonsClickedMetaDataLogging', // Android native tracking error
      /Error invoking.*Java object is gone/, // Pattern per errori Java lifecycle
    ],
    
    // Migliora la gestione degli errori su piattaforme native
    beforeSend(event, hint) {
      // Filtra errori di lifecycle Android
      const error = hint.originalException;
      if (error && typeof error === 'string' && error.includes('Java object is gone')) {
        return null; // Non inviare questo errore
      }
      
      // Filtra errori di capacitor quando l'app è in background
      if (isNative && event.exception?.values?.[0]?.value?.includes('Java object')) {
        console.warn('Sentry: Ignorato errore di lifecycle Android:', event);
        return null;
      }
      
      return event;
    },
  });
}

// Registra il service worker per le notifiche push (solo in produzione e non su native)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registrato:', registration);
    })
    .catch((error) => {
      console.error('Errore registrazione Service Worker:', error);
    });
}

// Inizializza Capacitor per piattaforme native (Android/iOS)
initializeCapacitor();

// Global error handler per gestire errori non catturati (specialmente su Android)
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Ignora errori di lifecycle Android che non sono critici
    const message = args.join(' ');
    if (message.includes('Java object is gone') || 
        message.includes('enableButtonsClickedMetaDataLogging')) {
      console.warn('[Lifecycle Warning]', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Gestisci errori non catturati
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && 
        event.error.message.includes('Java object is gone')) {
      event.preventDefault();
      console.warn('[Lifecycle Warning] Ignorato errore Android:', event.error.message);
      return false;
    }
  });

  // Gestisci promise rejections non catturate
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && typeof event.reason === 'string' && 
        event.reason.includes('Java object is gone')) {
      event.preventDefault();
      console.warn('[Lifecycle Warning] Ignorata promise rejection Android:', event.reason);
      return false;
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);