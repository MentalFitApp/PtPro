import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((error, context = '') => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    let userMessage = 'Si è verificato un errore imprevisto. Riprova più tardi.';

    // Error messages user-friendly
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          userMessage = 'Utente non trovato. Verifica le credenziali.';
          break;
        case 'auth/wrong-password':
          userMessage = 'Password errata. Riprova.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Problema di connessione. Controlla la tua connessione internet.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Troppi tentativi. Riprova tra qualche minuto.';
          break;
        case 'permission-denied':
          userMessage = 'Non hai i permessi per eseguire questa azione.';
          break;
        case 'unavailable':
          userMessage = 'Servizio temporaneamente non disponibile. Riprova tra poco.';
          break;
        default:
          userMessage = error.message || userMessage;
      }
    } else if (error.message) {
      // Generic error messages
      if (error.message.includes('network')) {
        userMessage = 'Problema di connessione. Verifica la tua connessione internet.';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Operazione scaduta. Riprova.';
      } else if (error.message.includes('quota')) {
        userMessage = 'Limite superato. Riprova più tardi.';
      }
    }

    setError({
      message: userMessage,
      originalError: error,
      context,
      timestamp: Date.now()
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async (operation, maxRetries = 3, delay = 1000) => {
    setIsRetrying(true);
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        clearError();
        const result = await operation();
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Tentativo ${attempt}/${maxRetries} fallito:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        }
      }
    }

    setIsRetrying(false);
    handleError(lastError, 'retry operation');
    throw lastError;
  }, [handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry
  };
};