/**
 * Logger Utility - Logging intelligente per sviluppo e produzione
 * In produzione disabilita console.log ma mantiene errori per monitoring
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

class Logger {
  constructor() {
    this.isDev = isDevelopment;
  }

  /**
   * Log per sviluppo - disabilitato in produzione
   */
  log(...args) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  /**
   * Info - disabilitato in produzione
   */
  info(...args) {
    if (this.isDev) {
      console.info(...args);
    }
  }

  /**
   * Warning - sempre attivo
   */
  warn(...args) {
    console.warn(...args);
  }

  /**
   * Error - sempre attivo, può integrare error tracking
   */
  error(...args) {
    console.error(...args);
    
    // TODO: Integrare Sentry o altro error tracking in produzione
    if (isProduction) {
      // window.Sentry?.captureException(args[0]);
    }
  }

  /**
   * Debug - solo in sviluppo con dettagli extra
   */
  debug(label, data) {
    if (this.isDev) {
      console.group(`🔍 ${label}`);
      console.log(data);
      console.trace();
      console.groupEnd();
    }
  }

  /**
   * Success - operazioni completate
   */
  success(message, data) {
    if (this.isDev) {
      console.log(`✅ ${message}`, data || '');
    }
  }

  /**
   * Performance measurement
   */
  time(label) {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }

  /**
   * Table output
   */
  table(data) {
    if (this.isDev) {
      console.table(data);
    }
  }
}

// Export singleton
export const logger = new Logger();

// Shorthand exports
export const log = (...args) => logger.log(...args);
export const info = (...args) => logger.info(...args);
export const warn = (...args) => logger.warn(...args);
export const error = (...args) => logger.error(...args);
export const debug = (label, data) => logger.debug(label, data);
export const success = (message, data) => logger.success(message, data);

export default logger;
