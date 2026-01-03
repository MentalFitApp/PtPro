/**
 * Security Utilities per Cloud Functions
 * - Rate limiting (in-memory + Firestore fallback)
 * - Input validation
 * - Request sanitization
 * 
 * @updated 03/01/2026 - Aggiunto rate limiting persistente con Firestore
 */

const admin = require('firebase-admin');

// ============ RATE LIMITING ============

/**
 * Cache in-memory per rate limiting (fast path)
 * Usata per la maggior parte delle richieste.
 * Firestore viene usato come fallback per funzioni critiche.
 */
const rateLimitCache = new Map();

/**
 * Funzioni che richiedono rate limiting persistente (Firestore)
 * Queste sono più costose ma sopravvivono ai cold starts
 */
const PERSISTENT_RATE_LIMIT_FUNCTIONS = [
  'completeInvitation',      // Registrazione utenti
  'exchangeOAuthToken',      // OAuth tokens
  'completeMagicLinkSetup',  // Setup account
  'generateMagicLink',       // Magic link generation
];

/**
 * Configurazione rate limits per funzione
 */
const RATE_LIMITS = {
  default: { maxRequests: 100, windowMs: 60000 }, // 100 req/min
  createDailyRoom: { maxRequests: 10, windowMs: 60000 }, // 10 stanze/min per utente
  getUidByEmail: { maxRequests: 30, windowMs: 60000 }, // 30 lookup/min
  manychatProxy: { maxRequests: 50, windowMs: 60000 }, // 50 req/min
  exchangeOAuthToken: { maxRequests: 5, windowMs: 60000 }, // 5 oauth/min
  triggerStatsAggregation: { maxRequests: 5, windowMs: 300000 }, // 5 ogni 5 min
  instagramProxy: { maxRequests: 60, windowMs: 60000 }, // 60 req/min
  manualSyncInstagram: { maxRequests: 5, windowMs: 60000 }, // 5 sync/min
  manualSyncManyChat: { maxRequests: 5, windowMs: 60000 }, // 5 sync/min
  generateMagicLink: { maxRequests: 10, windowMs: 60000 }, // 10 link/min
  validateMagicLink: { maxRequests: 20, windowMs: 60000 }, // 20 validazioni/min (utenti possono sbagliare)
  completeMagicLinkSetup: { maxRequests: 5, windowMs: 60000 }, // 5 setup/min
  sendWhatsAppMessage: { maxRequests: 20, windowMs: 60000 }, // 20 msg/min
  generateWhatsAppLink: { maxRequests: 30, windowMs: 60000 }, // 30 link/min
  // Sistema Inviti
  createClientInvitation: { maxRequests: 20, windowMs: 60000 }, // 20 inviti/min
  validateInvitation: { maxRequests: 30, windowMs: 60000 }, // 30 validazioni/min
  completeInvitation: { maxRequests: 10, windowMs: 60000 }, // 10 registrazioni/min
  listInvitations: { maxRequests: 30, windowMs: 60000 }, // 30 liste/min
  cancelInvitation: { maxRequests: 20, windowMs: 60000 }, // 20 cancellazioni/min
  resendInvitation: { maxRequests: 15, windowMs: 60000 }, // 15 reinvii/min
};

/**
 * Verifica rate limit per un utente/IP (in-memory, fast path)
 * @param {string} identifier - UID utente o IP
 * @param {string} functionName - Nome della funzione
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date }
 */
function checkRateLimit(identifier, functionName) {
  const config = RATE_LIMITS[functionName] || RATE_LIMITS.default;
  const key = `${functionName}:${identifier}`;
  const now = Date.now();
  
  let record = rateLimitCache.get(key);
  
  // Se non esiste o è scaduto, crea nuovo record
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + config.windowMs
    };
  }
  
  record.count++;
  rateLimitCache.set(key, record);
  
  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);
  
  return {
    allowed,
    remaining,
    resetAt: new Date(record.resetAt),
    limit: config.maxRequests
  };
}

/**
 * Verifica rate limit usando Firestore (persistent, slow path)
 * Usato per funzioni critiche che devono sopravvivere ai cold starts
 * @param {string} identifier - UID utente o IP
 * @param {string} functionName - Nome della funzione
 * @returns {Promise<Object>} { allowed: boolean, remaining: number }
 */
async function checkRateLimitPersistent(identifier, functionName) {
  const config = RATE_LIMITS[functionName] || RATE_LIMITS.default;
  const key = `${functionName}_${identifier}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = Date.now();
  const docRef = admin.firestore().collection('_rate_limits').doc(key);
  
  try {
    const result = await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      let data = doc.exists ? doc.data() : null;
      
      // Se non esiste o è scaduto, resetta
      if (!data || now > data.resetAt) {
        data = {
          count: 1,
          resetAt: now + config.windowMs,
          functionName,
          identifier,
          updatedAt: now
        };
        transaction.set(docRef, data);
        return { allowed: true, remaining: config.maxRequests - 1 };
      }
      
      // Incrementa contatore
      data.count++;
      data.updatedAt = now;
      transaction.update(docRef, data);
      
      const allowed = data.count <= config.maxRequests;
      return { 
        allowed, 
        remaining: Math.max(0, config.maxRequests - data.count),
        resetAt: new Date(data.resetAt)
      };
    });
    
    return result;
  } catch (error) {
    console.error('❌ Rate limit Firestore error, fallback to in-memory:', error.message);
    // Fallback to in-memory se Firestore fallisce
    return checkRateLimit(identifier, functionName);
  }
}

/**
 * Middleware per rate limiting
 * Usa automaticamente Firestore per funzioni critiche, altrimenti in-memory
 */
async function enforceRateLimit(request, functionName) {
  // Identifica l'utente (preferisci UID, fallback a IP)
  const identifier = request.auth?.uid || 
                    request.rawRequest?.ip || 
                    request.rawRequest?.headers?.['x-forwarded-for'] ||
                    'anonymous';
  
  // Usa rate limiting persistente per funzioni critiche
  const usePersistent = PERSISTENT_RATE_LIMIT_FUNCTIONS.includes(functionName);
  
  const result = usePersistent 
    ? await checkRateLimitPersistent(identifier, functionName)
    : checkRateLimit(identifier, functionName);
  
  if (!result.allowed) {
    console.warn(`🚫 Rate limit exceeded for ${identifier} on ${functionName} (persistent: ${usePersistent})`);
    const waitTime = result.resetAt 
      ? Math.ceil((result.resetAt - Date.now()) / 1000)
      : 60;
    throw new Error(`Troppe richieste. Riprova tra ${waitTime} secondi.`);
  }
  
  return result;
}

// Pulizia periodica della cache (ogni 5 minuti)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitCache.entries()) {
    if (now > record.resetAt) {
      rateLimitCache.delete(key);
    }
  }
}, 300000);

// ============ INPUT VALIDATION ============

/**
 * Validatori comuni
 */
const validators = {
  // Stringa non vuota
  nonEmptyString: (value, fieldName) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} è richiesto e deve essere una stringa non vuota`);
    }
    return value.trim();
  },
  
  // Email valida
  email: (value, fieldName = 'Email') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value !== 'string' || !emailRegex.test(value.trim().toLowerCase())) {
      throw new Error(`${fieldName} non è un indirizzo email valido`);
    }
    return value.trim().toLowerCase();
  },
  
  // Tenant ID valido (alfanumerico con trattini)
  tenantId: (value, fieldName = 'tenantId') => {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9-_]{3,50}$/.test(value)) {
      throw new Error(`${fieldName} non è valido (3-50 caratteri alfanumerici, trattini, underscore)`);
    }
    return value;
  },
  
  // UID Firebase
  uid: (value, fieldName = 'userId') => {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9]{20,128}$/.test(value)) {
      throw new Error(`${fieldName} non è un UID valido`);
    }
    return value;
  },
  
  // Stringa con lunghezza max
  maxLength: (max) => (value, fieldName) => {
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} deve essere una stringa`);
    }
    if (value.length > max) {
      throw new Error(`${fieldName} supera la lunghezza massima di ${max} caratteri`);
    }
    return value;
  },
  
  // Numero positivo
  positiveNumber: (value, fieldName) => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      throw new Error(`${fieldName} deve essere un numero positivo`);
    }
    return num;
  },
  
  // Booleano
  boolean: (value, fieldName) => {
    if (typeof value !== 'boolean') {
      throw new Error(`${fieldName} deve essere un booleano`);
    }
    return value;
  },
  
  // Enum (valore in lista)
  oneOf: (allowedValues) => (value, fieldName) => {
    if (!allowedValues.includes(value)) {
      throw new Error(`${fieldName} deve essere uno di: ${allowedValues.join(', ')}`);
    }
    return value;
  },
  
  // Oggetto non nullo
  object: (value, fieldName) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`${fieldName} deve essere un oggetto`);
    }
    return value;
  },
  
  // Array
  array: (value, fieldName) => {
    if (!Array.isArray(value)) {
      throw new Error(`${fieldName} deve essere un array`);
    }
    return value;
  },
  
  // Opzionale (permette null/undefined)
  optional: (validator) => (value, fieldName) => {
    if (value === null || value === undefined) {
      return value;
    }
    return validator(value, fieldName);
  }
};

/**
 * Valida un oggetto contro uno schema
 * @param {Object} data - Dati da validare
 * @param {Object} schema - Schema { campo: validator }
 * @returns {Object} Dati validati e sanitizzati
 */
function validateInput(data, schema) {
  if (!data || typeof data !== 'object') {
    throw new Error('Input non valido');
  }
  
  const validated = {};
  
  for (const [field, validator] of Object.entries(schema)) {
    try {
      validated[field] = validator(data[field], field);
    } catch (error) {
      throw new Error(`Errore validazione: ${error.message}`);
    }
  }
  
  return validated;
}

// ============ AUTHENTICATION CHECKS ============

/**
 * Verifica che l'utente sia autenticato
 */
function requireAuth(request) {
  if (!request.auth?.uid) {
    throw new Error('Autenticazione richiesta');
  }
  return request.auth.uid;
}

/**
 * Verifica che l'utente sia admin di un tenant
 */
async function requireTenantAdmin(request, tenantId) {
  const uid = requireAuth(request);
  
  const adminDoc = await admin.firestore()
    .doc(`tenants/${tenantId}/roles/admins`)
    .get();
  
  if (!adminDoc.exists || !adminDoc.data()?.uids?.includes(uid)) {
    throw new Error('Permessi insufficienti: richiesto ruolo admin');
  }
  
  return uid;
}

/**
 * Verifica che l'utente sia Platform CEO
 */
async function requirePlatformCEO(request) {
  const uid = requireAuth(request);
  
  const ceoDoc = await admin.firestore()
    .doc('platform_admins/superadmins')
    .get();
  
  if (!ceoDoc.exists || !ceoDoc.data()?.uids?.includes(uid)) {
    throw new Error('Permessi insufficienti: richiesto ruolo Platform CEO');
  }
  
  return uid;
}

// ============ SANITIZATION ============

/**
 * Rimuove caratteri pericolosi da stringhe
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Sanitizza un oggetto ricorsivamente
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[sanitizeString(key)] = sanitizeObject(value);
  }
  return sanitized;
}

// ============ EXPORTS ============

module.exports = {
  // Rate limiting
  checkRateLimit,
  checkRateLimitPersistent,
  enforceRateLimit,
  RATE_LIMITS,
  PERSISTENT_RATE_LIMIT_FUNCTIONS,
  
  // Validation
  validators,
  validateInput,
  
  // Auth checks
  requireAuth,
  requireTenantAdmin,
  requirePlatformCEO,
  
  // Sanitization
  sanitizeString,
  sanitizeObject
};
