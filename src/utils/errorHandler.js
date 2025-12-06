/**
 * Error Handler - Gestione centralizzata degli errori
 */

import React from 'react';

// Tipi di errore
export const ErrorTypes = {
  AUTH: 'auth',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  NETWORK: 'network',
  NOT_FOUND: 'not_found',
  UNKNOWN: 'unknown'
};

// Messaggi user-friendly
const errorMessages = {
  [ErrorTypes.AUTH]: 'Errore di autenticazione. Effettua nuovamente il login.',
  [ErrorTypes.PERMISSION]: 'Non hai i permessi necessari per questa operazione.',
  [ErrorTypes.VALIDATION]: 'Dati inseriti non validi. Controlla i campi.',
  [ErrorTypes.NETWORK]: 'Errore di connessione. Controlla la tua rete.',
  [ErrorTypes.NOT_FOUND]: 'Risorsa non trovata.',
  [ErrorTypes.UNKNOWN]: 'Si è verificato un errore imprevisto.'
};

/**
 * Determina il tipo di errore da un errore Firebase
 */
export const getErrorType = (error) => {
  const code = error?.code || '';
  
  if (code.includes('auth')) return ErrorTypes.AUTH;
  if (code.includes('permission') || code === 'permission-denied') return ErrorTypes.PERMISSION;
  if (code.includes('not-found')) return ErrorTypes.NOT_FOUND;
  if (code.includes('network') || code.includes('unavailable')) return ErrorTypes.NETWORK;
  if (code.includes('invalid') || code.includes('required')) return ErrorTypes.VALIDATION;
  
  return ErrorTypes.UNKNOWN;
};

/**
 * Ottiene un messaggio user-friendly per un errore
 */
export const getUserMessage = (error) => {
  const type = getErrorType(error);
  return errorMessages[type] || errorMessages[ErrorTypes.UNKNOWN];
};

/**
 * Handler principale degli errori
 */
export const handleError = (error, context = '') => {
  const errorType = getErrorType(error);
  const userMessage = getUserMessage(error);
  
  // Log per sviluppatori
  console.error(`[${errorType}] ${context}:`, {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  
  // Potresti anche inviare a un servizio di error tracking qui
  // trackError(error, context);
  
  return {
    type: errorType,
    message: userMessage,
    originalError: error
  };
};

/**
 * Wrapper per funzioni async con error handling
 */
export const withErrorHandler = (fn, context = '') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error, context);
    }
  };
};

/**
 * Validazione dati
 */
export const validateRequired = (data, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw {
      code: 'validation/required-fields',
      message: `Campi obbligatori mancanti: ${missing.join(', ')}`
    };
  }
};

/**
 * Validazione email
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    throw {
      code: 'validation/invalid-email',
      message: 'Formato email non valido'
    };
  }
};

/**
 * Hook React per gestire errori nello stato
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);
  
  const handleError = React.useCallback((err, context = '') => {
    const handledError = handleError(err, context);
    setError(handledError);
  }, []);
  
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  return { error, handleError, clearError };
};
