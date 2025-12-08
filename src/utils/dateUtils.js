// src/utils/dateUtils.js
// Utility centralizzate per formattazione date con supporto internazionale

/**
 * Ottieni il locale corrente del browser
 * Fallback a 'it-IT' se non disponibile
 */
const getLocale = () => {
  try {
    return navigator.language || navigator.languages?.[0] || 'it-IT';
  } catch {
    return 'it-IT';
  }
};

/**
 * Formatta una data in formato lungo (es: "8 dicembre 2025" / "December 8, 2025")
 * @param {Date|string|number} date - Data da formattare
 * @param {string} locale - Locale opzionale (default: browser locale)
 */
export const formatDateLong = (date, locale = getLocale()) => {
  if (!date) return 'N/D';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/D';
  
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatta una data in formato breve (es: "08/12/2025" o "12/08/2025" per US)
 */
export const formatDateShort = (date, locale = getLocale()) => {
  if (!date) return 'N/D';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/D';
  
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatta data e ora (es: "8 dic 2025, 14:30" / "Dec 8, 2025, 2:30 PM")
 */
export const formatDateTime = (date, locale = getLocale()) => {
  if (!date) return 'N/D';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/D';
  
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatta solo l'ora (es: "14:30" o "2:30 PM" per US)
 */
export const formatTime = (date, locale = getLocale()) => {
  if (!date) return 'N/D';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/D';
  
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatta in modo relativo usando Intl.RelativeTimeFormat (supporto internazionale)
 * Es: "2 hours ago", "yesterday", "3 days ago" / "2 ore fa", "ieri", "3 giorni fa"
 */
export const formatRelative = (date, locale = getLocale()) => {
  if (!date) return 'N/D';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/D';
  
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  // Usa Intl.RelativeTimeFormat per traduzioni automatiche
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffSec < 60) return rtf.format(-diffSec, 'second');
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    if (diffHour < 24) return rtf.format(-diffHour, 'hour');
    if (diffDay < 7) return rtf.format(-diffDay, 'day');
    if (diffWeek < 4) return rtf.format(-diffWeek, 'week');
    if (diffMonth < 12) return rtf.format(-diffMonth, 'month');
    if (diffYear >= 1) return rtf.format(-diffYear, 'year');
  } catch {
    // Fallback per browser senza supporto
    if (diffSec < 60) return 'now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffWeek < 4) return `${diffWeek}w ago`;
    if (diffMonth < 12) return `${diffMonth}mo ago`;
  }
  
  return formatDateShort(d, locale);
};

/**
 * Formatta per input date HTML (YYYY-MM-DD)
 */
export const formatForInput = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatta per input datetime-local HTML
 */
export const formatForDateTimeInput = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Calcola età da data di nascita
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const d = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Controlla se una data è oggi
 */
export const isToday = (date) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * Controlla se una data è nel passato
 */
export const isPast = (date) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  
  return d < new Date();
};

/**
 * Controlla se una data è nel futuro
 */
export const isFuture = (date) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  
  return d > new Date();
};

/**
 * Calcola giorni rimanenti fino a una data
 */
export const daysUntil = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calcola giorni trascorsi da una data
 */
export const daysSince = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Ottiene il nome del giorno della settimana
 */
export const getDayName = (date, short = false) => {
  if (!date) return 'N/D';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/D';
  
  return d.toLocaleDateString('it-IT', {
    weekday: short ? 'short' : 'long'
  });
};

/**
 * Ottiene il nome del mese
 */
export const getMonthName = (date, short = false) => {
  if (!date) return 'N/D';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'N/D';
  
  return d.toLocaleDateString('it-IT', {
    month: short ? 'short' : 'long'
  });
};

export default {
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatTime,
  formatRelative,
  formatForInput,
  formatForDateTimeInput,
  calculateAge,
  isToday,
  isPast,
  isFuture,
  daysUntil,
  daysSince,
  getDayName,
  getMonthName
};
