/**
 * Analytics Service - Firebase Analytics Integration
 * 
 * Traccia eventi utente e metriche per insights di prodotto.
 * Usa Firebase Analytics (gratuito e già integrato).
 */
import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { app } from '../firebase';

// Inizializza Analytics solo in produzione
let analytics = null;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn('Analytics non disponibile:', e.message);
  }
}

/**
 * Traccia un evento custom
 * @param {string} eventName - Nome evento (es. 'scheda_created', 'client_added')
 * @param {Object} params - Parametri aggiuntivi
 */
export function trackEvent(eventName, params = {}) {
  if (!analytics) return;
  
  try {
    logEvent(analytics, eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // Silently fail in produzione
  }
}

/**
 * Imposta l'utente per il tracking
 * @param {string} userId - ID utente
 * @param {Object} properties - Proprietà utente (role, tenantId, etc.)
 */
export function setAnalyticsUser(userId, properties = {}) {
  if (!analytics) return;
  
  try {
    setUserId(analytics, userId);
    setUserProperties(analytics, {
      user_role: properties.role || 'unknown',
      tenant_id: properties.tenantId || 'unknown',
    });
  } catch (e) {
    // Silently fail
  }
}

/**
 * Traccia navigazione pagina
 * @param {string} pagePath - Path della pagina
 * @param {string} pageTitle - Titolo pagina
 */
export function trackPageView(pagePath, pageTitle) {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

// Eventi predefiniti per funzionalità chiave
export const AnalyticsEvents = {
  // Client
  CLIENT_CREATED: 'client_created',
  CLIENT_UPDATED: 'client_updated',
  CLIENT_ARCHIVED: 'client_archived',
  
  // Schede
  SCHEDA_CREATED: 'scheda_created',
  SCHEDA_GENERATED_AI: 'scheda_generated_ai',
  SCHEDA_SENT: 'scheda_sent',
  
  // Check
  CHECK_SUBMITTED: 'check_submitted',
  CHECK_VIEWED: 'check_viewed',
  
  // Pagamenti
  PAYMENT_ADDED: 'payment_added',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  
  // Chat
  MESSAGE_SENT: 'message_sent',
  CHAT_STARTED: 'chat_started',
  
  // Landing Pages
  LANDING_CREATED: 'landing_created',
  LANDING_PUBLISHED: 'landing_published',
  LEAD_CAPTURED: 'lead_captured',
  
  // Engagement
  FEATURE_USED: 'feature_used',
  HELP_VIEWED: 'help_viewed',
  ERROR_SHOWN: 'error_shown',
};

/**
 * Traccia utilizzo feature
 * @param {string} featureName - Nome della feature
 * @param {Object} details - Dettagli aggiuntivi
 */
export function trackFeatureUsage(featureName, details = {}) {
  trackEvent(AnalyticsEvents.FEATURE_USED, {
    feature_name: featureName,
    ...details,
  });
}

/**
 * Traccia errore mostrato all'utente
 * @param {string} errorType - Tipo errore
 * @param {string} errorMessage - Messaggio mostrato
 */
export function trackError(errorType, errorMessage) {
  trackEvent(AnalyticsEvents.ERROR_SHOWN, {
    error_type: errorType,
    error_message: errorMessage,
  });
}

export default {
  trackEvent,
  trackPageView,
  setAnalyticsUser,
  trackFeatureUsage,
  trackError,
  AnalyticsEvents,
};
