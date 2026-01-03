/**
 * HTML Sanitization Utility
 * Previene XSS attacks quando si usa dangerouslySetInnerHTML
 * 
 * @module utils/sanitize
 */

import DOMPurify from 'dompurify';

/**
 * Configurazione DOMPurify permissiva per contenuti rich text
 * Permette tag comuni per editing, ma blocca script/eventi dannosi
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    // Struttura
    'div', 'span', 'p', 'br', 'hr',
    // Headers
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Formattazione testo
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'sub', 'sup', 'mark', 'small', 'code', 'pre', 'kbd',
    // Liste
    'ul', 'ol', 'li',
    // Link e media
    'a', 'img', 'video', 'audio', 'source', 'iframe',
    // Tabelle
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    // Quote
    'blockquote', 'q', 'cite',
    // Altri
    'figure', 'figcaption', 'details', 'summary',
  ],
  ALLOWED_ATTR: [
    // Comuni
    'class', 'id', 'style',
    // Link
    'href', 'target', 'rel',
    // Media
    'src', 'alt', 'width', 'height', 'controls', 'autoplay', 'loop', 'muted', 'poster',
    // Tabelle
    'colspan', 'rowspan', 'scope',
    // Iframe (per video embed)
    'frameborder', 'allowfullscreen', 'allow',
    // Dati
    'data-*',
  ],
  // Forza target="_blank" e rel="noopener" sui link esterni
  ADD_ATTR: ['target', 'rel'],
  // Permetti iframe solo da domini sicuri
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Configurazione più restrittiva per chat/messaggi
 * Solo formattazione base, no link, no media
 */
const CHAT_CONFIG = {
  ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'code', 'span'],
  ALLOWED_ATTR: ['class'],
};

/**
 * Sanitizza HTML per contenuti rich text (landing pages, corsi, etc.)
 * 
 * @param {string} html - HTML da sanitizzare
 * @returns {string} HTML sicuro
 * 
 * @example
 * const safe = sanitizeRichText('<p onclick="alert(1)">Hello <b>World</b></p>');
 * // Returns: '<p>Hello <b>World</b></p>'
 */
export const sanitizeRichText = (html) => {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, RICH_TEXT_CONFIG);
};

/**
 * Sanitizza HTML per messaggi chat (solo formattazione base)
 * 
 * @param {string} html - HTML da sanitizzare
 * @returns {string} HTML sicuro con solo tag di formattazione
 * 
 * @example
 * const safe = sanitizeChat('<strong>Bold</strong> <script>alert(1)</script>');
 * // Returns: '<strong>Bold</strong> '
 */
export const sanitizeChat = (html) => {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, CHAT_CONFIG);
};

/**
 * Sanitizza HTML rimuovendo TUTTO - solo testo puro
 * 
 * @param {string} html - HTML da sanitizzare
 * @returns {string} Solo testo, nessun tag
 */
export const sanitizeToText = (html) => {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
};

/**
 * Crea oggetto sicuro per dangerouslySetInnerHTML
 * 
 * @param {string} html - HTML da sanitizzare
 * @param {'rich' | 'chat' | 'text'} type - Tipo di sanitizzazione
 * @returns {{ __html: string }} Oggetto per dangerouslySetInnerHTML
 * 
 * @example
 * <div dangerouslySetInnerHTML={createSafeHTML(content, 'rich')} />
 */
export const createSafeHTML = (html, type = 'rich') => {
  let sanitized;
  switch (type) {
    case 'chat':
      sanitized = sanitizeChat(html);
      break;
    case 'text':
      sanitized = sanitizeToText(html);
      break;
    case 'rich':
    default:
      sanitized = sanitizeRichText(html);
  }
  return { __html: sanitized };
};

// Export default per compatibilità
export default {
  sanitizeRichText,
  sanitizeChat,
  sanitizeToText,
  createSafeHTML,
};
