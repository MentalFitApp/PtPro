import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Registra il service worker per le notifiche push
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/PtPro/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registrato:', registration);
    })
    .catch((error) => {
      console.error('Errore registrazione Service Worker:', error);
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);