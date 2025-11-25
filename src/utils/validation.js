/**
 * Form Validation Utilities
 * Validazione centralizzata con messaggi user-friendly
 */

/**
 * Validazione email
 */
export function validateEmail(email) {
  if (!email) {
    return { valid: false, message: 'Email è obbligatoria' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Email non valida' };
  }
  
  return { valid: true };
}

/**
 * Validazione password
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = options;

  if (!password) {
    return { valid: false, message: 'Password è obbligatoria' };
  }

  if (password.length < minLength) {
    return { valid: false, message: `La password deve contenere almeno ${minLength} caratteri` };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'La password deve contenere almeno una lettera maiuscola' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'La password deve contenere almeno una lettera minuscola' };
  }

  if (requireNumber && !/\d/.test(password)) {
    return { valid: false, message: 'La password deve contenere almeno un numero' };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'La password deve contenere almeno un carattere speciale' };
  }

  return { valid: true };
}

/**
 * Validazione telefono italiano
 */
export function validatePhone(phone) {
  if (!phone) {
    return { valid: false, message: 'Telefono è obbligatorio' };
  }

  // Rimuovi spazi e caratteri speciali
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Verifica formato italiano (+39 o 0039 o diretto)
  const phoneRegex = /^(\+39|0039)?[0-9]{9,10}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, message: 'Numero di telefono non valido' };
  }

  return { valid: true };
}

/**
 * Validazione nome/cognome
 */
export function validateName(name, fieldName = 'Nome') {
  if (!name) {
    return { valid: false, message: `${fieldName} è obbligatorio` };
  }

  if (name.length < 2) {
    return { valid: false, message: `${fieldName} deve contenere almeno 2 caratteri` };
  }

  if (name.length > 50) {
    return { valid: false, message: `${fieldName} troppo lungo (max 50 caratteri)` };
  }

  return { valid: true };
}

/**
 * Validazione numero (peso, altezza, etc)
 */
export function validateNumber(value, options = {}) {
  const {
    fieldName = 'Valore',
    min,
    max,
    required = true,
  } = options;

  if (required && (value === null || value === undefined || value === '')) {
    return { valid: false, message: `${fieldName} è obbligatorio` };
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} deve essere un numero valido` };
  }

  if (min !== undefined && num < min) {
    return { valid: false, message: `${fieldName} deve essere almeno ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, message: `${fieldName} non può superare ${max}` };
  }

  return { valid: true };
}

/**
 * Validazione data
 */
export function validateDate(date, options = {}) {
  const {
    fieldName = 'Data',
    minDate,
    maxDate,
    required = true,
  } = options;

  if (required && !date) {
    return { valid: false, message: `${fieldName} è obbligatoria` };
  }

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, message: `${fieldName} non valida` };
  }

  if (minDate) {
    const minDateObj = minDate instanceof Date ? minDate : new Date(minDate);
    if (dateObj < minDateObj) {
      return { valid: false, message: `${fieldName} non può essere precedente a ${minDateObj.toLocaleDateString()}` };
    }
  }

  if (maxDate) {
    const maxDateObj = maxDate instanceof Date ? maxDate : new Date(maxDate);
    if (dateObj > maxDateObj) {
      return { valid: false, message: `${fieldName} non può essere successiva a ${maxDateObj.toLocaleDateString()}` };
    }
  }

  return { valid: true };
}

/**
 * Validazione URL
 */
export function validateURL(url, fieldName = 'URL') {
  if (!url) {
    return { valid: false, message: `${fieldName} è obbligatorio` };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, message: `${fieldName} non valido` };
  }
}

/**
 * Validazione file upload
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    fieldName = 'File',
  } = options;

  if (!file) {
    return { valid: false, message: `${fieldName} è obbligatorio` };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, message: `${fieldName} troppo grande (max ${maxSizeMB}MB)` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, message: `Formato ${fieldName} non supportato` };
  }

  return { valid: true };
}

/**
 * Validatore generico per form
 */
export class FormValidator {
  constructor() {
    this.errors = {};
  }

  /**
   * Valida un campo
   */
  validate(fieldName, value, validatorFn) {
    const result = validatorFn(value);
    if (!result.valid) {
      this.errors[fieldName] = result.message;
    }
    return result.valid;
  }

  /**
   * Verifica se ci sono errori
   */
  isValid() {
    return Object.keys(this.errors).length === 0;
  }

  /**
   * Ottiene errori
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Reset errori
   */
  reset() {
    this.errors = {};
  }
}

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateNumber,
  validateDate,
  validateURL,
  validateFile,
  FormValidator,
};
