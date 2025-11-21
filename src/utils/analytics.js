import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Eventi da tracciare
export const ANALYTICS_EVENTS = {
  // Navigation
  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',

  // User actions
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  SEARCH: 'search',

  // Features
  VIDEO_CALL_START: 'video_call_start',
  VIDEO_CALL_END: 'video_call_end',
  COMMUNITY_POST: 'community_post',
  COMMUNITY_LIKE: 'community_like',
  SETTINGS_CHANGE: 'settings_change',

  // Errors
  ERROR_OCCURRED: 'error_occurred',

  // Performance
  LOAD_TIME: 'load_time',
  API_CALL: 'api_call'
};

// Hook per analytics
export const useAnalytics = () => {
  const trackEvent = async (eventName, properties = {}) => {
    try {
      // Solo in produzione
      if (process.env.NODE_ENV !== 'production') {
        console.log('Analytics event:', eventName, properties);
        return;
      }

      const eventData = {
        event: eventName,
        properties: {
          ...properties,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          sessionId: getSessionId()
        }
      };

      await addDoc(collection(db, 'analytics'), eventData);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  const trackPageView = (pageName) => {
    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      page: pageName,
      referrer: document.referrer
    });
  };

  const trackUserAction = (action, details = {}) => {
    trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
      action,
      ...details
    });
  };

  const trackError = (error, context) => {
    trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error: error.message,
      stack: error.stack,
      context
    });
  };

  const trackPerformance = (metric, value, details = {}) => {
    trackEvent(ANALYTICS_EVENTS.LOAD_TIME, {
      metric,
      value,
      ...details
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackError,
    trackPerformance
  };
};

// Utility per session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Performance monitoring
export const initPerformanceTracking = (analytics) => {
  // Track page load time
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    analytics.trackPerformance('page_load', loadTime, {
      page: window.location.pathname
    });
  });

  // Track navigation timing
  if ('navigation' in performance) {
    window.addEventListener('load', () => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        analytics.trackPerformance('navigation_timing', nav.loadEventEnd - nav.fetchStart, {
          page: window.location.pathname
        });
      }
    });
  }

  // Track resource loading
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // Solo risorse lente
          analytics.trackPerformance('slow_resource', entry.duration, {
            resource: entry.name,
            type: entry.initiatorType
          });
        }
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  }
};