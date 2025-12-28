/**
 * Error Tracking Utilities - Sentry Integration
 * 
 * Centralizza la gestione degli errori e il tracking con Sentry.
 * Usare queste funzioni invece di console.error per errori critici.
 */
import * as Sentry from '@sentry/react';

/**
 * Cattura e traccia un errore con context aggiuntivo
 * @param {Error} error - L'errore da tracciare
 * @param {Object} context - Context aggiuntivo (es. { userId, action, data })
 */
export function captureError(error, context = {}) {
  // Log locale per debugging
  console.error('[Error]', error.message, context);
  
  // Invia a Sentry in produzione
  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      // Aggiungi context
      if (context.userId) scope.setUser({ id: context.userId });
      if (context.tags) scope.setTags(context.tags);
      scope.setExtras(context);
      
      Sentry.captureException(error);
    });
  }
}

/**
 * Cattura un messaggio (non errore) per debugging
 * @param {string} message - Il messaggio da tracciare
 * @param {string} level - Livello: 'info', 'warning', 'error'
 * @param {Object} context - Context aggiuntivo
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      scope.setExtras(context);
      Sentry.captureMessage(message);
    });
  }
}

/**
 * Imposta l'utente corrente per il tracking
 * Chiamare al login e al logout
 * @param {Object|null} user - Dati utente o null per logout
 */
export function setUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user.uid,
    email: user.email,
    // Non includere dati sensibili come nome completo
  });
}

/**
 * Aggiunge un breadcrumb per tracciare azioni utente
 * Utile per capire cosa ha fatto l'utente prima di un errore
 * @param {string} message - Descrizione dell'azione
 * @param {string} category - Categoria (es. 'navigation', 'ui.click', 'form')
 * @param {Object} data - Dati aggiuntivi
 */
export function addBreadcrumb(message, category = 'user', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Wrapper per operazioni async con error tracking automatico
 * @param {Function} asyncFn - Funzione async da eseguire
 * @param {string} operationName - Nome dell'operazione per il tracking
 * @returns {Promise} - Risultato della funzione o throw dell'errore
 */
export async function withErrorTracking(asyncFn, operationName) {
  try {
    return await asyncFn();
  } catch (error) {
    captureError(error, { 
      operation: operationName,
      timestamp: new Date().toISOString() 
    });
    throw error; // Re-throw per gestione locale
  }
}

/**
 * HOC per wrappare componenti con Sentry ErrorBoundary
 * @param {React.Component} Component - Componente da wrappare
 * @param {Object} options - Opzioni per il fallback
 */
export function withSentryErrorBoundary(Component, options = {}) {
  return Sentry.withErrorBoundary(Component, {
    fallback: options.fallback || <ErrorFallback />,
    showDialog: options.showDialog || false,
  });
}

/**
 * Componente fallback di default per errori
 */
function ErrorFallback() {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-red-500/10 rounded-xl border border-red-500/30">
      <p className="text-red-400 text-center mb-4">
        Si è verificato un errore. Riprova o ricarica la pagina.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        Ricarica Pagina
      </button>
    </div>
  );
}

export default {
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  withErrorTracking,
  withSentryErrorBoundary,
};
