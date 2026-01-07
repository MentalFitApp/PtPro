import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import './index.css';
import './styles/animations.css';
import { initializeCapacitor } from './utils/capacitor.js';

// Inizializza Sentry per error tracking (solo in produzione)
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://9ae7649cfa3cff61a8edc7bb18bf439b@o4510609943035904.ingest.de.sentry.io/4510609944739920",
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mostra tutto il testo (non mascherare)
        maskAllText: false,
        // Mostra tutte le immagini
        blockAllMedia: false,
        // Non mascherare gli input
        maskAllInputs: false,
      })
    ],
    // Tracing - Cattura 100% delle transazioni
    tracesSampleRate: 1.0,
    // URLs per distributed tracing
    tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% delle sessioni
    replaysOnErrorSampleRate: 1.0, // 100% delle sessioni con errori
    
    // Ignora errori comuni non critici
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /Loading chunk \d+ failed/,
      'Connection to Indexed Database server lost', // IndexedDB browser issue
    ],
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