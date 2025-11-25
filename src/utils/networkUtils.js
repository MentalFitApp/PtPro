/**
 * Network Utilities - Gestione errori di rete e retry logic
 */

/**
 * Retry una funzione async con backoff esponenziale
 * @param {Function} fn - Funzione async da eseguire
 * @param {number} maxRetries - Numero massimo di tentativi
 * @param {number} delay - Delay iniziale in ms
 * @returns {Promise} Risultato della funzione
 */
export async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Non fare retry su errori non di rete
      if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        throw error;
      }
      
      // Se è l'ultimo tentativo, lancia l'errore
      if (i === maxRetries - 1) {
        break;
      }
      
      // Attendi con backoff esponenziale
      const waitTime = delay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} dopo ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

/**
 * Verifica se l'utente è online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Wrapper per operazioni Firestore con gestione errori
 * @param {Function} operation - Operazione Firestore da eseguire
 * @param {Object} options - Opzioni (retry, onError, onSuccess)
 * @returns {Promise}
 */
export async function withNetworkHandling(operation, options = {}) {
  const {
    retry = true,
    maxRetries = 3,
    onError,
    onSuccess,
    errorMessage = 'Errore di rete. Riprova.',
  } = options;

  // Verifica connessione
  if (!isOnline()) {
    const error = new Error('Nessuna connessione internet');
    error.code = 'network-offline';
    if (onError) onError(error);
    throw error;
  }

  try {
    const result = retry 
      ? await retryWithBackoff(operation, maxRetries)
      : await operation();
    
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    console.error('Network operation failed:', error);
    
    // Gestione errori specifici
    const errorInfo = {
      message: getErrorMessage(error, errorMessage),
      code: error.code,
      isNetworkError: isNetworkError(error),
    };
    
    if (onError) onError(errorInfo);
    throw error;
  }
}

/**
 * Determina se un errore è di rete
 * @param {Error} error
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return (
    error.code === 'unavailable' ||
    error.code === 'network-offline' ||
    error.message?.includes('network') ||
    error.message?.includes('timeout') ||
    error.message?.includes('Failed to fetch')
  );
}

/**
 * Ottiene un messaggio di errore user-friendly
 * @param {Error} error
 * @param {string} defaultMessage
 * @returns {string}
 */
export function getErrorMessage(error, defaultMessage = 'Si è verificato un errore') {
  const errorMessages = {
    'permission-denied': 'Non hai i permessi per questa operazione',
    'unauthenticated': 'Devi effettuare il login',
    'not-found': 'Risorsa non trovata',
    'already-exists': 'Questa risorsa esiste già',
    'resource-exhausted': 'Troppi tentativi. Riprova tra qualche minuto',
    'unavailable': 'Servizio temporaneamente non disponibile',
    'network-offline': 'Nessuna connessione internet',
    'deadline-exceeded': 'Timeout della richiesta',
  };

  return errorMessages[error.code] || error.message || defaultMessage;
}

/**
 * Wrapper per operazioni Firebase con timeout
 * @param {Promise} promise
 * @param {number} timeout - Timeout in ms
 * @returns {Promise}
 */
export function withTimeout(promise, timeout = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout della richiesta')), timeout)
    )
  ]);
}

/**
 * Hook per monitorare lo stato della connessione
 */
export function useNetworkStatus(onOnline, onOffline) {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    console.log('Connessione ripristinata');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('Connessione persa');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export default {
  retryWithBackoff,
  withNetworkHandling,
  isOnline,
  isNetworkError,
  getErrorMessage,
  withTimeout,
  useNetworkStatus,
};
